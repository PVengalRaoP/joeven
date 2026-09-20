import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
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
    title: `${lesson.title} Tutorial`,
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
    <div className="flex flex-col md:flex-row">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Sidebar track={track} current={slug} />
      <article className="min-w-0 flex-1 px-4 py-8 md:px-10">
        <p className="text-sm font-semibold text-muted">
          <Link href="/tutorials" className="hover:underline">
            Tutorials
          </Link>{" "}
          /{" "}
          <Link href={`/tutorials/${track.slug}`} className="hover:underline">
            {track.title}
          </Link>
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          {lesson.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{lesson.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
          <span className="rounded-full bg-panel px-2 py-0.5 capitalize">
            {lesson.level}
          </span>
          <span>{lesson.minutes} min read</span>
          <span>
            Lesson {lesson.order + 1} of {track.lessons.length}
          </span>
          <CompleteToggle id={lesson.id} />
          {tryit && tryit.type === "tryit" && (
            <Link
              href={`/try/${track.slug}/${lesson.slug}`}
              className="font-bold text-jv-darker"
            >
              Open playground →
            </Link>
          )}
        </div>
        <AdSlot slot="banner" className="mt-6 max-w-[820px]" />
        <div className="mt-6">
          <LessonBlocks blocks={lesson.blocks} quizPrefix={lesson.id} />
        </div>
        <NextPrev
          trackSlug={track.slug}
          lesson={lesson}
          prev={prev}
          next={next}
        />
      </article>
      <div className="hidden w-[200px] shrink-0 p-4 xl:block">
        <AdSlot />
      </div>
    </div>
  );
}
