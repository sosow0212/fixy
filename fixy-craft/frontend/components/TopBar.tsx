"use client";

import { useQuery } from "@tanstack/react-query";
import { api, apiBase } from "@/lib/api";

export function TopBar() {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const r = await fetch(`${apiBase}/health`);
      return r.json();
    },
    refetchInterval: 10_000,
  });

  return (
    <header className="h-12 border-b border-border bg-panel flex items-center justify-between px-4">
      <div className="font-semibold tracking-wide">
        fixy<span className="text-accent">·</span>craft
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted">{apiBase}</span>
        {data && (
          <div className="flex items-center gap-3">
            <span
              className={
                data?.mongo?.ok ? "text-ok" : "text-danger"
              }
            >
              mongo {data?.mongo?.ok ? "OK" : "DOWN"}
            </span>
            <span
              className={
                data?.neo4j?.ok ? "text-ok" : "text-danger"
              }
            >
              neo4j {data?.neo4j?.ok ? "OK" : "DOWN"}
            </span>
            {data?.neo4j?.ok && (
              <span className="text-muted">
                {data.neo4j.nodes} nodes / {data.neo4j.edges} edges
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
