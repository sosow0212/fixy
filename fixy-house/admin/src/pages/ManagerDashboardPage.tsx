import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  Bot,
  Mail,
  Users as UsersIcon,
  ShieldAlert,
} from "lucide-react";
import { teamsApi } from "../api/teams";
import { agentsApi } from "../api/agents";
import { invitationsApi } from "../api/invitations";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { formatRelative } from "../lib/format";
import { useAuthStore } from "../stores/authStore";

export function ManagerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const firstTeamId = teamsQuery.data?.[0]?.id ?? "";

  const agentsQuery = useQuery({
    queryKey: ["agents", firstTeamId],
    queryFn: () => agentsApi.listByTeam(firstTeamId),
    enabled: Boolean(firstTeamId),
  });
  const invitationsQuery = useQuery({
    queryKey: ["invitations", firstTeamId],
    queryFn: () => invitationsApi.listByTeam(firstTeamId),
    enabled: Boolean(firstTeamId),
  });

  if (teamsQuery.isPending) return <Loading label="콘솔을 여는 중" />;
  if (teamsQuery.error)
    return (
      <ErrorState
        message={(teamsQuery.error as Error).message ?? "팀 정보를 불러올 수 없어요"}
      />
    );

  const teams = teamsQuery.data ?? [];
  const agents = agentsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const pendingInvitations = invitations.filter((i) => i.status === "PENDING");
  const activeAgents = agents.filter((a) => a.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.displayName ?? "매니저"}의 운영 콘솔`}
        description="팀 / 멤버 / 픽시 에이전트 / 초대 — 매니저 권한으로 관리하는 모든 것."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          to="/teams"
          label="팀"
          value={teams.length}
          icon={<UsersIcon className="h-4 w-4" />}
        />
        <SummaryCard
          to="/agents"
          label="활성 에이전트"
          value={activeAgents.length}
          icon={<Bot className="h-4 w-4" />}
        />
        <SummaryCard
          to="/invitations"
          label="대기 중 초대"
          value={pendingInvitations.length}
          icon={<Mail className="h-4 w-4" />}
        />
        <SummaryCard
          to="/members"
          label="전체 멤버"
          value="—"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">팀</h2>
          <Link
            to="/teams"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            팀 관리 →
          </Link>
        </header>
        {teams.length > 0 ? (
          <ul className="divide-y divide-slate-800">
            {teams.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <Link
                  to={`/teams/${t.id}`}
                  className="min-w-0 truncate text-sm font-medium text-slate-100 hover:text-emerald-300 hover:underline"
                >
                  {t.name}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge
                    tone={
                      t.myRole === "OWNER"
                        ? "fuchsia"
                        : t.myRole === "MANAGER"
                          ? "emerald"
                          : "slate"
                    }
                  >
                    {t.myRole}
                  </StatusBadge>
                  <span className="text-[10px] text-slate-500">
                    {formatRelative(t.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            <ShieldAlert className="h-4 w-4" />
            아직 관리할 팀이 없어요. 새 팀을 만들어 보세요.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            활성 에이전트 (최근 팀)
          </h2>
          <Link
            to="/agents"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            에이전트 관리 →
          </Link>
        </header>
        {activeAgents.length > 0 ? (
          <ul className="divide-y divide-slate-800">
            {activeAgents.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    <span className="truncate text-sm font-medium text-slate-100">
                      {a.name}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                    {a.id}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.lastConnectedAt ? (
                    <StatusBadge tone="emerald">
                      마지막 {formatRelative(a.lastConnectedAt)}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="amber">아직 미접속</StatusBadge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-xs text-slate-500">
            활성화된 픽시 에이전트가 없어요.
          </p>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  to: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

function SummaryCard({ to, label, value, icon }: SummaryCardProps) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="rounded-md bg-emerald-500/15 p-1.5 text-emerald-300">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-100">
        {value}
      </div>
    </Link>
  );
}
