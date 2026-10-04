import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("sponsor pages explain printing availability and permit event-day signage", () => {
  const sponsors = fs.readFileSync("app/sponsors/page.tsx", "utf8");
  assert.match(sponsors, /Sponsorships\s+are\s+still\s+being\s+accepted/i);
  for (const path of [
    "app/sponsors/page.tsx",
    "app/sponsors/fulfillment/page.tsx",
    "app/sponsors/confirmation/page.tsx",
  ]) {
    const page = fs.readFileSync(path, "utf8");
    assert.match(page, /New sponsors cannot be guaranteed inclusion in printed tournament materials/);
    assert.match(page, /Sponsors may bring their own signage on Friday, October 9, 2026/);
    assert.doesNotMatch(page, /Please submit your sponsor materials by this date to guarantee/);
  }
  assert.doesNotMatch(sponsors, /Friday,\s+October\s+2,\s*2026/i);
});
