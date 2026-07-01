import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, UserCog } from "lucide-react";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatDateTime } from "../lib/format";
import { extractErrorMessage } from "../api/client";
import type { Team, TeamMember, TeamRole } from "../types/api";

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: "MEMBER", label: "MEMBER" },
  { value: "MANAGER", label: "MANAGER" },
  { value: "OWNER", label: "OWNER" },
];

export function MembersPage() {
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const memberQueries = useQueries({
    queries: (teamsQuery.data ?? []).map((t) => ({
      queryKey: ["team-members", t.id],
      queryFn: () => teamsApi.members(t.id),
    })),
  });
  const [removing, setRemoving] = useState<{ team: Team; member: TeamMember } | null>(
    null
  );
  const [transferring, setTransferring] = useState<{
    team: Team;
    member: TeamMember;
  } | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const changeRoleMutation = useMutation({
    mutationFn: ({
      teamId,
      targetUserId,
      role,
    }: {
      teamId: string;
      targetUserId: string;
      role: TeamRole;
    }) => teamsApi.changeMemberRole(teamId, targetUserId, role),
    onSuccess: () => {
      (teamsQuery.data ?? []).forEach((t) => {
        queryClient.invalidateQueries({ queryKey: ["team-members", t.id] });
        queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      });
    },
    onError: (err) => setPageError(extractErrorMessage(err, "권한 변경 실패")),
  });

  const removeMutation = useMutation({
    mutationFn: ({
      teamId,
      targetUserId,
    }: {
      teamId: string;
      targetUserId: string;
    }) => teamsApi.removeMember(teamId, targetUserId),
    onSuccess: () => {
      (teamsQuery.data ?? []).forEach((t) => {
        queryClient.invalidateQueries({ queryKey: ["team-members", t.id] });
      });
      setRemoving(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "멤버 제거 실패")),
  });

  if (teamsQuery.isPending) return <Loading label="팀을 불러오는 중" />;

  const rows: Array<{ team: Team; member: TeamMember }> = [];
  (teamsQuery.data ?? []).forEach((team, idx) => {
    const mq = memberQueries[idx];
    if (mq.data) {
      mq.data.forEach((member) => rows.push({ team, member }));
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="멤버"
        description="내가 관리하는 모든 팀의 멤버. 권한을 변경하거나 팀에서 제거할 수 있어요."
      />

      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          OWNER 변경은 팀 단위로 한 명만 가능해요. 권한 이전 후엔 이전 OWNER 의 권한이
          자동으로 MANAGER 로 내려갑니다.
        </p>
      </div>

      {pageError ? <ErrorState message={pageError} /> : null}

      {teamsQuery.data && teamsQuery.data.length > 0 ? (
        rows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    팀
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    사용자
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    권한
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    가입 시각
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {rows.map(({ team, member }) => (
                  <tr key={`${team.id}-${member.id}`}>
                    <td className="px-4 py-3 text-slate-200">{team.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {member.userId}
                    </td>
                    <td className="px-4 py-3">
                      {member.role === "OWNER" ? (
                        <StatusBadge tone="fuchsia">OWNER</StatusBadge>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            changeRoleMutation.mutate({
                              teamId: team.id,
                              targetUserId: member.userId,
                              role: e.target.value as TeamRole,
                            })
                          }
                          disabled={changeRoleMutation.isPending}
                          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDateTime(member.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.role === "OWNER" ? (
                        <button
                          type="button"
                          onClick={() => setTransferring({ team, member })}
                          className="rounded-md border border-amber-500/30 bg-slate-900 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/15"
                        >
                          소유권 이전
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRemoving({ team, member })}
                          className="rounded-md border border-rose-500/30 bg-slate-900 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
                        >
                          제거
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="멤버 정보가 없어요"
            description="각 팀의 멤버를 불러오는 중이거나 권한이 부족해요."
            icon={<UserCog className="h-5 w-5" />}
          />
        )
      ) : (
        <EmptyState
          title="관리할 팀이 없어요"
          description="먼저 팀을 만들어 주세요."
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="멤버를 제거할까요?"
        description={
          <span>
            <span className="font-mono">{removing?.member.userId}</span> 을(를){" "}
            <strong>{removing?.team.name}</strong> 에서 제거합니다.
          </span>
        }
        confirmLabel="제거"
        destructive
        loading={removeMutation.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          removeMutation.mutate({
            teamId: removing.team.id,
            targetUserId: removing.member.userId,
          })
        }
      />

      <ConfirmDialog
        open={Boolean(transferring)}
        title="소유권을 이전할까요?"
        description={
          <span>
            <strong>{transferring?.member.userId}</strong> 님이{" "}
            <strong>{transferring?.team.name}</strong> 의 새 OWNER 가 되고, 당신은
            MANAGER 로 내려가요.
          </span>
        }
        confirmLabel="이전"
        destructive
        loading={changeRoleMutation.isPending}
        onCancel={() => setTransferring(null)}
        onConfirm={() => {
          if (transferring) {
            changeRoleMutation.mutate(
              {
                teamId: transferring.team.id,
                targetUserId: transferring.member.userId,
                role: "OWNER",
              },
              {
                onSuccess: () => setTransferring(null),
              }
            );
          }
        }}
      />
    </div>
  );
}
