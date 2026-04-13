/**
 * Bootstrap — lazily apply the plugin's seed on first use.
 *
 * emdash plugins can register block types, hooks, and routes, but cannot
 * declare content collections. This helper runs once per process and
 * hands the bundled seed to `applySeed()` with the default `onConflict: "skip"` —
 * so whatever emdash (or the operator) has already set up is left alone,
 * and only missing pieces (e.g. the `docs-sidebar` menu) are added.
 */
import { applySeed } from "emdash";
import { defaultSeed } from "./seed";

let ensured = false;
let ensuring: Promise<void> | null = null;

export async function ensurePagesCollection(db: any): Promise<void> {
	if (ensured) return;
	if (ensuring) return ensuring;
	ensuring = (async () => {
		try {
			const r = await applySeed(db, defaultSeed);
			const created =
				(r.collections?.created ?? 0) +
				(r.menus?.created ?? 0) +
				(r.fields?.created ?? 0);
			if (created > 0) {
				console.log("[star-lite-docs] applied default seed:", {
					collections: r.collections?.created ?? 0,
					fields: r.fields?.created ?? 0,
					menus: r.menus?.created ?? 0,
				});
			}
			ensured = true;
		} catch (err) {
			// Re-allow a future attempt — maybe the emdash core migrations
			// hadn't finished yet and `_emdash_collections` didn't exist.
			console.error("[star-lite-docs] bootstrap seed failed:", err);
		} finally {
			ensuring = null;
		}
	})();
	return ensuring;
}
