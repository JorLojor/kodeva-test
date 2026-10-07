import { z } from "zod";
import { SECTION_TYPE } from "@/db/schemas/table/content";

const text = z.string().trim().min(1).max(5000);
const LanguageDto = z.strictObject({ idn: text, eng: text });
const HttpUrlDto = z
	.string()
	.trim()
	.max(2048)
	.refine((value) => {
		const url = URL.parse(value);
		return (
			url !== null && ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
		);
	}, "Must be an HTTP(S) URL without credentials");
const CtaUrlDto = z.union([
	HttpUrlDto,
	z
		.string()
		.trim()
		.max(2048)
		.regex(/^\/(?![\\/])[^\\]*$/, "Must be a local path starting with /"),
]);

const HeroPayloadDto = z.strictObject({
	title: LanguageDto,
	subtitle: LanguageDto,
	image: HttpUrlDto,
	cta: z.strictObject({ label: LanguageDto, url: CtaUrlDto }),
});
const TestimonialPayloadDto = z.strictObject({
	title: LanguageDto,
	subtitle: LanguageDto,
	image: HttpUrlDto,
});
const FaqPayloadDto = z.strictObject({ title: LanguageDto, subtitle: LanguageDto });
const LeadCapturePayloadDto = z.strictObject({ title: LanguageDto, subtitle: LanguageDto });
const order = z.number().int().min(1).max(SECTION_TYPE.length);

export const CmsSectionDto = z.discriminatedUnion("section", [
	z.strictObject({
		section: z.literal("hero"),
		order,
		payload: z.array(HeroPayloadDto).min(1).max(10),
	}),
	z.strictObject({
		section: z.literal("testimonials"),
		order,
		payload: z.array(TestimonialPayloadDto).min(1).max(50),
	}),
	z.strictObject({
		section: z.literal("faq"),
		order,
		payload: z.array(FaqPayloadDto).min(1).max(100),
	}),
	z.strictObject({
		section: z.literal("leadcapture"),
		order,
		payload: z.array(LeadCapturePayloadDto).length(1),
	}),
]);
export type CmsSectionInput = z.infer<typeof CmsSectionDto>;

export const CmsSectionsDto = z
	.array(CmsSectionDto)
	.min(1)
	.max(SECTION_TYPE.length)
	.superRefine((sections, context) => {
		if (new Set(sections.map((section) => section.section)).size !== sections.length) {
			context.addIssue({ code: "custom", message: "Each section may appear only once" });
		}
		if (new Set(sections.map((section) => section.order)).size !== sections.length) {
			context.addIssue({ code: "custom", message: "Section orders must be unique" });
		}
	});

const CmsVersionDto = z.strictObject({
	publicId: z.uuid(),
	updatedAt: z.iso.datetime(),
	status: z.enum(["pending", "active"]),
});

export const SaveDraftDto = z.strictObject({
	version: CmsVersionDto.nullable(),
	sections: CmsSectionsDto,
});
export type SaveDraftInput = z.infer<typeof SaveDraftDto>;

export const PublishDraftDto = z.strictObject({
	version: CmsVersionDto.extend({ status: z.literal("pending") }),
});
export type PublishDraftInput = z.infer<typeof PublishDraftDto>;

export const HistoryQueryDto = z.strictObject({
	offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});
export const VersionIdDto = z.uuid();
export const ActivateVersionDto = z.strictObject({
	version: CmsVersionDto.extend({ status: z.literal("inactive") }),
	activeVersion: CmsVersionDto.extend({ status: z.literal("active") }).nullable(),
});
export type ActivateVersionInput = z.infer<typeof ActivateVersionDto>;
