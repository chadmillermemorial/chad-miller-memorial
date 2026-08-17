import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=getApprovedSponsors`,
      {
        cache: "no-store",
        redirect: "follow",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Sponsor service returned ${response.status}.`
      );
    }

    const data = await response.json();

    if (!data || data.ok !== true || !Array.isArray(data.sponsors)) {
      throw new Error(
        "Sponsor service returned an invalid response."
      );
    }

    return NextResponse.json({
      ok: true,
      sponsors: data.sponsors,
    });
  } catch (error) {
    console.error(
      "Approved sponsor lookup failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        sponsors: [],
        error:
          "Approved sponsors are temporarily unavailable.",
      },
      {
        status: 500,
      }
    );
  }
}
