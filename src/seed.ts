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
			items: [],
		},
	],
	content: {
		pages: [
			{
				id: "welcome",
				slug: "index",
				status: "published",
				data: {
					title: "Welcome",
					content: [
						{
							_type: "docs.hero",
							_key: "welcome-hero",
							tagline: "A drop-in Starlight-style docs theme for EmDash CMS. Edit this page to get started.",
							imageSrc: "/houston.webp",
							imageAlt: "Houston, Starlight's mascot",
							actionsJson: JSON.stringify([
								{ text: "Create a new page", link: "/_emdash/admin/content/pages/new", icon: "right-arrow", variant: "primary" },
								{ text: "Edit the sidebar menu", link: "/_emdash/admin/menus/docs-sidebar", variant: "secondary" },
							]),
						},
					],
				},
			},
		],
	},
	collections: [
		{
			slug: "pages",
			label: "Pages",
			labelSingular: "Page",
			description: "Documentation pages rendered by the star-lite-docs plugin.",
			icon: "book-open",
			supports: ["drafts", "revisions", "seo"],
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
				},
			],
		},
	],
};
