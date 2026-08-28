import assert from "node:assert/strict";
import test from "node:test";

async function loadAdminAuth() {
  try {
    return await import("./admin-auth.ts");
  } catch (error) {
    assert.fail(
      `Expected lib/admin-auth.ts to implement admin authentication: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

test("verifies the configured admin password", async () => {
  const { verifyAdminPassword } = await loadAdminAuth();

  assert.equal(verifyAdminPassword("correct horse", "correct horse"), true);
  assert.equal(verifyAdminPassword("wrong horse", "correct horse"), false);
  assert.equal(verifyAdminPassword("", "correct horse"), false);
});

test("rejects missing configured admin password", async () => {
  const { verifyAdminPassword } = await loadAdminAuth();

  assert.throws(() => verifyAdminPassword("anything", ""));
});

test("creates and verifies a signed eight-hour admin session", async () => {
  const {
    ADMIN_SESSION_MAX_AGE_SECONDS,
    createAdminSessionToken,
    verifyAdminSessionToken,
  } = await loadAdminAuth();

  const now = Date.UTC(2026, 7, 27, 21, 0, 0);
  const secret = "0123456789abcdef0123456789abcdef";
  const token = createAdminSessionToken(secret, now);

  assert.equal(ADMIN_SESSION_MAX_AGE_SECONDS, 8 * 60 * 60);
  assert.equal(verifyAdminSessionToken(token, secret, now), true);
  assert.equal(
    verifyAdminSessionToken(
      token,
      secret,
      now + (8 * 60 * 60 * 1000) - 1
    ),
    true
  );
});

test("rejects tampered admin session tokens", async () => {
  const {
    createAdminSessionToken,
    verifyAdminSessionToken,
  } = await loadAdminAuth();

  const now = Date.UTC(2026, 7, 27, 21, 0, 0);
  const secret = "0123456789abcdef0123456789abcdef";
  const token = createAdminSessionToken(secret, now);
  const tampered = `${token.slice(0, -1)}${
    token.endsWith("a") ? "b" : "a"
  }`;

  assert.equal(verifyAdminSessionToken(tampered, secret, now), false);
  assert.equal(
    verifyAdminSessionToken(
      token,
      "fedcba9876543210fedcba9876543210",
      now
    ),
    false
  );
});

test("rejects expired admin session tokens", async () => {
  const {
    createAdminSessionToken,
    verifyAdminSessionToken,
  } = await loadAdminAuth();

  const now = Date.UTC(2026, 7, 27, 21, 0, 0);
  const secret = "0123456789abcdef0123456789abcdef";
  const token = createAdminSessionToken(secret, now);

  assert.equal(
    verifyAdminSessionToken(
      token,
      secret,
      now + (8 * 60 * 60 * 1000)
    ),
    false
  );
});

test("rejects missing or weak session secrets", async () => {
  const {
    createAdminSessionToken,
    verifyAdminSessionToken,
  } = await loadAdminAuth();

  assert.throws(() => createAdminSessionToken("", Date.now()));
  assert.throws(() => createAdminSessionToken("too-short", Date.now()));
  assert.equal(
    verifyAdminSessionToken("not-a-token", "too-short", Date.now()),
    false
  );
});

test("loads admin secrets only when both are configured", async () => {
  const { getAdminEnvironment } = await loadAdminAuth();
  const secret = "0123456789abcdef0123456789abcdef";

  assert.deepEqual(
    getAdminEnvironment({
      ADMIN_PASSWORD: "private-password",
      ADMIN_SESSION_SECRET: secret,
    }),
    {
      password: "private-password",
      sessionSecret: secret,
    }
  );

  assert.throws(() =>
    getAdminEnvironment({
      ADMIN_SESSION_SECRET: secret,
    })
  );

  assert.throws(() =>
    getAdminEnvironment({
      ADMIN_PASSWORD: "private-password",
    })
  );
});

test("extracts and verifies the admin session cookie from a cookie header", async () => {
  const {
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken,
    getAdminSessionTokenFromCookieHeader,
    isAdminCookieHeaderAuthenticated,
  } = await loadAdminAuth();

  const now = Date.UTC(2026, 7, 27, 21, 0, 0);
  const secret = "0123456789abcdef0123456789abcdef";
  const token = createAdminSessionToken(secret, now);
  const cookieHeader =
    `theme=dark; ${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; other=value`;

  assert.equal(
    getAdminSessionTokenFromCookieHeader(cookieHeader),
    token
  );
  assert.equal(
    isAdminCookieHeaderAuthenticated(cookieHeader, secret, now),
    true
  );
  assert.equal(
    isAdminCookieHeaderAuthenticated("theme=dark", secret, now),
    false
  );
  assert.equal(
    isAdminCookieHeaderAuthenticated(null, secret, now),
    false
  );
});
