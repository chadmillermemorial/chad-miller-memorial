import { NextResponse } from "next/server";

export const runtime = "nodejs";

const googleScriptInternalKey =
  process.env.GOOGLE_SCRIPT_INTERNAL_KEY;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

export async function GET(
  request: Request
) {
  const url =
    new URL(request.url);

  const holdId =
    url.searchParams
      .get("holdId")
      ?.trim() || "";

  if (
    holdId &&
    googleScriptInternalKey
  ) {
    try {
      const response =
        await fetch(
          GOOGLE_SCRIPT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "releaseSponsorCapacity",

                holdId,

                internalKey:
                  googleScriptInternalKey,
              }),
          }
        );

      if (!response.ok) {
        console.error(
          "Sponsor capacity release returned status:",
          response.status
        );
      } else {
        const result =
          await response.json();

        if (!result.ok) {
          console.error(
            "Sponsor capacity release was rejected:",
            result
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to release canceled sponsor capacity hold:",
        error
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      "/sponsors",
      url.origin
    ),
    303
  );
}