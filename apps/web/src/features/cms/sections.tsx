"use client";

import type {
	FaqPayload,
	HeroPayload,
	Locale,
	TestimonialPayload,
} from "@jortemplate/types";
import { Button, buttonClassName, Card } from "@jortemplate/ui";
import Image from "next/image";
import { useState } from "react";
import { track } from "@/lib/marketing";

function CmsImage({
	src,
	alt,
	locale,
	avatar = false,
}: {
	src: string;
	alt: string;
	locale: Locale;
	avatar?: boolean;
}) {
	const [failedSource, setFailedSource] = useState<string | null>(null);
	const failed = !src || failedSource === src;
	return (
		<div
			className={
				avatar
					? "size-11 shrink-0 overflow-hidden rounded-full [&_div[role=img]]:text-lg [&_div[role=img]]:font-semibold"
					: "aspect-[5/4] overflow-hidden rounded-3xl bg-[#e9efe7]"
			}
		>
			{failed ? (
				<div
					className="flex size-full flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_30%_20%,#eef3ea,#dde8db)] text-[13px] text-[#6b826e] [&_svg]:size-12 [&_svg]:opacity-70"
					role="img"
					aria-label={
						locale === "idn"
							? `Gambar ${alt} belum tersedia`
							: `Image for ${alt} is unavailable`
					}
				>
					{avatar ? (
						<span aria-hidden="true">{alt.slice(0, 1)}</span>
					) : (
						<>
							<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
								<rect
									x="5"
									y="8"
									width="38"
									height="32"
									rx="6"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<circle
									cx="17"
									cy="19"
									r="3"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<path
									d="m6 33 10-9 9 8 8-13 10 15"
									stroke="currentColor"
									strokeWidth="2"
								/>
							</svg>
							<span>
								{locale === "idn"
									? "Gambar belum tersedia"
									: "Image unavailable"}
							</span>
						</>
					)}
				</div>
			) : (
				<Image
					className="block size-full object-cover"
					src={src}
					alt={alt}
					width={avatar ? 80 : 1200}
					height={avatar ? 80 : 900}
					sizes={
						avatar
							? "44px"
							: "(max-width: 760px) calc(100vw - 40px), (max-width: 1244px) 45vw, 558px"
					}
					unoptimized={!src.startsWith("https://cdn.dicobainaja.com/uploads/")}
					loading={avatar ? "lazy" : "eager"}
					fetchPriority={avatar ? "auto" : "high"}
					onError={() => setFailedSource(src)}
				/>
			)}
		</div>
	);
}

export function HeroSection({
	items,
	locale,
}: {
	items: HeroPayload[];
	locale: Locale;
}) {
	const [index, setIndex] = useState(0);
	const active = items.length ? index % items.length : 0;
	const item = items[active];
	if (!item) return null;
	return (
		<section
			id="hero"
			className="grid grid-cols-2 items-center gap-16 pt-[52px] pb-24 max-[1000px]:gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-9 max-[760px]:pt-10 max-[760px]:pb-16"
			aria-label={locale === "idn" ? "Sorotan" : "Highlights"}
			aria-roledescription="carousel"
		>
			<div>
				<p className="mb-[22px] text-[11px] font-bold tracking-[2px] leading-[1.6] text-accent">
					Kodeva · {locale === "idn" ? "SELAMAT DATANG" : "WELCOME"}
				</p>
				<h1 className="mb-7 text-[clamp(40px,5.7vw,68px)] leading-[1.05] font-semibold tracking-[-2.8px] wrap-anywhere max-[760px]:tracking-[-1.8px]">
					{item.title[locale]}
				</h1>
				<p className="mb-8 max-w-[480px] text-lg leading-[1.75] whitespace-pre-line text-muted">
					{item.subtitle[locale]}
				</p>
				<a
					className={buttonClassName({
						size: "lg",
						className: "gap-8 hover:bg-accent",
					})}
					href={item.cta.url}
					onClick={() =>
						track("cta_click", {
							cta_id: `hero-${active}`,
							cta_text: item.cta.label[locale],
							section: "hero",
							destination: item.cta.url.split("?")[0],
							language: locale,
						})
					}
				>
					{item.cta.label[locale]} <span aria-hidden="true">↗</span>
				</a>
				{items.length > 1 && (
					<div className="mt-12 flex items-center gap-4 max-[760px]:mt-7">
						<Button
							variant="secondary"
							className="size-10 rounded-full p-0"
							size="sm"
							aria-label={
								locale === "idn" ? "Slide sebelumnya" : "Previous slide"
							}
							onClick={() =>
								setIndex((active + items.length - 1) % items.length)
							}
						>
							←
						</Button>
						<span
							className="text-xs text-muted tabular-nums"
							aria-live="polite"
						>
							{String(active + 1).padStart(2, "0")} /{" "}
							{String(items.length).padStart(2, "0")}
						</span>
						<Button
							variant="secondary"
							className="size-10 rounded-full p-0"
							size="sm"
							aria-label={locale === "idn" ? "Slide berikutnya" : "Next slide"}
							onClick={() => setIndex((active + 1) % items.length)}
						>
							→
						</Button>
					</div>
				)}
			</div>
			<div className="relative after:absolute after:-right-4 after:-bottom-4 after:-z-1 after:h-1/4 after:w-[45%] after:rounded-[20px] after:border after:border-[#c8d6c9] after:content-[''] max-[760px]:after:-right-2 max-[760px]:after:-bottom-2">
				<CmsImage
					key={item.image}
					src={item.image}
					alt={item.title[locale]}
					locale={locale}
				/>
			</div>
		</section>
	);
}

