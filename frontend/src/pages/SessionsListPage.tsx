import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { sessionsApi } from "../api/sessions";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime, formatRelative, truncate } from "../lib/format";
import type { Session, SessionStatus } from "../types/api";

const STATUS_OPTIONS: { value: SessionStatus; label: string; tone: "emerald" | "amber" | "slate" | "rose" }[] = [
  { value: "ACTIVE", label: "진행 중", tone: "emerald" },
  { value: "IDLE", label: "대기", tone: "amber" },
  { value: "COMPLETED", label: "완료", tone: "slate" },
  { value: "FAILED", label: "실패", tone: "rose" },
];

export function SessionsListPage() {
  const { teamId: paramTeamId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterError, setFilterError] = useState<string | null>(null);

  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const teamId = paramTeamId ?? teamsQuery.data?.[0]?.id ?? "";
  const activeStatuses = useMemo<SessionStatus[]>(() => {
    const raw = searchParams.get("statuses");
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is SessionStatus =>
        ["ACTIVE", "IDLE", "COMPLETED", "FAILED"].includes(s)
      );
  }, [searchParams]);
  const projectName = searchParams.get("projectName") ?? "";

  const sessionsQuery = useQuery({
    queryKey: ["sessions", teamId, { statuses: activeStatuses, projectName }],
    queryFn: () =>
      sessionsApi.listByTeam(teamId, {
        statuses: activeStatuses.length > 0 ? activeStatuses : undefined,
        projectName: projectName || undefined,
        limit: 100,
      }),
    enabled: Boolean(teamId),
  });

  function toggleStatus(status: SessionStatus) {
    setFilterError(null);
    const next = new Set(activeStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    const params = new URLSearchParams(searchParams);
    if (next.size === 0) params.delete("statuses");
    else params.set("statuses", Array.from(next).join(","));
    setSearchParams(params, { replace: true });
  }

  if (teamsQuery.isPending) return <Loading label="팀 정보를 불러오는 중" />;
  if (!teamId)
    return (
      <EmptyState
        title="아직 팀이 없어요"
        description="세션은 팀 단위로 모입니다. 먼저 팀을 만들어 주세요."
        action={
          <Link
            to="/teams"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            팀 만들러 가기
          </Link>
        }
      />
    );

  const columns: Column<Session>[] = [
    {
      key: "project",
      header: "프로젝트",
      render: (s) => (
        <Link
          to={`/sessions/${s.id}`}
          className="font-medium text-slate-800 hover:text-slate-900 hover:underline"
        >
          {s.projectName ?? "(이름 없음)"}
        </Link>
      ),
    },
    {
      key: "agent",
      header: "에이전트 ID",
      className: "hidden md:table-cell",
      render: (s) => (
        <span className="font-mono text-xs text-slate-500">
          {truncate(s.agentId, 18)}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (s) => (
        <StatusBadge tone={STATUS_OPTIONS.find((o) => o.value === s.status)?.tone ?? "slate"}>
          {STATUS_OPTIONS.find((o) => o.value === s.status)?.label ?? s.status}
        </StatusBadge>
      ),
    },
    {
      key: "counters",
      header: "메시지/툴콜/에피소드",
      className: "hidden lg:table-cell",
      render: (s) => (
        <span className="text-xs text-slate-600">
          {s.messageCount} · {s.toolCallCount} · {s.episodeCount}
        </span>
      ),
    },
    {
      key: "activity",
      header: "최근 활동",
      render: (s) => (
        <span className="text-xs text-slate-500" title={formatDateTime(s.lastActivityAt)}>
          {formatRelative(s.lastActivityAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="에이전트 세션"
        description="픽시 에이전트가 보고한 세션 히스토리. 클릭하면 메시지/툴콜/에피소드를 볼 수 있어요."
        actions={
          <Link
            to={`/teams/${teamId}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            팀으로 돌아가기
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Filter className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-medium text-slate-500">상태</span>
        {STATUS_OPTIONS.map((opt) => {
          const active = activeStatuses.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleStatus(opt.value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        <input
          type="text"
          value={projectName}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("projectName", e.target.value);
            else params.delete("projectName");
            setSearchParams(params, { replace: true });
          }}
          placeholder="프로젝트 필터"
          className="ml-2 w-48 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-slate-900 focus:outline-none"
        />
      </div>

      {filterError ? <ErrorState message={filterError} /> : null}
      {sessionsQuery.isPending ? (
        <Loading label="세션 목록을 불러오는 중" />
      ) : sessionsQuery.error ? (
        <ErrorState
          message={
            (sessionsQuery.error as Error).message ?? "세션 목록을 불러올 수 없어요"
          }
        />
      ) : sessionsQuery.data && sessionsQuery.data.length > 0 ? (
        <DataTable columns={columns} rows={sessionsQuery.data} getKey={(s) => s.id} />
      ) : (
        <EmptyState
          title="조건에 맞는 세션이 없어요"
          description="필터를 조정하거나, 픽시 에이전트가 새 세션을 보낼 때까지 잠시 기다려 주세요."
        />
      )}
    </div>
  );
}
