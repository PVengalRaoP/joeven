import type { RawLesson } from "@/lib/types";

export const llmTrust: RawLesson[] = [
  {
    slug: "hallucinations",
    title: "Hallucinations",
    summary:
      "Fluent lies are the default. Make unsupported claims fail a check before they reach the user.",
    minutes: 21,
    level: "intermediate",
    md: `
A **hallucination** is a confident statement not supported by weights-you-trust, tools, or retrieved documents. LLMs produce them because the training game is **plausibility**. Your job is to make unsupported claims **expensive** in the product: they fail a check, they do not reach the user, or they are labeled as guesswork.

You will not get a perfect lie detector from the same model. “Be truthful” in the vibe prompt is not a detector. Asking the model “are you sure?” is not detection. It will often say yes. Use **process**: require citations, compare claims to sources, stop on contradictions between two tool calls, require a tool row in the transcript for any claimed action.

## Three families

1. **Factual** — fake APIs, fake paper titles, fake policy clauses, yesterday’s CEO as if it were today’s.
2. **Faithfulness** — the doc says 5–7 days; the model says next-day. The source was there. The quote is wrong.
3. **Action** — claims it called a tool it did not call.

Action hallucinations are the worst in agents. The transcript is the cure: if there is no tool message, it did not happen. Say so in the UI. Do not draw a fake tool card from assistant prose.

Citing a doc and then **misquoting** it is still a hallucination (faithfulness). A citation id is not a blessing on the whole paragraph.

## Checks that survive contact with money

The strongest checks are mechanical: numbers, ids, and dates in the answer must appear in the observation or chunk text. Fuzzy “does this sound right?” judges are extra and can be gamed. Start with substring and schema.

Self-consistency (sample thrice, vote) reduces some errors and triples cost. Three fluent lies can still form a majority. Do not treat vote-as-truth unless you measured it on **your** abstain set (next lessons).

\`\`\`viz bars
title Fluency is not a truth score
bar fluent-lie,0.92,1
bar grounded,0.88,2
caption Both answers can sound sure. Only the grounded one passed a check against tools or docs.
\`\`\`

\`\`\`tryit python
def citations(answer, allowed):
    return [c for c in allowed if c in answer]

def amounts_grounded(answer, sources):
    blob = " ".join(sources)
    for token in answer.replace(".", " ").split():
        if token.startswith("$") and token[1:].isdigit():
            if token not in blob:
                return False
    return True

def claimed_tool_without_trace(answer, tool_roles):
    return "called get_job" in answer.lower() and "tool" not in tool_roles

allowed = ["doc_12", "tool_get_job"]
answer = "Job 17 failed (tool_get_job). Refunds take $5 according to policy. I called get_job."
sources = ["status=failed", "Refunds take 5-7 days"]
print("citations", citations(answer, allowed))
print("amounts grounded", amounts_grounded(answer, sources))
print("fake action?", claimed_tool_without_trace(answer, ["assistant"]))
\`\`\`

Citations found \`tool_get_job\`. Amounts grounded is \`False\` because \`$5\` is not in the sources (they say 5-7 days, not five dollars). Fake action is \`True\` because the prose claims a call but \`tool_roles\` has no \`"tool"\`. Three independent checks; one pretty paragraph failed two of them. That is why you run checks in code, not with a second poem.

The dollar test is a toy (it misses \`$5.00\` and \`USD 5\`). Production uses a tighter extractor and a schema field \`amounts: [...]\` you validate against the blob. The idea is the same: **claims that look like facts must appear in observations**.

## Process beats a second poem

A second model that scores “is this true?” is still a guessing policy. It can help as a *soft* flag after mechanical checks. It cannot be the only check on a refund window. Mechanical first: schema fields, id membership, amounts as substrings, tool row present. Then, if you have budget, a judge on the leftover prose. The Eval track will treat judges as a measurement problem. Here: do not ship an agent whose only grounding is “another LLM said it looked fine.”

Contradictions: tool A says \`status=failed\`, tool B says \`status=ok\`. Do not average. Abstain or handoff (next lessons). Fluent synthesis of two statuses is a faithfulness failure with extra steps.

Action family is the one you can kill completely in code: the UI and the executor believe the **transcript**, not the prose. If the assistant says “I refunded you” and there is no refund tool message (and no payment API span), the UI shows “not sent.” Support should never have to guess.

Factual family without a tool is a retrieval or abstain problem. “Who is the CEO today?” with no search observation is not a writing problem. Do not fix it by raising temperature or adding “be truthful.”

## Eval sets that include impossible questions

If your eval only contains answerable items, you are training a compulsive guesser. Half the questions **cannot** be answered from the corpus; the agent must abstain (next lessons). Score a stylish wrong number **lower** than a plain “I don’t know.”

Put a \`grounded\` flag on every final answer. If false, the UI shows a warning or blocks send.

Walkthrough: Maya’s bot cited \`tool_get_job\` and then wrote a refund of five dollars “as a courtesy.” The tool blob had no amount. \`amounts_grounded\` fails. The send button stays off. A human may still refund from a console. The model does not. That is the product.

Self-consistency is a cost knob, not a truth serum. If you sample three times, you pay three times, and you still need the mechanical checks on the winner. Use it offline if it helps your eval. Do not put it on the hot path until the spend cap says you can afford it.

## What goes wrong

- **Trusting fluent citations** without opening the source.
- **UI tool cards** driven by assistant text.
- **“Are you sure?”** loops that add cost and still agree.
- **LLM-as-judge** as the only faithfulness check. Judges hallucinate too.
- **No abstain option** in the schema, so the model must invent.

## How agents use this

Gate send on \`grounded\` or \`abstain\`. Humans can override. The model should not. Log which check failed (\`amount\`, \`action\`, \`cite\`). Support needs that, not “the model was having a day.”

The transcript is the action log. The sources are the fact log. Prose is a view. If you cannot point at a row, you cannot ship the sentence as fact.

Tests: an answer that claims \`called get_job\` with roles \`["assistant"]\` must set grounded false (or fail the action check). An answer with \`$5\` not in sources must fail. An answer that only restates \`status=failed\` from the tool blob may pass. Put those three next to the parser tests.

> **Warning:** “Be truthful” in the vibe prompt is not a detector. Check the transcript and the sources. Asking “are you sure?” is not a detector either.

\`\`\`quiz
What is the most reliable way to stop an agent claiming it took an action?
- Raise temperature
- *Require a tool result in the transcript; if it is missing, the action did not occur
- Add "be truthful" to the vibe prompt
- Use a longer context window
explain: Side effects live in the world and the trace, not in assistant prose. Temperature and window size do not create tool rows.
\`\`\`
`,
  },
  {
    slug: "citations",
    title: "Citations",
    summary:
      "Every number, id, and quote should point at a chunk or a tool payload you can open. Invented ids are fake evidence.",
    minutes: 20,
    level: "intermediate",
    md: `
A **citation** is an id the UI can click: \`doc_12\`, \`tool_get_job\`, \`ticket_88\`. Prose like “according to policy” is not a citation. A URL the model invented is not a citation. A paper title that does not exist is not a citation.

Rules that survive contact with users:

- The id must exist in the **working set** you sent (the chunks and tool payloads in **this** prompt).
- The claim must appear (or clearly follow) in that source — faithfulness, previous lesson.
- Missing id → do not show the claim as fact.
- Extra invented ids → treat as a hallucination.
- The UI should 404 a missing id, not render a fake card.

Pass the allowlist in the prompt **and** check in code. Models invent \`doc_99\` because it looks like the other ids. Code membership is cheap. Trusting the model to only cite real ids is how legal gets a screenshot of a ghost document.

## What to cite

Numbers, ids, dates, quotes, and policy clauses. Not every adjective. “The job failed” should point at \`tool_get_job\`. “Refunds take 5-7 days” should point at \`doc_policy\`. “I’m sorry this happened” needs no citation.

Ask the model to put ids in a JSON field \`cites: [...]\` and validate membership. Parsing cites out of parentheses is fine as a backup; a field is easier to grade.

RAG tracks will add chunk ids and offsets. The habit starts here: **no naked number**. If you cannot open the source, you cannot ship the claim.

\`\`\`viz flow
title Every number needs a door you can open
layout lr
node claim Claim
node id Cite id
node src Open source
edge claim id
edge id src
caption Invented ids are fake evidence. Check membership in code, not only in the prompt.
\`\`\`

\`\`\`tryit python
def check_cite(answer, allowed_ids, sources):
    used = [i for i in allowed_ids if i in answer]
    if not used:
        return "no citation"
    blob = " ".join(sources.get(i, "") for i in used)
    for token in answer.replace("(", " ").replace(")", " ").split():
        if token.startswith("job-") and token not in blob and token not in used:
            return "id not in sources: " + token
    return "ok:" + ",".join(used)

allowed = ["tool_get_job", "doc_policy"]
sources = {
    "tool_get_job": "job-17 status=failed",
    "doc_policy": "Refunds take 5-7 days",
}
print(check_cite("failed (tool_get_job) on job-17", allowed, sources))
print(check_cite("failed on job-99", allowed, sources))
print(check_cite("all good", allowed, sources))
\`\`\`

First line: \`ok:tool_get_job\` because \`job-17\` is in the tool blob. Second: \`id not in sources: job-99\` (and also no citation id from the allowlist). Third: \`no citation\`. Three user-visible answers, three different product outcomes: show with a link; block or warn; block or mark as ungrounded.

Tighten this for production: require a cite **and** a grounded id. \`job-99\` with a random \`doc_policy\` mention should still fail. The toy stops at first problem, which is enough to learn the shape.

## Allowlist in two places

The prompt may list \`You may cite: tool_get_job, doc_policy\`. Code still checks membership. Prompt-only allowlists fail the moment the model invents a plausible neighbor. Code-only allowlists still work if you forget to mention the ids in the spec — but then the model may not cite at all, which \`check_cite\` treats as \`no citation\`. Do both: tell the model the ids, reject anything else.

Colliding ids: \`doc_1\` from the handbook and \`doc_1\` from a vendor PDF are not the same card. Prefix: \`hb_doc_1\`, \`vendor_doc_1\`. The UI 404s unknown prefixes. Do not “helpfully” fuzzy-match \`doc_99\` to \`doc_9\`.

Store what you sent. Retrieval ranks move. If legal opens a cite two weeks later, they need the chunk text from the trace (debug bucket) or a content-addressed store. A live fetch of “current chunk 12” is not a citation. It is a new document.

Quotes: if the answer puts words in quotation marks, those words should be a substring of the source (allowing whitespace). Paraphrase is allowed for status; paraphrase of a legal clause is how 5–7 days becomes next-day. Prefer copying the clause into a schema field \`quote\` and rendering that field in the UI, not the model’s rewrite.

The allowlist is the working set **this step**, not the whole corpus. A doc you did not send cannot be cited. If the packer dropped \`doc_policy\` to fit the observation, the model must not cite it — and code must not have it in allowed_ids. Packer and citation checker share the same list.

## UI and legal

Render citations as links to the observation. Support people will use them. Legal will use them. If the click opens empty, you shipped theater. Store the source text **you actually sent** (or a hash plus a fetch by id), because retrieval ranks move. Yesterday’s chunk 12 is not today’s chunk 12.

Do not let the model invent URLs. If you need a URL, it comes from your tool payload. Display **your** URL.

Support’s first click on a wrong answer should open the observation, not a model playground. If the card 404s, you shipped theater and you will not debug faithfulness. Build the card from the same allowlist the validator used.

## What goes wrong

- **Footnotes that 404.**
- **One cite blessing a whole essay** that smuggles an extra amount.
- **Allowlist only in the prompt**, not in code.
- **Citing the user message** as if it were a policy doc.
- **Colliding ids** (\`doc_1\` reused across corpora). Prefix by corpus.

## How agents use this

Schema field \`cites\` as a list of strings. Validate subset of allowlist. Validate numbers against concatenated sources. UI: buttons, not decoration. Eval: items with a wrong id must fail even if the prose is nice.

Eval slice: invent \`doc_99\`; cite a real id but a wrong amount; no cite on a number; cite the user message as \`doc_user\`. The last one is a policy choice — default fail. User text is not a policy handbook.

The packer and the citation checker must share one allowlist object. If they drift, you will 404 a real cite or accept a ghost. Pass \`working_set_ids\` from \`build_context\` into \`check_cite\`.

> **Tip:** One real id beats three adjectives. Ask for \`cites: [...]\` and check membership in code. If you cannot open the source, you cannot ship the claim.

\`\`\`quiz
The answer cites doc_99, which was not in the retrieved set. What is that?
- Extra helpfulness
- *A hallucination (invented source)
- A cache hit
- A finish_reason
explain: Citations must name documents you actually provided. Invented ids are fake evidence. Cache and finish_reason are other parts of this track.
\`\`\`
`,
  },
  {
    slug: "abstain",
    title: "When to Abstain",
    summary:
      "I don’t know is a feature. After tools fail, do not invent a balance. Put abstain in the schema.",
    minutes: 19,
    level: "intermediate",
    md: `
**Abstain** means: say you do not know (or cannot act), instead of guessing. Product teams hate this until the first legal review. Then they hate the agent that invented a balance.

For agents:

- Abstain **after** tools, not instead of them. “I didn’t look” is laziness.
- “I looked, the tool 404’d, I will not invent a balance” is professionalism.
- World facts (CEO as of today) without search → abstain (or search, then maybe still abstain).
- Missing \`job_id\` after one ask → stop. Do not pick a popular id.
- Contradictory tools → abstain or handoff, do not average two balances.

Forcing an answer with “you must reply” in the spec fights abstention. Put a legal third option in the schema: \`{"action": "abstain", "reason": "..."}\`. If the only legal actions are \`get_job\` and \`finish\` with a required number, you trained a guesser.

## Score it like a skill

Score abstaining **higher** than a stylish wrong number on your eval. If every test item is answerable, you will never train that muscle. Build a slice: empty tools, missing ids, out-of-corpus questions, stale docs that do not contain the amount. The correct action is \`abstain\` or \`handoff\`.

UI: a yellow “not in tools or docs” is better than a green wrong refund window. Gate send on \`grounded\` or \`abstain\`. Humans can still override. The model should not.

\`\`\`viz flow
title After tools fail, do not invent a balance
layout lr
node tools Tools
node empty Empty
node abstain Abstain
edge tools empty
edge empty abstain
caption Put abstain in the schema. Score it higher than a stylish wrong number.
\`\`\`

\`\`\`tryit python
def should_abstain(state):
    if state.get("needs_search") and not state.get("used_search"):
        return True, "need search"
    if state.get("tool_status") == "404":
        return True, "tool empty"
    if state.get("job_id") is None:
        return True, "missing id"
    return False, "ok"

cases = [
    {"needs_search": True, "used_search": False, "tool_status": "ok", "job_id": 17},
    {"needs_search": False, "used_search": False, "tool_status": "404", "job_id": 17},
    {"needs_search": False, "used_search": False, "tool_status": "ok", "job_id": None},
    {"needs_search": False, "used_search": False, "tool_status": "ok", "job_id": 17},
]
for s in cases:
    print(s, "->", should_abstain(s))
\`\`\`

Four rows: need search before answering a world fact; tool 404; missing id; all clear. The last is the only \`ok\`. Notice the first row **abstains even though a job_id exists** — the question still needed search and search never ran. That is “after tools, not instead of them” encoded as: if you needed a tool, you must have used it. The 404 row used a tool and got nothing: still abstain, do not quote a number.

You can implement this in code **without** asking the model. That is the best abstain. The schema option is for cases the rules do not cover. Rules first; model abstain second; guess never.

## Ask, abstain, handoff

**Ask once** when a required field is missing (\`job_id\`). Track \`asked_id=true\` in code state so the second turn cannot become an infinite interview. **Abstain** when you looked and the world did not answer (404, empty search, contradictory tools). **Handoff** when money, safety, or a timeout on a write is involved. Do not loop “just one more search” until the spend cap fires — that cap is a backstop, not a plan.

Retrying a 404 with a different customer id is not cleverness. It is accessing the wrong person. Retrying search with the same query is a cost leak. Retrying search with a *reformulated* query can be legal if you cap at one extra and you still abstain when empty.

Schema: \`action\` enum includes \`abstain\` with a short \`reason\` enum (\`missing_id\`, \`tool_empty\`, \`not_in_docs\`, \`contradiction\`). Free-text reasons are for traces, not for a model to invent a legal theory. The UI maps those enums to yellow copy. Do not let the model write the yellow copy if legal needs a template.

Forcing “you must reply with an answer” in the spec fights this whole lesson. Delete that sentence. If a vendor’s JSON mode requires a field, make the field \`final\` nullable or use the abstain action.

The loop should call tools when \`should_abstain\` says \`need search\`. That return value means “do not emit a final fact yet,” not “give up.” Only \`tool empty\`, \`missing id\` after one ask, and contradictions are user-visible abstain. Mixing those cases in one boolean without a reason code is how you skip search and look lazy.

Eval the impossible slice every time the spec changes. If abstain rate on that slice drops and accuracy on answerable items rises, you probably trained a guesser. Product will cheer until legal reads a made-up balance. Put abstain rate on the same dashboard as JSON-ok.

## What goes wrong

- **Schema without abstain**, plus “always answer” in the spec.
- **Eval with only answerable items.**
- **Green UI** on ungrounded text.
- **Picking a default id** to “keep moving.”
- **Abstaining instead of calling a cheap tool** (laziness). The first case in the tryit would be wrong if you skipped search *and* still answered. The function forces the search gap to look like abstain-from-final, which your loop should turn into \`call search\`, not into a user-facing “I don’t know” until search ran.

Clarify in the product: \`should_abstain\` in the toy is “do not emit a final fact.” The agent may still call a tool. Final answers abstain; intermediate steps act.

## How agents use this

Put \`abstain\` in the action enum. Put \`should_abstain(state)\` in **code** for 404, missing ids, and unused required tools. Eval the impossible slice every time you change the spec. UI copy that is allowed to be yellow.

Wire the reason code to the UI template. Support should see \`tool_empty\` on the trace, not a model essay about why balances are hard. Tests: 404 → abstain; missing id and not yet asked → ask; missing id and already asked → stop; needs search and unused → call search, not final prose.

Do not retry a 404 with a neighbor id. Do not raise temperature to “get an answer anyway.” The schema already has \`abstain\`. Use it. Score it on the eval as a success when the item was impossible.

> **Note:** Forcing an answer with “you must reply” fights abstention. Put \`{"action": "abstain", "reason": "..."}\` in the schema. Empty tools are not a license to guess money.

\`\`\`quiz
The get_balance tool returned 404. What should the final action be?
- Invent yesterday’s balance from memory
- *Abstain (or hand off): do not quote a number
- Retry with a different customer id
- Raise temperature
explain: Empty tools are not a license to guess money. A different customer id is the wrong person. Temperature does not create a row.
\`\`\`
`,
  },
];
