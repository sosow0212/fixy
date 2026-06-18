import { apiClient } from "./client";
import type {
  DocPageDetail,
  DocPageSummary,
  DocumentVisibility,
  Space,
} from "../types/api";

export interface CreateSpaceBody {
  name: string;
  slug?: string | null;
  description?: string | null;
  icon?: string | null;
  orderIndex?: number;
}

export interface UpdateSpaceBody {
  name?: string;
  description?: string | null;
  icon?: string | null;
  orderIndex?: number;
}

export interface CreateDocPageBody {
  title: string;
  content?: string | null;
  parentId?: string | null;
  visibility?: DocumentVisibility;
  tags?: string[];
  orderIndex?: number;
}

export interface UpdateDocPageBody {
  title?: string;
  content?: string | null;
  visibility?: DocumentVisibility;
  tags?: string[] | null;
  orderIndex?: number;
  parentId?: string | null;
}

export const documentsApi = {
  listSpaces: (teamId: string) =>
    apiClient.get<Space[]>(`/teams/${teamId}/spaces`).then((r) => r.data),
  createSpace: (teamId: string, body: CreateSpaceBody) =>
    apiClient.post<Space>(`/teams/${teamId}/spaces`, body).then((r) => r.data),
  updateSpace: (teamId: string, spaceId: string, body: UpdateSpaceBody) =>
    apiClient
      .patch<Space>(`/teams/${teamId}/spaces/${spaceId}`, body)
      .then((r) => r.data),
  removeSpace: (teamId: string, spaceId: string) =>
    apiClient
      .delete<void>(`/teams/${teamId}/spaces/${spaceId}`)
      .then((r) => r.data),
  listPages: (teamId: string, spaceId: string, parentId?: string) =>
    apiClient
      .get<DocPageSummary[]>(`/teams/${teamId}/spaces/${spaceId}/documents`, {
        params: parentId ? { parentId } : {},
      })
      .then((r) => r.data),
  createPage: (
    teamId: string,
    spaceId: string,
    body: CreateDocPageBody
  ) =>
    apiClient
      .post<DocPageSummary>(`/teams/${teamId}/spaces/${spaceId}/documents`, body)
      .then((r) => r.data),
  getPage: (teamId: string, pageId: string) =>
    apiClient
      .get<DocPageDetail>(`/teams/${teamId}/documents/${pageId}`)
      .then((r) => r.data),
  updatePage: (teamId: string, pageId: string, body: UpdateDocPageBody) =>
    apiClient
      .patch<DocPageDetail>(`/teams/${teamId}/documents/${pageId}`, body)
      .then((r) => r.data),
  removePage: (teamId: string, pageId: string) =>
    apiClient
      .delete<void>(`/teams/${teamId}/documents/${pageId}`)
      .then((r) => r.data),
};
