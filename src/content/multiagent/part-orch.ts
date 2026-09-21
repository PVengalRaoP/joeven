import type { RawLesson } from "@/lib/types";

export const multiOrch: RawLesson[] = [
  {
    slug: "orchestration",
    title: "Orchestration: Sequential, Handoff, Supervisor",
    summary:
      "Who speaks next: a fixed pipeline, peer handoff, or a supervisor that assigns work. Pick one, log it, and know how each pattern fails.",
    minutes: 21,
    level: "intermediate",
    md: `
**Orchestration** is the policy over policies: whose turn it is, what they receive, when the job ends. If you leave this to “whoever feels inspired,” you will get loops and silence. The coordination tax named this line item \`who_next\`. This part of the track pays it.

Roles with teeth are not enough. A planner, a worker, and a critic still need a **rule** that moves the blackboard. That rule is not a persona named Manager with the same tools as everyone else. That rule is **code you can log**: \`mode\`, \`path\`, \`assigned\`.

Three patterns cover most products. Learn how they **fail differently** even when a toy ticket prints the same FAQ answer. Production is the failure, not the happy path.

## Three patterns

**Sequential (pipeline).** Planner → worker → critic → done, or intake → specialist → finish. Control flow is **your code**. Agents do not pick the next agent. Testable. Matches HITL gates: you can put a human node in the list and no worker can vote it out. Default for a stable graph.

**Handoff (peer).** The current agent **names the next agent** and a payload. Useful when routing is genuinely content-dependent in a way a rules engine cannot see yet. Risks: ping-pong, nobody calls finish, illegal reverse edges. Mitigations: **max hops**, typed brief, allow-list of who can call whom, duplicate payload hashes. Do not start here.

**Supervisor (dispatcher).** Assigns tasks to workers, collects results, decides to reassign or stop. Workers do not talk to each other. That restriction is a feature. Traces are star-shaped: one hub, many spokes. The supervisor should be **stingy**. If a rules engine can assign based on ticket category, do not pay a 70B model to be a switch statement.

| Pattern | Who picks next | Workers talk? | Typical failure |
|---|---|---|---|
| Sequential | Your pipeline list | No | You forgot a node; graph is wrong in code |
| Handoff | Current agent names \`to\` | Yes, along allowed edges | Ping-pong; max hops; illegal edge |
| Supervisor | Hub assigns | Only to hub | Bad assignment; secret peer channel if you allow it |

\`\`\`viz flow
title Sequential is a list in code
layout lr
node intake Intake
node spec Specialist
node done Done
edge intake spec
edge spec done
caption Agents do not pick the next agent. Log the mode so cost spikes have a name.
\`\`\`

A mature product often **combines** sequential and supervisor: the supervisor picks a **subgraph** (billing vs tech), and that subgraph is a pipeline with HITL. That is a later lesson, not a purity failure.

Swarms and debate are not a fourth and fifth orchestration religion. A swarm is map-reduce under a parent that already has a mode. Debate is a subgraph you run on high-stakes items. Both still need who-next inside the subgraph.

## Walkthrough: “Where is my invoice refund?”

Three functions, same workers: intake classifies billing vs tech; billing answers 5-7 days; tech says restart the runner.

**Sequential.** Code runs intake, then picks billing because the category is billing, then returns. Path is \`["intake", "billing"]\`. Nobody named the next hop in natural language.

**Handoff.** A loop. Current name starts at intake. Intake’s result chooses the next name. A \`max_hops\` of 4 stops a runaway. In the happy path you still land on billing. In a bad graph, tech hands back to intake forever until the cap.

**Supervisor.** Intake (or a rules function) runs at the hub. Hub assigns billing. Billing never sees tech. Path is an assignment, not a peer walk.

In this toy they print similar answers. In production they **fail differently**. Sequential fails closed when you forget a node (no HITL in the list — that is a code review). Handoff fails as a ping-pong. Supervisor fails as a bad assignment, or as a peer leak if you turn that flag on.

Do not let the similarity of the FAQ answer fool you into thinking the patterns are equivalent. Log \`mode\` so next month’s cost spike can be blamed on the right machine.

\`\`\`tryit python
workers = {
    "intake": lambda t: {"cat": "billing" if "invoice" in t.lower() else "tech"},
    "billing": lambda t: {"answer": "Refunds take 5-7 days"},
    "tech": lambda t: {"answer": "Restart the runner"},
}

def sequential(ticket):
    cat = workers["intake"](ticket)["cat"]
    specialist = "billing" if cat == "billing" else "tech"
    out = workers[specialist](ticket)
    return {"mode": "sequential", "path": ["intake", specialist], "answer": out["answer"]}

def handoff(ticket, max_hops=4):
    path = []
    nxt = "intake"
    for _ in range(max_hops):
        path.append(nxt)
        if nxt == "intake":
            cat = workers["intake"](ticket)["cat"]
            nxt = "billing" if cat == "billing" else "tech"
            continue
        out = workers[nxt](ticket)
        return {"mode": "handoff", "path": path, "answer": out["answer"]}
    return {"mode": "handoff", "path": path, "error": "max hops"}

def supervisor(ticket):
    cat = workers["intake"](ticket)["cat"]
    assign = "billing" if cat == "billing" else "tech"
    out = workers[assign](ticket)
    return {"mode": "supervisor", "assigned": assign, "answer": out["answer"]}

msg = "Where is my invoice refund?"
print(sequential(msg))
print(handoff(msg))
print(supervisor(msg))
\`\`\`

**What printed:** sequential shows \`mode: sequential\`, path intake then billing, refund delay answer. Handoff shows \`mode: handoff\` and a path that also ends on billing. Supervisor shows \`assigned: billing\` and the same answer. Change the message to a timeout with no “invoice” and all three should go to tech. The lesson is the **fields**: \`path\` versus \`assigned\`, and \`max hops\` waiting in the handoff function for the day the graph grows a cycle.

This toy still uses lambdas as fake workers. Real workers are separate jobs with allow-lists. The orchestrator must not share one Python closure’s globals as a side channel — that is a mesh hiding in a module.

## How to choose

Start **sequential** if the graph is stable (billing always HITL, tech always tests). Use a **supervisor** when you have many worker types and you want no peer talk. Use **handoff** only when you can write the edge allow-list and you have already been burned by a sequential graph that needed content-dependent extra hops you cannot encode as subgraphs.

Never choose “all three, the model will pick.” That is a fourth pattern: chaos. Stamp \`orchestration.mode\` at job start. Changing mode mid-job is an incident unless you have a migration.

A 70B supervisor that only switches on the word “invoice” is a cost bug. Put that switch in code. Save the model for the worker that must read policy.

## How agents use this

Log \`mode\`, \`path\`, and \`assigned\`. When cost explodes, you want to know whether you were in handoff soup or a 40-child swarm.

Default new products to sequential. Add supervisor when worker types multiply. Add handoff last, with hop limits from the next lessons. Put the choice in flags and config, same as authz — not in a planner thought.

Eval each mode with a fixture that induces **its** failure: sequential without HITL in the list; handoff with a reverse edge; supervisor with a peer message. Those fixtures belong in this repo before you add personas.

Do not re-teach a single-agent ReAct loop as orchestration. One agent calling tools is still one policy. Orchestration starts when **two policies** need a turn-taking rule. If you only have one policy, you do not need this part. Return to the baseline.

\`\`\`quiz
Which orchestration pattern makes workers unable to talk to each other?
- Handoff with unlimited hops
- Sequential with a shared scratchpad novel
- *Supervisor (dispatcher) assigns work and collects results
- A group chat with no schema
explain: Star-shaped control is easier to budget and to audit than a peer mesh.
\`\`\`
`,
  },
  {
    slug: "sequential-pipeline",
    title: "Sequential Is the Default",
    summary:
      "A workflow that happens to contain agents. Prefer it when the graph is stable. Agents do not pick the next agent. HITL is a node in the list, not a thought.",
    minutes: 19,
    level: "intermediate",
    md: `
Most teams should ship **sequential** first. The graph is code. You can put HITL after the worker and before apply. You can unit-test “billing tickets never skip policy.” You can explain the path to a regulator without a transcript of a model arguing about VIP exceptions.

Sequential is a **workflow that happens to contain agents**. Each node might be a specialist policy, a rules function, or a human form. The **order** is not a specialist’s job. If billing can skip HITL “because the user is VIP,” your graph is a suggestion box. Suggestion boxes do not pass audits.

The previous lesson compared three modes. This lesson is why the default is the boring one. Fancy peer handoff feels more “agentic.” It is more expensive to test. Stable graphs do not need it.

## The pipeline list is the product

\`PIPELINE = ["intake", "policy", "hitl", "apply"]\` is not a sketch. It is the allow-list of **order**. Intake may classify. Policy may score. HITL may set \`approved\`. Apply may move money **only if** approved is true. No node inserts itself. No node deletes HITL.

\`\`\`viz flow
title HITL is a node in the list
layout lr
node intake Intake
node policy Policy
node hitl HITL
node apply Apply
edge intake policy
edge policy hitl
edge hitl apply
caption Billing tickets never skip the human node. The model cannot vote it out.
\`\`\`

Workers inside a node still have tool isolation. Sequential does not mean one allow-list. It means the **next node** is not elected. The coder node still cannot refund if refund lives in apply. The critic still cannot write. You compose this track’s roles **inside** nodes.

**Do not let workers vote on orchestration.** A model output \`skip_hitl: true\` must be ignored or rejected. The function in the box refuses that flag. In production, do not even parse a skip field. If the field does not exist, it cannot be set.

**HITL is a node.** A human in the loop is not a critic with writes and not a chat reaction emoji. It is a step that waits, records \`approved_by\`, and only then allows apply. Timeouts on HITL are a stop: escalate or cancel, do not auto-approve because the model is impatient.

**Tests without tokens.** \`run_pipeline("refund 99")\` must include \`hitl\` in the path. \`skip_hitl=True\` must error. Illegal tickets can still run the list and fail at policy. That is a policy fail, not a graph fail.

## Walkthrough: refund 99 cannot skip HITL

Happy path: intake sets category billing, policy sets ok, HITL sets approved, apply sets done because approved is true. Path is the four names. Done is true.

Skip attempt: the runtime does not even start the loop. It returns \`skip_hitl_not_allowed\` and the original steps. World unchanged. This is the same spirit as critic-cannot-write: the **control plane** is not a tool the model holds.

If apply ran without HITL because a developer commented the node out, that is a code review failure sequential is **good** at catching — the list is in git. Handoff graphs hide the same bug in a prompt that “usually” visits HITL.

VIP customers still hit HITL. If legal wants a faster path, that is a **different subgraph** with its own review, or a higher-trust HITL queue — not a boolean the billing worker sets. The subgraph lesson will keep HITL inside the billing list. This lesson is the list itself.

Sequential also makes **latency** honest. You can time each node. You can budget tokens per node. Peer handoff hides latency in a soup of hops. When a PM asks why refunds take 40 seconds, sequential answers “HITL wait.” Handoff answers “they were talking.” Operators can staff HITL. They cannot staff a conversation.

\`\`\`tryit python
PIPELINE = ["intake", "policy", "hitl", "apply"]

def run_pipeline(ticket, skip_hitl=False):
    steps = list(PIPELINE)
    if skip_hitl:
        return {"error": "skip_hitl_not_allowed", "steps": steps}
    path = []
    state = {"ticket": ticket}
    for name in steps:
        path.append(name)
        if name == "intake":
            state["cat"] = "billing"
        elif name == "policy":
            state["ok"] = True
        elif name == "hitl":
            state["approved"] = True
        elif name == "apply":
            state["done"] = state.get("approved") is True
    return {"path": path, "done": state.get("done")}

print(run_pipeline("refund 99"))
print(run_pipeline("refund 99", skip_hitl=True))
\`\`\`

**What printed:** the happy path is \`path\` of four names and \`done: True\`. The skip flag is an error with the pipeline list still shown, no \`done\`. The model does not get a vote. A worker cannot skip HITL with a flag from the model — the function refuses.

Apply in this toy does not check \`state["ok"]\` from policy. Production should. Sequential makes that check **local** to the apply node: if policy failed, apply must not run, which you enforce by breaking the loop or by a gate before apply. Do not rely on the billing worker to remember.

## Sequential is not “no LLMs”

Intake can be a small classifier model. Policy can be retrieval plus a rubric. The writer node can be an LLM. Sequential only forbids those models from **rewiring the list**. You still use specialists. You still use typed handoffs **into** each node (the node’s input is a payload, not a novel). You still keep a single-agent baseline for tickets that never needed two nodes.

If the graph changes every ticket in ways you cannot encode as a finite set of pipelines, you may need a supervisor picking subgraphs, or — rarely — peer handoff with caps. Prove that with failed sequential goldens, not with a slide.

## How agents use this

Orchestration policy belongs in **code and flags**, same as authz. Trace \`orchestration.mode=sequential\`. Trace the path. Alert if apply runs without a prior hitl event on billing jobs.

When a product manager asks for “more autonomy,” translate: which **node** should the model own, and which nodes stay code? Autonomy on intake classification can be fine. Autonomy on skipping apply gates is not.

Keep the pipeline list in config so you can add a \`notify\` node without teaching workers a new social protocol. Review diffs to \`PIPELINE\` like you review diffs to IAM.

If you later wrap this pipeline in a supervisor, the supervisor only picks \`billing\` vs \`tech\`. It does not get a skip_hitl tool. The next lessons are hop limits for the day you do use peers, then the star so workers cannot rewrite the graph in DMs.

\`\`\`quiz
Who should choose the next node in a sequential pipeline?
- The worker who feels inspired
- *Your code (the pipeline list)
- A 70B model on every hop
- The customer
explain: Sequential means the graph is code. That is why it is testable.
\`\`\`
`,
  },
  {
    slug: "hop-limits",
    title: "Hop Limits and Acyclic Graphs",
    summary:
      "A may call B, B may not call A. Same payload hash twice stops. Unbounded handoff is an infinite loop. Cap hops before you add a manager persona.",
    minutes: 20,
    level: "intermediate",
    md: `
Peer handoff needs three brakes **before** you turn it on in production:

1. **Max hops** for the whole job
2. **Allow-list of edges** (A→B ok, B→A denied)
3. **Duplicate detection** — same \`(from, to, payload_hash)\` twice → stop

\`\`\`viz strip
title Three brakes on handoff
chip Max hops
chip Allowed edges
chip Dup hash
caption A may call B. B may not call A. The same payload twice stops.
\`\`\`

Unbounded handoff is an infinite loop with a chat UI. A third agent named Manager with more tools is not a control. It is another node that can join the bounce. The failure-modes part will detect ping-pong in depth. This lesson is the **graph** you install so ping-pong is illegal, not merely sad.

Sequential mode does not need peer edges. If you are still sequential, keep this lesson as the reason you do not “just enable handoff” in the framework’s default mesh. If you are already in handoff, install the brakes today.

## Three brakes, in order

**Max hops.** A small integer on the job (4, 8, 12 — pick and measure). Each accepted edge increments. Hitting the cap is \`stop: max_hops\` with the path attached. It is not a suggestion to buy a larger model. Eval this with a fixture that would walk forever.

**Edge allow-list.** A set of tuples \`("intake", "billing")\`, \`("intake", "tech")\`. Not in the set means \`illegal_edge\`, even if hops remain. **Acyclic** for the default: if A may call B, B may not call A. Cycles are how “please review / please revise” lives. If you truly need a worker→planner replan, that is a **named** edge with a budget of one, or a return to a supervisor, not a free reverse.

**Duplicates.** The toy below uses a coarse key \`src + "->" + dst\` so you can see the idea without hashing. Production hashes the **payload** too (ping-pong lesson): intake→billing with the same brief twice is a stop even if you allowed the edge once. Identical briefs bouncing are a stop, not a personality. Pair with Agents tool-thrash: same idea, lifted to roles.

| Stop reason | When | Next action |
|---|---|---|
| \`max_hops\` | Path length at cap | Handoff to human or fail the job |
| \`illegal_edge\` | Tuple not in \`EDGES\` | Fix the graph; do not grant the edge to “be nice” |
| \`duplicate\` | Same hop key (and later, same hash) seen | Treat as ping-pong |
| \`done\` | Graph finished on a terminal node | Run apply / finish in code |

Put the graph in **config**. Tests can fire illegal edges with no tokens. On-call can read \`EDGES\` without decoding a prompt.

## Walkthrough: intake may bill; tech may not return

Legal: hops \`["billing"]\` from intake. Stop done. Path intake, billing.

Illegal cycle: hops \`["tech", "intake"]\`. After intake→tech, tech→intake is not in \`EDGES\`. Stop \`illegal_edge\`.

Cap: hops \`["billing", "tech"]\` with \`max_hops=2\`. Path already \`["intake"]\`. First hop to billing makes length 2, which is the cap, so you never add a third name. The exact branch depends on when you check length; the toy checks **before** appending the next hop if \`len(path) >= max_hops\`. Intake plus one hop fills a cap of 2. Too many hops stop even on a legal name.

If you add \`("tech", "intake")\` to \`EDGES\` to “let them clarify,” you have chosen a cycle. Then you **must** rely on hop cap and duplicate hash, and you should prefer a supervisor instead.

\`\`\`tryit python
EDGES = {("intake", "billing"), ("intake", "tech")}

def allowed(src, dst):
    return (src, dst) in EDGES

def run(hops, max_hops=4):
    path = ["intake"]
    seen = set()
    for dst in hops:
        if len(path) >= max_hops:
            return {"stop": "max_hops", "path": path}
        src = path[-1]
        if not allowed(src, dst):
            return {"stop": "illegal_edge", "from": src, "to": dst, "path": path}
        key = src + "->" + dst
        if key in seen:
            return {"stop": "duplicate", "path": path}
        seen.add(key)
        path.append(dst)
    return {"stop": "done", "path": path}

print(run(["billing"]))
print(run(["tech", "intake"]))
print(run(["billing", "tech"], max_hops=2))
\`\`\`

**What printed:** intake→billing is \`stop: done\`. Tech→intake is \`illegal_edge\` with \`from: tech\` and \`to: intake\`. The third call stops with \`max_hops\` (path already at the cap after intake, or after billing, depending on length) — too many hops stop even on a legal name. Read the \`path\` field. That is what you log.

The duplicate branch is waiting for a hop list that repeats an edge. Try \`run(["billing", "billing"])\` in your head: after the first billing, src is billing, which has **no** outgoing edge in \`EDGES\`, so you get \`illegal_edge\` before duplicate. That is fine. Defense in depth. Add a legal self-loop only if you like pain.

## Handoff without these brakes is not “flexible”

Framework defaults often allow any node to call any node. That is a mesh. Meshes are for research demos. Products need \`EDGES\`. If routing is so content-dependent that you cannot list edges, you do not understand the product yet. Stay sequential or supervisor until you can list them.

A hop limit of 200 is not a limit. Pick a number you would be ashamed to exceed on a FAQ. High-stakes debate rounds are a **separate** cap (often one attack). Do not reuse the FAQ hop budget for debate.

Choosing the number is a product decision. Four hops is enough for intake → specialist → critic → stop. Twelve hops means you do not know the graph. Measure p95 hops on goldens before you raise anything. If p95 is already 11 of 12, you do not have slack — you have a loop waiting to happen. Cap first, then shorten the graph, then maybe add one numbered replan edge through a supervisor.

## How agents use this

Put the graph in config. Tests can fire illegal edges with no tokens. Pair with Agents tool-thrash: identical briefs bouncing are a stop, not a personality.

Stamp \`stop\` on the job with the enum above. Alert on \`illegal_edge\` in production: that is a model trying to rewrite the graph. Alert on \`max_hops\`: that is a product bug or a poisoned loop. Do not “raise the cap” as the first fix.

When two agents keep handing the same ticket back and forth, the first control to add is this lesson, not a manager persona. The ping-pong lesson adds payload hashes on top. Together they are the loop story from the tax checklist.

\`\`\`quiz
Two agents keep handing the same ticket back and forth. What is the first control to add?
- A third agent named Manager with more tools
- *A hop limit (and an acyclic graph or a supervisor that owns finish)
- Longer personas
- Removing all stop conditions
explain: Unbounded handoff is an infinite loop. Cap hops, then fix the graph.
\`\`\`
`,
  },
  {
    slug: "supervisor-star",
    title: "Supervisor Star, Not a Mesh",
    summary:
      "Workers talk only to the supervisor. Secret side-channels between workers are how you lose the audit trail, skip the critic, and undo tool isolation.",
    minutes: 20,
    level: "intermediate",
    md: `
In supervisor mode, workers **do not message each other**. The supervisor assigns, collects, reassigns, or stops. Traces are **star-shaped**: one hub, many spokes. A mesh is a hairball.

The orchestration overview said this restriction is a feature. This lesson is the **drop rule**: if \`src\` is not the supervisor and \`dst\` is not the supervisor, the message is not delivered. Logs say \`peer_forbidden\`. The coder cannot tell the docs worker to skip tests. The critic cannot whisper a patch. Isolation and no-write critics survive only if the wire cooperates.

A supervisor can be a **rules engine**. Ticket category → worker id. Save the LLM for the worker. A 70B hub that only routes on the word “invoice” is the tax lesson’s bad spend. Use a model hub when assignment needs messy language **and** you still cannot encode subgraphs — then eval the hub’s assignments as their own golden set.

## Star versus mesh versus sequential

**Star.** Every legal message has the hub on one end. Workers return artifacts to the hub. The hub writes the blackboard. The hub may start a critic as another spoke, then reassign the worker. Workers never see each other’s prompts.

**Mesh.** Any to any. Side channels skip the critic and the audit. Hop-limits can still cap a mesh, but you will spend the year drawing the edge list you should have gotten by using a star.

**Sequential.** No messages at all in the peer sense: code calls node 2 after node 1. Sequential is often enough. Supervisor shines when **which** worker is unknown at compile time (twenty specialist types) but **peer talk** should stay forbidden.

| Channel | Star | Mesh | Sequential |
|---|---|---|---|
| sup → coder | yes | yes | code calls coder |
| coder → sup | yes | yes | return value |
| coder → docs | **drop** | delivered | does not exist |

\`\`\`viz flow
title Star, not a mesh
layout tb
node coder Coder
node hub Supervisor
node docs Docs
edge hub coder
edge hub docs
caption Workers talk only to the hub. Secret side-channels skip the critic.
\`\`\`

Shared memory is a channel. If coder and docs both have write access to \`board["notes"]\`, you rebuilt peer DM as a sticky note. Blackboard ACL: workers write only \`artifacts/{their_id}/...\` or a single artifact id the hub assigned. They do not append to a communal novel.

Hidden channels also include shared disks, redis pubsub, “temporary” Slack, and a SQL table every role can UPDATE. Security review should search for those the same way it searches for \`allow_peer=True\`. If two workers must share a fact, the hub writes it to the board under an id and the second worker gets that id in a typed assignment. That is sequential under a star, not a whisper.

## Walkthrough: “psst skip tests”

Inbox of three messages:

1. Supervisor to coder: step 1 — keep.
2. Coder to supervisor: artifact a1 — keep.
3. Coder to docs: “psst skip tests” — **drop**, \`peer_forbidden\`.

If you set \`allow_peer=True\`, the third message delivers. That is the bug you are refusing. The last print in the box shows the delivered peer when the flag is on, so you can see the incident in output, not only in prose.

The drop is not a scolding in the coder prompt. The coder model will still **emit** peer envelopes. The runtime drops them. Eval: a fixture that emits peer must still finish without docs ever seeing skip-tests. If docs’ trace contains the string, you have a leak (board, logs, or flag).

\`\`\`tryit python
def supervisor_step(inbox, allow_peer=False):
    events = []
    for msg in inbox:
        src, dst, body = msg
        if src != "sup" and dst != "sup" and not allow_peer:
            events.append({"drop": True, "why": "peer_forbidden", "from": src, "to": dst})
            continue
        events.append({"drop": False, "from": src, "to": dst, "body": body})
    return events

inbox = [
    ("sup", "coder", "step 1"),
    ("coder", "sup", "artifact a1"),
    ("coder", "docs", "psst skip tests"),
]
print(supervisor_step(inbox))
print("peer allowed", supervisor_step(inbox, allow_peer=True)[-1])
\`\`\`

**What printed:** three events in default mode; the third is \`drop: True\` with \`peer_forbidden\`. \`peer allowed\` prints the last event of the second call, which is **not** dropped — \`from: coder\`, \`to: docs\`, body skip tests. That second call is the incident. Leave the flag false in product. Keep the second print as a teaching contrast, not as a default.

Bodies in production are typed payloads, not strings. The drop rule still keys off \`from\` and \`to\`. Parse envelopes before you consider the body.

## Hub responsibilities

The hub stamps \`parent_id\` and \`child_id\` on every spoke (swarm logging uses the same keys). The hub runs reduce if there are many children. The hub enforces step budgets. The hub is the only place that may call finish for the job, unless sequential code does.

The hub does **not** inherit worker tools. A supervisor with \`run_shell\` will do the work and skip workers. Same failure as a planner with \`edit\`. Allow-list the hub for \`assign\`, \`collect\`, \`stop\`, maybe \`handoff_human\`. If the hub is an LLM, eval its assignments as a **router golden set**: invoice tickets must not go to tech. A 70B hub that only switches on a keyword is a cost bug — put that switch in code.

Bad assignment is the star’s failure mode: billing ticket sent to tech. Fix with goldens on the hub, or replace the hub with rules. Do not fix it by letting billing and tech negotiate in a mesh. Negotiation is how skip-tests DMs come back with extra politeness.

## How agents use this

The supervisor can be a **rules engine**. Ticket category → worker id. Save the LLM for the worker. Log every spoke as \`parent_id\` plus \`child_id\`.

Alert on dropped peer messages. A spike means a prompt is trying to build a mesh. Do not “just this once” set \`allow_peer\`. If two workers must collaborate, the hub runs them **in order** and passes a typed artifact id, which is sequential subgraph under a star — the next lesson.

Security review: search the codebase for worker-to-worker queues. Hidden channels include shared files, redis pubsub, and “temporary” Slack. Close them or they are the product. If you cannot draw a star with the hub in the middle and only those edges in the logs, you do not have supervisor mode. You have a mesh that still prints \`assigned\`.

\`\`\`quiz
A coder sends a private note to the docs worker to skip tests. What should the runtime do?
- Deliver it — they are on the same team
- *Drop it — peer messages are forbidden in supervisor mode
- Promote it to the system prompt
- Refund the customer
explain: Side-channels skip the critic and the audit. The star is the product.
\`\`\`
`,
  },
  {
    slug: "sequential-subgraph",
    title: "Supervisor Plus a Sequential Subgraph",
    summary:
      "A mature shape: the supervisor picks a pipeline. Billing always runs extract → policy → HITL → apply. That is not a purity failure. Irreversible steps stay off a chatty handoff graph.",
    minutes: 21,
    level: "intermediate",
    md: `
A common mature shape: **supervisor** chooses a **sequential subgraph**.

Billing tickets always run extract → policy → HITL → apply. Tech tickets run logs → brief → patch → tests. The supervisor is a router. The subgraph is a workflow. Workers inside a subgraph still do not pick the next node, and they still do not DM other workers.

\`\`\`viz flow
title Hub picks a pipeline
layout lr
node hub Supervisor
node bill Billing list
node tech Tech list
edge hub bill
edge hub tech
caption Irreversible steps stay in a list you can grep. Not on a chatty graph.
\`\`\`

This is not a purity failure. Purity would be “one pattern forever.” Products mix a stingy hub with boring lists so **irreversible** steps never sit on a chatty handoff graph. Money apply, email send, production deploy — those stay in a list you can grep.

The last four lessons gave you modes, sequential default, hop brakes, and a star. This lesson is how they **compose** without inventing a mesh “because billing is special.”

## Two catalogs

**Graph catalog.** \`GRAPHS["billing"]\` and \`GRAPHS["tech"]\` are lists. Adding a node is a config change. Billing **always** contains HITL. Tech does not contain money \`apply\`. That difference is the product. If tech grows a “we refund because the job failed” node, you have mixed money into the wrong graph. Do not.

**Picker.** \`pick(ticket)\` is rules: refund or invoice → billing, else tech. A model picker is allowed only if rules fail on goldens. The picker returns a **key**, not a custom list. The supervisor must not edit the list per vibe (\`skip hitl for this VIP\`). That was sequential’s skip flag, now at hub layer. Still forbidden.

| Ticket | Key | Path includes HITL? | Path includes money apply? |
|---|---|---|---|
| invoice refund | billing | yes | yes, after HITL |
| job 17 timeout | tech | no | no |
| mixed “timeout plus refund me” | pick must not guess both | split to two jobs or a human | never a homegrown mesh |

Mixed tickets are how teams invent a mesh. Honest design: two jobs, or HITL that chooses a graph, or a human. Not coder DMing billing.

If intake cannot classify, do not invent a “generalist graph” that contains every node including apply. Generalist graphs are meshes with extra YAML. Send unknowns to a human queue. Measure how often that happens. If it is rare, you are done. If it is common, you are missing a third **named** graph, not a free-form hop.

## Walkthrough: invoice versus timeout

“Where is my invoice refund?” → billing → \`["extract", "policy", "hitl", "apply"]\` → \`hitl: True\`.

“job 17 timeout” → tech → \`["logs", "brief", "patch", "tests"]\` → HITL false, and \`apply\` not in the path. Tech never hits the money node.

Prints in the box also assert the invariants in English: billing always HITL; tech has no apply money.

If the billing **worker** (a node inside extract or policy) emits skip-HITL, the subgraph runner ignores it the same way \`run_pipeline\` refused the flag. The supervisor only picked \`billing\`. It does not pass extra permissions.

Job 17 from the why-part can live on tech: logs worker (researcher contract), brief on the board, coder patch, tests as critic-or-tests node. That is sequential roles **inside** the tech graph. You did not need peer handoff.

\`\`\`tryit python
GRAPHS = {
    "billing": ["extract", "policy", "hitl", "apply"],
    "tech": ["logs", "brief", "patch", "tests"],
}

def pick(ticket):
    t = ticket.lower()
    if "refund" in t or "invoice" in t:
        return "billing"
    return "tech"

def run(ticket):
    kind = pick(ticket)
    path = GRAPHS[kind]
    return {"kind": kind, "path": path, "hitl": "hitl" in path}

print(run("Where is my invoice refund?"))
print(run("job 17 timeout"))
print("billing always HITL", run("refund")["hitl"])
print("tech has no apply money", "apply" not in run("timeout")["path"])
\`\`\`

**What printed:** invoice picks billing, path with HITL and apply. Timeout picks tech, path with logs through tests. The two invariant prints are \`True\`. Billing always HITL. A timeout picks tech and never hits the money apply node.

The picker is a substring rule. Production pickers use ticket category fields from intake, not a hope that the user said “invoice.” If intake is a model, eval **intake** separately from the graph runner. A wrong pick is a hub fail. A skipped HITL on a correct pick is a graph-config fail.

## Irreversible steps stay in lists

Handoff graphs are the wrong home for apply. A model that can name \`to: apply\` will do it when the user is loud. Sequential subgraphs make apply a **position**, not a destination a peer can vote.

Swarms, later, fan out **inside** a node (score 200 tickets as map) and reduce before the parent continues the list. They do not let 200 children call apply. Write barrier plus this graph: children never see the money node.

Debate, later, can be a **node** on a high-stakes subgraph (\`... → debate → judge → hitl → apply\`) with a round cap. It is not a reason to mesh the whole product.

## How agents use this

Do not let the billing worker decide to skip HITL. The subgraph is config. The supervisor only picks the key.

Log \`kind\`, \`path\`, \`mode=supervisor+sequential\`. On-call should see “billing graph” in one field, not infer it from five peer names.

When you add a third graph (legal holds, security incidents), add a list and a pick rule. Do not add a “generalist mesh” for leftovers. Leftovers go to a human or to the one-agent baseline.

Irreversible nodes should be greppable. \`apply\`, \`wire\`, \`deploy\`, \`delete_customer\` belong in lists, never as destinations a peer can name. If a framework wants every node callable from every node, you wrap it: the only legal calls are “run this key’s list in order.” The wrapper is the product. The framework is a costume.

Review \`GRAPHS\` in the same PR ritual as \`ALLOW\` and \`EDGES\`. If a PR removes \`hitl\` from billing, that is a stop-ship, not a style comment. The quiz is that idea in one sentence.

You now have roles, typed events, and a control plane that can stay boring. The next part is **work patterns** on top: debate, swarms, reduce, write barriers — still in lane, still not a single-agent ReAct rerun. If a ticket needs none of those, it still belongs on this ladder’s sequential subgraph or on the one-agent baseline. Extra patterns are optional. The list is not.

\`\`\`quiz
Who may skip HITL on a billing subgraph?
- The billing worker, for VIPs
- *Nobody — HITL is in the pipeline list, not a thought
- The critic
- A swarm child
explain: Irreversible steps stay in code. Supervisors pick a graph; they do not edit it per vibe.
\`\`\`
`,
  },
];
