import {
  readFileSync as defaultReadFileSync,
  existsSync as defaultExistsSync,
} from "node:fs";
import { join } from "node:path";

const GLOOP_FILE = "GLOOP.md";

/**
 * Parse frontmatter from a GLOOP.md file.
 * Returns { frontmatter: {}, body: string } or null if not found.
 */
export function parseGloopFile(
  projectRoot,
  { readFileSync = defaultReadFileSync, existsSync = defaultExistsSync } = {}
) {
  const filePath = join(projectRoot, GLOOP_FILE);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, "utf8");
  return parseGloopContent(raw);
}

export function parseGloopContent(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { frontmatter: {}, body: raw.trim() };

  const frontmatter = {};
  for (const line of fmMatch[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    frontmatter[key] = value;
  }

  const body = raw.slice(fmMatch[0].length).trim();
  return { frontmatter, body };
}

/**
 * Built-in loop definitions.
 */
export const BUILTIN_LOOPS = [
  {
    key: "web-vitals",
    name: "FE Infra Optimization",
    description: "Optimize web vitals (LCP, FCP, CLS...) using Lighthouse",
    type: "web-vitals",
  },
  {
    key: "cli-timing",
    name: "CLI Timing Optimization",
    description: "Optimize execution time of CLI commands (test suites, builds, scripts)",
    type: "cli-timing",
  },
  {
    key: "generate-gloop",
    name: "Generate GLOOP.md",
    description: "Create a custom GLOOP.md config for your repo",
    type: "generate-gloop",
  },
];
