import { AppError } from "@/lib/error";
import BaseService from "@/services/base.service";
import { unwrapRepositoryResult } from "@/services/repository-result";
import { parseBody, parseInput } from "@/services/validation";
import { ListLeadCapturesDto, SubmitLeadCaptureDto } from "./dto";
import * as repository from "./repository";

export default class FormsService extends BaseService {
	async listLeadCaptures() {
		try {
			this.context.header("Cache-Control", "no-store");
			const input = parseInput(ListLeadCapturesDto, this.context.req.query());
			return this.success({
				status: 200,
				message: "Lead captures retrieved",
				data: unwrapRepositoryResult(await repository.listLeadCaptures(input.offset)),
			});
		} catch (error) {
			return this.failFromError(
				error instanceof AppError
					? error
					: AppError.internalServerError("Failed to load leads", "LEADS_FETCH_FAILED"),
			);
		}
	}
	async submitLeadCapture() {
		try {
			this.context.header("Cache-Control", "no-store");
			const input = await parseBody(this.context, SubmitLeadCaptureDto);
			const lead = unwrapRepositoryResult(await repository.createLeadCapture(input));
			if (!lead) throw AppError.internalServerError("Failed to submit form", "FORM_SUBMIT_FAILED");
			return this.success({ status: 201, message: "Form submitted", data: lead });
		} catch (error) {
			// Database errors can contain insert parameters; don't expose contact data in logs/responses.
			return this.failFromError(
				error instanceof AppError
					? error
					: AppError.internalServerError("Failed to submit form", "FORM_SUBMIT_FAILED"),
			);
		}
	}
}
