import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/admin", request.url),
    303
  );

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    "",
    {
      ...getAdminSessionCookieOptions(
        process.env.NODE_ENV === "production"
      ),
      maxAge: 0,
    }
  );

  return response;
}
