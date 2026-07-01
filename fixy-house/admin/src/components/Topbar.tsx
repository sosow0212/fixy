import { useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "대시보드",
  "/teams": "팀 관리",
  "/agents": "에이전트",
  "/members": "멤버",
  "/invitations": "초대",
  "/audit/secrets": "감사 로그",
};

export function Topbar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const label =
    Object.entries(ROUTE_LABELS).find(([prefix]) =>
      location.pathname.startsWith(prefix)
    )?.[1] ?? "fixy admin";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-200">{label}</h1>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          admin
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Activity className="h-3.5 w-3.5" />
          {user?.role ?? "—"}
        </span>
      </div>
    </header>
  );
}
