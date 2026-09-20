"use client";

import { useState } from "react";
import type { QuizOption } from "@/lib/types";
import { useProgress } from "./ProgressProvider";

export function Quiz({
  id,
  question,
  options,
  explain,
}: {
  id: string;
  question: string;
  options: QuizOption[];
  explain: string;
}) {
  const { setQuiz } = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correctIndex = options.findIndex((o) => o.correct);

  function submit() {
    if (picked === null) return;
    setSubmitted(true);
    setQuiz(id, picked === correctIndex ? 1 : 0);
  }

  return (
    <div className="card my-8 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-jv-dark">
        Check your understanding
      </p>
      <h3 className="mt-1 text-lg font-semibold">{question}</h3>
      <ul className="mt-4 space-y-2">
        {options.map((opt, i) => {
          const show = submitted;
          const isCorrect = opt.correct;
          const isPick = picked === i;
          let cls = "border-line bg-panel";
          if (show && isCorrect) cls = "border-teal-500/50 bg-teal-50 dark:bg-teal-950/30";
          else if (show && isPick && !isCorrect)
            cls = "border-rose-400 bg-rose-50 dark:bg-rose-950/30";
          else if (isPick) cls = "border-jv bg-jv/5";
          return (
            <li key={i}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm ${cls}`}
              >
                <input
                  type="radio"
                  name={id}
                  className="mt-1"
                  checked={picked === i}
                  onChange={() => {
                    setPicked(i);
                    setSubmitted(false);
                  }}
                />
                <span>{opt.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={submit}
        disabled={picked === null}
        className="btn mt-4 text-sm disabled:opacity-50"
      >
        Check answer
      </button>
      {submitted && (
        <p className="mt-3 text-sm leading-6">
          {picked === correctIndex ? (
            <strong className="text-teal-700 dark:text-teal-300">Correct. </strong>
          ) : (
            <strong className="text-rose-700 dark:text-rose-300">Not quite. </strong>
          )}
          {explain}
        </p>
      )}
    </div>
  );
}
