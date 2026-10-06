import { Alert, Button } from "@jortemplate/ui";
import { useLogout } from "../../features/auth/hooks";

export function DashboardPage() {
  const logout = useLogout();
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <span className="brand">
          jorTemplate<span>.</span>
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => logout.mutate()}
          loading={logout.isPending}
        >
          {logout.isPending ? "Sedang keluar…" : "Keluar"}
        </Button>
      </header>
      {logout.isError && (
        <Alert tone="danger" className="dashboard-alert">
          {logout.error.message}
        </Alert>
      )}
      <main className="dashboard-content" aria-label="Dashboard" />
    </div>
  );
}
