# Star-Lite Docs

A drop-in documentation theme for [EmDash CMS](https://github.com/emdash-cms) + Astro — the Starlight look and feel, but content lives in the CMS instead of MDX files on disk.

## Features

- **Starlight-style layout** — collapsible sidebar, right-rail TOC, search modal, dark/light/auto theme toggle, mobile menu.
- **Drop-in emdash plugin** — one `starLiteDocs()` integration + one `starLiteBlocks()` registration. No sidebar config or schema setup required.
- **Lazy self-seeding** — first request auto-applies the `pages` collection and a `docs-sidebar` menu so a fresh emdash install works out of the box.
- **Menu-driven sidebar** — operators edit the sidebar from the emdash admin's Menus page, no rebuild.
- **Rich portable-text blocks** — Tabs, Cards, LinkCards, Asides, Steps, Badges, File Trees, Icons, LinkButtons, Hero, Image, plus raw HTML and Expressive Code blocks.
- **Per-block edit button** — hover a block in edit mode to open the field editor; inline-editable text on hero/tagline/action buttons.
- **Expressive Code** — Night Owl dark/light themes bundled.

## Quickstart

The fastest path is the bundled starter — a complete Astro + emdash + Star-Lite project, pre-wired and ready to run:

```bash
bunx giget github:gruntlord5/star-lite-docs/starter my-docs
cd my-docs
bun install
bun run dev
```

Open http://localhost:4321/_emdash/admin to set up your admin user, then visit `/` to see the themed splash.

The rest of this README covers adding Star-Lite to an **existing** emdash site.

## Install into an existing site

### 1. Add the integration

```bash
npx astro add star-lite-docs
```

(Until the package is published to npm, install from the GitHub repo: `bun add github:gruntlord5/star-lite-docs` and edit `astro.config.mjs` manually.)

This wires `starLiteDocs()` into your `astro.config.mjs` automatically. (Expressive Code is bundled and auto-registered — no separate install. `astro`, `emdash`, and an `@astrojs/*` adapter are peer-deps you already have in an emdash site.)

### 2. Register block components with emdash

`astro add` only edits the top-level `integrations` array. Star-Lite's block components are an emdash plugin, so you need one manual edit — add `starLiteBlocks()` to your emdash plugins list:

```js
// astro.config.mjs
import { starLiteDocs, starLiteBlocks } from "star-lite-docs";

// ...
emdash({
  database: sqlite({ url: "file:./data.db" }),
  storage: local({ directory: "./uploads" }),
  plugins: [starLiteBlocks()],   // ← add this line
}),
```

Without this step, the docs theme still renders correctly, but the emdash admin's block picker won't show Tabs, Cards, Hero, etc. when authoring pages.

### 3. Hand routes to the catch-all

Star-Lite injects a `/[...slug]` catch-all route. Astro's router prefers explicit page files, so if your project has `src/pages/index.astro`, `src/pages/[slug].astro`, or similar, those win. Delete the ones you want Star-Lite to own:

```bash
# if you started from the emdash "starter" template:
rm -f src/pages/index.astro src/pages/\[slug\].astro
rm -rf src/pages/posts src/pages/tag src/pages/category
```

### 4. Run it

```bash
npm run dev        # or: bun run dev
```

Visit `/` — you'll see a themed splash with a link to the admin. Run through the emdash setup wizard, publish a page with slug `index`, and the splash is replaced by your content. The `docs-sidebar` menu lets you edit the left-nav from the admin with no rebuild.

### Configuration

```ts
starLiteDocs({
  /** Site title shown in the header and <title>. */
  title: "My Docs",

  /**
   * Optional static sidebar. Omit to pull from the `docs-sidebar` menu
   * at request time (editable in the emdash admin UI).
   */
  sidebar: [
    {
      label: "Guide",
      items: [
        { label: "Getting Started", link: "/guide/getting-started" },
        { label: "Installation", link: "/guide/install" },
      ],
    },
  ],
});
```

## Block types

| Block                | Description                                    |
| -------------------- | ---------------------------------------------- |
| `docs.hero`          | Splash homepage hero (title, tagline, actions) |
| `docs.image`         | Standalone image (editable src/alt)            |
| `docs.html`          | Raw HTML passthrough                           |
| `star-lite.tabs`       | Tabbed content                                 |
| `star-lite.card`       | Content card with optional icon/color          |
| `star-lite.cardGrid`   | Grid of link cards                             |
| `star-lite.linkCard`   | Single navigation card                         |
| `star-lite.aside`      | note / tip / caution / danger callout          |
| `star-lite.badge`      | Inline status badge                            |
| `star-lite.fileTree`   | File and directory tree                        |
| `star-lite.icon`       | Inline icon                                    |
| `star-lite.linkButton` | Styled link as a button                        |
| `star-lite.steps`      | Numbered step-by-step instructions             |
| `code`               | Expressive Code block                          |

## Header actions

The themed header includes two buttons that operate on the current page:

- **Copy Page MD** — fetches `/api/get-markdown?slug=…` and copies the page's content as markdown to your clipboard. Custom blocks (hero, cards, tabs, …) round-trip as `<!--ec:block …-->` opaque fences. Works for anyone — no auth required.
- **Edit as MD** — toggles `?editor=markdown` on the URL. When set **and** you're authenticated, the catch-all renders a textarea editor instead of the rendered page. Save runs `markdownToPortableText` client-side and PUTs to `/_emdash/api/content/pages/:id` (emdash's own admin API handles auth/CSRF). Toggling back to **Edit Visually** drops the param and returns to the rendered view.

## How it works

- Content is stored as Portable Text in the `ec_pages` table — the DB is the source of truth.
- `/[...slug]` catch-all route looks up a published page by slug, runs a preprocessor (markdown images → docs.image blocks, headings → TOC anchors, tables → HTML), and renders via emdash's `PortableText`.
- `/api/search` returns matching pages by title/content (public, unauthenticated).
- Sidebar source: static config from `starLiteDocs()` if provided, otherwise the `docs-sidebar` emdash menu.
- Seed bootstrap is lazy (runs on first request, cached per process) so first-boot schema setup is zero-config.

## License

MIT
