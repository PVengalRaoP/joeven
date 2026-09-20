import type { Metadata } from "next";

export const metadata: Metadata = { title: "Advertise" };

export default function AdvertisePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-extrabold">Advertise on Joeven</h1>
      <p className="mt-4 text-lg text-muted">
        Joeven reaches people who are actively learning to build agents —
        Python, RAG, evals, production. That is a rare audience.
      </p>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border border-line p-2">Slot</th>
            <th className="border border-line p-2">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-line p-2">In-article sponsor (one track, 7 days)</td>
            <td className="border border-line p-2">$199</td>
          </tr>
          <tr>
            <td className="border border-line p-2">Homepage + tutorial sidebar, 7 days</td>
            <td className="border border-line p-2">$499</td>
          </tr>
          <tr>
            <td className="border border-line p-2">Named lesson sponsor, 30 days</td>
            <td className="border border-line p-2">$999</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-6">
        We do not sell dark patterns or spyware. Sponsors must be relevant to
        builders (models, infra, eval, hiring).
      </p>
      <a className="green-btn mt-6" href="mailto:hello@joeven.com?subject=Advertise%20on%20Joeven">
        Email hello@joeven.com
      </a>
    </main>
  );
}
