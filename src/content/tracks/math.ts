import type { TrackSource } from "@/lib/types";
import { mathAgents } from "@/content/math/part-agents";
import { mathCalculus } from "@/content/math/part-calculus";
import { mathFoundations } from "@/content/math/part-foundations";
import { mathProbability } from "@/content/math/part-probability";
import { mathVectors } from "@/content/math/part-vectors";

export const math: TrackSource = {
  slug: "math",
  title: "Mathematics",
  short: "Math",
  tagline:
    "Simple math from zero: lists of numbers, scores, chance, entropy, and the formulas agents actually use.",
  color: "#7C3AED",
  order: 3,
  lessons: [
    ...mathFoundations,
    ...mathVectors,
    ...mathCalculus,
    ...mathProbability,
    ...mathAgents,
  ],
};
