import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/brand/AppIconArt";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Preview card shown when a Sidekick link is shared in messages and social apps. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F7FAF9", color: "#0F2A2E", padding: 80, position: "relative" }}>
        <div style={{ position: "absolute", right: -120, bottom: -160, width: 560, height: 560, borderRadius: "50%", background: "#E3F4F1", display: "flex" }} />
        <div style={{ position: "absolute", right: 150, top: -90, width: 260, height: 260, borderRadius: "50%", background: "#FDF1DA", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", borderRadius: 28, overflow: "hidden" }}>
              <AppIconArt size={112} rounded />
            </div>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2, display: "flex" }}>
              side<span style={{ color: "#0F766E" }}>kick</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, display: "flex", flexWrap: "wrap" }}>
              Find your people&nbsp;<span style={{ color: "#115E59" }}>at York.</span>
            </div>
            <div style={{ fontSize: 34, color: "#4F6E6B", marginTop: 24, display: "flex" }}>Friends, not dates · Join the waitlist</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
