"use client";

import type { Locale } from "@jortemplate/types";
import { Alert, Button, EmptyState } from "@jortemplate/ui";
import { useEffect, useState } from "react";
import { LeadCaptureForm } from "@/features/forms/LeadCaptureForm";
import { usePublishedCms } from "./hooks";
import { FaqSection, HeroSection, TestimonialsSection } from "./sections";

export function LandingPage() {
	const query = usePublishedCms();
	const [locale, setLocale] = useState<Locale>("idn");
	const english = locale === "eng";
	useEffect(() => {
		const previous = document.documentElement.lang;
		document.documentElement.lang = english ? "en" : "id";
		return () => {
			document.documentElement.lang = previous;
		};
	}, [english]);

	if (query.isPending)
		return (
			<div
				className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-[60px] [&>p]:text-muted [&>div]:max-w-[640px]"
				role="status"
			>
				<div className="h-2 w-[200px] rounded-lg bg-[linear-gradient(90deg,#d4e0d4,#eef4eb,#d4e0d4)] bg-size-[200%_100%] animate-page-load motion-reduce:animate-none" />
				<p>Memuat halaman…</p>
			</div>
		);
	if (!query.data && query.isError)
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-[60px] [&>p]:text-muted [&>div]:max-w-[640px]">
				<EmptyState
					className="w-full max-w-[640px]"
					title="Halaman belum bisa ditampilkan"
					description="Periksa koneksi kamu dan coba lagi."
					action={
						<Button
							loading={query.isFetching}
							onClick={() => {
								void query.refetch();
							}}
						>
							Coba lagi
						</Button>
					}
				/>
			</div>
		);
	const sections = [...(query.data?.sections ?? [])].sort(
		(a, b) => a.order - b.order,
	);
	if (!query.data?.version || !sections.length)
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-[60px] [&>p]:text-muted [&>div]:max-w-[640px]">
				<EmptyState
					className="w-full max-w-[640px]"
					title="Halaman segera hadir"
					description="Silakan kunjungi lagi nanti."
				/>
			</div>
		);

	return (
		<div>
			<fieldset className="ml-auto flex w-fit items-center justify-end gap-1.5 pt-6 [&_legend]:mb-2 [&_legend]:text-xs [&_legend]:text-muted">
				<legend>{english ? "Language" : "Bahasa"}</legend>
				<Button
					variant={english ? "ghost" : "primary"}
					size="sm"
					className="px-3 py-[7px] text-xs"
					aria-pressed={!english}
					aria-label="Bahasa Indonesia"
					onClick={() => setLocale("idn")}
				>
					ID
				</Button>
				<Button
					variant={english ? "primary" : "ghost"}
					size="sm"
					className="px-3 py-[7px] text-xs"
					aria-pressed={english}
					aria-label="English"
					onClick={() => setLocale("eng")}
				>
					EN
				</Button>
			</fieldset>
			{query.isError && (
				<Alert tone="warning">
					{english
						? "This page may be out of date."
						: "Informasi mungkin belum terbaru."}{" "}
					<button
						type="button"
						className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-inherit underline focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-5"
						onClick={() => {
							void query.refetch();
						}}
					>
						{english ? "Refresh" : "Muat ulang"}
					</button>
				</Alert>
			)}
			{!sections.some((section) => section.section === "hero") && (
				<h1 className="sr-only">Kodeva</h1>
			)}
			{sections.map((section) => {
				switch (section.section) {
					case "hero":
						return (
							<HeroSection
								key={section.section}
								items={section.payload}
								locale={locale}
							/>
						);
					case "testimonials":
						return (
							<TestimonialsSection
								key={section.section}
								items={section.payload}
								locale={locale}
							/>
						);
					case "faq":
						return (
							<FaqSection
								key={section.section}
								items={section.payload}
								locale={locale}
							/>
						);
					case "leadcapture":
						return section.payload[0] ? (
							<LeadCaptureForm
								key={section.section}
								item={section.payload[0]}
								locale={locale}
							/>
						) : null;
					default:
						return null;
				}
			})}
		</div>
	);
}
