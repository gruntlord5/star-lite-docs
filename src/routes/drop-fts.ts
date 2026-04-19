import type { APIRoute } from "astro";
import { getDb } from "virtual:star-lite-docs/data";
import { sql } from "kysely";

export const prerender = false;

export const POST: APIRoute = async () => {
	try {
		const db = await getDb();
		await sql`DROP TRIGGER IF EXISTS _emdash_fts_pages_insert`.execute(db);
		await sql`DROP TRIGGER IF EXISTS _emdash_fts_pages_update`.execute(db);
		await sql`DROP TRIGGER IF EXISTS _emdash_fts_pages_delete`.execute(db);
		await sql`DROP TABLE IF EXISTS _emdash_fts_pages`.execute(db);
		return new Response("ok");
	} catch (e) {
		console.error("[star-lite-docs] drop-fts failed:", e);
		return new Response(String(e), { status: 500 });
	}
};
