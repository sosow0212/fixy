import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, PencilLine, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { documentsApi, type UpdateDocPageBody } from "../api/documents";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../lib/format";
import { extractErrorMessage } from "../api/client";

export function DocumentEditorPage() {
  const { teamId = "", pageId = "" } = useParams();
  const queryClient = useQueryClient();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftVisibility, setDraftVisibility] = useState<"TEAM" | "PRIVATE">("TEAM");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const pageQuery = useQuery({
    queryKey: ["page", teamId, pageId],
    queryFn: () => documentsApi.getPage(teamId, pageId),
    enabled: Boolean(teamId && pageId),
  });

  useEffect(() => {
    if (!pageQuery.data) return;
    setDraftTitle(pageQuery.data.title);
    setDraftContent(pageQuery.data.content);
    setDraftTags(pageQuery.data.tags.join(", "));
    setDraftVisibility(pageQuery.data.visibility);
  }, [pageQuery.data]);

  const dirty = useMemo(() => {
    if (!pageQuery.data) return false;
    const original = pageQuery.data;
    const titleChanged = draftTitle !== original.title;
    const contentChanged = draftContent !== original.content;
    const tagsChanged =
      draftTags.trim() !==
      original.tags.map((t) => t.trim()).filter(Boolean).join(", ");
    const visibilityChanged = draftVisibility !== original.visibility;
    return titleChanged || contentChanged || tagsChanged || visibilityChanged;
  }, [pageQuery.data, draftTitle, draftContent, draftTags, draftVisibility]);

  const updateMutation = useMutation({
    mutationFn: (body: UpdateDocPageBody) =>
      documentsApi.updatePage(teamId, pageId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(["page", teamId, pageId], data);
      queryClient.invalidateQueries({ queryKey: ["pages", teamId, data.spaceId] });
      setSavedAt(new Date().toISOString());
    },
    onError: (err) => setSaveError(extractErrorMessage(err, "저장 실패")),
  });

  const removeMutation = useMutation({
    mutationFn: () => documentsApi.removePage(teamId, pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setRemoving(false);
      window.history.back();
    },
    onError: (err) => setSaveError(extractErrorMessage(err, "삭제 실패")),
  });

  if (pageQuery.isPending) return <Loading label="페이지를 불러오는 중" />;
  if (pageQuery.error)
    return (
      <ErrorState
        message={
          (pageQuery.error as Error).message ?? "페이지를 불러올 수 없어요"
        }
      />
    );

  const page = pageQuery.data;
  if (!page) return <ErrorState message="페이지를 찾을 수 없어요" />;

  function save() {
    setSaveError(null);
    const tags = draftTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateMutation.mutate({
      title: draftTitle,
      content: draftContent,
      tags,
      visibility: draftVisibility,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/documents/${teamId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 문서 목록
        </Link>
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="text-xs text-amber-600">저장되지 않은 변경</span>
          ) : savedAt ? (
            <span className="text-xs text-slate-500">
              {formatDateTime(savedAt)} 저장됨
            </span>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || updateMutation.isPending}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateMutation.isPending ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={() => setRemoving(true)}
            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> 삭제
          </button>
        </div>
      </div>

      <PageHeader
        title={page.title}
        description={`마지막 수정 ${formatDateTime(page.updatedAt ?? page.createdAt)}`}
        actions={
          <StatusBadge tone={page.visibility === "TEAM" ? "sky" : "slate"}>
            {page.visibility}
          </StatusBadge>
        }
      />

      {saveError ? <ErrorState message={saveError} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setTab("edit")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                  tab === "edit"
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100"
                }`}
              >
                <PencilLine className="h-3.5 w-3.5" /> 편집
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                  tab === "preview"
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100"
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> 미리보기
              </button>
            </div>
          </header>
          <div className="p-4">
            {tab === "edit" ? (
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={28}
                spellCheck={false}
                className="block w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-3 font-mono text-sm leading-relaxed text-slate-800 shadow-inner focus:border-slate-900 focus:outline-none"
                placeholder="# 제목

마크다운으로 자유롭게 작성하세요."
              />
            ) : (
              <article className="prose prose-slate max-w-none">
                <ReactMarkdown>{draftContent || "_아직 내용이 없어요._"}</ReactMarkdown>
              </article>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              메타
            </h3>
            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">제목</dt>
                <dd>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="mt-0.5 block w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">가시성</dt>
                <dd>
                  <select
                    value={draftVisibility}
                    onChange={(e) =>
                      setDraftVisibility(e.target.value as "TEAM" | "PRIVATE")
                    }
                    className="mt-0.5 block w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="TEAM">팀</option>
                    <option value="PRIVATE">비공개</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">태그 (쉼표 구분)</dt>
                <dd>
                  <input
                    type="text"
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    className="mt-0.5 block w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                    placeholder="runbook, oncall"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">작성자</dt>
                <dd className="font-mono text-[11px]">{page.authorUserId}</dd>
              </div>
              <div>
                <dt className="text-slate-400">최근 수정자</dt>
                <dd className="font-mono text-[11px]">{page.lastEditorUserId}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <p>저장하지 않은 변경은 페이지를 떠날 때 사라져요.</p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={removing}
        title="페이지를 삭제할까요?"
        description="자식 페이지가 있다면 함께 삭제됩니다."
        confirmLabel="삭제"
        destructive
        loading={removeMutation.isPending}
        onCancel={() => setRemoving(false)}
        onConfirm={() => removeMutation.mutate()}
      />
    </div>
  );
}
