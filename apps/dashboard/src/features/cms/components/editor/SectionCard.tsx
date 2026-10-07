import type { CmsSection } from "@jortemplate/types";
import { Button, Card } from "@jortemplate/ui";
import { SECTION_ITEM_LIMIT, SECTION_LABEL } from "../../constants";
import { blankItem, move } from "../../utils";
import { ItemEditor } from "./ItemEditor";

export function SectionCard({
	section,
	index,
	isLast,
	onChange,
	onMove,
}: {
	section: CmsSection;
	index: number;
	isLast: boolean;
	onChange: (section: CmsSection) => void;
	onMove: (direction: number) => void;
}) {
	const label = SECTION_LABEL[section.section];
	const limit = SECTION_ITEM_LIMIT[section.section];
	function setPayload(payload: CmsSection["payload"]) {
		onChange({ ...section, payload } as CmsSection);
	}
	return (
		<Card
			id={`editor-${section.section}`}
			className="mb-5 scroll-mt-6 overflow-hidden rounded-xl border-line p-4 shadow-none @min-[600px]:p-5"
		>
			<div className="flex items-center justify-between gap-4 [&>div:first-child]:flex [&>div:first-child]:flex-wrap [&>div:first-child]:items-center [&>div:first-child]:gap-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-[-0.6px]">
				<div>
					<span className="flex size-8 items-center justify-center rounded-lg bg-paper text-xs font-bold text-accent">
						0{index + 1}
					</span>
					<h2>{label}</h2>
					<span className="text-sm leading-[1.6] text-muted">
						{section.payload.length} item
					</span>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						aria-label={`${label} naik`}
						disabled={index === 0}
						onClick={() => onMove(-1)}
					>
						↑
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-label={`${label} turun`}
						disabled={isLast}
						onClick={() => onMove(1)}
					>
						↓
					</Button>
				</div>
			</div>
			{section.payload.map((item, itemIndex) => {
				const id = `${section.section}-${itemIndex}`;
				return (
					<ItemEditor
						key={id}
						id={id}
						index={itemIndex}
						item={item}
						sectionType={section.section}
						isFirst={itemIndex === 0}
						isLast={itemIndex === section.payload.length - 1}
						canRemove={section.payload.length > 1}
						onChange={(value) =>
							setPayload(
								section.payload.map((previous, i) =>
									i === itemIndex ? { ...previous, ...value } : previous,
								) as CmsSection["payload"],
							)
						}
						onMove={(direction) =>
							setPayload(
								move(
									section.payload,
									itemIndex,
									direction,
								) as CmsSection["payload"],
							)
						}
						onRemove={() =>
							setPayload(
								section.payload.filter(
									(_, i) => i !== itemIndex,
								) as CmsSection["payload"],
							)
						}
					/>
				);
			})}
			<Button
				variant="secondary"
				className="w-full border-dashed"
				disabled={section.payload.length >= limit}
				onClick={() =>
					setPayload([
						...section.payload,
						blankItem(section.section),
					] as CmsSection["payload"])
				}
			>
				+ Tambah item
			</Button>
			<p className="mt-3 text-xs leading-relaxed text-muted">
				{section.section === "leadcapture"
					? "Lead capture hanya memiliki satu item. Submission form disimpan terpisah."
					: `Minimal 1, maksimal ${limit} item.`}
			</p>
		</Card>
	);
}
