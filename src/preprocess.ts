/**
 * Pre-process Portable Text blocks for docs rendering.
 *
 * Converts markdown-in-PT patterns to proper block types:
 * - Headings get id attributes for TOC anchors
 * - `---` becomes `<hr>`
 * - `![alt](url)` becomes image blocks
 * - Markdown tables become HTML tables
 */

export interface TocHeading {
	depth: number;
	slug: string;
	text: string;
}

/**
 * Convert standalone markdown image blocks (`![alt](url)`) into editable
 * `docs.image` blocks. Runs in both view and edit modes — images don't benefit
 * from markdown editing, and we want them to render (and expose an Edit button)
 * in the WYSIWYG.
 */
export function preprocessImages(ptBlocks: any[]): void {
	for (let i = 0; i < ptBlocks.length; i++) {
		const b = ptBlocks[i];
		if (b._type !== "block" || !b.children?.length) continue;
		const text = b.children.map((c: any) => c.text || "").join("").trim();
		const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
		if (!imgMatch) continue;
		const alt = imgMatch[1].replace(/`/g, "");
		let url = imgMatch[2].trim();
		// Normalize relative paths like ../../../assets/... (from pre-migration MDX)
		// to absolute public paths.
		const assetsIdx = url.indexOf("assets/");
		if (url.startsWith("../") && assetsIdx !== -1) url = "/" + url.slice(assetsIdx);
		ptBlocks[i] = { _type: "docs.image", _key: `img-${i}`, src: url, alt };
	}
}

function renderSpan(child: any, markDefs: any[] = []): string {
	let text = (child.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	if (!text) return "";
	const marks: string[] = child.marks || [];
	for (const mark of marks) {
		if (mark === "strong") { text = `<strong>${text}</strong>`; continue; }
		if (mark === "em") { text = `<em>${text}</em>`; continue; }
		if (mark === "code") { text = `<code>${text}</code>`; continue; }
		if (mark === "underline") { text = `<u>${text}</u>`; continue; }
		if (mark === "strikethrough") { text = `<s>${text}</s>`; continue; }
		const def = markDefs.find((d: any) => d._key === mark);
		if (def?._type === "link") { text = `<a href="${def.href || ""}">${text}</a>`; }
	}
	return text;
}

function blockToHtml(b: any): string {
	const children = (b.children || []).map((c: any) => renderSpan(c, b.markDefs)).join("");
	const style = b.style || "normal";
	if (style === "normal") return `<p>${children}</p>`;
	if (style === "blockquote") return `<blockquote><p>${children}</p></blockquote>`;
	if (style.match(/^h[1-6]$/)) return `<${style}>${children}</${style}>`;
	return `<p>${children}</p>`;
}

export function preprocessBlocks(ptBlocks: any[]): { blocks: any[]; headings: TocHeading[] } {
	const headings: TocHeading[] = [];

	preprocessImages(ptBlocks);

	for (let i = 0; i < ptBlocks.length; i++) {
		const b = ptBlocks[i];
		if (b._type !== "block" || !b.children?.length) continue;
		const text = b.children.map((c: any) => c.text || "").join("");

		// Headings: convert to HTML with id for TOC anchors
		if (b.style?.startsWith("h")) {
			const level = parseInt(b.style.slice(1), 10);
			const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");
			headings.push({ depth: level, slug: id, text });
			const html = `<h${level} id="${id}">${(b.children || []).map((c: any) => renderSpan(c, b.markDefs)).join("")}</h${level}>`;
			ptBlocks[i] = { _type: "docs.html", _key: `heading-${i}`, html };
			continue;
		}

		// Horizontal rules
		if (text.trim() === "---") {
			ptBlocks[i] = { _type: "docs.html", _key: `hr-${i}`, html: "<hr />" };
			continue;
		}

		// Tables
		if (text.includes("|") && /\|\s*-+/.test(text)) {
			const allLines = text.split("\n");
			const tableStart = allLines.findIndex((l: string) => l.trim().startsWith("|"));
			if (tableStart === -1) continue;
			const preText = allLines.slice(0, tableStart).join("\n").trim();
			const tableLines = allLines.slice(tableStart).filter((l: string) => l.trim());
			if (tableLines.length >= 2 && tableLines[1].match(/^\s*\|[\s-|]+\|\s*$/)) {
				const parseRow = (line: string) => line.split("|").slice(1, -1).map((c: string) => c.trim());
				const headers = parseRow(tableLines[0]);
				const rows = tableLines.slice(2).map(parseRow);
				let html = '<table><thead><tr>' + headers.map((h: string) => `<th>${h}</th>`).join("") + '</tr></thead><tbody>';
				for (const row of rows) {
					html += '<tr>' + row.map((c: string) => `<td>${c}</td>`).join("") + '</tr>';
				}
				html += '</tbody></table>';
				const newBlocks: any[] = [];
				if (preText) {
					newBlocks.push({ _type: "docs.html", _key: `pre-${i}`, html: `<p>${preText}</p>` });
				}
				newBlocks.push({ _type: "docs.html", _key: `table-${i}`, html });
				ptBlocks.splice(i, 1, ...newBlocks);
				i += newBlocks.length - 1;
				continue;
			}
		}

		// All remaining standard blocks → docs.html so they get the block editing UI
		ptBlocks[i] = { _type: "docs.html", _key: `block-${i}`, html: blockToHtml(b) };
	}

	return { blocks: ptBlocks, headings };
}
