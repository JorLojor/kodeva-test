import { uploadFile } from "@/lib/cdn";
import { AppError } from "@/lib/error";
import BaseService from "@/services/base.service";

export default class UploadsService extends BaseService {
	async image() {
		try {
			this.context.header("Cache-Control", "no-store");
			let form: FormData;
			try {
				form = await this.context.req.raw.formData();
			} catch {
				throw AppError.badRequest("Expected multipart form data", "INVALID_UPLOAD");
			}
			const files = form.getAll("file");
			const file = files[0];
			if (files.length !== 1 || !(file instanceof File))
				throw AppError.badRequest("Provide one image in the file field", "INVALID_UPLOAD");
			if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
				throw AppError.badRequest("Allowed images: JPEG, PNG, WebP", "INVALID_FILE_TYPE");
			return this.success({ status: 201, message: "Image uploaded", data: await uploadFile(file) });
		} catch (error) {
			return this.failFromError(error);
		}
	}
}
