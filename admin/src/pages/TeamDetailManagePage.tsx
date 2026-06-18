import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Mail, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { teamsApi } from "../api/teams";
import { agentsApi } from "../api/agents";
import { invitationsApi, type InviteMemberBody } from "../api/invitations";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime, formatRelative, truncate } from "../lib/format";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AgentKeyDialog } from "../components/AgentKeyDialog";
import { extractErrorMessage } from "../api/client";
import type { Agent, AgentWithKey, Invitation } from "../types/api";

export function TeamDetailManagePage() {
  const { teamId = "" } = useParams();
  const queryClient = useQueryClient();
  const teamQuery = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => teamsApi.get(teamId),
    enabled: Boolean(teamId),
  });
  const membersQuery = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => teamsApi.members(teamId),
    enabled: Boolean(teamId),
  });
  const agentsQuery = useQuery({
    queryKey: ["agents", teamId],
    queryFn: () => agentsApi.listByTeam(teamId),
    enabled: Boolean(teamId),
  });
  const invitationsQuery = useQuery({
    queryKey: ["invitations", teamId],
    queryFn: () => invitationsApi.listByTeam(teamId),
    enabled: Boolean(teamId),
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "MEMBER">("MEMBER");
  const [revealingToken, setRevealingToken] = useState<Invitation | null>(null);
  const [newlyCreatedAgent, setNewlyCreatedAgent] = useState<AgentWithKey | null>(null);
  const [rotatingAgent, setRotatingAgent] = useState<AgentWithKey | null>(null);
  const [agentName, setAgentName] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [removingInvitation, setRemovingInvitation] = useState<Invitation | null>(null);
  const [removingAgent, setRemovingAgent] = useState<Agent | null>(null);

  const inviteMutation = useMutation({
    mutationFn: (body: InviteMemberBody) => invitationsApi.create(teamId, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", teamId] });
      setInviteOpen(false);
      setInviteEmail("");
      setRevealingToken(data);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "초대 생성 실패")),
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.revoke(teamId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", teamId] });
      setRemovingInvitation(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "초대 취소 실패")),
  });

  const createAgentMutation = useMutation({
    mutationFn: (name: string) => agentsApi.create(teamId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents", teamId] });
      setAgentName("");
      setCreatingAgent(false);
      setNewlyCreatedAgent(data);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "에이전트 생성 실패")),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.rotateKey(agentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents", teamId] });
      setRotatingId(null);
      setRotatingAgent(data);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "키 회전 실패")),
  });

  const removeAgentMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.remove(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", teamId] });
      setRemovingAgent(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "에이전트 삭제 실패")),
  });

  if (teamQuery.isPending) return <Loading label="팀 정보를 불러오는 중" />;
  if (teamQuery.error)
    return (
      <ErrorState
        message={(teamQuery.error as Error).message ?? "팀 정보를 불러올 수 없어요"}
      />
    );
  const team = teamQuery.data;
  if (!team) return <ErrorState message="팀을 찾을 수 없어요" />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/teams"
          className="text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          ← 팀 목록
        </Link>
      </div>

      <PageHeader
        title={team.name}
        description={team.description ?? "팀 관리 콘솔"}
        actions={
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
        }
      />

      {pageError ? <ErrorState message={pageError} /> : null}

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Bot className="h-4 w-4 text-emerald-400" /> 픽시 에이전트
            <span className="text-xs text-slate-500">
              ({agentsQuery.data?.length ?? 0})
            </span>
          </h2>
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setCreatingAgent(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400"
          >
            <Plus className="h-3.5 w-3.5" /> 새 에이전트
          </button>
        </header>
        {agentsQuery.isPending ? (
          <Loading label="에이전트를 불러오는 중" />
        ) : agentsQuery.data && agentsQuery.data.length > 0 ? (
          <div className="space-y-2">
            {agentsQuery.data.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    <span className="truncate text-sm font-medium text-slate-100">
                      {a.name}
                    </span>
                    <StatusBadge tone={a.status === "ACTIVE" ? "emerald" : "slate"}>
                      {a.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {truncate(a.id, 32)} · {formatRelative(a.lastConnectedAt)}
                  </p>
                  {a.agentKeyLastFour ? (
                    <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                      key …{a.agentKeyLastFour}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPageError(null);
                      setRotatingId(a.id);
                    }}
                    disabled={rotateKeyMutation.isPending}
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  >
                    키 회전
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemovingAgent(a)}
                    className="rounded-md border border-rose-500/30 bg-slate-900 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-4 py-4 text-xs text-slate-400">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            아직 픽시 에이전트가 없어요. 새 에이전트를 등록해 키를 발급하세요.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Mail className="h-4 w-4 text-emerald-400" /> 초대
            <span className="text-xs text-slate-500">
              ({invitationsQuery.data?.length ?? 0})
            </span>
          </h2>
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setInviteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400"
          >
            <Plus className="h-3.5 w-3.5" /> 새 초대
          </button>
        </header>
        {invitationsQuery.isPending ? (
          <Loading label="초대 목록을 불러오는 중" />
        ) : invitationsQuery.data && invitationsQuery.data.length > 0 ? (
          <ul className="divide-y divide-slate-800">
            {invitationsQuery.data.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-xs text-slate-300">
                      {inv.invitedEmail}
                    </span>
                    <StatusBadge tone="violet">{inv.role}</StatusBadge>
                    <StatusBadge
                      tone={
                        inv.status === "PENDING"
                          ? "amber"
                          : inv.status === "ACCEPTED"
                            ? "emerald"
                            : inv.status === "REVOKED"
                              ? "rose"
                              : "slate"
                      }
                    >
                      {inv.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    만료 {formatDateTime(inv.expiresAt)}
                  </p>
                </div>
                {inv.status === "PENDING" ? (
                  <button
                    type="button"
                    onClick={() => setRemovingInvitation(inv)}
                    className="rounded-md border border-rose-500/30 bg-slate-900 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
                  >
                    취소
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-xs text-slate-500">
            발급한 초대가 없어요.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            멤버 ({membersQuery.data?.length ?? 0})
          </h2>
          <Link
            to="/members"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            멤버 관리 →
          </Link>
        </header>
        {membersQuery.data && membersQuery.data.length > 0 ? (
          <ul className="divide-y divide-slate-800">
            {membersQuery.data.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="truncate font-mono text-xs text-slate-300">
                  {m.userId}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge
                    tone={
                      m.role === "OWNER"
                        ? "fuchsia"
                        : m.role === "MANAGER"
                          ? "emerald"
                          : "slate"
                    }
                  >
                    {m.role}
                  </StatusBadge>
                  <span className="text-[10px] text-slate-500">
                    {formatDateTime(m.joinedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-xs text-slate-500">
            멤버를 불러올 수 없어요.
          </p>
        )}
      </section>

      {inviteOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
            }}
            className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-base font-semibold text-slate-100">
              팀원 초대
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              초대 토큰이 발급돼요. 한 번만 노출되니 안전한 곳에 전달하세요.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  이메일
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="newbie@team.io"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  권한
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "MANAGER" | "MEMBER")
                  }
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !inviteEmail}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {inviteMutation.isPending ? "발급 중…" : "초대 발급"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {revealingToken ? (
        <RevealInvitationDialog
          invitation={revealingToken}
          onClose={() => setRevealingToken(null)}
        />
      ) : null}

      {creatingAgent ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createAgentMutation.mutate(agentName.trim());
            }}
            className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-base font-semibold text-slate-100">
              새 픽시 에이전트
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              키는 생성 직후 한 번만 평문으로 보여줘요. 안전한 곳에 저장하세요.
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
                onClick={() => setCreatingAgent(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!agentName.trim() || createAgentMutation.isPending}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {createAgentMutation.isPending ? "발급 중…" : "발급"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <AgentKeyDialog
        open={Boolean(newlyCreatedAgent)}
        agentName={newlyCreatedAgent?.name ?? ""}
        agentKey={newlyCreatedAgent?.agentKey ?? ""}
        lastFour={newlyCreatedAgent?.agentKeyLastFour ?? null}
        onClose={() => setNewlyCreatedAgent(null)}
      />

      <AgentKeyDialog
        open={Boolean(rotatingAgent)}
        agentName={`${rotatingAgent?.name ?? ""} (키 회전)`}
        agentKey={rotatingAgent?.agentKey ?? ""}
        lastFour={rotatingAgent?.agentKeyLastFour ?? null}
        onClose={() => setRotatingAgent(null)}
      />

      <ConfirmDialog
        open={Boolean(rotatingId)}
        title="에이전트 키를 회전할까요?"
        description="기존 키는 즉시 무효화돼요. 회전 후 새 키가 한 번만 노출됩니다."
        confirmLabel="회전"
        loading={rotateKeyMutation.isPending}
        onCancel={() => setRotatingId(null)}
        onConfirm={() => rotatingId && rotateKeyMutation.mutate(rotatingId)}
      />

      <ConfirmDialog
        open={Boolean(removingInvitation)}
        title="초대를 취소할까요?"
        description={
          <>
            <span className="font-mono">{removingInvitation?.invitedEmail}</span> 으로
            보낸 초대를 회수합니다.
          </>
        }
        confirmLabel="취소"
        destructive
        loading={revokeMutation.isPending}
        onCancel={() => setRemovingInvitation(null)}
        onConfirm={() =>
          removingInvitation && revokeMutation.mutate(removingInvitation.id)
        }
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
        loading={removeAgentMutation.isPending}
        onCancel={() => setRemovingAgent(null)}
        onConfirm={() =>
          removingAgent && removeAgentMutation.mutate(removingAgent.id)
        }
      />
    </div>
  );
}

function RevealInvitationDialog({
  invitation,
  onClose,
}: {
  invitation: Invitation;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!invitation.token) return null;
  async function copy() {
    try {
      await navigator.clipboard.writeText(invitation.token!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-100">
          초대 토큰 발급
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {invitation.invitedEmail} · {invitation.role} · 만료{" "}
          {formatDateTime(invitation.expiresAt)}
        </p>
        <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          토큰은 한 번만 노출돼요. 안전하게 전달한 뒤 이 창을 닫으세요.
        </div>
        <pre className="mt-4 max-h-48 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300">
          {invitation.token}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            {copied ? "복사됨!" : "클립보드 복사"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
