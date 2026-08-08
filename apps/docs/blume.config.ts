import { defineConfig } from "blume";

export default defineConfig({
	title: "use-forever Docs",
	description: "Documentation for use-forever.",
	navigation: {
		tabs: [
			{ label: "Docs", path: "/" },
			{ label: "API", path: "/reference" },
		],
	},
	openapi: {
		enabled: true,
		spec: "./docs/openapi/openapi.json",
	},
});
