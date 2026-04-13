export interface SidebarLink {
	type: 'link';
	label: string;
	href: string;
	isCurrent?: boolean;
	badge?: { variant: string; class?: string; text: string } | undefined;
	attrs?: Record<string, string | number | boolean | null | undefined>;
}

export interface SidebarGroup {
	type: 'group';
	label: string;
	entries: SidebarEntry[];
	collapsed?: boolean;
	badge?: { variant: string; class?: string; text: string } | undefined;
}

export type SidebarEntry = SidebarLink | SidebarGroup;

export interface SidebarConfig {
	label: string;
	link?: string;
	items?: SidebarConfig[];
}

export interface StarLiteDocsConfig {
	title: string;
	sidebar: SidebarConfig[];
}

/** Convert flat sidebar config into the tree structure the Sidebar component needs */
export function buildSidebar(config: SidebarConfig[]): SidebarEntry[] {
	return config.map((item): SidebarEntry => {
		if (item.items) {
			return {
				type: 'group',
				label: item.label,
				entries: buildSidebar(item.items),
				collapsed: false,
				badge: undefined,
			};
		}
		return {
			type: 'link',
			label: item.label,
			href: item.link || '/',
			isCurrent: false,
			badge: undefined,
			attrs: {},
		};
	});
}

/** Mark sidebar entries matching the current path as current */
export function markCurrent(entries: SidebarEntry[], currentPath: string): SidebarEntry[] {
	return entries.map((e) => {
		if (e.type === 'link') {
			const normalized = currentPath.replace(/\/$/, '');
			const href = e.href.replace(/\/$/, '');
			return { ...e, isCurrent: normalized === href };
		}
		if (e.type === 'group') {
			return { ...e, entries: markCurrent(e.entries, currentPath) };
		}
		return e;
	});
}
