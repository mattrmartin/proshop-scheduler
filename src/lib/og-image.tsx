import { ImageResponse } from "next/og";

export const alt = "Pro Shop Scheduler — Hayden Lake Country Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The link-preview (Open Graph / Twitter) card: the HLCC steel medallion over
 * the wordmark + tagline on the app's warm off-white. Shared by the
 * opengraph-image and twitter-image route conventions. The logo is fetched from
 * the deployed public asset so nothing has to be read off the filesystem.
 */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#eef1ea",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://proshop-scheduler.vercel.app/hlcc_steel_logo.png"
          width={232}
          height={192}
          style={{ objectFit: "contain" }}
          alt=""
        />
        <div
          style={{
            marginTop: 30,
            fontSize: 80,
            fontWeight: 700,
            color: "#18271d",
            letterSpacing: "-0.02em",
          }}
        >
          Pro Shop Scheduler
        </div>
        <div
          style={{
            display: "flex",
            width: 92,
            height: 6,
            backgroundColor: "#2f5d43",
            borderRadius: 999,
            marginTop: 24,
            marginBottom: 24,
          }}
        />
        <div style={{ fontSize: 34, color: "#586a5d" }}>
          Staff scheduling · Hayden Lake Country Club
        </div>
      </div>
    ),
    { ...size },
  );
}
