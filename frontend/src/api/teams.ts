import { apiClient } from "./client";
import type { Team, TeamMember, TeamRole } from "../types/api";

export interface CreateTeamBody {
  name: string;
  description?: string | null;
  slug?: string | null;
}

export const teamsApi = {
  list: () => apiClient.get<Team[]>("/teams").then((r) => r.data),
  get: (teamId: string) =>
    apiClient.get<Team>(`/teams/${teamId}`).then((r) => r.data),
  create: (body: CreateTeamBody) =>
    apiClient.post<Team>("/teams", body).then((r) => r.data),
  update: (
    teamId: string,
    body: { name?: string; description?: string | null }
  ) =>
    apiClient.patch<Team>(`/teams/${teamId}`, body).then((r) => r.data),
  remove: (teamId: string) =>
    apiClient.delete<void>(`/teams/${teamId}`).then((r) => r.data),
  members: (teamId: string) =>
    apiClient
      .get<TeamMember[]>(`/teams/${teamId}/members`)
      .then((r) => r.data),
  changeMemberRole: (teamId: string, targetUserId: string, role: TeamRole) =>
    apiClient
      .patch<TeamMember>(`/teams/${teamId}/members/${targetUserId}`, { role })
      .then((r) => r.data),
  removeMember: (teamId: string, targetUserId: string) =>
    apiClient
      .delete<void>(`/teams/${teamId}/members/${targetUserId}`)
      .then((r) => r.data),
};
