import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzwwzOmHMHnTlPmw8eOQ4RtzOAisgAmEjm1wxc-aK6_bplj8ZYFHxNuCrBSBJlym1UcDg/exec";

export async function GET() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getCapacity",
      }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.error || "Unable to retrieve tournament capacity."
      );
    }

    return NextResponse.json({
      ok: true,
      maxPlayers: result.maxPlayers,
      paidPlayers: result.paidPlayers,
      activeHolds: result.activeHolds,
      remaining: result.remaining,
      full: result.full,
    });
  } catch (error) {
    console.error("Capacity lookup error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to retrieve tournament capacity.",
      },
      { status: 500 }
    );
  }
}