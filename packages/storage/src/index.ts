import { env } from "@use-forever/env/server";
import { createFiles } from "files-sdk";
import { cache } from "files-sdk/cache";
import { contentType } from "files-sdk/content-type";
import { encryption } from "files-sdk/encryption";
import { neon } from "files-sdk/neon";
import { signedUrlPolicy } from "files-sdk/signed-url-policy";
import { validation } from "files-sdk/validation";
import { versioning } from "files-sdk/versioning";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MiB
const MAX_SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes
const CACHE_TTL_MS = 60_000;
const VERSION_HISTORY_LIMIT = 10;
const STORAGE_KEY_PATTERN = /^[\w./-]+$/;
const HEX_KEY_PATTERN = /^[\da-f]+$/i;

function decodeHexToBytes(hex: string) {
	if (hex.length % 2 !== 0 || !HEX_KEY_PATTERN.test(hex)) {
		throw new Error(
			"STORAGE_ENCRYPTION_KEY must be a valid hex string with an even number of characters.",
		);
	}

	const bytes = new Uint8Array(hex.length / 2);

	for (let index = 0; index < bytes.length; index += 1) {
		bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}

	return bytes;
}

function getStorageEncryptionKey() {
	const key = env.STORAGE_ENCRYPTION_KEY as string;

	const decoded = decodeHexToBytes(key);

	return decoded;
}

export function createStorageClient() {
	return createFiles({
		adapter: neon({
			bucket: env.NEON_STORAGE_BUCKET as string,
		}),
		plugins: [
			cache({
				maxBytes: MAX_UPLOAD_SIZE,
				operations: ["head", "url", "download"],
				ttl: CACHE_TTL_MS,
			}),
			versioning({
				limit: VERSION_HISTORY_LIMIT,
			}),
			validation({
				key: STORAGE_KEY_PATTERN,
				maxSize: MAX_UPLOAD_SIZE,
				minSize: 1,
			}),
			contentType({
				onMismatch: "reject",
			}),
			signedUrlPolicy({
				maxExpiresIn: MAX_SIGNED_URL_TTL_SECONDS,
				maxUploadSize: MAX_UPLOAD_SIZE,
			}),
			encryption(getStorageEncryptionKey()),
		],
	});
}

let storageClient: ReturnType<typeof createStorageClient> | undefined;

export function getStorageClient() {
	storageClient ??= createStorageClient();
	return storageClient;
}
