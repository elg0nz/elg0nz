# install-glo

An npm package that does two things:

```bash
npx install-glo          # → animated business card
npx install-glo ai       # → AI-powered web vitals optimizer
```

No install required. Just `npx`.

---

## `npx install-glo`

Renders an animated ASCII neuro shader (a port of a WebGL sine-noise algorithm, in Catppuccin Mocha palette), followed by a business card for **Gonzalo "Glo" Maldonado**.

## `npx install-glo ai`

Starts the **GLO Loop** — an iterative web performance optimizer built on the [Vercel AI SDK](https://sdk.vercel.ai).

It does this:

1. **Gather** — Runs Lighthouse on your URL, extracts Core Web Vitals and diagnostics
2. **Leverage** — Reads your source files (Next.js App Router, Pages Router, configs), sends metrics + code to Claude or GPT-4o via the Vercel AI SDK
3. **Operate** — AI returns one surgical fix: file path, line number, before/after code, estimated improvement
4. **Repeat** — Re-runs Lighthouse to measure the effect, loops until the target vital hits "good"

### Quick start

```bash
# 1. Set a provider key
export ANTHROPIC_API_KEY=sk-ant-...    # or OPENAI_API_KEY=sk-...

# 2. Start your dev server

# 3. Run it
npx install-glo ai
```

It will prompt for:
- **Page URL** (default: `http://localhost:3000`)
- **Target vital** — one of LCP, FCP, CLS, TBT, SI, or TTFB
- **Max loops** (default: 10)

### Supported vitals

| Vital | Full Name | "Good" Threshold |
|-------|-----------|-------------------|
| LCP | Largest Contentful Paint | < 2500ms |
| FCP | First Contentful Paint | < 1800ms |
| CLS | Cumulative Layout Shift | < 0.1 |
| TBT | Total Blocking Time | < 200ms |
| SI | Speed Index | < 3400ms |
| TTFB | Time to First Byte | < 800ms |

### Requirements

- Chrome or Chromium (Lighthouse runs headless Chrome)
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- A running dev server at the target URL

## `npx install-glo about`

Prints a formatted explainer of what the GLO Loop is and how to use it.

---

## Install as a dependency

```bash
npm install install-glo
```

The postinstall script adds two npm scripts to your project:

- `npm run glo-loop` — starts the optimization loop
- `npm run about-glo-loop` — prints the explainer

## Built with

- [Vercel AI SDK](https://sdk.vercel.ai) (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- Lighthouse (via headless Chrome)
- chalk, boxen

## About

Created by **Gonzalo "Glo" Maldonado** — CTO / VP Eng / Technical Co-Founder.
20+ years, 5 exits (Yammer → Microsoft $1.2B, Nextdoor IPO).
AI Infrastructure, Distributed Systems, Engineering Leadership.

[intro.co/GonzaloMaldonado](https://intro.co/GonzaloMaldonado) · [sanscourier.ai](https://sanscourier.ai) · [github.com/elg0nz](https://github.com/elg0nz)
