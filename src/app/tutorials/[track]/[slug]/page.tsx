import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CompleteToggle, NextPrev } from "@/components/NextPrev";
import { LessonBlocks } from "@/components/LessonBlocks";
import { Sidebar } from "@/components/Sidebar";
import {
  firstTryit,
  getLesson,
  getTrack,
  neighbors,
  tracks,
} from "@/lib/curriculum";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return tracks.flatMap((t) =>
    t.lessons.map((l) => ({ track: t.slug, slug: l.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string; slug: string }>;
}): Promise<Metadata> {
  const { track, slug } = await params;
  const lesson = getLesson(track, slug);
  if (!lesson) return { title: "Lesson" };
  return {
    title: lesson.title,
    description: lesson.summary,
    alternates: {
      canonical: `${site.domain}/tutorials/${track}/${slug}`,
    },
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ track: string; slug: string }>;
}) {
  const { track: trackSlug, slug } = await params;
  const track = getTrack(trackSlug);
  const lesson = getLesson(trackSlug, slug);
  if (!track || !lesson) notFound();
  const { prev, next } = neighbors(trackSlug, slug);
  const tryit = firstTryit(lesson.blocks);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    educationalLevel: lesson.level,
    timeRequired: `PT${lesson.minutes}M`,
    isPartOf: {
      "@type": "Course",
      name: `${track.title} — Joeven`,
      url: `${site.domain}/tutorials/${track.slug}`,
    },
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col md:flex-row">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Sidebar track={track} current={slug} />
      <article className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">
        <p className="text-sm text-muted">
          <Link href="/tutorials" className="hover:text-ink">
            Curriculum
          </Link>
          <span className="mx-2 text-line">/</span>
          <Link href={`/tutorials/${track.slug}`} className="hover:text-ink">
            {track.title}
          </Link>
        </p>
        <h1 className="font-display mt-3 text-4xl tracking-tight md:text-5xl">
          {lesson.title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
          {lesson.summary}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span className="rounded-full bg-code px-2.5 py-0.5 capitalize">
            {lesson.level}
          </span>
          <span>{lesson.minutes} min</span>
          <span>
            {lesson.order + 1} / {track.lessons.length}
          </span>
          <CompleteToggle id={lesson.id} />
        </div>
        <div className="mt-8">
          <LessonBlocks
            blocks={lesson.blocks}
            quizPrefix={lesson.id}
            playgroundHref={
              tryit && tryit.type === "tryit"
                ? `/try/${track.slug}/${lesson.slug}`
                : undefined
            }
          />
        </div>
        <NextPrev
          trackSlug={track.slug}
          lesson={lesson}
          prev={prev}
          next={next}
        />
      </article>
    </div>
  );
}
