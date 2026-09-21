import type { RawLesson } from "@/lib/types";

export const prodSee: RawLesson[] = [
  {
    slug: "tracing-observability",
    title: "Tracing and Observability",
    summary:
      "Traces first: spans for the job, each model call, and each tool. Operators need a timeline, parsed tool calls, and dollars — not a pretty token stream.",
    minutes: 21,
    level: "intermediate",
    md: `
Observability for agents is **traces first**, metrics second, logs third. A counter that says “errors up” does not tell you which tool, which tenant, which prompt version. A pretty token stream is for demos. At 2 a.m. a human needs a **table**: what happened, in order, with durations and estimated dollars.

You can start with a JSON table and still be production-shaped. OpenTelemetry names are useful even if the first exporter is “insert into traces.” The parent span is the job. Children are model calls, tools, parses, and human waits. If you only log the final paragraph, you cannot operate the loop.

This lesson is how you **see a job**. Redaction, paging, cost caps, and CI gates come next. Without spans, those controls are blind.

## How the box actually works

Every job gets a \`trace_id\` (often equal to \`job_id\`). Every interesting wait becomes a span with a parent. Attributes are how you slice later.

| Span name | Parent | Attributes you actually query |
|---|---|---|
| \`job.run\` | none | tenant, job id, prompt version, worker SHA |
| \`llm.complete\` | job.run | model, tokens in, tokens out, usd_est, finish reason |
| \`tool.*\` | job.run | tool name, ok, code, usd_est, tenant used |
| \`parse\` | job.run | ok, schema version |
| \`hitl.wait\` | job.run | gate name, wait_ms, decided_by |

\`\`\`viz strip
title A job is a timeline of spans
chip Job
chip Model
chip Tool
chip HITL
chip Cost
caption Operators need order, parsed calls, and dollars — not a pretty token stream.
\`\`\`

Roll-ups an operator wants in one screen:

1. The **timeline** — model vs tool vs queue wait vs HITL. A job that “feels slow” is often queue time, not genius thinking.
2. **Parsed** tool calls — name and arguments after schema check, not only raw tokens.
3. Whether a **human gate** was skipped.
4. **Cost so far** vs cap, from \`usd_est\` on spans.

Owners: runtime instruments the worker (start/stop spans). Domain tools add their own child spans. Data owns retention and the trace store. On-call owns the saved views: “last 20 failed jobs,” “cost by tenant this hour.”

Put \`trace_id\` on user-facing error pages as a **support code**. Attach a trace link to every alert. “p95 is high” without a job id is a riddle.

Operator procedure for a slow or expensive job:

1. Open \`job.run\`. Read tenant, versions, status.
2. Sort children by start time. Note queue wait if you recorded it as a span or as \`queued_ms\` on the job.
3. Sum \`usd_est\`. Compare to the cap on the job row.
4. Click the first failing tool or the fattest \`llm.complete\`. Read parsed arguments, not the token stream.
5. If HITL exists, confirm a \`hitl.wait\` span with a decision. Missing span plus a write tool is a bypass.

If that procedure requires grep, the product is not operable yet. Build the screen that makes those five steps clicks.

## A cost-spike ticket

At 01:40 a finance bot posted “model spend 8× weekday baseline.” Metrics said tokens up. Nobody knew why. Slack filled with screenshots of the chat UI. Three engineers grepped different log piles for the word “refund.”

The missing object was a trace for \`job_17\`: two \`llm.complete\` spans totaling ~930 ms and a handful of cents, plus a \`tool.search_kb\` at 80 ms. Once spans existed, the spike was obvious the next time: a new prompt version stuffed the whole handbook into every step, input tokens climbed, \`usd_est\` rolled up by \`prompt=p13\`. The page became “p13 cost per job,” not “the AI is hungry.”

Support stopped asking customers to paste the conversation. The error page already had \`job_17\`.

\`\`\`tryit python
import json

spans = []

def span(name, parent, attrs, dur_ms):
    rec = {"name": name, "parent": parent, "dur_ms": dur_ms}
    rec.update(attrs)
    spans.append(rec)
    return rec

span("job.run", None, {"job_id": "job_17", "tenant": "acme"}, 0)
span("llm.complete", "job.run", {"model": "fake-small", "tokens_in": 900, "tokens_out": 40, "usd_est": 0.002}, 420)
span("tool.search_kb", "job.run", {"ok": True, "usd_est": 0.0}, 80)
span("llm.complete", "job.run", {"model": "fake-small", "tokens_in": 1200, "tokens_out": 60, "usd_est": 0.003}, 510)

def summarize(rows):
    llm = [s for s in rows if s["name"] == "llm.complete"]
    tools = [s for s in rows if s["name"].startswith("tool.")]
    return {
        "llm_ms": sum(s["dur_ms"] for s in llm),
        "tool_ms": sum(s["dur_ms"] for s in tools),
        "usd": round(sum(s.get("usd_est", 0) for s in rows), 6),
        "llm_calls": len(llm),
    }

print(json.dumps(spans, indent=2))
print("SUMMARY", summarize(spans))
\`\`\`

The JSON dump is four rows: one job, two model calls, one search. \`SUMMARY\` should show about 930 ms in the model, 80 ms in tools, two LLM calls, and about 0.005 dollars. Most of the wall time was the two \`llm.complete\` spans, not the handbook search. Dollars roll up from spans. That roll-up is what you chart per tenant and per prompt version. If \`usd_est\` is missing, your cost dashboard is fiction.

## What goes wrong

Logging only completions. Logging only stdout. Spans without tenant or prompt version, so you cannot group. Spans with full prompts and secrets (next lesson). Tracing sampled at 1% on a product that has 40-step jobs — you will miss the expensive one. Dashboards of token totals with no exemplars. Alerts that cannot open a trace.

Another failure: treating the vendor playground as observability. When the vendor is the incident, you have no copy of the spans.

Pretty UIs that show tokens streaming but do not persist parsed tool names: demos look alive, incidents look empty.

## How to test it

- After a fake job, assert spans exist for \`job.run\`, each \`llm.complete\`, and each tool.
- \`summarize\` math: llm_ms, tool_ms, usd, llm_calls match fixtures.
- Attributes required: tenant, job_id, model, template version (from the stamp).
- Unknown job id on the trace UI is a 404, not another tenant’s trace.
- An alert fixture includes a \`trace_id\` field. CI fails if the pager payload lacks it.

Load a recorded job in the UI and time how long until an on-call engineer can say “two model calls, search ok, 0.005 dollars.” If that takes grep, the product is not operable.

## How agents use this

Instrument the worker, not the prompt. Wrapping \`complete()\` and \`call_tool()\` is the whole trick. Every new tool gets a \`tool.<name>\` span with \`ok\` and \`code\`. Every cap event gets a span or an event: \`MAX_USD\`.

Put the support code on the error page and in the staff admin. Paste culture should die. Saved query: last 20 failed jobs with tool names and dollars. Exemplars beat averages.

When you page a human, the first link is the trace. The second is the versions stamp. The third is the ledger if money moved. If you cannot produce those three, you are not paging, you are starting a scavenger hunt.

Export is not observability. If the only copy of spans lives in a vendor UI, a vendor incident makes you blind. Keep a store you can query when they are down. Sampling is allowed on huge successful FAQ jobs; do not sample away failed jobs, forbidden tools, or anything over a dollar.

> **Tip:** Queue wait is a span too. A “slow model” that sat in \`queued\` for 12 minutes is a capacity bug.

\`\`\`quiz
Which attribute helps you explain a cost spike?
- Only CPU temperature
- *Per-span token counts, model id, and usd_est rolled up by tenant and prompt version
- The agent’s favorite color in the system prompt
- Screenshot PNG hashes
explain: Cost is a first-class trace field. Without tokens and versions, you cannot attribute spend.
\`\`\`
`,
  },
  {
    slug: "redact-before-export",
    title: "Redact Before You Export",
    summary:
      "Traces are a new PII store. Redact secrets, cookies, and card numbers before any exporter, before the scratchpad, and in the operator UI.",
    minutes: 20,
    level: "intermediate",
    md: `
Traces are a **new place you keep private data**. They look like logs, so teams treat them casually. They are closer to a database of conversations, tool dumps, and error pages — including secrets that vendors stuffed into a 500 HTML body. Redact secrets, cookies, health data, and raw card numbers **before** export to a SaaS vendor. Retention: 30 days may be plenty. “Keep forever for training” is how you get a second incident.

If you export traces, that vendor is a **subprocessor**. Legal should know. Engineers should know what is redacted. Logging full prompts to a third party may break a contract you never read. Read the agreement before you enable “prompt telemetry.”

Scan for \`sk-\` and \`Bearer \` (imperfect, still worth it). Redact in the **UI** too — curious employees are a threat model. The exporter is not the only reader.

## How the box actually works

Redaction is a **pipeline stage**, not a dashboard filter. Data flows: tool result → redact → scratchpad / spans → store → exporters. If you redact only in the UI, the vendor already indexed the key. If you redact only at export, the model already saw the key and may echo it on the next step.

| Stage | What you strip | Owner |
|---|---|---|
| Tool adapter | Keys, cookies, \`Authorization\` headers, card-shaped numbers in errors | Domain tool |
| Assembler | Repeat the same nets before the next model call | Runtime |
| Trace writer | Same nets plus field allow-lists (store \`code\`, not HTML) | Observability |
| Exporter | Defense in depth; never the first net | Observability |
| Trace UI | Mask by default; “reveal” is audited | Security + ops |

\`\`\`viz flow
title Redact before anything leaves
layout lr
node tool Tool result
node redact Redact
node store Store
node export Export
edge tool redact
edge redact store
edge store export
caption The vendor must never be the first net. Curious employees are a threat too.
\`\`\`

Patterns to scan (none are proofs): \`sk-\`, \`Bearer \`, \`api_key=\`, long base64 cookies, \`eyJ\` JWT prefixes, PAN-shaped digit groups. Prefer **structured tool results** so you are not regexing HTML. A tool that returns \`{"code": "UPSTREAM_500"}\` is safer than one that returns the vendor’s error page.

Retention and access: traces are as sensitive as tickets. SSO groups. Audit “view trace.” Do not put the trace bucket on the public internet because the URLs look random.

Owners: security sets the nets and the subprocessor list. Runtime applies them. Legal keeps the inventory. On-call rotates keys when a leak is suspected — redaction is not encryption of a key that already left.

Allow-list fields on spans: \`job_id\`, \`tenant\`, \`tool\`, \`code\`, \`ok\`, token counts, \`usd_est\`, versions. Deny-list or drop: raw HTTP bodies, cookies, \`Authorization\`, environment dumps, full handbook pages. If a debug field is tempting, put it behind an audited “reveal” in the UI, not in the exporter.

Retention clocks: job rows might live 90 days; traces 30; blobs until the ticket closes. “Keep forever for training” needs a legal review and a redaction pass that is stricter than ops traces, not looser. Training data is another store, not a reason to skip the net.

## A Datadog ticket

A worker logged \`upstream 500, key=sk-live-...\` because the billing SDK put the key in the exception. The trace exporter shipped it. A security scanner in the vendor’s UI found it 40 minutes later. That is a leaked live key, not a “log hygiene” nit.

Contain: rotate the key, disable the exporter, patch the tool to return a code, add the \`sk-\` net **before** the scratchpad. Legal added the vendor to the subprocessor list that should have existed first. The postmortem golden was “tool error bodies matching \`sk-\` never appear in stored spans.” The model did not need the real key to debug. It needed \`UPSTREAM_500\`.

\`\`\`tryit python
import re

SECRET_RE = re.compile(r"sk-[A-Za-z0-9-]+")
BEARER_RE = re.compile(r"Bearer [A-Za-z0-9._-]+")

def redact(text):
    out = SECRET_RE.sub("[REDACTED_KEY]", text)
    out = BEARER_RE.sub("Bearer [REDACTED]", out)
    return out

raw = "upstream 500, key=sk-live-DEMO-not-real auth=Bearer abc.def"
print("RAW would leak")
print("SAFE", redact(raw))
print("prompt would see:", redact("use sk-live-DEMO-not-real please"))
\`\`\`

\`RAW would leak\` is a reminder: do not print the live string in real workers. \`SAFE\` should show \`[REDACTED_KEY]\` and \`Bearer [REDACTED]\`. The third line shows the same net on a prompt-injection style instruction. The exporter never sees the live key **if** this function runs first. The scan is a net, not a proof — a key with a weird prefix still needs structured errors and rotation.

## What goes wrong

Redact after export. Redact only \`sk-live\` and miss \`sk-test\` and \`Bearer\`. Store full HTTP responses as spans. Train a fine-tune on raw traces. Leave reveal-secret on the trace UI without audit logs. Ship prompt telemetry because the vendor checkbox was default-on.

Workers that dump \`os.environ\` into an observation “for debugging.” Computer-use screenshots of a password manager. Support pasting traces into a ticket system with looser access than the trace store.

Regex that is so greedy it destroys job ids and you cannot debug. Pair nets with **allow-listed fields**.

## How to test it

- Fixtures containing \`sk-\` and \`Bearer \` never appear in serialized spans after \`redact\`.
- A tool adapter test: SDK exception in, \`code\` out, no key.
- Exporter integration test with a fake sink: sink must not contain the fixture key.
- UI test: default view masked; reveal emits an audit row.
- Contract test: new span attributes go through an allow-list.

Assume the net misses. Practice rotation. Time it.

## How agents use this

Redact **before** the scratchpad if a tool error might contain a key. The model is another exporter — one that repeats what it saw. Rotate after any suspected leak. A leaked key in a trace vendor is still a leaked key.

Security reviews should read this pipeline, not only the system prompt’s manners. Ban dumping the environment into observations. Pin tool dependencies so a package named by the model cannot become a secret vacuum.

When legal asks “where do prompts live?”, you should have a diagram: job store, trace store, exporter, model provider. Each has retention. Each has a redaction stage. “In the cloud” is not an answer.

Run the nets in one function that tools, assembler, and the trace writer all call. Three copies of regex will drift. Add new patterns in one place. Assume they miss: rotation drills still happen quarterly. A net that has never caught a fixture in CI is not wired.

\`\`\`quiz
When should secret redaction run?
- After the vendor has indexed the trace, so search still works
- *Before any exporter, and before untrusted text is stored as a prompt observation
- Only in the yearly audit PDF
- Never — the model needs the real key to debug
explain: Traces are a PII store. Redact on the way in.
\`\`\`
`,
  },
  {
    slug: "metrics-that-page",
    title: "Metrics That Page a Human",
    summary:
      "Page on blast radius: forbidden tools, cost per minute, queue depth, HITL past SLA. Put noisy model timeouts on a dashboard with a circuit breaker.",
    minutes: 19,
    level: "intermediate",
    md: `
If you only plot “tokens used,” finance will find you before you find the bug. If you page on every model timeout, on-call will learn to ignore the pager — correctly. Metrics that matter for agents are **symptoms that need a human**, plus a few product health numbers you review without a siren.

This is operations, not eval theory. Golden-tag success in prod is sampled from real jobs and from CI; you treat it as a **rate you can chart**, not as a lecture on how to write goldens. Forbidden-tool count is a **page**. A slightly longer system prompt is not a metric.

A pager that never sleeps trains people to ignore it. A dashboard that never pages trains people to skip it. You want both, with a bright line.

## How the box actually works

Split signals into **page**, **ticket**, and **dashboard**.

| Signal | Destination | Why |
|---|---|---|
| Forbidden-tool count > 0 | Page | Safety / money moving wrong |
| Cost per minute over cap | Page | Finance event in progress |
| Queue depth high for N minutes | Page | Users stuck; workers dead or vendor down |
| HITL wait over SLA | Page | Humans are the product and they are late |
| Error rate on a tool family | Page or ticket | Depends on blast radius |
| LLM timeouts | Dashboard + breaker | Noisy; isolate the vendor |
| Tokens used | Dashboard | Needed, not a 2 a.m. reason |
| Golden-tag success (billing, safety) | Dashboard + CI | Drift; page only if you have a hard floor |
| Human-gate reject rate | Dashboard | Spike is drift, then a ticket |
| Time to first useful event | Dashboard | Product feel |

\`\`\`viz bars
title What pages a human
bar Forbid tools,1,1
bar Cost spike,1,1
bar LLM timeout,0.2,0
caption Page on blast radius. Noisy model timeouts belong on a dashboard with a breaker.
\`\`\`

Owners: runtime emits the counters (from the same spans as the last lesson). On-call owns the page/no-page line and reviews it after every incident. Product owns “time to first event.” Finance owns the cost cap number, not the query.

Exemplars: every page includes a \`job_id\`. Averages without exemplars are how you argue in the channel instead of opening a trace.

Do not page on every LLM timeout. Those belong on a dashboard **with a circuit breaker**. The breaker is the control. The dashboard is how you see it working. The page is for when the breaker is stuck open too long or when a forbidden tool slipped.

Write the page/no-page line in the same repo as \`should_page\`. Thresholds that live only in a SaaS UI will drift from staging. Review the function after every incident: demote pages that never change action, add pages that you learned about from a customer tweet.

## A pager-storm ticket

The first week of “production,” the team paged on \`llm_timeout > 0\`. A regional blip in the model vendor fired 200 pages. People muted the service. Two days later a refund tool leaked on a canary (forbidden-tool = 3). Nobody came. The mute had no expiry.

The fix was \`should_page\`: forbidden tools, cost, queue, HITL SLA. Timeouts alone returned \`timeouts_on_dashboard\`. They added a circuit breaker and a slower “vendor unhealthy for 15 minutes” ticket, not a page per job. The next refund leak paged. Someone actually answered.

\`\`\`tryit python
def should_page(snap):
    reasons = []
    if snap.get("forbidden_tool", 0) > 0:
        reasons.append("forbidden_tool")
    if snap.get("usd_per_min", 0) > snap.get("usd_cap_per_min", 1):
        reasons.append("cost")
    if snap.get("queue_depth", 0) > 200 and snap.get("queue_high_for_min", 0) >= 10:
        reasons.append("queue")
    if snap.get("hitl_wait_s", 0) > snap.get("hitl_sla_s", 600):
        reasons.append("hitl_sla")
    if snap.get("llm_timeouts", 0) > 0 and not reasons:
        return {"page": False, "why": "timeouts_on_dashboard"}
    return {"page": bool(reasons), "why": reasons}

print("storm", should_page({"forbidden_tool": 3, "usd_per_min": 0.2}))
print("timeout only", should_page({"llm_timeouts": 12}))
print("queue", should_page({"queue_depth": 500, "queue_high_for_min": 12}))
\`\`\`

\`storm\` pages because forbidden_tool is 3 (cost is under the default cap of 1 dollar per minute). \`timeout only\` does **not** page: twelve model timeouts go to the dashboard. \`queue\` pages because depth 500 lasted at least 10 minutes. A refund-tool leak wakes a human. A handful of model timeouts does not. That is the bright line in code.

## What goes wrong

Paging on symptoms you cannot act on at 2 a.m. (“vibe is off”). Paging on tokens during a launch you planned. Never paging on forbidden tools because “it might be a false positive” — then you have no signal. Thresholds copied from a web app (error rate 1%) that hide a single \`wire\` call.

Queue depth without a **duration** pages during a 30-second deploy. Require “high for N minutes.” Cost without a tenant split pages the whole company for one runaway customer — you will want per-tenant pause (later).

Dashboards with 40 charts and no saved “failed jobs” query. On-call opens Grafana, not the trace.

## How to test it

Unit-test \`should_page\` with the four cases in the tryit plus: cost over cap, HITL over SLA, timeouts **and** forbidden (must still page). Snapshot pager payloads: must include job ids / trace links.

Game day: fire a fake forbidden-tool metric in staging, time to human ack. If nobody knows which channel, the metric is decorative.

Review pages weekly. If a page never leads to action, demote it. If an incident had no page, add one.

## How agents use this

Keep a saved query: last 20 failed jobs with tool names and dollars. That query is more useful than a heatmap of tokens.

When you add a dangerous tool, add a forbidden-counter and a page **in the same PR**. When you add HITL, add the SLA clock. When you add a queue, add depth-over-time.

Circuit-break a vendor instead of paging each timeout. Caps and breakers are controls. Pages are for controls that failed or for blast radius that is already happening.

Write the page/no-page table in the runbook next to the kill switches. At 2 a.m. people will not invent a philosophy of alerting.

Mute with an expiry. A mute that lasts forever is how the next forbidden-tool leak is silent. If a launch will raise tokens, put that on the dashboard in advance rather than paging yourselves for a plan you already had. If a tenant is paused, page on “pause lasted more than SLA” so someone remembers to unpause.

\`\`\`quiz
Which signal should wake a human at 2 a.m.?
- Every model timeout
- *Forbidden-tool count above zero, or cost / queue / HITL past a cap you chose
- Token count going up during a product launch
- A slightly longer system prompt
explain: Page on blast radius. Dashboards hold the noisy rest.
\`\`\`
`,
  },
  {
    slug: "cost-latency",
    title: "Cost and Latency",
    summary:
      "Agent cost is steps times growing input tokens. Cap it, trim the scratchpad, route easy jobs small, and write SLOs that admit the loop is slower than a FAQ.",
    minutes: 21,
    level: "intermediate",
    md: `
Agent cost is **steps × (input tokens + output tokens) × price**, plus tools, plus retries. Input tokens dominate because you **resend the transcript**. Latency is serial model calls plus serial tools, unless you parallelize independent work. If you do not cap this, a single stuck job becomes a finance event.

Users feel **time to first token** and **time to first useful event** (a tool result or a status line). They do not feel your average model latency. Research jobs are not FAQs. Say so in the product. An SLO that pretends every agent turn is a 200 ms autocomplete will make you cheat with worse answers or unpaid heroes.

This lesson is how spend and wait actually form on the job. The next lesson turns those numbers into **stop conditions**. Routing between small and large models is an ops lever here — not a recap of how to train a router.

## How the box actually works

The default cost curve is **transcript growth**. Step 1 sends a short prompt. Step 12 sends step 1 plus eleven observations. Retries multiply both dollars and wall time. A 503 that you retry three times on a 20k prompt is a choice.

| Lever | What it does | Owner |
|---|---|---|
| Route easy tickets to a small model | Cuts price and often latency | ML platform + product |
| Short observations; blobs out of band | Stops 8k HTML dumps in the window | Tool authors |
| Summarize / slot the scratchpad | Caps tokens in per call | Runtime assembler |
| Fewer tools in the prompt | Schemas are tokens | Product |
| Do not loop when one call would do | Workflow vs agent | Product |
| Cache deterministic tool results (TTL) | Avoids repeat search | Runtime |
| Parallelize independent tools | Cuts wall time, not always dollars | Runtime |

\`\`\`viz plot
title Transcript growth
xlabel step
ylabel tokens in
xmin 1
xmax 8
fn growth 80*x 1 8
caption Each step resends the window. Cap it, or one stuck job is a finance event.
\`\`\`

Estimate **before** the loop using a crude planner (expected steps × typical tokens). Update after each span from real \`tokens_in\` / \`tokens_out\`. Show both on the job. Kill when you would exceed the cap (next lesson). Courtesy emails to finance are not a control.

Latency budget: admission (enqueue), queue wait, each complete, each tool, HITL. Chart them separately. “The model is slow” is often “we sat in queued for ten minutes.”

Owners: runtime owns estimates and assembler trim. Product owns “this job type is a research SLO, not a FAQ SLO.” Finance owns unit price tables. ML owns which model id a route may pick.

Interactive vs batch is a latency control you will encode as two queues later. Here, know the numbers: FAQs should show a first useful event in a few seconds (even if that event is “queued”). Research jobs should say “this can take minutes” in the UI so the SLO is honest. Mixing them on one worker is how a PDF swarm makes refund questions look like a model outage.

Retries belong in the estimate. A policy of three tries on a 20k prompt is a product choice with a price. Count them on the job as spend, not as free resilience.

## A stuck-job ticket

A single “summarize these 40 PDFs” job sat in a loop, stuffing each PDF into the scratchpad. Twelve long steps at ~4000 input tokens estimated well above a 0.02 dollar cap in the toy rates, and much worse in real rates. Nobody had a cap. The job finished six dollars later with a vague summary. Queue wait for everyone else climbed because the worker was busy.

The fix was not a sterner prompt. It was trim (keep recent events under a token budget), blobs by id instead of inline text, a small-model route for “extract title,” and a cap. The product copy changed too: “this can take a few minutes” instead of a FAQ-shaped spinner.

\`\`\`tryit python
PRICE_IN = 0.5 / 1000000
PRICE_OUT = 1.5 / 1000000

def estimate(steps, tokens_in_each, tokens_out_each):
    usd = steps * (tokens_in_each * PRICE_IN + tokens_out_each * PRICE_OUT)
    return round(usd, 6)

def assembler_trim(scratch, budget_tokens):
    kept = []
    used = 0
    for event in reversed(scratch):
        t = max(1, len(event) // 4)
        if used + t > budget_tokens:
            break
        kept.append(event)
        used += t
    kept.reverse()
    return kept, used

scratch = [
    "search refund policy " * 20,
    "obs: 5-7 days",
    "search exceptions " * 20,
    "obs: none",
]
trimmed, used = assembler_trim(scratch, 120)
print("full estimate 12 long steps", estimate(12, 4000, 200))
print("trimmed events", len(trimmed), "tokens~", used)
print("after trim 12 steps", estimate(12, used + 200, 80))
print("cap check", "FAIL" if estimate(12, 4000, 200) > 0.02 else "ok")
\`\`\`

The long transcript **fails** a 0.02 cap (\`cap check FAIL\`). Trimmed context keeps the newest events that fit ~120 tokens; \`trimmed events\` is smaller than 4. After trim, twelve steps cost less because each prompt is shorter. Retries would multiply both pictures. The lesson on the screen: **uncapped growth fails first**; trim is an ops control, not a style choice.

## What goes wrong

No estimate. Estimate once at the start and never update. Trim that drops the goal or the spec. Caching tool results forever so policy changes never appear. Routing every job to the frontier model “just in case.” Parallel tool calls that duplicate writes. SLOs copied from a JSON API.

A cheap model that fails billing goldens is not cheap. You pay in HITL and in refunds. Measure **cost per successful job**, not cost per call.

Verbose “reasoning” traces billed as output. Cap them. They are a product choice.

## How to test it

- \`estimate\` fixtures: known steps and tokens → known dollars.
- Trim: under budget; does not drop the latest observation if it fits; drops oldest first.
- Cap check: the 4000-token path fails 0.02; the trimmed path can pass.
- Span integration: after a job, summed \`usd_est\` matches the job’s running total within rounding.
- Latency: a test job records queue_ms vs llm_ms; a queue-only delay must not be blamed on the model in the summary.

Replay a production-shaped transcript with trim on/off and diff dollars.

## How agents use this

Put the estimate on the job **before** the loop, update it after each span, and **kill** the job when it crosses the cap. Show users time-to-first-event. Separate interactive vs batch queues so a PDF swarm does not steal FAQ latency (next part).

Route easy tickets to a small model in **config**, with a version stamp, not in a prompt that says “be cheap.” If billing goldens fail on the small model, do not silently stay there — that is the next lesson’s silent-downgrade bug.

When you add a tool, paste a realistic result size into the estimator and multiply by expected steps. If it cannot fit the cap, the tool must return less, or the job type must declare a higher cap on purpose.

Show cost on the staff admin for every job, even tiny ones. Habit beats a quarterly surprise. If product wants longer “reasoning” output, that is a flagged, versioned, capped choice — not a model default you forgot to turn off.

\`\`\`quiz
Why do agent loops cost more than a single chat completion?
- Python is billed per loop
- *Each step resends growing context, so input tokens scale with steps (and retries)
- Observations are free
- Stop conditions increase temperature
explain: Transcript growth is the default cost curve. Trimming, routing, and caps fight it.
\`\`\`
`,
  },
  {
    slug: "budget-caps",
    title: "Budgets Are Stop Conditions",
    summary:
      "max_steps, max_usd, max_wall_clock, max tokens in, plus a per-tenant monthly cap. When a cap hits, stop with a structured error — never a silent model downgrade.",
    minutes: 20,
    level: "intermediate",
    md: `
A budget that cannot stop the loop is a dashboard. Per job you need \`max_steps\`, \`max_usd\`, \`max_wall_clock\`, \`max_tokens_in\` per call (the assembler must obey), and a **per-tenant monthly cap**. When a cap hits, **stop with a structured error** and offer a human if the product needs it. Do not silently switch to a worse model without recording it — that is how quality falls and nobody knows why.

Swarms should compute \`n * child_cost\` and refuse if over cap. That check belongs here as a **hard** gate, not a comment in a prompt. Cancel in the UI must reach the worker. Otherwise users hammer cancel and you pay twice.

Caps are the difference between “we watch spend” and “we operate spend.” The previous lesson estimated dollars. This lesson **kills the job**.

## How the box actually works

Check caps at the **start of each slice**, after adding the **next** estimated cost, not only after the invoice arrives.

| Cap | Stops | Typical code |
|---|---|---|
| \`max_steps\` | Infinite ReAct-shaped loops | \`MAX_STEPS\` |
| \`max_usd\` | Transcript growth, retries, fat observations | \`MAX_USD\` |
| \`max_wall_s\` | Stuck tools, HITL forever if you forgot a wait cap | \`MAX_WALL\` |
| \`max_tokens_in\` | Assembler packing | Refuse the complete() |
| Tenant monthly | One customer eating the org bill | Pause tenant, \`TENANT_CAP\` |

\`\`\`viz flow
title A cap that can stop the loop
layout lr
node slice Next slice
node check Check caps
node stop Structured stop
edge slice check
edge check stop
caption Never silently downgrade the model. Stamp a fallback or halt.
\`\`\`

On trip: set job status to failed (or \`waiting_for_human\`), write a span, emit the metric that can page, **do not call** the next complete or write tool. Offer a human path if the ticket still matters.

Silent downgrade: some systems catch \`MAX_USD\` and retry with a smaller model without stamping versions. Billing goldens fail, HITL rises, dashboards still say “success.” Record route changes as version flags. If you allow an explicit fallback, it is a **new stamp**, a metric, and probably a canary — not an if-statement in the dark.

Owners: runtime enforces per-job caps. Finance + product set the numbers. Ops owns tenant pause. The assembler owner owns \`max_tokens_in\`. Nobody owns a comment in the prompt that says “be brief.”

Cancel is a cap with a human finger. It must be as hard as \`MAX_USD\`.

Check order is part of the spec. Typical: cancel flag, then steps, then dollars (including next-step estimate), then wall, then tokens-in. Document it so two workers do not disagree. Persist counters on the **job row**. A worker-local \`steps = 0\` on every retry is how caps never trip and finance still calls.

Swarms: the parent refuses to start child N+1 when \`n * child_cost\` would exceed the remaining budget. “Each child is small” is how you buy a thousand small fires.

## A silent-downgrade ticket

Jobs started hitting a dollar cap during a launch. A helper caught the error and “helpfully” switched \`fake-large\` to \`fake-small\` so the loop could finish. Success rate on the dashboard stayed green. Refund answers drifted. HITL reject rate climbed. Nobody connected the dots until a versions chart showed \`model\` changing mid-job with no flag.

The fix: \`tick\` returns \`MAX_USD\` and stops. A separate, reviewed fallback route exists as a **named flag** with its own eval gate. Launch traffic that exceeded cap went to humans for a day. That was cheaper than wrong refunds at scale.

\`\`\`tryit python
CAPS = {"max_steps": 8, "max_usd": 0.05, "max_wall_s": 120}

def tick(job, step_usd, wall_s):
    job["steps"] = job.get("steps", 0) + 1
    job["usd"] = round(job.get("usd", 0) + step_usd, 6)
    job["wall_s"] = wall_s
    if job["steps"] > CAPS["max_steps"]:
        return {"ok": False, "code": "MAX_STEPS", "job": job}
    if job["usd"] > CAPS["max_usd"]:
        return {"ok": False, "code": "MAX_USD", "job": job}
    if job["wall_s"] > CAPS["max_wall_s"]:
        return {"ok": False, "code": "MAX_WALL", "job": job}
    return {"ok": True, "job": job}

job = {}
print("ok", tick(job, 0.01, 10)["ok"])
print("usd", tick(job, 0.05, 20))
print("killed at cap, not silently routed")
\`\`\`

The first \`tick\` is ok (0.01 is under 0.05). The second adds 0.05, running total 0.06, and returns \`ok: False\` with \`code: MAX_USD\`. The job object still has steps, usd, and wall_s for the trace. Nothing in \`tick\` changes the model id. The job stops. That is the whole control.

## What goes wrong

Caps only in the prompt. Caps checked after the full vendor invoice. Caps that skip write tools “so we can finish.” Tenant without a monthly cap. Swarms that spawn 200 children, each “inside” the per-job cap. Retry storms that reset \`steps\` on each queue attempt — retries must count.

Wall clock that includes HITL wait and fails jobs while a human sleeps. Separate \`max_wall_s\` for machine time vs \`hitl_sla_s\` (you already page on the latter).

## How to test it

- Unit: under cap ok; each cap trips with the right code; order of checks is documented.
- No silent route: after \`MAX_USD\`, model id on the job is unchanged.
- Queue retries increment a persistent \`steps\` / \`usd\` on the job row, not a worker-local counter.
- Tenant cap: the Nth job in a month is refused with \`TENANT_CAP\`.
- Cancel: a flagged job’s next \`tick\` does not add spend.

Game day: run a looping fixture in staging and time until \`MAX_STEPS\`. If it never trips, the cap is not wired.

## How agents use this

Review **cost per successful job** weekly by tenant. A test tenant that loops can look like product-market fit on the invoice. Caps per tenant exist for this. Circuit-break a vendor instead of 3× retrying a huge context.

Surface \`MAX_USD\` to the user as a structured message (“stopped to protect spend; ask a human”) plus the support code. Do not return a truncated hallucination that looks like an answer.

When you add multi-agent children, the parent’s cap must include \`n * child\`. If that math is annoying, you are not ready for swarms in prod.

Tenant monthly caps are how a load test in a forgotten project does not look like product-market fit. Reset them on a calendar you document. Alert when a tenant hits 80% so pause is a decision, not a surprise at 100%.

> **Warning:** A cap you have never tripped in staging is decorative. Force a trip on game day.

\`\`\`quiz
The job hits max_usd mid-loop. What should happen?
- Switch to a cheaper model and keep going, quietly
- *Stop with a structured error, record it on the job, offer a human if the product needs it
- Delete the trace so finance is not scared
- Raise temperature to finish faster
explain: Caps are stop conditions. Silent downgrades hide quality loss.
\`\`\`
`,
  },
];
