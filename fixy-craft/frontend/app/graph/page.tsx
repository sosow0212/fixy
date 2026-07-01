"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiBase } from "@/lib/api";
import type { GraphView } from "@/lib/types";

type CytoscapeElements = {
  nodes: Array<{ data: Record<string, unknown> }>;
  edges: Array<{ data: Record<string, unknown> }>;
};

// Cytoscape 는 SSR 안전 import. 브라우저에서만 로드.
let cytoscape: typeof import("cytoscape")["default"] | null = null;
let coseBilkent: unknown = null;

async function loadCytoscape() {
  if (cytoscape) return cytoscape;
  const cyMod = await import("cytoscape");
  cytoscape = cyMod.default;
  try {
    const coseMod = await import("cytoscape-cose-bilkent");
    coseBilkent = (coseMod as { default: unknown }).default;
    cytoscape.use(coseBilkent as never);
  } catch {
    /* layout 옵션은 cytoscape 가 기본 cose 로 처리 */
  }
  return cytoscape;
}

export default function GraphPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    rid: string;
    graph: GraphView;
    depth: number;
  } | null>(null);

  const { data: searchResults } = useQuery({
    queryKey: ["graph-search", search],
    queryFn: async () => {
      if (!search) return [];
      const r = await fetch(`${apiBase}/api/graph/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: search, limit: 20 }),
      });
      return (await r.json()) as Array<{ rid: string; typeApiName: string; title?: string }>;
    },
    enabled: Boolean(search),
  });

  async function expand(rid: string, depth: number) {
    const r = await fetch(`${apiBase}/api/graph/expand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startRid: rid, depth }),
    });
    const g = (await r.json()) as GraphView;
    setSelected({ rid, graph: g, depth });
  }

  const elements = useMemo<CytoscapeElements | null>(() => {
    if (!selected) return null;
    return {
      nodes: selected.graph.nodes.map((n) => ({
        data: { id: n.id, label: n.title || n.id, type: n.type },
      })),
      edges: selected.graph.edges.map((e, i) => ({
        data: { id: `e${i}`, source: e.source, target: e.target, label: e.type },
      })),
    };
  }, [selected]);

  // Cytoscape 는 client-side mount 후 직접 mount 해야 함.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerEl || !elements) return;
    let cancelled = false;
    (async () => {
      const cy = await loadCytoscape();
      if (cancelled || !cy) return;
      // 이전 인스턴스 정리
      if ((containerEl as unknown as { _cy?: unknown })._cy) {
        ((containerEl as unknown) as { _cy: { destroy: () => void } })._cy.destroy();
      }
      const inst = cy({
        container: containerEl,
        elements: [
          ...elements.nodes,
          ...elements.edges,
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#7cb7ff",
              label: "data(label)",
              color: "#e6e8eb",
              "font-size": 10,
              "text-valign": "center",
              "text-halign": "center",
              width: 32,
              height: 32,
              "text-outline-color": "#0b0d10",
              "text-outline-width": 2,
            },
          },
          {
            selector: "node[type = 'Person']",
            style: { "background-color": "#7be0a1" },
          },
          {
            selector: "node[type = 'Company']",
            style: { "background-color": "#ffd480" },
          },
          {
            selector: "edge",
            style: {
              width: 1.5,
              "line-color": "#5b6371",
              "target-arrow-color": "#5b6371",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(label)",
              "font-size": 8,
              color: "#8a93a0",
              "text-rotation": "autorotate",
            },
          },
        ],
        layout: { name: "cose", animate: false } as never,
      });
      (containerEl as unknown as { _cy?: unknown })._cy = inst;
      inst.on("tap", "node", (evt) => {
        const node = evt.target;
        const rid = node.id();
        void expand(rid as string, (selected?.depth ?? 1) + 1);
      });
    })();
    return () => {
      cancelled = true;
      if (containerEl) {
        const inst = (containerEl as unknown as { _cy?: { destroy: () => void } })._cy;
        if (inst) inst.destroy();
      }
    };
  }, [containerEl, elements, selected]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Graph View</h1>
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="전역 검색 (예: 홍길동)"
          className="bg-bg border border-border rounded px-2 py-1 text-sm flex-1"
        />
        <select
          onChange={(e) => {
            if (e.target.value) {
              void expand(e.target.value, 1);
              setSearch("");
            }
          }}
          className="bg-bg border border-border rounded px-2 py-1 text-sm"
        >
          <option value="">또는 expand…</option>
          {searchResults?.map((r) => (
            <option key={r.rid} value={r.rid}>
              {r.title || r.rid} ({r.typeApiName})
            </option>
          ))}
        </select>
        {selected && (
          <>
            <span className="text-xs text-muted">depth {selected.depth}</span>
            <button
              onClick={() => void expand(selected.rid, Math.min(5, selected.depth + 1))}
              className="px-2 py-1 border border-border rounded text-xs"
            >
              + 한 단계 더
            </button>
          </>
        )}
      </div>

      <div
        ref={setContainerEl}
        className="border border-border rounded bg-panel"
        style={{ height: "70vh", minHeight: 480 }}
      />

      {selected && (
        <div className="text-xs text-muted">
          노드 {selected.graph.nodes.length} / 엣지 {selected.graph.edges.length}
        </div>
      )}
    </div>
  );
}
