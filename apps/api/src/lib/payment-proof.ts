import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";
import { getClient, MAX_FILE_SIZE } from "./cdn";
import { AppError } from "./error";
export async function uploadProof(file: File, bucket: string) {
	if (file.size < 1 || file.size > MAX_FILE_SIZE) throw AppError.badRequest("Bukti maksimal 5 MB");
	const bytes = new Uint8Array(await file.arrayBuffer());
	const detected = await fileTypeFromBuffer(bytes).catch(() => undefined);
	if (
		!detected ||
		!["image/jpeg", "image/png", "image/webp"].includes(detected.mime) ||
		detected.mime !== file.type
	)
		throw AppError.badRequest("Pilih gambar JPG, PNG, atau WebP yang valid");
	const key = `payment-proofs/${crypto.randomUUID()}.${detected.ext}`;
	try {
		await getClient().send(
			new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: detected.mime }),
		);
	} catch {
		throw new AppError(502, "Gagal menyimpan bukti transfer");
	}
	return key;
}
export async function readProof(bucket: string, key: string) {
	try {
		const value = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
		if (!value.Body) throw new Error();
		return {
			bytes: await value.Body.transformToByteArray(),
			type: value.ContentType ?? "application/octet-stream",
		};
	} catch {
		throw new AppError(502, "Bukti transfer belum bisa dimuat");
	}
}
export async function removeProof(bucket: string, key: string) {
	await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
