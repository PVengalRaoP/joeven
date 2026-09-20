import type { Block } from "@/lib/types";
import { CodeBlock, TryIt } from "./TryIt";
import { Quiz } from "./Quiz";

export function LessonBlocks({
  blocks,
  quizPrefix,
}: {
  blocks: Block[];
  quizPrefix: string;
}) {
  let quizN = 0;
  return (
    <div className="prose-jv max-w-[820px]">
      {blocks.map((b, i) => {
        if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
        if (b.type === "h3") return <h3 key={i}>{b.text}</h3>;
        if (b.type === "p")
          return <p key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
        if (b.type === "ul")
          return (
            <ul key={i}>
              {b.items.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          );
        if (b.type === "ol")
          return (
            <ol key={i}>
              {b.items.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ol>
          );
        if (b.type === "code")
          return <CodeBlock key={i} code={b.code} lang={b.lang} />;
        if (b.type === "tryit")
          return <TryIt key={i} code={b.code} lang={b.lang} />;
        if (b.type === "quiz") {
          quizN += 1;
          return (
            <Quiz
              key={i}
              id={`${quizPrefix}::${quizN}`}
              question={b.question}
              options={b.options}
              explain={b.explain}
            />
          );
        }
        if (b.type === "callout") {
          const colors =
            b.kind === "warning"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
              : b.kind === "tip"
                ? "border-jv bg-emerald-50 dark:bg-emerald-950/30"
                : "border-sky-400 bg-sky-50 dark:bg-sky-950/30";
          const label = b.kind === "warning" ? "Warning" : b.kind === "tip" ? "Tip" : "Note";
          return (
            <blockquote
              key={i}
              className={`my-4 rounded-md border-l-4 px-4 py-3 ${colors}`}
            >
              <strong className="mr-2">{label}:</strong>
              <span dangerouslySetInnerHTML={{ __html: b.html }} />
            </blockquote>
          );
        }
        if (b.type === "table")
          return (
            <div key={i} className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {b.headers.map((h) => (
                      <th key={h} dangerouslySetInnerHTML={{ __html: h }} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} dangerouslySetInnerHTML={{ __html: cell }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        return <hr key={i} className="my-8 border-line" />;
      })}
    </div>
  );
}
