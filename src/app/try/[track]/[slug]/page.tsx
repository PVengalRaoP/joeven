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
    <div className="flex h-screen flex-col bg-[#121018] text-zinc-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <Link
          href={`/tutorials/${track}/${slug}`}
          className="rounded-full px-3 py-1 text-sm text-zinc-300 hover:bg-white/10"
        >
          ← Lesson
        </Link>
        <span className="truncate text-sm text-zinc-400">{lesson.title}</span>
        <Link href="/" className="ml-auto font-display text-lg">
          Joeven
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <TryIt code={tryit.code} lang={tryit.lang} split />
      </div>
    </div>
  );
}
