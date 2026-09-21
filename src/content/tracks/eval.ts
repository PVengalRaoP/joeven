import type { TrackSource } from "@/lib/types";
import { evalAlign } from "@/content/eval/part-align";
import { evalCheck } from "@/content/eval/part-check";
import { evalGold } from "@/content/eval/part-gold";
import { evalSafety } from "@/content/eval/part-safety";
import { evalWhy } from "@/content/eval/part-why";

export const evals: TrackSource = {
  slug: "eval",
  title: "Evals & Safety",
  short: "Evals",
  tagline:
    "Simple evals from zero: golden properties, tool tests, judges you measure, traces you replay, injection allow-lists, and a spec that can say no.",
  color: "#B45309",
  order: 12,
  lessons: [
    ...evalWhy,
    ...evalGold,
    ...evalCheck,
    ...evalSafety,
    ...evalAlign,
  ],
};
