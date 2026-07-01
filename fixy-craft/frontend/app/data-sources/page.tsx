"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiException } from "@/lib/api";
import type { DataSourceRead, ObjectMapping, IngestJobRead } from "@/lib/types";

function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const msg =
    error instanceof ApiException
      ? `${error.status} ${error.code}: ${error.message}`
      : String((error as Error)?.message || error);
  return (
    <div className="border border-danger/40 bg-danger/10 text-danger text-sm rounded p-2 my-2 whitespace-pre-wrap">
      {msg}
    </div>
  );
}

function UploadPanel({ onUploaded }: { onUploaded: (ds: DataSourceRead) => void }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<unknown>(null);

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("파일을 선택하세요.");
      return await api.uploadDataSource(name, file);
    },
    onSuccess: (ds) => {
      setName("");
      setFile(null);
      setError(null);
      onUploaded(ds);
    },
    onError: setError,
  });

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="border border-border bg-panel rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">업로드</h3>
      <ErrorBanner error={error} />
      <div className="grid grid-cols-12 gap-2 items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="데이터소스 이름"
          className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
        />
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="col-span-6 border-2 border-dashed border-border rounded p-3 text-center text-xs text-muted"
        >
          {file ? (
            <span className="text-text">{file.name}</span>
          ) : (
            <>파일을 드래그하거나 클릭해서 선택 (.csv / .json)</>
          )}
          <input
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </div>
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="col-span-3 px-3 py-1.5 bg-accent text-bg rounded text-sm font-semibold disabled:opacity-50"
        >
          {mut.isPending ? "업로드 중…" : "업로드"}
        </button>
      </div>
      <div>
        <input
          type="file"
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          className="text-xs"
        />
      </div>
    </div>
  );
}

