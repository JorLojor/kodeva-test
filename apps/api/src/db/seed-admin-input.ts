import { parseArgs } from "node:util";
import { CreateUserDto } from "@/services/user-management/dto";

export const seedAdminUsage = `Usage:
  bun run --cwd apps/api db:seed-admin --username admin --email admin@example.com --password '<minimum 12 characters>'

Alternatively set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in apps/api/.env.
CLI flags override environment values.`;

type AdminEnvironment = Record<string, string | undefined>;

export function readSeedAdminInput(args: string[], environment: AdminEnvironment) {
	const { values } = parseArgs({
		args,
		strict: true,
		allowPositionals: false,
		options: {
			username: { type: "string" },
			email: { type: "string" },
			password: { type: "string" },
			help: { type: "boolean", short: "h" },
		},
	});
	if (values.help) return null;

	const input = {
		username: values.username ?? environment.ADMIN_USERNAME,
		email: values.email ?? environment.ADMIN_EMAIL,
		password: values.password ?? environment.ADMIN_PASSWORD,
		role: "admin" as const,
	};
	const missing = (["username", "email", "password"] as const).filter((key) => !input[key]);
	if (missing.length) {
		throw new Error(`Missing admin credentials: ${missing.join(", ")}.\n${seedAdminUsage}`);
	}

	const parsed = CreateUserDto.safeParse(input);
	if (!parsed.success) {
		throw new Error(
			parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
		);
	}
	return parsed.data;
}
