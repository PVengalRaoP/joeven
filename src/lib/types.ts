export type Level = "beginner" | "intermediate" | "advanced";

export type RawLesson = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  md: string;
};

export type TrackSource = {
  slug: string;
  title: string;
  short: string;
  tagline: string;
  color: string;
  order: number;
  lessons: RawLesson[];
};

import type { VizSpec } from "./viz";

export type QuizOption = { text: string; correct: boolean };

export type Block =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; html: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "tryit"; lang: string; code: string }
  | { type: "viz"; spec: VizSpec }
  | {
      type: "quiz";
      question: string;
      options: QuizOption[];
      explain: string;
    }
  | { type: "callout"; kind: "tip" | "note" | "warning"; html: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };

export type Lesson = RawLesson & {
  track: string;
  trackTitle: string;
  order: number;
  blocks: Block[];
  id: string;
};

export type Track = Omit<TrackSource, "lessons"> & {
  lessons: Lesson[];
};

export type ProjectPart = RawLesson;

export type Project = {
  slug: string;
  title: string;
  summary: string;
  level: Level;
  hours: string;
  skills: string[];
  outcome: string;
  parts: ProjectPart[];
};

export type Exercise = {
  id: string;
  track: string;
  title: string;
  prompt: string;
  starter: string;
  solution: string;
  hint: string;
  lang: string;
};

export type ReferenceArticle = {
  slug: string;
  title: string;
  group: string;
  summary: string;
  md: string;
};
