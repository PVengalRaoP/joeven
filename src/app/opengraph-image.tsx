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
          background: "#1d2b36",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#04AA6D",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          JOEVEN.COM
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 20, lineHeight: 1.1 }}>
          Learn Autonomous AI Agents
        </div>
        <div style={{ fontSize: 28, marginTop: 24, color: "#c9d6de" }}>
          Python · Math · LLMs · Tools · RAG · Production
        </div>
      </div>
    ),
    size,
  );
}
