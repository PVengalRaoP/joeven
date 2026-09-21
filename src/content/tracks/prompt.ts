import type { TrackSource } from "@/lib/types";
import { promptAgents } from "@/content/prompt/part-agents";
import { promptAnatomy } from "@/content/prompt/part-anatomy";
import { promptExamples } from "@/content/prompt/part-examples";
import { promptReason } from "@/content/prompt/part-reason";
import { promptSafety } from "@/content/prompt/part-safety";

export const prompt: TrackSource = {
  slug: "prompt",
  title: "Prompting",
  short: "Prompt",
  tagline:
    "Simple prompting from zero: four parts, examples, tags, injection, evals, and the OS an agent actually reads.",
  color: "#DB2777",
  order: 7,
  lessons: [
    ...promptAnatomy,
    ...promptExamples,
    ...promptReason,
    ...promptSafety,
    ...promptAgents,
  ],
};
