import type { TrackSource } from "@/lib/types";
import { toolsRuntime } from "@/content/tools/part-runtime";
import { toolsSafety } from "@/content/tools/part-safety";
import { toolsSchema } from "@/content/tools/part-schema";
import { toolsSpecial } from "@/content/tools/part-special";
import { toolsWhy } from "@/content/tools/part-why";

export const tools: TrackSource = {
  slug: "tools",
  title: "Tools & Function Calling",
  short: "Tools",
  tagline:
    "Simple tools from zero: schema, dispatch, idempotency, sandboxes, MCP, and permissions your runtime actually enforces.",
  color: "#0891B2",
  order: 8,
  lessons: [
    ...toolsWhy,
    ...toolsSchema,
    ...toolsRuntime,
    ...toolsSpecial,
    ...toolsSafety,
  ],
};
