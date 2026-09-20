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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Jobs</h1>
      <p className="mt-3 text-lg text-muted">
        Hire people who learned the loop, not just the prompt. Listings are{" "}
        <strong>$299 for 30 days</strong>.
      </p>
      <a href="mailto:hello@joeven.com?subject=Post%20a%20job%20on%20Joeven" className="green-btn mt-5">
        Post a job — $299
      </a>
      <ul className="mt-10 space-y-4">
        {sample.map((j) => (
          <li key={j.title} className="rounded-xl border border-line p-5">
            <h2 className="text-xl font-bold">{j.title}</h2>
            <p className="text-sm text-muted">
              {j.company} · {j.loc}
            </p>
            <p className="mt-2 text-sm">{j.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        Learners: finish{" "}
        <Link className="underline" href="/projects">
          the projects
        </Link>{" "}
        and attach certificates. That is the resume.
      </p>
    </main>
  );
}
