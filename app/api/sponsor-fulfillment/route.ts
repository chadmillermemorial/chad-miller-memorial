import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

async function postToGoogleScript(body: unknown) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseText = await response.text();

    try {
      return JSON.parse(responseText);
    } catch (error) {
      lastError = error;

      console.error(
        `Sponsor fulfillment upstream returned non-JSON response (attempt ${attempt}):`,
        {
          status: response.status,
          contentType: response.headers.get("content-type"),
          bodyPreview: responseText.slice(0, 200),
        }
      );

      if (attempt < 2) {
        continue;
      }
    }
  }

  throw (
    lastError ||
    new Error("Sponsor fulfillment service returned an invalid response.")
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const action = String(body.action || "").trim();

    if (
      action !== "getSponsorFulfillment" &&
      action !== "saveSponsorFulfillment"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid sponsor fulfillment action.",
        },
        { status: 400 }
      );
    }

    const result = await postToGoogleScript(body);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            result.error ||
            "Unable to process sponsor fulfillment request.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Sponsor fulfillment API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to process sponsor fulfillment request. Please try the sponsor link again.",
      },
      { status: 500 }
    );
  }
}
