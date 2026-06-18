import { apiClient } from "./client";
import type { TokenResponse, UserSummary } from "../types/api";

export interface SignupBody {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export const authApi = {
  signup: (body: SignupBody) =>
    apiClient.post<TokenResponse>("/auth/signup", body).then((r) => r.data),
  login: (body: LoginBody) =>
    apiClient.post<TokenResponse>("/auth/login", body).then((r) => r.data),
  refresh: (refreshToken: string) =>
    apiClient
      .post<TokenResponse>("/auth/refresh", { refreshToken })
      .then((r) => r.data),
  me: () => apiClient.get<UserSummary>("/users/me").then((r) => r.data),
  updateProfile: (displayName: string) =>
    apiClient
      .patch<UserSummary>("/users/me", { displayName })
      .then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient
      .patch<void>("/users/me/password", { currentPassword, newPassword })
      .then((r) => r.data),
};
