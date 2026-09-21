import type { RawLesson } from "@/lib/types";

export const ragMemory: RawLesson[] = [
  {
    slug: "memory-types",
    title: "Memory Types",
    summary:
      "Working, episodic, semantic, and procedural memory are different stores — not one magic vector soup.",
    minutes: 22,
    level: "advanced",
    md: `
People say “give the agent memory” and then dump the whole chat into a vector database. That is one store pretending to be four. The operations differ. If you only have cosine, you cannot answer “did we already refund INV-17?” except by accident.

Four types, four jobs:

| Type | What it holds | Typical store | Failure if you skip it |
|---|---|---|---|
| Working | Current goal, last observations, budget | Context window + a JSON state | Goal drift, lost tool results |
| Episodic | What happened: traces, “last Tuesday” | Logs, time-indexed events | Cannot see what you already tried |
| Semantic | Facts: runbooks, prefs as statements | RAG corpus, profile rows | Hallucinated policies |
| Procedural | How to act: tools, playbooks | Code, schemas, git | A different procedure every Thursday |

**Working memory** is the live task. It is small and structured. The next lesson is only that store.

**Episodic memory** is a log of events with time. “We already replayed the DLQ at 10:04” is an event. You **append**. You filter by time and kind. You do not cosine for “yesterday” as your only clock.

**Semantic memory** is curated facts: the runbook, “Acme never cash.” This track’s RAG corpus is mostly semantic. Profile rows (\`never_cash: true\`) are semantic too, and often better than an embedded sentence.

**Procedural memory** is how to act: the \`replay_dlq\` function, the JSON schema, the git-pinned playbook. It should be **deterministic**. Embedding a wiki of “how we usually refund” as the only procedure is how Thursday’s bot differs from Wednesday’s.

\`\`\`viz flow
title Four memory boxes
layout lr
node work Working
node epi Episodic
node sem Semantic
node proc Procedural
edge work epi
edge epi sem
edge sem proc
caption Four stores, four jobs. One vector soup is how all four fail.
\`\`\`

\`\`\`viz grid
title Four stores, not one soup
row 1,0,0,0
row 0,1,0,0
row 0,0,1,0
row 0,0,0,1
labels Work Epi Sem Proc
caption Working is JSON. Episodic is a log. Semantic is the handbook. Procedural is code.
\`\`\`

## Do not vectorize everything

Vectors are an index for **semantic prose**. Using them as working memory loses **order** (sets of vibes, not a state machine). Using them as procedure loses **determinism**. Using them as the only episodic store makes “yesterday” a cosine accident: you retrieve a similar Tuesday, not *this* Tuesday.

A practical system has **four APIs**:

- mutate working state (rewrite JSON)
- append an event (episodic)
- upsert a fact (semantic, with trust rules — write-back lesson)
- call a procedure (code)

\`memory.add(text)\` feels unified, then you cannot answer “did we already refund INV-17?” because that is a **row** or an **event**, not a similar paragraph.

RAG in this track is the semantic library: chunks, search, citations. Working memory is the live JSON. Episodic is the trace. Procedural is tools. The agent **loop** that walks those APIs is later. Learn the stores first or the loop has nowhere honest to write.

\`\`\`tryit python
import json

working = {"goal": "fix runner OOM", "steps_left": 4, "last_obs": None}
episodic = []
semantic = {
    "runbook.oom": "Raise worker memory, then replay the DLQ.",
    "tenant.acme.refunds": "never_cash",
}
procedural = {
    "replay_dlq": lambda since: {"ran": True, "since": since},
}

def remember_event(kind, payload):
    episodic.append({"kind": kind, "payload": payload})

def act():
    fact = semantic["runbook.oom"]
    working["last_obs"] = fact
    remember_event("retrieved_semantic", {"key": "runbook.oom"})
    result = procedural["replay_dlq"]("24h")
    remember_event("procedure", {"name": "replay_dlq", "result": result})
    working["steps_left"] -= 1
    working["goal_done"] = result["ran"]
    return result

print("act", act())
print("working", json.dumps(working))
print("episodic", [e["kind"] for e in episodic])
print("semantic keys", list(semantic))
print("procedures", list(procedural))
\`\`\`

Four dicts, four jobs. \`act\` reads a semantic fact, writes working state, appends episodic events, calls a procedure. Production is the same with Postgres, an object store, and a tool registry. If you only have a vector DB, you have a hammer, and every memory looks like a chunk.

The lambda in \`procedural\` is a stand-in for a real function. Procedures live in code review, not in a cosine neighbor of “how to replay.”

## Where RAG sits

Ingest + retrieve is how **semantic prose** gets into a prompt. It is not how you store “steps_left: 3.” It is not how you store “refund INV-17 ran at 10:04” unless you like incidents. You may **index** episodic summaries for search (“what did we try last outage”) — that is semantic-over-episodes, a second corpus with time filters, not a replacement for the event log.

## Four APIs, four failure modes

Mutate working state: if you only append chat lines, the goal drifts and “thanks” becomes the task. Rewrite JSON fields.

Append an event: if you only cosine for “did we replay the DLQ,” you retrieve a similar Tuesday. Filter episodic by time, kind, and id.

Upsert a fact: if untrusted pages can write, next week’s retrieve is poisoned. Write-back is the next-plus-one lesson.

Call a procedure: if “how to replay” lives only as a wiki chunk, Thursday’s wording differs from Wednesday’s. Compile playbooks into functions and schemas. RAG can **explain** the procedure; code **does** it.

Semantic-over-episodes is allowed as a **second** index: summaries of incidents, tagged with time, retrieved with a time filter. The event log remains the source of truth. Do not delete the log because search exists.

Profile rows (\`never_cash: true\`) are semantic and better than an embedded sentence. RAG still holds the prose runbook. Both can be true: a boolean for the runtime, a paragraph for the citation.

When someone says “long-term memory,” make them pick a type. Then pick a store. One vector soup is how all four fail at once.

## Common mistakes

- One vector index named memory.
- Embedding “ok thanks” as policy (next lesson).
- Letting procedures live only in wiki chunks so they drift.
- Asking cosine “did this id already refund.”

## How agents use this

When someone asks for “long-term memory,” ask which of the four they mean. Then pick a store that supports that API. RAG in this track is mostly **semantic**. Working memory is the next lesson. Write-back is how semantic upserts stay honest. The Agents track will loop working memory. If you skip the split, the loop will \`memory.add\` a novel every turn.

Citations apply to semantic prose you retrieved. They do not apply to a procedure that is a function call: the trace is the citation.

Draw the four boxes on the incident doc: JSON state, event log, handbook plus profile rows, tool code. If the ask was “remember this refund,” that is either an event (we paid) or a trusted profile field (never cash), not a vector of the chat. If the ask was “what does the runbook say,” that is retrieve on semantic chunks. If the ask was “replay the DLQ,” that is a procedure. Mixing them is how cosine answers “did INV-17 already refund” with a similar paragraph from last quarter.

\`\`\`quiz
Which store should a versioned runbook live in?
- Working memory (the live window only)
- Episodic memory (Tuesday’s chat)
- *Semantic memory (curated facts), with the procedure compiled into tools
- A single unsorted embedding of all Slack
explain: Runbooks are semantic. How to execute them is procedural. Chats are episodic. The window is working.
\`\`\`
`,
  },
  {
    slug: "working-memory",
    title: "Working Memory",
    summary:
      "Keep goal, budget, and last observation in a small JSON state you rewrite. Do not append the novel forever.",
    minutes: 19,
    level: "advanced",
    md: `
**Working memory** is short, authoritative, **structured**. Not a novel. Not a vector index of every “ok.” It is the live task: what we are doing **now**, how much budget remains, what the last observation was.

Put \`goal\`, \`budget_remaining\`, \`last_error\` (or \`last_obs\`) in a JSON object you **rewrite**. Rewrite means the new state **replaces** the old object (or you update fields in place). You do not append a 400-page transcript to the object and call it state. Transcripts belong in **episodic** storage if you need them.

When the transcript grows, people **summarize**. Summaries are **lossy**. Keep the raw trace in episodic storage with a pointer from working memory (\`trace_id\`). Never let a summary become the only copy of a refund receipt, an id, or a policy exception. Those are fields or events, not vibes.

\`\`\`viz flow
title Rewrite a small state
layout tb
node goal Goal
node bud Budget
node obs Last observation
edge goal bud
edge bud obs
caption Do not append the novel. Thanks is not the new goal.
\`\`\`

## What does not belong

Do not embed every “ok” and “thanks.” That is how vector memory fills with noise and then retrieves “ok” as policy. Chit-chat is not a goal. Tool results are observations; user thanks are not.

Do not put the whole wiki in working memory. That is semantic retrieve + pack. Working memory may hold **ids of** packed chunks (\`evidence_ids: ["runbook.md#oom"]\`), not the 8,000-token dump, unless the dump already fits your cap — and it should not.

Cap working memory like you cap observations. If \`json.dumps(state)\` exceeds a limit, you have a bug: you stuffed a novel into a field. Fail or trim **fields you declared trimmable**, not the goal and not money ids.

\`\`\`tryit python
import json

def compress(turns, max_chars=80):
    state = {"goal": None, "last_obs": None, "n": 0}
    log = []
    for t in turns:
        state["n"] += 1
        if t["role"] == "user" and state["goal"] is None:
            state["goal"] = t["text"]
        if t["role"] == "tool":
            state["last_obs"] = t["text"]
            log.append({"kind": "tool", "text": t["text"]})
        blob = json.dumps(state)
        if len(blob) > max_chars:
            return {"error": "working_too_big", "state": state}
    return {"state": state, "episodic_n": len(log)}

turns = [
    {"role": "user", "text": "fix OOM"},
    {"role": "tool", "text": "raise memory"},
    {"role": "user", "text": "ok thanks"},
    {"role": "tool", "text": "replay-dlq done"},
]
print(json.dumps(compress(turns), indent=2))
print("chatter was not the goal", compress(turns)["state"]["goal"] == "fix OOM")
\`\`\`

“ok thanks” did not overwrite the goal. The first **user** line is the goal; later chatter is ignored for that field. Last observation is the **tool** result, not the chit-chat. Episodic \`log\` holds tool events (two of them). Working state stays small. If you lower \`max_chars\` far enough, you get \`working_too_big\` — that is the cap firing. Raise it for the demo; keep a cap in production.

This is not the agent loop. There is no “think, act, observe” driver here. There is a **compress** function that other code will call after each observation. Learn the state shape first.

## Rewrite after every observation

After retrieve, set \`last_obs\` to a **handle** (packed evidence ids + scores), not necessarily the full block if the assembler already has the block for this turn. After a tool (later track), set last_obs to the tool JSON. Decrement budget in the same rewrite. If you only append to a list named memory, you do not have working memory. You have a pile.

Working memory should be **serializable** (JSON) so you can store it with a job id and resume. Vectors of the chat are not a resume format.

## Fields, caps, and what summaries may lose

Required fields: \`goal\`, a budget (steps or tokens remaining), \`last_obs\` (a short handle), maybe \`evidence_ids\`. Optional: \`last_error\`. Forbidden: the company wiki, every user thanks, a second copy of the packed DATA block unless it already fits a cap you enforce in code.

Rewrite after every observation: retrieve returns, you set evidence ids and last_obs handle; you do not concatenate the chunk texts into state. The assembler already has the packed block for this turn. Next turn, retrieve again or \`get_doc\` if you still need the parent.

Summaries: if the transcript is huge, summarize **episodic** text into a short field **and** keep \`trace_id\`. A summary may drop the exact cents. Cents belong in a field or an event, not in a paragraph the model wrote about the paragraph.

Cap: if \`json.dumps(state)\` exceeds N characters, fail or trim only fields marked trimmable. Never trim goal. Never trim money ids. “Working too big” is a product bug, not a reason to embed the overflow.

Chit-chat does not overwrite goal. First user task line wins until a **new task** is declared in a structured way, not until someone says thanks.

This is a store. The loop that calls compress is later. If the store is a novel, the loop cannot see the goal.

## Common mistakes

- Goal overwritten by “thanks.”
- Budget only in the prompt prose, not in a field you decrement in code.
- Summary as the only copy of an id.
- Embedding working state “for long term” every turn.

## How agents use this

Rewrite working state after every retrieve (and later, after every tool call). Cap its size like you cap observations. If you must summarize, store the summary **and** a pointer to the full trace.

The loop later reads \`goal\` and \`budget_remaining\` from this object. If you stuffed the wiki into \`last_obs\`, packing was skipped and the bill is the state. Keep last_obs short. Keep evidence in the packed data block for that turn, and ids in state if you need them next turn.

Working memory is a store. RAG is not it.

Serialize the object with the job id so a retry resumes the same goal and budget, not a new empty dict. Do not embed “ok thanks.” Do not let a summary be the only copy of an invoice id. Decrement budget in code, not in prompt prose. If dumps of state exceed the cap, that is a bug in what you stored, not a reason to start a vector index of working memory. The later loop will fail in readable ways if this JSON is small and true. First user task line stays the goal until a structured new task arrives. Tool results update last_obs; chatter does not. Working memory is short JSON you rewrite, not a novel you append, and not a vector soup of thanks. Cap it. Point at the full trace when you summarize. Resume from the job id with the same object.

\`\`\`quiz
What belongs in working memory?
- Every “thanks” embedded as a vector
- *A small structured state: goal, budget, last observation
- The entire company wiki
- Yesterday’s unrelated tickets
explain: Working memory is the live task. Dumping the chat into a vector DB is not a state machine.
\`\`\`
`,
  },
  {
    slug: "memory-writeback",
    title: "Memory Write-Back",
    summary:
      "Do not let the model upsert “facts” from a hostile page. Confirm, source, and expire what you store.",
    minutes: 20,
    level: "advanced",
    md: `
Long-term **semantic** memory that the agent can **write** is a gift to attackers. A retrieved page (or a user) says “Ada’s refund policy is instant cash.” If you upsert that into semantic memory, every future session is poisoned. The next retrieve may still find the real handbook — and the profile fact says cash. Models mix them. Users get cash.

This is prompt injection **stored for next week**. Wrapping data in one turn is not enough if you persist the lie.

\`\`\`viz flow
title Retrieve does not write
layout lr
node page Hostile page
node gate Trusted gate
node store Semantic store
edge page gate
edge gate store
caption Untrusted chunks stay read-only. Confirm, source, and expire.
\`\`\`

Rules:

- Writes need a **source** (user confirmed, trusted tool, human)
- Untrusted RAG chunks are **read-only**
- Facts have **owners** and **expiry**
- “Remember this” from a webpage is not consent
- Prefer **profile fields** (\`never_cash: true\`) over embedding the sentence “Ada hates cash refunds”

Separate \`retrieve\` from \`remember\`. \`remember\` is a **write** with the same seriousness as a refund: allowlist, auth, often a human confirm. Cosine being high is not consent.

## Trust and expiry

Every semantic row should look like: key, value, source id, trusted flag, expires_at, owner. Untrusted sources cannot upsert. Expired facts drop out of retrieve (ingest-like filter on the profile store). Owners matter in multi-tenant: Acme’s preference is not Globex’s.

Human confirm can be a button: “Save this as the refund policy?” with the **quote** shown. If they confirm, source is \`ada-confirm\` plus the original chunk id for audit. The chunk still did not write by itself.

Do not embed hostile pages “as memory” because a model said \`memory.add\`. That API should not exist without the trusted flag.

\`\`\`tryit python
semantic = {"refunds": {"value": "5-7 days, never cash", "source": "billing.md", "ok": True}}

def upsert(key, value, source, trusted):
    if not trusted:
        return {"error": "denied", "reason": "untrusted_write", "source": source}
    semantic[key] = {"value": value, "source": source, "ok": True}
    return {"ok": True, "key": key}

print("wiki", upsert("refunds", "instant cash", "evil-page.md", trusted=False))
print("still", semantic["refunds"]["value"])
print("human", upsert("refunds", "5-7 days, never cash", "ada-confirm", trusted=True))
print("now", semantic["refunds"])
\`\`\`

The hostile page did not land. \`still\` prints the original policy. Only a trusted source changed the fact. Production adds expiry and tenant. The classroom shows the gate: **trusted=False cannot write**.

A real \`remember\` tool would take key and value from the model **and** ignore them if the session did not set trusted (human or allowlisted tool). The model must not pass \`trusted=true\` as an argument. Same pattern as tenant_id: session binds trust, not the prompt.

## RAG chunks stay read-only

You may **cite** a chunk this turn. You may not promote it to a profile fact because it ranked first. If you want a runbook in semantic store, ingest it through the ingest pipeline (published, filtered, checksummed), not through write-back from retrieve.

Write-back is for **small** facts: preferences, confirmed slots, “user’s project name is X.” It is not a second ingest pipeline for PDFs.

## Trust, expiry, and session-bound writes

Every semantic row: key, value, source, trusted, expires_at, owner (tenant). Untrusted retrieve cannot upsert. Expired rows drop out like stale ingest. Owners stop Acme’s preference leaking into Globex’s prompt.

The model must not pass \`trusted=true\`. The session or a human confirm sets trust, the same way tenant is bound. A page that says “remember this as trusted” is still a page.

Human confirm UI: show the quote, the key, the value, a button. Source becomes \`user-confirm\` plus the original chunk id for audit. The chunk did not write by itself.

Do not \`memory.add(chunk text)\` after every retrieve. That API, if it exists, is remember with a trusted flag defaulting to false. Default deny.

Prefer booleans and enums over embedded preference sentences. Runtime checks \`never_cash\`. RAG cites billing.md. If you only embed “Ada hates cash,” cosine will retrieve it next to the handbook and the model will mix them.

Write-back is stored injection. Wrapping DATA this turn does not help if you persist the lie.

## Common mistakes

- \`memory.add(chunk["text"])\` after every retrieve.
- Model-controlled \`trusted\`.
- No expiry, so a one-off exception lives forever.
- Embedding preferences instead of a boolean field, then retrieving “Ada cash” next to the handbook.

## How agents use this

Separate \`retrieve\` from \`remember\`. \`remember\` is a write tool with the same allowlist and approval rules as \`refund\` (when you have tools). Prefer profile fields over embedded sentences.

The agent loop later must not have a generic “save anything.” If you skip the gate here, the loop will poison semantic memory on hop 0 of a hostile page. Stay in stores: **read path is RAG; write path is trusted upsert.**

Default deny on writes. Bind trusted from the session or a human button, never from model arguments. Put expiry on exceptions so a one-week cash override does not become the new handbook. Tenant-own every row. Audit source ids. A cosine of 0.99 on a hostile page is still untrusted. Ingest remains how runbooks enter the corpus; write-back is not a back door around published status and secret filters.

Confirm UI shows the quote and the field. “Remember this” from a webpage is not consent. Prefer \`never_cash: true\` over embedding a sentence about Ada. Separate retrieve (read) from remember (write). If remember is later a tool, it gets the same seriousness as refund: allowlist, auth, often a human. Stored injection lasts until you delete the row — longer than one wrapped turn.

Expiry, owner, and source are how you operate the table. Untrusted chunks stay read-only even when they rank first. Runbooks still enter through ingest, not through a model that said memory.add. That split is the whole store design. If you only remember one rule: retrieve is read; remember is a gated write with a human or a trusted tool behind it. High cosine is not permission to persist. A hostile page that ranks first is still read-only. Next week’s sessions will quote whatever you upserted. That is why remember is gated and retrieve is not a writer. Confirm, source, expire, own by tenant. Retrieve does not write. Ingest is how a runbook becomes a chunk. A model saying “save this” from a wiki page is not a source of truth and must not land in the profile table.

\`\`\`quiz
When may an agent write a new long-term fact from retrieved text?
- Always; that is learning
- *Never from untrusted chunks; only from a trusted source or a human confirm
- When cosine is high
- When the page said please
explain: Write-back is stored injection. Untrusted observations stay read-only.
\`\`\`
`,
  },
  {
    slug: "recall-at-k",
    title: "Recall@k and RAG Evals",
    summary:
      "You do not need an LLM to test retrieval. You need gold chunk ids and a number: did they appear in the top k?",
    minutes: 21,
    level: "advanced",
    md: `
**Recall@k** is simple: for each eval question, you know a **gold** chunk id (or a set of ids). Retrieval succeeds if that id is in the top k **after** filters, hybrid, fusion, rerank — whatever you actually ship. You do not need a judge model. You need labels and a function.

If stage 1 recall is 0, do not spend a week on the system prompt. Generation cannot cite a chunk that never entered the pile.

\`\`\`viz bars
title Gold in the top k
bar recall@1,0.50,1
bar recall@2,1.00,0
caption If gold sits in slot 2, packing n=1 was the bug, not the model.
\`\`\`

You also want, on the same golden set:

- **Faithfulness** of the final answer (citation substring checker)
- **Refuse rate** on questions with no gold chunk (\`should_refuse: true\`)
- **Leak rate** on neighbor-tenant questions (must be 0)
- **Latency** of retrieve + rerank (and hops if you allow them)

Keep a golden set of (question, gold_ids, should_refuse). Re-run it in **CI** when you change chunking, embeddings, \`alpha\`, ANN parameters, or rewrite tables. That is the cheapest RAG eval. The Evals track will add judges and traces at agent scale. This classroom already has a unit test.

## Labels are the work

Gold ids must match **current** chunk ids. If you re-chunk, you re-label or you map via source+offsets. Stale gold is how you “fail CI” after a good ingest. Store gold as source path plus a quote, then resolve to id at eval time if ids churn.

Include **hard** questions: identifiers, paraphrase, negation, no-hit, multi-hop joins. If 80 items are easy FAQs, recall looks fine. Force the tail.

Do not use production traffic as the only eval. Production has no gold. Sample it to **propose** new labels, then humans confirm.

\`\`\`tryit python
GOLD = [
    {"q": "refund days", "gold": {"billing"}, "refuse": False},
    {"q": "OOM worker", "gold": {"runbook"}, "refuse": False},
    {"q": "equine dental", "gold": set(), "refuse": True},
]

CHUNKS = {
    "billing": "Refunds take 5-7 days. Never cash.",
    "runbook": "Runner OOM: raise worker memory.",
    "menu": "Pizza on Fridays.",
}

def retrieve(q, k=1):
    qw = set(q.lower().split())
    ranked = sorted(CHUNKS.items(), key=lambda kv: -len(qw & set(kv[1].lower().split())))
    return [cid for cid, _ in ranked[:k]]

def eval_set(k=1, tau_words=1):
    hits = 0
    n_has_gold = 0
    refuse_ok = 0
    for row in GOLD:
        ids = retrieve(row["q"], k=k)
        qw = set(row["q"].lower().split())
        best = max(len(qw & set(CHUNKS[i].lower().split())) for i in ids)
        refused = best < tau_words
        if row["refuse"]:
            refuse_ok += int(refused)
        else:
            n_has_gold += 1
            hits += int(len(set(ids) & row["gold"]) > 0)
    return {
        "recall_at_k": hits / n_has_gold,
        "refuse_accuracy": refuse_ok / sum(1 for r in GOLD if r["refuse"]),
    }

print(eval_set(k=1))
print(eval_set(k=2))
\`\`\`

One number for hits, one for honest refuses. No model in the loop. \`k=1\` vs \`k=2\` shows whether gold was sitting in slot 2. If recall jumps from 0.5 to 1.0 at k=2, packing n=1 was the bug, not the embedder. Print both. Add a tenant leak row in production tests: retrieve as Acme, gold empty, neighbor chunk must not appear.

Word overlap stands in for your real retrieve function. Swap the body; keep the GOLD shape.

## Grade retrieval before generation

A faithfulness fail with recall@k=1 is a generate/cite bug. A faithfulness fail with recall@k=0 is a retrieve bug you mislabeled. Split the dashboard. Trace hop queries on failures (agentic RAG). If rewrite changed the query, store both strings in the eval record.

CI should fail the build when recall@k on the critical tag (billing, runbooks) drops below a floor you chose. Do not block on exact-string answer diffs. Do block on gold chunk missing.

## Labels, stages, and what not to judge yet

Gold as source path plus quote, resolved to id at eval time, survives re-chunking better than a raw \`c17\`. If ids churn every ingest, your eval is measuring ingest noise.

Hard cases: identifiers, paraphrase, negation, no-hit, tenant leak, a join that needs two hops. Easy FAQ-only sets hide every lesson in this track.

Grade retrieve **before** generate. recall@k on packed ids (after hybrid, RRF, rerank, MMR, pack), not only on stage-1 piles. If pack drops gold, recall@k of the pile can look fine while the prompt never saw the fact. Log both pile recall and packed recall.

Refuse accuracy on \`should_refuse\` rows. Leak rate must be 0 on neighbor-tenant rows. Latency of retrieve plus rerank sits next to those numbers. ANN vs brute on a subsample is an index eval inside the same CI.

Do not hire a large model to score retrieval. Gold ids are cheaper and less circular. Judges come later for leftover prose. They do not replace this unit test.

When rewrite runs, store raw and rewritten queries on the eval record. Failures need both strings.

## Common mistakes

- Only judging final prose with a large model.
- Gold ids that do not exist after re-chunk.
- No refuse cases.
- Measuring ANN latency without recall.

## How agents use this

Grade retrieval **before** generation. Trace hop queries on failures. When retrieve is a library the later loop calls, this eval still owns the library. The loop evals are extra: did it call retrieve vs \`get_invoice\`. Do not skip library tests because you plan a loop.

You do not need an LLM to test retrieval. You need gold chunk ids and a number.

Run the set in CI on every chunking, embedder, alpha, ANN, and rewrite change. Report packed recall@k, pile recall@k, refuse accuracy, leak rate, and latency. Resolve gold from path plus quote when ids churn. Include identifier questions and no-hit questions. When packed recall is 0, stop tuning the generator. When pile recall is 1 and packed recall is 0, stop tuning the embedder and open the packer. Store raw and rewritten queries on the row. That is enough to debug this track without a judge.

Labels are the work. Easy FAQ-only sets hide hybrid and hop bugs. Neighbor-tenant rows must stay at leak rate 0. Stage-1 recall of 0 means rerank is decoration. You can write this eval with lists, sets, and division. No extra numeric library. No judge model. Generation evals wait until gold is in the pile.

Keep gold as path plus quote when ids churn. Re-run in CI. Split the dashboard: retrieve numbers first, then citation substring rate, then refuse. A pretty chat demo is not an eval. A gold id in top k is. Packed recall and pile recall are different numbers. Refuse rows and leak rows belong in the same job. Trace hop queries when a join fails. No LLM is required to know whether the chunk appeared. Gold path plus quote, resolve to id, check membership in top k, check refuse on empty gold, check leak on neighbor tenant. Put that function in CI. Generation waits.

\`\`\`quiz
What is the cheapest RAG eval?
- Hire a larger model
- *A gold chunk id per question and recall@k (plus refuse on no-hit)
- Production traffic only
- Reading the README
explain: Retrieval is a function. Unit-test it. Generation evals come after the gold chunk is in the pile.
\`\`\`
`,
  },
  {
    slug: "when-rag-fails",
    title: "When RAG Fails",
    summary:
      "Fix chunking, filters, and citations before you fine-tune. The next track is agents: loops that call retrieve as one action among many.",
    minutes: 18,
    level: "advanced",
    md: `
When RAG looks “dumb,” walk the pipeline in **order**. Do not skip to a larger generator at step 0. The model cannot cite a chunk that was never retrieved, never packed, or never ingested.

1. **Is it even a RAG job?** Ids belong to tools. Fuzzy search is a slow, wrong database.
2. **Ingest** — is the doc published, fresh, and safe? Check \`indexed_at\` and skip reasons.
3. **Chunking** — does a human see the fact in **one** chunk? Inspect the gold section.
4. **Retrieve** — print scores; check tenant filters; check hybrid for ids; check ANN vs brute on a subsample.
5. **Pack** — did you drop the gold chunk on a size cap or drown it in duplicates?
6. **Generate** — is the quote a real substring of packed evidence?
7. **Write-back** — did you poison semantic memory last week?

That list is the on-call guide. Each stage already had a lesson. Failures map to stages. Adjectives in the prompt are not a stage.

\`\`\`viz flow
title Walk the pipeline in order
layout tb
node ing Ingest
node chk Chunk
node ret Retrieve
node pack Pack
node cite Cite
edge ing chk
edge chk ret
edge ret pack
edge pack cite
caption Fix the first miss. A larger generator cannot cite a missing chunk.
\`\`\`

## Maps from symptoms

- “Didn’t read the runbook” → often ingest, chunk, retrieve, or pack. Open the trace’s chunk ids.
- “Invented a procedure” → empty retrieve without refuse, or unfaithful generate. Check tau and the citation checker.
- “Cited the neighbor tenant” → filters. Incident, not a prompt tweak.
- “INV-17 retrieved a blog” → needed a tool, or hybrid/pin failed.
- “Sure, three times” → near-duplicate pack, no MMR.
- “Yesterday’s policy” → ingest lag or missing deletes.
- “Followed a wiki order to skip policy” → chunks in instructions, no wrap.

## When this track is not enough

If the product must **choose** retrieve vs \`get_invoice\` vs stop, you need the **Agents** track: loops, state, when not to agent. This track gave you the **library**: chunks, embed, search, citations, memory stores. The loop is later on purpose. If you cannot retrieve the right paragraph, a loop will only retrieve the wrong paragraph faster.

If you need graders, traces at job scale, and judges, that is **Evals**. You already have recall@k and quote-in-source. Use them.

RAG stays the library. Agents stay the loop. Tools stay the hands. Mixing all three into one vector soup is how this track started, in reverse.

\`\`\`tryit python
def diagnose(row):
    if row.get("has_id") and not row.get("called_tool"):
        return "use_tool_not_rag"
    if not row.get("in_index"):
        return "ingest"
    if row.get("gold_split_across_chunks"):
        return "chunking"
    if row.get("recall_at_k") == 0:
        return "retrieve"
    if row.get("packed_out"):
        return "pack"
    if not row.get("quote_ok"):
        return "citation"
    if row.get("poisoned"):
        return "writeback"
    return "ok"

cases = [
    {"has_id": True, "called_tool": False},
    {"has_id": False, "in_index": False},
    {"has_id": False, "in_index": True, "recall_at_k": 0},
    {"has_id": False, "in_index": True, "recall_at_k": 1, "quote_ok": False},
    {"has_id": False, "in_index": True, "recall_at_k": 1, "quote_ok": True},
]
for c in cases:
    print(c, "->", diagnose(c))
\`\`\`

Each failure maps to a stage you already tested. Invoice id without a tool → \`use_tool_not_rag\`. Missing from index → ingest. Gold never in top-k → retrieve (which includes filters, hybrid, ANN). Packed out → raise budget or drop duplicates. Quote not a substring → citation checker. The last case is \`ok\` if write-back was not poisoned.

Walk a real ticket through this function as a checklist even when you do not have all keys — fill them from the trace. The first True (or missing ingest) wins. That order is the point.

## Symptoms to stages, and what comes after this track

“Didn’t read the runbook” is not one bug. Open chunk ids in the trace. Missing from index is ingest. Fact split across windows is chunking. Gold not in top-k is retrieve (filters, hybrid, ANN, tau). Gold retrieved but absent from DATA is pack. Quote not a substring is citation. Neighbor tenant is a leak. Yesterday’s policy is freshness. A wiki order that skipped runtime policy is wrap.

Do not fine-tune because recall@k is 0. Do not buy a new vector database for 400 chunks. Do not rewrite personality because tau is 0.12.

The Agents track is for choosing retrieve versus \`get_invoice\` versus stop. This track is the library those actions call. If the library is wrong, the loop is a faster wrong. The Evals track adds judges and job-scale traces. You already have recall@k and quote-in-source.

Keep the checklist next to the golden set. On-call starts at ingest, not at adjectives. RAG stays the library. Memory stays four stores, not one soup. Citations stay substrings.

## Common mistakes

- Fine-tune because recall@k is 0.
- New prompt personality because tau is 0.12.
- New vector database because 400 chunks were brute-force fine.
- Skipping the golden set because the demo was pretty.

## How agents use this

Keep this checklist next to the golden set. When a ticket says “the bot is stupid,” start at ingest, not at adjectives in the prompt.

The later agent loop will add failures (wrong tool, infinite steps). Those are not RAG failures. Do not debug them with cosine. Do not debug cosine misses with a bigger loop.

You now have the library. Use it. Measure it. Do not skip a stage.

Walk the seven stages with the trace open: tool-vs-RAG, ingest, chunk, retrieve (filters, hybrid, ANN, tau), pack, citation substring, write-back poison. The first failing stage is the ticket. Fine-tunes and new databases are last. The Agents track starts when this checklist is green and the product still must choose retrieve versus lookup versus stop. Until then, you are polishing a library that cannot find the paragraph.

Print scores. Open the chunk. Check indexed_at. Check tenant. Check whether the quote is a substring. That walk is faster than a new model. RAG remains the library. Agents remain the loop. Tools remain the hands. Memory remains four stores. If you remember one order, remember ingest before prompt adjectives.

When recall@k is zero, stop at retrieve. When the quote is fake, stop at citations. When the neighbor tenant appears, stop at filters and treat it as a leak. Do not skip a stage because a larger generator is on sale. The checklist is the on-call guide: tool versus RAG, ingest, chunk, retrieve, pack, cite, write-back. The first miss is the ticket. This track ends at a working library. The loop is later. If the library cannot find the paragraph, a loop will not teach it. Start at ingest. Print scores. Open the chunk. Cite a real substring or refuse. Do not fine-tune step 0.

\`\`\`quiz
If recall@k is zero, what should you fix first?
- The system prompt’s personality
- *Chunking, ingest, filters, or the retriever — the gold chunk never entered the prompt
- A larger generator
- Memory write-back
explain: Generation cannot cite a chunk that was never retrieved. Fix the library before the prose.
\`\`\`
`,
  },
];
