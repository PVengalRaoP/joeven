"use client";

import { useEffect, useRef, useState } from "react";
import { highlightPython } from "@/lib/highlight";

type Pyodide = {
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  runPythonAsync: (code: string) => Promise<unknown>;
};

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<Pyodide>;
  }
}

let pyodidePromise: Promise<Pyodide> | null = null;

function loadPyodide(): Promise<Pyodide> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${indexURL}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load Pyodide"));
        document.head.appendChild(script);
      });
    }
    if (!window.loadPyodide) throw new Error("Pyodide missing");
    return window.loadPyodide({ indexURL });
  })();
  return pyodidePromise;
}

export function TryIt({
  code,
  lang = "python",
  tall = false,
  split = false,
}: {
  code: string;
  lang?: string;
  tall?: boolean;
  split?: boolean;
}) {
  const original = useRef(code.trimEnd());
  const [value, setValue] = useState(code.trimEnd());
  const [output, setOutput] = useState("Click Run to execute Python in your browser.");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    original.current = code.trimEnd();
    setValue(code.trimEnd());
  }, [code]);

  async function run() {
    if (lang !== "python") {
      setOutput("This playground runs Python only.");
      return;
    }
    setRunning(true);
    setErr(false);
    setOutput("Running…");
    try {
      const py = await loadPyodide();
      setReady(true);
      let buf = "";
      py.setStdout({
        batched: (s) => {
          buf += s;
        },
      });
      py.setStderr({
        batched: (s) => {
          buf += s;
        },
      });
      const result = await py.runPythonAsync(value);
      if (result !== undefined && result !== null && String(result) !== "undefined") {
        const text = String(result);
        if (text && text !== "None") buf += (buf ? "\n" : "") + text;
      }
      setOutput(buf.trim() === "" ? "(no output — add a print())" : buf);
    } catch (e) {
      setErr(true);
      setOutput(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  const editor = (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      spellCheck={false}
      aria-label="Python editor"
      className={`w-full resize-y rounded-md border border-line bg-white p-3 font-mono text-[13px] leading-6 text-ink outline-none focus:border-jv dark:bg-[#0b1216] ${
        tall || split ? "min-h-[320px]" : "min-h-[180px]"
      } ${split ? "h-full min-h-[calc(100vh-140px)] rounded-none border-0" : ""}`}
    />
  );

  const result = (
    <pre
      className={`overflow-auto whitespace-pre-wrap rounded-md border p-3 font-mono text-[13px] leading-6 ${
        err
          ? "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
          : "border-line bg-[#fffef6] text-ink dark:bg-[#1b2418]"
      } ${split ? "h-full min-h-[calc(100vh-140px)] rounded-none border-0 border-l" : "min-h-[88px]"}`}
    >
      {output}
    </pre>
  );

  if (split) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-jv px-3 py-2 text-white">
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="rounded bg-white px-4 py-1.5 text-sm font-bold text-ink hover:bg-zinc-100 disabled:opacity-60"
          >
            {running ? "Running…" : "Run ▶"}
          </button>
          <button
            type="button"
            onClick={() => setValue(original.current)}
            className="rounded px-3 py-1.5 text-sm font-semibold hover:bg-white/15"
          >
            Reset
          </button>
          <span className="ml-auto text-xs opacity-90">
            {ready ? "Python ready (Pyodide)" : "Python loads on first Run"}
          </span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          {editor}
          {result}
        </div>
      </div>
    );
  }

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between bg-[#1d2b36] px-3 py-2 text-white">
        <span className="text-sm font-semibold">Example</span>
        <span className="text-[11px] uppercase tracking-wide text-white/60">
          {lang}
        </span>
      </div>
      <div className="example-box m-0 border-0 bg-[var(--jv-code)]">
        {editor}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={run} disabled={running} className="green-btn text-sm">
            {running ? "Running…" : "Try it Yourself »"}
          </button>
          <button
            type="button"
            onClick={() => setValue(original.current)}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold dark:bg-transparent"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="border-t border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-transparent">
        Output
      </div>
      {result}
    </div>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const html =
    lang === "python" || lang === "py"
      ? highlightPython(code)
      : code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (
    <div className="my-4 overflow-hidden rounded-md border border-line">
      <div className="flex items-center justify-between bg-panel px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>{lang || "code"}</span>
      </div>
      <pre className="overflow-x-auto bg-[var(--jv-code)] p-3 font-mono text-[13px] leading-6">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
