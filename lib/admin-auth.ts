import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME =
  "cmm_admin_session";

export const ADMIN_SESSION_MAX_AGE_SECONDS =
  8 * 60 * 60;

const MIN_SESSION_SECRET_LENGTH = 32;

type AdminEnvironmentSource = {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

function digest(value: string) {
  return createHash("sha256")
    .update(value, "utf8")
    .digest();
}

function hasValidSessionSecret(secret: string) {
  return secret.length >= MIN_SESSION_SECRET_LENGTH;
}

function sessionSignature(
  expiresAtSeconds: number,
  secret: string
) {
  return createHmac("sha256", secret)
    .update(String(expiresAtSeconds), "utf8")
    .digest("base64url");
}

export function getAdminEnvironment(
  source: AdminEnvironmentSource
) {
  const password =
    source.ADMIN_PASSWORD?.trim() || "";

  const sessionSecret =
    source.ADMIN_SESSION_SECRET?.trim() || "";

  if (!password) {
    throw new Error(
      "Admin password is not configured."
    );
  }

  if (!hasValidSessionSecret(sessionSecret)) {
    throw new Error(
      "Admin session secret is not configured securely."
    );
  }

  return {
    password,
    sessionSecret,
  };
}

export function verifyAdminPassword(
  submittedPassword: string,
  configuredPassword: string
) {
  if (!configuredPassword) {
    throw new Error(
      "Admin password is not configured."
    );
  }

  const submittedDigest =
    digest(submittedPassword);

  const configuredDigest =
    digest(configuredPassword);

  return timingSafeEqual(
    submittedDigest,
    configuredDigest
  );
}

export function createAdminSessionToken(
  secret: string,
  nowMs = Date.now()
) {
  if (!hasValidSessionSecret(secret)) {
    throw new Error(
      "Admin session secret must contain at least 32 characters."
    );
  }

  const expiresAtSeconds =
    Math.floor(nowMs / 1000) +
    ADMIN_SESSION_MAX_AGE_SECONDS;

  const signature =
    sessionSignature(
      expiresAtSeconds,
      secret
    );

  return `${expiresAtSeconds}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret: string,
  nowMs = Date.now()
) {
  if (
    !token ||
    !hasValidSessionSecret(secret)
  ) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [expiresText, providedSignature] =
    parts;

  const expiresAtSeconds =
    Number(expiresText);

  if (
    !Number.isInteger(expiresAtSeconds) ||
    expiresAtSeconds <= 0 ||
    nowMs >= expiresAtSeconds * 1000
  ) {
    return false;
  }

  const expectedSignature =
    sessionSignature(
      expiresAtSeconds,
      secret
    );

  const provided = Buffer.from(
    providedSignature,
    "utf8"
  );

  const expected = Buffer.from(
    expectedSignature,
    "utf8"
  );

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(
    provided,
    expected
  );
}

export function authenticateAdminLogin(
  submittedPassword: string,
  source: AdminEnvironmentSource,
  nowMs = Date.now()
) {
  const {
    password,
    sessionSecret,
  } = getAdminEnvironment(source);

  if (
    !verifyAdminPassword(
      submittedPassword,
      password
    )
  ) {
    return {
      ok: false as const,
      token: "",
    };
  }

  return {
    ok: true as const,
    token: createAdminSessionToken(
      sessionSecret,
      nowMs
    ),
  };
}

export function getAdminSessionCookieOptions(
  isProduction: boolean
) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function getAdminSessionTokenFromCookieHeader(
  cookieHeader: string | null
) {
  if (!cookieHeader) {
    return "";
  }

  const prefix =
    `${ADMIN_SESSION_COOKIE_NAME}=`;

  const encodedValue =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) =>
        part.startsWith(prefix)
      )
      ?.slice(prefix.length) || "";

  if (!encodedValue) {
    return "";
  }

  try {
    return decodeURIComponent(encodedValue);
  } catch {
    return "";
  }
}

export function isAdminCookieHeaderAuthenticated(
  cookieHeader: string | null,
  secret: string,
  nowMs = Date.now()
) {
  const token =
    getAdminSessionTokenFromCookieHeader(
      cookieHeader
    );

  return verifyAdminSessionToken(
    token,
    secret,
    nowMs
  );
}
