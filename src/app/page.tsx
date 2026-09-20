import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { NewsletterForm } from "@/components/NewsletterForm";
import { stats, tracks, allProjects } from "@/lib/curriculum";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${site.name} — Learn Autonomous AI Agents`,
};

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-line bg-gradient-to-b from-emerald-50 to-white px-5 py-14 dark:from-emerald-950/40 dark:to-transparent">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-jv-darker">
            {site.domain.replace("https://", "")}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Learn to build <span className="text-jv-darker">autonomous AI agents</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            A complete tutorial academy in the spirit of W3Schools: short pages,
            live Python, Next / Previous, exercises, quizzes, and certificates.
            From Python and mathematics to ReAct, RAG, multi-agent systems, and
            production.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tutorials/start/welcome" className="green-btn text-base">
              Start the tutorial »
            </Link>
            <Link
              href="/projects"
              className="rounded-md border border-line px-4 py-2.5 font-bold"
            >
              Browse projects
            </Link>
            <Link href="/path" className="rounded-md px-4 py-2.5 font-bold text-jv-darker">
              Full learning path
            </Link>
          </div>
          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [stats.lessons, "Lessons"],
              [stats.tracks, "Tracks"],
              [stats.projects, "Projects"],
              [stats.exercises, "Exercises"],
            ].map(([n, label]) => (
              <div key={String(label)} className="rounded-lg border border-line bg-white p-4 dark:bg-transparent">
                <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
                <dd className="text-3xl font-extrabold">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-extrabold">Tutorials</h2>
        <p className="mt-1 text-muted">
          Click a box. Each track is a sequence of short, example-first pages.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tracks.map((t) => (
            <Link
              key={t.slug}
              href={`/tutorials/${t.slug}/${t.lessons[0]?.slug ?? ""}`}
              className="group rounded-lg p-5 text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ background: t.color }}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                {t.lessons.length} lessons
              </p>
              <h3 className="mt-1 text-xl font-extrabold">{t.short}</h3>
              <p className="mt-2 text-sm text-white/90">{t.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-panel px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-extrabold">Build five real agents</h2>
            <p className="mt-2 text-muted">
              Portfolio projects, from a weather tool-agent to a multi-agent
              software team and an ops agent with human approval.
            </p>
            <div className="mt-5 space-y-3">
              {allProjects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="block rounded-lg border border-line bg-white p-4 hover:border-jv dark:bg-transparent"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-bold">{p.title}</h3>
                    <span className="text-xs uppercase text-muted">{p.level}</span>
                    <span className="text-xs text-muted">{p.hours}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{p.summary}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <AdSlot slot="sidebar" />
            <div className="rounded-lg border border-line bg-white p-4 dark:bg-transparent">
              <h3 className="font-bold">Weekly letter</h3>
              <p className="mt-1 text-sm text-muted">
                Agent patterns that survive production.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-extrabold">How Joeven makes money — and stays free</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Free tutorials",
              d: "The curriculum is free. That is how a W3Schools-style academy earns trust and search traffic.",
            },
            {
              t: "Joeven Pro",
              d: "Ad-free reading, extra exam packs, and a Pro badge on certificates. $12 / month.",
            },
            {
              t: "Jobs & sponsors",
              d: "Companies hire agent engineers here and sponsor lesson slots. You can learn without paying.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-lg border border-line p-5">
              <h3 className="font-bold">{x.t}</h3>
              <p className="mt-2 text-sm text-muted">{x.d}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="green-btn mt-6">
          See pricing »
        </Link>
      </section>
    </main>
  );
}
