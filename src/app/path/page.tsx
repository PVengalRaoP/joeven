import type { Metadata } from "next";
import Link from "next/link";
import { tracks } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Learning Path" };

export default function PathPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">
        Learning path
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Start at the top if you are new. Strong Python developers can skip
        ahead to math or jump to Agents after LLMs — but do not skip evals.
      </p>
      <ol className="relative mt-10 space-y-3 border-l border-line pl-6">
        {tracks.map((t, i) => (
          <li key={t.slug} className="card relative p-5">
            <span className="absolute -left-[31px] top-6 h-3 w-3 rounded-full bg-jv" />
            <p className="text-xs text-muted">Stage {String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-1 text-xl font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{t.tagline}</p>
            <Link
              href={`/tutorials/${t.slug}/${t.lessons[0].slug}`}
              className="mt-3 inline-block text-sm font-semibold text-jv-dark"
            >
              Open first lesson
            </Link>
          </li>
        ))}
        <li className="card relative border-jv/40 bg-jv/5 p-5">
          <span className="absolute -left-[31px] top-6 h-3 w-3 rounded-full bg-ink dark:bg-white" />
          <h2 className="text-xl font-semibold">Then build</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Weather agent → ReAct research → RAG support → multi-agent team →
            ops agent.
          </p>
          <Link href="/projects" className="mt-3 inline-block text-sm font-semibold text-jv-dark">
            Open projects
          </Link>
        </li>
      </ol>
    </main>
  );
}
