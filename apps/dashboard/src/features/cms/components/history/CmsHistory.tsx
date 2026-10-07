import type { CmsSnapshot } from "@jortemplate/types";
import { Alert, Badge, Button, Card } from "@jortemplate/ui";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../../lib/api";
import { VERSION_STATUS_LABEL } from "../../constants";
import {
	useActivateCmsVersion,
	useCmsHistory,
	useCmsVersion,
} from "../../hooks";
import { ConfirmPanel } from "../ConfirmPanel";
import { HistoryTable } from "./HistoryTable";
import { VersionSections } from "./VersionSections";

export function CmsHistory({
	blocked,
	onActivated,
	onBusyChange,
}: {
	blocked: boolean;
	onActivated: (editor: CmsSnapshot) => void;
	onBusyChange: (busy: boolean) => void;
}) {
	const [offset, setOffset] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const [confirm, setConfirm] = useState(false);
	const query = useCmsHistory(offset);
	const detail = useCmsVersion(selected);
	const activate = useActivateCmsVersion();
	const lock = useRef(false);
	useEffect(() => {
		onBusyChange(activate.isPending);
	}, [activate.isPending, onBusyChange]);
	const conflict =
		activate.error instanceof ApiError && activate.error.status === 409;
	const target = detail.data?.version;
	const canActivate =
		target?.status === "inactive" &&
		!blocked &&
		!conflict &&
		!query.isError &&
		!detail.isError &&
		!query.isFetching &&
		!detail.isFetching &&
		!activate.isPending;
	async function reload() {
		setConfirm(false);
		const [history, version] = await Promise.all([
			query.refetch(),
			selected ? detail.refetch() : Promise.resolve(null),
		]);
		if (!history.isError && !version?.isError) activate.reset();
	}
	async function activateTarget() {
		if (
			!canActivate ||
			!target ||
			target.status !== "inactive" ||
			!query.data ||
			lock.current
		)
			return;
		lock.current = true;
		try {
			const result = await activate.mutateAsync({
				version: { ...target, status: "inactive" },
				activeVersion: query.data.activeVersion,
			});
			onActivated(result.editor);
			setConfirm(false);
		} catch {
			/* Error ditampilkan dari mutation. */
		} finally {
			lock.current = false;
		}
	}
	return (
		<Card className="my-6 p-6">
			<div className="flex items-center justify-between gap-4 [&>div:first-child]:flex [&>div:first-child]:flex-wrap [&>div:first-child]:items-center [&>div:first-child]:gap-3 [&_h2]:m-0 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:tracking-[-0.6px]">
				<div>
					<h2>Riwayat versi</h2>
					<span className="text-sm leading-[1.6] text-muted">
						Satu versi berisi seluruh halaman.
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					disabled={activate.isPending || query.isFetching || detail.isFetching}
					onClick={() => void reload()}
				>
					Refresh riwayat
				</Button>
			</div>
			{query.isPending ? (
				<p className="my-4" role="status">
					Memuat riwayat…
				</p>
			) : query.isError ? (
				<Alert tone="danger">
					Riwayat belum bisa dimuat. Coba refresh riwayat.
				</Alert>
			) : !query.data.items.length ? (
				<p className="my-4 text-sm leading-[1.6] text-muted">
					Belum ada versi tersimpan.
				</p>
			) : (
				<HistoryTable
					page={query.data}
					offset={offset}
					selected={selected}
					selectDisabled={activate.isPending}
					pageDisabled={query.isFetching || activate.isPending}
					onSelect={(publicId) => {
						setSelected(publicId);
						setConfirm(false);
						activate.reset();
					}}
					onOffsetChange={setOffset}
				/>
			)}
			{activate.isError && (
				<Alert tone="danger">
					{conflict
						? "Versi sudah berubah. Refresh riwayat sebelum mengaktifkan kembali."
						: activate.error.message}
				</Alert>
			)}
			{selected && (
				<div className="mt-6 border-t border-line pt-5">
					<div className="flex items-center justify-between gap-4 [&>div:first-child]:flex [&>div:first-child]:flex-wrap [&>div:first-child]:items-center [&>div:first-child]:gap-3 [&_h2]:m-0 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:tracking-[-0.6px]">
						<div>
							<h3 className="my-[1em] text-lg font-bold">
								Isi versi {selected.slice(0, 8)}
							</h3>
							{target && <Badge>{VERSION_STATUS_LABEL[target.status]}</Badge>}
						</div>
						<Button
							variant="ghost"
							size="sm"
							disabled={activate.isPending}
							onClick={() => {
								setSelected(null);
								setConfirm(false);
							}}
						>
							Tutup
						</Button>
					</div>
					{detail.isPending ? (
						<p className="my-4" role="status">
							Memuat konten versi…
						</p>
					) : detail.isError ? (
						<Alert tone="danger">
							Detail versi belum bisa dimuat. Coba refresh riwayat.
						</Alert>
					) : (
						detail.data && (
							<>
								<VersionSections sections={detail.data.sections} />
								{target?.status === "pending" ? (
									<p className="my-4 text-sm leading-[1.6] text-muted">
										Gunakan tombol Publish pada editor untuk mengaktifkan draft
										ini.
									</p>
								) : target?.status === "active" ? (
									<p className="my-4 text-sm leading-[1.6] text-muted">
										Versi ini sedang tampil di web.
									</p>
								) : (
									<>
										{blocked && (
											<p className="my-4 text-sm leading-[1.6] text-muted">
												Simpan perubahan editor sebelum mengaktifkan versi lain.
											</p>
										)}
										<Button
											disabled={!canActivate}
											onClick={() => setConfirm(true)}
										>
											Aktifkan versi ini
										</Button>
									</>
								)}
							</>
						)
					)}
					{confirm && (
						<ConfirmPanel
							confirmLabel="Ya, aktifkan sekarang"
							loading={activate.isPending}
							cancelDisabled={activate.isPending}
							confirmDisabled={!canActivate}
							onCancel={() => setConfirm(false)}
							onConfirm={() => void activateTarget()}
						>
							Aktifkan versi {selected.slice(0, 8)}? Seluruh konten publik akan
							diganti. Draft yang sudah tersimpan tetap disimpan.
						</ConfirmPanel>
					)}
				</div>
			)}
		</Card>
	);
}
