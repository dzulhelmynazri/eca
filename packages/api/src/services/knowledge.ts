import type { KnowledgeSearchResult, KnowledgeSource } from "@use-forever/contracts";
import { embed } from "ai";
import prisma from "@use-forever/db";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

const knowledgeSourceSelect = {
	createdAt: true,
	fileKey: true,
	fileName: true,
	id: true,
	lastSyncError: true,
	lastSyncedAt: true,
	name: true,
	sizeBytes: true,
	sourceUrl: true,
	status: true,
	type: true,
	updatedAt: true,
} as const;

function toVectorLiteral(values: number[]) {
	return `[${values.map((value) => Number(value.toFixed(8))).join(",")}]`;
}

export async function listKnowledgeSourcesForUser(userId: string): Promise<KnowledgeSource[]> {
	return prisma.knowledgeSource.findMany({
		orderBy: {
			createdAt: "desc",
		},
		select: knowledgeSourceSelect,
		where: {
			userId,
		},
	});
}

export async function searchKnowledgeForUser(input: {
	userId: string;
	query: string;
	limit: number;
	sourceIds?: string[];
}): Promise<KnowledgeSearchResult[]> {
	const { embedding } = await embed({
		model: EMBEDDING_MODEL,
		value: input.query,
	});
	const vectorLiteral = toVectorLiteral(embedding);
	const params: Array<string | number> = [vectorLiteral, input.userId];
	let sourceFilterSql = "";
	if (input.sourceIds && input.sourceIds.length > 0) {
		const sourcePlaceholders = input.sourceIds.map((_, index) => `$${params.length + index + 1}`);
		sourceFilterSql = ` AND kc.source_id IN (${sourcePlaceholders.join(", ")})`;
		params.push(...input.sourceIds);
	}
	const limitPlaceholder = `$${params.length + 1}`;
	params.push(input.limit);

	// Safe because placeholder positions are generated in-process.
	// User-provided values are still passed as bound parameters.
	const rows = await prisma.$queryRawUnsafe<
		Array<{
			chunkId: string;
			content: string;
			documentId: string;
			score: number;
			sourceId: string;
			sourceName: string;
		}>
	>(
		`
			SELECT
				kc.id AS "chunkId",
				kc.content AS "content",
				kc.document_id AS "documentId",
				1 - (kc.embedding <=> $1::vector) AS "score",
				ks.id AS "sourceId",
				ks.name AS "sourceName"
			FROM knowledge_chunk kc
			INNER JOIN knowledge_source ks ON ks.id = kc.source_id
			WHERE kc.user_id = $2
				AND kc.embedding IS NOT NULL
				${sourceFilterSql}
			ORDER BY kc.embedding <=> $1::vector ASC
			LIMIT ${limitPlaceholder}
		`,
		...params,
	);

	return rows.map((row) => ({
		...row,
		score: Math.max(0, Math.min(1, row.score)),
	}));
}
