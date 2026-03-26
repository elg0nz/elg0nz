import { writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

const o = chalk.hex("#FF8C00");
const g = chalk.hex("#4AF626");
const d = chalk.dim;
const w = chalk.white;

export async function generateGloopFile(rl, projectRoot) {
  console.log(
    g("\n  Generate GLOOP.md\n")
  );
  console.log(
    d("  This will create a GLOOP.md in your project root.\n") +
      d("  Next time you run the GLO Loop, it will detect it automatically.\n")
  );

  const nameInput = await rl.question(
    o("  Loop name ") + d("(e.g. 'Optimize CI suite'): ")
  );
  const name = nameInput.trim() || "My GLO Loop";

  console.log("");
  console.log(w("  Available loop types:"));
  console.log(g("    1. web-vitals  ") + d("— Lighthouse-based web performance"));
  console.log(g("    2. cli-timing  ") + d("— CLI command execution time"));
  console.log("");

  const typeInput = await rl.question(
    o("  Loop type ") + d("(1 or 2, default: 2): ")
  );
  const typeIdx = parseInt(typeInput.trim(), 10);
  const type = typeIdx === 1 ? "web-vitals" : "cli-timing";

  let extraFields = "";

  if (type === "web-vitals") {
    const urlInput = await rl.question(
      o("  Default URL ") + d("(default: http://localhost:3000): ")
    );
    const url = urlInput.trim() || "http://localhost:3000";

    const vitalInput = await rl.question(
      o("  Default vital ") + d("(default: LCP): ")
    );
    const vital = vitalInput.trim().toUpperCase() || "LCP";

    extraFields = `url: ${url}\nvital: ${vital}\n`;
  } else {
    const cmdInput = await rl.question(
      o("  Default command ") + d("(e.g. npm test): ")
    );
    const command = cmdInput.trim();
    if (command) {
      extraFields = `command: ${command}\n`;
    }

    const metricInput = await rl.question(
      o("  Default metric ") + d("(default: execution_time): ")
    );
    const metric = metricInput.trim() || "execution_time";
    extraFields += `metric: ${metric}\n`;
  }

  const content = `---
name: ${name}
type: ${type}
${extraFields}---

# ${name}

Custom GLO Loop configuration for this project.
Add any notes about optimization goals here.
`;

  const filePath = join(projectRoot, "GLOOP.md");
  writeFileSync(filePath, content, "utf8");

  console.log("");
  console.log(g("  ✓ Created ") + w("GLOOP.md"));
  console.log(d("  Run the GLO Loop again to use it.\n"));
}
