import type { TrackSource } from "@/lib/types";
import { llmApis } from "@/content/llm/part-apis";
import { llmChat } from "@/content/llm/part-chat";
import { llmCost } from "@/content/llm/part-cost";
import { llmOutput } from "@/content/llm/part-output";
import { llmProduct } from "@/content/llm/part-product";
import { llmTrust } from "@/content/llm/part-trust";

export const llm: TrackSource = {
  slug: "llm",
  title: "Large Language Models",
  short: "LLMs",
  tagline:
    "Simple LLMs from zero: chat APIs, tokens and cost, JSON actions, and when not to call a model.",
  color: "#2563EB",
  order: 6,
  lessons: [
    ...llmApis,
    ...llmCost,
    ...llmChat,
    ...llmOutput,
    ...llmTrust,
    ...llmProduct,
  ],
};
