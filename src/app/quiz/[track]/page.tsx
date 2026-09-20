import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTrack, tracks } from "@/lib/curriculum";
import QuizClient from "./QuizClient";

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
  return { title: t ? `${t.title} Quiz` : "Quiz" };
}

export default async function TrackQuizPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();
  return <QuizClient track={track} />;
}
