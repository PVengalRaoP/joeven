import type { Metadata } from "next";
import Link from "next/link";
import { exercises, tracks } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Exercises",
  description: "Hands-on Python exercises for every Joeven track.",
};

export default function ExercisesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Exercises</h1>
      <p className="mt-3 text-lg text-muted">
        Short problems with a starter file, a hint, and a solution. Run them in
        the browser.
      </p>
      {tracks.map((t) => {
        const items = exercises.filter((e) => e.track === t.slug);
        if (items.length === 0) return null;
        return (
          <section key={t.slug} className="mt-10">
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {items.map((ex) => (
                <li key={ex.id}>
                  <Link
                    href={`/exercises/${ex.id}`}
                    className="block px-4 py-3 hover:bg-panel"
                  >
                    <p className="font-semibold">{ex.title}</p>
                    <p className="text-sm text-muted">{ex.prompt}</p>
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
