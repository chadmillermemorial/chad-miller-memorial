import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("sponsor confirmation reads the Stripe session id and distinguishes included foursomes", () => {
  const confirmation = source("app/sponsors/confirmation/page.tsx");

  assert.match(confirmation, /session_id/);
  assert.match(confirmation, /includedPlayerCount/);
  assert.match(confirmation, /Grey|Blue/);
});

test("Grey and Blue sponsor confirmation tells sponsors to complete their foursome details", () => {
  const confirmation = source("app/sponsors/confirmation/page.tsx");

  assert.match(confirmation, /Complete your sponsor details and enter your foursome/i);
  assert.match(confirmation, /shirt size/i);
  assert.match(confirmation, /secure.*email|email.*secure/i);
});

test("sponsor session API retrieves only paid sponsorship checkout sessions", () => {
  const route = source("app/api/sponsor-session/route.ts");

  assert.match(route, /checkout\.sessions\.retrieve/);
  assert.match(route, /payment_status/);
  assert.match(route, /paymentType/);
  assert.match(route, /includedPlayerCount/);
});
