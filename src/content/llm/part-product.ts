import type { RawLesson } from "@/lib/types";

export const llmProduct: RawLesson[] = [
  {
    slug: "context-engineering",
    title: "Context Engineering",
    summary:
      "What earns a seat in the window: goal, spec, tools, latest observation — nothing else by default. Pack in code.",
    minutes: 22,
    level: "intermediate",
    md: `
**Context engineering** is packing the window on purpose. Prompt engineering was a slogan for the same job when the window only held a poem. Now you assemble a **working set**: just enough for this step. The Transformers track called the window a hard length. This lesson is **which bytes you spend it on**.

If attention is a spotlight, you choose the stage. You do not re-derive attention math here. You decide what the spotlight is allowed to see: the goal, the spec, the enabled tools, the latest observation. “Might help” is how you drown the model and the bill.

The cost lessons showed why fat tails hurt: every step resends the prompt. Prompt cache wants a **stable prefix**. This lesson is the packer that satisfies both: spec and tools first, volatile evidence last, drop the rest by priority.

## The working set (priority)

1. **Goal** — what done means
2. **Pinned spec** — safety and schema
3. **Tool docs** — only tools that are enabled
4. **Current observation** — last tool result, latest user correction
5. **Retrieved evidence** — top chunks with ids
6. **Compressed history** — decisions, not every thought
7. **Scratch** — optional plan

Everything else is a candidate for deletion. The handbook paragraph loses to the observation. **Evidence beats encyclopedia.**

Patterns that keep agents small:

- Search **after** the model names a need, not 20 chunks up front.
- Keep \`job_id\` in a Python dict, not reread from a 12k essay.
- The writer does not need the SQL schema; the SQL tool caller does. Pass \`ticket_id\`, fetch in the tool.
- Disabled tools disappear from the docs **and** from examples. Leftover few-shots that call \`shell\` after you removed \`shell\` are how you get hallucinated tools.
- When you compress history, keep **decisions and ids**, drop chain-of-thought. A summary that says “looked up the job” without \`job_id=17\` forces a guess. Prefer a template: \`step n: tool args=... result=...\`.

Token estimates belong **inside** \`build_context\`. If packing exceeds the budget, drop by priority in **code**, then send. Asking the model to “be brief” after you already overflowed is pleading. If the vendor truncates the *prompt*, the spec at the front may survive (good) or, depending on side, the tail may survive and the spec dies (bad). Know which side they truncate. Prefer not to overflow.

\`\`\`viz bars
title Who earns a seat in the window
bar spec,8,0
bar tools,6,1
bar latest,5,2
bar old-chat,3,3
caption Goal, spec, tools, latest observation. Encyclopedia loses. Pack in code, not by pleading.
\`\`\`

\`\`\`tryit python
WINDOW = 40

def pack(parts):
    parts = sorted(parts, key=lambda p: p[0])
    used = 0
    kept = []
    dropped = []
    for pri, name, text in parts:
        n = len(text.split())
        if used + n <= WINDOW:
            kept.append(name)
            used += n
        else:
            dropped.append(name)
    return kept, dropped, used

parts = [
    (0, "goal", "done when job status quoted from tool"),
    (1, "spec", "no deletes JSON final"),
    (2, "tools", "get_job(job_id)"),
    (3, "obs", "tool: status=failed error=timeout"),
    (4, "rag", "handbook paragraph " + "policy " * 30),
    (5, "history", "thought " * 20),
]
kept, dropped, used = pack(parts)
print("kept", kept)
print("dropped", dropped)
print("used", used, "/", WINDOW)
\`\`\`

\`WINDOW\` is 40 words on purpose. Goal, spec, tools, and observation fit. The handbook and the thought-stream do not. \`dropped\` should include \`rag\` and \`history\`. That is a success: the model still has what it needs to quote \`timeout\`. If you reversed priority, you would keep the handbook and drop the observation, then hallucinate a status. Run it. Then lower \`WINDOW\` to 15 and watch even tools fall off — that is your cue to shorten the spec, not to beg the model.

Anti-patterns: pasting the entire repo; repeating the spec in every user message **and** the system; leaving failed JSON novels in history so the model imitates them (keep a one-line validator error); dumping another agent’s full window into this one; putting \`datetime.now()\` first (cache lesson).

## Per-step packs

A classifier step needs the ticket text and a label enum. It does not need last week’s traces. A SQL tool-caller needs the schema of **that** database, not the poetry writer’s style guide. Build \`build_context(state, step_kind)\`, not one mega prompt for every node. Routing models (next lessons) is cheaper when each node sees a small working set.

Failed JSON belongs in history as **one line**: \`validator: missing job_id\`. That error is the only extra the model needs on retry. Pasting the whole invalid object plus your anger paragraph teaches the model to imitate the invalid object. The structured-output lesson retries with the schema error; packing should keep that error and drop the rest.

Retrieved chunks need ids and a cap: top 3, not top 20. If the packer has to drop RAG to keep the observation, that is the correct drop. A handbook that never fits is a retrieval problem, not a reason to enlarge the window and hope. Lost-in-the-middle (Transformers track) is worse when you stuff twenty similar paragraphs. Packing fewer, better chunks is the API-level fix.

Code state is the other half of packing. \`state["job_id"] = 17\` survives every trim. Inject \`job_id=17\` as a one-line system or tool view each step. If the id only lives in a paragraph from step 2, step 8 will guess. Context engineering is as much **what you refuse to put in the window** as what you include.

Prompt cache wants spec + tool docs first, unchanged. The packer should concatenate in a stable order: spec, tools, then goal/user, then observation, then RAG, then history summary. Sorting tools alphabetically every time is packing and caching at once.

## What goes wrong

- **Might-help RAG** on every call.
- **Disabled tools still in few-shots.**
- **Summaries without ids.**
- **Packing in the prompt** (“please ignore extra docs”) instead of in code.
- **Overflow** and blaming attention’s “lost in the middle.” Lost-in-the-middle is real (Transformers track). Packing still comes first: fewer tokens, better seats.

## How agents use this

Write \`build_context(state) -> messages\` and unit-test it: spec always present, last observation present, token estimate under budget, no disabled tools, prefix bytes stable across tickets that share a spec. This function **is** the product. Models will come and go; packing policy stays.

If a piece of data must be true, keep it in **code state** and inject a one-line view. Code state does not get lost in the middle. A 12k essay does.

Unit tests for the packer are not optional: spec bytes present, last obs present, disabled tools absent, estimate <= budget, prefix of spec+tools identical across two tickets. When a developer adds “just one more paragraph” to the spec, the estimate test fails on the same night, not after the invoice.

> **Tip:** Working set = decide and act now. Archives go to retrieval or summaries. If it must be true, it lives in code, not in hope.

\`\`\`quiz
What should win a seat in a tight window?
- The longest PDF you have
- *The goal, pinned spec, enabled tools, and latest observation
- Every past thought
- Disabled tools, in case the model gets curious
explain: Working set = decide and act now. Archives go to retrieval or summaries. Disabled tools in the prompt are how you get hallucinated tools.
\`\`\`
`,
  },
  {
    slug: "choosing-models",
    title: "Choosing Models",
    summary:
      "There is no best model. There is a best model for a step, under cost, latency, privacy, and your eval.",
    minutes: 20,
    level: "intermediate",
    md: `
There is no “best model.” There is a **best model for a step**, under latency, cost, privacy, and quality. Treating the frontier chat model as the only employee is how bills and latency explode. The last lessons packed the window. This one picks **which brain** reads that window.

A smaller model that emits valid JSON 99% of the time beats a genius that essays 30% of the time. Averages lie. A small model that is always 400ms beats a large model that is 2s until it is 20s under load. Queueing, rate limits, and cold starts are part of “which model.”

Keep \`complete(messages, tools)\` behind your interface. Swap models as a config change. Re-run the eval. Tokenizers differ. Privacy: if traces cannot leave, the catalog shrinks to what you host. That constraint beats a leaderboard.

## Axes that matter for agents

| Axis | Why it matters |
|---|---|
| **Quality on your eval** | Not a public vibe ranking — *your* tools and traces |
| **Cost / token** | Loops multiply |
| **Latency** | Users and timeouts; feel **p95**, not the average |
| **Context length** | Packing strategy |
| **Tool / JSON reliability** | Structured output track record |
| **Privacy / region** | Can logs leave the VPC? |
| **Rate limits** | A crew of agents is a burst |

Measure the hosted small model on **your** JSON. A public “arena” rank is entertainment. Your tickets are the job.

Distillation and fine-tunes of small models are how grown-up teams lock in a router. Do not start there. Start with measurements. Fine-tune last (ML and Transformers already said why).

\`\`\`viz bars
title JSON success on a tool step
bar small,0.99,2
bar large,0.70,1
caption The large model can lose a JSON gate. Measure your tickets, not a brochure rank.
\`\`\`

\`\`\`tryit python
def score_model(m, task):
    json_ok = m["json_rate"] if task == "json" else 1.0
    quality = m["quality"]
    cost = m["cost"]
    latency = m["p95_ms"]
    if json_ok < 0.95 and task == "json":
        return -1.0
    return quality - 0.01 * cost - 0.0001 * latency

small = {"name": "small", "json_rate": 0.99, "quality": 0.7, "cost": 0.2, "p95_ms": 400}
large = {"name": "large", "json_rate": 0.70, "quality": 0.9, "cost": 3.0, "p95_ms": 2000}
for task in ["json", "plan"]:
    s = score_model(small, task)
    l = score_model(large, task)
    winner = small["name"] if s >= l else large["name"]
    print("task", task, "small", round(s, 3), "large", round(l, 3), "pick", winner)
\`\`\`

For \`json\`, the large model fails the 0.95 gate and scores \`-1.0\`, so **small** wins. For \`plan\`, the gate is skipped and **large** can win on quality. Toy weights; real teams plug in *their* fail rate, *their* p95, *their* dollars. The shape is the lesson: **hard gate on JSON, then a score**. Do not average JSON fail rate into a soft penalty and hope.

p95 means: 95 percent of calls are faster than this. Users feel the slow tail. Timeouts fire on the tail. If you only watch the mean, you will pick a model that is “fine” until Friday traffic.

## Run your tickets, not an arena

A public ranking answers “which model sounds better on a mix of internet questions.” Your agent answers “which model emits valid \`get_job\` JSON on *these* 200 frozen tickets, under *this* spec, with *this* tokenizer.” Those are different contests. Steal the method: freeze the tickets, freeze the spec id, change one model, score with **your** validator and **your** grounded/abstain checks. Do not score with a second LLM unless you have measured that judge (Eval track).

Protocol that fits on one page:

1. Pick the step kind (JSON tool vs plan vs prose).
2. Run 100–300 tickets (or all you have).
3. Record JSON-ok rate, abstain-on-impossible rate, p50/p95 latency, tokens, dollars.
4. Hard-fail a candidate below the JSON gate for JSON steps.
5. Among survivors, pick on p95 and dollars, not on a single “quality” vibe.

Tokenizer swap: after you change models, re-estimate packing. A spec that was 800 tokens may become 1,100. Stop sequences that were one token may become three. Prompt cache prefixes may break because bytes include different wrapping. Re-run \`build_context\` tests with the new estimator. Choosing a model is also choosing a tokenizer.

Cold starts and queues belong in p95. A self-hosted 7B that is fast *when warm* and 8 seconds *when the GPU worker scaled to zero* is not a 400ms model. Measure under the same autoscale policy you will ship.

## A walkthrough: the JSON gate

Maya’s team loved a large model’s explanations. JSON-ok was 70%. The executor spent the week in handoff. They switched tool steps to a small model with native tool-calling: JSON-ok 99%, explanations worse. They **split the step**: small emits the tool JSON; large writes the user-facing paragraph *after* the tool result exists. Cost dropped. Latency dropped. Support stopped seeing invented job ids. That split *is* choosing models. It is not a single winner.

## Privacy, region, and rate limits

If traces cannot leave the VPC, the catalog is local. If the user is in a region that forbids a vendor, the catalog shrinks again. A crew of agents is a burst: one user click can be 8 POSTs. Rate limits are part of quality. A perfect model you cannot call is an error outcome (429 lesson).

## What goes wrong

- **One frontier model for classify, extract, plan, and poetry.**
- **Choosing from a blog table** without running tickets.
- **Ignoring tokenizer change** after a swap (stop sequences, token budgets).
- **Ignoring p95.**
- **Fine-tuning to avoid measuring.**

## How agents use this

Choosing models is an **architecture** decision: which brain at which node in the loop. Next lesson: a router. If every node is the most expensive model, you did not design a system. You rented one.

Log \`model=\` on every span. A week later you will know whether “always large” was fear or evidence.

Keep a short approved catalog: small JSON, large plan, embed, maybe a fallback region. A developer pasting a new SKU into one call site is how you get an unbilled surprise and a tokenizer you never packed for. Catalog changes are PRs with an eval attached.

If two models tie on JSON-ok, pick the cheaper and faster. Quality theater is how you stay on the frontier for a classifier. If they tie on JSON-ok but the large model abstains better on the impossible slice, *that* is a real reason to keep large on the final-answer node only.

> **Note:** Distillation and fine-tunes of small models are how grown-up teams lock in a router. Do not start there. Start with measurements on your JSON and your p95.

\`\`\`quiz
When is a small model the right default?
- Never; always buy the frontier
- *High-volume structured steps (classify, extract, tool JSON) where evals already pass
- Only for embeddings of images
- When you have no schema
explain: Route cheap, valid, fast work to small models; reserve large models for hard planning and failures. No schema is a reason to add a schema, not a reason to buy a giant.
\`\`\`
`,
  },
  {
    slug: "routing-models",
    title: "Routing Models",
    summary:
      "A cheap router picks small vs large. Escalate once if JSON fails. Measure how often you escalate.",
    minutes: 20,
    level: "intermediate",
    md: `
A **router** is a cheap decision: which model runs this step? It is not a personality. It is a function you unit-test.

- Extract fields, classify intent, fill tool JSON → **small**
- Multi-step debugging, ambiguous policy, novel code → **large**
- Embeddings → an **embedding** model, not a chat model
- Rerank 20 chunks → a **reranker**, not a 70B chat

Fallback: if the small model’s validator fails, retry **once** on the large model. Measure how often you escalate; that is your real savings. 80% escalate means you do not have a small model. You have a delay.

Rules, embeddings, or a tiny LLM can be the router. Start with **if kind in ...**. Add ML when the ifs rot. If you have no eval yet, do not route in production — start with one model and **log** what a router *would* have chosen.

When to go large anyway: the small model fails a frozen eval slice; the user-facing explanation **is** the product; safety-sensitive gray areas (still with a human gate).

\`\`\`viz flow
title Cheap first, escalate once
layout lr
node small Small
node check Validator
node large Large
edge small check
edge check large
caption Extract and JSON stay small. Plan and debug go large. If you escalate 80% of the time, you do not have a router.
\`\`\`

\`\`\`tryit python
def route(task):
    if task["kind"] in {"classify", "extract", "route_tools"}:
        return "small"
    if task.get("schema") == "json" and task["kind"] == "tool_call":
        return "small"
    if task["kind"] in {"plan", "debug"}:
        return "large"
    return "large"

def bill(model, tokens):
    rates = {"small": 0.2, "large": 3.0}
    return tokens * rates[model] / 1000000

tasks = [
    {"kind": "classify", "tokens": 800},
    {"kind": "tool_call", "schema": "json", "tokens": 1200},
    {"kind": "debug", "tokens": 4000},
    {"kind": "plan", "tokens": 3000},
]

all_large = sum(bill("large", t["tokens"]) for t in tasks)
routed = sum(bill(route(t), t["tokens"]) for t in tasks)
print("always large usd", round(all_large, 6))
print("routed usd", round(routed, 6))
print("decisions", [(t["kind"], route(t)) for t in tasks])
\`\`\`

\`always large\` is the higher bill. \`routed\` is cheaper because classify and JSON tool calls went small. \`decisions\` should show small, small, large, large. Real traces are **mostly** classify-and-fill, not novel science. Even this toy mix wins. Your production mix will win harder if you actually look at it.

Escalate path (not in the toy): small JSON fails validate → one large retry → still invalid → handoff. Infinite small retries burn tokens and still fail. One measured escalate is cheaper than a poetry loop.

Do not route embeddings through chat. Do not ask a 70B to score 20 chunks when a reranker exists. Those are different products (RAG track). The router’s job is to **not** send them to chat.

## Shadow first, then cut traffic

Before a router changes production, log what it *would* have chosen for a week. That is **shadow routing**: the live call still goes to today’s model; the span records \`would_have=small\` or \`would_have=large\`. If the validator would have failed on the small model’s *hypothetical* output, you cannot know without actually calling small — so a honest shadow is: send a **sample** of traffic to small in parallel (read-only steps only) and compare JSON fail rate and latency. Never shadow a write. Refunds are not a/b tests.

A week of spans answers the only question that matters: what fraction of steps are classify/extract/JSON, and what is small’s fail rate on those steps? If 90% of steps are JSON and small’s fail rate is 2%, you will save money. If 90% are “debug this incident,” a router that defaults to small will escalate constantly and you will pay for two models per hard ticket.

## Escalate once, then stop

Write the fallback as code, not as a prompt that says “try a smarter friend.” Sequence:

1. Small model, temperature 0, schema on.
2. Validator fails → one large call with the **same** messages plus the schema error.
3. Still invalid → handoff. Do not return to small. Do not raise temperature.

Count \`escalated=true\` on the span. Alert if the daily escalate rate jumps. A spec change that made JSON harder should show up here before finance sees the large-model bill.

Spend caps still apply. Escalating to large can be the call that trips \`max_usd\`. If the cap would be exceeded by the large retry, skip it and hand off. The cap is not “unless we are almost done.”

## Embeddings and rerankers are not chat

If \`task.kind == embed\`, you call an embedding endpoint. If \`task.kind == rerank\`, you call a reranker. Putting those through \`complete(messages)\` is how you pay chat prices for a vector. The router should refuse unknown kinds rather than defaulting to large chat. \`return "large"\` at the bottom of the toy is a safety default for *chat* tasks, not a sink for every string named “model.”

A crew of agents can burst 8 POSTs per click. Route the 7 cheap ones to small so the 1 hard plan still has rate-limit headroom on the expensive SKU.

## What goes wrong

- **LLM router with a huge prompt** that costs more than the small model you were saving.
- **No escalate cap.**
- **Routing in prod with no eval.**
- **Same model string** for embed and chat because the vendor dashboard listed both.
- **80% escalate** ignored because the architecture diagram looked smart.

## How agents use this

The router is a function you unit-test. Log \`model=\` and \`routed_as=\` and \`escalated=\` on every span. A week later you will know whether “always large” was fear or evidence. Next tracks put tools, RAG, and planners on those nodes.

Escalation rate is a KPI. Treat it like JSON fail rate. If it spikes after a spec change, the spec got harder or the small model got worse — not “users are dumber.”

Unit-test \`route\` with the four kinds in the tryit plus: missing \`kind\` (should not crash; default large or reject), \`embed\` (must not return a chat SKU), \`tool_call\` without schema (decide: small-with-prompt-JSON or large — write it down). Tests are cheaper than a month of “we thought JSON went small.”

When you add a new step kind, you add a row to the router table **and** a row to the eval. A kind with no eval is how “debug” silently becomes 40% of spend.

Config the model names outside the function: \`SMALL=...\`, \`LARGE=...\`. The router returns a **role**, not a vendor string. Swapping vendors then does not rewrite if-statements. Choosing-models and this lesson share that adapter: \`complete(messages, model=role_to_id[role])\`.

> **Tip:** Start with if-statements. Add ML when the ifs rot. 80% escalate means you bought a delay, not a router.

\`\`\`quiz
The small model failed JSON validation. What is a sane fallback?
- Loop the small model ten times
- *Retry once on the large model, then hand off if still invalid
- Switch embedding models
- Drop the schema
explain: One measured escalate is cheaper than a poetry loop. Infinite small retries burn tokens and still fail. Embeddings and dropped schemas do not fix a bad object.
\`\`\`
`,
  },
  {
    slug: "llm-logging",
    title: "Log the Call",
    summary:
      "Request id, model, usage, finish reason, knobs, and the message list — or you cannot debug the bill or the bug.",
    minutes: 21,
    level: "intermediate",
    md: `
If it is not on the **trace**, it did not happen. LLM calls need the same habit as tools. Finance, a user who says “it ignored me,” and your future self replaying a failure all need the same JSON line.

Log (redacted):

- request id / vendor id
- model name and knobs (temperature, max_tokens, top_p, stops)
- spec id (\`spec@2026-03-01\`)
- usage: prompt tokens, completion tokens, cached tokens if any
- finish reason
- message **roles and lengths**, not necessarily full secrets
- parse ok / validator error
- spent so far vs cap
- router decision and whether you escalated

You need this when finance asks, when a user says “it ignored me,” and when you replay a failure into a fake client. Without this, you will argue from screenshots.

Full-prompt logs are a privacy incident waiting. Default to roles + lengths + redacted tails. Full dumps in a locked debug bucket, not in the product warehouse.

## Redact both sides

If the user pasted a key, it sits in a user message. If the model echoed it, it sits in the assistant message. Redact **both**. Prefer storing hashes of secrets your scanner knows. Do not print \`sk-live\` in a “preview” field. The tryit shows the idea with a tiny replace loop. Production uses a list of patterns and a vault scanner, and still fails on novel secret shapes — so minimize what you store.

Version the spec id on the span. When someone “just added a sentence,” you will know which traces used which poem. Group evals by \`model\` + \`spec id\`.

## What a replay needs

Replay is the reason you log messages at all. A failing ticket should become a unit test: load the stored message list (redacted), feed \`FakeChatClient\` a scripted next turn, assert the tool name. If you only stored roles and lengths, you can still see that a tool row was missing. If you stored redacted contents in a debug bucket, you can reproduce the parser bug. If you stored nothing, you will re-ask the user to “send it again.”

Same id as the agent step: \`trace_id\`, \`span_id\`, \`step=4\`. When a tool ran, the tool span and the LLM span share the trace. “The model ignored the tool” is a join query: was there a tool span, and was there a tool **message** on the next LLM call? Logging only the assistant preview cannot answer that.

Usage fields answer finance. \`prompt_tokens\` climbing across steps of one trace is the cost lesson in a chart. Cached tokens (if the vendor sends them) tell you whether prefix cache is fiction. \`finish_reason\` histograms catch a packing regression (length spike) or a prompt change (filter spike) before anyone names a vendor.

Knobs belong on the span because “JSON broke on Tuesday” is often “someone set temperature to 1 on the tool step.” You will not remember the playground default you copied. The log will.

## PII and retention

Default warehouse: model, knobs, spec id, usage, finish reason, roles, lengths, parse ok, spent, router role, escalate flag, request id. No raw ticket body. No raw tool HTML. Debug bucket: full redacted messages, 14-day retention, locked ACL, sampled 1% plus all errors. Legal will thank you for the split. A warehouse that holds every prompt is a second CRM you did not mean to build.

Redact before persist. The tryit redacts the preview; production must redact every content field. If a secret appears in a validator error (“bad key sk-live…”), redact errors too. Prefer \`ValueError("missing API_KEY")\` in **your** code so you do not have to redact your own exceptions.

Streaming: log the assembled message, not each delta. Cost and PII both explode with deltas.

\`\`\`viz flow
title Log the call, not a vibe
layout lr
node req Request
node resp Response
node span Span
edge req resp
edge resp span
caption Model, usage, finish reason, knobs, roles. Without this you cannot debug the bill or the bug.
\`\`\`

\`\`\`tryit python
def redact(text):
    for secret in ["sk-live", "SECRET"]:
        text = text.replace(secret, "[redacted]")
    return text

def span(call, resp, spent):
    msgs = call["messages"]
    return {
        "model": call["model"],
        "n_messages": len(msgs),
        "roles": [m["role"] for m in msgs],
        "prompt_tokens": resp["usage"]["prompt_tokens"],
        "completion_tokens": resp["usage"]["completion_tokens"],
        "finish_reason": resp["finish_reason"],
        "spent": spent,
        "preview": redact(resp["message"]["content"][:40]),
    }

call = {
    "model": "tiny-1",
    "messages": [
        {"role": "system", "content": "No secrets."},
        {"role": "user", "content": "key is sk-live-abc"},
    ],
}
resp = {
    "message": {"role": "assistant", "content": "I will not echo SECRET."},
    "usage": {"prompt_tokens": 12, "completion_tokens": 6},
    "finish_reason": "stop",
}
print(span(call, resp, spent=0.0001))
\`\`\`

The printed span has roles, usage, finish reason, and a preview with \`SECRET\` redacted. The user message still contains \`sk-live-abc\` **inside \`call\`** if you logged the raw object — so you must redact messages before persist, not only the preview. The toy redacts the assistant tail. Homework in your head: run the same \`redact\` on every \`m["content"]\` before you write the warehouse row. If you skip that, the span is a second copy of the key.

One JSON line per LLM call, same id as the agent step. Replay: feed \`messages\` into \`FakeChatClient\`. Eval: group by model and spec version.

## What goes wrong

- **Screenshots as the source of truth.**
- **Full prompts in the product warehouse.**
- **No usage**, so the bill is a mystery.
- **No spec id**, so a prompt PR cannot be blamed or credited.
- **Logging deltas** (streaming lesson) and multiplying PII.

## How agents use this

A \`span()\` function next to the HTTP client. Tests: redact removes \`sk-live\`; a missing usage field fails the schema of the log itself. Dashboards: call count, tokens, finish reasons, JSON fail rate, escalate rate, spent vs cap.

When finance asks why yesterday’s LLM bill jumped, answer with call count, model, and usage tokens per trace — not with adjectives from the system prompt, not with the user’s email body verbatim.

A useful finance view is three numbers per day: calls, input tokens, output tokens, broken down by model and by step kind. A useful eng view is JSON fail rate, length rate, filter rate, escalate rate. If those sit in different systems that cannot join on \`trace_id\`, you will still argue from screenshots. Put them on the same span.

Retention: usage and ids can live as long as the ticket. Raw prompts should not. When a customer asks you to delete their data, the debug bucket must be in the deletion path. If it is not, you do not have a log policy. You have a leak with timestamps.

> **Warning:** Full-prompt logs are a privacy incident waiting. Default to roles + lengths + redacted tails. Full dumps in a locked debug bucket.

\`\`\`quiz
Finance asks why yesterday’s LLM bill jumped. What log fields answer first?
- The system prompt adjectives
- *Call count, model, and usage tokens per trace
- GPU temperature
- The user’s email body verbatim
explain: Bills follow usage. Request counts and token sums are the instruments. Poetry is not. Verbatim email is a privacy incident, not a finance answer.
\`\`\`
`,
  },
  {
    slug: "when-not-llm",
    title: "When Not to Use an LLM",
    summary:
      "If a lookup, regex, or workflow can do the job, skip the model. Save it for branches you cannot draw.",
    minutes: 22,
    level: "intermediate",
    md: `
The first lesson said: if you can replace the LLM with a table or a workflow, do that. This lesson is the checklist you run **before** you open \`complete(messages)\`. Fashion is not a reason. Latency, cost, and new failure modes are reasons to keep the workflow you already have.

**Skip the LLM** when:

- The answer is in a database and the query is known
- The action is a fixed form (refund with id + amount already validated)
- A regex or classifier already hits 99% on this intent
- You need a **guarantee** (checksums, totals, authz, “this hash matches”)
- The user needs the same deterministic paragraph every time (legal, medical dosing you are not allowed to generate)
- The state machine is short and you can draw it on one page

**Use the LLM** when:

- Language is messy and the schema is small
- You must propose the next tool from a documented list
- You must draft prose the user will edit
- The branch list is too long to hard-code, and you have evals

Hybrids win: rules first, LLM on the leftover, tools for facts, humans for money. A tiny router (even without a model) that says “this ticket has \`job_id\` and the word status → \`get_job\`” should not wait on a poem.

## The test

Write the if-statement. If you can, ship it. If you cannot, write the schema, the cap, and the eval, **then** add an LLM step. Do not start with the model and hope the if-statement appears later. It will not. You will grow a prompt instead.

Replacing a working workflow with an LLM because it is fashionable is how you buy latency, cost, and hallucinations on a path that used to be a \`SELECT\`. Keep the workflow. Add the model on the messy branch.

\`\`\`viz flow
title Rules first, model on the leftover
layout lr
node if If you can
node tool Tool or SQL
node llm Then LLM
edge if tool
edge if llm
caption If a lookup can do the job, skip the model. Save it for branches you cannot draw.
\`\`\`

\`\`\`tryit python
def use_llm(ticket):
    text = ticket["text"].lower()
    if ticket.get("job_id") and "status" in text:
        return "tool get_job, no llm"
    if ticket.get("amount") is not None and "refund" in text:
        return "workflow refund, no llm"
    if "how do i" in text or "explain" in text:
        return "llm draft, then human"
    return "llm classify, then route"

tickets = [
    {"text": "status of job", "job_id": 17},
    {"text": "refund please", "amount": 12.5},
    {"text": "how do I reset MFA?"},
    {"text": "this invoice looks weird and also the VPN"},
]
for t in tickets:
    print(t["text"], "->", use_llm(t))
\`\`\`

Status with an id does not wait on a poem. A structured refund does not wait on temperature. “How do I” can use a **draft** the human edits. The weird mixed ticket is why you still have a model — **after** a classifier, not instead of tools. Four prints, four policies. The last line is the leftover language this whole track exists to wrap: schema, cap, eval, then \`complete\`.

A classifier can itself be a small model. That still counts as “use an LLM,” but it is a **bounded** use: labels in an enum, temperature 0, no tools that spend money. Do not confuse that with sending the invoice to a frontier chat to “figure it out.”

## Draw the branches you can draw

Sit with the last 50 tickets. Mark each: known id + known intent; known form; messy language; needs a draft. If 40 of 50 are the first two buckets, those 40 should never call a chat model. The remaining 10 get a classifier, then either a tool or a draft. That arithmetic is the product. A demo that sends all 50 to a frontier model will look smarter in a meeting and worse in a month.

Regex and keyword routers feel unfashionable. They are also inspectable. When they hit 99% on an intent, keep them. Use the model for the 1% leftover — with a schema — not as a replacement for the 99%. If the 99% path is a refund form with amount already validated, the workflow is: authz, cap, idempotency key, POST payment. The model does not sit in that path.

## Guarantees

Authz is code. Totals are code. Checksums are code. The model may **propose** a refund. The executor checks the allowlist, the amount cap, and the idempotency key. If those fail, the poem does not matter. The first lesson called the LLM a guessing policy. This lesson is when you should not ask it to guess.

Deterministic legal paragraphs belong in templates. If legal needs the same sentence every time, a model that paraphrases is a bug, not a feature.

The same rule applies to “explain this error code.” If the mapping from code to paragraph is a table, use the table. If the user pasted a stack and you need a draft for a human, that is leftover language — LLM, then human. Do not auto-send the draft to the customer without a template check.

## What goes wrong

- **LLM for known SQL.**
- **LLM for checksums.**
- **LLM to replace a 4-branch form** because a demo impressed a meeting.
- **No leftover path**, so messy tickets get a regex that is 60% and everyone pretends.
- **Drafting legal copy** without a template and a lawyer.

## How agents use this

Every new skill starts as: can this be a tool + if-statement? If yes, ship that. If no, add an LLM step with a schema, a cap, and an eval. The next tracks (prompts, tools, RAG, agents) assume you already know when **not** to open this box.

Joeven’s fake clients exist so you can test the wrap without a model. If the test passes with a scripted assistant, you still need an eval when you turn the model on. If the test **is** the if-statement, you may not need the model at all.

Write the skip rule next to the skill: \`if ticket.job_id and "status" in text: return get_job(ticket.job_id)\`. Review it like any other API. The LLM track ends here on purpose. Prompting, tools, RAG, and agent loops are for the leftover. They are not a license to delete the if.

> **Tip:** Keep the workflow. Add the model on the messy branch. Known query + known tool is a workflow. Save the LLM for leftover language.

\`\`\`quiz
The user sends job_id=17 and the word status. Best first move?
- Ask a frontier model to role-play an SRE
- *Call get_job(17) from code (a tiny router may still choose the tool)
- Sample three poems and vote
- Fine-tune
explain: Known query + known tool is a workflow. Save the LLM for leftover language. Role-play, voting, and fine-tunes are how a SELECT becomes a bill.
\`\`\`
`,
  },
];
