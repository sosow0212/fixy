import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { AcceptInvitationPage } from "./pages/AcceptInvitationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TeamsPage } from "./pages/TeamsPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { SessionsListPage } from "./pages/SessionsListPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { WorkLogsPage } from "./pages/WorkLogsPage";
import { DocumentsListPage } from "./pages/DocumentsListPage";
import { DocumentEditorPage } from "./pages/DocumentEditorPage";
import { SecretsPage } from "./pages/SecretsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  if (!accessToken) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />
      <Route path="/invitations/accept" element={<AcceptInvitationPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        <Route
          path="/teams/:teamId/sessions"
          element={<SessionsListPage />}
        />
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="/worklogs" element={<WorkLogsPage />} />
        <Route path="/worklogs/:teamId" element={<WorkLogsPage />} />
        <Route path="/documents" element={<DocumentsListPage />} />
        <Route path="/documents/:teamId" element={<DocumentsListPage />} />
        <Route
          path="/documents/page/:teamId/:pageId"
          element={<DocumentEditorPage />}
        />
        <Route path="/secrets" element={<SecretsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
