export type UserRole = "USER" | "ADMIN";

export type TeamRole = "OWNER" | "MANAGER" | "MEMBER";

export type SessionStatus = "ACTIVE" | "IDLE" | "COMPLETED" | "FAILED";

export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

export type ToolCallStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Signal = "COMPLAINT" | "CORRECTION" | "INSIGHT" | "SUCCESS" | "NOTE";

export type WorkLogStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export type WorkLogPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DocumentVisibility = "TEAM" | "PRIVATE";

export type SecretScope = "PERSONAL" | "TEAM";

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

export interface AcceptInvitationResult {
  newUser: boolean;
  accessToken: string;
  refreshToken: string;
  userId: string;
  teamId: string;
}

export interface Session {
  id: string;
  agentId: string;
  teamId: string;
  sessionIdFromAgent: string;
  userIdOnAgent: string | null;
  projectName: string | null;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  toolCallCount: number;
  episodeCount: number;
  summary: string | null;
  lastActivityAt: string;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  toolCallId: string | null;
  sequence: number;
  createdAt: string;
}

export interface SessionToolCall {
  id: string;
  sessionId: string;
  messageId: string | null;
  toolName: string;
  argsJson: string;
  resultJson: string | null;
  status: ToolCallStatus;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface SessionEpisode {
  id: string;
  episodeId: string;
  sessionId: string;
  agentId: string;
  teamId: string;
  ts: string;
  signal: Signal;
  summary: string;
  tags: string[];
  files: string[];
  projectName: string | null;
  promotedTo: string | null;
}

export interface SessionDetail {
  session: Session;
  messages: SessionMessage[];
  toolCalls: SessionToolCall[];
  episodes: SessionEpisode[];
}

export interface WorkLog {
  id: string;
  teamId: string;
  userId: string;
  sessionId: string | null;
  parentId: string | null;
  title: string;
  description: string | null;
  status: WorkLogStatus;
  priority: WorkLogPriority;
  tags: string[];
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkLogPage {
  content: WorkLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Space {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  orderIndex: number;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DocPageSummary {
  id: string;
  teamId: string;
  spaceId: string;
  parentId: string | null;
  title: string;
  orderIndex: number;
  visibility: DocumentVisibility;
  authorUserId: string;
  lastEditorUserId: string;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DocPageDetail extends DocPageSummary {
  content: string;
}

export interface SecretSummary {
  id: string;
  ownerUserId: string;
  key: string;
  scope: SecretScope;
  teamId: string | null;
  description: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SecretReveal {
  id: string;
  key: string;
  scope: SecretScope;
  plaintext: string;
}

export interface ApiErrorBody {
  name: string;
  errorCode: string;
  message: string;
}
