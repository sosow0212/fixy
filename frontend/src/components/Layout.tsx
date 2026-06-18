import { type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
  LayoutDashboard,
  FolderKanban,
  ScrollText,
  Files,
  KeyRound,
  UserRound,
  LogOut,
} from "lucide-react";
import { cn } from "../lib/cn";
import { Topbar } from "./Topbar";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/teams", label: "팀", icon: FolderKanban },
  { to: "/worklogs", label: "작업 로그", icon: ScrollText },
  { to: "/documents", label: "문서", icon: Files },
  { to: "/secrets", label: "시크릿", icon: KeyRound },
];

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-slate-200 px-5">
          <span className="text-base font-semibold tracking-tight">
            fixy-house
          </span>
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
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )
            }
          >
            <UserRound className="h-4 w-4" />
            {user?.displayName ?? "프로필"}
          </NavLink>
          <button
            type="button"
            onClick={() => clear()}
            className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
