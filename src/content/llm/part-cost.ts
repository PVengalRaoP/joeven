import type { RawLesson } from "@/lib/types";

export const llmCost: RawLesson[] = [
  {
    slug: "tokens-and-cost",
    title: "Tokens and Cost",
    summary:
      "Vendors charge for tokens both ways. Agent loops resend a growing prompt, so cost climbs every step.",
    minutes: 21,
    level: "beginner",
    md: `
Vendors charge for **tokens**, usually both directions, often at different rates. **Input** (the prompt: system, history, tools, observations) is cheaper. **Output** (the completion) is the tip. An agent loop **resends the growing prompt** every step, so the bill is closer to **sum of prompt sizes** than to “one chat with a final answer.”

If input is 3 dollars per million tokens and output is 15, a 4k-prompt / 200-completion turn is cheap once. At step 15, when the prompt is 20k because you never summarized, you pay for 20k input **again**, plus another completion. The user still sees one ticket. Finance sees a furnace.

True counts need the **model’s tokenizer** — the same one the Transformers track introduced. Character/4 is a rumor. Code, JSON, and non-English text are often worse. For **planning**, a crude estimator is better than nothing. Split on spaces, then treat long words as extra pieces. For **billing**, believe \`usage\` on the response. Mixing a notebook estimate with a production invoice is how you “stay under budget” until the card statement.

## One turn vs a loop

A single chat is: pay for this prompt, pay for this completion, done. An agent is: pay for prompt 1, completion 1, then prompt 2 which **includes** prompt 1 plus the tool result plus completion 1, and so on. Even if completions stay short (“I’ll call get_job”), input climbs.

That is why “we only generate 80 tokens per step” can still be expensive. The 80 is the tip. The iceberg is the resent spec, the tool docs, the RAG chunks, and every past observation.

\`\`\`viz bars
title Loop cost is the growing prompt
bar step1,1,0
bar step4,4,1
bar step8,8,2
caption Completions stay short. Input climbs every step. The bill is a sum, not one chat.
\`\`\`

\`\`\`tryit python
INPUT_PER_M = 3.00
OUTPUT_PER_M = 15.00

def rough_tokens(text):
    n = 0
    for w in text.split():
        n += max(1, (len(w) + 3) // 4)
    return max(n, 1)

def cost(prompt, completion):
    pt = rough_tokens(prompt)
    ct = rough_tokens(completion)
    dollars = pt * INPUT_PER_M / 1000000 + ct * OUTPUT_PER_M / 1000000
    return pt, ct, dollars

prompt = "system: be brief user: status of job 17?"
completion = "I'll call get_job."
print("single turn", cost(prompt, completion))

obs = "tool result: " + ("timeout " * 40)
steps = 8
running = prompt
bill = 0.0
for step in range(steps):
    pt, ct, d = cost(running, completion)
    bill += d
    running += " " + obs + " " + completion
    print("step", step + 1, "prompt_tok", pt, "usd", round(d, 6))
print("loop total usd (toy rates)", round(bill, 6))
print("final prompt tokens", rough_tokens(running))
\`\`\`

\`single turn\` is tiny. Then each step prints a **climbing** \`prompt_tok\`. The completion string never grows; the prompt does. Loop total is many times the single turn. Toy rates, toy tokenizer — the **shape** is real. If you paste a realistic tool payload into a vendor tokenizer UI and multiply by expected steps, you will feel the same curve with honest numbers.

## Hidden multipliers

These do not show up in a playground screenshot of “one reply”:

- **Retries and timeouts** that still bill a partial completion
- **Sampling n greater than 1** (three completions for one question)
- **RAG:** you pay to embed **and** to stuff chunks into the LLM
- **Vision:** images tokenize as many tokens, often more than you expect
- **Playground clicking** without \`max_tokens\`, then copying that habit into prod
- **Long “reasoning” traces** the vendor streams into the bill as output tokens
- **Tool result dumps:** a 40-line stack trace in a tool message is a 40-line prompt tax on every later step

Output is often priced higher than input. Long reasoning can help quality on some tasks. It definitely helps the invoice. Cap it. Treat “thinking tokens” as a product choice with a budget, not as free intelligence.

Compare vendors on **your** mix of input vs output, not on a blog’s “dollars per million.” A model that is cheap on input and verbose on output can lose to a pricier quiet model. Measure completion tokens per **successful task**, not per call. A call that fails JSON and retries is two calls.

Cached input tokens are sometimes cheaper. Caching helps only if the **prefix** is stable — next lessons in this part.

Per-task metrics beat per-call vanity: tokens per resolved ticket, dollars per successful \`get_job\`, dollars per failed JSON retry. A dashboard of “average tokens per HTTP” hides the loop. Group by trace id, sum usage, then average those sums.

Vision and audio, if you add them later, are token bombs. Count them before you put screenshots in every support ticket. Embeddings have their own meter; stuffing eight chunks still hits the LLM meter too.

## A walkthrough: search tool economics

Before adding a search tool, paste a **realistic** result into the vendor tokenizer. Eight snippets of 400 tokens each is 3,200 tokens. Called three times, that is 9,600 tokens of observations, resent as the prompt grows, plus the snippets still sitting in history if you never trim. A goal that cannot be reached within your cap should fail closed, not wander through a fourth search.

Maya’s support agent had a handbook dump in every call “in case it helps.” Quality did not move. Input tokens tripled. The fix was packing (later) and this lesson’s habit: **estimate before you add**.

## What goes wrong

- **Budgeting in characters.** JSON and code will blow the window and the bill.
- **Ignoring loop shape.** “Average tokens per call” hides step 12.
- **Uncapped output.** Reasoning novels, then a JSON afterthought.
- **Logging full prompts to a paid log product** and paying twice: once to the LLM, once to logs.
- **Comparing vendors on list price only.** Your mix and your verbosity decide the winner.

## How agents use this

Store \`usage\` on every step. Dashboard: tokens per successful ticket, not tokens per HTTP. Before a new tool, write the expected result size in tokens and the expected call count. If that product exceeds the cap, the tool is too chatty or the path is wrong.

A spend cap (next lesson) needs these numbers. Without usage, a cap is a vibe. With usage, a cap is arithmetic.

Trim observations. Summarize history as **decisions and ids**, not as chain-of-thought. Put fat RAG chunks only on the step that needs them. Those are context-engineering moves; they exist because of this cost curve.

Before a tool PR merges, paste a realistic payload into the vendor tokenizer (or your local tokenizer for open weights) and multiply by expected steps. Write the number in the PR. If nobody can name the number, the tool is not ready.

> **Note:** Cached input tokens are sometimes cheaper. Caching helps only if the **prefix** is stable — next lesson after spend caps.

\`\`\`quiz
Why do agent loops cost more than a single chat with the same final answer?
- GPUs dislike JSON
- *Each step resends a longer prompt, so input tokens accumulate across steps
- Output is billed per thought-second
- Tokenizers round up to a million
explain: Cost tracks cumulative prompt size. Loops without trimming compound input tokens. The final answer’s length is not the bill.
\`\`\`
`,
  },
  {
    slug: "spend-caps",
    title: "Spend Caps",
    summary:
      "Put a dollar (or token) cap next to max steps. When the cap hits, do not call. Fail closed or hand off.",
    minutes: 19,
    level: "beginner",
    md: `
\`max_steps\` is not a budget. An agent can burn a week of tokens in eight verbose steps: a huge handbook, three searches, a reasoning novel, a retry. Put **money** (or a token ceiling you convert to money) next to steps.

A simple rule:

1. Each call costs \`prompt_tokens * in_rate + completion_tokens * out_rate\` (plus any tool you pay for separately).
2. Before you call, estimate the next prompt (you already have the messages) plus a **worst-case** completion of \`max_tokens\`.
3. If \`spent + next_estimate > cap\`, **do not call**. Handoff or fail closed.
4. After the call, add **actual** \`usage\` to \`spent\`. Estimates are for the gate; usage is for the books.
5. Cap keys in the vendor dashboard too. Two layers. A runaway loop should hit *your* code first and the vendor second.

**Fail closed** means: stop, tell the user you cannot finish, do not guess the last action to be “helpful.” A refund you cannot afford to think about is not a refund you invent.

## Caps are stop conditions

You already want \`max_steps\` so the loop cannot run forever. \`max_usd\` is the same idea in currency. Some teams cap **tokens** instead of dollars so they do not rewrite code when prices change. Either works. What does not work is a spreadsheet that nobody reads at runtime.

Alert when daily tokens exceed a baseline (yesterday’s p95, or a fixed quota per tenant). Per-trace \`max_usd\` belongs next to \`max_steps\`. Per-tenant daily caps stop one noisy customer from eating the account. Vendor dashboard caps stop a leaked key from becoming a five-figure night.

\`\`\`viz bars
title Cap next to max steps
bar spent,0.016,1
bar next-call,0.007,2
bar cap,0.020,0
caption If spent plus the next estimate crosses the cap, do not call. Fail closed or hand off.
\`\`\`

\`\`\`tryit python
IN_RATE = 3.0
OUT_RATE = 15.0
CAP = 0.02

def usd(prompt_tok, completion_tok):
    return prompt_tok * IN_RATE / 1000000 + completion_tok * OUT_RATE / 1000000

spent = 0.0
log = []
for step, (pt, ct) in enumerate([(2000, 80), (8000, 120), (20000, 150), (25000, 150)], start=1):
    d = usd(pt, ct)
    if spent + d > CAP:
        log.append(("stop", step, round(spent, 6), round(d, 6)))
        break
    spent += d
    log.append(("ok", step, round(spent, 6)))
print(log)
print("final spent", round(spent, 6))
\`\`\`

Early steps are \`ok\` and \`spent\` climbs. A later fat prompt would push over \`CAP\`, so the log records \`stop\` with the step number, the spent so far, and the call you **did not make**. That stop is a success. You did not keep calling. In production, convert that into a user-visible handoff and a trace event \`budget_exhausted\`.

The toy uses actual usage as if you knew it before the call. Real code should gate on an estimate (prompt known, completion assumed \`max_tokens\`), then correct with usage. If you only add usage *after* a 4k completion, you can overshoot. Set \`max_tokens\` small on tool steps so the overshoot cannot be a novel.

## Estimates when adding a tool

When you add a tool, estimate typical result size — that estimate is the **unit economics** of the path. A \`get_job\` that returns four fields is cheap. A \`dump_logs\` that returns 20k tokens is a budget weapon. Maybe the tool should return a summary plus a link. Maybe only a debug role may call it.

Retries count. Two 429-wait-then-success cycles are two LLM bills if you retried the model, plus whatever the vendor billed for partials. Put attempt numbers on the trace next to spent.

Per-tenant daily caps sit next to per-trace caps. A noisy customer with 2,000 tickets should hit a daily ceiling without taking down everyone else’s budget. Vendor dashboard caps are the last backstop when your process dies and the loop does not.

Estimate the next completion as \`max_tokens\`, not as “it usually writes 80.” The gate is conservative on purpose. After the call, add actual usage. If you only add usage after the fact, one 4k surprise overshoots. Keep tool \`max_tokens\` small so the surprise cannot be a novel.

Rates live in config, not in comments. When the vendor changes prices, you change config and the cap still means dollars.

## A walkthrough: the 3 a.m. loop

A planner never emits \`finish\`. Each step writes a long thought and a search. \`max_steps\` is 30. Without a dollar cap, 30 fat prompts land at 4 a.m. With \`max_usd=0.50\` on the trace, the loop stops at step 6 and pages a human. The bug is still real (no stop rule in the spec). The cap is the **blast radius**. Blast radius is what production is for.

## What goes wrong

- **Caps only in a spreadsheet.** Wishes do not stop HTTP.
- **Gating on steps only.** Verbose steps still ruin the month.
- **Using list prices from last year.** Rates move. Config the rates.
- **One global cap for a multi-tenant product.** Noisy neighbor problem.
- **Hiding remaining budget from developers.** Then nobody notices a packing regression until finance does.
- **Continuing after the cap “just this once.”** That is how exceptions become the policy.

## How agents use this

Show remaining budget on the **trace UI for yourself**, not necessarily the user. Finance will ask. “The model was thinking” is not an answer. \`usage\` on every step is.

When the next call would exceed the cap, skip it. Same code path as hitting \`max_steps\`. Do not lower temperature and try anyway. Do not delete usage from the log to “look cheaper.”

Tests: feed a fake client that returns huge \`prompt_tokens\` and assert the third call never happens. Caps that are not tested are decorations.

Show remaining budget on the trace UI. When the next call would exceed the cap, skip it — same path as \`max_steps\`. Do not lower temperature and try anyway. Do not delete usage from the log to “look cheaper.”

Wire the stop to user copy: “I could not finish this within budget; a human will take it.” That sentence is a feature. Wandering is not.

> **Tip:** Caps that only live in a spreadsheet are wishes. Caps in code stop the loop. Vendor dashboard caps are the backstop, not the only layer.

\`\`\`quiz
The next LLM call would push this trace over max_usd. What should the agent do?
- Call anyway; the user is waiting
- *Skip the call: fail closed or hand off
- Raise temperature so it finishes faster
- Delete usage from the log
explain: A spend cap is a stop condition, like max_steps. Crossing it is a product failure you chose to prevent. Temperature does not reduce prompt size.
\`\`\`
`,
  },
  {
    slug: "prompt-cache",
    title: "Prompt Caching",
    summary:
      "Some vendors cheapen a stable prefix. Caching helps only if the first bytes stay the same. Put volatile text last.",
    minutes: 20,
    level: "intermediate",
    md: `
**Prompt caching** (prefix cache) means: if the **start** of the prompt is the same as a recent call, the vendor may charge less for those input tokens and skip some prefill work. You still send the messages. They still count toward the window. You may pay a cheaper rate for the repeated head.

This is not magic memory. The model does not “remember last Tuesday.” The bytes at the **front** must be **byte-stable** across calls. Shuffle the system prompt, inject the current time at the top, or reorder tools, and you miss the cache. A 5% hit rate is not a strategy. It is a random discount.

Your GPU **KV cache** (Transformers track) is per running sequence while a generation is in flight. Vendor prompt cache is a **billing and prefill** feature **across** calls, minutes later, maybe from another machine. Related idea, different product. Do not tune one hoping to fix the other.

## Stable prefix, volatile tail

Put the **stable** bits first:

1. Long pinned spec (versioned, not edited per request)
2. Tool docs that rarely change
3. Then the **changing** user turn, last observation, retrieved chunks, timestamps

If you must include “now,” put it last, or in the user message, not as line one of system. If you A/B two specs, you will split the cache — that is expected; measure both.

Minimum size and TTL (how long the vendor keeps the prefix) are vendor-specific. Some require a marker or a header. Some only cache above a token threshold (for example, a long spec). Read the current docs when you implement. This lesson is the **byte-stability** rule, which does not change when the header name does.

\`\`\`viz flow
title Stable prefix, volatile tail
layout lr
node spec Pinned spec
node tools Tool docs
node tail User + obs
edge spec tools
edge tools tail
caption Caching helps only if the first bytes stay the same. Put the clock last, or not at all.
\`\`\`

\`\`\`tryit python
def prefix_key(messages, cache_n):
    blob = "\\n".join(m["role"] + ":" + m["content"] for m in messages)
    return blob[:cache_n]

spec = {"role": "system", "content": "PINNED SPEC " + "rule " * 20}
tool = {"role": "system", "content": "tools: get_job"}
user_a = {"role": "user", "content": "job 17"}
user_b = {"role": "user", "content": "job 18"}
clock = {"role": "system", "content": "now=12:01"}

stable = [spec, tool, user_a]
unstable = [clock, spec, tool, user_a]
other = [spec, tool, user_b]
n = 80
print("same user, stable prefix match", prefix_key(stable, n) == prefix_key([spec, tool, user_a], n))
print("clock first breaks prefix", prefix_key(unstable, n) == prefix_key(stable, n))
print("new user keeps spec prefix", prefix_key(other, n)[:40] == prefix_key(stable, n)[:40])
\`\`\`

Same user, same order: prefix matches (\`True\`). Clock as the first message: match breaks (\`False\`). New job id at the **end**: the first 40 characters of the blob still match, because spec and tools came first. That is the win: many tickets share a spec prefix; only the tail changes.

If you put \`now=12:01\` first, every minute is a new prefix. You paid for a clock to miss the discount. Put the clock last if you need it at all. Many agents do not need a clock in the prompt; a tool \`get_time\` is an observation in the tail.

## What belongs in the prefix

Good: a 1–2k token spec you version as \`spec@2026-03-01\`, a stable tool list, a short legal example. Bad: per-user personalization at line one, shuffled tool order, retrieved chunks (they change every query), “session so far” dumps.

Tool docs should be **the enabled set**, and that set should not shuffle. If you sort tool names alphabetically, do it every time. Random order from a dict iterate is a cache miss on some Python versions and a heisenbug in your bill.

## Measure hit rate

Log cached vs uncached input tokens when the vendor provides them. Hit rate = cached / (cached + uncached) on the prefix-eligible portion. If you cannot log it, you cannot claim caching as a savings plan. A cache that never hits is complexity for nothing.

Do not build a second cache in front of the vendor unless you have a measured miss. Your own identical-prompt cache (same bytes → same completion) is a different, useful idea for **deterministic** steps at temperature 0 — and it has consistency issues if the model or spec changes. Version the key with \`model\` + \`spec id\`.

Hit rate without a threshold is a vanity metric. If the vendor only caches prefixes longer than N tokens, a 200-token spec will never hit. Lengthen the stable spec (tool docs count) or stop claiming cache as a plan. Measure \`cached_tokens / prompt_tokens\` on traces that share the spec, not on the first call of the day (cold cache).

TTL: if the vendor drops the prefix after 5 minutes of silence, a low-traffic agent will never hit. Batching and prefix stability both matter. A burst of tickets after a deploy is the moment you should see hits — if you shuffled tools in the deploy, you will not.

Clock and request id belong in the tail, or in a tool observation. A/B specs split the cache on purpose; name the spec id so you do not call that split a regression. Measure hit rate **per spec id**.

## What goes wrong

- **Timestamp or request id at the top** of system.
- **Reordering tools** every call.
- **Per-user “you are talking to Maya”** as the first line instead of a later metadata line.
- **Assuming cache = memory.** The model still only sees this prompt.
- **Not measuring.** Then a packing change silently kills the discount.

## How agents use this

Pin the spec. Do not shuffle tools. Do not put the current time in the first message. Put dynamic stuff last. Caching is another reason the context-engineering lesson will say: stable prefix, volatile tail.

Unit-test \`build_context\`: the first N characters of the serialized prefix are identical across two tickets that share a spec. If a developer adds \`str(datetime.now())\` to system, the test fails. That test is cheaper than a month of missed cache.

Sort tool names in code, every time. Put request ids, clocks, and user text after the prefix. Log cached vs uncached when the vendor provides the split. If they do not, you cannot manage cache; you can still keep the prefix stable for prefill speed on some hosts.

> **Note:** GPU KV cache is per running sequence. Vendor prompt cache is a billing feature across calls. Related idea, different product. Context packing (later) is how you keep the tail small either way.

\`\`\`quiz
You added the current timestamp as the first system line. Cache hit rate dropped. Why?
- Timestamps use extra GPUs
- *The prefix bytes changed every call, so the cheap prefix no longer matched
- Output tokens cannot be cached
- JSON cannot be cached
explain: Prompt cache keys the start of the prompt. Volatile text belongs at the end. Output billing is a separate meter.
\`\`\`
`,
  },
];
