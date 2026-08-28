import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  authenticateAdminLogin,
  getAdminSessionCookieOptions,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const submittedPassword =
      formData.get("password")?.toString() || "";

    const result = authenticateAdminLogin(
      submittedPassword,
      {
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET:
          process.env.ADMIN_SESSION_SECRET,
      }
    );

    if (!result.ok) {
      return NextResponse.redirect(
        new URL("/admin?error=invalid", request.url),
        303
      );
    }

    const response = NextResponse.redirect(
      new URL("/admin", request.url),
      303
    );

    response.cookies.set(
      ADMIN_SESSION_COOKIE_NAME,
      result.token,
      getAdminSessionCookieOptions(
        process.env.NODE_ENV === "production"
      )
    );

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.redirect(
      new URL("/admin?error=config", request.url),
      303
    );
  }
}
