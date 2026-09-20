import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Agent Engineer Jobs" };

const sample = [
  {
    title: "Agent Engineer",
    company: "Example Corp (sample listing)",
    loc: "Remote",
    note: "Ship tool-using agents with evals and traces. Sample post — replace with paid listings.",
  },
  {
    title: "Applied LLM Engineer",
    company: "Example Labs (sample listing)",
    loc: "Hybrid · Bengaluru",
    note: "RAG + structured output for support. Sample post.",
  },
];

export default function JobsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight">Jobs</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Hire people who learned the loop, not just the prompt. Listings are{" "}
        <strong className="text-ink">$299 for 30 days</strong>.
      </p>
      <a
        href="mailto:hello@joeven.com?subject=Post%20a%20job%20on%20Joeven"
        className="btn mt-6"
      >
        Post a job
      </a>
      <ul className="mt-10 space-y-4">
        {sample.map((j) => (
          <li key={j.title} className="card p-5">
            <h2 className="text-xl font-semibold">{j.title}</h2>
            <p className="text-sm text-muted">
              {j.company} · {j.loc}
            </p>
            <p className="mt-2 text-sm leading-6">{j.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        Learners: finish{" "}
        <Link className="underline decoration-line underline-offset-2" href="/projects">
          the projects
        </Link>{" "}
        and attach certificates.
      </p>
    </main>
  );
}
