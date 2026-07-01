import { apiClient } from "./client";
import type { Invitation, TeamRole } from "../types/api";

export interface InviteMemberBody {
  email: string;
  role: TeamRole;
}

export const invitationsApi = {
  listByTeam: (teamId: string) =>
    apiClient
      .get<Invitation[]>(`/teams/${teamId}/invitations`)
      .then((r) => r.data),
  create: (teamId: string, body: InviteMemberBody) =>
    apiClient
      .post<Invitation>(`/teams/${teamId}/invitations`, body)
      .then((r) => r.data),
  revoke: (teamId: string, invitationId: string) =>
    apiClient
      .delete<void>(`/teams/${teamId}/invitations/${invitationId}`)
      .then((r) => r.data),
};
