import { z } from "zod";

export const usernameSchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(3)
	.max(50)
	.regex(/^[a-z0-9_.-]+$/);
export const passwordSchema = z.string().min(12).max(128);
export const CreateUserDto = z.strictObject({
	username: usernameSchema,
	email: z.email().trim().toLowerCase().max(254),
	password: passwordSchema,
	role: z.enum(["admin", "user"]).default("user"),
});
export const UpdateUserDto = CreateUserDto.omit({ role: true })
	.partial()
	.extend({ role: z.enum(["admin", "user"]).optional() })
	.refine((value) => Object.keys(value).length > 0, "Provide at least one field");
export const UserIdDto = z.uuid();
export const ListUsersDto = z.strictObject({
	page: z.coerce.number().int().min(1).max(1_000_000).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().trim().max(100).default(""),
});
export type CreateUserInput = z.infer<typeof CreateUserDto>;
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;
export type ListUsersInput = z.infer<typeof ListUsersDto>;
