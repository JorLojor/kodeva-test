import { Alert, Badge, Button, Card } from "@jortemplate/ui";
import { useState } from "react";
import { BlogEditor, type EditorState } from "../../features/blog/BlogEditor";
import { useBlogs } from "../../features/blog/hooks";

const labels = { pending: "Draft", active: "Published", inactive: "Nonaktif" };
export function Blog({
	onEditorStateChange,
}: {
	onEditorStateChange?: (state: EditorState) => void;
}) {
	const [selected, setSelected] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState("");
	const query = useBlogs(page, status);
	if (selected)
		return (
			<BlogEditor
				key={selected}
				id={selected}
				onBack={() => setSelected(null)}
				{...(onEditorStateChange ? { onEditorStateChange } : {})}
			/>
		);
	return (
		<section className="mx-auto max-w-7xl px-6 py-10">
			<header className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="mb-2 text-xs font-bold tracking-widest text-accent">
						KODEVA JOURNAL
					</p>
					<h1 className="text-3xl font-semibold">Blog</h1>
					<p className="mt-2 text-sm text-muted">
						Kelola artikel dan lihat perubahan sebelum dipublish.
					</p>
				</div>
				<Button onClick={() => setSelected("new")}>+ Artikel baru</Button>
			</header>
			<div className="mb-5 flex items-center justify-between gap-4">
				<label className="flex items-center gap-3 text-sm">
					Status
					<select
						className="rounded-lg border border-line bg-white px-3 py-2"
						value={status}
						onChange={(e) => {
							setStatus(e.target.value);
							setPage(1);
						}}
					>
						<option value="">Semua</option>
						<option value="pending">Draft</option>
						<option value="active">Published</option>
						<option value="inactive">Nonaktif</option>
					</select>
				</label>
				<Button
					size="sm"
					variant="secondary"
					disabled={query.isFetching}
					onClick={() => void query.refetch()}
				>
					Refresh
				</Button>
			</div>
			{query.isError && (
				<Alert tone="danger" className="mb-4">
					Daftar artikel belum bisa dimuat. Coba refresh.
				</Alert>
			)}
			<Card className="overflow-hidden p-0">
				{query.isPending ? (
					<p role="status" className="p-10 text-center">
						Memuat artikel…
					</p>
				) : (
					!query.isError &&
					query.data &&
					(query.data.items.length ? (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-paper text-muted">
									<tr>
										{["Artikel", "Status", "Diperbarui", "Aksi"].map(
											(label) => (
												<th key={label} scope="col" className="px-5 py-4">
													{label}
												</th>
											),
										)}
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{query.data.items.map((item) => (
										<tr key={item.publicId}>
											<td className="max-w-lg px-5 py-4">
												<p className="font-semibold wrap-anywhere">
													{item.title.idn}
												</p>
												<p className="mt-1 text-xs wrap-anywhere text-muted">
													/blog/{item.slug}
												</p>
											</td>
											<td className="px-5 py-4">
												<Badge>{labels[item.status]}</Badge>
											</td>
											<td className="px-5 py-4 whitespace-nowrap text-muted">
												{new Date(item.updatedAt).toLocaleDateString("id-ID")}
											</td>
											<td className="px-5 py-4">
												<Button
													size="sm"
													variant="secondary"
													onClick={() => setSelected(item.publicId)}
												>
													Edit artikel
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="p-10 text-center text-muted">
							Belum ada artikel di halaman ini.
						</p>
					))
				)}
				<footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-5">
					<span className="text-sm text-muted">Halaman {page}</span>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="secondary"
							disabled={page === 1 || query.isFetching}
							onClick={() => setPage((p) => p - 1)}
						>
							Sebelumnya
						</Button>
						<Button
							size="sm"
							variant="secondary"
							disabled={
								!query.data?.hasMore || query.isFetching || query.isError
							}
							onClick={() => setPage((p) => p + 1)}
						>
							Berikutnya
						</Button>
					</div>
				</footer>
			</Card>
		</section>
	);
}
