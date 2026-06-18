import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { teamsApi, type CreateTeamBody } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatDate } from "../lib/format";
import { extractErrorMessage } from "../api/client";

const createSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력하세요").max(50),
  description: z.string().max(200).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{2,40}$/, "소문자/숫자/하이픈 2~40자")
    .optional()
    .or(z.literal("")),
});

type CreateInput = z.infer<typeof createSchema>;

export function TeamsManagePage() {
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "", slug: "" },
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateTeamBody) => teamsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      setCreateOpen(false);
      reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "팀 생성 실패")),
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: string) => teamsApi.remove(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      setDeletingId(null);
    },
    onError: (err) => setError(extractErrorMessage(err, "팀 삭제 실패")),
  });

  if (teamsQuery.isPending) return <Loading label="팀 목록을 불러오는 중" />;
  if (teamsQuery.error)
    return (
      <ErrorState
        message={(teamsQuery.error as Error).message ?? "팀 목록을 불러올 수 없어요"}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="팀 관리"
        description="내가 관리하는 팀. 새 팀을 만들거나 기존 팀의 멤버·에이전트를 관리하세요."
        actions={
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> 새 팀
          </button>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      {teamsQuery.data && teamsQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teamsQuery.data.map((team) => (
            <div
              key={team.id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/teams/${team.id}`}
                    className="block truncate text-base font-semibold text-slate-100 hover:text-emerald-300 hover:underline"
                  >
                    {team.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {team.slug} · {formatDate(team.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    team.myRole === "OWNER"
                      ? "fuchsia"
                      : team.myRole === "MANAGER"
                        ? "emerald"
                        : "slate"
                  }
                >
                  {team.myRole}
                </StatusBadge>
              </div>
              {team.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {team.description}
                </p>
              ) : null}
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <Link
                  to={`/teams/${team.id}`}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  관리 →
                </Link>
                {team.myRole === "OWNER" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDeletingId(team.id);
                    }}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="관리할 팀이 없어요"
          description="팀을 만들면 멤버 초대와 픽시 에이전트 등록을 시작할 수 있어요."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" /> 첫 팀 만들기
            </button>
          }
        />
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({
                name: values.name,
                description: values.description || null,
                slug: values.slug || null,
              })
            )}
            className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-base font-semibold text-slate-100">새 팀</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  이름
                </label>
                <input
                  type="text"
                  autoFocus
                  {...register("name")}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Fixy Studio"
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-rose-400">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  슬러그 (선택)
                </label>
                <input
                  type="text"
                  {...register("slug")}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="fixy-studio"
                />
                {errors.slug ? (
                  <p className="mt-1 text-xs text-rose-400">
                    {errors.slug.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  설명 (선택)
                </label>
                <textarea
                  rows={2}
                  {...register("description")}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  reset();
                }}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {createMutation.isPending ? "생성 중…" : "생성"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="팀을 삭제할까요?"
        description="되돌릴 수 없어요."
        confirmLabel="삭제"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
      />
    </div>
  );
}
