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
  return { title: t ? t.title : "Track" };
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
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-sm text-muted">
        <Link href="/tutorials" className="hover:text-ink">
          Curriculum
        </Link>
      </p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">{t.title}</h1>
      <p className="mt-3 text-lg leading-8 text-muted">{t.tagline}</p>
      <ol className="card mt-8 divide-y divide-line overflow-hidden">
        {t.lessons.map((l, i) => (
          <li key={l.slug}>
            <Link
              href={`/tutorials/${t.slug}/${l.slug}`}
              className="flex items-start gap-4 px-4 py-4 hover:bg-code/40"
            >
              <span className="w-8 font-mono text-sm text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{l.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{l.summary}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{l.minutes} min</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href={`/tutorials/${t.slug}/${t.lessons[0].slug}`} className="btn mt-8">
        Start this track
      </Link>
    </main>
  );
}
