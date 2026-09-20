import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <main className="prose-jv mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Terms of Use</h1>
      <p>Last updated: 20 September 2026.</p>
      <p>
        Joeven tutorials are educational. Code samples are provided as-is, for
        learning. Do not put secrets into the playground. Do not use the site
        to attack systems you do not own.
      </p>
      <p>
        Certificates confirm that a quiz was passed in this browser. They are
        not an accredited degree.
      </p>
      <p>
        Job posts and sponsor creatives are paid placements. We may refuse
        listings that are misleading or harmful.
      </p>
      <p>
        Contact: <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </main>
  );
}
