import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("sitewide footer links to The Honor Foundation", () => {
  const footer = source("components/Footer.tsx");

  assert.match(footer, /https:\/\/www\.honor\.org\//);
  assert.match(footer, />\s*The Honor Foundation\s*</);
});
