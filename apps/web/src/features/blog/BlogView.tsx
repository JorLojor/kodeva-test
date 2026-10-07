"use client";

import type { Locale } from "@jortemplate/types";
import { Button, buttonClassName, EmptyState } from "@jortemplate/ui";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { blogArticleOptions, blogListOptions } from "./queries";

function BlogImage({
	src,
	alt,
	variant = "card",
}: {
	src: string;
	alt: string;
	variant?: "card" | "cover" | "content";
}) {
	const [failed, setFailed] = useState(false);
	return (
		<div
			className={
				variant === "cover"
					? "aspect-[4/3] overflow-hidden rounded-2xl bg-line sm:aspect-[2/1] sm:rounded-3xl"
					: variant === "content"
						? "overflow-hidden rounded-xl border border-line bg-white"
						: "aspect-[16/10] overflow-hidden rounded-2xl bg-line"
			}
		>
			{failed || !src ? (
				<div
					role="img"
					aria-label={alt}
					className={`flex size-full items-center justify-center bg-[radial-gradient(ellipse_at_top_left,#eef3ea,#dde8db)] text-3xl font-bold tracking-tight text-accent ${variant === "content" ? "aspect-[2/1]" : ""}`}
				>
					Kodeva.
				</div>
			) : (
				<Image
					src={src}
					alt={alt}
					width={1200}
					height={750}
					unoptimized
					className={
						variant === "content"
							? "mx-auto block h-auto max-h-[640px] w-full object-contain"
							: "size-full object-cover"
					}
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
}
function Languages({ path, locale }: { path: string; locale: Locale }) {
	const separator = path.includes("?") ? "&" : "?";
	return (
		<nav aria-label="Bahasa artikel" className="flex gap-2">
			{(["idn", "eng"] as const).map((language) => (
				<Link
					key={language}
					href={`${path}${separator}lang=${language}`}
					aria-current={language === locale ? "page" : undefined}
					className={buttonClassName({
						size: "sm",
						variant: language === locale ? "primary" : "ghost",
					})}
				>
					{language === "idn" ? "ID" : "EN"}
				</Link>
			))}
		</nav>
	);
}
function QueryError({
	retry,
	loading,
}: {
	retry: () => void;
	loading: boolean;
}) {
	return (
		<EmptyState
			title="Konten belum bisa dimuat"
			description="Periksa koneksi dan coba lagi."
			action={
				<Button onClick={retry} loading={loading}>
					Coba lagi
				</Button>
			}
		/>
	);
}
function ArticleDate({ value, locale }: { value: string; locale: Locale }) {
	return (
		<time dateTime={value} className="text-xs text-muted">
			{new Intl.DateTimeFormat(locale === "idn" ? "id-ID" : "en-US", {
				dateStyle: "long",
				timeZone: "Asia/Jakarta",
			}).format(new Date(value))}
		</time>
	);
}
export function BlogListView({
	page,
	locale,
}: {
	page: number;
	locale: Locale;
}) {
	const query = useQuery(blogListOptions(page));
	const english = locale === "eng";
	return (
		<section lang={english ? "en" : "id"} className="py-10 md:py-16">
			<header className="mb-12 flex flex-wrap items-start justify-between gap-6">
				<div>
					<p className="mb-3 text-xs font-bold tracking-widest text-accent">
						KODEVA JOURNAL
					</p>
					<h1 className="text-5xl font-semibold tracking-tight">Blog</h1>
					<p className="mt-4 text-muted">
						{english
							? "Stories, ideas, and our latest updates."
							: "Cerita, inspirasi, dan informasi terbaru dari kami."}
					</p>
				</div>
				<Languages path={`/blog?page=${page}`} locale={locale} />
			</header>
			{query.isPending ? (
				<p role="status" className="py-20 text-center text-muted">
					Memuat artikel…
				</p>
			) : query.isError ? (
				<QueryError
					retry={() => void query.refetch()}
					loading={query.isFetching}
				/>
			) : query.data.items.length ? (
				<div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
					{query.data.items.map((item) => (
						<article key={item.publicId} className="min-w-0">
							<Link
								href={`/blog/${item.slug}?lang=${locale}&page=${page}`}
								className="group block rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus"
							>
								<BlogImage
									key={item.coverImage}
									src={item.coverImage}
									alt={item.title[locale]}
								/>
								<div className="pt-5">
									<ArticleDate value={item.createdAt} locale={locale} />
									<h2 className="mt-3 text-2xl leading-snug font-semibold tracking-tight wrap-anywhere group-hover:text-accent">
										{item.title[locale]}
									</h2>
									<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
										{item.excerpt[locale]}
									</p>
									<span className="mt-5 inline-block text-sm font-semibold text-accent">
										{english ? "Read article" : "Baca artikel"} ↗
									</span>
								</div>
							</Link>
						</article>
					))}
				</div>
			) : (
				<EmptyState
					title={english ? "No articles here yet" : "Belum ada artikel di sini"}
					description={
						english
							? "Please visit again later."
							: "Silakan kunjungi lagi nanti."
					}
				/>
			)}
			<nav
				aria-label="Pagination blog"
				className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"
			>
				{page > 1 ? (
					<Link
						className={buttonClassName({ variant: "secondary" })}
						href={`/blog?page=${page - 1}&lang=${locale}`}
					>
						← {english ? "Previous" : "Sebelumnya"}
					</Link>
				) : (
					<Button variant="secondary" disabled>
						← {english ? "Previous" : "Sebelumnya"}
					</Button>
				)}
				<span className="text-sm text-muted">
					{english ? "Page" : "Halaman"} {page}
				</span>
				{!query.isError && query.data?.hasMore ? (
					<Link
						className={buttonClassName({ variant: "secondary" })}
						href={`/blog?page=${page + 1}&lang=${locale}`}
					>
						{english ? "Next" : "Berikutnya"} →
					</Link>
				) : (
					<Button variant="secondary" disabled>
						{english ? "Next" : "Berikutnya"} →
					</Button>
				)}
			</nav>
		</section>
	);
}
export function BlogDetailView({
	slug,
	locale,
	page,
}: {
	slug: string;
	locale: Locale;
	page: number;
}) {
	const query = useQuery(blogArticleOptions(slug));
	const english = locale === "eng";
	const article = query.data;
	const readingMinutes = article
		? Math.max(
				1,
				Math.ceil(
					article.contentPayload.content.reduce(
						(total, block) =>
							total +
							block.text[locale].trim().split(/\s+/).filter(Boolean).length,
						0,
					) / 200,
				),
			)
		: 1;
	return (
		<div
			lang={english ? "en" : "id"}
			className="mx-auto max-w-5xl pt-6 pb-16 sm:pt-8 sm:pb-24"
		>
			<div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5 sm:mb-14">
				<Link
					className="rounded-md py-2 text-sm font-semibold text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
					href={`/blog?page=${page}&lang=${locale}`}
				>
					← {english ? "All articles" : "Semua artikel"}
				</Link>
				<Languages path={`/blog/${slug}?page=${page}`} locale={locale} />
			</div>
			{query.isPending ? (
				<p role="status" className="py-20 text-center text-muted">
					Memuat artikel…
				</p>
			) : query.isError ? (
				query.error instanceof ApiError && query.error.status === 404 ? (
					<EmptyState
						title="Artikel tidak ditemukan"
						description="Artikel mungkin sudah tidak tersedia."
					/>
				) : (
					<QueryError
						retry={() => void query.refetch()}
						loading={query.isFetching}
					/>
				)
			) : (
				article && (
					<article>
						<header className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
							<p className="mb-5 text-[11px] font-bold tracking-[0.2em] text-accent">
								KODEVA JOURNAL
							</p>
							<h1 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.15] font-semibold tracking-[-0.035em] text-balance wrap-anywhere">
								{article.contentPayload.title[locale]}
							</h1>
							<p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty wrap-anywhere text-muted sm:text-lg">
								{article.contentPayload.excerpt[locale]}
							</p>
							<div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
								<ArticleDate value={article.createdAt} locale={locale} />
								<span aria-hidden="true">·</span>
								<span>
									{readingMinutes} {english ? "min read" : "menit baca"}
								</span>
							</div>
						</header>
						<BlogImage
							variant="cover"
							key={article.coverImage}
							src={article.coverImage}
							alt={article.contentPayload.title[locale]}
						/>
						<div className="mx-auto mt-10 grid max-w-[680px] gap-10 sm:mt-14 sm:gap-12">
							{article.contentPayload.content.map((block, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Published blocks are ordered and have no IDs.
								<section key={index} className="min-w-0 space-y-6 sm:space-y-8">
									<div className="space-y-5 text-base leading-[1.85] text-ink/90 sm:text-lg">
										{block.text[locale]
											.split(/\n\s*\n/)
											.filter((paragraph) => paragraph.trim())
											.map((paragraph, paragraphIndex) => (
												<p
													// biome-ignore lint/suspicious/noArrayIndexKey: Paragraphs retain their order within a published block.
													key={paragraphIndex}
													className="text-justify whitespace-pre-line wrap-anywhere"
												>
													{paragraph}
												</p>
											))}
									</div>
									{block.image && (
										<BlogImage
											variant="content"
											key={block.image}
											src={block.image}
											alt={`${article.contentPayload.title[locale]} — ${index + 1}`}
										/>
									)}
									{block.cta && (
										<a
											href={block.cta.url}
											className={buttonClassName({
												variant: "secondary",
												className: "max-w-full whitespace-normal text-center",
											})}
										>
											{block.cta.label[locale]} ↗
										</a>
									)}
								</section>
							))}
						</div>
						<footer className="mx-auto mt-12 flex max-w-[680px] flex-wrap items-center justify-between gap-4 border-t border-line pt-6 sm:mt-16">
							<span className="text-sm font-semibold tracking-tight">
								Kodeva<span className="text-accent">.</span>
							</span>
							<Link
								href={`/blog?page=${page}&lang=${locale}`}
								className="rounded-md text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
							>
								{english ? "Explore more articles" : "Jelajahi artikel lainnya"}{" "}
								→
							</Link>
						</footer>
					</article>
				)
			)}
		</div>
	);
}
