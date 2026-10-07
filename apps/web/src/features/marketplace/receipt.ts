import type { OrderView } from "@jortemplate/types";
import { money } from "./model";

export async function downloadReceipt(order: OrderView) {
	if (order.status !== "paid")
		throw new Error("Kuitansi tersedia setelah pembayaran lunas.");
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Browser belum mendukung download kuitansi.");
	const width = 1000;
	const padding = 64;
	type Row = { text: string; size: number; bold: boolean };
	const rows: Row[] = [];
	const add = (text: string, size = 24, bold = false) => {
		context.font = `${bold ? "bold" : "normal"} ${size}px Arial`;
		let line = "";
		for (const character of text) {
			if (
				character === "\n" ||
				context.measureText(line + character).width > width - padding * 2
			) {
				rows.push({ text: line, size, bold });
				line = character === "\n" ? "" : character;
			} else line += character;
		}
		rows.push({ text: line, size, bold });
	};
	add("Kodeva.", 42, true);
	add("KUITANSI PEMBAYARAN", 30, true);
	add("LUNAS · Pembayaran diverifikasi admin", 24, true);
	add("");
	add(`Nomor pesanan: ${order.publicId}`, 20);
	const date = (value: string) =>
		new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
	add(`Tanggal pesanan: ${date(order.createdAt)} WIB`, 20);
	add(`Tanggal verifikasi: ${date(order.updatedAt)} WIB`, 20);
	add("");
	add("PEMBELI", 22, true);
	add(order.buyer.name);
	add(order.buyer.email);
	if (order.buyer.company) add(order.buyer.company);
	add("");
	add("RINCIAN PEMBELIAN", 22, true);
	for (const item of order.items) {
		add(`${item.name} · ${item.packageName}`, 24, true);
		add(
			`${item.quantity} ${item.unit} × ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`,
		);
		add("", 10);
	}
	add(`TOTAL DIBAYAR: ${money(order.total)}`, 30, true);
	add("");
	add(`Metode: transfer bank ${order.bank.bank}`, 20);
	add(`Rekening tujuan: ${order.bank.number}`, 20);
	add(`Atas nama: ${order.bank.name}`, 20);
	add("");
	add("Terima kasih atas pembelian Anda di Kodeva.", 20);
	canvas.width = width;
	canvas.height =
		padding * 2 + rows.reduce((height, row) => height + row.size * 1.6, 0);
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#203c34";
	context.textBaseline = "top";
	let y = padding;
	for (const row of rows) {
		context.font = `${row.bold ? "bold" : "normal"} ${row.size}px Arial`;
		context.fillText(row.text, padding, y);
		y += row.size * 1.6;
	}
	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(value) =>
				value ? resolve(value) : reject(new Error("Gagal membuat kuitansi.")),
			"image/png",
		);
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `Kodeva-kuitansi-${order.publicId}.png`;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 10000);
}
