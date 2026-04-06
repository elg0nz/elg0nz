#!/usr/bin/env node

import React, { useEffect } from "react";
import { render, Box, Text, useApp } from "ink";

const h = React.createElement;

const o = { color: "#FF8C00" };
const ob = { color: "#FF8C00", bold: true };
const g = { color: "#4AF626" };
const d = { dimColor: true };
const w = { color: "white" };
const wb = { color: "white", bold: true };

function AboutApp() {
  const { exit } = useApp();

  useEffect(() => {
    const t = setTimeout(() => exit(), 100);
    return () => clearTimeout(t);
  }, []);

  return h(
    Box,
    { flexDirection: "column" },
    h(Text, null, ""),
    h(Text, ob, "  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
    h(Text, null, h(Text, ob, "  \u2502"), h(Text, ob, "             T H E   G L O   L O O P    "), h(Text, ob, "\u2502")),
    h(Text, null, h(Text, ob, "  \u2502"), h(Text, d, "   Web Vitals Optimization Engine            "), h(Text, ob, "\u2502")),
    h(Text, ob, "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"),
    h(Text, null, ""),
    h(Text, wb, "  What is it?"),
    h(Text, null, ""),
    h(Text, null, "  A metrics-centric optimization loop for web performance."),
    h(Text, d, "  Runs Lighthouse, uses AI to diagnose issues, suggests"),
    h(Text, d, "  surgical fixes, re-measures. Repeat until your target is met."),
    h(Text, null, ""),
    h(Text, wb, "  The Loop"),
    h(Text, null, ""),
    h(Text, null, h(Text, g, "  G"), h(Text, w, "ather"), h(Text, d, "   \u2192 Run Lighthouse, extract web vitals")),
    h(Text, null, h(Text, g, "  L"), h(Text, w, "everage"), h(Text, d, " \u2192 AI reads your source code + diagnostics")),
    h(Text, null, h(Text, g, "  O"), h(Text, w, "perate"), h(Text, d, "  \u2192 Apply fix, re-measure, repeat")),
    h(Text, null, ""),
    h(Text, wb, "  Supported Vitals"),
    h(Text, null, ""),
    h(Text, null, h(Text, g, "  LCP"), h(Text, d, "   Largest Contentful Paint    (good: <2500ms)")),
    h(Text, null, h(Text, g, "  FCP"), h(Text, d, "   First Contentful Paint      (good: <1800ms)")),
    h(Text, null, h(Text, g, "  CLS"), h(Text, d, "   Cumulative Layout Shift     (good: <0.1)")),
    h(Text, null, h(Text, g, "  TBT"), h(Text, d, "   Total Blocking Time         (good: <200ms)")),
    h(Text, null, h(Text, g, "  SI"), h(Text, d, "    Speed Index                 (good: <3400ms)")),
    h(Text, null, h(Text, g, "  TTFB"), h(Text, d, "  Time to First Byte          (good: <800ms)")),
    h(Text, null, ""),
    h(Text, wb, "  Usage"),
    h(Text, null, ""),
    h(Text, w, "  npm run glo-loop"),
    h(Text, d, "  Interactive \u2014 asks for URL, target vital, and max loops."),
    h(Text, null, ""),
    h(Text, d, "  Requires an AI provider key:"),
    h(Text, null, h(Text, g, "  export ANTHROPIC_API_KEY=sk-ant-..."), h(Text, d, "  (recommended)")),
    h(Text, g, "  export OPENAI_API_KEY=sk-..."),
    h(Text, null, ""),
    h(Text, d, "  Also requires Chrome (for Lighthouse)."),
    h(Text, null, ""),
    h(Text, wb, "  Requirements"),
    h(Text, null, ""),
    h(Text, d, "  Chrome/Chromium installed (Lighthouse uses it)"),
    h(Text, d, "  Dev server running on the target URL"),
    h(Text, d, "  ANTHROPIC_API_KEY or OPENAI_API_KEY set"),
    h(Text, null, ""),
    h(Text, wb, "  Built With"),
    h(Text, null, ""),
    h(Text, null, h(Text, d, "  Vercel AI SDK"), h(Text, w, " (npm i ai)"), h(Text, d, " + Lighthouse + your source code.")),
    h(Text, null, ""),
    h(Text, wb, "  About the Creator"),
    h(Text, null, ""),
    h(Text, o, "  Gonzalo \"Glo\" Maldonado"),
    h(Text, w, "  CTO / VP Eng / Technical Co-Founder"),
    h(Text, d, "  20+ years, 5 exits (Yammer \u2192 Microsoft $1.2B, Nextdoor IPO)"),
    h(Text, d, "  AI Infrastructure, Distributed Systems, Engineering Leadership"),
    h(Text, null, ""),
    h(Text, null, h(Text, o, "  Book a call:"), h(Text, null, "  "), h(Text, { color: "white", underline: true }, "intro.co/GonzaloMaldonado")),
    h(Text, null, h(Text, o, "  Website:"), h(Text, null, "      "), h(Text, { color: "white", underline: true }, "sanscourier.ai")),
    h(Text, null, "")
  );
}

render(h(AboutApp));
