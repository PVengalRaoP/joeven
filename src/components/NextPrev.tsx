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
    <div className="mt-10 flex flex-wrap gap-3">
      {prev ? (
        <Link
          href={`/tutorials/${trackSlug}/${prev.slug}`}
          className="rounded-md border border-line px-4 py-3 font-bold hover:bg-panel"
        >
          ← {prev.title}
        </Link>
      ) : (
        <Link
          href="/tutorials"
          className="rounded-md border border-line px-4 py-3 font-bold hover:bg-panel"
        >
          ← All tutorials
        </Link>
      )}
      {next && (
        <Link
          href={`/tutorials/${trackSlug}/${next.slug}`}
          onClick={() => complete(lesson.id)}
          className="green-btn ml-auto"
        >
          Next: {next.title} →
        </Link>
      )}
      {!next && (
        <Link
          href={`/quiz/${trackSlug}`}
          onClick={() => complete(lesson.id)}
          className="green-btn ml-auto"
        >
          Take the {lesson.trackTitle} quiz →
        </Link>
      )}
    </div>
  );
}

export function CompleteToggle({ id }: { id: string }) {
  const { completed, complete, uncomplete } = useProgress();
  const done = completed.includes(id);
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input
        type="checkbox"
        checked={done}
        onChange={() => (done ? uncomplete(id) : complete(id))}
      />
      Mark as complete
    </label>
  );
}
