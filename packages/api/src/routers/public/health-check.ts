import { healthCheckResponseSchema } from "@use-forever/contracts";
import { publicProcedure } from "../../index";

export const healthCheck = publicProcedure.output(healthCheckResponseSchema).query(() => "OK");
