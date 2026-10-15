import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("sponsor recognition remains while new paid sponsorship enrollment is closed", () => {
 const sponsors = fs.readFileSync("app/sponsors/page.tsx", "utf8");
 assert.match(sponsors, /2027 Sponsorship Inquiry/);
 assert.match(sponsors, /paid sponsorship enrollment.*closed/is);
 assert.match(sponsors, /api\/approved-sponsors/);
 assert.doesNotMatch(sponsors, /<form|still being accepted|Continue to Secure/);
});
