"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiException } from "@/lib/api";
import { ActionRunner } from "@/components/ActionRunner";

type Props = {
  typeApiName: string;
  rid: string;
  onClose: () => void;
  onNavigate: (typeApiName: string, rid: string) => void;
};

export function ObjectDetail({ typeApiName, rid, onClose, onNavigate }: Props) {
  const q = useQuery({
    queryKey: ["object", typeApiName, rid],
    queryFn: () => api.getObject(typeApiName, rid),
    enabled: Boolean(typeApiName && rid),
  });

  const [direction, setDirection] = useState<"OUT" | "IN">("OUT");
  const [selectedLinkType, setSelectedLinkType] = useState<string>("");

  const { data: linkTypes } = useQuery({
    queryKey: ["link-types"],
    queryFn: api.listLinkTypes,
  });

  const related = useQuery({
    queryKey: ["related", typeApiName, rid, selectedLinkType, direction],
    queryFn: () =>
      api
        .getObject(typeApiName, rid)
        .then(() =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/objects/${typeApiName}/${rid}/links${
              selectedLinkType ? `?linkType=${selectedLinkType}&direction=${direction}` : `?direction=${direction}`
            }`,
          ).then((r) => r.json()),
        ),
    enabled: Boolean(typeApiName && rid),
  });

  if (q.isLoading) return <div className="text-sm text-muted">로딩…</div>;
  if (q.error) {
    const msg =
      q.error instanceof ApiException
        ? `${q.error.status}: ${q.error.message}`
        : String(q.error);
    return <div className="text-sm text-danger">{msg}</div>;
  }
  const data = q.data;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {data.properties.name || data.rid}
          </h2>
          <code className="text-xs text-muted">{data.rid}</code>
        </div>
        <button onClick={onClose} className="text-xs text-muted hover:text-text">
          닫기
        </button>
      </div>

      <section>
        <h3 className="text-xs uppercase text-muted mb-2">속성</h3>
        <table className="w-full text-sm border border-border rounded overflow-hidden">
          <tbody>
            {Object.entries(data.properties).map(([k, v]) => (
              <tr key={k} className="border-t border-border/60">
                <td className="p-2 text-muted w-1/3">{k}</td>
                <td className="p-2">
                  <code className="text-xs">{JSON.stringify(v)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="text-xs uppercase text-muted mb-2">링크 카운트</h3>
        {data.linkCounts.length === 0 ? (
          <p className="text-xs text-muted">연결된 객체 없음</p>
        ) : (
          <table className="w-full text-sm border border-border rounded overflow-hidden">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="text-left p-2">linkType</th>
                <th className="text-left p-2">direction</th>
                <th className="p-2">count</th>
              </tr>
            </thead>
            <tbody>
              {data.linkCounts.map((lc) => (
                <tr key={`${lc.linkTypeApiName}-${lc.direction}`} className="border-t border-border/60">
                  <td className="p-2">
                    <code className="text-accent2">{lc.linkTypeApiName}</code>
                  </td>
                  <td className="p-2">{lc.direction}</td>
                  <td className="p-2 text-center">{lc.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xs uppercase text-muted">연결된 객체</h3>
          <select
            value={selectedLinkType}
            onChange={(e) => setSelectedLinkType(e.target.value)}
            className="bg-bg border border-border rounded px-2 py-0.5 text-xs"
          >
            <option value="">(모든 링크 타입)</option>
            {linkTypes?.map((lt) => (
              <option key={lt.apiName} value={lt.apiName}>
                {lt.apiName}
              </option>
            ))}
          </select>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "IN" | "OUT")}
            className="bg-bg border border-border rounded px-2 py-0.5 text-xs"
          >
            <option value="OUT">OUT</option>
            <option value="IN">IN</option>
          </select>
        </div>
        {related.isLoading && <p className="text-xs text-muted">로딩…</p>}
        {Array.isArray(related.data) && related.data.length === 0 && (
          <p className="text-xs text-muted">없음</p>
        )}
        <ul className="space-y-1">
          {Array.isArray(related.data) &&
            related.data.map((r: { rid: string; typeApiName: string; title?: string | null; properties: Record<string, unknown> }, i: number) => (
              <li key={i} className="border border-border/50 rounded p-2 text-xs">
                <button
                  onClick={() => onNavigate(r.typeApiName, r.rid)}
                  className="block w-full text-left hover:underline"
                >
                  <code className="text-accent2">{r.rid}</code>
                  <span className="ml-2 text-muted">{r.typeApiName}</span>
                  <span className="ml-2">{r.title || JSON.stringify(r.properties)}</span>
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs uppercase text-muted mb-2">Actions</h3>
        <ActionRunner typeApiName={typeApiName} rid={rid} />
      </section>
    </div>
  );
}
