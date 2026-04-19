/**
 * EmDash plugin descriptor for Star-Lite Docs block components.
 *
 * Register this alongside the Astro integration to get
 * tabs, cards, asides, link cards, badges, steps, file trees, etc.
 *
 * Usage:
 *   import { starLiteBlocks } from 'star-lite-docs';
 *
 *   emdash({
 *     plugins: [starLiteBlocks()],
 *   })
 */

import { fileURLToPath } from "node:url";
import type { PluginDescriptor } from "emdash";

export function starLiteBlocks(): PluginDescriptor {
	return {
		id: "star-lite-blocks",
		version: "1.0.0",
		entrypoint: fileURLToPath(new URL("./blocks/entry.ts", import.meta.url)),
		componentsEntry: fileURLToPath(new URL("./blocks/index.ts", import.meta.url)),
		options: {},
	};
}
