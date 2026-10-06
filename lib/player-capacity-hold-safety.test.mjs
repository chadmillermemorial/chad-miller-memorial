import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as crypto from "node:crypto";
import test from "node:test";
import ts from "typescript";

// Execute the real route. Only external services and the clock are simulated.
// No real Stripe account, Google Sheet, payment, or environment secret is used.

const routePath = "app/api/player-registration/route.ts";
const routeSource = fs.readFileSync(routePath, "utf8");

const compiled = ts.transpileModule(routeSource, {
  fileName: routePath,
  reportDiagnostics: true,
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
  },
});

assert.equal(
  (compiled.diagnostics || []).filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error
  ).length,
  0,
  "The registration route must transpile before its behavior is tested."
);

const origin = "https://tournament.example.test";
const attemptId = "11111111-1111-4111-8111-111111111111";
const copy = value => JSON.parse(JSON.stringify(value));

function registration(overrides = {}) {
  const values = {
    registrationType: "foursome",
    registrationAttemptId: attemptId,
    teamName: "Test Foursome",
    emergencyContactName: "Test Contact",
    emergencyContactPhone: "5550100000",
    rulesAcknowledgment: "on",
    photoRelease: "on",
    refundPolicyAcknowledgment: "on",
  };

  for (let n = 1; n <= 4; n++) {
    Object.assign(values, {
      [`player${n}FirstName`]: `Test${n}`,
      [`player${n}LastName`]: "Golfer",
      [`player${n}Email`]: `golfer${n}@example.test`,
      [`player${n}Phone`]: "5550100000",
      [`player${n}ShirtSize`]: "L",
      [`player${n}TeeSelection`]: "mens",
    });
  }

  const form = new FormData();

  for (const [name, value] of Object.entries({
    ...values,
    ...overrides,
  })) {
    form.set(name, value);
  }

  return form;
}

