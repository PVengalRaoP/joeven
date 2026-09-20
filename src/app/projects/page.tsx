import type { Metadata } from "next";
import Link from "next/link";
import { allProjects } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Five portfolio projects: weather tool-agent, ReAct research, RAG support, multi-agent software team, and ops agent with approvals.",
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">Projects</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Each project is a sequence: architecture, environment, loop, tests,
        hardening. Ship them as a public portfolio.
      </p>
      <div className="mt-10 space-y-4">
        {allProjects.map((p, i) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="card block p-6 hover:border-jv/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {String(i + 1).padStart(2, "0")} · {p.level} · {p.hours}
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">{p.title}</h2>
            <p className="mt-2 leading-7 text-muted">{p.summary}</p>
            <p className="mt-3 text-sm">
              <strong>You will ship:</strong> {p.outcome}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-code px-2.5 py-0.5 text-xs font-medium"
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
