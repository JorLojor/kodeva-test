import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BlogDetailView } from "@/features/blog/BlogView";
import { type BlogArticle, blogArticleOptions } from "@/features/blog/queries";
import { ApiError, apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";
type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ lang?: string; page?: string }>;
};
const getArticle = cache(async (slug: string) => {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 255) notFound();
	try {
		return await apiRequest<BlogArticle>(
			`/blog/published/${encodeURIComponent(slug)}`,
		);
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) notFound();
		return null;
	}
});
export async function generateMetadata({
	params,
	searchParams,
}: Props): Promise<Metadata> {
	const article = await getArticle((await params).slug);
	const locale = (await searchParams).lang === "eng" ? "eng" : "idn";
	return article
		? {
				title: article.contentPayload.title[locale],
				description: article.contentPayload.excerpt[locale],
				openGraph: {
					type: "article",
					title: article.contentPayload.title[locale],
					description: article.contentPayload.excerpt[locale],
					images: [article.coverImage],
				},
			}
		: { title: "Blog" };
}
export default async function BlogDetailPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const options = await searchParams;
	const locale = options.lang === "eng" ? "eng" : "idn";
	const number = Number(options.page);
	const page =
		Number.isInteger(number) && number >= 1 && number <= 10000 ? number : 1;
	const article = await getArticle(slug);
	const client = new QueryClient();
	if (article) client.setQueryData(blogArticleOptions(slug).queryKey, article);
	return (
		<HydrationBoundary state={dehydrate(client)}>
			<BlogDetailView key={slug} slug={slug} locale={locale} page={page} />
		</HydrationBoundary>
	);
}
