import { embedMany } from "ai";
import { SentenceSplitter } from "llamaindex";
import prisma from "@use-forever/db";
import { env } from "@use-forever/env/server";
import { getStorageClient } from "@use-forever/storage";
import { createHash } from "node:crypto";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 180;
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2/scrape";
const INGESTION_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

type FirecrawlResponse = {
	markdown?: string;
	data?: {
		markdown?: string;
	};
};

const semanticTextSplitter = new SentenceSplitter({
	chunkOverlap: CHUNK_OVERLAP,
	chunkSize: CHUNK_SIZE,
	paragraphSeparator: "\n\n",
});

function chunkText(content: string) {
	const normalized = content.replaceAll(/\r\n/g, "\n").trim();
	if (!normalized) {
		return [];
	}

	return semanticTextSplitter
		.splitText(normalized)
		.map((chunk) => chunk.trim())
		.filter((chunk) => chunk.length > 0);
}

function toVectorLiteral(values: number[]) {
	return `[${values.map((value) => Number(value.toFixed(8))).join(",")}]`;
}

class NonRetryableError extends Error {}

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry<T>(operation: () => Promise<T>, retries: number) {
	let attempt = 0;

	while (true) {
		try {
			return await operation();
		} catch (error) {
			const isLastAttempt = attempt >= retries;
			if (isLastAttempt || error instanceof NonRetryableError) {
				throw error;
			}

			attempt += 1;
			await wait(RETRY_BASE_DELAY_MS * attempt);
		}
	}
}

function buildChunkEmbeddingUpdateQuery(documentId: string, embeddings: number[][]) {
	// This query is executed with $executeRawUnsafe because Prisma does not yet provide
	// a typed/bound API for bulk CASE updates to pgvector columns. Safety constraints:
	// - `documentId` is bound as a positional parameter ($1), not string-interpolated.
	// - `chunk_index` values come from array indexes generated in-process.
	// - Embedding values come from the OpenAI embedding response and are converted to
	//   numeric literals only via `Number(value.toFixed(8))`, so no arbitrary SQL text
	//   can be injected through user input.
	const cases = embeddings
		.map((embedding, index) => `WHEN ${index} THEN '${toVectorLiteral(embedding)}'::vector`)
		.join("\n");

	return {
		params: [documentId] as const,
		query: `
			UPDATE "knowledge_chunk"
			SET "embedding" = CASE "chunkIndex"
				${cases}
				ELSE "embedding"
			END
			WHERE "documentId" = $1
		`,
	};
}

async function scrapeWebsiteMarkdown(url: string) {
	const payload = await retry(async () => {
		const response = await fetch(FIRECRAWL_API_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				formats: ["markdown"],
				url,
			}),
		});

		if (!response.ok) {
			const message = `Firecrawl scrape failed (${response.status} ${response.statusText}).`;
			const isRetryable = response.status === 429 || response.status >= 500;
			if (!isRetryable) {
				throw new NonRetryableError(message);
			}

			throw new Error(message);
		}

		return (await response.json()) as FirecrawlResponse;
	}, INGESTION_RETRIES);
	const markdown = payload.data?.markdown ?? payload.markdown;
	if (!markdown || markdown.trim().length === 0) {
		throw new Error("Firecrawl did not return markdown content.");
	}

	return markdown;
}

async function parseFileMarkdown(fileKey: string) {
	const anydoc = await import("@firecrawl/anydoc");
	const toMarkdownFn = anydoc.toMarkdown ?? anydoc.default?.toMarkdown;
	const toMarkdownBytesFn = anydoc.toMarkdownBytes ?? anydoc.default?.toMarkdownBytes;

	if (!toMarkdownFn || !toMarkdownBytesFn) {
		throw new Error("Unable to load @firecrawl/anydoc parser functions.");
	}

	const storage = getStorageClient();
	const file = await storage.download(fileKey, { as: "blob" });
	const blob = await file.blob();
	const bytes = new Uint8Array(await blob.arrayBuffer());

	if (bytes.length === 0) {
		throw new Error("Uploaded file is empty.");
	}

	// Use path parser first for local key compatibility, then bytes fallback.
	try {
		return await toMarkdownFn(fileKey);
	} catch {
		return toMarkdownBytesFn(bytes);
	}
}

