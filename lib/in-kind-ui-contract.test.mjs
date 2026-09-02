import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("donate page offers monetary and in-kind support without changing Stripe action", async () => {
  const source = await read("app/register/donate/page.tsx");

  assert.match(source, /Monetary Donation/);
  assert.match(source, /In-Kind Donation/);
  assert.match(source, /href=["']\/register\/donate\/in-kind["']/);
  assert.match(source, /action=["']\/api\/donation-checkout["']/);
  assert.match(source, /id=["']monetary-donation["']/);
});

test("in-kind form supports write-ins written descriptions and phased uploads", async () => {
  const source = await read("app/register/donate/in-kind/page.tsx");

  assert.match(source, /Other — Write In/);
  assert.match(source, /name=["']contributionTypeWriteIn["']/);
  assert.match(source, /name=["']intendedUseWriteIn["']/);
  assert.match(source, /name=["']description["']/);
  assert.match(source, /written description/i);
  assert.match(source, /Up to 3 files, 4 MB each/i);
  assert.match(source, /\.pdf,\.jpg,\.jpeg,\.png,\.doc,\.docx/);
  assert.match(source, /phase:\s*["']create["']/);
  assert.match(source, /formData\.append\(["']phase["'],\s*["']upload["']\)/);
  assert.match(source, /phase:\s*["']finalize["']/);
  assert.match(source, /attachmentIssue/);
  assert.match(source, /window\.location\.assign/);
});

test("in-kind confirmation page only shows donor-safe review language and submission ID", async () => {
  const source = await read(
    "app/register/donate/in-kind/confirmation/page.tsx"
  );

  assert.match(source, /Contribution Submitted for Review/);
  assert.match(source, /Submission does not constitute acceptance/);
  assert.match(source, /submissionId/);
  assert.doesNotMatch(source, /drive\.google\.com/i);
  assert.doesNotMatch(source, /spreadsheets\/d/i);
});
