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
function normalizeImageUrl(url: string): string {
	url = url.trim();
	const assetsIdx = url.indexOf("assets/");
	if (url.startsWith("../") && assetsIdx !== -1) url = "/" + url.slice(assetsIdx);
	return url;
}

export function preprocessImages(ptBlocks: any[]): void {
	for (let i = 0; i < ptBlocks.length; i++) {
		const b = ptBlocks[i];

		// Emdash native image blocks → docs.image with URL normalization
		if (b._type === "image" && b.asset) {
			let url = b.asset.url || `/_emdash/api/media/file/${b.asset._ref}`;
			url = normalizeImageUrl(url);
			ptBlocks[i] = { _type: "docs.image", _key: b._key || `img-${i}`, src: url, alt: b.alt || "" };
			continue;
		}

		if (b._type !== "block" || !b.children?.length) continue;
		const text = b.children.map((c: any) => c.text || "").join("").trim();

		// Case 1: raw markdown image syntax preserved as text
		const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
		if (imgMatch) {
			const alt = imgMatch[1].replace(/`/g, "");
			const url = normalizeImageUrl(imgMatch[2]);
			ptBlocks[i] = { _type: "docs.image", _key: `img-${i}`, src: url, alt };
			continue;
		}

		// Case 2: emdash parsed "![alt](url)" as "!" + link span
		// PT children: [{text:"!"}, {text:"alt", marks:["k1"]}]
		// markDefs: [{_key:"k1", _type:"link", href:"url"}]
		if (text === "!" || (text.startsWith("!") && text.length > 1 && b.markDefs?.length)) {
			const children: any[] = b.children;
			const bangIdx = children.findIndex((c: any) => (c.text || "").includes("!"));
			if (bangIdx === -1) continue;
			const bangText = (children[bangIdx].text || "").trim();
			if (bangText !== "!") continue;
			const linked = children.find((c: any, idx: number) =>
				idx > bangIdx && c.marks?.length && c.text
			);
			if (!linked) continue;
			const linkDef = (b.markDefs || []).find((d: any) =>
				d._type === "link" && linked.marks.includes(d._key)
			);
			if (!linkDef?.href) continue;
			const hasOtherContent = children.some((c: any, idx: number) =>
				idx !== bangIdx && c !== linked && (c.text || "").trim()
			);
			if (hasOtherContent) continue;
			const alt = (linked.text || "").trim();
			const url = normalizeImageUrl(linkDef.href);
			ptBlocks[i] = { _type: "docs.image", _key: `img-${i}`, src: url, alt };
		}
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

function renderListGroup(blocks: any[]): string {
	let html = "";
	let currentLevel = 0;
	const tagStack: string[] = [];

	for (const b of blocks) {
		const level = b.level || 1;
		const tag = b.listItem === "number" ? "ol" : "ul";
		const content = (b.children || []).map((c: any) => renderSpan(c, b.markDefs)).join("");

		if (level > currentLevel) {
			for (let l = currentLevel; l < level; l++) {
				html += `<${tag}>`;
				tagStack.push(tag);
			}
		} else if (level < currentLevel) {
			for (let l = currentLevel; l > level; l--) {
				html += `</li></${tagStack.pop()}>`;
			}
			html += `</li>`;
		} else if (currentLevel > 0) {
			html += `</li>`;
		}

		html += `<li>${content}`;
		currentLevel = level;
	}

	for (let l = currentLevel; l > 0; l--) {
		html += `</li></${tagStack.pop()}>`;
	}

	return html;
}

function isPlainParagraph(b: any): boolean {
	if (b._type !== "block" || b.listItem) return false;
	if (!b.children?.length) return false;
	const style = b.style || "normal";
	if (style !== "normal" && style !== "blockquote") return false;
	const text = b.children.map((c: any) => c.text || "").join("");
	if (text.trim() === "---") return false;
	if (text.includes("|") && /\|\s*-+/.test(text)) return false;
	return true;
}

export function preprocessBlocks(ptBlocks: any[]): { blocks: any[]; headings: TocHeading[] } {
	const headings: TocHeading[] = [];

	preprocessImages(ptBlocks);

	let i = 0;
	while (i < ptBlocks.length) {
		const b = ptBlocks[i];

		// Group consecutive list items into a single HTML list block
		if (b._type === "block" && b.listItem) {
			let end = i + 1;
			while (end < ptBlocks.length && ptBlocks[end]._type === "block" && ptBlocks[end].listItem) {
				end++;
			}
			const listBlocks = ptBlocks.slice(i, end);
			const html = renderListGroup(listBlocks);
			const items = listBlocks.map((lb: any) => ({
				text: (lb.children || []).map((c: any) => c.text || "").join(""),
				level: lb.level || 1,
				type: lb.listItem === "number" ? "number" : "bullet",
				_children: lb.children,
				_markDefs: lb.markDefs || [],
			}));
			ptBlocks.splice(i, end - i, { _type: "docs.html", _key: `list-${i}`, html, _label: "List", items });
			i++;
			continue;
		}

		if (b._type !== "block" || !b.children?.length) { i++; continue; }
		const text = b.children.map((c: any) => c.text || "").join("");

		// Headings: convert to HTML with id for TOC anchors
		if (b.style?.startsWith("h")) {
			const level = parseInt(b.style.slice(1), 10);
			const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");
			headings.push({ depth: level, slug: id, text });
			const html = `<h${level} id="${id}">${(b.children || []).map((c: any) => renderSpan(c, b.markDefs)).join("")}</h${level}>`;
			ptBlocks[i] = { _type: "docs.html", _key: `heading-${i}`, html, _label: "Heading", text, level, _children: b.children, _markDefs: b.markDefs || [] };
			i++;
			continue;
		}

		// Horizontal rules
		if (text.trim() === "---") {
			ptBlocks[i] = { _type: "docs.html", _key: `hr-${i}`, html: "<hr />", _label: "Divider" };
			i++;
			continue;
		}

		// Tables
		if (text.includes("|") && /\|\s*-+/.test(text)) {
			const allLines = text.split("\n");
			const tableStart = allLines.findIndex((l: string) => l.trim().startsWith("|"));
			if (tableStart !== -1) {
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
						newBlocks.push({ _type: "docs.html", _key: `pre-${i}`, html: `<p>${preText}</p>`, _label: "Paragraph", text: preText });
					}
					newBlocks.push({ _type: "docs.html", _key: `table-${i}`, html, _label: "Table" });
					ptBlocks.splice(i, 1, ...newBlocks);
					i += newBlocks.length;
					continue;
				}
			}
		}

		// Group consecutive plain paragraphs into a single block
		if (isPlainParagraph(b)) {
			let end = i + 1;
			while (end < ptBlocks.length && isPlainParagraph(ptBlocks[end])) {
				end++;
			}
			if (end > i + 1) {
				const grouped = ptBlocks.slice(i, end);
				const html = grouped.map((bl: any) => blockToHtml(bl)).join("\n");
				const groupedText = grouped.map((bl: any) => (bl.children || []).map((c: any) => c.text || "").join("")).join("\n\n");
				const _source = grouped.map((bl: any) => ({ children: bl.children, markDefs: bl.markDefs || [], style: bl.style || "normal" }));
				ptBlocks.splice(i, end - i, { _type: "docs.html", _key: `block-${i}`, html, _label: "Paragraph", text: groupedText, _source });
				i++;
				continue;
			}
		}

		// All remaining standard blocks → docs.html so they get the block editing UI
		const label = b.style === "blockquote" ? "Blockquote" : "Paragraph";
		ptBlocks[i] = { _type: "docs.html", _key: `block-${i}`, html: blockToHtml(b), _label: label, text, _children: b.children, _markDefs: b.markDefs || [] };
		i++;
	}

	return { blocks: ptBlocks, headings };
}
