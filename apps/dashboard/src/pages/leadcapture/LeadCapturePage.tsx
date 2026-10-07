import { Alert, Button, Card } from "@jortemplate/ui";
import { useState } from "react";
import { CampaignDetails } from "../../components/CampaignDetails";
import { useLeadCaptures } from "../../features/forms/hooks";
import { ApiError } from "../../lib/api";

export function LeadCapturePage() {
	const [offset, setOffset] = useState(0);
	const query = useLeadCaptures(offset);
	return (
		<section
			aria-labelledby="leads-title"
			className="mx-auto max-w-7xl px-6 py-10"
		>
			<header className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="mb-2 text-xs font-bold tracking-widest text-accent">
						FORM WEBSITE
					</p>
					<h1
						id="leads-title"
						className="text-3xl font-semibold tracking-tight"
					>
						Lead Capture
					</h1>
					<p className="mt-2 text-sm text-muted">
						Kontak yang masuk dari formulir website, terbaru lebih dulu.
					</p>
				</div>
				<Button
					variant="secondary"
					disabled={query.isFetching}
					onClick={() => void query.refetch()}
				>
					{query.isFetching ? "Memuat…" : "Refresh"}
				</Button>
			</header>
			{query.isError && (
				<Alert tone="danger" className="mb-5">
					{query.error instanceof ApiError && query.error.status === 401
						? "Sesi berakhir. Muat ulang halaman untuk login kembali."
						: "Data lead belum bisa dimuat. Klik Refresh untuk mencoba lagi."}
				</Alert>
			)}
			<Card className="overflow-hidden p-0">
				{query.isPending ? (
					<p role="status" className="p-10 text-center text-muted">
						Memuat lead…
					</p>
				) : (
					!query.isError &&
					query.data &&
					(query.data.items.length ? (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<caption className="sr-only">
									Daftar kontak dari formulir website
								</caption>
								<thead className="border-b border-line bg-paper text-muted">
									<tr>
										{[
											"Nama",
											"Email",
											"WhatsApp",
											"Waktu masuk",
											"Campaign",
										].map((label) => (
											<th
												key={label}
												scope="col"
												className="px-6 py-4 font-semibold"
											>
												{label}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{query.data.items.map((lead) => (
										<tr key={lead.publicId} className="hover:bg-paper">
											<td className="max-w-64 px-6 py-5 font-semibold wrap-anywhere">
												{lead.nama}
											</td>
											<td className="px-6 py-5">
												<a
													className="text-accent underline-offset-4 hover:underline"
													href={`mailto:${lead.email}`}
												>
													{lead.email}
												</a>
											</td>
											<td className="px-6 py-5 whitespace-nowrap">
												<a
													className="text-accent underline-offset-4 hover:underline"
													href={`tel:${lead.nomorWa}`}
												>
													{lead.nomorWa}
												</a>
											</td>
											<td className="px-6 py-5 whitespace-nowrap text-muted">
												<time dateTime={lead.createdAt}>
													{new Date(lead.createdAt).toLocaleString("id-ID", {
														dateStyle: "medium",
														timeStyle: "short",
													})}
												</time>
											</td>
											<td className="px-6 py-5 min-w-48">
												<CampaignDetails attribution={lead.attribution} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="p-12 text-center">
							<h2 className="font-semibold">
								{offset
									? "Tidak ada lead di halaman ini"
									: "Belum ada lead masuk"}
							</h2>
							<p className="mt-2 text-sm text-muted">
								{offset
									? "Kembali ke halaman sebelumnya."
									: "Data akan muncul setelah pengunjung mengirim formulir di website."}
							</p>
						</div>
					))
				)}
				<footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
					<p className="text-sm text-muted">
						Halaman {offset / 20 + 1}
						{query.data && !query.isError
							? ` · ${query.data.items.length} lead`
							: ""}
					</p>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="secondary"
							disabled={offset === 0 || query.isFetching}
							onClick={() => setOffset((value) => Math.max(0, value - 20))}
						>
							Sebelumnya
						</Button>
						<Button
							size="sm"
							variant="secondary"
							disabled={
								!query.data?.hasMore || query.isFetching || query.isError
							}
							onClick={() => setOffset((value) => value + 20)}
						>
							Berikutnya
						</Button>
					</div>
				</footer>
			</Card>
		</section>
	);
}
