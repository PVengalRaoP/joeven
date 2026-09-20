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
    <div className="my-8 rounded-lg border border-line bg-panel p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-jv-darker">
        Exercise
      </p>
      <h3 className="mt-1 text-lg font-bold">Quiz: {question}</h3>
      <ul className="mt-3 space-y-2">
        {options.map((opt, i) => {
          const show = submitted;
          const isCorrect = opt.correct;
          const isPick = picked === i;
          let cls = "border-line bg-white dark:bg-transparent";
          if (show && isCorrect) cls = "border-jv bg-emerald-50 dark:bg-emerald-950/40";
          else if (show && isPick && !isCorrect)
            cls = "border-red-400 bg-red-50 dark:bg-red-950/30";
          else if (isPick) cls = "border-jv bg-emerald-50/50";
          return (
            <li key={i}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${cls}`}
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
        className="green-btn mt-4 text-sm disabled:opacity-50"
      >
        Submit answer »
      </button>
      {submitted && (
        <p className="mt-3 text-sm leading-6">
          {picked === correctIndex ? (
            <strong className="text-jv-darker">Correct.</strong>
          ) : (
            <strong className="text-red-700">Not quite.</strong>
          )}{" "}
          {explain}
        </p>
      )}
    </div>
  );
}
