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
		<main className="grid min-h-screen place-items-center px-5 py-8">
			<Card
				className="w-full max-w-[440px] p-10 max-[480px]:p-7"
				aria-labelledby="login-title"
			>
				<span className="text-[28px] font-extrabold tracking-[-1.5px] [&_span]:text-accent">
					Login<span>.</span>
				</span>
				<h1
					className="mt-5 mb-4 text-[30px] leading-[1.2] font-semibold tracking-[-1px]"
					id="login-title"
				>
					Welcome back!
				</h1>
				<form
					className="mt-[30px] flex flex-col gap-[22px]"
					onSubmit={handleSubmit}
				>
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
