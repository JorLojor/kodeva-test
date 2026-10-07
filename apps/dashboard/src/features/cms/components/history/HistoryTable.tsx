import type { CmsHistoryPage } from "@jortemplate/types";
import { Badge, Button } from "@jortemplate/ui";
import { HISTORY_PAGE_SIZE, VERSION_STATUS_LABEL } from "../../constants";

export function HistoryTable({
	page,
	offset,
	selected,
	selectDisabled,
	pageDisabled,
	onSelect,
	onOffsetChange,
}: {
	page: CmsHistoryPage;
	offset: number;
	selected: string | null;
	selectDisabled: boolean;
	pageDisabled: boolean;
	onSelect: (publicId: string) => void;
	onOffsetChange: (offset: number) => void;
}) {
	return (
		<>
			<div className="mt-5 overflow-x-auto">
				<table className="w-full border-collapse text-left text-[13px] [&_th]:border-b [&_th]:border-[#e2e8e3] [&_th]:px-3 [&_th]:py-3.5 [&_th]:align-middle [&_th]:whitespace-nowrap [&_th]:bg-paper [&_th]:font-semibold [&_th]:text-muted [&_td]:border-b [&_td]:border-[#e2e8e3] [&_td]:px-3 [&_td]:py-3.5 [&_td]:align-middle [&_td]:whitespace-nowrap [&_small]:mt-[5px] [&_small]:block [&_small]:text-muted">
					<thead>
						<tr>
							<th scope="col">Versi / dibuat</th>
							<th scope="col">Terakhir diperbarui</th>
							<th scope="col">Admin terakhir</th>
							<th scope="col">Status</th>
							<th scope="col">Konten</th>
						</tr>
					</thead>
					<tbody>
						{page.items.map((item) => (
							<tr key={item.publicId}>
								<td>
									<span title={item.publicId}>{item.publicId.slice(0, 8)}</span>
									<small>
										{new Date(item.createdAt).toLocaleString("id-ID")}
									</small>
								</td>
								<td>{new Date(item.updatedAt).toLocaleString("id-ID")}</td>
								<td>{item.admin.username}</td>
								<td>
									<Badge>{VERSION_STATUS_LABEL[item.status]}</Badge>
								</td>
								<td>
									<Button
										variant="secondary"
										size="sm"
										disabled={selectDisabled}
										aria-pressed={selected === item.publicId}
										onClick={() => onSelect(item.publicId)}
									>
										Lihat konten
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex flex-wrap items-center gap-2 mt-4 justify-end">
				<Button
					variant="ghost"
					size="sm"
					disabled={offset === 0 || pageDisabled}
					onClick={() =>
						onOffsetChange(Math.max(0, offset - HISTORY_PAGE_SIZE))
					}
				>
					Sebelumnya
				</Button>
				<span className="text-sm leading-[1.6] text-muted">
					Halaman {Math.floor(offset / HISTORY_PAGE_SIZE) + 1}
				</span>
				<Button
					variant="ghost"
					size="sm"
					disabled={!page.hasMore || pageDisabled}
					onClick={() => onOffsetChange(offset + HISTORY_PAGE_SIZE)}
				>
					Berikutnya
				</Button>
			</div>
		</>
	);
}
