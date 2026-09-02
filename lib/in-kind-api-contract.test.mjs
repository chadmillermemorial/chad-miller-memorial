import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadRoute() {
  return await readFile(
    new URL("../app/api/in-kind-donation/route.ts", import.meta.url),
    "utf8"
  );
}

test("in-kind API exposes create upload and finalize phases", async () => {
  const source = await loadRoute();

  assert.match(source, /phase\s*===\s*["']create["']/);
  assert.match(source, /phase\s*===\s*["']upload["']/);
  assert.match(source, /phase\s*===\s*["']finalize["']/);
  assert.match(source, /parseInKindMetadata/);
  assert.match(source, /validateInKindFiles/);
  assert.match(source, /buildCreateInKindPayload/);
  assert.match(source, /buildUploadInKindPayload/);
  assert.match(source, /buildFinalizeInKindPayload/);
});

test("upload phase accepts exactly one file per Vercel request", async () => {
  const source = await loadRoute();

  assert.match(source, /formData\(\)/);
  assert.match(source, /getAll\(["']file["']\)/);
  assert.match(source, /files\.length\s*!==\s*1/);
  assert.match(source, /Buffer\.from/);
});

test("route preserves Stripe isolation and reports attachment issues at finalization", async () => {
  const source = await loadRoute();

  assert.doesNotMatch(source, /from\s+["']stripe["']/i);
  assert.doesNotMatch(source, /donation-checkout/);
  assert.match(source, /attachmentIssue/);
  assert.match(source, /confirmationUrl/);
});
