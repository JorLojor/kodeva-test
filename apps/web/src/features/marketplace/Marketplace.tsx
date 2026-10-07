"use client";
import {
	Alert,
	Badge,
	Button,
	buttonClassName,
	Card,
	FormField,
	Input,
} from "@jortemplate/ui";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackEcommerce } from "@/lib/marketing";
import { useCart } from "./CartProvider";
import { count, money, products, remaining, resolve, total } from "./model";

export function CartLink() {
	const { store, ready } = useCart();
	return (
		<Link href="/cart">
			Keranjang
			{ready ? ` (${store.lines.reduce((n, l) => n + l.quantity, 0)})` : ""}
		</Link>
	);
}
function Intro({ title, description }: { title: string; description: string }) {
	return (
		<header className="mb-10">
			<p className="mb-3 text-xs font-bold tracking-widest text-accent">
				KODEVA MARKETPLACE
			</p>
			<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
				{title}
			</h1>
			<p className="mt-4 max-w-2xl leading-relaxed text-muted">{description}</p>
		</header>
	);
}
export function Catalog() {
	const [category, setCategory] = useState("Semua");
	const query = useQuery({
		queryKey: ["marketplace", "catalog"],
		queryFn: async () => products,
		staleTime: Infinity,
	});
	const { store, ready } = useCart();
	return (
		<section className="py-12">
			<Intro
				title="Solusi digital untuk usahamu."
				description="Temukan aplikasi yang tepat untuk pekerjaan sehari-hari. Pilih paket dan jumlah lisensi sesuai kebutuhan tim."
			/>
			<fieldset className="mb-8 flex flex-wrap gap-2">
				<legend className="mb-3 text-sm text-muted">Kategori produk</legend>
				{["Semua", ...new Set(products.map((p) => p.category))].map((c) => (
					<Button
						key={c}
						variant={c === category ? "primary" : "secondary"}
						aria-pressed={c === category}
						onClick={() => setCategory(c)}
					>
						{c}
					</Button>
				))}
			</fieldset>
			{query.isPending ? (
				<p role="status">Memuat produk…</p>
			) : query.isError ? (
				<Alert tone="danger">
					Produk belum bisa dimuat.{" "}
					<Button onClick={() => void query.refetch()}>Coba lagi</Button>
				</Alert>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{query.data
						.filter((p) => category === "Semua" || p.category === category)
						.map((p) => (
							<Card key={p.id} className="flex flex-col overflow-hidden p-0">
								<Link
									href={`/products/${p.slug}`}
									className="block focus-visible:outline-2 focus-visible:outline-accent"
								>
									<Image
										src={p.screenshots[0] ?? ""}
										alt={`Pratinjau ${p.name}`}
										width={900}
										height={560}
										className="w-full"
									/>
									<div className="p-6">
										<Badge>{p.category}</Badge>
										<h2 className="mt-4 text-2xl font-semibold">{p.name}</h2>
										<p className="mt-3 min-h-12 text-sm leading-relaxed text-muted">
											{p.description}
										</p>
										<p className="mt-5 text-xs text-muted">
											Mulai dari · per {p.unit} · lisensi sekali beli
										</p>
										<p className="mt-1 text-xl font-semibold">
											{money(p.packages[0]?.promoPrice ?? 0)}{" "}
											<del className="ml-2 text-xs font-normal text-muted">
												{money(p.packages[0]?.price ?? 0)}
											</del>
										</p>
										<p className="mt-2 text-xs text-accent">
											{ready
												? `${remaining(store, p.id)} lisensi promo tersisa`
												: "Memuat kuota…"}
										</p>
										<span className="mt-5 inline-block text-sm font-semibold text-accent">
											Lihat paket →
										</span>
									</div>
								</Link>
							</Card>
						))}
				</div>
			)}
			<p className="mt-8 text-xs text-muted">
				Pembayaran transfer manual · bukti pembayaran diverifikasi admin.
			</p>
		</section>
	);
}
export function ProductDetail({ slug }: { slug: string }) {
	const p = products.find((p) => p.slug === slug);
	const [packageId, setPackageId] = useState("basic");
	const [quantity, setQuantity] = useState(1);
	const [screen, setScreen] = useState(0);
	const [notice, setNotice] = useState("");
	const cart = useCart();
	const pack = p?.packages.find((x) => x.id === packageId);
	const viewed = useRef("");
	useEffect(() => {
		if (p && pack && viewed.current !== p.id) {
			viewed.current = p.id;
			trackEcommerce("view_item", [
				{ productId: p.id, packageId: pack.id, quantity: 1 },
			]);
		}
	}, [p, pack]);
	if (!p || !pack) return <p className="py-16">Produk tidak ditemukan.</p>;
	const available = remaining(cart.store, p.id) - count(cart.store.lines, p.id);
	return (
		<section className="py-10">
			<Link href="/products" className="text-sm text-accent">
				← Marketplace
			</Link>
			<div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.2fr_1fr]">
				<div>
					<Badge>{p.category}</Badge>
					<h1 className="mt-4 text-4xl font-semibold tracking-tight">
						{p.name}
					</h1>
					<p className="mt-4 text-muted">{p.description}</p>
					<Image
						src={p.screenshots[screen] ?? ""}
						alt={`${p.name} — ${screen === 0 ? "ringkasan" : "laporan"}`}
						width={900}
						height={560}
						className="mt-8 w-full rounded-2xl border border-line"
					/>
					<div className="mt-3 flex gap-2">
						{["Ringkasan", "Laporan"].map((label, i) => (
							<Button
								key={label}
								size="sm"
								variant={screen === i ? "primary" : "secondary"}
								aria-pressed={screen === i}
								onClick={() => setScreen(i)}
							>
								{label}
							</Button>
						))}
					</div>
					<h2 className="mt-8 font-semibold">Fitur paket {pack.name}</h2>
					<ul className="mt-4 grid gap-3 text-sm text-muted">
						{pack.features.map((f) => (
							<li key={f}>✓ {f}</li>
						))}
					</ul>
				</div>
				<Card className="lg:sticky lg:top-6">
					<h2 className="text-xl font-semibold">Pilih paketmu</h2>
					<fieldset className="my-6 grid grid-cols-3 gap-2">
						<legend className="sr-only">Paket lisensi</legend>
						{p.packages.map((option) => (
							<label
								key={option.id}
								className={`cursor-pointer rounded-xl border p-3 text-center text-sm ${option.id === packageId ? "border-accent bg-paper" : "border-line"}`}
							>
								<input
									type="radio"
									name="package"
									value={option.id}
									checked={packageId === option.id}
									onChange={() => {
										setPackageId(option.id);
										setNotice("");
									}}
									className="mr-1 accent-accent"
								/>
								{option.name}
							</label>
						))}
					</fieldset>
					<del className="text-sm text-muted">{money(pack.price)}</del>
					<p className="mt-1 text-3xl font-semibold">
						{money(pack.promoPrice)}
					</p>
					<p className="mt-2 text-sm text-muted">Per {p.unit} · sekali beli</p>
					<p className="my-5 rounded-xl bg-paper p-4 text-sm text-accent">
						{cart.ready
							? `${remaining(cart.store, p.id)} lisensi promo tersisa, ${count(cart.store.lines, p.id)} sudah di keranjang. Bisa tambah ${available} lagi.`
							: "Memuat kuota…"}
						<span className="mt-2 block text-xs">
							Kuota dipakai bersama oleh Basic, Pro, dan Business.
						</span>
					</p>
					<FormField
						htmlFor="license-quantity"
						label={`Jumlah lisensi (${p.unit})`}
					>
						<Input
							id="license-quantity"
							type="number"
							min={1}
							max={Math.max(1, available)}
							value={quantity}
							onChange={(e) => {
								setQuantity(Number(e.target.value));
								setNotice("");
							}}
						/>
					</FormField>
					<div className="my-5 flex justify-between text-sm">
						<span>Subtotal</span>
						<strong>
							{money(
								pack.promoPrice *
									(Number.isInteger(quantity) && quantity > 0 ? quantity : 0),
							)}
						</strong>
					</div>
					<Button
						className="w-full"
						disabled={
							!cart.ready ||
							cart.busy ||
							quantity < 1 ||
							!Number.isInteger(quantity) ||
							quantity > available
						}
						onClick={() => {
							const existing =
								cart.store.lines.find(
									(l) => l.productId === p.id && l.packageId === packageId,
								)?.quantity ?? 0;
							if (cart.setQuantity(p.id, packageId, existing + quantity))
								setNotice("Lisensi ditambahkan ke keranjang.");
						}}
					>
						Tambah ke keranjang
					</Button>
					{cart.ready && quantity > available && (
						<p role="status" className="mt-3 text-sm text-muted">
							{available === 0
								? "Kuota promo sudah habis atau seluruhnya ada di keranjang."
								: `Maksimal tambahan ${available} lisensi.`}
						</p>
					)}
					{notice && (
						<Alert tone="success" className="mt-4">
							{notice}{" "}
							<Link href="/cart" className="underline">
								Lihat keranjang
							</Link>
						</Alert>
					)}
					{cart.error && (
						<Alert className="mt-4" tone="danger">
							{cart.error}
						</Alert>
					)}
				</Card>
			</div>
		</section>
	);
}
export function CartPage() {
	const cart = useCart();
	return (
		<section className="py-12">
			<Intro
				title="Keranjangmu"
				description="Atur jumlah lisensi sebelum melanjutkan. Kuota promo dihitung dari total semua paket pada produk yang sama."
			/>
			{cart.error && (
				<Alert tone="warning" className="mb-5">
					{cart.error}
				</Alert>
			)}
			{!cart.ready ? (
				<p role="status">Memuat keranjang…</p>
			) : !cart.store.lines.length ? (
				<Card>
					<h2 className="text-xl font-semibold">Keranjang masih kosong</h2>
					<Link
						href="/products"
						className="mt-4 inline-block text-accent underline"
					>
						Jelajahi marketplace →
					</Link>
				</Card>
			) : (
				<div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
					<div className="grid gap-4">
						{cart.store.lines.map((line) => {
							const data = resolve(line);
							if (!data) return null;
							const max =
								remaining(cart.store, line.productId) -
								count(cart.store.lines, line.productId) +
								line.quantity;
							return (
								<Card
									key={`${line.productId}-${line.packageId}`}
									className="p-5"
								>
									<div className="flex flex-wrap justify-between gap-4">
										<div>
											<Link
												href={`/products/${data.product.slug}`}
												className="font-semibold hover:underline"
											>
												{data.product.name}
											</Link>
											<p className="mt-1 text-sm text-muted">
												{data.pack.name} · {money(data.pack.promoPrice)} /{" "}
												{data.product.unit}
											</p>
										</div>
										<Button
											size="sm"
											variant="ghost"
											disabled={cart.busy}
											onClick={() =>
												cart.setQuantity(line.productId, line.packageId, 0)
											}
										>
											Hapus
										</Button>
									</div>
									<div className="mt-5 flex flex-wrap items-center justify-between gap-4">
										<div className="flex items-center gap-3">
											<Button
												size="sm"
												variant="secondary"
												aria-label={`Kurangi ${data.product.name} ${data.pack.name}`}
												disabled={cart.busy || line.quantity <= 1}
												onClick={() =>
													cart.setQuantity(
														line.productId,
														line.packageId,
														line.quantity - 1,
													)
												}
											>
												−
											</Button>
											<Input
												aria-label={`Jumlah ${data.product.name} ${data.pack.name}`}
												className="w-20 text-center"
												type="number"
												min={1}
												max={max}
												value={line.quantity}
												disabled={cart.busy}
												onChange={(e) => {
													const n = Number(e.target.value);
													if (n >= 1)
														cart.setQuantity(line.productId, line.packageId, n);
												}}
											/>
											<Button
												size="sm"
												variant="secondary"
												aria-label={`Tambah ${data.product.name} ${data.pack.name}`}
												disabled={cart.busy || line.quantity >= max}
												onClick={() =>
													cart.setQuantity(
														line.productId,
														line.packageId,
														line.quantity + 1,
													)
												}
											>
												+
											</Button>
										</div>
										<strong>
											{money(data.pack.promoPrice * line.quantity)}
										</strong>
									</div>
									<p className="mt-3 text-xs text-muted">
										Total produk di keranjang:{" "}
										{count(cart.store.lines, line.productId)} /{" "}
										{remaining(cart.store, line.productId)} kuota promo.
									</p>
								</Card>
							);
						})}
					</div>
					<Card className="lg:sticky lg:top-6">
						<h2 className="font-semibold">Ringkasan</h2>
						<div className="my-6 flex justify-between">
							<span>Total</span>
							<strong>{money(total(cart.store.lines))}</strong>
						</div>
						<Link
							href="/checkout"
							className={buttonClassName({ className: "w-full" })}
						>
							Lanjut checkout →
						</Link>
						<p className="mt-4 text-xs text-muted">
							Produk digital. Tidak ada ongkos kirim.
						</p>
					</Card>
				</div>
			)}
		</section>
	);
}
