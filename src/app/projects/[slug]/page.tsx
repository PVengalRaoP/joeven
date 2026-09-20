import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allProjects, getProject } from "@/lib/curriculum";

export function generateStaticParams() {
  return allProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  return { title: p ? p.title : "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm text-muted">
        <Link href="/projects">Projects</Link>
      </p>
      <h1 className="mt-2 text-4xl font-extrabold">{project.title}</h1>
      <p className="mt-3 text-lg text-muted">{project.summary}</p>
      <p className="mt-4 text-sm">
        <strong>Outcome:</strong> {project.outcome}
      </p>
      <p className="mt-1 text-sm text-muted">
        {project.level} · {project.hours}
      </p>
      <ol className="mt-8 divide-y divide-line rounded-lg border border-line">
        {project.parts.map((part, i) => (
          <li key={part.slug}>
            <Link
              href={`/projects/${project.slug}/${part.slug}`}
              className="flex gap-4 px-4 py-3 hover:bg-panel"
            >
              <span className="font-mono text-muted">{i + 1}</span>
              <div>
                <p className="font-bold">{part.title}</p>
                <p className="text-sm text-muted">{part.summary}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href={`/projects/${project.slug}/${project.parts[0].slug}`}
        className="green-btn mt-8"
      >
        Start project »
      </Link>
    </main>
  );
}
