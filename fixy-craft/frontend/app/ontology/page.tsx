"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DataType,
  ObjectTypeRead,
  PropertyDef,
  LinkTypeRead,
  ActionTypeRead,
} from "@/lib/types";
import { api, ApiException } from "@/lib/api";
import clsx from "clsx";

const DATA_TYPES: DataType[] = [
  "string",
  "integer",
  "double",
  "boolean",
  "date",
  "timestamp",
  "geo",
];

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

// ── ObjectType 패널 ─────────────────────────────────────────────────────────
function NewObjectTypePanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [apiName, setApiName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [properties, setProperties] = useState<PropertyDef[]>([]);
  const [error, setError] = useState<unknown>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.createObjectType({
        apiName,
        displayName,
        properties,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["object-types"] });
      onClose();
    },
    onError: setError,
  });

  function addProp() {
    setProperties((p) => [
      ...p,
      {
        apiName: "",
        displayName: "",
        dataType: "string",
        isRequired: false,
        isPrimaryKey: false,
        isTitle: false,
      },
    ]);
  }
  function updateProp(i: number, patch: Partial<PropertyDef>) {
    setProperties((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeProp(i: number) {
    setProperties((p) => p.filter((_, idx) => idx !== i));
  }

  return (
    <div className="border border-border bg-panel rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">새 Object Type</h3>
        <button onClick={onClose} className="text-xs text-muted hover:text-text">
          닫기
        </button>
      </div>
      <ErrorBanner error={error} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted">apiName (PascalCase)</label>
          <input
            value={apiName}
            onChange={(e) => setApiName(e.target.value)}
            className="w-full bg-bg border border-border rounded px-2 py-1 text-sm"
            placeholder="Person"
          />
        </div>
        <div>
          <label className="text-xs text-muted">표시 이름</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-bg border border-border rounded px-2 py-1 text-sm"
            placeholder="인물"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Properties</span>
          <button
            onClick={addProp}
            className="text-xs px-2 py-1 border border-border rounded hover:bg-bg"
          >
            + Property
          </button>
        </div>
        {properties.length === 0 && (
          <p className="text-xs text-muted">아직 속성이 없습니다.</p>
        )}
        <div className="space-y-2">
          {properties.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-center border border-border/50 rounded p-2"
            >
              <input
                value={p.apiName}
                onChange={(e) => updateProp(i, { apiName: e.target.value })}
                placeholder="apiName (camelCase)"
                className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
              />
              <input
                value={p.displayName}
                onChange={(e) => updateProp(i, { displayName: e.target.value })}
                placeholder="표시 이름"
                className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
              />
              <select
                value={p.dataType}
                onChange={(e) =>
                  updateProp(i, { dataType: e.target.value as DataType })
                }
                className="col-span-2 bg-bg border border-border rounded px-2 py-1 text-sm"
              >
                {DATA_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <label className="col-span-2 flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={p.isPrimaryKey}
                  onChange={(e) =>
                    updateProp(i, { isPrimaryKey: e.target.checked })
                  }
                />
                PK
              </label>
              <label className="col-span-1 flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={p.isTitle}
                  onChange={(e) => updateProp(i, { isTitle: e.target.checked })}
                />
                title
              </label>
              <button
                onClick={() => removeProp(i)}
                className="col-span-1 text-xs text-danger hover:underline"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => mut.mutate()}
        disabled={mut.isPending}
        className="px-3 py-1.5 bg-accent text-bg rounded text-sm font-semibold disabled:opacity-50"
      >
        {mut.isPending ? "생성 중…" : "생성"}
      </button>
    </div>
  );
}

// ── ObjectType 상세 + Property 추가 ─────────────────────────────────────────
function ObjectDetailPanel({ apiName }: { apiName: string }) {
  const qc = useQueryClient();
  const { data, error, refetch } = useQuery({
    queryKey: ["object-type", apiName],
    queryFn: () => api.getObjectType(apiName),
  });
  const [newProp, setNewProp] = useState<PropertyDef>({
    apiName: "",
    displayName: "",
    dataType: "string",
    isRequired: false,
    isPrimaryKey: false,
    isTitle: false,
  });
  const [addError, setAddError] = useState<unknown>(null);

  const addMut = useMutation({
    mutationFn: () => api.addProperty(apiName, newProp),
    onSuccess: () => {
      setNewProp({
        apiName: "",
        displayName: "",
        dataType: "string",
        isRequired: false,
        isPrimaryKey: false,
        isTitle: false,
      });
      setAddError(null);
      qc.invalidateQueries({ queryKey: ["object-type", apiName] });
      qc.invalidateQueries({ queryKey: ["object-types"] });
    },
    onError: setAddError,
  });

  if (!data && !error) return <p className="text-muted text-sm">로딩…</p>;

  return (
    <div className="space-y-3">
      <ErrorBanner error={addError} />
      {data && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{data.displayName}</h2>
            <code className="text-accent text-xs">{data.apiName}</code>
          </div>
          <table className="w-full text-sm border border-border rounded overflow-hidden">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="text-left p-2">apiName</th>
                <th className="text-left p-2">표시</th>
                <th className="text-left p-2">dataType</th>
                <th className="p-2">required</th>
                <th className="p-2">PK</th>
                <th className="p-2">title</th>
              </tr>
            </thead>
            <tbody>
              {data.properties.map((p) => (
                <tr key={p.apiName} className="border-t border-border">
                  <td className="p-2">
                    <code className="text-accent2">{p.apiName}</code>
                  </td>
                  <td className="p-2">{p.displayName}</td>
                  <td className="p-2 text-muted">{p.dataType}</td>
                  <td className="p-2 text-center">{p.isRequired ? "✓" : ""}</td>
                  <td className="p-2 text-center">{p.isPrimaryKey ? "★" : ""}</td>
                  <td className="p-2 text-center">{p.isTitle ? "✓" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <details className="border border-border rounded p-3">
            <summary className="cursor-pointer text-sm">+ Property 추가</summary>
            <div className="grid grid-cols-12 gap-2 mt-3 items-center">
              <input
                value={newProp.apiName}
                onChange={(e) => setNewProp({ ...newProp, apiName: e.target.value })}
                placeholder="apiName (camelCase)"
                className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
              />
              <input
                value={newProp.displayName}
                onChange={(e) => setNewProp({ ...newProp, displayName: e.target.value })}
                placeholder="표시 이름"
                className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
              />
              <select
                value={newProp.dataType}
                onChange={(e) =>
                  setNewProp({ ...newProp, dataType: e.target.value as DataType })
                }
                className="col-span-2 bg-bg border border-border rounded px-2 py-1 text-sm"
              >
                {DATA_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <label className="col-span-2 flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={newProp.isPrimaryKey}
                  onChange={(e) =>
                    setNewProp({ ...newProp, isPrimaryKey: e.target.checked })
                  }
                />
                PK
              </label>
              <label className="col-span-1 flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={newProp.isTitle}
                  onChange={(e) =>
                    setNewProp({ ...newProp, isTitle: e.target.checked })
                  }
                />
                title
              </label>
              <button
                onClick={() => addMut.mutate()}
                disabled={addMut.isPending}
                className="col-span-1 px-2 py-1 bg-accent text-bg rounded text-xs font-semibold disabled:opacity-50"
              >
                + 추가
              </button>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

// ── Link Type 패널 ──────────────────────────────────────────────────────────
function LinkTypePanel() {
  const qc = useQueryClient();
  const { data: linkTypes } = useQuery({
    queryKey: ["link-types"],
    queryFn: api.listLinkTypes,
  });
  const { data: objectTypes } = useQuery({
    queryKey: ["object-types"],
    queryFn: api.listObjectTypes,
  });
  const [apiName, setApiName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [src, setSrc] = useState("");
  const [tgt, setTgt] = useState("");
  const [card, setCard] = useState("MANY_TO_MANY");
  const [err, setErr] = useState<unknown>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.createLinkType({
        apiName,
        displayName,
        sourceObjectTypeApiName: src,
        targetObjectTypeApiName: tgt,
        cardinality: card,
      }),
    onSuccess: () => {
      setApiName("");
      setDisplayName("");
      setSrc("");
      setTgt("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["link-types"] });
    },
    onError: setErr,
  });

  return (
    <div className="border border-border bg-panel rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">Link Type</h3>
      <ErrorBanner error={err} />
      <div className="grid grid-cols-12 gap-2">
        <input
          value={apiName}
          onChange={(e) => setApiName(e.target.value)}
          placeholder="WORKS_AT (SCREAMING_SNAKE_CASE)"
          className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
        />
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="근무"
          className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
        />
        <select
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          className="col-span-2 bg-bg border border-border rounded px-2 py-1 text-sm"
        >
          <option value="">source...</option>
          {objectTypes?.map((o) => (
            <option key={o.apiName} value={o.apiName}>
              {o.apiName}
            </option>
          ))}
        </select>
        <select
          value={tgt}
          onChange={(e) => setTgt(e.target.value)}
          className="col-span-2 bg-bg border border-border rounded px-2 py-1 text-sm"
        >
          <option value="">target...</option>
          {objectTypes?.map((o) => (
            <option key={o.apiName} value={o.apiName}>
              {o.apiName}
            </option>
          ))}
        </select>
        <select
          value={card}
          onChange={(e) => setCard(e.target.value)}
          className="col-span-1 bg-bg border border-border rounded px-2 py-1 text-sm"
        >
          <option value="ONE_TO_ONE">1:1</option>
          <option value="ONE_TO_MANY">1:N</option>
          <option value="MANY_TO_MANY">N:M</option>
        </select>
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="col-span-1 px-3 py-1 bg-accent text-bg rounded text-sm font-semibold disabled:opacity-50"
        >
          +
        </button>
      </div>
      <ul className="space-y-1 text-sm">
        {linkTypes?.map((lt: LinkTypeRead) => (
          <li key={lt.apiName} className="border border-border/50 rounded p-2 flex items-center gap-2">
            <code className="text-accent2">{lt.apiName}</code>
            <span className="text-muted">{lt.displayName}</span>
            <span className="text-muted text-xs">
              ({lt.sourceObjectTypeApiName} → {lt.targetObjectTypeApiName} · {lt.cardinality})
            </span>
          </li>
        ))}
        {linkTypes && linkTypes.length === 0 && (
          <li className="text-xs text-muted">아직 Link Type 이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}

// ── Action Type 패널 ────────────────────────────────────────────────────────
const EXAMPLE_ACTION_DEF = {
  parameters: [
    { name: "targetRid", type: "objectRid", required: true },
    {
      name: "newRole",
      type: "string",
      required: true,
      allowed: ["Engineer", "Designer", "PM"],
    },
  ],
  rules: [
    {
      type: "setProperty",
      objectParam: "targetRid",
      property: "role",
      valueParam: "newRole",
    },
  ],
  effects: [{ type: "audit", message: "role changed" }],
};

function ActionTypePanel() {
  const qc = useQueryClient();
  const { data: actionTypes } = useQuery({
    queryKey: ["action-types"],
    queryFn: api.listActionTypes,
  });
  const { data: objectTypes } = useQuery({
    queryKey: ["object-types"],
    queryFn: api.listObjectTypes,
  });
  const [apiName, setApiName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [target, setTarget] = useState("");
  const [definitionText, setDefinitionText] = useState(
    JSON.stringify(EXAMPLE_ACTION_DEF, null, 2),
  );
  const [err, setErr] = useState<unknown>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.createActionType({
        apiName,
        displayName,
        targetObjectTypeApiName: target,
        definition: JSON.parse(definitionText),
      }),
    onSuccess: () => {
      setApiName("");
      setDisplayName("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["action-types"] });
    },
    onError: setErr,
  });

  return (
    <div className="border border-border bg-panel rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">Action Type</h3>
      <ErrorBanner error={err} />
      <div className="grid grid-cols-12 gap-2">
        <input
          value={apiName}
          onChange={(e) => setApiName(e.target.value)}
          placeholder="assignRole (camelCase)"
          className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
        />
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="역할 배정"
          className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
        />
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="col-span-3 bg-bg border border-border rounded px-2 py-1 text-sm"
        >
          <option value="">대상 Object Type...</option>
          {objectTypes?.map((o) => (
            <option key={o.apiName} value={o.apiName}>
              {o.apiName}
            </option>
          ))}
        </select>
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="col-span-3 px-3 py-1 bg-accent text-bg rounded text-sm font-semibold disabled:opacity-50"
        >
          {mut.isPending ? "생성 중…" : "생성"}
        </button>
      </div>
      <textarea
        value={definitionText}
        onChange={(e) => setDefinitionText(e.target.value)}
        className="w-full bg-bg border border-border rounded p-2 font-mono text-xs h-56"
      />
      <ul className="space-y-1 text-sm">
        {actionTypes?.map((at: ActionTypeRead) => (
          <li key={at.apiName} className="border border-border/50 rounded p-2 flex items-center gap-2">
            <code className="text-accent2">{at.apiName}</code>
            <span className="text-muted text-xs">→ {at.targetObjectTypeApiName}</span>
          </li>
        ))}
        {actionTypes && actionTypes.length === 0 && (
          <li className="text-xs text-muted">아직 Action Type 이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}

// ── 페이지 루트 ──────────────────────────────────────────────────────────────
export default function OntologyPage() {
  const { data: objectTypes } = useQuery({
    queryKey: ["object-types"],
    queryFn: api.listObjectTypes,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const otList: ObjectTypeRead[] = objectTypes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ontology Manager</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-3 py-1.5 bg-accent text-bg rounded text-sm font-semibold"
        >
          + Object Type
        </button>
      </div>
      {creating && <NewObjectTypePanel onClose={() => setCreating(false)} />}
      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-3 border border-border bg-panel rounded-lg p-3 space-y-1">
          <h3 className="text-xs uppercase text-muted mb-2">Object Types</h3>
          {otList.map((o) => (
            <button
              key={o.apiName}
              onClick={() => setSelected(o.apiName)}
              className={clsx(
                "block w-full text-left px-2 py-1.5 rounded text-sm",
                selected === o.apiName
                  ? "bg-bg border border-border"
                  : "hover:bg-bg/60",
              )}
            >
              <code className="text-accent2">{o.apiName}</code>
              <div className="text-xs text-muted">{o.displayName}</div>
            </button>
          ))}
          {otList.length === 0 && (
            <p className="text-xs text-muted">아직 Object Type 이 없습니다.</p>
          )}
        </aside>
        <section className="col-span-9 space-y-4">
          {selected ? (
            <ObjectDetailPanel apiName={selected} />
          ) : (
            <p className="text-muted text-sm">좌측에서 Object Type 을 선택하세요.</p>
          )}
          <LinkTypePanel />
          <ActionTypePanel />
        </section>
      </div>
    </div>
  );
}
