import type { RawLesson } from "@/lib/types";

export const agentsShip: RawLesson[] = [
  {
    slug: "traces",
    title: "Traces You Can Debug",
    summary:
      "Every step logs assembler budget, raw model text, parse result, tool, observation, and stop reason.",
    minutes: 20,
    level: "advanced",
    md: `
If you cannot answer “why did it refund?”, you do not have an agent — you have a demo.

A **trace** is the movie of the loop: one row per step, enough to replay, redacted enough to store. Prompting wrote the text. Here you **store the movie**. Operators debug the loop. Customers see an answer. Those two UIs must not be the same document.

Redact secrets. Keep thoughts out of the customer UI. Keep them in the operator UI. Traces are not “a privacy bug by definition.” They are how you operate. Privacy is redaction and access control, not deleting the only record of a refund.

This track is not the eval course. You still log structured rows now so later you can replay with a stubbed model. If you skip the movie, you will not have something to replay.

## A row per step

Each row should have:

- run_id, step
- tools advertised (assembler)
- raw model text (truncated)
- parse ok / error
- tool name and args (redacted)
- observation (truncated)
- stop reason or null
- phase / specialist role if you have them
- freeze hash if HITL

\`\`\`viz strip
title One row per step
chip Tools
chip Raw
chip Parse
chip Tool
chip Obs
chip Stop
caption Operators debug this movie. Customers see an answer. Redact secrets.
\`\`\`

If you only store the final sentence the user saw, you cannot answer “why.” If you store the full production database, you built a data leak, not a trace. Truncate raw and obs. Cap is a budget, same as the assembler.

## Truncate on purpose

Raw text is capped so traces do not become a second furnace. Observations too. Full blobs live in object storage keyed by run_id if you truly need them, with a tighter ACL. The operator table should be scannable: step 1 search, step 2 finish success.

The live box caps at 40 characters so you see the policy. Production might cap at 2k. Infinite is how your log system bills more than the model.

## Redact

API keys, bearer tokens, raw card numbers, passwords: never in traces. Tool args may contain PII — hash or drop those fields. Policy: a denylist of keys (\`authorization\`, \`password\`, \`ssn\`). If you cannot store it, you also cannot paste it into the next assemble. The assembler and the tracer share the redaction function.

Thoughts: operator yes, customer no. Some vendors forbid showing chain-of-thought. Store if allowed; still hide in product UI.

## Operator vs customer

Customer: answer, maybe a short “I looked up ticket T1.” Operator: advertised tools, parse_ok, name, obs stub, stop. When a refund happens, the operator row must show the blessed args and the freeze hash, not only “Refund sent.” Runtime log is truth (tools track). Trace is that log in loop order.

## Replay

Replay means: load rows, stub the model to return the same raw (or skip to parse), stub tools, assert the next decision. You need raw or the parsed decision. You need advertised tools to know the assembler was in play. You do not need the full DB.

A stubbed refund on replay is a checkpoint lesson. The trace tells you which step. Without step-indexed rows, replay is fan fiction.

## Count reasons later

Stop reasons, parse errors, illegal finish, thrash, circuit_open: enums you can count. This track only needs them on the row. Do not wait for an eval harness to start logging. If the field is missing, you cannot count it.

## What to redact, what to keep, and how rows chain

Keep: run_id, step, advertised tool **names** (not 40 full schemas), parse error codes, tool name, redacted args (drop secrets, keep order_id and amount if policy allows), obs kind and short body, stop enum, phase, role, freeze hash. Drop: bearer tokens, passwords, raw cards, full HTML, untruncated thoughts in the customer export.

Args redaction is a denylist of keys plus a max string length. If you drop amount, you cannot debug HITL. If you keep Authorization, you shipped a secret. Choose field by field. The same function should run before assemble when obs go back to the model.

Rows chain by run_id + step. Missing step 3 with 1,2,4 present is a bug in log_step, not in the model. Operators should notice holes. Parallel tool calls (if you add them) need ids on the row so obs can land out of order. Classic ReAct: one row, one action.

Customer export is a different document: final answer, maybe citations, maybe “we looked up T1.” It is not a truncated operator trace. Mixing them is how thoughts leak. Operator UI is gated. Retention: traces live long enough to debug and to replay; they are not eternal chat. Prod policy comes later; this track needs you to **have** a row.

When a run refunds, you should find one row with name refund, parse_ok true, freeze hash matching the HITL ticket, obs ok. If you cannot, the movie is incomplete and “why did it refund?” has no answer.

## Common mistakes

- Final sentence only.
- Infinite raw dumps.
- Secrets in rows.
- Thoughts in the customer UI.
- No run_id / step.
- Trace = production DB dump.
- Skipping traces for “privacy” without redaction.

\`\`\`tryit python
TRACE = []

def log_step(step, advertised, raw, parsed, obs, stop):
    TRACE.append({
        "step": step,
        "tools": list(advertised),
        "raw": raw[:40],
        "parse_ok": "ok" in parsed,
        "name": parsed.get("name"),
        "obs": str(obs)[:40],
        "stop": stop,
    })

log_step(1, ["search", "finish"], "CALL search {}", {"ok": True, "name": "search"}, {"hits": 2}, None)
log_step(2, ["search", "finish"], "CALL finish {}", {"ok": True, "name": "finish"}, {"final": "ok"}, "success")
print("rows", len(TRACE))
print("step1 parse", TRACE[0]["parse_ok"], "name", TRACE[0]["name"])
print("step2 stop", TRACE[1]["stop"])
print("raw capped", len(TRACE[0]["raw"]) <= 40)
\`\`\`

Two rows. Success is on step 2. Raw text is capped so traces do not become a second furnace. Step 1 has parse_ok and name search. Advertised tools are stored as a list copy. That copy is how you debug “why did it think refund existed?” — look at tools on that row, not at today’s code.

Add a parse-fail row in your head: parse_ok false, name None, stop maybe null, obs the error. Still a row. Missing rows are how “the model was weird” tickets start.

## How agents use this

This is how you debug and, later, how you eval: replay traces with a stubbed model. Prompting wrote the text. Here you **store the movie**.

Tool thrash next is a stop reason you will want on this row. Handoff too. If the movie cannot say \`cannot: tool thrash\`, you will argue about vibes in the queue.

\`\`\`quiz
What belongs in a debug trace?
- Only the final sentence the user saw
- *Per-step advertised tools, raw model text, parse, tool, observation, stop
- The full production database
- Nothing — traces are a privacy bug by definition
explain: Operators debug the loop. Redact secrets; do not skip the movie.
\`\`\`
`,
  },
  {
    slug: "tool-thrash",
    title: "Detect Tool Thrash",
    summary:
      "The same tool with the same args three times is a bug. Stop, do not pay for a loop inside the loop.",
    minutes: 19,
    level: "advanced",
    md: `
**Thrash** is when the agent calls \`search\` with the same query again and again, or flips between two tools with no new observation.

Detect it in the loop. This is cheaper than a smarter model. Repeated identical calls are a stop, not a personality quirk. If you wait for the step budget, you still paid for the duplicates. Thrash is an early, specific stop: \`cannot: tool thrash\`.

\`\`\`viz bars
title Same search, three times
bar Search 1,1,0
bar Search 2,1,0
bar Search 3,1,1
caption Three identical calls stop the run. Do not pay for a fourth.
\`\`\`

Hash \`(name, stable_args)\`. If the same hash hits N times (three is a decent default), stop. Identical args after a failed parse still count if you executed or attempted the same call. If you did not execute, counting parse-fail retries as thrash is optional — they should already hit the parse-repair cap. Do not leave a hole where execute-fail retries are free.

## Same args, same name

Canonicalize args: sort keys, maybe drop noise fields, JSON dump. \`{"q": "oom"}\` and the same dict built in reverse hash the same. Unstable extra keys (timestamps the model invents) can hide thrash — strip known junk or include them so extras still count as different **if** they should. Prefer stripping junk the schema does not allow (parser).

Three identical searches stop. Mixed queries do not. That is the live box.

## Ping-pong

A slightly richer detector counts an alternating pair: search A, search B, search A, search B with no new information. You can hash a window of two names. This lesson’s box is the identical-call detector. Ship that first. Ping-pong is a sequel. Both belong in traces as stop reasons.

## Why it happens

Bad assembler: the last obs was truncated, so the model searches again. Bad memory: amnesia. Bad prompt: “always search first.” Bad tools: empty hits, model retries the same q. Circuit breaker open and the model retries anyway — the executor should return circuit_open and thrash should still count.

Fix the cause, but **stop the run** now. Do not hope the fourth search is lucky. Do not finish with a guessed answer to escape thrash. That is a lie, same as inventing success at the step cap. Return \`cannot: tool thrash\` or handoff with that why.

## Pair with breakers and budgets

Breakers stop a flaky host. Thrash stops a healthy host used stupidly. Budgets stop everything eventually. You want all three. Thrash N should be **less than** max steps so it can fire first.

Retries: a timeout retry with the same args might be allowed once (error recovery). Count it. The third identical is thrash even if the first two were timeouts. Tune N if one retry is policy.

## Log it as itself

Do not log thrash as generic budget. Evals later will want the count. Operators want to grep thrash. Put the key and n on the row.

## Canonical keys, ping-pong, and empty observations

Canonical keys must ignore insertion order and, for nested args, recurse. \`str(sorted(args.items()))\` fails on nested dicts (order inside, unhashable). Prefer JSON dumps with sort_keys for production. Strip fields the schema does not allow **before** hashing so the model cannot dodge thrash by adding \`nonce\`. If nonce is required by a bad schema, fix the schema.

Empty or near-empty observations that lead to the same call are still thrash: search, empty hits, search same q. The model is not “trying a new strategy.” Count it. If you want one retry on empty hits, that is a named policy (\`empty_retry: 1\`) and the second empty is thrash. Do not leave it implicit.

Ping-pong: A then B then A then B with no new obs fields. Detect a repeating pair in a short window. Ship identical-call first (this box). Add pair detection when you see it in traces. Flipping search and get_ticket with **new** ids is not ping-pong. Flipping the same two calls with the same args is.

Finish is not a way out: if you are one short of the thrash cap, the model may emit finish with a guess. Observe-before-finish plus grounded critic should reject that. Thrash stop should still win if the last three events were identical searches even if finish is sitting in the mouth — you already know the loop is sick.

Reset counts on a **new** hash, not on a new thought. Thoughts always look new.

Finish is also not a way to **reset** counts: a finish that fails the observe gate, then another identical search, still increments the same key. Counts live on the run, in state, so jobs resume them. RAM-only counters die with the process and you get three more searches after a crash. Put \`thrash_counts\` on typed state or recompute from the event list each step (the box recomputes from the list — that is the replay-friendly form).

## Common mistakes

- Fourth search “just in case.”
- Finish with a guess to escape the loop.
- Uncanonical args so hashes never match.
- N equal to max steps (never fires first).
- Counting only successes, not failed identical calls.
- Treating thrash as a model quality metric only — it is a loop bug.

\`\`\`tryit python
def thrash(events, limit=3):
    counts = {}
    for name, args in events:
        key = name + "|" + str(sorted(args.items()))
        counts[key] = counts.get(key, 0) + 1
        if counts[key] >= limit:
            return {"stop": "cannot: tool thrash", "key": key, "n": counts[key]}
    return {"stop": None, "n": max(counts.values()) if counts else 0}

print(thrash([
    ("search", {"q": "oom"}),
    ("search", {"q": "oom"}),
    ("search", {"q": "oom"}),
]))
print(thrash([
    ("search", {"q": "oom"}),
    ("search", {"q": "disk"}),
    ("finish", {"text": "x"}),
]))
\`\`\`

Three identical searches stop with n 3 and a key you can log. Mixed queries plus finish do not stop; n is 1. \`sorted(args.items())\` is the poor person’s canonical form. JSON dumps with sort_keys is better for nested args. Keep the idea: stable key, count, cap.

Call \`thrash\` after each execute (or each parse of a tool). Do not wait until the end of the run. Early stop saves tokens.

## How agents use this

Pair with circuit breakers. Thrash is a healthy agent stuck on a bad assembler. Log it as its own stop reason so you can count it.

Handoff can use why=\`thrash\` and tried=the repeated key. The packet should not say “crash.” Next lesson.

\`\`\`quiz
The agent searched the same query three times. What should the loop return?
- A fourth search
- *cannot: tool thrash
- finish with a guessed answer
- Open a new browser tab
explain: Repeated identical calls are a stop, not a personality quirk.
\`\`\`
`,
  },
  {
    slug: "handoff",
    title: "Handoff Is a First-Class Stop",
    summary:
      "Unknown, unsafe, or over-budget work goes to a human or another system with a packet, not a shrug.",
    minutes: 20,
    level: "advanced",
    md: `
**Handoff** is not a crash. It is a stop with a packet:

- Why (unknown intent, policy, budget, parse fail, thrash, circuit, banned click)
- What you tried (trace ids, tool names)
- Frozen args if a tool was pending
- What the human should do next (one form, not a novel)

\`\`\`viz flow
title Handoff is a packet
layout lr
node loop Loop
node pack Packet
node human Human queue
edge loop pack
edge pack human
caption Why, what you tried, any frozen args. A shrug is how tickets die.
\`\`\`

The user-facing message is short. The operator packet is complete. A shrug (“ask a human”) is how tickets die. The model’s chain of thought as the ticket body is how tickets become unread novels. A new infinite agent as the destination is how you recurse the furnace.

Unknown, unsafe, or over-budget work goes to a human or another system **with a packet**. Wire handoff to the same queue as HITL. Waiting_human has a pending tool. Handoff may not. Same inbox. Same run_id.

## Why is an enum

Use a small set: \`unknown_intent\`, \`policy\`, \`budget\`, \`parse_fail\`, \`thrash\`, \`circuit_open\`, \`banned_click\`, \`guard_failed\`. The router’s unknown kind is \`unknown_intent\`. Amount over cap is \`policy\`. Operators filter. Models writing a paragraph why is extra; keep the enum as the field that matters.

Do not use \`crash\` in the user message. The user is not blocked on a stack trace. They are waiting on a person. The live box’s user_msg says that. “crash” in the user string is a test that should be false.

## Tried

List what you tried: router, search, search (thrash will also fire). Trace ids beat dumping rows into the ticket. The packet points at the movie. The operator opens the trace. If tried is empty, you handed off before the loop — still valid for unknown_intent at the router.

## Pending freeze

If a tool was pending (HITL-ish policy handoff), include frozen args. Deny/approve can proceed. If there is no pending tool, pending is None. Do not invent a refund to attach. Do not drop a real freeze because the why was budget.

## Next action is a form

“Refund 40 on 99, approve or deny” is a next action. “Please look into this” is a shrug. One form. Buttons. Not “write the next ReAct thought.” HITL lesson again. Handoff without a form still needs a why and a tried so the human can make a form.

## Destinations

Default destination: human queue. Next track: another specialist, still with a packet, still with a stop. Do not start a second unbounded loop as the handoff. Packet in, specialist runs with its own budget, packet out. If you cannot name the destination, it is humans.

Do not handoff to computer use as a promotion. Do not handoff to exec. Do not handoff to “be clever.”

## First-class in stop

\`should_stop\` already returned \`handoff\`. Honor it. Persist the packet on the job. Wake_when is \`human:queue\`. The loop is done until a person (or a later specialist) resumes. That is success of **control**, not success of the user goal. Do not mark the user goal done.

## Packet shape, user copy, and resume

A packet is JSON you can store: \`stop\`, \`why\`, \`tried\`, \`pending\`, \`run_id\`, \`step\`, \`user_msg\`, maybe \`next_form\` (fields the human should fill). \`tried\` is a short list of names or step ids, not the full TRACE array. Link the trace. Pending is the freeze object or null. If you embed the live args dict, you failed freeze-payload again — copy.

User copy is one or two sentences: a person will take this; you are not blocked on the model. No stack traces. No “the AI crashed.” No chain of thought. Operators get why plus tried plus a button.

Resume from handoff is not always execute. Unknown_intent resume might be a human-typed kind (billing) that re-enters the router with a **human** decision, not a model guess. Policy resume might be deny (stop) or approve (HITL path). Budget resume might be “raise cap” by an operator flag — that flag is a product choice, not the model asking for one more search. Default: do not raise caps from the packet without a person.

Do not chain handoff to a new agent with no budget. Do not chain to computer use. Do not chain to exec. Next track’s specialist destination still receives this packet and still stops. If the destination cannot honor stop, it is not a destination.

Handoff is how the router’s poem path, the breaker’s open circuit, the thrash cap, and the banned Pay cell all leave the loop honestly.

The packet is a stop you can **count**. Traces get \`stop: handoff\` plus \`why\`. Support gets the short user_msg. Billing ops gets the form. If any of those three documents is missing, you will either leak thoughts to customers or starve operators. Build the three from one function, like the live box, and persist it on the job row next to wake_when.

## Common mistakes

- User message says crash.
- Thought dump as the ticket.
- No why enum.
- Dropping frozen args.
- Destination = new infinite agent.
- Shrug with no tried.

\`\`\`tryit python
def handoff(why, tried, pending=None):
    return {
        "stop": "handoff",
        "why": why,
        "tried": list(tried),
        "pending": pending,
        "user_msg": "A person will take this. You are not blocked on the model.",
    }

print(handoff("unknown_intent", ["router"], None)["stop"])
print(handoff("policy", ["billing"], {"tool": "refund", "amount": 40})["pending"])
print("crash" in handoff("budget", ["search", "search"], None)["user_msg"])
\`\`\`

Unknown intent hands off with no pending tool. Policy handoff keeps frozen refund args. The user message does not say “crash.” The last print is False. \`tried\` is copied so later mutation of the caller’s list does not rewrite the packet — same instinct as freeze.

Stop is the string \`handoff\`, a first-class reason next to success and budget. Count it in traces.

## How agents use this

Wire handoff to the same queue as HITL. Multiagent (next track) is another destination: another specialist, still with a packet, still with a stop.

When-not-to-agent is next: sometimes you should not have started this loop. Handoff is how you leave a loop you should not finish. Not starting is cheaper.

\`\`\`quiz
What should a handoff include?
- Only “ask a human”
- *Why, what you tried, and any frozen pending args
- The model’s chain of thought as the ticket body
- A new infinite agent
explain: Handoff is a packet. A shrug is how tickets die.
\`\`\`
`,
  },
  {
    slug: "when-not-to-agent",
    title: "When Not to Agent",
    summary:
      "If a checklist, a form, or a search box will do, ship that. Agents are for branching work — and they are next to multiagent, not instead of a script.",
    minutes: 22,
    level: "advanced",
    md: `
An agent is the right shape when:

- The path **branches** on observations you cannot hard-code
- Tools are real and permissioned
- You can tell what “done” looks like
- Failure has a budget and a handoff

An agent is the wrong shape when:

- The path is a **fixed checklist** (invoice: validate, tax, send)
- One search box plus a template email would do
- You cannot say what “done” looks like
- The only tool is “be clever in English”

\`\`\`viz flow
title Cheapest machine first
layout lr
node script Script
node form Form
node search Search
node agent Agent
edge script form
edge form search
edge search agent
caption Ship a checklist if the path is fixed. Agents are for branching work.
\`\`\`

A workflow skips optional steps **in code**. An agent that “might skip validation” is a bug with a marketing name. If a checklist, a form, or a search box will do, ship that. Agents are for branching work — and they sit next to the multiagent track, not instead of a script.

This is the last lesson of the loop track. You now have six parts, ReAct vs plan, reflection, typed state, HITL, jobs, traces, thrash, and handoff. Use them when the work branches. Do not use them as a status symbol.

## Fixed paths are workflows

Validate, then tax, then send. Always. That is a workflow. Skip-validation is a **flag in code**, not a thought. The live box runs a list of step names. There is no model. There is no chance the thought forgets validate unless you set the flag.

Could you wrap that list in ReAct? Yes. Would the model skip validate on a Tuesday? Yes. That is not flexibility. That is a regression. Flexibility you want belongs in \`if skip_validation\` reviewed in git.

A checklist with **no tools** is also not an agent. It is a script. Adding a model to name the next checklist item is a fancy \`for\` loop with extra failure modes.

## Branching work

Debug prod: logs might show OOM or disk or permissions. The next tool depends on the observation. You cannot hard-code a 20-step plan that stays true. ReAct (or plan-and-replan) earns its keep. Tools exist. Done can be “root cause string plus a cited log line.” Budget and handoff exist. That **may** be an agent.

If there are no tools, you have a chatbot. Templates and retrieval might still beat a loop. If you cannot describe done, you cannot stop except on budget — you will ship a furnace that talks.

## Forms and search boxes

A refund form with order id and amount, plus policy in code, plus HITL, does not need a loop to fill itself. A search box over docs does not need ReAct to query once. Add an agent when the user intent is messy **and** tools must be sequenced in ways you cannot form-design. Sequence you can form-design should be a form.

Computer use on the accounting GUI to send invoices is the wrong costume for a fixed path. A swarm of invoice agents is the next track’s temptation. Both are in the quiz as traps.

## Cheapest machine that works

Order of operations:

1. Script / workflow
2. Form + policy code
3. Search + template
4. Router + specialist + verifier (still one runtime)
5. Full ReAct or plan-and-execute loop
6. Multi-agent when specialists must talk (next track)

Skip to 5 because of a blog post and you will debug six parts you did not need. Evals and production serving come later; they do not make a workflow into an agent. They make an agent measurable and shippable **if** it should exist.

## Skip validation is a flag

The invoice function takes \`skip_validation=False\`. Review that flag. Do not let a thought set it. If a model can skip validate, you did not have a workflow. You had an agent pretending to be finance.

## You still need the loop skills

When you **do** need an agent, you now have the pieces: assembler budget, fail-closed parser, stop, ReAct, observe-before-finish, plans as data, grounded critic, typed state, machines, HITL freeze, jobs, checkpoints, breakers, traces, thrash, handoff. Missing any of them is how a justified agent still becomes a furnace.

When you do not need an agent, those skills still help: parsers fail closed on forms, jobs wait on email, traces debug workflows. The costume is optional. The discipline is not.

## Branching vs messy vs “the model will skip it”

Branching means the **observation** picks the next tool in a way you cannot write as a fixed list: logs show OOM vs disk vs auth, and those three paths use different tools. Messy language (“this is busted”) is not enough by itself — a form with a category dropdown might still win. Use an agent when messy language **and** branching tools coincide, and you can name done.

“The model will skip optional steps we forgot to code” is not a feature. Optional steps belong in the workflow as flags or branches **you** wrote. If validation is optional for a class of invoices, \`skip_validation\` is reviewed. If it is never optional, the list is always three long. ReAct that skips tax because the thought was in a hurry is not agility.

No tools: a template, retrieval, or a single search box. A loop that only emits English is a chatbot with a step counter. No done predicate: you will only stop on budget, and then you will be tempted to guess. That is the furnace.

God-loop vs router: even when you need an agent, start with router + small specialist + verifier, not forty tools. Multi-agent is when those specialists must talk, not when you wanted a fancier invoice script.

If you are unsure, ship the workflow and log where humans branch. Those logs are how you learn whether a loop would help. Do not start the loop to discover the branches in production money paths.

## Common mistakes

- ReAct over a fixed checklist.
- Agent with no tools.
- Agent with no done predicate.
- Skip validate via thought.
- Swarm as the first architecture.
- Computer use on a stable GUI flow.

\`\`\`tryit python
def workflow_invoice(row, skip_validation=False):
    steps = ["validate", "tax", "send"]
    if skip_validation:
        steps = ["tax", "send"]
    out = []
    for s in steps:
        out.append(s)
    return out

def agent_should_run(goal, tools, has_eval):
    if not tools:
        return False, "no tools — use a template"
    if goal == "fixed_invoice":
        return False, "checklist — use a workflow"
    if not has_eval:
        return False, "cannot score done"
    return True, "branching work"

print("invoice", workflow_invoice({"id": 1}))
print("skip in code", workflow_invoice({"id": 1}, skip_validation=True))
print(agent_should_run("fixed_invoice", ["send"], True))
print(agent_should_run("debug prod", [], True))
print(agent_should_run("debug prod", ["logs", "finish"], True))
print(agent_should_run("be clever", ["search"], False))
\`\`\`

Invoice is a workflow. Skip-validation is a flag in code, not a thought. Debug-prod with tools and a way to score done **may** be an agent. No tools, or no done predicate, should not. Read the six prints: three-step list, two-step list, then four tuples of False/True with reasons. The True is debug prod with logs and finish.

\`has_eval\` here means “you can say what done looks like,” not the later eval track. A predicate in \`should_stop\` counts. A vibe does not.

## How agents use this

Ship the cheapest machine that works. If you still need an agent, you now have the six parts, ReAct vs plan, reflection, typed state, HITL, jobs, and traces.

**Next track:** multiagent — when specialists must talk to each other, not when you wanted a fancier loop.

\`\`\`quiz
A process is always validate, then tax, then send. What should you ship?
- A ReAct agent that might skip validate
- *A workflow (checklist) in code
- Computer use on the accounting GUI
- A swarm of invoice agents
explain: Fixed paths are workflows. Agents are for branching work with tools and a done predicate.
\`\`\`
`,
  },
];
