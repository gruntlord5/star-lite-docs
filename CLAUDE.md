# CLAUDE.md

`star-lite-docs` — a drop-in Starlight-style documentation theme for [EmDash CMS](https://github.com/emdash-cms/emdash). One Astro integration + one emdash plugin descriptor in a single npm package. Extracted and evolved from the in-tree `src/plugins/docs-theme/` of the [`buylist-docs-node`](../buylist-docs-node) project; **the two have diverged** and this repo is now the canonical version going forward.

## Status

- **Published** on [npm](https://www.npmjs.com/package/star-lite-docs) (`star-lite-docs@0.1.2`) and [GitHub](https://github.com/gruntlord5/star-lite-docs).
- **`create-star-lite-docs`** CLI is published on npm (`0.2.0`). It clones the starter from GitHub at runtime (`git clone --depth 1`), so pushing to `main` is enough to update what users get — no npm republish needed for starter changes.
- **Test bed** at `/tmp/my-docs/` (when present) — scaffolded via `bun create star-lite-docs`.

## Layout

```
star-lite-docs/
├── package.json          # type: module, exports the integration + helpers
├── tsconfig.json
├── README.md             # public-facing install/usage docs
├── LICENSE               # MIT
├── starter/              # Node/Docker scaffold (cloned by create-star-lite-docs)
│   ├── package.json      # deps (star-lite-docs from npm)
│   ├── astro.config.mjs  # pre-wired with starLiteDocs() + starLiteBlocks()
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── .gitignore
│   ├── README.md
│   └── src/pages/.gitkeep
├── starter-cloudflare/   # Cloudflare Workers scaffold (D1 + R2)
│   ├── package.json
│   ├── astro.config.mjs  # starLiteDocs() + starLiteBlocks() + d1/r2 adapters
│   ├── wrangler.jsonc
│   ├── tsconfig.json
│   ├── .gitignore
│   └── README.md
└── src/
    ├── index.ts          # public exports (TS-only — no .astro re-exports!)
    ├── integration.ts    # starLiteDocs() Astro integration
    ├── emdash-plugin.ts  # starLiteBlocks() emdash PluginDescriptor
    ├── middleware.ts     # pre-order middleware that runs ensurePagesCollection on every request
    ├── bootstrap.ts      # idempotent applySeed() of defaultSeed
    ├── seed.ts           # defaultSeed: pages collection + docs-sidebar menu
    ├── menu-loader.ts    # loadSidebarFromMenu() — emdash menu → SidebarConfig
    ├── preprocess.ts     # PT preprocessing (headings/HR/tables, image normalization)
    ├── types.ts          # SidebarConfig, SidebarEntry, buildSidebar(), markCurrent()
    ├── virtual.d.ts      # types for virtual:star-lite-docs/config
    ├── DocsLayout.astro  # full themed shell
    ├── HeaderActions.astro  # Copy-MD + Edit-as-MD buttons (plain HTML, no Polaris/etc)
    ├── Sidebar.astro
    ├── Search.astro      # Ctrl+K modal hitting /api/search
    ├── ThemeSelect.astro
    ├── Icon.astro
    ├── Icons.ts          # Starlight's icon set, copied verbatim
    ├── CodeBlock.astro
    ├── file-tree-icons.ts
    ├── night-owl-dark.jsonc / night-owl-light.jsonc
    ├── routes/
    │   ├── page.astro       # catch-all /[...slug] — empty-state splash, markdown editor mode, /pages/X redirects
    │   ├── search.ts        # public search API
    │   ├── drop-fts.ts      # drops FTS indexes before save (prevents corruption)
    │   └── get-markdown.ts  # public PT→MD endpoint (powers Copy-MD, published pages only)
    ├── blocks/
    │   ├── index.ts         # blockComponents map (emdash registers these)
    │   ├── entry.ts         # admin field schemas (emdash plugin entry)
    │   ├── inline-markdown.ts
    │   └── Docs*.astro      # all 14 block components
    ├── style/
    │   ├── props.css        # CSS custom props (sl-* tokens)
    │   ├── reset.css
    │   ├── markdown.css
    │   ├── asides.css
    │   └── util.css         # sl-flex, sl-hidden, etc.
    └── assets/
        ├── houston.webp     # Starlight's Houston, MIT — used on empty splash
        └── NOTICE.md        # attribution
```

## API surface

```ts
import {
  starLiteDocs,        // Astro integration factory
  starLiteBlocks,      // emdash PluginDescriptor
  preprocessBlocks,    // PT normalizer (headings → TOC, tables → HTML, images → docs.image)
  preprocessImages,    // image-only subset (always-on)
  loadSidebarFromMenu, // resolve emdash menu → SidebarConfig[]
  ensurePagesCollection, // idempotent applySeed wrapper
  defaultSeed,         // SeedFile shipped by the plugin
  buildSidebar, markCurrent,
} from "star-lite-docs";

import type { StarLiteDocsOptions, SidebarConfig, SidebarEntry, SidebarLink, SidebarGroup, StarLiteDocsConfig } from "star-lite-docs";

// `default starLiteDocs` so `astro add star-lite-docs` can locate the integration.
```

`starLiteDocs(options)`:
- `title?: string` — fallback site title; emdash's live `getSiteSettings().title` overrides at request time.
- `sidebar?: SidebarConfig[]` — static sidebar; omit to read from `docs-sidebar` emdash menu.
- `expressiveCode?: AstroExpressiveCodeOptions | false` — opt out of bundled Expressive Code, or pass options.

## Block types (all `star-lite.*` namespace)

`docs.hero`, `docs.image`, `docs.html`, `code` (Expressive Code), `star-lite.tabs`, `star-lite.card`, `star-lite.cardGrid`, `star-lite.linkCard`, `star-lite.aside`, `star-lite.badge`, `star-lite.fileTree`, `star-lite.icon`, `star-lite.linkButton`, `star-lite.steps`.

Buylist-docs-node still uses `buylist.*` in its in-tree fork — content from there won't render here without a `_type` rename.

## Critical invariants

### `src/index.ts` must NOT export `.astro` files
`astro.config.mjs` is loaded by Node, which can't parse `.astro`. If `index.ts` re-exports a `.astro` file, the consumer's config crashes at load with "invalid JS syntax". Pure TS only at the top level. `.astro` components live at subpath imports (`star-lite-docs/layout` etc.).

### Vite SSR `noExternal`
`integration.ts` adds `vite.ssr.noExternal: ["star-lite-docs"]` so Astro's `.astro` plugin processes the files we ship from `node_modules`. Without it, Vite externalizes the package and `.astro` files are passed through to Rollup as raw JS — same crash.

### `astro:config:setup` integration injection
We auto-register `astro-expressive-code` Starlight-style: scan `config.integrations` for `name === "astro-expressive-code"`, splice ours in right after `star-lite-docs` if absent. Skipped entirely if `expressiveCode: false`. See `integration.ts`.

### Middleware ordering
`middleware.ts` is registered with `order: "pre"` so it runs **before** emdash's auth middleware (which redirects unauth requests to `/setup` — if we ran `post`, our bootstrap would never fire on a fresh install). The bootstrap is wrapped in try/catch and gates on a module-level `ensured` flag that resets to false on failure → on a cold boot, the FIRST request fails ("no such table: _emdash_collections") because emdash hasn't migrated yet, and the SECOND request succeeds. Logged as "bootstrap seed failed" then "applied default seed: { menus: 1 }" — the noisy first error is benign.

### Bootstrap is non-destructive
`applySeed()` is called with the default `onConflict: "skip"`, so any pre-existing collection / menu (e.g. emdash's auto-seeded `pages` and `posts`) is left alone. Only missing pieces are added. Result: the only piece star-lite reliably *creates* on a fresh emdash install is the `docs-sidebar` menu — `pages` is usually already there.

### Site title resolution
`routes/page.astro` calls `await getSiteSettings()` on every request and uses `settings.title` if present, falling back to the build-time `starLiteDocs({ title })` option. Means the operator can rename the site in the admin without rebuilding. Mirrors the official emdash starter's `Base.astro`.

### Empty-state homepage
Catch-all returns 404 + a themed `DocsLayout` even when `ec_pages` is empty. For slug `index` specifically, it constructs a synthetic `docs.hero` block (with Houston as the image) and Calls-to-Action linking to `/_emdash/admin/content/pages/new` and `/_emdash/admin/menus/docs-sidebar`. Splash mode kicks in automatically because the first block is `docs.hero`. **Don't return a bare `Response(null, { status: 404 })`** — Astro falls through to the default 404 and the user perceives it as "the theme isn't loading".

### Friendly slug redirects
In the catch-all's not-found path, we strip `pages/`, `page/`, `posts/`, `post/` prefixes and 301-redirect if the bare slug exists. Saves users from typing the admin path as a public URL.

### Markdown editor save quirk
The Edit-as-MD save POSTs to `/_emdash/api/content/pages/:id`. **emdash returns HTTP 200 with `{ success: false, error: {...} }` on failed writes**, not a 4xx/5xx. The save handler must check `body.success === false` AND `res.ok`, otherwise the UI silently shows "Saved" and reloads to unchanged content. Already fixed; don't regress.

## Workflow

```bash
# Edit code, then push
git push

# Starter changes take effect immediately (create-star-lite-docs clones from GitHub)
# For npm package changes, bump version in package.json and:
npm publish

# Test locally:
bun create star-lite-docs /tmp/my-docs
cd /tmp/my-docs
rm -rf dist data.db*         # fresh start if testing seed/migrations
bun run dev
```

## Known gotchas

- **`emdash@0.3.0` removed the `./migrations` subpath export** that buylist-docs-node's patched fork added back. Star-lite doesn't import `emdash/migrations`, so it works against unpatched 0.3.0 — but its first request on a cold DB throws "no such table" because emdash hasn't migrated yet (then succeeds on the retry). See "Middleware ordering" above.
- **`better-sqlite3` doesn't work under Bun runtime** — emdash's built-in `sqlite()` adapter uses better-sqlite3 internally. For Bun, consumers need to use libsql (`emdash/db/libsql`) or ship a `bun:sqlite` dialect. Buylist-docs-node ships its own; star-lite is db-adapter agnostic.
- **`bun add` then `bun remove`** in the test dir sometimes wipes `dependencies` in `package.json` to a near-empty state. Just re-scaffold from `starter/` if it happens.

## Next steps (TODO)

- None at this time — GitHub, npm, and `create-star-lite-docs` CLI are all live.
