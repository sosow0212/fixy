import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "문제가 발생했습니다",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-rose-500/30 bg-rose-500/10 px-6 py-5 text-rose-200",
        className
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-rose-300/90">{message}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Loading({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 py-16 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-500" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-500 [animation-delay:120ms]" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-500 [animation-delay:240ms]" />
        <span className="ml-2">{label}</span>
      </div>
    </div>
  );
}
