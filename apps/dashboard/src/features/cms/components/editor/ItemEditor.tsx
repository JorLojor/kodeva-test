import type { CmsSection, HeroPayload } from "@jortemplate/types";
import { Button, FormField, Input } from "@jortemplate/ui";
import { ImageUpload } from "../../../uploads/ImageUpload";
import { LanguageFields } from "./LanguageFields";

type Item = CmsSection["payload"][number];

export function ItemEditor({
	id,
	index,
	item,
	sectionType,
	isFirst,
	isLast,
	canRemove,
	onChange,
	onMove,
	onRemove,
}: {
	id: string;
	index: number;
	item: Item;
	sectionType: CmsSection["section"];
	isFirst: boolean;
	isLast: boolean;
	canRemove: boolean;
	onChange: (value: Partial<Item>) => void;
	onMove: (direction: number) => void;
	onRemove: () => void;
}) {
	return (
		<details
			open={index === 0}
			className="group/item my-4 rounded-xl border border-line bg-white"
		>
			<summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl bg-paper px-4 py-4 text-sm focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
				<span className="shrink-0 text-xs font-semibold text-accent">
					Item {index + 1}
				</span>
				<span className="min-w-0 flex-1 truncate font-semibold">
					{item.title.idn.trim() || item.title.eng.trim() || "Konten baru"}
				</span>
				<span
					aria-hidden="true"
					className="text-muted transition-transform group-open/item:rotate-180"
				>
					⌄
				</span>
			</summary>
			<div className="grid gap-5 p-4">
				<div className="flex items-center justify-between gap-4 max-[700px]:items-start">
					<p className="text-xs text-muted">Urutan & tindakan</p>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							aria-label={`${id} naik`}
							disabled={isFirst}
							onClick={() => onMove(-1)}
						>
							↑
						</Button>
						<Button
							variant="ghost"
							size="sm"
							aria-label={`${id} turun`}
							disabled={isLast}
							onClick={() => onMove(1)}
						>
							↓
						</Button>
						<Button
							variant="danger"
							size="sm"
							disabled={!canRemove}
							onClick={() => {
								if (window.confirm("Hapus item ini dari draft?")) onRemove();
							}}
						>
							Hapus
						</Button>
					</div>
				</div>
				<LanguageFields
					id={`${id}-title`}
					label="Judul"
					value={item.title}
					onChange={(title) => onChange({ title })}
				/>
				<LanguageFields
					id={`${id}-subtitle`}
					label={sectionType === "faq" ? "Jawaban" : "Deskripsi"}
					value={item.subtitle}
					onChange={(subtitle) => onChange({ subtitle })}
					multiline
				/>
				{"image" in item && (
					<ImageUpload
						id={`${id}-image`}
						label="Gambar"
						value={item.image}
						required
						onChange={(image) => onChange({ image })}
					/>
				)}
				{"cta" in item && (
					<>
						<LanguageFields
							id={`${id}-cta-label`}
							label="Teks tombol"
							value={item.cta.label}
							onChange={(label) =>
								onChange({
									cta: { ...item.cta, label },
								} as Partial<HeroPayload>)
							}
						/>
						<FormField
							htmlFor={`${id}-cta-url`}
							label="Tujuan tombol"
							hint="URL HTTP(S) atau path lokal seperti /marketplace."
						>
							<Input
								id={`${id}-cta-url`}
								required
								maxLength={2048}
								value={item.cta.url}
								onChange={(event) =>
									onChange({
										cta: { ...item.cta, url: event.target.value },
									} as Partial<HeroPayload>)
								}
							/>
						</FormField>
					</>
				)}
			</div>
		</details>
	);
}
