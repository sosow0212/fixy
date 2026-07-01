import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Mail, Trash2 } from "lucide-react";
import { invitationsApi, type InviteMemberBody } from "../api/invitations";
import { teamsApi } from "../api/teams";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, Loading } from "../components/AsyncStates";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../lib/format";
import { extractErrorMessage } from "../api/client";
import type { Invitation } from "../types/api";

export function InvitationsPage() {
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: teamsApi.list });
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const teamId = activeTeamId ?? teamsQuery.data?.[0]?.id ?? "";
  const invitationsQuery = useQuery({
    queryKey: ["invitations", teamId],
    queryFn: () => invitationsApi.listByTeam(teamId),
    enabled: Boolean(teamId),
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "MEMBER">("MEMBER");
  const [tokenToShow, setTokenToShow] = useState<Invitation | null>(null);
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: (body: InviteMemberBody) => invitationsApi.create(teamId, body),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", teamId] });
      setInviteOpen(false);
      setEmail("");
      if (inv.token) setTokenToShow(inv);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "초대 생성 실패")),
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.revoke(teamId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", teamId] });
      setRevoking(null);
    },
    onError: (err) => setPageError(extractErrorMessage(err, "초대 취소 실패")),
  });

  if (teamsQuery.isPending) return <Loading label="팀을 불러오는 중" />;
  if (!teamId)
    return (
      <EmptyState
        title="관리할 팀이 없어요"
        description="팀을 먼저 만들어 주세요."
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
        title="초대"
        description="팀원 초대 토큰 발급 / 취소. 토큰은 1회만 평문으로 노출돼요."
        actions={
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setInviteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            <Mail className="h-4 w-4" /> 새 초대
          </button>
        }
      />

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

      {invitationsQuery.isPending ? (
        <Loading label="초대 목록을 불러오는 중" />
      ) : invitationsQuery.error ? (
        <ErrorState message="초대 목록을 불러올 수 없어요" />
      ) : invitationsQuery.data && invitationsQuery.data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  이메일
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  권한
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  상태
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  만료
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invitationsQuery.data.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-200">
                    {inv.invitedEmail}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone="violet">{inv.role}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDateTime(inv.expiresAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status === "PENDING" && inv.token ? (
                        <button
                          type="button"
                          onClick={() => setTokenToShow(inv)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" /> 토큰 보기
                        </button>
                      ) : null}
                      {inv.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => setRevoking(inv)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-slate-900 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> 취소
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="발급된 초대가 없어요"
          description="새 초대를 만들어 팀원을 추가하세요."
        />
      )}

      {inviteOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate({ email, role });
            }}
            className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-base font-semibold text-slate-100">팀원 초대</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  이메일
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  권한
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "MANAGER" | "MEMBER")}
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
                disabled={!email || inviteMutation.isPending}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {inviteMutation.isPending ? "발급 중…" : "발급"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {tokenToShow ? (
        <RevealTokenDialog
          invitation={tokenToShow}
          onClose={() => setTokenToShow(null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(revoking)}
        title="초대를 취소할까요?"
        description={revoking?.invitedEmail}
        confirmLabel="취소"
        destructive
        loading={revokeMutation.isPending}
        onCancel={() => setRevoking(null)}
        onConfirm={() => revoking && revokeMutation.mutate(revoking.id)}
      />
    </div>
  );
}

function RevealTokenDialog({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-100">
          초대 토큰 (1회 노출)
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {invitation.invitedEmail} · {invitation.role}
        </p>
        <pre className="mt-4 max-h-48 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300">
          {invitation.token}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            {copied ? "복사됨!" : "복사"}
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
