import { Alert, Button, Card, FormField, Input } from "@jortemplate/ui";
import type { FormEvent } from "react";
import { useLogin } from "../../features/auth/hooks";

export function LoginPage() {
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    login.mutate({
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    });
  }

  return (
    <main className="login-page">
      <Card className="login-card" aria-labelledby="login-title">
        <span className="brand">
          Login<span>.</span>
        </span>
        <h1 id="login-title">Welcome back!</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <FormField htmlFor="username" label="Username atau email">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="Username atau email kamu"
              maxLength={254}
              required
              disabled={login.isPending}
            />
          </FormField>
          <FormField htmlFor="password" label="Password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan password"
              maxLength={128}
              required
              disabled={login.isPending}
            />
          </FormField>
          {login.isError && <Alert tone="danger">{login.error.message}</Alert>}
          <Button type="submit" loading={login.isPending}>
            {login.isPending ? "Sedang masuk…" : "Masuk"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
