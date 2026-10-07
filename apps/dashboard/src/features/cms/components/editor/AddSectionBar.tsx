import type { CmsSection } from "@jortemplate/types";
import { SECTION_TYPE } from "@jortemplate/types";
import { Button } from "@jortemplate/ui";
import { SECTION_LABEL } from "../../constants";
import { blankItem } from "../../utils";

export function AddSectionBar({
	sections,
	onAdd,
}: {
	sections: CmsSection[];
	onAdd: (section: CmsSection) => void;
}) {
	return (
		<div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-dashed border-line bg-paper p-4 [&>span:first-child]:mr-2 [&>span:first-child]:text-sm [&>span:first-child]:font-semibold">
			<span>Tambah section</span>
			{SECTION_TYPE.filter(
				(type) => !sections.some((section) => section.section === type),
			).map((type) => (
				<Button
					key={type}
					variant="secondary"
					size="sm"
					onClick={() => {
						const order = [1, 2, 3, 4].find(
							(value) => !sections.some((section) => section.order === value),
						);

						if (order === undefined) {
							return;
						}

						onAdd({
							section: type,
							order,
							payload: [blankItem(type)],
						} as CmsSection);
					}}
				>
					+ {SECTION_LABEL[type]}
				</Button>
			))}
			{sections.length === 4 && (
				<span className="text-sm leading-[1.6] text-muted">
					Semua section sudah tersedia.
				</span>
			)}
		</div>
	);
}
