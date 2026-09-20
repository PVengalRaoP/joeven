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
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-sm text-muted">
        <Link href="/projects" className="hover:text-ink">
          Projects
        </Link>
      </p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">{project.title}</h1>
      <p className="mt-3 text-lg leading-8 text-muted">{project.summary}</p>
      <p className="mt-4 text-sm">
        <strong>Outcome:</strong> {project.outcome}
      </p>
      <p className="mt-1 text-sm text-muted">
        {project.level} · {project.hours}
      </p>
      <ol className="card mt-8 divide-y divide-line overflow-hidden">
        {project.parts.map((part, i) => (
          <li key={part.slug}>
            <Link
              href={`/projects/${project.slug}/${part.slug}`}
              className="flex gap-4 px-4 py-4 hover:bg-code/40"
            >
              <span className="font-mono text-sm text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-semibold">{part.title}</p>
                <p className="mt-1 text-sm text-muted">{part.summary}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href={`/projects/${project.slug}/${project.parts[0].slug}`}
        className="btn mt-8"
      >
        Start this project
      </Link>
    </main>
  );
}
