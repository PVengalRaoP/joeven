const KEYWORDS =
  /\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g;

export function highlightPython(code: string): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withStrings = escaped.replace(
    /(#.*?$)|("""[\s\S]*?""")|('''[\s\S]*?''')|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')/gm,
    (m, comment, s1, s2, s3, s4) => {
      if (comment) return `<span class="tok-c">${comment}</span>`;
      return `<span class="tok-s">${s1 || s2 || s3 || s4}</span>`;
    },
  );
  return withStrings.replace(KEYWORDS, '<span class="tok-k">$1</span>');
}
