/**
 * GET /api/get-markdown?slug=<slug>
 *
 * Returns the current page content as markdown. Custom block types round-trip
 * as opaque `<!--ec:block ... -->` fences via emdash's `portableTextToMarkdown`,
 * so nothing is lost when the user copies + re-pastes.
 *
 * Public — no auth gate. Same visibility as the rendered page itself.
 */
import type { APIRoute } from "astro";
import { getDb } from "virtual:star-lite-docs/data";
import { portableTextToMarkdown } from "emdash/client";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const slug = url.searchParams.get("slug");
	if (!slug) return new Response("Missing slug parameter", { status: 400 });

	const db = await getDb();
	const row = await db
		.selectFrom("ec_pages")
		.select(["content"])
		.where("slug", "=", slug)
		.where("deleted_at", "is", null)
		.where("status", "=", "published")
		.executeTakeFirst();

	if (!row) return new Response("Page not found", { status: 404 });

	let blocks: any[] = [];
	try { blocks = JSON.parse(String(row.content || "[]")); } catch {}

	return new Response(portableTextToMarkdown(blocks), {
		status: 200,
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
