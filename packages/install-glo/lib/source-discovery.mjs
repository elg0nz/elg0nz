import {
  readFileSync as defaultReadFileSync,
  existsSync as defaultExistsSync,
} from "node:fs";
import { join, relative } from "node:path";

const MAX_FILE_SIZE = 15_000;
const MAX_IMPORT_SIZE = 8_000;

function pageCandidates(routePath) {
  return [
    // Next.js App Router
    join("app", routePath, "page.tsx"),
    join("app", routePath, "page.jsx"),
    join("app", routePath, "page.js"),
    join("app", routePath, "layout.tsx"),
    join("app", routePath, "layout.jsx"),
    join("app", "layout.tsx"),
    join("app", "layout.jsx"),
    // src/app
    join("src", "app", routePath, "page.tsx"),
    join("src", "app", routePath, "layout.tsx"),
    join("src", "app", "layout.tsx"),
    // Next.js Pages Router
    join("pages", routePath + ".tsx"),
    join("pages", routePath + ".jsx"),
    join("pages", routePath, "index.tsx"),
    join("pages", routePath, "index.jsx"),
    // Config files relevant to performance
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    "vite.config.ts",
    "vite.config.js",
  ];
}

function truncate(content, limit) {
  return content.length > limit
    ? content.slice(0, limit) + "\n// ... truncated"
    : content;
}

function safeRead(fullPath, limit, { readFileSync, existsSync }) {
  if (!existsSync(fullPath)) return null;
  try {
    const content = readFileSync(fullPath, "utf8");
    return truncate(content, limit);
  } catch {
    return null;
  }
}

function resolveImports(pageFile, projectRoot, files, { readFileSync, existsSync }) {
  const importRegex = /from\s+["']([./][^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(pageFile.content)) !== null) {
    const importPath = match[1];
    const possiblePaths = [
      importPath + ".tsx",
      importPath + ".jsx",
      importPath + ".ts",
      importPath + ".js",
      join(importPath, "index.tsx"),
    ];
    for (const p of possiblePaths) {
      const resolved = join(
        projectRoot,
        pageFile.path.replace(/[^/]+$/, ""),
        p
      );
      if (existsSync(resolved)) {
        const content = safeRead(resolved, MAX_IMPORT_SIZE, { readFileSync, existsSync });
        if (content !== null) {
          const relPath = relative(projectRoot, resolved);
          if (!files.find((f) => f.path === relPath)) {
            files.push({ path: relPath, content });
          }
        }
        break;
      }
    }
  }
}

export function discoverPageFiles(
  projectRoot,
  route,
  { readFileSync = defaultReadFileSync, existsSync = defaultExistsSync } = {}
) {
  const routePath = route === "/" ? "" : route.replace(/^\//, "");
  const files = [];
  const deps = { readFileSync, existsSync };

  const seen = new Set();
  for (const rel of pageCandidates(routePath)) {
    if (seen.has(rel)) continue;
    seen.add(rel);
    const full = join(projectRoot, rel);
    const content = safeRead(full, MAX_FILE_SIZE, deps);
    if (content !== null) {
      files.push({ path: rel, content });
    }
  }

  if (files.length > 0) {
    resolveImports(files[0], projectRoot, files, deps);
  }

  return files;
}
