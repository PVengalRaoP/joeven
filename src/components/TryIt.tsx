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
  fullHref,
}: {
  code: string;
  lang?: string;
  tall?: boolean;
  split?: boolean;
  fullHref?: string;
}) {
  const original = useRef(code.trimEnd());
  const [value, setValue] = useState(code.trimEnd());
  const [output, setOutput] = useState("Run to execute this in your browser. Nothing is sent to a server.");
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
      className={`w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-6 text-ink outline-none ${
        tall || split ? "min-h-[320px]" : "min-h-[168px]"
      } ${split ? "h-full min-h-[calc(100vh-140px)]" : ""}`}
    />
  );

  const result = (
    <pre
      className={`overflow-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 ${
        err ? "text-rose-700 dark:text-rose-300" : "text-ink"
      } ${split ? "h-full min-h-[calc(100vh-140px)] border-line md:border-l" : "min-h-[88px]"}`}
    >
      {output}
    </pre>
  );

  if (split) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[#121018] text-zinc-100">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#121018] disabled:opacity-60"
          >
            {running ? "Running…" : "Run"}
          </button>
          <button
            type="button"
            onClick={() => setValue(original.current)}
            className="rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10"
          >
            Reset
          </button>
          <span className="ml-auto text-xs text-zinc-400">
            {ready ? "Python is ready" : "Python loads on first run"}
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
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="text-sm font-medium">Live Python</span>
        <span className="flex items-center gap-3 text-xs text-muted">
          {fullHref ? (
            <a href={fullHref} className="text-muted! no-underline! hover:text-ink!">
              Open full playground
            </a>
          ) : null}
          <span>{lang}</span>
        </span>
      </div>
      {editor}
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        <button type="button" onClick={run} disabled={running} className="btn text-sm">
          {running ? "Running…" : "Run code"}
        </button>
        <button
          type="button"
          onClick={() => setValue(original.current)}
          className="btn-ghost text-sm"
        >
          Reset
        </button>
      </div>
      <div className="border-t border-line bg-code/60 px-4 py-2 text-xs font-medium text-muted">
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
    <div className="card my-5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs font-medium text-muted">
        <span>{lang || "code"}</span>
      </div>
      <pre className="overflow-x-auto bg-code/50 p-4 font-mono text-[13px] leading-6">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
