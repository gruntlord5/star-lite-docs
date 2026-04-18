#!/usr/bin/env bun
/**
 * Non-interactive test of create-star-lite-docs scaffolding.
 * Usage: bun test-create.ts <local|docker|cloudflare> [--deploy] [dest] [title]
 */
import { execSync } from "node:child_process";
import { cpSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const deploy = args.includes("--deploy");
const positional = args.filter(a => !a.startsWith("--"));
const mode = positional[0] || "cloudflare";
const dest = resolve(positional[1] || "/tmp/my-docs");
const title = positional[2] || "Test Docs";

if (!["local", "docker", "cloudflare"].includes(mode)) {
  console.error("Usage: bun test-create.ts <local|docker|cloudflare> [--deploy] [dest] [title]");
  process.exit(1);
}

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });

const projectName = dest.split("/").pop()!.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

// Clone from GitHub — same as the real CLI
console.log("==> Cloning from GitHub...");
const tmp = join(tmpdir(), "star-lite-docs-" + Date.now());
execSync(`git clone --depth 1 https://github.com/gruntlord5/star-lite-docs.git "${tmp}"`, { stdio: "pipe" });

const starterDir = mode === "cloudflare" ? "starter-cloudflare" : "starter";
console.log(`==> Copying ${starterDir}...`);
cpSync(join(tmp, starterDir), dest, { recursive: true });
rmSync(tmp, { recursive: true, force: true });

// Update title
const configPath = join(dest, "astro.config.mjs");
writeFileSync(configPath, readFileSync(configPath, "utf-8").replace('title: "My Docs"', `title: "${title}"`));

// Update package name
const pkgPath = join(dest, "package.json");
let pkg = readFileSync(pkgPath, "utf-8");
pkg = pkg.replace(/"name": "my-docs"/g, `"name": "${projectName}"`);
pkg = pkg.replaceAll("my-docs", projectName);
writeFileSync(pkgPath, pkg);

// Update wrangler
const wranglerPath = join(dest, "wrangler.jsonc");
if (existsSync(wranglerPath)) {
  writeFileSync(wranglerPath, readFileSync(wranglerPath, "utf-8").replaceAll("my-docs", projectName));
}

console.log("==> Installing dependencies...");
execSync("bun install", { cwd: dest, stdio: "inherit" });

console.log("\n==> Building...");
execSync("bunx astro build", { cwd: dest, stdio: "inherit" });

