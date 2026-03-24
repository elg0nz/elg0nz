#!/usr/bin/env node

// install-glo CLI router
// npx install-glo       → business card
// npx install-glo ai    → glo-loop (web vitals optimizer)
// npx install-glo about → about-glo-loop

const cmd = process.argv[2];

if (cmd === "ai" || cmd === "loop") {
  await import("./glo-loop.mjs");
} else if (cmd === "about") {
  await import("./about.mjs");
} else {
  await import("./card.mjs");
}
