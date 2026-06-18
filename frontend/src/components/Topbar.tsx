import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ScrollText,
  Files,
  KeyRound,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";

const NAV = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/teams", label: "팀", icon: FolderKanban },
  { to: "/worklogs", label: "작업 로그", icon: ScrollText },
  { to: "/documents", label: "문서", icon: Files },
  { to: "/secrets", label: "시크릿", icon: KeyRound },
];

export function Topbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const current = NAV.find((n) => location.pathname.startsWith(n.to));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <h1 className="text-sm font-semibold text-slate-700">
          {current?.label ?? "fixy-house"}
        </h1>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
          운영
        </span>
      </div>
      {open && (
        <nav className="absolute left-0 top-14 z-30 w-full border-b border-slate-200 bg-white shadow-lg md:hidden">
          <div className="space-y-1 p-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
