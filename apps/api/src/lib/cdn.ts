import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";
import { env } from "@/config/env";
import { AppError } from "@/lib/error";
import { log } from "@/utils/logger";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FILE_TYPES: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"application/pdf": "pdf",
};

let client: S3Client | undefined;

export function getClient(): S3Client {
	if (client) return client;
	if (!env.CDN_ENDPOINT || !env.CDN_ACCESS_KEY_ID || !env.CDN_SECRET || !env.CDN_BUCKET) {
		throw AppError.internalServerError("Storage is not configured", "STORAGE_NOT_CONFIGURED");
	}
	const endpoint = new URL(env.CDN_ENDPOINT);
	if (endpoint.protocol !== "https:" || endpoint.pathname !== "/") {
		throw AppError.internalServerError(
			"CDN_ENDPOINT must be the HTTPS S3 API origin without a bucket path",
			"INVALID_STORAGE_CONFIG",
		);
	}
	client = new S3Client({
		endpoint: env.CDN_ENDPOINT,
		region: env.CDN_REGION,
		credentials: { accessKeyId: env.CDN_ACCESS_KEY_ID, secretAccessKey: env.CDN_SECRET },
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	});
	return client;
}

function validateKey(key: string): void {
	if (
		!key.startsWith("uploads/") ||
		key.length > 512 ||
		!/^[a-zA-Z0-9._/-]+$/.test(key) ||
		key.split("/").some((part) => !part || part === "." || part === "..")
	) {
		throw AppError.badRequest("Invalid file key", "INVALID_FILE_KEY");
	}
}

function storageError(error: unknown): never {
	if (error instanceof AppError) throw error;
	if (error instanceof Error && ["NoSuchKey", "NotFound"].includes(error.name)) {
		throw AppError.notFound("File not found", "FILE_NOT_FOUND");
	}
	log.error(
		{ errorName: error instanceof Error ? error.name : "Unknown" },
		"Storage request failed",
	);
	throw new AppError(502, "Storage request failed", "STORAGE_REQUEST_FAILED");
}

function getFileUrl(key: string): string {
	return new URL(
		key.split("/").map(encodeURIComponent).join("/"),
		`${env.CDN_PUBLIC_URL?.replace(/\/+$/, "")}/`,
	).toString();
}

export async function uploadFile(file: Blob): Promise<string> {
	if (file.size < 1 || file.size > MAX_FILE_SIZE) {
		throw AppError.badRequest("File must be between 1 byte and 5 MiB", "INVALID_FILE_SIZE");
	}
	const contentType = file.type.toLowerCase().trim();
	if (!Object.hasOwn(FILE_TYPES, contentType)) {
		throw AppError.badRequest("Allowed files: JPEG, PNG, WebP, PDF", "INVALID_FILE_TYPE");
	}
	const bytes = new Uint8Array(await file.arrayBuffer());
	let detected: Awaited<ReturnType<typeof fileTypeFromBuffer>>;
	try {
		detected = await fileTypeFromBuffer(bytes);
	} catch {
		throw AppError.badRequest("File content could not be identified", "INVALID_FILE_CONTENT");
	}
	if (!detected || detected.mime !== contentType) {
		throw AppError.badRequest("File content does not match its type", "INVALID_FILE_CONTENT");
	}
	const key = `uploads/${crypto.randomUUID()}.${FILE_TYPES[contentType]}`;
	const url = getFileUrl(key);
	try {
		await getClient().send(
			new PutObjectCommand({
				Bucket: env.CDN_BUCKET,
				Key: key,
				Body: bytes,
				ContentType: contentType,
				ContentLength: bytes.byteLength,
			}),
		);
	} catch (error) {
		storageError(error);
	}
	return url;
}

export async function deleteFile(url: string): Promise<void> {
	const base = new URL(getFileUrl(""));
	const fileUrl = URL.parse(url);
	if (!fileUrl) {
		throw AppError.badRequest("Invalid file URL", "INVALID_FILE_URL");
	}
	if (
		fileUrl.origin !== base.origin ||
		!fileUrl.pathname.startsWith(base.pathname) ||
		fileUrl.search ||
		fileUrl.hash
	) {
		throw AppError.badRequest("File URL does not belong to this storage", "INVALID_FILE_URL");
	}
	const key = fileUrl.pathname.slice(base.pathname.length);
	validateKey(key);
	try {
		await getClient().send(new DeleteObjectCommand({ Bucket: env.CDN_BUCKET, Key: key }));
	} catch (error) {
		storageError(error);
	}
}
