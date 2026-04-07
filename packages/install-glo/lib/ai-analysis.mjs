import { streamText as defaultStreamText } from "ai";
import { runWithCLI as defaultRunWithCLI } from "./ai-backend.mjs";
import { VITALS } from "./vitals.mjs";

function buildPrompt(targetVital, metrics, diagnostics, sourceFiles, loopNumber, previousSuggestions) {
  const vitalInfo = VITALS[targetVital];

  const sourceContext = sourceFiles
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  const diagText = diagnostics
    .slice(0, 10)
    .map(
      (d) =>
        `- ${d.title}${d.displayValue ? ` (${d.displayValue})` : ""} [score: ${d.score}]`
    )
    .join("\n");

  const metricsText = Object.entries(metrics)
    .filter(([k]) => k !== "performanceScore")
    .map(([k, v]) => {
      const info = VITALS[k];
      if (!info) return null;
      const val = info.unit === "ms" ? `${Math.round(v.value)}ms` : v.value?.toFixed(3);
      const status = v.value <= info.good ? "PASS" : "FAIL";
      return `  ${k}: ${val} (good: <${info.good}${info.unit}) [${status}]`;
    })
    .filter(Boolean)
    .join("\n");

  const prevContext =
    previousSuggestions.length > 0
      ? `\n\nPrevious suggestions already applied:\n${previousSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDo NOT repeat these. Find the NEXT optimization.`
      : "";

  const currentVal = metrics[targetVital]?.value !== undefined
    ? (vitalInfo.unit === "ms" ? Math.round(metrics[targetVital].value) + "ms" : metrics[targetVital].value.toFixed(3))
    : "unknown";

  return `You are a frontend infrastructure engineer optimizing web performance.

## Current Metrics (Loop ${loopNumber})
Performance Score: ${metrics.performanceScore}/100
${metricsText}

## Target
Optimize ${targetVital} (${vitalInfo.name}): currently ${currentVal}, target: <${vitalInfo.good}${vitalInfo.unit}

## Lighthouse Diagnostics (sorted by severity)
${diagText || "No failing diagnostics."}

## Source Files
${sourceContext || "No source files found for this route."}
${prevContext}

## Instructions

Respond in EXACTLY this format (no markdown fences):

DIAGNOSIS: One sentence explaining what is causing the ${targetVital} issue.

FILE: path/to/file.ext
LINE: approximate line number (or "new" if adding to config)

BEFORE:
<exact code to replace, or "N/A" if adding new code>

AFTER:
<optimized code>

WHY: One sentence on expected impact with estimated improvement in ${vitalInfo.unit || "score"}.

Keep the fix SURGICAL — one change per loop. Prefer high-impact, low-risk changes:
- Image optimization (priority, sizes, lazy/eager, format)
- Font loading (display: swap, preload, subset)
- Bundle optimization (dynamic imports, tree shaking)
- Render-blocking resources (async, defer, preload)
- Layout shift prevention (explicit dimensions, aspect-ratio)
- Server response (caching, compression, CDN)
- Component-level code splitting`;
}

export async function analyzeWithAI(
  backend,
  targetVital,
  metrics,
  diagnostics,
  sourceFiles,
  loopNumber,
  previousSuggestions,
  { streamText = defaultStreamText, runWithCLI = defaultRunWithCLI, onChunk } = {}
) {
  const prompt = buildPrompt(
    targetVital,
    metrics,
    diagnostics,
    sourceFiles,
    loopNumber,
    previousSuggestions
  );

  if (backend.type === "cli") {
    return runWithCLI(backend.command, prompt, { onChunk });
  }

  const result = streamText({ model: backend.model, prompt });
  let text = "";
  for await (const chunk of result.textStream) {
    if (onChunk) onChunk(chunk);
    text += chunk;
  }
  return text;
}

// Exported for testing
export { buildPrompt };
