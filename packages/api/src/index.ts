import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { ensureDefaultWorkspaceForUser } from "./services/workspaces";

export const t = initTRPC.context<Context>().create();

export const { router } = t;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			cause: "No session",
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const workspace = await ensureDefaultWorkspaceForUser({
		userId: ctx.session.user.id,
		userName: ctx.session.user.name,
	});

	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			workspace,
		},
	});
});
