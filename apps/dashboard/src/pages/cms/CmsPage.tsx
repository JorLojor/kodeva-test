import type { CmsSection, CmsSnapshot } from "@jortemplate/types";
import { Alert, Badge, Button } from "@jortemplate/ui";
import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CmsPreview } from "../../features/cms/components/CmsPreview";
import { ConfirmPanel } from "../../features/cms/components/ConfirmPanel";
import { AddSectionBar } from "../../features/cms/components/editor/AddSectionBar";
import { SaveBar } from "../../features/cms/components/editor/SaveBar";
import { SectionCard } from "../../features/cms/components/editor/SectionCard";
import { CmsHistory } from "../../features/cms/components/history/CmsHistory";
import { SECTION_LABEL } from "../../features/cms/constants";
import {
	useCmsEditor,
	usePublishCmsDraft,
	useSaveCmsDraft,
} from "../../features/cms/hooks";
import { move } from "../../features/cms/utils";
import { imageUploadKey } from "../../features/uploads/ImageUpload";
import { ApiError } from "../../lib/api";

export function CmsPage({
	onEditorStateChange,
}: {
	onEditorStateChange?: (state: { dirty: boolean; busy: boolean }) => void;
}) {
	const query = useCmsEditor();
	const save = useSaveCmsDraft();
	const publish = usePublishCmsDraft();
	const [local, setLocal] = useState<CmsSnapshot | null>(null);
	const [dirty, setDirty] = useState(false);
	const [notice, setNotice] = useState("");
	const [confirmPublish, setConfirmPublish] = useState(false);
	const lock = useRef(false);
	const [historyBusy, setHistoryBusy] = useState(false);
	const uploading = useIsMutating({ mutationKey: imageUploadKey }) > 0;
	const editorBusy =
		uploading || save.isPending || publish.isPending || query.isFetching;
	const busy = editorBusy || historyBusy;
	const error = save.error ?? publish.error;
	const conflict = error instanceof ApiError && error.status === 409;
	useEffect(() => {
		return () => onEditorStateChange?.({ dirty: false, busy: false });
	}, [onEditorStateChange]);
	useEffect(() => {
		onEditorStateChange?.({ dirty, busy });
	}, [dirty, busy, onEditorStateChange]);
	useEffect(() => {
		const listener = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		if (dirty || uploading) window.addEventListener("beforeunload", listener);
		return () => window.removeEventListener("beforeunload", listener);
	}, [dirty, uploading]);
	const snapshot = local ?? query.data;
	function edit(sections: CmsSection[]) {
		if (!snapshot) return;
		setLocal({ ...snapshot, sections });
		setDirty(true);
		setNotice("");
		setConfirmPublish(false);
	}
	async function reload() {
		if (
			dirty &&
			!window.confirm("Buang perubahan yang belum disimpan dan muat ulang?")
		)
			return;
		const result = await query.refetch();
		if (result.data && !result.isError) {
			setLocal(result.data);
			setDirty(false);
			setNotice("");
			setConfirmPublish(false);
			save.reset();
			publish.reset();
		}
	}
	if (!snapshot)
		return (
			<div className="grid justify-center gap-4 px-8 py-15">
				{query.isPending ? (
					<p className="my-4" role="status">
						Memuat editor CMS…
					</p>
				) : (
					<>
						<Alert tone="danger">Editor belum bisa dimuat.</Alert>
						<Button onClick={() => void query.refetch()}>Coba lagi</Button>
					</>
				)}
			</div>
		);
	const sections = [...snapshot.sections].sort((a, b) => a.order - b.order);
	function updateSection(index: number, section: CmsSection) {
		const next = [...sections];
		next[index] = section;
		edit(next);
	}
	function reorder(index: number, direction: number) {
		edit(
			move(sections, index, direction).map((section, i) => ({
				...section,
				order: i + 1,
			})),
		);
	}
	async function saveDraft() {
		if (!snapshot || lock.current || busy || conflict || !dirty) return;
		lock.current = true;
		try {
			const data = await save.mutateAsync({ ...snapshot, sections });
			setLocal(data);
			setDirty(false);
			setNotice("Draft tersimpan. Halaman web belum berubah.");
		} catch {
			/* Error ditampilkan dari mutation. */
		} finally {
			lock.current = false;
		}
	}
	async function publishDraft() {
		if (
			// biome-ignore lint/complexity/useOptionalChain: syulit
			!snapshot?.version ||
			snapshot.version.status !== "pending" ||
			lock.current
		)
			return;
		lock.current = true;
		try {
			const data = await publish.mutateAsync(snapshot.version);
			setLocal(data);
			setDirty(false);
			setConfirmPublish(false);
			setNotice("Draft berhasil dipublish ke halaman web.");
		} catch {
			/* Error ditampilkan dari mutation. */
		} finally {
			lock.current = false;
		}
	}

	return (
		<div className="grid w-full grid-cols-2 items-start gap-6 px-8 pt-10 pb-25 max-[1100px]:grid-cols-1 max-[700px]:px-4 max-[700px]:pt-7 max-[700px]:pb-15 *:[[role=alert]]:my-4 *:[[role=status]]:my-4">
			{/* editor section */}
			<section
				aria-label="Editor konten"
				className="@container min-w-0 rounded-2xl border border-line bg-white p-6 shadow-sm max-[700px]:p-4 *:[[role=alert]]:my-4 *:[[role=status]]:my-4"
			>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="mb-2 text-[11px] font-bold tracking-[2px] text-accent">
							WEBSITE CONTENT
						</p>
						<h1 className="text-2xl leading-tight font-semibold tracking-tight">
							Editor halaman
						</h1>
						<p className="my-4 text-sm leading-[1.6] text-muted">
							Edit konten, cek preview, lalu simpan dan publish.
						</p>
					</div>
					<Badge>
						{dirty
							? "Belum disimpan"
							: snapshot.version?.status === "pending"
								? "Draft"
								: snapshot.version
									? "Published"
									: "Belum ada konten"}
					</Badge>
				</div>
				{snapshot.version && (
					<p className="my-4 text-sm leading-[1.6] text-muted">
						Versi terakhir:{" "}
						{new Date(snapshot.version.updatedAt).toLocaleString("id-ID")}
					</p>
				)}
				{notice && <Alert tone="success">{notice}</Alert>}
				{query.isError && (
					<Alert tone="danger">
						Gagal memuat ulang editor. Perubahan kamu tetap ada.
					</Alert>
				)}
				{error && (
					<Alert tone="danger">
						{conflict
							? "Konten sudah berubah di sesi lain. Salin perubahan yang ingin dipertahankan, lalu muat ulang editor."
							: error instanceof ApiError && error.status === 401
								? "Sesi berakhir. Salin perubahan, lalu muat ulang halaman untuk login kembali."
								: error.message}
					</Alert>
				)}
				<details className="my-5 rounded-xl border border-line bg-paper px-4 [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0 [&>section]:shadow-none">
					<summary className="cursor-pointer py-4 text-sm font-semibold focus-visible:outline-accent">
						Riwayat versi{" "}
						<span className="ml-2 font-normal text-muted">
							Lihat atau aktifkan versi sebelumnya
						</span>
					</summary>
					<CmsHistory
						blocked={dirty || editorBusy}
						onBusyChange={setHistoryBusy}
						onActivated={(editor) => {
							setLocal(editor);
							setDirty(false);
							save.reset();
							publish.reset();
							setConfirmPublish(false);
							setNotice(
								editor.version?.status === "pending"
									? "Versi berhasil diaktifkan. Draft kamu tetap tersimpan di editor."
									: "Versi berhasil diaktifkan ke halaman web.",
							);
						}}
					/>
				</details>
				<form
					onInvalidCapture={(event) => {
						let parent =
							event.target instanceof HTMLElement
								? event.target.parentElement
								: null;
						while (parent && parent !== event.currentTarget) {
							if (parent instanceof HTMLDetailsElement) parent.open = true;
							parent = parent.parentElement;
						}
					}}
					onSubmit={(event) => {
						event.preventDefault();
						void saveDraft();
					}}
				>
					<fieldset
						disabled={busy}
						className="my-6 min-w-0 border-0 p-0 disabled:opacity-70"
					>
						<div className="mb-5">
							<h2 className="text-sm font-semibold">Susunan halaman</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted">
								Pilih section untuk mengedit. Gunakan panah untuk mengubah
								urutan tampil.
							</p>
							<nav
								aria-label="Section editor"
								className="mt-3 flex flex-wrap gap-2"
							>
								{sections.map((section, index) => (
									<a
										key={section.section}
										href={`#editor-${section.section}`}
										className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted hover:border-accent hover:text-accent focus-visible:outline-accent"
									>
										{index + 1}. {SECTION_LABEL[section.section]}
									</a>
								))}
							</nav>
						</div>
						<AddSectionBar
							sections={sections}
							onAdd={(section) => edit([...sections, section])}
						/>
						{sections.map((section, index) => (
							<SectionCard
								key={section.section}
								section={section}
								index={index}
								isLast={index === sections.length - 1}
								onChange={(next) => updateSection(index, next)}
								onMove={(direction) => reorder(index, direction)}
							/>
						))}
					</fieldset>
					<SaveBar
						dirty={dirty}
						saving={save.isPending}
						reloadDisabled={busy}
						saveDisabled={!dirty || busy || conflict || !sections.length}
						publishDisabled={
							dirty ||
							busy ||
							conflict ||
							snapshot.version?.status !== "pending"
						}
						onReload={() => void reload()}
						onPublish={() => setConfirmPublish(true)}
					/>
				</form>
				{confirmPublish && (
					<ConfirmPanel
						confirmLabel="Ya, publish sekarang"
						loading={publish.isPending}
						cancelDisabled={busy}
						confirmDisabled={busy || dirty || conflict}
						onCancel={() => setConfirmPublish(false)}
						onConfirm={() => void publishDraft()}
					>
						Publish seluruh draft? Konten ini akan langsung menggantikan halaman
						publik.
					</ConfirmPanel>
				)}
			</section>

			{/* preview section */}
			<CmsPreview sections={sections} />
		</div>
	);
}
