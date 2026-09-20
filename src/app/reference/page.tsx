import type { Metadata } from "next";
import Link from "next/link";
import { references } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Reference" };

export default function ReferencePage() {
  const groups = [...new Set(references.map((r) => r.group))];
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Reference</h1>
      <p className="mt-3 text-lg text-muted">
        Dense cheatsheets — the pages you pin while building.
      </p>
      {groups.map((g) => (
        <section key={g} className="mt-8">
          <h2 className="text-2xl font-bold">{g}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {references
              .filter((r) => r.group === g)
              .map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/reference/${r.slug}`}
                    className="block rounded-lg border border-line p-4 hover:border-jv"
                  >
                    <p className="font-bold">{r.title}</p>
                    <p className="mt-1 text-sm text-muted">{r.summary}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
