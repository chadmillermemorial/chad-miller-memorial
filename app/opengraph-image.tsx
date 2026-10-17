import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "CSM Chad Miller Memorial — Thank you for an incredible 2026 inaugural. October 8, 2027: Kings Grant, Fayetteville, NC.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoData = await readFile(
    join(process.cwd(), "app/icon.png"),
    "base64"
  );

  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#172033",
          color: "white",
          padding: "64px 76px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 12,
            background: "#2aa5a1",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: -100,
            bottom: -180,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "#176b87",
            opacity: 0.22,
            display: "flex",
          }}
        />

        <div
          style={{
            width: "70%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#2aa5a1",
              marginBottom: 22,
              display: "flex",
            }}
          >
            In Honor of Command Sergeant Major Chad Miller
          </div>

          <div
            style={{
              fontSize: 68,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>CSM Chad Miller</span>
            <span>Memorial Golf Tournament</span>
          </div>

          <div
            style={{
              width: 110,
              height: 6,
              background: "#2aa5a1",
              marginTop: 30,
              marginBottom: 28,
              display: "flex",
            }}
          />

          <div
            style={{
              fontSize: 27,
              lineHeight: 1.5,
              color: "#dceff3",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>2026 Inaugural · Thank you!</span>
            <span>October 8, 2027 · Kings Grant</span>
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 21,
              color: "#dceff3",
              display: "flex",
            }}
          >
            Supporting The Honor Foundation
          </div>
        </div>

        <div
          style={{
            width: "30%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 270,
              height: 270,
              borderRadius: 28,
              background: "white",
              padding: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            }}
          >
            <img
              src={logoSrc}
              width={234}
              height={234}
              alt=""
              style={{
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}