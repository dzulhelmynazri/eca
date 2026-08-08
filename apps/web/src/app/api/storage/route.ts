import { getStorageClient } from "@use-forever/storage";

function sanitizeFileName(fileName: string) {
	const sanitized = fileName
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9._-]/g, "-")
		.replace(/-+/g, "-");

	return sanitized || "file";
}

function getErrorCode(error: unknown) {
	if (typeof error === "object" && error !== null && "code" in error) {
		return String(error.code);
	}

	return undefined;
}

export async function POST(request: Request) {
	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return Response.json({ error: "Expected multipart form field 'file'" }, { status: 400 });
	}

	const key = `knowledge/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

	const storage = getStorageClient();
	const uploaded = await storage.upload(key, file, {
		contentType: file.type || undefined,
	});

	return Response.json({ file: uploaded, key }, { status: 201 });
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const key = searchParams.get("key")?.trim();

	if (!key) {
		return Response.json({ error: "Missing query parameter 'key'" }, { status: 400 });
	}

	const storage = getStorageClient();

	try {
		const storedFile = await storage.download(key, { as: "blob" });
		const blob = await storedFile.blob();
		const filename = key.split("/").at(-1) ?? "download";

		return new Response(blob, {
			headers: {
				"content-disposition": `attachment; filename="${filename}"`,
				"content-type": storedFile.type || blob.type || "application/octet-stream",
			},
			status: 200,
		});
	} catch (error) {
		if (getErrorCode(error) === "NotFound") {
			return Response.json({ error: "File not found" }, { status: 404 });
		}

		throw error;
	}
}
