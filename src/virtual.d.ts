declare module "virtual:star-lite-docs/config" {
	import type { SidebarConfig } from "./types";
	/** Static sidebar passed to `starLiteDocs()`, or `null` to load from the docs-sidebar menu at runtime. */
	export const sidebar: SidebarConfig[] | null;
	export const siteTitle: string;
}
