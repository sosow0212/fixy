import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { worklogsApi, type CreateWorkLogBody } from "../api/worklogs";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate } from "../lib/format";
import { extractErrorMessage } from "../api/client";
import type { WorkLog, WorkLogPriority, WorkLogStatus } from "../types/api";

const COLUMNS: { value: WorkLogStatus; label: string; tone: "slate" | "sky" | "emerald" | "rose" }[] = [
  { value: "TODO", label: "할 일", tone: "slate" },
  { value: "IN_PROGRESS", label: "진행 중", tone: "sky" },
  { value: "DONE", label: "완료", tone: "emerald" },
  { value: "BLOCKED", label: "막힘", tone: "rose" },
];

const createSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional().or(z.literal("")),
  tags: z.string().optional(),
});

type CreateInput = z.infer<typeof createSchema>;

export function WorkLogsPage() {
  const { teamId: paramTeamId } = useParams();
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const teamId = paramTeamId ?? teamsQuery.data?.[0]?.id ?? "";
  const [createOpen, setCreateOpen] = useState(false);
  const [removing, setRemoving] = useState<WorkLog | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const worklogsQuery = useQuery({
    queryKey: ["worklogs", teamId],
    queryFn: () => worklogsApi.list(teamId, { size: 200 }),
    enabled: Boolean(teamId),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateWorkLogBody) => worklogsApi.create(teamId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs", teamId] });
      setCreateOpen(false);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "작업 로그 생성 실패")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: WorkLogStatus } }) =>
      worklogsApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worklogs", teamId] }),
    onError: (err) => setPageError(extractErrorMessage(err, "상태 변경 실패")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => worklogsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs", teamId] });
      setRemoving(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "삭제 실패")),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      tags: "",
    },
  });

  useEffect(() => {
    if (!createOpen) reset();
  }, [createOpen, reset]);

  const grouped = useMemo(() => {
    const result: Record<WorkLogStatus, WorkLog[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      BLOCKED: [],
    };
    (worklogsQuery.data?.content ?? []).forEach((w) => {
      result[w.status].push(w);
    });
    return result;
  }, [worklogsQuery.data]);

  if (teamsQuery.isPending) return <Loading label="팀 정보를 불러오는 중" />;
  if (!teamId)
    return (
      <EmptyState
        title="팀이 필요해요"
        description="작업 로그는 팀 단위로 관리됩니다. 먼저 팀을 만들어 주세요."
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="작업 로그"
        description="픽시 세션/사용자 메모를 한 칸반에 모아 두는 곳이에요."
        actions={
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> 새 작업
          </button>
        }
      />

      {pageError ? <ErrorState message={pageError} /> : null}

      {worklogsQuery.isPending ? (
        <Loading label="작업 로그를 불러오는 중" />
      ) : worklogsQuery.error ? (
        <ErrorState
          message={
            (worklogsQuery.error as Error).message ??
            "작업 로그를 불러올 수 없어요"
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.value}
              label={col.label}
              tone={col.tone}
              items={grouped[col.value]}
              onMove={(item, nextStatus) =>
                updateMutation.mutate({ id: item.id, body: { status: nextStatus } })
              }
              onRemove={(item) => setRemoving(item)}
            />
          ))}
        </div>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({
                title: values.title,
                description: values.description || null,
                status: values.status,
                priority: values.priority,
                dueDate: values.dueDate || null,
                tags: values.tags
                  ? values.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : [],
              })
            )}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">
              새 작업 로그
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  제목
                </label>
                <input
                  type="text"
                  autoFocus
                  {...register("title")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="무엇을 하나요?"
                />
                {errors.title ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.title.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  설명 (선택)
                </label>
                <textarea
                  rows={3}
                  {...register("description")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="자세한 내용"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    상태
                  </label>
                  <select
                    {...register("status")}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    우선순위
                  </label>
                  <select
                    {...register("priority")}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="LOW">낮음</option>
                    <option value="MEDIUM">보통</option>
                    <option value="HIGH">높음</option>
                    <option value="URGENT">긴급</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  마감일 (선택)
                </label>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  {...register("tags")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="bug, sprint-12"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createMutation.isPending ? "생성 중…" : "추가"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        title="작업 로그를 삭제할까요?"
        description={removing?.title}
        confirmLabel="삭제"
        destructive
        loading={removeMutation.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && removeMutation.mutate(removing.id)}
      />
    </div>
  );
}

interface KanbanColumnProps {
  label: string;
  tone: "slate" | "sky" | "emerald" | "rose";
  items: WorkLog[];
  onMove: (item: WorkLog, next: WorkLogStatus) => void;
  onRemove: (item: WorkLog) => void;
}

function KanbanColumn({ label, tone, items, onMove, onRemove }: KanbanColumnProps) {
  const ring: Record<typeof tone, string> = {
    slate: "ring-slate-200",
    sky: "ring-sky-200",
    emerald: "ring-emerald-200",
    rose: "ring-rose-200",
  };
  return (
    <div className={`rounded-lg bg-white p-3 ring-1 ring-inset ${ring[tone]}`}>
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge tone={tone}>{label}</StatusBadge>
          <span className="text-xs text-slate-500">{items.length}</span>
        </div>
      </header>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
            비어 있음
          </div>
        ) : (
          items.map((item) => (
            <WorkLogCard
              key={item.id}
              item={item}
              onMove={onMove}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface WorkLogCardProps {
  item: WorkLog;
  onMove: (item: WorkLog, next: WorkLogStatus) => void;
  onRemove: (item: WorkLog) => void;
}

function WorkLogCard({ item, onMove, onRemove }: WorkLogCardProps) {
  const priorityTone: Record<WorkLogPriority, "slate" | "sky" | "amber" | "rose"> = {
    LOW: "slate",
    MEDIUM: "sky",
    HIGH: "amber",
    URGENT: "rose",
  };
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{item.title}</p>
        <StatusBadge tone={priorityTone[item.priority]}>{item.priority}</StatusBadge>
      </div>
      {item.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {item.description}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
        {item.dueDate ? <span>마감 {formatDate(item.dueDate)}</span> : null}
        {item.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600"
          >
            #{t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <select
          value={item.status}
          onChange={(e) => onMove(item, e.target.value as WorkLogStatus)}
          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] shadow-sm focus:border-slate-900 focus:outline-none"
        >
          {COLUMNS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="text-[10px] font-medium text-rose-600 hover:text-rose-800"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
