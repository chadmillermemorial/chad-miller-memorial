import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    const shirtSize =
      formData.get("shirtSize")?.toString().trim() || "";

    const assignment =
      formData.get("assignment")?.toString().trim() || "";

    const notes =
      formData.get("notes")?.toString().trim() || "";

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !shirtSize ||
      !assignment
    ) {
      throw new Error("Required volunteer information is missing.");
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "volunteerRegistration",
        firstName,
        lastName,
        email,
        phone,
        shirtSize,
        assignment,
        notes,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.error || "Volunteer registration could not be saved."
      );
    }

    const origin = new URL(request.url).origin;

    return NextResponse.redirect(
      `${origin}/register/volunteer/confirmation`,
      303
    );
  } catch (error) {
    console.error("Volunteer registration error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "An unknown volunteer registration error occurred.",
      },
      { status: 500 }
    );
  }
}