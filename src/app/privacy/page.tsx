import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="prose-jv mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-4xl tracking-tight">Privacy Policy</h1>
      <p>Last updated: 20 September 2026. Site: {site.domain}</p>
      <h2>What we store in your browser</h2>
      <p>
        Lesson progress, quiz scores, your certificate name, and theme
        preference are stored in <code>localStorage</code> on your device. We do
        not receive that data unless you later create an account (not required
        for the curriculum).
      </p>
      <h2>Newsletter</h2>
      <p>
        If you submit an email, we use it only to send Joeven learning emails.
        You can unsubscribe at any time. We do not sell emails.
      </p>
      <h2>Analytics and ads</h2>
      <p>
        When Google AdSense or similar is enabled, those providers may set
        cookies and collect usage data under their policies.
      </p>
      <h2>Python playground</h2>
      <p>
        Code in Try it yourself runs in your browser via Pyodide (WebAssembly).
        It is not sent to Joeven servers.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions: <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </main>
  );
}
