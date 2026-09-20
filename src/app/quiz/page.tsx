import type { Metadata } from "next";
import Link from "next/link";
import { tracks } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Quizzes" };

export default function QuizIndex() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight">Quizzes</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        One exam per track. Pass at 80% to mint a certificate in this browser.
      </p>
      <ul className="card mt-8 divide-y divide-line overflow-hidden">
        {tracks.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/quiz/${t.slug}`}
              className="flex items-center justify-between px-4 py-4 hover:bg-code/40"
            >
              <span className="font-semibold">{t.title}</span>
              <span className="text-sm text-jv-dark">Start</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
