"use client";

import Link from "next/link";
import { allLessons } from "@/lib/curriculum";
import { useProgress } from "./ProgressProvider";

export function ContinueCard() {
  const { completed, ready } = useProgress();
  if (!ready) return null;
  const lessons = allLessons();
  const next = lessons.find((l) => !completed.includes(l.id)) ?? lessons[0];
  if (!next) return null;
  const started = completed.length > 0;
  const pct = Math.round((completed.length / lessons.length) * 100);

  return (
    <div className="card mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-jv-dark">
          {started ? `Continue · ${pct}% of the academy` : "Start here"}
        </p>
        <p className="mt-1 font-display text-2xl tracking-tight">{next.title}</p>
        <p className="mt-1 text-sm text-muted">
          {next.trackTitle} · {next.minutes} min
        </p>
      </div>
      <Link href={`/tutorials/${next.track}/${next.slug}`} className="btn shrink-0">
        {started ? "Resume lesson" : "Begin lesson"}
      </Link>
    </div>
  );
}
