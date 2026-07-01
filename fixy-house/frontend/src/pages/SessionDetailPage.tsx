import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Cog,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Tag as TagIcon,
  Wrench,
  XCircle,
} from "lucide-react";
import { sessionsApi } from "../api/sessions";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime, formatRelative } from "../lib/format";
import type {
  MessageRole,
  SessionEpisode,
  SessionMessage,
  SessionToolCall,
  ToolCallStatus,
} from "../types/api";

const MESSAGE_LABEL: Record<MessageRole, string> = {
  USER: "사용자",
  ASSISTANT: "어시스턴트",
  SYSTEM: "시스템",
  TOOL: "툴",
};

const MESSAGE_TONE: Record<MessageRole, "sky" | "violet" | "slate" | "amber"> = {
  USER: "sky",
  ASSISTANT: "violet",
  SYSTEM: "slate",
  TOOL: "amber",
};

const TOOL_STATUS_TONE: Record<ToolCallStatus, "slate" | "emerald" | "rose"> = {
  PENDING: "slate",
  SUCCESS: "emerald",
  FAILED: "rose",
};

const TOOL_STATUS_ICON: Record<ToolCallStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Loader2,
  SUCCESS: CheckCircle2,
  FAILED: XCircle,
};

const SIGNAL_TONE: Record<string, "slate" | "emerald" | "amber" | "rose" | "violet"> = {
  COMPLAINT: "rose",
  CORRECTION: "amber",
  INSIGHT: "violet",
  SUCCESS: "emerald",
  NOTE: "slate",
};

