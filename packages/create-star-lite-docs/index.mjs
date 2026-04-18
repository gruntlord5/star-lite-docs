#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cpSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { createInterface } from "node:readline";

const GREEN = "\x1b[0;32m";
const BLUE = "\x1b[0;34m";
const YELLOW = "\x1b[1;33m";
const CYAN = "\x1b[0;36m";
const NC = "\x1b[0m";

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, (a) => r(a)));

  console.log("");
  console.log(`${BLUE}╔══════════════════════════════════════════════╗${NC}`);
  console.log(`${BLUE}║  ${GREEN}Star-Lite Docs ${CYAN}Interactive Setup${BLUE}            ║${NC}`);
  console.log(`${BLUE}╚══════════════════════════════════════════════╝${NC}`);
  console.log("");
  console.log(`${CYAN}This will:${NC}`);
  console.log(`  ${CYAN}•${NC} Configure your documentation site`);
  console.log(`  ${CYAN}•${NC} Install dependencies`);
  console.log(`  ${CYAN}•${NC} Optionally start the dev server or Docker`);
  console.log("");

  // Step 1: Configuration
  console.log(`${BLUE}[1/3]${NC} ${GREEN}Configuration${NC}`);
  console.log("");

  let dest = process.argv[2];
  if (!dest) dest = await ask(`${CYAN}  Project directory: ${NC}`);
  if (!dest.trim()) { console.error("No directory specified"); process.exit(1); }

  const title = await ask(`${CYAN}  Site title [My Docs]: ${NC}`) || "My Docs";

  let mode = "";
  while (mode !== "1" && mode !== "2") {
    mode = await ask(`${CYAN}  Deployment target ${NC}(1) Local development  (2) Docker: `);
  }

  rl.close();

  const abs = resolve(dest);
  if (existsSync(abs)) {
    console.error(`\n  Error: ${dest} already exists`);
    process.exit(1);
  }

  console.log("");
  console.log(`${YELLOW}  Configuration summary:${NC}`);
  console.log(`    Directory:    ${GREEN}${dest}${NC}`);
  console.log(`    Title:        ${GREEN}${title}${NC}`);
  console.log(`    Target:       ${GREEN}${mode === "1" ? "Local development" : "Docker"}${NC}`);
  console.log("");

  // Step 2: Scaffold & Install
  console.log(`${BLUE}[2/3]${NC} ${GREEN}Scaffolding project...${NC}`);
  console.log("");

  const tmp = join(tmpdir(), "star-lite-docs-" + Date.now());
  execSync(`git clone --depth 1 https://github.com/gruntlord5/star-lite-docs.git "${tmp}"`, { stdio: "ignore" });
  cpSync(join(tmp, "starter"), abs, { recursive: true });

  const readme = readFileSync(join(tmp, "README.md"), "utf-8");
  rmSync(tmp, { recursive: true, force: true });

  const configPath = join(abs, "astro.config.mjs");
  const config = readFileSync(configPath, "utf-8");
  writeFileSync(configPath, config.replace('title: "My Docs"', `title: "${title}"`));

  // Update package.json name and docker scripts with project name
  const projectName = dest.split("/").pop().replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const pkgPath = join(abs, "package.json");
  let pkg = readFileSync(pkgPath, "utf-8");
  pkg = pkg.replace(/"name": "my-docs"/g, `"name": "${projectName}"`);
  pkg = pkg.replaceAll("my-docs", projectName);
  writeFileSync(pkgPath, pkg);

  const blocks = markdownToBlocks(readme);
  const seed = {
    version: "1",
    meta: { name: "star-lite-starter", description: "Starter content for a Star-Lite Docs site." },
    menus: [{ name: "docs-sidebar", label: "Docs sidebar", items: [
      { type: "custom", label: "Getting Started", url: "/getting-started" },
    ]}],
    content: { pages: [
      {
        id: "welcome", slug: "index", status: "published",
        data: { title: "Welcome", content: [{
          _type: "docs.hero", _key: "welcome-hero",
          tagline: "A drop-in Starlight-style docs theme for EmDash CMS.",
          imageSrc: "/houston.webp", imageAlt: "Houston, Starlight's mascot",
          actionsJson: JSON.stringify([
            { text: "View Example Page", link: "/getting-started", icon: "right-arrow", variant: "primary" },
            { text: "Edit the sidebar", link: "/_emdash/admin/menus/docs-sidebar", variant: "secondary" },
          ]),
        }]},
      },
      {
        id: "getting-started", slug: "getting-started", status: "published",
        data: { title: "Getting Started", content: blocks },
      },
    ]},
  };

  const seedDir = join(abs, ".emdash");
  mkdirSync(seedDir, { recursive: true });
  writeFileSync(join(seedDir, "seed.json"), JSON.stringify(seed, null, 2));

  console.log(`${GREEN}  ✓ Project scaffolded${NC}`);
  console.log("");

  console.log(`${CYAN}  Installing dependencies...${NC}`);
  console.log("");
  execSync("bun install", { cwd: abs, stdio: "inherit" });
  console.log("");
  console.log(`${GREEN}  ✓ Dependencies installed${NC}`);
  console.log("");

  // Step 3: Start
  console.log(`${BLUE}[3/3]${NC} ${GREEN}Ready to launch${NC}`);
  console.log("");

  const rl2 = createInterface({ input: process.stdin, output: process.stdout });
  const startNow = await new Promise((r) => rl2.question(`${CYAN}  Start now? [Y/n]: ${NC}`, r));
  rl2.close();

  if (startNow.toLowerCase() === "n" || startNow.toLowerCase() === "no") {
    console.log("");
    console.log(`${GREEN}╔══════════════════════════════════════════════╗${NC}`);
    console.log(`${GREEN}║  ${BLUE}Setup complete!${GREEN}                              ║${NC}`);
    console.log(`${GREEN}╚══════════════════════════════════════════════╝${NC}`);
    console.log("");
    console.log(`${CYAN}  To start:${NC}`);
    console.log(`    cd ${dest}`);
    console.log(mode === "1" ? "    npm run dev" : "    npm run docker");
    console.log("");
  } else {
    if (mode === "1") {
      console.log("");
      console.log(`${CYAN}  Starting dev server...${NC}`);
      console.log("");
      execSync("npm run dev", { cwd: abs, stdio: "inherit" });
    } else {
      console.log("");
      console.log(`${CYAN}  Building and starting Docker container...${NC}`);
      console.log("");
      execSync("npm run docker", { cwd: abs, stdio: "inherit" });
    }
  }
}

function markdownToBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  let keyIdx = 0;
  const key = () => `k${keyIdx++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ _type: "code", _key: key(), language: lang || "text", code: codeLines.join("\n") });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const children = parseInline(headingMatch[2], key);
      blocks.push({ _type: "block", _key: key(), style: `h${level}`, markDefs: children._markDefs || [], children });
      i++;
      continue;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      const children = parseInline(quoteLines.join(" "), key);
      blocks.push({ _type: "block", _key: key(), style: "blockquote", markDefs: children._markDefs || [], children });
      continue;
    }

    if (line.match(/^\s*[-*]\s/)) {
      while (i < lines.length && lines[i].match(/^\s*[-*]\s/)) {
        const text = lines[i].replace(/^\s*[-*]\s+/, "");
        const children = parseInline(text, key);
        blocks.push({ _type: "block", _key: key(), style: "normal", listItem: "bullet", level: 1, markDefs: children._markDefs || [], children });
        i++;
      }
      continue;
    }

    if (line.match(/^\s*\d+\.\s/)) {
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s/)) {
        const text = lines[i].replace(/^\s*\d+\.\s+/, "");
        const children = parseInline(text, key);
        blocks.push({ _type: "block", _key: key(), style: "normal", listItem: "number", level: 1, markDefs: children._markDefs || [], children });
        i++;
      }
      continue;
    }

    if (line.includes("|") && lines[i + 1]?.match(/^\s*\|[\s-|]+\|\s*$/)) {
      while (i < lines.length && lines[i].includes("|")) i++;
      continue;
    }

    if (!line.trim()) { i++; continue; }

    const children = parseInline(line, key);
    blocks.push({ _type: "block", _key: key(), style: "normal", markDefs: children._markDefs || [], children });
    i++;
  }

  for (const block of blocks) {
    if (block.children) delete block.children._markDefs;
  }

  return blocks;
}

function parseInline(text, key) {
  const spans = [];
  const markDefs = [];
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      spans.push({ _type: "span", _key: key(), text: text.slice(lastIdx, match.index), marks: [] });
    }
    if (match[2]) {
      spans.push({ _type: "span", _key: key(), text: match[2], marks: ["strong"] });
    } else if (match[4]) {
      spans.push({ _type: "span", _key: key(), text: match[4], marks: ["code"] });
    } else if (match[6]) {
      const linkKey = key();
      markDefs.push({ _key: linkKey, _type: "link", href: match[7] });
      spans.push({ _type: "span", _key: key(), text: match[6], marks: [linkKey] });
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    spans.push({ _type: "span", _key: key(), text: text.slice(lastIdx), marks: [] });
  }

  if (spans.length === 0) {
    spans.push({ _type: "span", _key: key(), text, marks: [] });
  }

  spans._markDefs = markDefs;
  return spans;
}

main().catch((e) => { console.error(e.message); process.exit(1); });
