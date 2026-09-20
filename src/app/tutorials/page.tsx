import type { Metadata } from "next";
import Link from "next/link";
import { tracks, stats } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Curriculum",
  description: `Guided tracks covering Python, math, ML, LLMs, tools, RAG, and autonomous agents — ${stats.lessons} lessons.`,
};

export default function TutorialsIndex() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">Curriculum</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        {stats.lessons} lessons in {stats.tracks} tracks. Take them in order the
        first time. Search when you need a single idea.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {tracks.map((t, i) => (
          <Link
            key={t.slug}
            href={`/tutorials/${t.slug}`}
            className="card p-5 hover:border-jv/40"
          >
            <p className="text-xs text-muted">
              {String(i + 1).padStart(2, "0")} · {t.lessons.length} lessons
            </p>
            <h2 className="mt-2 text-xl font-semibold">{t.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t.tagline}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
