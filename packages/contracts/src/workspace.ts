import { z } from "zod";
import { integrationStatusSchema } from "./integrations";

export const workspaceSchema = z.object({
	workspaceId: z.string().min(1),
	workspaceName: z.string().min(1),
	customerOwnerUserId: z.string().min(1),
	integrations: z.array(integrationStatusSchema),
});

export type Workspace = z.infer<typeof workspaceSchema>;
