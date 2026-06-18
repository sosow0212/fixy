import { type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bot,
  UserCog,
  Mail,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { cn } from "../lib/cn";
import { Topbar } from "./Topbar";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/teams", label: "팀 관리", icon: Users },
  { to: "/agents", label: "에이전트", icon: Bot },
  { to: "/members", label: "멤버", icon: UserCog },
  { to: "/invitations", label: "초대", icon: Mail },
];

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/20 font-bold text-emerald-400">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight">fixy admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <div className="rounded-md bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
            <div className="font-medium text-slate-200">
              {user?.displayName ?? "매니저"}
            </div>
            <div className="truncate font-mono text-[10px] text-slate-500">
              {user?.email ?? "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => clear()}
            className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
