import { apiClient } from "./client";
import type { SecretReveal, SecretScope, SecretSummary } from "../types/api";

export interface CreateSecretBody {
  key: string;
  value: string;
  scope?: SecretScope;
  teamId?: string | null;
  description?: string | null;
}

export interface UpdateSecretBody {
  value?: string;
  description?: string | null;
}

export const secretsApi = {
  list: () => apiClient.get<SecretSummary[]>("/secrets").then((r) => r.data),
  create: (body: CreateSecretBody) =>
    apiClient.post<SecretSummary>("/secrets", body).then((r) => r.data),
  update: (secretId: string, body: UpdateSecretBody) =>
    apiClient
      .patch<SecretSummary>(`/secrets/${secretId}`, body)
      .then((r) => r.data),
  remove: (secretId: string) =>
    apiClient.delete<void>(`/secrets/${secretId}`).then((r) => r.data),
  reveal: (secretId: string) =>
    apiClient
      .get<SecretReveal>(`/secrets/${secretId}/reveal`)
      .then((r) => r.data),
};
