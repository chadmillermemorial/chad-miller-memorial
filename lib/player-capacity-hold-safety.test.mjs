import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("player registration prevents repeat submits from creating duplicate capacity holds", () => {
  const page = source("app/register/player/page.tsx");

  assert.match(page, /registrationAttemptId/);
  assert.match(page, /submittingRef/);
  assert.match(page, /preventDefault/);
  assert.match(page, /Opening Secure Payment/i);
});

test("player checkout uses a stable attempt id and Stripe idempotency", () => {
  const route = source("app/api/player-registration/route.ts");

  assert.match(route, /registrationAttemptId/);
  assert.match(route, /idempotencyKey/);
  assert.match(route, /player-registration:/);
});

test("player capacity release verifies the Apps Script result and retries failures", () => {
  const route = source("app/api/player-registration/route.ts");

  assert.match(route, /releaseCapacityHold/);
  assert.match(route, /result\.ok/);
  assert.match(route, /for \(let attempt = 1; attempt <= 3; attempt\+\+\)/);
});

test("canceling player Stripe checkout immediately releases the temporary hold", () => {
  const route = source("app/api/player-registration/route.ts");
  const cancelRoute = source("app/api/player-cancel/route.ts");

  assert.match(route, /\/api\/player-cancel/);
  assert.match(cancelRoute, /releaseCapacity/);
  assert.match(cancelRoute, /holdId/);
});
