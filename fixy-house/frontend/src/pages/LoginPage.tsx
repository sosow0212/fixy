import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { extractErrorMessage } from "../api/client";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginPage() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (tokens) => {
      setTokens(tokens);
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        setUser({
          id: "",
          email: "",
          displayName: "",
          role: "USER",
          lastLoginAt: null,
          createdAt: null,
        });
      }
      queryClient.clear();
      navigate(next, { replace: true });
    },
    onError: (err) => setFormError(extractErrorMessage(err, "로그인에 실패했습니다")),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    loginMutation.mutate(values);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">fixy-house 로그인</h1>
        <p className="mt-1 text-sm text-slate-500">
          픽시 에이전트가 모은 데이터와 팀 운영 도구.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="you@example.com"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="비밀번호"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || loginMutation.isPending}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loginMutation.isPending ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <Link to="/signup" className="hover:text-slate-900 hover:underline">
            계정 만들기
          </Link>
          <span>관리자 화면은 별도 배포본</span>
        </div>
      </div>
    </div>
  );
}
