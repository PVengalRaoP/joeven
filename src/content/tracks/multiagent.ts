import type { TrackSource } from "@/lib/types";
import { multiFail } from "@/content/multiagent/part-fail";
import { multiOrch } from "@/content/multiagent/part-orch";
import { multiRoles } from "@/content/multiagent/part-roles";
import { multiWhy } from "@/content/multiagent/part-why";
import { multiWork } from "@/content/multiagent/part-work";

export const multiagent: TrackSource = {
  slug: "multiagent",
  title: "Multi-Agent Systems",
  short: "Multi-agent",
  tagline:
    "Simple multi-agent from zero: split only when tools and checks diverge, typed handoffs, supervisors, debate, swarms, and how teams fail.",
  color: "#0F766E",
  order: 11,
  lessons: [
    ...multiWhy,
    ...multiRoles,
    ...multiOrch,
    ...multiWork,
    ...multiFail,
  ],
};
