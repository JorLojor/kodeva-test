import type { SectionType } from "@jortemplate/types";

export const SECTION_LABEL: Record<SectionType, string> = {
	hero: "Hero",
	testimonials: "Testimonial",
	faq: "FAQ",
	leadcapture: "Lead capture",
};

export const SECTION_ITEM_LIMIT: Record<SectionType, number> = {
	hero: 10,
	testimonials: 50,
	faq: 100,
	leadcapture: 1,
};

export const VERSION_STATUS_LABEL = {
	active: "Aktif",
	pending: "Draft",
	inactive: "Nonaktif",
} as const;

export const HISTORY_PAGE_SIZE = 20;
