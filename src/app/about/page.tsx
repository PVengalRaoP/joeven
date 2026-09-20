import type { Metadata } from "next";
import { stats } from "@/lib/curriculum";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About Joeven" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">About Joeven</h1>
      <p className="mt-4 text-lg leading-8">
        {site.name} is a tutorial academy for <strong>autonomous AI agents</strong>.
        The format is deliberately old-school: one idea per page, a live
        example, a quiz, Next / Previous. The subject is new: systems that
        pursue goals with models, tools, memory, and a loop.
      </p>
      <p className="mt-4 leading-8">
        The site lives at <strong>joeven.com</strong>. The curriculum currently
        includes {stats.tracks} tracks, {stats.lessons} lessons,{" "}
        {stats.projects} projects ({stats.projectParts} parts),{" "}
        {stats.exercises} exercises, and {stats.references} reference pages.
      </p>
      <h2 className="mt-8 text-2xl font-bold">Why this exists</h2>
      <p className="mt-3 leading-8">
        Most “agent” content is either a vendor demo or a research paper.
        Joeven sits in the middle: enough Python and math to debug a retrieval
        system, enough architecture to ship ReAct without a 40-package
        framework, enough evals and production to keep the loop from becoming
        an incident.
      </p>
      <h2 className="mt-8 text-2xl font-bold">Contact</h2>
      <p className="mt-3">
        Email{" "}
        <a className="underline" href={`mailto:${site.email}`}>
          {site.email}
        </a>
        . Source:{" "}
        <a className="underline" href={site.github}>
          {site.github}
        </a>
        .
      </p>
    </main>
  );
}
