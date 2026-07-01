"use client";

import { useQuery } from "@tanstack/react-query";
import { api, apiBase } from "@/lib/api";
import type { Health } from "@/lib/types";

function StatCard({
  title,
  value,
  hint,
  tone = "default",
}: {
  title: string;
  value: string | number | undefined;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const toneClass = {
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    default: "text-text",
  }[tone];
  return (
    <div className="border border-border bg-panel rounded-lg p-4">
      <div className="text-xs uppercase text-muted tracking-wider">{title}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value ?? "—"}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: health } = useQuery<Health>({
    queryKey: ["health"],
    queryFn: async () => (await fetch(`${apiBase}/health`).then((r) => r.json())) as Health,
    refetchInterval: 10_000,
  });
  const { data: objectTypes } = useQuery({
    queryKey: ["object-types"],
    queryFn: api.listObjectTypes,
  });
  const { data: linkTypes } = useQuery({
    queryKey: ["link-types"],
    queryFn: api.listLinkTypes,
  });
  const { data: actionTypes } = useQuery({
    queryKey: ["action-types"],
    queryFn: api.listActionTypes,
  });
  const { data: dataSources } = useQuery({
    queryKey: ["data-sources"],
    queryFn: api.listDataSources,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          fixy-craft 운영 상태와 카운트 요약. 좌측 메뉴에서 도메인으로 이동하세요.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Object Types"
          value={objectTypes?.length ?? 0}
          hint="정의된 Object Type 수"
        />
        <StatCard
          title="Link Types"
          value={linkTypes?.length ?? 0}
          hint="정의된 Link Type 수"
        />
        <StatCard
          title="Action Types"
          value={actionTypes?.length ?? 0}
          hint="정의된 Action Type 수"
        />
        <StatCard
          title="Data Sources"
          value={dataSources?.length ?? 0}
          hint="업로드된 파일"
        />
        <StatCard
          title="Neo4j Nodes"
          value={health?.neo4j?.nodes}
          hint="FxObject 노드 수"
          tone={health?.neo4j?.ok ? "ok" : "danger"}
        />
        <StatCard
          title="Neo4j Edges"
          value={health?.neo4j?.edges}
          hint="전체 관계 수"
          tone={health?.neo4j?.ok ? "ok" : "danger"}
        />
        <StatCard
          title="Mongo"
          value={health?.mongo?.ok ? "OK" : "DOWN"}
          tone={health?.mongo?.ok ? "ok" : "danger"}
        />
        <StatCard
          title="Neo4j"
          value={health?.neo4j?.ok ? "OK" : "DOWN"}
          tone={health?.neo4j?.ok ? "ok" : "danger"}
        />
      </div>

      <div className="border border-border bg-panel rounded-lg p-4">
        <h2 className="text-sm font-semibold">시작하기</h2>
        <ol className="list-decimal list-inside text-sm text-muted mt-2 space-y-1">
          <li>Ontology 페이지에서 <code>Person</code>, <code>Company</code> Object Type 작성</li>
          <li>Link Type 으로 <code>WORKS_AT</code> 추가</li>
          <li>Action Type 으로 <code>assignRole</code> 정의 (JSON)</li>
          <li>Data Sources 에 CSV 업로드 → 매핑 → Ingest 실행</li>
          <li>Explorer / Graph 에서 결과 확인 + Action 으로 수정</li>
        </ol>
      </div>
    </div>
  );
}
