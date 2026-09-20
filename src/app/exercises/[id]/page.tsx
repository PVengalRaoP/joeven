import { notFound } from "next/navigation";
import { exercises } from "@/lib/curriculum";
import { ExerciseClient } from "./ExerciseClient";

export function generateStaticParams() {
  return exercises.map((e) => ({ id: e.id }));
}

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ex = exercises.find((e) => e.id === id);
  if (!ex) notFound();
  return <ExerciseClient ex={ex} />;
}
