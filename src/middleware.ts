/**
 * Runs once per process (the bootstrap is idempotent and flag-gated) to
 * make sure the `pages` collection + `docs-sidebar` menu exist before
 * any route handler needs them — including when the user is redirected
 * to emdash's setup wizard and never hits the star-lite catch-all route.
 */
import { defineMiddleware } from "astro:middleware";
import { getDb } from "emdash/runtime";
import { ensurePagesCollection } from "./bootstrap";

export const onRequest = defineMiddleware(async (_ctx, next) => {
	try {
		const db = await getDb();
		await ensurePagesCollection(db);
	} catch {
		// Bootstrap failures are logged inside ensurePagesCollection — don't
		// block the request chain if the DB isn't ready yet.
	}
	return next();
});
