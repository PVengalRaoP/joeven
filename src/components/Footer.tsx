"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/try/")) return null;

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl">{site.name}</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            A calm place to learn autonomous agents — from first Python
            function to a production loop.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Learn</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/tutorials" className="hover:text-ink">
                Curriculum
              </Link>
            </li>
            <li>
              <Link href="/path" className="hover:text-ink">
                Learning path
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:text-ink">
                Projects
              </Link>
            </li>
            <li>
              <Link href="/exercises" className="hover:text-ink">
                Practice
              </Link>
            </li>
            <li>
              <Link href="/certificates" className="hover:text-ink">
                Certificates
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-ink">
                About
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-ink">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-ink">
                Jobs
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-ink">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ink">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Weekly note</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            One agent pattern that survives contact with production.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-line px-5 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Joeven ·{" "}
        <a href={site.github} className="underline decoration-line underline-offset-2">
          GitHub
        </a>
      </div>
    </footer>
  );
}
