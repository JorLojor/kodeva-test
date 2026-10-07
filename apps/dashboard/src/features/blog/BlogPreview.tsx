import type { Locale } from "@jortemplate/types";
import { Button } from "@jortemplate/ui";
import { useState } from "react";
import type { BlogInput } from "./api";

function PreviewImage({ src }: { src: string }) {
	const [failed, setFailed] = useState(false);
	const valid = /^https?:\/\//.test(src);
	return valid && !failed ? (
		<img
			src={src}
			alt="Gambar artikel"
			onError={() => setFailed(true)}
			className="mx-auto max-h-96 w-full rounded-xl object-contain"
		/>
	) : (
		<div className="flex aspect-[2/1] items-center justify-center rounded-xl bg-line text-xl font-bold text-accent">
			Kodeva.
		</div>
	);
}
export function BlogPreview({ value }: { value: BlogInput }) {
	const [locale, setLocale] = useState<Locale>("idn");
	return (
		<section
			aria-label="Live preview blog"
			className="sticky top-6 min-w-0 overflow-hidden rounded-2xl border border-line bg-paper max-[1100px]:static"
		>
			<header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white p-5">
				<div>
					<h2 className="font-semibold">Live preview</h2>
					<p className="mt-1 text-xs text-muted">
						Mengikuti editor. CTA hanya tampilan.
					</p>
				</div>
				<fieldset className="flex gap-2" aria-label="Bahasa preview">
					{(["idn", "eng"] as const).map((lang) => (
						<Button
							key={lang}
							size="sm"
							variant={lang === locale ? "primary" : "ghost"}
							aria-pressed={lang === locale}
							onClick={() => setLocale(lang)}
						>
							{lang === "idn" ? "ID" : "EN"}
						</Button>
					))}
				</fieldset>
			</header>
			<article
				lang={locale === "idn" ? "id" : "en"}
				className="max-h-[calc(100dvh-160px)] space-y-8 overflow-y-auto overscroll-contain p-6 wrap-anywhere"
			>
				<header className="text-center">
					<p className="mb-4 text-[11px] font-bold tracking-widest text-accent">
						KODEVA JOURNAL
					</p>
					<h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
						{value.contentPayload.title[locale] ||
							(locale === "idn" ? "Judul artikel" : "Article title")}
					</h1>
					<p className="mt-4 text-sm leading-relaxed text-muted">
						{value.contentPayload.excerpt[locale]}
					</p>
				</header>
				<PreviewImage key={value.coverImage} src={value.coverImage} />
				{value.contentPayload.content.map((block, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Preview follows draft block positions.
					<section key={index} className="space-y-6">
						<p className="text-justify leading-[1.85] whitespace-pre-line">
							{block.text[locale]}
						</p>
						{block.image && (
							<PreviewImage key={block.image} src={block.image} />
						)}
						{block.cta && (
							<Button
								variant="secondary"
								aria-disabled="true"
								title={block.cta.url}
								className="max-w-full whitespace-normal"
							>
								{block.cta.label[locale] || "CTA"} ↗
							</Button>
						)}
					</section>
				))}
			</article>
		</section>
	);
}
