"use client";

import { useProgress } from "./ProgressProvider";

export function AdSlot({
  slot = "sidebar",
  className = "",
}: {
  slot?: "sidebar" | "inarticle" | "banner";
  className?: string;
}) {
  const { pro } = useProgress();
  if (pro) return null;

  const sizes =
    slot === "banner"
      ? "min-h-[72px]"
      : slot === "inarticle"
        ? "min-h-[88px]"
        : "min-h-[160px]";

  return (
    <aside className={`card p-4 ${sizes} ${className}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Partner
      </p>
      <p className="mt-2 text-sm font-semibold">Tools for people shipping agents</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Sponsor a lesson from $199 / week.{" "}
        <a className="underline decoration-line underline-offset-2" href="/advertise">
          Advertise
        </a>
        {" · "}
        <a className="underline decoration-line underline-offset-2" href="/pricing">
          Hide with Pro
        </a>
      </p>
    </aside>
  );
}
