import type { BlogContentPayload, Language } from "@jortemplate/types";
import {
	Alert,
	Badge,
	Button,
	FormField,
	Input,
	Textarea,
} from "@jortemplate/ui";
import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import { ImageUpload, imageUploadKey } from "../uploads/ImageUpload";
import type { BlogInput } from "./api";
import { BlogPreview } from "./BlogPreview";
import { useBlog, useDeleteBlog, useSaveBlog } from "./hooks";

const language = (): Language => ({ idn: "", eng: "" });
const block = (): BlogContentPayload => ({
	text: language(),
	image: "",
	cta: null,
});
const blank = (): BlogInput => ({
	slug: "",
	coverImage: "",
	status: "pending",
	contentPayload: {
		title: language(),
		excerpt: language(),
		content: [block()],
	},
});
const labels = { pending: "Draft", active: "Published", inactive: "Nonaktif" };
function Bilingual({
	id,
	label,
	value,
	onChange,
	max,
	multiline = false,
}: {
	id: string;
	label: string;
	value: Language;
	onChange: (value: Language) => void;
	max: number;
	multiline?: boolean;
}) {
	const Field = multiline ? Textarea : Input;
	return (
		<div className="grid gap-4 @min-[600px]:grid-cols-2">
			{(["idn", "eng"] as const).map((locale) => (
				<FormField
					key={locale}
					htmlFor={`${id}-${locale}`}
					label={`${label} · ${locale === "idn" ? "Indonesia" : "English"}`}
				>
					<Field
						id={`${id}-${locale}`}
						value={value[locale]}
						required
						maxLength={max}
						className={multiline ? "min-h-36" : ""}
						onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
					/>
				</FormField>
			))}
		</div>
	);
}
export type EditorState = { dirty: boolean; busy: boolean };
export function BlogEditor({
	id,
	onBack,
	onEditorStateChange,
}: {
	id: string;
	onBack: () => void;
	onEditorStateChange?: (state: EditorState) => void;
}) {
	const query = useBlog(id);
	const save = useSaveBlog();
	const remove = useDeleteBlog();
	const lock = useRef(false);
	const [local, setLocal] = useState<BlogInput | null>(() =>
		id === "new" ? blank() : null,
	);
	const [savedId, setSavedId] = useState(id === "new" ? undefined : id);
	const [dirty, setDirty] = useState(false);
	const [notice, setNotice] = useState("");
	const uploading = useIsMutating({ mutationKey: imageUploadKey }) > 0;
	const busy = save.isPending || remove.isPending || uploading;
	const value = local ?? query.data;
	useEffect(() => {
		onEditorStateChange?.({ dirty, busy });
	}, [dirty, busy, onEditorStateChange]);
	useEffect(
		() => () => onEditorStateChange?.({ dirty: false, busy: false }),
		[onEditorStateChange],
	);
	useEffect(() => {
		if (!dirty && !busy) return;
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [dirty, busy]);
	function edit(next: BlogInput) {
		setLocal(next);
		setDirty(true);
		setNotice("");
		save.reset();
		remove.reset();
	}
	async function persist(status = value?.status) {
		if (!value || !status || busy || lock.current) return;
		if (
			status === "active" &&
			!window.confirm(
				"Simpan perubahan? Artikel ini akan langsung berubah di web publik.",
			)
		)
			return;
		lock.current = true;
		try {
			const input: BlogInput = {
				slug: value.slug,
				coverImage: value.coverImage,
				contentPayload: value.contentPayload,
				status,
			};
			const data = await save.mutateAsync({
				input,
				...(savedId ? { id: savedId } : {}),
			});
			setSavedId(data.publicId);
			setLocal(data);
			setDirty(false);
			setNotice(
				status === "active"
					? "Artikel berhasil dipublish."
					: "Artikel berhasil disimpan.",
			);
		} catch {
			/* Mutation error shown below. */
		} finally {
			lock.current = false;
		}
	}
	if (!value)
		return (
			<div className="p-8">
				<Button variant="ghost" onClick={onBack}>
					← Daftar blog
				</Button>
				{query.isPending ? (
					<p role="status" className="py-8">
						Memuat artikel…
					</p>
				) : (
					<Alert tone="danger">
						Artikel tidak bisa dimuat.{" "}
						<Button size="sm" onClick={() => void query.refetch()}>
							Coba lagi
						</Button>
					</Alert>
				)}
			</div>
		);
	function updateBlock(index: number, next: BlogContentPayload) {
		if (value)
			edit({
				...value,
				contentPayload: {
					...value.contentPayload,
					content: value.contentPayload.content.map((item, i) =>
						i === index ? next : item,
					),
				},
			});
	}
	const error = save.error ?? remove.error;
	return (
		<div className="px-4 py-8 sm:px-8">
			<Button
				variant="ghost"
				disabled={busy}
				onClick={() => {
					if (
						!dirty ||
						window.confirm("Buang perubahan yang belum disimpan dan kembali?")
					)
						onBack();
				}}
			>
				← Daftar blog
			</Button>
			<div className="mt-5 grid grid-cols-2 items-start gap-6 max-[1100px]:grid-cols-1">
				<section
					aria-label="Editor blog"
					className="@container min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-6"
				>
					<header className="mb-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<h1 className="text-2xl font-semibold">
								{savedId ? "Edit artikel" : "Artikel baru"}
							</h1>
							<Badge>{dirty ? "Belum disimpan" : labels[value.status]}</Badge>
						</div>
						<p className="mt-3 text-sm text-muted">
							Satu editor untuk satu artikel. Simpan draft atau publish setelah
							siap.
						</p>
						{value.status === "active" && (
							<p className="mt-2 text-sm text-accent">
								Artikel aktif: perubahan yang disimpan langsung tampil di web.
							</p>
						)}
					</header>
					{notice && (
						<Alert tone="success" className="mb-5">
							{notice}
						</Alert>
					)}
					{error && (
						<Alert tone="danger" className="mb-5">
							{error instanceof ApiError && error.status === 409
								? "Slug sudah digunakan. Pilih slug lain; perubahanmu tetap tersimpan di editor."
								: error instanceof ApiError && error.status === 401
									? "Sesi berakhir. Salin perubahan sebelum login kembali."
									: error.message}
						</Alert>
					)}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const submitter = (e.nativeEvent as SubmitEvent).submitter;
							void persist(
								submitter?.getAttribute("value") === "publish"
									? "active"
									: value.status,
							);
						}}
					>
						<fieldset
							disabled={busy}
							className="min-w-0 space-y-6 disabled:opacity-60"
						>
							<Bilingual
								id="blog-title"
								label="Judul"
								max={300}
								value={value.contentPayload.title}
								onChange={(title) =>
									edit({
										...value,
										contentPayload: { ...value.contentPayload, title },
									})
								}
							/>
							<div>
								<FormField
									htmlFor="blog-slug"
									label="Slug"
									hint="Huruf kecil, angka, dan tanda hubung. Mengubah slug mengubah URL artikel."
								>
									<Input
										id="blog-slug"
										value={value.slug}
										maxLength={255}
										required
										pattern="[a-z0-9]+(-[a-z0-9]+)*"
										onChange={(e) => edit({ ...value, slug: e.target.value })}
									/>
								</FormField>
								{!savedId && (
									<Button
										className="mt-2"
										size="sm"
										variant="ghost"
										onClick={() =>
											edit({
												...value,
												slug: value.contentPayload.title.idn
													.toLowerCase()
													.normalize("NFKD")
													.replace(/[\u0300-\u036f]/g, "")
													.replace(/[^a-z0-9]+/g, "-")
													.replace(/^-|-$/g, "")
													.slice(0, 255)
													.replace(/-$/, ""),
											})
										}
									>
										Buat slug dari judul
									</Button>
								)}
							</div>
							<Bilingual
								id="blog-excerpt"
								label="Ringkasan"
								max={1000}
								multiline
								value={value.contentPayload.excerpt}
								onChange={(excerpt) =>
									edit({
										...value,
										contentPayload: { ...value.contentPayload, excerpt },
									})
								}
							/>
							<ImageUpload
								id="blog-cover"
								label="Cover artikel"
								required
								value={value.coverImage}
								onChange={(coverImage) => edit({ ...value, coverImage })}
							/>
							<div className="border-t border-line pt-5">
								<h2 className="font-semibold">Isi artikel</h2>
								<p className="mt-1 text-xs text-muted">
									Urutan blok mengikuti urutan bacaan. Gambar dan CTA opsional.
								</p>
							</div>
							{value.contentPayload.content.map((item, index) => (
								<section
									// biome-ignore lint/suspicious/noArrayIndexKey: Blocks have no database IDs; controlled fields follow position.
									key={index}
									className="space-y-5 rounded-xl border border-line p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<h3 className="text-sm font-semibold">Blok {index + 1}</h3>
										<div className="flex gap-1">
											{([-1, 1] as const).map((direction) => (
												<Button
													key={direction}
													size="sm"
													variant="ghost"
													aria-label={`Blok ${index + 1} ${direction === -1 ? "naik" : "turun"}`}
													disabled={
														index + direction < 0 ||
														index + direction >=
															value.contentPayload.content.length
													}
													onClick={() => {
														const content = [...value.contentPayload.content];
														const other = content[index + direction];
														if (!other) return;
														content[index] = other;
														content[index + direction] = item;
														edit({
															...value,
															contentPayload: {
																...value.contentPayload,
																content,
															},
														});
													}}
												>
													{direction === -1 ? "↑" : "↓"}
												</Button>
											))}
											<Button
												size="sm"
												variant="danger"
												disabled={value.contentPayload.content.length === 1}
												onClick={() => {
													if (window.confirm("Hapus blok ini?"))
														edit({
															...value,
															contentPayload: {
																...value.contentPayload,
																content: value.contentPayload.content.filter(
																	(_, i) => i !== index,
																),
															},
														});
												}}
											>
												Hapus blok
											</Button>
										</div>
									</div>
									<Bilingual
										id={`block-${index}`}
										label="Teks"
										max={50000}
										multiline
										value={item.text}
										onChange={(text) => updateBlock(index, { ...item, text })}
									/>
									<ImageUpload
										id={`image-${index}`}
										label="Gambar blok (opsional)"
										value={item.image}
										onChange={(image) => updateBlock(index, { ...item, image })}
									/>
									<label className="flex items-center gap-2 text-sm font-semibold">
										<input
											type="checkbox"
											checked={item.cta !== null}
											onChange={(e) =>
												updateBlock(index, {
													...item,
													cta: e.target.checked
														? { label: language(), url: "" }
														: null,
												})
											}
										/>
										Tambahkan tombol CTA
									</label>
									{item.cta && (
										<>
											<Bilingual
												id={`cta-${index}`}
												label="Teks tombol"
												max={150}
												value={item.cta.label}
												onChange={(label) =>
													updateBlock(index, {
														...item,
														cta: { label, url: item.cta?.url ?? "" },
													})
												}
											/>
											<FormField
												htmlFor={`cta-url-${index}`}
												label="Tujuan tombol"
												hint="URL HTTP(S) atau path lokal seperti /product."
											>
												<Input
													id={`cta-url-${index}`}
													required
													maxLength={2048}
													value={item.cta.url}
													onChange={(e) =>
														updateBlock(index, {
															...item,
															cta: {
																label: item.cta?.label ?? language(),
																url: e.target.value,
															},
														})
													}
												/>
											</FormField>
										</>
									)}
								</section>
							))}
							<Button
								variant="secondary"
								className="w-full border-dashed"
								disabled={value.contentPayload.content.length >= 100}
								onClick={() =>
									edit({
										...value,
										contentPayload: {
											...value.contentPayload,
											content: [...value.contentPayload.content, block()],
										},
									})
								}
							>
								+ Tambah blok
							</Button>
						</fieldset>
						<div className="sticky bottom-4 mt-6 flex flex-wrap gap-2 rounded-xl border border-line bg-white p-4 shadow-lg">
							<Button
								type="submit"
								disabled={busy || (!dirty && !!savedId)}
								loading={save.isPending}
							>
								Simpan {value.status === "pending" ? "draft" : "perubahan"}
							</Button>
							{value.status !== "active" && (
								<Button
									type="submit"
									value="publish"
									variant="secondary"
									disabled={busy}
								>
									Publish
								</Button>
							)}
							{value.status === "active" && (
								<Button
									disabled={busy || dirty}
									variant="secondary"
									onClick={() => {
										if (window.confirm("Nonaktifkan artikel dari web?"))
											void persist("inactive");
									}}
								>
									Nonaktifkan
								</Button>
							)}
							{savedId && (
								<Button
									variant="danger"
									disabled={busy}
									onClick={async () => {
										if (
											lock.current ||
											!window.confirm(
												"Hapus artikel ini? Artikel tidak akan tampil lagi di web.",
											)
										)
											return;
										lock.current = true;
										try {
											await remove.mutateAsync(savedId);
											onBack();
										} catch {
											/* Shown above. */
										} finally {
											lock.current = false;
										}
									}}
								>
									Hapus artikel
								</Button>
							)}
						</div>
					</form>
				</section>
				<BlogPreview value={value} />
			</div>
		</div>
	);
}
