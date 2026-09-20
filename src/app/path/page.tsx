import type { Metadata } from "next";
import Link from "next/link";
import { tracks } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Learning Path" };

export default function PathPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Learning path</h1>
      <p className="mt-3 text-lg text-muted">
        Follow this order if you are starting from scratch. Experienced Python
        developers can skip to mathematics or jump to Agents after the LLM
        track — but do not skip evals.
      </p>
      <ol className="mt-8 space-y-4">
        {tracks.map((t, i) => (
          <li key={t.slug} className="rounded-xl border border-line p-5">
            <p className="text-xs font-bold uppercase text-muted">
              Stage {i + 1}
            </p>
            <h2 className="text-xl font-bold">{t.title}</h2>
            <p className="mt-1 text-sm text-muted">{t.tagline}</p>
            <Link
              href={`/tutorials/${t.slug}/${t.lessons[0].slug}`}
              className="mt-3 inline-block font-bold text-jv-darker"
            >
              Open first lesson →
            </Link>
          </li>
        ))}
        <li className="rounded-xl border border-jv bg-emerald-50 p-5 dark:bg-emerald-950/30">
          <h2 className="text-xl font-bold">Then: Projects</h2>
          <p className="mt-1 text-sm text-muted">
            Weather agent → ReAct research → RAG support → multi-agent team →
            ops agent.
          </p>
          <Link href="/projects" className="mt-3 inline-block font-bold text-jv-darker">
            Open projects →
          </Link>
        </li>
      </ol>
    </main>
  );
}
