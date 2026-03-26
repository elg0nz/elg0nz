import { spawn as defaultSpawn } from "node:child_process";
import chalk from "chalk";

/**
 * Run a prompt through an external CLI command.
 * Streams output to the terminal so the user sees the AI thinking.
 * The prompt is passed via stdin to avoid shell escaping issues.
 */
export function runWithCLI(
  command,
  prompt,
  { spawn = defaultSpawn } = {}
) {
  return new Promise((resolve, reject) => {
    const proc = spawn("sh", ["-c", command], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";

    proc.stdout.on("data", (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(chalk.dim(str));
    });

    proc.stderr.on("data", (data) => {
      process.stderr.write(chalk.dim(data.toString()));
    });

    proc.stdin.write(prompt);
    proc.stdin.end();

    proc.on("close", (code) => {
      process.stdout.write("\n");
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(`CLI command exited with code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });

    proc.on("error", reject);
  });
}
