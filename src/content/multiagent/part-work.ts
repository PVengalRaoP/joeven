import type { RawLesson } from "@/lib/types";

export const multiWork: RawLesson[] = [
  {
    slug: "debate",
    title: "Debate and a Judge",
    summary:
      "Two agents disagree on purpose; a judge (or a grounded checker) picks. Debate is expensive — use it on hard, checkable, high-stakes questions, not on FAQs.",
    minutes: 21,
    level: "advanced",
    md: `
**Debate** is a pattern where two agents produce **competing answers**, optionally attack each other, and a **judge** selects or merges. It can catch confident errors that a single sample misses. It can also produce **longer wrong answers** at 3× cost.

This is not the planner–worker–critic trio. The critic had a rubric and no writes. Debate adds an **opponent** whose job is to find faults or concede, plus a judge that sees **both** packets and the evidence. It is not a group chat with three hats. It is a subgraph you turn on when single-sample workers fail in a **known** way and you have something to ground the judge.

Do not debate “what is 2+2” or “format this JSON.” That is theatre. Do not debate every FAQ. That is the cost explosion in the failure-modes lesson. Do not use debate to replace unit tests. Tests are cheaper judges.

Use debate when:

- The question is **high stakes** (money, safety, legal, medical-adjacent policy you are allowed to automate at all)
- You have a **judge that is grounded** (tests, citations, a rubric over source ids)
- Single-sample evals already fail in a known way (systematic omission of a clause, confident extra promises)

The next lesson is how to ground the judge. This lesson is the **shape**, the round cap, and when not to bother.

## The three roles in a debate subgraph

1. **Proposer** answers with evidence ids, not with a vibe. Same interface-as-data rule: a packet \`{answer, cites}\`.
2. **Opponent** must find faults **or** concede — structured: \`{faults, concede}\`. “I disagree” with no fault string is invalid. Always-attack opponents become nitpick machines; the judge must be allowed to accept a concession.
3. **Judge** sees both plus the **evidence**, not the whole internet again, not the speaker names. Prefer **programmatic** judging (did they cite real ids? did the number appear in the source?) over “which vibe was smarter?”

Cap rounds. Often **one** attack is enough. A second round doubles tokens and trains everyone to hedge. If the judge is uncertain, **handoff to a human**. A mushy merge (“both have a point, refund half”) is how committees ship hedged wrong answers.

| Step | Writes to the world? | Output |
|---|---|---|
| Proposer | no | answer + cite ids |
| Opponent | no | faults or concede |
| Judge | no | winner, final, or \`human\` |
| Apply (later, parent graph) | maybe | only after HITL if money |

\`\`\`viz flow
title Debate triangle
layout cycle
node pro Proposer
node opp Opponent
node judge Judge
edge pro opp
edge opp judge
edge judge pro
caption Two answers, one grounded judge. Nobody in this triangle holds refund.
\`\`\`

Nobody in the debate triangle holds \`refund\`. Apply stays on the billing subgraph after the judge, same as sequential-subgraph. Debate is a **node**, not a new mesh.

## Walkthrough: refund policy, proposer lies about a year

Source of truth (artifact on the board): “Refunds take 5-7 business days after approval. No cash refunds after 30 days.”

Question: how do refunds work?

Proposer answers that refunds take 5-7 days **even a year later**, and cites \`5-7\`. The delay fragment is in the source. The “year later” promise is not. This is the extra-promise failure single-sample models love.

Opponent checks: if the answer says year later and the source has 30 days, that is a fault. If 5-7 were missing from the source, that would be another fault. Here faults is non-empty, concede is false.

Judge: if opponent listed faults, winner is opponent, and the **final** is a sentence that includes both the delay and the 30-day cash limit — in this toy, written by code from the source, not by another free-form model. If no faults and the proposer’s 5-7 appears in source, proposer wins. Else human.

The judge here is **code plus the source string**. When you later swap in an LLM judge, keep this evidence in the prompt and **eval the judge** (evals track). Blind names. Cap rounds to one unless a golden proves you need two.

\`\`\`tryit python
SOURCE = "Refunds take 5-7 business days after approval. No cash refunds after 30 days."

def proposer(question):
    return {
        "answer": "Refunds take 5-7 days, even a year later.",
        "cites": ["5-7"],
    }

def opponent(question, prop, source):
    faults = []
    if "year later" in prop["answer"] and "30 days" in source:
        faults.append("ignored the 30-day cash-refund limit")
    if "5-7" not in source:
        faults.append("delay not in source")
    return {"faults": faults, "concede": not faults}

def judge(prop, opp, source):
    if opp["faults"]:
        return {
            "winner": "opponent",
            "final": "Refunds take 5-7 business days after approval, and cash refunds are not available after 30 days.",
            "faults": opp["faults"],
        }
    if "5-7" in prop["answer"] and "5-7" in source:
        return {"winner": "proposer", "final": prop["answer"], "faults": []}
    return {"winner": "human", "final": None, "faults": ["judge uncertain"]}

q = "How do refunds work?"
prop = proposer(q)
opp = opponent(q, prop, SOURCE)
verdict = judge(prop, opp, SOURCE)
print("PROPOSER", prop)
print("OPPONENT", opp)
print("JUDGE", verdict)
\`\`\`

**What printed:** proposer includes the year-later lie and a 5-7 cite. Opponent lists the 30-day fault and does not concede. Judge winner is opponent, final mentions 5-7 **and** 30 days, faults echoed. The user-facing product should store **both** answers plus the verdict. If you only store the winner, you cannot audit the loss when the opponent was wrong next time.

Change the proposer answer to drop “year later” and keep 5-7. Opponent should concede (no faults). Judge should pick proposer. That is the happy path. Do not skip writing it as a golden.

## Cost and when to refuse debate

Price: roughly 3× a single worker call, more with extra rounds, plus judge tokens. Tag tickets \`high_stakes\` before you enqueue debate. Untagged FAQs go to one worker or a sequential policy node.

If the opponent is rewarded for always attacking, you get nitpicks (next lesson). If the judge is the same model and prompt as the proposer, you get a mirror. If you launch debate because a slide said “team of agents,” you will buy longer wrong answers.

Debate is not ReAct. ReAct is one policy, tools, observations. Debate is two answers and a judge over evidence. Do not wrap debate in a tool-calling loop that lets the opponent \`edit\`. No writes in the triangle.

## How agents use this

Run debate **only** on \`tag=high_stakes\` tickets. Blind the judge to speaker names. Store both answers — if you only store the winner, you cannot audit the loss.

Put debate as a node on the subgraph that already has HITL for money. Round cap in config, default 1. Uncertain judge → \`assign: human\`, not a coin flip.

Eval the **opponent** for missed faults on fixtures that contain a known lie, and for extra faults on clean answers (nitpick rate). Eval the **judge** against programmatic labels. A debate system you cannot eval is a talk show.

Baseline still wins if debate does not beat single-sample on the high-stakes slice. Deleting debate from FAQs is a ship. The next lesson makes the judge refuse a chorus without citations.

\`\`\`quiz
What makes a debate judge useful?
- Always picking the longer answer
- *A rubric grounded in evidence, tests, or citations — plus a round cap
- Using the same prompt as the proposer
- Letting the opponent write to production
explain: Ungrounded judges pick rhetoric. Grounded judges pick constraints that appear in the world.
\`\`\`
`,
  },
  {
    slug: "grounded-judge",
    title: "Ground the Judge",
    summary:
      "Two models agreeing is not truth. Agreement without evidence is a chorus. The judge must see the same snippets the user will see, blinded to speaker names.",
    minutes: 20,
    level: "advanced",
    md: `
If the opponent is rewarded for always attacking, you get nitpicks. If the judge is the same model as the proposer with the same prompt, you get a mirror. If two models agree with **no citations**, you have a **chorus**, not a fact. The judge’s job is to fail closed or handoff — not to ship the duet.

Grounding means the judge sees the **same snippets** the user will see (source ids on the blackboard), checks that cited ids exist, and checks that the answer actually uses those snippets. This is the Agents grounded critic and the RAG citation idea, lifted to a debate node. Debate without this check is a talk show.

**Blind** the judge to names (“Agent A is our smartest model”) or you will measure branding. Shuffle order; **position bias** is real: many models pick the first packet. A judge that always splits the difference trains a committee to hedge. Hedged wrong answers still ship. Prefer \`handoff\` over a mushy merge.

## What the judge must check

| Check | Pass | Fail |
|---|---|---|
| Cites exist | every id in the source map | \`unknown cite s9\` |
| Cites non-empty | at least one id if the rubric requires it | \`no cites\` |
| Answer uses the source | a token from the snippet appears in the answer (toy) | \`ignores s1\` |
| Opponent faults | faults must point at source, not at tone | nitpick-only → ignore or human |
| Names / order | hidden and shuffled | branding win |

\`\`\`viz flow
title Judge sees the same snippets
layout lr
node a Answer A
node src Source ids
node b Answer B
node j Judge
edge a j
edge src j
edge b j
caption Blind the names. Empty cites are a chorus, not a fact.
\`\`\`

The toy below uses a crude “first word of the snippet in the answer” check so you can run it in the browser. Production should use better overlap or a structured field the proposer must copy (\`delay_days: [5, 7]\`). Crude is still better than “which essay sounded senior.”

**Unknown cite.** Proposer cites \`s9\` that is not in the map. Fail closed. Do not let the judge “believe” s9 because the prose is confident.

**Ignore cite.** Proposer cites \`s1\` (“Paris rain 12C”) then says bring shorts, it is hot. The cite list looks busy. The answer contradicts the snippet. Fail. This is how models launder hallucinations: they attach a real id to a false sentence.

**Good.** Answer contains rain and the 30-day cash rule, cites s1 and s2, both real. Pass.

Agreement of two models on “bring shorts” with **empty** cites must not pass just because they match. The quiz is that case. Chorus without ids is still a guess.

## Walkthrough: weather plus refund rule

Sources: \`s1\` Paris rain 12C, \`s2\` no cash after 30 days. Three judge calls:

1. Answer restates both facts, cites both ids → ok, winner proposer.
2. Shorts in the heat, cites s1 → errors include ignores s1 (first word “Paris” not in “Bring shorts…”). Fail, winner human.
3. Mentions rain but cites s9 → unknown cite. Fail.

Winner \`human\` on fail is a policy: do not let a broken judge silently pick the opponent’s vibe either. A real product might pick opponent if opponent faults are grounded. This toy keeps the lesson small: evidence first, else human.

\`\`\`tryit python
def judge(answer, cited, source_ids, text):
    errors = []
    for sid in cited:
        if sid not in source_ids:
            errors.append("unknown cite " + sid)
    if not cited:
        errors.append("no cites")
    for sid in cited:
        if sid in source_ids and source_ids[sid].split()[0].lower() not in answer.lower():
            errors.append("ignores " + sid)
    if errors:
        return {"ok": False, "errors": errors, "winner": "human"}
    return {"ok": True, "errors": [], "winner": "proposer"}

SRCS = {"s1": "Paris rain 12C", "s2": "No cash after 30 days"}
print(judge("Paris rain 12C. No cash after 30 days.", ["s1", "s2"], SRCS, ""))
print(judge("Bring shorts, it is hot.", ["s1"], SRCS, ""))
print(judge("Paris rain 12C.", ["s9"], SRCS, ""))
\`\`\`

**What printed:** first call ok, winner proposer. Second call not ok, ignores s1, winner human. Third call unknown cite s9, winner human. Hot-weather advice ignores s1. Unknown cite s9 fails. Grounded rain plus cash rule passes.

The unused \`text\` argument is a reminder you can pass the user question without letting it override sources. Do not judge the question’s tone. Judge the answer against ids.

Add a fourth mental case: \`judge("Paris rain 12C.", [], SRCS, "")\` → \`no cites\`. Two models could both emit that sentence from memory. Still fail if the rubric requires cites. That is the chorus.

## Blinding, order, and merge policy

Strip names. Call them Packet 0 and Packet 1. Randomize which packet is proposer. Log the permutation so you can debug, but do not show it to the model judge. If you use programmatic judges only, bias is smaller — still shuffle if any LLM remains in the loop.

Do not average two numbers from two models and call it truth. Do not pick the longer answer. Length is not evidence.

If both packets fail grounding, human. If one passes, you may return that packet’s answer **as data**, then still run HITL on money. Passing the judge is not apply.

Position bias is not a footnote. If you always put the proposer first, you will ship proposer-shaped errors and call it “the judge prefers our best model.” Shuffle. Log the permutation for debugging. Publish judge accuracy **by position** in evals. If packet-0 wins 80% of the time, you are measuring order, not policy.

Nitpicks: opponent faults that do not cite a source id are dropped or sent to a nitpick counter. Reward opponents for **grounded** faults in evals, not for word count of complaints. An opponent that always attacks will look busy and waste the cap. An opponent that concedes on clean answers is doing the job.

## How agents use this

Same idea as the Agents grounded critic and RAG citations. Debate without this check is a talk show.

Wire the judge to the blackboard’s artifact map. If the id is missing, the researcher failed, not the judge — fail closed, reassign researcher or human, do not invent s1.

Eval the judge as its own product: goldens where the answer is true but uncited (must fail), true and cited (must pass), false and cited (must fail), chorus with no cites (must fail). If your judge pass rate is 100% on demos and 0% on those goldens, you shipped rhetoric.

Never let the judge write. Never let agreement skip the cite check. When you add swarms next, reduce will also drop children that fail schema — same fail-closed family, different fan-out.

\`\`\`quiz
Two models agree, with no citations. What should the judge do?
- Ship the chorus
- *Fail closed or handoff — agreement is not evidence
- Pick the longer one
- Launch a swarm
explain: A chorus without ids is still a guess. The judge needs the source.
\`\`\`
`,
  },
  {
    slug: "swarms",
    title: "Swarms of Cheap Workers",
    summary:
      "Fan-out many small jobs, fan-in the results. Swarms are map-reduce, not a group chat with 50 personas. Independent items, tiny tools, priced fan-out.",
    minutes: 21,
    level: "advanced",
    md: `
A **swarm** is **map-reduce for agents**: split a job into many **independent** sub-tasks, run cheap workers in parallel, then merge. It is not 50 personas in a roundtable. It is not debate. It is not a supervisor mesh. If workers must negotiate, you want fewer of them and an orchestrator, not a swarm.

Good swarm work: score 200 tickets, extract fields from 80 PDFs, generate candidate tests for 40 functions, classify a batch of messages.

Bad swarm work: 50 agents editing the same file, 50 agents with write tools on the same customer, a “brainstorm swarm” with no merge function, a swarm that re-debates every FAQ.

If sub-tasks share **mutable** state, you do not have a swarm. You have a race. The write-barrier lesson will lock that down. This lesson is independence, cheap children, keys, and **pricing fan-out before launch**. The failure-modes lesson will refuse 50 large children when 20 still fit the cap. Learn the habit here: \`N × cost(child) + cost(reduce)\` is a number you compute **first**.

## What must be true to call it a swarm

| Requirement | Why | If false |
|---|---|---|
| Independent items | no shared writes during map | race; use sequential or locks |
| Cheap child | small model or non-LLM extractor, tiny schema | N times a 70B is a furnace |
| Tiny tool set, often **no tools** | blast radius | 200 refunds |
| Merge function | reduce is the product | concatenating traces is a context bomb |
| Cap on N | price and queue | unbounded fan-out |
| Child keys | \`hash(parent_id, item_id)\` | duplicate children, mystery cost |

\`\`\`viz flow
title Map, then reduce
layout lr
node map Map
node rows Rows
node red Reduce
edge map rows
edge rows red
caption Cheap workers fill a table. Concatenating 200 traces is not a merge.
\`\`\`

Each worker should be a **small model** (or a regex, or a rules scorer) with a JSON schema. A swarm of giant generalists is a group chat with extra invoices. Prefer no tools during map. Reads of a **private copy** of one item can be ok. Writes to a shared customer are not.

Child jobs need keys: \`hash(parent_id, item_id)\`. Reduce must tolerate duplicates. Retries will duplicate. Idempotent children plus a reduce that keys by id save you.

**Embarrassingly parallel** is the jargon: items do not need each other’s answers. Scoring ticket 1 does not require ticket 2’s score. If it does, it is a sequential fold, not a map.

Keys must be stable. \`hash(parent_id, item_id)\` means a retry of item 17 is the same child as the first attempt, not a new persona. Reduce then sees one id. Cost dashboards then see one line. If you key on “whatever UUID the queue minted,” you will count retries as extra intelligence.

## Walkthrough: five tickets, severity map, reduce to a page

Tickets: prod fire, invoice question, about-page typo, refund never arrived, API 500.

Worker (map): lowercase, severity 3 if fire/500/prod, 2 if refund/invoice, else 1. Returns \`{text, sev}\`. No tools. No shared dict mutation except the parent collecting a list.

Reduce: sort by severity descending then text (stable ties), bucket counts, take top and a page of three. Reduce is serial and tiny. That is allowed. Map is where you scale.

Children would run in parallel in a real queue. The toy uses a list comprehension so you can see every row. Parallelism is an implementation detail of independent maps. Do not fake parallelism by letting children talk.

\`\`\`tryit python
tickets = [
    "server on fire in prod",
    "where is my invoice?",
    "typo on the about page",
    "refund never arrived",
    "API 500 on /v1/jobs",
]

def worker(text):
    t = text.lower()
    if any(w in t for w in ("fire", "500", "prod")):
        sev = 3
    elif any(w in t for w in ("refund", "invoice")):
        sev = 2
    else:
        sev = 1
    return {"text": text, "sev": sev}

def reduce(rows):
    rows = sorted(rows, key=lambda r: (-r["sev"], r["text"]))
    buckets = {3: [], 2: [], 1: []}
    for r in rows:
        buckets[r["sev"]].append(r["text"])
    return {
        "top": rows[0],
        "counts": {k: len(v) for k, v in buckets.items()},
        "page": rows[:3],
    }

mapped = [worker(t) for t in tickets]
print("MAP")
for row in mapped:
    print(" ", row)
print("REDUCE", reduce(mapped))
\`\`\`

**What printed:** MAP prints five rows with sev 3, 2, 1, 2, 3. REDUCE prints the top (a sev 3 ticket; ties broken by text so “API 500…” may sort before or after the fire line depending on strings), counts per bucket, and a page of three highest. Sort uses \`(sev, text)\` so ties are stable. Children would run in parallel. Reduce is serial and tiny.

This reduce still sees every row. The next lesson is how reduce must **drop** schema failures, **dedupe** ids, and **not** paste 200 traces into the parent prompt. Here you only need: map is a function of one item; reduce is a table.

## Price before enqueue

Estimate \`N * cost_child + cost_reduce\`. If over the job cap, **do not launch**. The failure-modes box will show 20 children launching and 50 refused. Same policy. A swarm that always launches and then “optimizes later” is how cards melt.

Cap N in config (for example 20 on this product). If the inbox has 200 tickets, **page** them: 10 swarms of 20, or a cheaper non-LLM map. Do not silently raise N because the list is long.

Twenty versus fifty is not a vibe. It is arithmetic you will see again in failure-modes: at 0.02 per child and a 0.5 cap, 20 launches and 50 does not. Put that arithmetic in the launcher, not in a standup. If someone wants 50, they raise the cap in a reviewed config change **and** prove reduce still fits the parent context. Most weeks they should page instead.

Swarms shine when **map is embarrassingly parallel** and **reduce is boring**. If workers must negotiate, that is orchestration or debate — and you want fewer of them.

## How agents use this

Put swarms **inside** a sequential node: “score the batch,” then the parent continues. Do not make the whole product a swarm. Do not give children the parent’s write tools.

Log \`parent_id\`, \`child_id\`, \`item_id\` on every span. Without those keys, cost attribution is a mystery novel. The reduce lesson will use them.

Keep a one-agent or sequential baseline for a **slice** of tickets. If the swarm’s top-3 page disagrees with a careful sequential pass on goldens, fix reduce or the worker schema before you grow N.

When-not-to-swarm, at the end of this track, will refuse shared files, missing merge, unpriced N, and graphs that already hit the eval. This lesson is the happy shape so that refusal has a contrast.

\`\`\`quiz
What is the main risk of giving every swarm worker write tools?
- They will type faster
- *Races, duplicate side effects, and an unbounded blast radius
- Reduce becomes too accurate
- Cheap models refuse to write
explain: Independent maps should not mutate a shared world. Writes belong in one ordered apply after reduce.
\`\`\`
`,
  },
  {
    slug: "reduce-step",
    title: "Reduce Is the Product",
    summary:
      "Map is easy. Never concatenate 200 traces into a supervisor prompt. Reduce down to a table: vote, merge ids, drop schema failures, list missing items.",
    minutes: 20,
    level: "advanced",
    md: `
**Reduce** is where swarms die. Map is easy: one function per item. Reduce is the product: a **small table** the parent is allowed to see. Never concatenate 200 raw traces into a supervisor prompt. That re-creates the context problem you split to avoid. The why-part’s context isolation applies to your own children.

Reduce strategies:

- **Vote** — majority label (only if labels are comparable)
- **Merge lists** — concat + dedupe with an id
- **Cluster then summarize** — for open-ended research, still a table of cluster ids, not 200 novels
- **Verifier gate** — drop workers that failed schema

A straggler on item 199 should not block forever: reduce with **partials** and mark missing ids. Timeouts are data. Pretending the child will arrive if you wait one more minute is how jobs never finish.

The parent assembler gets the reduce object: winner, counts, dropped, missing, maybe a page of top rows. It does not get child chain-of-thought. Thoughts stay on child traces for operators.

## What reduce must do

| Job | Rule | Failure if skipped |
|---|---|---|
| Drop schema failures | \`ok\` false → \`dropped\` | Garbage labels win the vote |
| Dedupe by id | last-write or first-write, one slot per id | Duplicate children double-count a vote |
| List missing | \`expect_ids\` minus present | Silent holes; you think N=200 when N=180 |
| Vote only on comparable labels | fixed enum | “sev3” vs a paragraph cannot majority |
| Stable ties | sort key includes id or text | flaky pages, flaky evals |
| Size cap | table not a dump | parent context explodes |

\`\`\`viz flow
title Reduce is the product
layout lr
node kids Child rows
node table Small table
node parent Parent
edge kids table
edge table parent
caption Vote, merge ids, list holes. The parent never sees 200 novels.
\`\`\`

**Vote.** Majority of remaining labels. Tie-break with a documented rule (lexicographic label, or “no winner → human”). Do not let a 70B “summarize the vibe” replace this when labels exist.

**Duplicates.** Retries enqueue the same \`item_id\` twice. Key by id. Duplicate \`a\` in the toy does not become two ids. Counts for voting use unique ids, not raw row count — decide that explicitly. The toy keeps last label per id; two \`a\` rows with the same label still count as one \`a\`.

**Dropped.** Child \`c\` has \`ok: False\`. It does not vote. It is listed. If dropped is huge, the swarm is sick (schema too strict, or model too small). Do not silently ignore.

**Missing.** Expected \`d\` never arrived. Listed. Parent may rerun only \`d\`, or proceed partial with a flag. Do not treat missing as label 0.

## Walkthrough: four rows, three expected holes

Rows: a ok sev3, b ok sev1, c fail, a ok sev3 again, and expect ids a,b,c,d.

Reduce: by_id has a and b. dropped includes c. missing includes d (and c is dropped **and** not in by_id, so c may also appear in missing depending on whether you treat dropped as present — the toy lists missing as “not in by_id,” so c and d are missing; c is also dropped). Winner sev3. n=2 unique ok ids.

Read the print. Your production schema should document whether dropped ids are also missing. Pick one, test it. Ambiguity here becomes a dashboard lie.

\`\`\`tryit python
def reduce_rows(rows, expect_ids):
    by_id = {}
    dropped = []
    for r in rows:
        if not r.get("ok"):
            dropped.append(r.get("id"))
            continue
        by_id[r["id"]] = r["label"]
    missing = [i for i in expect_ids if i not in by_id]
    counts = {}
    for lab in by_id.values():
        counts[lab] = counts.get(lab, 0) + 1
    winner = None
    if counts:
        winner = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    return {
        "winner": winner,
        "n": len(by_id),
        "missing": missing,
        "dropped": dropped,
    }

rows = [
    {"id": "a", "ok": True, "label": "sev3"},
    {"id": "b", "ok": True, "label": "sev1"},
    {"id": "c", "ok": False, "label": None},
    {"id": "a", "ok": True, "label": "sev3"},
]
print(reduce_rows(rows, ["a", "b", "c", "d"]))
\`\`\`

**What printed:** winner \`sev3\`, \`n: 2\`, missing includes \`c\` and \`d\` (c failed so it never entered \`by_id\`; d never arrived), dropped includes \`c\`. Duplicate \`a\` does not double-count as two ids. Failed \`c\` is dropped. Missing \`d\` is listed. Winner is sev3.

If both a and b had different labels 1–1, the sort \`(-count, label)\` would pick the lexicographically smaller label. Document that. Evals hate a random winner.

## Never paste traces

The parent prompt that contains 200 JSON dumps will: cost a fortune, drown the supervisor, and re-expose child thoughts as instructions (injection sideways, now from **your** workers). Reduce down. If you need examples, include three rows, not two hundred.

Open-ended research swarms still reduce: cluster ids, one summary sentence per cluster, cite child ids. A 40-page concatenation is the research dump the why-part told you not to hand a coder.

Partials: after a deadline, reduce what you have. Stamp \`partial: True\`. The sequential parent can HITL or rerun missing. Infinite wait is not quality.

Open-ended research still needs a table. “Summarize the web” is not a reduce. Cluster ids, one sentence per cluster, citation list, dropped children. If the parent needs a narrative, a **single** writer role writes it from the table — sequential, one allow-list — not 200 children arguing in the prompt. That writer is not a swarm member. It is the next node after reduce.

When labels are not comparable (one child returns \`sev3\`, another returns a paragraph), do not vote. Drop the paragraph as schema failure. If too many drop, the child schema is wrong or the model is too small. Shrink the schema. Do not ask a 70B parent to “reconcile the vibe.” That is concatenating traces with extra steps.

## How agents use this

Log \`parent_id\`, \`child_id\`, \`item_id\` on every span. Cost attribution without those keys is a mystery novel.

Unit-test reduce with duplicates, drops, missing, empty input (winner None, n 0). No tokens. This function is more important than the child prompt.

The parent apply step (next lesson) reads this table, not the children. If winner is None or missing is non-empty on a money job, do not apply. Human. Write barrier plus a complete reduce is how you sleep.

Dashboards: dropped rate, missing rate, n vs expected, cost vs pre-launch estimate. A swarm that maps beautifully and reduces into a novel is a failed swarm. Treat reduce like billing code: reviewed, tested, owned. If only the child prompt has an owner, the parent will drown.

\`\`\`quiz
How should you merge 200 swarm children into the parent prompt?
- Paste every trace
- *Reduce to a table (vote, deduped ids, dropped/missing) — then the parent sees the table
- Pick the longest child
- Ask a 70B model to “summarize the vibe”
explain: Reduce down. A supervisor prompt full of traces is the context bomb you split to avoid.
\`\`\`
`,
  },
  {
    slug: "write-barrier",
    title: "A Write Barrier After Map",
    summary:
      "Map workers are read-only (or write only to their own prefix). Money and email happen once, after reduce, in the parent apply step, with an idempotency key.",
    minutes: 19,
    level: "advanced",
    md: `
Keep a **write barrier**: map workers read (or write only to \`artifacts/{child_id}/...\`). The parent’s **apply** step is the only place money or email happens. If you skip this, you have invented distributed side effects with a cute name.

Retries duplicate children. Two children that both “helpfully” refund the same customer is the two-writers incident with extra parallelism. Idempotency keys on apply save you. The Tools track already taught those keys — here the **parent** owns them. Children never see \`refund\` or \`email\` on their allow-list.

The swarm lesson forbade write tools on workers as the main risk. This lesson is the **positive** design: a barrier in the dispatcher, and a parent apply that is safe to retry.

## Two sides of the barrier

**Child.** Legal: \`score\`, \`extract\`, maybe read-one-item. Illegal: \`refund\`, \`email\`, \`edit\` on a shared path, \`apply\`. Dispatcher returns \`write_barrier\` without mutating the world. Same copy-on-write habit as planner-cannot-patch-src.

Child-prefix writes: a scratch file under that child id can be ok if ACL hides it from siblings and it is not money. Do not put customer ledger files in a prefix and call it scratch.

**Parent apply.** After reduce. Reads the table. If missing/dropped too high, stop. If ok, call \`refund\` or \`email\` **once** with key \`job_id:customer_id\` (or \`job_id:item_id\`). Retry of apply with the same key returns \`dup: True\` and does not move money again.

| Caller | \`refund\` | \`score\` |
|---|---|---|
| Child | \`write_barrier\` | ok |
| Parent, new key | ok, first time | not a write |
| Parent, same key again | ok, \`dup\` | — |

\`\`\`viz flow
title Write barrier after map
layout tb
node kids Children read
node wall Barrier
node parent Parent apply
edge kids wall
edge wall parent
caption Children map. Only the parent writes money or mail. Same key does not pay twice.
\`\`\`

The sequential billing subgraph still wraps this: HITL then apply. A swarm of scorers might sit **before** HITL (“rank these 200,” then a human sees the page, then apply). Children still cannot apply while the human is thinking.

Agreement among children is not apply either. Two children that both “think” the customer should be refunded still return labels. The parent reduce may vote \`refund_candidate\`. HITL may agree. Apply then runs once with a key. “Two children agreed” in the quiz is a trap: chorus is not a ledger, same as the grounded judge.

## Walkthrough: child refund blocked; parent once

Child \`score\` on prefix c1: ok.

Child \`refund\`: \`write_barrier\`. World unchanged.

Parent apply refund with key \`job9:cust1\`: ok, dup false. Seen set now holds the key.

Parent apply same key: ok, dup true. No second refund.

Wrong parent call \`score\` as apply: \`not_a_write\`. Apply is for the write names only. Do not mix.

\`\`\`tryit python
WRITES = {"refund", "email"}

def child_call(name, prefix):
    if name in WRITES:
        return {"error": "write_barrier", "name": name}
    return {"ok": True, "name": name, "prefix": prefix}

def parent_apply(name, key, seen):
    if key in seen:
        return {"ok": True, "dup": True}
    if name not in WRITES:
        return {"error": "not_a_write"}
    seen.add(key)
    return {"ok": True, "dup": False, "name": name}

seen = set()
print(child_call("score", "c1"))
print(child_call("refund", "c1"))
print(parent_apply("refund", "job9:cust1", seen))
print(parent_apply("refund", "job9:cust1", seen))
\`\`\`

**What printed:** child score ok. Child refund error \`write_barrier\`. First parent apply ok with \`dup: False\`. Second parent apply ok with \`dup: True\`. Child refund is blocked. Parent apply runs once; the retry is \`dup\`.

The \`seen\` set is a toy of the Tools idempotency store. Production uses a real key-value with TTL and the same semantics: first writer wins. Two **parents** (a bug) still collide on the key. Combine with one-writer-per-record in the next part so a loyalty agent cannot credit while billing refunds.

## Pricing and enqueue

Do not let a child “queue an apply” either. Queuing a write is a write. Children return labels. Parent decide + HITL + apply.

Retries of the **parent** job must reuse the same apply key. If a crash restarts the job with a new key, you double-refund with perfect barriers and perfect child isolation. The key is derived from \`job_id\` plus record id, not from a UUID minted at apply time. Tools already taught this. Swarm parents forget it because “this is just reduce.” It is not just reduce. It is the only door to money.

Price the swarm in the job record **before** enqueue, then enforce the cap in the worker launcher. A write barrier plus an idempotency key is how you sleep. If launch refused because N was 50, you never needed the barrier for those 50 refunds — they did not start. Both controls matter: refuse over-budget fan-out, and barrier whatever did start.

Swarms of editors on one file cannot be saved by a barrier unless you redefine the swarm as “propose hunks to prefixes, parent merges.” If you cannot merge, it is not a swarm. Sequential one writer. The two-writers lesson will lock the file anyway; do not use a swarm to dodge the lock.

## Friday ticket: two children, one customer

Billing fans out 12 invoice lines to scorers. Two lines belong to the same customer. Both scorers would like to be helpful and call \`refund\`. The dispatcher returns \`write_barrier\` twice. The world does not move. Reduce sees two \`refund_candidate\` labels for \`cust1\`. HITL agrees once. Apply runs with key \`job9:cust1\`. A worker crash retries apply. The store already has the key. \`dup: True\`. One refund. That is the whole point of the page.

If the parent minted a fresh UUID at apply time, the retry would look like a new refund. The barrier would still hold for children, and you would still double-pay. The key is \`job_id\` plus the **record** id, not a random token. Write that in the runbook next to the diagram.

| Failure | What you see | Fix |
|---|---|---|
| Child refund on allow-list | Two money events on one ticket | Remove write names from child tools |
| Apply key is a UUID | Dup after crash still pays | Derive key from job + customer |
| Child enqueues apply | Queue fills with writes | Queueing a write is a write; return a label |
| Parent apply before reduce | Refund with no score table | Apply reads reduce output or stops |
| Prefix “scratch” is the ledger | Children edit shared money files | Prefix is not a ledger |

## What goes wrong

- Putting \`refund\` on the child allow-list “just for this swarm.” There is no just. The dispatcher is the policy.
- Treating \`dup: True\` as an error and retrying with a new key. Dup is success. Log it. Do not invent a second door.
- Logging only the thought “I would refund” and not the apply result. On-call needs the key and \`dup\`.
- A second parent (loyalty) that also apply-refunds. The barrier is per dispatcher, not a law of physics. One writer per record is the next part.
- Skipping HITL because “the children agreed.” Agreement is a label. Money is apply.

## How agents use this

Stamp \`barrier=map\` on child spans and \`apply_key\` on parent writes. Alert if a child span ever has a write tool name, even if denied — prompt drift. Alert if apply runs without a reduce row for that id.

Fixture: 3 children, 2 try refund, 1 scores; after reduce, one parent refund with a key; replay apply; assert one money event. Keep that fixture when you change frameworks.

Swarms of editors on one file cannot be saved by a barrier unless you redefine the swarm as “propose hunks to prefixes, parent merges.” If you cannot merge, it is not a swarm. Sequential one writer.

The failure-modes part next names ping-pong, two writers, and the priced 20-versus-50 launch cap. You already have the habits: typed teams, boring orchestration, debate with a grounded judge, map-reduce with a barrier. The rest is how those teams still fail when a control is missing.

\`\`\`quiz
When may a swarm child call refund?
- When its thought is confident
- *Never — refund waits for the parent apply after reduce
- If two children agree
- After three map retries
explain: Map is read-only. One ordered apply owns side effects.
\`\`\`
`,
  },
];
