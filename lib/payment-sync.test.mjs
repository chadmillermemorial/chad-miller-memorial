import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";

const fixture = {
  registrationId: "cs_test_sync_fixture",
  stripeSessionId: "cs_test_sync_fixture",
  paymentStatus: "Paid",
  paymentAmount: 75,
  withdrawalToken: "private-fixture-token",
  players: [{ firstName: "Test", lastName: "Golfer", shirtSize: "L" }],
};

function loadWebhook(fetchImpl, event = {}) {
  const logs = [];
  const delays = [];
  const timeouts = [];
  const source = stripTypeScriptTypes(
    fs.readFileSync("app/api/stripe-webhook/route.ts", "utf8")
  ).replace(/^import .*;\s*$/gm, "").replace(/^export /gm, "");

  const api = vm.runInNewContext(source + "\n({sendToGoogleSheets, POST})", {
    fetch: fetchImpl,
    Response,
    NextResponse: { json: (body, init) => Response.json(body, init) },
    Stripe: class {
      webhooks = { constructEvent: () => event };
    },
    process: { env: { STRIPE_SECRET_KEY: "test-key", STRIPE_WEBHOOK_SECRET: "test-secret" } },
    AbortSignal: {
      timeout(ms) {
        timeouts.push(ms);
        return new AbortController().signal;
      },
    },
    setTimeout(callback, ms) {
      delays.push(ms);
      queueMicrotask(callback);
    },
    console: {
      warn: (...values) => logs.push(values),
      error: (...values) => logs.push(values),
    },
  });
  return { ...api, logs, delays, timeouts };
}

test("a temporary Google failure is recovered without waiting for Stripe redelivery", async () => {
  const bodies = [];
  const api = loadWebhook(async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    return bodies.length === 1
      ? new Response("Service temporarily unavailable", { status: 503 })
      : Response.json({ ok: true, registrationId: "cs_test_sync_fixture", playersSaved: 1 });
  });
  const result = await api.sendToGoogleSheets(fixture);
  assert.equal(result.ok, true);
  assert.equal(result.playersSaved, 1);
  assert.deepEqual(bodies, [fixture, fixture]);
});

test("a transient Apps Script lock timeout retries the same paid checkout", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => ++attempts === 1
    ? Response.json({ ok: false, error: "Lock timeout: another process was holding the lock for too long." })
    : Response.json({ ok: true }));
  assert.equal((await api.sendToGoogleSheets(fixture)).ok, true);
  assert.equal(attempts, 2);
});

test("an HTML response from Google is retried instead of losing paid registration", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => ++attempts === 1
    ? new Response("<html>temporary upstream error</html>", { headers: { "content-type": "text/html" } })
    : Response.json({ ok: true }));
  assert.equal((await api.sendToGoogleSheets(fixture)).ok, true);
});

test("a dropped response after persistence can be replayed without changing checkout identity", async () => {
  const registrations = new Set();
  const confirmations = new Set();
  let attempts = 0;
  const api = loadWebhook(async (_url, init) => {
    const data = JSON.parse(init.body);
    const duplicate = registrations.has(data.registrationId);
    registrations.add(data.registrationId);
    confirmations.add(data.registrationId);
    if (++attempts === 1) throw new TypeError("fetch failed");
    return Response.json({ ok: true, duplicate });
  });
  const result = await api.sendToGoogleSheets(fixture);
  assert.equal(result.duplicate, true);
  assert.equal(registrations.size, 1);
  assert.equal(confirmations.size, 1);
});

test("persistent temporary failures are bounded and remain failures for Stripe to retry", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => {
    attempts++;
    return new Response("Unavailable", { status: 503 });
  });
  await assert.rejects(api.sendToGoogleSheets(fixture), /503/);
  assert.equal(attempts, 3);
  assert.equal(api.timeouts.length, attempts);
  assert.ok(api.timeouts.every(ms => ms > 0));
  assert.ok(api.timeouts.reduce((a, b) => a + b, 0) + api.delays.reduce((a, b) => a + b, 0) < 60000);
});

test("an upstream timeout is retried", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => {
    if (++attempts === 1) throw Object.assign(new Error("request timed out"), { name: "TimeoutError" });
    return Response.json({ ok: true });
  });
  assert.equal((await api.sendToGoogleSheets(fixture)).ok, true);
});

test("permanent registration rejection is not retried", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => {
    attempts++;
    return Response.json({ ok: false, error: "Required player information is missing." });
  });
  await assert.rejects(api.sendToGoogleSheets(fixture), /Required player information/);
  assert.equal(attempts, 1);
});

test("upstream authorization failures are not retried", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => {
    attempts++;
    return new Response("Forbidden", { status: 403 });
  });
  await assert.rejects(api.sendToGoogleSheets(fixture), /403/);
  assert.equal(attempts, 1);
});

test("only an explicit successful Google acknowledgement is accepted", async () => {
  const api = loadWebhook(async () => Response.json({ ok: "false" }));
  await assert.rejects(api.sendToGoogleSheets(fixture));
});

test("sync diagnostics exclude private player data and management tokens", async () => {
  let attempts = 0;
  const api = loadWebhook(async () => ++attempts === 1
    ? new Response(fixture.withdrawalToken, { status: 503 })
    : Response.json({ ok: true }));
  await api.sendToGoogleSheets(fixture);
  assert.ok(api.logs.length > 0);
  const logged = JSON.stringify(api.logs);
  assert.doesNotMatch(logged, /private-fixture-token|Test|Golfer/);
});

test("webhook returns 200 after Google recovers from a temporary failure", async () => {
  const written = [];
  const api = loadWebhook(async (_url, init) => {
    written.push(JSON.parse(init.body));
    return written.length === 1
      ? new Response("Unavailable", { status: 503 })
      : Response.json({ ok: true });
  }, {
    type: "checkout.session.completed",
    data: { object: {
      id: "cs_test_route_fixture", payment_status: "paid", amount_total: 7500,
      metadata: { playerCount: "1", p1FirstName: "Test", p1LastName: "Golfer", p1ShirtSize: "L" },
    } },
  });
  const response = await api.POST(new Request("https://example.test/webhook", {
    method: "POST", headers: { "stripe-signature": "fixture-signature" }, body: "{}",
  }));
  assert.equal(response.status, 200);
  assert.equal(written[1].registrationId, "cs_test_route_fixture");
  assert.equal(written[1].players[0].shirtSize, "L");
  assert.equal(written[1].paymentAmount, 75);
});

test("webhook returns 500 when every Google save fails", async () => {
  const api = loadWebhook(async () => new Response("Unavailable", { status: 503 }), {
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_fixture", payment_status: "paid", amount_total: 7500, metadata: { playerCount: "1" } } },
  });
  const response = await api.POST(new Request("https://example.test/webhook", {
    method: "POST", headers: { "stripe-signature": "fixture-signature" }, body: "{}",
  }));
  assert.equal(response.status, 500);
});
