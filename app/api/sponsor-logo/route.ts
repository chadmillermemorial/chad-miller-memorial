import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const fileId =
      request.nextUrl.searchParams.get("id")?.trim() || "";

    if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
      return NextResponse.json(
        { error: "Invalid sponsor logo." },
        { status: 400 }
      );
    }

    const driveUrl =
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
        fileId
      )}`;

    const response = await fetch(driveUrl, {
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Google Drive returned ${response.status}.`
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().startsWith("image/png")) {
      throw new Error(
        `Unexpected logo content type: ${contentType}`
      );
    }

    const image = await response.arrayBuffer();

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sponsor logo proxy failed:", error);

    return NextResponse.json(
      { error: "Sponsor logo unavailable." },
      { status: 502 }
    );
  }
}