import { listKnowledgeSourcesForUser } from "@use-forever/api/services/knowledge";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveKnowledgeOwnerUserId } from "../lib/knowledge";

const listKnowledgeSourcesToolOutputSchema = z.object({
	available: z.boolean(),
	reason: z.string().optional(),
	sources: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			type: z.enum(["FILE", "WEBSITE"]),
			status: z.enum(["READY", "SYNCING", "FAILED"]),
			sourceUrl: z.string().nullable(),
			fileName: z.string().nullable(),
			lastSyncedAtIso: z.string().nullable(),
		}),
	),
});

export default defineTool({
	description: "List tenant knowledge sources and their sync status.",
	inputSchema: z.object({}),
	outputSchema: listKnowledgeSourcesToolOutputSchema,
	async execute(_input, ctx) {
		const ownership = await resolveKnowledgeOwnerUserId(ctx);
		if (!ownership.available) {
			return {
				available: false,
				reason: ownership.reason,
				sources: [],
			};
		}

		const sources = await listKnowledgeSourcesForUser(ownership.userId);
		return {
			available: true,
			sources: sources.map((source) => ({
				id: source.id,
				name: source.name,
				type: source.type,
				status: source.status,
				sourceUrl: source.sourceUrl,
				fileName: source.fileName,
				lastSyncedAtIso: source.lastSyncedAt?.toISOString() ?? null,
			})),
		};
	},
});
