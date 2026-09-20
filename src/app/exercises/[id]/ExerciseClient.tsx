"use client";

import Link from "next/link";
import { useState } from "react";
import { TryIt } from "@/components/TryIt";
import type { Exercise } from "@/lib/types";

export function ExerciseClient({ ex }: { ex: Exercise }) {
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState(false);

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/exercises">Exercises</Link> / {ex.track}
      </p>
      <h1 className="font-display mt-2 text-3xl tracking-tight">{ex.title}</h1>
      <p className="mt-3 text-lg leading-7">{ex.prompt}</p>
      <TryIt code={ex.starter} lang={ex.lang} tall />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setHint((v) => !v)}
        >
          {hint ? "Hide hint" : "Show hint"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setShow((v) => !v)}
        >
          {show ? "Hide solution" : "Show solution"}
        </button>
      </div>
      {hint && (
        <p className="mt-4 rounded-md border border-line bg-panel p-3 text-sm">
          {ex.hint}
        </p>
      )}
      {show && <TryIt code={ex.solution} lang={ex.lang} />}
    </main>
  );
}
