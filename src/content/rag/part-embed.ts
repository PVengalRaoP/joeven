import type { RawLesson } from "@/lib/types";

export const ragEmbed: RawLesson[] = [
  {
    slug: "overlap-and-ids",
    title: "Overlap, Offsets, and Chunk Ids",
    summary:
      "Overlap saves split sentences. Stable ids, heading paths, and byte offsets make citations real.",
    minutes: 20,
    level: "beginner",
    md: `
A sliding window **overlaps** so a sentence cut in half still appears whole in at least one chunk. If chunk 1 ends on “Refunds take 5-” and chunk 2 starts on “7 days,” neither chunk holds the fact. With overlap, one of them contains “5-7 days.” **10–20% overlap** is a sane default. You store more text. That is usually cheaper than missing the join between two facts.

Overlap is not a substitute for heading splits. You overlap **inside** a section that is still too big. You do not overlap two different policies on purpose. Mixing Refunds and Security in the overlap band is how a chimera is born.

\`\`\`viz strip
title Overlap saves the join
chip take 5-
chip 5-7 days
chip Never cash
caption 10-20% overlap so 5-7 days lives in one chunk.
\`\`\`

## Metadata you must keep

A chunk without metadata is a quote you cannot open. Keep at least:

- \`id\` — **stable**, like \`runbook.md#refunds\` or \`runbook.md:bytes:120-340\`. Stable means the same bytes get the same id until the source checksum changes.
- \`source\` — path or URL the UI will open
- **heading path** — \`Refunds > Timing\` so the user sees where they are
- **offsets** into the original (byte or character start/end) so the UI can **highlight**
- **checksum / version** — so you can reindex when bytes change
- **parent id** — the section or document this snippet came from

If you cannot point a citation back at a **byte range**, you do not have citations. You have vibes with footnotes. Models love footnotes. UIs that cannot highlight them train users to ignore them.

Ids that include only “chunk 17” die when you re-chunk. After a heading edit, chunk 17 is a different sentence. Cite \`runbook.md#refunds\` (and a checksum) so a stale citation can fail loudly: “this highlight no longer matches.”

## Do not cut structure

Do not cut a markdown table through the header row. The body rows without column names are numbers looking for a story. Do not cut a function in half if you can keep the signature with the body. Do not cut a numbered procedure between step 2 and step 3 if both steps are the policy.

When a logical unit is larger than your max chunk, split on inner headings or on blank lines, still with overlap, and keep the same parent id on every child. A later \`get_doc(parent_id)\` can fetch the full section if the snippet was truncated.

\`\`\`tryit python
TEXT = "Refunds take 5-7 days. Never refund in cash. Raise worker memory on OOM."

def window(text, size, overlap):
    step = max(size - overlap, 1)
    out = []
    i = 0
    n = 0
    while i < len(text):
        piece = text[i:i + size]
        n += 1
        out.append({
            "id": "c" + str(n),
            "start": i,
            "end": i + len(piece),
            "text": piece,
        })
        i += step
    return out

chunks = window(TEXT, size=28, overlap=8)
for c in chunks:
    span = TEXT[c["start"]:c["end"]]
    print(c["id"], c["start"], c["end"], span)
    print("  matches", span == c["text"])
\`\`\`

Offsets **round-trip**: the stored slice **is** the original substring. That is what a highlight in the UI needs. If \`matches\` were False, your offsets are a lie and every citation will highlight the wrong sentence.

Classroom ids here are \`c1\`, \`c2\` so you can see the window. Production ids should include the source path and a range or a heading slug. Re-run with \`overlap=0\` and watch “5-7” tear. That is the overlap argument in one print.

## When the document changes

When a doc changes, re-embed by **checksum**, not by “the file name looks the same.” Name-stable plus bytes-changed is the usual wiki edit. Drop old chunk ids for that checksum, write new ones, keep the same source URL so links still work.

Keep **parent ids** so a tiny chunk can fetch the full section. Truncation without \`get_doc\` is how models invent the rest of the file. Packing (later) will mark \`truncated: true\`. Offsets and parents are how you recover.

## Ids that survive re-chunking

A good id is a function of **source plus a stable locator**, not of “nth window in this run.” Heading slugs work until someone renames the heading. Byte ranges work until someone inserts a paragraph above. The honest pattern is: the id contains source and checksum (or version), and the UI uses offsets **for this checksum**. If the file moved, the citation fails closed: “this quote was for version abc, the live file is def.” That is better than highlighting the wrong sentence.

Parent ids let you store small children for retrieve and large parents for \`get_doc\`. Child text is what you embed. Parent text is what you show when the user clicks “open section.” Do not embed the parent and the child as unrelated vectors without a link; you will retrieve both as near-duplicates and waste the window (MMR later).

Overlap percentage is a storage and duplicate knob. Ten percent on 400-token chunks is 40 tokens of repeated text. On a million chunks that is real disk. Fifty percent overlap is how you pay for embedding twice and then fight duplicates at pack time. Start at 10–20%, measure recall on questions whose gold fact sits on a split, then stop.

This classroom counts **characters**. Production PDFs may use page boxes, not bytes of a binary file. Pick a locator the UI can actually open. A citation to “page 7” is valid if the viewer supports it. A citation to a byte offset in a binary PDF is not.

When you re-embed because the **model** changed, locators can stay if bytes stayed. The vector is new; the highlight range is not. Store model name on the vector row, not inside the chunk id, or every model upgrade 404s every old citation.

## Common mistakes

- Overlap 50% “to be safe.” You triple storage and retrieve near-duplicates. MMR (later) then has to clean your mess.
- Ids that reset every ingest (\`uuid()\` each run) so citations from yesterday 404.
- Offsets in **tokens** while the UI highlights **bytes**, or UTF-8 vs UTF-16 confusion. Pick one unit, test a non-ASCII heading.
- Storing text but not offsets, then trying to search the quote in a file that has been edited.

## How agents use this

Citations the user can click are a retrieve feature, not a generation feature. The model can emit \`[1]\`. Your code must map \`[1]\` to an id, then to a byte range, then to a highlight. If any hop is missing, hide the superscript.

When retrieve returns a child chunk, the prompt can include the heading path so the model knows the subject. If the child is too small to answer, a later hop can \`get_doc\` the parent. That is still this track: **ids and offsets**. The choose-when-to-fetch loop is later.

Do not skip metadata because the demo looked fine in a notebook. The notebook did not have to highlight a span in a 40-page PDF.

\`\`\`quiz
What must a citation be able to point at?
- A random vector
- *A stable chunk id and, ideally, a byte range in the source
- The system prompt
- Yesterday’s Slack vibe
explain: Offsets and ids make quotes checkable. Without them, footnotes are decoration.
\`\`\`
`,
  },
  {
    slug: "embedding-retrieval",
    title: "Embeddings and Retrieval",
    summary:
      "Embed text into vectors, score with cosine similarity, return the nearest chunks. Geometry, not magic.",
    minutes: 22,
    level: "intermediate",
    md: `
An **embedding** is a list of numbers meant to place similar text **nearby** in a high-dimensional space. You do not read the numbers. You compare them. For RAG, **cosine similarity** is the default score: it cares about **angle**, not vector length, so a long chunk does not win just by being long.

You will not train an embedding model in this box. You will **use the geometry**. In production you call a vendor (or a local model) that maps a string to a list of floats. The math after that does not change. This classroom uses **lists of floats** and cosine **by hand**. No extra numeric libraries. If you can write a dot product, you can debug a retriever.

\`\`\`viz scatter
title Nearby lists rank high
xlabel dim 1
ylabel dim 2
xmin -0.2
xmax 1.2
ymin -0.2
ymax 1.2
dot 0.85,0.95 query 0
dot 0.80,0.88 OOM 1
dot 0.10,0.90 refund 2
dot 0.15,0.12 keys 3
caption Query sits next to the OOM runbook. Refunds sit far. That is cosine in 2-d.
\`\`\`

\`\`\`viz heat
title Cosine to three chunks
row 0.91,0.12,0.08
labels OOM refund keys
caption The query is close to OOM only. Print scores. Do not hide them.
\`\`\`

## Retrieval recipe

1. Embed the query → vector \`q\`
2. For each chunk vector \`d\`, score cosine(\`q\`, \`d\`)
3. Take **top-k** (the k highest scores)
4. Drop scores below a **threshold**, or you retrieve the “least irrelevant” junk (next lesson)

**Cosine** of two lists \`a\` and \`b\` of the same length is \`dot(a, b) / (norm(a) * norm(b))\`. **Dot** is the sum of pairwise products. **Norm** is the square root of the sum of squares (the length of the list as a vector). If either length is 0, cosine is 0 in this classroom — a zero vector is not a match.

If you **normalize** each vector to length 1 once at ingest (and the query at search time), cosine equals a dot product. Indexes like that. You still print cosine in traces so humans see a familiar scale (about -1 to 1, often 0.1 to 0.9 in practice for text).

## What embeddings are good and bad at

**Good:** paraphrase (“OOM” vs “out of memory”), synonyms, “how do I raise worker RAM” vs a runbook that says “memory limit.” That is why people switched from keyword-only search.

**Bad:** exact ids (\`INV-17\`), rare names, SKUs, stack hashes, and **negation** (“never refund in cash” vs “refund in cash”). The words sit near each other. The vectors sit near each other. Hybrid search (next part) exists because of this.

Embeddings **drift**. If you change the model, you must **re-embed the corpus**. Mixing two models in one index is random retrieval: the same English maps to different axes. Store the **model name** (and version) next to every vector. Ingest records it. Search refuses to mix.

Similarity is **not** probability. Cosine 0.81 does not mean “81% true.” It means “pointed a similar direction.” Do not show users a percent unless you calibrated one. You almost certainly did not.

\`\`\`tryit python
import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(a):
    return math.sqrt(sum(x * x for x in a))

def cosine(a, b):
    na, nb = norm(a), norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return dot(a, b) / (na * nb)

# Toy dims: [infra, billing, security, oom]
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

def search(query_vec, k=2):
    ranked = [(name, cosine(query_vec, vec)) for name, vec in CHUNKS.items()]
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked[:k]

for q, vec in QUERIES.items():
    print(q)
    for name, score in search(vec):
        print(" ", name, "cos=" + str(round(score, 3)))
\`\`\`

If refunds ranked first on the OOM query, your embeddings (or your chunking) are lying. Debugging RAG starts with **printing the scores**. The toy dimensions here are labeled so you can see why OOM aligns with \`runner-oom\`. Real models have hundreds or thousands of unlabeled dimensions. You still print the score. You still check that the top name is the gold chunk on a labeled question.

Unequal list lengths would make \`zip\` silently drop extras. Production code should refuse to score two vectors from different models or different sizes. That refusal is an ingest/search contract, not a cosine trick.

## Caching and cost

Embedding the query costs a model call (or a local forward pass). Cache query embeddings for **identical** questions in a session if you want. Do not cache document vectors across embedding-model versions. Do not cache a rewritten query under the raw user string without recording the rewrite (query-rewrite lesson).

Batch document embeddings at ingest. Search is one query vector against many document vectors. The expensive part at ingest is the embedder. The expensive part at search, for small corpora, is still often the embedder plus the prompt, not the cosine loop.

## Geometry you can debug without a vendor story

Cosine near 1 means two lists point the same way. Cosine near 0 means they are orthogonal in this space, not that the texts are “unrelated in English.” A runbook and a billing page can still share a small cosine because both mention “customer.” Thresholds (next lesson) exist because the tail is not empty.

Long chunks often have **larger raw dots** before you divide by length. Cosine’s division is why we use it. If you accidentally rank by dot product on unnormalized vectors, the longest FAQ wins. If you rank by Euclidean distance, you are answering a different question; stick to cosine unless you know why you switched.

Dimension count is the model’s choice. You do not pick 4 labeled axes in production. You still write \`zip\` and refuse mismatched lengths. A 768-d vector next to a 1024-d vector is not “close enough.” It is a bug.

Prefixes: some embedding APIs want a query prefix versus a document prefix. If you embed chunks as documents and questions as queries, store that in the model-version string. Mixing prefixes looks like a “bad model” in dashboards. It is a contract bug.

Query embedding caches: cache the **exact** string you embedded, including rewrite. Two users saying “OOM” after rewrite may share a vector. Do not cache across model versions. Do not cache a tenant-specific query under a global key.

If refunds rank first on an OOM query in production, print the top 10 ids and scores before you fine-tune anything. Nine times out of ten you will see a chunking chimera or a mixed model, not a need for a new vendor.

## Common mistakes

- Treating cosine as “confidence the answer is true.”
- Mixing models in one table because “they’re both 768 dimensions.”
- Embedding the user question with a different prefix than the chunks (some models want \`query:\` vs \`passage:\`). If you use a prefix, store it in the model-version string.
- Hoping embeddings will pin \`INV-17\`. They will not reliably. Hybrid search will.

## How agents use this

Normalize query and document vectors, then cosine is a dot product. Always log top scores next to chunk ids. When the agent “hallucinates a runbook,” the first check is: was the runbook vector even in the top-k? If cosine to gold is 0.2 and pizza is 0.19, you do not have a generation problem yet.

Retrieve is a library call: text in, ranked chunks out. The later agent loop will call that library. If the geometry is wrong, the loop cannot save you.

Print scores. Name the model. Re-embed when the model changes. That is the whole operational surface of embeddings.

\`\`\`quiz
What does cosine similarity measure for embeddings?
- Disk speed
- *How aligned two vectors are (angle), used to rank chunks near a query
- Whether JSON is valid
- The number of GPUs
explain: Cosine is geometric similarity. Retrieval is top-k by that score, plus a threshold if you are wise.
\`\`\`
`,
  },
  {
    slug: "scores-and-thresholds",
    title: "Scores and Thresholds",
    summary:
      "Top-1 with cosine 0.12 is a miss, not “the best match.” Print scores. Return no evidence when nothing is close.",
    minutes: 19,
    level: "intermediate",
    md: `
A retriever that always returns **k** chunks will always look busy. That is not the same as being right. Top-1 of a bad set is still a miss. Cosine **0.12** is a shrug. Stuffing that chunk into the prompt is how agents invent procedures: the model must say something, the chunk is about “the company” in general, and a cash refund appears.

Set a **threshold** \`tau\`. If the best score is below it, return **no evidence**. Say “nothing in the corpus matched” (later: structured refuse). Do not lower \`tau\` to zero because a demo looked empty. Empty is honest.

\`\`\`viz bars
title Top-1 of a bad set is still a miss
bar OOM,0.88,0
bar Refund,0.21,1
bar Pizza,0.12,2
caption Cosine 0.12 is a shrug. Do not stuff it into the prompt.
\`\`\`

\`\`\`viz vecs
title A hit vs a shrug
vec 0.9,0.2 hit 0
vec 0.25,0.08 miss 1
caption The long arrow is close. The short one is junk below tau. Do not pack it.
\`\`\`

Print scores in **traces**. Cosine 0.81 vs 0.12 is the difference between a hit and a shrug. Do not hide the number behind “here are your results.” Humans cannot debug “the bot was unsure.” They can debug “best cosine 0.14, tau 0.45.”

## What the number means (and does not)

On one embedding model, good hits might cluster around 0.7–0.9 and misses around 0.1–0.3. On another model the clusters move. **You must calibrate \`tau\` on labeled pairs** for that model and that corpus. A pair is (question, gold chunk id) plus questions that should hit nothing.

Calibration is not a slide. Sort held-out questions by best cosine. Pick a \`tau\` that keeps gold chunks and drops pizza. There is no universal 0.75. Vendors who show a “relevance %” have a private mapping. It still drifts when you change models.

If you change the embedding model, **recalibrate**. Copying last quarter’s \`tau\` is how you either retrieve junk or retrieve nothing after an upgrade.

Scores from keyword search and cosine **are not on the same scale**. Do not write \`if bm25 > 0.5 or cosine > 0.5\`. Hybrid fusion and RRF exist because of this. Thresholding fused scores is a new calibration, not the cosine \`tau\` reused.

## Always-k vs maybe-zero

Always-k is tempting in a UI that has a “sources” panel. Empty panels look broken. They are not. **Retrieved 0** is a first-class outcome. Log it. Eval it. The refuse lesson will turn it into a JSON reason. This lesson is the retriever’s job: **do not ship junk as evidence.**

Raising k to 50 because tau felt strict does not fix geometry. You add 49 more shrugs. Packing will then drop them, or worse, keep the long ones. Fix ingest, chunking, hybrid, or rewrite. Do not drown the prompt.

\`\`\`tryit python
import math

def cosine(a, b):
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)

CHUNKS = {
    "oom": [1.0, 0.0, 0.0],
    "refund": [0.0, 1.0, 0.0],
    "menu": [0.0, 0.0, 1.0],
}

def retrieve(qvec, k=2, tau=0.5):
    ranked = [(name, cosine(qvec, vec)) for name, vec in CHUNKS.items()]
    ranked.sort(key=lambda x: x[1], reverse=True)
    kept = [(n, s) for n, s in ranked[:k] if s >= tau]
    return kept

print("oom query", retrieve([0.95, 0.0, 0.05]))
print("pizza query", retrieve([0.1, 0.1, 0.2], tau=0.5))
print("always-k  ", retrieve([0.1, 0.1, 0.2], tau=0.0))
\`\`\`

The pizza query with a threshold returns **nothing**. The same query with \`tau=0\` returns the least-bad junk (probably \`menu\`, still wrong). Agents should prefer empty. The OOM query keeps a real hit. Read the three prints as three product behaviors: hit, honest miss, busy miss.

The \`or 1.0\` on a zero norm avoids divide-by-zero in this toy. A zero vector should still fail the threshold. Do not “fix” zeros by treating them as length 1 without looking.

## Logging

Log, per query: top scores, ids, \`tau\`, k, kept count, embedding model name. When kept count is 0, that is not a chat failure. When gold id is missing but scores look high, your labels or chunk ids drifted. When gold id is present at score 0.2 and \`tau\` is 0.5, your threshold is wrong **or** the embedding is.

## Calibrating without a mythic 0.75

Collect 50–100 questions with gold ids and 20 that should hit nothing. For each, record best cosine (and best keyword score, separately). Sort. Choose \`tau\` so that almost all golds sit above it and almost all no-hit questions sit below it. There will be overlap. That overlap is your error rate. Do not pretend a number from a vendor notebook is your \`tau\`.

When gold sits at 0.22 and no-hit pizza sits at 0.21, **geometry cannot separate them**. Lowering \`tau\` to 0.20 retrieves pizza. Raising it to 0.30 drops gold. Fix chunks, hybrid, or rewrite. The threshold cannot invent a margin that does not exist.

Per-collection thresholds are allowed if you log which one fired. Runbooks might separate cleanly; Slack dumps might not. Slack dumps often should not be in the same product.

Always-k UIs: show “no handbook match” instead of a sources panel full of 0.12 chunks. If you must show “related,” label it **untrusted related**, not citations. Citations require the tau gate.

Fused scores need their own \`tau\`. An RRF sum of 0.03 is not a cosine. Calibrate after fusion, or threshold each channel before fusion (drop weak cosine rows from the vector list, then fuse). Write down which you did.

## Common mistakes

- \`tau = 0\` in production because staging had a thin corpus.
- Showing users the raw cosine as a percent.
- Different thresholds per collection with no note in the trace, so on-call cannot tell which \`tau\` fired.
- Thresholding after packing, so you already spent the window on junk.

## How agents use this

Calibrate \`tau\` on labeled pairs, not on one demo. If you change the embedding model, recalibrate. Log “retrieved 0” as a first-class outcome, not as a failure of the chat UI.

The generate step should not see junk evidence. The refuse lesson teaches the user-facing shape. This lesson is the gate: **scores below tau are not sources**. The agent loop is later. The gate already belongs in the retrieve function.

Print the best score next to tau in every trace. Recalibrate when the embedder changes. Empty kept-count is a first-class outcome. Do not raise k to hide a missing margin. If gold and pizza overlap in score, fix geometry upstream. Always-k is busy, not right. Cosine 0.12 is a miss even when it is top-1. The pizza query in the live box is the product you ship if tau is zero. Calibrate on labeled pairs for this model and this corpus. Recalibrate on embedder change. Log retrieved-zero. Junk in the prompt is how cash refunds happen.

\`\`\`quiz
What should you do when the best cosine is 0.12?
- Stuff that chunk anyway
- *Treat it as a miss: no evidence, do not answer from junk
- Fine-tune the model on pizza
- Raise k to 50
explain: Top-1 of a bad set is still a miss. Thresholds keep junk out of the prompt.
\`\`\`
`,
  },
  {
    slug: "vector-indexes",
    title: "Vector Indexes",
    summary:
      "Brute force is exact and slow. ANN indexes are fast approximations. Know what you are trading.",
    minutes: 21,
    level: "intermediate",
    md: `
With 200 chunks, **brute force** cosine against every vector is the correct design. It is exact and testable. People skip it and install a distributed vector database for a help-center corpus that fits in RAM. Then they debug “ANN recall” before they debug chunking.

**Brute force** means: score the query against **every** document vector, sort, take top-k. Recall of the true nearest neighbor is 100% of whatever your embedding deserves. If gold is missing, the embedding or the chunk is wrong, not the index. Latency grows with corpus size. For 10k short chunks on one machine, Saturday is still a valid runtime.

With millions of vectors, brute force is too slow. You use an **ANN (Approximate Nearest Neighbor)** index. ANN **does not guarantee** the true nearest neighbor. It guarantees a speed/recall tradeoff you must measure. You only score a **subset** of vectors (buckets, clusters, a graph of neighbors). Faster. Some true neighbors never get scored.

\`\`\`viz bars
title Brute force vs a bucket
bar Brute scanned,64,0
bar ANN scanned,32,1
caption Fast means you skipped some vectors. Measure recall, not vibes.
\`\`\`

## Recall@k vs latency

**Recall@k** (retrieval sense) is the fraction of queries whose **gold chunk** appears in the top k. Report it next to latency. If you cannot quote both, you are collecting a dependency, not operating an index.

ANN papers quote recall of the true nearest neighbor. You care about **gold chunk in top k**, which also depends on chunking and embeddings. Still: an ANN that drops the true neighbor cannot retrieve gold if gold **was** that neighbor.

Tune ANN parameters the way you tune \`tau\`: on a labeled set. Graphs go stale when you add many vectors. Rebuild (or the vendor’s incremental insert that you have **tested**) is part of ingest. A graph built in January with inserts until September can quietly lose recall.

## You might not need a new database

For many products, a **vector column** in the database you already run is enough until latency proves otherwise. Filter by \`tenant_id\` in SQL, then brute force the remaining vectors, or use the database’s ANN on that filtered set. Separate systems mean two auth stories and two backups.

When you do need ANN, treat it as a **cache of geometry**, not as a source of truth. You should still be able to brute-force a subsample and compare. The classroom demo below is a one-bit bucket: crude on purpose so you can **see** a miss.

\`\`\`tryit python
import math

def cosine(a, b):
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)

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
\`\`\`

When overlap is below 5/5, you **see** approximation: the true neighbors lived in the other bucket. Production ANN is the same idea with better graphs. Never skip a brute-force baseline on a subsample. If subsample brute and ANN disagree on gold questions, you have an index problem, not a prompt problem.

“ANN scanned N of M” is the speed story. If N is still M, you did not approximate. If N is tiny and recall is 0.4, you approximated too hard.

## Debug like an index, not like a chatbot

Ship a “search this id” debug endpoint that prints a chunk’s nearest neighbors. When a gold chunk never appears, ask: is it in the index at all? Which bucket? What is cosine to the query under brute force? ANN miss looks like a smart model that “didn’t read the doc.”

Rebuild when ingest adds a large batch. Measure recall@k in CI on a tiny golden set (later lesson). Do not wait for a customer to find the missing runbook.

## What you are actually approximating

ANN families (graphs, clusters, trees) all skip some vectors. Skipping is the speed. The miss is a gold neighbor that lived on the other side of a partition, like the toy bucket. Production graphs are better than one bit, but they still miss, especially after many inserts without rebuild, and especially for queries that do not look like the rest of the graph.

Filters plus ANN is a second trap. If the index is global and you filter tenant **after** ANN, you may have scored a neighbor’s vectors and then dropped them, leaving this tenant with a thin, wrong shortlist. Prefer filter-then-ANN, or a per-tenant graph. The next lesson is tenants; the index must not fight it.

A vector column in the database you already run, with brute force on a few thousand rows, is boring and correct. Move to ANN when p95 latency on brute force exceeds your SLO **on production-sized data**, not on a blog post about millions of vectors.

Debug endpoint: given a chunk id, print its text, tenant, model name, and top neighbors under brute force on a subsample. When a user says “it never finds section 4.2,” look the section up by id first. Not in the index is ingest. In the index but not a neighbor of the query is embedding or chunking. Neighbor under brute, missing under ANN, is the index.

Rebuild cost is part of ingest SLO. A graph that takes six hours to rebuild needs a plan for daytime edits: dual-write, or accept lag. Dual-write without a checksum is how two versions of a refund policy both retrieve.

## Common mistakes

- Distributed ANN for 800 FAQ chunks.
- No brute-force baseline, so every miss is “the model.”
- Never rebuilding the graph.
- Using ANN as a permission system (next lesson: it is not).

## How agents use this

An ANN miss looks like a smart model that “didn’t read the doc.” Check retrieval before you rewrite the prompt. Rebuild graphs when you add many vectors. Ship a debug endpoint that prints neighbors for a chunk id.

The agent loop will call retrieve. Retrieve will call the index. If the index is approximate, your eval must include questions whose gold neighbors sit in the long tail of the graph. Otherwise you only test the easy cluster.

Brute force is the truth. ANN is a trade. Quote both numbers.

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
    slug: "tenant-filters",
    title: "Metadata Filters and Tenants",
    summary:
      "Vectors cannot keep tenants apart. Filter by tenant_id (or use per-tenant indexes) before you rank.",
    minutes: 20,
    level: "intermediate",
    md: `
“Vectors only” cannot do \`tenant_id = acme\` correctly unless you **pre-filter** or keep a **separate index per tenant**. Mixing tenants in one graph and hoping cosine will not cross the fence is a **data leak**. Acme’s query about refunds will retrieve Globex’s “instant cash” if those words sit nearby. The model will cite it. The UI will show it. That is not a hallucination. That is your retriever.

**Metadata filters** are predicates on fields you stored at ingest: \`tenant_id\`, \`lang\`, \`product\`, \`acl\`, \`status\`. They are **access control** and routing, not seasoning. Cosine is not a permission system.

\`\`\`viz scatter
title Tenants are not a vibe
xlabel dim 1
xmin -0.1
xmax 1.1
ymin -0.1
ymax 1.1
dot 0.2,0.8 Acme 0
dot 0.25,0.72 Acme 0
dot 0.8,0.2 Globex 1
dot 0.85,0.28 Globex 1
caption Filter to Acme first. Cosine will happily rank a neighbor's cash policy.
\`\`\`

## Filter first, then rank

Filter in the database (or the index’s metadata filter), **then** search. The pool the cosine sees should already be legal. Or partition indexes: Acme’s vectors never share a graph with Globex.

Do not retrieve 20 chunks from everyone and then drop the wrong tenant in Python **after** the fact if those chunks already entered **logs**, traces, or the model context. Post-filter in the prompt is theater: the leak already happened in the retrieve call. If you must post-filter, do it **before** logging chunk text, and treat a cross-tenant hit as an incident, not as a normal miss.

Per-tenant indexes are operationally heavier and security-simpler. Shared index plus mandatory filter is cheaper and easy to get wrong (forget the filter on one code path). Pick one and test the forgotten-filter path.

The same idea applies to \`lang\`, \`product\`, \`acl\`. A German query should not retrieve an English legal page unless you decided that. A “mobile” product collection should not retrieve “desktop billing exceptions” unless they share a policy on purpose. **ACL** at chunk level is how you keep “finance only” pages out of the support bot.

## Who sets tenant_id

Pass the **user’s** tenant from the **session**, not from the model’s arguments. If the model can set \`tenant_id\`, injection will set it to a neighbor. A wiki page that says “search tenant globex” is not consent. The tools track’s confused-deputy lesson applies to retrieval too: the retriever is a deputy. The caller’s auth is the boss.

Classroom retrieve functions should look like \`retrieve(query, tenant)\` where \`tenant\` is an argument **your** code fills from the session. It is not a field inside the query string.

\`\`\`tryit python
CHUNKS = [
    {"id": "acme-refund", "tenant": "acme", "text": "Acme refunds take 5-7 days."},
    {"id": "globex-refund", "tenant": "globex", "text": "Globex refunds are instant cash."},
    {"id": "acme-oom", "tenant": "acme", "text": "Acme OOM: raise worker memory."},
]

def retrieve(query, tenant, k=2):
    q = set(query.lower().split())
    pool = [c for c in CHUNKS if c["tenant"] == tenant]
    ranked = []
    for c in pool:
        score = len(q & set(c["text"].lower().split()))
        ranked.append((score, c["id"], c))
    ranked.sort(reverse=True)
    return [c for score, _id, c in ranked[:k] if score > 0]

print("acme", [c["id"] for c in retrieve("refund days", "acme")])
print("globex", [c["id"] for c in retrieve("refund days", "globex")])
print("no mix", all(c["tenant"] == "acme" for c in retrieve("refund OOM", "acme")))
\`\`\`

Globex’s “instant cash” never appears in Acme’s results. The pool is filtered **before** overlap scores. \`no mix\` prints True. That is the whole security idea. If you deleted the pool line and ranked everyone, Acme would see cash refunds and you would have a story for the incident review.

Word overlap stands in for cosine here so the filter is obvious. Production still filters first, then cosine on the remaining vectors (or ANN on a tenant partition).

## Collections are filters too

Runbooks vs billing vs “public FAQ” are collections. Searching the entire company dump on hop 0 is how you retrieve a joke Slack message next to a refund policy. Route with metadata (\`collection=runbooks\`) from **your** policy, not from an untrusted page that names collections.

## Tests that prove the fence

Write a leak test: as tenant Acme, query a phrase that **only** Globex’s corpus contains (their unique product name). Expect zero hits and no Globex ids in logs. Run it in CI. If a developer comments out the filter “to debug locally” and ships it, CI should scream.

Write a completeness test: Acme’s own refund chunk must still retrieve for Acme. Over-filtering (tenant and product and language and a broken default) can return empty for everyone. Empty is better than a leak, but it is still a bug. Log filter predicates in the trace: tenant, collection, language.

Session binding: the HTTP session (or job record) has \`tenant_id\`. Retrieve’s signature in your code should not accept tenant from the model. If you later wrap retrieve as a tool, the runtime injects tenant. A tool schema that includes tenant is a confused deputy waiting to happen.

Default the support bot to the public FAQ collection. On-call gets runbooks. Do not put HR in the support index “because we might need it.” Ingest into a separate index or a filter that support’s role cannot pass.

Post-filter after logging is a leak even if the user never saw the chunk. Trace stores are full of “debug” dumps. Redact or filter first.

Public-web retrieve is a tenant of one: **you**. It still needs wrapping (later) and must not write back into semantic memory. It must not share an index with Acme’s private runbooks.

## Common mistakes

- One global index, filter optional, “we’ll add it later.”
- Tenant in the query string: \`tenant:acme refunds\`. Users and injectors will type other tenants.
- Logging neighbor chunks “for debug” in a shared trace backend.
- ANN graph built across tenants, then hoping metadata bits are enough. Measure leaks with a test: query as Acme, gold is Globex’s cash policy, expect zero.

## How agents use this

When retrieve becomes a tool, the runtime binds \`tenant_id\` from the session the same way it binds auth to \`get_invoice\`. The model does not get a tenant argument. Descriptions should not even mention other tenants.

Eval a **leak set**: questions that would match a neighbor’s chunks if the filter were missing. Those tests fail the build. They are cheaper than a lawsuit.

Vectors rank. Filters authorize. Do not ask cosine to do both.

Pass tenant from the session only. Log the predicates you filtered on. A forgotten filter is a leak, not a retrieve miss. Completeness tests must still find Acme’s own chunks. Post-filter after logging is too late. Vectors are not a permission system. The deputy who retrieves must use the caller’s tenant, not a tenant named in a wiki sentence or a model argument.

\`\`\`quiz
How should a multi-tenant agent retrieve?
- Search everyone, then hope the prompt is polite
- *Filter to the user’s tenant first, then rank
- Embed tenant names only
- Put all tenants in one chunk
explain: Metadata filters are access control. Cosine is not a permission system.
\`\`\`
`,
  },
];
