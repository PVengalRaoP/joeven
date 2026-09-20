import { notFound } from "next/navigation";
import { TryIt } from "@/components/TryIt";
import { firstTryit, getLesson, tracks } from "@/lib/curriculum";
import Link from "next/link";

export function generateStaticParams() {
  return tracks.flatMap((t) =>
    t.lessons
      .filter((l) => firstTryit(l.blocks))
      .map((l) => ({ track: t.slug, slug: l.slug })),
  );
}

export default async function TryPage({
  params,
}: {
  params: Promise<{ track: string; slug: string }>;
}) {
  const { track, slug } = await params;
  const lesson = getLesson(track, slug);
  const tryit = lesson ? firstTryit(lesson.blocks) : undefined;
  if (!lesson || !tryit || tryit.type !== "tryit") notFound();

  return (
    <div className="flex h-screen flex-col bg-[#1d2b36] text-white">
      <div className="flex items-center gap-3 bg-jv px-3 py-2">
        <Link href={`/tutorials/${track}/${slug}`} className="font-bold">
          ← Back to lesson
        </Link>
        <span className="text-sm opacity-90">{lesson.title} — Tryit Editor</span>
        <Link href="/" className="ml-auto font-extrabold">
          Joeven
        </Link>
      </div>
      <div className="min-h-0 flex-1 bg-white text-ink">
        <TryIt code={tryit.code} lang={tryit.lang} split />
      </div>
    </div>
  );
}
