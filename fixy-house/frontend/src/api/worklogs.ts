import { apiClient } from "./client";
import type {
  WorkLog,
  WorkLogPage,
  WorkLogPriority,
  WorkLogStatus,
} from "../types/api";

export interface ListWorkLogsParams {
  statuses?: WorkLogStatus[];
  priorities?: WorkLogPriority[];
  assigneeUserId?: string;
  search?: string;
  dueBefore?: string;
  page?: number;
  size?: number;
}

export interface CreateWorkLogBody {
  title: string;
  description?: string | null;
  status?: WorkLogStatus;
  priority?: WorkLogPriority;
  tags?: string[];
  dueDate?: string | null;
  parentId?: string | null;
  sessionId?: string | null;
  assigneeUserId?: string | null;
}

export interface UpdateWorkLogBody {
  title?: string;
  description?: string | null;
  status?: WorkLogStatus;
  priority?: WorkLogPriority;
  tags?: string[] | null;
  dueDate?: string | null;
}

export const worklogsApi = {
  list: (teamId: string, params: ListWorkLogsParams = {}) =>
    apiClient
      .get<WorkLogPage>(`/teams/${teamId}/worklogs`, { params })
      .then((r) => r.data),
  get: (workLogId: string) =>
    apiClient.get<WorkLog>(`/worklogs/${workLogId}`).then((r) => r.data),
  create: (teamId: string, body: CreateWorkLogBody) =>
    apiClient
      .post<WorkLog>(`/teams/${teamId}/worklogs`, body)
      .then((r) => r.data),
  update: (workLogId: string, body: UpdateWorkLogBody) =>
    apiClient.patch<WorkLog>(`/worklogs/${workLogId}`, body).then((r) => r.data),
  remove: (workLogId: string) =>
    apiClient.delete<void>(`/worklogs/${workLogId}`).then((r) => r.data),
};
