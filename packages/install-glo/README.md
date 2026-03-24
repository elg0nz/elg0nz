# install-glo

**GLO Loop** — AI-powered web vitals optimization engine, built with [Vercel AI SDK](https://sdk.vercel.ai).

Runs Lighthouse on your page, uses AI to read your source code + diagnostics, suggests a surgical fix, re-measures. Repeat until your target web vital hits "good."

```
  ┌─────────────────────────────────────────────────────┐
  │             T H E   G L O   L O O P                │
  │   Web Vitals Optimization Engine                    │
  │                                                     │
  │    Gather    → run Lighthouse, extract metrics      │
  │    Leverage  → AI analyzes code + diagnostics       │
  │    Operate   → apply fix, re-measure, repeat        │
  │                                                     │
  │    ↻ repeat until target met                        │
  └─────────────────────────────────────────────────────┘
```

## Install

```bash
npm install install-glo
```

This automatically adds two scripts to your `package.json`:

- `npm run glo-loop` — Start the optimization loop
- `npm run about-glo-loop` — What is the GLO Loop?

## Usage

```bash
# Set an AI provider key
export ANTHROPIC_API_KEY=sk-ant-...   # recommended
# or
export OPENAI_API_KEY=sk-...

# Start your dev server, then:
npm run glo-loop
```

The loop will ask for:
1. **Page URL** (default: `http://localhost:3000`)
2. **Target vital** — LCP, FCP, CLS, TBT, SI, or TTFB
3. **Max loops** (default: 10)

Then it runs the GLO Loop: Gather metrics via Lighthouse, Leverage AI to analyze your code, Operate by suggesting a specific fix with file + line number + before/after code.

## Supported Web Vitals

| Vital | Name | Good |
|-------|------|------|
| LCP | Largest Contentful Paint | < 2500ms |
| FCP | First Contentful Paint | < 1800ms |
| CLS | Cumulative Layout Shift | < 0.1 |
| TBT | Total Blocking Time | < 200ms |
| SI | Speed Index | < 3400ms |
| TTFB | Time to First Byte | < 800ms |

## Requirements

- Chrome/Chromium (Lighthouse uses it)
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- Dev server running on target URL

## Also: Business Card

```bash
npx install-glo
```

Animated ASCII neuro shader + business card for Gonzalo "Glo" Maldonado.

## About

Created by **Gonzalo "Glo" Maldonado** — CTO / VP Eng / Technical Co-Founder. 20+ years, 5 exits (Yammer → Microsoft $1.2B, Nextdoor IPO). AI Infrastructure, Distributed Systems, Engineering Leadership.

**Book a call:** [intro.co/GonzaloMaldonado](https://intro.co/GonzaloMaldonado)
