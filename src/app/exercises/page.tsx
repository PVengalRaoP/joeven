import type { Metadata } from "next";
import Link from "next/link";
import { exercises, tracks } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Practice",
  description: "Hands-on Python exercises for every Joeven track.",
};

export default function ExercisesPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">Practice</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Short problems with a starter, a hint, and a solution. Run them in the
        browser.
      </p>
      <p className="mt-3">
        <Link href="/quiz" className="text-sm font-semibold text-jv-dark">
          Or take a track quiz
        </Link>
      </p>
      {tracks.map((t) => {
        const items = exercises.filter((e) => e.track === t.slug);
        if (items.length === 0) return null;
        return (
          <section key={t.slug} className="mt-10">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <ul className="card mt-3 divide-y divide-line overflow-hidden">
              {items.map((ex) => (
                <li key={ex.id}>
                  <Link
                    href={`/exercises/${ex.id}`}
                    className="block px-4 py-4 hover:bg-code/40"
                  >
                    <p className="font-semibold">{ex.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{ex.prompt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
