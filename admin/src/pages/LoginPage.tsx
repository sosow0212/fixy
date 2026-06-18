import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
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
          role: "ADMIN",
          lastLoginAt: null,
          createdAt: null,
        });
      }
      navigate(next, { replace: true });
    },
    onError: (err) => setError(extractErrorMessage(err, "로그인 실패")),
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    mutation.mutate(values);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              fixy admin
            </h1>
            <p className="text-xs text-slate-500">팀 매니저 콘솔</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="admin@team.io"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="비밀번호"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-400">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {error ? (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? "로그인 중…" : "관리자 로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
