/**
 * Load the sidebar from an emdash menu, so operators can edit it from the
 * admin UI instead of rebuilding the site on every change.
 *
 * The plugin seeds a `docs-sidebar` menu on first boot (see `seed.ts`).
 * Consumers can also pass a static `sidebar` to `starLiteDocs()` to opt out
 * of the dynamic path entirely.
 */
import { getMenu } from "emdash";
import type { SidebarConfig, SidebarEntry } from "./types";

const DEFAULT_MENU_NAME = "docs-sidebar";

interface EmdashMenuItem {
	label: string;
	url: string;
	children: EmdashMenuItem[];
}

function toSidebarEntry(item: EmdashMenuItem): SidebarEntry {
	if (item.children && item.children.length > 0) {
		return {
			label: item.label,
			items: item.children.map(toSidebarEntry),
		};
	}
	return { label: item.label, link: item.url };
}

export async function loadSidebarFromMenu(name = DEFAULT_MENU_NAME): Promise<SidebarConfig[]> {
	try {
		const menu = await getMenu(name);
		if (!menu || !menu.items?.length) return [];
		// Top-level items with children become sidebar *groups*; top-level items
		// without children become lone links inside an implicit root group.
		const groups: SidebarConfig[] = [];
		const loose: SidebarEntry[] = [];
		for (const item of menu.items as EmdashMenuItem[]) {
			if (item.children && item.children.length > 0) {
				groups.push({
					label: item.label,
					items: item.children.map(toSidebarEntry),
				});
			} else {
				loose.push({ label: item.label, link: item.url });
			}
		}
		if (loose.length > 0) {
			groups.unshift({ label: menu.label || "Docs", items: loose });
		}
		return groups;
	} catch (err) {
		console.error("[star-lite-docs] failed to load sidebar menu:", err);
		return [];
	}
}
