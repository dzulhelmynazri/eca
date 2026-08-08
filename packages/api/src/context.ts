import type { NextRequest } from "next/server";
import { auth } from "@use-forever/auth";

export async function createContext(req: NextRequest) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	return {
		auth,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
