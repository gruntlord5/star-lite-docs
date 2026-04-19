/**
 * Star-Lite Docs Astro Integration
 *
 * Injects the catch-all page route and search API route,
 * and provides the sidebar config via a virtual module.
 *
 * Usage in astro.config.mjs:
 *
 *   import { starLiteDocs } from 'star-lite-docs';
 *
 *   export default defineConfig({
 *     integrations: [
 *       starLiteDocs({
 *         title: 'My Docs',
 *         sidebar: [
 *           { label: 'Guide', items: [
 *             { label: 'Getting Started', link: '/guide/getting-started' },
 *           ]},
 *         ],
 *       }),
 *     ],
 *   });
 */

import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import expressiveCode from "astro-expressive-code";
import type { AstroExpressiveCodeOptions } from "astro-expressive-code";
import type { SidebarConfig } from "./types";
export interface StarLiteDocsOptions {
	/**
	 * Fallback site title used until the operator sets one in
	 * **Settings → Site → Title** in the emdash admin (which then takes
	 * precedence on every request).
	 */
	title?: string;
	/**
	 * Static sidebar navigation config. Optional — when omitted the plugin
	 * reads the sidebar from the `docs-sidebar` emdash menu at request time,
	 * so operators can edit it from the admin UI without rebuilding.
	 */
	sidebar?: SidebarConfig[];
	/**
	 * Expressive Code (code-block syntax highlighting) config.
	 *
	 * - Omit (default) → registered with Night Owl dark/light themes.
	 * - Pass an object → forwarded to `expressiveCode()` (overrides bundled themes).
	 * - Pass `false` → not registered at all (call `expressiveCode()` yourself).
	 */
	expressiveCode?: AstroExpressiveCodeOptions | false;
}

const VIRTUAL_MODULE_ID = "virtual:star-lite-docs/config";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;
const VIRTUAL_DATA_ID = "virtual:star-lite-docs/data";
const RESOLVED_VIRTUAL_DATA_ID = "\0" + VIRTUAL_DATA_ID;

