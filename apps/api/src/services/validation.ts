import type { Context } from "hono";
import type { z } from "zod";
import { AppError } from "@/lib/error";

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw AppError.badRequest(
			result.error.issues
				.map((issue) => `${issue.path.map(String).join(".") || "input"}: ${issue.message}`)
				.join("; "),
			"VALIDATION_ERROR",
		);
	}
	return result.data;
}

export async function parseBody<T>(context: Context, schema: z.ZodType<T>): Promise<T> {
	let input: unknown;
	try {
		input = await context.req.json();
	} catch {
		throw AppError.badRequest("Invalid JSON body", "INVALID_JSON");
	}
	return parseInput(schema, input);
}
