import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("2027 donations use the protected checkout and non-cash contributions use inquiries", async () => {
  const source = await read("app/register/donate/page.tsx");
  const form = await read("components/forms/Donation2027Form.tsx");
  assert.match(source, /Donation2027Form/);
  assert.match(source, /donation2027Ready/);
  assert.match(source, /\/2027\?type=sponsor#interest/);
  assert.doesNotMatch(source, /href=["']\/register\/donate\/in-kind["']/);
  assert.match(form, /\/api\/donation-checkout/);
  assert.match(form, /id=["']monetary-donation["']/);
});

test("completed 2026 in-kind enrollment shows closure instead of an upload form", async () => {
  const source = await read("app/register/donate/in-kind/page.tsx");
  assert.match(source, /<EnrollmentClosed/);
  assert.doesNotMatch(source, /<form|fetch\(/);
});

test("in-kind confirmation page only shows donor-safe review language and submission ID", async () => {
  const source = await read(
    "app/register/donate/in-kind/confirmation/page.tsx"
  );

  assert.match(source, /Contribution Submitted for Review/);
  assert.match(source, /Submission does\s+not constitute acceptance/);
  assert.match(source, /submissionId/);
  assert.doesNotMatch(source, /drive\.google\.com/i);
  assert.doesNotMatch(source, /spreadsheets\/d/i);
});
