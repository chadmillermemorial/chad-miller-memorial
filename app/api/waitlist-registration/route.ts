import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzwwzOmHMHnTlPmw8eOQ4RtzOAisgAmEjm1wxc-aK6_bplj8ZYFHxNuCrBSBJlym1UcDg/exec";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const firstName =
      formData.get("firstName")?.toString().trim() || "";

    const lastName =
      formData.get("lastName")?.toString().trim() || "";

    const email =
      formData.get("email")?.toString().trim() || "";

    const phone =
      formData.get("phone")?.toString().trim() || "";

    const playersRequested = Number(
      formData.get("playersRequested")?.toString().trim() || "0"
    );

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !Number.isInteger(playersRequested) ||
      playersRequested < 1 ||
      playersRequested > 4
    ) {
      throw new Error(
        "Required waitlist information is missing or invalid."
      );
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "waitlistRegistration",
        firstName,
        lastName,
        email,
        phone,
        playersRequested,
      }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.error || "Waitlist registration could not be saved."
      );
    }

    const origin = new URL(request.url).origin;

    return NextResponse.redirect(
      `${origin}/register/player/waitlist-confirmation`,
      303
    );
  } catch (error) {
    console.error("Waitlist registration error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Waitlist registration could not be completed.",
      },
      { status: 500 }
    );
  }
}