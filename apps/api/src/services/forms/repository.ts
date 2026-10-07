import { desc, isNull } from "drizzle-orm";
import db from "@/db";
import { repositoryResult } from "@/db/repository-result";
import { leadcapture } from "@/db/schemas/table/leadcapture";
import type { SubmitLeadCaptureInput } from "./dto";

export function createLeadCapture(input: SubmitLeadCaptureInput) {
	return repositoryResult(async () => {
		const [row] = await db
			.insert(leadcapture)
			.values(input)
			.returning({ publicId: leadcapture.publicId });
		return row;
	});
}

export function listLeadCaptures(offset: number) {
	return repositoryResult(async () => {
		const items = await db
			.select({
				publicId: leadcapture.publicId,
				nama: leadcapture.nama,
				attribution: leadcapture.attribution,
				email: leadcapture.email,
				nomorWa: leadcapture.nomorWa,
				createdAt: leadcapture.createdAt,
			})
			.from(leadcapture)
			.where(isNull(leadcapture.deletedAt))
			.orderBy(desc(leadcapture.createdAt), desc(leadcapture.id))
			.limit(21)
			.offset(offset);
		return { items: items.slice(0, 20), hasMore: items.length > 20 };
	});
}
