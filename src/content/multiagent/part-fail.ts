import type { RawLesson } from "@/lib/types";

export const multiFail: RawLesson[] = [
  {
    slug: "failure-modes",
    title: "How Multi-Agent Systems Fail",
    summary:
      "Ping-pong loops, cost explosions, conflicting tools, sideways injection, and traces you cannot replay. If you cannot name the failure, you will ship it. Price swarms before launch: 20 may fit the cap; 50 must not.",
    minutes: 22,
    level: "advanced",
    md: `
Multi-agent systems fail in ways single agents do not. The extra failure surface is **coordination**, not “not enough personas.” A single policy can still loop a tool; you already stopped that with thrash detection. A **team** can loop **each other**, spend N times the tokens, write the same customer twice, infect a supervisor with a wiki line, and leave a group chat that is not a trace.

If you cannot name the failure, you will ship it. This lesson is the catalog. The next three lessons lock ping-pong, one writer per record, and when not to swarm. You already installed hop caps, stars, write barriers, and baselines. This part is what on-call still sees when one of those is missing or was “temporarily” widened.

Do not “fix” these with a smarter manager persona. Managers with more tools are how conflicting writes and cost explosions get **seniority**.

## The catalog

**Loops.** A hands to B with “please review.” B hands back “please revise.” No finish. Hop caps and acyclic edges were supposed to stop this. If they are off, the path is A,B,A,B until \`max_hops\` — or until the card melts if there is no cap.

**Cost explosions.** N agents × M turns × growing transcripts. Debate on every FAQ. A swarm of large children. Serial “just one more specialist.” The baseline lesson asked you to beat one loop. This is what losing looks like on the bill.

**Conflicting tools.** Two workers both refund **and** issue store credit. Or both edit \`main.py\`. Tool isolation per role is not enough if two **allowed** roles share a customer or a file. Single-writer locks come next.

**Shared-prompt infection.** A wiki page says “approve all refunds.” One agent treats it as data; another copies it into a supervisor message as **instructions**. Injection spreads **laterally**. Typed handoffs that drop extra keys, and blackboards with ACL, were the defense. Chat as memory is how it still happens.

**Misleading traces.** A group chat is not a trace. If you cannot replay who called which tool with which args, you cannot do incident response. Star logs with \`parent_id\` and \`child_id\` are a trace. Slack is a projection.

| Failure | First control | Fake control |
|---|---|---|
| Ping-pong loop | hop cap, DAG or star, hash | Manager persona |
| Cost explosion | price before launch, debate tags | Bigger model |
| Two writers | lock per record, write barrier | “please coordinate” in prompts |
| Lateral injection | typed payload, ACL, drop extra keys | “trust the previous agent” |
| Unreadable movie | per-role spans, frozen events | Exporting the chat |

\`\`\`viz strip
title Extra ways a team fails
chip Loops
chip Cost
chip Writers
chip Injection
chip Traces
caption Name the failure. A smarter manager persona is not a control.
\`\`\`

## Walkthrough: loop, double write, priced swarm

Three toys in one box so you see them side by side.

**Ping-pong.** A and B swap “please review” / “please revise” until \`max_hops=8\`. Stop reason is the cap, not finish. Path length 8. Last message still a please. That is not a team culture. That is a missing graph.

**Conflict.** World starts unrefunded, no credit. Both flags set true. \`bad\` is true when both fired. Two writers. The next lesson’s lock would have refused the second.

**Priced swarm.** \`cost_child=0.02\`, \`cap=0.5\`. Estimate is \`n * cost_child\`. If estimate > cap, **do not launch**. Twenty children: 0.40, under 0.5, launched true. Fifty children: 1.00, over cap, launched false. This is the intended demo: **20 launches, 50 does not**. Hope is not a budget. Hide-the-cost in another team’s account is not a budget.

\`\`\`tryit python
def ping_pong(max_hops=8):
    path = []
    msg = "please review"
    nxt = "A"
    for hop in range(max_hops):
        path.append(nxt)
        if nxt == "A":
            nxt, msg = "B", "please revise"
        else:
            nxt, msg = "A", "please review"
    return {"stopped": "max_hops", "path": path, "last": msg}

def conflict():
    world = {"refunded": False, "credit": False}
    world["refunded"] = True
    world["credit"] = True
    return {"world": world, "bad": world["refunded"] and world["credit"]}

def priced_swarm(n, cost_child=0.02, cap=0.5):
    est = n * cost_child
    if est > cap:
        return {"launched": False, "est": est, "cap": cap}
    return {"launched": True, "est": est}

print("LOOP", ping_pong())
print("CONFLICT", conflict())
print("SWARM 20", priced_swarm(20))
print("SWARM 50", priced_swarm(50))
print("defenses: hop caps, single writer, price-before-launch")
\`\`\`

**What printed:** \`LOOP\` stopped at max hops with an eight-name path and a last please. \`CONFLICT\` has both refunded and credit true, \`bad: True\`. \`SWARM 20\` is launched true with est 0.4. \`SWARM 50\` is launched false with est 1.0 over cap 0.5. Twenty children fit the cap. Fifty do not launch. Two writers both fire — that is the bug the next lessons lock. The last print names the three defenses this box taught.

Change n to 25: 0.50 is **not** greater than 0.5, so 25 still launches in this toy. 26 is 0.52 and refuses. If your product wants “at most 0.5 inclusive,” keep the \`>\` and pick n so 20 is clearly under, 50 clearly over — the pedagogy you should remember.

## Alerts worth wiring today

Alert on hops per job, duplicate tool-arg hashes, cost vs estimate, **two writers** to the same record, A→B→A cycles, peer_forbidden drops, swarm launched false (that is a **healthy** refuse — also alert if launched true when est > cap, which is a bug). Deleting a persona is a valid fix. Raising the swarm cap to let 50 through is how you buy the explosion you just named.

Single-agent ReAct failures (skip observation, thrash one tool) still exist inside each worker. Do not debug those as “the team.” Look at the worker’s own trace. Debug **coordination** on the path, the locks, and the launch price.

## How agents use this

Put this catalog on the runbook’s first page. For each incident, tick which row. If you cannot tick one, you found a new row — add it, with a control, not with a persona.

Keep the priced-swarm function in the launcher, not in a notebook. CI: \`priced_swarm(20)["launched"]\` is true, \`priced_swarm(50)["launched"]\` is false. That test is cheaper than a cloud bill.

Team evals must include a ping-pong fixture, a two-writer fixture, and an over-cap swarm fixture. A harness that never tries to induce a bounce will not notice one. The evals track will go deeper. You still owe the fixtures names now.

When leadership wants 50-persona demos, show SWARM 50’s print. Then show the baseline cost. Multi-agent is still an optimization.

\`\`\`quiz
A swarm of 50 large children would cost more than the job cap. What should launch do?
- Launch anyway and hope
- *Refuse to start — price before launch
- Hide the cost in another budget
- Let each child refund the customer
explain: Price N times child cost before enqueue. Over cap means do not launch.
\`\`\`
`,
  },
  {
    slug: "ping-pong",
    title: "Detect Ping-Pong",
    summary:
      "Same payload hash twice, or A→B→A on a DAG, is a stop. A manager persona with more tools is not a control. Put cannot: ping-pong on the job and handoff.",
    minutes: 20,
    level: "advanced",
    md: `
Duplicate-message detection: hash the payload. If A asks B to review the **same brief** again, stop with \`cannot: ping-pong\`. Cycle detection on the path: if the next hop is already in the path and the graph is supposed to be a DAG, stop with \`cannot: cycle\`.

Hop limits already capped the **count**. This lesson caps **repetition**. A job can burn four hops on four **new** steps. It must not burn four hops on one brief bouncing. Agents tool-thrash hashed \`(tool, args)\`. Here you hash \`(to, brief)\` or the full frozen payload. Same family. Different object.

A manager persona with more tools is not a control. The manager will join the bounce, now with \`edit\` unlocked. The control is a stop reason on the job, then a human or a spec fix.

## Two detectors

**Payload hash.** Canonical JSON (sorted keys) so extra spaces in a paragraph cannot farm a new hash — which is another reason interfaces are data, not chat. If you hash raw chat, models rephrase “please review” and escape the detector. Freeze the brief, then hash.

**Path cycle.** If \`nxt\` is already in \`path\`, you have A→B→A (or a longer cycle). On a DAG this is always illegal. On a graph that allowed one replan edge, you still want: same hash **or** cycle of length 2 with identical briefs. The toy treats any \`nxt in path\` as cycle even with a fresh seen set, so A,B, then A stops even if the brief string were new. That is the strict DAG reading. If you need one replan, do it as return-to-supervisor, which **replaces** the path’s worker tail, rather than as a peer cycle.

| Event | Detector | Stop string |
|---|---|---|
| Same envelope twice | hash in \`seen\` | \`cannot: ping-pong\` |
| Next role already visited | \`nxt in path\` | \`cannot: cycle\` |
| Legal new hop | else | append, continue |

\`\`\`viz flow
title Ping-pong is a cycle
layout cycle
node a Role A
node b Role B
edge a b
edge b a
caption Same brief twice, or A then B then A, stops. A manager hat is not a brake.
\`\`\`

Store \`seen\` on the job, not in a model prompt. The model cannot be trusted to remember it hashed something.

## Walkthrough: billing twice, then A-B-A

Start path \`["intake"]\`. First hop to billing with brief “refund 99”: ok, path grows, hash stored.

Second hop to billing with the **same** brief: \`cannot: ping-pong\`. Path unchanged. This is the identical-handoff case even if you did not yet form a cycle of names.

Separate demo: path already \`["A", "B"]\`, next A, new seen set (so hash would not fire): \`cannot: cycle\`. A→B→A is a cycle even with a new hash set.

Together they cover “same package again” and “walked back to a visited role.” You want **both**. Hash without cycle still allows A→B→C→A with new briefs until hop cap. Cycle without hash still allows A→B→A if you **reset path** (a bug). Defense in depth.

\`\`\`tryit python
import hashlib
import json

def payload_hash(obj):
    blob = json.dumps(obj, sort_keys=True)
    return hashlib.sha256(blob.encode()).hexdigest()[:10]

def step(path, nxt, brief, seen):
    h = payload_hash({"to": nxt, "brief": brief})
    if h in seen:
        return path, "cannot: ping-pong"
    if nxt in path:
        return path, "cannot: cycle"
    seen.add(h)
    return path + [nxt], None

seen = set()
path = ["intake"]
path, err = step(path, "billing", "refund 99", seen)
print("first", path, err)
path, err = step(path, "billing", "refund 99", seen)
print("repeat", path, err)
path2, err2 = step(["A", "B"], "A", "please review", set())
print("cycle", path2, err2)
\`\`\`

**What printed:** first hop path \`intake, billing\`, err none. Repeat same billing brief: path unchanged, \`cannot: ping-pong\`. Cycle print: path still \`A, B\` (not appended), \`cannot: cycle\`. The second identical billing hop is ping-pong. A→B→A is a cycle even with a new hash set.

\`json.dumps\` with \`sort_keys=True\` is the canonical form. Do not use string interpolation to build the blob. Do not execute the blob. Hash it.

If the third hop used a **new** brief to billing while path already contained billing, the hash would differ and cycle would fire because billing is in path. That is strict and good for a DAG. Supervisor mode avoids this class: workers only return to \`sup\`, and \`sup\` may reassign without putting two workers on a peer path.

Rephrasing is the usual escape hatch. If the wire is still chat, B will send “could you take another look?” and the hash changes while the job does not. That is why this lesson sits after typed handoffs. Freeze the brief, drop extra keys, then hash. If a teammate wants “fuzzy duplicate detection” on paragraphs, they are asking to debug tone again. Refuse. Make the payload small and canonical.

Hop limits without hashing still allow a four-hop bounce of the same object if the cap is 8. Hashing without hop limits still allows A→B→C→D→E with fresh briefs until the card melts. You want both, plus illegal edges. The three brakes are not alternatives. On-call should see which one fired: \`max_hops\`, \`illegal_edge\`, \`cannot: ping-pong\`, \`cannot: cycle\`. Those strings are the product.

## After the stop

Handoff to a human with the path and the last payload on the board. Do not \`finish\` with a guessed answer to “be helpful.” Guessing is a new failure mode (silent wrong). Do not raise max hops. Do not add Director. Do not let the last speaker “summarize the deadlock” into a user-facing answer: that summary is ungrounded and often picks the louder brief.

Put the stop reason on the job record. Evals should have a fixture that forces a bounce: two envelopes, same hash, expect the string \`cannot: ping-pong\`. A second fixture should force A→B→A with different briefs and expect \`cannot: cycle\`. A multi-agent harness that never tries to induce a ping-pong will not notice one. If the suite is all happy-path FAQs, you will learn about bounces from the bill.

## How agents use this

This is Agents tool-thrash, lifted to **roles**. Put the stop reason on the job. The evals track should have a fixture that forces a bounce.

Log hashes (short prefixes, like the toy’s ten hex chars) not full briefs if briefs contain PII. Operators still need the ids.

If ping-pong rate spikes after a prompt change, revert the prompt. If it spikes after enabling peer handoff, turn handoff off and return to sequential or star. The pattern is telling you the graph is wrong, not that the models need more personality.

Combine with hop-limits: illegal edges, max hops, duplicate hashes. Three brakes. This lesson is brake three in detail.

\`\`\`quiz
A and B bounce the same brief three times. What should the runtime return?
- One more hop
- *cannot: ping-pong (or cycle) — then handoff
- A longer persona
- finish with a guessed answer
explain: Repeated identical handoffs are a stop, not a team culture.
\`\`\`
`,
  },
  {
    slug: "two-writers",
    title: "One Writer Per Record",
    summary:
      "Two roles mutating the same customer is a distributed race with a chat UI. Lock per record, or give writes to one apply role. Children never take the lock.",
    minutes: 20,
    level: "advanced",
    md: `
**Single writer** per resource: one role may call \`refund\` on a given \`customer_id\` in a job. Everyone else gets \`locked\`. Two roles mutating the same customer is a distributed race with a chat UI. Isolation by **tool name** is not enough: billing’s \`refund\` and loyalty’s \`credit\` are different names and the same ledger.

The failure-modes box set both flags true and called it \`bad\`. This lesson is the lock. The swarm write barrier said children never write. Here even **two parent-level roles** cannot both mutate \`c1\` in one job. After an incident, add a **fixture** that replays two workers with the same customer id and asserts the lock. If your team says “that was a one-off,” it will recur with a new persona name.

Locks are not chats about “please let me finish.” Locks are a map \`customer_id → owner role\` on the job (or in the ledger service). The second caller fails closed. A prompt that says “if another agent is working, wait” is not a lock. Models do not wait. They write.

This is the same family as the swarm write barrier, aimed at **roles** instead of children. Children were never allowed write names. Here billing and loyalty are both “real” specialists with legal tools — and they still cannot share a row. If your org chart says they must both touch the customer, they **propose** on the blackboard and a single apply role writes. That is sequential subgraph plus one writer, not a mesh of courtesy.

## What to lock

Lock the **record**, not the whole company. Billing may own \`c1\` while loyalty writes \`c2\`. A global mutex would serialize unrelated customers and teach people to bypass the lock.

Lock **writes**, not reads. Docs may read policy while billing refunds. Reads still obey tenant ACL (evals track). This lesson is the double-spend / double-edit class.

Lock for the **job** (or for a TTL). After the job, a later job may assign a new owner. If two jobs overlap on \`c1\`, the ledger’s idempotency key or a longer-lived lock must exist — Tools track. Multi-agent adds **role** to that story.

| First writer | Second writer, same id | Result |
|---|---|---|
| billing refund c1 | loyalty credit c1 | \`locked\`, owner billing |
| billing refund c1 | billing email c1 | ok, same owner, \`again\` |
| loyalty credit c2 | (c1 still billing) | ok, different record |

\`\`\`viz flow
title One writer per record
layout lr
node bill Billing
node lock Lock
node loyal Loyalty
edge bill lock
edge loyal lock
caption Billing owns c1. Loyalty is locked. Different customers stay free.
\`\`\`

Same owner writing again is allowed in the toy so billing can email after refund. If email should be a different apply step with its own key, still fine — owner matches. What must not happen is loyalty slipping in.

Files: one writer per path in a job. Two coders on \`main.py\` is the swarm-of-editors bug. Merge proposals in prefixes, parent applies one hunk stream. If you cannot merge hunks automatically, you do not have a swarm of editors. You have a sequential coder. Ship that.

HITL does not replace the lock. A human who approves two different roles’ writes on the same id still gets a race if those writes run concurrently. HITL then **one** apply is the shape. HITL then two applies is a slower race.

## Walkthrough: c1 billing, loyalty denied; c2 free

Empty \`LOCKS\`. Billing refunds c1: ok, owner billing, map now holds c1.

Loyalty credits c1: \`locked\`, owner billing, role loyalty. World should not take the credit (the toy only returns an error; production dispatcher must not apply).

Billing emails c1: ok, again true, same owner.

Loyalty credits **c2**: ok, owner loyalty. Different customer is free.

\`\`\`tryit python
LOCKS = {}

def write(role, customer_id, name):
    owner = LOCKS.get(customer_id)
    if owner is None:
        LOCKS[customer_id] = role
        return {"ok": True, "name": name, "owner": role}
    if owner != role:
        return {"error": "locked", "owner": owner, "role": role}
    return {"ok": True, "name": name, "owner": owner, "again": True}

print(write("billing", "c1", "refund"))
print(write("loyalty", "c1", "credit"))
print(write("billing", "c1", "email"))
print(write("loyalty", "c2", "credit"))
\`\`\`

**What printed:** billing refund c1 ok. Loyalty credit c1 error locked. Billing email c1 ok again. Loyalty credit c2 ok. Loyalty cannot credit after billing owns \`c1\`. A different customer \`c2\` is free. Billing may write again on \`c1\`.

The global \`LOCKS\` dict is a classroom stand-in. In a real worker, pass the lock map on the job so tests do not leak across tickets. Reset per fixture.

If you **clear** the lock when billing errors, loyalty might sneak in. Prefer: owner stays until job end, even after a failed write, unless a human releases. Failed refunds that release locks are a footgun.

## Children and apply

Combine with the swarm write barrier: children never take the lock. They cannot call write names. The parent apply role is the owner. If reduce says “sev3 on c1,” apply runs as \`billing\` (or a dedicated \`apply\` role — even cleaner). Dedicated apply is one writer **by construction**. Then billing and loyalty both propose, apply decides. That is sequential subgraph plus a lock that is almost unused because only apply writes. Use it anyway: defense when someone adds a second apply.

Dashboards should fire on two writers to the same id in one trace — even if the second was denied. Denied means the prompt is trying. Granted twice means the lock is broken.

## How agents use this

After an incident, add the two-worker fixture. Name it after the ticket. If the lock test is skipped because “we merged loyalty into billing,” that merge is the split-or-merge lesson winning. Good. Keep the fixture: it should still pass with one role.

Never fix two-writers with “the critic will catch the double credit.” Critics do not write, and they may run **before** the second write. Locks are runtime. Critics are packets. A critic that reads the ledger after the fact is an audit, not a mutex. You want both: lock so the second write never happens, eval so a lock bug still fails CI.

Name the resource in the lock key: \`customer:c1\`, \`path:src/app.py\`, \`ticket:T-9\`. Over-broad keys serialize unrelated work and get bypassed. Over-narrow keys (locking only the refund tool name) miss store credit. Test both mistakes.

When not to swarm, next: if items share a customer, you do not map-write. You map-score, reduce, one apply. That sentence is this lesson plus the write barrier.

\`\`\`quiz
If two roles can mutate the same customer record, what do you have?
- A high-performing team
- *A distributed race with a chat UI
- A swarm
- A grounded judge
explain: Single writer per record. Two refunds is the incident, not a culture win.
\`\`\`
`,
  },
  {
    slug: "when-not-to-swarm",
    title: "When Not to Swarm",
    summary:
      "If a sequential pipeline or one agent will do, ship that. Complexity is not an achievement. Swarm only for independent map, boring reduce, priced cap, write barrier. Next track is evals.",
    minutes: 21,
    level: "advanced",
    md: `
Ship the cheapest machine that works. Complexity is not an achievement. This track taught you when splits are honest, how to type the wire, how to orchestrate without a mesh, how to debate with a grounded judge, how to map-reduce with a barrier, and how teams fail. The last skill is **refusal**: do not climb the ladder because a slide said “team of agents.”

The ladder, cheapest first:

1. **Workflow** — fixed checklist (Agents: when not to agent). No extra policy.
2. **One agent** — branching, but one allow-list and one trace. Your baseline.
3. **Sequential roles** — tools or done-checks actually diverge; graph is code
4. **Supervisor + subgraph** — many worker types, still no peer mesh
5. **Swarm** — embarrassingly parallel map, boring reduce, write barrier, price-before-launch
6. **Debate** — high stakes, grounded judge, round cap

\`\`\`viz flow
title Climb only when you must
layout tb
node one One agent
node seq Sequential
node swarm Swarm
edge one seq
edge seq swarm
caption If a checklist or one loop will do, ship that. Complexity is not an achievement.
\`\`\`

Skip to 5 or 6 because a slide said “team of agents” and you will buy the failures in this part: ping-pong, 50-child bills, two writers, sideways injection, unreadable chats.

Do not swarm when:

- Sub-tasks share a file or a customer (race; two-writers)
- You have no merge function (reduce is the product; concat is a context bomb)
- You cannot price N children before launch (50 must not launch if 20 was the cap)
- A sequential pipeline already hits the eval (optimization that does not beat baseline)

Do not debate when the question is JSON formatting, 2+2, or an untagged FAQ. Do not add peer handoff when sequential subgraphs exist. Do not add a manager persona when you needed a hop cap.

Climbing the ladder should hurt. Each rung adds a tax line: schema, who-next, memory ACL, team eval, loop cap. If you cannot point to the new tax you are willing to pay, you are not climbing. You are decorating. Decorations invoice like services.

## The picker

\`pick_shape\` in the box is a design-review function, not an LLM. If \`fixed_path\`, you ship a workflow. If you do not need a split, one agent. If you need a split and the graph is stable, sequential roles. If you have parallel items **and** a reduce **and** a price, swarm. Parallel items without reduce fall through to one agent here — in a review, that is “go write reduce,” not “launch 50 and hope.”

Missing reduce with parallel items is the most common swarm-shaped mistake. People see a list of PDFs and spawn children that each email the customer. That is N writers. Write barrier plus reduce, or do not swarm.

\`\`\`tryit python
def pick_shape(spec):
    if spec.get("fixed_path"):
        return "workflow"
    if spec.get("parallel_items") and spec.get("reduce") and spec.get("priced"):
        return "swarm"
    if spec.get("need_split") and spec.get("stable_graph"):
        return "sequential_roles"
    if not spec.get("need_split"):
        return "one_agent"
    return "one_agent"

print(pick_shape({"fixed_path": True}))
print(pick_shape({"need_split": False}))
print(pick_shape({"need_split": True, "stable_graph": True}))
print(pick_shape({"parallel_items": True, "reduce": True, "priced": True}))
print(pick_shape({"parallel_items": True, "reduce": False, "priced": True}))
\`\`\`

**What printed:** fixed path → \`workflow\`. No split → \`one_agent\`. Split plus stable graph → \`sequential_roles\`. Parallel plus reduce plus priced → \`swarm\`. Parallel plus priced **without** reduce → \`one_agent\` (the fall-through). No merge function → not a swarm. Priced parallel items with reduce → swarm. Fixed path → workflow.

The last call is the teaching trap: it **looks** swarm-shaped and the function refuses. Write reduce, then come back. Do not add \`if parallel: return swarm\` without the other keys. Do not add debate to this picker unless \`high_stakes\` and \`grounded_judge\` are both true; even then it is a **node**, not a replacement for 1–4.

## How this track fits together

You now have split-or-merge, typed interfaces, roles with teeth, isolation, critics who do not write, a blackboard, typed handoffs, sequential default, hop limits, supervisor stars, subgraphs, debate, grounded judges, swarms, reduce, write barriers, hop/hash ping-pong, single writers, and this ladder.

Stay in that lane. The single-agent loop (ReAct, plan-execute, HITL inside one policy) was the previous track. You used it as contrast: one allow-list versus several, one trace versus a star. You did not need to re-teach observe-act-stop.

**Next track:** evals — golden traces, team-level pass rate, injection that hops between agents. A multi-agent harness that never tries to induce a ping-pong will not notice one. Measure the team, not only the intern’s paragraph. Side effects, forbidden tools per role, priced launch refuses — those are evals you can name today.

If a demo still wants 50 editors on one file, you have the sentence: that is a race, not a swarm. If it wants a group chat with 50 personas, you have the sentence: personas without different contracts are one agent with a furnace. If it wants debate on every FAQ, you have the sentence: debate is tagged, grounded, capped.

Keep the 20-versus-50 launch prints in CI. Keep the single-agent baseline in CI. Deleting a persona remains a valid ship.

## How agents use this

Put \`pick_shape\` (or a longer RFC table) in the design template next to \`ready_to_split\` and \`beats\`. Three functions, three meetings you can finish.

When product asks for a swarm, require parallel_items, reduce, priced, write_barrier, and a baseline comparison on a slice. When they ask for debate, require high_stakes, grounded judge goldens, round cap, no writes in the triangle.

On-call: if the incident is coordination, climb **down** the ladder until the failure disappears, then add back only the rungs that still beat the baseline. Climbing up in a fire is how meshes are born at 2 a.m.

A useful freeze: for one week after an incident, new personas are banned. Fixes must be allow-lists, graphs, hashes, locks, reduce, or price-before-launch. If the only proposed patch is a system-prompt paragraph, it is not a patch. It is a hope. Hopes do not close this track.

You are ready for evals when you can name a team pass, a ping-pong fixture, a two-writer fixture, and a swarm that refuses N=50. That is the work. The rest is a slide.

\`\`\`quiz
You have 200 independent tickets to score, a reduce table, and a priced cap. What should you ship?
- A debate on every ticket
- *A swarm (map-reduce) with a write barrier
- Fifty editors on the same file
- One group chat with 50 personas
explain: Independent map plus a boring reduce is the swarm case. Everything else is cheaper.
\`\`\`
`,
  },
];
