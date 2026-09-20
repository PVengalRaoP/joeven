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
      ? "min-h-[90px]"
      : slot === "inarticle"
        ? "min-h-[100px]"
        : "min-h-[240px]";

  return (
    <aside
      className={`rounded-md border border-dashed border-line bg-[var(--jv-ad)] p-3 text-center ${sizes} ${className}`}
    >
      <p className="text-[11px] uppercase tracking-wider text-muted">
        Advertisement
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">
        Reach engineers who are learning to ship agents.
      </p>
      <p className="mt-1 text-xs text-muted">
        Sponsor Joeven from $199 / week.{" "}
        <a className="underline" href="/advertise">
          Advertise
        </a>
      </p>
      <p className="mt-3 text-xs text-muted">
        Learners:{" "}
        <a className="underline" href="/pricing">
          Go Pro
        </a>{" "}
        to hide ads.
      </p>
    </aside>
  );
}
