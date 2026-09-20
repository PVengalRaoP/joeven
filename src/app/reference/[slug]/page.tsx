import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonBlocks } from "@/components/LessonBlocks";
import { parseMarkdown } from "@/lib/markdown";
import { references } from "@/lib/curriculum";

export function generateStaticParams() {
  return references.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = references.find((x) => x.slug === slug);
  return { title: r ? r.title : "Reference" };
}

export default async function ReferenceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = references.find((x) => x.slug === slug);
  if (!r) notFound();
  return (
    <main className="mx-auto max-w-[820px] px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/reference">Reference</Link> / {r.group}
      </p>
      <h1 className="mt-2 text-4xl font-extrabold">{r.title}</h1>
      <p className="mt-3 text-lg text-muted">{r.summary}</p>
      <div className="mt-6">
        <LessonBlocks blocks={parseMarkdown(r.md)} quizPrefix={`ref/${r.slug}`} />
      </div>
    </main>
  );
}
