import type { RawLesson } from "@/lib/types";

export const prodSurvive: RawLesson[] = [
  {
    slug: "incident-playbooks",
    title: "Incident Playbooks",
    summary:
      "Write the playbook before the afternoon: contain first (kill switch, pause queue, trace ids), then see, then rollback. Agents fail as distributed systems.",
    minutes: 21,
    level: "advanced",
    md: `
An **incident** is when the agent did something you promised it would not — or stopped doing something you promised it would — at a scale that matters: wrong refunds, data mixed across tenants, a cost spike, a loop that emailed 2,000 customers. You need a **playbook** before that afternoon. Writing it during the event produces heroics, not control.

Minute 0–5 is **contain**. Flip the kill switch or the specific tool flag (\`refund=off\`). Pause the queue (or that tenant’s queue) if jobs are still applying. Page the owner; open a shared doc with **trace ids**. Do not start by tweaking the prompt in prod. Contain first.

Agents fail as distributed systems: queues, tools, flags, vendors. “The AI was weird” is not a severity. A tool flag, a prompt version, or a vendor — named — is. Customers can hear “refunds paused; tickets queued.” They cannot hear a persona rewrite.

## How the box actually works

Keep a one-page playbook per class of blast (refund, tenant leak, cost, injection, vendor). Each page has the same spine.

| Minute | Move | Owner |
|---|---|---|
| 0–5 contain | Tool/global/tenant flag; pause queue if writes continue | On-call |
| 5–20 see | Traces for the blast radius; classify | On-call + domain |
| 20+ mitigate | Rollback SHA/bundle; rotate keys if needed; comms | On-call + comms |
| Same week | Golden that would have failed before deploy | Whoever owns the bug |

\`\`\`viz flow
title Contain, then see, then fix
layout lr
node contain Contain
node see See
node fix Rollback
edge contain see
edge see fix
caption Flip the flag first. Do not start by tweaking the prompt in prod.
\`\`\`

Containment levers you already built: \`tools.refund=false\`, \`paused_tenants\`, \`agents.disabled\`, queue pause. Ledger audit is part of contain for money: list rows above a cents threshold, freeze, do not delete.

Status sentence, ready to paste: what is off, who is safe, when the next update is. Update on a clock (15–30 minutes), not when you feel brave.

Owners: on-call runs the spine. Product owns customer sentences. Security owns leak classes. Nobody owns “tweak the vibe in prod.”

Put the playbook **next to the flags**, not in a slide. A one-pager per class (refund, leak, cost, injection, vendor) with the same spine is enough. Each page lists the first lever, the blast-radius query, who to page, and the status sentence template. If the page is longer than a screen, nobody will read it at 2 a.m.

Game-day the spine quarterly with a fake ledger. Time contain. Time the first status sentence. If either is over five minutes, the path is wrong (permissions, unknown URLs, flags cached).

## A prompt-tweak storm

Refunds fired without HITL. The first instinct in the channel was a new system prompt. Refunds continued for 12 minutes. The playbook would have flipped \`tools.refund\` and paused the queue in one minute, listed two ledger rows over 100 cents, and noted that a golden “refund without human approval fails” did not exist. Afterward they ran the tryit as a drill: contain prints flags off, radius prints the two jobs, \`new golden needed? True\`. The prompt did not change that day.

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

\`contain\` shows refund false and queue paused. \`radius\` lists both 400-cent jobs. \`new golden needed? True\` because the trace has refund without a human flag. Refunds off. Queue paused. Two jobs in the radius. The new golden is “refund without human approval fails.” The playbook print is the spine. Nothing in this function edits a template.

## What goes wrong

Prompt art as incident response. Scaling workers to “finish faster” (more refunds). Deleting the ledger. No shared doc, so trace ids live in five DMs. No status clock. Blaming “the AI” in public. Playbook only in a slide deck. Game day never run, so the flag path 404s.

Heroics that skip contain look brave and extend the blast. “I can patch the parser in five minutes” is allowed **after** refund is off. The playbook order is the product. If two incidents overlap, still contain both; do not average them into one vague channel.

## How to test it

- \`contain\` / \`blast_radius\` / golden-needed unit tests.
- Staging game day: fake storm, time to flag flip, time to a status sentence in the doc.
- Pager payload includes trace ids.
- Ledger freeze does not delete rows.

If you cannot flip the flag in staging in two minutes, the playbook is fiction.

Rehearse the status sentence out loud: what is off, who is safe, next update time. Put a template in the doc so people fill blanks instead of inventing tone. Include a fake finance page in game day so contain is not only a unit test of dicts.

## How agents use this

Have a **status sentence** ready. Do not blame “the AI.” Blame a tool flag, a prompt version, or a vendor — specifically. Keep trace ids in one doc. Contain side effects first. The golden is not optional homework; it is the last line of the playbook (two lessons from now).

Print the spine on the on-call cheat sheet: contain, trace, rollback, write a golden. Put the cheat sheet where flags live.

Do not scale workers to “finish the storm faster.” That applies more refunds. Do not delete the ledger. Do not blame “the AI” on the status page. Name the flag you flipped and the population that is safe. Next update in 15 minutes even if the update is “still contained, still looking at traces.” Keep one incident channel, one doc, one person typing the status sentence. Parallel heroes are how you get two global kills and no traces.

After contain, nobody edits prompts until see is done. Put that sentence in the playbook in bold. The channel will still suggest it; the playbook is how you say no without a debate.

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
  {
    slug: "contain-then-see",
    title: "Contain, Then See",
    summary:
      "After the flag flips: traces for the blast radius, classify policy vs tool vs vendor vs injection vs HITL bypass, then rollback and rotate if keys leaked. Do not delete traces.",
    minutes: 20,
    level: "advanced",
    md: `
Minute 5–20 is **see**. Pull traces for the blast radius (tenant, tool, time window). Distinguish **policy bug** (wrong prompt / state) vs **tool bug** (authz miss) vs **vendor outage** vs **injection** vs **HITL bypass**. Check whether the human gate was skipped.

Minute 20+ is **mitigate**: rollback worker SHA / prompt bundle; rotate keys if traces or prompts may have leaked secrets; replay **read-only** to confirm the fix on recorded observations; customer comms with facts, not vibes. Do not delete traces to “save face.” You will need them for customers, auditors, and the golden you are about to write.

Containment without classification is how you leave the wrong flag off for a week. Classification without containment is how you write a beautiful RCA while refunds continue.

## How the box actually works

A small classifier over the trace is enough to pick the **first lever**. Humans still confirm.

| Trace picture | Class | First lever (after contain) |
|---|---|---|
| \`wire\` tool | policy or injection | Keep dangerous tools off; inspect observations for injected text |
| \`get_invoice\` two tenants on one job | tool authz | Disable retrieval if needed; patch filter |
| \`VENDOR_503\` | vendor | Breaker already; slow enqueue; do not mass-retry huge contexts |
| \`refund\` without \`hitl_approved\` | HITL bypass | Refund stays off until gate is real |
| Cost explosion, tools look normal | cap / loop | Job cap, kill new jobs, trim |
| Multi-agent ping-pong | hop cap | Disable handoff |
| Injection via PDF | tool family | Disable that family; strip observations |

\`\`\`viz flow
title Classify after the flag
layout lr
node flag Flag is on
node traces Blast traces
node class Class
edge flag traces
edge traces class
caption Do not delete traces. Replay write tools as stubs.
\`\`\`

Blast radius query: tenant, tool name, time window, versions stamp. Export **redacted** traces for the incident doc.

Owners: on-call classifies with a buddy. Security joins on leak/injection. Vendor comms if 503 is them. Do not let five people each “just tweak” a different flag.

Replay read-only: recorded observations, fake or frozen model, **write tools stubbed**. If you replay live refunds you will make a second incident.

Classification is a sorting hat for levers, not a court verdict. When two classes could fit, pick the **stricter contain** (more flags off) until you know. A vendor 503 plus a HITL bypass in the same hour is two incidents; do not average them.

Keep traces. Restrict access. Redact for the incident doc. Deleting traces to save face is how you fail the audit and the golden. The blast-radius query is tenant + tool + window + versions; export that set once into the shared doc so five people are not running five slightly different greps.

## A two-tenant-read ticket

Traces showed \`get_invoice\` for Acme and Beta on one job. Someone argued it was “a creative model.” Classification was \`tool_authz\`. Containment: disable retrieval (and invoice) until the filter shipped. They did **not** delete traces. Legal needed the ids. The golden was the tempting query from the tenant lesson. Rollback was not required; the worker SHA was fine. The tool was not.

A parallel false path: deleting traces to save face. That turns a containable leak into an unprovable one. Keep traces. Redact. Restrict access. Do not incinerate evidence.

\`\`\`tryit python
def classify(trace):
    tools = [e.get("tool") for e in trace if e.get("kind") == "tool"]
    flags = [e.get("flag") for e in trace if e.get("kind") == "flag"]
    if "wire" in tools:
        return "policy_or_injection"
    if any(e.get("code") == "PERMISSION_DENIED" for e in trace) is False and "get_invoice" in tools:
        tenants = [e.get("tenant") for e in trace if e.get("tool") == "get_invoice"]
        if len(set(t for t in tenants if t)) > 1:
            return "tool_authz"
    if any(e.get("code") == "VENDOR_503" for e in trace):
        return "vendor"
    if "refund" in tools and "hitl_approved" not in flags:
        return "hitl_bypass"
    return "needs_human"

storm = [
    {"kind": "tool", "tool": "refund"},
    {"kind": "final", "text": "done"},
]
print("storm", classify(storm))
print("vendor", classify([{"kind": "tool", "tool": "search_kb", "code": "VENDOR_503"}]))
print("inject", classify([{"kind": "tool", "tool": "wire"}]))
\`\`\`

\`storm\` is \`hitl_bypass\` (refund, no human flag). \`vendor\` is \`vendor\` because of \`VENDOR_503\`. \`inject\` is \`policy_or_injection\` because of \`wire\`. Refund without HITL is a bypass. Wire is policy or injection. 503 is the vendor. Different first levers. \`needs_human\` is the honest default when the picture does not match.

## What goes wrong

Tweaking prompts while classifying. Deleting traces. Replaying write tools live. One channel with twenty theories and no blast-radius query. Treating injection as only a wording problem while the PDF tool still runs. Rolling back the worker when the tool authz is the bug (you will “fix” nothing).

A classification of \`needs_human\` that sits for an hour with no human is contain-and-freeze, not see. Page the owner named on the box. If you cannot name the owner, that gap is the incident too.

## How to test it

- Classifier fixtures: storm, vendor, wire, two-tenant invoice, unknown.
- Blast-radius query in staging returns the seeded jobs and only those.
- Replay harness refuses live write tools.
- Access log: incident traces still readable after flags flip.

Seed a two-tenant invoice trace and assert \`classify\` returns \`tool_authz\`, not \`needs_human\`. Seed a 503 and assert you do not roll back the worker in the runbook’s next step. The classifier is a small function so you can test it without a cluster.

## How agents use this

Common first levers: cost explosion → job cap + kill new jobs. Refund storm → refund flag + ledger audit. Cross-tenant read → disable retrieval, then patch authz. Multi-agent ping-pong → hop cap, disable handoff. Injection via PDF → disable that tool family, strip observations.

Write those levers next to \`classify\` in the runbook. After see, mitigate with rollback and rotation **if the class needs it**. Then the golden.

Rollback the worker when the class is policy/code on the worker. Patch the tool when the class is authz. Rotate keys when traces or prompts may have contained secrets. Do not roll back a healthy SHA because the model “felt off.” The versions stamp tells you what to roll.

If classification is \`policy_or_injection\`, keep the dangerous tool off while you read observations for injected instructions. If it is \`vendor\`, do not also rewrite the prompt. Wrong mitigations stack into a second outage.

Write the blast-radius query as a saved search with placeholders for tenant, tool, and window. On-call should paste three values, not invent SQL. If the query takes more than a minute to run, you will skip see.

\`\`\`quiz
You see get_invoice rows for two tenants on one job. What class is that?
- A creative model
- *A tool / tenancy bug — disable retrieval if needed, then patch authz
- A reason to add more personas
- Normal, because JSON is helpful
explain: Cross-tenant reads are authz. Contain, then patch the tool, then write a golden.
\`\`\`
`,
  },
  {
    slug: "golden-from-incident",
    title: "Every Incident Ends in a Golden",
    summary:
      "If you cannot write a test that would have failed before the deploy, you do not understand the incident yet. Then game-day: old SHA fails, new SHA passes.",
    minutes: 19,
    level: "advanced",
    md: `
The only acceptable souvenir: at least one **golden** (and maybe a tool unit test) that would have failed **before** the deploy; an owner; a tag; a dashboard or alert if you were blind; a spec patch if the spec was wrong. After the golden is merged, run a **game day**: replay the fixture in staging with the old SHA (should fail) and the new SHA (should pass). If you cannot reproduce, you do not have a fix. You have a story.

Practice on a fake storm in staging and time how long until the flag flips. Production is where eval-track habits **block the next merge**. This lesson does not re-teach golden design. It demands a **fixture that CI can run** — the same shape as the refund-without-HITL function below.

Incidents should not end in a pep talk. Same week: golden, owner, tag.

## How the box actually works

| Deliverable | Done means |
|---|---|
| Fixture trace or tool args | Frozen in the repo |
| Test that fails on old behavior | Red on old SHA, documented |
| Test that passes on new behavior | Green on new SHA |
| Owner + tag | Named human, billing/safety/authz/… |
| Alert if you were blind | Page or dashboard you actually use |
| Spec patch if needed | The doc matches the new gate |
| Game day | You ran old vs new in staging |

\`\`\`viz flow
title Incident ends in a golden
layout lr
node inc Incident
node gold Golden
node day Game day
edge inc gold
edge gold day
caption Old SHA fails. New SHA passes. A pep talk is not a close.
\`\`\`

The test is allowed to be small. \`refund\` in tools and no \`hitl_approved\` flag → fail. That is both a golden and a spec: refunds need a human flag.

Owners: the person who shipped the bug owns the golden unless you explicitly reassign. Platform owns getting it into the PR gate (fake model / fixture). On-call owns reminding the channel that “over” without a test is not over.

Close the incident ticket only when the fixture is merged **and** game day ran. “Customers stopped tweeting” is not a close reason. If you cannot fail the old SHA, you do not understand the bug: maybe it was a flag, a payload, or a race. Stay in see until the test is red on old.

The golden can be a tool unit test (tenant filter) or a tiny trace predicate (refund without HITL). It does not need a live model. It needs to be in the PR gate you already built.

## An encore ticket

A HITL bypass was “fixed” by a prompt sentence. No test. A week later a worker refactor dropped the gate again. The encore cost more than the first show. The function \`refund_without_hitl\` would have failed the old trace and passed the new one. Game day: old SHA red, new SHA green. They added it to the PR gate the same week. The pep talk was canceled.

\`\`\`tryit python
def refund_without_hitl(trace):
    tools = [e["tool"] for e in trace if e.get("kind") == "tool"]
    flags = [e.get("name") for e in trace if e.get("kind") == "flag"]
    if "refund" in tools and "hitl_approved" not in flags:
        return {"ok": False, "why": "refund_without_hitl"}
    return {"ok": True}

old = [
    {"kind": "tool", "tool": "refund"},
    {"kind": "final", "text": "sent"},
]
new = [
    {"kind": "flag", "name": "hitl_approved"},
    {"kind": "tool", "tool": "refund"},
    {"kind": "final", "text": "sent"},
]
print("old sha would fail", refund_without_hitl(old))
print("new sha", refund_without_hitl(new))
print("game day: old fails, new passes")
\`\`\`

Old SHA prints \`ok: False\` with \`refund_without_hitl\`. New SHA prints \`ok: True\` because the human flag is present. That function is the golden. It is also the spec: refunds need a human flag. Game day is running this against both images, not telling a story about them. If old does not fail, you still do not understand the incident.

## What goes wrong

Fix without test. Test that only asserts the prompt contains “be careful.” Test that needs production keys. Game day skipped. Owner “the AI team.” Tag missing, so the PR gate never picks it up. Closing the incident because customers stopped tweeting.

A golden that is not in the PR suite is folklore again. A golden so broad it fails every unrelated prompt tweak will be deleted. Keep it tight: this tool, this flag, this tenant pair. Tight tests survive.

## How to test it

The tryit. Plus CI: the new fixture is in the gate; a revert of the fix goes red. Staging game day recorded in the incident doc with times.

Check the old SHA in a worktree or image tag, not in memory. If you cannot run old, you cannot prove the golden. Store the fixture next to the incident id so a year later someone knows why \`c17\` exists.

## How agents use this

Same week: golden, owner, tag. Capture red-team and incident wins as **merge blockers**, not as folklore. The evals track taught you to store fixtures. Production is the last mile: those fixtures fail the build that would have shipped the encore.

If the spec was wrong (you never required HITL), patch the spec **and** the test. A test without a spec will be deleted as “too strict.”

Same week, not someday: fixture, owner, tag, gate. The encore is scheduled the moment you skip that week. Capture red-team wins the same way — they are incidents that happened in staging.

Name the tag so the PR gate picks the row up. “Misc” is how fixtures rot. Billing, safety, authz, cost — pick one. Put the incident id in a comment above the test so the next delete-the-strict-test conversation has a date and a dollar amount.

If the fix is a flag default, the golden still asserts the trace shape, not only the flag file. Flags get flipped. The test is what keeps the encore off the merge train. Game day without the old SHA is a story; with the old SHA it is a proof. Block the incident ticket on that proof. If old cannot be run, say so in the ticket and keep it open — that is still “we do not understand it yet.” Do not close on vibes.

\`\`\`quiz
The outage is “over” and nobody wrote a test. What is true?
- You are done; customers moved on
- *You do not understand the incident yet — write the golden that would have failed before deploy
- Tests are only for libraries
- The model will remember not to do it
explain: No golden means the encore is unscheduled, not impossible.
\`\`\`
`,
  },
  {
    slug: "boring-ops",
    title: "Boring Ops Is the Goal",
    summary:
      "Production is a queue, traces, caps, tenancy, CI that can say no, and a practiced kill switch. A public URL is just DNS. Stop the loop, see the trace, prevent the encore.",
    minutes: 22,
    level: "advanced",
    md: `
The teams that survive agent production are not the ones with the longest system prompts. They are the ones who can **stop the loop**, **see the trace**, and **prevent the encore**. You now have a gateway that enqueues, workers that checkpoint, versions on every run, traces with dollars and redaction, caps, queues, idempotency, tenant filters, canaries, kill switches, CI gates, and a playbook that ends in a golden. That is the product. The model is a box inside it.

Joeven’s projects are where you practice without production keys: weather tool-agent, research agent, RAG support, multi-agent team, ops approval. Same shapes: typed tools, a transcript, a budget, a test that can fail the build. You started with Python names and lists. You learned math, models, prompts, tools, retrieval, loops, teams, and evals. Production is those pieces **with owners, budgets, and a stop button**.

A public URL is DNS. Calling a larger model is not a stack. Temperature 0 is not a kill switch. Boring is the goal.

## How the box actually works

A readiness checklist is allowed to be rude. If a box is missing, you are not in production. You are in a demo with extra steps.

| Need | Why it is not optional |
|---|---|
| Queue | Jobs outlive requests |
| Job store | Deploys and crashes |
| Trace store | Why job_17 spent this |
| Kill switch | Stop the loop this minute |
| CI gate | Policy cannot ship untested |
| Redaction | Traces are a PII store |
| Tenant filter | Reads are the quiet breach |
| Playbook | Contain before prompt art |

\`\`\`viz strip
title Boring ops is the product
chip Queue
chip Traces
chip Caps
chip CI
chip Kill
caption A public URL is just DNS. Stop the loop, see the trace, prevent the encore.
\`\`\`

Owners still matter when the team is small. Write the names. Practice the stop button on a calendar. Review cost per successful job weekly. Promote canaries only when watched. Drain before you kill pods.

The smallest stack lesson said four tables and a lever. This lesson says: if any row is false, \`ready\` is false. A demo with a queue is not ready.

Run \`ready\` in staging CI against real config flags, not against a test double that always returns true. Flip each need off once a quarter and confirm the product **fails closed**: no silent success, no writes, no cross-tenant reads. Game-day the kill switch on a calendar. Review cost per successful job weekly even when nothing is on fire.

Narrow workflows first: handbook Q&A, refunds off, one tenant in the volunteer list. Widen the allow-list when the checklist is still true, not when a blog post is due.

## A public-URL ticket

A launch blog said “in production.” The checklist was queue true, job store true, everything else false. No traces, no kill, no CI gate, no redaction, no tenant filter, no playbook. A leaked note and a prompt-only tenancy sentence arrived the same week. They pulled the DNS, built the missing rows, ran a game day, then relaunched a **narrow** workflow with refunds off. The blog was quieter. The pager was quieter too.

\`\`\`tryit python
def ready(ops):
    need = [
        "queue",
        "job_store",
        "trace_store",
        "kill_switch",
        "ci_gate",
        "redaction",
        "tenant_filter",
        "playbook",
    ]
    missing = [k for k in need if not ops.get(k)]
    return {"ready": not missing, "missing": missing}

print("demo", ready({"queue": True, "job_store": True}))
print("prod", ready({
    "queue": True,
    "job_store": True,
    "trace_store": True,
    "kill_switch": True,
    "ci_gate": True,
    "redaction": True,
    "tenant_filter": True,
    "playbook": True,
}))
print("boring is the goal")
\`\`\`

\`demo\` is not ready: missing traces, kill switch, CI gate, redaction, tenant filter, playbook. \`prod\` is ready with an empty missing list. A demo with a queue is not ready. The full checklist is. Use this function in staging CI if you want to be unkind to yourself in a useful way.

## What goes wrong

Calling the URL production. Growing the allow-list before the stop button. Skipping game days because “we are busy shipping.” Treating this track as a recap of ReAct. Buying another orchestrator instead of naming owners. Letting the checklist rot.

A second anti-pattern: a beautiful architecture diagram that does not match the four tables in the database. If on-call cannot find \`jobs\` and \`flags\` in one query, the diagram is art. Update the checklist when you add a box. If \`ready\` is always true in CI because someone stubbed it, you are lying to yourself on a schedule.

## How to test it

Run \`ready\` against staging config in CI. Flip each flag false once and confirm the product still **fails closed** (no silent success). Game-day the kill switch this quarter. Replay last incident’s golden on old vs new SHA.

Print \`missing\` in the staging smoke test so a new hire sees the list, not a boolean. If the list is empty in staging and full in prod, you rehearsed the wrong play again.

## How agents use this

Ship a **narrow** workflow. Keep the eval in CI. Practice the kill switch on a game day. Then widen the allow-list — not the other way around.

On-call should be able to draw the six boxes, open a trace by support code, trip a cap on purpose, pause one tenant, and point at the golden that came from the last scare. If they cannot, you have a demo. Make it boring. Then you can add the next tool.

You now have the operating loop: admit work as a job, see it as spans, move it with keys and fairness, ship it with canaries and gates, survive it with contain → see → golden. The model remains one box. Keep it that way.

On-call should draw the six boxes from memory, open a trace by support code, trip a cap on purpose, pause one tenant, and point at last quarter’s golden. If they cannot, schedule the game day before the next tool. Magic is an unowned box. Name the owner.

> **Note:** When something feels like magic, look for a missing owner. Magic is an unowned box.

\`\`\`quiz
What makes an agent “in production” more than a public URL?
- A longer constitution
- *A queue, traces, caps, tenancy, CI that can say no, and a practiced kill switch
- Calling a larger model
- Turning temperature to 0
explain: Production is an operable system. The URL is just DNS.
\`\`\`
`,
  },
];
