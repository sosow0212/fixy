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
        "rounded-lg border border-rose-200 bg-rose-50 px-6 py-5 text-rose-800",
        className
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-rose-700">{message}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

interface LoadingProps {
  label?: string;
}

export function Loading({ label = "불러오는 중…" }: LoadingProps) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-400" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
        <span className="ml-2">{label}</span>
      </div>
    </div>
  );
}
