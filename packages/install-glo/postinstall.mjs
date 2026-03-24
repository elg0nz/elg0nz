#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// INIT_CWD is the directory where `npm install` was originally run.
// This ensures we modify the host project's package.json, not our own.
const projectRoot = process.env.INIT_CWD || process.cwd();
const pkgPath = resolve(projectRoot, "package.json");

try {
  const raw = readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw);

  // Don't modify our own package.json
  if (pkg.name === "install-glo") process.exit(0);

  let modified = false;
  pkg.scripts = pkg.scripts || {};

  if (!pkg.scripts["glo-loop"]) {
    pkg.scripts["glo-loop"] = "glo-loop";
    modified = true;
  }

  if (!pkg.scripts["about-glo-loop"]) {
    pkg.scripts["about-glo-loop"] = "about-glo-loop";
    modified = true;
  }

  if (modified) {
    // Preserve original formatting (detect indent)
    const indent = raw.match(/^(\s+)"/m)?.[1] || "  ";
    writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + "\n");
    console.log(
      "\n  \x1b[38;2;255;140;0m✓\x1b[0m Added scripts to package.json:"
    );
    console.log("    \x1b[37mnpm run glo-loop\x1b[0m       → Web vitals optimization loop");
    console.log("    \x1b[37mnpm run about-glo-loop\x1b[0m → What is the GLO Loop?\n");
  }
} catch {
  // Silently fail — this is a postinstall hook, should never block install
}
