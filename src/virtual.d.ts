declare module "virtual:star-lite-docs/config" {
	import type { SidebarConfig } from "./types";
	export const sidebar: SidebarConfig[] | null;
	export const siteTitle: string;
}

declare module "virtual:star-lite-docs/data" {
	import type { SidebarConfig } from "./types";
	export function getDb(): Promise<any>;
	export function getSiteSettings(): Promise<any>;
	export function ensurePagesCollection(db: any): Promise<void>;
	export function loadSidebarFromMenu(name?: string): Promise<SidebarConfig[]>;
}
