import { knowledgeSearchResultsSchema, searchKnowledgeInputSchema } from "@use-forever/contracts";
import { searchKnowledgeForUser } from "@use-forever/api/services/knowledge";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveKnowledgeOwnerUserId } from "../lib/knowledge";

const searchKnowledgeToolOutputSchema = z.object({
	available: z.boolean(),
	query: z.string(),
	reason: z.string().optional(),
	results: knowledgeSearchResultsSchema,
});

export default defineTool({
	description: "Search tenant knowledge sources for relevant context snippets.",
	inputSchema: searchKnowledgeInputSchema,
	outputSchema: searchKnowledgeToolOutputSchema,
	async execute(input, ctx) {
		const ownership = await resolveKnowledgeOwnerUserId(ctx);
		if (!ownership.available) {
			return {
				available: false,
				query: input.query,
				reason: ownership.reason,
				results: [],
			};
		}

		const results = await searchKnowledgeForUser({
			userId: ownership.userId,
			query: input.query,
			limit: input.limit,
			sourceIds: input.sourceIds,
		});

		return {
			available: true,
			query: input.query,
			results,
		};
	},
});
