import type { Metadata } from "next";

export const metadata: Metadata = { title: "Advertise" };

export default function AdvertisePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-tight">Advertise on Joeven</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Joeven reaches people who are actively learning to build agents —
        Python, RAG, evals, production.
      </p>
      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-code/50">
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="px-4 py-3">Partner card on one track, 7 days</td>
              <td className="px-4 py-3">$199</td>
            </tr>
            <tr className="border-t border-line">
              <td className="px-4 py-3">Home + curriculum, 7 days</td>
              <td className="px-4 py-3">$499</td>
            </tr>
            <tr className="border-t border-line">
              <td className="px-4 py-3">Named lesson partner, 30 days</td>
              <td className="px-4 py-3">$999</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-muted">
        We do not sell dark patterns. Partners must be relevant to builders.
      </p>
      <a className="btn mt-6" href="mailto:hello@joeven.com?subject=Advertise%20on%20Joeven">
        Email hello@joeven.com
      </a>
    </main>
  );
}
