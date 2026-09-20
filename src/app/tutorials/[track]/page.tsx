import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, tracks } from "@/lib/curriculum";

export function generateStaticParams() {
  return tracks.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string }>;
}): Promise<Metadata> {
  const { track } = await params;
  const t = getTrack(track);
  return { title: t ? `${t.title} Tutorial` : "Tutorial" };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  const t = getTrack(track);
  if (!t) notFound();
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/tutorials">Tutorials</Link>
      </p>
      <h1 className="mt-2 text-4xl font-extrabold">{t.title} Tutorial</h1>
      <p className="mt-3 text-lg text-muted">{t.tagline}</p>
      <ol className="mt-8 divide-y divide-line rounded-lg border border-line">
        {t.lessons.map((l, i) => (
          <li key={l.slug}>
            <Link
              href={`/tutorials/${t.slug}/${l.slug}`}
              className="flex items-start gap-4 px-4 py-3 hover:bg-panel"
            >
              <span className="w-8 font-mono text-muted">{i + 1}</span>
              <div>
                <p className="font-bold">{l.title}</p>
                <p className="text-sm text-muted">{l.summary}</p>
              </div>
              <span className="ml-auto shrink-0 text-xs text-muted">
                {l.minutes} min
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href={`/tutorials/${t.slug}/${t.lessons[0].slug}`}
        className="green-btn mt-8"
      >
        Start {t.short} »
      </Link>
    </main>
  );
}