function MappingEditor({ ds }: { ds: DataSourceRead }) {
  const qc = useQueryClient();
  const { data: objectTypes } = useQuery({
    queryKey: ["object-types"],
    queryFn: api.listObjectTypes,
  });
  const { data: linkTypes } = useQuery({
    queryKey: ["link-types"],
    queryFn: api.listLinkTypes,
  });

  const [mappings, setMappings] = useState<ObjectMapping[]>(ds.mappings);
  const [stub, setStub] = useState<boolean>(ds.stubOnMissingTarget);
  const [error, setError] = useState<unknown>(null);

  const saveMut = useMutation({
    mutationFn: () => api.updateMappings(ds.id, { mappings, stubOnMissingTarget: stub }),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["data-source", ds.id] });
      qc.invalidateQueries({ queryKey: ["data-sources"] });
    },
    onError: setError,
  });

  const ingestMut = useMutation({
    mutationFn: () => api.runIngest(ds.id),
    onSuccess: (job: IngestJobRead) => {
      qc.invalidateQueries({ queryKey: ["data-source", ds.id] });
      qc.setQueryData(["ingest-job", job.id], job);
    },
    onError: setError,
  });

  function addMapping() {
    setMappings((m) => [
      ...m,
      {
        objectTypeApiName: "",
        primaryKey: { column: "", property: "" },
        properties: [],
        links: [],
      },
    ]);
  }
  function updateMapping(i: number, patch: Partial<ObjectMapping>) {
    setMappings((m) => m.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeMapping(i: number) {
    setMappings((m) => m.filter((_, idx) => idx !== i));
  }

  return (
    <div className="border border-border bg-panel rounded-lg p-4 space-y-3">
      <ErrorBanner error={error} />
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">매핑: {ds.name}</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={stub} onChange={(e) => setStub(e.target.checked)} />
            타깃 노드 없으면 스텁 생성
          </label>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="px-3 py-1.5 border border-border rounded text-xs font-semibold hover:bg-bg"
          >
            {saveMut.isPending ? "저장 중…" : "매핑 저장"}
          </button>
          <button
            onClick={() => ingestMut.mutate()}
            disabled={ingestMut.isPending}
            className="px-3 py-1.5 bg-accent text-bg rounded text-xs font-semibold disabled:opacity-50"
          >
            {ingestMut.isPending ? "Ingest 실행 중…" : "Ingest 실행"}
          </button>
        </div>
      </div>

      <div className="text-xs text-muted">
        스키마: {ds.schema.map((c) => `${c.column}:${c.inferredType}`).join(", ")}
      </div>

      <button
        onClick={addMapping}
        className="text-xs px-2 py-1 border border-border rounded hover:bg-bg"
      >
        + Object 매핑 추가
      </button>

      <div className="space-y-3">
        {mappings.map((m, mi) => (
          <div key={mi} className="border border-border/60 rounded p-3 space-y-2">
            <div className="grid grid-cols-12 gap-2 items-center">
              <select
                value={m.objectTypeApiName}
                onChange={(e) => updateMapping(mi, { objectTypeApiName: e.target.value })}
                className="col-span-4 bg-bg border border-border rounded px-2 py-1 text-sm"
              >
                <option value="">대상 Object Type...</option>
                {objectTypes?.map((o) => (
                  <option key={o.apiName} value={o.apiName}>
                    {o.apiName}
                  </option>
                ))}
              </select>
              <input
                value={m.primaryKey.column}
                onChange={(e) =>
                  updateMapping(mi, {
                    primaryKey: { ...m.primaryKey, column: e.target.value },
                  })
                }
                placeholder="PK 컬럼"
                className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
              />
              <input
                value={m.primaryKey.property}
                onChange={(e) =>
                  updateMapping(mi, {
                    primaryKey: { ...m.primaryKey, property: e.target.value },
                  })
                }
                placeholder="PK 속성"
                className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => removeMapping(mi)}
                className="col-span-2 text-xs text-danger hover:underline"
              >
                매핑 삭제
              </button>
            </div>
            <div>
              <span className="text-xs uppercase text-muted">속성 매핑</span>
              {m.properties.map((p, pi) => (
                <div key={pi} className="grid grid-cols-12 gap-2 mt-1">
                  <input
                    value={p.column}
                    onChange={(e) => {
                      const next = [...m.properties];
                      next[pi] = { ...next[pi], column: e.target.value };
                      updateMapping(mi, { properties: next });
                    }}
                    placeholder="CSV 컬럼"
                    className="col-span-4 bg-bg border border-border rounded px-2 py-1 text-xs"
                  />
                  <input
                    value={p.property}
                    onChange={(e) => {
                      const next = [...m.properties];
                      next[pi] = { ...next[pi], property: e.target.value };
                      updateMapping(mi, { properties: next });
                    }}
                    placeholder="속성 apiName"
                    className="col-span-4 bg-bg border border-border rounded px-2 py-1 text-xs"
                  />
                  <select
                    value={p.transform || ""}
                    onChange={(e) => {
                      const next = [...m.properties];
                      next[pi] = {
                        ...next[pi],
                        transform: e.target.value || undefined,
                      };
                      updateMapping(mi, { properties: next });
                    }}
                    className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="">transform 없음</option>
                    <option value="to_int">to_int</option>
                    <option value="to_double">to_double</option>
                    <option value="to_bool">to_bool</option>
                    <option value="to_date">to_date</option>
                    <option value="to_string">to_string</option>
                  </select>
                  <button
                    onClick={() => {
                      const next = m.properties.filter((_, idx) => idx !== pi);
                      updateMapping(mi, { properties: next });
                    }}
                    className="col-span-1 text-xs text-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  updateMapping(mi, {
                    properties: [
                      ...m.properties,
                      { column: "", property: "" },
                    ],
                  })
                }
                className="mt-1 text-xs px-2 py-0.5 border border-border rounded hover:bg-bg"
              >
                + 속성
              </button>
            </div>
            <div>
              <span className="text-xs uppercase text-muted">링크 규칙</span>
              {m.links.map((l, li) => (
                <div key={li} className="grid grid-cols-12 gap-2 mt-1">
                  <select
                    value={l.linkTypeApiName}
                    onChange={(e) => {
                      const next = [...m.links];
                      next[li] = { ...next[li], linkTypeApiName: e.target.value };
                      updateMapping(mi, { links: next });
                    }}
                    className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="">link type...</option>
                    {linkTypes?.map((lt) => (
                      <option key={lt.apiName} value={lt.apiName}>
                        {lt.apiName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={l.direction}
                    onChange={(e) => {
                      const next = [...m.links];
                      next[li] = { ...next[li], direction: e.target.value };
                      updateMapping(mi, { links: next });
                    }}
                    className="col-span-1 bg-bg border border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="OUT">OUT</option>
                    <option value="IN">IN</option>
                  </select>
                  <input
                    value={l.target.objectTypeApiName}
                    onChange={(e) => {
                      const next = [...m.links];
                      next[li] = {
                        ...next[li],
                        target: { ...next[li].target, objectTypeApiName: e.target.value },
                      };
                      updateMapping(mi, { links: next });
                    }}
                    placeholder="타깃 OT"
                    className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-xs"
                  />
                  <input
                    value={l.target.matchColumn}
                    onChange={(e) => {
                      const next = [...m.links];
                      next[li] = {
                        ...next[li],
                        target: { ...next[li].target, matchColumn: e.target.value },
                      };
                      updateMapping(mi, { links: next });
                    }}
                    placeholder="match 컬럼"
                    className="col-span-2 bg-bg border border-border rounded px-2 py-1 text-xs"
                  />
                  <input
                    value={l.target.matchProperty}
                    onChange={(e) => {
                      const next = [...m.links];
                      next[li] = {
                        ...next[li],
                        target: { ...next[li].target, matchProperty: e.target.value },
                      };
                      updateMapping(mi, { links: next });
                    }}
                    placeholder="match 속성"
                    className="col-span-2 bg-bg border border-border rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => {
                      const next = m.links.filter((_, idx) => idx !== li);
                      updateMapping(mi, { links: next });
                    }}
                    className="col-span-1 text-xs text-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  updateMapping(mi, {
                    links: [
                      ...m.links,
                      {
                        linkTypeApiName: "",
                        direction: "OUT",
                        target: { objectTypeApiName: "", matchColumn: "", matchProperty: "" },
                      },
                    ],
                  })
                }
                className="mt-1 text-xs px-2 py-0.5 border border-border rounded hover:bg-bg"
              >
                + 링크
              </button>
            </div>
          </div>
        ))}
      </div>

      {ingestMut.data && (
        <div className="border border-border rounded p-3 bg-bg space-y-1 text-sm">
          <div className="font-semibold">Ingest 결과 (job {ingestMut.data.id})</div>
          <div className="text-xs text-muted">status: {ingestMut.data.status}</div>
          <div>생성 노드 {ingestMut.data.createdNodes} / 갱신 노드 {ingestMut.data.updatedNodes} / 생성 링크 {ingestMut.data.createdLinks}</div>
          <div>스킵 행 {ingestMut.data.skippedRows}</div>
          {ingestMut.data.errorRows.length > 0 && (
            <details className="mt-2">
              <summary className="text-danger text-xs cursor-pointer">
                오류 행 {ingestMut.data.errorRows.length}건 보기
              </summary>
              <table className="w-full mt-2 text-xs">
                <thead className="text-muted">
                  <tr>
                    <th className="text-left p-1">행</th>
                    <th className="text-left p-1">사유</th>
                  </tr>
                </thead>
                <tbody>
                  {ingestMut.data.errorRows.map((er, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="p-1">{er.rowIndex}</td>
                      <td className="p-1">{er.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataSourcesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["data-sources"],
    queryFn: api.listDataSources,
  });
  const [selected, setSelected] = useState<string | null>(null);

  const dsList: DataSourceRead[] = data || [];
  const selectedDs = dsList.find((d) => d.id === selected);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Data Sources</h1>
      <UploadPanel
        onUploaded={(ds) => {
          setSelected(ds.id);
          qc.invalidateQueries({ queryKey: ["data-sources"] });
        }}
      />
      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-3 border border-border bg-panel rounded-lg p-3 space-y-1">
          <h3 className="text-xs uppercase text-muted mb-2">업로드됨</h3>
          {dsList.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={`block w-full text-left px-2 py-1.5 rounded text-sm ${selected === d.id ? "bg-bg border border-border" : "hover:bg-bg/60"}`}
            >
              <code className="text-accent2">{d.name}</code>
              <div className="text-xs text-muted">
                {d.kind} · 매핑 {d.mappings.length}개
              </div>
            </button>
          ))}
          {dsList.length === 0 && (
            <p className="text-xs text-muted">데이터소스가 없습니다.</p>
          )}
        </aside>
        <section className="col-span-9">
          {selectedDs ? (
            <MappingEditor ds={selectedDs} key={selectedDs.id + "-" + selectedDs.mappings.length} />
          ) : (
            <p className="text-muted text-sm">좌측에서 데이터소스를 선택하세요.</p>
          )}
        </section>
      </div>
    </div>
  );
}
