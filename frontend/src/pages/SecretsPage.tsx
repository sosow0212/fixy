import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { secretsApi, type CreateSecretBody } from "../api/secrets";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { formatRelative } from "../lib/format";
import { extractErrorMessage } from "../api/client";
import type { SecretReveal, SecretSummary } from "../types/api";

const createSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, "대문자/숫자/언더스코어만"),
  value: z.string().min(1, "값을 입력하세요").max(4096),
  scope: z.enum(["PERSONAL", "TEAM"]),
  teamId: z.string().optional().or(z.literal("")),
  description: z.string().max(200).optional(),
});

type CreateInput = z.infer<typeof createSchema>;

export function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery({
    queryKey: ["secrets"],
    queryFn: secretsApi.list,
  });
  const teamsQuery = useQuery({
    queryKey: ["my-teams"],
    queryFn: teamsApi.list,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [reveal, setReveal] = useState<SecretReveal | null>(null);
  const [pendingReveal, setPendingReveal] = useState<SecretSummary | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<SecretSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      key: "",
      value: "",
      scope: "PERSONAL",
      teamId: "",
      description: "",
    },
  });

  const scope = watch("scope");

  const createMutation = useMutation({
    mutationFn: (body: CreateSecretBody) => secretsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] });
      setCreateOpen(false);
      reset();
    },
    onError: (err) => setPageError(extractErrorMessage(err, "시크릿 생성 실패")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => secretsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] });
      setRemoving(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "삭제 실패")),
  });

  const revealMutation = useMutation({
    mutationFn: (id: string) => secretsApi.reveal(id),
    onSuccess: (data) => {
      setReveal(data);
      setPendingReveal(null);
    },
    onError: (err) => {
      setRevealError(extractErrorMessage(err, "노출 실패"));
      setPendingReveal(null);
    },
  });

  useEffect(() => {
    if (!reveal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReveal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reveal]);

  function closeReveal() {
    setReveal(null);
    setCopied(false);
  }

  async function copyPlaintext() {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="개인 시크릿"
        description="env 류 키-값. AES-256-GCM 으로 저장되며, 평문은 노출 시점에만 잠깐 보입니다."
        actions={
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> 새 시크릿
          </button>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          시크릿 평문은 백엔드에서 마스터키로 암호화되어 저장됩니다.{" "}
          <strong>노출(reveal)</strong> 행위는 감사 로그에 기록되니 공유가 필요한 값은
          1Password / Vault 같은 도구를 함께 사용하세요.
        </p>
      </div>

      {pageError ? <ErrorState message={pageError} /> : null}

      {secretsQuery.isPending ? (
        <Loading label="시크릿을 불러오는 중" />
      ) : secretsQuery.error ? (
        <ErrorState message="시크릿을 불러올 수 없어요" />
      ) : secretsQuery.data && secretsQuery.data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  키
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  스코프
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  설명
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  최근 사용
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {secretsQuery.data.map((sec) => (
                <tr key={sec.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-800">
                    {sec.key}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={sec.scope === "TEAM" ? "sky" : "slate"}>
                      {sec.scope}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {sec.description ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {sec.lastUsedAt ? formatRelative(sec.lastUsedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingReveal(sec)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> 노출
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoving(sec)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="아직 시크릿이 없어요"
          description="API 키, DB 비밀번호 등을 안전하게 보관하세요."
          icon={<KeyRound className="h-5 w-5" />}
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              첫 시크릿 만들기
            </button>
          }
        />
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSubmit((values) => {
              const body: CreateSecretBody = {
                key: values.key,
                value: values.value,
                scope: values.scope,
                teamId: values.scope === "TEAM" ? values.teamId || null : null,
                description: values.description || null,
              };
              createMutation.mutate(body);
            })}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">새 시크릿</h2>
            <p className="mt-1 text-xs text-slate-500">
              저장 즉시 AES-256-GCM 으로 암호화돼요.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  키
                </label>
                <input
                  type="text"
                  autoFocus
                  {...register("key")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="OPENAI_API_KEY"
                />
                {errors.key ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.key.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  값 (평문)
                </label>
                <textarea
                  rows={3}
                  {...register("value")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="sk-..."
                />
                {errors.value ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.value.message}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    스코프
                  </label>
                  <select
                    {...register("scope")}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="PERSONAL">개인</option>
                    <option value="TEAM">팀</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    팀 (TEAM 일 때)
                  </label>
                  <select
                    disabled={scope !== "TEAM"}
                    {...register("teamId")}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
                  >
                    <option value="">선택…</option>
                    {teamsQuery.data?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  {...register("description")}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                  placeholder="무엇에 쓰는 키인가요?"
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
                {createMutation.isPending ? "저장 중…" : "저장"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingReveal)}
        title="시크릿 평문을 노출할까요?"
        description={
          <>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              {pendingReveal?.key}
            </code>{" "}
            의 평문을 표시합니다. 이 행위는 <strong>감사 로그</strong>에 기록돼요.
          </>
        }
        confirmLabel="노출"
        loading={revealMutation.isPending}
        onCancel={() => {
          setPendingReveal(null);
          setRevealError(null);
        }}
        onConfirm={() =>
          pendingReveal && revealMutation.mutate(pendingReveal.id)
        }
      />

      {reveal ? (
        <RevealDialog
          reveal={reveal}
          copied={copied}
          onCopy={copyPlaintext}
          onClose={closeReveal}
        />
      ) : null}

      {revealError ? (
        <ErrorState
          message={revealError}
          action={
            <button
              type="button"
              onClick={() => setRevealError(null)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              닫기
            </button>
          }
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        title="시크릿을 삭제할까요?"
        description={
          <span>
            <code className="font-mono text-xs">{removing?.key}</code> 을(를) 영구적으로
            삭제합니다.
          </span>
        }
        confirmLabel="삭제"
        destructive
        loading={removeMutation.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && removeMutation.mutate(removing.id)}
      />
    </div>
  );
}

interface RevealDialogProps {
  reveal: SecretReveal;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

function RevealDialog({ reveal, copied, onCopy, onClose }: RevealDialogProps) {
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    setMasked(false);
  }, [reveal]);

  const display = masked
    ? "•".repeat(Math.min(reveal.plaintext.length, 32))
    : reveal.plaintext;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Eye className="h-4 w-4 text-amber-600" /> 평문 노출
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                {reveal.key}
              </code>{" "}
              · {reveal.scope}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          이 평문은 <strong>메모리에만</strong> 존재합니다. 창을 닫거나 페이지를 떠나면
          사라져요. 안전한 곳에 붙여넣은 뒤 <strong>저장했습니다</strong> 를 눌러
          닫아주세요.
        </div>

        <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-50">
          {display}
        </pre>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMasked((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {masked ? (
              <>
                <Eye className="h-3.5 w-3.5" /> 보이기
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" /> 가리기
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 rounded-md border border-slate-900 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "복사됨!" : "클립보드에 복사"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              저장했습니다
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
