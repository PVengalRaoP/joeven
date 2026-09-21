"use client";

import { useProgress } from "@/components/ProgressProvider";
import { tracks } from "@/lib/curriculum";
import { useRef } from "react";

export default function CertificatesPage() {
  const { quiz, name, setName } = useProgress();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function download(trackTitle: string, score: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 1200;
    canvas.height = 800;
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = "#4c3dff";
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, 1120, 720);
    ctx.fillStyle = "#4c3dff";
    ctx.fillRect(40, 40, 1120, 90);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px Georgia, serif";
    ctx.fillText("JOEVEN CERTIFICATE", 80, 100);
    ctx.fillStyle = "#1d2b36";
    ctx.font = "24px Georgia, serif";
    ctx.fillText("This certifies that", 80, 220);
    ctx.font = "bold 54px Georgia, serif";
    ctx.fillText(name || "Learner", 80, 290);
    ctx.font = "24px Georgia, serif";
    ctx.fillText(`completed the ${trackTitle} track on Joeven.com`, 80, 350);
    ctx.fillText(`Exam score: ${score}%`, 80, 400);
    ctx.fillText(
      `Issued ${new Date().toLocaleDateString()} · joeven.com`,
      80,
      520,
    );
    const a = document.createElement("a");
    a.download = `joeven-${trackTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-4xl tracking-tight">Certificates</h1>
      <p className="mt-3 text-muted">
        Pass a track quiz at 80%+. Certificates are generated in your browser
        (PNG). Add your name as you want it printed.
      </p>
      <label className="mt-6 block text-sm font-semibold">
        Name on certificate
        <input
          className="mt-1 w-full rounded-full border border-line bg-panel px-4 py-2 font-normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>
      <ul className="mt-8 space-y-3">
        {tracks.map((t) => {
          const score = quiz[`track:${t.slug}`];
          const ok = typeof score === "number" && score >= 80;
          return (
            <li
              key={t.slug}
              className="flex flex-wrap items-center justify-between gap-3 card p-4"
            >
              <div>
                <p className="font-bold">{t.title}</p>
                <p className="text-sm text-muted">
                  {typeof score === "number"
                    ? `Score ${score}%`
                    : "Quiz not taken"}
                </p>
              </div>
              <button
                type="button"
                disabled={!ok}
                onClick={() => download(t.title, score)}
                className="btn disabled:opacity-40"
              >
                Download PNG
              </button>
            </li>
          );
        })}
      </ul>
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
