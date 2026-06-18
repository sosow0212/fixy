import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { extractErrorMessage } from "../api/client";

const signupSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .max(64, "비밀번호는 64자 이하여야 합니다"),
  displayName: z
    .string()
    .min(2, "표시 이름은 2자 이상이어야 합니다")
    .max(30, "표시 이름은 30자 이하여야 합니다"),
});

type SignupInput = z.infer<typeof signupSchema>;

export function SignupPage() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
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
      navigate("/dashboard", { replace: true });
    },
    onError: (err) =>
      setFormError(extractErrorMessage(err, "가입에 실패했습니다")),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    signupMutation.mutate(values);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">계정 만들기</h1>
        <p className="mt-1 text-sm text-slate-500">
          팀을 만들고 픽시 에이전트를 붙이면 바로 시작할 수 있어요.
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
              htmlFor="displayName"
              className="block text-sm font-medium text-slate-700"
            >
              표시 이름
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="nickname"
              {...register("displayName")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="표시 이름"
            />
            {errors.displayName ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.displayName.message}
              </p>
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
              autoComplete="new-password"
              {...register("password")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="8자 이상"
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
            disabled={signupMutation.isPending}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signupMutation.isPending ? "가입 중…" : "계정 만들기"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <Link to="/login" className="hover:text-slate-900 hover:underline">
            이미 계정이 있어요
          </Link>
        </div>
      </div>
    </div>
  );
}