function fixture(settings = {}) {
  let now = Date.now();

  const holds = new Map();
  const sessions = new Map();
  const idempotency = new Map();
  const creates = [];
  const calls = [];
  const events = [];

  let paidPlayers = settings.paidPlayers ?? 124;

  const reply = value => Response.json(value);

  const failure = () =>
    new Response("Temporary service failure", {
      status: 503,
    });

  const consume = name => {
    if (!(settings[name] > 0)) {
      return false;
    }

    settings[name]--;
    return true;
  };

  async function fakeFetch(url, init) {
    assert.equal(
      new URL(url).hostname,
      "script.google.com"
    );

    const data = JSON.parse(init.body);
    calls.push(copy(data));

    const holdId =
      data.holdId ||
      "PLAYER-" +
        crypto
          .createHash("sha256")
          .update(
            "player-capacity-v2:" +
              data.registrationAttemptId
          )
          .digest("hex");

    let hold = holds.get(holdId);

    if (data.action === "reserveCapacity") {
      const reused = Boolean(hold);

      if (hold?.holdStatus === "Converted") {
        return reply({
          ok: false,
          alreadyRegistered: true,
        });
      }

      if (hold && hold.holdStatus !== "Active") {
        return reply({
          ok: false,
          message: "This attempt has ended.",
        });
      }

      if (!hold) {
        const held = [...holds.values()]
          .filter(item => item.holdStatus === "Active")
          .reduce(
            (sum, item) => sum + item.playerCount,
            0
          );

        const remaining = 128 - paidPlayers - held;

        if (remaining < data.playerCount) {
          return reply({
            ok: false,
            full: true,
            remaining: Math.max(remaining, 0),
          });
        }

        hold = {
          holdId,
          playerCount: data.playerCount,
          expiresAt: new Date(
            now + 35 * 60000
          ).toISOString(),
          stripeSessionId: "",
          holdStatus: "Active",
        };

        holds.set(holdId, hold);
      }

      // A server can save a hold before returning an unusable response.
      if (consume("reservationFailures")) {
        return new Response(
          "<!doctype html><title>Temporary error</title>"
        );
      }

      if (consume("missingHoldReplies")) {
        return reply({ ok: true });
      }

      return reply({
        ok: true,
        ...hold,
        reused,
        holdProtocol: "player-hold-v2",
      });
    }

    if (!hold) {
      return reply({
        ok: false,
        error: "Unknown hold.",
      });
    }

    if (data.action === "getPlayerCapacityHold") {
      return reply({
        ok: true,
        ...hold,
      });
    }

    if (data.action === "attachPlayerCheckout") {
      if (consume("attachFailures")) {
        return failure();
      }

      hold.stripeSessionId = data.stripeSessionId;
      return reply({ ok: true });
    }

    if (data.action === "releaseCapacity") {
      if (consume("releaseFailures")) {
        return failure();
      }

      if (settings.rejectRelease) {
        return reply({
          ok: false,
          error: "Release rejected.",
        });
      }

      if (hold.holdStatus === "Active") {
        hold.holdStatus = "Released";
        events.push("hold-released");
      }

      return reply({ ok: true });
    }

    throw new Error(
      "Unexpected Apps Script action: " +
        data.action
    );
  }

  class FakeStripe {
    constructor() {
      this.checkout = {
        sessions: {
          create: async (params, options) => {
            const key = options?.idempotencyKey;

            assert.ok(
              key,
              "Stripe creates must have an idempotency key."
            );

            creates.push(
              copy({ params, key })
            );

            if (idempotency.has(key)) {
              const previous = idempotency.get(key);

              assert.deepEqual(
                copy(params),
                previous.params,
                "A reused Stripe key must receive identical parameters."
              );

              return copy(
                sessions.get(previous.id)
              );
            }

            const id =
              `cs_test_${sessions.size + 1}`;

            const session = {
              id,
              mode: params.mode,
              status: "open",
              payment_status: "unpaid",
              amount_total: params.line_items.reduce(
                (sum, item) =>
                  sum +
                  item.quantity *
                    item.price_data.unit_amount,
                0
              ),
              currency:
                params.line_items[0].price_data.currency,
              metadata: copy(params.metadata),
              expires_at: params.expires_at,
              url:
                `https://checkout.example.test/${id}`,
            };

            sessions.set(id, session);

            idempotency.set(key, {
              id,
              params: copy(params),
            });

            if (consume("lostCreateResponses")) {
              throw new TypeError(
                "Response lost after creation."
              );
            }

            return copy(session);
          },

          retrieve: async id => {
            assert.ok(
              sessions.has(id),
              "Requested checkout must exist."
            );

            return copy(sessions.get(id));
          },

          list: async () => ({
            data: settings.hideSessions
              ? []
              : copy([...sessions.values()]),
            has_more: false,
          }),

          expire: async id => {
            const session = sessions.get(id);

            assert.ok(
              session,
              "Canceled checkout must exist."
            );

            if (settings.payDuringExpiration) {
              session.status = "complete";
              session.payment_status = "paid";

              throw new Error(
                "Payment completed before expiration."
              );
            }

            if (settings.expireFailure) {
              throw new Error(
                "Expiration unavailable."
              );
            }

            session.status = "expired";
            events.push("stripe-expired");

            return copy(session);
          },
        },
      };
    }
  }

  const nextResponse = {
    json: (body, init) =>
      Response.json(body, init),

    redirect: (url, status) =>
      new Response(null, {
        status,
        headers: {
          Location: String(url),
        },
      }),
  };

  const module = {
    exports: {},
  };

  vm.runInNewContext(
    compiled.outputText,
    {
      module,
      exports: module.exports,

      require(name) {
        if (
          name === "crypto" ||
          name === "node:crypto"
        ) {
          return crypto;
        }

        if (name === "stripe") {
          return FakeStripe;
        }

        if (name === "next/server") {
          return {
            NextResponse: nextResponse,
          };
        }

        throw new Error(
          "Unexpected route dependency: " + name
        );
      },

      process: {
        env: {
          STRIPE_SECRET_KEY:
            "sk_test_unit_tests_only",
        },
      },

      fetch: fakeFetch,
      Request,
      Response,
      FormData,
      URL,
      URLSearchParams,
      Buffer,
      AbortSignal,
      setTimeout,
      clearTimeout,

      Date: class extends Date {
        static now() {
          return now;
        }
      },

      console: {
        warn() {},
        error() {},
        log() {},
      },
    },
    {
      filename: routePath,
    }
  );

  return {
    settings,
    holds,
    sessions,
    creates,
    calls,
    events,

    advance(ms) {
      now += ms;
    },

    paid() {
      const session =
        [...sessions.values()][0];

      session.status = "complete";
      session.payment_status = "paid";

      [...holds.values()][0].holdStatus =
        "Converted";

      paidPlayers = 128;
    },

    post(
      overrides = {},
      accept = "application/json"
    ) {
      return module.exports.POST(
        new Request(
          origin + "/api/player-registration",
          {
            method: "POST",
            body: registration(overrides),
            headers: { accept },
          }
        )
      );
    },

    cancel(
      url = creates[0].params.cancel_url
    ) {
      assert.equal(
        typeof module.exports.GET,
        "function",
        "Cancellation handler must exist."
      );

      assert.equal(
        new URL(url).pathname,
        "/api/player-registration"
      );

      return module.exports.GET(
        new Request(url)
      );
    },
  };
}

