"use client";

import Link from "next/link";
import { useProgress } from "./ProgressProvider";
import type { Lesson } from "@/lib/types";

export function NextPrev({
  trackSlug,
  lesson,
  prev,
  next,
}: {
  trackSlug: string;
  lesson: Lesson;
  prev: Lesson | null;
  next: Lesson | null;
}) {
  const { complete } = useProgress();

  return (
    <div className="mt-12 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/tutorials/${trackSlug}/${prev.slug}`}
          className="card p-4 hover:border-jv/40"
        >
          <p className="text-xs text-muted">Previous</p>
          <p className="mt-1 font-semibold">{prev.title}</p>
        </Link>
      ) : (
        <Link href="/tutorials" className="card p-4 hover:border-jv/40">
          <p className="text-xs text-muted">Curriculum</p>
          <p className="mt-1 font-semibold">All tracks</p>
        </Link>
      )}
      {next ? (
        <Link
          href={`/tutorials/${trackSlug}/${next.slug}`}
          onClick={() => complete(lesson.id)}
          className="card border-jv/30 bg-jv/5 p-4"
        >
          <p className="text-xs text-jv-dark">Up next</p>
          <p className="mt-1 font-semibold">{next.title}</p>
        </Link>
      ) : (
        <Link
          href={`/quiz/${trackSlug}`}
          onClick={() => complete(lesson.id)}
          className="card border-jv/30 bg-jv/5 p-4"
        >
          <p className="text-xs text-jv-dark">Finish the track</p>
          <p className="mt-1 font-semibold">Take the {lesson.trackTitle} quiz</p>
        </Link>
      )}
    </div>
  );
}

export function CompleteToggle({ id }: { id: string }) {
  const { completed, complete, uncomplete } = useProgress();
  const done = completed.includes(id);
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-line"
        checked={done}
        onChange={() => (done ? uncomplete(id) : complete(id))}
      />
      {done ? "Completed" : "Mark complete"}
    </label>
  );
}
