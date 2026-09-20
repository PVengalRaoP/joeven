import { notFound } from "next/navigation";
import { getTrack, tracks } from "@/lib/curriculum";
import QuizClient from "./QuizClient";

export function generateStaticParams() {
  return tracks.map((t) => ({ track: t.slug }));
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
