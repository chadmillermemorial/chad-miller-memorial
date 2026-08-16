import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

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

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const result = await response.json();

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
          "Unable to process sponsor fulfillment request.",
      },
      { status: 500 }
    );
  }
}