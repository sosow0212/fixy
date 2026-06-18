import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  Database,
  FileText,
  KeyRound,
  ScrollText,
} from "lucide-react";
import { authApi } from "../api/auth";
import { teamsApi } from "../api/teams";
import { sessionsApi } from "../api/sessions";
import { worklogsApi } from "../api/worklogs";
import { documentsApi } from "../api/documents";
import { secretsApi } from "../api/secrets";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { formatDateTime, formatRelative } from "../lib/format";
import { StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
  });
  const teamsQuery = useQuery({
    queryKey: ["my-teams"],
    queryFn: teamsApi.list,
  });
  const firstTeamId = teamsQuery.data?.[0]?.id;
  const sessionsQuery = useQuery({
    queryKey: ["sessions", firstTeamId, { limit: 5 }],
    queryFn: () =>
      firstTeamId
        ? sessionsApi.listByTeam(firstTeamId, { limit: 5 })
        : Promise.resolve([]),
    enabled: Boolean(firstTeamId),
  });
  const worklogsQuery = useQuery({
    queryKey: ["worklogs", firstTeamId, { size: 5 }],
    queryFn: () =>
      firstTeamId
        ? worklogsApi.list(firstTeamId, { size: 5 })
        : Promise.resolve({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 }),
    enabled: Boolean(firstTeamId),
  });
  const spacesQuery = useQuery({
    queryKey: ["spaces", firstTeamId],
    queryFn: () =>
      firstTeamId ? documentsApi.listSpaces(firstTeamId) : Promise.resolve([]),
    enabled: Boolean(firstTeamId),
  });
  const secretsQuery = useQuery({
    queryKey: ["secrets-count"],
    queryFn: secretsApi.list,
  });

  if (meQuery.isPending || teamsQuery.isPending) {
    return <Loading label="대시보드를 불러오는 중" />;
  }
  if (meQuery.error || teamsQuery.error) {
    return (
      <ErrorState
        message={
          (meQuery.error as Error | undefined)?.message ??
          (teamsQuery.error as Error | undefined)?.message ??
          "데이터를 불러오지 못했습니다"
        }
      />
    );
  }

  const greetingName = meQuery.data?.displayName ?? "사용자";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greetingName}님, 환영합니다`}
        description="픽시 에이전트가 모은 데이터와 팀 운영 현황을 한눈에 확인하세요."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          to="/teams"
          label="팀"
          value={teamsQuery.data?.length ?? 0}
          icon={<Database className="h-4 w-4" />}
          tone="sky"
        />
        <SummaryCard
          to={firstTeamId ? `/teams/${firstTeamId}/sessions` : "/teams"}
          label="최근 세션"
          value={sessionsQuery.data?.length ?? 0}
          icon={<Activity className="h-4 w-4" />}
          tone="violet"
        />
        <SummaryCard
          to={firstTeamId ? `/worklogs/${firstTeamId}` : "/worklogs"}
          label="작업 로그"
          value={worklogsQuery.data?.totalElements ?? 0}
          icon={<ScrollText className="h-4 w-4" />}
          tone="amber"
        />
        <SummaryCard
          to={firstTeamId ? `/documents/${firstTeamId}` : "/documents"}
          label="문서 스페이스"
          value={spacesQuery.data?.length ?? 0}
          icon={<FileText className="h-4 w-4" />}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              최근 세션
            </h2>
            {firstTeamId ? (
              <Link
                to={`/teams/${firstTeamId}/sessions`}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                전체 보기 →
              </Link>
            ) : null}
          </header>
          {sessionsQuery.data && sessionsQuery.data.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {sessionsQuery.data.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-3"
                >
                  <Link
                    to={`/sessions/${s.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-slate-900 hover:underline"
                  >
                    {s.projectName ?? s.sessionIdFromAgent}
                  </Link>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <StatusBadge tone={sessionTone(s.status)}>
                      {labelOf(s.status)}
                    </StatusBadge>
                    <span className="text-xs text-slate-500">
                      {formatRelative(s.lastActivityAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">
              아직 수집된 세션이 없어요. 픽시 에이전트를 팀에 붙여보세요.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">내 시크릿</h2>
            <Link
              to="/secrets"
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              전체 보기 →
            </Link>
          </header>
          {secretsQuery.data && secretsQuery.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {secretsQuery.data.slice(0, 5).map((sec) => (
                <li
                  key={sec.id}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono text-xs text-slate-700">
                    {sec.key}
                  </span>
                  <StatusBadge tone={sec.scope === "TEAM" ? "sky" : "slate"}>
                    {sec.scope}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-center text-xs text-slate-500">
              <KeyRound className="h-5 w-5 text-slate-300" />
              <p>저장된 시크릿이 없어요.</p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            최근 작업 로그
          </h2>
          {firstTeamId ? (
            <Link
              to={`/worklogs/${firstTeamId}`}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              전체 보기 →
            </Link>
          ) : null}
        </header>
        {worklogsQuery.data && worklogsQuery.data.content.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {worklogsQuery.data.content.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3">
                <span className="truncate text-sm font-medium text-slate-800">
                  {w.title}
                </span>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <StatusBadge tone={worklogTone(w.status)}>
                    {labelOf(w.status)}
                  </StatusBadge>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(w.updatedAt ?? w.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            아직 작업 로그가 없어요. {firstTeamId ? "칸반에서 첫 항목을 추가해 보세요." : ""}
          </p>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  to: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "sky" | "violet" | "amber" | "emerald";
}

function SummaryCard({ to, label, value, icon, tone }: SummaryCardProps) {
  const toneClass = {
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  }[tone];
  return (
    <Link
      to={to}
      className="group rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className={`rounded-md p-1.5 ${toneClass}`}>{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">
        {value.toLocaleString("ko-KR")}
      </div>
    </Link>
  );
}

function sessionTone(s: string) {
  if (s === "ACTIVE") return "emerald" as const;
  if (s === "IDLE") return "amber" as const;
  if (s === "FAILED") return "rose" as const;
  return "slate" as const;
}

function worklogTone(s: string) {
  if (s === "DONE") return "emerald" as const;
  if (s === "IN_PROGRESS") return "sky" as const;
  if (s === "BLOCKED") return "rose" as const;
  return "slate" as const;
}

function labelOf(s: string) {
  switch (s) {
    case "ACTIVE":
      return "진행 중";
    case "IDLE":
      return "대기";
    case "COMPLETED":
      return "완료";
    case "FAILED":
      return "실패";
    case "TODO":
      return "할 일";
    case "IN_PROGRESS":
      return "진행 중";
    case "DONE":
      return "완료";
    case "BLOCKED":
      return "막힘";
    default:
      return s;
  }
}
