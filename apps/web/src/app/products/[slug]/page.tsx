import { notFound } from "next/navigation";
import { ProductDetail } from "@/features/marketplace/Marketplace";
import { products } from "@/features/marketplace/model";
export function generateStaticParams() {
	return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return {
		title:
			products.find((p) => p.slug === slug)?.name ?? "Produk tidak ditemukan",
	};
}
export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	if (!products.some((p) => p.slug === slug)) notFound();
	return <ProductDetail slug={slug} />;
}
