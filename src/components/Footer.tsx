"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/try/")) return null;

  return (
    <footer className="mt-auto border-t border-line bg-[#1d2b36] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">{site.name}</p>
          <p className="mt-2 text-sm text-white/70">
            A tutorial academy for autonomous AI agents — Python, math, models,
            tools, and production.
          </p>
        </div>
        <div>
          <p className="font-semibold">Learn</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>
              <Link href="/tutorials">Tutorials</Link>
            </li>
            <li>
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/exercises">Exercises</Link>
            </li>
            <li>
              <Link href="/reference">Reference</Link>
            </li>
            <li>
              <Link href="/certificates">Certificates</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Company</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/jobs">Jobs</Link>
            </li>
            <li>
              <Link href="/advertise">Advertise</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Newsletter</p>
          <p className="mt-2 text-sm text-white/70">
            One practical agent pattern a week. No spam.
          </p>
          <NewsletterForm dark />
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Joeven · {site.domain.replace("https://", "")} ·{" "}
        <a href={site.github} className="underline">
          GitHub
        </a>
      </div>
    </footer>
  );
}
