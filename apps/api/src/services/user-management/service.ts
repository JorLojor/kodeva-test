import { AppError } from "@/lib/error";
import BaseService from "@/services/base.service";
import { unwrapRepositoryResult, unwrapUserWriteResult } from "@/services/repository-result";
import {
	CreateUserDto,
	ListUsersDto,
	UpdateUserDto,
	UserIdDto,
} from "@/services/user-management/dto";
import * as repository from "@/services/user-management/repository";
import { parseBody, parseInput } from "@/services/validation";

export default class UserManagementService extends BaseService {
	static async createAccount(input: unknown) {
		const validated = parseInput(CreateUserDto, input);
		const password = await Bun.password.hash(validated.password, { algorithm: "argon2id" });
		const user = unwrapUserWriteResult(await repository.createUser({ ...validated, password }));
		if (!user) throw AppError.internalServerError("Failed to create user");
		return user;
	}

	async list() {
		try {
			const input = parseInput(ListUsersDto, this.context.req.query());
			const { rows, total } = unwrapRepositoryResult(await repository.listUsers(input));
			return this.success({
				data: rows,
				pagination: {
					currentPage: input.page,
					pageLimit: input.limit,
					total,
					totalPages: Math.max(1, Math.ceil(total / input.limit)),
				},
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async find() {
		try {
			const publicId = parseInput(UserIdDto, this.context.req.param("publicId"));
			return this.success({
				data: this.requireFound(
					unwrapRepositoryResult(await repository.findUser(publicId)),
					"User",
				),
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async create() {
		try {
			const input = await parseBody(this.context, CreateUserDto);
			const user = await UserManagementService.createAccount(input);
			return this.success({
				status: 201,
				message: "User created",
				data: user,
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async update() {
		try {
			const publicId = parseInput(UserIdDto, this.context.req.param("publicId"));
			const input = await parseBody(this.context, UpdateUserDto);
			if (input.password !== undefined)
				input.password = await Bun.password.hash(input.password, { algorithm: "argon2id" });
			const result = unwrapUserWriteResult(await repository.updateUser(publicId, input));
			if (result.status === "not_found") throw AppError.notFound("User not found");
			if (result.status === "last_admin") throw AppError.conflict("Cannot demote the last admin");
			return this.success({
				message: "User updated",
				data: this.requireFound(result.data, "User"),
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async delete() {
		try {
			const publicId = parseInput(UserIdDto, this.context.req.param("publicId"));
			const result = unwrapRepositoryResult(await repository.deleteUser(publicId));
			if (result.status === "not_found") throw AppError.notFound("User not found");
			if (result.status === "last_admin") throw AppError.conflict("Cannot delete the last admin");
			return this.success({ message: "User deleted" });
		} catch (error) {
			return this.failFromError(error);
		}
	}
}
