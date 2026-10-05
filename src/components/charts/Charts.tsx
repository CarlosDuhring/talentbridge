export function BarChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = 100;
  const barW = 100 / Math.max(data.length, 1);
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Gráfico de barras"
      >
        {[25, 50, 75].map((g) => (
          <line
            key={g}
            x1="0"
            x2="100"
            y1={height - (g / max) * height}
            y2={height - (g / max) * height}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.5"
          />
        ))}
        {data.map((d, i) => {
          const h = (Math.max(0, Math.min(100, d.value)) / max) * height;
          const x = i * barW + barW * 0.2;
          const w = barW * 0.6;
          const color =
            d.value >= 85
              ? "#2f9e5f"
              : d.value >= 70
                ? "#0075de"
                : d.value >= 50
                  ? "#ffb110"
                  : "#e32d14";
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={height - h}
                width={w}
                height={h}
                rx="1.5"
                fill={color}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex w-full">
        {data.map((d) => (
          <div
            key={d.label}
            className="truncate px-0.5 text-center text-[11px] text-graphite"
            style={{ width: `${barW}%` }}
            title={`${d.label}: ${Math.round(d.value)}/100`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutScore({
  value,
  size = 140,
  label = "Geral",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const color =
    v >= 85 ? "#2f9e5f" : v >= 70 ? "#0075de" : v >= 50 ? "#ffb110" : "#e32d14";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" width={size} height={size} className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-semibold tabular-nums leading-none">
          {Math.round(v)}
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-wide text-stone">
          {label}
        </span>
      </div>
    </div>
  );
}

export function LineChart({
  data,
  height = 160,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const W = 300;
  const padX = 8;
  const padY = 12;
  const innerW = W - padX * 2;
  const innerH = height - padY * 2;
  const n = data.length;
  const x = (i: number) => padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padY + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Evolução da pontuação"
      >
        {[25, 50, 75].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={y(g)}
            y2={y(g)}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />
        ))}
        {n > 1 ? (
          <polyline
            points={points}
            fill="none"
            stroke="#0075de"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill="#0075de" />
        ))}
      </svg>
      <div className="mt-2 flex w-full justify-between text-[11px] text-graphite">
        {data.map((d, i) => (
          <span key={i} className="truncate px-0.5" title={`${d.label}: ${Math.round(d.value)}/100`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RadarChart({
  data,
  size = 260,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const cx = 130;
  const cy = 130;
  const R = 90;
  const n = Math.max(data.length, 3);
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rad = (Math.max(0, Math.min(100, v)) / 100) * R;
    return [cx + rad * Math.cos(angle(i)), cy + rad * Math.sin(angle(i))];
  };
  const poly = data.map((d, i) => point(i, d.value).join(",")).join(" ");
  return (
    <svg viewBox="0 0 260 260" width={size} height={size} role="img" aria-label="Gráfico radar de competências">
      {[25, 50, 75, 100].map((g) => (
        <polygon
          key={g}
          points={data
            .map((_, i) => point(i, g).join(","))
            .join(" ")}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth="1"
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 100);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
        );
      })}
      <polygon points={poly} fill="rgba(0,117,222,0.15)" stroke="#0075de" strokeWidth="2" />
      {data.map((d, i) => {
        const [x, y] = point(i, d.value);
        return <circle key={d.label} cx={x} cy={y} r="3" fill="#0075de" />;
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, 118);
        return (
          <text
            key={d.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#615d59"
          >
            {d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label}
          </text>
        );
      })}
    </svg>
  );
}
