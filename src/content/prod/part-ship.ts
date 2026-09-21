import type { RawLesson } from "@/lib/types";

export const prodShip: RawLesson[] = [
  {
    slug: "deploy",
    title: "Deploy",
    summary:
      "Shipping an agent ships code plus policy. Version workers, canary a slice, health-check without spending, and treat a prompt edit as a rollbackable release.",
    minutes: 20,
    level: "advanced",
    md: `
Deploying an agent is deploying **code + policy**. A prompt change can be as breaking as a schema change. Treat template edits like releases: version, review, rollback. The worker image (git SHA), the prompt bundle (\`p12\`), the tool schema bundle, and config flags (which model, whether computer-use is on) **ship together**. Mismatch is an incident — you already stamp versions on the job; deploy is how those versions get onto boxes.

Readiness: can the worker reach the queue, the model (or a stub), and the job store? Do **not** make readiness require a paid LLM call on every probe — that is a bill and a flaky restart loop. Probe a cheap health check that checks connections. Synthetic LLM checks belong on a slower cron with a stub.

This lesson is the **release**. Canaries and flags get their own lesson next. Kill switches after that. CI gates after that. Here we make shipping a prompt as boring as shipping a binary.

## How the box actually works

| Artifact | How it moves | Rollback |
|---|---|---|
| Worker image | SHA, registry, drain then replace | Previous SHA |
| Prompt / template bundle | Versioned object, referenced by flag | Previous version pointer |
| Tool schema | Same as prompt; it is a contract | Previous schema |
| Flags | Config service or git with history | Flip |
| Model id | Flag, not hardcoded in a random file | Flip |

\`\`\`viz bars
title Stable versus canary traffic
bar Stable,95,0
bar Canary,5,1
caption A prompt edit is a release. Most jobs stay on the old SHA until you watch the slice.
\`\`\`

Canary percent and canary SHA live in flags. \`pick_sha\` hashes the job id into a bucket. Some jobs stay on stable. A few get the new SHA. A global \`agents.disabled\` returns no SHA and admits no work. Per-tool flags (\`tools.refund\`) can disable a dangerous tool without rolling images.

Drain before a breaking worker: stop new leases on the old SHA, let in-flight slices checkpoint, then switch. Killing pods with open refunds is a retry storm you scheduled.

Owners: runtime owns images, drain, health. Prompt/ML owns bundle files in git. Ops owns flags and who can flip them. On-call owns rollback, which should be the same as “set stable_sha / prompt pointer,” not archaeology.

Prompt diffs belong in pull requests with **eval results attached** (the gate is two lessons away). Keep the previous template bundle on disk. Rollback is a flag flip.

Health is not intelligence. A probe that returns 200 when the queue is reachable and the job store accepts a ping is enough to restart pods. A probe that calls the frontier model will flap when the vendor is slow, spend money, and hide real process death. Put LLM synthetics on a cron with a stub and a spend cap, labeled as synthetics, not as readiness.

Drain checklist: (1) set canary/stable so new jobs skip the old SHA, (2) wait until old SHA in-flight count is 0 or only HITL-waiting jobs remain, (3) terminate old pods, (4) confirm versions on new jobs match the intended bundle.

## A Friday kubectl ticket

An engineer edited the live prompt ConfigMap on Friday because “it is only text.” Refund language changed. HITL rejects climbed. There was no bundle version on jobs. Rollback was “does anyone have last week’s file?” A deploy policy later: prompts move in PRs, canary 5%, \`pick_sha\` chooses, kill refund is a flag. Friday edits in prod became a firing offense in the runbook, not a culture joke.

Health checks had been calling the frontier model every 10 seconds per pod. The bill was a sidecar. They switched to queue + disk probes. LLM synthetics moved to a 5-minute cron against a stub.

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
print("canary id d ->", pick_sha("d", FLAGS))
print("refund allowed", can_call("refund", FLAGS))
FLAGS["tools.refund"] = False
print("kill refund", can_call("refund", FLAGS))
FLAGS["agents.disabled"] = True
print("kill all", pick_sha("job_17", FLAGS), can_call("search_kb", FLAGS))
\`\`\`

\`job_17\` stays on stable (\`sha-old\`) because its id bucket is ≥ 5. \`d\` is in the 5% canary bucket (\`sha-new\`). Refund starts allowed, then a flag flip kills refund only. Then \`agents.disabled\` makes \`pick_sha\` return \`None\` and even search is false. Killing refund, then killing all agents, is a flag flip — not a rebuild. Readiness never called a model here. Good.

## What goes wrong

Prompt as a live edit. Health probes that spend. Canary percent 100 because “we are confident.” No drain. Schema and worker shipping on different days with no matrix. Flags in a dashboard nobody can diff. Readiness that requires the vendor, so a vendor blip bounce-loops your pods and makes the outage worse.

## How to test it

- \`pick_sha\` fixtures: known ids → stable vs canary; disabled → None.
- \`can_call\` respects tool and global kills.
- Health endpoint does not import the LLM SDK.
- Deploy pipeline stores previous bundle; rollback test flips the pointer.
- Drain test: in-flight job checkpoints on old SHA; new jobs pick new SHA.

Attach the CI gate report to the PR that changes p12 → p13. If there is no report, it is not a deploy.

## How agents use this

Treat every prompt PR like a binary PR: owners, rollback, canary. Write the rollback command in the PR template so nobody invents one during a scare. Keep images and bundles mapped in the version table you already stamp on jobs.

Readiness is connections, not intelligence. Synthetics are separate and capped.

When computer-use or refunds enter a new region, they ship **off** by default. Flags, not hope.

Write the rollback command in the PR template: pointer to previous bundle, previous SHA, flag names. If rollback requires a historian, you will not roll back. Keep images and bundles mapped in the version table you already stamp on jobs so the incident query and the deploy UI tell the same story.

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
    slug: "canary-and-flags",
    title: "Canaries and Feature Flags",
    summary:
      "Send 5% of jobs or a volunteer tenant to the new worker. Watch goldens, forbidden tools, cost, HITL, latency — then promote or roll back. Flags are versioned config.",
    minutes: 19,
    level: "advanced",
    md: `
Send 5% of jobs — or one tenant that volunteered — to the new worker. Watch: golden-tag success, forbidden-tool count, cost, human-gate rejects, latency. Promote or roll back. A 5% canary that you never look at is a dice roll with extra steps.

**Feature flags** turn dangerous tools off by default in a new region (computer-use). Config as code: model id, template version, canary percent live in git (or a config service with **history**). A dashboard click nobody can diff is how prod drifts from staging. Frozen flags should themselves be versioned so you know who flipped them.

This is how you measure a deploy, not how you write goldens. The numbers you watch are ops fixtures: the same tags CI uses, sampled on real jobs.

## How the box actually works

Routing order:

1. Global kill → no SHA.
2. Volunteer tenant list → always canary SHA.
3. Percent bucket on job id → canary or stable.
4. Default stable.

Measure **per route**. A blended dashboard will hide a canary that is on fire if it is only 5% of traffic.

| Watch on canary | Promote if | Roll back if |
|---|---|---|
| Golden-tag success (billing, safety) | Holds vs stable | Drops below floor |
| Forbidden-tool count | ~0 | > 0 |
| Cost per successful job | ~stable or expected | Spike |
| HITL reject rate | No unexplained spike | Spike |
| Latency / queue | Within SLO | Saturated |

\`\`\`viz bars
title Watch the canary alone
bar Stable,0.91,0
bar Canary,0.74,1
caption A blended dashboard hides a fire on 5% of jobs. Promote or roll back on the clock.
\`\`\`

Owners: runtime implements \`route\`. Product picks volunteer tenants. On-call watches the canary dashboard during the window. ML/prompt owns “promote the bundle.” Security owns dangerous-tool defaults off.

Flags for tools are not only canaries. \`tools.refund=false\` is a kill you will practice in the next lesson. Here, they are how a new region ships with computer-use off.

Watch in a **time box**. Ninety minutes with a named watcher is a canary. An open-ended 5% with a dashboard nobody has bookmarked is production with extra latency. Promote is a flag change: \`canary_percent\` to 100 or \`stable_sha\` to the new SHA, then \`canary_percent\` back to 0. Record who promoted.

Volunteer tenants should be small and willing. Your largest customer is a bad volunteer. Hashing on job id spreads risk; hashing on user id can trap one company on a bad SHA forever — document the key.

## An unwatched-canary ticket

They shipped \`sha-new\` at 5% on a Friday and went to lunch. Forbidden-tool ticked 4 times on canary only. Blended dashboards looked fine. A volunteer tenant would have concentrated the risk — and the metrics — on \`lab\`. Afterward: required watcher, required volunteer tenant for policy changes, promote only when canary forbidden-tool stays ~0 and billing goldens hold.

Config had lived in a UI. Staging was p11, prod was p12-edited. Git history of flags fixed the drift.

\`\`\`tryit python
def route(job, flags):
    if flags.get("agents.disabled"):
        return {"sha": None, "reason": "killed"}
    volunteer = flags.get("canary_tenants") or []
    if job["tenant"] in volunteer:
        return {"sha": flags["canary_sha"], "reason": "volunteer"}
    n = sum(ord(c) for c in job["id"]) % 100
    if n < flags.get("canary_percent", 0):
        return {"sha": flags["canary_sha"], "reason": "percent"}
    return {"sha": flags["stable_sha"], "reason": "stable"}

flags = {
    "canary_percent": 5,
    "canary_sha": "sha-new",
    "stable_sha": "sha-old",
    "canary_tenants": ["lab"],
}
print("acme", route({"id": "job_17", "tenant": "acme"}, flags))
print("lab", route({"id": "job_17", "tenant": "lab"}, flags))
print("bucket d", route({"id": "d", "tenant": "acme"}, flags))
\`\`\`

Acme’s \`job_17\` is stable with reason \`stable\`. Tenant \`lab\` always gets \`sha-new\` with reason \`volunteer\`, even on the same job id. Bucket \`d\` is percent-canary. Volunteer tenant \`lab\` always gets the new SHA. Percent canary still uses the id bucket. Two knobs, one function. Watch both routes separately.

## What goes wrong

Canary at 100%. Canary at 5% with no dashboard. Volunteers who are your largest customer. Flags without history. Measuring only “did the pod start.” Promoting because the prompt “feels nicer.” Sticky canary: job_id hashing is good; hashing on user id can trap a big customer forever in a bad SHA — know which key you use.

Promoting at 17:00 on Friday without a watcher is a canary you will meet on Saturday. A dashboard click that changes percent without a git row is how staging says 5 and prod says 40. Frozen flags need history: who, when, why, previous value.

If canary and stable share a queue with no \`sha\` label on metrics, you cannot watch per route. Labels are part of the canary, not extra chrome.

## How to test it

- Route unit tests: kill, volunteer, percent, stable.
- Metrics labeled by \`sha\` and \`reason\`.
- A fake canary forbidden-tool fails the promote script.
- Flag history: a test account can diff last 20 flips.

Time-box the canary window. An open-ended 5% is unwatched by another name.

A promote script should refuse if the canary window has no named watcher in the change ticket, or if forbidden-tool on canary is above zero. That sounds bureaucratic until the first Friday lunch. Staging should run \`route\` against a fixture list of job ids so percent and volunteer do not surprise you in prod.

## How agents use this

Measure quality **per route**. Promote only when the canary’s forbidden-tool count stays ~0 and billing goldens hold. Put dangerous tools behind flags defaulting off. Keep staging flags in git next to prod, with the same names.

Watch the canary like a deploy, because it is one. Book the window. Name the human. Promote or roll back on the clock, not when the channel goes quiet.

Config as code means a PR for percent changes except during an incident flip. Incident flips still get a follow-up PR so git matches prod. If you cannot answer “what percent is canary?” from git plus the config service history, you cannot operate the canary.

A volunteer tenant is a gift. Instrument them. Thank them. Do not surprise your largest customer with that role.

Measure quality **per route** so a burning 5% cannot hide in a blended p95. If forbidden-tool ticks once on canary, roll back. “Maybe it was a coincidence” is how coincidences become refunds. Dangerous tools stay behind flags defaulting off when you enter a new region or a new SHA.

\`\`\`quiz
What do you watch on a canary worker before you promote it?
- Only that it started
- *Golden-tag success, forbidden tools, cost, HITL rejects, latency — then promote or roll back
- Whether the prompt “feels nicer”
- CPU on the laptop that deployed
explain: Canaries exist to measure. Watching is the product.
\`\`\`
`,
  },
  {
    slug: "kill-switches",
    title: "Kill Switches You Have Practiced",
    summary:
      "Global agents.disabled, per-tool flags, per-tenant pause. Practice flipping them on a game day. A switch nobody has ever flipped is decorative.",
    minutes: 20,
    level: "advanced",
    md: `
A global flag: \`agents.disabled=true\` returns a fallback workflow or “a human will take it.” Per-tool: \`tools.refund=false\`. Per-tenant: disable a runaway customer without a full outage. Practice flipping them. Game day in staging. A kill switch in a wiki nobody can edit at night is not a kill switch.

Before a breaking worker deploy, **drain**: stop new jobs on the old SHA, let in-flight slices checkpoint, then switch. Health checks must not **spend**. A probe that calls the frontier model every 10 seconds is a cost bug and a rate-limit bug. Probe the queue and disk. Synthetic LLM checks belong on a slower cron with a stub.

If a single tenant’s swarm is melting the model bill, the **first** lever is pause that tenant. Global kill is the next size up. You built three levers so you do not use a sledgehammer on a fly.

## How the box actually works

Admission happens before a slice spends.

| Lever | Effect | When |
|---|---|---|
| \`tools.<name>=false\` | That write/read is denied | Wrong side effect, one family |
| \`paused_tenants\` | Tenant not admitted | Runaway customer, leak isolated to them |
| \`agents.disabled\` | Nobody admitted; tools false | Vendor fire, unknown blast, legal stop |
| Drain | Old SHA stops taking new work | Deploy |
| Queue pause | No pops | Refund storm while you inspect |

\`\`\`viz flow
title Kill switches, smallest first
layout tb
node tool Kill one tool
node tenant Pause tenant
node all Disable agents
edge tool tenant
edge tenant all
caption Practice the flip. A wiki nobody can edit at night is not a switch.
\`\`\`

Workers read flags at **slice start**, not once at process boot. A kill that requires a restart is too slow.

Owners’ names live next to the switches. 24/7 path to flip: on-call has permission in the config service, not a request ticket that lands Monday. Rollback command lives in the PR template.

Practice: staging game day, time until the flag flips, confirm no new refunds, confirm Beta still runs when only Acme is paused.

Workers must **read flags at slice start**. Caching flags for the life of the process means a kill waits for a deploy you were trying to avoid. A 10-second cache is a product choice; a 1-hour cache is a bug. Document the freshness.

24/7 path: on-call’s SSO group can flip \`agents.disabled\`, \`tools.refund\`, and \`paused_tenants\` without a change-management ticket that lands Monday. Audit the flips. The wiki can explain the levers; the wiki cannot be the lever.

## A wiki-switch ticket

The runbook said “set agents.disabled in the wiki and wait for a deploy.” The deploy took 40 minutes. Refunds continued. Afterward flags were live-read, practiced monthly, and the first lever in a cost incident was \`paused_tenants=["acme"]\`. Search kept working for everyone until a later global kill during a vendor 503. Three levers, in order, with names on them.

\`\`\`tryit python
def admit(job, flags):
    if flags.get("agents.disabled"):
        return {"admit": False, "why": "global_kill"}
    paused = flags.get("paused_tenants") or []
    if job["tenant"] in paused:
        return {"admit": False, "why": "tenant_paused"}
    return {"admit": True, "why": "ok"}

def allow_tool(tool, flags):
    if flags.get("agents.disabled"):
        return False
    key = "tools." + tool
    if key in flags:
        return bool(flags[key])
    return True

flags = {"agents.disabled": False, "tools.refund": True, "paused_tenants": []}
print("ok", admit({"tenant": "acme"}, flags), allow_tool("refund", flags))
flags["tools.refund"] = False
print("tool kill", allow_tool("refund", flags), allow_tool("search_kb", flags))
flags["paused_tenants"] = ["acme"]
print("tenant", admit({"tenant": "acme"}, flags), admit({"tenant": "beta"}, flags))
flags["agents.disabled"] = True
print("global", admit({"tenant": "beta"}, flags), allow_tool("search_kb", flags))
\`\`\`

First line: Acme admitted, refund allowed. Tool kill: refund false, search still true. Tenant pause: Acme not admitted, Beta still admitted. Global: even Beta is refused and search is false. Three levers: one tool, one tenant, everyone. Search still worked until the global kill. That order is the on-call script.

## What goes wrong

Switch requires deploy. Switch requires a person who is on a plane. Workers cache flags forever. Global kill as the only lever. Never practiced, so the path 404s. Health probes that spend during a kill (you pay to be told you are dead). Drain skipped, in-flight writes duplicate.

A switch that is “scale to zero” kills HITL-waiting jobs without a checkpoint. Pause the queue and flip the tool flag instead. A switch nobody can find because it was renamed in last quarter’s refactor is decorative. Keep the names stable: \`agents.disabled\`, \`tools.refund\`, \`paused_tenants\`.

If flipping refund also silently disables search because of a bad if-statement, you will take down FAQs while containing payouts. Test the three levers independently.

## How to test it

- Unit tests matching the four prints.
- Integration: flip refund off, running workers refuse the tool on the next slice without restart.
- Game day timer: flag flip < 2 minutes in staging.
- Probe does not call the model.
- Tenant pause leaves other tenants’ jobs running.

If game day fails, the switch is decorative. Fix it before the real storm.

Test independence: refund off must not change \`search_kb\`; tenant pause on Acme must not pause Beta; global kill must stop both. If those three tests are not in CI, the levers will surprise you. Record flag freshness (how old the cached copy may be) next to the game-day timer. A switch that only works after a rolling restart is a deploy, not a kill switch — fail that test.

## How agents use this

Keep a 24/7 path to flip flags. Write the rollback command in the PR template. Owners’ names live next to the switches. First lever for a melting bill: pause that tenant. First lever for a refund storm: \`tools.refund=false\` and maybe queue pause. First lever for “we do not know”: global kill, then see (next part).

Customers can hear “refunds paused; tickets queued.” They cannot hear “we are finding the prompt.”

Practice until the muscle memory is tool → tenant → global, not global-first. After a real flip, write down how long it took and fix anything slower than two minutes.

Game-day the three levers in order every quarter: tool, tenant, global. Time them. If global is the only one anyone remembers, you will take Beta down for Acme’s swarm. Put owner names next to each switch so paging is not “who has the dashboard.”

\`\`\`quiz
A single tenant’s swarm is melting the model bill. First lever?
- Turn off the whole product
- *Pause that tenant’s queue / flag, leave everyone else running
- Delete their traces
- Raise max_steps so jobs finish
explain: Per-tenant pause is why you built flags. Global kill is the next size up.
\`\`\`
`,
  },
  {
    slug: "evals-in-ci",
    title: "Evals in CI",
    summary:
      "CI is the enforcement point: tool unit tests and golden agent fixtures with fake models on every PR. Paid model evals are capped and less frequent.",
    minutes: 21,
    level: "advanced",
    md: `
If evals are a notebook someone runs after a scare, they are folklore. **CI is the enforcement point**: a prompt or worker change that fails the gate does not merge. This track does not re-teach how to design golden properties. It treats goldens as **ops fixtures** that a pipeline can fail closed on: forbidden tools, billing strings you already chose, authz denies.

Layers, fast to slow:

1. **Unit tests for tools and parsers** — every PR, seconds
2. **Golden agent suite with fake models/tools** — every PR, a minute or two
3. **LLM-backed goldens** — nightly or on prompt changes, with a spend cap
4. **Canary in prod** — after merge, not instead of CI

PRs that cannot run (1) and (2) without network are too coupled to vendors. Fake the model in CI like Joeven lessons do. Seed fake models. Freeze fixtures. Record prompt version in the test report. If CI is non-deterministic, people will ignore it — correctly.

If you do call a real model, **budget** the job, cache completions keyed by a hash of prompt + fixtures + model, and do not run it on every typo in the README.

## How the box actually works

| Layer | Network | Blocks merge? | Owner |
|---|---|---|---|
| Tool / parser unit tests | No | Yes | Domain + runtime |
| Fake-model goldens | No | Yes | Product + ops |
| Paid LLM goldens | Yes, capped | Nightly; promote only when stable | ML |
| Canary | Prod | After merge | Ops |

\`\`\`viz flow
title CI is the enforcement point
layout lr
node pr Pull request
node fake Fake goldens
node merge Merge
edge pr fake
edge fake merge
caption No network on the PR job. Empty billing is 0, not 100%.
\`\`\`

A gate function runs items: if a forbidden tool appears, fail; if a billing-tagged item lacks the required fact, fail the rate. **Empty billing is 0, not 1** — same trap as eval dashboards. Attach the report to the PR. Reviewers should see **which id failed**, not a red X with a 4,000-line log of tokens.

Owners: platform owns the CI job. Product owns fixtures. Security owns the forbidden list. Nobody owns “retry until green.”

Quarantine flaky rows with an owner. Do not hide them in a retry loop.

PR jobs have no model network. That is a policy, not a preference. If a developer “just needs one live call,” that belongs on nightly with a cap, a cache key of prompt+fixtures+model, and a budget alarm. README typos must not spend.

The report that attaches to the PR lists failing **ids**, tags, and the prompt version under test. A 4,000-line token dump is how reviewers skip the gate. Distill a stable nightly into a fake-model script when it has been green for a week — that is how the PR gate grows without getting slower and noisier.

## A notebook-folklore ticket

Billing broke for two days after a worker SHA that “only refactored parsers.” The notebook of goldens was last run in March. CI had lint. After the gate: fake-model suite on every PR, \`c1\` forbids \`wire\`, \`c2\` requires \`5-7\`. The broken candidate failed both. Merge blocked. The notebook became a nightly extra with a spend cap, not the enforcement point.

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
    rate = billing_ok / billing_n if billing_n else 0.0
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

The good candidate prints \`pass: True\`, billing_rate 1.0. The broken one fails on \`wire\` and on billing (final is \`soon\`, not \`5-7\`). Empty billing would be **0**, not 1 — if you skipped billing items, \`billing_n\` is 0 and the rate is 0.0, which fails \`min_billing\`. That is the same rule as evals, used here as a merge gate, not as a lecture on judges.

## What goes wrong

Gate only at night. Gate that needs a paid API on every PR. Flaky live search in the PR suite. Retry until green. Report that is a token dump. Skipping “just this once.” Distilling nothing: nightlies never become deterministic PR tests.

A suite that takes 40 minutes will be skipped in spirit even if it is required in YAML. Keep PR under a couple of minutes. Move the long paid calls to nightly. If people learn the incantation to ignore CI, you do not have a gate. You have a suggestion.

Fixtures that import production keys “to be realistic” will leak and will flake. Fake the model. Freeze the handbook snippet. Record the prompt version.

## How to test it

The tryit **is** the test. Also: CI config has no model network on PR jobs; nightly has a spend cap; artifacts include failing ids. Break \`candidate_agent\` on a branch and watch merge stay red.

If a golden is flaky, quarantine with an owner — do not retry until green.

Prove isolation from vendors: turn the network off in the PR job and watch the fake-model suite still pass. If it cannot, you have not faked the model; you have hidden a live call. Cache keys for nightly must include prompt version, fixture hash, and model id so a template edit cannot reuse a stale completion.

## How agents use this

Attach the gate report to the PR. Fake models in PR CI. Paid evals capped and rarer. Canary after merge, not instead of CI. When a prompt bundle changes, the report records the version stamp so you can replay.

Promote nightlies that are stable into the PR gate **without** the live model: distill into a fake-model script or a property check. The PR gate stays deterministic. The nightly hunts surprises.

Record the bundle stamp in the CI report so a red gate names \`p12\` + \`sha-abc\`, not “the tests.” When a prompt PR fails \`c2\`, the reviewer should see the billing fixture, not a philosophy of evals.

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
    slug: "what-blocks-merge",
    title: "What Blocks Merge",
    summary:
      "Block on forbidden tools, authz regressions, parser failures, and a drop on a critical tag. Do not block on flaky live search or uncalibrated judge scores. Do not skip the gate.",
    minutes: 20,
    level: "advanced",
    md: `
Must fail the build: any **forbidden tool** on the safety set; authz regressions in tool tests; parser cannot round-trip the schema; success rate on a **critical** tag (for example billing facts) drops below a threshold you chose. Should not block on: flaky live-web search; exact-string prose diffs; judge-only scores with no human calibration.

Skipping the gate “just this once” is how safety cases rot. If the golden is wrong, **change the golden in the same PR**. Promote nightlies that are stable into the PR gate without the live model. The PR gate stays deterministic. The nightly hunts surprises.

This lesson is the **policy of the gate**, not how to invent goldens. Empty billing rate is a blocker, not a free pass — missing data is fail closed.

## How the box actually works

\`merge_ok\` reads a report object. Blockers are a list. Ignored noise is recorded so it does not vanish: live-web flakes, uncalibrated judges. Reviewers see both.

| Result | Merge? |
|---|---|
| forbidden > 0 | No |
| authz_fail > 0 | No |
| parser_ok is false | No |
| billing_rate missing or below min | No |
| live_web_flakes = 4, rest green | Yes, flakes listed as ignored |
| Uncalibrated judge unhappy, rest green | Yes, ignored |

\`\`\`viz strip
title What actually blocks merge
chip Forbid
chip Authz
chip Parser
chip Billing tag
caption Do not skip the gate. Change a wrong golden in the same PR.
\`\`\`

Owners: security owns forbidden + authz. Runtime owns parser. Product owns critical tags and the min rate. Platform owns keeping live-web **out** of the PR job. A gate nobody trusts is worse than a slow suite people actually watch — same dashboard for PR and nightly so product sees trend lines, not only merge blockers.

Skipping the gate is an **incident**, not a Slack emoji. If the golden is wrong, change the golden in the same PR so git shows policy changed. If live-web flakes, quarantine that **row** with an owner. If someone needs to ship a parser fix while safety is red, they are not allowed to skip safety — they revert the unrelated failure or split the PR.

Missing billing_rate is fail closed. Empty is not 100%. That bug ships wrong refunds with a green checkbox.

## A flake-then-skip ticket

A PR stayed red for a day on live search. Someone skipped the whole gate to ship a refund parser fix. The parser was fine. A forbidden-tool regression hid in the same PR and shipped. Afterward live-web was quarantined, forbidden still blocked, skipping the gate required a named incident. Empty billing in the report blocked (None < 0.9). Flakes were visible, not silent.

\`\`\`tryit python
def merge_ok(report):
    blockers = []
    if report.get("forbidden", 0) > 0:
        blockers.append("forbidden_tool")
    if report.get("authz_fail", 0) > 0:
        blockers.append("authz")
    if report.get("parser_ok") is False:
        blockers.append("parser")
    billing = report.get("billing_rate")
    if billing is None or billing < report.get("min_billing", 0.9):
        blockers.append("billing_tag")
    noisy = report.get("live_web_flakes", 0)
    judges = report.get("uncalibrated_judge")
    return {
        "merge": not blockers,
        "blockers": blockers,
        "ignored": {"live_web_flakes": noisy, "judge_only": judges},
    }

print("good", merge_ok({"forbidden": 0, "authz_fail": 0, "parser_ok": True, "billing_rate": 1.0, "live_web_flakes": 4}))
print("bad", merge_ok({"forbidden": 1, "authz_fail": 0, "parser_ok": True, "billing_rate": 0.5}))
print("empty billing", merge_ok({"forbidden": 0, "parser_ok": True}))
\`\`\`

\`good\` may merge: four live-web flakes are ignored, billing is 1.0. \`bad\` must not merge: forbidden tool and a 0.5 billing rate. \`empty billing\` is a blocker because \`billing_rate\` is missing — fail closed, not a free pass. Live-web flakes are ignored. Forbidden tool is not. That is the policy in code.

## What goes wrong

Blocking on prose. Blocking on live web. Not blocking on missing billing. Skipping the gate. Quarantine without an owner so the row dies. Two dashboards, so nightly rot is invisible to product.

A second failure mode: the gate is so large nobody knows which blocker class fired. \`merge_ok\` returns a list for a reason — put that list in the GitHub check summary. “CI red” is not an actionable state. “forbidden_tool on c1” is.

Calibrated human review of judges belongs on nightly trends, not on merge. If you block on an uncalibrated score, people will lobby to delete the suite. Protect forbidden tools from that lobbying.

## How to test it

The three prints. Plus: a PR fixture with only flakes is green; with forbidden is red; with parser_ok false is red. Document skip policy: skipping creates an incident id.

Add a case where billing_rate is omitted and assert merge is false. Add a case where uncalibrated_judge is angry and flakes are high, but forbidden is 0 and billing is 1.0 — merge is true. Those two cases are the policy. If someone “simplifies” \`merge_ok\` to \`not report.failed\`, the tests should catch it.

## How agents use this

A gate nobody trusts is worse than a slow suite people actually watch. Same dashboard for PR and nightly. Quarantine noise. Never skip the whole gate to ship a “small” fix. If the golden is wrong, change it in the same PR so the history shows **policy changed**, not **gate ignored**.

When you add a dangerous tool, it enters the forbidden list in the same PR as the tool. When you add a critical product fact, it enters the billing (or equivalent) tag the same week.

Do not block on exact-string prose or uncalibrated judges. Do block on authz, parsers, forbidden tools, and the critical tag floor. Trust is the scarce resource. Spend it on the rows that mean “this would have been an incident.”

Publish the blocker list in the contributing doc so a new engineer does not add live-web to the PR job “for coverage.” Coverage that flakes is negative coverage. Nightly is where surprise belongs; merge is where known contracts belong.

If product asks to block on a new judge score, put it on nightly first until a human calibrates it. Then, if it is stable and tied to a real incident class, promote it into \`merge_ok\` with a named owner. Do not sneak it in as a silent extra \`fails.append\`. The check summary should quote \`blockers\` verbatim so Slack screenshots are unnecessary.

\`\`\`quiz
A PR fails because a live web search golden flaked. What should you do?
- Keep it red forever so nobody ships
- *Quarantine that row; do not block merge on live-web flakes. Do block on forbidden tools
- Skip the whole gate this week
- Replace CI with a thumbs-up in chat
explain: Block on safety and critical tags. Quarantine noise. Skipping the gate is how goldens die.
\`\`\`
`,
  },
];
