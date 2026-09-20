import type { Metadata } from "next";
import Link from "next/link";
import { tracks } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Quizzes" };

export default function QuizIndex() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Quizzes</h1>
      <p className="mt-3 text-lg text-muted">
        One exam per track. Pass at 80% to mint a Joeven certificate in this
        browser.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-lg border border-line">
        {tracks.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/quiz/${t.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-panel"
            >
              <span className="font-semibold">{t.title}</span>
              <span className="text-sm text-jv-darker">Start quiz →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
