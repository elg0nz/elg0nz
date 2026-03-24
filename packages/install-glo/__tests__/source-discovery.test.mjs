import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { discoverPageFiles } from "../lib/source-discovery.mjs";

function makeFs(fileMap) {
  return {
    existsSync: (path) => path in fileMap,
    readFileSync: (path) => {
      if (!(path in fileMap)) throw new Error(`ENOENT: ${path}`);
      return fileMap[path];
    },
  };
}

describe("discoverPageFiles", () => {
  it("finds App Router page.tsx for root route", () => {
    const fs = makeFs({
      "/project/app/page.tsx": "export default function Home() {}",
      "/project/app/layout.tsx": "<html>{children}</html>",
    });
    const files = discoverPageFiles("/project", "/", fs);
    assert.ok(files.length >= 2);
    assert.equal(files[0].path, "app/page.tsx");
  });

  it("finds Pages Router file for named route", () => {
    const fs = makeFs({
      "/project/pages/about.tsx": "export default function About() {}",
    });
    const files = discoverPageFiles("/project", "/about", fs);
    assert.equal(files.length, 1);
    assert.equal(files[0].path, "pages/about.tsx");
  });

  it("returns empty array when no files match", () => {
    const fs = makeFs({});
    const files = discoverPageFiles("/project", "/", fs);
    assert.deepStrictEqual(files, []);
  });

  it("truncates large files", () => {
    const bigContent = "x".repeat(20_000);
    const fs = makeFs({
      "/project/app/page.tsx": bigContent,
    });
    const files = discoverPageFiles("/project", "/", fs);
    assert.ok(files[0].content.length < bigContent.length);
    assert.ok(files[0].content.endsWith("// ... truncated"));
  });

  it("resolves relative imports from page file", () => {
    const fs = makeFs({
      "/project/app/page.tsx": 'import Hero from "./components/Hero";\nexport default function Home() {}',
      "/project/app/components/Hero.tsx": "export default function Hero() {}",
    });
    const files = discoverPageFiles("/project", "/", fs);
    const hero = files.find((f) => f.path.includes("Hero"));
    assert.ok(hero, "should discover imported Hero component");
  });

  it("does not duplicate already-discovered files", () => {
    const fs = makeFs({
      "/project/app/page.tsx": 'import Layout from "./layout";\nexport default function Home() {}',
      "/project/app/layout.tsx": "export default function Layout() {}",
    });
    const files = discoverPageFiles("/project", "/", fs);
    const layouts = files.filter((f) => f.path === "app/layout.tsx");
    assert.equal(layouts.length, 1);
  });

  it("discovers next.config.js when present", () => {
    const fs = makeFs({
      "/project/next.config.js": "module.exports = { images: {} }",
    });
    const files = discoverPageFiles("/project", "/", fs);
    assert.ok(files.find((f) => f.path === "next.config.js"));
  });
});
