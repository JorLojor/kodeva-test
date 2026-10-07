import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { BlogListView } from "@/features/blog/BlogView";
import { blogListOptions } from "@/features/blog/queries";

export const metadata: Metadata = {
	title: "Blog",
	description: "Cerita, inspirasi, dan informasi terbaru dari Kodeva.",
};
export const dynamic = "force-dynamic";
export default async function BlogPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; lang?: string }>;
}) {
	const params = await searchParams;
	const number = Number(params.page);
	const page =
		Number.isInteger(number) && number >= 1 && number <= 10000 ? number : 1;
	const locale = params.lang === "eng" ? "eng" : "idn";
	const client = new QueryClient();
	await client.prefetchQuery({ ...blogListOptions(page), retry: false });
	return (
		<HydrationBoundary state={dehydrate(client)}>
			<BlogListView page={page} locale={locale} />
		</HydrationBoundary>
	);
}
