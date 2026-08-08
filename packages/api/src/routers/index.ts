import { router } from "../index";
import { customersRouter } from "./protected/customers";
import { integrationsRouter } from "./protected/integrations";
import { knowledgeRouter } from "./protected/knowledge";
import { me } from "./protected/me";
import { workspaceRouter } from "./protected/workspace";
import { healthCheck } from "./public/health-check";

export const appRouter = router({
	customers: customersRouter,
	healthCheck,
	integrations: integrationsRouter,
	knowledge: knowledgeRouter,
	me,
	workspace: workspaceRouter,
});
export type AppRouter = typeof appRouter;
