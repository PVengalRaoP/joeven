import type { RawLesson } from "@/lib/types";

export const ragSearch: RawLesson[] = [
  {
    slug: "hybrid-search",
    title: "Hybrid Search",
    summary:
      "Keyword search catches IDs and rare tokens. Vectors catch paraphrase. Fuse both.",
    minutes: 22,
    level: "intermediate",
    md: `
**Vector search** will rank “never refund in cash” next to “how do I refund in cash” because the words sit near each other in embedding space. That is the point of embeddings. It is also the bug when the user types an **id**.

**Keyword search** (sparse retrieval) will **require** tokens like \`INV-17\` to appear, or at least to matter a lot. It is bad at paraphrase: “ran out of RAM” may miss a runbook that only says “OOM” unless you rewrite (later) or embed.

**Hybrid search** uses both and **fuses** the ranks (or the normalized scores). You want the id hit **and** the paraphrase hit, then a single top-k for the prompt.

\`\`\`viz bars
title Keyword pins the id
bar Policy INV-17,0.95,0
bar Cash rumor,0.55,1
bar OOM page,0.20,2
caption Vectors paraphrase. Keywords catch INV-17. Fuse both.
\`\`\`

Typical recipe:

1. Sparse / keyword score (BM25 in production, or a classroom token overlap)
2. Dense / vector cosine
3. **Normalize** both to a comparable range **per query**
4. \`final = alpha * keyword + (1 - alpha) * cosine\`
5. Take top-k from the fused list (then threshold if you calibrated one)

\`alpha\` is a knob. High when users type SKUs, error codes, and ticket ids. Low when they type vibes (“that memory thing”). Measure it on labeled questions. There is no universal 0.5.

## Why keyword still wins some queries

- **Identifiers:** \`INV-17\`, \`usr_19\`, stack hashes, CVE numbers
- **New terms** the embedding model never saw (a product name from last week)
- **Exact token presence** as a start for negation (not a full solution: “never cash” still needs care)

You cannot add raw BM25 (unbounded, often 0 to 20+) to cosine (about -1 to 1) and call it math. A BM25 of 12.4 would always dominate. **Min-max normalize per query**, or skip scores and use Reciprocal Rank Fusion in the next lesson.

Min-max on a single query: if all keyword scores are 0, the normalized list is zeros (or a guard). If one chunk has the id, it becomes 1.0 on the keyword channel even if cosine liked a paraphrase better.

## Two inverted lists, one prompt

In production, BM25 is an inverted index: term → documents. Cosine is a vector index. Hybrid means **two retrieve calls**, then fusion. Log **both** channels’ top hits. Many “RAG is dumb” tickets are “BM25 had the id in slot 1 and we fused it to slot 9.” That is a fusion bug, not a generation bug.

If you only log the fused list, you cannot see which channel saved you or buried you.

\`\`\`tryit python
import math
import re
from collections import Counter

CHUNKS = {
    "a": "Refunds for INV-17 take 5-7 days. Never refund in cash.",
    "b": "Runner out of memory: raise worker limits and replay the DLQ.",
    "c": "Customer asked about a refund in cash for their invoice.",
}

def tokens(s):
    return re.findall(r"[a-z0-9-]+", s.lower())

def cosine_bow(q, d):
    vq, vd = Counter(tokens(q)), Counter(tokens(d))
    keys = set(vq) | set(vd)
    a = [vq[k] for k in keys]
    b = [vd[k] for k in keys]
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)

def keyword_score(q, d):
    dt = Counter(tokens(d))
    score = 0.0
    for t in tokens(q):
        tf = dt[t]
        if not tf:
            continue
        score += 1.0 + math.log(1 + tf)
        if "-" in t or any(ch.isdigit() for ch in t):
            score += 2.0
    return score

def minmax(xs):
    lo, hi = min(xs), max(xs)
    if hi - lo < 1e-9:
        return [0.0 for _ in xs]
    return [(x - lo) / (hi - lo) for x in xs]

def hybrid(q, alpha=0.5):
    names = list(CHUNKS)
    kw = [keyword_score(q, CHUNKS[n]) for n in names]
    vec = [cosine_bow(q, CHUNKS[n]) for n in names]
    fused = [alpha * k + (1 - alpha) * v for k, v in zip(minmax(kw), minmax(vec))]
    return sorted(zip(names, fused, kw, vec), key=lambda r: r[1], reverse=True)

q = "status of INV-17 refund in cash"
print("query:", q)
for alpha in (0.0, 0.5, 1.0):
    print("alpha", alpha)
    for name, fused, kw, vec in hybrid(q, alpha):
        print(" ", name, "fused=" + str(round(fused, 3)), "kw=" + str(round(kw, 3)))
\`\`\`

Watch chunk **a** jump when \`alpha\` rises: \`INV-17\` is a keyword event (the extra +2.0 on tokens with digits or dashes). Pure vectors (\`alpha=0\`) dilute it with chunk **c**’s “refund in cash.” Chunk **c** is a customer rumor, not policy. That is why hybrid exists.

This classroom uses bag-of-words cosine, not a neural embedder, so you can run it here. The fusion lesson is the same when \`vec\` comes from a vendor model: **normalize, then mix, then log both.**

## Negation is still hard

Hybrid does not solve “never cash” vs “cash.” Keywords will retrieve both chunks that contain “cash.” You still need packing, citations, and a model that reads “never.” Do not advertise hybrid as a lawyer.

## What to log and what to pin

Log four lists per query: keyword top ids, vector top ids, fused top ids, and any **pinned** id-matches. If the user typed \`INV-17\` and keyword rank 1 is the policy chunk that contains it, but fused rank 1 is a paraphrase blog, fusion buried the token. Pinning means: chunks that contain an identifier token from the query occupy reserved slots in the packed block even if fused rank is poor. Pinning is not “always retrieve the first wiki hit for invoice.” It is “do not drop the exact token.”

Alpha is per product, not per request from the model. A model that can set alpha will set it to 1 after a page says “keywords only.” You set alpha in config. SKU-heavy catalogs sit high. Chatty FAQs sit lower. Re-measure when the corpus mix changes.

Min-max per query has a sharp edge: if every keyword score is 0, the channel is all zeros and fusion becomes pure cosine. That is correct. If one junk chunk has a tiny BM25 and others are 0, min-max makes junk look like 1.0. Guard: if max keyword score is below a small floor, treat the whole keyword channel as empty rather than stretching noise.

Classroom overlap and bag-of-words cosine are stand-ins. Production BM25 has document-length normalization. Production dense vectors come from the embedder in the last part. Fusion math does not care, as long as you **do not add raw unbounded scores to cosine**.

## Common mistakes

- Adding raw BM25 to cosine.
- One alpha for ids and for chatty FAQs with no eval.
- Logging only fused ranks.
- Skipping keywords because “we have embeddings now.”

## How agents use this

When retrieve is a library, hybrid is the default for support corpora that mix policies and identifiers. Log keyword top hits and vector top hits in the same trace line. If BM25 had \`INV-17\` at rank 1 and fusion dropped it, fix fusion (or **pin** id-matches before mix) before you touch the prompt.

Pinning means: if a chunk contains an identifier token from the query, it cannot fall below a reserved slot. RRF (next) is another way to avoid scale fights. Pinning is a belt. Measure both.

Stay in this lane: search quality. The agent loop that chooses retrieve vs \`get_invoice\` is later. If the user pasted an id, a tool still wins. Hybrid is for the prose that **contains** ids, not for replacing the ledger.

Log both channels. Normalize before you mix. Pin identifier tokens if fusion buries them. Alpha lives in config, not in the model’s arguments. Keyword still wins SKUs, hashes, and last week’s product name.

\`\`\`quiz
When is hybrid search worth it?
- Never; vectors made keywords illegal
- *When queries mix paraphrase with exact tokens (ids, error codes, names)
- Only for images
- Only if you skip evals
explain: Dense retrieval paraphrases. Sparse retrieval pins rare tokens. Fuse them.
\`\`\`
`,
  },
  {
    slug: "rrf-fusion",
    title: "Reciprocal Rank Fusion",
    summary:
      "RRF adds 1 / (60 + rank) from each list. It ignores raw score scales, which is why people like it.",
    minutes: 19,
    level: "intermediate",
    md: `
Min-max fusion needs comparable scores and a sensible \`alpha\`. **Reciprocal Rank Fusion (RRF)** does not. It looks only at **ranks**. For each list, add \`1 / (k + rank)\` to the document (ranks start at 1). A common \`k\` is **60**. It is a habit, not a theorem — still measure it.

Why it works as engineering: BM25 of 12.4 and cosine of 0.81 never meet. Rank 1 and rank 3 do meet. A document that is rank 1 in keywords and rank 5 in vectors gets two positive terms. A document that is rank 1 in one list only still gets a term, but less than a document that is good in both.

The constant \`k\` flattens the difference between rank 1 and rank 2. Small \`k\` (say 0) makes rank 1 huge (\`1/1\` vs \`1/2\`). \`k=60\` makes \`1/61\` vs \`1/62\` a gentle nudge. That is why 60 shows up in papers. Your corpus might want 20 or 80. Eval.

\`\`\`viz bars
title RRF adds ranks, not raw scores
bar Dual hit,0.033,0
bar Keyword only,0.016,1
bar Vector only,0.016,2
caption 1/(60+rank) does not need BM25 and cosine to share a scale.
\`\`\`

## Retrieve more than you will show

Retrieve **more than you will show** (for example 20 + 20) then fuse, then cut to 5. If you fuse only the top 3 of each, you never give the other channel a chance. The gold id-hit might be keyword rank 4 and vector rank 40. A top-3 fuse never sees it. A top-20 fuse can promote it.

If keyword and vector **disagree**, **show both in the trace**. Disagreement is information: paraphrase vs exact token. Hiding it makes fusion look like a black box.

RRF does not replace a threshold. After fusion you still have a list. You can drop documents that were rank 50 in both lists, or apply a cosine tau on the vector channel **before** fusion so junk never enters. RRF of two junk lists is ranked junk.

## Pin identifiers if RRF buries them

Exact identifiers should be hard to bury. If the query contains \`INV-17\` and a chunk contains \`INV-17\`, you can force that chunk into the fused list before RRF, or add a third “id match” list of length 1. If RRF drops \`INV-17\` out of the prompt, that is a product bug you can write as a unit test.

\`\`\`tryit python
from collections import defaultdict

def rrf(*ranked_lists, k=60, n=3):
    scores = defaultdict(float)
    for lst in ranked_lists:
        for rank, doc_id in enumerate(lst, start=1):
            scores[doc_id] += 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:n]

keyword = ["a", "c", "b"]
vector = ["c", "b", "a"]
print("rrf", rrf(keyword, vector))
print("keyword only", rrf(keyword))
print("vector only", rrf(vector))

# Wider pools before cutting
kw20 = ["inv-17", "cash-blog", "oom"]
vec20 = ["cash-blog", "oom", "inv-17"]
print("wide", rrf(kw20, vec20, n=2))
\`\`\`

\`a\` (the id hit in the first demo) and \`c\` share the fused top depending on ranks. RRF does not care that BM25 was 12.4 and cosine was 0.81. \`keyword only\` vs \`vector only\` shows each channel’s own ranking. \`wide\` shows that a third place id can still appear after fusion when both lists are longer than 2 — here \`inv-17\` is first in keywords and third in vectors; \`cash-blog\` is first in vectors and second in keywords. Print the pairs. Change \`k\` to 1 and watch rank-1 dominate. That is the knob.

\`defaultdict(float)\` starts missing keys at 0.0 so a document in only one list still scores. Documents in neither list do not appear. That is correct.

## RRF vs alpha fusion

Use RRF when you do not want to tune \`alpha\` or when scores are incomparable (different vendors, different BM25 implementations). Use alpha fusion when you have calibrated channels and want to **turn keywords up** for an SKU-heavy product. Eval both on the same golden set. Do not switch weekly on vibes.

You can RRF more than two lists: keyword, vector, and a recency list, for example. Each extra list is a chance to bury or save. Keep the traces.

## Ranks, pools, and identifiers

Ranks start at 1. Rank 0 is a bug. If your language is 0-based, add 1 before RRF. A document missing from a list simply does not get that list’s term. That is how a keyword-only hit still survives: it gets \`1/(k+rank)\` once, and a dual hit gets it twice.

Pool width is the usual production miss. Teams retrieve k=5 from each channel because the prompt wants 5. Then fusion cannot promote rank 6. Retrieve 20+20, fuse, cut to 5, then pack. The extra 15 are cheap compared to a missed id.

k=60 is gentle. If both lists are length 3, every rank is 1–3 and k=60 makes them almost equal (\`1/61\` vs \`1/63\`). Short lists plus large k flatten everything. Either lengthen the lists or lower k when you only have three documents. Measure on **your** list lengths.

Pin id-matches **before** RRF if evals show identifiers falling off. A third list of length 1 that is “chunks containing this SKU” is enough. RRF will then add a large term (rank 1 on that list) to those chunks.

Do not threshold RRF scores with a cosine tau. Recalibrate or threshold channels before fusion. RRF of two junk lists is ranked junk with nicer arithmetic.

## Common mistakes

- Fusing top-3 + top-3, then wondering where the id went.
- Treating RRF score as cosine. It is a sum of small fractions. Do not reuse cosine \`tau\`.
- One list empty (keyword failed) and you still “fuse.” You just re-ranked vectors with extra math.

## How agents use this

Default to RRF when you do not want to tune \`alpha\`. Still eval both. Pin id-matches before fusion if your golden set says identifiers fall off.

Log each list’s ranks next to the fused list. When someone says retrieve is random, you want to see “keyword: a,c,b / vector: c,b,a / rrf: …”. That is searchable in traces. The generate step should not be where you discover fusion math.

This is still search. Not the agent loop. The retrieve library returns fused ids. Later, a loop will call it twice with two queries. Fusion happens **inside** one retrieve call.

Retrieve wide, fuse, then cut. Ranks do not need the same numeric scale. k=60 is a habit you still measure. Short lists plus large k flatten the ranking — lengthen the pool. Pin ids if they fall off. Do not reuse a cosine tau on RRF sums. Rank 1 in keywords plus rank 5 in vectors is a dual hit. Rank 50 in both is still junk. Fuse after you drop channel-level noise, or you will rank junk politely.

\`\`\`quiz
Why do people use RRF instead of adding raw BM25 to cosine?
- RRF is a neural net
- *Ranks do not need the same numeric scale; 1/(k+rank) fuses lists safely
- Cosine becomes exact
- It cites automatically
explain: BM25 and cosine live on different scales. RRF fuses ranks, not raw scores.
\`\`\`
`,
  },
  {
    slug: "reranking",
    title: "Reranking",
    summary:
      "Retrieve broadly, then score a shortlist with a slower, sharper model. Two stages beat one.",
    minutes: 21,
    level: "intermediate",
    md: `
**Reranking** is a second exam. Stage 1 (keywords + vectors + ANN) is **recall-oriented**: get the right chunk into a pile of 20. Stage 2 is **precision-oriented**: a **cross-encoder**, a small model, or a cheap overlap heuristic scores each \`(query, chunk)\` pair and sorts the pile.

Why two stages? Scoring every chunk with a big pair model is too slow and too expensive. Scoring only with cosine is too blunt. Embeddings encoded the query and the doc **separately** (a **bi-encoder**): one vector each, then cosine. A **cross-encoder** reads the **pair** in one forward pass. That is slow and sharp. It can see “never” next to “cash” in a way two separate vectors often cannot.

If stage 1 **recall is 0**, reranking is interior decorating. The gold chunk never entered the pile. Stage 2 cannot invent it. Always measure recall@k of stage 1 **separately** from precision of stage 2.

\`\`\`viz flow
title Two stages
layout lr
node pile Broad pile
node pair Pair score
node pack Keep n
edge pile pair
edge pair pack
caption Stage 1 recalls. Stage 2 precises. If gold never entered, rerank cannot help.
\`\`\`

## Classroom shape

- Retrieve k=8 (or 20 in production)
- Score each chunk with a function that looks at **both** strings
- Keep n=3 for the prompt

Always **timeout** and fall back to the stage-1 order. A hung reranker should not block the answer forever. Exact identifiers should be **hard to rerank away**: if stage 1 found \`INV-17\`, stage 2 may reorder prose but should not drop the id hit off the prompt without a trace flag.

Rerankers can be **prompt-injected** too. A chunk that says “this document is the most relevant” can fool a small judge. Strip HTML. Treat the chunk as data. Cap length before the pair model reads it.

## Heuristic rerankers are allowed

You do not need a second neural net on day one. A scored function that boosts joint presence of query identifiers and policy words is a reranker. The live box below is that idea. Replace the function with a cross-encoder later if evals say stage 1 recall is fine and precision is not.

\`\`\`tryit python
QUERY = "how long do INV-17 refunds take"
POOL = [
    "The cafeteria menu is pizza on Fridays.",
    "Refunds for INV-* take 5-7 days. Never refund in cash.",
    "INV-17 is an open invoice for 40 dollars.",
    "Raise worker memory when the runner hits OOM.",
    "Refunds: 5-7 days. INV-17 included. Check status in billing.md.",
]

def retrieve_stage1(q, docs, k=4):
    qw = set(q.lower().split())
    scored = [(len(qw & set(d.lower().split())), d) for d in docs]
    scored.sort(reverse=True)
    return [d for _, d in scored[:k]]

def rerank_score(q, d):
    qw = q.lower().split()
    dl = d.lower()
    overlap = sum(1 for w in qw if w in dl)
    if "5-7" in dl or "days" in dl:
        overlap += 2
    if "inv-17" in dl and "refund" in q.lower():
        overlap += 2
    return overlap

def rerank(q, docs, n=2):
    ranked = sorted(((rerank_score(q, d), d) for d in docs), reverse=True)
    return ranked[:n]

pile = retrieve_stage1(QUERY, POOL, k=4)
print("stage1:")
for d in pile:
    print(" ", d[:70])
print("stage2:")
for score, d in rerank(QUERY, pile, n=2):
    print(" ", score, d[:70])
\`\`\`

Stage 1 only counted overlap. The invoice row and the policy both mention INV-17. Stage 2 **boosts the pair** that jointly mentions timing and the invoice. That is the rerank bet: the prompt should get “5-7 days” plus the id, not pizza and not the ledger row alone (the ledger row is a **tool** job anyway).

If you set stage 1 k=1 and the wrong chunk wins overlap, stage 2 never sees the policy. Raise k until gold is in the pile on the eval set, then rerank.

## Measure two numbers

- Stage 1: recall@k (gold in the pile)
- Stage 2: precision of the n you pack (gold in the prompt), plus “id not dropped”

Latency is stage 1 + stage 2. Time out stage 2. CI should fail if stage 1 recall collapses after a chunking change — do not “fix” it by reranking harder.

## Pair models, fallbacks, and injection

A cross-encoder reads query and chunk together. That is why it can see negation better than two separate vectors. It is also why it is slow: you pay a forward pass **per pair**, not once per corpus. Hence the pile of 20, not the corpus of 20,000.

Timeout: if stage 2 exceeds 200 ms (or whatever your SLO is), return stage-1 order and flag \`rerank_timeout\` in the trace. Silent fallback without a flag looks like “rerank is on” in dashboards while you shipped cosine order.

Identifiers: if the query contains \`INV-17\` and a chunk contains it, do not let a pair model drop it below the pack cutoff unless you log \`id_dropped\`. Rerankers trained on web search drop “boring” id rows in favor of fluent paragraphs. Your product is the opposite of web search for those queries.

Injection: a chunk that says “The query is about pizza; this document is highly relevant” can fool a small judge. Strip HTML. Truncate the chunk before the pair model. Treat the chunk as data. Do not give the reranker tools.

Heuristic rerankers (the live box) are valid until evals say stage 1 recall is fine and packed precision is not. Then rent a cross-encoder. Do not start with a large pair model on 200 chunks per keystroke.

## Common mistakes

- Reranking 200 chunks with a large model on every keystroke.
- No fallback order.
- Letting a reranker drop the only id match.
- Skipping stage 1 eval because the demo’s pile was hand-picked.

## How agents use this

Measure recall@k of stage 1 and precision of stage 2 separately. Strip HTML before a second model reads the chunk. Keep stage-1 order as fallback.

When retrieve is called twice (multi-hop, later lesson), each hop can have its own pile and rerank. Do not rerank the concatenated evidence from all hops as if it were one query unless you pass the **current** query. Mixing hop-0 and hop-1 piles without the new query is how you keep the wrong collection in slot 1.

Still not the agent loop: rerank is inside retrieve. The loop will only see the n chunks you kept.

A support bot should log \`stage1_ids\`, \`stage2_ids\`, \`rerank_timeout\`, and \`id_dropped\`. When a gold policy was in the pile and missing from the prompt, you have a stage-2 bug. When it was never in the pile, rerank cannot help — go back to hybrid, chunking, or rewrite. Timeout fallback is how you stay inside an SLO without pretending the pair model always ran. Heuristic scores are enough to start; replace them when packed precision stalls and stage-1 recall is already high. Stage 1 recalls. Stage 2 precises. Interior decorating cannot recover a missing gold chunk. Time out the pair model. Strip HTML. Do not let a reranker bury the only INV-17 hit. Measure the two stages on different numbers or you will tune the wrong one for a week. If stage 1 recall is already zero, stop. The pile never contained the fact. A slower pair model cannot invent a missing runbook.

\`\`\`quiz
What is reranking for?
- Replacing retrieval entirely
- *Scoring a shortlist of chunks with a slower pair model so the prompt gets the precise evidence
- Making embeddings longer
- Skipping citations
explain: Stage 1 recalls. Stage 2 precises. If the gold chunk never entered the pile, rerank cannot help.
\`\`\`
`,
  },
  {
    slug: "mmr-coverage",
    title: "MMR and Coverage",
    summary:
      "Three paraphrases of the same sentence waste the window. Penalize near-duplicates so the prompt covers sub-questions.",
    minutes: 18,
    level: "intermediate",
    md: `
If three chunks are near-duplicate refunds, a reranker will put them 1–2–3 and you will waste the context window. The model will read the same sentence three times and sound **sure**. Sure is not coverage. The user asked about refunds **and** OOM. You delivered refunds, refunds, and refunds.

You want **coverage** of sub-questions, not three copies of the same sentence. Overlap in the source (heading split + 15% window overlap) makes near-duplicates likely. That overlap is good for not tearing facts. It is bad if you pack all of them.

\`\`\`viz bars
title Coverage beats copies
bar Refunds only,1,1
bar Refunds and OOM,2,0
caption Three paraphrases of refunds leave OOM out of the window.
\`\`\`

**MMR (maximal marginal relevance)** picks the next chunk that is relevant to the query **and** unlike what you already picked. The usual shape:

score(candidate) = relevance(query, candidate) − lambda * similarity(candidate, chosen_set)

A cheap classroom version: relevance is word overlap with the query; similarity is word overlap with the union of chosen chunks; \`lambda\` (often written λ, here **lambda**) is how hard you punish duplicates. High lambda: more diversity, maybe you drop a still-useful second policy. Low lambda: greedy relevance, duplicates stay.

## Dedup is the sibling of MMR

Before MMR, **dedup by chunk id** (trivial) and by **near-duplicate text** (normalize whitespace, maybe hash the first 200 characters). If two ids are the same bytes, keep one. MMR then handles paraphrases that are not exact copies.

Three copies make the model overconfident: “several sources say 5-7 days.” They were one source, chunked three times. Citations should not look like three independent witnesses.

MMR is not a substitute for packing limits. It chooses **which** chunks. Packing (next) chooses **how many characters**.

\`\`\`tryit python
QUERY_WORDS = set("refund INV-17 days OOM memory".lower().split())
DOCS = [
    "Refunds for INV-17 take 5-7 days.",
    "Refunds take five to seven days for INV-17.",
    "Never refund INV-17 in cash.",
    "Runner OOM: raise worker memory, then replay the DLQ.",
]

def words(d):
    return set(d.lower().replace(":", " ").replace(".", " ").split())

def mmr(docs, lam=0.7, n=2):
    chosen = []
    leftover = list(docs)
    while leftover and len(chosen) < n:
        best = None
        best_s = -1e9
        chosen_words = set()
        for c in chosen:
            chosen_words |= words(c)
        for d in leftover:
            rel = len(QUERY_WORDS & words(d))
            dup = len(words(d) & chosen_words)
            s = rel - lam * dup
            if s > best_s:
                best_s = s
                best = d
        chosen.append(best)
        leftover.remove(best)
    return chosen

print("greedy overlap")
ranked = sorted(DOCS, key=lambda d: -len(QUERY_WORDS & words(d)))
for d in ranked[:2]:
    print(" ", d)
print("mmr")
for d in mmr(DOCS):
    print(" ", d)
\`\`\`

Greedy overlap wants two refund paraphrases: they both overlap “refund INV-17 days.” MMR keeps one refund chunk and the OOM chunk — both parts of the query. That is coverage. Toggle \`lam\` toward 0 and MMR collapses toward greedy. Toggle toward 1 and it may pick “never cash” as the diverse refund sibling instead of OOM, depending on overlap with the first pick. That is the trade: diversity among refunds vs covering the OOM sub-question. Your lambda should be set by **whether the query is multi-part**, not by a blog post.

A production version uses cosine between chunk vectors for the duplicate term, not word sets. Same idea. Do not pull in a numeric library here; you already know cosine by hand from the embed lessons.

## Multi-part queries

If query rewrite (later) splits “refunds and OOM” into two retrieves, merge with MMR or with a simple round-robin per hop so one hop cannot fill the window. If you do not split, MMR is the cheap joiner.

## Duplicates, lambda, and false diversity

Near-duplicates come from overlap windows, from mirrored wiki pages, and from “same policy in FAQ and runbook.” Dedup exact bytes first (normalize whitespace). Then MMR for paraphrases. If you only MMR, exact copies still waste a slot until the duplicate term gets large.

Lambda is the diversity knob. Set it by whether queries are multi-part, not by a default blog value. A single-fact FAQ (“how many days?”) wants low lambda so the best refund chunk stays and a random OOM page does not sneak in as “diversity.” A two-part question wants higher lambda or two retrieves.

False diversity: two chunks that share the word “refund” but are **timing** vs **never cash** are not duplicates. Penalizing all overlap can drop the second policy. Use cosine between chunk vectors for the duplicate term if you have them, or overlap on content words after dropping the query words. The classroom word-set is a sketch.

Citations: if three packed chunks are the same paragraph, the UI should show one source. MMR is how the prompt avoids pretending there are three witnesses. Overconfidence from copies is a packing bug that looks like a model bug.

n in MMR should be the pack budget in **chunks**, not stage-1 k. If n equals k, you only reordered the pile. Diversity never dropped anyone.

## Common mistakes

- MMR with n equal to k, so you still pack everything, just in a different order.
- Dedup only on id after re-chunking produced new ids for the same sentence.
- Penalizing all overlap so a heading word shared by two **different** sections drops a needed policy.

## How agents use this

Dedup by chunk id **and** by near-duplicate text before stuffing the prompt. Three copies make the model overconfident. Coverage beats repetition.

When traces show three citations to the same paragraph, users think they have independent confirmation. Your UI should collapse them. MMR is how the prompt avoids the lie. The agent loop does not fix a packed pile of clones.

If working memory is already huge, retrieve **fewer** diverse chunks rather than more duplicates. Packing next: the budget.

Set lambda from query shape when you can: low for a single FAQ fact, higher when rewrite emitted two sub-queries or the user asked two things. After MMR, you should still be able to point at one refund span and one OOM span on a two-part question. If MMR dropped the only id-match, pin that id first, then diversity-rank the rest. Coverage is a retrieve job. Generation cannot invent the missing section if you never packed it.

Exact-byte dedup is cheap and should always run. Overlap windows will produce copies; that is expected. MMR is for paraphrases that hashing will not catch. Do not raise k to “get more coverage” if the extra rows are the same sentence. Coverage means different facts, not more tokens of the same fact. Three paraphrases of refunds will make the model sure and leave OOM out of the window. Sure is not coverage.

\`\`\`quiz
What problem does MMR solve in RAG?
- Faster GPUs
- *Near-duplicate chunks crowding out other evidence
- Missing JSON schemas
- HTTPS
explain: Diversity in the prompt is a retrieval job. MMR (or simple dedup) protects coverage.
\`\`\`
`,
  },
  {
    slug: "pack-context",
    title: "Packing the Context Window",
    summary:
      "Cap tokens. Drop the lowest scores first. Mark truncated. Do not pour 40 chunks into the next prompt.",
    minutes: 20,
    level: "intermediate",
    md: `
Retrieved text competes with **instructions**, the user ask, and (later) tool results and chat history. A 2 MB dump wrecks the bill and the answer. The model’s **context window** is finite. Attention also **dilutes** over a long row. Packing is a product choice, not an accident of \`k=20\`.

Pack with numbers:

- Max **characters** (classroom) or **tokens** (production) for **all chunks together**
- Keep **higher scores** first (after hybrid, RRF, rerank, MMR)
- If you cut a chunk, mark \`truncated: true\`
- Put sources in a labeled **data** block, not in the system prompt

\`\`\`viz strip
title High score first, then cap
chip 0.90 policy
chip 0.80 invoice
chip 0.40 pizza
caption Pizza is last. A tight budget drops it. Mark truncated if you cut.
\`\`\`

The Prompting track already said instructions vs data. Here you **build** that data block. The next part will treat the block as untrusted. Packing is how it stays small enough to wrap.

## Drop low scores before you truncate high ones

Order by score descending. Fill the budget. If the next chunk does not fit, you may truncate it or skip it. Truncating a high-score policy mid-sentence is sometimes worse than skipping a low-score extra. A simple policy: never truncate below a minimum span (for example 80 characters) — skip instead. Always set \`truncated\` when you cut.

Low-score pizza should be last and should fall off. If pizza is first, your scores are the bug, not packing.

## History vs retrieval budget

Budget retrieval **separately** from chat history. If working memory is already huge, retrieve **fewer** chunks. Do not keep k=20 because a paper did. The window is shared.

Truncation without a \`get_doc(id)\` follow-up is how models invent the rest of the file. They complete the sentence in the style of a runbook. Mark truncated, and either fetch the parent section or refuse to use that chunk as the only evidence for a precise procedure.

\`\`\`tryit python
HITS = [
    {"id": "a", "score": 0.9, "text": "Refunds take 5-7 days. Never cash."},
    {"id": "b", "score": 0.8, "text": "INV-17 is open for 4000 cents."},
    {"id": "c", "score": 0.4, "text": "Pizza is on Fridays in the cafeteria." * 3},
]

LIMIT = 80

def pack(hits, limit=LIMIT):
    ordered = sorted(hits, key=lambda h: -h["score"])
    used = 0
    out = []
    for h in ordered:
        room = limit - used
        if room <= 0:
            break
        text = h["text"]
        truncated = False
        if len(text) > room:
            text = text[:room]
            truncated = True
        out.append({"id": h["id"], "text": text, "truncated": truncated})
        used += len(text)
    return out, used

packed, used = pack(HITS)
print("used", used, "of", LIMIT)
for p in packed:
    print(p["id"], "trunc=" + str(p["truncated"]), p["text"][:50])
\`\`\`

Low-score pizza is last. With a tight LIMIT, **a** and **b** fill the window; **c** is cut or dropped. \`used\` never exceeds 80. \`trunc=True\` is a signal to the rest of the system, not a comment for humans only. Raise LIMIT and watch pizza sneak in. That is why k and LIMIT are two knobs: retrieve broadly, pack narrowly.

In production, count tokens with the **same** tokenizer the model uses. Character caps are a classroom stand-in. A JSON wrapper around each chunk also costs tokens — budget the fences, ids, and headings, not only the body text.

## Where the block lives

Assemble: instructions (your policy) + user question + \`DATA\` ... chunks ... \`END DATA\`. Chunks do not go in the system prompt as new policy. The wrapping lesson is next part. Packing decides **which bytes** sit between the fences.

Keep source ids in the block so citations can point. If you pack text and drop ids to save 20 tokens, you cannot cite.

## Budgets, fences, and truncation policy

Count the fences, headings, and ids in the budget, not only body text. A JSON wrapper per chunk can double the cost of short snippets. Production tokenizers disagree with “four characters per token.” Use the model’s tokenizer when you have it. Characters are the classroom stand-in.

Policy for a chunk that does not fit: (1) skip if remaining room is below a minimum span; (2) otherwise truncate and set \`truncated: true\`; (3) never truncate away the only identifier in a high-score hit if you can skip a later pizza chunk instead. Skipping low-score extras is better than cutting the gold policy mid-sentence.

History vs retrieval: if the assembler already spent 60% of the window on chat, retrieve n=2, not n=20. Working memory should hold a budget field for “evidence tokens left.” That field is packing, not the agent loop.

The data block is labeled. Packing decides bytes **inside** the label. Putting packed chunks in the system prompt “so they are followed” undoes the wrap lesson. Keep policy in instructions and evidence in DATA.

\`get_doc\` is how truncated=true becomes honest: fetch the parent section if the user (or a later hop) needs the rest. Without it, the model completes the runbook in folklore style.

## Common mistakes

- k=20, no character cap, history of 30 turns, then surprise latency.
- Truncating without \`truncated\`.
- Packing by original retrieve order instead of score (pizza first if the wiki listed menu first).
- Spending half the budget on near-duplicates because MMR never ran.

## How agents use this

Budget retrieval separately from chat history. If working memory is already huge, retrieve fewer chunks. Truncation without \`get_doc(id)\` is how models invent the rest of the file.

The retrieve library should return **packed** evidence, not a raw pile, when the caller is a prompt assembler. Or the assembler packs. Pick one place. If both pack, you double-drop gold.

This is still the library: chunks in, a bounded data block out. The agent loop will pass that block as an observation. If you pour 40 chunks, the loop’s next thought is expensive and fuzzy. Pack here.

Log \`used_chars\`, \`limit\`, each id, and \`truncated\`. On-call should see that gold was retrieved at score 0.88 and then cut to twenty characters. That is a packing incident, not a “dumb model.” Keep ids even when you shorten text. Put the block in DATA, not in the system prompt. If history already ate the window, lower n before you lower tau — empty evidence with refuse is better than a truncated rumor next to a half policy.

Skip a low-score extra before you cut a high-score policy below a minimum span. Count fence tokens in the budget. Character caps in this classroom stand in for the model tokenizer. The window is shared; retrieval does not get a blank check because k was 20 in a paper. Mark truncated. Offer get_doc for the parent. Do not pour forty chunks into the next prompt.

\`\`\`quiz
How should you add retrieved chunks to a prompt?
- Paste everything you fetched
- *Cap size, keep higher scores, label the block as data, mark truncation
- Hide them in the system prompt as policy
- Shuffle them randomly
explain: Context is finite. Packing is a product choice, not an accident of k=20.
\`\`\`
`,
  },
];
