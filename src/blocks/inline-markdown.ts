/**
 * Convert inline markdown and component tags to HTML for use in block components.
 */
export function inlineMarkdownToHtml(text: string): string {
  return text
    // <LinkCard ... /> → rendered link card HTML
    .replace(/<LinkCard\s+(.*?)\s*\/>/g, (_match, attrs) => {
      const props = parseAttrs(attrs);
      const target = props.target ? ` target="${props.target}"` : '';
      return `<div class="sl-link-card" style="display:grid;grid-template-columns:1fr auto;gap:0.5rem;border:1px solid var(--sl-color-gray-5);border-radius:0.5rem;padding:1rem;position:relative"><span style="display:flex;flex-direction:column;gap:0.5rem"><a href="${props.href || ''}"${target} style="text-decoration:none;color:var(--sl-color-white);font-weight:600;font-size:var(--sl-text-lg)">${props.title || ''}</a>${props.description ? `<span style="color:var(--sl-color-gray-3)">${props.description}</span>` : ''}</span></div>`;
    })
    // Strip <div> wrappers and component tags (they can't render from HTML)
    .replace(/<\/?div>/g, '')
    .replace(/<\w+\s+client:load[^/]*\/>/g, '')
    // Images first (before links, since ![...] contains [...])
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Links (before bold/italic, so [**bold**](url) works)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText, url) =>
      `<a href="${url}">${inlineMarkdownToHtml(linkText)}</a>`)
    // Inline markdown
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/**
 * Convert block-level markdown content (multi-line) to HTML.
 * Handles paragraphs, bullet lists, and inline markdown within each line.
 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function blockMarkdownToHtml(text: string): string {
  const lines = text.split('\n');
  const parts: string[] = [];
  let inList = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence
    const fenceMatch = trimmed.match(/^```(\w*)/);
    if (fenceMatch) {
      if (inList) { parts.push('</ul>'); inList = false; }
      const lang = fenceMatch[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const langClass = lang ? ` class="language-${lang}"` : '';
      parts.push(`<pre${langClass}><code${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (!trimmed) {
      if (inList) { parts.push('</ul>'); inList = false; }
      i++;
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      if (!inList) { parts.push('<ul>'); inList = true; }
      parts.push(`<li>${inlineMarkdownToHtml(bulletMatch[1])}</li>`);
      i++;
      continue;
    }

    if (inList) { parts.push('</ul>'); inList = false; }
    parts.push(`<p>${inlineMarkdownToHtml(trimmed)}</p>`);
    i++;
  }

  if (inList) parts.push('</ul>');
  return parts.join('\n');
}

function parseAttrs(str: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(str)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}
