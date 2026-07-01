"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiException } from "@/lib/api";
import type { ActionTypeRead } from "@/lib/types";

type Props = {
  typeApiName: string;
  rid: string;
};

function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const msg =
    error instanceof ApiException
      ? `${error.status}: ${error.message}`
      : String(error);
  return (
    <div className="border border-danger/40 bg-danger/10 text-danger text-sm rounded p-2 my-2">
      {msg}
    </div>
  );
}

export function ActionRunner({ typeApiName, rid }: Props) {
  const { data: actionTypes } = useQuery({
    queryKey: ["action-types"],
    queryFn: api.listActionTypes,
  });

  const candidates = useMemo(
    () => (actionTypes || []).filter((at) => at.targetObjectTypeApiName === typeApiName),
    [actionTypes, typeApiName],
  );

  const [selectedApiName, setSelectedApiName] = useState<string>("");
  const selected: ActionTypeRead | undefined = candidates.find(
    (at) => at.apiName === selectedApiName,
  );

  const [values, setValues] = useState<Record<string, unknown>>({ targetRid: rid });
  const [actor, setActor] = useState("admin");

  const applyMut = useMutation({
    mutationFn: () =>
      api.applyAction(
        selectedApiName,
        { ...values, targetRid: rid },
        actor,
      ),
  });

  if (candidates.length === 0) {
    return (
      <p className="text-xs text-muted">
        이 Object Type 을 대상으로 하는 Action Type 이 없습니다.
      </p>
    );
  }

  return (
    <div className="border border-border/60 rounded p-3 space-y-2 text-sm">
      <ErrorBanner error={applyMut.error} />
      <div className="flex items-center gap-2">
        <select
          value={selectedApiName}
          onChange={(e) => {
            setSelectedApiName(e.target.value);
            setValues({ targetRid: rid });
          }}
          className="bg-bg border border-border rounded px-2 py-1 text-xs"
        >
          <option value="">Action 선택…</option>
          {candidates.map((at) => (
            <option key={at.apiName} value={at.apiName}>
              {at.apiName} ({at.displayName})
            </option>
          ))}
        </select>
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="actor"
          className="bg-bg border border-border rounded px-2 py-1 text-xs w-24"
        />
        <button
          onClick={() => applyMut.mutate()}
          disabled={!selectedApiName || applyMut.isPending}
          className="px-3 py-1 bg-accent text-bg rounded text-xs font-semibold disabled:opacity-50"
        >
          {applyMut.isPending ? "실행 중…" : "실행"}
        </button>
      </div>

      {selected?.definition?.parameters?.map((p) => {
        const allowed = Array.isArray(p.allowed) ? p.allowed : null;
        if (p.name === "targetRid") return null; // 자동 주입
        return (
          <div key={p.name} className="flex items-center gap-2">
            <span className="text-xs text-muted w-24">{p.name}</span>
            {allowed ? (
              <select
                value={(values[p.name] as string) || ""}
                onChange={(e) =>
                  setValues({ ...values, [p.name]: e.target.value })
                }
                className="bg-bg border border-border rounded px-2 py-1 text-xs"
              >
                <option value="">{p.name} 선택…</option>
                {allowed.map((v) => {
                  const s = String(v);
                  return (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                value={(values[p.name] as string) || ""}
                onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                className="bg-bg border border-border rounded px-2 py-1 text-xs flex-1"
              />
            )}
            {p.required && <span className="text-xs text-danger">*</span>}
          </div>
        );
      })}

      {applyMut.data && (
        <div className="border border-ok/40 bg-ok/10 text-ok rounded p-2 text-xs">
          적용 완료. auditRecorded={String(applyMut.data.auditRecorded)}{" "}
          {applyMut.data.changedObjectRid && (
            <span className="ml-2">대상 {applyMut.data.changedObjectRid}</span>
          )}
        </div>
      )}
    </div>
  );
}
