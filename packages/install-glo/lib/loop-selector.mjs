import chalk from "chalk";
import { parseGloopFile, BUILTIN_LOOPS } from "./gloop-config.mjs";

const o = chalk.hex("#FF8C00");
const g = chalk.hex("#4AF626");
const d = chalk.dim;
const w = chalk.white;

/**
 * Detect GLOOP.md and ask user to select a loop type.
 * Styled as a cassette track listing.
 */
export async function selectLoop(rl, projectRoot, deps = {}) {
  // Check for GLOOP.md first
  const gloopConfig = parseGloopFile(projectRoot, deps);

  if (gloopConfig) {
    const name = gloopConfig.frontmatter.name || "Custom GLO Loop";
    console.log(
      g("  ▶ GLOOP.md detected") +
        d(" — ") +
        w(`"${name}"`)
    );
    console.log("");

    const answer = await rl.question(
      o("  Play this tape? ") +
        d("[y = play / n = browse tracks]: ")
    );

    if (answer.trim().toLowerCase() === "y" || answer.trim() === "") {
      return {
        type: gloopConfig.frontmatter.type || "custom",
        config: gloopConfig.frontmatter,
        body: gloopConfig.body,
        source: "gloop-file",
      };
    }
    console.log("");
  }

  // Track listing
  console.log(
    d("  ┌─ ") + o("TRACKS") + d(" ──────────────────────────────────────────────┐")
  );
  console.log(d("  │") + " ".repeat(53) + d("│"));

  for (let i = 0; i < BUILTIN_LOOPS.length; i++) {
    const loop = BUILTIN_LOOPS[i];
    const trackNum = `A${i + 1}`;
    console.log(
      d("  │") +
        g(`   ${trackNum} ▸ `) +
        w(loop.name) +
        " ".repeat(Math.max(1, 44 - loop.name.length - trackNum.length)) +
        d("│")
    );
    console.log(
      d("  │") +
        d(`        ${loop.description}`) +
        " ".repeat(Math.max(1, 46 - loop.description.length)) +
        d("│")
    );
    console.log(d("  │") + " ".repeat(53) + d("│"));
  }

  console.log(
    d("  │") +
      d("   ··· more tracks coming soon") +
      " ".repeat(23) +
      d("│")
  );
  console.log(d("  │") + " ".repeat(53) + d("│"));
  console.log(
    d("  │") +
      d("   ") + g("+") + d(" Drop a ") + w("GLOOP.md") + d(" in your repo to add your own") +
      " ".repeat(6) +
      d("│")
  );
  console.log(d("  │") + " ".repeat(53) + d("│"));
  console.log(
    d("  └───────────────────────────────────────────────────────┘")
  );
  console.log("");

  const choice = await rl.question(
    o("  Select track ") +
      d(`(1-${BUILTIN_LOOPS.length}, default: 1): `)
  );
  const idx = parseInt(choice.trim(), 10) - 1;
  const selected = BUILTIN_LOOPS[idx] || BUILTIN_LOOPS[0];

  console.log(
    g(`\n  ▶ Now playing: `) + w(selected.name) + "\n"
  );

  return {
    type: selected.type,
    config: {},
    body: "",
    source: "builtin",
  };
}