export function TestimonialsSection({
	items,
	locale,
}: {
	items: TestimonialPayload[];
	locale: Locale;
}) {
	return (
		<section
			id="testimonials"
			className="border-t border-line py-20 max-[760px]:py-[52px]"
			aria-labelledby="testimonials-title"
		>
			<p className="mb-[22px] text-[11px] font-bold tracking-[2px] leading-[1.6] text-accent">
				{locale === "idn" ? "TESTIMONIAL" : "TESTIMONIALS"}
			</p>
			<h2
				className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
				id="testimonials-title"
			>
				{locale === "idn" ? "Yang mereka katakan." : "What people say."}
			</h2>
			<div className="grid grid-cols-4 gap-[18px] max-[1000px]:grid-cols-2 max-[440px]:grid-cols-1">
				{items.map((item) => (
					<Card
						className="flex h-full flex-col p-[26px] [&_blockquote]:mb-7 [&_blockquote]:flex-1 [&_blockquote]:text-[15px] [&_blockquote]:leading-[1.8] [&_blockquote]:whitespace-pre-line"
						key={item.title[locale]}
					>
						<span
							className="font-[Georgia,serif] text-[64px] leading-none text-[#b6cbb7]"
							aria-hidden="true"
						>
							“
						</span>
						<blockquote>{item.subtitle[locale]}</blockquote>
						<div className="flex items-center gap-3 [&_h3]:text-[13px] [&_h3]:leading-normal [&_h3]:font-semibold [&_h3]:wrap-anywhere">
							<CmsImage
								src={item.image}
								alt={item.title[locale]}
								locale={locale}
								avatar
							/>
							<h3>{item.title[locale]}</h3>
						</div>
					</Card>
				))}
			</div>
		</section>
	);
}

export function FaqSection({
	items,
	locale,
}: {
	items: FaqPayload[];
	locale: Locale;
}) {
	return (
		<section
			id="faq"
			className="border-t border-line py-20 max-[760px]:py-[52px] grid grid-cols-[1fr_1.4fr] gap-[72px] max-[760px]:grid-cols-1 max-[760px]:gap-2"
			aria-labelledby="faq-title"
		>
			<div>
				<p className="mb-[22px] text-[11px] font-bold tracking-[2px] leading-[1.6] text-accent">
					FAQ
				</p>
				<h2
					className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
					id="faq-title"
				>
					{locale === "idn" ? "Ada pertanyaan?" : "Have questions?"}
				</h2>
			</div>
			<div>
				{items.map((item) => (
					<details
						className="group border-b border-line first:border-t"
						key={item.title[locale]}
						name="landing-faq"
					>
						<summary className="relative cursor-pointer list-none py-6 pr-10 text-base leading-normal font-semibold [&::-webkit-details-marker]:hidden after:absolute after:top-5 after:right-1 after:text-[26px] after:font-normal after:text-accent after:content-['+'] group-open:after:content-['−'] focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-5">
							{item.title[locale]}
						</summary>
						<p className="pr-9 pb-6 text-[15px] leading-[1.8] whitespace-pre-line text-muted">
							{item.subtitle[locale]}
						</p>
					</details>
				))}
			</div>
		</section>
	);
}
