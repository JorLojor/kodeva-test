export const SECTION_TYPE = [
	"hero",
	"testimonials",
	"faq",
	"leadcapture",
] as const;
export type SectionType = (typeof SECTION_TYPE)[number];
export type Language = { idn: string; eng: string };
export type Locale = keyof Language;
export type CTA = { label: Language; url: string };
export type HeroPayload = {
	title: Language;
	subtitle: Language;
	image: string;
	cta: CTA;
};

export const CONTENT_STATUS = ["pending", "active", "inactive"] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

export type TestimonialPayload = {
	title: Language;
	subtitle: Language;
	image: string;
};
export type FaqPayload = { title: Language; subtitle: Language };
export type LeadCapturePayload = { title: Language; subtitle: Language };
export type ContentPayload =
	| HeroPayload[]
	| TestimonialPayload[]
	| FaqPayload[]
	| LeadCapturePayload[];
export type CmsSection =
	| { section: "hero"; order: number; payload: HeroPayload[] }
	| { section: "testimonials"; order: number; payload: TestimonialPayload[] }
	| { section: "faq"; order: number; payload: FaqPayload[] }
	| { section: "leadcapture"; order: number; payload: LeadCapturePayload[] };
export type PublishedCms = {
	version: { publicId: string; status: "active"; updatedAt: string } | null;
	sections: CmsSection[];
};
export type CmsSnapshot = {
	version: {
		publicId: string;
		status: "active" | "pending";
		updatedAt: string;
	} | null;
	sections: CmsSection[];
};
export type CmsHistoryVersion = {
	publicId: string;
	status: "active" | "pending" | "inactive";
	updatedAt: string;
};
export type CmsHistorySnapshot = {
	version: CmsHistoryVersion;
	sections: CmsSection[];
};
export type CmsHistoryPage = {
	items: (CmsHistoryVersion & {
		createdAt: string;
		admin: { username: string };
	})[];
	activeVersion: PublishedCms["version"];
	hasMore: boolean;
};
export type ActivateCmsInput = {
	version: CmsHistoryVersion & { status: "inactive" };
	activeVersion: PublishedCms["version"];
};
export type ActivateCmsResult = {
	published: PublishedCms;
	editor: CmsSnapshot;
};
export type CampaignAttribution = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string>>;
export type LeadCaptureInput = { nama: string; email: string; nomorWa: string; attribution?: CampaignAttribution };
export type LeadCaptureResult = { publicId: string };

export type LeadCaptureEntry = LeadCaptureInput & {
	publicId: string;
	createdAt: string;
};
export type LeadCapturePageResult = {
	items: LeadCaptureEntry[];
	hasMore: boolean;
};

export type BlogPayload = {
	title: Language;
	excerpt: Language;
	content: BlogContentPayload[];
};

export type BlogContentPayload = {
	text: Language;
	image: string;
	cta: CTA | null;
};

export type OrderStatus =
	| "awaiting_payment"
	| "review"
	| "paid"
	| "rejected"
	| "expired"
	| "cancelled";
export type OrderLine = {
	productId: string;
	packageId: string;
	name: string;
	packageName: string;
	unit: string;
	quantity: number;
	unitPrice: number;
};
export type TransferAccount = { bank: string; number: string; name: string };
export type OrderView = {
 attribution: CampaignAttribution;
	publicId: string;
	buyer: { name: string; email: string; company: string };
	items: OrderLine[];
	total: number;
	status: OrderStatus;
	bank: TransferAccount;
	expiresAt: string;
	createdAt: string;
	updatedAt: string;
	rejectionReason: string | null;
	hasProof: boolean;
};
