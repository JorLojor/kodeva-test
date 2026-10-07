import { z } from "zod";
import { AttributionDto } from "@/services/attribution";
export const CreateOrderDto = z.strictObject({
	attribution: AttributionDto,
	buyer: z.strictObject({
		name: z.string().trim().min(1).max(150),
		email: z.email().max(254),
		company: z.string().trim().max(150),
	}),
	items: z
		.array(
			z.strictObject({
				productId: z.string().min(1).max(100),
				packageId: z.string().min(1).max(100),
				quantity: z.number().int().min(1).max(100),
			}),
		)
		.min(1)
		.max(18),
});
export const ReviewDto = z
	.strictObject({
		decision: z.enum(["paid", "rejected"]),
		reason: z.string().trim().max(1000).default(""),
		version: z.iso.datetime(),
	})
	.refine((v) => v.decision !== "rejected" || v.reason.length > 0, "Alasan penolakan wajib diisi");
export const ListDto = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) });
export type CreateOrderInput = z.infer<typeof CreateOrderDto>;
