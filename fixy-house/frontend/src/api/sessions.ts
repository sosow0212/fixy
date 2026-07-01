import { apiClient } from "./client";
import type {
  Session,
  SessionDetail,
  SessionStatus,
} from "../types/api";

export interface ListSessionsParams {
  statuses?: SessionStatus[];
  projectName?: string;
  limit?: number;
}

export const sessionsApi = {
  listByTeam: (teamId: string, params: ListSessionsParams = {}) =>
    apiClient
      .get<Session[]>(`/teams/${teamId}/sessions`, { params })
      .then((r) => r.data),
  get: (sessionId: string) =>
    apiClient.get<SessionDetail>(`/sessions/${sessionId}`).then((r) => r.data),
  update: (
    sessionId: string,
    body: { summary?: string | null; tags?: string[] | null }
  ) =>
    apiClient
      .patch<Session>(`/sessions/${sessionId}`, body)
      .then((r) => r.data),
  remove: (sessionId: string) =>
    apiClient.delete<void>(`/sessions/${sessionId}`).then((r) => r.data),
};
