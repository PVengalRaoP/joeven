import type { Metadata } from "next";
import Link from "next/link";
import { tracks, stats } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "AI Agent Tutorials",
  description: `Free tutorials covering Python, math, ML, LLMs, tools, RAG, and autonomous agents — ${stats.lessons} lessons.`,
};

export default function TutorialsIndex() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Tutorials</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {stats.lessons} lessons across {stats.tracks} tracks. Read them in
        order the first time. Use the search bar when you need a single idea.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t) => (
          <Link
            key={t.slug}
            href={`/tutorials/${t.slug}`}
            className="rounded-xl border border-line p-5 hover:border-jv"
          >
            <div
              className="mb-3 h-2 w-16 rounded-full"
              style={{ background: t.color }}
            />
            <h2 className="text-xl font-bold">{t.title}</h2>
            <p className="mt-2 text-sm text-muted">{t.tagline}</p>
            <p className="mt-3 text-sm font-semibold text-jv-darker">
              {t.lessons.length} lessons →
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
