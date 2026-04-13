/**
 * Default seed for the star-lite-docs plugin.
 *
 * Applied automatically on first boot (see `bootstrap.ts`) so a fresh emdash
 * install picks up the `pages` collection the catch-all route expects —
 * without the operator having to click through the admin UI first.
 */
import type { SeedFile } from "emdash";

export const defaultSeed: SeedFile = {
	version: "1",
	meta: {
		name: "star-lite-docs",
		description: "Pages collection used by the star-lite-docs catch-all route.",
	},
	menus: [
		{
			name: "docs-sidebar",
			label: "Docs sidebar",
			items: [
				{ type: "custom", label: "Welcome", url: "/" },
			],
		},
	],
	collections: [
		{
			slug: "pages",
			label: "Pages",
			labelSingular: "Page",
			description: "Documentation pages rendered by the star-lite-docs plugin.",
			icon: "book-open",
			supports: ["drafts", "revisions", "search", "seo"],
			fields: [
				{
					slug: "title",
					label: "Title",
					type: "string",
					required: true,
					searchable: true,
				},
				{
					slug: "content",
					label: "Content",
					type: "portableText",
					searchable: true,
				},
			],
		},
	],
};
