import { apiClient } from "./client";
import type { Agent, AgentStatus, AgentWithKey } from "../types/api";

export const agentsApi = {
  listByTeam: (teamId: string) =>
    apiClient.get<Agent[]>(`/teams/${teamId}/agents`).then((r) => r.data),
  create: (teamId: string, name: string) =>
    apiClient
      .post<AgentWithKey>(`/teams/${teamId}/agents`, { name })
      .then((r) => r.data),
  rotateKey: (agentId: string) =>
    apiClient
      .post<AgentWithKey>(`/agents/${agentId}/rotate-key`)
      .then((r) => r.data),
  update: (agentId: string, body: { name?: string; status?: AgentStatus }) =>
    apiClient.patch<Agent>(`/agents/${agentId}`, body).then((r) => r.data),
  remove: (agentId: string) =>
    apiClient.delete<void>(`/agents/${agentId}`).then((r) => r.data),
};
