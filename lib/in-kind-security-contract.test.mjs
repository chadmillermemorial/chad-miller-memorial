import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadRoute() {
  return await readFile(
    new URL("../app/api/in-kind-donation/route.ts", import.meta.url),
    "utf8"
  );
}

async function loadPage() {
  return await readFile(
    new URL("../app/register/donate/in-kind/page.tsx", import.meta.url),
    "utf8"
  );
}

test("in-kind API requires and forwards the existing Google Script internal key", async () => {
  const source = await loadRoute();

  assert.match(source, /process\.env\.GOOGLE_SCRIPT_INTERNAL_KEY/);
  assert.match(source, /GOOGLE_SCRIPT_INTERNAL_KEY is not configured/);
  assert.match(source, /internalKey\s*:\s*googleScriptInternalKey/);
});

test("in-kind form sends a separate bot honeypot and create phase rejects it", async () => {
  const pageSource = await loadPage();
  const routeSource = await loadRoute();

  assert.match(pageSource, /name=["']companyWebsite["']/);
  assert.match(pageSource, /aria-hidden=["']true["']/);
  assert.match(pageSource, /tabIndex=\{-1\}/);
  assert.match(pageSource, /formData\.get\(["']companyWebsite["']\)/);
  assert.match(pageSource, /phase:\s*["']create["'][\s\S]*companyWebsite/);
  assert.match(routeSource, /body\?\.companyWebsite/);
  assert.match(routeSource, /Automated submission rejected/);
});
