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
    <main className="mx-auto max-w-[42rem] px-5 py-14">
      <p className="text-sm text-muted">
        <Link href="/reference" className="hover:text-ink">
          Reference
        </Link>
        <span className="mx-2 text-line">/</span>
        {r.group}
      </p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">{r.title}</h1>
      <p className="mt-3 text-lg leading-8 text-muted">{r.summary}</p>
      <div className="mt-6">
        <LessonBlocks blocks={parseMarkdown(r.md)} quizPrefix={`ref/${r.slug}`} />
      </div>
    </main>
  );
}
