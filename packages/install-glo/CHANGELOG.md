# Changelog

## 3.0.0

- Add multi-loop architecture with cassette-tape themed UI
  - Animated cassette banner with spinning reels and scrolling tape
  - Track-listing loop selector (A1, A2, A3)
- Add GLO Loop types:
  - **A1 — FE Infra Optimization**: Lighthouse-based web vitals (existing)
  - **A2 — CLI Timing Optimization**: Measure and optimize CLI command execution time (test suites, builds, scripts)
  - **A3 — Generate GLOOP.md**: Create custom loop configs for any repo
- Add GLOOP.md support — auto-detect custom loop configs via frontmatter
- Auto-apply code edits (no manual y/n prompt)
- Stream all output live:
  - GATHER: stdout/stderr from commands stream to terminal in real-time
  - LEVERAGE: AI responses stream token-by-token (both Vercel AI SDK and CLI backends)
- Switch AI SDK from `generateText` to `streamText` for live output
- Switch CLI backends from `execSync` to `spawn` for live streaming
- Accept "Vercel AI" / "Vercel" as AI backend input (case-insensitive)
- Show `--dangerously-skip-permissions` tip when using Claude CLI
- Cassette-tape themed business card with shader animation inside cassette shell
- Fix model.mjs duplicate function body bug

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
