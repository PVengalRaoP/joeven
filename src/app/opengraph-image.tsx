import { ImageResponse } from "next/og";

export const alt = "Joeven — Learn Autonomous AI Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#17141f",
          color: "#f7f3eb",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#9d94ff",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          Joeven academy
        </div>
        <div style={{ fontSize: 68, fontWeight: 600, marginTop: 18, lineHeight: 1.12 }}>
          Learn to build agents that actually do the work.
        </div>
        <div style={{ fontSize: 26, marginTop: 28, color: "#b2abbf" }}>
          Python · Math · LLMs · Tools · RAG · Production
        </div>
      </div>
    ),
    size,
  );
}
