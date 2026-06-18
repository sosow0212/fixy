import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { PageHeader } from "../components/PageHeader";
import { ErrorState } from "../components/AsyncStates";
import { extractErrorMessage } from "../api/client";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "표시 이름은 2자 이상이어야 합니다")
    .max(30, "표시 이름은 30자 이하여야 합니다"),
});

type ProfileInput = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요"),
    newPassword: z
      .string()
      .min(8, "새 비밀번호는 8자 이상이어야 합니다")
      .max(64),
    confirm: z.string(),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: "새 비밀번호가 일치하지 않습니다",
    path: ["confirm"],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (displayName: string) => authApi.updateProfile(displayName),
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setProfileMsg("표시 이름을 저장했어요.");
      setProfileErr(null);
    },
    onError: (err) => setProfileErr(extractErrorMessage(err, "저장 실패")),
  });

  const {
    register: registerPw,
    handleSubmit: handlePwSubmit,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirm: "",
    },
  });

  const pwMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPwMsg("비밀번호를 변경했어요. 다시 로그인해 주세요.");
      setPwErr(null);
      resetPw();
    },
    onError: (err) => setPwErr(extractErrorMessage(err, "변경 실패")),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="프로필"
        description="내 계정 정보와 비밀번호를 관리해요."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800">기본 정보</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">이메일</dt>
            <dd className="font-mono text-slate-800">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">권한</dt>
            <dd className="text-slate-800">{user?.role ?? "—"}</dd>
          </div>
        </dl>

        <form
          onSubmit={handleProfileSubmit((values) => {
            setProfileErr(null);
            setProfileMsg(null);
            profileMutation.mutate(values.displayName);
          })}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">
              표시 이름
            </label>
            <input
              type="text"
              {...registerProfile("displayName")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            />
            {profileErrors.displayName ? (
              <p className="mt-1 text-xs text-rose-600">
                {profileErrors.displayName.message}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={!profileDirty || profileMutation.isPending}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {profileMutation.isPending ? "저장 중…" : "저장"}
          </button>
        </form>
        {profileMsg ? (
          <p className="mt-2 text-xs text-emerald-700">{profileMsg}</p>
        ) : null}
        {profileErr ? <ErrorState message={profileErr} className="mt-2" /> : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800">비밀번호 변경</h2>
        <p className="mt-1 text-xs text-slate-500">
          변경하면 다른 세션에서 다시 로그인해야 해요.
        </p>
        <form
          onSubmit={handlePwSubmit((values) => {
            setPwErr(null);
            setPwMsg(null);
            pwMutation.mutate({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            });
          })}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              현재 비밀번호
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...registerPw("currentPassword")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            />
            {pwErrors.currentPassword ? (
              <p className="mt-1 text-xs text-rose-600">
                {pwErrors.currentPassword.message}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                새 비밀번호
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...registerPw("newPassword")}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
              />
              {pwErrors.newPassword ? (
                <p className="mt-1 text-xs text-rose-600">
                  {pwErrors.newPassword.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                확인
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...registerPw("confirm")}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
              />
              {pwErrors.confirm ? (
                <p className="mt-1 text-xs text-rose-600">
                  {pwErrors.confirm.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwMutation.isPending}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pwMutation.isPending ? "변경 중…" : "비밀번호 변경"}
            </button>
          </div>
        </form>
        {pwMsg ? <p className="mt-2 text-xs text-emerald-700">{pwMsg}</p> : null}
        {pwErr ? <ErrorState message={pwErr} className="mt-2" /> : null}
      </section>
    </div>
  );
}
