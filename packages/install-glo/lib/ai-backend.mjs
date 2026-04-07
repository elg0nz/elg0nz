import { spawn as defaultSpawn } from "node:child_process";

/**
 * Run a prompt through an external CLI command.
 * If onChunk is provided, streams output to the callback.
 * The prompt is passed via stdin to avoid shell escaping issues.
 */
export function runWithCLI(
  command,
  prompt,
  { spawn = defaultSpawn, onChunk } = {}
) {
  return new Promise((resolve, reject) => {
    const proc = spawn("sh", ["-c", command], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";

    proc.stdout.on("data", (data) => {
      const str = data.toString();
      stdout += str;
      if (onChunk) onChunk(str);
    });

    proc.stderr.on("data", (data) => {
      if (onChunk) onChunk(data.toString());
    });

    proc.stdin.write(prompt);
    proc.stdin.end();

    proc.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(`CLI command exited with code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });

    proc.on("error", reject);
  });
}
