"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/types";
import { useProgress } from "./ProgressProvider";

export function Sidebar({
  track,
  current,
}: {
  track: Track;
  current: string;
}) {
  const { completed } = useProgress();
  const router = useRouter();
  const doneCount = track.lessons.filter((l) => completed.includes(l.id)).length;
  const pct = Math.round((doneCount / track.lessons.length) * 100);
  const idx = track.lessons.findIndex((l) => l.slug === current);

  return (
    <>
      <div className="border-b border-line bg-panel px-4 py-3 md:hidden">
        <label className="text-xs font-medium text-muted">
          {track.title} · lesson {idx + 1} of {track.lessons.length}
        </label>
        <select
          className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm"
          value={current}
          onChange={(e) =>
            router.push(`/tutorials/${track.slug}/${e.target.value}`)
          }
        >
          {track.lessons.map((l, i) => (
            <option key={l.slug} value={l.slug}>
              {i + 1}. {l.title}
              {completed.includes(l.id) ? " ✓" : ""}
            </option>
          ))}
        </select>
      </div>

      <aside className="hidden w-[280px] shrink-0 md:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
          <div className="card p-4">
            <Link
              href={`/tutorials/${track.slug}`}
              className="text-xs font-medium text-muted hover:text-ink"
            >
              {track.title}
            </Link>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-code">
              <div
                className="h-full rounded-full bg-jv"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {doneCount} / {track.lessons.length} complete
            </p>
            <ol className="mt-4 space-y-0.5">
              {track.lessons.map((l, i) => {
                const active = l.slug === current;
                const done = completed.includes(l.id);
                return (
                  <li key={l.slug}>
                    <Link
                      href={`/tutorials/${track.slug}/${l.slug}`}
                      className={`flex items-start gap-2 rounded-xl px-2.5 py-2 text-sm leading-5 ${
                        active
                          ? "bg-jv/10 font-semibold text-ink"
                          : "text-muted hover:bg-code hover:text-ink"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                          active
                            ? "bg-jv text-white dark:text-[#120f1c]"
                            : done
                              ? "bg-ink/80 text-white dark:bg-white dark:text-ink"
                              : "bg-code text-muted"
                        }`}
                      >
                        {done && !active ? "✓" : i + 1}
                      </span>
                      <span>{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </aside>
    </>
  );
}
