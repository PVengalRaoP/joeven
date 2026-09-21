import type { RawLesson } from "@/lib/types";

export const mlRepresent: RawLesson[] = [
  {
    slug: "embeddings-ml",
    title: "Embeddings",
    summary:
      "Meaning as a list of numbers. Close lists rank together. Retrieval is geometry.",
    minutes: 21,
    level: "intermediate",
    md: `
An **embedding** is a list of numbers that stands in for a thing — a word, a sentence, a ticket, a tool description — so that **geometry approximates meaning**.

“Cat” and “kitten” should be closer than “cat” and “invoice.” Closer usually means **cosine similarity**: the cosine of the angle between two lists. It ignores length, which is useful because some models encode frequency in the length and you often do not want that.

You do not need to understand every dimension. You need:

1. The same encoder for queries and documents (or a trained pair)
2. A similarity function
3. An eval, because leftover error is real

This page stays on **lists of floats**, cosine, and retrieval. It does not teach how a language model builds those lists. You can ship RAG without that. You cannot ship RAG without measuring neighbors.

## From id to vector

In RAG, each **chunk of text** is sent through a model once and stored. At query time you embed the query and take nearest neighbors. Until then, we can fake a tiny table and still practice the math agents run all day.

A **vector** here means a Python list of floats. Same length for every item in the table. If lengths differ, you cannot zip them into a score. Mixing two models in one index is how you get random retrieval: the slots do not mean the same thing.

If vectors are **normalized** to length 1, cosine and dot product are the same. Production bugs happen when you **train** with one score and **search** with another, or you normalize only one side.

Many embedding models expect prefixes: \`query: ...\` versus \`passage: ...\`. If you embed both sides the same way, neighbors get worse in a way that looks like a “bad index.” Read the model card. If you change the model, **re-embed the corpus**. Partial re-embeds leave old geometry next to new geometry.

\`\`\`viz scatter
title Close lists sit together
xlabel dim 1
ylabel dim 2
xmin -0.15
xmax 1.05
ymin -0.05
ymax 1.05
dot 0.90,0.10 cat 0
dot 0.80,0.20 kitten 0
dot 0.70,0.22 dog 0
dot 0.05,0.90 invoice 1
dot 0.08,0.80 refund 1
dot 0.12,0.70 sql 1
caption Animals in one blob. Billing in another. Retrieval is closest lists first.
\`\`\`

\`\`\`tryit python
import math

E = {
    "cat": [0.9, 0.1, 0.0],
    "kitten": [0.8, 0.2, 0.0],
    "dog": [0.7, 0.2, 0.1],
    "invoice": [0.0, 0.1, 0.9],
    "refund": [0.0, 0.2, 0.8],
    "sql": [0.1, 0.0, 0.7],
}

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(a):
    return math.sqrt(sum(x * x for x in a))

def cosine(a, b):
    d = norm(a) * norm(b)
    return dot(a, b) / d if d else 0.0

def nearest(query, k=3):
    q = E[query]
    scored = [(cosine(q, v), name) for name, v in E.items() if name != query]
    scored.sort(reverse=True)
    return scored[:k]

for q in ("cat", "invoice"):
    print("query", q)
    for sim, name in nearest(q):
        print(" ", name, round(sim, 3))
\`\`\`

**What printed:** two retrievals. Query \`cat\` pulls \`kitten\` then \`dog\` (animals sit in nearby lists). Query \`invoice\` pulls \`refund\` then \`sql\` (billing-ish lists). That is retrieval. Scale the table to millions of chunks and you have a vector index. The geometry did not change: closest lists first.

Cosine 0.82 is not 82% true. It is an angle. Calibrate with labels if you need a percent. For ranking, sort by cosine and measure P@k.

If a list is all zeros, \`norm\` is 0 and we return cosine 0. Empty embeddings are a real bug (blank chunk, failed encode). Do not let them silently win or silently vanish without a log.

## What goes wrong in production

Agents fail at retrieval in geometric ways:

- Query is 20 tokens of chat fluff; the chunk is a table
- You embed the latest sentence but the question was two turns ago
- Top-k is too small
- You dump 50 chunks and the LLM attends to the wrong one (similarity is not usefulness)
- You embed with model A and search an index built with model B
- You skip prefixes the model card required
- You never re-embed after the corpus changed (drift of documents, not of user language)

**Usefulness** is not cosine. A chunk can be close in topic and still be the outdated policy. Ranking metrics with gold ids catch that. Cosine alone cannot.

A routing classifier can be “embed the utterance, embed each tool doc, pick max cosine.” Still eval it with a confusion matrix. Geometry is the feature. The decision still needs a split and a dummy.

## Normalization and length

Length of the list (how many slots) is **dimension**. Length of the vector (the Euclidean norm) is a different word. Say **norm** for the size of the list as a geometric object. High-norm embeddings can dominate **dot product** search. Cosine divides it out. If your index uses inner product, normalize on write and on query, or you are ranking by a mix of meaning and magnitude.

Do not hunt for a story in slot 17. Individual slots of a trained embedding are usually not human features. The **list as a whole** is the feature.

## Same encoder, same recipe, measured neighbors

Chunking is part of the embedding. A 50-token chunk and a 2000-token chunk of the same policy will not sit in the same place, and the query may match the wrong one. Overlap between chunks, headings stuffed as prefixes, and whether you embed the table as text are all **features of the list you store**. Change the chunker, re-embed, re-run P@k. Do not compare neighbors across recipes.

Query-side recipes matter as much. “Embed the last user sentence” vs “embed a rewritten standalone question” vs “embed the last three turns.” Each is a different list. Few-shot the rewriter if you must, but then the rewriter is part of the retriever and belongs in the freeze.

**Dimension** (how many slots) is not quality. A 256-slot list from a model trained for your domain can beat a 1536-slot list from a generic encoder. You will not see that without an eval of (query, must-include-chunk) pairs. Bigger lists also cost more RAM in the index. Pick from P@k and latency, not from a brochure.

When two items are near-duplicates, cosine will be high and ranking metrics can look fine while the generator still cites the stale copy. Dedup the corpus. Geometry does not know which PDF is in force. That is metadata you must store next to the list: version, date, product.

## Common mistakes

- One index, two encoders.
- Treating cosine as a probability.
- Embedding the whole transcript when the question is one clause.
- Never measuring P@k, only “it found something.”
- Forgetting to re-embed after a model bump.

## How agents use this

Memory is a table of lists. Retrieval is a score plus a sort plus a k. Routing can be the same table of tool docs. Logging neighbors and scores is how you debug. When the agent cites shipping, print the ranked names. If shipping won, you have a geometry or chunking bug. If refund won and the generator still cited shipping, you have a generator bug. Those two fixes are not the same prompt.

> **Warning:** Cosine 0.82 is not 82% true. It is an angle. Calibrate with labels.

\`\`\`quiz
Why do we often use cosine similarity for embeddings?
- It is the only function Python can compute
- *It compares direction (meaning) and ignores vector length
- It always equals accuracy
- It requires numpy
explain: Cosine is length-invariant. That matches the usual goal: similar topics, not similar embedding norms.
\`\`\`
`,
  },
  {
    slug: "knn-retrieve",
    title: "Nearest Neighbors",
    summary:
      "k-NN labels a new point by a vote of its nearest labeled points. Retrieval is the same geometry without the vote.",
    minutes: 20,
    level: "intermediate",
    md: `
**k-nearest neighbors (k-NN)** is the simplest supervised model that uses geometry.

1. Store all training points with their labels
2. For a new point, find the \`k\` closest training points
3. Predict the majority label (or average, for a number)

There is **no training loop**. Fit is “remember the table.” Cost is at **query** time: compare to every stored point (or use an index).

Retrieval **is** k-NN without the vote: you return the neighbors themselves (the chunks) instead of their labels. A tool router can do the vote: nearest labeled utterances decide \`search\` vs \`sql\`.

\`k\` is a hyperparameter. \`k = 1\` memorizes. Large \`k\` smooths, then it starts mixing unrelated neighborhoods. Pick \`k\` on validation. Odd \`k\` avoids 50/50 ties for two classes; ties still happen with more classes — define a rule (first neighbor wins, or abstain).

## Distance is a policy

Euclidean distance (straight-line in the list of numbers) is the default in textbooks. Cosine distance (1 minus cosine, or sort by cosine) is the default for embeddings. They are not the same if norms vary. Pick one, freeze it, eval it.

Distance must be in a space where “close” means “same job.” Raw token counts of different scales will not. Unscaled latency next to a 0/1 flag will not. Embeddings usually will, if they are from **one** model.

k-NN does not invent features. Garbage geometry in, garbage vote out.

\`\`\`viz scatter
title Two neighborhoods vote
xlabel x0
ylabel x1
xmin -0.15
xmax 1.15
ymin -0.15
ymax 1.15
dot 0.10,0.90 search 0
dot 0.20,0.80 search 0
dot 0.00,1.00 search 0
dot 0.15,0.85 query 2
dot 0.90,0.10 sql 1
dot 0.80,0.20 sql 1
dot 1.00,0.00 sql 1
caption The docs query sits in the search blob. Three neighbors vote search. No gradient. A table and a distance.
\`\`\`

\`\`\`tryit python
import math

# 2-d toy: (x0, x1) labeled 0=search, 1=sql
train = [
    ([0.1, 0.9], 0),
    ([0.2, 0.8], 0),
    ([0.0, 1.0], 0),
    ([0.9, 0.1], 1),
    ([0.8, 0.2], 1),
    ([1.0, 0.0], 1),
]

def dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

def knn(x, k=3):
    scored = sorted((dist(x, p), y) for p, y in train)
    votes = [y for _, y in scored[:k]]
    # majority; tie -> first
    return 1 if votes.count(1) > votes.count(0) else 0, votes

for name, x in [("docs question", [0.15, 0.85]), ("revenue question", [0.85, 0.15])]:
    yhat, votes = knn(x, k=3)
    label = "sql" if yhat == 1 else "search"
    print(name, "votes", votes, "->", label)
\`\`\`

**What printed:** \`docs question votes [0, 0, 0] -> search\` — the point sits in the search blob; three neighbors vote 0. \`revenue question votes [1, 1, 1] -> sql\` — the other blob. Three neighbors vote. That is a router. No gradient. A table and a distance.

If you set \`k = 1\`, a single mislabeled neighbor can flip the call. If you set \`k = 6\` on six points, you always vote the global majority. Middle values are the product.

## Cost and indexes

Brute force is: for every query, loop every stored point. Fine for thousands. Painful for millions. Production retrieval uses an **index** (approximate neighbors). Approximate means you might miss the true nearest. Measure P@k on a freeze **through the index you ship**, not through a Python loop that only exists in the notebook.

Adding a point is easy (append). There is no “retrain.” There is **stale geometry** if you change the encoder and forget to rebuild. There is **leakage** if the table contains test conversations.

## Few-shot is k-NN in English

Few-shot prompting is k-NN in disguise: you stuff the nearest labeled examples into the prompt and let the LLM vote in English. The quality still hangs on **which** neighbors you picked. Log them. If the nearest labeled traces are from a different product, the vote is noise.

The LLM can disagree with the majority of neighbors. Then you have two policies. Log both. If they disagree often, your geometry and your generator are not the same router.

## Votes, ties, and a growing table

A **weighted** vote (closer neighbors count more) is a small upgrade. It is still k-NN. It still needs a validation \`k\`. Ties should **abstain** on a dangerous class rather than break toward \`shell\`. Write that rule.

In high dimension, distances bunch: many points look similarly far. Embeddings still work because they were trained so that meaning sits in angles, but you should not assume Euclidean k-NN on raw bag-of-words with 10,000 slots is a good router. That space is where everything is far. Use a small bag, or an embedding, then k-NN.

The table **grows**. Every labeled trace you add is more memory and more query cost unless you index. It is also more chance of leakage if you add test conversations. Treat the table like a dataset: version it, freeze ids that must not be in it, delete stale labels when policy changes. k-NN has no epoch, but it has **stale memory**. A wrong label stays until a human removes it. That is a feature (you can fix one row) and a bug (nobody removes rows).

For retrieval, do not vote. Return the neighbors. For routing, vote. Mixing those jobs — stuffing 20 neighbors into a prompt and also taking majority of their labels — can be fine if you log which neighbor won. It is two systems. Measure both: P@k of the retrieve, accuracy of the vote.

\`k = 1\` on duplicate tickets is a cheat: the nearest neighbor is the same ticket. Dedup by conversation id before you celebrate a 99% router.

Query time is the bill. Brute force k-NN that was fine on 2,000 labeled utterances will hurt at 200,000. Then you add an index, and the index is approximate, and you must re-measure P@k or vote accuracy **through that index**. A notebook loop is not the system you ship. Log neighbor ids in production so you can see when the index skipped a true neighbor that the notebook would have found.

## Common mistakes

- \`k = 1\` on a table full of duplicates of the test ticket.
- Distance in unscaled raw counts.
- Rebuilding the table from traces that include the eval.
- Measuring brute-force P@k and shipping an approximate index.
- Forgetting that fit is store: stale labels stay until you delete them.

## How agents use this

For retrieval, k is top-k chunks. For a router, k is how many labeled neighbors vote. Both are validation knobs. Memory systems that “find similar tickets” are this page. Evaluate them as ranking (P@k) or as classification (vote), depending on whether you return the neighbors or you return a label.

When the table is small and labels are clean, k-NN is a strong baseline. Beat it on a freeze before you train a net. Many agent routers should stay here.

> **Tip:** For retrieval, k is top-k chunks. For a router, k is how many labeled neighbors vote. Both are validation knobs.

\`\`\`quiz
What does k-NN do at “training” time?
- It runs gradient descent for many epochs
- *It stores the labeled points; the work happens at query time
- It deletes outliers
- It trains a softmax from scratch
explain: k-NN is a memory model. Fit is storing. Prediction is a nearest-neighbor vote (or a retrieve).
\`\`\`
`,
  },
  {
    slug: "unsupervised",
    title: "Unsupervised Learning",
    summary:
      "No labels: find structure. Tiny 2-d k-means, then name the clusters by hand.",
    minutes: 21,
    level: "intermediate",
    md: `
**Unsupervised** learning is what you do when nobody labeled \`y\`. The questions change: which points clump? Which traces are unlike the rest? Can we compress this conversation?

You still evaluate — just not with “accuracy against gold” unless you later obtain gold. You look at cluster sizes, stability, and **whether a human can name the cluster**. Unnamed clusters are not a product. A picture of blobs is a draft taxonomy.

Do not call this a classifier. Do not report “accuracy” against names you invented after looking at the blobs unless you held out a labeling pass. Promotion into supervised learning is a later, honest step.

## K-means in one paragraph

1. Place \`k\` **centroids** (means) in the space
2. Assign each point to the nearest centroid
3. Move each centroid to the mean of its points
4. Repeat until assignments stop changing (or you hit a step budget)

It minimizes within-cluster squared error. \`k\` is a choice. Init matters. Clusters are **blob-shaped**. Weird rings will be sliced badly. For a first map of embedding space it is still the right hammer.

Scale your dimensions: a job id in the thousands will dominate a 0–1 flag. Embed first, then cluster the vectors. Running k-means on raw chat tokens is hopeless.

\`\`\`viz scatter
title Two unlabeled blobs
xlabel x
ylabel y
xmin -0.5
xmax 5.6
ymin -0.4
ymax 5.6
dot 0.0,0.1 A 0
dot 0.2,0.0 A 0
dot 0.1,0.2 A 0
dot 0.15,0.15 A 0
dot 5.0,5.1 B 1
dot 5.2,4.9 B 1
dot 4.8,5.0 B 1
dot 5.1,5.2 B 1
caption K-means puts a mean in each clump. You still have to name the cluster by reading traces.
\`\`\`

\`\`\`tryit python
import math

points = [
    (0.0, 0.1), (0.2, 0.0), (0.1, 0.2), (0.15, 0.15),  # blob A
    (5.0, 5.1), (5.2, 4.9), (4.8, 5.0), (5.1, 5.2),  # blob B
]

def dist(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def mean(group):
    n = len(group)
    return (sum(p[0] for p in group) / n, sum(p[1] for p in group) / n)

centroids = [points[0], points[-1]]  # one seed from each blob

for step in range(1, 6):
    buckets = [[] for _ in centroids]
    assign = []
    for p in points:
        j = min(range(len(centroids)), key=lambda i: dist(p, centroids[i]))
        buckets[j].append(p)
        assign.append(j)
    centroids = [mean(b) if b else c for b, c in zip(buckets, centroids)]
    print("step", step, "assign", assign)
    print("  centroids", [(round(c[0], 2), round(c[1], 2)) for c in centroids])
\`\`\`

**What printed:** five steps of assignments and centroids. The assignment list should snap to two groups: zeros for the origin blob, ones for the \`(5, 5)\` blob (or the reverse, depending on which seed is which). Centroids move toward the mean of each blob and then sit still. That is k-means doing its only trick: nearest mean, then update the mean.

Init here was honest (one seed from each blob). Random init can land both centroids in one blob and stall. Run twice. If points jump clusters, the structure is weak or \`k\` is wrong.

## Choosing k

The “elbow” of error vs \`k\` is a heuristic: plot within-cluster error, look for a bend. For product work, pick \`k\` you can **label in a meeting**. Five named failure modes beat twenty anonymous ones.

Anomaly detection is the cousin: a point far from every centroid is a candidate for a new tool or a new eval case. Do not auto-delete outliers. They are often the incident.

Other unsupervised tools exist (compression, topic sketches). The agent-relevant output is still a **nameable** group or a **flagged** oddball. If you cannot name it, you cannot write a rubric, and you cannot supervise later.

## From clusters to labels

Then **promote** a cluster into a supervised label (“this cluster is SQL-timeout; add a retry”). Unsupervised finds the taxonomy; supervised ships it. Humans name a sample from each blob. Disagreement means the blob is mixed: split, or drop.

Clustering **failed** runs by embedding the last tool error is the usual win. You will find “timeout,” “schema,” and “user cancelled” as separate weather systems. Clustering **user goals** may show that 40% of volume is “reset password,” which should be a workflow, not an agent.

## How to inspect a blob without lying

After k-means, **read** twenty traces from each cluster. Write a name in a meeting or refuse the cluster. “Cluster 3” is not a finding. “SQL timeouts after the billing API 500s” is a finding. If those twenty traces disagree, the blob is mixed: raise k, change features, or split by a flag you already have (HTTP status).

Stability is a check: run twice with different seeds (or a different pair of starting points). If many points jump, do not ship a taxonomy. Either k is wrong or the space has no blobs, only a smear. A smear still has **outliers** — far from the mean of everything — which are often new incident types. Sample those. They are eval cases.

k-means will slice a ring or a banana into pie pieces. Embeddings of language are not always round blobs. If inspection shows a gradient (easy to hard tickets) instead of types, stop clustering and build a supervised score instead.

Never report accuracy against names you invented from the same points you clustered. That is circular. The honest path is: cluster on a large unlabeled pile, name from a sample, then **label a held-out sample** with those names and train or evaluate a classifier. Unsupervised found the menu. Supervised takes the order.

Empty clusters (a centroid with no points) happen if you init badly. Re-seed. Do not interpret an empty cluster as “a rare failure mode we discovered.”

Compressing a conversation into a short list of numbers (an embedding) is unsupervised too: you keep geometry, you drop words. That list is only useful if neighbors still mean the same job. Check with a handful of known pairs (two password tickets close, a password ticket far from an invoice). If those pairs fail, clustering on the lists will fail. Fix the encoder and the text you embed (last error, not the whole fluffy chat) before you pick a new k.

## Common mistakes

- Accuracy on names you invented from the same points.
- k-means on unscaled raw features.
- k = 20 because the plot looked busy.
- Treating the cluster id as a gold tool name.
- Never looking at example traces from each blob.

## How agents use this

Use unsupervised work to **see**. Use supervised work to **act**. A weekly cluster of failures is an ops habit with ML shape: embed, k-means or even just nearest-centroid to last week’s named means, sample, name, promote.

When a new blob appears, that is drift’s cousin: the world grew a kind of ticket you did not label. Do not silently absorb it into the nearest old centroid. Make a new eval case.

> **Note:** Running k-means on raw chat tokens is hopeless. Embed first, then cluster the vectors.

\`\`\`quiz
What does k-means require you to choose up front?
- The correct label for every point
- *The number of clusters k (and an initialization)
- A GPU
- Cross-entropy
explain: K-means partitions into k groups. k is a hyperparameter, not estimated by the basic algorithm.
\`\`\`
`,
  },
  {
    slug: "neural-net-intro",
    title: "A Tiny Neural Net",
    summary:
      "A one-hidden-layer forward pass with lists — linear maps, ReLU, and why depth needs a bend.",
    minutes: 22,
    level: "intermediate",
    md: `
A **neural network** is a stack of linear maps with **bends** (nonlinearities) between them. Without the bend, the whole stack is still one linear map and cannot learn XOR-shaped problems. With it, you get a messy function that can fit your data.

This page is a **forward pass** you can print. It is not a course on language-model internals. Billions of parameters are still \`Wx + b\` and a bend, repeated. You already know the training loop: loss, slope, step. Depth adds capacity — and overfitting, cost, and latency.

## One neuron

A neuron: \`z = w · x + b\`, then \`a = f(z)\`. For modern nets, \`f\` is often **ReLU**: \`max(0, z)\`. Logistic sigmoid squashes to (0, 1) for chances. You already trained that as a linear classifier.

**Dot** means multiply matching slots of two lists and add. **Bias** is an extra knob added after the weighted sum. A **linear map** from a list of length 2 to a list of length 2 is two dots: one per output slot. We store that map as a **list of rows** (each row is the weights for one output).

## One hidden layer

Input \`x\` (length 2) → hidden (length 2) → output (length 1):

1. \`h_raw = W1 x + b1\`
2. \`h = relu(h_raw)\`
3. \`y = W2 h + b2\`

\`W1\` is two hidden neurons, each with two weights. This is the same **shape** as a small feed-forward block: matrix times list, then a bend. We will not unpack attention or token stacks here. If you can write \`matvec\`, you can read “linear projection” in a paper without panic.

Why the bend: linear then linear is still linear. \`W2 (W1 x)\` is some other matrix times \`x\`. ReLU is the cheapest bend that lets regions turn **off** (output zero) so different parts of space can use different linear pieces.

When ReLU outputs zero, the slope through that unit is zero for that example. If it stays off, it is “dead.” For agents, the analog is a tool the policy never calls: it cannot learn from a path it never takes. A little temperature on the router, or a forced tool on eval, keeps tools alive.

\`\`\`viz flow
title One hidden layer
layout lr
node xin Input
node hid Hidden ReLU
node yout Output
edge xin hid
edge hid yout
caption Linear, then a bend, then linear. Without the bend the whole stack is still one straight map.
\`\`\`

\`\`\`tryit python
def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def matvec(W, x):
    return [dot(row, x) for row in W]

def relu(xs):
    return [max(0.0, v) for v in xs]

# Hand-set weights that fire only when both inputs are large
W1 = [
    [1.0, 0.0],
    [0.0, 1.0],
]
b1 = [-0.5, -0.5]
W2 = [[1.0, 1.0]]
b2 = [-0.5]

def forward(x):
    h = relu([z + b for z, b in zip(matvec(W1, x), b1)])
    y = [z + b for z, b in zip(matvec(W2, h), b2)]
    return h, y[0]

for x in ([0.0, 0.0], [1.0, 0.0], [0.0, 1.0], [1.0, 1.0]):
    h, y = forward(x)
    print("x", x, "hidden", h, "y", y, "fire" if y > 0 else "quiet")
\`\`\`

**What printed:** four forward passes. \`(0, 0)\`, \`(1, 0)\`, and \`(0, 1)\` end **quiet** (y at or below 0): at least one ReLU is off, so the output never clears the last bias. \`(1, 1)\` **fires**: both hidden slots go positive (1.0 - 0.5 = 0.5), they add, minus 0.5, y is positive. That is a **nonlinear** decision — both inputs must be on. A single linear neuron cannot draw that “both must be on” region as cleanly.

Weights were hand-set, not learned. Training would run gradient descent on \`W1\`, \`b1\`, \`W2\`, \`b2\` with a loss. The forward picture would not change.

## Capacity, depth, and what you should not do yet

**Width** is how many hidden units. **Depth** is how many layers. More of either is more knobs. More knobs fit more patterns and more accidents. Regularize. Split. Early-stop. A tiny net around an LLM is often enough: injection detector, chunk ranker, abstain head.

You do not need to train a giant net to use one. Calling a hosted model is inference of a giant net. Your job is still the ML loop: features, split, metric, baseline. The giant function does not excuse a 12-trace eval.

Skip transformer internals here. If you need tokens and attention, that is a later track. This track’s neural net is: lists, dots, a bend, a loss, a downhill step.

## What the tiny net is for, and what it is not

The live box is XOR-shaped on purpose: a pattern a straight cut misses. Agent routing sometimes looks like that: “call sql if the user wants a count **and** we already searched,” or “escalate if VIP **and** refund.” You can hard-code the AND as a feature (\`vip_and_refund = vip * refund\`) and stay linear. You can also let a hidden layer learn a bend. The feature is usually cheaper and easier to log. Use the net when the ANDs and ORs are many and unnamed.

Training this net would mean a loss on \`y\` vs the output, slopes through ReLU (0 if the unit was off, 1 if it was on), and a step on every weight. If a unit is off for every train row, its incoming weights get zero slope — dead. A small random start and a sensible scale of inputs keep more units alive. Print the hidden list on a few rows after a few steps. All zeros is a bug report.

A 2-layer net on 40 traces will memorize. Regularize, or do not use the net. The LLM already has more than enough capacity. The tiny net’s job is **cheap, inspectable, local**: injection-ish scores, abstain heads, rerank on a handful of features. If you need language understanding, call the frozen LLM. If you need a millisecond router, a linear map or this tiny net is the shape.

Do not stack more layers because a diagram had more layers. Depth without a bend is wasted. Depth with a bend and no extra data is overfitting. Stay on this side of the line until you have labels, a split, and a dummy that lost.

## Common mistakes

- Stacking linear layers with no bend and expecting XOR.
- Celebrating train accuracy on four points.
- A huge hidden layer on 40 traces.
- Dead ReLUs (all zeros) and no print of hidden lists.
- Assuming a deep net replaces a keyword baseline.

## How agents use this

Small nets still earn rent **around** the LLM: a tiny classifier for prompt injection, a ranker for chunks, a “should we abstain?” head. Running a 2-layer net on CPU is cheaper than another 8k-token call. Split data, pick a loss, report precision/recall, watch validation.

If you can write \`matvec\`, you can log a linear router and a tiny net the same way: print the hidden list when you debug. “All zeros” is a dead path. “This unit fires only on refund” is a feature you could have written by hand — and maybe should have.

> **Tip:** If you can write \`matvec\`, you can read a paper’s “linear projection” without panic. It is a matrix times a vector.

\`\`\`quiz
Why put a nonlinearity between two linear layers?
- To make Python faster
- *Otherwise the composition is still one linear map and cannot learn many patterns
- ReLU deletes the gradient forever
- Softmax requires three layers
explain: Linear then linear is still linear. The activation is what makes depth useful.
\`\`\`
`,
  },
];