export async function processKnowledgeIngestionJob(jobId: string) {
	const preClaimJob = await prisma.knowledgeIngestionJob.findUnique({
		where: { id: jobId },
		select: { sourceId: true },
	});

	const claimResult = await prisma.knowledgeIngestionJob.updateMany({
		where: {
			id: jobId,
			status: "QUEUED",
		},
		data: {
			completedAt: null,
			errorMessage: null,
			startedAt: new Date(),
			status: "PROCESSING",
		},
	});

	if (claimResult.count === 0) {
		return;
	}

	const job = await prisma.knowledgeIngestionJob.findUnique({
		where: { id: jobId },
		include: { source: true },
	});

	if (!job) {
		const missingMessage = "Knowledge ingestion job was missing after claim.";
		await prisma.knowledgeIngestionJob.updateMany({
			where: {
				id: jobId,
				status: "PROCESSING",
			},
			data: {
				completedAt: new Date(),
				errorMessage: missingMessage,
				status: "FAILED",
			},
		});
		if (preClaimJob?.sourceId) {
			await prisma.knowledgeSource.updateMany({
				where: { id: preClaimJob.sourceId },
				data: {
					lastSyncError: missingMessage,
					status: "FAILED",
				},
			});
		}
		return;
	}
	await prisma.knowledgeSource.update({
		where: { id: job.sourceId },
		data: {
			lastSyncError: null,
			status: "SYNCING",
		},
	});

	try {
		let markdown: string;
		if (job.source.type === "WEBSITE") {
			if (!job.source.sourceUrl) {
				throw new Error("Website source is missing URL.");
			}
			markdown = await scrapeWebsiteMarkdown(job.source.sourceUrl);
		} else {
			if (!job.source.fileKey) {
				throw new Error("File source is missing storage key.");
			}
			markdown = await parseFileMarkdown(job.source.fileKey);
		}
		const contentText = markdown
			.replaceAll(/```[\s\S]*?```/g, "\n")
			.replaceAll(/\r\n/g, "\n")
			.split("\n")
			.map((line) => line.trim())
			.join("\n")
			.replaceAll(/\n{3,}/g, "\n\n")
			.trim();
		const chunks = chunkText(contentText);

		if (chunks.length === 0) {
			throw new Error("No usable text chunks were extracted.");
		}

		const { embeddings } = await retry(
			() =>
				embedMany({
					model: EMBEDDING_MODEL,
					values: chunks,
				}),
			INGESTION_RETRIES,
		);

		if (embeddings.length !== chunks.length) {
			throw new Error("Embedding count does not match chunk count.");
		}

		const contentHash = createHash("sha256").update(contentText).digest("hex");
		const documentTitle =
			job.source.name ||
			job.source.fileName ||
			job.source.sourceUrl ||
			`knowledge-${job.source.id}`;

		await prisma.$transaction(async (tx) => {
			await tx.knowledgeChunk.deleteMany({
				where: { sourceId: job.sourceId },
			});
			await tx.knowledgeDocument.deleteMany({
				where: { sourceId: job.sourceId },
			});

			const document = await tx.knowledgeDocument.create({
				data: {
					contentHash,
					contentLength: contentText.length,
					contentMarkdown: markdown,
					contentText,
					externalId: null,
					sourceId: job.sourceId,
					title: documentTitle,
					userId: job.userId,
				},
				select: { id: true },
			});

			await tx.knowledgeChunk.createMany({
				data: chunks.map((content, index) => ({
					chunkIndex: index,
					content,
					contentLength: content.length,
					documentId: document.id,
					embeddingDimension: EMBEDDING_DIMENSION,
					embeddingModel: EMBEDDING_MODEL,
					sourceId: job.sourceId,
					userId: job.userId,
				})),
			});

			const { params, query } = buildChunkEmbeddingUpdateQuery(document.id, embeddings);
			await tx.$executeRawUnsafe(query, ...params);
		});

		await prisma.knowledgeIngestionJob.update({
			where: { id: jobId },
			data: {
				completedAt: new Date(),
				errorMessage: null,
				status: "COMPLETED",
			},
		});
		await prisma.knowledgeSource.update({
			where: { id: job.sourceId },
			data: {
				lastSyncError: null,
				lastSyncedAt: new Date(),
				status: "READY",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Knowledge ingestion failed.";
		await prisma.knowledgeIngestionJob.update({
			where: { id: jobId },
			data: {
				completedAt: new Date(),
				errorMessage: message,
				status: "FAILED",
			},
		});
		await prisma.knowledgeSource.update({
			where: { id: job.sourceId },
			data: {
				lastSyncError: message,
				status: "FAILED",
			},
		});
	}
}
