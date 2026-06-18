import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900 px-6 py-14 text-center">
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
