# Changelog

## 2.0.2

- Refactor glo-loop monolith (675 LOC) into 6 focused modules under `lib/`
  - `vitals.mjs` — Web Vitals constants and thresholds
  - `lighthouse.mjs` — Lighthouse runner, metric/diagnostic extraction
  - `source-discovery.mjs` — Page file and component import discovery
  - `ai-analysis.mjs` — AI prompt construction and analysis
  - `model.mjs` — Provider selection (Anthropic/OpenAI)
  - `display.mjs` — Terminal output formatting
- Add 36 unit tests using `node:test` with dependency injection
- Fix duplicate file discovery bug for root route candidates
- Add `npm test` script

## 2.0.1

- Add missing `zod` dependency

## 2.0.0

- Rewrite as GLO Loop — AI-powered web vitals optimization engine
- Built on Vercel AI SDK with Anthropic and OpenAI support
- Interactive Lighthouse → AI analysis → fix loop
- Source file discovery for Next.js App/Pages Router
- Support for LCP, FCP, CLS, TBT, SI, TTFB targets

## 1.0.0

- Initial release