export function SessionDetailPage() {
  const { sessionId = "" } = useParams();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState("");
  const [summaryInput, setSummaryInput] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.get(sessionId),
    enabled: Boolean(sessionId),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { summary?: string | null; tags?: string[] | null }) =>
      sessionsApi.update(sessionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      setTagInput("");
    },
    onError: (err) => setActionError((err as Error).message ?? "수정 실패"),
  });

  if (detailQuery.isPending) return <Loading label="세션 상세를 불러오는 중" />;
  if (detailQuery.error)
    return (
      <ErrorState
        message={
          (detailQuery.error as Error).message ?? "세션 상세를 불러올 수 없어요"
        }
      />
    );

  const detail = detailQuery.data;
  if (!detail) return <ErrorState message="세션을 찾을 수 없어요" />;

  const session = detail.session;
  const summaryCurrent = summaryInput ?? session.summary ?? "";

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...session.tags, trimmed]));
    setActionError(null);
    updateMutation.mutate({ tags: next });
  }

  function removeTag(tag: string) {
    const next = session.tags.filter((t) => t !== tag);
    setActionError(null);
    updateMutation.mutate({ tags: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/teams/${session.teamId}/sessions`}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 세션 목록
        </Link>
      </div>

      <PageHeader
        title={session.projectName ?? "(프로젝트 없음)"}
        description={`에이전트 세션 ${session.sessionIdFromAgent}`}
        actions={
          <StatusBadge
            tone={
              session.status === "ACTIVE"
                ? "emerald"
                : session.status === "IDLE"
                  ? "amber"
                  : session.status === "FAILED"
                    ? "rose"
                    : "slate"
            }
          >
            {session.status}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="메시지" value={session.messageCount} />
        <Stat label="툴콜" value={session.toolCallCount} />
        <Stat label="에피소드" value={session.episodeCount} />
        <Stat
          label="최근 활동"
          value={formatRelative(session.lastActivityAt)}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-4 flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">태그 / 요약</h2>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {session.tags.length === 0 ? (
            <span className="text-xs text-slate-400">아직 태그 없음</span>
          ) : (
            session.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="group inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-rose-100 hover:text-rose-700"
              >
                #{tag}
                <span className="opacity-0 group-hover:opacity-100">×</span>
              </button>
            ))
          )}
          <div className="flex items-center gap-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="태그 추가"
              className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim() || updateMutation.isPending}
              className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-500">요약</label>
          <textarea
            value={summaryCurrent}
            onChange={(e) => setSummaryInput(e.target.value)}
            rows={3}
            placeholder="이 세션은 무엇을 했나요?"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                updateMutation.mutate({ summary: summaryCurrent || null });
              }}
              disabled={updateMutation.isPending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {updateMutation.isPending ? "저장 중…" : "요약 저장"}
            </button>
          </div>
        </div>

        {actionError ? <ErrorState message={actionError} className="mt-3" /> : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">메시지 타임라인</h2>
          <span className="text-xs text-slate-400">
            {detail.messages.length}개 · {formatDateTime(session.startedAt)} 시작
          </span>
        </header>

        {detail.messages.length > 0 ? (
          <ol className="space-y-4">
            {detail.messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
          </ol>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            메시지가 아직 없어요.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">툴 콜</h2>
          <span className="text-xs text-slate-400">{detail.toolCalls.length}개</span>
        </header>
        {detail.toolCalls.length > 0 ? (
          <div className="space-y-2">
            {detail.toolCalls.map((tc) => (
              <ToolCallRow key={tc.id} call={tc} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">
            툴 호출이 없어요.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-4 flex items-center gap-2">
          <Cog className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">L1 에피소드</h2>
          <span className="text-xs text-slate-400">{detail.episodes.length}개</span>
        </header>
        {detail.episodes.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {detail.episodes.map((ep) => (
              <EpisodeRow key={ep.id} episode={ep} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">
            에피소드가 없어요.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <header className="mb-2 flex items-center gap-2">
          <MessagesSquare className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">메타</h2>
        </header>
        <dl className="grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">에이전트 ID</dt>
            <dd className="font-mono">{session.agentId}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">팀 ID</dt>
            <dd className="font-mono">{session.teamId}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">에이전트 실행 userId</dt>
            <dd className="font-mono">{session.userIdOnAgent ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">시작 / 종료</dt>
            <dd>
              {formatDateTime(session.startedAt)} → {formatDateTime(session.endedAt)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function MessageRow({ message }: { message: SessionMessage }) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`mt-1 h-2 w-2 rounded-full ${
            message.role === "USER"
              ? "bg-sky-500"
              : message.role === "ASSISTANT"
                ? "bg-violet-500"
                : message.role === "TOOL"
                  ? "bg-amber-500"
                  : "bg-slate-400"
          }`}
        />
        <span className="mt-1 flex-1 w-px bg-slate-200" />
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-2">
          <StatusBadge tone={MESSAGE_TONE[message.role]}>
            {MESSAGE_LABEL[message.role]}
          </StatusBadge>
          <span className="text-xs text-slate-400">
            #{message.sequence} · {formatRelative(message.createdAt)}
          </span>
        </div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm text-slate-800">
          {message.content}
        </pre>
      </div>
    </li>
  );
}

function ToolCallRow({ call }: { call: SessionToolCall }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_STATUS_ICON[call.status];
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={`h-4 w-4 ${
              call.status === "SUCCESS"
                ? "text-emerald-600"
                : call.status === "FAILED"
                  ? "text-rose-600"
                  : "animate-spin text-slate-500"
            }`}
          />
          <span className="truncate text-sm font-medium text-slate-800">
            {call.toolName}
          </span>
        </div>
        <StatusBadge tone={TOOL_STATUS_TONE[call.status]}>
          {call.status}
        </StatusBadge>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-slate-100 p-3">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">인자</div>
            <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700">
              {call.argsJson}
            </pre>
          </div>
          {call.resultJson ? (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">결과</div>
              <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                {call.resultJson}
              </pre>
            </div>
          ) : null}
          {call.errorMessage ? (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {call.errorMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EpisodeRow({ episode }: { episode: SessionEpisode }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="mt-0.5">
        <StatusBadge tone={SIGNAL_TONE[episode.signal] ?? "slate"}>
          {episode.signal}
        </StatusBadge>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800">{episode.summary}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatDateTime(episode.ts)}
        </p>
        {episode.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {episode.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {episode.promotedTo ? (
        <StatusBadge tone="fuchsia">→ {episode.promotedTo}</StatusBadge>
      ) : null}
    </li>
  );
}
