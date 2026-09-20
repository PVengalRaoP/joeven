"use client";

import Link from "next/link";
import { plans } from "@/lib/site";
import { useProgress } from "@/components/ProgressProvider";

export default function PricingPage() {
  const { pro, unlockPro } = useProgress();

  return (
    <main className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">Pricing</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        The academy is free. Optional Pro, partners, and a job board keep the
        lights on — not a paywall on the basics.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            id={p.id}
            className={`card p-6 ${p.featured ? "border-jv/50 ring-2 ring-jv/20" : ""}`}
          >
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="mt-3 text-4xl font-extrabold">
              {p.price}
              <span className="text-base font-medium text-muted">{p.period}</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            {p.id === "pro" ? (
              <button
                type="button"
                onClick={unlockPro}
                className="btn mt-6 w-full"
              >
                {pro ? "Pro is on in this browser" : "Activate Pro demo"}
              </button>
            ) : (
              <Link href={p.href} className="btn mt-6 w-full">
                {p.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Stripe checkout wires in with <code>NEXT_PUBLIC_STRIPE_PRICE_PRO</code>{" "}
        when you are ready to take live payments. The demo unlock is for this
        browser only (hides ads, Pro badge on certificates).
      </p>
      <section className="card mt-12 p-6">
        <h2 className="text-2xl font-semibold">Other revenue</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          <li>
            <Link href="/advertise" className="font-semibold text-jv-darker">
              Lesson sponsors
            </Link>{" "}
            — $199–$999 / week depending on track traffic.
          </li>
          <li>
            <Link href="/jobs" className="font-semibold text-jv-darker">
              Job listings
            </Link>{" "}
            — $299 / 30 days for an Agent Engineer post.
          </li>
          <li>
            Affiliate tools (disclosed) for model APIs, vector databases, and
            eval platforms.
          </li>
        </ul>
      </section>
    </main>
  );
}
