import type { ReactNode } from "react";
import { VIZ_TONES, type VizKind, type VizSpec } from "@/lib/viz";

const W = 640;
const H = 360;

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const a = Math.abs(n);
  if (a >= 100) return String(Math.round(n));
  if (a >= 10) return n.toFixed(1).replace(/\.0$/, "");
  if (a >= 1) return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function ticks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min];
  const span = max - min;
  const raw = span / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(Math.abs(raw) || 1));
  const nice = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= raw) || mag * 10;
  const start = Math.ceil(min / nice - 1e-9) * nice;
  const out: number[] = [];
  for (let v = start; v <= max + nice * 1e-6; v += nice) {
    out.push(Number(v.toFixed(10)));
    if (out.length > 12) break;
  }
  return out.length ? out : [min, max];
}

function rangeOf(
  xs: number[],
  pad = 0.08,
  locked?: { min?: number; max?: number },
): [number, number] {
  let lo = locked?.min;
  let hi = locked?.max;
  if (lo === undefined || hi === undefined) {
    const finite = xs.filter(Number.isFinite);
    if (!finite.length) return [-1, 1];
    const mn = Math.min(...finite);
    const mx = Math.max(...finite);
    const span = mx - mn || Math.abs(mx) || 1;
    if (lo === undefined) lo = mn - span * pad;
    if (hi === undefined) hi = mx + span * pad;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  return [lo, hi];
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function Frame({
  title,
  caption,
  children,
  kind,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  kind: VizKind;
}) {
  const label = title || "Figure";
  return (
    <figure className="lesson-viz my-6 overflow-hidden rounded-2xl border border-line bg-panel">
      {title ? (
        <figcaption className="border-b border-line px-4 py-2.5 font-medium text-ink">
          {title}
        </figcaption>
      ) : null}
      <div className="px-2 py-3 sm:px-4">{children}</div>
      {caption ? (
        <p className="border-t border-line px-4 py-2.5 text-sm text-muted">{caption}</p>
      ) : !title ? (
        <span className="sr-only">{kind} diagram</span>
      ) : null}
      <span className="sr-only">{label}</span>
    </figure>
  );
}

function Plot({ spec }: { spec: VizSpec }) {
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = spec.xlabel ? 44 : 36;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const s of spec.series) {
    for (const [x, y] of s.points) {
      xs.push(x);
      ys.push(y);
    }
  }
  for (const m of spec.marks) {
    xs.push(m.x);
    ys.push(m.y);
  }
  for (const v of spec.vlines) xs.push(v.x);
  for (const h of spec.hlines) ys.push(h.y);
  const [xmin, xmax] = rangeOf(xs, 0.06, { min: spec.xmin, max: spec.xmax });
  const [ymin, ymax] = rangeOf(ys, 0.1, { min: spec.ymin, max: spec.ymax });
  const sx = (x: number) => padL + ((x - xmin) / (xmax - xmin)) * (W - padL - padR);
  const sy = (y: number) => padT + ((ymax - y) / (ymax - ymin)) * (H - padT - padB);
  const xt = ticks(xmin, xmax);
  const yt = ticks(ymin, ymax);
  const clip = uid("pc");
  const zeroX = xmin <= 0 && xmax >= 0;
  const zeroY = ymin <= 0 && ymax >= 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={spec.title || "Graph"}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={padL} y={padT} width={W - padL - padR} height={H - padT - padB} />
        </clipPath>
      </defs>
      {xt.map((t) => (
        <g key={`x${t}`}>
          <line
            x1={sx(t)}
            x2={sx(t)}
            y1={padT}
            y2={H - padB}
            stroke="var(--jv-line)"
            strokeWidth="1"
          />
          <text
            x={sx(t)}
            y={H - padB + 16}
            textAnchor="middle"
            fill="var(--jv-muted)"
            fontSize="11"
          >
            {fmt(t)}
          </text>
        </g>
      ))}
      {yt.map((t) => (
        <g key={`y${t}`}>
          <line
            x1={padL}
            x2={W - padR}
            y1={sy(t)}
            y2={sy(t)}
            stroke="var(--jv-line)"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={sy(t) + 4}
            textAnchor="end"
            fill="var(--jv-muted)"
            fontSize="11"
          >
            {fmt(t)}
          </text>
        </g>
      ))}
      {zeroY ? (
        <line
          x1={padL}
          x2={W - padR}
          y1={sy(0)}
          y2={sy(0)}
          stroke="var(--jv-ink)"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
      ) : null}
      {zeroX ? (
        <line
          x1={sx(0)}
          x2={sx(0)}
          y1={padT}
          y2={H - padB}
          stroke="var(--jv-ink)"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
      ) : null}
      <g clipPath={`url(#${clip})`}>
        {spec.tangents.map((t, i) => {
          const dx = (xmax - xmin) * 0.18;
          const x0 = t.x - dx;
          const x1 = t.x + dx;
          const y0 = t.y - t.slope * dx;
          const y1 = t.y + t.slope * dx;
          return (
            <line
              key={`tan${i}`}
              x1={sx(x0)}
              y1={sy(y0)}
              x2={sx(x1)}
              y2={sy(y1)}
              stroke={VIZ_TONES[1]}
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          );
        })}
        {spec.series.map((s, i) => {
          const d = s.points
            .map((p, j) => `${j === 0 ? "M" : "L"}${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`)
            .join(" ");
          return (
            <path
              key={s.name + i}
              d={d}
              fill="none"
              stroke={VIZ_TONES[i % 4]}
              strokeWidth="2.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
        {spec.vlines.map((v, i) => (
          <line
            key={`v${i}`}
            x1={sx(v.x)}
            x2={sx(v.x)}
            y1={padT}
            y2={H - padB}
            stroke={VIZ_TONES[2]}
            strokeDasharray="4 4"
            strokeWidth="1.6"
          />
        ))}
        {spec.hlines.map((h, i) => (
          <line
            key={`h${i}`}
            x1={padL}
            x2={W - padR}
            y1={sy(h.y)}
            y2={sy(h.y)}
            stroke={VIZ_TONES[2]}
            strokeDasharray="4 4"
            strokeWidth="1.6"
          />
        ))}
        {spec.marks.map((m, i) => (
          <g key={`m${i}`}>
            <circle cx={sx(m.x)} cy={sy(m.y)} r="5" fill={VIZ_TONES[1]} />
            {m.label ? (
              <text
                x={sx(m.x) + 8}
                y={sy(m.y) - 8}
                fill="var(--jv-ink)"
                fontSize="12"
                fontWeight="600"
              >
                {m.label}
              </text>
            ) : null}
          </g>
        ))}
      </g>
      {spec.xlabel ? (
        <text
          x={(padL + W - padR) / 2}
          y={H - 8}
          textAnchor="middle"
          fill="var(--jv-muted)"
          fontSize="12"
        >
          {spec.xlabel}
        </text>
      ) : null}
      {spec.ylabel ? (
        <text
          transform={`translate(14 ${(padT + H - padB) / 2}) rotate(-90)`}
          textAnchor="middle"
          fill="var(--jv-muted)"
          fontSize="12"
        >
          {spec.ylabel}
        </text>
      ) : null}
      {spec.series.length > 1 ? (
        <g>
          {spec.series.map((s, i) => (
            <g key={`leg${i}`} transform={`translate(${padL + i * 120}, ${padT + 6})`}>
              <line x1="0" x2="16" y1="0" y2="0" stroke={VIZ_TONES[i % 4]} strokeWidth="3" />
              <text x="20" y="4" fill="var(--jv-ink)" fontSize="11">
                {s.name}
              </text>
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

function Bars({ spec }: { spec: VizSpec }) {
  const bars = spec.bars;
  if (!bars.length) return null;
  const max = Math.max(...bars.map((b) => Math.abs(b.value)), 1e-6);
  const padL = 16;
  const padR = 16;
  const padT = 32;
  const padB = 48;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const gap = 10;
  const bw = Math.min(72, (innerW - gap * bars.length) / bars.length);
  const total = bw * bars.length + gap * (bars.length - 1);
  const x0 = padL + (innerW - total) / 2;
  const usable = Math.max(innerH - 4, 40);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={spec.title || "Bar chart"}>
      {bars.map((b, i) => {
        const h = (Math.abs(b.value) / max) * usable;
        const x = x0 + i * (bw + gap);
        const y = padT + innerH - h;
        return (
          <g key={b.label + i}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={Math.max(h, 2)}
              rx="8"
              fill={VIZ_TONES[b.tone % 4]}
              fillOpacity="0.9"
            />
            <text
              x={x + bw / 2}
              y={y - 8}
              textAnchor="middle"
              fill="var(--jv-ink)"
              fontSize="12"
              fontWeight="600"
            >
              {fmt(b.value)}
            </text>
            <text
              x={x + bw / 2}
              y={H - 18}
              textAnchor="middle"
              fill="var(--jv-muted)"
              fontSize="12"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Scatter({ spec }: { spec: VizSpec }) {
  const dots = spec.dots;
  const xs = dots.map((d) => d.x);
  const ys = dots.map((d) => d.y);
  const padL = 48;
  const padR = 24;
  const padT = 20;
  const padB = 40;
  const [xmin, xmax] = rangeOf(xs, 0.12, { min: spec.xmin, max: spec.xmax });
  const [ymin, ymax] = rangeOf(ys, 0.12, { min: spec.ymin, max: spec.ymax });
  const sx = (x: number) => padL + ((x - xmin) / (xmax - xmin)) * (W - padL - padR);
  const sy = (y: number) => padT + ((ymax - y) / (ymax - ymin)) * (H - padT - padB);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={spec.title || "Scatter plot"}>
      <line x1={sx(xmin)} x2={sx(xmax)} y1={sy(0)} y2={sy(0)} stroke="var(--jv-line)" />
      <line x1={sx(0)} x2={sx(0)} y1={sy(ymin)} y2={sy(ymax)} stroke="var(--jv-line)" />
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={sx(d.x)} cy={sy(d.y)} r="8" fill={VIZ_TONES[d.tone % 4]} fillOpacity="0.92" />
          {d.label ? (
            <text
              x={sx(d.x) + 10}
              y={sy(d.y) - 8}
              fill="var(--jv-ink)"
              fontSize="12"
              fontWeight="600"
            >
              {d.label}
            </text>
          ) : null}
        </g>
      ))}
      {spec.xlabel ? (
        <text x={W / 2} y={H - 8} textAnchor="middle" fill="var(--jv-muted)" fontSize="12">
          {spec.xlabel}
        </text>
      ) : null}
    </svg>
  );
}

function Vecs({ spec }: { spec: VizSpec }) {
  const vecs = spec.vecs;
  const xs = vecs.flatMap((v) => [0, v.x]);
  const ys = vecs.flatMap((v) => [0, v.y]);
  const pad = 48;
  const [xmin, xmax] = rangeOf(xs, 0.18);
  const [ymin, ymax] = rangeOf(ys, 0.18);
  const sx = (x: number) => pad + ((x - xmin) / (xmax - xmin)) * (W - pad * 2);
  const sy = (y: number) => pad + ((ymax - y) / (ymax - ymin)) * (H - pad * 2);
  const marker = uid("arr");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={spec.title || "Vectors"}>
      <defs>
        {VIZ_TONES.map((c, i) => (
          <marker
            key={i}
            id={`${marker}-${i}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
      </defs>
      <line x1={sx(xmin)} x2={sx(xmax)} y1={sy(0)} y2={sy(0)} stroke="var(--jv-line)" />
      <line x1={sx(0)} x2={sx(0)} y1={sy(ymin)} y2={sy(ymax)} stroke="var(--jv-line)" />
      <circle cx={sx(0)} cy={sy(0)} r="3.5" fill="var(--jv-ink)" />
      {vecs.map((v, i) => (
        <g key={i}>
          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(v.x)}
            y2={sy(v.y)}
            stroke={VIZ_TONES[v.tone % 4]}
            strokeWidth="2.8"
            markerEnd={`url(#${marker}-${v.tone % 4})`}
          />
          <text
            x={sx(v.x) + (v.x >= 0 ? 10 : -10)}
            y={sy(v.y) - 8}
            textAnchor={v.x >= 0 ? "start" : "end"}
            fill="var(--jv-ink)"
            fontSize="12"
            fontWeight="600"
          >
            {v.label || `(${fmt(v.x)}, ${fmt(v.y)})`}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Flow({ spec }: { spec: VizSpec }) {
  const nodes = spec.nodes;
  if (!nodes.length) return null;
  const n = nodes.length;
  const marker = uid("fe");
  const pos = new Map<string, { x: number; y: number }>();
  const boxW = spec.layout === "tb" ? 220 : Math.min(150, (W - 40) / Math.max(n, 1) - 8);
  const boxH = spec.layout === "cycle" ? 56 : 52;
  if (spec.layout === "cycle") {
    const cx = W / 2;
    const cy = H / 2;
    const rx = 210;
    const ry = 120;
    nodes.forEach((node, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      pos.set(node.id, { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    });
  } else if (spec.layout === "tb") {
    const gap = (H - 40) / n;
    nodes.forEach((node, i) => pos.set(node.id, { x: W / 2, y: 28 + gap * i }));
  } else {
    const gap = (W - 32) / n;
    nodes.forEach((node, i) => pos.set(node.id, { x: 16 + gap * i + gap / 2, y: H / 2 }));
  }
  const edges =
    spec.edges.length > 0
      ? spec.edges
      : nodes.slice(0, -1).map((node, i) => ({
          from: node.id,
          to: nodes[i + 1].id,
          label: "",
        }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={spec.title || "Flow diagram"}>
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--jv)" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return null;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const gap = boxW * 0.42;
        const x1 = a.x + ux * gap;
        const y1 = a.y + uy * (boxH * 0.55);
        const x2 = b.x - ux * gap;
        const y2 = b.y - uy * (boxH * 0.55);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--jv)"
              strokeWidth="2"
              markerEnd={`url(#${marker})`}
            />
            {e.label ? (
              <text x={mx} y={my - 6} textAnchor="middle" fill="var(--jv-muted)" fontSize="11">
                {e.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {nodes.map((node) => {
        const p = pos.get(node.id);
        if (!p) return null;
        return (
          <g key={node.id}>
            <rect
              x={p.x - boxW / 2}
              y={p.y - boxH / 2}
              width={boxW}
              height={boxH}
              rx="12"
              fill="var(--jv-code)"
              stroke="var(--jv)"
              strokeWidth="1.8"
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fill="var(--jv-ink)"
              fontSize="13"
              fontWeight="600"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Loop({ spec }: { spec: VizSpec }) {
  const steps = spec.steps.length ? spec.steps : spec.nodes.map((n) => n.label);
  const clone: VizSpec = {
    ...spec,
    layout: "cycle",
    nodes: steps.map((s, i) => ({ id: `s${i}`, label: s })),
    edges: [
      ...steps.slice(0, -1).map((_, i) => ({
        from: `s${i}`,
        to: `s${i + 1}`,
        label: "",
      })),
      ...(steps.length > 1
        ? [{ from: `s${steps.length - 1}`, to: "s0", label: spec.caption ? "" : "again" }]
        : []),
    ],
  };
  return <Flow spec={clone} />;
}

function GridHeat({ spec, heat }: { spec: VizSpec; heat: boolean }) {
  const grid = spec.grid;
  if (!grid.length) return null;
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));
  const labels = spec.gridLabels;
  const pad = 56;
  const cw = (W - pad * 1.4) / cols;
  const ch = (H - pad * 1.2) / rows;
  const all = grid.flat();
  const mx = Math.max(...all.map(Math.abs), 1e-6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={spec.title || "Grid"}>
      {grid.map((row, r) =>
        row.map((v, c) => {
          const x = pad + c * cw;
          const y = 28 + r * ch;
          const t = Math.abs(v) / mx;
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x + 4}
                y={y + 4}
                width={cw - 8}
                height={ch - 8}
                rx="10"
                fill="var(--jv)"
                fillOpacity={heat ? 0.12 + t * 0.78 : 0.12}
                stroke="var(--jv-line)"
              />
              <text
                x={x + cw / 2}
                y={y + ch / 2 + 5}
                textAnchor="middle"
                fill="var(--jv-ink)"
                fontSize="14"
                fontWeight="600"
              >
                {fmt(v)}
              </text>
            </g>
          );
        }),
      )}
      {labels.map((lab, i) => (
        <text
          key={lab + i}
          x={pad + i * cw + cw / 2}
          y={22}
          textAnchor="middle"
          fill="var(--jv-muted)"
          fontSize="12"
        >
          {lab}
        </text>
      ))}
    </svg>
  );
}

function Strip({ spec }: { spec: VizSpec }) {
  const chips = spec.chips.length ? spec.chips : spec.steps;
  const n = Math.max(chips.length, 1);
  const pad = 24;
  const cw = Math.min(140, (W - pad * 2) / n - 8);
  const total = n * cw + (n - 1) * 10;
  const x0 = (W - total) / 2;
  return (
    <svg viewBox={`0 0 ${W} 120`} className="h-auto w-full" role="img" aria-label={spec.title || "Sequence"}>
      {chips.map((c, i) => (
        <g key={i}>
          <rect
            x={x0 + i * (cw + 10)}
            y={34}
            width={cw}
            height="48"
            rx="12"
            fill="var(--jv-code)"
            stroke="var(--jv)"
            strokeWidth="1.6"
          />
          <text
            x={x0 + i * (cw + 10) + cw / 2}
            y={64}
            textAnchor="middle"
            fill="var(--jv-ink)"
            fontSize="13"
            fontWeight="600"
          >
            {c}
          </text>
          {i < n - 1 ? (
            <text
              x={x0 + i * (cw + 10) + cw + 5}
              y={64}
              fill="var(--jv-muted)"
              fontSize="14"
            >
              →
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

export function LessonViz({ spec }: { spec: VizSpec }) {
  let inner: ReactNode = null;
  if (spec.kind === "plot") inner = <Plot spec={spec} />;
  else if (spec.kind === "bars") inner = <Bars spec={spec} />;
  else if (spec.kind === "scatter") inner = <Scatter spec={spec} />;
  else if (spec.kind === "vecs") inner = <Vecs spec={spec} />;
  else if (spec.kind === "flow") inner = <Flow spec={spec} />;
  else if (spec.kind === "loop") inner = <Loop spec={spec} />;
  else if (spec.kind === "grid") inner = <GridHeat spec={spec} heat={false} />;
  else if (spec.kind === "heat") inner = <GridHeat spec={spec} heat />;
  else if (spec.kind === "strip") inner = <Strip spec={spec} />;
  if (!inner) return null;
  return (
    <Frame title={spec.title} caption={spec.caption} kind={spec.kind}>
      {inner}
    </Frame>
  );
}
