import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "../lib/cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          {destructive ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            {description ? (
              <div className="mt-1 text-sm text-slate-400">{description}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50",
              destructive
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {loading ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
