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

  assert.equal(verifyAdminPassword("alpha-test", "alpha-test"), true);
  assert.equal(verifyAdminPassword("beta-test", "alpha-test"), false);
  assert.equal(verifyAdminPassword("", "alpha-test"), false);
});

test("rejects missing configured admin password", async () => {
  const { verifyAdminPassword } = await loadAdminAuth();

  assert.throws(() => verifyAdminPassword("alpha-test", ""));
});

test("creates and verifies a signed eight-hour admin session", async () => {
  const {
    ADMIN_SESSION_MAX_AGE_SECONDS,
    createAdminSessionToken,
    verifyAdminSessionToken,
  } = await loadAdminAuth();

  const now = Date.UTC(2026, 7, 27, 21, 0, 0);
  const secret = "test-secret-0123456789-abcdefghijklmn";
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
  const secret = "test-secret-0123456789-abcdefghijklmn";
  const token = createAdminSessionToken(secret, now);
  const tampered = `${token.slice(0, -1)}${
    token.endsWith("a") ? "b" : "a"
  }`;

  assert.equal(verifyAdminSessionToken(tampered, secret, now), false);
  assert.equal(
    verifyAdminSessionToken(
      token,
      "other-test-secret-0123456789-abcdefghij",
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
  const secret = "test-secret-0123456789-abcdefghijklmn";
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
  assert.throws(() => createAdminSessionToken("short-test", Date.now()));
  assert.equal(
    verifyAdminSessionToken("not-a-token", "short-test", Date.now()),
    false
  );
});

test("loads admin secrets only when both are configured", async () => {
  const { getAdminEnvironment } = await loadAdminAuth();
  const secret = "test-secret-0123456789-abcdefghijklmn";

  assert.deepEqual(
    getAdminEnvironment({
      ADMIN_PASSWORD: "alpha-test",
      ADMIN_SESSION_SECRET: secret,
    }),
    {
      password: "alpha-test",
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
      ADMIN_PASSWORD: "alpha-test",
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
  const secret = "test-secret-0123456789-abcdefghijklmn";
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

test("accepts the correct admin password and mints a valid session", async () => {
  const {
    authenticateAdminLogin,
    verifyAdminSessionToken,
  } = await loadAdminAuth();

  const now = Date.UTC(2026, 7, 27, 22, 0, 0);
  const sessionSecret =
    "test-secret-0123456789-abcdefghijklmn";

  const result = authenticateAdminLogin(
    "alpha-test",
    {
      ADMIN_PASSWORD: "alpha-test",
      ADMIN_SESSION_SECRET: sessionSecret,
    },
    now
  );

  assert.equal(result.ok, true);
  assert.equal(typeof result.token, "string");
  assert.equal(
    verifyAdminSessionToken(result.token, sessionSecret, now),
    true
  );
});

test("rejects an incorrect admin password without minting a session", async () => {
  const { authenticateAdminLogin } = await loadAdminAuth();

  const result = authenticateAdminLogin(
    "beta-test",
    {
      ADMIN_PASSWORD: "alpha-test",
      ADMIN_SESSION_SECRET:
        "test-secret-0123456789-abcdefghijklmn",
    }
  );

  assert.deepEqual(result, {
    ok: false,
    token: "",
  });
});

test("uses a restrictive admin session cookie", async () => {
  const {
    ADMIN_SESSION_MAX_AGE_SECONDS,
    getAdminSessionCookieOptions,
  } = await loadAdminAuth();

  assert.deepEqual(
    getAdminSessionCookieOptions(true),
    {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    }
  );

  assert.equal(
    getAdminSessionCookieOptions(false).secure,
    false
  );
});
