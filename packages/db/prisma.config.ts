import path from "node:path";

import { defineConfig } from "prisma/config";
import { env } from "@use-forever/env/server";

export default defineConfig({
	datasource: {
		url: env.DATABASE_URL,
	},
	migrations: {
		path: path.join("prisma", "migrations"),
	},
	schema: path.join("prisma", "schema"),
});
