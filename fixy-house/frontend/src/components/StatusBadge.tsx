import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type Tone =
  | "slate"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "fuchsia";

const TONE: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
};

interface StatusBadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({
  tone = "slate",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
