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

export function starLiteDocs(options: StarLiteDocsOptions = {}): AstroIntegration {
	const siteTitle = options.title || "Documentation";
	// `null` sentinel means "no static sidebar — load from emdash menu at runtime".
	const sidebarJson = options.sidebar ? JSON.stringify(options.sidebar) : "null";

	return {
		name: "star-lite-docs",
		hooks: {
			"astro:config:setup"({ injectRoute, addMiddleware, updateConfig, config }) {
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
				updateConfig({
					vite: {
						ssr: {
							noExternal: ["star-lite-docs"],
						},
						plugins: [
							{
								name: "star-lite-docs-virtual",
								resolveId(id: string) {
									if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
								},
								load(id: string) {
									if (id === RESOLVED_VIRTUAL_MODULE_ID) {
										return `export const sidebar = ${sidebarJson};\nexport const siteTitle = ${JSON.stringify(siteTitle)};`;
									}
								},
							},
						],
					},
				});
			},
		},
	};
}