function expectCheckout(response) {
  assert.equal(response.status, 303);

  assert.match(
    response.headers.get("location") || "",
    /^https:\/\/checkout\.example\.test\//
  );
}

// Preserve the existing check of the browser's duplicate-submit guard.

test(
  "player registration retains the browser duplicate-submit guard",
  () => {
    const page = fs.readFileSync(
      "app/register/player/page.tsx",
      "utf8"
    );

    for (const pattern of [
      /registrationAttemptId/,
      /submittingRef/,
      /preventDefault/,
      /Opening Secure Payment/i,
    ]) {
      assert.match(page, pattern);
    }
  }
);

test(
  "checkout: the final foursome opens one $300 checkout",
  async () => {
    const h = fixture();

    expectCheckout(await h.post());

    assert.equal(h.holds.size, 1);
    assert.equal(h.sessions.size, 1);

    const session =
      [...h.sessions.values()][0];

    const hold =
      [...h.holds.values()][0];

    assert.equal(
      session.amount_total,
      30000
    );

    assert.equal(hold.playerCount, 4);

    assert.equal(
      hold.stripeSessionId,
      session.id
    );

    assert.ok(
      session.expires_at * 1000 <
        Date.parse(hold.expiresAt)
    );
  }
);

test(
  "checkout: repeated submission resumes the same reservation",
  async () => {
    const h = fixture();

    const first = await h.post();
    const second = await h.post();

    expectCheckout(first);
    expectCheckout(second);

    assert.equal(
      first.headers.get("location"),
      second.headers.get("location")
    );

    assert.equal(h.creates.length, 1);
    assert.equal(h.holds.size, 1);
  }
);

test(
  "checkout: another registration cannot take an occupied final foursome",
  async () => {
    const h = fixture();

    expectCheckout(await h.post());

    const other = await h.post({
      registrationAttemptId:
        "22222222-2222-4222-8222-222222222222",
    });

    assert.equal(other.status, 409);

    assert.equal(
      (await other.json()).registrationFull,
      true
    );

    assert.equal(h.sessions.size, 1);
  }
);

test(
  "checkout: retries preserve all Stripe parameters and the retry key",
  async () => {
    const h = fixture({
      attachFailures: 2,
      hideSessions: true,
    });

    assert.equal(
      (await h.post()).status,
      503
    );

    h.advance(1000);

    expectCheckout(await h.post());

    assert.equal(h.creates.length, 2);

    assert.deepEqual(
      h.creates[0],
      h.creates[1]
    );

    assert.equal(h.sessions.size, 1);
  }
);

for (const fault of [
  "reservationFailures",
  "missingHoldReplies",
]) {
  test(
    `checkout: recovers ${fault} without reserving twice`,
    async () => {
      const h = fixture({
        [fault]: 1,
      });

      expectCheckout(await h.post());

      const reservations = h.calls.filter(
        call => call.action === "reserveCapacity"
      );

      assert.equal(
        reservations.length,
        2
      );

      assert.deepEqual(
        reservations[0],
        reservations[1]
      );

      assert.equal(h.holds.size, 1);
      assert.equal(h.sessions.size, 1);
    }
  );
}

test(
  "checkout: a lost Stripe response retains the hold and recovers the existing checkout",
  async () => {
    const h = fixture({
      lostCreateResponses: 1,
    });

    assert.equal(
      (await h.post()).status,
      503
    );

    assert.equal(
      [...h.holds.values()][0].holdStatus,
      "Active"
    );

    expectCheckout(await h.post());

    assert.equal(h.creates.length, 1);
    assert.equal(h.sessions.size, 1);

    assert.equal(
      h.calls.some(
        call => call.action === "releaseCapacity"
      ),
      false
    );
  }
);

test(
  "checkout: cancellation expires Stripe before releasing capacity",
  async () => {
    const h = fixture();

    expectCheckout(await h.post());

    const result = await h.cancel();

    assert.equal(result.status, 303);

    assert.equal(
      new URL(
        result.headers.get("location")
      ).pathname,
      "/register/player"
    );

    assert.deepEqual(
      h.events,
      ["stripe-expired", "hold-released"]
    );

    assert.equal(
      [...h.sessions.values()][0].status,
      "expired"
    );
  }
);

