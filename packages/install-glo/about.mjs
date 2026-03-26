#!/usr/bin/env node

import chalk from "chalk";

const o = chalk.hex("#FF8C00");
const g = chalk.hex("#4AF626");
const d = chalk.dim;
const w = chalk.white;

console.log(`
${o.bold("  ┌─────────────────────────────────────────────────────┐")}
${o.bold("  │")}${o.bold("             T H E   G L O   L O O P    ")}${o.bold("│")}
${o.bold("  │")}${d("   Web Vitals Optimization Engine            ")}${o.bold("│")}
${o.bold("  └─────────────────────────────────────────────────────┘")}

${w.bold("  What is it?")}

  A metrics-centric optimization loop for web performance.
  ${d("Runs Lighthouse, uses AI to diagnose issues, suggests")}
  ${d("surgical fixes, re-measures. Repeat until your target is met.")}

${w.bold("  The Loop")}

  ${g("G")}${w("ather")}   ${d("→ Run Lighthouse, extract web vitals")}
  ${g("L")}${w("everage")} ${d("→ AI reads your source code + diagnostics")}
  ${g("O")}${w("perate")}  ${d("→ Apply fix, re-measure, repeat")}

${w.bold("  Supported Vitals")}

  ${g("LCP")}   ${d("Largest Contentful Paint    (good: <2500ms)")}
  ${g("FCP")}   ${d("First Contentful Paint      (good: <1800ms)")}
  ${g("CLS")}   ${d("Cumulative Layout Shift     (good: <0.1)")}
  ${g("TBT")}   ${d("Total Blocking Time         (good: <200ms)")}
  ${g("SI")}    ${d("Speed Index                 (good: <3400ms)")}
  ${g("TTFB")}  ${d("Time to First Byte          (good: <800ms)")}

${w.bold("  Usage")}

  ${w("npm run glo-loop")}
  ${d("Interactive — asks for URL, target vital, and max loops.")}

  ${d("Requires an AI provider key:")}
  ${g("export ANTHROPIC_API_KEY=sk-ant-...")}  ${d("(recommended)")}
  ${g("export OPENAI_API_KEY=sk-...")}

  ${d("Also requires Chrome (for Lighthouse).")}

${w.bold("  Requirements")}

  ${d("Chrome/Chromium installed (Lighthouse uses it)")}
  ${d("Dev server running on the target URL")}
  ${d("ANTHROPIC_API_KEY or OPENAI_API_KEY set")}

${w.bold("  Built With")}

  ${d("Vercel AI SDK")} ${w("(npm i ai)")} ${d("+ Lighthouse + your source code.")}

${w.bold("  About the Creator")}

  ${o("Gonzalo \"Glo\" Maldonado")}
  ${w("CTO / VP Eng / Technical Co-Founder")}
  ${d("20+ years, 5 exits (Yammer → Microsoft $1.2B, Nextdoor IPO)")}
  ${d("AI Infrastructure, Distributed Systems, Engineering Leadership")}

  ${o("Book a call:")}  ${w.underline("intro.co/GonzaloMaldonado")}
  ${o("Website:")}      ${w.underline("sanscourier.ai")}
`);
