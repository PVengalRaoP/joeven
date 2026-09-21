export type VizKind =
  | "plot"
  | "bars"
  | "scatter"
  | "flow"
  | "vecs"
  | "grid"
  | "loop"
  | "strip"
  | "heat";

export type VizSeries = { name: string; points: [number, number][] };
export type VizMark = { x: number; y: number; label: string };
export type VizBar = { label: string; value: number; tone: number };
export type VizDot = { x: number; y: number; label: string; tone: number };
export type VizVec = { x: number; y: number; label: string; tone: number };
export type VizNode = { id: string; label: string };
export type VizEdge = { from: string; to: string; label: string };

export type VizSpec = {
  kind: VizKind;
  title: string;
  caption: string;
  xlabel: string;
  ylabel: string;
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
  series: VizSeries[];
  marks: VizMark[];
  vlines: { x: number; label: string }[];
  hlines: { y: number; label: string }[];
  tangents: { x: number; y: number; slope: number }[];
  bars: VizBar[];
  dots: VizDot[];
  vecs: VizVec[];
  nodes: VizNode[];
  edges: VizEdge[];
  layout: "lr" | "tb" | "cycle";
  grid: number[][];
  gridLabels: string[];
  steps: string[];
  chips: string[];
};

const KINDS = new Set<VizKind>([
  "plot",
  "bars",
  "scatter",
  "flow",
  "vecs",
  "grid",
  "loop",
  "strip",
  "heat",
]);

function num(s: string | undefined, fallback = 0): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function toneOf(s: string | undefined): number {
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return ((Math.floor(n) % 4) + 4) % 4;
}

function sampleFn(
  expr: string,
  xmin: number,
  xmax: number,
  n: number,
): [number, number][] {
  const body = `"use strict"; const {abs,sqrt,exp,log,log2,sin,cos,min,max,pow,PI,E,tanh,sign,floor,ceil,round} = Math; return (${expr});`;
  let fn: (x: number) => number;
  try {
    fn = new Function("x", body) as (x: number) => number;
  } catch {
    return [];
  }
  const steps = Math.max(8, Math.min(400, Math.floor(n)));
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xmin + (i / steps) * (xmax - xmin);
    try {
      const y = Number(fn(x));
      if (Number.isFinite(y)) pts.push([x, y]);
    } catch {
      /* skip */
    }
  }
  return pts;
}

function parseFn(rest: string): VizSeries | null {
  const parts = rest.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 4) return null;
  const name = parts[0];
  let n = 80;
  let xmax = Number(parts[parts.length - 1]);
  let xmin = Number(parts[parts.length - 2]);
  let exprEnd = parts.length - 2;
  const last = Number(parts[parts.length - 1]);
  const second = Number(parts[parts.length - 2]);
  const third = Number(parts[parts.length - 3]);
  if (
    parts.length >= 5 &&
    Number.isFinite(last) &&
    Number.isInteger(last) &&
    last >= 8 &&
    last <= 400 &&
    Number.isFinite(second) &&
    Number.isFinite(third)
  ) {
    n = last;
    xmax = second;
    xmin = third;
    exprEnd = parts.length - 3;
  }
  if (!Number.isFinite(xmin) || !Number.isFinite(xmax) || xmin === xmax) return null;
  const expr = parts.slice(1, exprEnd).join(" ");
  if (!expr) return null;
  const points = sampleFn(expr, xmin, xmax, n);
  if (!points.length) return null;
  return { name, points };
}

function parsePairs(rest: string): [number, number][] {
  const out: [number, number][] = [];
  for (const tok of rest.trim().split(/\s+/).filter(Boolean)) {
    const [xs, ys] = tok.split(",");
    const x = Number(xs);
    const y = Number(ys);
    if (Number.isFinite(x) && Number.isFinite(y)) out.push([x, y]);
  }
  return out;
}

function emptySpec(kind: VizKind): VizSpec {
  return {
    kind,
    title: "",
    caption: "",
    xlabel: "",
    ylabel: "",
    series: [],
    marks: [],
    vlines: [],
    hlines: [],
    tangents: [],
    bars: [],
    dots: [],
    vecs: [],
    nodes: [],
    edges: [],
    layout: "lr",
    grid: [],
    gridLabels: [],
    steps: [],
    chips: [],
  };
}

