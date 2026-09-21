import type { RawLesson } from "@/lib/types";

export const prodMove: RawLesson[] = [
  {
    slug: "queues-retries",
    title: "Queues and Retries",
    summary:
      "Workers crash and vendors 503. Assume at-least-once delivery, put idempotency keys on writes, back off with jitter, and checkpoint after the tool succeeds.",
    minutes: 21,
    level: "intermediate",
    md: `
Workers crash. Deploys happen. Vendors return 503. A production runner is a **queue consumer** with **at-least-once** delivery: the same job slice may run twice. If that slice calls \`refund\`, you will double-pay unless you designed for it.

Assume at-least-once. Exactly-once is a myth at the edges. Therefore every write tool takes an **idempotency key**, checkpoints commit **after** the tool succeeds (or you use an outbox), and handlers are safe to replay. If a worker dies mid-slice, the message should reappear. Set the visibility timeout **longer than the slice**, shorter than forever. Heartbeat if a tool is slow.

This lesson is the queue’s behavior. The next lesson zooms in on the key itself. Dead letters and fairness come after that. You need all three; this one is why retries are normal rather than a scandal.

## How the box actually works

A worker **leases** a message for a visibility window. During the window it runs a slice. If it finishes, it acks and the message is gone. If it dies, the lease expires and another worker gets the same slice. That is at-least-once.

| Situation | Queue action |
|---|---|
| Slice succeeds, checkpoint written | Ack |
| Worker dies before ack | Redeliver after visibility timeout |
| Transient tool 503 | Retry with backoff + jitter; count attempts on the job |
| Visibility timeout shorter than the slice | Duplicate workers on the same slice |
| Visibility forever | Poisoned message stuck until a human |
| No heartbeat on a long tool | Same as timeout too short |

\`\`\`viz flow
title Lease, slice, ack or retry
layout lr
node lease Lease
node slice Slice
node ack Ack
node retry Retry
edge lease slice
edge slice ack
edge slice retry
caption At-least-once is normal. Writes need an idempotency key.
\`\`\`

Backoff without jitter is a **stampede**: every worker wakes on the same second and hits the tool again. Jitter is not decoration.

Checkpoint timing: if you checkpoint “I will refund” before Stripe returns, a crash retries and you might refund twice **even with** a key if you minted a new key. Checkpoint **after** success, or write an outbox row in the same database transaction as “slice started” with the key already chosen.

Owners: runtime owns the consumer, visibility, backoff. Domain tools own idempotency at the write. On-call owns “how many attempts before DLQ.”

Log \`attempt\`, \`job_id\`, and the key on every tool span. Future you will need them.

Visibility timeout is a number you can get wrong in both directions. Too short: two workers refund. Too long: a dead worker holds the slice for half an hour while the queue looks “in flight.” Heartbeats extend the lease while a slow tool is honestly working. If you cannot heartbeat, split the slice so the tool is a separate job with its own timeout.

Drain is a queue operation: stop leasing on the old SHA, wait until in-flight leases expire or checkpoint, then terminate. A rolling kill is a scheduled retry storm.

## A double-refund ticket

A worker applied a 1999-cent refund, then crashed before ack (deploy killed the pod). The message reappeared. The second worker refunded again. Ledger had two rows. The model did not “remember.” The queue did its job. The write tool had no key.

After the fix, the key was \`job_17:step_3:refund\`. Two crashes after the write still left one ledger row. Backoff printed different delays because of jitter, so the payment API was not hammered in lockstep. The incident write-up ended in an idempotency test, not a prompt change.

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

You should see three attempts (0, 1, 2). Attempts 0 and 1 crash after the write. \`new_write\` is True only once. Backoff values differ because of jitter (seeded so the demo is stable). Final ledger still has one 1999-cent refund and \`ok True\`. Two crashes after the write did not double-pay. If you deleted the \`if key not in ledger\` guard, the ledger would lie and this lesson would be a finance event.

## What goes wrong

Visibility timeout of 10 seconds on a slice that calls a 30-second tool: overlapping workers, overlapping writes. Retrying **4xx semantic** errors (bad invoice id) as if they were 503s: infinite nonsense. Resetting attempt counters when you re-enqueue. Checkpointing before the side effect. Backoff without a cap, then without jitter. Treating the model as the record of whether a refund happened.

Holding a database transaction open for the whole model call “to be exactly once.” You will stall the DB and still not be exactly once at the payment edge.

## How to test it

- Crash injector: succeed write, crash before ack, redeliver — ledger size 1.
- Backoff: delays increase, stay ≤ cap, jitter differs across workers (do not assert exact floats beyond a seed).
- Visibility: a test that runs longer than the timeout must heartbeat or you assert duplicate detection via the key.
- Attempt counter lives on the job row.
- 503 retries; 400 does not.

If your payment API already supports idempotency keys, **pass them through** and test with their test clock.

## How agents use this

Design every write tool for replay. Read tools can be sloppy; writes cannot. When you add a tool, ask “what happens if this slice runs twice?” If the answer is “email twice,” you need a key or you need to not send from the worker.

Deploys **drain**: stop leasing new messages on the old SHA, let slices checkpoint, then kill pods. A rolling kill without drain is a retry storm you scheduled.

Put queue depth and attempt histograms next to the traces. A job on attempt 4 is an incident in slow motion — DLQ is next.

Pass vendor idempotency keys through when they exist. Your ledger and Stripe’s ledger must not disagree. If you only remember locally, a crash after Stripe succeeded and before you wrote the row is a puzzle; the vendor key is the tie-break.

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
    slug: "idempotency-keys",
    title: "Idempotency Keys",
    summary:
      "Build the key from job_id, step_id, and tool. Same key, same result, no second side effect. Do not put the model’s thought text in the key.",
    minutes: 19,
    level: "intermediate",
    md: `
An **idempotency key** is a string the write tool uses to say “I already did this.” Same key, same result, no second side effect. Retries are normal. Double spend is the bug.

Build it from things that do not change when the worker retries: job id, step id, tool name. Do not include the model’s thought text — that changes and would mint a new key, which is a second refund with extra steps. Do not mint a random uuid on every retry. Random is the opposite of idempotent.

Read tools can be retried without a key. Write tools cannot. If you are unsure, it is a write. Email, tickets, refunds, calendar invites, “post to Slack,” filesystem append — writes.

## How the box actually works

The tool service owns a **ledger** keyed by the string. First call: perform the side effect, store the result. Second call: return the stored result, do not perform the side effect. The worker always sends the same key for that step.

| Include in the key | Exclude |
|---|---|
| \`job_id\` | Model thought / scratchpad prose |
| \`step_id\` (stable) | Random uuid per attempt |
| Tool name | Tenant display name (use the signed id if you must scope) |
| Sometimes: hashed canonical args | Wall-clock timestamps |

\`\`\`viz flow
title Same key, one write
layout lr
node mint Mint key
node first First call
node again Retry
edge mint first
edge first again
caption Job, step, and tool. Thoughts do not go in the key. Random uuids are a second refund.
\`\`\`

Args in the key: only if two refunds in the same step could be different amounts **on purpose**. Usually one write per step. If the model retries the same step with a different cent amount, that is a product decision: either reject the mismatch (“key reused with different body”) or treat it as a new step. Payment APIs often reject mismatch. Copy that behavior.

Owners: domain tool owns the ledger. Runtime mints the key from job + step + tool **before** the call and logs it on the span. On-call needs a runbook: how to look up a key in Stripe/email/your DB after a DLQ replay.

Pass through vendor keys when they exist. Do not invent a second ledger that can disagree with Stripe.

The worker mints the key **before** the HTTP call and puts it on the span, even if the call times out. “We are not sure it landed” is the whole reason for a key: the next attempt sends the same string. If you drop the key on timeout, you will pay twice “to be safe.” Safe is the same key.

Step ids must be stable across retries of the **same** decision. If the assembler re-numbers steps because a thought was inserted, you will mint a new key. Step id comes from the job’s checkpointed counter, not from \`len(thoughts)\`.

## A thought-in-the-key ticket

Someone built keys as \`job_id + thought[:40]\` so they would be “unique.” Every retry had a new thought. Every retry refunded. Uniqueness was the bug. The fix was boring: \`job_17:3:refund\`. A later step 4 refund (a second, real decision) correctly created a second row. That is not a duplicate. That is another action.

On-call documentation now says: if DLQ replay is safe, the key is in the span; if the ledger already has it, replay is a no-op; if you need a **new** side effect, you need a new step id, not a new random suffix.

\`\`\`tryit python
def key(job_id, step_id, tool):
    return job_id + ":" + str(step_id) + ":" + tool

def apply_write(ledger, k, cents):
    if k in ledger:
        return {"ok": True, "duplicate": True, "cents": ledger[k]}
    ledger[k] = cents
    return {"ok": True, "duplicate": False, "cents": cents}

ledger = {}
k = key("job_17", 3, "refund")
print("first", apply_write(ledger, k, 1999))
print("retry", apply_write(ledger, k, 1999))
print("other step", apply_write(ledger, key("job_17", 4, "refund"), 1999))
print("ledger size", len(ledger))
\`\`\`

\`first\` is not a duplicate. \`retry\` is a duplicate with the same 1999 cents. \`other step\` is a new row because step 4 is a different action. Ledger size 2. Same key means no second payout. New step means a second payout **on purpose**. If those two sentences ever blur in a design review, stop and write this test.

## What goes wrong

Thoughts in the key. Attempt number in the key (retry becomes a new write). Only-job-id as the key (step 4 cannot write). Dropping the key on timeout because “we are not sure it landed” — then you double. Client-generated keys from the model. Keys stored only in worker memory.

Mismatch: first call 1999 cents, retry 2000, ledger returns 1999 without telling anyone. Surface \`duplicate\` and the stored body. If mismatch should be an error, return \`KEY_MISMATCH\` and do not pay the new amount.

A second common mess: two services each keep a ledger. Stripe says paid, your table says not, the worker “fixes” it with a new key. Pick one ledger of record (usually the vendor’s, mirrored locally). Reconciliation is a batch job, not an extra refund in the hot path.

Clock-skewed step ids from “use the timestamp” collide or never retry the same. Integers on the job row are boring and correct.

## How to test it

- Same key twice: one side effect, \`duplicate: True\`.
- Different step: two rows.
- Thought text changes, key does not (do not even pass thought into \`key()\`).
- Mismatch body: defined error.
- After process restart, ledger still has the key (real DB in staging).

Contract-test the vendor: send the same Stripe idempotency key twice in test mode.

## How agents use this

Document replay for on-call: which keys are safe, which ledgers to check, how to re-drive a dead-letter item after a fix. Queues without that page are a bag of delayed incidents.

Never let the model invent the key. The worker mints it. The model may choose **that a write happens**; the platform chooses the identity of the write.

When you add a new write tool, copy this ledger pattern the same day. A “small” Slack post without a key will page you at 2 a.m. after a deploy.

On-call replay: open the span, copy the key, query the ledger / Stripe / email provider. If the row exists, re-driving the DLQ is a no-op and that is success. If you need a genuine second send, you need a new step id and a human decision, not a new suffix on the old key.

\`\`\`quiz
What belongs in an idempotency key?
- The model’s latest thought, so keys stay unique
- *Stable ids: job, step, and tool — not the prose of the thought
- A random uuid on every retry
- The tenant’s display name
explain: Retries must produce the same key. Random and thoughts do not.
\`\`\`
`,
  },
  {
    slug: "dead-letter-fair",
    title: "Dead Letters, Poison, Fairness",
    summary:
      "Max attempts then DLQ. Reject poison at the gateway. Per-tenant concurrency so one swarm cannot starve everyone. Slow enqueue when the vendor is 503.",
    minutes: 20,
    level: "intermediate",
    md: `
**Dead-letter** jobs that exceed max attempts. A human (or a script) inspects them. Infinite retry is an outage you paid for. A payload that always crashes the worker (bad text, 50 MB JSON) must go to the dead-letter queue **without** taking the fleet down. Validate at **enqueue** in the gateway: max bytes, schema, tenant present.

One customer with a 10,000-PDF swarm should not starve everyone. Use **per-tenant** concurrency. Separate queues for interactive vs batch — that is an SLO choice, not hope. When the model vendor is 503, **slow enqueue**. Do not spawn more workers that will fail the same way.

Retries from the previous lessons are for **transient** failure. This lesson is for **poison**, **fairness**, and **giving up**.

## How the box actually works

| Failure | Queue action |
|---|---|
| Transient tool 503 | Retry the slice with backoff + jitter |
| Parse error | Retry the model once, then fail the job |
| 4xx semantic | Do not retry; fail or ask a human |
| Repeated timeout on one tenant | Isolate / fair-queue so others live |
| Payload over max bytes / invalid schema | Reject at gateway → poison / DLQ with a reason |
| Max attempts exceeded | DLQ, page or ticket with job id |
| Vendor 503 across the fleet | Shed load: slow or stop enqueue, breaker |

\`\`\`viz flow
title Poison, fair, then DLQ
layout lr
node gw Gateway
node fair Fair queue
node dlq Dead letter
edge gw fair
edge fair dlq
caption Reject huge payloads at the door. One tenant cannot starve the rest.
\`\`\`

Fairness is a **scheduler** property. A simple pattern: per-tenant semaphore (cap 2 running). Extra work stays queued for that tenant. Other tenants still pop. Two physical queues (interactive vs batch) keep FAQ jobs off the PDF runway.

Poison is a **gateway** property. If the worker can crash on parse, you already lost. Cap bytes, require tenant, require job schema, reject or DLQ **at the door**.

Owners: gateway owns validation. Runtime owns DLQ, attempt max, fairness. Product owns interactive vs batch SLO. On-call owns replay steps in the runbook **before** the first poison message.

Replay is a product: fix the crash, re-drive from DLQ with the same idempotency keys. If replay is “delete the row and ask the user to click again,” you will double or drop.

Poison vs fair vs DLQ are three different doors. Poison never runs. Fair waits its turn. DLQ already ran and lost. Mixing them — for example, treating fairness as poison — makes Beta look like a bug. Mixing them the other way — retrying poison as if it were a 503 — empties the fleet.

When the vendor is 503, a deep queue of work that will fail the same way is not resilience. It is a battery of retries you will pay for later. Slow enqueue, open the breaker, let interactive users see a structured error instead of a 20-minute wait.

## A 50 MB poison ticket

A tool wrote a 50 MB observation onto the job and the next slice put it on the queue. Every worker OOM-killed. Autoscaler added workers. They died too. Interactive FAQs queued behind a corpse.

Gateway validation would have rejected the enqueue (\`POISON\`). Fairness would not have saved you if **every** worker loaded the same poison message — that is why poison must not be redelivered to the whole fleet. DLQ it on crash loop **and** prevent it at the door.

A second incident the same month: Acme’s batch swarm filled the only queue. Beta’s “how long are refunds?” sat for 20 minutes. Two queues + tenant caps. Beta ran. Acme waited. That is fairness.

\`\`\`tryit python
def enqueue(payload, max_bytes=200, tenants_running=None, tenant_cap=2):
    tenants_running = tenants_running or {}
    raw = payload.get("blob") or ""
    if len(raw) > max_bytes:
        return {"ok": False, "code": "POISON", "dlq": True}
    if not payload.get("tenant"):
        return {"ok": False, "code": "NO_TENANT"}
    t = payload["tenant"]
    n = tenants_running.get(t, 0)
    if n >= tenant_cap:
        return {"ok": False, "code": "FAIR_QUEUE"}
    tenants_running[t] = n + 1
    return {"ok": True, "running": tenants_running}

print("ok", enqueue({"tenant": "acme", "blob": "hi"}))
print("poison", enqueue({"tenant": "acme", "blob": "x" * 500})["code"])
busy = {"acme": 2}
print("fair", enqueue({"tenant": "acme", "blob": "q"}, tenants_running=busy)["code"])
print("other tenant", enqueue({"tenant": "beta", "blob": "q"}, tenants_running=busy)["ok"])
\`\`\`

\`ok\` admits a small Acme payload. \`poison\` is \`POISON\` for a 500-character blob over a 200-byte cap — DLQ at the door. With Acme already at cap 2, \`fair\` is \`FAIR_QUEUE\`. Beta still gets \`ok True\`. Poison does not take the fleet. Acme cannot starve Beta. That is the whole lesson in four prints.

## What goes wrong

Infinite retry. Retrying poison. One queue for all SLOs. Fairness by “please use the API kindly” in the docs. DLQ nobody reads. Replay that mints new job ids and new keys (double send). Slow consumers without a max payload. Vendor 503 + scale workers to 200.

Validation only in the worker: the crash happens before the validator.

Fairness that is global concurrency only: one tenant still owns all slots if they arrived first. Per-tenant caps exist so arrival order is not destiny. Interactive jobs on the batch queue inherit batch SLOs no matter how small they are — put the queue name on the job at enqueue and refuse to hop.

## How to test it

- Oversize blob → \`POISON\`, no worker call.
- Missing tenant → \`NO_TENANT\`.
- Tenant at cap → \`FAIR_QUEUE\`; other tenant admitted.
- Crash loop fixture → DLQ after max attempts, not infinite.
- Interactive vs batch: a batch flood does not move interactive p95 in a load test.

Write replay steps and run them in staging on a fake DLQ item.

## How agents use this

Interactive vs batch is an SLO choice; encode it as **two queues**. Write replay steps in the runbook before the first poison message. When the vendor is sick, shed load at enqueue — your queue is not a battery that stores infinite failing work.

Per-tenant caps are also a **cost** control: they pair with monthly dollar caps. A swarm should hit fairness before it hits the finance pager, or at least not take Beta down on the way.

Write the DLQ runbook while you are calm: how to inspect the payload without loading 50 MB into a laptop; how to confirm the key; who is allowed to re-drive. A Slack message of “just replay all of them” is how you double-email 2,000 people.

\`\`\`quiz
A 50 MB observation lands on the queue and crashes every worker. What should have happened?
- Retry until the fleet is empty
- *Gateway rejects it as poison / DLQ at enqueue, with a reason
- Raise the worker memory and hope
- Ask the model to compress it after the crash
explain: Validate at the door. Poison retries are self-inflicted outages.
\`\`\`
`,
  },
  {
    slug: "secrets-security",
    title: "Secrets and Security",
    summary:
      "Secrets live in a manager or the tool service, never in prompts, repos, or traces. Treat the model as an untrusted client; redact before the scratchpad; pin dependencies.",
    minutes: 22,
    level: "advanced",
    md: `
Agents are **secret amplifiers**. They log more, they retrieve more, they send more text to a third-party model API. Your threat model is not only “hacker on the laptop.” It is also: prompt injection, a curious employee in the trace UI, a vendor breach, and a model that **echoes** a key it saw in a tool dump.

Where secrets live: a **secret manager** or the environment of the **tool service**, not the prompt, not the repo, not the trace. Short-lived credentials where possible. Separate keys per environment (dev / stage / prod) with **hard spend limits** on experimental keys. If a tool result might contain a key (config files, error pages), redact **before** it enters the scratchpad.

Never paste secrets into Joeven, tickets, or screenshots. Never dump the whole environment into an observation. Pin tool dependencies. An agent that installs a package **named by the model** is a remote-code product. Computer-use on an unsandboxed desktop is the same class of bug.

## How the box actually works

| Place | Allowed to hold Stripe? | Notes |
|---|---|---|
| Prompt / template | No | The model will quote it |
| Scratchpad / observations | No | Redact first |
| Trace store / exporters | No | Subprocessor + leak |
| Worker env | No (confused deputy) | Model key only, scoped |
| Tool service env / secret manager | Yes, scoped | Short-lived if you can |
| Repo / CI logs | No | Scan; rotate if it landed |
| Trace UI | Masked | Reveal audited |

\`\`\`viz strip
title Secrets stay off the prompt
chip Vault
chip Tool env
chip Worker
chip Trace
caption Keys live in the manager or the tool service. Redact before the scratchpad.
\`\`\`

The model host cannot reach the database except through tools. Tool authz uses the signed job tenant (next lesson is the filter; this lesson is the **secret and the echo**). Rotate on a schedule and after any suspected leak.

The trace UI is a privileged app: SSO groups, audit logs on “view trace,” no world-readable links. Security reviews read **tool authz and redaction**, not only the system prompt’s manners.

Owners: security owns rotation policy and secret manager. Domain tools own scoped roles. Runtime owns “do not print env.” Platform owns pinning installs and sandboxing computer-use.

Short-lived credentials: a worker that fetches a 15-minute Stripe-scoped token from the manager at slice start is better than a long-lived key in an env file baked into the image. Separate **spend limits** on stage keys so a leaked demo key cannot become a production-sized bill. Prod keys never live in staging.

The model provider is another place secrets must not go. If a 500 body with a key reaches \`complete()\`, you have exported the secret to a third party even if your trace store is clean. Redact before the assembler, full stop.

## An echo ticket

A billing 500 page included \`key=sk-live-...\`. The tool returned the HTML. The next model call proposed \`use sk-live-... please\` as a “fix.” That completion landed in traces and in a vendor exporter. Rotation, redaction, structured errors. The golden was: after \`get_invoice\`, stored observations match \`REDACTED\` not \`sk-\`, and cross-tenant args still \`PERMISSION_DENIED\`.

A second finding in the same review: the worker image could \`pip install\` a name from JSON. Disabled. The model is not your supply chain.

\`\`\`tryit python
import re

SECRETS = {"STRIPE_KEY": "sk-live-DEMO-not-real"}
SECRET_RE = re.compile(r"sk-[A-Za-z0-9-]+")

def redact(text):
    return SECRET_RE.sub("[REDACTED_KEY]", text)

def get_invoice(auth_tenant, args):
    requested = args.get("tenant")
    if requested and requested != auth_tenant:
        return {"ok": False, "code": "PERMISSION_DENIED"}
    raw_error = "upstream 500, key=" + SECRETS["STRIPE_KEY"]
    return {"ok": True, "tenant": auth_tenant, "note": redact(raw_error)}

print(get_invoice("acme", {"tenant": "acme", "id": 1}))
print(get_invoice("acme", {"tenant": "other", "id": 1}))
print("prompt would see:", redact("use sk-live-DEMO-not-real please"))
\`\`\`

Own tenant: ok, with a redacted note — you should see \`[REDACTED_KEY]\`, not the demo key. Other tenant: denied, no note, no key. The prompt line is already redacted so a jailbreak-style instruction cannot carry the live secret into the next complete(). Own tenant, redacted error. Other tenant, denied. The prompt never received the live key. Concatenation built the fake error on purpose so we never use an f-string.

## What goes wrong

Keys in prompts “so the model can call Stripe.” Keys in few-shots. Keys in CI artifacts. One key for stage and prod. Unlimited experimental keys. Logging \`args\` without redaction. Model-named packages. Unsandboxed desktop control. Trace UI shared with the whole company.

Treating injection as a prompt wording problem only. Injection is how untrusted text **reaches a tool**. Isolation and redaction are the controls; wording is extra.

A leaked stage key with prod-sized spend limits is a prod leak. A screenshot in a ticket system with looser ACL than the trace store is a side channel. “We only use test keys in CI” that are actually live is a scanner finding, not a debate.

## How to test it

- Redact fixtures as in tracing.
- Worker image config: Stripe not in worker env.
- \`get_invoice\` deny + redact tests.
- CI secret scan on the repo and on sample traces.
- Computer-use / install-from-JSON disabled in prod flags.
- Rotation drill: time to revoke and replace.

Do not test “the prompt says not to reveal secrets.” Test that the secret never entered the prompt.

## How agents use this

Ban running model-generated code on boxes with secrets. Pin dependencies. Redact before scratchpad. Rotate on leak and on a calendar. Put spend limits on every vendor key so a leak cannot also be an infinite bill.

When you add a tool, ask where its key lives and what a 500 body looks like. If you do not know the 500 body, you have not redacted it.

SSO on the trace UI is part of the agent product. Curious employees are in the threat model. Audit reveals.

Pin lockfiles. Disable install-from-JSON in prod flags. Computer-use stays off until the sandbox is a real box with no secrets, not a developer laptop. Injection is how untrusted text reaches a tool — isolation and redaction are the controls; a polite constitution is extra.

\`\`\`quiz
The model asks get_invoice with another tenant’s id. What should the tool use?
- The model’s tenant argument, to be helpful
- *The authenticated job/user tenant from the gateway; deny mismatches
- A random tenant
- The system prompt’s company name
explain: Authorization context comes from the signed request, not from untrusted model JSON.
\`\`\`
`,
  },
  {
    slug: "tenant-from-gateway",
    title: "Tenant From the Gateway",
    summary:
      "Tenancy is a filter on every read and write, using the signed job tenant. Include it in CI. A shared index without tenant filters is a breach waiting for a query.",
    minutes: 20,
    level: "advanced",
    md: `
Tenancy is not a prompt sentence. It is a **filter on every read and write**. Memory notes, traces, blobs, job rows, and search indexes all need the same rule. The model may copy a ticket id from a retrieved chunk that belongs to someone else **if you fetched it**. So the bug is usually **retrieval**, not the final sentence.

Include this in CI goldens as an **ops fixture**: user A’s agent cannot read user B. That is not an eval-theory lesson. It is a store query you can fail the build on. A shared vector index without tenant filters is a data breach waiting for a query — you do not need cosine lectures to require \`WHERE tenant = auth_tenant\`.

The gateway stamps tenant on the signed job. Every tool closes over \`auth_tenant\`. The model’s JSON is not a source of tenant. You saw that in confused deputy. This lesson is the **read path**, where leaks are quiet.

## How the box actually works

| Store | Filter | Failure if missing |
|---|---|---|
| Jobs | tenant = auth | Cross-customer job admin |
| Traces | tenant = auth | PII browsing |
| Blobs | tenant = auth | PDF leak |
| Memory notes | tenant = auth | “secret roadmap” leak |
| Search / index | tenant = auth **at query time** | Model quotes the wrong customer |
| Ledgers | tenant = auth | Wrong refund target |

\`\`\`viz flow
title Filter every read and write
layout lr
node gw Gateway tenant
node store Store
node tool Tool
edge gw store
edge gw tool
caption Tenant is stamped on the signed job. A shared index without a filter is a breach.
\`\`\`

Pass \`auth_tenant\` into every tool as a closed-over value from the job, not as a model argument you “prefer.” If the model sends a tenant, compare and deny. If it omits tenant, still filter.

Owners: gateway stamps. Data owns indexes with a tenant field that is **not optional**. Domain tools own the filter. Security owns the CI golden. On-call owns “disable retrieval” as a contain lever if a leak is live.

Staging: two tenants, tempting strings in the other tenant’s notes. If staging has one tenant, you will ship the naive retrieve.

Caches, CDNs, and “similar tickets” shortcuts are stores. If the cache key is only the query string, Acme can pull Beta’s answer. The key is \`tenant + query + index version\`. Admin “break glass” tools that skip the filter must audit, time-limit, and still not dump the other tenant into an agent scratchpad.

Traces are a store. An Acme user loading \`job_99\` that belongs to Beta is the same class of bug as naive retrieve. The job admin UI uses the signed user tenant, not the job id in the URL alone.

## A naive-search ticket

Beta’s “secret roadmap” note lived in a shared notes table. Acme’s agent queried “secret.” Naive search returned Beta’s row. The model quoted it in a customer-facing answer. The prompt said “only talk about this customer.” The chunk was already in the window.

Filtered retrieve by \`auth_tenant\` returns nothing for that query. The golden is: tempting query, other tenant still absent. Containment was disable search, purge traces that contained the chunk, notify, patch the query, add the CI case. The cosine score of the chunk was irrelevant. The missing \`WHERE\` was the incident.

\`\`\`tryit python
NOTES = [
    {"id": "n1", "tenant": "acme", "text": "Acme refunds 5-7 days"},
    {"id": "n2", "tenant": "beta", "text": "Beta secret roadmap"},
]

def retrieve(auth_tenant, query):
    hits = []
    for n in NOTES:
        if n["tenant"] != auth_tenant:
            continue
        if query.lower() in n["text"].lower():
            hits.append(n)
    return hits

def naive_retrieve(query):
    return [n for n in NOTES if query.lower() in n["text"].lower()]

print("FILTERED", retrieve("acme", "refunds"))
print("NAIVE leaked", [n["tenant"] for n in naive_retrieve("secret")])
print("filtered secret", retrieve("acme", "secret"))
\`\`\`

\`FILTERED\` is Acme’s refund note only. \`NAIVE leaked\` includes \`beta\` because the roadmap matched “secret.” \`filtered secret\` is an empty list — Acme’s agent does not see Beta even when the query is tempting. Filtered search does not see Beta. Naive search leaks the roadmap. That empty list is the passing test. A prompt instruction would not have produced it.

## What goes wrong

Prompt-only tenancy. Optional tenant column. Shared buckets with random URLs. Caches keyed by query but not tenant. Admin tools that “just this once” skip the filter. Logs that print other tenants’ hits into Acme’s trace. Multi-tenant search “for better recall.”

Final-sentence checkers that look for the word “Beta” after you already stuffed Beta’s chunk into the prompt. Too late.

Shared “global handbook” that actually contains customer macros is how tenant slugs leak into the other tenant’s window. Treat macros as tenant-scoped blobs. If support wants a global FAQ, it must contain no customer ids, no other tenant names, and no invoices.

## How to test it

- Golden: auth Acme, query that matches Beta’s note → zero hits.
- Golden: auth Acme, query that matches Acme → only Acme ids.
- Naive function exists in the test file as the **negative** example so someone cannot “simplify” retrieve.
- Trace access: Acme user cannot load Beta \`job_id\`.
- Cache keys include tenant.

Run the tempting query in staging every PR. It is cheap. It is the breach.

## How agents use this

Prove isolation with a golden where the query is tempting and the other tenant still does not appear. Disable retrieval as a kill switch if you suspect a leak, then patch the query, then re-enable.

Do not ask the model to “not mention other customers.” Do not fetch those rows. If the chunk was retrieved, the model may quote it. Filter at read time.

Same rule for memory writes: a note is born with the job’s tenant. The model cannot re-parent it.

Disable retrieval as a kill switch if a leak is live. That is a contain lever, not a fix. The fix is the filter plus the golden with the tempting query. Re-enable only when CI is green on that golden.

Do not fetch other tenants’ rows and ask the model to be discreet. If the chunk was retrieved, it may be quoted. Filter at read time.

\`\`\`quiz
Where does the tenant filter belong?
- In the system prompt: “only talk about this customer”
- *In every store query and tool, using the signed job tenant
- In the user’s browser cookies
- Only on the final sentence checker
explain: If the chunk was retrieved, the model may quote it. Filter at read time.
\`\`\`
`,
  },
];
