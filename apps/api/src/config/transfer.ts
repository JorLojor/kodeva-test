import { z } from "zod";
import { AppError } from "@/lib/error";
import settings from "./transfer.json";

const schema = z.object({
	enabled: z.literal(true),
	bank: z.string().trim().min(1),
	number: z.string().trim().min(1),
	name: z.string().trim().min(1),
});
export function transferSettings() {
	const result = schema.safeParse(settings);
	if (!result.success)
		throw new AppError(
			503,
			"Transfer manual belum tersedia. Aktifkan transfer dan lengkapi konfigurasi rekening.",
			"TRANSFER_NOT_CONFIGURED",
		);
	return result.data;
}
export function transferAvailable() {
	try {
		transferSettings();
		return true;
	} catch {
		return false;
	}
}
