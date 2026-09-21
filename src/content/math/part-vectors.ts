import type { RawLesson } from "@/lib/types";

export const mathVectors: RawLesson[] = [
  {
    slug: "vectors",
    title: "Vectors",
    summary:
      "A vector is a list of numbers. Add them, scale them, measure length. Embeddings are vectors with extra marketing.",
    minutes: 20,
    level: "beginner",
    md: `
A **vector** is an ordered list of numbers. In this track it is a Python list of floats, like \`[0.2, -1.1, 3.0]\`. **Dimension** is \`len(v)\`. Two vectors can be added only if they have the **same length**.

In 2-d, a vector is an arrow on the plane. In 3-d, an arrow in space. A 1536-d embedding is an arrow you cannot draw — but you still **add**, **scale**, and measure **length** with the same formulas.

The numbers inside are **components**. Changing one component moves you along one axis. Later, a **partial derivative** will be “what happens if I move only this component.”

Vendors return a list of 384, 768, or 1536 floats for a string. That list **is** the vector. “Embedding” is a name for “vector that stands for text (or an image, or a tool).” There is no extra magic object behind the JSON.

\`\`\`viz vecs
title Two arrows on the plane
vec 2,0.5 a
vec 0.4,1.8 b 1
caption Add them by walking a, then b. Scale by stretching. Length is how long the arrow is.
\`\`\`

## A wrong picture

A wrong picture is: “an embedding is a paragraph stored in a clever way, still basically text.” It is not text. After the embedder runs, you have floats. Similarity, clustering, and retrieval are arithmetic on those floats. If you mix two embedders, you mix two spaces. Same length is not the same space: a 768-d list from model A and a 768-d list from model B are not comparable.

Another wrong picture is: “length of the vector is how important the text is.” Length (magnitude) is the size of the arrow, not the quality of the document. A long chunk can produce a longer vector for boring reasons. Cosine will ignore length on purpose. Distance will not. Know which score you use.

A third wrong picture is treating a **zero vector** as “similarity 0.” Zero has no direction. You cannot normalize it. Cosine is undefined (you would divide by zero). Empty chunks and failed embedding calls produce zeros. Treat length 0 as an error, not as a neighbor.

## The formula in words

- **Add:** slot by slot. \`[a, b] + [c, d] = [a+c, b+d]\`. Picture: walk the first arrow, then the second.
- **Scale:** multiply every slot by the same number. \`3 * [1, -2] = [3, -6]\`. Negative scale reverses direction. This is how you take a **step** in training: new point = old point + (step size) times a direction.
- **Magnitude** (length, L2 norm): square each slot, add, take the square root. In 2-d that is Pythagoras.
- **Normalize:** divide a nonzero vector by its length. Same direction, length 1. A **unit vector** has length 1. Cosine will need that.
- **Distance** between two points: length of their difference. Difference is add, with a scale of \`-1\` on the second vector.

If lengths differ, **stop**. Raise an error. Silent zip that truncates the longer list is a production bug.

## A tiny example

\`a = [3, 4]\`. Magnitude is \`sqrt(9+16) = 5\`. That is the 3-4-5 triangle. \`2 * a = [6, 8]\`. Unit \`a\` is \`[3/5, 4/5] = [0.6, 0.8]\`, length 1.

\`b = [1, -2]\`. \`a + b = [4, 2]\`. Difference \`a - b = [2, 6]\`. Distance is \`sqrt(4+36) = sqrt(40) ≈ 6.325\`.

In embedding land, “the user’s question” and “the refund FAQ” are two lists. Distance small or cosine high means “treat as related.” You will score that in the next lesson. Here you only need: they are lists you can add, scale, and measure.

## Add and scale

Vector addition is one component at a time. Scalar multiplication stretches or flips. Magnitude is the square root of the sum of squares.

\`\`\`tryit python
def add(u, v):
    if len(u) != len(v):
        raise ValueError("dimension mismatch")
    return [a + b for a, b in zip(u, v)]

def scale(k, v):
    return [k * x for x in v]

def magnitude(v):
    return sum(x * x for x in v) ** 0.5

def normalize(v):
    m = magnitude(v)
    if m == 0:
        raise ValueError("zero vector")
    return scale(1 / m, v)

a = [3, 4]
b = [1, -2]
print("a + b", add(a, b))
print("2 * a", scale(2, a))
print("|a|", magnitude(a))
print("unit a", normalize(a))
print("|unit a|", magnitude(normalize(a)))

diff = add(a, scale(-1, b))
print("distance a to b", magnitude(diff))
\`\`\`

You should see \`a + b\` as \`[4, 2]\`, \`2 * a\` as \`[6, 8]\`, \`|a|\` as \`5.0\`, unit a as \`[0.6, 0.8]\`, and the length of unit a as \`1.0\` (tiny float noise is fine). Distance prints about \`6.325\`. \`[3, 4]\` has length 5. Distance between two points is the length of their difference.

Try \`normalize([0, 0])\` in your head: magnitude 0, the function raises. That is the correct behavior for a failed embed. Catch it at the boundary: do not insert a zero into the memory bank.

When people average embeddings (one vector for a whole document from its chunks), they **add** then **scale** by \`1/n\`. That is valid only if the vectors live in the same space. They do not, if you mix models.

## What embeddings actually are

An embedder is a function from text to a list of floats. Same text, same model, same list (or close, if the vendor adds tiny noise). Different models, different lists. Changing a word moves the point. Retrieval is nearest neighbor search in that cloud of points.

Dimension must match the index you search. Putting a 1536-d query into a 768-d index is a shape error. Print \`len(vec)\` in retriever tests. Shape is the first test. Magnitude is the second: a typical unit embedding has length 1 (if the API normalizes) or some stable range (if it does not). A magnitude of 0 is a failure. A magnitude of 1e6 is also a failure.

You cannot read a 1536-d list as a sentence. You can still **compare** two lists. That is the whole point.

## How agents use this

Agent **memory** is often “keep the last k embedding vectors and the text that made them.” Logging only the text hides geometry bugs (wrong model, mixed 768-d with 1536-d, forgot to normalize). Print \`len(vec)\` and \`magnitude(vec)\` in retriever tests. Shape and length are the first tests of RAG.

- **Tokens vs vectors:** tokens are discrete ids. Embeddings are continuous lists. A sentence is both: a list of token ids for the generator, and one (or several chunk) vectors for retrieval.
- **Ranking:** next lesson turns two vectors into one score. This lesson’s job is to keep those vectors well-formed.
- **Training:** weights are a giant vector. A downhill step is add, with a negative scale of the gradient. Same two operations.
- **Averaging memories:** add, then scale by \`1/n\`. Only inside one model’s space.

Never add vectors from two different embedding models. Same length is not the same space. If you concatenate hand-made features (latency, token count) onto an embedding, you have a new space: scale those extra slots or milliseconds will dominate cosine.

Zero vectors: drop them. Do not search them. Do not average them into a document vector (they pull the mean toward the origin for no semantic reason).

> **Warning:** Never add vectors from two different embedding models. Same length is not the same space.

\`\`\`quiz
Which operation needs two vectors of equal dimension?
- Printing a vector
- *Vector addition (and the difference used for distance)
- Choosing a learning rate
- Lowercasing text
explain: Addition is one component at a time. Different lengths are a shape error — the same class of bug as mixing embedding sizes.
\`\`\`
`,
  },
  {
    slug: "dot-product",
    title: "Dot Product and Cosine Similarity",
    summary:
      "Multiply-and-add two lists. That number, scaled by lengths, is cosine. RAG ranks memory this way.",
    minutes: 21,
    level: "beginner",
    md: `
The **dot product** of two equal-length vectors is the sum of component times component: \`a1*b1 + a2*b2 + ...\`. It is one number.

Algebra: “how much do these lists agree, slot by slot.” Geometry: \`u · v = |u| |v| cos(theta)\`, where \`theta\` is the angle between them.

- If the dot product is **positive**, the arrows point into a shared half (acute angle).
- If it is **zero**, they are at a right angle (unrelated, in that geometry).
- If it is **negative**, they point somewhat opposite.

If you **normalize** both vectors to length 1, the dot product **is** \`cos(theta)\`. That number lives in \`[-1, 1]\` and is called **cosine similarity**. RAG ranks chunks by this score (or a close cousin).

## A wrong picture

A wrong picture is: “high cosine means the model agrees with the user” or “the chunk is true.” Cosine means **nearby in embedding space**. A confident wrong FAQ can sit right next to the query if they share words and topic. Retrieval finds **related text**, not **correct text**. Grounding and evals are later jobs.

Another wrong picture is mixing **dot product on raw vectors** with **cosine** in the same index. If one document vector is longer because the chunk was longer, raw dot product rewards length. Cosine ignores length and keeps **direction**. Many APIs already return length-1 vectors; then cosine and dot product **match**. Silent mismatch is a top production RAG bug.

A third wrong picture is: “distance and cosine always rank the same.” They do not, unless you normalized. Do not mix conventions. If you normalize, use dot product. If you do not, use cosine (normalize inside the formula) or a distance you have tested.

## The formula in words

Dot product: multiply matching slots, add the products. Same length required.

Cosine: dot product, then divide by (length of first times length of second). If either length is 0, stop — undefined.

If both lengths are 1, skip the divide: cosine **equals** the dot product.

Tiny numeric: \`u = [1, 0]\`, \`v = [0.6, 0.8]\`. Dot is \`1*0.6 + 0*0.8 = 0.6\`. Lengths are 1 and 1, so cosine is 0.6. \`w = [0, 1]\` is at right angles to \`u\`: dot 0, cosine 0. \`r = [-1, 0]\` is opposite: cosine \`-1\`.

\`\`\`viz vecs
title Two unit arrows: u and v
vec 1,0 u 0
vec 0.6,0.8 v 1
caption u lies on the x-axis. v is the 3-4-5 direction. Multiply matching slots and add: the dot is 0.6.
\`\`\`

## Why not only distance?

You can rank by distance too: closer points win. Cosine **ignores length** and keeps **direction**. That matters when one document vector is longer because the chunk was longer, not because it is more relevant.

Tied scores: two chunks can share a cosine. Break the tie with recency or a trusted source. Geometry should not be the only policy.

Score cutoff: top-k **always** returns k neighbors, even if every cosine is 0.2. Pair ranking with a threshold from the clip lesson. A winner at 0.82 and a winner at 0.21 are different confidence stories.

## Rank a tiny memory bank

An agent stores three memories as 3-d vectors. A new observation arrives. We score every memory and sort. That is retrieval without a vector database: a loop, a sort, a top-k.

\`\`\`tryit python
def dot(u, v):
    if len(u) != len(v):
        raise ValueError("dimension mismatch")
    return sum(a * b for a, b in zip(u, v))

def mag(v):
    return sum(x * x for x in v) ** 0.5

def cosine(u, v):
    return dot(u, v) / (mag(u) * mag(v))

memories = [
    ("user likes terse answers", [0.9, 0.1, 0.0]),
    ("refunds take 5-7 days", [0.1, 0.9, 0.1]),
    ("pager duty on-call is Mei", [0.0, 0.2, 0.9]),
]

query = [0.2, 0.85, 0.05]
ranked = sorted(memories, key=lambda item: cosine(query, item[1]), reverse=True)
for text, vec in ranked:
    print(round(cosine(query, vec), 3), text)
\`\`\`

The query \`[0.2, 0.85, 0.05]\` is billing-ish: large middle slot, like “refunds take 5-7 days” \`[0.1, 0.9, 0.1]\`. You should see refunds **first** with cosine near **0.99**, then terse answers, then on-call last. If it does not, the vectors are badly chosen — which is how you debug a real embedder: **look at neighbors**, not at ads.

Change \`query\` toward \`[0.0, 0.1, 1.0]\` and watch the on-call memory rise. Ranking is geometry plus a sort key. Print the **scores**, not only the texts.

Hand-check one pair if you want: query dot refunds is \`0.2*0.1 + 0.85*0.9 + 0.05*0.1 = 0.02 + 0.765 + 0.005 = 0.79\`. Lengths are a bit over 0.87 and a bit over 0.91. Divide and you land near 0.99. The formula is multiply-and-add, then scale by lengths.

If \`mag(u) * mag(v)\` is 0, this code divides by zero. Guard it the way \`normalize\` did: refuse zero vectors before you rank.

## How agents use this

Tool-using agents retrieve **memories, docs, and old traces** with this score. If top-k is 4 and the right paragraph is 5th, the model never sees it. That failure is not “the LLM is dumb.” It is a **k / embedding / cutoff** failure you can measure with (query, must-include-chunk) pairs.

When you log retrieval, log the **scores**, not only the texts.

- **Tokens:** the generator never sees a chunk that lost the cosine sort. Improving the prompt poem does not fix a broken neighborhood.
- **Ranking:** this **is** ranking. Metadata filters (only \`label == billing\`) run **before** or **after** this score. Filters change the candidate set. Cosine ranks whatever is left.
- **Loss:** a linear ranker on embeddings is often trained so that gold chunks get higher dots than distractors. Same multiply-and-add, with a slope on \`W\`.
- **Sampling:** retrieval is usually **deterministic** given the index (argmax / top-k). Do not confuse it with token sampling. Mixing temperature into retrieval is a different product choice.

If two cosines tie, break the tie with recency or a trusted source. If the whole top-k sits in a blob of similar scores, that is high-entropy retrieval (entropy lesson): ask a clarifying question instead of pretending rank-1 is destiny.

> **Tip:** If two cosines tie, break the tie with recency or a trusted source. Geometry should not be the only policy.

\`\`\`quiz
If two vectors already have length 1, cosine equals which of these?
- Their distance
- The product of their lengths
- *Their dot product
- Always 0
explain: Cosine is dot product divided by the product of lengths. Those lengths are 1, so cosine is the dot product.
\`\`\`
`,
  },
  {
    slug: "matrices",
    title: "Matrices",
    summary:
      "A matrix is a list of lists. Multiply it by a vector to get another vector — the shape of a linear layer.",
    minutes: 20,
    level: "beginner",
    md: `
A **matrix** is a table of numbers. In Python we use a **list of rows**, each row a list of equal length. Shape is \`(rows, cols)\`. A matrix \`W\` with 2 rows and 3 columns is 2 by 3.

You add matrices of the **same shape**, slot by slot. You scale a matrix like a vector. The operation that earns the data structure is **matrix-vector multiply**: it sends a vector of length \`cols\` to a vector of length \`rows\`.

For each row of \`W\`, take the **dot product** of that row with \`x\`. The results become the components of \`y\`. If \`W\` is \`m\` by \`n\` and \`x\` has length \`n\`, then \`y\` has length \`m\`. Shape errors are \`len(row) != len(x)\`. Raise them loudly.

## A wrong picture

A wrong picture is: “a matrix is a spreadsheet I read as text” or “I can multiply any two tables.” Shape is a contract. 2 by 3 times a length-2 vector is illegal. 2 by 3 times a length-3 vector is legal and produces length 2. Libraries that disagree with your hand check usually disagree on **layout**: rows vs columns, or whether the vector is on the left or the right. Fix layout. Do not “reshape until it runs” without checking one numeric example.

Another wrong picture is: “a linear layer is mysterious.” A **linear layer** in a neural net is \`y = W x + b\` (matrix-vector plus a bias vector). That is all. Each row of \`W\` is “how this output slot weights the inputs.” Each column is “how this input feature fans out.” Reading \`W\` is reading a bundle of dot products.

A third wrong picture is skipping shape logs. Garbage predictions with **no** exception often mean you swapped rows and columns and still multiplied something. Logging \`len(W)\` and \`len(W[0])\` catches that.

## The formula in words

Matrix-vector: for each row, dot that row with \`x\`. Stack those dots into a new list.

Bias: add a vector \`b\` of length \`rows\`, slot by slot, after the multiply.

Tiny numeric. Let

\`W = [[1, 0, 2], [0, 1, -1]]\`,
\`x = [1, 4, 3]\`,
\`b = [0.5, -0.5]\`.

First row dot \`x\`: \`1*1 + 0*4 + 2*3 = 7\`. Second: \`0*1 + 1*4 + (-1)*3 = 1\`. So \`W x = [7, 1]\`. Plus bias: \`[7.5, 0.5]\`.

\`\`\`viz grid
title W is 2 rows by 3 columns
row 1,0,2
row 0,1,-1
labels in1 in2 in3
caption Each row is a recipe for one output slot. Dot that row with x to get one number in y.
\`\`\`

If \`x\` had length 2, the dots would be a shape error. Raise. Do not zip-and-truncate.

## Why this is everywhere

A batch of embeddings stacked as rows is a matrix. Attention scores are tables of dot products (later: one line on attention). Projecting an embedding to a smaller space is a matrix with fewer rows than the embedding length. A linear classifier on frozen embeddings is \`W x + b\` on one vector. You can prototype that with lists, then swap in a real module.

Matrix-matrix multiply is the same idea with extra loops: each column of the second matrix is a vector you multiply by \`W\`. Skip it until you can do mat-vec without looking it up.

The **transpose** flips rows and columns. A 2 by 3 transpose is 3 by 2. If you stored \`W\` the wrong way, transpose is the fix — or, better, agree on layout in code review. A vector is a matrix with one column (or one row). The distinction is layout. Agree on layout.

## Implement mat-vec

This 2 by 3 matrix maps a 3-d feature vector to a 2-d hidden vector. Print shapes as you go. That habit transfers when a real library complains about \`[2, 3]\` vs \`[3]\`.

\`\`\`tryit python
def shape(M):
    return (len(M), len(M[0]) if M else 0)

def dot(u, v):
    return sum(a * b for a, b in zip(u, v))

def mat_vec(W, x):
    m, n = shape(W)
    if len(x) != n:
        raise ValueError("need length " + str(n) + ", got " + str(len(x)))
    return [dot(row, x) for row in W]

def add_vec(u, v):
    return [a + b for a, b in zip(u, v)]

W = [
    [1.0, 0.0, 2.0],
    [0.0, 1.0, -1.0],
]
b = [0.5, -0.5]
x = [1.0, 4.0, 3.0]
y = add_vec(mat_vec(W, x), b)

print("W shape", shape(W))
print("x", x)
print("W x", mat_vec(W, x))
print("W x + b", y)
\`\`\`

You should see shape \`(2, 3)\`, \`W x\` as \`[7.0, 1.0]\`, and \`W x + b\` as \`[7.5, 0.5]\`. Hand-check: first component is \`1*1 + 0*4 + 2*3 = 7\`, plus bias \`0.5\` → \`7.5\`. Second is \`0*1 + 1*4 + (-1)*3 = 1\`, plus \`-0.5\` → \`0.5\`. If your library disagrees, your layout (rows vs columns) is wrong — not reality.

Note that \`dot\` here does not check lengths. \`mat_vec\` does, using the row length. That is the right place: one check per multiply.

Change \`x\` to length 2 and you should get \`ValueError\`. That is a **good** failure. A silent wrong length is a **bad** failure.

## How agents use this

When a paper says the model **projects** queries, keys, and values, it means three matrices applied to the same token vectors. (Transformer internals stop at that one sentence.) When a framework “adds a linear classifier on frozen embeddings,” it is \`W x + b\` on the embedding of the last state. You can prototype that with lists.

- **Tokens / features:** a bag of flags plus a cosine plus a latency can be one vector \`x\`. A small \`W\` maps that to “search vs sql” logits. Shape of \`W\` is (number of tools, number of features).
- **Ranking:** a learned projection \`W\` so that cosine in the projected space matches your labels better. Apply \`W\` to **every** vector you compare, or to none.
- **Loss:** if \`y = W x + b\` and loss is a function of \`y\`, training will slope each entry of \`W\` (gradients lesson). The object you slope is this table of numbers.
- **Logging:** print \`len(W)\` and \`len(W[0])\` in tests. Swapped rows and columns look like garbage predictions, not like an exception.

Stay in lists of floats. You do not need a GPU to see the contract: **linear mix of inputs**.

> **Note:** A vector is a matrix with one column (or one row). The distinction is layout. Agree on layout.

\`\`\`quiz
If W is 2 by 3 and x has length 3, what is the length of W x?
- 3
- 5
- *2
- 6
explain: Each of the 2 rows produces one dot product with x, so the output has 2 components.
\`\`\`
`,
  },
  {
    slug: "linear-maps",
    title: "Linear Maps",
    summary:
      "Matrices scale, rotate, and stretch features. That picture is how models transform embeddings — and how you break ranking.",
    minutes: 20,
    level: "beginner",
    md: `
A **linear map** is a function \`T(x) = W x\` that sends vectors to vectors and respects addition and scaling: \`T(u+v) = T(u)+T(v)\` and \`T(k v) = k T(v)\`. Every matrix defines one.

You already multiply. This lesson is **what it does to geometry**, which is how you debug feature transforms.

Why agents care: you constantly build lists like \`[latency_ms, cosine]\` or you stretch embedding axes without meaning to. A linear map can **scale**, **stretch**, or **rotate** that space. Cosine after a bad stretch is a different geometry. Queries and documents must live in the **same** geometry.

## A wrong picture

A wrong picture is: “stretching a space does not change angles, so cosine is safe.” Uniform scale (the same factor on every axis) keeps directions. **Stretch** along one axis only **does** change angles. Neighbors that were close can separate. Cosine **after** a bad stretch is not cosine **before**.

A worse picture: apply a stretch \`W\` to documents and **leave the query raw**. Then you compare two different coordinate systems and call it relevance. Similarity assumes one space. A linear map must be applied to every vector you compare, or to none.

Another wrong picture is: “one linear map can fold space into any shape.” It cannot. Linear maps send grids to parallelograms. They cannot fold. Bends like ReLU come **after** an affine step. A stack with bends can. One \`W\` cannot. That is why a single linear classifier is a **plane** in feature space, not a squiggle.

## The formula in words

\`T(x) = W x\`. Linear: additivity and scaling as above. Origin stays at origin: \`T(0) = 0\`.

**Uniform scale** by \`s\` is the diagonal matrix \`[[s, 0], [0, s]]\`. Every arrow grows by \`s\`. Angles stay. Lengths change. Cosine of two scaled vectors matches cosine of the originals (the \`s\` cancels).

**Stretch** along x only is \`[[s, 0], [0, 1]]\`. The unit square becomes a rectangle. Angles change. Cosine after stretch is a new score.

**Rotation** turns arrows without changing length. Rotations keep dot products. A 90 degree rotation of \`[1, 0]\` is \`[0, 1]\` (with the usual convention).

**Affine:** \`T(x) = W x + b\`. Bias moves the origin. Feature transforms in classical ML (standardize columns) are linear or affine maps you choose. In deep models, \`W\` is **learned**. The picture does not change: data is moved so that a later dot product or chance becomes more useful.

## A tiny example

Point \`p = [1, 0]\`. Scale by 2 on both axes: \`[2, 0]\`. Stretch x by 3: \`[3, 0]\`. Rotate 90 degrees: about \`[0, 1]\`.

Nasty stretch \`sx=0.1\`, \`sy=10\` on a document \`[0.6, 0.8]\` yields \`[0.06, 8.0]\`. The y-axis eats the space. If the query stays \`[1, 0]\` unstretched, you are matching a nearly vertical arrow against a horizontal one. Ranking becomes meaningless.

\`\`\`viz vecs
title Before the stretch
vec 1,0 query 0
vec 0.6,0.8 doc 1
caption Query and document in the original plane. They share some direction.
\`\`\`

\`\`\`viz vecs
title After sx=0.1 and sy=10
vec 0.1,0 query 0
vec 0.06,8 doc 1
caption Same map on both arrows. The document is almost vertical. Cosine is now a different score.
\`\`\`

That is also **feature scaling**: one coordinate was in dollars, one was a 0–1 score; you rescale so cosine is not eaten by dollars. Milliseconds vs cosine is the same bug.

## Scale and rotate in 2-d

\`\`\`tryit python
import math

def mat_vec(W, x):
    return [sum(a * b for a, b in zip(row, x)) for row in W]

def scale_xy(sx, sy):
    return [[sx, 0.0], [0.0, sy]]

def rotation(t):
    c, s = math.cos(t), math.sin(t)
    return [[c, -s], [s, c]]

p = [1.0, 0.0]
print("point", p)
print("scale 2,2", mat_vec(scale_xy(2, 2), p))
print("stretch x*3", mat_vec(scale_xy(3, 1), p))

R = rotation(math.pi / 2)
out = mat_vec(R, p)
print("rotate 90", [round(out[0], 6), round(out[1], 6)])

doc = [0.6, 0.8]
W = scale_xy(0.1, 10.0)
print("raw doc", doc, "query", p)
print("stretched doc", mat_vec(W, doc), "stretched query", mat_vec(W, p))
\`\`\`

Read the prints. Scale 2,2 gives \`[2.0, 0.0]\`. Stretch x*3 gives \`[3.0, 0.0]\`. Rotate 90 gives about \`[0.0, 1.0]\` (the tiny leftover is float cosine of pi/2). Raw doc is \`[0.6, 0.8]\` next to query \`[1, 0]\`. After the nasty stretch, the doc is \`[0.06, 8.0]\` and the stretched query is \`[0.1, 0.0]\`. The y-axis ate the space. Neighbors that were close can separate.

Applying \`W\` to the document but **not** the query is worse: you compare two different coordinate systems. The last print line applies \`W\` to both — that is the **legal** way to stretch, and it still **changes angles** relative to the unstretched world. If your index was built unstretched, you must not stretch only at query time.

## Affine maps and features

\`T(x) = W x + b\` is **affine**: linear plus a shift. Bias moves the origin. ReLU and other bends come **after** this, which is why a network can be more than one stretch.

Standardize a column: subtract the mean, divide by the spread. That is affine (a scale and a shift per axis). Do it with **training-set** means, then apply the same numbers to queries. Fitting means on the query batch leaks; more important here: **different** means for docs vs queries is another two-space bug.

When a vendor says they **fine-tune a projection** on frozen embeddings, they are learning a small \`W\` so that cosine in the projected space matches your labels better. You now know what object they are learning. Apply it to the whole corpus and to every query.

## How agents use this

Agents featurize constantly: bag of tool-name flags, token counts, cosine scores, latency. If you concatenate \`[latency_ms, cosine]\` and then nearest-neighbor in that plane, **milliseconds will dominate** unless you scale. A diagonal scale (or divide each column by its spread) is the fix. The same bug appears when mixing embedding dimensions with hand-made features in one list.

- **Tokens:** token counts as a raw feature will dwarf 0–1 flags. Scale or keep them in a separate head.
- **Ranking:** same \`W\` on queries and documents. Rebuild the index after you change \`W\`. An old index plus a new projection is two spaces.
- **Loss:** the projection is trained with a ranking or classification loss on **your** labels. If labels are “which chunk was useful,” cosine in the new space should lift those chunks. If labels are noisy, \`W\` will still fit the noise.
- **Sampling:** linear maps are deterministic. They do not replace temperature. They change the space you retrieve in, before the generator samples tokens.

If retrieval quality collapses after a “simple preprocess” step, print two or three points before and after \`W\` and check whether angles survived. Compare cosine(query, doc) **before** and **after**. If the ranking flips on examples you trust, the map is not a no-op.

> **Tip:** If retrieval quality collapses after a “simple preprocess” step, print two or three points before and after \`W\` and check whether angles survived.

\`\`\`quiz
You scale only document embeddings by a stretch W, and leave the query untransformed. What happens?
- Cosine scores stay valid because length is ignored
- *Query and documents no longer live in the same geometry, so ranking is meaningless
- The map stops being linear
- Rotation is applied automatically to the query
explain: Similarity assumes one space. A linear map must be applied to every vector you compare, or to none.
\`\`\`
`,
  },
];
