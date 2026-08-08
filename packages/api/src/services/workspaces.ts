import prisma from "@use-forever/db";
import { toSlug } from "@use-forever/utils";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";

const DEFAULT_WORKSPACE_SUFFIX_LENGTH = 6;

export type WorkspaceRecord = {
	id: string;
	name: string;
	slug: string;
	ownerUserId: string;
	customerOwnerUserId: string | null;
	updatedAt: Date;
};

function assertWorkspaceDelegatesAvailable() {
	const hasWorkspaceDelegate = typeof prisma.workspace?.findUnique === "function";
	if (!hasWorkspaceDelegate) {
		throw new Error(
			"Workspace Prisma delegate is unavailable. Regenerate Prisma client and restart the dev server.",
		);
	}
}

const createWorkspaceSlug = (name: string) => {
	const base = toSlug(name) || "workspace";
	const randomSuffix = randomUUID().replace(/-/g, "").slice(0, DEFAULT_WORKSPACE_SUFFIX_LENGTH);
	return `${base}-${randomSuffix}`;
};

export const workspaceSelect = {
	id: true,
	name: true,
	slug: true,
	ownerUserId: true,
	customerOwnerUserId: true,
	updatedAt: true,
} as const;

export async function ensureDefaultWorkspaceForUser(input: {
	userId: string;
	userName?: string | null;
}): Promise<WorkspaceRecord> {
	assertWorkspaceDelegatesAvailable();

	const workspace = await prisma.workspace.findFirst({
		where: {
			ownerUserId: input.userId,
		},
		orderBy: {
			createdAt: "asc",
		},
		select: workspaceSelect,
	});
	if (workspace) {
		return workspace as WorkspaceRecord;
	}

	const workspaceName = input.userName?.trim()
		? `${input.userName.trim()}'s workspace`
		: "Default workspace";
	return prisma.$transaction(async (tx) => {
		const workspace = await tx.workspace.create({
			data: {
				name: workspaceName,
				slug: createWorkspaceSlug(workspaceName),
				ownerUserId: input.userId,
				customerOwnerUserId: input.userId,
			},
			select: workspaceSelect,
		});
		return workspace as WorkspaceRecord;
	});
}

export async function requireWorkspaceAdmin(input: {
	workspaceId: string;
	userId: string;
}): Promise<WorkspaceRecord> {
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerUserId: input.userId,
		},
		select: workspaceSelect,
	});

	if (!workspace) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Workspace owner access required.",
		});
	}

	return workspace as WorkspaceRecord;
}

export async function getWorkspaceById(workspaceId: string) {
	return prisma.workspace.findUnique({
		where: {
			id: workspaceId,
		},
		select: workspaceSelect,
	});
}
