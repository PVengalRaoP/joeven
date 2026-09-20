import type { Block, QuizOption } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(
    /\[([^\]]+)\]\((https?:[^)]+|\/[^)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function parseTable(lines: string[]): Block | null {
  if (lines.length < 2) return null;
  const split = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const headers = split(lines[0]).map(inline);
  const sep = lines[1];
  if (!/^\s*\|?[\s:|-]+\|/.test(sep) && !/^[\s:|-]+$/.test(sep.replace(/\|/g, ""))) {
    return null;
  }
  const rows = lines.slice(2).map((line) => split(line).map(inline));
  return { type: "table", headers, rows };
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const pushPara = (buf: string[]) => {
    const text = buf.join(" ").trim();
    if (text) blocks.push({ type: "p", html: inline(text) });
    buf.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim() === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const fence = line.trim().slice(3).trim();
      const lang = fence.split(/\s+/)[0] || "text";
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++;
      const code = body.join("\n").replace(/\n$/, "");
      if (lang === "tryit") {
        const realLang = fence.split(/\s+/)[1] || "python";
        blocks.push({ type: "tryit", lang: realLang, code });
      } else if (lang === "quiz") {
        const qLines = body.filter((l) => l.trim() !== "");
        const question = qLines[0] || "";
        const options: QuizOption[] = [];
        let explain = "";
        for (const ql of qLines.slice(1)) {
          if (/^explain:/i.test(ql)) {
            explain = ql.replace(/^explain:\s*/i, "");
          } else if (ql.trim().startsWith("- ")) {
            let text = ql.trim().slice(2);
            let correct = false;
            if (text.startsWith("*") || text.startsWith("✓ ")) {
              correct = true;
              text = text.replace(/^[✓*]\s*/, "");
            }
            options.push({ text, correct });
          }
        }
        blocks.push({ type: "quiz", question, options, explain });
      } else {
        blocks.push({ type: "code", lang, code });
      }
      continue;
    }

    if (line.trim().startsWith("|") && line.includes("|", 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseTable(tableLines);
      if (table) blocks.push(table);
      continue;
    }

    if (/^\s*> /.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*> ?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*> ?/, ""));
        i++;
      }
      const raw = buf.join(" ").trim();
      let kind: "tip" | "note" | "warning" = "note";
      let text = raw;
      if (/^\*\*tip:\*\*/i.test(raw)) {
        kind = "tip";
        text = raw.replace(/^\*\*tip:\*\*\s*/i, "");
      } else if (/^\*\*warning:\*\*/i.test(raw)) {
        kind = "warning";
        text = raw.replace(/^\*\*warning:\*\*\s*/i, "");
      } else if (/^\*\*note:\*\*/i.test(raw)) {
        kind = "note";
        text = raw.replace(/^\*\*note:\*\*\s*/i, "");
      }
      blocks.push({ type: "callout", kind, html: inline(text) });
      continue;
    }

    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) {
        items.push(inline(lines[i].replace(/^\s*[-*] /, "")));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) {
        items.push(inline(lines[i].replace(/^\s*\d+\. /, "")));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*> /.test(lines[i]) &&
      !/^\s*[-*] /.test(lines[i]) &&
      !/^\s*\d+\. /.test(lines[i]) &&
      lines[i].trim() !== "---"
    ) {
      buf.push(lines[i]);
      i++;
    }
    pushPara(buf);
  }

  return blocks;
}
