import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { ManagerDashboardPage } from "./pages/ManagerDashboardPage";
import { TeamsManagePage } from "./pages/TeamsManagePage";
import { TeamDetailManagePage } from "./pages/TeamDetailManagePage";
import { InvitationsPage } from "./pages/InvitationsPage";
import { AgentsPage } from "./pages/AgentsPage";
import { MembersPage } from "./pages/MembersPage";
import { SecretAuditLogPage } from "./pages/SecretAuditLogPage";
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
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<ManagerDashboardPage />} />
        <Route path="/teams" element={<TeamsManagePage />} />
        <Route path="/teams/:teamId" element={<TeamDetailManagePage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/audit/secrets" element={<SecretAuditLogPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
