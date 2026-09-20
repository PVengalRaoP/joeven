import { exercises } from "@/content/exercises";
import { projects } from "@/content/projects";
import { references } from "@/content/reference";
import { agents } from "@/content/tracks/agents";
import { evals } from "@/content/tracks/eval";
import { llm } from "@/content/tracks/llm";
import { math } from "@/content/tracks/math";
import { ml } from "@/content/tracks/ml";
import { multiagent } from "@/content/tracks/multiagent";
import { prod } from "@/content/tracks/prod";
import { prompt } from "@/content/tracks/prompt";
import { python } from "@/content/tracks/python";
import { rag } from "@/content/tracks/rag";
import { start } from "@/content/tracks/start";
import { tools } from "@/content/tracks/tools";
import { transformers } from "@/content/tracks/transformers";
import { parseMarkdown } from "@/lib/markdown";
import type {
  Block,
  Lesson,
  Project,
  RawLesson,
  Track,
  TrackSource,
} from "@/lib/types";

const sources: TrackSource[] = [
  start,
  python,
  math,
  ml,
  transformers,
  llm,
  prompt,
  tools,
  rag,
  agents,
  multiagent,
  evals,
  prod,
].sort((a, b) => a.order - b.order);

function hydrateLesson(
  src: TrackSource,
  lesson: RawLesson,
  order: number,
): Lesson {
  return {
    ...lesson,
    track: src.slug,
    trackTitle: src.title,
    order,
    blocks: parseMarkdown(lesson.md),
    id: `${src.slug}/${lesson.slug}`,
  };
}

export const tracks: Track[] = sources.map((src) => ({
  ...src,
  lessons: src.lessons.map((lesson, i) => hydrateLesson(src, lesson, i)),
}));

export function getTrack(slug: string): Track | undefined {
  return tracks.find((t) => t.slug === slug);
}

export function getLesson(
  trackSlug: string,
  lessonSlug: string,
): Lesson | undefined {
  return getTrack(trackSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

export function allLessons(): Lesson[] {
  return tracks.flatMap((t) => t.lessons);
}

export function neighbors(trackSlug: string, lessonSlug: string) {
  const track = getTrack(trackSlug);
  if (!track) return { prev: null, next: null, track: null };
  const i = track.lessons.findIndex((l) => l.slug === lessonSlug);
  return {
    track,
    prev: i > 0 ? track.lessons[i - 1] : null,
    next: i >= 0 && i < track.lessons.length - 1 ? track.lessons[i + 1] : null,
  };
}

export function firstTryit(blocks: Block[]) {
  return blocks.find((b) => b.type === "tryit");
}

export function quizzesOf(lesson: Lesson) {
  return lesson.blocks.filter((b) => b.type === "quiz");
}

export function trackQuizzes(trackSlug: string) {
  const track = getTrack(trackSlug);
  if (!track) return [];
  return track.lessons.flatMap((lesson) =>
    quizzesOf(lesson).map((q) => ({ lesson, quiz: q })),
  );
}

export const allProjects: Project[] = projects;

export function getProject(slug: string) {
  return allProjects.find((p) => p.slug === slug);
}

export function hydratePart(part: RawLesson): Block[] {
  return parseMarkdown(part.md);
}

export { exercises, references };

export const stats = {
  tracks: tracks.length,
  lessons: allLessons().length,
  projects: allProjects.length,
  projectParts: allProjects.reduce((n, p) => n + p.parts.length, 0),
  exercises: exercises.length,
  references: references.length,
};

export function searchContent(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { lessons: [], projects: [], exercises: [], references: [] };
  const lessons = allLessons()
    .filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.slug.includes(q) ||
        l.trackTitle.toLowerCase().includes(q),
    )
    .slice(0, 24);
  const matchedProjects = allProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q)),
  );
  const matchedExercises = exercises
    .filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.prompt.toLowerCase().includes(q),
    )
    .slice(0, 16);
  const matchedRefs = references.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q),
  );
  return {
    lessons,
    projects: matchedProjects,
    exercises: matchedExercises,
    references: matchedRefs,
  };
}
