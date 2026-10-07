"use client";
import type { CampaignAttribution, OrderView } from "@jortemplate/types";
import { Alert, Badge, Button, Card, FormField, Input } from "@jortemplate/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getAttribution, trackEcommerce } from "@/lib/marketing";
import { useCart } from "./CartProvider";
import { money, resolve, total } from "./model";
import { downloadReceipt } from "./receipt";

const key = "kodeva-current-order";
type Access = { id: string; token: string };
const statuses = {
	awaiting_payment: "Menunggu pembayaran",
	review: "Menunggu verifikasi",
	paid: "Lunas",
	rejected: "Bukti ditolak",
	expired: "Kedaluwarsa",
	cancelled: "Dibatalkan",
};
function Payment({ access, onNew }: { access: Access; onNew: () => void }) {
	const client = useQueryClient();
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const [image, setImage] = useState("");
	const [downloading, setDownloading] = useState(false);
	const lock = useRef(false);
	const headers = { Authorization: `Bearer ${access.token}` };
	const query = useQuery({
		queryKey: ["order", access.id],
		queryFn: () => apiRequest<OrderView>(`/orders/${access.id}`, { headers }),
		refetchInterval: 10000,
		retry: false,
	});
	const upload = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error("Pilih gambar bukti transfer");
			const body = new FormData();
			body.append("file", file);
			return apiRequest<OrderView>(`/orders/${access.id}/proof`, {
				method: "POST",
				headers,
				body,
			});
		},
		retry: false,
		onSuccess: (data) => {
			client.setQueryData(["order", access.id], data);
			setFile(null);
			setError("");
		},
	});
	const cancel = useMutation({
		mutationFn: () =>
			apiRequest<OrderView>(`/orders/${access.id}/cancel`, {
				method: "POST",
				headers,
			}),
		onSuccess: (data) => {
			client.setQueryData(["order", access.id], data);
			void client.invalidateQueries({ queryKey: ["orders", "inventory"] });
		},
	});
	useEffect(() => {
		if (!file) {
			setImage("");
			return;
		}
		const url = URL.createObjectURL(file);
		setImage(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);
	if (query.isPending) return <p role="status">Memuat pesanan…</p>;
	if (query.isError)
		return (
			<Alert tone="danger">
				{query.error.message}
				<Button onClick={() => void query.refetch()}>Muat ulang</Button>
				<Button variant="ghost" onClick={onNew}>
					Kembali ke checkout
				</Button>
			</Alert>
		);
	const order = query.data;
	const canUpload = ["awaiting_payment", "rejected"].includes(order.status);
	const busy = upload.isPending || cancel.isPending;
	return (
		<div className="grid items-start gap-6 lg:grid-cols-2">
			<Card>
				<Badge>{statuses[order.status]}</Badge>
				<h1 className="mt-5 text-2xl font-semibold">
					Pesanan {order.publicId.slice(0, 8)}
				</h1>
				<p className="mt-3 text-sm text-muted">
					{order.buyer.name} · {order.buyer.email}
				</p>
				<div className="my-6 space-y-4">
					{order.items.map((item) => (
						<div
							key={`${item.productId}-${item.packageId}`}
							className="flex justify-between gap-3 text-sm"
						>
							<span>
								{item.name} · {item.packageName}
								<span className="block text-muted">
									{item.quantity} {item.unit}
								</span>
							</span>
							<strong>{money(item.unitPrice * item.quantity)}</strong>
						</div>
					))}
				</div>
				<p className="flex justify-between border-t border-line pt-5">
					<span>Total transfer</span>
					<strong>{money(order.total)}</strong>
				</p>
				{order.status === "paid" && (
					<Button
						className="mt-6 w-full"
						loading={downloading}
						disabled={downloading}
						onClick={async () => {
							setDownloading(true);
							setError("");
							try {
								await downloadReceipt(order);
							} catch (error) {
								setError(
									error instanceof Error
										? error.message
										: "Gagal mengunduh kuitansi.",
								);
							} finally {
								setDownloading(false);
							}
						}}
					>
						Download kuitansi (PNG)
					</Button>
				)}
				<Button
					className="mt-6"
					variant="ghost"
					onClick={() => void query.refetch()}
				>
					Refresh status
				</Button>
			</Card>
			<Card>
				{canUpload ? (
					<>
						<h2 className="text-xl font-semibold">
							Transfer ke rekening berikut
						</h2>
						<dl className="my-5 space-y-2">
							<div>
								<dt className="text-xs text-muted">Bank</dt>
								<dd>{order.bank.bank}</dd>
							</div>
							<div>
								<dt className="text-xs text-muted">Nomor rekening</dt>
								<dd className="text-xl font-semibold tracking-wide">
									{order.bank.number}
								</dd>
							</div>
							<div>
								<dt className="text-xs text-muted">Atas nama</dt>
								<dd>{order.bank.name}</dd>
							</div>
						</dl>
						<p className="mb-5 text-sm text-muted">
							Batas pembayaran / upload ulang:{" "}
							{new Date(order.expiresAt).toLocaleString("id-ID")}
						</p>
						{order.rejectionReason && (
							<Alert tone="danger" className="mb-4">
								{order.rejectionReason}
							</Alert>
						)}
						<FormField
							htmlFor="transfer-proof"
							label="Bukti transfer"
							hint="JPG, PNG, WebP maksimal 5 MB."
						>
							<Input
								id="transfer-proof"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								disabled={busy}
								onChange={(e) => {
									const next = e.target.files?.[0];
									setError("");
									if (!next) return;
									if (
										!["image/jpeg", "image/png", "image/webp"].includes(
											next.type,
										) ||
										next.size < 1 ||
										next.size > 5 * 1024 * 1024
									) {
										setError("Pilih gambar valid maksimal 5 MB");
										setFile(null);
										e.target.value = "";
										return;
									}
									setFile(next);
								}}
							/>
						</FormField>
						{image && (
							<Image
								unoptimized
								width={800}
								height={600}
								src={image}
								alt="Pratinjau bukti transfer"
								className="my-4 max-h-72 w-full rounded-xl object-contain"
							/>
						)}
						<Button
							className="mt-5 w-full"
							disabled={!file || busy}
							loading={upload.isPending}
							onClick={async () => {
								if (lock.current) return;
								lock.current = true;
								try {
									await upload.mutateAsync();
								} catch {
									/* Error shown below. */
								} finally {
									lock.current = false;
								}
							}}
						>
							Kirim bukti transfer
						</Button>
						<Button
							variant="ghost"
							className="mt-3"
							disabled={busy}
							onClick={() => {
								if (
									window.confirm("Batalkan pesanan dan lepaskan kuota promo?")
								)
									cancel.mutate();
							}}
						>
							Batalkan pesanan
						</Button>
					</>
				) : order.status === "review" ? (
					<>
						<h2 className="text-xl font-semibold">Bukti sedang diperiksa</h2>
						<p className="mt-4 text-muted">
							Admin akan memeriksa bukti transfer. Status di halaman ini
							diperbarui otomatis. Tidak perlu transfer ulang.
						</p>
					</>
				) : (
					<>
						<h2 className="text-xl font-semibold">
							{order.status === "paid"
								? "Pembayaran disetujui"
								: "Pesanan sudah ditutup"}
						</h2>
						<p className="mt-4 text-muted">
							{order.status === "paid"
								? "Pembayaran sudah diverifikasi admin. Hubungi tim Kodeva untuk proses penyerahan lisensi."
								: "Kuota promo telah dilepas. Kamu bisa membuat pesanan baru."}
						</p>
						<Button className="mt-6" onClick={onNew}>
							Buat pesanan lain
						</Button>
					</>
				)}
				{(error || upload.error || cancel.error) && (
					<Alert tone="danger" className="mt-4">
						{error || upload.error?.message || cancel.error?.message}
					</Alert>
				)}
			</Card>
		</div>
	);
}
export function Checkout() {
	const cart = useCart();
	const inventory = useQuery({
		queryKey: ["orders", "inventory"],
		queryFn: () =>
			apiRequest<{ available: Record<string, number>; enabled: boolean }>(
				"/orders/inventory",
			),
		refetchInterval: 15000,
	});
	const [access, setAccess] = useState<Access | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [storageError, setStorageError] = useState("");
	const token = useRef("");
	const lock = useRef(false);
	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(key) ?? "null");
			if (
				saved &&
				typeof saved.id === "string" &&
				/^[a-f0-9]{64}$/.test(saved.token)
			)
				setAccess(saved);
			const pending = sessionStorage.getItem(`${key}-token`);
			if (pending) {
				token.current = pending;
				if (!saved)
					void apiRequest<OrderView>("/orders/current", {
						headers: { Authorization: `Bearer ${pending}` },
					})
						.then((order) => {
							const next = { id: order.publicId, token: pending };
							setAccess(next);
							try {
								localStorage.setItem(key, JSON.stringify(next));
							} catch {
								/* Keep access in memory. */
							}
						})
						.catch(() => {});
			}
		} catch {
			/* Start fresh if storage is corrupt. */
		}
		setLoaded(true);
	}, []);
	const create = useMutation({
		mutationFn: async (input: {
			buyer: { name: string; email: string; company: string };
			items: typeof cart.store.lines;
			attribution: CampaignAttribution;
		}) =>
			apiRequest<OrderView>("/orders", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.current}` },
				body: JSON.stringify(input),
			}),
		retry: false,
	});
	const checkoutTracked = useRef(false);
	useEffect(() => {
		if (
			loaded &&
			cart.ready &&
			!access &&
			cart.store.lines.length &&
			!checkoutTracked.current
		) {
			checkoutTracked.current = true;
			trackEcommerce("begin_checkout", cart.store.lines);
		}
	}, [loaded, cart.ready, cart.store.lines, access]);
	function reset() {
		try {
			localStorage.removeItem(key);
			sessionStorage.removeItem(`${key}-token`);
		} catch {
			/* Reset current view even if storage is unavailable. */
		}
		checkoutTracked.current = false;
		token.current = "";
		setAccess(null);
		create.reset();
	}
	if (!loaded || !cart.ready)
		return (
			<p className="py-16" role="status">
				Memuat checkout…
			</p>
		);
	return (
		<section className="py-12">
			<Link href="/products" className="text-sm text-accent">
				← Marketplace
			</Link>
			<header className="my-8">
				<h1 className="text-4xl font-semibold">
					{access ? "Pembayaran pesanan" : "Checkout"}
				</h1>
				<p className="mt-3 text-muted">
					Pembayaran transfer manual dengan verifikasi admin.
				</p>
			</header>
			{storageError && (
				<Alert tone="warning" className="mb-4">
					{storageError}
				</Alert>
			)}
			{access ? (
				<Payment access={access} onNew={reset} />
			) : !cart.store.lines.length ? (
				<Card>
					Keranjang kosong.{" "}
					<Link href="/products" className="underline">
						Pilih produk
					</Link>
				</Card>
			) : (
				<form
					className="grid items-start gap-6 lg:grid-cols-2"
					onSubmit={async (e) => {
						e.preventDefault();
						if (lock.current) return;
						const data = new FormData(e.currentTarget);
						const buyer = {
							name: String(data.get("name") ?? "").trim(),
							email: String(data.get("email") ?? "").trim(),
							company: String(data.get("company") ?? "").trim(),
						};
						if (!buyer.name) return;
						try {
							if (!token.current) {
								token.current = Array.from(
									crypto.getRandomValues(new Uint8Array(32)),
									(v) => v.toString(16).padStart(2, "0"),
								).join("");
								sessionStorage.setItem(`${key}-token`, token.current);
							}
						} catch {
							setStorageError(
								"Aktifkan penyimpanan browser sebelum checkout agar akses pesanan dapat disimpan.",
							);
							return;
						}
						lock.current = true;
						cart.setBusy(true);
						const items = structuredClone(cart.store.lines);
						try {
							const order = await create.mutateAsync({
								buyer,
								items,
								attribution: getAttribution(),
							});
							const next = { id: order.publicId, token: token.current };
							try {
								localStorage.setItem(key, JSON.stringify(next));
							} catch {
								setStorageError(
									"Akses pesanan belum tersimpan. Jangan tutup halaman ini.",
								);
							}
							setAccess(next);
							cart.complete(items);
						} catch {
							/* Mutation error shown below. */
						} finally {
							lock.current = false;
							cart.setBusy(false);
						}
					}}
				>
					<Card>
						<h2 className="mb-6 text-xl font-semibold">Informasi pembeli</h2>
						<fieldset disabled={create.isPending} className="space-y-5">
							<FormField htmlFor="buyer-name" label="Nama lengkap">
								<Input
									id="buyer-name"
									name="name"
									required
									maxLength={150}
									autoComplete="name"
								/>
							</FormField>
							<FormField htmlFor="buyer-email" label="Email">
								<Input
									id="buyer-email"
									type="email"
									name="email"
									required
									maxLength={254}
									autoComplete="email"
								/>
							</FormField>
							<FormField htmlFor="buyer-company" label="Nama usaha (opsional)">
								<Input id="buyer-company" name="company" maxLength={150} />
							</FormField>
						</fieldset>
					</Card>
					<Card>
						<h2 className="mb-6 text-xl font-semibold">Ringkasan pesanan</h2>
						<div className="space-y-3">
							{cart.store.lines.map((line) => (
								<p
									key={`${line.productId}-${line.packageId}`}
									className="flex justify-between gap-3 text-sm"
								>
									<span>
										{resolve(line)?.product.name} · {resolve(line)?.pack.name} ×{" "}
										{line.quantity}
									</span>
									<strong>
										{money(
											(resolve(line)?.pack.promoPrice ?? 0) * line.quantity,
										)}
									</strong>
								</p>
							))}
						</div>
						<p className="my-6 flex justify-between border-t border-line pt-5">
							<span>Total</span>
							<strong>{money(total(cart.store.lines))}</strong>
						</p>
						<Button
							type="submit"
							className="w-full"
							loading={create.isPending}
							disabled={
								create.isPending ||
								!inventory.data?.enabled ||
								inventory.isError
							}
						>
							Buat pesanan & lihat rekening
						</Button>
						<p className="mt-4 text-xs text-muted">
							Harga dan kuota diperiksa ulang oleh server. Selesaikan pembayaran
							dalam 24 jam. Akses pesanan disimpan di browser ini.
						</p>
						{!inventory.data?.enabled && (
							<Alert tone="warning" className="mt-4">
								Transfer manual belum tersedia. Silakan kembali setelah
								konfigurasi pembayaran selesai.
							</Alert>
						)}
						{create.error && (
							<Alert className="mt-4" tone="danger">
								{create.error.message}
							</Alert>
						)}
					</Card>
				</form>
			)}
		</section>
	);
}
