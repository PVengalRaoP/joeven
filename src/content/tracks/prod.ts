import type { TrackSource } from "@/lib/types";

export const prod: TrackSource = {
  slug: "prod",
  title: "Production Agents",
  short: "Production",
  tagline: "Architecture, tracing, cost, queues, secrets, deploy, CI evals, incidents.",
  color: "#334155",
  order: 13,
  lessons: [
    {
      slug: "architecture",
      title: "Production Architecture",
      summary:
        "Gateway, workers, tool services, stores, and queues. The model is one box in a diagram you can operate.",
      minutes: 18,
      level: "advanced",
      md: `
A production agent is a **distributed system** that happens to call a model. If your architecture is “FastAPI function that loops until done,” you will learn about timeouts from your users.

A boring, operable shape:

1. **Gateway** — authn/authz, rate limits, request validation, returns a \`job_id\` (do not hold the client for a 40-step loop)
2. **Queue + workers** — pull jobs, run a **bounded slice** of the agent loop, checkpoint
3. **Model provider** — isolated, with timeouts, fallbacks, and a circuit breaker
4. **Tool services** — each tool family is an HTTP/RPC API with its own authz, not random imports inside the worker
5. **Stores** — job state, traces, blobs (scrapes, screenshots), memory/index
6. **Control plane** — HITL UI, kill switches, prompt/template versions

## Why jobs, not requests

LLM loops are long, bursty, and retry-heavy. HTTP request lifetimes are not. The gateway should **enqueue** and stream or poll events. This matches the long-running lesson: wakeups, approvals, vendor callbacks.

## Isolation

Workers should not hold cloud admin keys “just in case.” Tool services should enforce **tenant id** on every call. The model host should not be able to reach the database except through tools. That is **confused-deputy** prevention: the LLM is an untrusted client.

## Version everything the policy needs

A run is not reproducible unless you record:

- Prompt template version
- Tool schema version
- Model id
- Router/config flags
- Code git SHA of the worker

“What prompt was in prod on Tuesday?” is an incident question. If the answer is “whatever was in the YAML on the box,” you will guess.

## Start narrower than the blog post

You do not need Kubernetes on day one. You do need: a queue, a job table, a trace table, and a way to stop the agent. Serverless functions that time out at 15 minutes are a hidden architecture choice — usually the wrong one for long jobs.

\`\`\`tryit python
def handle_user(message, user, jobs, queue):
    job = {
        "id": "job_" + str(len(jobs) + 1),
        "user": user,
        "goal": message,
        "status": "queued",
        "versions": {"worker": "sha-abc", "prompt": "p12", "model": "fake-small"},
    }
    jobs[job["id"]] = job
    queue.append(job["id"])
    return {"job_id": job["id"]}

def worker_once(job_id, jobs, tools):
    job = jobs[job_id]
    job["status"] = "running"
    # Bounded slice: one tool, then checkpoint.
    obs = tools["search_kb"](job["goal"])
    job["checkpoint"] = {"obs": obs}
    job["status"] = "succeeded"
    job["final"] = obs["text"]
    return job

jobs, queue = {}, []
ack = handle_user("How long are refunds?", "u1", jobs, queue)
print("GATEWAY", ack)
print("QUEUE", queue)
print("WORKER", worker_once(queue.pop(0), jobs, {"search_kb": lambda q: {"text": "5-7 days"}}))
print("pieces: gateway, queue, worker, tools, job store")
\`\`\`

Draw this diagram for your team and **name the owners**. Agents without owners become everyone’s weekend.

## Local, staging, and the smallest prod-shaped stack

Even on a laptop you can fake the boxes: a JSON file as the job store, a list as the queue, functions as tool services. The point is the **boundaries**, not Kubernetes. Staging should share the same boundaries with real (scoped) keys and a second tenant so isolation bugs show up before launch.

Avoid a **god worker** that imports the billing database, the LLM SDK, and the email sender. That process will have the union of all privileges. Split tool services even if they are small FastAPI apps. The model talks to them as a client; the gateway attaches tenant identity.

When you add a second region, jobs must not assume in-memory state. If that sentence surprises you, you are not production-shaped yet — you are a demo with a domain name.

> **Tip:** If a box can spend money (model, refund tool, SMS), it needs a budget monitor, not only an SLA.

\`\`\`quiz
Why should the HTTP gateway usually enqueue a job instead of running the full agent loop?
- Queues are fashionable
- *Loops wait on tools, humans, and retries; request timeouts and deploys will kill in-process state
- Models cannot be called from workers
- Gateways cannot authenticate users
explain: Long-running, restartable work belongs on a queue with checkpoints.
\`\`\`
`,
    },
    {
      slug: "tracing-observability",
      title: "Tracing and Observability",
      summary:
        "Spans for LLM calls and tools, redaction, and dashboards that answer ‘why did job_17 spend $4?’",
      minutes: 16,
      level: "advanced",
      md: `
Observability for agents is **traces first**, metrics second, logs third. A counter that says “500 errors up” does not tell you which tool, which tenant, which prompt version.

Use **OpenTelemetry-style spans** (even if you start with a JSON table):

- Parent: \`job.run\`
- Children: \`llm.complete\`, \`tool.get_invoice\`, \`parse\`, \`hitl.wait\`

Attributes: \`tenant\`, \`job_id\`, \`state\`, \`model\`, \`tool_name\`, \`template_version\`, \`tokens_in\`, \`tokens_out\`, \`usd_est\`.

## What a human looks at at 2 a.m.

1. Trace timeline — where the time went (model vs tool vs queue wait)
2. The **parsed** tool calls, not only raw tokens
3. Whether HITL was skipped
4. Cost so far vs cap

Pretty token streams are for demos. Operators need **tables**.

## Redaction

Traces are a **new PII store**. Redact secrets, cookies, health data, and raw card numbers **before** export to the vendor SaaS. Hash user ids if your threat model requires it. Retention: 30 days may be plenty; “keep forever for training” is how you get a second incident.

## Metrics that matter

- Success rate on golden tags (billing, safety) — from CI and from sampled prod
- Forbidden-tool count (should be ~0)
- p95 latency **to first useful event** and to job completion
- Cost per successful job, cost per tenant
- HITL reject rate (spike = policy or model drift)
- Queue depth and worker saturation

If you only plot “tokens used,” finance will find you before you find the bug.

\`\`\`tryit python
import json

spans = []

def span(name, parent, attrs, dur_ms):
    rec = {"name": name, "parent": parent, "dur_ms": dur_ms, **attrs}
    spans.append(rec)
    return rec

span("job.run", None, {"job_id": "job_17", "tenant": "acme"}, 0)
span("llm.complete", "job.run", {"model": "fake-small", "tokens_in": 900, "tokens_out": 40, "usd_est": 0.002}, 420)
span("tool.search_kb", "job.run", {"ok": True, "usd_est": 0.0}, 80)
span("llm.complete", "job.run", {"model": "fake-small", "tokens_in": 1200, "tokens_out": 60, "usd_est": 0.003}, 510)

def summarize(spans):
    llm = [s for s in spans if s["name"] == "llm.complete"]
    tools = [s for s in spans if s["name"].startswith("tool.")]
    return {
        "llm_ms": sum(s["dur_ms"] for s in llm),
        "tool_ms": sum(s["dur_ms"] for s in tools),
        "usd": round(sum(s.get("usd_est", 0) for s in spans), 6),
        "llm_calls": len(llm),
    }

print(json.dumps(spans, indent=2))
print("SUMMARY", summarize(spans))
\`\`\`

Wire \`trace_id\` into user-facing error pages (“support code job_17”). Otherwise you will paste Slack screenshots into grep.

## Alerting without a pager that never sleeps

Alert on **symptoms that need a human**: forbidden-tool > 0, cost per minute over a cap, queue depth for N minutes, HITL wait over SLA, error rate on a tool family. Do not page on every LLM timeout; those belong on a dashboard with a circuit breaker.

Exemplars beat averages: attach a **trace link** to the alert. “p95 is high” without a job id is a riddle. Keep a saved query: last 20 failed jobs with tool names and usd_est.

If you export traces to a vendor, treat that as a **subprocessor**. Legal and security should know. Engineers should know what is redacted. Observability that creates a second copy of PII is an incident looking for a calendar date.

> **Note:** Logging full prompts to a third party may be a **contract** violation. Read the DPA before you enable “prompt telemetry.”

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
      slug: "cost-latency",
      title: "Cost and Latency",
      summary:
        "Tokens scale with steps. Budget caps, small-model routing, truncation, and SLOs that admit the loop is slow.",
      minutes: 16,
      level: "advanced",
      md: `
Agent cost is **steps × (input tokens + output tokens) × price**, plus tools, plus retries. Input tokens dominate because you **resend the transcript**. Latency is **serial model calls + serial tools**, unless you parallelize independent work.

If you do not cap this, a single stuck job becomes a finance event.

## Budgets

Per job:

- \`max_steps\`, \`max_usd\`, \`max_wall_clock\`
- \`max_tokens_in\` per call (assembler must obey)
- Per-tenant monthly cap

When a cap hits, **stop with a structured error** and offer HITL. Do not silently switch to a worse model without recording it — that is how quality falls and nobody knows why.

## Make the loop cheaper

- **Route** easy tickets to a small model; hard ones to a large model
- **Short observations**; store blobs out of band
- **Summarize** the scratchpad; keep slots structured
- **Fewer tools** in the prompt (schemas are tokens)
- **Don’t ReAct** when a workflow is one call
- Cache deterministic tool results (with TTL)

## Latency SLOs

Users feel **time-to-first-token** and **time-to-first-tool-result**. A 90-second silent spinner is a product bug even if the answer is perfect. Stream **state**: “searching KB…”, “waiting for approval…”.

p95 job completion for open-ended research may be minutes. **Say so** in the product. Do not market it as a chatbot.

## Estimate before you fan out

Swarms should compute \`n * child_cost\` and refuse if over cap (you wrote this in multi-agent). The same function belongs in prod as a **hard check**.

\`\`\`tryit python
PRICE_IN = 0.5 / 1_000_000   # fake $ per token
PRICE_OUT = 1.5 / 1_000_000

def estimate(steps, tokens_in_each, tokens_out_each):
    usd = steps * (tokens_in_each * PRICE_IN + tokens_out_each * PRICE_OUT)
    return round(usd, 6)

def assembler_trim(scratch, budget_tokens):
    # Toy: 4 chars ~ 1 token.
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
trimmed, used = assembler_trim(scratch, budget_tokens=40)
print("full estimate 12 long steps", estimate(12, 4000, 200))
print("trimmed events", len(trimmed), "tokens~", used)
print("after trim 12 steps", estimate(12, used + 200, 80))
print("cap check", "FAIL" if estimate(12, 4000, 200) > 0.05 else "ok")
\`\`\`

Put the estimate on the job record **before** the loop, update it **after** each span, and **kill** the job when it crosses the cap. Courtesy emails to finance are not a control.

## Product promises and model routing

Marketing will want “instant.” You should publish **two** numbers: time to first event, and median completion by ticket class. Research jobs are not FAQs. If you hide that, users will hammer cancel, which **increases** cost if cancel is not wired to the queue.

Routing tables belong in config: \`faq → small\`, \`billing_write → large + HITL\`. Measure quality **per route**. A cheap model that fails billing goldens is not cheap. It is a refund generator with extra steps.

Review **cost per successful job** weekly by tenant. A single integration test tenant that loops can look like product-market fit in the billing dashboard. Caps per tenant exist for this.

> **Warning:** Retries multiply cost. A 3× retry on a large-context call is a 3× bill. Circuit-break the vendor.

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
      slug: "queues-retries",
      title: "Queues and Retries",
      summary:
        "At-least-once delivery, idempotency keys, dead letters, and backoff that does not stampede your tools.",
      minutes: 16,
      level: "advanced",
      md: `
Workers crash. Deploys happen. Vendors 503. A production agent runner is a **queue consumer** with **at-least-once** delivery: the same job slice may run twice. If that slice calls \`refund\`, you will double-pay unless you designed for it.

## Delivery semantics

Assume **at-least-once**. Exactly-once is a myth at the edges. Therefore:

- Every write tool takes an **idempotency key** (\`job_id + step_id + tool\`)
- Checkpoints commit **after** the tool succeeds, or use an outbox
- Handlers are safe to replay

## Visibility timeout

If a worker dies mid-slice, the message should reappear. Set the timeout **longer than the slice**, shorter than “forever.” Heartbeat if a tool is slow.

## Retry classes

| Failure | Queue action |
|---|---|
| Transient tool 503 | Retry slice with backoff + jitter |
| Parse error | Retry LLM once, then fail job |
| 4xx semantic | Do not retry; fail or HITL |
| Repeated timeout on one tenant | Isolate / fair-queue so others live |

**Dead-letter** jobs that exceed max attempts. A human (or a script) inspects them. Infinite retry is an outage you paid for.

## Fairness and isolation

One customer with a 10,000-PDF swarm should not starve everyone. Use **per-tenant** concurrency limits. Separate queues for interactive vs batch.

## Poison messages

A payload that always crashes the worker (bad UTF-8, 50 MB JSON) must go to DLQ **without** taking the whole fleet down. Validate at enqueue time in the gateway.

\`\`\`tryit python
import random
random.seed(2)

def backoff(attempt, base=0.1, cap=2.0):
    raw = min(cap, base * (2 ** attempt))
    jitter = raw * (0.5 + random.random() / 2)
    return round(jitter, 3)

def run_with_queue(max_attempts=4):
    ledger = {}
    attempts = []
    for attempt in range(max_attempts):
        key = "job_17:step_3:refund"
        # simulate: first two attempts crash after the write
        if key not in ledger:
            ledger[key] = {"cents": 1999}
            wrote = True
        else:
            wrote = False
        crash = attempt < 2
        attempts.append({"attempt": attempt, "new_write": wrote, "backoff": backoff(attempt), "crash": crash})
        if not crash:
            return {"ok": True, "ledger": ledger, "attempts": attempts}
    return {"ok": False, "dlq": True, "attempts": attempts}

out = run_with_queue()
print("attempts:")
for a in out["attempts"]:
    print(" ", a)
print("final ledger", out.get("ledger"), "ok", out["ok"])
print("idempotency kept a single refund despite retries")
\`\`\`

If your tool vendor already supports idempotency keys (many payment APIs do), **pass them through**. Do not invent a second ledger unless you must.

## Poison, fairness, and backpressure

Validate payloads at the **gateway**: max bytes, schema, tenant present. A 50 MB “observation” in the queue will kill workers in a loop. Those messages go to DLQ with a reason, not to retry-until-poverty.

Apply **backpressure** when the model vendor is 503: slow enqueue, do not spawn more workers that will fail the same way. Fair-queue so a batch swarm cannot starve interactive tickets. Interactive vs batch is an SLO choice; encode it as two queues, not as hope.

Document **replay instructions** for the on-call: which keys are safe to retry, which ledgers to check, how to re-drive a DLQ item after a fix. Queues without a runbook are a bag of delayed incidents.

> **Tip:** Log \`attempt\`, \`job_id\`, and \`idempotency_key\` on every tool span. Future-you will thank present-you.

\`\`\`quiz
A worker retries a slice that already refunded the customer. What prevents a second payout?
- Hoping the model remembers
- *An idempotency key so the write tool is a no-op the second time
- Deleting the queue
- Raising temperature
explain: At-least-once queues require idempotent writes. Keys are the control.
\`\`\`
`,
    },
    {
      slug: "secrets-security",
      title: "Secrets and Security",
      summary:
        "Secret managers, never-in-prompts, tenant isolation, and treating the model as an untrusted client of your APIs.",
      minutes: 18,
      level: "advanced",
      md: `
Agents are **secret amplifiers**. They log more, they retrieve more, they send more text to a third-party model API. Your threat model is not only “hacker on the laptop.” It is also: prompt injection, a curious employee in the trace UI, a vendor breach, and a model that **echoes** an API key it saw in a tool dump.

## Where secrets live

- **Secret manager** or environment of the **tool service**, not the prompt, not the repo, not the trace
- Short-lived credentials where possible
- Separate keys per environment (dev/stage/prod) with **hard spend limits** on experimental keys

If a tool result might contain a key (config files, error pages), **redact before** it enters the scratchpad.

## The model is untrusted

Do not give the worker a cloud admin role. Give **each tool** a scoped role: \`get_invoice\` can read invoices for \`tenant_id\` from the **signed job**, not from model-supplied tenant strings. The model may suggest \`tenant_id=other\`; the tool **ignores** it and uses the gateway’s auth context.

This is the same rule as confused deputy in web apps. The LLM is a client that **lies**.

## Prompt and trace leakage

Never paste secrets into Joeven, tickets, or screenshots. Never dump \`os.environ\` into an observation. Scan traces for \`sk-\` / \`Bearer \` patterns (imperfect, still worth it).

## Supply chain

Pin tool dependencies. An agent that \`pip install\`s a package named by the model is a remote-code-execution product. Computer-use on an unsandboxed desktop is the same class of bug.

## Tenancy

Row-level tests: user A’s agent cannot retrieve user B’s memory notes. Include this in CI goldens. A shared vector index without tenant filters is a **data breach waiting for a query**.

\`\`\`tryit python
import os
import re

os.environ["STRIPE_KEY"] = "sk-live-DEMO-not-real"

SECRET_RE = re.compile(r"sk-[A-Za-z0-9\\-]+")

def redact(text: str) -> str:
    return SECRET_RE.sub("[REDACTED_KEY]", text)

def get_invoice(auth_tenant, args):
    requested = args.get("tenant")  # model-supplied — untrusted
    if requested and requested != auth_tenant:
        return {"ok": False, "code": "PERMISSION_DENIED"}
    tenant = auth_tenant
    raw_error = "upstream 500, key=" + os.environ["STRIPE_KEY"]
    return {"ok": True, "tenant": tenant, "note": redact(raw_error)}

print(get_invoice("acme", {"tenant": "acme", "id": 1}))
print(get_invoice("acme", {"tenant": "other", "id": 1}))
print("prompt would see:", redact("use sk-live-DEMO-not-real please"))
\`\`\`

Security reviews for agents should read **tool authz and redaction**, not only the system prompt’s manners.

## Key rotation, employees, and the trace UI

Rotate keys on a schedule and after any suspected prompt or trace leak. The runbook is: revoke, deploy new env, invalidate in-flight jobs that might have seen the old key in an error string. Practice it.

The **trace UI** is a privileged app. Not every employee should replay other tenants’ tickets. SSO groups, audit logs on “view trace,” and redaction in the UI as well as in export. Curious internal reads are a threat model, not a personality flaw.

Ban \`eval\` of model-generated code on boxes with secrets. Ban computer-use on engineer laptops “to debug.” Sandboxes exist so production keys and production desktops are not the same place as a pixel agent.

> **Warning:** A leaked key in a trace vendor is still a leaked key. Rotate, then fix the redaction path.

\`\`\`quiz
The model asks \`get_invoice\` with another tenant’s id. What should the tool use?
- The model’s tenant argument, to be helpful
- *The authenticated job/user tenant from the gateway; deny mismatches
- A random tenant
- The system prompt’s company name
explain: Authorization context comes from the signed request, not from untrusted model JSON.
\`\`\`
`,
    },
    {
      slug: "deploy",
      title: "Deploy",
      summary:
        "Health checks, versioned workers, canaries, and kill switches. Shipping a prompt is still a deploy.",
      minutes: 16,
      level: "advanced",
      md: `
Deploying an agent is deploying **code + policy**. A prompt change can be as breaking as a schema change. Treat template edits like releases: version, review, rollback.

## What ships together

- Worker image (git SHA)
- Prompt/template bundle (version \`p12\`)
- Tool schema bundle (if clients cache tools, this is a contract)
- Config flags (which model, whether computer-use is on)

Mismatch is an incident: worker \`sha-abc\` with prompts \`p9\` you never tested.

## Health and readiness

Readiness: can the worker reach the queue, the model (or a stub), and the job store? Liveness: not stuck in a dead lock. Do **not** make readiness require a paid LLM call on every probe — that is a bill and a flaky kube restart loop. Probe a cheap \`/healthz\` that checks connections.

## Canaries

Send 5% of jobs (or one tenant that volunteered) to the new worker. Watch: golden-tag success, forbidden-tool count, cost, HITL rejects, latency. Promote or roll back.

**Feature flags** for dangerous tools: computer-use off by default in a new region.

## Kill switches

A global flag: \`agents.disabled=true\` returns a fallback workflow or “human will take it.” Per-tool switches: \`tools.refund=false\`. Per-tenant: disable a runaway customer without a full outage.

Practice flipping them. A kill switch nobody has ever used is decorative.

## Migrations

Job state schemas change. Write **forward-compatible** checkpoints (\`schema_v\`). Old workers should not crash on new fields; new workers should read old jobs or drain them first.

\`\`\`tryit python
FLAGS = {
    "agents.disabled": False,
    "tools.refund": True,
    "canary_percent": 5,
    "canary_sha": "sha-new",
    "stable_sha": "sha-old",
}

def pick_sha(job_id, flags):
    n = sum(ord(c) for c in job_id) % 100
    if flags["agents.disabled"]:
        return None
    if n < flags["canary_percent"]:
        return flags["canary_sha"]
    return flags["stable_sha"]

def can_call(tool, flags):
    if flags["agents.disabled"]:
        return False
    if tool == "refund":
        return flags["tools.refund"]
    return True

print("job_17 ->", pick_sha("job_17", FLAGS))
print("refund allowed", can_call("refund", FLAGS))
FLAGS["tools.refund"] = False
print("kill refund", can_call("refund", FLAGS))
FLAGS["agents.disabled"] = True
print("kill all", pick_sha("job_17", FLAGS), can_call("search_kb", FLAGS))
\`\`\`

Prompt diffs belong in pull requests with **eval results attached**. “I tweaked the vibe in prod” is not a deploy strategy.

## Drain, freeze, and config as code

Before a breaking worker deploy, **drain**: stop new jobs on old SHA, let in-flight slices checkpoint, then switch. Frozen flags (\`tools.refund=false\`) should themselves be versioned so you know who flipped them.

Config as code: model id, template version, canary percent live in git (or a config service with history). A dashboard click nobody can diff is how prod drifts from staging.

Health checks must not **spend**. A probe that calls the frontier model every 10 seconds is a cost bug and a rate-limit bug. Probe the queue and disk; synthetic LLM checks belong on a slower cron with a stub fallback. Write the rollback command in the PR template so nobody invents one during a canary scare.

> **Tip:** Keep the previous template bundle on disk/object storage. Rollback is a flag flip, not an archaeology project.

\`\`\`quiz
A prompt edit should be treated as:
- A harmless chat with the model
- *A versioned release that canaries and can roll back
- Something only designers sign off on
- An emergency kubectl edit on Friday
explain: Policy changes behavior as much as code. Version it, measure it, revert it.
\`\`\`
`,
    },
    {
      slug: "evals-in-ci",
      title: "Evals in CI",
      summary:
        "Golden gates on every worker/prompt change. Fast unit tests, slower agent suites, and what must block merge.",
      minutes: 16,
      level: "advanced",
      md: `
If evals are a notebook someone runs after a scare, they are not evals. They are folklore. **CI is the enforcement point**: a prompt or worker change that fails the gate does not merge.

## Layers (fast to slow)

1. **Unit tests for tools and parsers** — every PR, seconds
2. **Golden agent suite with fake models/tools** — every PR, a minute or two
3. **LLM-backed goldens** — nightly or on \`prompt/**\` changes, with a spend cap
4. **Canary in prod** — after merge, not instead of CI

PRs that cannot run (1) and (2) without network are too coupled to vendors. Fake the model in CI like Joeven lessons do.

## What blocks merge

Must-fail the build:

- Any **forbidden tool** on the safety set
- Authz regressions in tool tests
- Parser cannot round-trip the schema
- Success rate on a **critical** tag (e.g. billing facts) drops below a threshold you chose

Should not block on:

- Flaky live-web search
- Exact-string prose diffs
- Judge-only scores with no human calibration

## Determinism

Seed fake models. Freeze fixtures. Record **prompt version** in the test report. If CI is non-deterministic, people will ignore it — correctly.

## Cost of LLM CI

If you do call a real model, **budget** the job, cache completions keyed by \`hash(prompt, fixtures, model)\`, and do not run it on every typo in the README. Separate workflows.

\`\`\`tryit python
GOLD = [
    {"id": "c1", "tag": "safety", "forbid": ["wire"]},
    {"id": "c2", "tag": "billing", "must_contain": "5-7"},
]

def candidate_agent(item):
    if item["id"] == "c1":
        return {"tools": ["finish"], "final": "I can't wire money."}
    return {"tools": ["search_kb"], "final": "Refunds take 5-7 days."}

def gate(items, run, min_billing=1.0):
    fails = []
    billing_ok = 0
    billing_n = 0
    for it in items:
        out = run(it)
        if any(t in out["tools"] for t in it.get("forbid", [])):
            fails.append(it["id"] + " forbidden")
        if it["tag"] == "billing":
            billing_n += 1
            if it.get("must_contain") in out["final"]:
                billing_ok += 1
    rate = billing_ok / billing_n if billing_n else 1.0
    if rate < min_billing:
        fails.append("billing rate " + str(rate))
    return {"pass": not fails, "fails": fails, "billing_rate": rate}

print("CI", gate(GOLD, candidate_agent))

def broken(item):
    if item["id"] == "c1":
        return {"tools": ["wire"], "final": "ok"}
    return {"tools": [], "final": "soon"}

print("CI broken", gate(GOLD, broken))
\`\`\`

Attach the gate report to the PR. Reviewers should see **which id failed**, not a red X with a 4,000-line log of tokens.

## Flakes, caches, and the nightlies

If a golden is flaky, **quarantine** it with an owner and a ticket — do not retry until green. Retry-until-green is how you ship noise.

Cache LLM completions in nightlies by hash of (template, fixtures, model). When the template changes, the cache misses on purpose. When the README changes, it should not.

Promote nightlies that are stable into the PR gate **without** the live model: distill into a fake-model script or a property check. The PR gate stays deterministic. The nightly hunts surprises. Both reports go to the same dashboard so product can see trend lines, not only merge blockers. A gate nobody trusts is worse than a slow suite that people actually watch.

> **Warning:** Skipping the gate “just this once” is how safety cases rot. If the golden is wrong, **change the golden in the same PR**.

\`\`\`quiz
Which tests should run on every pull request without needing a paid model API?
- Only LLM-as-judge on 10,000 live tickets
- *Tool/parser unit tests and golden agent cases with fake models and fixtures
- Manual clicking in prod
- A tweet to the vendor
explain: Fast, deterministic gates belong in PR CI. Paid model evals are extra, capped, and less frequent.
\`\`\`
`,
    },
    {
      slug: "incident-playbooks",
      title: "Incident Playbooks",
      summary:
        "Kill switches, rollback, tenant isolation, and a write-up that ends in a golden test. Agents fail as distributed systems.",
      minutes: 18,
      level: "advanced",
      md: `
An **incident** is when the agent did something you promised it would not — or stopped doing something you promised it would — at a scale that matters: wrong refunds, data mixed across tenants, a cost spike, a loop that emailed 2,000 customers.

You need a **playbook** before that afternoon. Writing it during the event produces heroics, not control.

## Minute 0–5: contain

1. Flip the **kill switch** or the specific tool flag (\`refund=off\`)
2. Pause the **queue** (or the tenant’s queue) if jobs are still applying
3. Page the owner; open a shared incident doc with **trace ids**

Do not start by tweaking the prompt in prod. Contain first.

## Minute 5–20: see

- Pull traces for the blast radius (\`tenant\`, \`tool=refund\`, time window)
- Distinguish **policy bug** (wrong prompt/state) vs **tool bug** (authz miss) vs **vendor outage** vs **injection**
- Check whether HITL was bypassed

## Minute 20+: mitigate

- Rollback worker SHA / prompt bundle
- Rotate keys if traces or prompts may have leaked secrets
- Replay **read-only** to confirm the fix on recorded observations
- Customer comms with facts, not vibes

## After: the only acceptable souvenir

Every incident ends with **at least one golden test** (and maybe a tool unit test) that would have failed **before** the deploy. If you cannot write that test, you do not understand the incident yet.

Also update: dashboards, alerts (alert on forbidden-tool > 0), runbooks, and the spec if the spec was wrong.

## Common agent incidents

| Pattern | First lever |
|---|---|
| Cost explosion | job cap + kill new jobs |
| Refund storm | \`tools.refund=false\` + ledger audit |
| Cross-tenant read | disable retrieval, then patch authz |
| Ping-pong multi-agent | hop cap, disable handoff |
| Injection via PDF | disable that tool family, strip observations |

Practice on a **game day**: inject a fake storm in staging and time how long until the flag flips.

\`\`\`tryit python
inc = {
    "id": "inc-42",
    "symptom": "refund storm",
    "flags": {"tools.refund": True, "queue.paused": False},
    "ledger": [{"job": "job_9", "cents": 400}, {"job": "job_10", "cents": 400}],
}

def contain(inc):
    inc["flags"]["tools.refund"] = False
    inc["flags"]["queue.paused"] = True
    return inc["flags"]

def blast_radius(ledger, cents_threshold=100):
    return [r for r in ledger if r["cents"] >= cents_threshold]

def postmortem_test_would_fail(trace_tools):
    return "refund" in trace_tools and "hitl_approved" not in trace_tools

print("contain", contain(inc))
print("radius", blast_radius(inc["ledger"]))
print("new golden needed?", postmortem_test_would_fail(["refund", "finish"]))
print("playbook: contain, trace, rollback, write a golden")
\`\`\`

The teams that survive agent production are not the ones with the longest system prompts. They are the ones who can **stop the loop**, **see the trace**, and **prevent the encore**.

## Comms, customers, and game days

Have a **status sentence** ready: what is off, who is safe, when the next update is. Do not blame “the AI.” Blame a tool flag, a prompt version, or a vendor — specifically. Customers can hear “refunds paused; tickets queued.” They cannot hear “the model was confused.”

After the golden is merged, run a **game day** that replays the incident fixture in staging with the old SHA (should fail) and the new SHA (should pass). If you cannot reproduce, you do not have a fix. You have a story.

Keep a list of **kill-switch owners** and a 24/7 path to flip them. A playbook in a wiki nobody can edit at night is not a playbook. The architecture, traces, queues, and evals lessons all exist so this page is boring. Boring incidents are the goal.

> **Warning:** Do not delete traces during an incident to “save face.” You will need them for customers, auditors, and the golden you are about to write.

\`\`\`quiz
What is the first move in a refund storm?
- Rewrite the persona to be more careful
- *Disable the refund tool / pause the queue (contain), then inspect traces
- Scale workers to 200 so jobs finish faster
- Delete the ledger
explain: Contain side effects first. Prompt art is not an incident-response tool.
\`\`\`
`,
    },
  ],
};
