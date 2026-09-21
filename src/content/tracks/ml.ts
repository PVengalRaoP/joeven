import type { TrackSource } from "@/lib/types";
import { mlAgents } from "@/content/ml/part-agents";
import { mlEval } from "@/content/ml/part-eval";
import { mlFitting } from "@/content/ml/part-fitting";
import { mlFoundations } from "@/content/ml/part-foundations";
import { mlRepresent } from "@/content/ml/part-represent";

export const ml: TrackSource = {
  slug: "ml",
  title: "Machine Learning",
  short: "ML",
  tagline:
    "Simple ML from zero: examples, splits, loss, ranking, and the loop you use to judge an agent.",
  color: "#DC2626",
  order: 4,
  lessons: [
    ...mlFoundations,
    ...mlFitting,
    ...mlEval,
    ...mlRepresent,
    ...mlAgents,
  ],
};
