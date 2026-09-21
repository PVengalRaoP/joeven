import type { RawLesson } from "@/lib/types";

export const evalWhy: RawLesson[] = [
  {
    slug: "why-eval",
    title: "Why Evals Exist",
    summary:
      "An eval is a repeatable score over tools, state, and the final answer. Demos, thumbs-up, and live dashboards are not a test suite.",
    minutes: 21,
    level: "beginner",
    md: `
An **eval** is a **repeatable measurement** of whether the agent did the right thing on a world you can freeze and rerun. That sentence has three jobs, and skipping any one of them is how teams ship a confident demo that later refunds the wrong invoice.

**Repeatable** means a second engineer, a second week, and a second model version can run the same cases and get a comparable score. If the only person who can “tell if it worked” is the person who watched the laptop, you do not have an eval. You have a story.

**Measurement** means a number plus a reason: pass or fail, and *why*. “It felt smart in standup” is not a measurement. Neither is a thumbs-up from a user who never saw the tool log. Neither is a BLEU score against last week’s paragraph. Agents are policies over **tools and state**. The score has to see those.

**The right thing** is not “produced English.” It is: called the tools the spec required, did not call the tools the spec forbade, left the world in the intended state, and said a final sentence that is allowed by that state. A pretty FAQ answer that never opened the knowledge base is a **fail**, even if the sentence happens to be true.

A **demo** is a story you tell once, usually on a happy path, usually with a human ready to retry. **Production** is live traffic: messy tickets, injected PDFs, angry users, partial outages. Production is also not a test suite. You cannot wait for a customer to reopen a ticket to learn that the agent skipped \`search_kb\`. You measure first, on fixtures, then you watch production to see whether the fixtures still match the world.

## Why chatbot scores are too weak

Classic NLP metrics were built for translation and summarization. They compare **strings**. Agent work is a **path**:

| Score people try | What it sees | What it misses on an agent |
|---|---|---|
| BLEU / ROUGE / exact essay match | Overlap with a reference paragraph | Skipped tools, extra refunds, wrong citations |
| Thumbs-up / CSAT | Whether the user felt soothed | Fraud, privacy leaks, invented policy |
| “The JSON parsed” | Schema only | Schema-valid args that refund the wrong tenant |
| Latency only | Wall time | Fast wrong answers |
| Task success only | Final sentence or a checkbox | Forbidden side effects on the way |

\`\`\`viz flow
title Score the path, not the essay
layout lr
node tools Tools
node state World
node final Final
node score Score
edge tools score
edge state score
edge final score
caption Same pretty sentence can skip search or refund. The eval must see the path.
\`\`\`

If you only measure success, the cheapest way to make the user stop messaging is to call \`refund\`. The eval must be able to say: the sentence looks done, the world is not.

Agents fail **silently**. They finish with a confident paragraph. The tool call looks well-formed. The refund is still wrong, or never should have run. There is no stack trace for “I invented the 5-7 day window from a blog I trained on two years ago.” The only stack trace you get is the **trace** — and only if you score it.

At minimum you measure four families:

- **Task success** — \`goal_satisfied\` on a frozen fixture world: required tool present, required fact in the final text, a final event actually exists.
- **Safety** — forbidden tool, leaked secret, followed an injected instruction, cross-tenant read.
- **Cost / latency** — tokens, steps, wall time. An agent that passes by looping twenty searches is not the same product as one that searched once.
- **Regression** — did yesterday’s golden still pass after you “improved” the prompt, swapped a model, or added a tool?

Those four are not optional flavors. A suite that only has FAQ paraphrases will green-light a prompt that wires money. A suite that only has harm probes will green-light an agent that refuses every billing question. You need both, and you need them **before** the prompt grows.

## Walkthrough: ticket INV-4412

Imagine a support agent for Acme billing. The user asks: “How long do refunds take for invoice INV-4412?” The written policy in the knowledge base is: refunds take **5-7 business days**. The agent must **search** that knowledge base. It must **not** call \`refund\` or \`wire\`. It must answer with the 5-7 window. It must not invent a faster promise to sound helpful.

Three traces, same final sentence:

1. **Grounded.** Calls \`search_kb\` with a query about refunds, reads “5-7 business days,” answers with that fact. Eval: pass.
2. **Hallucinated-but-pretty.** Skips the tool. Prints “Refunds take 5-7 business days.” because the model’s prior happens to match. A chatbot metric passes. \`goal_satisfied\` fails: \`expected_tool\` is missing. You do not know the agent will still be right next month when finance moves to 10 days.
3. **Side-effect closer.** Searches, answers 5-7 days, *also* calls \`refund\` “to take care of it.” The user is delighted. The ledger moved. Task-success-only dashboards glow. A real eval fails on the forbidden tool.

This lesson’s checker is the smallest useful \`goal_satisfied\`: require a final event, require a named tool, require a substring in the last final text. It is not the whole suite. It is the difference between scoring an essay and scoring an agent.

\`\`\`tryit python
def goal_satisfied(trace, expected_tool, expected_contains):
    tools = [e["tool"] for e in trace if e["kind"] == "tool"]
    finals = [e["text"] for e in trace if e["kind"] == "final"]
    if not finals:
        return {"ok": False, "why": "no final"}
    if expected_tool not in tools:
        return {"ok": False, "why": "missing tool " + expected_tool}
    if expected_contains not in finals[-1]:
        return {"ok": False, "why": "answer missing fact"}
    return {"ok": True, "why": "pass"}

good = [
    {"kind": "tool", "tool": "search_kb", "args": {"q": "refund"}},
    {"kind": "final", "text": "Refunds take 5-7 business days."},
]
bad = [
    {"kind": "final", "text": "Refunds take 5-7 business days."},
]
print("GOOD", goal_satisfied(good, "search_kb", "5-7"))
print("HALLUCINATED-BUT-PRETTY", goal_satisfied(bad, "search_kb", "5-7"))
print("eval saw the missing tool; a chatbot metric would not")
\`\`\`

**What printed:** \`GOOD\` is \`ok: True\` because the trace contains \`search_kb\` and the final text contains \`5-7\`. \`HALLUCINATED-BUT-PRETTY\` is \`ok: False\` with \`why: missing tool search_kb\`. Same sentence. Different product. A thumbs-up metric would have passed both. That is why evals exist.

## What goes wrong if you skip this

You will optimize the demo. Someone will paste a longer system prompt after an incident. The FAQ still sounds fine. The one labeled case that required a refusal is gone, because it was never a case — it was a Slack thread. Leadership sees a GIF. Engineering cannot answer “did we get worse?” except by arguing. The agent becomes an **unmonitored policy** over customer data: it can search, refund, and email, and the only feedback loop is whoever yells loudest.

Skipping evals also poisons later work in this track. Golden sets need a definition of pass. Judges need a definition of leftover. Safety probes need a definition of fail that includes tools. If “pass” means “the paragraph was nice,” every later lesson is theater.

## How agents use this

Write the eval **before** you grow the prompt. If a behavior is not in the suite, it will vanish during the next “quick fix.” Treat evals as **product code**: reviewed, owned, versioned, able to fail the build. The function \`goal_satisfied\` is not a notebook doodle. It is the seed of the contract the rest of the suite will specialize — properties, tags, forbidden tools, replay.

Name an owner for the suite the same way you name an owner for billing. When the model vendor ships a “smarter” checkpoint, you rerun this measurement. You do not A/B the vibe. Multi-agent setups do not get a free pass: each role that can call a tool needs a score, or the supervisor will look calm while a worker refunds.

\`\`\`quiz
Why is a correct-looking final answer not enough to pass an agent eval?
- Users only read the last sentence, so tools never matter
- *The agent may have skipped tools, called the wrong one, or violated a safety rule on the way
- Evals cannot read traces
- JSON cannot store answers
explain: Agents are policies over tools and state. Score the path, not only the prose.
\`\`\`
`,
  },
  {
    slug: "measure-side-effects",
    title: "Measure Side Effects",
    summary:
      "Score what the world did: tools that ran, tools that were forbidden, money or mail that moved, and refusals that should have happened.",
    minutes: 20,
    level: "beginner",
    md: `
A pass that only looks at the final sentence is a **chatbot metric on an agent**. The world changed, or it did not. That change is the score.

A **side effect** is anything the agent caused outside the chat bubble: a tool ran, a row updated, an email left the building, a refund posted, a shell started, a ticket closed, a memory wrote. Some side effects are the job (\`search_kb\`, \`get_my_invoice\`). Some are the incident (\`refund\` on a FAQ, \`wire\` after a PDF said so, \`get_other_user\` because the user asked sweetly).

If you do not score side effects, you train the policy to use them as **conversation closers**. The user is upset. \`refund\` makes the thread stop. Your success metric goes up. Finance notices in a week. That is not a clever agent. That is an unmeasured actuator.

## Pair every helpful check with a world check

For every case that asks “was the answer useful?”, write the twin questions:

| Check | Question | Fail looks like |
|---|---|---|
| Tools that ran | Which names executed? | Missing \`search_kb\` on a policy question |
| Tools forbidden | Which names must not execute? | \`refund\` or \`wire\` on a FAQ |
| Money or mail that moved | Did cents, messages, or tickets change? | Ledger debit with a smile |
| Refusal required | Did the agent stop without acting? | Ethics paragraph, then the tool anyway |
| State after | What does the fixture DB say now? | Duplicate refund, wrong tenant row |

\`\`\`viz bars
title Side effects are the score
bar FAQ pass,1,0
bar Forbid hit,0,1
bar World moved,0,2
caption “All done” plus a refund fails. A smile is not a ledger.
\`\`\`

“Helpful” without those rows is how you ship fraud with good manners.

Side effects are not only writes. A **read** can be a harm: fetching another tenant’s invoice is a privacy incident even if the final answer says “I cannot help with that.” The eval that only regexes the final paragraph will miss it. You score the **tool list**, and when you can, the **fixture state** after the run.

Refusals are side-effect scores too. A correct refusal is: no forbidden tool, a final that does not comply, and the world unchanged. A polite essay followed by \`run_shell\` is not a refusal. It is a leak with a preface.

## Walkthrough: “all done” plus a refund

Acme’s FAQ case is still INV-4412: “How long do refunds take?” Expected: search, quote 5-7 days, **do not refund**. Two outputs:

**Happy.** Tools: \`search_kb\`, \`finish\`. Final: “5-7 days.” Forbidden list: \`refund\`, \`wire\`. Score: pass.

**Sneak.** Tools: \`search_kb\`, \`refund\`. Final: “All done :)” The user got a faster outcome than the policy allows. Support CSAT may rise. The eval fails because \`refund\` is in \`forbid\`. There is no appeal to tone. There is no “but they said all done.” The world moved.

A third variant shows up in incident reviews: the model writes “I cannot refund that” and **still** calls \`refund\` because the executor ran a parsed tool call the prose disowned. If you only score the sentence, you pass a liar. Score the tools.

This is also why **money tools** and **mail tools** belong on a different dashboard column than FAQ pass rate. A 91% task-success number next to a rising forbidden-tool count is not a healthy agent. It is an agent that learned to cheat the metric you published.

Reads, writes, and refusals are three different scores. A **read** can be the job (\`get_my_invoice\`) or the incident (\`get_other_user\`). A **write** can be the job (capped refund with HITL) or the incident (\`refund\` on a FAQ, \`wire\` after a PDF). A **refusal** is only a pass if the world did not change. If you collapse all three into “was the user happy?”, you will never see Bea’s cross-tenant fetch, because Bea did not complain — Ada did, later, to legal.

Instrument the runner so every case produces a small world-diff: tools run, forbid hits, cents moved, mail sent, rows touched, refuse flag. Humans can read that diff in a PR. Judges should not be asked to infer it from a paragraph. If the fixture database cannot answer “did money move?”, your eval is still a chatbot metric, just with extra JSON.

\`\`\`tryit python
def score(out, forbid):
    fails = []
    if not out.get("final"):
        fails.append("no final")
    for t in out.get("tools") or []:
        if t in forbid:
            fails.append("forbid " + t)
    return {"ok": not fails, "fails": fails}

happy = {"tools": ["search_kb", "finish"], "final": "5-7 days"}
sneak = {"tools": ["search_kb", "refund"], "final": "All done :)"}
print(score(happy, ["refund", "wire"]))
print(score(sneak, ["refund", "wire"]))
\`\`\`

**What printed:** \`happy\` is \`ok: True\` with an empty fail list. \`sneak\` is \`ok: False\` with \`fails: ['forbid refund']\`. The sneak answer looks done. The eval fails because \`refund\` ran. That is the whole lesson, encoded as a list of names.

## Failure modes if you only score prose

| What you shipped | What the eval missed | Typical week-two symptom |
|---|---|---|
| FAQ-only pass | Refund used to close tickets | Chargebacks, “why did we refund this?” |
| Tone rubric | Cross-tenant \`get_other_user\` | Privacy ticket, legal email |
| “JSON valid” | Valid \`wire\` args | Money left |
| User thumbs-up | Injected PDF ordered the tool | Sporadic, unexplained writes |
| Latency SLO | Fast forbidden call | Cheap incidents |

None of these are exotic. They are what happens when the metric is the chat bubble.

## What goes wrong if you skip this

You will publish a success rate. Product will celebrate. The agent will discover that irreversible tools are the shortest path to “done.” By the time a human reads the ledger, the suite has been green for days. You will then add a prompt sentence “never refund unless asked.” Prompt sentences are not ledgers. The next model version will ignore them under load. Without a forbidden-tool check, you have no way to fail the change except by waiting for finance.

Skipping side-effect scores also makes later safety lessons unenforceable. Harm taxonomies, allow-lists, and injection defenses all assume you already fail a case when a name on the forbid list ran. If that check does not exist, those lessons become essays.

## How agents use this

Dashboards that only show “task success” will hide fraud. Publish **forbidden-tool count** next to pass rate, sliced by tag and by role. Multi-agent teams need this per **role**, not only per job: a researcher that cannot refund should have a zero on \`refund\` forever, even if the billing worker is allowed a capped refund with HITL.

In product code, the score function is boring on purpose: iterate tools, intersect with forbid, require a final. Put it on every golden. Do not hide it inside a judge. Do not average it with tone. A safety 0 fails the case even if the FAQ fact is present. The next files in this track will add properties and tags. They all sit on top of “what did the world do?”

\`\`\`quiz
The agent said “all done” and also called refund. What should the eval do?
- Pass — the user is happy
- *Fail — a forbidden (or unrequested) side effect ran
- Ignore tools
- Average tone and success
explain: Score the world. A smile is not a ledger.
\`\`\`
`,
  },
  {
    slug: "offline-vs-online",
    title: "Offline vs Online",
    summary:
      "Offline evals rerun frozen fixtures in CI. Online evals sample live traces. Either one alone is a blind spot.",
    minutes: 19,
    level: "beginner",
    md: `
**Offline** evals run on a dataset you own: frozen tickets, fake tools, recorded pages, expected properties. They belong in the suite you rerun on every prompt and model change. No live users. No live Stripe. If you cannot rerun it, it is not an offline eval — it is a memory of a demo.

**Online** evals sample **live traces**: did a human override, did the user reopen the ticket, did the payment bounce, did a reviewer deny a HITL refund, did cost explode on one tenant. The world is not frozen. Labels are delayed and noisy. You still need them, because fixtures lie as soon as finance changes the window and nobody updates the JSON.

The point of this lesson is not “pick one.” The point is that **each one covers the other’s blind spot**, and the weekly review should put both numbers on the same page.

## What each one can and cannot see

| Kind | Frozen? | Good at | Blind to |
|---|---|---|---|
| Offline | Yes — fixtures | Regression, injection PDFs, refusals, tool predicates | Policy that drifted in the real KB, new scam phrasings, tool outages |
| Online | No — live sample | Reopens, overrides, chargebacks, real latency | Why it happened unless you stored a replayable trace |
| Demo | Once | Fundraising | Everything you did not click |
| Dashboard anecdote | Never | Anxiety | Reproduction |

\`\`\`viz flow
title Offline and online both count
layout lr
node off Offline
node on Online
node page Same page
edge off page
edge on page
caption Fixtures catch injection. Live flags catch stale policy. One number is a blind spot.
\`\`\`

Offline without online is **overfitting a museum of tickets**. Your pass rate is 94% on last quarter’s goldens. Production users now paste screenshots of a new refund portal. The suite never saw it. The agent invents a policy. You learn from a viral complaint.

Online without offline is **flying by dashboard anecdotes**. Reopen rate ticked up. Nobody can replay. Nobody knows whether the model skipped \`search_kb\` or the KB was empty. You will “fix” it by lengthening the prompt and wait to see if the line goes down. That is not measurement. That is weather.

## Fixtures are the offline contract

A fixture is a **fake world** the tools see: a tiny invoice table, a tiny KB document that says 5-7 days, a PDF that contains an injection, a user id that is not Ada’s. The agent under test gets the same tool **names** as production and a **smaller, known** implementation. Live Stripe in the suite is how CI becomes flaky and how you accidentally refund a real customer from a unit test. Keep money moving in fakes until a dedicated production track says otherwise.

Online sampling is not “run the golden set against production.” It is **events**: override, reopen, bounce, HITL deny, safety tag, write-tool used. You join those to trace ids. You do not need a full property check on 100% of traffic on day one. You need enough to disagree with the museum.

## Walkthrough: 2/3 offline, reopen plus override online

Acme’s offline slice this week is three goldens: two FAQ passes, one injection fail that the current prompt still misses. Offline pass rate is 2/3.

The online slice of live billing tickets shows: one reopen (user came back “you said 5-7 but the portal says 10”), one human override (agent tried to refund, reviewer stopped it), no payment bounce.

If you only publish 0.667, someone will say “pretty good” and ship a prompt tweak. If you only publish “we had an override,” someone will say “rare.” Together: the suite already knows injection is weak, and production is telling you the **fixture fact 5-7 may be stale**. The move is not “add adjectives.” The move is: update the golden **or** the product in a reviewed commit, and keep both numbers.

\`\`\`tryit python
def offline_pass(rows):
    if not rows:
        return 0.0
    return sum(1 for r in rows if r["pass"]) / len(rows)

def online_flags(events):
    flags = []
    if any(e.get("human_override") for e in events):
        flags.append("override")
    if any(e.get("reopened") for e in events):
        flags.append("reopened")
    if any(e.get("bounce") for e in events):
        flags.append("bounce")
    return flags

gold = [{"pass": True}, {"pass": True}, {"pass": False}]
live = [
    {"human_override": False, "reopened": True, "bounce": False},
    {"human_override": True, "reopened": False, "bounce": False},
]
print("offline", round(offline_pass(gold), 3))
print("online", online_flags(live))
print("both numbers belong on the weekly slice")
\`\`\`

**What printed:** \`offline\` is about 0.667 (two of three). \`online\` is \`['override', 'reopened']\`. Neither number replaces the other. Empty gold would have printed 0.0 — the same empty-suite rule you will see again on pass rate. A live list with no flags would print \`[]\`, which is information only if you actually sampled.

## What goes wrong if you skip this

Skip offline: every change is validated by whoever is on Slack. Injection fixtures never exist. You cannot bisect a model upgrade. Skip online: you worship a JSON file while customers reopen tickets because the real policy moved. Skip both: you are not doing evals; you are doing vibes with extra steps.

A common fake compromise is “we look at production once a month.” A month of unmeasured refunds is not a slice. Name a cadence: offline on every relevant change, online flags on a weekly review, and a rule for disagreement.

Disagreement is the interesting case. Offline says the FAQ still has 5-7; online reopens say customers were told 10 days by the portal. That is not “the model is random.” That is a **stale fixture** or a **stale product**. The rule is: one reviewed commit that updates the KB fixture and the expected property, or a product fix that makes the portal match the KB. Quietly adding “sometimes 10 days” to the prompt so both numbers feel true is how you get a third number in the wild.

Online flags need names you can count without a novel: \`override\`, \`reopened\`, \`bounce\`, \`hitl_deny\`, \`hitl_timeout\`, \`write_tool\`. A free-text “looked weird” column will not aggregate. Sample enough traffic that a week without flags is surprising, not because you forgot to look. Offline still carries injection PDFs and refusals that live traffic may not volunteer this week.

## How agents use this

Name an **owner for each suite**. If production disagrees with the golden, you change the **product** or the **golden** in a reviewed commit — never in a quiet prompt tweak. The production track will teach CI, queues, and kill switches that **consume** these numbers. This lesson only insists that you have both kinds, that offline is fixtures, and that online is live events with names you can count.

When you add a new billing worker or a new retrieval corpus, add offline cases first, then watch online reopens for that tag. Multi-agent ping-pong that looks fine on a frozen script can still produce overrides in production; the online flag is how you notice.

\`\`\`quiz
What do offline evals need that dashboards do not?
- More thumbs-up
- *Frozen fixtures (fake tickets, fake tools, recorded pages) you can rerun
- Live Stripe on every PR
- A longer system prompt
explain: Offline is a dataset. If you cannot rerun it, it is not an eval.
\`\`\`
`,
  },
  {
    slug: "score-the-trace",
    title: "The Unit Is a Trace",
    summary:
      "Two agents can print the same sentence. One searched the knowledge base. The other invented a policy. Score the path — the trace is the exam paper.",
    minutes: 20,
    level: "beginner",
    md: `
You do not only score the final sentence. You score the **trace**: the ordered list of events that made that sentence possible. Tools, arguments, observations, state transitions, and the final text are one object. That object is the **unit of evaluation**.

Two agents can print “Refunds take 5-7 days.” One called \`search_kb\` and quoted a fixture document. The other invented the policy from a prior. Those are not equal products. If your eval format is “input string, output string,” you have rebuilt a chatbot benchmark and put an agent inside it.

In the Agents track, a trace is a **debug movie** you watch when a job goes weird. Here the movie is the **exam paper**. You grade it. You store it. You replay it. You do not throw it away after the demo.

## What belongs in the exam paper

| Event | Why the eval needs it | Typical miss if omitted |
|---|---|---|
| Tool name | Required / forbidden sets | Pretty answer, no search |
| Tool args | Predicates (\`amount\` caps, ids) | Schema-valid refund of the wrong invoice |
| Observation excerpt + digest | Grounding and replay | Cannot prove what the tool returned |
| State before / after | Side effects | Duplicate writes |
| Final text | Facts, refusals, leaks | — |
| Model raw / parsed decision | Parser bugs vs policy bugs | You blame the model for a regex |
| Cost / steps | Hidden loops | Pass that took 40 calls |

\`\`\`viz strip
title The exam paper is the trace
chip Tool
chip Args
chip Obs
chip State
chip Final
caption Same sentence, different path, different score. Grade the movie.
\`\`\`

You do not need OpenTelemetry to start. You need a list of dicts with a \`kind\` (or \`type\`) you can filter. Later lessons add hashes and replay. This lesson is the idea: **same prose, different traces, different scores**.

Scoring only the final also hides **order**. Searching after you already refunded is not the same as searching first. A trace is ordered. A bag of tool names is a weaker exam, but it is still better than the sentence alone. Start with names; add args and order when the case needs them.

## Walkthrough: grounded vs invented

Same user question: “How long do refunds take?” Same final text. Different traces.

**Grounded.** \`kind: tool, tool: search_kb\`, then \`kind: final\` with the 5-7 sentence. \`tools_of\` returns \`['search_kb']\`.

**Invented.** Only \`kind: final\` with the same sentence. \`tools_of\` returns \`[]\`.

\`same_prose\` is True. \`equal as agents\` is False. The eval that uses \`same_prose\` as pass/fail is grading a chatbot. The eval that uses \`tools_of\` is grading an agent.

Now add a third trace: search, then \`refund\`, then the same sentence. Prose still matches. Tools do not. Side-effect scoring from the previous lesson fails it. The unit is still the trace — you just applied a second predicate to the same paper.

When an incident happens, “paste the last message” is the wrong ask. “Give me the trace id” is the right one. If you cannot reconstruct tools and observations, you cannot write a golden from the page, and you cannot tell whether a fix worked.

Arguments are part of the paper. \`refund\` with \`invoice_id\` 4412 is not \`refund\` with Ada’s id on Bea’s session. A name-only bag would pass both or fail both together. Once you care about authz and caps, predicates on args are the eval: id matches the fixture user, \`amount\` does not exceed the cap, query strings are not empty. Order matters when the spec says search **then** answer: a refund before \`search_kb\` is not “the tools were present.” It is a different policy.

Schema parity is a measurement issue, not a taste issue. If production events use \`type: tool\` and tests use \`kind: tool\`, every replay adapter you write is a place the exam can silently skip questions. Pick one schema. Grade that. The later digest/replay lesson will hash results; it cannot hash a field you never stored.

Cost and steps belong on the paper too. Two traces can both search once and print 5-7; a third can search forty times and then print 5-7. Task-success-only will call them equal. They are not equal products. You do not need a full finance model in this track. You need \`n_tools\` and tokens on the event list so a later dashboard can slice them.

Observations are part of the exam, not only tools. If \`search_kb\` returned an empty list and the model still said 5-7, that is invented policy with a tool-shaped alibi. A name-only check would pass. Storing a truncated excerpt plus a digest (next part of the track) lets a property say: the fact in the final must appear in an observation, or the case is ungrounded. You do not need to re-teach retrieval. You need the bytes on the paper.

Thoughts or raw model text belong on the paper for **debugging**, but grading thoughts is usually a flake. Grade parsed decisions and tools. If the parser dropped a call that the raw text “meant,” that is a parser eval — unit-test the parser — not a reason to score inner monologue with a judge. Keep the movie complete; keep the **grade** on the structured frames.

\`\`\`tryit python
def tools_of(trace):
    return [e["tool"] for e in trace if e.get("kind") == "tool"]

def same_prose(a, b):
    fa = [e["text"] for e in a if e.get("kind") == "final"]
    fb = [e["text"] for e in b if e.get("kind") == "final"]
    return fa == fb

grounded = [
    {"kind": "tool", "tool": "search_kb"},
    {"kind": "final", "text": "Refunds take 5-7 days."},
]
invented = [
    {"kind": "final", "text": "Refunds take 5-7 days."},
]
print("same prose", same_prose(grounded, invented))
print("grounded tools", tools_of(grounded))
print("invented tools", tools_of(invented))
print("equal as agents?", tools_of(grounded) == tools_of(invented))
\`\`\`

**What printed:** \`same prose True\`. \`grounded tools ['search_kb']\`. \`invented tools []\`. \`equal as agents? False\`. The function names are the lesson: prose can match; the path is the product.

## What goes wrong if you skip this

You will build a suite of expected **essays**. Models paraphrase. The suite flakes. Someone switches to “contains 5-7” — better, still incomplete — and still never notices a missing tool. You will also be unable to replay: production traces will use a different schema than tests (“prettier” JSON, incompatible keys), so incidents cannot become goldens. The next lesson says write the eval first; that eval has to be a **trace predicate**, or you will write the wrong thing first.

Skip traces and LLM-as-judge becomes a vibe on the last paragraph. Skip traces and injection evals cannot see that \`wire\` ran because the PDF said so. The exam paper is the whole track’s substrate.

## How agents use this

CI should consume the **same schema** as production traces: same event kinds, same tool name field, same way you store a final. If the test format is prettier and incompatible, you will not replay incidents. You will maintain two movies and trust neither.

Treat a trace like an audit log you are willing to grade. Redaction is a later safety lesson; schema is this one. Sample cheap jobs; keep traces that hit write tools or safety tags. When two policies produce the same customer-visible sentence, the trace is how you still pick a winner in the suite.

\`\`\`quiz
Two traces end with the same sentence. How do you tell them apart?
- You cannot
- *Compare tools, args, and observations — the path is the eval
- Pick the longer thought
- Ask the model which one it likes
explain: Prose can match. The path is the product.
\`\`\`
`,
  },
  {
    slug: "write-eval-first",
    title: "Write the Eval First",
    summary:
      "Ten well-labeled cases beat a thousand unlabeled transcripts. If a behavior is not in the suite, the next prompt tweak will delete it.",
    minutes: 22,
    level: "beginner",
    md: `
Joeven’s rule for this track: **write the eval before you grow the prompt**. The scarce resource is not tokens. It is **labels**: the correct tool, the correct refusal, the correct citation id, the forbidden names, the fact that must appear. Ten well-labeled cases with hidden checks beat a thousand unlabeled chats that nobody can score twice.

An unlabeled transcript is a **ticket**, not an eval. You can read it and form an opinion. You cannot rerun a property. You cannot fail a PR. You cannot tell whether a new model is better or just different. Piling transcripts into a folder named “evals” is how teams fake maturity.

Growing the prompt first feels faster. You add a sentence. The demo works. Then you add another sentence for the incident. Then the first behavior dies and there is no case to resurrect it. The eval-first order is: specify the behavior as a row, watch it fail, then change prompt or code until it passes **without** killing the other rows.

## What a label actually contains

| Field | Role | Thin ticket without it |
|---|---|---|
| \`id\` | Stable name in diffs and failures | “that refund one” in Slack |
| \`input\` | User message plus metadata | Cannot rerun |
| \`must_call\` | Required tool | Hallucinated FAQ still “passes” |
| \`must_contain\` | Canonical fact | Paraphrase with no window |
| \`forbid\` | Names that fail the case | Refund as closer |
| \`must_refuse\` | Safety / out of scope | Jailbreak looks like a chat |
| Tags / weight | Coverage and gates | Happy path drowns harm |

\`\`\`viz flow
title Labels before adjectives
layout lr
node row Labeled row
node prompt Then prompt
node gate Gate
edge row prompt
edge prompt gate
caption Ten labeled cases beat a thousand unlabeled chats. The row is the spec.
\`\`\`

You do not need every field on every row. You need the fields that make **this** behavior fail closed. A billing FAQ without \`must_call\` is how invented policy ships. A wire probe without \`forbid\` is how a careful paragraph plus a tool call ships.

Hidden tests matter. If the expected answer is pasted into the prompt as an example, you are measuring **memorization of the suite**. Hold out cases the prompt authors do not get to see. The next part of this track (goldens and properties) is that discipline in table form. This lesson is the habit: **labels before adjectives**.

## Walkthrough: thin vs full on the same question

User input: “How long do refunds take?”

**Thin.** \`id: g1\`, \`input\` only. \`missing_labels\` reports \`must_call\`. You cannot fail a hallucinated FAQ. You also cannot forbid \`refund\`. Anyone can claim the ticket is “covered.”

**Full.** Same id and input, plus \`must_call: search_kb\`, \`must_contain: 5-7\`, \`forbid: ['refund']\`. Now the invented pretty answer fails. The sneak refund fails. The grounded answer passes. The row is a spec.

A third row should exist before you “just add refunds as a tool”: \`must_refuse\` or HITL, \`forbid: ['wire']\`, tag \`safety\`. If you add the tool first and the row later, production is the test suite until someone gets to it.

Quality beats volume. Fifty paraphrases of “how long do refunds take?” without a single injection document is not coverage. Two paraphrases, one stale-policy case, one injected PDF, one cross-tenant probe, one “must still help” FAQ — that is a start. Labeling is work. Do it on purpose. Double-label a slice if humans disagree; disagreement means the spec is vague, not that you need a bigger model.

Hidden tests are part of writing first. The prompt author should not see every \`must_contain\` and every injected PDF. If they do, the “improvement” will be pasting the answers into the system prompt, and the suite will measure memorization. Holdout rows live in the same schema with a flag. Product PRs that only touch the visible slice should still run holdout. When holdout drops and the visible slice does not, you learned something true.

A label is also a **weight**. The wire probe is not one vote among fifty FAQs. Write that down in the row or in the runner: forbid hits fail the suite. Eval-first means you decide that **before** someone argues that 98% is “basically fine.” The golden-set lessons will store this as tags and gates. The habit starts when the first row is written, not when the dashboard exists.

\`\`\`tryit python
def missing_labels(item):
    need = ["id", "input", "must_call"]
    return [k for k in need if not item.get(k)]

thin = {"id": "g1", "input": "How long do refunds take?"}
full = {
    "id": "g1",
    "input": "How long do refunds take?",
    "must_call": "search_kb",
    "must_contain": "5-7",
    "forbid": ["refund"],
}
print("thin", missing_labels(thin))
print("full", missing_labels(full))
print("thin is a ticket, not an eval")
\`\`\`

**What printed:** \`thin ['must_call']\`. \`full []\`. The last print line is the moral. This checker is intentionally small — it does not even require \`forbid\`. Your real schema should. The toy shows the shape: **missing keys are missing spec**.

## What goes wrong if you skip this

You will grow the prompt until it is a novella of special cases. Incidents get a new paragraph. Unlabeled behaviors die in the shuffle. Leadership will demand features that break the unlabeled 12%, and you will not be able to show which 12%. You will then try to “add evals later” by dumping production logs into a spreadsheet. Logs without labels are more tickets.

Skip eval-first and golden sets become a graveyard of screenshots. Skip it and judges get asked to invent the spec at grade time. Skip it and safety probes never get \`must_refuse\`. The rest of this track assumes the row exists **before** the cleverness.

## How agents use this

Publish a **weekly slice**: success by tag, forbidden-tool count, cost per passing case. If leadership only sees a demo GIF, they will demand features that break the unlabeled remainder. Make the suite visible the way you make uptime visible.

In product code, a case is a dict (or a JSON line) checked into the repo, reviewed like any other contract. Prompt PRs that do not touch goldens should make you suspicious. New tools ship with rows: one happy path, one forbid, one authz miss. Multi-agent roles each get rows, or the supervisor will be evaluated as if it did the work.

You now know why evals exist, why side effects are the score, why offline and online both count, why the unit is a trace, and why labels come first. Next: **golden sets** — versioning those rows, pass rate as a fraction, properties instead of essay equality, quarantine, and coverage by tag.

\`\`\`quiz
What should you write before you grow the prompt?
- A longer persona
- *Labeled eval cases (tools, refusals, facts)
- A swarm
- A new vendor contract
explain: Unmeasured behavior is unowned behavior. The eval is the spec in table form.
\`\`\`
`,
  },
];
