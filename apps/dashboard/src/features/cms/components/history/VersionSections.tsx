import type { CmsHistorySnapshot } from "@jortemplate/types";
import { SECTION_LABEL } from "../../constants";

export function VersionSections({
	sections,
}: {
	sections: CmsHistorySnapshot["sections"];
}) {
	return [...sections]
		.sort((a, b) => a.order - b.order)
		.map((section) => (
			<details
				className="my-3.5 rounded-[10px] border border-line p-4 [&_summary]:cursor-pointer [&_summary]:font-semibold"
				key={section.section}
			>
				<summary>
					{section.order}. {SECTION_LABEL[section.section]} ·{" "}
					{section.payload.length} item
				</summary>
				{section.payload.map((item, index) => (
					<div
						className="mt-4 rounded-lg bg-paper p-3 [&_h4]:my-2 [&_h4]:font-bold [&_p]:whitespace-pre-wrap [&_p]:wrap-anywhere [&_p]:leading-[1.6] [&_p:first-child]:mt-3"
						key={index}
					>
						<h4>Item {index + 1}</h4>
						<div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1 max-[700px]:gap-4">
							{(["idn", "eng"] as const).map((locale) => (
								<div key={locale}>
									<p className="my-4 mt-10 text-[11px] font-bold tracking-[2px] text-accent">
										{locale === "idn" ? "INDONESIA" : "ENGLISH"}
									</p>
									<h4>{item.title[locale]}</h4>
									<p className="my-4">{item.subtitle[locale]}</p>
									{"cta" in item && (
										<p className="my-4">
											Teks tombol: {item.cta.label[locale]}
										</p>
									)}
								</div>
							))}
						</div>
						{"image" in item && (
							<p className="my-4 text-[13px] text-muted">
								Gambar: {item.image}
							</p>
						)}
						{"cta" in item && (
							<p className="my-4 text-[13px] text-muted">
								Tujuan tombol: {item.cta.url}
							</p>
						)}
					</div>
				))}
			</details>
		));
}
