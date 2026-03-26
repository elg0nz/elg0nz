import { execSync as defaultExecSync } from "node:child_process";

/**
 * Run a prompt through an external CLI command.
 * The prompt is passed via stdin to avoid shell escaping issues.
 */
export function runWithCLI(
  command,
  prompt,
  { execSync = defaultExecSync } = {}
) {
  const result = execSync(command, {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return result.trim();
}
