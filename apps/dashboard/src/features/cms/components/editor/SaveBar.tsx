import { Button } from "@jortemplate/ui";

export function SaveBar({
	dirty,
	saving,
	reloadDisabled,
	saveDisabled,
	publishDisabled,
	onReload,
	onPublish,
}: {
	dirty: boolean;
	saving: boolean;
	reloadDisabled: boolean;
	saveDisabled: boolean;
	publishDisabled: boolean;
	onReload: () => void;
	onPublish: () => void;
}) {
	return (
		<div className="sticky bottom-4 z-2 flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[#dce5de] bg-white px-6 py-[18px] shadow-[0_8px_30px_#183b3212] max-[700px]:bottom-2 max-[700px]:p-4 max-[700px]:[&>div]:w-full">
			<span className="text-sm leading-[1.6] text-muted">
				{dirty ? "Simpan draft sebelum publish." : "Tidak ada perubahan baru."}
			</span>
			<div className="flex w-full flex-wrap items-center gap-2 [&>button]:grow">
				<Button variant="ghost" disabled={reloadDisabled} onClick={onReload}>
					Muat ulang
				</Button>
				<Button type="submit" loading={saving} disabled={saveDisabled}>
					Simpan draft
				</Button>
				<Button
					variant="secondary"
					disabled={publishDisabled}
					onClick={onPublish}
				>
					Publish
				</Button>
			</div>
		</div>
	);
}
