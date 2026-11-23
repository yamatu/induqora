import { ImageResponse } from "next/og";

export function brandSquare(size: number) {
  const u = size / 32;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0f172a", position: "relative" }}>
        <div style={{ position: "absolute", left: 6.5 * u, top: 8 * u, width: 4 * u, height: 16 * u, background: "#f59e0b", borderRadius: u }} />
        <div
          style={{
            position: "absolute",
            left: 14 * u - 1.5 * u,
            top: 9.5 * u - 1.5 * u,
            width: 14 * u,
            height: 14 * u,
            border: `${3 * u}px solid #ffffff`,
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 23.2 * u,
            top: 19 * u,
            width: 3 * u,
            height: 6 * u,
            background: "#38bdf8",
            borderRadius: 1.5 * u,
            transform: "rotate(-34deg)",
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
