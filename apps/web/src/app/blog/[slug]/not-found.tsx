import Link from "next/link";
export default function BlogNotFound() {
	return (
		<div className="py-24 text-center">
			<h1 className="text-3xl font-semibold">Artikel tidak ditemukan</h1>
			<p className="mt-4 text-muted">Artikel mungkin sudah tidak tersedia.</p>
			<Link
				href="/blog"
				className="mt-6 inline-block font-semibold text-accent hover:underline"
			>
				← Kembali ke Blog
			</Link>
		</div>
	);
}
