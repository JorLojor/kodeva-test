import {
	Alert,
	Badge,
	Button,
	Card,
	FormField,
	Textarea,
} from "@jortemplate/ui";
import { useEffect, useRef, useState } from "react";
import { CampaignDetails } from "../../components/CampaignDetails";
import { useOrder, useOrders, useReview } from "../../features/orders/hooks";
import { requestBlob } from "../../lib/api";

const labels = {
	awaiting_payment: "Menunggu pembayaran",
	review: "Menunggu verifikasi",
	paid: "Lunas",
	rejected: "Bukti ditolak",
	expired: "Kedaluwarsa",
	cancelled: "Dibatalkan",
};
const money = (n: number) =>
	new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(n);
function Proof({ id, version }: { id: string; version: string }) {
	const [url, setUrl] = useState("");
	const [error, setError] = useState("");
	const [retry, setRetry] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Reload private proof after a new upload or explicit retry.
	useEffect(() => {
		let objectUrl = "";
		const controller = new AbortController();
		setUrl("");
		setError("");
		void requestBlob(`/orders/admin/${id}/proof`, controller.signal)
			.then((blob) => {
				if (controller.signal.aborted) return;
				objectUrl = URL.createObjectURL(blob);
				setUrl(objectUrl);
			})
			.catch(() => {
				if (!controller.signal.aborted) setError("Bukti belum bisa dimuat");
			});
		return () => {
			controller.abort();
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [id, version, retry]);
	return error ? (
		<Alert tone="danger">
			{error}
			<Button onClick={() => setRetry((n) => n + 1)}>Coba lagi</Button>
		</Alert>
	) : url ? (
		<a href={url} target="_blank" rel="noreferrer" className="block">
			<img
				src={url}
				alt="Bukti transfer pembeli"
				className="max-h-[650px] w-full rounded-xl object-contain"
			/>
			<span className="mt-3 block text-sm text-accent">
				Buka ukuran penuh ↗
			</span>
		</a>
	) : (
		<p role="status">Memuat bukti…</p>
	);
}
function Detail({ id, onBack }: { id: string; onBack: () => void }) {
	const query = useOrder(id);
	const review = useReview(id);
	const [reason, setReason] = useState("");
	const lock = useRef(false);
	const [notice, setNotice] = useState("");
	if (query.isPending) return <p role="status">Memuat pesanan…</p>;
	if (query.isError)
		return (
			<Alert tone="danger">
				Pesanan belum bisa dimuat.<Button onClick={onBack}>Kembali</Button>
				<Button onClick={() => void query.refetch()}>Coba lagi</Button>
			</Alert>
		);
	const order = query.data;
	async function decide(decision: "paid" | "rejected") {
		if (lock.current || (decision === "rejected" && !reason.trim())) return;
		if (
			!window.confirm(
				decision === "paid"
					? "Konfirmasi pembayaran sudah diterima dan sesuai total pesanan?"
					: "Tolak bukti transfer dengan alasan ini?",
			)
		)
			return;
		lock.current = true;
		try {
			await review.mutateAsync({ decision, reason, version: order.updatedAt });
			setNotice(
				decision === "paid"
					? "Pembayaran disetujui."
					: "Bukti ditolak. Pembeli dapat mengupload ulang.",
			);
			setReason("");
		} catch {
			/* Error shown below. */
		} finally {
			lock.current = false;
		}
	}
	return (
		<>
			<Button variant="ghost" disabled={review.isPending} onClick={onBack}>
				← Daftar pesanan
			</Button>
			<div className="mt-5 grid items-start gap-6 lg:grid-cols-2">
				<Card>
					<Badge>{labels[order.status]}</Badge>
					<h1 className="my-5 text-2xl font-semibold">
						Pesanan {order.publicId.slice(0, 8)}
					</h1>
					<p>{order.buyer.name}</p>
					<p className="text-sm text-muted">{order.buyer.email}</p>
					<p className="text-sm text-muted">{order.buyer.company}</p>
					<p className="mt-3 text-xs text-muted">
						Dibuat {new Date(order.createdAt).toLocaleString("id-ID")}
					</p>
					<div className="my-5">
						<h2 className="mb-2 text-sm font-semibold">Campaign</h2>
						<CampaignDetails attribution={order.attribution} />
					</div>
					<div className="my-6 space-y-4">
						{order.items.map((item) => (
							<div
								key={`${item.productId}-${item.packageId}`}
								className="flex justify-between gap-3 text-sm"
							>
								<span>
									{item.name} · {item.packageName}
									<span className="block text-muted">
										{item.quantity} {item.unit} × {money(item.unitPrice)}
									</span>
								</span>
								<strong>{money(item.quantity * item.unitPrice)}</strong>
							</div>
						))}
					</div>
					<p className="flex justify-between border-t border-line pt-5">
						<span>Total</span>
						<strong>{money(order.total)}</strong>
					</p>
					<p className="mt-4 text-sm text-muted">
						Tujuan: {order.bank.bank} · {order.bank.number} · {order.bank.name}
					</p>
					{order.rejectionReason && (
						<Alert tone="warning" className="mt-5">
							{order.rejectionReason}
						</Alert>
					)}
					{order.status === "review" && (
						<div className="mt-6 space-y-4">
							<p className="text-sm text-muted">
								Periksa mutasi rekening, nominal, dan bukti sebelum menyetujui
								pembayaran.
							</p>
							<FormField
								htmlFor="reject-reason"
								label="Alasan penolakan (wajib jika ditolak)"
							>
								<Textarea
									id="reject-reason"
									value={reason}
									maxLength={1000}
									disabled={review.isPending}
									onChange={(e) => setReason(e.target.value)}
								/>
							</FormField>
							<div className="flex flex-wrap gap-3">
								<Button
									disabled={review.isPending}
									loading={review.isPending}
									onClick={() => void decide("paid")}
								>
									Setujui pembayaran
								</Button>
								<Button
									variant="danger"
									disabled={review.isPending || !reason.trim()}
									onClick={() => void decide("rejected")}
								>
									Tolak bukti
								</Button>
							</div>
						</div>
					)}
					{review.error && (
						<Alert tone="danger" className="mt-4">
							{review.error.message}
							<Button
								variant="ghost"
								onClick={() => {
									review.reset();
									void query.refetch();
								}}
							>
								Muat ulang pesanan
							</Button>
						</Alert>
					)}
					{notice && (
						<Alert tone="success" className="mt-4">
							{notice}
						</Alert>
					)}
				</Card>
				<Card>
					<h2 className="mb-5 text-xl font-semibold">Bukti transfer</h2>
					{order.hasProof ? (
						<Proof id={id} version={order.updatedAt} />
					) : (
						<p className="text-muted">Pembeli belum mengupload bukti.</p>
					)}
				</Card>
			</div>
		</>
	);
}
export function OrdersPage() {
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<string | null>(null);
	const query = useOrders(page);
	return (
		<section className="mx-auto max-w-7xl px-6 py-10">
			{selected ? (
				<Detail key={selected} id={selected} onBack={() => setSelected(null)} />
			) : (
				<>
					<header className="mb-6 flex items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-semibold">Pesanan</h1>
							<p className="mt-2 text-sm text-muted">
								Pembelian marketplace dan verifikasi transfer manual.
							</p>
						</div>
						<Button
							variant="secondary"
							disabled={query.isFetching}
							onClick={() => void query.refetch()}
						>
							Refresh
						</Button>
					</header>
					{query.isError ? (
						<Alert tone="danger">Daftar pesanan belum bisa dimuat.</Alert>
					) : query.isPending ? (
						<p role="status">Memuat pesanan…</p>
					) : (
						<Card className="overflow-x-auto p-0">
							<table className="w-full text-left text-sm">
								<thead className="bg-paper">
									<tr>
										{["Pesanan", "Pembeli", "Total", "Status", "Aksi"].map(
											(t) => (
												<th key={t} scope="col" className="p-4">
													{t}
												</th>
											),
										)}
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{query.data.items.map((order) => (
										<tr key={order.publicId}>
											<td className="p-4">
												{order.publicId.slice(0, 8)}
												<span className="block text-xs text-muted">
													{new Date(order.createdAt).toLocaleDateString(
														"id-ID",
													)}
												</span>
											</td>
											<td className="p-4">
												{order.buyer.name}
												<span className="block text-xs text-muted">
													{order.buyer.email}
												</span>
											</td>
											<td className="p-4 whitespace-nowrap">
												{money(order.total)}
											</td>
											<td className="p-4">
												<Badge>{labels[order.status]}</Badge>
											</td>
											<td className="p-4">
												<Button
													size="sm"
													variant="secondary"
													onClick={() => setSelected(order.publicId)}
												>
													Lihat pesanan
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{!query.data.items.length && (
								<p className="p-8 text-center text-muted">Belum ada pesanan.</p>
							)}
						</Card>
					)}
					<footer className="mt-5 flex items-center justify-between">
						<span className="text-sm text-muted">Halaman {page}</span>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="secondary"
								disabled={page === 1 || query.isFetching}
								onClick={() => setPage((n) => n - 1)}
							>
								Sebelumnya
							</Button>
							<Button
								size="sm"
								variant="secondary"
								disabled={
									!query.data?.hasMore || query.isFetching || query.isError
								}
								onClick={() => setPage((n) => n + 1)}
							>
								Berikutnya
							</Button>
						</div>
					</footer>
				</>
			)}
		</section>
	);
}
