import { z } from "zod";

export const KNOWLEDGE_SOURCE_NAME_MAX_LENGTH = 160;
export const KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH = 2_000;
export const KNOWLEDGE_SEARCH_LIMIT_MAX = 20;

export const knowledgeSourceTypeSchema = z.enum(["FILE", "WEBSITE"]);
export const knowledgeSourceStatusSchema = z.enum(["READY", "SYNCING", "FAILED"]);
export const knowledgeJobStatusSchema = z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]);
export const knowledgeSourceIdSchema = z.string().min(1);
export const knowledgeSourceNameSchema = z
	.string()
	.trim()
	.min(1, "Name is required")
	.max(KNOWLEDGE_SOURCE_NAME_MAX_LENGTH);
export const knowledgeSourceUrlSchema = z.url();

export const knowledgeSourceSchema = z.object({
	id: knowledgeSourceIdSchema,
	name: knowledgeSourceNameSchema,
	type: knowledgeSourceTypeSchema,
	status: knowledgeSourceStatusSchema,
	sourceUrl: knowledgeSourceUrlSchema.nullable(),
	fileKey: z.string().nullable(),
	fileName: z.string().nullable(),
	sizeBytes: z.number().int().positive().nullable(),
	lastSyncedAt: z.date().nullable(),
	lastSyncError: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const knowledgeSourcesSchema = z.array(knowledgeSourceSchema);

const createFileKnowledgeSourceInputSchema = z.object({
	type: z.literal("FILE"),
	name: knowledgeSourceNameSchema,
	fileName: z.string().trim().min(1),
	fileKey: z.string().trim().min(1).optional(),
	sizeBytes: z.number().int().positive().optional(),
});

const createWebsiteKnowledgeSourceInputSchema = z.object({
	type: z.literal("WEBSITE"),
	name: knowledgeSourceNameSchema,
	sourceUrl: knowledgeSourceUrlSchema,
});

export const createKnowledgeSourceInputSchema = z.discriminatedUnion("type", [
	createFileKnowledgeSourceInputSchema,
	createWebsiteKnowledgeSourceInputSchema,
]);

export const getKnowledgeSourceInputSchema = z.object({
	sourceId: knowledgeSourceIdSchema,
});

export const deleteKnowledgeSourceInputSchema = z.object({
	sourceId: knowledgeSourceIdSchema,
});

export const resyncKnowledgeSourceInputSchema = z.object({
	sourceId: knowledgeSourceIdSchema,
});

export const knowledgeIngestionJobSchema = z.object({
	id: z.string().min(1),
	sourceId: z.string().min(1),
	status: knowledgeJobStatusSchema,
	trigger: z.string().min(1),
	createdAt: z.date(),
	updatedAt: z.date(),
	startedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	errorMessage: z.string().nullable(),
});

export const searchKnowledgeInputSchema = z.object({
	limit: z.number().int().positive().max(KNOWLEDGE_SEARCH_LIMIT_MAX).default(8),
	query: z.string().trim().min(1).max(KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH),
	sourceIds: z.array(z.string().min(1)).optional(),
});

export const knowledgeSearchResultSchema = z.object({
	chunkId: z.string().min(1),
	content: z.string().min(1),
	documentId: z.string().min(1),
	score: z.number().min(0).max(1),
	sourceId: z.string().min(1),
	sourceName: z.string().min(1),
});

export const knowledgeSearchResultsSchema = z.array(knowledgeSearchResultSchema);

export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
export type KnowledgeSources = z.infer<typeof knowledgeSourcesSchema>;
export type CreateKnowledgeSourceInput = z.infer<typeof createKnowledgeSourceInputSchema>;
export type GetKnowledgeSourceInput = z.infer<typeof getKnowledgeSourceInputSchema>;
export type DeleteKnowledgeSourceInput = z.infer<typeof deleteKnowledgeSourceInputSchema>;
export type ResyncKnowledgeSourceInput = z.infer<typeof resyncKnowledgeSourceInputSchema>;
export type KnowledgeIngestionJob = z.infer<typeof knowledgeIngestionJobSchema>;
export type SearchKnowledgeInput = z.infer<typeof searchKnowledgeInputSchema>;
export type KnowledgeSearchResult = z.infer<typeof knowledgeSearchResultSchema>;
