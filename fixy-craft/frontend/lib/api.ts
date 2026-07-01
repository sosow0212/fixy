/**
 * fetch 래퍼 — 백엔드 base URL 을 env 로 받아 절대 URL 구성.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type ApiError = {
  code: string;
  message: string;
  status: number;
};

export class ApiException extends Error {
  status: number;
  code: string;
  constructor(e: ApiError) {
    super(e.message);
    this.status = e.status;
    this.code = e.code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let err: ApiError = {
      code: "http_error",
      message: res.statusText,
      status: res.status,
    };
    try {
      const j = await res.json();
      if (j?.error) err = { ...err, ...j.error };
    } catch {
      // ignore body parse error
    }
    throw new ApiException(err);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── 도메인별 thin client ──────────────────────────────────────────────────────
import type {
  ObjectTypeRead,
  PropertyCreate,
  LinkTypeRead,
  ActionTypeRead,
  ObjectSet,
  ObjectDetail,
  GraphView,
  DataSourceRead,
  IngestJobRead,
} from "./types";

export const api = {
  // ontology
  listObjectTypes: () => apiFetch<ObjectTypeRead[]>("/api/object-types"),
  getObjectType: (apiName: string) =>
    apiFetch<ObjectTypeRead>(`/api/object-types/${apiName}`),
  createObjectType: (body: unknown) =>
    apiFetch<ObjectTypeRead>("/api/object-types", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteObjectType: (apiName: string) =>
    apiFetch<void>(`/api/object-types/${apiName}`, { method: "DELETE" }),
  addProperty: (apiName: string, body: PropertyCreate) =>
    apiFetch<ObjectTypeRead>(`/api/object-types/${apiName}/properties`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listLinkTypes: () => apiFetch<LinkTypeRead[]>("/api/link-types"),
  createLinkType: (body: unknown) =>
    apiFetch<LinkTypeRead>("/api/link-types", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listActionTypes: () => apiFetch<ActionTypeRead[]>("/api/action-types"),
  getActionType: (apiName: string) =>
    apiFetch<ActionTypeRead>(`/api/action-types/${apiName}`),
  createActionType: (body: unknown) =>
    apiFetch<ActionTypeRead>("/api/action-types", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // objects
  listObjects: (
    typeApiName: string,
    qs: { limit?: number; offset?: number; sort?: string; filter?: string } = {},
  ) => {
    const q = new URLSearchParams();
    if (qs.limit != null) q.set("limit", String(qs.limit));
    if (qs.offset != null) q.set("offset", String(qs.offset));
    if (qs.sort) q.set("sort", qs.sort);
    if (qs.filter) q.set("filter", qs.filter);
    const s = q.toString();
    return apiFetch<ObjectSet>(`/api/objects/${typeApiName}${s ? `?${s}` : ""}`);
  },
  getObject: (typeApiName: string, rid: string) =>
    apiFetch<ObjectDetail>(`/api/objects/${typeApiName}/${rid}`),
  expandGraph: (body: { startRid: string; depth?: number; linkTypes?: string[] }) =>
    apiFetch<GraphView>("/api/graph/expand", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // data sources
  listDataSources: () => apiFetch<DataSourceRead[]>("/api/data-sources"),
  getDataSource: (id: string) => apiFetch<DataSourceRead>(`/api/data-sources/${id}`),
  uploadDataSource: async (name: string, file: File) => {
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);
    const res = await fetch(`${BASE}/api/data-sources`, { method: "POST", body: form });
    if (!res.ok) throw new ApiException({ code: "upload_error", message: res.statusText, status: res.status });
    return (await res.json()) as DataSourceRead;
  },
  updateMappings: (id: string, body: unknown) =>
    apiFetch<DataSourceRead>(`/api/data-sources/${id}/mappings`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  runIngest: (id: string) =>
    apiFetch<IngestJobRead>(`/api/data-sources/${id}/ingest`, { method: "POST" }),

  // actions
  applyAction: (apiName: string, parameters: Record<string, unknown>, actor?: string) =>
    apiFetch<{ changedObjectRid?: string; auditRecorded: boolean; message?: string }>(
      `/api/actions/${apiName}/apply`,
      {
        method: "POST",
        body: JSON.stringify({ parameters, actor }),
      },
    ),
};

export const apiBase = BASE;
