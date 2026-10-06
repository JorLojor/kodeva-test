import { z } from "zod";

export const LoginDto = z.strictObject({
	username: z.string().trim().toLowerCase().min(1).max(254),
	password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginDto>;
