import {
	createKnowledgeSourceInputSchema,
	deleteKnowledgeSourceInputSchema,
	getKnowledgeSourceInputSchema,
	knowledgeSearchResultsSchema,
	knowledgeSourceSchema,
	knowledgeSourcesSchema,
	resyncKnowledgeSourceInputSchema,
	searchKnowledgeInputSchema,
} from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../index";
import { processKnowledgeIngestionJob } from "../../services/knowledge-ingestion";
import { searchKnowledgeForUser } from "../../services/knowledge";

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

async function requireOwnedKnowledgeSource(sourceId: string, userId: string) {
	const source = await prisma.knowledgeSource.findFirst({
		where: {
			id: sourceId,
			userId,
		},
		select: knowledgeSourceSelect,
	});

	if (!source) {
		throw new TRPCError({
			code: "NOT_FOUND",
		});
	}

	return source;
}

async function enqueueKnowledgeIngestionJobIfIdle(
	sourceId: string,
	userId: string,
	trigger: "create" | "resync",
) {
	return prisma.$transaction(async (tx) => {
		const existingActiveJob = await tx.knowledgeIngestionJob.findFirst({
			where: {
				sourceId,
				status: {
					in: ["QUEUED", "PROCESSING"],
				},
				userId,
			},
			select: { id: true },
		});

		if (existingActiveJob) {
			return null;
		}

		const job = await tx.knowledgeIngestionJob.create({
			data: {
				sourceId,
				status: "QUEUED",
				trigger,
				userId,
			},
			select: {
				id: true,
			},
		});

		return job.id;
	});
}

function startKnowledgeIngestion(jobId: string, trigger: "create" | "resync") {
	void processKnowledgeIngestionJob(jobId).catch((error) => {
		console.error("Failed to process knowledge ingestion job", {
			error,
			jobId,
			trigger,
		});
	});
}

export const knowledgeRouter = router({
	list: protectedProcedure.output(knowledgeSourcesSchema).query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		return prisma.knowledgeSource.findMany({
			orderBy: {
				createdAt: "desc",
			},
			select: knowledgeSourceSelect,
			where: {
				userId,
			},
		});
	}),
	byId: protectedProcedure
		.input(getKnowledgeSourceInputSchema)
		.output(knowledgeSourceSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			return requireOwnedKnowledgeSource(input.sourceId, userId);
		}),
	search: protectedProcedure
		.input(searchKnowledgeInputSchema)
		.output(knowledgeSearchResultsSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			return searchKnowledgeForUser({
				userId,
				query: input.query,
				limit: input.limit,
				sourceIds: input.sourceIds,
			});
		}),
	create: protectedProcedure
		.input(createKnowledgeSourceInputSchema)
		.output(knowledgeSourceSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const source = await prisma.knowledgeSource.create({
				data: {
					fileKey: input.type === "FILE" ? (input.fileKey ?? null) : null,
					fileName: input.type === "FILE" ? input.fileName : null,
					lastSyncError: null,
					name: input.name,
					sizeBytes: input.type === "FILE" ? (input.sizeBytes ?? null) : null,
					sourceUrl: input.type === "WEBSITE" ? input.sourceUrl : null,
					status: "SYNCING",
					type: input.type,
					userId,
				},
				select: knowledgeSourceSelect,
			});

			const jobId = await enqueueKnowledgeIngestionJobIfIdle(source.id, userId, "create");
			if (jobId) {
				startKnowledgeIngestion(jobId, "create");
			}
			return source;
		}),
	resync: protectedProcedure
		.input(resyncKnowledgeSourceInputSchema)
		.output(knowledgeSourceSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const source = await requireOwnedKnowledgeSource(input.sourceId, userId);

			const jobId = await enqueueKnowledgeIngestionJobIfIdle(source.id, userId, "resync");
			if (!jobId) {
				return requireOwnedKnowledgeSource(source.id, userId);
			}

			await prisma.knowledgeSource.update({
				where: { id: source.id },
				data: {
					lastSyncError: null,
					status: "SYNCING",
				},
			});

			startKnowledgeIngestion(jobId, "resync");
			return requireOwnedKnowledgeSource(source.id, userId);
		}),
	delete: protectedProcedure
		.input(deleteKnowledgeSourceInputSchema)
		.output(knowledgeSourceSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const source = await requireOwnedKnowledgeSource(input.sourceId, userId);

			await prisma.knowledgeSource.delete({
				where: {
					id: source.id,
				},
			});

			return source;
		}),
});
