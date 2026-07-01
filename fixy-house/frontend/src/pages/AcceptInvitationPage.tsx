import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiClient, extractErrorMessage } from "../api/client";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import type { AcceptInvitationResult } from "../types/api";

const acceptSchema = z.object({
  token: z.string().min(8, "초대 토큰이 필요합니다"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .optional()
    .or(z.literal("")),
  displayName: z.string().max(30).optional().or(z.literal("")),
});

type AcceptInput = z.infer<typeof acceptSchema>;

export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [tokenFromUrl] = useState(params.get("token") ?? "");
  const [emailFromUrl] = useState(params.get("email") ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AcceptInput>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      token: tokenFromUrl,
      email: emailFromUrl,
      password: "",
      displayName: "",
    },
  });

  useEffect(() => {
    if (tokenFromUrl) setValue("token", tokenFromUrl);
    if (emailFromUrl) setValue("email", emailFromUrl);
  }, [tokenFromUrl, emailFromUrl, setValue]);

  const mutation = useMutation({
    mutationFn: (input: AcceptInput) =>
      apiClient
        .post<AcceptInvitationResult>("/invitations/accept", input)
        .then((r) => r.data),
    onSuccess: async (data) => {
      setTokens({
        grantType: "Bearer",
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        refreshTokenExpiresAt: new Date(
          Date.now() + 14 * 86_400_000
        ).toISOString(),
      });
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        setUser({
          id: data.userId,
          email: emailFromUrl,
          displayName: "",
          role: "USER",
          lastLoginAt: null,
          createdAt: null,
        });
      }
      navigate(`/teams/${data.teamId}`, { replace: true });
    },
    onError: (err) =>
      setError(extractErrorMessage(err, "초대 수락에 실패했습니다")),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">팀 초대 수락</h1>
        <p className="mt-1 text-sm text-slate-500">
          관리자가 보낸 초대 토큰을 입력해 팀에 참여하세요.
        </p>

        <form
          onSubmit={handleSubmit((values) => {
            setError(null);
            mutation.mutate(values);
          })}
          className="mt-6 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-slate-700"
            >
              초대 토큰
            </label>
            <textarea
              id="token"
              rows={3}
              {...register("token")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="초대 토큰 붙여넣기"
            />
            {errors.token ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.token.message}
              </p>
            ) : null}
          </div>
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
              {...register("email")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="초대된 이메일"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
            처음이라면 비밀번호와 표시 이름을 함께 입력해 계정을 만듭니다.
          </div>
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-slate-700"
            >
              표시 이름 (신규 사용자)
            </label>
            <input
              id="displayName"
              type="text"
              {...register("displayName")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="표시 이름"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              비밀번호 (신규 사용자, 8자 이상)
            </label>
            <input
              id="password"
              type="password"
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

          {error ? (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? "수락 중…" : "초대 수락"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          <Link to="/login" className="hover:text-slate-900 hover:underline">
            이미 계정이 있어요
          </Link>
        </div>
      </div>
    </div>
  );
}
