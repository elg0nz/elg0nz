import { streamText as defaultStreamText } from "ai";
import chalk from "chalk";
import { runWithCLI as defaultRunWithCLI } from "./ai-backend.mjs";

function buildCliPrompt(command, metrics, sourceFiles, loopNumber, previousSuggestions, metric) {
  const sourceContext = sourceFiles
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  const prevContext =
    previousSuggestions.length > 0
      ? `\n\nPrevious suggestions already applied:\n${previousSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDo NOT repeat these. Find the NEXT optimization.`
      : "";

  const metricLabel = metric === "execution_time" ? "execution time" : metric;

  return `You are a performance engineer optimizing the ${metricLabel} of a CLI command.

## Command
\`${command}\`

## Current Metrics (Loop ${loopNumber})
Execution time: ${metrics.execution_time.display}
Exit code: ${metrics.exit_code.value}

## Target
Reduce ${metricLabel} as much as possible.

## Source Files
${sourceContext || "No source files provided."}
${prevContext}

## Instructions

Respond in EXACTLY this format (no markdown fences):

DIAGNOSIS: One sentence explaining what is causing slow ${metricLabel}.

FILE: path/to/file.ext
LINE: approximate line number (or "new" if adding to config)

BEFORE:
<exact code to replace, or "N/A" if adding new code>

AFTER:
<optimized code>

WHY: One sentence on expected impact with estimated improvement.

Keep the fix SURGICAL — one change per loop. Prefer high-impact, low-risk changes:
- Eliminating redundant work (duplicate computations, unnecessary I/O)
- Parallelizing independent operations
- Caching expensive computations
- Reducing unnecessary test setup/teardown
- Optimizing data structures and algorithms
- Lazy loading and deferred initialization
- Reducing file system operations`;
}

export async function analyzeCliWithAI(
  backend,
  command,
  metrics,
  sourceFiles,
  loopNumber,
  previousSuggestions,
  metric = "execution_time",
  { streamText = defaultStreamText, runWithCLI = defaultRunWithCLI } = {}
) {
  const prompt = buildCliPrompt(
    command,
    metrics,
    sourceFiles,
    loopNumber,
    previousSuggestions,
    metric
  );

  if (backend.type === "cli") {
    return runWithCLI(backend.command, prompt);
  }

  const result = streamText({ model: backend.model, prompt });
  let text = "";
  for await (const chunk of result.textStream) {
    process.stdout.write(chalk.dim(chunk));
    text += chunk;
  }
  process.stdout.write("\n");
  return text;
}

export { buildCliPrompt };
