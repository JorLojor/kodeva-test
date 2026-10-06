import { Alert, Button } from "@jortemplate/ui";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./features/auth/hooks";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { LoginPage } from "./pages/login/LoginPage";

export function App() {
  const session = useSession();
  if (session.isPending)
    return (
      <main className="status-page" role="status">
        Memeriksa sesi…
      </main>
    );
  if (session.isError) {
    return (
      <main className="status-page">
        <Alert tone="danger">
          Tidak bisa terhubung. Coba lagi setelah koneksi tersedia.
        </Alert>
        <Button
          type="button"
          onClick={() => {
            void session.refetch();
          }}
        >
          Coba lagi
        </Button>
      </main>
    );
  }
  const authenticated = Boolean(session.data);
  return (
    <Routes>
      <Route
        path="/login"
        element={authenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          authenticated ? <DashboardPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="*"
        element={<Navigate to={authenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}
