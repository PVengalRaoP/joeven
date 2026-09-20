"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { searchContent } from "@/lib/curriculum";

function Results() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { lessons, projects, exercises, references } = searchContent(q);

  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight">Search</h1>
      <form className="mt-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search Python, ReAct, cosine, MCP…"
          className="w-full rounded-full border border-line bg-panel px-5 py-3 outline-none ring-jv/30 focus:ring-2"
        />
      </form>
      {q.length < 2 ? (
        <p className="mt-6 text-muted">Type at least two characters.</p>
      ) : (
        <div className="mt-8 space-y-8">
          <Section title="Tutorials" empty={lessons.length === 0}>
            {lessons.map((l) => (
              <Link
                key={l.id}
                href={`/tutorials/${l.track}/${l.slug}`}
                className="block rounded-md px-2 py-2 hover:bg-panel"
              >
                <span className="text-xs text-muted">{l.trackTitle}</span>
                <p className="font-semibold">{l.title}</p>
              </Link>
            ))}
          </Section>
          <Section title="Projects" empty={projects.length === 0}>
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="block rounded-md px-2 py-2 hover:bg-panel"
              >
                {p.title}
              </Link>
            ))}
          </Section>
          <Section title="Exercises" empty={exercises.length === 0}>
            {exercises.map((e) => (
              <Link
                key={e.id}
                href={`/exercises/${e.id}`}
                className="block rounded-md px-2 py-2 hover:bg-panel"
              >
                {e.title}
              </Link>
            ))}
          </Section>
          <Section title="Reference" empty={references.length === 0}>
            {references.map((r) => (
              <Link
                key={r.slug}
                href={`/reference/${r.slug}`}
                className="block rounded-md px-2 py-2 hover:bg-panel"
              >
                {r.title}
              </Link>
            ))}
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold">{title}</h2>
      {empty ? <p className="text-sm text-muted">No matches.</p> : children}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-10">Searching…</p>}>
      <Results />
    </Suspense>
  );
}
