/**
 * Bootstrap — lazily apply the plugin's seed on first use.
 *
 * Collections are seeded via `applySeed` (idempotent with onConflict: "skip").
 *
 * Menus are handled separately because emdash's `applySeed` destructively
 * wipes and re-creates menu items even when the menu already exists. We
 * seed the menu + its default items only when the menu row is absent.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applySeed } from "emdash";
import { defaultSeed } from "./seed";

let ensured = false;
let ensuring: Promise<void> | null = null;

export async function ensurePagesCollection(db: any): Promise<void> {
	if (ensured) return;
	if (ensuring) return ensuring;
	ensuring = (async () => {
		try {
			// Merge user seed (.emdash/seed.json) with default seed if it exists.
			// Default seed provides collections/fields; user seed can override content and menus.
			const userSeedPath = resolve(process.cwd(), ".emdash", "seed.json");
			let seed = { ...defaultSeed };
			try {
				if (existsSync(userSeedPath)) {
					const userSeed = JSON.parse(readFileSync(userSeedPath, "utf-8"));
					if (userSeed.content) seed.content = userSeed.content;
					if (userSeed.menus) seed.menus = userSeed.menus;
				}
			} catch {}
			const collectionSeed = { ...seed, menus: undefined };
			const r = await applySeed(db, collectionSeed, { includeContent: true });

			// Seed each menu only if it doesn't exist yet.
			let menusCreated = 0;
			if (defaultSeed.menus) {
				for (const menu of defaultSeed.menus) {
					const existing = await db
						.selectFrom("_emdash_menus")
						.select("id")
						.where("name", "=", menu.name)
						.executeTakeFirst();
					if (!existing) {
						await applySeed(db, {
							...defaultSeed,
							collections: undefined,
							menus: [menu],
						});
						menusCreated++;
					}
				}
			}

			const created =
				(r.collections?.created ?? 0) +
				(r.fields?.created ?? 0) +
				menusCreated;
			if (created > 0) {
				console.log("[star-lite-docs] applied default seed:", {
					collections: r.collections?.created ?? 0,
					fields: r.fields?.created ?? 0,
					menus: menusCreated,
				});
			}
			ensured = true;
		} catch (err) {
			console.error("[star-lite-docs] bootstrap seed failed:", err);
		} finally {
			ensuring = null;
		}
	})();
	return ensuring;
}
