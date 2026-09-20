import type { Metadata } from "next";
import Link from "next/link";
import { allProjects } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Agent Projects",
  description:
    "Five portfolio projects: weather tool-agent, ReAct research, RAG support, multi-agent software team, and ops agent with approvals.",
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Projects</h1>
      <p className="mt-3 text-lg text-muted">
        Theory that you cannot run is trivia. Each project is a sequence of
        parts with architecture, a simulated environment, a loop, evals, and
        hardening. Use them as a public portfolio.
      </p>
      <div className="mt-8 space-y-5">
        {allProjects.map((p, i) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="block rounded-xl border border-line p-6 hover:border-jv"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Project {i + 1} · {p.level} · {p.hours}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">{p.title}</h2>
            <p className="mt-2 text-muted">{p.summary}</p>
            <p className="mt-3 text-sm">
              <strong>You will ship:</strong> {p.outcome}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-panel px-2 py-0.5 text-xs font-semibold"
                >
                  {s}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
