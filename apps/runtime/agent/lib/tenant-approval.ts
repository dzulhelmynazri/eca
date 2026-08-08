import type { ApprovalContext, ApprovalStatus } from "eve/tools";

function tenantIdOf(auth: ApprovalContext["session"]["auth"]["current"]): string | null {
	const tenantId = auth?.attributes?.tenantId;
	return typeof tenantId === "string" ? tenantId : null;
}

export async function decideTenantApproval(ctx: ApprovalContext): Promise<ApprovalStatus> {
	const current = ctx.session.auth.current;
	const currentTenantId = tenantIdOf(current);
	const initiatorTenantId = tenantIdOf(ctx.session.auth.initiator);

	if (
		current?.principalType !== "user" ||
		!currentTenantId ||
		currentTenantId !== initiatorTenantId
	) {
		return { type: "denied", reason: "The session is not pinned to a single tenant user." };
	}

	const toolInput = ctx.toolInput as Record<string, unknown> | undefined;
	if (typeof toolInput?.tenantId === "string" && toolInput.tenantId !== currentTenantId) {
		return { type: "denied", reason: "Tool input cannot select another tenant." };
	}

	return {
		type: "approved",
		reason: "Tenant-bound tool access granted.",
	};
}
