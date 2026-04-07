import { spawn as defaultSpawn } from "node:child_process";

/**
 * Run a command and measure its execution time.
 * If onChunk is provided, streams output to the callback.
 */
export function runTimed(command, { spawn = defaultSpawn, onChunk } = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn("sh", ["-c", command], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";

    proc.stdout.on("data", (data) => {
      const str = data.toString();
      output += str;
      if (onChunk) onChunk(str);
    });

    proc.stderr.on("data", (data) => {
      const str = data.toString();
      output += str;
      if (onChunk) onChunk(str);
    });

    proc.on("close", (code) => {
      const realMs = Date.now() - start;
      resolve({ realMs, output: output.trim(), exitCode: code || 0 });
    });
  });
}

/**
 * Extract timing metrics from a timed run.
 */
export function extractTimingMetrics(timedResult, metric = "execution_time") {
  return {
    execution_time: {
      value: timedResult.realMs,
      display: formatMs(timedResult.realMs),
    },
    exit_code: {
      value: timedResult.exitCode,
      display: String(timedResult.exitCode),
    },
  };
}

function formatMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(1);
  return `${mins}m ${secs}s`;
}
