import { Alert, Button, FormField, Input } from "@jortemplate/ui";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ApiError, request } from "../../lib/api";
export const imageUploadKey = ["image-upload"] as const;
export function ImageUpload({
	id,
	label,
	value,
	onChange,
	required = false,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (url: string) => void;
	required?: boolean;
}) {
	const [error, setError] = useState("");
	const [failedSource, setFailedSource] = useState<string | null>(null);
	const lock = useRef(false);
	const upload = useMutation({
		mutationKey: imageUploadKey,
		retry: false,
		mutationFn: async (file: File) => {
			const body = new FormData();
			body.append("file", file);
			const response = await request<{ data: string }>("/uploads/image", {
				method: "POST",
				body,
			});
			if (
				typeof response.data !== "string" ||
				!/^https?:\/\//.test(response.data)
			)
				throw new Error("Respons upload tidak valid.");
			return response.data;
		},
	});
	return (
		<div className="space-y-3">
			<FormField
				htmlFor={id}
				label={label}
				hint="Pilih gambar JPG, PNG, atau WebP. Maksimal 5 MB."
			>
				<Input
					id={id}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					required={required && !value}
					disabled={upload.isPending}
					className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent"
					onChange={async (event) => {
						const input = event.currentTarget;
						const file = input.files?.[0];
						if (!file || lock.current) return;
						setError("");
						if (
							!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
							file.size === 0 ||
							file.size > 5 * 1024 * 1024
						) {
							setError("Pilih JPG, PNG, atau WebP dengan ukuran 1 byte–5 MB.");
							input.value = "";
							return;
						}
						lock.current = true;
						try {
							const url = await upload.mutateAsync(file);
							onChange(url);
						} catch (err) {
							setError(
								err instanceof ApiError && err.status === 401
									? "Sesi berakhir. Login kembali untuk mengupload gambar."
									: err instanceof ApiError && err.status === 400
										? "File gambar tidak valid. Coba gambar lain."
										: "Gambar gagal diupload. Silakan coba lagi.",
							);
						} finally {
							input.value = "";
							lock.current = false;
						}
					}}
				/>
			</FormField>
			{upload.isPending && (
				<p role="status" className="text-sm text-muted">
					Mengupload gambar…
				</p>
			)}
			{error && <Alert tone="danger">{error}</Alert>}
			{value && (
				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper p-3">
					{failedSource !== value ? (
						<img
							src={value}
							alt={label}
							className="size-20 rounded-lg object-cover"
							onError={() => setFailedSource(value)}
						/>
					) : (
						<p className="text-xs text-muted">Preview gambar belum tersedia.</p>
					)}
					<div className="flex-1 text-xs text-muted">
						Gambar tersimpan. Pilih file lain untuk mengganti.
					</div>
					{!required && (
						<Button
							size="sm"
							variant="ghost"
							disabled={upload.isPending}
							onClick={() => {
								onChange("");
								setError("");
							}}
						>
							Hapus gambar
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
