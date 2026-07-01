import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, FilePlus2, FolderPlus, FolderTree } from "lucide-react";
import { documentsApi, type CreateSpaceBody } from "../api/documents";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatDateTime } from "../lib/format";
import { extractErrorMessage } from "../api/client";
import type { DocPageSummary, Space } from "../types/api";

const createSpaceSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(50),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{2,40}$/, "소문자/숫자/하이픈 2~40자")
    .optional()
    .or(z.literal("")),
  description: z.string().max(200).optional(),
  icon: z.string().max(10).optional(),
});

type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

const createPageSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(200),
  parentId: z.string().optional().or(z.literal("")),
});

type CreatePageInput = z.infer<typeof createPageSchema>;

export function DocumentsListPage() {
  const { teamId: paramTeamId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const teamId = paramTeamId ?? teamsQuery.data?.[0]?.id ?? "";

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [createPageOpen, setCreatePageOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [spaceError, setSpaceError] = useState<string | null>(null);
  const [removingSpace, setRemovingSpace] = useState<Space | null>(null);

  const spacesQuery = useQuery({
    queryKey: ["spaces", teamId],
    queryFn: () => documentsApi.listSpaces(teamId),
    enabled: Boolean(teamId),
  });

  const effectiveSpaceId = activeSpaceId ?? spacesQuery.data?.[0]?.id ?? "";

  const pagesQuery = useQuery({
    queryKey: ["pages", teamId, effectiveSpaceId, { parentId: undefined }],
    queryFn: () => documentsApi.listPages(teamId, effectiveSpaceId),
    enabled: Boolean(teamId && effectiveSpaceId),
  });

  const rootPages = useMemo(() => pagesQuery.data ?? [], [pagesQuery.data]);

  const removeSpaceMutation = useMutation({
    mutationFn: (spaceId: string) => documentsApi.removeSpace(teamId, spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces", teamId] });
      setRemovingSpace(null);
    },
    onError: (err) => setSpaceError(extractErrorMessage(err, "스페이스 삭제 실패")),
  });

  const {
    register: registerSpace,
    handleSubmit: handleSpaceSubmit,
    reset: resetSpace,
    formState: { errors: spaceErrors },
  } = useForm<CreateSpaceInput>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: { name: "", slug: "", description: "", icon: "" },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (body: CreateSpaceBody) => documentsApi.createSpace(teamId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces", teamId] });
      setCreateSpaceOpen(false);
      resetSpace();
    },
    onError: (err) => setSpaceError(extractErrorMessage(err, "스페이스 생성 실패")),
  });

  const {
    register: registerPage,
    handleSubmit: handlePageSubmit,
    reset: resetPage,
    formState: { errors: pageErrors },
  } = useForm<CreatePageInput>({
    resolver: zodResolver(createPageSchema),
    defaultValues: { title: "", parentId: "" },
  });

  const createPageMutation = useMutation({
    mutationFn: (input: CreatePageInput) =>
      documentsApi.createPage(teamId, effectiveSpaceId, {
        title: input.title,
        parentId: input.parentId || null,
      }),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["pages", teamId, effectiveSpaceId] });
      setCreatePageOpen(false);
      resetPage();
      navigate(`/documents/page/${teamId}/${page.id}`);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "페이지 생성 실패")),
  });

  if (teamsQuery.isPending) return <Loading label="팀 정보를 불러오는 중" />;
  if (!teamId)
    return (
      <EmptyState
        title="팀이 필요해요"
        description="팀 문서는 팀 단위로 관리돼요."
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
        title="팀 문서"
        description="스페이스별로 페이지를 트리에 정리해 두는 곳이에요."
        actions={
          <button
            type="button"
            onClick={() => {
              setSpaceError(null);
              setCreateSpaceOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FolderPlus className="h-4 w-4" /> 새 스페이스
          </button>
        }
      />

      {spaceError ? <ErrorState message={spaceError} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          {spacesQuery.isPending ? (
            <Loading label="스페이스를 불러오는 중" />
          ) : spacesQuery.error ? (
            <ErrorState message="스페이스를 불러올 수 없어요" />
          ) : spacesQuery.data && spacesQuery.data.length > 0 ? (
            <ul className="space-y-1">
              {spacesQuery.data.map((sp) => {
                const active = effectiveSpaceId === sp.id;
                return (
                  <li key={sp.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSpaceId(sp.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                        active
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 text-base">{sp.icon ?? "📁"}</span>
                        <span className="truncate font-medium">{sp.name}</span>
                      </span>
                      {active ? null : (
                        <span className="ml-2 text-[10px] text-slate-400">
                          {sp.slug}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="스페이스가 없어요"
              description="새 스페이스를 만들어 주세요."
              icon={<FolderTree className="h-5 w-5" />}
              className="border-0 p-2 py-6"
            />
          )}
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {spacesQuery.data?.find((s) => s.id === effectiveSpaceId)?.name ??
                "페이지"}
            </h2>
            {effectiveSpaceId ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPageError(null);
                    setCreatePageOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  <FilePlus2 className="h-3.5 w-3.5" /> 새 페이지
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = spacesQuery.data?.find(
                      (s) => s.id === effectiveSpaceId
                    );
                    if (target) setRemovingSpace(target);
                  }}
                  className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  스페이스 삭제
                </button>
              </div>
            ) : null}
          </header>

          {pageError ? <ErrorState message={pageError} /> : null}

          {!effectiveSpaceId ? (
            <EmptyState
              title="왼쪽에서 스페이스를 선택해 주세요"
              description="스페이스가 없으면 새로 만들어 주세요."
            />
          ) : pagesQuery.isPending ? (
            <Loading label="페이지를 불러오는 중" />
          ) : pagesQuery.error ? (
            <ErrorState message="페이지를 불러올 수 없어요" />
          ) : rootPages.length > 0 ? (
            <PageTree pages={rootPages} teamId={teamId} />
          ) : (
            <EmptyState
              title="페이지가 없어요"
              description="이 스페이스에 첫 페이지를 만들어 보세요."
            />
          )}
        </section>
      </div>

      {createSpaceOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSpaceSubmit((values) =>
              createSpaceMutation.mutate({
                name: values.name,
                slug: values.slug || null,
                description: values.description || null,
                icon: values.icon || null,
              })
            )}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">새 스페이스</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  이름
                </label>
                <input
                  type="text"
                  autoFocus
                  {...registerSpace("name")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="엔진 룸"
                />
                {spaceErrors.name ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {spaceErrors.name.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  슬러그 (선택)
                </label>
                <input
                  type="text"
                  {...registerSpace("slug")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="engine-room"
                />
                {spaceErrors.slug ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {spaceErrors.slug.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  아이콘 (이모지 1글자 또는 짧은 문자열)
                </label>
                <input
                  type="text"
                  {...registerSpace("icon")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="📚"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  설명
                </label>
                <textarea
                  rows={2}
                  {...registerSpace("description")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="이 스페이스는 무엇에 관한 건가요?"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateSpaceOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createSpaceMutation.isPending}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createSpaceMutation.isPending ? "생성 중…" : "생성"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {createPageOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handlePageSubmit((values) =>
              createPageMutation.mutate(values)
            )}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">새 페이지</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  제목
                </label>
                <input
                  type="text"
                  autoFocus
                  {...registerPage("title")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="주간 회의록"
                />
                {pageErrors.title ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {pageErrors.title.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  상위 페이지 ID (선택, 서브 페이지로 만들 때)
                </label>
                <input
                  type="text"
                  {...registerPage("parentId")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="비워두면 최상위 페이지"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreatePageOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createPageMutation.isPending}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createPageMutation.isPending ? "생성 중…" : "생성"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removingSpace)}
        title="스페이스를 삭제할까요?"
        description={
          <>
            <strong>{removingSpace?.name}</strong> 스페이스와 그 안의 모든 페이지가
            삭제됩니다.
          </>
        }
        confirmLabel="삭제"
        destructive
        loading={removeSpaceMutation.isPending}
        onCancel={() => setRemovingSpace(null)}
        onConfirm={() => removingSpace && removeSpaceMutation.mutate(removingSpace.id)}
      />
    </div>
  );
}

function PageTree({ pages, teamId }: { pages: DocPageSummary[]; teamId: string }) {
  const byParent = new Map<string | null, DocPageSummary[]>();
  pages.forEach((p) => {
    const arr = byParent.get(p.parentId ?? null) ?? [];
    arr.push(p);
    byParent.set(p.parentId ?? null, arr);
  });
  const roots = byParent.get(null) ?? [];

  function renderNode(node: DocPageSummary): React.ReactElement {
    const children = byParent.get(node.id) ?? [];
    return (
      <li key={node.id}>
        <Link
          to={`/documents/page/${teamId}/${node.id}`}
          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{node.title}</span>
          </span>
          <span className="shrink-0 text-[10px] text-slate-400">
            {formatDateTime(node.updatedAt ?? node.createdAt)}
          </span>
        </Link>
        {children.length > 0 ? (
          <ul className="ml-5 mt-1 space-y-1 border-l border-slate-100 pl-3">
            {children.map(renderNode)}
          </ul>
        ) : null}
      </li>
    );
  }

  return <ul className="space-y-1">{roots.map(renderNode)}</ul>;
}
