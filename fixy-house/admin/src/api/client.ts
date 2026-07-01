import axios, { AxiosError, type AxiosInstance } from "axios";
import { useAuthStore } from "../stores/authStore";
import type { ApiErrorBody } from "../types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let redirectingToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && !redirectingToLogin) {
      redirectingToLogin = true;
      useAuthStore.getState().clear();
      const target = `${window.location.pathname}${window.location.search}`;
      if (!target.startsWith("/login")) {
        window.location.assign(`/login?next=${encodeURIComponent(target)}`);
      }
      setTimeout(() => {
        redirectingToLogin = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback = "요청 처리에 실패했습니다"): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data;
    if (body?.message) return body.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
