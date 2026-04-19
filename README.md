# Star-Lite Docs

The [Starlight](https://starlight.astro.build/) documentation experience, powered by [EmDash CMS](https://github.com/emdash-cms/emdash). Edit docs visually in the browser - no MDX files, no Git commits, no rebuilds.

## Get Started

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gruntlord5/star-lite-docs/tree/main/starter-cloudflare)

Install [Bun](https://bun.sh) if you don't have it:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then create your project:

```bash
bun create star-lite-docs
```

The CLI scaffolds your project and offers three deployment targets: **Local**, **Docker**, or **Cloudflare Workers** (with automatic D1/R2 provisioning and deploy).

> [!TIP]
> Star-Lite also works with any existing emdash site - just run `bunx astro add star-lite-docs`. Block components, the welcome page, and route conflict warnings are all handled automatically at build time.

## Why Star-Lite?

**Starlight is great for developers.** But non-technical contributors can't edit MDX files, and every change requires a commit + rebuild. Star-Lite gives you the same Starlight layout and components, backed by a CMS with visual editing - click text on the page, edit it, hit Save.

<table>
<tr>
<td width="33%" valign="top">

### Visual Editing

Toggle Edit in the toolbar, click any text, and edit in place. A Save button appears - click it and your changes are live.

</td>
<td width="33%" valign="top">

### Block Editor

Hover any block to reveal an Edit button. Opens an inline property editor for all fields - no admin panel needed.

</td>
<td width="33%" valign="top">

### Markdown Mode

Click "Edit as MD" to switch to a full-page markdown textarea. All blocks round-trip as markdown. Same workflow as Starlight.

</td>
</tr>
</table>

## Features

- **Starlight layout** - collapsible sidebar, table of contents, Ctrl+K search, dark/light/auto theme
- **14 block types** - hero, tabs, cards, asides, steps, badges, file trees, icons, link buttons, code, images, and raw HTML
- **Zero config** - one integration, no schema setup. First request seeds the `pages` collection, sidebar menu, and welcome page
- **Menu-driven sidebar** - edit navigation from the admin UI, no rebuild needed
- **Expressive Code** - syntax highlighting with bundled Night Owl themes
- **Copy Page MD** - one-click clipboard export of any page as markdown

## Deploy

### Cloudflare Workers

The CLI handles everything - D1, R2, deploy, admin user creation, and seed content:

```bash
bun create star-lite-docs   # choose Cloudflare Workers → Start now
```

### Docker

```bash
bun create star-lite-docs   # choose Docker → Start now
```

Or manually:

```bash
docker build -t <project-name> .
docker run -d --restart unless-stopped -p 4321:4321 \
  -v <project-name>-data:/app/data \
  -v <project-name>-uploads:/app/uploads \
  <project-name>
```

### Node.js

```bash
bun create star-lite-docs   # choose Local development → Start now
```

## Configuration

```ts
starLiteDocs({
  title: "My Docs",

  // Omit for menu-driven sidebar (editable from admin UI)
  sidebar: [
    {
      label: "Guide",
      items: [
        { label: "Getting Started", link: "/getting-started" },
        { label: "Installation", link: "/install" },
      ],
    },
  ],

  // Set to `false` to disable bundled Expressive Code
  expressiveCode: { /* AstroExpressiveCodeOptions */ },
});
```

## Block Types

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
| `star-lite.aside` | Callout box - note, tip, caution, or danger |
| `star-lite.badge` | Inline status badge |
| `star-lite.fileTree` | File and directory tree |
| `star-lite.icon` | Inline icon from the Starlight icon set |
| `star-lite.linkButton` | Styled link rendered as a pill button |
| `star-lite.steps` | Numbered step-by-step instructions |

## Add to an Existing EmDash Site

```bash
bunx astro add star-lite-docs
```

This wires `starLiteDocs()` into your `astro.config.mjs`. If installing from GitHub instead of npm:

```bash
bun add github:gruntlord5/star-lite-docs
```

Then add the integration manually:

```ts
import { starLiteDocs } from "star-lite-docs";

// add to your integrations array:
starLiteDocs({ title: "My Docs" }),
```

Block components, the welcome page, and route conflict warnings are all handled automatically at build time.

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

## License

MIT
