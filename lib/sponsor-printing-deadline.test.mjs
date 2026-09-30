import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("sponsor page clearly keeps sponsorships open and uses the October 2 printing deadline", () => {
  const sponsors = source("app/sponsors/page.tsx");

  assert.match(sponsors, /Sponsorships are still being accepted/i);
  assert.match(sponsors, /Friday, October 2,\s*2026/i);
  assert.doesNotMatch(sponsors, /Friday, September 11,\s*2026/i);
  assert.match(sponsors, /printed tournament materials/i);
});
