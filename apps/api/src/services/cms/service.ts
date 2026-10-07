import { AppError } from "@/lib/error";
import BaseService from "@/services/base.service";
import { unwrapRepositoryResult } from "@/services/repository-result";
import { parseBody, parseInput } from "@/services/validation";
import {
	ActivateVersionDto,
	CmsSectionsDto,
	HistoryQueryDto,
	PublishDraftDto,
	SaveDraftDto,
	VersionIdDto,
} from "./dto";
import * as repository from "./repository";

export default class CmsService extends BaseService {
	async getHistory() {
		try {
			const input = parseInput(HistoryQueryDto, this.context.req.query());
			this.context.header("Cache-Control", "no-store");
			return this.success({
				data: unwrapRepositoryResult(await repository.getHistory(input.offset)),
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async getVersion() {
		try {
			const publicId = parseInput(VersionIdDto, this.context.req.param("publicId"));
			const data = unwrapRepositoryResult(await repository.getVersion(publicId));
			if (!data) throw AppError.notFound("Version not found");
			this.context.header("Cache-Control", "no-store");
			return this.success({ data });
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async activateVersion() {
		try {
			const input = await parseBody(this.context, ActivateVersionDto);
			const result = unwrapRepositoryResult(
				await repository.activateVersion(this.context.get("authUser").id, input),
			);
			if (result.status === "forbidden") throw AppError.forbidden("Admin access required");
			if (result.status === "not_found") throw AppError.notFound("Version not found");
			if (result.status === "conflict")
				throw AppError.conflict(
					"Content has changed. Reload version history before activating.",
					"CMS_VERSION_CONFLICT",
				);
			if (result.status === "invalid_content")
				throw AppError.badRequest(
					"This version contains invalid content and cannot be activated",
					"CMS_INVALID_CONTENT",
				);
			return this.success({ message: "Version activated", data: result.data });
		} catch (error) {
			return this.failFromError(error);
		}
	}
	async getEditor() {
		try {
			this.context.header("Cache-Control", "no-store");
			return this.success({ data: unwrapRepositoryResult(await repository.getEditor()) });
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async getPublished() {
		try {
			this.context.header("Cache-Control", "no-store");
			return this.success({ data: unwrapRepositoryResult(await repository.getPublished()) });
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async saveDraft() {
		try {
			const input = await parseBody(this.context, SaveDraftDto);
			const result = unwrapRepositoryResult(
				await repository.saveDraft(this.context.get("authUser").id, input),
			);
			if (result.status === "forbidden") throw AppError.forbidden("Admin access required");
			if (result.status === "conflict")
				throw AppError.conflict(
					"Content has changed. Reload the editor before saving.",
					"CMS_VERSION_CONFLICT",
				);
			if (result.status === "invalid_order")
				throw AppError.badRequest(
					"Section orders must be unique across the whole page",
					"CMS_INVALID_ORDER",
				);
			return this.success({ message: "Draft saved", data: result.data });
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async publishDraft() {
		try {
			const input = await parseBody(this.context, PublishDraftDto);
			const draft = unwrapRepositoryResult(await repository.getEditor());
			if (draft.version?.status !== "pending") throw AppError.notFound("Draft not found");
			if (
				draft.version.publicId !== input.version.publicId ||
				draft.version.updatedAt.getTime() !== new Date(input.version.updatedAt).getTime()
			) {
				throw AppError.conflict(
					"Content has changed. Reload the editor before publishing.",
					"CMS_VERSION_CONFLICT",
				);
			}
			parseInput(CmsSectionsDto, draft.sections);
			const result = unwrapRepositoryResult(
				await repository.publishDraft(this.context.get("authUser").id, input),
			);
			if (result.status === "forbidden") throw AppError.forbidden("Admin access required");
			if (result.status === "not_found") throw AppError.notFound("Draft not found");
			if (result.status === "conflict")
				throw AppError.conflict(
					"Content has changed. Reload the editor before publishing.",
					"CMS_VERSION_CONFLICT",
				);
			return this.success({ message: "Draft published", data: result.data });
		} catch (error) {
			return this.failFromError(error);
		}
	}
}
