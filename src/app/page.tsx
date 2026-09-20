import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { ContinueCard } from "@/components/ContinueCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { stats, tracks, allProjects } from "@/lib/curriculum";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${site.name} — Learn Autonomous AI Agents`,
};

export default function HomePage() {
  return (
    <main className="mesh">
      <section className="px-5 pb-8 pt-16 md:pt-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-jv-dark">Joeven academy</p>
          <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.1] tracking-tight md:text-6xl">
            Learn to build agents that actually <em>do</em> the work.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Short lessons, live Python, and five portfolio projects. Start from
            zero — language, math, models — and finish able to ship a loop with
            tools, memory, evals, and a kill switch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tutorials/start/welcome" className="btn">
              Start learning
            </Link>
            <Link href="/path" className="btn-ghost">
              See the full path
            </Link>
          </div>
          <ContinueCard />
          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [stats.lessons, "Lessons"],
              [stats.tracks, "Tracks"],
              [stats.projects, "Projects"],
              [stats.exercises, "Exercises"],
            ].map(([n, label]) => (
              <div key={String(label)} className="card px-4 py-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="font-display text-3xl tracking-tight">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-tight">The curriculum</h2>
            <p className="mt-2 max-w-xl text-muted">
              Follow the numbered path. Skip a track only if you already own it.
            </p>
          </div>
          <Link href="/tutorials" className="hidden text-sm font-semibold text-jv-dark md:inline">
            Browse all →
          </Link>
        </div>
        <ol className="mt-8 divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-panel">
          {tracks.map((t, i) => (
            <li key={t.slug}>
              <Link
                href={`/tutorials/${t.slug}/${t.lessons[0]?.slug ?? ""}`}
                className="flex items-start gap-4 px-5 py-4 transition hover:bg-[color-mix(in_srgb,var(--jv)_6%,transparent)]"
              >
                <span className="mt-0.5 w-8 font-mono text-sm text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: t.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{t.tagline}</p>
                </div>
                <span className="shrink-0 text-sm text-muted">
                  {t.lessons.length} lessons
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl tracking-tight">
              Five agents you can show
            </h2>
            <p className="mt-2 text-muted">
              Architecture, a working loop, tests, then hardening. Use them as a
              portfolio.
            </p>
            <div className="mt-6 space-y-3">
              {allProjects.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="card block p-5 hover:border-jv/40"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {String(i + 1).padStart(2, "0")} · {p.level} · {p.hours}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{p.summary}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold">Weekly note</h3>
              <p className="mt-1 text-sm text-muted">
                Patterns that still work after the demo.
              </p>
              <NewsletterForm />
            </div>
            <AdSlot slot="sidebar" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="font-display text-3xl tracking-tight">Stay free, stay honest</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "The academy is free",
              d: "Every core lesson, playground, and project. No drip-feed, no fake timer.",
            },
            {
              t: "Pro is optional",
              d: "Hide partner slots and add a Pro badge to certificates. $12 / month.",
            },
            {
              t: "Jobs & partners",
              d: "Teams hire agent engineers here. You can learn without paying anyone.",
            },
          ].map((x) => (
            <div key={x.t} className="card p-5">
              <h3 className="font-semibold">{x.t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{x.d}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="btn mt-8">
          See plans
        </Link>
      </section>
    </main>
  );
}
