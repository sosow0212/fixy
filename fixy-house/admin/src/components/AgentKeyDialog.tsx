import { useEffect, useState } from "react";
import { CheckCircle2, Copy, KeyRound, ShieldCheck, X } from "lucide-react";
import { cn } from "../lib/cn";

interface AgentKeyDialogProps {
  open: boolean;
  agentName: string;
  agentKey: string;
  lastFour: string | null;
  onClose: () => void;
}

export function AgentKeyDialog({
  open,
  agentName,
  agentKey,
  lastFour,
  onClose,
}: AgentKeyDialogProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    setCopied(false);
    setAcknowledged(false);
  }, [agentKey]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && acknowledged) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, acknowledged, onClose]);

  if (!open) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(agentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                픽시 에이전트 키 발급
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                <strong className="text-slate-200">{agentName}</strong> — 이 창을
                닫으면 다시 볼 수 없어요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (acknowledged) onClose();
            }}
            disabled={!acknowledged}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          이 키는 <strong>1회만</strong> 평문으로 노출됩니다. 안전한 곳에 붙여넣고{" "}
          <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[10px]">
            X-Fixy-Agent-Key
          </code>{" "}
          헤더 또는 환경변수로 사용하세요. 저장 후 닫기 버튼이 활성화돼요.
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span>agentKey (평문)</span>
            {lastFour ? (
              <span className="font-mono normal-case">
                끝 4자리 · {lastFour}
              </span>
            ) : null}
          </div>
          <pre className="overflow-x-auto rounded-md border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-300">
            {agentKey}
          </pre>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition",
              copied
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            )}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> 복사됨!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> 클립보드 복사
              </>
            )}
          </button>
          <label className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span>
              키를 안전한 곳에 저장했어요. 다시 볼 수 없음을 이해했어요.
            </span>
          </label>
          <button
            type="button"
            onClick={onClose}
            disabled={!acknowledged}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> 저장 완료, 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
