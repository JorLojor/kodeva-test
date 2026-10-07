import { products } from "@jortemplate/utils/marketplace";

export { products };
export type Product = (typeof products)[number];
export type Line = { productId: string; packageId: string; quantity: number };
export type Store = { lines: Line[]; used: Record<string, number> };
export const storageKey = "kodeva-marketplace-v1";
export const money = (n: number) =>
	new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(n);
export function resolve(line: Line) {
	const product = products.find((p) => p.id === line.productId);
	const pack = product?.packages.find((p) => p.id === line.packageId);
	return product && pack ? { product, pack } : null;
}
export function remaining(store: Store, id: string) {
	return Math.max(
		0,
		(products.find((p) => p.id === id)?.quota ?? 0) - (store.used[id] ?? 0),
	);
}
export function count(lines: Line[], id: string) {
	return lines
		.filter((l) => l.productId === id)
		.reduce((n, l) => n + l.quantity, 0);
}
export function total(lines: Line[]) {
	return lines.reduce(
		(n, l) => n + (resolve(l)?.pack.promoPrice ?? 0) * l.quantity,
		0,
	);
}
export function change(
	store: Store,
	productId: string,
	packageId: string,
	quantity: number,
): Store {
	if (
		!Number.isInteger(quantity) ||
		quantity < 0 ||
		!resolve({ productId, packageId, quantity })
	)
		throw new Error("Jumlah lisensi tidak valid.");
	const others = store.lines.filter(
		(l) => l.productId !== productId || l.packageId !== packageId,
	);
	if (
		quantity >
			(store.lines.find(
				(l) => l.productId === productId && l.packageId === packageId,
			)?.quantity ?? 0) &&
		count(others, productId) + quantity > remaining(store, productId)
	)
		throw new Error(
			`Kuota promo tersisa ${remaining(store, productId)} lisensi untuk total semua paket produk ini.`,
		);
	return {
		...store,
		lines: quantity ? [...others, { productId, packageId, quantity }] : others,
	};
}
export function restore(raw: string | null): Store {
	const empty: Store = { lines: [], used: {} };
	try {
		const input = JSON.parse(raw ?? "null");
		if (!input || !Array.isArray(input.lines)) return empty;

		for (const l of input.lines) {
			if (!l || !resolve(l) || !Number.isInteger(l.quantity) || l.quantity < 1)
				continue;
			const available =
				remaining(empty, l.productId) - count(empty.lines, l.productId);
			const qty = Math.min(l.quantity, available);
			if (qty > 0) {
				const existing = empty.lines.find(
					(x) => x.productId === l.productId && x.packageId === l.packageId,
				);
				if (existing) existing.quantity += qty;
				else
					empty.lines.push({
						productId: l.productId,
						packageId: l.packageId,
						quantity: qty,
					});
			}
		}
		return empty;
	} catch {
		return empty;
	}
}
