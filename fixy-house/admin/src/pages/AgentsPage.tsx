import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bot, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { agentsApi } from "../api/agents";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime, formatRelative, truncate } from "../lib/format";
import { extractErrorMessage } from "../api/client";
import { AgentKeyDialog } from "../components/AgentKeyDialog";
import type { Agent, AgentWithKey } from "../types/api";

export function AgentsPage() {
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const teamId = activeTeamId ?? teamsQuery.data?.[0]?.id ?? "";
  const agentsQuery = useQuery({
    queryKey: ["agents", teamId],
    queryFn: () => agentsApi.listByTeam(teamId),
    enabled: Boolean(teamId),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [removingAgent, setRemovingAgent] = useState<Agent | null>(null);
  const [newlyIssued, setNewlyIssued] = useState<AgentWithKey | null>(null);
  const [rotated, setRotated] = useState<AgentWithKey | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) => agentsApi.create(teamId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents", teamId] });
      setCreateOpen(false);
      setAgentName("");
      setNewlyIssued(data);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "에이전트 생성 실패")),
  });

  const rotateMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.rotateKey(agentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents", teamId] });
      setRotatingId(null);
      setRotated(data);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "키 회전 실패")),
  });

  const removeMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.remove(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", teamId] });
      setRemovingAgent(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "에이전트 삭제 실패")),
  });

  if (teamsQuery.isPending) return <Loading label="팀을 불러오는 중" />;
  if (!teamId)
    return (
      <EmptyState
        title="관리할 팀이 없어요"
        description="먼저 팀을 만들어 주세요."
        action={
          <Link
            to="/teams"
            className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950"
          >
            팀 만들러 가기
          </Link>
        }
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="픽시 에이전트"
        description="fixy-agent 가 fixy-house 로 데이터를 보낼 때 쓰는 인증 키. 키는 생성/회전 시 1회만 노출돼요."
        actions={
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> 새 에이전트
          </button>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          발급된 키는 안전한 비밀 관리 도구에 저장하세요. 분실 시 <strong>키 회전</strong>으로
          재발급할 수 있어요 (회전 시 기존 키는 즉시 무효).
        </p>
      </div>

      {pageError ? <ErrorState message={pageError} /> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
        <span className="text-xs font-medium text-slate-500">팀</span>
        {teamsQuery.data?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTeamId(t.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              t.id === teamId
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {agentsQuery.isPending ? (
        <Loading label="에이전트를 불러오는 중" />
      ) : agentsQuery.error ? (
        <ErrorState message="에이전트를 불러올 수 없어요" />
      ) : agentsQuery.data && agentsQuery.data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  이름
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  상태
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  키 (끝 4자리)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  최근 접속
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  생성
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {agentsQuery.data.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-emerald-400" />
                      <span className="font-medium text-slate-100">{a.name}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                      {truncate(a.id, 28)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={a.status === "ACTIVE" ? "emerald" : "slate"}>
                      {a.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {a.agentKeyLastFour ? `…${a.agentKeyLastFour}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {a.lastConnectedAt ? formatRelative(a.lastConnectedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(a.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPageError(null);
                          setRotatingId(a.id);
                        }}
                        disabled={rotateMutation.isPending}
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                      >
                        키 회전
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemovingAgent(a)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-slate-900 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
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
          title="이 팀에 등록된 에이전트가 없어요"
          description="새 에이전트를 만들어 픽시 에이전트를 붙이세요."
          icon={<Bot className="h-5 w-5" />}
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              첫 에이전트 등록
            </button>
          }
        />
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(agentName.trim());
            }}
            className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-base font-semibold text-slate-100">
              새 픽시 에이전트
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              키는 생성 직후 한 번만 평문으로 보여줘요.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300">
                이름
              </label>
              <input
                type="text"
                autoFocus
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="ci-runner-1"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!agentName.trim() || createMutation.isPending}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {createMutation.isPending ? "발급 중…" : "발급"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <AgentKeyDialog
        open={Boolean(newlyIssued)}
        agentName={newlyIssued?.name ?? ""}
        agentKey={newlyIssued?.agentKey ?? ""}
        lastFour={newlyIssued?.agentKeyLastFour ?? null}
        onClose={() => setNewlyIssued(null)}
      />

      <AgentKeyDialog
        open={Boolean(rotated)}
        agentName={`${rotated?.name ?? ""} (키 회전)`}
        agentKey={rotated?.agentKey ?? ""}
        lastFour={rotated?.agentKeyLastFour ?? null}
        onClose={() => setRotated(null)}
      />

      <ConfirmDialog
        open={Boolean(rotatingId)}
        title="에이전트 키를 회전할까요?"
        description="기존 키는 즉시 무효화돼요. 회전 후 새 키가 한 번만 노출됩니다."
        confirmLabel="회전"
        loading={rotateMutation.isPending}
        onCancel={() => setRotatingId(null)}
        onConfirm={() => rotatingId && rotateMutation.mutate(rotatingId)}
      />

      <ConfirmDialog
        open={Boolean(removingAgent)}
        title="에이전트를 삭제할까요?"
        description={
          <>
            <strong>{removingAgent?.name}</strong> 에이전트가 더 이상 백엔드에 접속할
            수 없게 돼요.
          </>
        }
        confirmLabel="삭제"
        destructive
        loading={removeMutation.isPending}
        onCancel={() => setRemovingAgent(null)}
        onConfirm={() => removingAgent && removeMutation.mutate(removingAgent.id)}
      />
    </div>
  );
}
