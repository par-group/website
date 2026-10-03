const WIDTH = 132;
const HEIGHT = 36;
const PAD = 6;

/**
 * The trend over finished weeks: a grey line, with the newest week's dot in the
 * accent. Hovering a week shows its value; the weekly table has every value too.
 */
export function Sparkline({ points, label }: { points: { value: number | null; title: string }[]; label: string }) {
  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (WIDTH - 2 * PAD) / (points.length - 1);
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => (max === min ? HEIGHT / 2 : HEIGHT - PAD - ((v - min) * (HEIGHT - 2 * PAD)) / (max - min));

  let path = "";
  let drawing = false;
  points.forEach((p, i) => {
    if (p.value === null) drawing = false;
    else {
      path += `${drawing ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`;
      drawing = true;
    }
  });
  const last = points.findLastIndex((p) => p.value !== null);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <path d={path} fill="none" stroke="var(--spark)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(points[last].value!)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      {points.map((p, i) =>
        p.value === null ? null : (
          <rect key={i} x={x(i) - step / 2} y={0} width={step} height={HEIGHT} fill="transparent">
            <title>{p.title}</title>
          </rect>
        ),
      )}
    </svg>
  );
}
