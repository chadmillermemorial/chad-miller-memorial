import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const holdId = url.searchParams.get("holdId")?.trim() || "";
  const waitlistId = url.searchParams.get("waitlistId")?.trim() || "";
  const offerToken = url.searchParams.get("offerToken")?.trim() || "";

  if (holdId) {
    try {
      await releaseCapacityHold(holdId);
    } catch (error) {
      console.error(
        "Unable to release canceled player capacity hold after retries:",
        error
      );
    }
  }

  const returnUrl = new URL("/register/player", url.origin);

  if (waitlistId && offerToken) {
    returnUrl.searchParams.set("waitlistId", waitlistId);
    returnUrl.searchParams.set("offerToken", offerToken);
  }

  return NextResponse.redirect(returnUrl, 303);
}

async function releaseCapacityHold(holdId: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "releaseCapacity",
          holdId,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Capacity release returned status ${response.status}.`
        );
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(
          result.error || result.message || "Capacity release was rejected."
        );
      }

      return;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to release capacity hold.");
}
