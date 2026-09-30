import { ImageResponse } from "next/og";

export const socialSize = { width: 1200, height: 630 };
export const socialContentType = "image/png";

export function renderCoverGrailSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, rgb(9,9,11) 0%, rgb(24,24,27) 62%, rgb(69,48,8) 100%)",
          color: "white",
          padding: "72px 84px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              width: 82,
              height: 82,
              border: "3px solid rgb(251,191,36)",
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              color: "rgb(251,191,36)",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            CG
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>CoverGrail</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 970 }}>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1.03, fontWeight: 800 }}>
            Before you slab it, scan it.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 30,
              lineHeight: 1.35,
              color: "rgb(212,212,216)",
            }}
          >
            Pre-submission comic grade ranges, visible defect cues, and collector decision support.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgb(251,191,36)",
            letterSpacing: 1.4,
          }}
        >
          COVERGRAIL.NETLIFY.APP
        </div>
      </div>
    ),
    socialSize,
  );
}
