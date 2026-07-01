/** 프론트 공용 타입 — 백엔드 응답과 매핑. */

export type DataType =
  | "string"
  | "integer"
  | "double"
  | "boolean"
  | "date"
  | "timestamp"
  | "geo";

export interface PropertyDef {
  apiName: string;
  displayName: string;
  dataType: DataType;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isTitle: boolean;
}

export interface PropertyCreate extends PropertyDef {}

export interface ObjectTypeRead {
  apiName: string;
  displayName: string;
  description?: string | null;
  icon?: string | null;
  properties: PropertyDef[];
  createdAt: string;
  updatedAt: string;
}

export type Cardinality =
  | "ONE_TO_ONE"
  | "ONE_TO_MANY"
  | "MANY_TO_MANY";

export interface LinkTypeRead {
  apiName: string;
  displayName: string;
  sourceObjectTypeApiName: string;
  targetObjectTypeApiName: string;
  cardinality: Cardinality;
}

export interface ActionTypeRead {
  apiName: string;
  displayName: string;
  targetObjectTypeApiName: string;
  definition: {
    parameters?: Array<{
      name: string;
      type: string;
      required?: boolean;
      allowed?: unknown[];
    }>;
    rules?: unknown[];
    effects?: unknown[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ObjectSummary {
  rid: string;
  typeApiName: string;
  title?: string | null;
  properties: Record<string, unknown>;
}

export interface ObjectSet {
  items: ObjectSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ObjectDetail {
  rid: string;
  typeApiName: string;
  properties: Record<string, unknown>;
  linkCounts: Array<{ linkTypeApiName: string; direction: "IN" | "OUT"; count: number }>;
}

export interface GraphView {
  nodes: Array<{ id: string; type: string; title?: string | null }>;
  edges: Array<{ source: string; target: string; type: string }>;
}

export interface InferredColumn {
  column: string;
  inferredType: string;
}

export interface ObjectMapping {
  objectTypeApiName: string;
  primaryKey: { column: string; property: string };
  properties: Array<{ column: string; property: string; transform?: string }>;
  links: Array<{
    linkTypeApiName: string;
    direction: string;
    target: {
      objectTypeApiName: string;
      matchColumn: string;
      matchProperty: string;
    };
  }>;
}

export interface DataSourceRead {
  id: string;
  name: string;
  kind: string;
  storagePath: string;
  schema: InferredColumn[];
  mappings: ObjectMapping[];
  stubOnMissingTarget: boolean;
  uploadedAt: string;
}

export interface IngestErrorRow {
  rowIndex: number;
  reason: string;
  raw?: Record<string, unknown>;
}

export interface IngestJobRead {
  id: string;
  dataSourceId: string;
  status: "pending" | "running" | "done" | "failed";
  createdNodes: number;
  updatedNodes: number;
  createdLinks: number;
  skippedRows: number;
  errorRows: IngestErrorRow[];
  startedAt: string;
  finishedAt?: string | null;
  errorMessage?: string | null;
}

export interface Health {
  status: "ok" | "degraded";
  mongo: Record<string, unknown> & { ok: boolean };
  neo4j: Record<string, unknown> & { ok: boolean; nodes?: number; edges?: number };
}
