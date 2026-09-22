import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("expired player checkout releases only its temporary capacity hold", () => {
  const webhook = source("app/api/stripe-webhook/route.ts");

  assert.match(webhook, /checkout\.session\.expired/);
  assert.match(webhook, /releaseCapacity/);
  assert.match(webhook, /capacityHoldId/);
  assert.match(webhook, /paymentType/);
  assert.match(webhook, /playerCount/);
});
