"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Database,
  Compass,
  Network,
  Zap,
} from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "Dashboard", icon: Boxes },
  { href: "/ontology", label: "Ontology", icon: Boxes },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/actions", label: "Actions", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 border-r border-border bg-panel flex-shrink-0">
      <nav className="p-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active =
            it.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-bg border border-border text-text"
                  : "text-muted hover:text-text hover:bg-bg/60",
              )}
            >
              <Icon size={16} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pt-3 text-xs text-muted">
        fixy-craft v0.1 · 팔란티어형 온톨로지 플랫폼
      </div>
    </aside>
  );
}
