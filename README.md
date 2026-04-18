# Star-Lite Docs

A drop-in documentation theme that brings the power of [Starlight](https://github.com/withastro/starlight) documentation to [EmDash CMS](https://github.com/emdash-cms/emdash) to allow for a fully featured frontend editing experience for documentation instead of using static MDX files on disk.

## Features

**Layout & theming**

- Starlight-style layout and theme with collapsible sidebar, and table of contents
- Ctrl+K search bar and modal using `/api/search`
- Dark / light / auto theme toggle
- Expressive Code syntax highlighting with bundled Night Owl themes

**Content management**

- Drop-in emdash plugin — one integration, no schema or plugin setup
- Zero-config self-seeding — first request creates the `pages` collection, `docs-sidebar` menu, and a welcome page with Houston
- Menu-driven sidebar — edit navigation from the emdash admin, no need to rebuild for any changes you make while retaining full control over the menu
- 14 rich Portable Text block types from Starlight: hero, tabs, cards, asides, steps, badges, file trees, icons, link buttons, code, images, and raw HTML

**Editing**

- **Visual inline editing** — toggle Edit in the emdash toolbar, click any text to edit in place, then hit Save in the toolbar. That's it, your changes are live and ready to view.
- **Block edit forms** — hover any block in edit mode to reveal an Edit button and open an inline property editor for all the block fields, no need to take a trip to the admin page.
- **Markdown editor** — click "Edit as MD" in the header to switch to a full-page markdown textarea with a save button. All content and blocks work with markdown so you can edit existing content and blocks as well as add new ones using the same markdown workflow you are used to in Starlight. Click save and see the markdown rendered immediately on the page.
- **Copy Page MD** — one-click clipboard copy of any page as markdown using the header button

## Quickstart

Install [Bun](https://bun.sh) if you don't have it, it's used to scaffold the starter template and is also a great package manager that makes the entire process significantly faster.

```bash
curl -fsSL https://bun.sh/install | bash
```

Then create your project:

```bash
bun create star-lite-docs
```

Open `http://localhost:4321/_emdash/admin` to create your admin user, then visit `/` to see the themed welcome page.

> Bun is only required for the quickstart scaffolding step above. If you're adding Star-Lite to an existing site, you can use npm or any other package manager — see [Add to an existing emdash site](#add-to-an-existing-emdash-site).

## Add to an existing emdash site

```bash
bunx astro add star-lite-docs
```

This installs the package and wires `starLiteDocs()` into your `astro.config.mjs`. Block components, the Houston welcome page image, and route conflict warnings are all handled automatically at build time.

## Visual editing

Star-Lite adds three editing modes on top of emdash, all implemented as a plugin with no emdash patches.

### Inline editing

1. Toggle **Edit** in the emdash toolbar (bottom of the page)
2. Click any text — headings, paragraphs, hero taglines, card titles, badge text, etc.
3. Edit directly in the page
4. A **Save** button appears in the toolbar — click to persist and reload

Inline editing works on any element with a `data-sl-edit` attribute. Star-Lite tags all its block components with this attribute, and standard Portable Text blocks are preprocessed into `docs.html` blocks that support it too.

### Block edit form

With Edit mode on, hover any block to see a dashed blue outline and an **Edit** button in the top-right corner. Clicking it opens an inline form showing all the block's properties (tagline, image src, action URLs, etc.). Save persists the changes and reloads.

### Markdown editor

Click **Edit as MD** in the header (visible when Edit mode is on). This switches to a full-page markdown textarea. Custom blocks appear as `<!--ec:block …-->` fences and round-trip safely. Click Save to persist, or Cancel to return to the rendered view.

## Configuration

```ts
starLiteDocs({
  // Site title — shown in the header and <title>.
  // Overridden at runtime by emdash's Settings > Site > Title if set.
  title: "My Docs",

  // Static sidebar config. Omit to use the `docs-sidebar` emdash menu
  // (editable from the admin UI, no rebuild needed).
  sidebar: [
    {
      label: "Guide",
      items: [
        { label: "Getting Started", link: "/getting-started" },
        { label: "Installation", link: "/install" },
      ],
    },
  ],

  // Expressive Code options, or `false` to disable it entirely.
  expressiveCode: { /* AstroExpressiveCodeOptions */ },
});
```

## Block types

| Block | Description |
| --- | --- |
| `docs.hero` | Splash hero with title, tagline, image, and action buttons |
| `docs.image` | Standalone image with editable src and alt |
| `docs.html` | Raw HTML passthrough (also used for preprocessed text blocks) |
| `code` | Expressive Code syntax-highlighted block |
| `star-lite.tabs` | Tabbed content panels |
| `star-lite.card` | Content card with optional icon and color |
| `star-lite.cardGrid` | Grid layout for cards |
| `star-lite.linkCard` | Navigation card with title, description, and link |
| `star-lite.aside` | Callout box — note, tip, caution, or danger |
| `star-lite.badge` | Inline status badge |
| `star-lite.fileTree` | File and directory tree |
| `star-lite.icon` | Inline icon from the Starlight icon set |
| `star-lite.linkButton` | Styled link rendered as a pill button |
| `star-lite.steps` | Numbered step-by-step instructions |

## API

```ts
import {
  starLiteDocs,        // Astro integration (blocks auto-registered at build)
  starLiteBlocks,      // emdash plugin descriptor (only needed for advanced setups)
  preprocessBlocks,    // PT normalizer (headings, tables, images, text → docs.html)
  preprocessImages,    // image-only subset
  loadSidebarFromMenu, // resolve emdash menu → SidebarConfig[]
  ensurePagesCollection, // idempotent seed bootstrap
  defaultSeed,         // the SeedFile shipped by the plugin
  buildSidebar,        // build sidebar tree from flat config
  markCurrent,         // mark the active sidebar item by slug
} from "star-lite-docs";

import type {
  StarLiteDocsOptions,
  StarLiteDocsConfig,
  SidebarConfig,
  SidebarEntry,
  SidebarLink,
  SidebarGroup,
} from "star-lite-docs";
```

Astro components are available at subpath imports:

```ts
import DocsLayout from "star-lite-docs/layout";
```

## How it works

- Content is stored as Portable Text in the `ec_pages` table — the database is the source of truth.
- The `/[...slug]` catch-all route looks up a published page by slug, preprocesses blocks (images, headings with TOC anchors, tables, and standard text blocks are all converted to `docs.html`), and renders via emdash's `PortableText` with Star-Lite's block components.
- On first boot, the middleware runs `applySeed` to create the `pages` collection, `docs-sidebar` menu, and a welcome page. This is idempotent — existing data is never overwritten.
- The toolbar Save button is injected client-side via a `DOMContentLoaded` handler that watches the emdash toolbar's status area with a `MutationObserver`.
- A hidden `<meta data-emdash-ref>` element provides the toolbar with entry context (collection, id, status) without triggering click-to-admin redirects.

## License

MIT