export function starLiteDocs(options: StarLiteDocsOptions = {}): AstroIntegration {
	const siteTitle = options.title || "Documentation";
	// `null` sentinel means "no static sidebar — load from emdash menu at runtime".
	const sidebarJson = options.sidebar ? JSON.stringify(options.sidebar) : "null";

	return {
		name: "star-lite-docs",
		hooks: {
			"astro:config:setup"({ injectRoute, addMiddleware, updateConfig, config, logger }) {
				// Auto-register Expressive Code unless the user already added
				// it themselves OR explicitly opted out via `expressiveCode: false`.
				// We splice it in directly after this integration so order matches
				// what the user would have written by hand (Starlight uses the
				// same trick — see @astrojs/starlight `index.ts`).
				if (options.expressiveCode !== false) {
					const alreadyAdded = config.integrations.some(
						(i: any) => i?.name === "astro-expressive-code",
					);
					if (!alreadyAdded) {
						const ec = expressiveCode(options.expressiveCode);
						const selfIndex = config.integrations.findIndex(
							(i: any) => i?.name === "star-lite-docs",
						);
						config.integrations.splice(selfIndex + 1, 0, ec);
					}
				}

				// Copy houston.webp to public/ if missing
				const root = fileURLToPath(config.root);
				const publicDir = join(root, "public");
				const houstonDest = join(publicDir, "houston.webp");
				if (!existsSync(houstonDest)) {
					const houstonSrc = new URL("./assets/houston.webp", import.meta.url);
					mkdirSync(publicDir, { recursive: true });
					copyFileSync(fileURLToPath(houstonSrc), houstonDest);
					logger.info("copied houston.webp to public/");
				}

				// Warn about route conflicts
				const srcPages = join(root, "src", "pages");
				const conflicts = ["index.astro", "[slug].astro", "[...slug].astro"]
					.filter(f => existsSync(join(srcPages, f)));
				if (conflicts.length) {
					logger.warn(
						`Found route files that will override Star-Lite's catch-all: ${conflicts.join(", ")}. ` +
						`Delete them if you want Star-Lite to handle these routes.`
					);
				}

				// Inject catch-all page route
				injectRoute({
					pattern: "/[...slug]",
					entrypoint: new URL("./routes/page.astro", import.meta.url).pathname,
					prerender: false,
				});

				// Inject search API route
				injectRoute({
					pattern: "/api/search",
					entrypoint: new URL("./routes/search.ts", import.meta.url).pathname,
					prerender: false,
				});

				// Inject FTS disable route (called before save to prevent corruption)
				injectRoute({
					pattern: "/api/drop-fts",
					entrypoint: new URL("./routes/drop-fts.ts", import.meta.url).pathname,
					prerender: false,
				});

				// Inject markdown-export API route (powers Copy-MD button)
				injectRoute({
					pattern: "/api/get-markdown",
					entrypoint: new URL("./routes/get-markdown.ts", import.meta.url).pathname,
					prerender: false,
				});

				// Fire the seed-bootstrap on every request (short-circuits after
				// first call). Routed through middleware so the seed applies
				// even when the user is stuck at emdash's setup wizard.
				// `order: "pre"` so it runs BEFORE emdash's auth middleware,
				// which short-circuits pre-setup requests with a redirect.
				addMiddleware({
					entrypoint: new URL("./middleware.ts", import.meta.url).pathname,
					order: "pre",
				});

				// Provide config via virtual module + make sure Astro's `.astro`
				// plugin processes the files we ship (Vite SSR externalizes
				// `node_modules` by default, which skips the .astro transform).
				const cloudflare = config.adapter?.name === "@astrojs/cloudflare";

				updateConfig({
					vite: {
						ssr: {
							noExternal: ["star-lite-docs"],
						},
						plugins: [
							// On Cloudflare, pre-bundle CJS deps that star-lite
							// pulls in transitively via noExternal inline evaluation.
							// expressive-code bundles parse-numeric-range which uses
							// module.exports — crashes in workerd without pre-bundling.
							...(cloudflare ? [{
								name: "star-lite-docs-cf-deps",
								configEnvironment(envName: string) {
									if (!["astro", "ssr", "prerender"].includes(envName)) return;
									return {
										optimizeDeps: {
											include: [
												"astro-expressive-code",
												"astro-expressive-code/components",
												"rehype-expressive-code",
												"rehype-expressive-code/hast",
												"emdash/runtime",
												"emdash",
												"emdash/ui",
												"emdash/client",
											],
											exclude: [
												"virtual:emdash",
												"virtual:star-lite-docs",
												"virtual:astro-expressive-code",
											],
										},
									};
								},
							}] : []),
							{
								name: "star-lite-docs-virtual",
								resolveId(id: string) {
									if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
									if (id === VIRTUAL_DATA_ID) return RESOLVED_VIRTUAL_DATA_ID;
								},
								load(id: string) {
									if (id === RESOLVED_VIRTUAL_MODULE_ID) {
										return `export const sidebar = ${sidebarJson};\nexport const siteTitle = ${JSON.stringify(siteTitle)};`;
									}
									if (id === RESOLVED_VIRTUAL_DATA_ID) {
										const seedPath = new URL("./seed.ts", import.meta.url).pathname;
										return `
import { getDb as _getDb } from "emdash/runtime";
import { getSiteSettings as _getSiteSettings, getMenu as _getMenu, applySeed as _applySeed } from "emdash";
import { defaultSeed } from "${seedPath}";

export const getDb = _getDb;
export const getSiteSettings = _getSiteSettings;

let _ensured = false;
let _ensuring = null;
export async function ensurePagesCollection(db) {
  if (_ensured) return;
  if (_ensuring) return _ensuring;
  _ensuring = (async () => {
    try {
      let seed = { ...defaultSeed };
      try {
        const { userSeed } = await import("virtual:emdash/seed");
        if (userSeed) {
          if (userSeed.content) seed.content = userSeed.content;
          if (userSeed.menus) seed.menus = userSeed.menus;
        }
      } catch {}
      const collectionSeed = { ...seed, menus: undefined };
      const r = await _applySeed(db, collectionSeed, { includeContent: true });
      let menusCreated = 0;
      if (defaultSeed.menus) {
        for (const menu of defaultSeed.menus) {
          const existing = await db
            .selectFrom("_emdash_menus").select("id")
            .where("name", "=", menu.name).executeTakeFirst();
          if (!existing) {
            await _applySeed(db, { ...defaultSeed, collections: undefined, menus: [menu] });
            menusCreated++;
          }
        }
      }
      const created = (r.collections?.created ?? 0) + (r.fields?.created ?? 0) + menusCreated;
      if (created > 0) console.log("[star-lite-docs] applied default seed:", {
        collections: r.collections?.created ?? 0, fields: r.fields?.created ?? 0, menus: menusCreated,
      });
      _ensured = true;
    } catch (err) {
      console.error("[star-lite-docs] bootstrap seed failed:", err);
    } finally { _ensuring = null; }
  })();
  return _ensuring;
}

export async function loadSidebarFromMenu(name = "docs-sidebar") {
  try {
    const menu = await _getMenu(name);
    if (!menu || !menu.items?.length) return [];
    const groups = [];
    const loose = [];
    for (const item of menu.items) {
      if (item.children && item.children.length > 0) {
        groups.push({ label: item.label, items: item.children.map(function toEntry(c) {
          return c.children?.length > 0
            ? { label: c.label, items: c.children.map(toEntry) }
            : { label: c.label, link: c.url };
        })});
      } else {
        loose.push({ label: item.label, link: item.url });
      }
    }
    if (loose.length > 0) groups.unshift({ label: menu.label || "Docs", items: loose });
    return groups;
  } catch (err) {
    console.error("[star-lite-docs] failed to load sidebar menu:", err);
    return [];
  }
}
`;
									}
								},
								transform(code: string, id: string) {
									if (!id.includes("emdash/block-components")) return;
									const componentsEntry = new URL("./blocks/index.ts", import.meta.url).pathname;
									return code + `\nimport { blockComponents as _slBlocks } from "${componentsEntry}";\nObject.assign(pluginBlockComponents, _slBlocks);`;
								},
							},
						],
					},
				});
			},
		},
	};
}
