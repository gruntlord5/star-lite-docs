/**
 * Star-Lite Docs — a drop-in docs theme for EmDash CMS.
 *
 * One Astro integration + one emdash plugin turns an emdash site into a
 * Starlight-style documentation site: sidebar, search, TOC, dark/light
 * theme, portable-text block editor, and lazy-applied default schema.
 *
 * @example
 * ```ts
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config';
 * import node from '@astrojs/node';
 * import emdash, { local } from 'emdash/astro';
 * import { starLiteDocs, starLiteBlocks } from 'star-lite-docs';
 *
 * export default defineConfig({
 *   output: 'server',
 *   adapter: node({ mode: 'standalone' }),
 *   integrations: [
 *     starLiteDocs({ title: 'My Docs' }),
 *     emdash({
 *       database: ...,
 *       storage: local({ directory: './uploads' }),
 *       plugins: [starLiteBlocks()],
 *     }),
 *   ],
 * });
 * ```
 *
 * No sidebar config is required — the plugin seeds a `docs-sidebar` menu
 * on first boot, editable from the emdash admin UI.
 */

// Primary entry points — these are imported at astro.config load time, so
// they must NOT transitively pull any `.astro` files (Node can't parse
// those). For `.astro` components, use the `star-lite-docs/layout` subpath.
import { starLiteDocs as _starLiteDocs } from "./integration";
export { starLiteDocs } from "./integration";
export { starLiteBlocks } from "./emdash-plugin";

// Default export so `astro add star-lite-docs` can locate the integration.
export default _starLiteDocs;

// Runtime helpers (pure TS — safe to import from config or routes)
export { preprocessBlocks, preprocessImages } from "./preprocess";
export { buildSidebar, markCurrent } from "./types";
export { loadSidebarFromMenu } from "./menu-loader";
export { ensurePagesCollection } from "./bootstrap";
export { defaultSeed } from "./seed";

// Types
export type { StarLiteDocsOptions } from "./integration";
export type { StarLiteDocsConfig, SidebarConfig, SidebarEntry, SidebarLink, SidebarGroup } from "./types";
