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
    <main className="mx-auto max-w-[42rem] px-5 py-14">
      <p className="text-sm text-muted">
        <Link href="/projects" className="hover:text-ink">
          Projects
        </Link>
        <span className="mx-2 text-line">/</span>
        <Link href={`/projects/${project.slug}`} className="hover:text-ink">
          {project.title}
        </Link>
        <span className="mx-2 text-line">/</span>
        Part {index + 1}
      </p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">{part.title}</h1>
      <p className="mt-3 text-lg leading-8 text-muted">{part.summary}</p>
      <div className="mt-8">
        <LessonBlocks
          blocks={blocks}
          quizPrefix={`project/${project.slug}/${part.slug}`}
        />
      </div>
      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/projects/${project.slug}/${prev.slug}`}
            className="card p-4 hover:border-jv/40"
          >
            <p className="text-xs text-muted">Previous</p>
            <p className="mt-1 font-semibold">{prev.title}</p>
          </Link>
        ) : (
          <Link href={`/projects/${project.slug}`} className="card p-4">
            <p className="text-xs text-muted">Project</p>
            <p className="mt-1 font-semibold">Overview</p>
          </Link>
        )}
        {next ? (
          <Link
            href={`/projects/${project.slug}/${next.slug}`}
            className="card border-jv/30 bg-jv/5 p-4"
          >
            <p className="text-xs text-jv-dark">Up next</p>
            <p className="mt-1 font-semibold">{next.title}</p>
          </Link>
        ) : (
          <Link href="/projects" className="card border-jv/30 bg-jv/5 p-4">
            <p className="text-xs text-jv-dark">Done</p>
            <p className="mt-1 font-semibold">All projects</p>
          </Link>
        )}
      </div>
    </main>
  );
}
