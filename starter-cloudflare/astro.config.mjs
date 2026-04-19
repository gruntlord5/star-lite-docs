// @ts-check
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { starLiteDocs, starLiteBlocks } from "star-lite-docs";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	integrations: [
		react(),
		starLiteDocs({
			title: "My Docs",
			expressiveCode: {
				shiki: { engine: "javascript" },
			},
		}),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [starLiteBlocks()],
		}),
	],
	devToolbar: { enabled: false },
});
