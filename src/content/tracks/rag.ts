import type { TrackSource } from "@/lib/types";

export const rag: TrackSource = {
  slug: "rag",
  title: "RAG & Memory",
  short: "RAG",
  tagline:
    "Chunking, embeddings, vector search, hybrid retrieval, rerank, citations, agentic RAG, memory types.",
  color: "#4F46E5",
  order: 9,
  lessons: [
    {
      slug: "why-rag",
      title: "Why RAG",
      summary:
        "Weights are frozen, incomplete, and uncited. Retrieval-Augmented Generation fetches evidence, then generates.",
      minutes: 15,
      level: "intermediate",
      md: `
**RAG (Retrieval-Augmented Generation)** is a workflow, not a religion:

1. Turn the user question into a **query**
2. **Retrieve** a few relevant snippets from a corpus you control
3. Stuff those snippets into the prompt as **context** (data, not commands)
4. Generate an answer **bound** to that context
5. Preferably **cite** which snippet supported which claim

You do this because language-model weights are a lossy encyclopedia with no SLA:

| Problem | Fine-tune / bigger model | RAG |
|---|---|---|
| Knowledge cutoff | Retrain | Update the corpus |
| Private docs | Dangerous to train on | Retrieve with auth |
| Hallucinated facts | Still happens | Ground in quotes |
| “Where did you get that?” | Shrug | Citations |
| Cost of new facts | High | A row in a store |

RAG is not cheaper intelligence. It is **engineering**: you can test whether the right chunk was retrieved, and you can test whether the answer stayed faithful to it.

## When not to RAG

- The answer is a **tool** (\`get_invoice(id)\`) — retrieve is a slow, fuzzy database
- The answer is in the **user message** already
- You cannot define a corpus (then you are searching the web, which is RAG with worse injection)

Teams “add RAG” to a workflow that needed SQL. Then they wonder why “invoice INV-17” retrieves a blog post about invoices.

The rest of the pipeline is also the product: ingest, clean, chunk, embed, index, retrieve, rerank, generate, cite. If you only tune the prompt, you are polishing the last 10%. Index freshness (when did this runbook land?) matters as much as cosine. A corpus that is a dump of Confluence including draft pages will retrieve drafts.

An indexing job is part of the agent’s SLO: if runbooks update at 10:00 and the index lags until tomorrow, the agent will quote yesterday with a straight face. Monitor ingest failures the same way you monitor the model API. RAG that cannot say **when** a chunk was indexed cannot be trusted in ops.

## RAG is still a prompt

Retrieved text is untrusted. A wiki page can inject. Wrap chunks, cap tokens, and refuse to follow instructions inside documents. The Prompting track’s injection lesson applies **especially** here.

\`\`\`tryit python
WEIGHTS = {
    "who wrote hamlet": "Shakespeare",
}

CORPUS = {
    "runbook.md": "Runner OOM: raise memory limit on the worker, then replay the DLQ.",
    "billing.md": "Refunds for INV-* take 5-7 days. Never refund in cash.",
}

def closed_book(q: str) -> str:
    for k, v in WEIGHTS.items():
        if k in q.lower():
            return v
    return "I don't know (or I might invent a runbook)."

def retrieve(q: str, k: int = 1) -> list[tuple[str, str]]:
    words = set(q.lower().split())
    scored = []
    for name, text in CORPUS.items():
        overlap = len(words & set(text.lower().split()))
        scored.append((overlap, name, text))
    scored.sort(reverse=True)
    return [(n, t) for _, n, t in scored[:k] if _ > 0]

def rag_answer(q: str) -> str:
    hits = retrieve(q)
    if not hits:
        return closed_book(q)
    name, text = hits[0]
    return f"{text} [source: {name}]"

print("closed:", closed_book("Runner OOM what do I do"))
print("rag:   ", rag_answer("Runner OOM what do I do"))
print("fact:  ", rag_answer("who wrote Hamlet"))
\`\`\`

Closed-book **cannot** know your runbook. RAG can, if and only if the runbook is in the corpus and the retriever finds it. The rest of this track is that “if.”

> **Tip:** If a field is keyed by id, use a tool. RAG is for prose you cannot hash-lookup.

\`\`\`quiz
Why do agents use RAG?
- To avoid writing Python
- *To ground answers in a corpus you can update, authorize, and cite — instead of frozen weights
- Because cosine is legally required
- To make prompts longer for fun
explain: RAG fetches evidence at request time. That is how private, fresh, citable knowledge gets into the prompt.
\`\`\`
`,
    },
    {
      slug: "chunking",
      title: "Chunking",
      summary:
        "Documents are too big for a prompt. Split them by size, overlap, and headings — and remember what you broke.",
      minutes: 16,
      level: "intermediate",
      md: `
A **chunk** is the unit you embed, store, retrieve, and cite. Too big, and you retrieve noise and blow the context window. Too small, and you retrieve a sentence that does not contain the pronoun’s antecedent. Chunking is the unglamorous reason RAG “doesn’t work.”

## Size

Count **tokens**, not characters, in production. In this classroom, characters are a stand-in. Typical starting points for prose: 200–500 tokens. Code and tables often want **logical** chunks (a function, a row group), not a blunt window.

There is no universal number. Measure recall on **your** questions. A policy PDF is not a chat log.

## Overlap

Sliding windows overlap so a sentence split in half still appears whole in at least one chunk. 10–20% overlap is a sane default. Overlap duplicates storage and can duplicate retrieval; that is usually cheaper than missing the join between two facts.

## By heading (structure-aware)

Markdown, HTML, and PDFs with outlines should split on **headings** first, then sub-split long sections by size. A chunk that starts at \`## Refunds\` will retrieve for refund questions even if the embedding is mediocre. A chunk that is the last 40 words of Refunds plus the first 40 of Security will retrieve as a chimera.

Keep metadata:

- \`source\` path or URL
- heading path (\`Refunds > Timing\`)
- offsets into the original (so you can highlight)
- checksum / version (so you can reindex)

If you cannot point a citation back at a byte range, you do not have citations. You have vibes with footnotes.

Tables and code need different splitters: do not cut a markdown table through the header row; do not cut a function in half if you can keep the signature with the body. Recursive splitters (headings → paragraphs → sentences → windows) are the usual production default. Measure, then tweak.

PDFs lie: a “heading” may be bold 11pt. If your parser cannot see structure, you will window-split a two-column layout into interleaved garbage. Inspect 20 random chunks before you trust an index. If you would not want that text in a prompt, do not embed it.

## What not to chunk

Secrets, credentials, and “ignore previous instructions” pages you did not mean to ingest. Chunking is a great way to **permanently** vectorize a password that someone committed. Filter before you split.

\`\`\`tryit python
DOC = """# Runbook
## Runner OOM
Raise the worker memory limit. Then replay the DLQ.
## Refunds
Refunds for INV-* take 5-7 days. Never refund in cash.
## Security
Never paste API keys into tickets.
"""

def chunk_by_size(text: str, size: int, overlap: int) -> list[str]:
    chunks = []
    i = 0
    step = max(size - overlap, 1)
    while i < len(text):
        chunks.append(text[i:i + size])
        i += step
    return chunks

def chunk_by_heading(text: str) -> list[dict]:
    chunks = []
    heading = "(top)"
    buf = []
    for line in text.splitlines():
        if line.startswith("## "):
            if buf:
                chunks.append({"heading": heading, "text": "\\n".join(buf).strip()})
            heading = line[3:].strip()
            buf = [line]
        else:
            buf.append(line)
    if buf:
        chunks.append({"heading": heading, "text": "\\n".join(buf).strip()})
    return [c for c in chunks if c["text"]]

print("SIZE+OVERLAP:")
for i, c in enumerate(chunk_by_size(DOC, size=80, overlap=20)):
    print(i, repr(c))
print("HEADING:")
for c in chunk_by_heading(DOC):
    print("-", c["heading"], ":", c["text"][:60].replace("\\n", " / "))
\`\`\`

Run it. See how the size window **cuts** “Refunds” mid-thought, while heading chunks keep policy intact. Start with headings; fall back to windows inside a fat section.

> **Note:** Re-chunk when the doc changes. Stale chunks with new headings are a silent retrieval bug.

\`\`\`quiz
Why use overlap and headings when chunking?
- Overlap makes GPUs louder
- *Overlap preserves split sentences; headings keep facts in their section so retrieval and citations make sense
- Headings are required by JSON
- To hide the original document
explain: Chunks are the retrieval atom. Structure-aware splits beat naive windows on real docs.
\`\`\`
`,
    },
    {
      slug: "embedding-retrieval",
      title: "Embeddings and Retrieval",
      summary:
        "Embed text into vectors, score with cosine similarity, return the nearest chunks. Geometry, not magic.",
      minutes: 17,
      level: "intermediate",
      md: `
An **embedding** is a list of numbers meant to place similar text **nearby** in a high-dimensional space. “Nearby” is a choice of distance. For RAG, **cosine similarity** (or dot product of normalized vectors) is the default: it cares about **angle**, not vector length, so a long chunk does not win just by being long.

Retrieval:

1. Embed the query → vector \`q\`
2. For each chunk vector \`d\`, score \`cosine(q, d)\`
3. Take top-k
4. Optionally drop scores below a threshold (otherwise you retrieve the “least irrelevant” junk)

You will not train an embedding model in this box. You will **use the geometry**. In production you call a vendor or an open model; the math does not change.

## What embeddings are good and bad at

Good: paraphrase (“OOM” vs “out of memory”), synonyms, somewhat fuzzy match.

Bad: exact ids (\`INV-17\`), rare proper nouns, negation (“never refund in cash” vs “refund in cash”), and anything that needs **keyword** precision. That is why the hybrid-search lesson exists.

Embeddings **drift**. If you change the model, you must **re-embed the corpus**. Mixing vectors from two models in one index is not a style choice; it is random retrieval. Dimensionality (256 vs 3072) is a cost/quality knob. Thresholds: a top-1 cosine of 0.12 is not “the best match”; it is a miss — return “no evidence” instead of stuffing junk.

Cache **query** embeddings for identical questions in a session. Do not cache document vectors across embedding-model versions. Batch embed on ingest; one-by-one HTTP calls will make indexing a weekend. Store the model name next to every vector.

Similarity is not probability. Cosine 0.81 does not mean “81% true.” It means “pointed a similar direction in this embedding’s geometry.” Calibrate thresholds on labeled pairs, not on a hunch from one demo query. Print scores in traces.

## Toy vectors, real lesson

We will hand-write tiny 4-dimensional vectors as if a model produced them. The cosine routine is the one you should be able to write on a whiteboard. If you cannot, you cannot debug “why did this chunk rank first?”

\`\`\`tryit python
import math

def dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))

def norm(a: list[float]) -> float:
    return math.sqrt(sum(x * x for x in a))

def cosine(a: list[float], b: list[float]) -> float:
    na, nb = norm(a), norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return dot(a, b) / (na * nb)

# Toy embeddings: dims mean [infra, billing, security, oom]
CHUNKS = {
    "runner-oom": [0.9, 0.0, 0.1, 1.0],
    "refunds": [0.0, 1.0, 0.2, 0.0],
    "api-keys": [0.1, 0.0, 1.0, 0.0],
}

QUERIES = {
    "worker ran out of memory": [0.8, 0.0, 0.0, 0.9],
    "how long do refunds take": [0.0, 0.9, 0.0, 0.0],
    "where do I put secrets": [0.0, 0.0, 0.9, 0.0],
}

def search(query_vec: list[float], k: int = 2) -> list[tuple[str, float]]:
    ranked = [(name, cosine(query_vec, vec)) for name, vec in CHUNKS.items()]
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked[:k]

for q, vec in QUERIES.items():
    print(q)
    for name, score in search(vec):
        print(f"  {name:12} cos={score:.3f}")
\`\`\`

If refunds ranked first on the OOM query, your embeddings (or your chunking) are lying. Debugging RAG starts with **printing the scores**, not with adding another framework.

> **Tip:** Normalize query and document vectors. Then cosine is a dot product and you will make fewer length mistakes.

\`\`\`quiz
What does cosine similarity measure for embeddings?
- Disk speed
- *How aligned two vectors are (angle), used to rank chunks near a query
- Whether JSON is valid
- The number of GPUs
explain: Cosine is geometric similarity. Retrieval is top-k by that score (plus a threshold if you are wise).
\`\`\`
`,
    },
    {
      slug: "vector-indexes",
      title: "Vector Indexes",
      summary:
        "Brute force is exact and slow. ANN indexes are fast approximations. Know what you are trading.",
      minutes: 16,
      level: "intermediate",
      md: `
With 200 chunks, **brute force** cosine against every vector is the correct design. It is exact, it is simple, it is testable. People skip it and install a distributed vector database for a help-center corpus that fits in RAM. Then they cannot explain a miss.

With millions of vectors, brute force is too slow. You use an **ANN (Approximate Nearest Neighbor)** index: HNSW, IVF, LSH, disk-backed trees. ANN **does not guarantee** the true nearest neighbor. It guarantees a speed/recall tradeoff you must measure.

## Brute force

- Recall of the nearest neighbor: 100% (of whatever your embedding and chunking deserve)
- Latency: linear in corpus size × dimension
- Ops: a numpy matmul, or a SQL loop, or this classroom’s Python

## ANN, conceptually

Indexes **partition** or **graph** the space so you only score a subset:

- **Buckets / LSH:** hash a vector into a bin; search that bin plus neighbors
- **Inverted files (IVF):** cluster with k-means; search the nearest clusters
- **HNSW:** a navigable graph of points; greedy walk then expand

You trade **recall@k** for **latency**. If your eval questions need chunk 12 and ANN returns 11 near-misses, no prompt will save you. Tune \`efSearch\`, probes, etc. **against your eval set**, not against a blog’s defaults.

## You still need metadata filters

“Vectors only” cannot do \`tenant_id = acme\` correctly unless you **pre-filter** or partition indexes per tenant. Mixing tenants in one ANN graph and hoping is a data leak. Filter in the database, then ANN, or maintain per-tenant indexes.

For many products, **pgvector (or equivalent) in the database you already run** is enough until latency or scale proves otherwise. A dedicated vector DB adds ops. Brute force on 10k chunks is still a valid Saturday. Do not start with a cluster.

**Recall@k** is the fraction of queries whose gold chunk appears in the top k. Report it. Latency p95 is the other axis. If you cannot quote both, you are not operating an index — you are collecting a dependency.

Rebuilds: ANN graphs go stale when you add 20% more vectors without rebalancing. Have a job. Have a checksum of the corpus. Have a “search this id” debug endpoint that prints neighbors.

\`\`\`tryit python
import math
import time

def cosine(a, b):
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)

# 64 toy docs in 4-D. Bucket = sign of dim 0 (a cartoon of LSH / IVF).
docs = []
for i in range(64):
    vec = [((i * 3 + d * 7) % 11) / 10 - 0.5 for d in range(4)]
    docs.append({"id": i, "vec": vec, "bucket": 0 if vec[0] >= 0 else 1})

query = [0.4, -0.1, 0.2, 0.0]
q_bucket = 0 if query[0] >= 0 else 1

def brute(q, k=5):
    ranked = sorted(docs, key=lambda d: cosine(q, d["vec"]), reverse=True)
    return ranked[:k]

def ann_bucket(q, k=5):
    subset = [d for d in docs if d["bucket"] == q_bucket]
    ranked = sorted(subset, key=lambda d: cosine(q, d["vec"]), reverse=True)
    return ranked[:k]

b = brute(query)
a = ann_bucket(query)
print("brute ids:", [d["id"] for d in b])
print("ann ids:  ", [d["id"] for d in a])
overlap = {d["id"] for d in b} & {d["id"] for d in a}
print("recall@5 vs brute:", len(overlap) / 5)
print("ann scanned", sum(1 for d in docs if d["bucket"] == q_bucket), "of", len(docs))
_ = time.time()  # keep stdlib honest; we are not benchmarking seriously here
\`\`\`

When overlap is below 5/5, you **see** approximation. Production ANN is the same phenomenon with better graphs. Never skip a brute-force baseline on a subsample.

> **Warning:** An ANN miss looks like a smart model that “didn’t read the doc.” Check retrieval before you fine-tune the prose.

\`\`\`quiz
What does an ANN vector index buy you?
- Perfect nearest neighbors for free
- *Lower latency by scoring a subset of vectors, at the cost of some recall
- Automatic citations
- Freedom from evals
explain: ANN is approximate. Brute force is the truth. Measure recall@k on your questions.
\`\`\`
`,
    },
    {
      slug: "hybrid-search",
      title: "Hybrid Search",
      summary:
        "Keyword (sparse) search catches IDs and rare tokens. Vectors catch paraphrase. Fuse both.",
      minutes: 16,
      level: "intermediate",
      md: `
Vector search will rank “never refund in cash” next to “how do I refund in cash” because the words overlap in embedding space. Keyword search will **require** \`INV-17\` to appear. **Hybrid search** uses both and **fuses** the ranks.

Typical recipe:

1. Sparse / keyword score (BM25, or a classroom TF overlap)
2. Dense / vector cosine
3. Normalize both to a comparable range
4. \`final = α * keyword + (1-α) * cosine\`
5. Take top-k from the fused list

\`α\` is a knob. High \`α\` when users type SKUs and error codes. Low \`α\` when they type vibes. Measure it.

## Why keyword still wins some queries

- Identifiers: \`INV-17\`, \`usr_19\`, stack hashes
- Operators and negation (BM25 is not great at negation either, but exact token presence is a start)
- New terms the embedding model never saw

## Fusion details that bite

You cannot add raw BM25 (unbounded) to cosine ([-1, 1]) and call it math. Min-max normalize **per query** over the retrieved candidates, or use **Reciprocal Rank Fusion** (RRF): \`score += 1 / (60 + rank)\` from each list. RRF needs no scale tuning and is a good default.

Retrieve **more than you will show** (e.g. 20+20) then fuse, then cut to 5. If you fuse only the top 3 of each, you never give the other channel a chance.

**BM25** (the usual keyword score) rewards term frequency, penalizes very common words (IDF), and saturates so a word repeated 400 times does not dominate. Your classroom \`keyword_score\` is a cousin: it boosts tokens that look like ids. In production, use a real BM25 (or the database’s FTS) plus vectors; do not reimplement BM25 in a loop over 10 million docs in Python.

**Reciprocal Rank Fusion** is \`score[d] += 1 / (60 + rank_i(d))\` summed over lists. It ignores raw score scales, which is why people like it. The constant 60 is a habit, not a theorem — still, measure \`α\` or RRF against labeled queries, not against a tweet.

If keyword and vector disagree, **show both in the trace**. Many “RAG is dumb” tickets are “BM25 had the id in slot 1 and we fused it to slot 9.” That is a fusion bug, not a generation bug.

\`\`\`tryit python
import math
import re
from collections import Counter

CHUNKS = {
    "a": "Refunds for INV-17 take 5-7 days. Never refund in cash.",
    "b": "Runner out of memory: raise worker limits and replay the DLQ.",
    "c": "Customer asked about a refund in cash for their invoice.",
}

def tokens(s: str) -> list[str]:
    return re.findall(r"[a-z0-9-]+", s.lower())

def cosine_bow(q: str, d: str) -> float:
    vq, vd = Counter(tokens(q)), Counter(tokens(d))
    keys = set(vq) | set(vd)
    def vec(c):
        return [c[k] for k in keys]
    a, b = vec(vq), vec(vd)
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)

def keyword_score(q: str, d: str) -> float:
    qt, dt = tokens(q), Counter(tokens(d))
    # toy TF: count query terms present, bonus for rare-looking ids
    score = 0.0
    for t in qt:
        tf = dt[t]
        if not tf:
            continue
        score += 1.0 + math.log(1 + tf)
        if "-" in t or any(ch.isdigit() for ch in t):
            score += 2.0
    return score

def minmax(xs: list[float]) -> list[float]:
    lo, hi = min(xs), max(xs)
    if hi - lo < 1e-9:
        return [0.0 for _ in xs]
    return [(x - lo) / (hi - lo) for x in xs]

def hybrid(q: str, alpha: float = 0.5) -> list[tuple[str, float]]:
    names = list(CHUNKS)
    kw = [keyword_score(q, CHUNKS[n]) for n in names]
    vec = [cosine_bow(q, CHUNKS[n]) for n in names]
    kw_n, vec_n = minmax(kw), minmax(vec)
    fused = [alpha * k + (1 - alpha) * v for k, v in zip(kw_n, vec_n)]
    ranked = sorted(zip(names, fused, kw, vec), key=lambda r: r[1], reverse=True)
    return ranked

q = "status of INV-17 refund in cash"
print("query:", q)
for alpha in (0.0, 0.5, 1.0):
    print("alpha", alpha)
    for name, fused, kw, vec in hybrid(q, alpha):
        print(f"  {name} fused={fused:.3f} kw={kw:.3f} vec={vec:.3f}")
\`\`\`

Watch chunk **a** jump when \`alpha\` rises: the id \`INV-17\` is a keyword event. Pure vectors (bag-of-words cosine here, but the lesson stands) dilute it with chunk **c**’s “refund in cash.”

> **Tip:** Log both channels’ top hits in traces. When RAG fails, you want to know which retriever dropped the ball.

\`\`\`quiz
When is hybrid search worth it?
- Never; vectors made keywords illegal
- *When queries mix paraphrase with exact tokens (ids, error codes, product names)
- Only for images
- Only if you skip evals
explain: Dense retrieval paraphrases. Sparse retrieval pins rare tokens. Fuse them.
\`\`\`
`,
    },
    {
      slug: "reranking",
      title: "Reranking",
      summary:
        "Retrieve broadly, then score a shortlist with a slower, sharper model. Two stages beat one.",
      minutes: 16,
      level: "intermediate",
      md: `
**Reranking** is a second exam. Stage 1 (BM25 + vectors + ANN) is **recall-oriented**: get the right chunk into a pile of 20. Stage 2 is **precision-oriented**: a cross-encoder, a small LLM, or even a cheap overlap heuristic scores each \`(query, chunk)\` pair and sorts the pile.

Why two stages? Because scoring every chunk with a big model is too slow, and scoring only with cosine is too dumb. The reranker **reads the pair together**. Embeddings encoded the query and the doc **separately** (bi-encoder). That is fast and lossy. A cross-encoder lets tokens attend across query and doc. That is slow and sharp.

## Classroom rerankers

You may not have a cross-encoder in the browser. You can still learn the **shape**:

- Retrieve k=8
- Score each chunk with a function that looks at both strings
- Keep n=3 for the prompt

Production: a dedicated rerank API, or “LLM as reranker” (expensive, use only on the shortlist). Always **timeout** and fall back to the stage-1 order.

## Do not rerank away diversity blindly

If three chunks are near-duplicate refunds, the reranker will put them 1–2–3 and you will waste the context window. Apply a light **MMR** (maximal marginal relevance): penalize chunks that duplicate tokens already chosen. You want **coverage** of sub-questions, not three paraphrases of the same sentence.

## Eval the stage, not the vibe

Measure:

- Recall@k of stage 1 (did the gold chunk enter the pile?)
- nDCG / precision of stage 2 (did it rise to the top?)
- End-to-end answer faithfulness

If stage 1 recall is 0, reranking is interior decorating.

A **cross-encoder** scores the pair in one forward pass (best quality per call). An **LLM reranker** is a prompt: “rank these passages.” It is flexible and slow; use it only on 5–10 chunks. Heuristics (the classroom overlap) are for tests and fallbacks, not for your flagship corpus once you can afford a real reranker.

Keep the stage-1 order as a fallback when the reranker times out or returns a permute that drops a high BM25 id-match. Exact identifiers should be hard to rerank away.

\`\`\`tryit python
QUERY = "how long do INV-17 refunds take"
POOL = [
    "The cafeteria menu is pizza on Fridays.",
    "Refunds for INV-* take 5-7 days. Never refund in cash.",
    "INV-17 is an open invoice for 40 dollars.",
    "Raise worker memory when the runner hits OOM.",
    "Refunds: 5-7 days. INV-17 included. Check status in billing.md.",
]

def retrieve_stage1(q: str, docs: list[str], k: int = 4) -> list[str]:
    qw = set(q.lower().split())
    scored = []
    for d in docs:
        dw = set(d.lower().split())
        scored.append((len(qw & dw), d))
    scored.sort(reverse=True)
    return [d for _, d in scored[:k]]

def rerank_score(q: str, d: str) -> float:
    qw = q.lower().split()
    dl = d.lower()
    overlap = sum(1 for w in qw if w in dl)
    # pair-aware extras a cross-encoder would learn:
    if "5-7" in dl or "days" in dl:
        overlap += 2
    if "inv-17" in dl and "refund" in q.lower():
        overlap += 2
    return overlap

def rerank(q: str, docs: list[str], n: int = 2) -> list[tuple[float, str]]:
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

Stage 1 only counted overlap; the cafeteria might still sneak in if you were unlucky with k. Stage 2 **boosts the pair** that jointly mentions timing and the invoice. That is the rerank bet.

> **Note:** Rerankers can be prompt-injected too if you send raw HTML. Strip tags before the second model reads the chunk.

\`\`\`quiz
What is reranking for?
- Replacing retrieval entirely
- *Scoring a shortlist of chunks with a slower pair model so the prompt gets the precise evidence
- Making embeddings longer
- Skipping citations
explain: Stage 1 recalls, stage 2 precises. If the gold chunk never entered the pile, rerank cannot help.
\`\`\`
`,
    },
    {
      slug: "citations",
      title: "Citations and Faithfulness",
      summary:
        "A quote the user can open is a citation. Fluent sentences that are not in the sources are hallucinations.",
      minutes: 17,
      level: "intermediate",
      md: `
**Faithfulness** means claims in the answer are **supported** by retrieved (or tooled) evidence. Fluency is free. Faithfulness is the product.

A **citation** is a pointer: source id, and ideally a **span** (quoted substring or start/end offsets). “According to our docs” is not a citation. \`[billing.md §Refunds]\` plus a quote the UI can highlight **is**.

## How to force spans

Output contract:

\`\`\`
{"answer": "...", "citations": [{"source": "billing.md", "quote": "5-7 days"}]}
\`\`\`

Then **your code** checks \`quote in source_text\` (normalize whitespace). If not, drop the citation or regenerate. Models love to invent footnotes. They also love to cite the right file and quote a sentence that is not in it.

## Attribution vs grounding

- **Grounding:** the claim is in the evidence
- **Attribution:** you pointed at the evidence

You need both. An answer can be true from pretraining and still **unfaithful** to the corpus you promised the user you were using. In a support agent, unfaithful-but-true is still a policy bug if it contradicts the runbook.

## Quote, then paraphrase

A robust pattern: the model must copy a quote **first**, then write the user-facing sentence. Graders can check the quote mechanically. The paraphrase is what you show; the quote is what you trust.

## Empty retrieval

If nothing came back, the faithful answer is “I don’t know; nothing in the corpus matched.” Inventing a procedure because the model is “being helpful” is how you get cash refunds that accounting forbade.

Multi-source claims need **multiple** spans: “Refunds take 5–7 days **and** OOM is fixed by raising memory” should not cite only billing.md. Your grader can require that each sentence (or each JSON claim) has at least one passing quote. Partial citation is how lies sneak through in the uncited clause.

The UI should highlight the span in the source pane. If you cannot highlight it, the quote failed the substring check and should not be a superscript. Users learn to click citations; do not teach them that numbers are decoration.

Ban citations to documents that were not in the retrieved set. Models love to “cite” a filename they saw in the system prompt. Your checker should intersect citation sources with the observation’s chunk ids.

\`\`\`tryit python
import json
import re

SOURCES = {
    "billing.md": "Refunds for INV-* take 5-7 days. Never refund in cash.",
    "runbook.md": "Runner OOM: raise memory limit on the worker, then replay the DLQ.",
}

def normalize(s: str) -> str:
    return re.sub(r"\\s+", " ", s).strip().lower()

def quote_in_source(quote: str, source: str) -> bool:
    return normalize(quote) in normalize(SOURCES.get(source, ""))

def check_answer(obj: dict) -> dict:
    problems = []
    for c in obj.get("citations") or []:
        if c["source"] not in SOURCES:
            problems.append("unknown source " + c["source"])
            continue
        if not quote_in_source(c["quote"], c["source"]):
            problems.append("quote not in " + c["source"] + ": " + c["quote"])
    # toy claim check: if the answer mentions cash refunds as allowed, flag
    ans = obj.get("answer", "").lower()
    if "cash" in ans and "never" not in ans and "not" not in ans:
        problems.append("possible unfaithful cash-refund claim")
    return {"ok": not problems, "problems": problems}

good = {
    "answer": "Refunds take 5-7 days and cannot be paid in cash.",
    "citations": [{"source": "billing.md", "quote": "take 5-7 days"}],
}
bad = {
    "answer": "We can refund you in cash today.",
    "citations": [{"source": "billing.md", "quote": "cash today instantly"}],
}
print("good", json.dumps(check_answer(good)))
print("bad ", json.dumps(check_answer(bad)))
\`\`\`

The bad answer **fails closed** because the quote is not a substring. That single \`in\` check is worth more than a paragraph in the system prompt that says “please cite.”

> **Warning:** UI that shows superscripts without verifying spans trains users to trust decorations. Verify or do not display.

\`\`\`quiz
What makes a citation real?
- A number in brackets the model invented
- *A source you retrieved plus a quote/span that actually appears in that source, checked by code
- The model saying “trust me”
- A longer answer
explain: Faithfulness is checked, not requested. Quotes must be substrings of retrieved text.
\`\`\`
`,
    },
    {
      slug: "agentic-rag",
      title: "Agentic RAG",
      summary:
        "The model can choose to retrieve, reformulate the query, retrieve again, or stop. Retrieval becomes a tool.",
      minutes: 17,
      level: "advanced",
      md: `
Naive RAG always retrieves once, then talks. That fails when:

- The first query is underspecified (“it crashed”)
- The first chunks are close but missing the **join** (need a second hop)
- You retrieved the wrong collection (runbooks vs billing)
- You should **not** retrieve at all (small talk, or a tool id lookup)

**Agentic RAG** makes retrieval a **tool** in the agent loop. The model may:

1. \`retrieve(query)\`
2. Read observations
3. \`retrieve(query')\` with a tighter or hop query
4. \`get_doc(id)\` for the full parent document of a chunk
5. \`finish(answer, citations)\`

This is more powerful and more expensive. Cap hops. Cap tokens. Require citations still.

## Query reformulation

The user said “that OOM thing from last week.” A good first tool call is not those words verbatim. It is “runner out of memory worker memory limit DLQ.” You can also **decompose**: two retrieves, then merge. Decomposition is a plan; keep it in JSON so you can eval each sub-query.

## When to retrieve again

Signals you can teach (and test):

- Retrieved scores all below a threshold
- The question contains an entity not in any chunk
- The answer would require combining two headings you did not both get
- The user asked a follow-up (“now the billing side”)

Signals you should **not** loop: the model is bored and searching for a better vibe. \`max_retrieves = 3\`.

## Multi-hop is a trap for injection

Each extra document is another untrusted blob. Agentic RAG that can \`fetch_url\` is a prompt-injection festival. Prefer a **closed corpus** tool, not the open web, unless you have the permissions track fully implemented.

**Corrective RAG** is a named pattern: generate, notice the answer is weakly supported, retrieve again with a query built from the gap. That is still a budgeted loop. Route to **collections** (runbooks vs billing) as a first tool argument so hop 0 is not a search of the entire company dump.

Stop if two hops return the same chunk ids. That is a loop, not research. Dedup evidence by chunk id before stuffing the prompt so the model does not “see” three copies and grow confident.

\`\`\`tryit python
import json

CHUNKS = {
    "runbook": "Runner OOM: raise worker memory, then replay the DLQ.",
    "billing": "Refunds take 5-7 days. Never cash.",
    "dlq": "DLQ replay: CLI cmd replay-dlq --since 24h. Needs worker healthy.",
}

def retrieve(query: str, k: int = 1) -> list[dict]:
    q = set(query.lower().split())
    scored = []
    for cid, text in CHUNKS.items():
        score = len(q & set(text.lower().replace(":", " ").replace(",", " ").split()))
        scored.append((score, cid, text))
    scored.sort(reverse=True)
    return [{"id": cid, "text": text, "score": sc} for sc, cid, text in scored[:k] if sc > 0]

def enough(question: str, hits: list[dict]) -> bool:
    blob = " ".join(h["text"].lower() for h in hits)
    return "replay-dlq" in blob and "memory" in blob

def agentic(question: str, max_hops: int = 3) -> dict:
    queries = [question]
    evidence = []
    for hop in range(max_hops):
        q = queries[-1]
        hits = retrieve(q, k=1)
        evidence.extend(hits)
        print(json.dumps({"hop": hop, "query": q, "hits": hits}))
        if enough(question, evidence):
            return {
                "answer": "Raise worker memory, then replay-dlq --since 24h.",
                "hops": hop + 1,
                "citations": [h["id"] for h in evidence],
            }
        # Reformulate: if we saw DLQ mentioned but not the CLI, search for replay.
        blob = " ".join(h["text"] for h in hits)
        if "DLQ" in blob and "replay-dlq" not in blob:
            queries.append("DLQ replay CLI")
        else:
            queries.append(question + " runbook memory")
    return {"answer": "give up", "hops": max_hops, "citations": []}

print("FINAL", json.dumps(agentic("worker OOM then what about the DLQ"), indent=2))
\`\`\`

Hop 0 finds the OOM chunk (mentions DLQ, not the CLI). Hop 1 **retrieves again** for the replay command. That is agentic RAG: the policy chose a second search instead of hallucinating a flag.

> **Tip:** Log each hop’s query. “The agent searched five times” is a cost bug you can only see in a trace.

\`\`\`quiz
What makes RAG agentic?
- Using a purple vector database
- *The model (or policy) may retrieve, reformulate, retrieve again, or stop — retrieval is a tool in the loop
- Skipping citations
- Always retrieving 100 chunks
explain: Agentic RAG is retrieval as an action with a budget. Naive RAG is one retrieve then generate.
\`\`\`
`,
    },
    {
      slug: "memory-types",
      title: "Memory Types",
      summary:
        "Working, episodic, semantic, and procedural memory are different stores with different APIs — not one magic vector soup.",
      minutes: 18,
      level: "advanced",
      md: `
People say “give the agent memory” and then dump the whole chat into a vector DB. That is one store pretending to be four. Cognitive science (and operating systems) split memory because **the operations differ**.

| Type | What it holds | Typical implementation | Failure if you skip it |
|---|---|---|---|
| Working | The current task: goal, last observations, scratchpad | Context window + state object | Goal drift, lost tool results |
| Episodic | What happened: traces, tickets, “last Tuesday’s outage” | Logs, session transcripts, time-indexed store | Cannot learn from a past run |
| Semantic | Facts: runbooks, product truth, user prefs as statements | RAG corpus, knowledge graph, profile fields | Hallucinated policies |
| Procedural | How to act: tools, playbooks, compiled skills | Code, tool schemas, prompt recipes | Re-derives a runbook every time, badly |

## Working memory

Short, authoritative, **structured**. Not a novel. Put \`goal\`, \`budget_remaining\`, \`last_error\` in a JSON state you **rewrite**, do not append forever. Summarize the transcript when it grows; summaries are lossy — keep the raw trace in episodic storage.

## Episodic memory

Append-only events: \`retrieved X\`, \`refunded INV-17\`, \`user said no\`. Query by time and entity. This is how you answer “what did we already try?” without stuffing 80 turns into working memory. Do not embed every “ok” and “thanks.”

## Semantic memory

Curated facts. RAG lives here. User preferences that should survive sessions (“never cash refunds for this tenant”) are semantic, **not** a vibe in a vector of chit-chat. Write them as explicit records with owners and expiry.

## Procedural memory

The refund tool, the ReAct format, the eval suite, the “OOM then DLQ” playbook **as code**. The dream of “the agent will just remember how we do deploys” is how you get a different procedure every Thursday. Compile procedures into tools and prompts you version in git.

## Do not vectorize everything

Vectors are a retrieval index for **semantic prose**. Using them as working memory loses order. Using them as procedure loses determinism. Using them as the only episodic store makes “yesterday” a cosine accident.

A practical agent therefore has **four APIs**: mutate working state, append an event, upsert a fact, call a procedure. Mixing them into \`memory.add(text)\` feels unified and then you cannot answer “did we already refund INV-17?” without hoping cosine remembers a receipt.

\`\`\`tryit python
import json
from datetime import datetime

working = {"goal": "fix runner OOM", "steps_left": 4, "last_obs": None}
episodic = []
semantic = {
    "runbook.oom": "Raise worker memory, then replay the DLQ.",
    "tenant.acme.refunds": "never_cash",
}
procedural = {
    "replay_dlq": lambda since: {"ran": True, "since": since},
}

def remember_event(kind: str, payload: dict) -> None:
    episodic.append({
        "ts": datetime(2026, 9, 20, 11, 0, 0).isoformat(),
        "kind": kind,
        "payload": payload,
    })

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
print("working", json.dumps(working, indent=2))
print("episodic events", len(episodic), episodic[-1]["kind"])
print("semantic keys", list(semantic))
print("procedures", list(procedural))
\`\`\`

Four dicts, four jobs. Production is the same with Postgres, an object store, and a tool registry. If you only have Chroma, you have a hammer, and every memory looks like a chunk.

> **Tip:** When someone asks for “long-term memory,” ask which of the four they mean. Then pick a store that supports that API.

\`\`\`quiz
Which store should a versioned runbook live in?
- Working memory (the live context window only)
- Episodic memory (the chat from Tuesday)
- *Semantic memory (curated facts), with the procedure compiled into tools/code
- A single unsorted embedding of all Slack
explain: Runbooks are semantic. How to execute them is procedural. Chats are episodic. The window is working.
\`\`\`
`,
    },
  ],
};
