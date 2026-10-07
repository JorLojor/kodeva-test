import type { CmsSection, HeroPayload, Locale } from "@jortemplate/types";
import { Button, Card, Input } from "@jortemplate/ui";
import { useState } from "react";

function PreviewImage({
	src,
	alt,
	avatar = false,
}: {
	src: string;
	alt: string;
	avatar?: boolean;
}) {
	const [failed, setFailed] = useState(false);
	const valid =
		URL.canParse(src) && ["http:", "https:"].includes(new URL(src).protocol);
	return (
		<div
			className={
				avatar
					? "size-11 shrink-0 overflow-hidden rounded-full bg-line"
					: "aspect-5/4 overflow-hidden rounded-3xl bg-line"
			}
		>
			{valid && !failed ? (
				<img
					src={src}
					alt={alt}
					className="size-full object-cover"
					onError={() => setFailed(true)}
				/>
			) : (
				<div
					role="img"
					aria-label="Gambar belum tersedia"
					className="flex size-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,#eef3ea,#dde8db)] p-3 text-center text-xs text-muted"
				>
					{avatar ? alt.slice(0, 1) : "Gambar belum tersedia"}
				</div>
			)}
		</div>
	);
}

function HeroPreview({
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
		<div className="grid gap-8 @min-[650px]:grid-cols-2 @min-[650px]:items-center">
			<div>
				<p className="mb-5 text-[11px] font-bold tracking-widest text-accent">
					Kodeva · {locale === "idn" ? "SELAMAT DATANG" : "WELCOME"}
				</p>
				<h3 className="mb-6 text-4xl leading-tight font-semibold tracking-tight">
					{item.title[locale]}
				</h3>
				<p className="mb-6 whitespace-pre-line text-muted">
					{item.subtitle[locale]}
				</p>
				<Button type="button" aria-disabled="true" title={item.cta.url}>
					{item.cta.label[locale]} ↗
				</Button>
				{items.length > 1 && (
					<div className="mt-6 flex items-center gap-3">
						<Button
							type="button"
							size="sm"
							variant="secondary"
							aria-label="Preview slide sebelumnya"
							onClick={() =>
								setIndex((active + items.length - 1) % items.length)
							}
						>
							←
						</Button>
						<span className="text-xs text-muted" aria-live="polite">
							{active + 1} / {items.length}
						</span>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							aria-label="Preview slide berikutnya"
							onClick={() => setIndex((active + 1) % items.length)}
						>
							→
						</Button>
					</div>
				)}
			</div>
			<PreviewImage
				key={item.image}
				src={item.image}
				alt={item.title[locale]}
			/>
		</div>
	);
}

export function CmsPreview({ sections }: { sections: CmsSection[] }) {
	const [locale, setLocale] = useState<Locale>("idn");
	return (
		<section
			aria-label="Live preview CMS"
			className="sticky top-6 min-w-0 overflow-hidden rounded-2xl border border-line bg-paper max-[1100px]:static"
		>
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white p-5">
				<div>
					<h2 className="font-semibold">Live preview</h2>
					<p className="mt-1 text-xs text-muted">
						Mengikuti editor. CTA dan form hanya tampilan.
					</p>
				</div>
				<fieldset className="flex gap-2" aria-label="Bahasa preview">
					{(["idn", "eng"] as const).map((language) => (
						<Button
							key={language}
							type="button"
							size="sm"
							variant={locale === language ? "primary" : "ghost"}
							aria-pressed={locale === language}
							onClick={() => setLocale(language)}
						>
							{language === "idn" ? "ID" : "EN"}
						</Button>
					))}
				</fieldset>
			</div>
			<div
				lang={locale === "idn" ? "id" : "en"}
				className="@container max-h-[calc(100dvh-160px)] overflow-y-auto overscroll-contain px-6 wrap-anywhere"
			>
				{sections.length === 0 && (
					<p className="py-16 text-center text-sm text-muted">
						Tambahkan section untuk melihat preview.
					</p>
				)}
				{sections.map((section) => (
					<section
						key={section.section}
						aria-label={`Preview ${section.section}`}
						className="border-b border-line py-10 last:border-0"
					>
						{section.section === "hero" && (
							<HeroPreview items={section.payload} locale={locale} />
						)}
						{section.section === "testimonials" && (
							<>
								<h3 className="mb-6 text-3xl font-semibold tracking-tight">
									{locale === "idn"
										? "Yang mereka katakan."
										: "What people say."}
								</h3>
								<div className="grid gap-4 @min-[500px]:grid-cols-2">
									{section.payload.map((item, index) => (
										// Items have no IDs; keep keys stable while editing text.
										// biome-ignore lint/suspicious/noArrayIndexKey: Draft items are identified by their position.
										<Card key={index} className="flex flex-col gap-5 p-5">
											<blockquote className="flex-1 whitespace-pre-line text-sm leading-relaxed">
												“{item.subtitle[locale]}”
											</blockquote>
											<div className="flex items-center gap-3">
												<PreviewImage
													key={item.image}
													src={item.image}
													alt={item.title[locale]}
													avatar
												/>
												<p className="text-sm font-semibold">
													{item.title[locale]}
												</p>
											</div>
										</Card>
									))}
								</div>
							</>
						)}
						{section.section === "faq" && (
							<>
								<h3 className="mb-6 text-3xl font-semibold tracking-tight">
									{locale === "idn" ? "Ada pertanyaan?" : "Have questions?"}
								</h3>
								{section.payload.map((item) => (
									<details
										key={`${item.title.idn}-${item.subtitle.idn}`}
										className="border-b border-line py-4"
									>
										<summary className="cursor-pointer font-semibold">
											{item.title[locale]}
										</summary>
										<p className="pt-4 text-sm whitespace-pre-line text-muted">
											{item.subtitle[locale]}
										</p>
									</details>
								))}
							</>
						)}
						{section.section === "leadcapture" && section.payload[0] && (
							<Card className="bg-[#eef3ea] p-6">
								<h3 className="mb-4 text-3xl font-semibold tracking-tight">
									{section.payload[0].title[locale]}
								</h3>
								<p className="mb-6 whitespace-pre-line text-muted">
									{section.payload[0].subtitle[locale]}
								</p>
								<div className="grid gap-3">
									{(locale === "idn"
										? ["Nama", "Email", "Nomor WhatsApp"]
										: ["Name", "Email", "WhatsApp number"]
									).map((label) => (
										<Input
											key={label}
											aria-label={`Preview ${label}`}
											placeholder={label}
											disabled
										/>
									))}
									<Button type="button" aria-disabled="true">
										{locale === "idn" ? "Kirim" : "Submit"}
									</Button>
								</div>
							</Card>
						)}
					</section>
				))}
			</div>
		</section>
	);
}
