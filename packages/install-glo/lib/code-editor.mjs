import {
  readFileSync as defaultReadFileSync,
  writeFileSync as defaultWriteFileSync,
} from "node:fs";
import { join } from "node:path";

export function parseSuggestion(text) {
  const file = text.match(/^FILE:\s*(.+)$/m)?.[1]?.trim();
  const beforeMatch = text.match(/^BEFORE:\n([\s\S]*?)(?=\n^AFTER:)/m);
  const afterMatch = text.match(/^AFTER:\n([\s\S]*?)(?=\n^WHY:)/m);
  const before = beforeMatch?.[1]?.trim();
  const after = afterMatch?.[1]?.trim();
  return { file, before, after };
}

export function applyEdit(
  projectRoot,
  edit,
  { readFileSync = defaultReadFileSync, writeFileSync = defaultWriteFileSync } = {}
) {
  if (!edit.file || !edit.after) {
    return { ok: false, reason: "Could not parse FILE or AFTER from suggestion" };
  }

  const fullPath = join(projectRoot, edit.file);
  let content;
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    return { ok: false, reason: `File not found: ${edit.file}` };
  }

  if (!edit.before || edit.before === "N/A") {
    writeFileSync(fullPath, content + "\n" + edit.after, "utf8");
    return { ok: true, action: "appended" };
  }

  if (!content.includes(edit.before)) {
    return { ok: false, reason: `BEFORE block not found in ${edit.file}` };
  }

  const updated = content.replace(edit.before, edit.after);
  writeFileSync(fullPath, updated, "utf8");
  return { ok: true, action: "replaced" };
}