test(
  "checkout: cancellation retries temporary capacity-release failures",
  async () => {
    const h = fixture({
      releaseFailures: 1,
    });

    expectCheckout(await h.post());

    assert.equal(
      (await h.cancel()).status,
      303
    );

    assert.equal(
      h.calls.filter(
        call => call.action === "releaseCapacity"
      ).length,
      2
    );

    assert.equal(
      [...h.holds.values()][0].holdStatus,
      "Released"
    );
  }
);

test(
  "checkout: a rejected capacity release is not reported as successful",
  async () => {
    const h = fixture({
      rejectRelease: true,
    });

    expectCheckout(await h.post());

    assert.equal(
      (await h.cancel()).status,
      503
    );

    assert.equal(
      [...h.holds.values()][0].holdStatus,
      "Active"
    );
  }
);

test(
  "checkout: unconfirmed Stripe expiration never releases capacity",
  async () => {
    const h = fixture({
      expireFailure: true,
    });

    expectCheckout(await h.post());

    assert.equal(
      (await h.cancel()).status,
      503
    );

    assert.equal(
      h.calls.some(
        call => call.action === "releaseCapacity"
      ),
      false
    );

    assert.equal(
      [...h.holds.values()][0].holdStatus,
      "Active"
    );
  }
);

test(
  "checkout: payment completing during cancellation is protected",
  async () => {
    const h = fixture({
      payDuringExpiration: true,
    });

    expectCheckout(await h.post());

    const result = await h.cancel();

    assert.equal(result.status, 303);

    assert.equal(
      new URL(
        result.headers.get("location")
      ).pathname,
      "/register/player/confirmation"
    );

    assert.equal(
      h.calls.some(
        call => call.action === "releaseCapacity"
      ),
      false
    );
  }
);

test(
  "checkout: tampered cancellation tokens cannot release a hold",
  async () => {
    const h = fixture();

    expectCheckout(await h.post());

    const url = new URL(
      h.creates[0].params.cancel_url
    );

    url.searchParams.set(
      "token",
      "0".repeat(64)
    );

    assert.equal(
      (await h.cancel(url)).status,
      403
    );

    assert.equal(
      h.calls.some(
        call => call.action === "releaseCapacity"
      ),
      false
    );
  }
);

test(
  "checkout: paid registrations return to confirmation without another checkout",
  async () => {
    const h = fixture();

    expectCheckout(await h.post());

    h.paid();

    const result = await h.post();

    assert.equal(result.status, 303);

    assert.equal(
      new URL(
        result.headers.get("location")
      ).pathname,
      "/register/player/confirmation"
    );

    assert.equal(h.creates.length, 1);

    assert.equal(
      [...h.holds.values()][0].holdStatus,
      "Converted"
    );
  }
);

test(
  "checkout: mismatched registration details do not open another payment",
  async () => {
    const h = fixture();

    expectCheckout(await h.post());

    assert.equal(
      (
        await h.post({
          teamName: "Different Team",
        })
      ).status,
      409
    );

    assert.equal(h.sessions.size, 1);
  }
);

test(
  "checkout: waitlist cancellation preserves the private offer",
  async () => {
    const h = fixture();

    expectCheckout(
      await h.post({
        waitlistId: "WL-TEST",
        offerToken: "test-private-offer",
      })
    );

    const response = await h.cancel();

    const url = new URL(
      response.headers.get("location")
    );

    assert.equal(
      url.searchParams.get("waitlistId"),
      "WL-TEST"
    );

    assert.equal(
      url.searchParams.get("offerToken"),
      "test-private-offer"
    );

    assert.equal(
      h.creates[0].params.metadata.offerToken,
      undefined
    );
  }
);

test(
  "checkout: browser retry page retains the original attempt ID",
  async () => {
    const h = fixture({
      lostCreateResponses: 1,
    });

    const response = await h.post(
      {},
      "text/html"
    );

    assert.equal(response.status, 503);

    assert.equal(
      response.headers.get("cache-control"),
      "no-store"
    );

    const html = await response.text();

    assert.ok(
      html.includes(
        `name="registrationAttemptId" value="${attemptId}"`
      )
    );

    assert.match(
      html,
      /Retry this checkout/
    );

    assert.equal(
      h.calls.some(
        call => call.action === "releaseCapacity"
      ),
      false
    );
  }
);

// END OF lib/player-capacity-hold-safety.test.mjs