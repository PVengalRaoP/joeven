"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgress } from "@/components/ProgressProvider";
import { trackQuizzes } from "@/lib/curriculum";
import type { Track } from "@/lib/types";

export default function QuizClient({ track }: { track: Track }) {
  const items = useMemo(() => trackQuizzes(track.slug), [track.slug]);
  const { setQuiz, quiz } = useProgress();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  function currentScore() {
    const correct = items.filter((item, i) => {
      if (item.quiz.type !== "quiz") return false;
      const idx = item.quiz.options.findIndex((o) => o.correct);
      return answers[i] === idx;
    }).length;
    return items.length ? Math.round((100 * correct) / items.length) : 0;
  }

  function submit() {
    const score = currentScore();
    setQuiz(`track:${track.slug}`, score);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const stored = quiz[`track:${track.slug}`];
  const shown = done ? currentScore() : stored;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/quiz">Quizzes</Link>
      </p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">{track.title} quiz</h1>
      <p className="mt-3 text-muted">
        {items.length} questions from the {track.title} track. Score 80% or
        higher to unlock a certificate.
      </p>
      {typeof shown === "number" && (
        <p className="mt-4 rounded-md bg-panel p-4 font-bold">
          Score: {shown}%{" "}
          {shown >= 80 && (
            <Link className="text-jv-darker underline" href="/certificates">
              Get your certificate
            </Link>
          )}
        </p>
      )}
      <ol className="mt-8 space-y-8">
        {items.map((item, i) => {
          if (item.quiz.type !== "quiz") return null;
          return (
            <li key={i} className="rounded-lg border border-line p-4">
              <p className="text-xs text-muted">{item.lesson.title}</p>
              <p className="mt-1 font-semibold">
                {i + 1}. {item.quiz.question}
              </p>
              <ul className="mt-3 space-y-2">
                {item.quiz.options.map((opt, j) => (
                  <li key={j}>
                    <label className="flex gap-2 text-sm">
                      <input
                        type="radio"
                        name={`q${i}`}
                        checked={answers[i] === j}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [i]: j }))
                        }
                      />
                      {opt.text}
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={submit} className="btn mt-8">
        Submit quiz
      </button>
    </main>
  );
}
