import type { TrackSource } from "@/lib/types";
import { tfAdapt } from "@/content/transformers/part-adapt";
import { tfAttention } from "@/content/transformers/part-attention";
import { tfGenerate } from "@/content/transformers/part-generate";
import { tfServe } from "@/content/transformers/part-serve";
import { tfTokens } from "@/content/transformers/part-tokens";

export const transformers: TrackSource = {
  slug: "transformers",
  title: "Neural Nets & Transformers",
  short: "Transformers",
  tagline:
    "Simple transformers from zero: tokens, attention, decoding, and the stack every agent call runs.",
  color: "#EA580C",
  order: 5,
  lessons: [
    ...tfTokens,
    ...tfAttention,
    ...tfGenerate,
    ...tfAdapt,
    ...tfServe,
  ],
};
