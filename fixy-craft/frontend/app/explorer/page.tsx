"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ObjectDetail } from "@/components/ObjectDetail";

export default function ExplorerPage() {
  const { data: objectTypes } = useQuery({
    queryKey: ["object-types"],
    queryFn: api.listObjectTypes,
  });
  const [typeApiName, setTypeApiName] = useState("");
  const [filterText, setFilterText] = useState("");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedRid, setSelectedRid] = useState<string | null>(null);

  const otList = objectTypes || [];
  const ot = otList.find((o) => o.apiName === typeApiName);

  // filter 는 title 속성에 대한 단순 contains 검색으로 보낸다.
  const filter = filterText && ot
    ? JSON.stringify(
        Object.fromEntries(
          ot.properties
            .filter((p) => p.isTitle || p.dataType === "string" || p.dataType === "integer")
            .slice(0, 1)
            .map((p) => [p.apiName, filterText]),
        ),
      )
    : undefined;

  const qs = useQuery({
    queryKey: ["objects", typeApiName, limit, offset, sortKey, sortDir, filter],
    queryFn: () =>
      api.listObjects(typeApiName, {
        limit,
        offset,
        sort: sortKey ? `${sortKey}:${sortDir}` : undefined,
        filter,
      }),
    enabled: Boolean(typeApiName),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Object Explorer</h1>
        <div className="flex items-center gap-2">
          <select
            value={typeApiName}
            onChange={(e) => {
              setTypeApiName(e.target.value);
              setOffset(0);
              setSelectedRid(null);
            }}
            className="bg-bg border border-border rounded px-2 py-1 text-sm"
          >
            <option value="">Object Type 선택…</option>
            {otList.map((o) => (
              <option key={o.apiName} value={o.apiName}>
                {o.apiName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setOffset(0);
              }}
              placeholder="title 속성 검색…"
              className="bg-bg border border-border rounded px-2 py-1 text-sm flex-1"
            />
            {ot && (
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="bg-bg border border-border rounded px-2 py-1 text-xs"
              >
                <option value="">정렬 없음</option>
                {ot.properties.map((p) => (
                  <option key={p.apiName} value={p.apiName}>
                    {p.apiName}
                  </option>
                ))}
              </select>
            )}
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
              className="bg-bg border border-border rounded px-2 py-1 text-xs"
            >
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
          </div>

          <div className="text-xs text-muted">
            {qs.data ? `total ${qs.data.total}건` : "로딩…"}
          </div>

          <table className="w-full text-sm border border-border rounded overflow-hidden">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="text-left p-2">rid</th>
                <th className="text-left p-2">title</th>
                {ot?.properties
                  .filter((p) => !p.isPrimaryKey && p.apiName !== (ot.properties.find((x) => x.isTitle)?.apiName ?? ""))
                  .slice(0, 3)
                  .map((p) => (
                    <th key={p.apiName} className="text-left p-2">{p.apiName}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {qs.data?.items.map((it) => (
                <tr
                  key={it.rid}
                  className={`border-t border-border/60 cursor-pointer hover:bg-bg/60 ${selectedRid === it.rid ? "bg-bg" : ""}`}
                  onClick={() => setSelectedRid(it.rid)}
                >
                  <td className="p-2">
                    <code className="text-accent2 text-xs">{it.rid.slice(0, 20)}…</code>
                  </td>
                  <td className="p-2">{it.title ?? "—"}</td>
                  {ot?.properties
                    .filter((p) => !p.isPrimaryKey && p.apiName !== (ot.properties.find((x) => x.isTitle)?.apiName ?? ""))
                    .slice(0, 3)
                    .map((p) => (
                      <td key={p.apiName} className="p-2 text-xs">
                        {String(it.properties[p.apiName] ?? "—")}
                      </td>
                    ))}
                </tr>
              ))}
              {qs.data?.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-muted text-xs">
                    결과 없음
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-2 py-1 border border-border rounded disabled:opacity-40"
              disabled={offset === 0}
            >
              ◀ 이전
            </button>
            <span>
              {offset}–{offset + (qs.data?.items.length ?? 0)} / {qs.data?.total ?? 0}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              className="px-2 py-1 border border-border rounded disabled:opacity-40"
              disabled={!qs.data || offset + limit >= (qs.data?.total ?? 0)}
            >
              다음 ▶
            </button>
          </div>
        </section>

        <aside className="col-span-5">
          {selectedRid && typeApiName ? (
            <ObjectDetail
              typeApiName={typeApiName}
              rid={selectedRid}
              onClose={() => setSelectedRid(null)}
              onNavigate={(t, r) => {
                setTypeApiName(t);
                setSelectedRid(r);
              }}
            />
          ) : (
            <div className="border border-border/60 rounded p-4 text-sm text-muted">
              좌측에서 객체를 선택하면 상세 / 링크 / Action 을 볼 수 있습니다.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
