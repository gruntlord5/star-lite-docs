# My Docs

A documentation site built with [Star-Lite Docs](https://github.com/gruntlord5/star-lite-docs) on top of [EmDash CMS](https://github.com/emdash-cms/emdash).

## Develop

```bash
bun install
bun run dev
```

Then open:

- **http://localhost:4321/_emdash/admin** — run through setup to create your admin user
- **http://localhost:4321/** — themed splash until you publish a page with slug `index`

## Publish content

In the emdash admin:

1. **Pages** → New → slug `index` → add some content → Publish. Reload `/`.
2. **Menus → Docs sidebar** → add entries. The sidebar updates live, no rebuild.

## Customize

- `astro.config.mjs` — change `starLiteDocs({ title: "..." })` to set the site title.
- To opt out of the menu-driven sidebar and use a static one, pass `sidebar: [...]` to `starLiteDocs()`.
- To opt out of the bundled Expressive Code (and provide your own), pass `expressiveCode: false`.

## Deploy

This is a standard Astro SSR project with the Node adapter. `bun run build && bun run start` produces a self-contained server in `dist/` serving on `PORT` (default `4321`).

`data.db` and `uploads/` are the mutable state — persist them in your deployment (volume mount, etc.).
