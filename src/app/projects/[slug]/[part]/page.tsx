import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonBlocks } from "@/components/LessonBlocks";
import { allProjects, getProject, hydratePart } from "@/lib/curriculum";

export function generateStaticParams() {
  return allProjects.flatMap((p) =>
    p.parts.map((part) => ({ slug: p.slug, part: part.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; part: string }>;
}): Promise<Metadata> {
  const { slug, part } = await params;
  const project = getProject(slug);
  const p = project?.parts.find((x) => x.slug === part);
  return { title: p ? `${p.title} — ${project?.title}` : "Project" };
}

export default async function ProjectPartPage({
  params,
}: {
  params: Promise<{ slug: string; part: string }>;
}) {
  const { slug, part: partSlug } = await params;
  const project = getProject(slug);
  const index = project?.parts.findIndex((p) => p.slug === partSlug) ?? -1;
  const part = project?.parts[index];
  if (!project || !part) notFound();
  const prev = project.parts[index - 1];
  const next = project.parts[index + 1];
  const blocks = hydratePart(part);

  return (
    <main className="mx-auto max-w-[820px] px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/projects">Projects</Link> /{" "}
        <Link href={`/projects/${project.slug}`}>{project.title}</Link> / Part{" "}
        {index + 1}
      </p>
      <h1 className="mt-2 text-4xl font-extrabold">{part.title}</h1>
      <p className="mt-3 text-lg text-muted">{part.summary}</p>
      <div className="mt-6">
        <LessonBlocks
          blocks={blocks}
          quizPrefix={`project/${project.slug}/${part.slug}`}
        />
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        {prev ? (
          <Link
            href={`/projects/${project.slug}/${prev.slug}`}
            className="rounded-md border border-line px-4 py-3 font-bold"
          >
            ← {prev.title}
          </Link>
        ) : (
          <Link
            href={`/projects/${project.slug}`}
            className="rounded-md border border-line px-4 py-3 font-bold"
          >
            ← Project home
          </Link>
        )}
        {next ? (
          <Link
            href={`/projects/${project.slug}/${next.slug}`}
            className="green-btn ml-auto"
          >
            Next: {next.title} →
          </Link>
        ) : (
          <Link href="/projects" className="green-btn ml-auto">
            All projects →
          </Link>
        )}
      </div>
    </main>
  );
}
