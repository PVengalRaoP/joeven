import type { Metadata } from "next";
import { stats } from "@/lib/curriculum";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About Joeven" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">About Joeven</h1>
      <p className="mt-5 text-lg leading-8 text-muted">
        {site.name} is a guided academy for <strong className="text-ink">autonomous AI agents</strong>.
        One idea at a time, a live example you can run, a short check, then the
        next page. The subject is systems that pursue goals with models, tools,
        memory, and a loop.
      </p>
      <p className="mt-4 leading-8 text-muted">
        The curriculum currently includes {stats.tracks} tracks, {stats.lessons}{" "}
        lessons, {stats.projects} projects ({stats.projectParts} parts),{" "}
        {stats.exercises} exercises, and {stats.references} reference pages.
      </p>
      <h2 className="font-display mt-10 text-2xl">Why this exists</h2>
      <p className="mt-3 leading-8 text-muted">
        Most “agent” content is either a vendor demo or a research paper.
        Joeven sits in the middle: enough Python and math to debug retrieval,
        enough architecture to write ReAct without a 40-package framework,
        enough evals and production to keep the loop from becoming an incident.
      </p>
      <h2 className="font-display mt-10 text-2xl">Contact</h2>
      <p className="mt-3 text-muted">
        Email{" "}
        <a className="text-ink underline decoration-line underline-offset-2" href={`mailto:${site.email}`}>
          {site.email}
        </a>
        . Source:{" "}
        <a className="text-ink underline decoration-line underline-offset-2" href={site.github}>
          GitHub
        </a>
        .
      </p>
    </main>
  );
}
