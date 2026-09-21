import type { TrackSource } from "@/lib/types";
import { pythonAgents } from "@/content/python/part-agents";
import { pythonBasics } from "@/content/python/part-basics";
import { pythonCollections } from "@/content/python/part-collections";
import { pythonFunctions } from "@/content/python/part-functions";
import { pythonStructure } from "@/content/python/part-structure";

export const python: TrackSource = {
  slug: "python",
  title: "Python",
  short: "Python",
    tagline:
      "Simple Python from zero: names, lists, functions, files, JSON, errors, tests, and the loop every agent uses.",
  color: "#3776AB",
  order: 2,
  lessons: [
    ...pythonBasics,
    ...pythonCollections,
    ...pythonFunctions,
    ...pythonStructure,
    ...pythonAgents,
  ],
};
