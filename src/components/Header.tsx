"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import { useProgress } from "./ProgressProvider";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { completed } = useProgress();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const hide = pathname.startsWith("/try/");

  useEffect(() => {
    const stored = localStorage.getItem("joeven-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("joeven-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  if (hide) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-[color-mix(in_srgb,var(--jv-bg)_78%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-4 bg-ink" />
            <span className="block h-0.5 w-4 bg-ink" />
          </span>
        </button>

        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-jv text-sm font-semibold text-white shadow-[0_8px_20px_var(--jv-glow)] dark:text-[#120f1c]">
            J
          </span>
          <span className="font-display text-xl tracking-tight">
            {site.name}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-muted hover:bg-panel hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form
          className="ml-auto hidden w-full max-w-xs lg:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ReAct, RAG, cosine…"
            className="w-full rounded-full border border-line bg-panel/80 px-4 py-2 text-sm outline-none ring-jv/30 placeholder:text-muted focus:ring-2"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {completed.length > 0 && (
            <Link
              href="/path"
              className="hidden rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted sm:inline"
            >
              {completed.length} done
            </Link>
          )}
          <button
            type="button"
            onClick={toggleDark}
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-sm"
            aria-label="Toggle dark mode"
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line px-4 py-4 md:hidden">
          <form
            className="mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search lessons"
              className="w-full rounded-2xl border border-line bg-panel px-4 py-3"
            />
          </form>
          <div className="grid gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-base hover:bg-panel"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/path" className="rounded-xl px-3 py-3 text-base hover:bg-panel">
              Learning path
            </Link>
            <Link href="/quiz" className="rounded-xl px-3 py-3 text-base hover:bg-panel">
              Quizzes
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
