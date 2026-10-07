import { z } from "zod";

// Only marketing parameters are accepted, never arbitrary URL/query fields.
const value = z.string().trim().max(200).optional();
export const AttributionDto = z
	.strictObject({
		utm_source: value,
		utm_medium: value,
		utm_campaign: value,
		utm_content: value,
		utm_term: value,
	})
	.transform((value) =>
		Object.fromEntries(
			Object.entries(value).filter(
				(entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
			),
		),
	)
	.default({});
