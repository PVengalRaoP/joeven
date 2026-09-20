"use client";

import Link from "next/link";
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
  return (
    <aside className="w-full shrink-0 overflow-y-auto border-r border-line bg-panel md:sticky md:top-[100px] md:h-[calc(100vh-100px)] md:w-[250px]">
      <div className="px-3 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          {track.title} tutorial
        </p>
        <ol className="mt-2 text-sm">
          {track.lessons.map((l, i) => {
            const active = l.slug === current;
            const done = completed.includes(l.id);
            return (
              <li key={l.slug}>
                <Link
                  href={`/tutorials/${track.slug}/${l.slug}`}
                  className={`flex items-start gap-2 rounded px-2 py-1.5 ${
                    active
                      ? "bg-jv font-semibold text-white"
                      : "hover:bg-white/70 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={`mt-0.5 text-[11px] ${active ? "text-white/80" : "text-muted"}`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span>{l.title}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
