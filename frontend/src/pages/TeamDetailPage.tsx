import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ScrollText,
  FileText,
  Users as UsersIcon,
  KeyRound,
} from "lucide-react";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../lib/format";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { TeamRole } from "../types/api";
import { extractErrorMessage } from "../api/client";

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: "OWNER", label: "OWNER" },
  { value: "MANAGER", label: "MANAGER" },
  { value: "MEMBER", label: "MEMBER" },
];

export function TeamDetailPage() {
  const { teamId = "" } = useParams();
  const queryClient = useQueryClient();
  const teamQuery = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => teamsApi.get(teamId),
    enabled: Boolean(teamId),
  });
  const membersQuery = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => teamsApi.members(teamId),
    enabled: Boolean(teamId),
  });
  const meRole = teamQuery.data?.myRole;
  const canManage = meRole === "OWNER" || meRole === "MANAGER";
  const [removing, setRemoving] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: TeamRole }) =>
      teamsApi.changeMemberRole(teamId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
    onError: (err) => setRoleError(extractErrorMessage(err, "권한 변경 실패")),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (targetUserId: string) => teamsApi.removeMember(teamId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      setRemoving(null);
    },
    onError: (err) => setRoleError(extractErrorMessage(err, "멤버 제거 실패")),
  });

  if (teamQuery.isPending || membersQuery.isPending) {
    return <Loading label="팀 정보를 불러오는 중" />;
  }
  if (teamQuery.error)
    return (
      <ErrorState
        message={(teamQuery.error as Error).message ?? "팀 정보를 불러올 수 없습니다"}
      />
    );

  const team = teamQuery.data;
  if (!team) return <ErrorState message="팀 정보를 찾을 수 없어요" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={team.name}
        description={team.description ?? "이 팀의 작업 공간이에요."}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              tone={
                meRole === "OWNER"
                  ? "fuchsia"
                  : meRole === "MANAGER"
                    ? "violet"
                    : "slate"
              }
            >
              내 권한: {meRole}
            </StatusBadge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <NavTile
          to={`/teams/${teamId}/sessions`}
          label="세션"
          icon={<Activity className="h-4 w-4" />}
          tone="violet"
        />
        <NavTile
          to={`/worklogs/${teamId}`}
          label="작업 로그"
          icon={<ScrollText className="h-4 w-4" />}
          tone="amber"
        />
        <NavTile
          to={`/documents/${teamId}`}
          label="문서"
          icon={<FileText className="h-4 w-4" />}
          tone="emerald"
        />
        <NavTile
          to="/secrets"
          label="시크릿"
          icon={<KeyRound className="h-4 w-4" />}
          tone="sky"
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            멤버 {membersQuery.data?.length ?? 0}
          </h2>
        </header>
        {roleError ? <ErrorState message={roleError} /> : null}
        {membersQuery.data && membersQuery.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {membersQuery.data.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-slate-400" />
                    <span className="truncate font-mono text-xs text-slate-600">
                      {m.userId}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(m.joinedAt)} 가입
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && m.role !== "OWNER" ? (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        changeRoleMutation.mutate({
                          userId: m.userId,
                          role: e.target.value as TeamRole,
                        })
                      }
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-slate-900 focus:outline-none"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge
                      tone={
                        m.role === "OWNER"
                          ? "fuchsia"
                          : m.role === "MANAGER"
                            ? "violet"
                            : "slate"
                      }
                    >
                      {m.role}
                    </StatusBadge>
                  )}
                  {canManage && m.role !== "OWNER" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRoleError(null);
                        setRemoving(m.userId);
                      }}
                      className="text-xs font-medium text-rose-600 hover:text-rose-800"
                    >
                      제거
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            멤버 정보를 불러올 수 없어요.
          </p>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(removing)}
        title="팀 멤버를 제거할까요?"
        description="제거된 사용자는 팀과 연결된 데이터를 더 이상 조회할 수 없어요."
        confirmLabel="제거"
        destructive
        loading={removeMemberMutation.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeMemberMutation.mutate(removing);
        }}
      />
    </div>
  );
}

interface NavTileProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  tone: "violet" | "amber" | "emerald" | "sky";
}

function NavTile({ to, label, icon, tone }: NavTileProps) {
  const toneClass = {
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <span className={`rounded-md p-2 ${toneClass}`}>{icon}</span>
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </Link>
  );
}
