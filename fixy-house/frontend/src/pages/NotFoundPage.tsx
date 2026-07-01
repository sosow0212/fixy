import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          404
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          주소가 잘못되었거나, 페이지가 삭제되었을 수 있어요.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link
            to="/dashboard"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            대시보드로
          </Link>
          <Link
            to="/teams"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            팀 목록
          </Link>
        </div>
      </div>
    </div>
  );
}
