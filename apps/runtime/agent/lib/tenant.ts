export interface TenantCaller {
	tenantId: string;
	userId: string;
}

interface TenantCallerContext {
	session: {
		auth: {
			current?: {
				principalType?: string;
				principalId?: string;
				attributes?: {
					tenantId?: string;
				};
			} | null;
		};
	};
}

export function requireTenantCaller(ctx: TenantCallerContext): TenantCaller {
	const caller = ctx.session.auth.current;
	const tenantId = caller?.attributes?.tenantId;

	if (
		caller?.principalType !== "user" ||
		typeof caller.principalId !== "string" ||
		caller.principalId.length === 0 ||
		typeof tenantId !== "string" ||
		tenantId.length === 0
	) {
		throw new Error("An authenticated tenant user is required.");
	}

	return {
		tenantId,
		userId: caller.principalId,
	};
}
