// The app icon, two overlapping circles (you and your sidekick) on teal, as an
// element for `ImageResponse` (next/og), which needs inline styles rather than
// classes. Geometry matches src/app/icon.svg (a 64-unit square); keep them in sync.
// Copied from the app (app-demo/src/components/brand).

const TEAL = "#0F766E";
const CREAM = "#F7FAF9";
const AMBER = "#F5B83D";

// [cx, cy, r] in the 64-unit square.
const CIRCLES: [number, number, number, string][] = [
  [25, 35, 14, CREAM],
  [40, 29, 12, AMBER],
];

/**
 * @param size    Output size in pixels.
 * @param scale   Shrinks the artwork toward the centre; maskable icons use less
 *                than 1 so launchers can crop to any shape without clipping it.
 * @param rounded Rounded corners. Leave off for the Apple touch icon (iOS rounds it).
 */
export function AppIconArt({ size, scale = 1, rounded = false }: { size: number; scale?: number; rounded?: boolean }) {
  const unit = size / 64;
  const at = (v: number) => (32 + (v - 32) * scale) * unit;
  return (
    <div style={{ width: size, height: size, display: "flex", position: "relative", background: TEAL, borderRadius: rounded ? 14 * unit : 0 }}>
      {CIRCLES.map(([cx, cy, r, color]) => (
        <div
          key={color}
          style={{
            position: "absolute",
            left: at(cx) - r * scale * unit,
            top: at(cy) - r * scale * unit,
            width: 2 * r * scale * unit,
            height: 2 * r * scale * unit,
            borderRadius: "50%",
            background: color,
          }}
        />
      ))}
    </div>
  );
}
