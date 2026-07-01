import { apiClient } from "./client";
import type { TokenResponse, UserSummary } from "../types/api";

export interface LoginBody {
  email: string;
  password: string;
}

export const authApi = {
  login: (body: LoginBody) =>
    apiClient.post<TokenResponse>("/auth/login", body).then((r) => r.data),
  me: () => apiClient.get<UserSummary>("/users/me").then((r) => r.data),
};
