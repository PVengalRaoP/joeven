import type { TrackSource } from "@/lib/types";
import { agentsControl } from "@/content/agents/part-control";
import { agentsCore } from "@/content/agents/part-core";
import { agentsLoops } from "@/content/agents/part-loops";
import { agentsOps } from "@/content/agents/part-ops";
import { agentsShip } from "@/content/agents/part-ship";

export const agents: TrackSource = {
  slug: "agents",
  title: "Agent Architectures",
  short: "Agents",
  tagline:
    "Simple agent loops from zero: six parts, ReAct, plan-and-execute, reflection, typed state, HITL, jobs, and when not to agent.",
  color: "#4c3dff",
  order: 10,
  lessons: [
    ...agentsCore,
    ...agentsLoops,
    ...agentsControl,
    ...agentsOps,
    ...agentsShip,
  ],
};