if (deploy && mode === "cloudflare") {
  console.log("\n==> Setting up Cloudflare resources...");

  // Create or find D1
  let dbId: string;
  try {
    const d1Output = execSync(`bunx wrangler d1 create ${projectName}`, { cwd: dest, encoding: "utf-8" });
    const dbIdMatch = d1Output.match(/"database_id":\s*"([^"]+)"/);
    if (!dbIdMatch) { console.error("Failed to parse D1 database_id"); process.exit(1); }
    dbId = dbIdMatch[1];
    console.log(`  D1 created: ${dbId}`);
  } catch {
    console.log(`  D1 ${projectName} already exists, looking up ID...`);
    const listOutput = execSync(`bunx wrangler d1 list`, { cwd: dest, encoding: "utf-8" });
    const idMatch = listOutput.match(new RegExp(`([0-9a-f-]{36})\\s*│\\s*${projectName}\\s`));
    if (!idMatch) { console.error("Failed to find existing D1 database"); process.exit(1); }
    dbId = idMatch[1];
    console.log(`  D1 found: ${dbId}`);
  }

  // Update wrangler.jsonc with real database_id
  const wrangler = readFileSync(join(dest, "wrangler.jsonc"), "utf-8");
  writeFileSync(join(dest, "wrangler.jsonc"), wrangler.replace('"database_id": "local"', `"database_id": "${dbId}"`));

  // Create R2 (ignore if already exists)
  try {
    execSync(`bunx wrangler r2 bucket create ${projectName}-media`, { cwd: dest, stdio: "inherit" });
  } catch { console.log(`  R2 bucket ${projectName}-media already exists, continuing...`); }

  // Delete stale KV namespace if it exists
  try {
    const kvList = execSync(`bunx wrangler kv namespace list`, { cwd: dest, encoding: "utf-8" });
    const kvMatch = kvList.match(new RegExp(`"id":\\s*"([^"]+)"[^}]*"title":\\s*"${projectName}-session"`));
    if (kvMatch) {
      console.log(`  Deleting stale KV namespace ${kvMatch[1]}...`);
      execSync(`bunx wrangler kv namespace delete --namespace-id ${kvMatch[1]}`, { cwd: dest, stdio: "pipe" });
    }
  } catch {}

  // Rebuild with real database_id in wrangler config
  console.log("\n==> Rebuilding with deploy config...");
  execSync("bunx astro build", { cwd: dest, stdio: "inherit" });

  // Deploy
  console.log("\n==> Deploying...");
  execSync("bunx wrangler deploy", { cwd: dest, stdio: "inherit" });

  // Run emdash setup (migrations + seed + admin user) via the setup API
  const workerUrl = `https://${projectName}.buylisthydrogen.workers.dev`;
  console.log("\n==> Running emdash setup (migrations + admin user)...");
  const setupRes = execSync(`curl -s -w "\\n%{http_code}" -X POST ${workerUrl}/_emdash/api/setup -H "Content-Type: application/json" -H "X-EmDash-Request: 1" -d '{"email":"admin@test.local","password":"admin1234","title":"${title}"}'`, { encoding: "utf-8", timeout: 30000 });
  const setupLines = setupRes.trim().split("\n");
  const setupStatus = setupLines[setupLines.length - 1];
  console.log(`  Setup response: HTTP ${setupStatus}`);

  // Apply template seed content via wrangler D1 SQL file
  const seedPath = join(dest, ".emdash", "seed.json");
  if (existsSync(seedPath)) {
    console.log("\n==> Applying seed content to D1...");
    const seed = JSON.parse(readFileSync(seedPath, "utf-8"));
    const statements: string[] = [];

    for (const page of seed.content?.pages || []) {
      const slug = page.slug;
      const titleVal = page.data.title.replace(/'/g, "''");
      const content = JSON.stringify(page.data.content).replace(/'/g, "''");
      statements.push(`INSERT INTO ec_pages (id, slug, locale, title, content, status, created_at, updated_at) VALUES ('${slug}', '${slug}', 'en', '${titleVal}', '${content}', 'published', datetime('now'), datetime('now')) ON CONFLICT(slug, locale) DO UPDATE SET title='${titleVal}', content='${content}';`);
    }

    for (const item of seed.menus?.[0]?.items || []) {
      const label = (item.label || "").replace(/'/g, "''");
      const url = (item.url || "").replace(/'/g, "''");
      statements.push(`UPDATE _emdash_menu_items SET label='${label}', custom_url='${url}' WHERE custom_url='/';`);
    }

    const sqlFile = join(dest, ".emdash", "seed.sql");
    writeFileSync(sqlFile, statements.join("\n"));
    execSync(`bunx wrangler d1 execute ${projectName} --remote --file ${sqlFile}`, { cwd: dest, stdio: "inherit" });
    console.log("  Seed applied.");
  }

  console.log(`\n==> Deployed at ${workerUrl}`);
} else if (deploy && mode === "docker") {
  console.log("\n==> Starting Docker...");
  execSync("npm run docker", { cwd: dest, stdio: "inherit" });
} else if (deploy && mode === "local") {
  console.log("\n==> Starting dev server...");
  execSync("npm run dev", { cwd: dest, stdio: "inherit" });
} else {
  console.log(`\n==> Done! Built at ${dest}`);
  if (mode === "cloudflare") {
    console.log(`\nTo deploy: bun test-create.ts cloudflare --deploy ${dest} "${title}"`);
  } else if (mode === "docker") {
    console.log(`\nTo run: cd ${dest} && npm run docker`);
  } else {
    console.log(`\nTo run: cd ${dest} && bun run dev`);
  }
}
