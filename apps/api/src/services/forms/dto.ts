import type { LeadCaptureInput } from "@jortemplate/types";
import { z } from "zod";
import { AttributionDto } from "@/services/attribution";

export const SubmitLeadCaptureDto = z.strictObject({
	attribution: AttributionDto,
	nama: z.string().trim().min(1).max(150),
	email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
	nomorWa: z
		.string()
		.trim()
		.max(32)
		.regex(
			/^\+?[0-9 ()-]+$/,
			"Nomor WA hanya boleh berisi angka, spasi, tanda kurung, -, dan awalan +",
		)
		.transform((value) => value.replace(/[ ()-]/g, ""))
		.pipe(
			z.string().regex(/^\+?[0-9]{8,15}$/, "Nomor WA harus berisi 8–15 digit, boleh diawali +"),
		),
}) satisfies z.ZodType<LeadCaptureInput>;

export type SubmitLeadCaptureInput = z.infer<typeof SubmitLeadCaptureDto>;

export const ListLeadCapturesDto = z.strictObject({
	offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});
