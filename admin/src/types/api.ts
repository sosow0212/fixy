export type UserRole = "USER" | "ADMIN";

export type TeamRole = "OWNER" | "MANAGER" | "MEMBER";

export type AgentStatus = "ACTIVE" | "DISABLED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface TokenResponse {
  grantType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  description: string | null;
  myRole: TeamRole;
  createdAt: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
}

export interface Agent {
  id: string;
  teamId: string;
  name: string;
  status: AgentStatus;
  agentKeyLastFour: string | null;
  lastConnectedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgentWithKey extends Agent {
  agentKey: string;
}

export interface Invitation {
  id: string;
  teamId: string;
  invitedEmail: string;
  role: TeamRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  invitedByUserId: string;
  acceptedByUserId: string | null;
  createdAt: string | null;
  token: string | null;
}

export interface ApiErrorBody {
  name: string;
  errorCode: string;
  message: string;
}
