import type { TrackSource } from "@/lib/types";
import { ragEmbed } from "@/content/rag/part-embed";
import { ragGround } from "@/content/rag/part-ground";
import { ragMemory } from "@/content/rag/part-memory";
import { ragSearch } from "@/content/rag/part-search";
import { ragWhy } from "@/content/rag/part-why";

export const rag: TrackSource = {
  slug: "rag",
  title: "RAG & Memory",
  short: "RAG",
  tagline:
    "Simple RAG from zero: chunks, cosine, hybrid search, citations, agentic retrieve, and memory that is not one vector soup.",
  color: "#4F46E5",
  order: 9,
  lessons: [
    ...ragWhy,
    ...ragEmbed,
    ...ragSearch,
    ...ragGround,
    ...ragMemory,
  ],
};
