import type { CampaignAttribution } from "@jortemplate/types";
import { type Line, resolve } from "@/features/marketplace/model";

const storageKey = "kodeva-campaign";
const keys = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_content",
	"utm_term",
] as const;
let memory: CampaignAttribution = {};
let lastUrl = "";
declare global {
	interface Window {
		dataLayer?: Record<string, unknown>[];
	}
}
export function getAttribution(): CampaignAttribution {
	if (typeof window === "undefined") return {};
	if (window.location.href !== lastUrl) {
		lastUrl = window.location.href;
		try {
			const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
			memory = Object.fromEntries(
				keys.flatMap((key) =>
					typeof saved?.[key] === "string"
						? [[key, saved[key].slice(0, 200)]]
						: [],
				),
			);
		} catch {
			/* In-memory attribution still works if storage is blocked. */
		}
		const params = new URLSearchParams(window.location.search);
		const campaign = Object.fromEntries(
			keys.flatMap((key) => {
				const value = params.get(key)?.trim().slice(0, 200);
				return value ? [[key, value]] : [];
			}),
		);
		if (Object.keys(campaign).length) {
			memory = campaign;
			try {
				sessionStorage.setItem(storageKey, JSON.stringify(memory));
			} catch {
				/* Keep in memory. */
			}
		}
	}
	return { ...memory };
}
export function track(event: string, payload: Record<string, unknown>) {
	if (typeof window === "undefined") return;
	try {
		const attribution = getAttribution();
		window.dataLayer ??= [];
		window.dataLayer.push({ ecommerce: null });
		window.dataLayer.push({
			event,
			...payload,
			campaign: {
				source: attribution.utm_source ?? null,
				medium: attribution.utm_medium ?? null,
				name: attribution.utm_campaign ?? null,
				content: attribution.utm_content ?? null,
				term: attribution.utm_term ?? null,
			},
		});
	} catch {
		/* Analytics must not interrupt checkout or navigation. */
	}
}
export function trackEcommerce(
	event: "view_item" | "add_to_cart" | "begin_checkout",
	lines: Line[],
) {
	const items = lines.flatMap((line) => {
		const data = resolve(line);
		return data
			? [
					{
						item_id: data.product.id,
						item_name: data.product.name,
						item_category: data.product.category,
						item_variant: data.pack.name,
						price: data.pack.promoPrice,
						discount: data.pack.price - data.pack.promoPrice,
						quantity: line.quantity,
					},
				]
			: [];
	});
	if (items.length)
		track(event, {
			ecommerce: {
				currency: "IDR",
				value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
				items,
			},
		});
}