export function parseViz(kindRaw: string, body: string): VizSpec {
  const kind = KINDS.has(kindRaw as VizKind) ? (kindRaw as VizKind) : "plot";
  const spec = emptySpec(kind);
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sp = line.indexOf(" ");
    const key = (sp === -1 ? line : line.slice(0, sp)).toLowerCase();
    const rest = sp === -1 ? "" : line.slice(sp + 1).trim();
    if (key === "title") spec.title = rest;
    else if (key === "caption" || key === "note") spec.caption = rest;
    else if (key === "xlabel") spec.xlabel = rest;
    else if (key === "ylabel") spec.ylabel = rest;
    else if (key === "xmin") spec.xmin = num(rest);
    else if (key === "xmax") spec.xmax = num(rest);
    else if (key === "ymin") spec.ymin = num(rest);
    else if (key === "ymax") spec.ymax = num(rest);
    else if (key === "layout") {
      if (rest === "tb" || rest === "cycle" || rest === "lr") spec.layout = rest;
    } else if (key === "fn") {
      const series = parseFn(rest);
      if (series) spec.series.push(series);
    } else if (key === "line") {
      const parts = rest.split(/\s+/);
      const name = parts[0] || "line";
      spec.series.push({ name, points: parsePairs(parts.slice(1).join(" ")) });
    } else if (key === "mark") {
      const [xy, ...lab] = rest.split(/\s+/);
      const [xs, ys] = (xy || "").split(",");
      spec.marks.push({ x: num(xs), y: num(ys), label: lab.join(" ") });
    } else if (key === "vline") {
      const parts = rest.split(/\s+/);
      spec.vlines.push({ x: num(parts[0]), label: parts.slice(1).join(" ") });
    } else if (key === "hline") {
      const parts = rest.split(/\s+/);
      spec.hlines.push({ y: num(parts[0]), label: parts.slice(1).join(" ") });
    } else if (key === "tangent") {
      const [a, b, c] = rest.split(",");
      spec.tangents.push({ x: num(a), y: num(b), slope: num(c) });
    } else if (key === "bar") {
      const [label, value, tone] = splitCsv(rest, 3);
      spec.bars.push({ label, value: num(value), tone: toneOf(tone) });
    } else if (key === "dot") {
      const [xy, ...restParts] = rest.split(/\s+/);
      const [xs, ys] = (xy || "").split(",");
      const toneTok = restParts[restParts.length - 1];
      const hasTone = restParts.length > 0 && Number.isFinite(Number(toneTok));
      const label = hasTone ? restParts.slice(0, -1).join(" ") : restParts.join(" ");
      spec.dots.push({
        x: num(xs),
        y: num(ys),
        label,
        tone: hasTone ? toneOf(toneTok) : 0,
      });
    } else if (key === "vec") {
      const [xy, ...restParts] = rest.split(/\s+/);
      const [xs, ys] = (xy || "").split(",");
      const toneTok = restParts[restParts.length - 1];
      const hasTone = restParts.length > 0 && Number.isFinite(Number(toneTok));
      const label = hasTone ? restParts.slice(0, -1).join(" ") : restParts.join(" ");
      spec.vecs.push({
        x: num(xs),
        y: num(ys),
        label,
        tone: hasTone ? toneOf(toneTok) : 0,
      });
    } else if (key === "node") {
      const parts = rest.split(/\s+/);
      spec.nodes.push({ id: parts[0], label: parts.slice(1).join(" ") || parts[0] });
    } else if (key === "edge") {
      const parts = rest.split(/\s+/);
      spec.edges.push({
        from: parts[0] || "",
        to: parts[1] || "",
        label: parts.slice(2).join(" "),
      });
    } else if (key === "row") {
      spec.grid.push(
        rest
          .split(/[,\s]+/)
          .filter(Boolean)
          .map((v) => num(v)),
      );
    } else if (key === "labels") {
      spec.gridLabels = rest.split(/\s+/).filter(Boolean);
    } else if (key === "step") spec.steps.push(rest);
    else if (key === "chip") spec.chips.push(rest);
  }
  return spec;
}

function splitCsv(s: string, n: number): string[] {
  const parts = s.split(",");
  if (parts.length <= n) return parts.map((p) => p.trim());
  return [...parts.slice(0, n - 1).map((p) => p.trim()), parts.slice(n - 1).join(",").trim()];
}

export const VIZ_TONES = ["var(--jv)", "#d4653a", "#1a9a86", "#c9a227"] as const;
