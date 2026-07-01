"use client";

import Link from "next/link";

export default function ActionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Actions</h1>
      <p className="text-sm text-muted">
        Action 은 <strong>Object Explorer</strong> 상세 패널의 &quot;Actions&quot; 섹션에서
        객체를 선택한 뒤 실행할 수 있습니다. 정의(파라미터/규칙/효과)는{" "}
        <Link href="/ontology" className="text-accent2 underline">
          Ontology
        </Link>{" "}
        에서 만듭니다.
      </p>
      <div className="border border-border bg-panel rounded-lg p-4 text-sm text-muted space-y-2">
        <p className="font-semibold text-text">Action 흐름</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ontology 에서 ActionType 생성 (camelCase apiName, JSON 정의)</li>
          <li>Explorer 에서 객체 선택 → 상세 패널의 Actions 섹션</li>
          <li>액션 선택 → 파라미터 입력 → 실행</li>
          <li>변경된 속성은 Neo4j 에 즉시 반영 · 감사는 Mongo 에 기록</li>
        </ol>
      </div>
    </div>
  );
}
