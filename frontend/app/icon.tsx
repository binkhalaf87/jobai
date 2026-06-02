import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          J24
        </span>
      </div>
    ),
    { ...size },
  );
}
