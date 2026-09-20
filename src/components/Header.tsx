"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import { useProgress } from "./ProgressProvider";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { pro } = useProgress();
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

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("joeven-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  if (hide) return null;

  return (
    <header className="sticky top-0 z-40">
      <div className="flex h-14 items-center gap-3 border-b border-line bg-white px-3 dark:bg-[#0f171c] md:px-5">
        <button
          className="rounded p-2 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
        </button>
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-jv text-lg text-white">
            J
          </span>
          <span className="text-xl">
            {site.name}
            <span className="hidden text-muted sm:inline">.com</span>
          </span>
        </Link>
        <form
          className="ml-auto hidden max-w-md flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tutorials, e.g. ReAct, cosine, pydantic"
            className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm outline-none focus:border-jv"
          />
        </form>
        <Link
          href="/pricing"
          className={`hidden rounded-full px-3 py-1.5 text-sm font-bold sm:inline ${
            pro ? "bg-panel text-ink" : "bg-black text-white"
          }`}
        >
          {pro ? "Pro on" : "Pro"}
        </Link>
        <button
          type="button"
          onClick={toggleDark}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
          aria-label="Toggle dark mode"
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
      <nav className="flex h-11 items-center gap-1 overflow-x-auto bg-jv px-2 text-white md:px-4">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold ${
                active ? "bg-black/20" : "hover:bg-white/15"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/path"
          className="ml-auto whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold hover:bg-white/15"
        >
          Learning path
        </Link>
      </nav>
      {open && (
        <div className="border-b border-line bg-white p-3 md:hidden dark:bg-[#0f171c]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="mb-2 w-full rounded-md border border-line px-3 py-2"
            />
          </form>
          <div className="grid grid-cols-2 gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded bg-panel px-3 py-2 text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
