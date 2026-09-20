import type { Metadata } from "next";
import Link from "next/link";
import { references } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Reference" };

export default function ReferencePage() {
  const groups = [...new Set(references.map((r) => r.group))];
  return (
    <main className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight">Reference</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Dense cheatsheets — the pages you pin while building.
      </p>
      {groups.map((g) => (
        <section key={g} className="mt-10">
          <h2 className="text-xl font-semibold">{g}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {references
              .filter((r) => r.group === g)
              .map((r) => (
                <li key={r.slug}>
                  <Link href={`/reference/${r.slug}`} className="card block p-4 hover:border-jv/40">
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{r.summary}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
