import type { TrackSource } from "@/lib/types";
import { prodMove } from "@/content/prod/part-move";
import { prodSee } from "@/content/prod/part-see";
import { prodShape } from "@/content/prod/part-shape";
import { prodShip } from "@/content/prod/part-ship";
import { prodSurvive } from "@/content/prod/part-survive";

export const prod: TrackSource = {
  slug: "prod",
  title: "Production Agents",
  short: "Production",
  tagline:
    "Simple production from zero: gateway and jobs, traces you can operate, caps and queues, secrets, CI gates, and kill switches you have practiced.",
  color: "#334155",
  order: 13,
  lessons: [
    ...prodShape,
    ...prodSee,
    ...prodMove,
    ...prodShip,
    ...prodSurvive,
  ],
};
