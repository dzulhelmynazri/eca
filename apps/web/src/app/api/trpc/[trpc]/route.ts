import { createContext } from "@use-forever/api/context";
import { appRouter } from "@use-forever/api/routers/index";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

function handler(req: NextRequest) {
	return fetchRequestHandler({
		createContext: () => createContext(req),
		endpoint: "/api/trpc",
		req,
		router: appRouter,
	});
}

export { handler as GET, handler as POST };
