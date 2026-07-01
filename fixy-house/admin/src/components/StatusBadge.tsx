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
  slate: "bg-slate-800 text-slate-300 ring-slate-700",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  rose: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  sky: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30",
};

export function StatusBadge({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
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
