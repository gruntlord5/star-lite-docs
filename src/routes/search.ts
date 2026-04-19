/**
 * Public search API route — injected by the star-lite-docs integration.
 * Queries ec_pages directly, no auth required.
 */
import type { APIRoute } from "astro";
import { getDb, ensurePagesCollection } from "virtual:star-lite-docs/data";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim();
	if (!q || q.length < 2) {
		return new Response(JSON.stringify({ results: [] }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	const db = await getDb();
	await ensurePagesCollection(db);
	const like = `%${q}%`;

	const rows = await db
		.selectFrom("ec_pages")
		.select(["id", "slug", "title", "content"])
		.where("deleted_at", "is", null)
		.where("status", "=", "published")
		.where((eb: any) =>
			eb.or([
				eb("title", "like", like),
				eb("content", "like", like),
			])
		)
		.limit(10)
		.execute();

	const results = rows.map((row: any) => {
		let snippet = "";
		try {
			const blocks = JSON.parse(String(row.content || "[]"));
			for (const block of blocks) {
				if (block._type === "block" && block.children) {
					const text = block.children.map((c: any) => c.text || "").join("");
					if (text.toLowerCase().includes(q.toLowerCase())) {
						const idx = text.toLowerCase().indexOf(q.toLowerCase());
						const start = Math.max(0, idx - 40);
						const end = Math.min(text.length, idx + q.length + 40);
						snippet =
							(start > 0 ? "..." : "") +
							text.slice(start, idx) +
							"<mark>" + text.slice(idx, idx + q.length) + "</mark>" +
							text.slice(idx + q.length, end) +
							(end < text.length ? "..." : "");
						break;
					}
				}
			}
		} catch {}

		return {
			slug: String(row.slug),
			title: String(row.title),
			snippet,
		};
	});

	return new Response(JSON.stringify({ results }), {
		headers: { "Content-Type": "application/json" },
	});
};
