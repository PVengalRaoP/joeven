import type { TrackSource } from "@/lib/types";

export const math: TrackSource = {
  slug: "math",
  title: "Mathematics",
  short: "Math",
  tagline:
    "Vectors, matrices, calculus, probability, entropy, and optimization — the math agents actually use.",
  color: "#7C3AED",
  order: 3,
  lessons: [
    {
      slug: "why-math",
      title: "Why Agents Need Math",
      summary:
        "Embeddings, loss, and sampling look like product features. They are functions, vectors, and probability.",
      minutes: 12,
      level: "beginner",
      md: `
Agents speak English on the outside. Inside, they are arithmetic.

When a support agent retrieves the right policy paragraph, it is not because the model “understood the vibe”. A query became a **list of numbers**, each document became a list of numbers, and a similarity function ranked those lists. When a coding agent samples a slightly different token and the whole plan changes, that is **probability**. When a training dashboard says loss went from 2.4 to 1.1, that is a **function on weights**, differentiated and stepped.

Joeven teaches this math because you will **debug** it. A RAG pipeline that “feels random” is almost always a geometry bug: bad chunking, unnormalized vectors, or cosine computed on the wrong axis. A model that repeats itself is often a temperature or sampling bug. A fine-tune that does nothing is a gradient that is zero, exploding, or pointing at the wrong loss.

You do not need a PhD. You need a working picture of six objects: **functions**, **vectors**, **matrices**, **derivatives**, **probability**, and **information** (entropy). The rest of this track is those six objects, implemented with Python lists — no NumPy — with the agent use sitting next to the formula.

## The map

| Agent idea | Math object |
|---|---|
| Embedding | Vector (a list of floats) |
| RAG ranking | Dot product, cosine similarity |
| Linear layer | Matrix times vector |
| Loss | Function from parameters to a number |
| Training | Gradients and optimization |
| Softmax / temperature | Probability, \`exp\` |
| Next-token / tool choice | Sampling |
| Uncertainty | Entropy |
| Belief after a tool result | Bayes |

If you can implement the right-hand column with lists and loops, vendor docs and error dashboards stop looking like magic.

## A retrieval ranking you can see

The next block pretends a 4-dimensional embedding model exists. It does not. The **geometry** is the same in 4-d as in 1536-d: close lists rank high, far lists rank low.

\`\`\`tryit python
query = [0.2, 0.8, 0.1, 0.0]
docs = {
    "refund policy": [0.1, 0.9, 0.0, 0.1],
    "shipping times": [0.8, 0.1, 0.7, 0.0],
    "password reset": [0.0, 0.2, 0.1, 0.9],
}

def mag(v):
    return sum(x * x for x in v) ** 0.5

def cosine(a, b):
    return sum(x * y for x, y in zip(a, b)) / (mag(a) * mag(b))

for name, vec in docs.items():
    score = cosine(query, vec)
    print(f"{name:16} {score:.3f}")
\`\`\`

The query is close to “refund policy” and far from “password reset”. That is ranking. Later lessons name the formula (**cosine similarity**) and the data structure (**a vector**).

## Agent connection

Every expensive part of an agent is a math object you can measure:

- Context length is a **count** (tokens). Cost is a **product** (tokens times price times steps).
- Memory is a set of **vectors** you search.
- The policy is a **probability distribution** over tokens or tools.
- Training scores and many evals are **expectations** of a loss.

If you skip math, you can still call APIs. You cannot explain why Tuesday’s agent is worse than Monday’s, and you cannot fix a retriever that quietly ranks the wrong chunk first.

> **Tip:** When an agent fails, ask which number was wrong: a similarity, a probability, a count, or a threshold. That question is this track.

\`\`\`quiz
What is an embedding, mathematically?
- A paragraph of English stored in the prompt
- *A vector: a list of numbers that represents text (or an image, or a tool) in a geometric space
- A Python exception type
- A GPU driver setting
explain: Embeddings turn stuff into vectors so similarity, clustering, and retrieval become arithmetic.
\`\`\`
`,
    },
    {
      slug: "functions-graphs",
      title: "Functions and Graphs",
      summary:
        "A function is a mapping from inputs to one output. Plot it with print, then see loss and policies as functions.",
      minutes: 12,
      level: "beginner",
      md: `
A **function** is a rule that sends each allowed input to **exactly one** output. Write \`y = f(x)\`. The set of legal \`x\` is the **domain**. The outputs that actually appear are the **range**.

That sounds like middle school. It is also the whole model:

- A language model is a function from a token sequence to a list of **logits** (one number per vocabulary item).
- A **loss** is a function from parameters (and a batch of data) to a single non-negative number.
- A **policy** is a function from observations to an action, or to a distribution over actions.
- **Temperature** is a function that reshapes logits before they become probabilities.

If two different inputs can map to the same output, that is still a function (many-to-one). If one input would need two outputs, that is not a function — and it is a bug in your API.

## Tables are graphs

A graph is the set of pairs \`(x, f(x))\`. On paper you draw a curve. In this classroom we **print a table** and a bar of hashes. That is a discrete graph: enough to see a bowl, a slope, or a saturating curve.

Try a toy **loss** \`f(w) = (w - 3)^2\`. It is a parabola with a minimum at \`w = 3\`. Training is “walk downhill on this graph.” You do not need calculus yet to **see** the valley.

\`\`\`tryit python
def loss(w):
    return (w - 3) ** 2

print("  w   loss(w)  graph")
for w in range(-1, 8):
    y = loss(w)
    bars = int(y)  # discrete plot: one # per unit of loss
    print(f"{w:3}  {y:7.1f}  " + "#" * bars)
\`\`\`

Read the printout left to right: as \`w\` approaches 3, the bar shrinks; past 3 it grows again. That picture is why later lessons bother with **derivatives** (the slope of this graph) and **gradient descent** (a rule for picking the next \`w\`).

Change the function. \`abs(w - 3)\` is a V. \`2 ** (-abs(w - 3))\` is a bump. Same loop, different mapping.

## Composition

Agents stack functions. \`softmax(logits / T)\` is three maps: scale by temperature, exponentiate and normalize, then maybe \`argmax\` or a random sample. If any stage is wrong, the outer function is wrong. Debugging is isolating **which** map failed.

A tool-using agent is also a function, just a messy one: transcript in, next tool call out. When people say “the model is nondeterministic,” they mean this function depends on a **random seed** as well as the transcript. Still a function — the domain includes the RNG.

## Agent connection

When you log \`loss=1.83\` or \`p_tool_search=0.61\`, you are reading \`f(current_state)\`. Plots of those numbers over steps are how you notice **goal drift** (the function you meant to minimize is not the one going down) and **mode collapse** (the policy function puts almost all mass on one action).

You will not graph a 7-billion-parameter network in this track. You will graph the **tiny** functions that network is made of, until “the model is a function” is muscle memory.

> **Note:** A lookup table is a function. A 20-line Python \`def\` is a function. A transformer is a function. Same idea, different implementation cost.

\`\`\`quiz
Which statement is true of a function f?
- One input is allowed to produce two different outputs
- *Each input in the domain maps to exactly one output
- Graphs are only for calculus class and never appear in agents
- Temperature is not a function because it is a slider in a UI
explain: The definition is unique output per input. Models, losses, and decoding steps are all functions (sometimes with extra random input).
\`\`\`
`,
    },
    {
      slug: "sums-notation",
      title: "Sums, Products, and Averages",
      summary:
        "Sigma, products, and means in Python loops — the notation behind loss, cost, and token budgets.",
      minutes: 12,
      level: "beginner",
      md: `
Almost every formula in this track is a **loop that adds**. Mathematicians write a capital sigma: the sum of \`x_i\` from \`i = 1\` to \`n\`. In Python that is \`s = 0\` then \`s += x\` , or \`sum(xs)\`.

A **product** (capital pi) multiplies instead. Independent probabilities multiply. So do token-level likelihoods: the probability of a whole sequence is the product of next-token probabilities (or a sum if you take logs — later).

An **average** (the arithmetic mean) is a sum divided by a count. Batch loss is an average. Cost per ticket is an average. “The agent usually takes 8 steps” is a mean hiding a distribution.

## Index notation

If \`x\` is a list, \`x[0]\` is the first element in Python and \`x_1\` is often the first in math. Off-by-one between papers and code is a classic bug. When you translate a formula, write the range down: \`i\` from 0 to \`n-1\` inclusive, or 1 to \`n\`.

A **weighted average** is still a sum: \`sum(w_i * x_i)\` with weights that add to 1. Softmax output is a list of weights. Attention is a weighted average of value vectors. You do not need the transformer lesson yet: you need “sum of weight times vector.”

A **moving average** is the same idea over time: each new loss value is folded into a running mean so a dashboard does not twitch with every batch. Agents do this to token counts and tool latencies. You are still dividing a sum by a count; you are just choosing which window of terms to include.

## Running the operations

This example treats five numbers as a tiny dataset: a sum, a product, a mean, and mean squared error against a target — the same shape as a **loss**.

\`\`\`tryit python
xs = [2, 5, 5, 8, 1]
n = len(xs)

total = 0
for x in xs:
    total += x
mean = total / n

prod = 1
for x in xs:
    prod *= x

target = 5
sse = 0
for x in xs:
    sse += (x - target) ** 2
mse = sse / n

print("n", n)
print("sum", total)
print("mean", mean)
print("product", prod)
print("mse vs 5", mse)

# log of a product = sum of logs (useful later for likelihoods)
import math
log_prod = sum(math.log(x) for x in xs)
print("log(product)", log_prod, "check", math.log(prod))
\`\`\`

Mean squared error is “how wrong, on average, if we always predicted 5.” Training will **change parameters** so that a similar sum gets smaller. The algebra is not exotic. The sum is the exotic-looking sigma in the blog post.

## Agent connection

Budgets are sums. A 20-step loop that resends a growing transcript is a sum of **tokens per step**, not “20 times the first prompt.” If step \`t\` costs \`c_t\` tokens, total tokens are \`c_1 + ... + c_T\`. Dollars are that sum times price.

When you average eval scores, know **what** you averaged. Mean pass-rate over 50 tickets hides that 10 tickets are impossible. A product of per-step success probabilities (if you assume independence) shows why long trajectories fail even when each tool is “usually fine”: \`0.9 ** 12\` is already ugly.

> **Tip:** Prefer sums of logs over giant products. Products of probabilities underflow to 0.0 in floats; log-likelihood is just a sum.

\`\`\`quiz
Mean squared error is which combination?
- A product of absolute errors
- *A sum of squared errors, then divided by the count
- The maximum error only
- Entropy of the labels
explain: MSE is an average of squared deviations — a sum scaled by n. That average is the loss you will later differentiate.
\`\`\`
`,
    },
    {
      slug: "vectors",
      title: "Vectors",
      summary:
        "Lists as vectors: add them, scale them, measure magnitude. Embeddings are vectors with extra marketing.",
      minutes: 14,
      level: "beginner",
      md: `
A **vector** is an ordered list of numbers. In this track it is a Python list of floats, like \`[0.2, -1.1, 3.0]\`. Dimension is \`len(v)\`. Two vectors can be added only if they have the **same length**.

Geometrically, a 2-d vector is an arrow on the plane. A 3-d vector is an arrow in space. A 1536-d embedding is an arrow you cannot draw — but you still **add**, **scale**, and measure **length** with the same formulas.

Write vectors as \`v\`. The numbers inside are **components**. Changing one component moves you parallel to one axis. That is why later, a **partial derivative** will be “what happens if I move only this component.”

## Addition and scalar multiply

**Vector addition** is componentwise: \`[a, b] + [c, d] = [a+c, b+d]\`. The geometric story is tip-to-tail: walk \`u\`, then walk \`v\`.

**Scalar multiplication** stretches or flips: \`3 * [1, -2] = [3, -6]\`. Negative scalars reverse direction. This is how you take a **step** in optimization: new point = old point + (step size) times a direction vector.

**Magnitude** (Euclidean length, L2 norm) is the square root of the sum of squares. A unit vector has magnitude 1. Dividing a nonzero vector by its magnitude **normalizes** it — you keep direction, fix length to 1. Cosine similarity will need that.

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
print("|a|", magnitude(a))  # 5, the 3-4-5 triangle
print("unit a", normalize(a))
print("|unit a|", magnitude(normalize(a)))
\`\`\`

Run it. \`[3, 4]\` has length 5. That is the Pythagorean theorem, which is also the definition of Euclidean distance from the origin. Distance between two points \`u\` and \`v\` is \`magnitude(add(u, scale(-1, v)))\` — length of the difference.

## What embeddings actually are

Vendors return a list of 384, 768, or 1536 floats for a string. That list **is** the vector. “Semantic closeness” means “these arrows point similarly,” which we will measure with a dot product in the next lesson. There is no separate magic object behind the JSON.

Zero vectors are a nuisance: they have no direction, you cannot normalize them, cosine is undefined. Empty chunks and failed embedding calls produce them. Treat magnitude 0 as an error, not as “similarity 0.”

## Agent connection

Agent **memory** is often “keep the last k embedding vectors and the text that produced them.” Logging only the text hides bugs in the geometry (you stored the wrong model’s vectors, you mixed 768-d with 1536-d, you forgot to normalize). Print \`len(vec)\` and \`magnitude(vec)\` in your retriever tests. Shape and length are the first unit tests of RAG.

When people average embeddings (one vector for a whole document from its chunks), they are using **vector addition** then **scale** by \`1/n\`. That is valid only if the vectors live in the same space. They do not, if you accidentally mix models.

> **Warning:** Never add vectors from two different embedding models. Same length is not the same space.

\`\`\`quiz
Which operation requires two vectors of equal dimension?
- Printing a vector
- *Vector addition (and the difference used for Euclidean distance)
- Choosing a learning rate
- Converting text to lowercase
explain: Addition is componentwise. Different lengths are a shape error — the same class of bug as mixing embedding sizes.
\`\`\`
`,
    },
    {
      slug: "dot-product",
      title: "Dot Product and Cosine Similarity",
      summary:
        "Multiply-and-add two lists, turn that into cosine similarity, and rank memories the way RAG does.",
      minutes: 14,
      level: "beginner",
      md: `
The **dot product** of two equal-length vectors is the sum of componentwise products: \`a1*b1 + a2*b2 + ...\`. It is a single number.

Algebraically it is “how much do these lists agree, coordinate by coordinate.” Geometrically, \`u · v = |u| |v| cos(theta)\`, where \`theta\` is the angle between them. So:

- If the dot product is **positive**, the arrows point into a shared half-space (acute angle).
- If it is **zero**, they are orthogonal (unrelated, in that geometry).
- If it is **negative**, they point somewhat opposite.

If you **normalize** both vectors to length 1, the dot product **is** \`cos(theta)\`. That number lives in \`[-1, 1]\` and is called **cosine similarity**. RAG systems rank chunks by this score (or by a vendor’s close cousin).

## Why not Euclidean distance?

You can rank by distance too: closer points win. Cosine **ignores magnitude** and keeps **direction**. That matters when one document embedding is longer because the chunk was longer or the model is uncalibrated, not because it is more relevant. In practice, many APIs return already-normalized vectors; cosine and dot product then **coincide**.

Do not mix conventions. If you L2-normalize, use dot product. If you do not, use cosine (normalize inside the formula) or a distance you have tested. Silent mismatch is a top-5 production RAG bug.

## Rank a toy memory bank

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

query = [0.2, 0.85, 0.05]  # looks like a billing question
ranked = sorted(
    memories,
    key=lambda item: cosine(query, item[1]),
    reverse=True,
)
for text, vec in ranked:
    print(f"{cosine(query, vec): .3f}  {text}")
\`\`\`

The billing-ish query should put “refunds take 5-7 days” first. If it does not, the vectors are badly chosen — which is exactly how you debug a real embedder: **look at neighbors**, not at marketing claims.

Change \`query\` toward \`[0.0, 0.1, 1.0]\` and watch the on-call memory rise. Ranking is geometry plus a sort key.

## Agent connection

Tool-using agents retrieve **memories, docs, and prior traces** with this scoring function. If top-k is 4 and the right paragraph is 5th, the model never sees it. That failure is not “the LLM is dumb.” It is a **threshold / k / embedding** failure you can measure with a labeled set of (query, must-include-chunk) pairs.

When you log retrieval, log the **scores**, not only the texts. A winner at 0.82 and a winner at 0.21 are different confidence stories. Later, entropy will name that uncertainty.

> **Tip:** Tie-break equal cosines with a recency or source-priority rule. Geometry should not be the only policy.

\`\`\`quiz
If two vectors are already length 1, cosine similarity equals which of these?
- Their Euclidean distance
- The product of their magnitudes
- *Their dot product
- Always 0
explain: Cosine is dot product divided by the product of lengths. Those lengths are 1, so cosine reduces to the dot product.
\`\`\`
`,
    },
    {
      slug: "matrices",
      title: "Matrices",
      summary:
        "A matrix is a list of lists. Multiply it by a vector to get another vector — the shape of a linear layer.",
      minutes: 14,
      level: "beginner",
      md: `
A **matrix** is a 2-d table of numbers. In Python we use a **list of rows**, each row a list of equal length. Shape is \`(rows, cols)\`. The matrix \`W\` with 2 rows and 3 columns is 2 by 3.

You add matrices of the **same shape**, componentwise. You multiply a matrix by a scalar the same way you scale a vector. The operation that earns the data structure is **matrix-vector multiplication**: it sends a vector of length \`cols\` to a vector of length \`rows\`.

For each row of \`W\`, take the **dot product** of that row with \`x\`. The results become the components of \`y\`. If \`W\` is \`m\` by \`n\` and \`x\` has length \`n\`, then \`y\` has length \`m\`. Shape errors are \`len(row) != len(x)\`. Raise them loudly.

## Why this is everywhere

A **linear layer** in a neural net is \`y = W x + b\` (matrix-vector plus a bias vector). Attention scores are matrices of dot products. A batch of embeddings stacked as rows is a matrix. You do not need a GPU to understand the contract: **linear mix of inputs**.

Each row of \`W\` is “how this output component weights the inputs.” Each column is “how this input feature fans out to the outputs.” Reading \`W\` is reading a bundle of dot products.

## Implement mat-vec

This 2 by 3 matrix maps a 3-d feature vector to a 2-d hidden vector. Print shapes as you go. That habit transfers to real frameworks when they complain about \`[2, 3]\` vs \`[3]\`.

\`\`\`tryit python
def shape(M):
    return (len(M), len(M[0]) if M else 0)

def dot(u, v):
    return sum(a * b for a, b in zip(u, v))

def mat_vec(W, x):
    m, n = shape(W)
    if len(x) != n:
        raise ValueError(f"need length {n}, got {len(x)}")
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

Hand-check: first component is \`1*1 + 0*4 + 2*3 = 7\`, plus bias \`0.5\` → \`7.5\`. Second is \`0*1 + 1*4 + (-1)*3 = 1\`, plus \`-0.5\` → \`0.5\`. If your library disagrees, your library or your layout (row-major vs column-major) is wrong — not reality.

Matrix-matrix multiply is the same idea with extra loops: each column of the second matrix is a vector you multiply by \`W\`. Skip it until you can do mat-vec without looking it up.

## Agent connection

When a paper says the model **projects** queries, keys, and values, it means three matrices \`W_q, W_k, W_v\` applied to the same token vectors. When an agent framework “adds a linear classifier on frozen embeddings,” it is \`W x + b\` on the embedding of the last state. You can prototype that classifier with lists, then replace the lists with a real module.

Logging \`len(W)\` and \`len(W[0])\` in tests catches the “we swapped rows and columns” class of incident, which looks like garbage predictions, not like an exception.

> **Note:** A vector is a matrix with one column (or one row). The distinction is layout. Agree on layout in code review.

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
        "Matrices scale, rotate, and stretch features. That intuition is how models transform embeddings.",
      minutes: 14,
      level: "beginner",
      md: `
A **linear map** (linear transformation) is a function \`T(x) = W x\` that sends vectors to vectors and respects addition and scaling: \`T(u+v) = T(u)+T(v)\` and \`T(k v) = k T(v)\`. Every matrix defines one. Every linear map (between finite-dimensional spaces, once you pick bases) is a matrix.

You already multiply. This lesson is **what it does to geometry**, which is how you debug feature transforms.

## Scale and rotate in 2-d

A **uniform scale** by \`s\` is the diagonal matrix \`[[s, 0], [0, s]]\`. Every arrow grows by \`s\`. A **stretch** along x only is \`[[s, 0], [0, 1]]\` — the unit square becomes a rectangle. That is also **feature scaling**: one coordinate was in dollars, one was a 0–1 score; you rescale so cosine is not dominated by dollars.

A **rotation** by angle \`t\` (radians) uses cosines and sines:

\`[[cos t, -sin t], [sin t, cos t]]\`

It turns arrows without changing length. Rotations preserve dot products. Stretching does not: angles change, so cosine similarity **after** a bad stretch is a different geometry than before. That is why you must apply the **same** transform to queries and documents.

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

# rotate 90 degrees counterclockwise: (1,0) -> (0,1)
R = rotation(math.pi / 2)
out = mat_vec(R, p)
print("rotate 90", [round(out[0], 6), round(out[1], 6)])

# same transform on a "query" and a "document"
doc = [0.6, 0.8]
W = scale_xy(0.1, 10.0)  # nasty stretch
print("raw doc", doc, "query", p)
print("stretched doc", mat_vec(W, doc), "stretched query", mat_vec(W, p))
\`\`\`

After the nasty stretch, the y-axis eats the space. Neighbors that were close in the original plane can separate, and vice versa. Applying \`W\` to the document but **not** the query is even worse: you compare two different coordinate systems and call it relevance.

## Affine maps

\`T(x) = W x + b\` is **affine**: linear plus a shift. Bias moves the origin. ReLU and other nonlinearities come **after** this, which is why a network can be more than a single stretch. One linear map cannot fold space; a stack with nonlinearities can.

Feature transforms in classical ML (standardize columns, PCA) are linear or affine maps you choose. In deep models, \`W\` is **learned**. The picture does not change: data is moved so that a later dot product or probability becomes more useful.

## Agent connection

Agents featurize constantly: bag of tool-name flags, token counts, cosine scores, latency. If you concatenate \`[latency_ms, cosine]\` and then nearest-neighbor in that plane, **milliseconds will dominate** unless you scale. A diagonal scale matrix (or divide each column by its standard deviation) is the fix. The same bug appears when mixing embedding dimensions with hand-engineered features in one list.

When a vendor says they **fine-tune a projection** on frozen embeddings, they are learning a small \`W\` so that cosine in the projected space matches your labels better. You now know what object they are learning.

> **Tip:** If retrieval quality collapses after a “simple preprocessing” step, print two or three points before and after \`W\` and check whether angles survived.

\`\`\`quiz
You scale only document embeddings by a stretch matrix W, and leave the query untransformed. What happens?
- Cosine scores stay valid because length is ignored
- *Query and documents no longer live in the same geometry, so ranking is meaningless
- The map stops being linear
- Rotation is applied automatically to the query
explain: Similarity assumes one space. A linear map must be applied to every vector you compare, or to none.
\`\`\`
`,
    },
    {
      slug: "derivatives",
      title: "Derivatives",
      summary:
        "Slope is rise over run. Finite differences approximate derivatives — how loss reacts to a tiny nudge.",
      minutes: 16,
      level: "intermediate",
      md: `
The **derivative** of a function \`f\` at a point \`x\` is the **slope** of the graph there: how much \`f\` changes if you move \`x\` a little, divided by the size of the move.

For a line \`f(x) = mx + b\`, the derivative is the constant \`m\`. For \`f(x) = x^2\`, the derivative is \`2x\`: steep far from zero, flat at the bottom of the bowl. That is why gradient descent can crawl in a valley and fly on a wall.

You do not have to memorize a table to **use** derivatives in software. You can **approximate** them with arithmetic the machine already has: pick a small \`h\`, compute \`(f(x+h) - f(x)) / h\`. That is a **forward difference**. A **central difference** \`(f(x+h) - f(x-h)) / (2h)\` is usually more accurate for the same \`h\`.

If \`h\` is huge, you measure a secant across the continent, not the tangent. If \`h\` is tiny like \`1e-20\`, floating point rounds \`x+h\` back to \`x\` and you get 0 or noise. Values around \`1e-5\` to \`1e-4\` are a reasonable start for order-1 functions on ordinary floats.

## Finite differences as a unit test

When you later write an analytic gradient (or trust a library), **check it** against a finite difference on a few points. This is gradient checking. Mismatches mean a bug, not a philosophical disagreement.

\`\`\`tryit python
def f(x):
    return x * x  # analytic derivative: 2x

def forward_diff(f, x, h):
    return (f(x + h) - f(x)) / h

def central_diff(f, x, h):
    return (f(x + h) - f(x - h)) / (2 * h)

x = 3.0
analytic = 2 * x
print("analytic f'(3) =", analytic)
for h in [1.0, 0.1, 0.01, 1e-4, 1e-6, 1e-12]:
    fd = forward_diff(f, x, h)
    cd = central_diff(f, x, h)
    print(f"h={h:.0e}  forward={fd: .6f}  central={cd: .6f}")
\`\`\`

Watch forward differences approach 6, then get messy at \`1e-12\`. Central differences look better sooner. The derivative is not a vibe; it is a limit you can sneak up on with a loop.

Sign matters. If \`f'(x) > 0\`, increasing \`x\` increases \`f\`. To **minimize** \`f\`, you move **against** the slope: \`x - step * f'(x)\`. That one line is gradient descent in 1-d. We will run it as a full lesson after gradients in several variables.

## Agent connection

Loss is a function of parameters, prompts, even continuous hyperparameters. “If I raise temperature by 0.1, does eval score go up?” is a derivative of an eval function (noisy, but the same idea). Finite differences on a **small** eval set are how you sanity-check that a knob does what the dashboard claims.

For agents, a useful 1-d derivative is **cost with respect to max_steps**: add one allowed step, measure dollars and quality. If quality is flat and dollars rise, the slope says stop. You do not need a GPU to compute that from logs.

> **Warning:** Finite differences need two (or more) runs of \`f\`. Never difference a function that hits a paid API in a tight loop without a budget.

\`\`\`quiz
To minimize f when f'(x) is positive, you should
- Increase x (move with the slope)
- *Decrease x (move against the slope)
- Set h to 0
- Multiply x by f'(x)
explain: Positive slope means the graph rises to the right. Downhill is to the left: x minus a step times the derivative.
\`\`\`
`,
    },
    {
      slug: "gradients",
      title: "Gradients",
      summary:
        "Partial derivatives assemble into a vector: the gradient. It points to steepest ascent of a scalar function.",
      minutes: 16,
      level: "intermediate",
      md: `
When \`f\` depends on **several** inputs, \`f(x, y)\` or \`f\` of a whole parameter vector, there is one derivative per input: a **partial derivative**. Write \`df/dx\` holding \`y\` fixed, and \`df/dy\` holding \`x\` fixed. The **gradient** is the vector of all partials.

The gradient at a point **points to steepest ascent**: the direction you should walk if you want \`f\` to increase as fast as possible, locally. Steepest **descent** is the negative gradient. Training a network is: compute gradient of **loss**, step the opposite way.

Magnitude of the gradient is how steep that best direction is. Near a minimum it should be **near zero** (a critical point). If it is huge, a fixed step size will overshoot. If it is tiny but you are not at a good loss, you may be on a plateau.

## Partials by hand and by difference

Let \`f(x, y) = x^2 + y^2\`, a bowl touching zero at the origin. Then \`df/dx = 2x\` and \`df/dy = 2y\`, so the gradient is \`[2x, 2y]\`. At \`(1, 0)\` the gradient is \`[2, 0]\` — purely in the x direction, which matches the picture: you are on the x-axis wall.

Numerically, nudge **one** coordinate at a time.

\`\`\`tryit python
def f(x, y):
    return x * x + y * y

def analytic_grad(x, y):
    return [2 * x, 2 * y]

def numeric_grad(x, y, h=1e-5):
    dfdx = (f(x + h, y) - f(x - h, y)) / (2 * h)
    dfdy = (f(x, y + h) - f(x, y - h)) / (2 * h)
    return [dfdx, dfdy]

def add(u, v):
    return [a + b for a, b in zip(u, v)]

def scale(k, v):
    return [k * a for a in v]

x, y = 1.0, 2.0
g = analytic_grad(x, y)
g_num = numeric_grad(x, y)
print("point", (x, y), "f", f(x, y))
print("analytic grad", g)
print("numeric  grad", [round(t, 6) for t in g_num])

# one descent step
step = 0.1
x2, y2 = add([x, y], scale(-step, g))
print("after descent step", (x2, y2), "f", f(x2, y2))

# one ascent step (worse for a loss, useful for adversarial max)
x3, y3 = add([x, y], scale(step, g))
print("after ascent step ", (x3, y3), "f", f(x3, y3))
\`\`\`

Loss should drop after a descent step and rise after ascent. If your training loop does the opposite, you flipped a sign. That bug is common and **visible** with a two-variable bowl before you touch real models.

## Dimensionality

A model with a million parameters has a million-dimensional gradient. You cannot plot it. You can still plot **loss vs step**, **gradient norm vs step**, and a couple of coordinates. The definition did not change: one partial per parameter, packed into a vector, used as a direction.

## Agent connection

Two gradients show up in agent work. First, **training**: if you fine-tune or train a ranker, you are following \` -grad(loss) \`. Second, **sensitivity**: which input feature, if nudged, changes the score most? That is a partial of the score with respect to features — a poor person’s explanation tool. If the partial with respect to “contains the word refund” dwarfs everything else, your classifier is a keyword detector in costume.

Agents that **search** over continuous knobs (thresholds, temperatures) can use finite-difference gradients on a held-out eval. Discrete choices (which tool) do not have classical gradients; there you use scores, bandits, or just rules.

> **Note:** The gradient is steepest ascent of whatever scalar you differentiated. If that scalar is not the loss you care about, you will energetically optimize the wrong product.

\`\`\`quiz
The gradient of a scalar function f is
- A single slope that ignores all but one variable
- *The vector of partial derivatives; it points toward steepest increase of f
- Always the zero vector
- A matrix-vector product with no meaning
explain: Each partial is one component. Together they form the direction of steepest ascent; descent uses the negative.
\`\`\`
`,
    },
    {
      slug: "chain-rule",
      title: "The Chain Rule",
      summary:
        "Nested functions multiply their slopes. That identity is backpropagation in one paragraph.",
      minutes: 16,
      level: "intermediate",
      md: `
Most interesting functions are **pipelines**. \`y = f(g(x))\`. The **chain rule** says the slope of the outer function is the product of slopes along the path:

\`dy/dx = df/du * du/dx\`

where \`u = g(x)\`. If there are more nests, keep multiplying (and, with several paths, adding — that is the multivariable version).

This is **backpropagation**. A deep net is a chain (actually a graph) of maps: linear, ReLU, linear, softmax, loss. The derivative of loss with respect to an early weight is a product of many local derivatives. You compute it from the **output backward** because each local derivative is easy, and you reuse intermediate results. Forward: compute the numbers. Backward: multiply the slopes.

If any local derivative is 0 (a dead ReLU, a hard threshold), the product is 0 and that weight **gets no signal**. If each factor is 2 and you have 40 layers, the product explodes. If each factor is 0.5, it vanishes. Those are exploding and vanishing gradients, named after this product.

## Check a nest two ways

Let \`g(x) = 3x + 1\` and \`f(u) = u^2\`, so \`y = (3x + 1)^2\`. Then \`df/du = 2u\` and \`dg/dx = 3\`, hence \`dy/dx = 2(3x+1)*3\`. Finite differences on \`y\` should match.

\`\`\`tryit python
def g(x):
    return 3 * x + 1

def f(u):
    return u * u

def y(x):
    return f(g(x))

x = 2.0
u = g(x)
dydx_chain = (2 * u) * 3  # f'(u) * g'(x)

h = 1e-5
dydx_num = (y(x + h) - y(x - h)) / (2 * h)

print("x", x, "u=g(x)", u, "y", y(x))
print("chain rule dy/dx", dydx_chain)
print("numeric  dy/dx", dydx_num)

# tiny "backward pass" storing locals
# forward
w, b = 3.0, 1.0
u = w * x + b
y_out = u * u
# backward: dL/dy = 1 if L = y
dy_du = 2 * u
du_dx = w
du_dw = x
dy_dx = dy_du * du_dx
dy_dw = dy_du * du_dw
print("backprop dy/dx", dy_dx, "dy/dw", dy_dw)
\`\`\`

The last block is the spirit of autodiff: during the forward pass you remember \`u\` and \`x\`; going backward you multiply by the local slope. \`dy/dw\` tells you how to update the weight \`w\` if \`y\` were a loss (you would step opposite that number).

## Several paths

If \`x\` is used twice, say \`y = x * x\`, then two paths contribute and you **add** the two products. That is why frameworks sum gradients into the same tensor. Forgetting to add (overwriting) is a bug that looks like “half the gradient.”

## Agent connection

You rarely hand-write backprop for a transformer. You still use the chain rule **conceptually** when an agent’s metric is nested: dollars depend on tokens, tokens depend on steps, steps depend on a retry policy. A change in retry probability ripples through the product of local slopes. If you want less spend, you must change something that actually has a nonzero path to spend — a tool that is never called has local derivative zero with respect to that tool’s prompt.

When people say “the loss doesn’t include latency, so the model will not optimize latency,” they are saying there is **no path** in the chain from latency to the scalar that training differentiates. Add a term, or don’t be surprised.

> **Tip:** Draw the boxes. Arrows forward for values, arrows backward for slopes. If you cannot draw it, you cannot debug it.

\`\`\`quiz
Backpropagation is
- A way to sample tokens with temperature
- *The chain rule applied systematically from the loss backward through nested maps
- Deleting gradients to save memory only
- Adding a bias vector
explain: Local derivatives multiply (and add on merged paths). Computing them from the output backward is backprop.
\`\`\`
`,
    },
    {
      slug: "probability",
      title: "Probability",
      summary:
        "Sample spaces, counting, and simulation. Agents live in a world where tools and tokens are random events.",
      minutes: 14,
      level: "intermediate",
      md: `
**Probability** assigns a number in \`[0, 1]\` to an **event** — a subset of possible **outcomes**. The set of all outcomes is the **sample space**. For a fair six-sided die, the sample space is \`{1,2,3,4,5,6}\` and each outcome has probability \`1/6\`. The event “even” has three outcomes, so probability \`1/2\`.

Two events are **mutually exclusive** if they cannot both happen. Their probabilities **add**. If every outcome is equally likely, probability is **counting**: size of the event divided by size of the space. If outcomes are not equal (a bent coin, a language model), you cannot count; you **weigh**.

**Independence** means \`P(A and B) = P(A) P(B)\`. Coin flips are the textbook case. Agent tool failures are **not** independent if they share a downed API. Multiplying “99% reliable” twelve times is only legal if the failures do not cluster. They cluster.

The **complement** is cheap and useful: \`P(not A) = 1 - P(A)\`. “Probability we never hit a malformed JSON in 8 calls” is 1 minus the probability of at least one malformed call. If you cannot compute an event directly, compute the opposite and subtract. The **union bound** says \`P(A or B) ≤ P(A)+P(B)\` even when events overlap — a conservative risk number when you do not know dependence.

## Counting vs simulation

Counting is exact when you can list the space. Simulation (Monte Carlo) draws many outcomes and measures frequencies. Frequencies converge to probabilities if draws are independent and identically distributed. For agents, simulation is often the only honest tool: the sample space of “what the model might do” is too large to list.

\`\`\`tryit python
import random

random.seed(0)

# counting: two dice, P(sum == 7)
outcomes = [(a, b) for a in range(1, 7) for b in range(1, 7)]
event = [o for o in outcomes if o[0] + o[1] == 7]
print("space", len(outcomes), "sum7", len(event), "P", len(event) / len(outcomes))

# simulation: bent coin, P(heads) = 0.3
def trial():
    return "H" if random.random() < 0.3 else "T"

n = 5000
heads = sum(1 for _ in range(n) if trial() == "H")
print("simulated P(H)", heads / n)

# a tiny "tool" that fails 10% independently — vs a shared outage
def independent_tools(k=5, p_fail=0.1):
    return any(random.random() < p_fail for _ in range(k))

def shared_outage(k=5, p_outage=0.1):
    # if the vendor is down, every tool fails
    if random.random() < p_outage:
        return True
    return False

n = 3000
p_ind = sum(independent_tools() for _ in range(n)) / n
p_share = sum(shared_outage() for _ in range(n)) / n
print("P(any of 5 fail), independent", round(p_ind, 3))
print("P(all fail via shared outage)", round(p_share, 3))
\`\`\`

The two failure models do not give the same number. If your risk doc multiplies independent 10% chances, but production is a shared outage, you priced the wrong sample space.

## Conditional probability

\`P(A|B)\` is probability of A **given** that B happened: restrict the sample space to B, then measure A. “Probability the ticket is fraud given the tool returned country mismatch” is conditional. The next lesson turns that into **Bayes**.

## Agent connection

Every decode step is a draw from a distribution over the vocabulary. Every tool call is an event: success, timeout, malformed JSON, wrong side effect. Your eval set is a sample, not the whole space — so a 91% pass rate on 32 tickets is a **noisy** frequency. Report counts, not just percentages: 29/32 is more honest than 0.91.

When you write \`max_retries=3\`, you are asserting a model of how often independent retries help. Measure it. If errors are systematic (bad schema), retries sample the same failure.

> **Note:** \`random.random() < p\` is the Bernoulli trial you will name in the distributions lesson. Here it is just a biased coin.

\`\`\`quiz
If two events cannot happen at once, the probability that one or the other happens is
- Always 1
- The product of their probabilities
- *The sum of their probabilities (they are mutually exclusive)
- Undefined unless they are independent
explain: Mutually exclusive events add. Independence is a different idea (products for intersections).
\`\`\`
`,
    },
    {
      slug: "bayes",
      title: "Bayes' Rule",
      summary:
        "Update a prior with a likelihood after a tool observation. Agents should change their beliefs in numbers.",
      minutes: 16,
      level: "intermediate",
      md: `
**Bayes’ rule** is how you update a belief when a new observation arrives:

\`P(H|E) = P(E|H) P(H) / P(E)\`

- \`H\` is a **hypothesis** (the API is down; the user wants a refund; this chunk is relevant).
- \`E\` is **evidence** (the tool timed out; the message contains “invoice”; cosine is 0.8).
- \`P(H)\` is the **prior** — belief before the observation.
- \`P(E|H)\` is the **likelihood** — how expected the evidence is if H is true.
- \`P(H|E)\` is the **posterior** — belief after the observation.
- \`P(E)\` is the probability of the evidence overall, often expanded as a **sum** over hypotheses: \`P(E|H)P(H) + P(E|not H)P(not H)\` in the two-hypothesis case.

People skip \`P(E)\` and then cannot compare scales. People also confuse \`P(E|H)\` with \`P(H|E)\`. “90% of down APIs time out” is not “90% of timeouts mean the API is down,” unless the prior is already extreme.

## A tool timeout

Prior: the vendor is down 10% of the time. Likelihood: if down, P(timeout) = 0.9; if up, P(timeout) = 0.05 (blips). You observe a timeout. What is P(down | timeout)?

\`\`\`tryit python
p_down = 0.10
p_up = 1.0 - p_down
p_timeout_if_down = 0.90
p_timeout_if_up = 0.05

p_timeout = (
    p_timeout_if_down * p_down
    + p_timeout_if_up * p_up
)
p_down_if_timeout = (p_timeout_if_down * p_down) / p_timeout

print("P(timeout)", round(p_timeout, 4))
print("P(down | timeout)", round(p_down_if_timeout, 4))

# same arithmetic as unnormalized masses, then normalize
mass_down = p_timeout_if_down * p_down
mass_up = p_timeout_if_up * p_up
z = mass_down + mass_up
print("posterior down, up", round(mass_down / z, 4), round(mass_up / z, 4))

# second independent timeout (naive): multiply likelihoods again
mass_down2 = mass_down * p_timeout_if_down
mass_up2 = mass_up * p_timeout_if_up
z2 = mass_down2 + mass_up2
print("after 2 timeouts, P(down)", round(mass_down2 / z2, 4))
\`\`\`

The posterior is much larger than 10%, but it is not 90%. Base rates matter. A second timeout (if you treat it as independent) pushes belief further. If both timeouts are the **same** hung connection, you double-counted evidence — the likelihood is not independent. Real agents should know whether two observations are copies.

## Odds form

Prior odds times **likelihood ratio** \`P(E|H)/P(E|not H)\` gives posterior odds. A test that is 18 times more likely under H than under not-H is strong, but a rare H can still lose. This is why rare fraud plus a noisy detector produces alert fatigue.

## Agent connection

A well-behaved agent **changes its plan when observations arrive**. That is Bayes, even if you implement it with \`if\` statements: prior “search the docs first”; evidence “search returned nothing”; posterior “ask a clarifying question.” Writing actual numbers is useful when you set **alert thresholds** and **retry policy**. If P(down | timeout) is only 0.67, one retry is rational; if it is 0.99, stop hammering and page a human.

RAG is Bayesian too, loosely: prior over documents (uniform or recency-weighted), likelihood from an embedding score. You will rarely write the formula, but when a high cosine from a garbage chunk beats a slightly lower cosine from a trusted source, you forgot the prior over sources.

> **Warning:** Do not update as if evidence were independent when the same tool is retried on the same bug. Correlate, or count it as one observation.

\`\`\`quiz
P(E|H) is
- The posterior belief in H
- The prior belief in H
- *The likelihood: probability of the evidence assuming H is true
- Always equal to P(H|E)
explain: Likelihood is evidence given hypothesis. Bayes flips it, using the prior and P(E), into the posterior P(H|E).
\`\`\`
`,
    },
    {
      slug: "distributions",
      title: "Distributions",
      summary:
        "Bernoulli, uniform, and Gaussian samples — the shapes behind coins, random picks, and noise.",
      minutes: 14,
      level: "intermediate",
      md: `
A **distribution** is a full assignment of probability to outcomes (discrete) or a density (continuous). Named families show up constantly:

- **Bernoulli(\`p\`)**: one toss, success with probability \`p\`. Tool call succeeds or not. A token is “the special one” or not.
- **Uniform** on a set: every outcome equal. \`random.random()\` is uniform on \`[0, 1)\`. Uniform over a vocabulary would be a maximally confused model.
- **Gaussian** (normal): bell-shaped, parameterized by **mean** \`mu\` and **standard deviation** \`sigma\`. Measurement noise, some embedding coordinates, and the Box–Muller construction below.

You describe a distribution by **parameters**, then either write a formula or **draw samples** and look at mean and spread. Sampling is how you check you coded the right family.

## Draw three families

Bernoulli is a threshold on a uniform. Uniform integers are \`randrange\`. Gaussians can be built from two uniforms by **Box–Muller**: if \`U1, U2\` are uniform on (0, 1], then \`sqrt(-2 log U1) cos(2 pi U2)\` is standard normal. Scale by \`sigma\` and add \`mu\`.

\`\`\`tryit python
import math
import random

random.seed(1)

def bernoulli(p):
    return 1 if random.random() < p else 0

def uniform(a, b):
    return a + (b - a) * random.random()

def gauss(mu=0.0, sigma=1.0):
    u1 = 1.0 - random.random()  # (0, 1]
    u2 = random.random()
    z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
    return mu + sigma * z

def summarize(xs):
    n = len(xs)
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / n
    return mean, var ** 0.5

n = 4000
b = [bernoulli(0.3) for _ in range(n)]
u = [uniform(0, 10) for _ in range(n)]
g = [gauss(5, 2) for _ in range(n)]

print("bernoulli mean, std", [round(x, 3) for x in summarize(b)])
print("uniform   mean, std", [round(x, 3) for x in summarize(u)])
print("gauss     mean, std", [round(x, 3) for x in summarize(g)])
print("P(gauss>9) ~", sum(1 for x in g if x > 9) / n)
\`\`\`

Bernoulli mean should sit near \`p = 0.3\`. Uniform on 0–10 should mean near 5. Gaussian \`N(5, 2)\` should mean near 5, std near 2. The tail \`P(X > 9)\` is a few percent — rare, not impossible. That is why “3 sigma” thinking exists: do not treat every outlier as a new regime, and do not treat a 4-sigma latency as a blip.

## Discrete vs categorical

A **categorical** distribution is a Bernoulli generalized to more than two labels: a list of probabilities that **sum to 1**. Softmax produces one. Sampling a token is a categorical draw. The sampling lesson later in this track implements that draw.

Every named family has a **support** (which values can appear) and **parameters** (which member of the family you picked). Bernoulli support is the two values 0 and 1. Uniform on [0, 10] cannot produce 11. A Gaussian has unbounded support: it can, in theory, produce a huge latency sample. That is why people mix a Gaussian body with a separate timeout spike — one family rarely describes production traces by itself.

## Agent connection

Calibrated agents need distributional honesty. If your “confidence” is always 0.99, you are not Bernoulli(\`p_correct\`); you are miscalibrated. Plotting predicted \`p\` vs empirical frequency is a reliability diagram — a distribution check.

Noise in embeddings is often treated as roughly Gaussian in each coordinate. That is a model, not a law. Still, **mean and std of a coordinate** across a corpus tell you whether a dimension is dead (std ≈ 0) or exploding. Dead dimensions waste cosine.

> **Tip:** Always print sample mean and std after you write a sampler. A Gaussian with std 0 is a constant, and it will sneak into tests.

\`\`\`quiz
A Bernoulli(p) random variable
- Is uniform on the real line
- *Takes value 1 with probability p and 0 otherwise
- Always has mean 0
- Cannot model tool success or failure
explain: Bernoulli is a single yes/no trial. Mean is p. It is the atom of tool success and binary classification.
\`\`\`
`,
    },
    {
      slug: "expectation-variance",
      title: "Expectation and Variance",
      summary:
        "Expected value is a probability-weighted average. Variance is spread. Use both to budget an agent step.",
      minutes: 14,
      level: "intermediate",
      md: `
The **expected value** \`E[X]\` is the probability-weighted average of a random variable. For a discrete \`X\` that takes values \`x_i\` with probabilities \`p_i\`, \`E[X] = sum p_i x_i\`. It is **not** always a value X can take (the expected die roll is 3.5). It **is** what the average of many independent copies converges to.

**Variance** is expected squared deviation from the mean: \`E[(X - mu)^2]\`. **Standard deviation** is its square root, in the same units as X. High variance means a single run is a poor guess of the mean — relevant when you quote “the agent costs $0.04 per ticket” from 8 tickets.

Linearity: \`E[A+B] = E[A]+E[B]\` even if A and B are dependent. Products do **not** work that way unless you have independence or you know the covariance. If you need \`E[A B]\` and the variables move together (a slow tool that is also expensive), the extra term is covariance — ignoring it underprices the bad days.

## Price a step

Suppose one agent step can:

- finish with one tool call (probability 0.70) costing 1 unit
- need a retry (0.20) costing 2 units
- escalate to a human (0.10) costing 5 units

Expected cost is the weighted sum. Variance tells you whether a budget of “the expectation” will frequently blow up.

\`\`\`tryit python
outcomes = [
    ("one_call", 0.70, 1.0),
    ("retry", 0.20, 2.0),
    ("human", 0.10, 5.0),
]

e_cost = sum(p * c for _, p, c in outcomes)
e_sq = sum(p * (c ** 2) for _, p, c in outcomes)
var = e_sq - e_cost ** 2  # E[X^2] - (E[X])^2
std = var ** 0.5

print("E[cost]", e_cost)
print("Var    ", round(var, 4), "std", round(std, 4))

# tokens: expected tokens = expected steps * tokens_per_step (here: cost units)
price_per_unit = 0.002
print("E[dollars]", e_cost * price_per_unit)

# Monte Carlo check
import random
random.seed(2)

def sample_cost():
    r = random.random()
    acc = 0.0
    for name, p, c in outcomes:
        acc += p
        if r <= acc:
            return c
    return outcomes[-1][2]

n = 8000
xs = [sample_cost() for _ in range(n)]
mean = sum(xs) / n
var_hat = sum((x - mean) ** 2 for x in xs) / n
print("simulated mean, var", round(mean, 4), round(var_hat, 4))
print("fraction over 3 units", sum(1 for x in xs if x > 3) / n)
\`\`\`

The simulation should land near the closed form. A few percent of runs hit the human path and cost 5. If you provision only the expectation (~1.6), those runs overflow. Finance wants **expectation**; operations wants a **quantile** (a later cousin of the same distribution). Even without quantiles, variance is the alarm that expectation is not a plan.

## Nested loops

If each ticket is a sum of steps, \`E[total] = E[number of steps] * E[cost per step]\` only with extra assumptions (Wald’s identity needs a stopping rule independent of future costs in a specific way). In practice, **measure** total cost from traces; use expectation as a model, not as a law of nature.

## Agent connection

Set \`max_steps\` and \`max_dollars\` from expectations **plus** a buffer scaled by observed std. Log both mean and std of tokens per tool. A new tool with the same mean latency but 10× variance will dominate timeouts. That is a variance bug, not a mean bug — averaging dashboards hide it.

Evals: the expected pass rate is a Bernoulli mean. Variance of a proportion is \`p(1-p)/n\`. Small n means you cannot distinguish 0.80 from 0.88. Ship fewer claims, or gather more tickets.

> **Tip:** When two designs have the same expected cost, pick the one with smaller variance unless you are deliberately buying a lottery ticket.

\`\`\`quiz
Expected cost of a random step is
- The most common cost
- The maximum cost
- *The sum of (probability of each outcome times its cost)
- Variance times standard deviation
explain: Expectation is a probability-weighted average. That is the number you multiply by price to get expected dollars.
\`\`\`
`,
    },
    {
      slug: "entropy",
      title: "Entropy",
      summary:
        "Surprise measured in bits. High-entropy next-token distributions are uncertain — and conceptually expensive.",
      minutes: 14,
      level: "intermediate",
      md: `
**Information content** of an event with probability \`p\` is \` -log2(p) \` **bits**. Rare events are surprising and take more bits to name. A fair coin landing heads is 1 bit. A one-in-a-million incident is about 20 bits of surprise.

**Entropy** of a distribution is the **expected** surprise: \`H = -sum p_i log2(p_i)\`. A certain outcome (\`p=1\` for one item) has entropy 0. A uniform distribution over \`k\` labels has entropy \`log2(k)\`, the maximum for that many labels.

Entropy is not “how wrong.” A model can be confidently wrong (entropy low, accuracy low) or uncertain and honest (entropy high). Calibration is the extra requirement that \`p\` matches frequencies. Entropy is only about **spread**.

## Tokens and bits

A next-token distribution with entropy 10 bits is as uncertain as a uniform choice among about 1024 tokens (\`2^10\`). The model does not “know” the next word. You may still sample, but the typical sample is poorly determined: different seeds, different sentences, different tool names.

That is the conceptual cost. Uncertain tokens are expensive because:

- You may need **more samples** (majority vote, rerank) to stabilize an action.
- Sequences wander; **more tokens** get spent repairing the plan.
- Encoding the outcome takes more bits — the information-theory bill matches the engineering bill.
- A high-entropy **tool** distribution means the policy does not know which hand to use; wasted calls follow.

Low entropy is not automatically good: entropy 0 on the wrong tool is a disaster. You want **low entropy on the right answer**, which is a joint statement about entropy and accuracy.

\`\`\`tryit python
import math

def entropy(ps):
    h = 0.0
    for p in ps:
        if p > 0:
            h -= p * math.log(p, 2)
    return h

def surprise(p):
    return -math.log(p, 2)

peaked = [0.90, 0.05, 0.05]
flat = [1 / 3, 1 / 3, 1 / 3]
two = [0.5, 0.5]

print("surprise of p=0.5 bits", round(surprise(0.5), 3))
print("surprise of p=0.9 bits", round(surprise(0.9), 3))
print("H peaked", round(entropy(peaked), 3))
print("H flat  ", round(entropy(flat), 3))
print("H coin  ", round(entropy(two), 3))
print("max for 8 labels (uniform)", round(math.log(8, 2), 3))

# "which tool?" — confident vs confused policy
tools = ["search", "sql", "finish"]
print("confident policy H", round(entropy([0.85, 0.10, 0.05]), 3), tools)
print("confused  policy H", round(entropy([0.34, 0.33, 0.33]), 3), tools)
\`\`\`

The flat 3-way choice is about 1.58 bits, the maximum for three options. The peaked one is well under 1 bit: you already know the answer. An agent that logs entropy of the tool distribution (when you have logits) gets a **numeric** “I don’t know” instead of a vibe.

Skip \`p = 0\` terms: \`0 log 0\` is treated as 0. If your softmax produces exact zeros, that is fine. If you clip probabilities, you change entropy — be consistent.

## Agent connection

Production teams watch **average entropy** of generations. Spikes mean the prompt stopped constraining the model (new tool added, schema missing, temperature too high). Combined with temperature (next lesson), entropy is a knob-and-gauge pair: temperature reshapes logits; entropy measures how flat the result became.

For RAG, a query whose top-k cosine scores are almost equal is high-entropy retrieval: the neighborhood is a blob, not a nearest neighbor. Do not pretend rank-1 is destiny. Ask a clarifying question or widen search.

> **Note:** Bits use log base 2. Natural log gives **nats**. Same story, different unit. Be consistent with your log.

\`\`\`quiz
Entropy of a distribution is highest when
- One outcome has probability 1
- *Probability is spread as evenly as possible over the outcomes
- You use a smaller log base
- The mean is zero
explain: Uniform distributions maximize entropy for a fixed support. Peaked distributions are low surprise on average.
\`\`\`
`,
    },
    {
      slug: "optimization",
      title: "Optimization",
      summary:
        "Gradient descent follows the negative gradient. Minimize a 2-variable bowl the way training minimizes loss.",
      minutes: 16,
      level: "intermediate",
      md: `
**Optimization** means pick parameters to make a scalar **as small as possible** (or as large — then flip the sign). Training is optimization of a **loss**. Many agent knobs are optimization too: find a threshold that maximizes F1 on a dev set.

**Gradient descent** is the algorithm: start at \`x\`, compute \`g = grad f(x)\`, set \`x ← x - lr * g\`. The **learning rate** \`lr\` is the step size. Too large, you bounce. Too small, you crawl. **Gradient ascent** drops the minus and is used when you maximize (including some RL setups).

A **local minimum** is a valley that may not be the deepest on Earth. For the convex bowl below, local is global. For real nets, you settle for a good valley and **evals**, not for a philosophical minimum.

## Descend a bowl

Let \`f(x, y) = (x - 2)^2 + (y + 1)^2\`. The floor is at \`(2, -1)\` where \`f = 0\`. Gradient is \`[2(x-2), 2(y+1)]\`. We iterate and print.

\`\`\`tryit python
def f(x, y):
    return (x - 2) ** 2 + (y + 1) ** 2

def grad(x, y):
    return [2 * (x - 2), 2 * (y + 1)]

def add(u, v):
    return [a + b for a, b in zip(u, v)]

def scale(k, v):
    return [k * a for a in v]

x, y = 0.0, 0.0
lr = 0.2
print("step   x       y       f")
for t in range(12):
    print(f"{t:4}  {x:7.3f} {y:7.3f}  {f(x, y):7.4f}")
    g = grad(x, y)
    x, y = add([x, y], scale(-lr, g))
print("true minimum at (2, -1)")

# too-large learning rate: overshoot
x, y = 0.0, 0.0
lr_bad = 1.1
print("bad lr trajectory f:", end=" ")
for t in range(6):
    print(round(f(x, y), 3), end=" ")
    g = grad(x, y)
    x, y = add([x, y], scale(-lr_bad, g))
print()
\`\`\`

With \`lr = 0.2\` the values walk toward \`(2, -1)\` and \`f\` drops. With a clumsy \`lr\`, \`f\` can jump. Same gradient, different step. Most “training is unstable” bugs in small models are this diagram.

## Stopping

Stop when the gradient is small, when \`f\` stops improving, or when you hit a step budget — the same three families as **agent stop conditions** (success, plateau, max steps). Infinite descent is a bill.

Stochastic gradient descent replaces \`f\` with a **batch** estimate. The direction is noisy; you still go downhill **on average**. That noise is why you log smoothed loss, not only the last mini-batch.

You can **schedule** the learning rate: start larger to make progress, shrink later to settle. That is still the same update, with \`lr\` a function of step. Momentum methods add a fraction of the previous step so you do not zigzag in a ravine. For this academy, master the minus-gradient update first; fancy variants are the same geometry with extra memory.

## Agent connection

You will not train GPT from this page. You will train **small** things: a linear scorer on embeddings, a calibrated threshold, maybe a prompt via discrete search (not differentiable — use eval, not backprop). When a vendor fine-tunes, their loop is this loop plus automatic gradients.

Agents that **self-improve** by hill-climbing a metric on stored traces are doing ascent on that metric. If the metric is “shorter answers,” they will cut citations. Choose \`f\` as carefully as you choose a loss. The optimizer is loyal to the scalar, not to your unstated values.

> **Warning:** Optimizing pass-rate on 20 hand-picked tickets overfits as surely as 10,000 epochs on 20 images. Hold out evals.

\`\`\`quiz
Gradient descent updates parameters by
- Adding the gradient times the learning rate
- *Subtracting the gradient times the learning rate
- Setting all parameters to zero
- Multiplying parameters by entropy
explain: The gradient points uphill. Minimizing a loss means stepping the opposite way, scaled by the learning rate.
\`\`\`
`,
    },
    {
      slug: "sampling",
      title: "Sampling and Temperature",
      summary:
        "Softmax turns logits into probabilities. Temperature rescales logits. Then you draw with random().",
      minutes: 16,
      level: "intermediate",
      md: `
Language models emit **logits**: real numbers, one per token (or per tool). They are not probabilities. **Softmax** converts a list of logits \`z\` into a categorical distribution:

\`p_i = exp(z_i) / sum_j exp(z_j)\`

The \`exp\` is huge for large logits, so in code you subtract \`max(z)\` first. That does not change \`p\` (it cancels) and it stops overflow.

**Temperature** \`T > 0\` rescales logits **before** softmax: use \`z_i / T\`.

- \`T → 0\`: the largest logit dominates; you approach **greedy** argmax (deterministic given ties).
- \`T = 1\`: the model’s native distribution.
- \`T > 1\`: the distribution **flattens** toward uniform; more entropy, more surprise, more chance of a weird token.

Temperature does not “add creativity” as a slogan. It **changes the categorical you sample**. At high T you spend entropy; at low T you copy the mode.

## Implement softmax and a draw

Sampling: draw \`u\` uniform on \`[0,1)\`, walk the cumulative sum of \`p_i\`, pick the first index where the cumulative meets \`u\`. That is inverse-transform sampling for a discrete distribution.

\`\`\`tryit python
import math
import random

random.seed(3)

def softmax(logits, T=1.0):
    scaled = [z / T for z in logits]
    m = max(scaled)
    exps = [math.exp(z - m) for z in scaled]
    total = sum(exps)
    return [e / total for e in exps]

def sample(probs):
    u = random.random()
    acc = 0.0
    for i, p in enumerate(probs):
        acc += p
        if u <= acc:
            return i
    return len(probs) - 1

tokens = ["search", "sql", "finish", "wait"]
logits = [2.0, 1.0, 0.2, -1.0]

for T in [0.2, 1.0, 2.0]:
    p = softmax(logits, T)
    print(f"T={T}")
    for tok, pi in zip(tokens, p):
        print(f"  {tok:7} {pi:.3f}")
    draws = [tokens[sample(p)] for _ in range(12)]
    print("  samples", draws)

# greedy decode is argmax, equal to T -> 0
print("greedy", tokens[max(range(len(logits)), key=lambda i: logits[i])])
\`\`\`

At \`T = 0.2\` almost every sample is \`search\`. At \`T = 2\` you will see \`sql\`, \`finish\`, even \`wait\`. Same logits, different agent. If your production temperature is accidentally 2.0, “the model got worse” is a **sampling** bug.

Greedy is not always best. It is **repeatable**, which evals love, and it can trap loops (“I’ll search again”). Moderate T plus a **stop** tool and a max-step budget is a typical compromise. Seeded sampling with T > 0 is how you generate diverse traces for evals: same prompt, many draws, then score the distribution of plans rather than a single lucky run.

## Logits vs log-probs

If you already have log-probabilities, softmax is \`exp\` then normalize — same function. Never softmax twice. Never treat logits as if they already sum to 1.

## Agent connection

Tool-calling models score tools with the same machinery as tokens. Temperature on **tool** logits is a policy knob: 0 makes a stubborn specialist; high T makes a ditherer. Log the chosen tool **and** its probability. A long tail of 0.15 decisions is an entropy problem you can fix with a better prompt, fewer tools, or lower T.

Top-k and nucleus (top-p) sampling are **truncated** categoricals: zero out the tail, renormalize, then sample. They exist to cut off the long weird tail without driving T all the way to 0. You can implement them as a sort plus a cumulative cutoff on the same \`p\` list.

> **Tip:** Subtract max(logit) inside softmax every time. Overflow is a silent NaN in some environments and a crash in others.

\`\`\`quiz
Raising temperature above 1, with the same logits, generally
- Makes greedy argmax more likely to change the winner of softmax
- *Flattens the probability distribution, increasing entropy of samples
- Converts logits into embeddings
- Sets all probabilities to zero
explain: Dividing logits by T>1 shrinks gaps between them. Softmax then looks closer to uniform; samples diversify.
\`\`\`
`,
    },
    {
      slug: "embeddings-geometry",
      title: "Embedding Geometry",
      summary:
        "Nearest neighbors in a list of 2-d and 3-d points. RAG is this picture in a few hundred dimensions.",
      minutes: 16,
      level: "intermediate",
      md: `
An **embedding space** is just a vector space where you decided that **nearby** means **related**. The embedder is a function from text (or images, or tool traces) to a point. Retrieval is **nearest neighbor search**: given a query point, return the stored points with best cosine (or smallest distance).

You cannot see 1536 dimensions. You can see 2 and 3. The algorithms do not change: same list, same cosine, same sort. Clusters that look obvious in 2-d are the same phenomenon as “all refund FAQs sit in a blob” in high-d. Failures also match: a query on the **boundary** between two blobs retrieves a mix; a query in empty space retrieves **something** anyway, because top-k always returns k.

That last point is why RAG needs a **score threshold**, not only k. The nearest neighbor of a garbage query is still a neighbor, not a refusal.

## A tiny vector store

Three labeled clouds in 2-d: billing, auth, infra. We embed a query by hand (in production the model does this) and pick top-2. Then we do the same in 3-d to show an extra coordinate can separate what 2-d mixed.

\`\`\`tryit python
def dot(u, v):
    return sum(a * b for a, b in zip(u, v))

def mag(v):
    return sum(x * x for x in v) ** 0.5

def cosine(u, v):
    return dot(u, v) / (mag(u) * mag(v))

def topk(query, store, k=2):
    scored = [(cosine(query, vec), text, label) for text, label, vec in store]
    scored.sort(reverse=True)
    return scored[:k]

store2d = [
    ("refunds 5-7 days", "billing", [0.9, 0.1]),
    ("invoice PDF in /billing", "billing", [0.8, 0.2]),
    ("reset password via email", "auth", [0.1, 0.9]),
    ("SSO is SAML", "auth", [0.2, 0.8]),
    ("runner OOM last night", "infra", [-0.7, 0.2]),
    ("scale the worker pool", "infra", [-0.6, 0.1]),
]

q_bill = [0.85, 0.15]
q_mystery = [0.0, 0.0]  # will fail: zero vector — skip
print("2d billing query:")
for row in topk(q_bill, store2d, 2):
    print(" ", row)

# 3-d: add a coordinate that separates infra
store3d = [
    ("refunds 5-7 days", "billing", [0.9, 0.1, 0.0]),
    ("invoice PDF in /billing", "billing", [0.8, 0.2, 0.05]),
    ("reset password via email", "auth", [0.1, 0.9, 0.0]),
    ("SSO is SAML", "auth", [0.2, 0.8, 0.1]),
    ("runner OOM last night", "infra", [0.1, 0.1, 0.95]),
    ("scale the worker pool", "infra", [0.0, 0.2, 0.9]),
]
q_infra = [0.05, 0.05, 0.9]
print("3d infra query:")
for row in topk(q_infra, store3d, 2):
    print(" ", row)

# always-k problem: query far from everything still returns k hits
q_far = [0.4, 0.4, 0.4]
print("3d vague query (still top-2):")
for row in topk(q_far, store3d, 2):
    print(" ", row)
\`\`\`

The vague query still prints two “hits.” Look at the **score**. If both cosines are mediocre, the agent should say “I don’t have this in memory” instead of quoting a random infra snippet. That check is one \`if score < 0.35\`. Geometry plus a threshold is an API.

## What RAG actually adds

Real RAG is this neighbor loop plus: chunking (how a document becomes several points), metadata filters (only search \`label == billing\`), and a generator that **reads** the neighbors. The generator cannot recover a chunk that never made top-k. Improving the LLM does not fix a broken neighborhood.

Dimensionality: more dimensions can separate topics (the infra axis). They also make distance concentration weirder — in very high-d, pairwise distances look more similar. That is one reason cosine and normalization matter more, not less, as models get wider.

## Agent connection

Long-running agents store **memories as points**. On each turn they retrieve a few. If you never decay or cluster them, the store becomes a fog: everything is a weak neighbor of everything. Periodically merge near-duplicates (high cosine to each other) and drop low-magnitude failed embeds.

When you evaluate RAG, evaluate the **retriever** with recall@k on (question, gold chunk) pairs **before** you judge the generator. You now have the math: gold chunk should out-cosine the distractors. If it does not, fix chunking or the embedder, not the prompt poem.

You have the Mathematics track’s toolkit: functions, sums, vectors, dot products, matrices, maps, derivatives, gradients, the chain rule, probability, Bayes, distributions, expectation, entropy, descent, sampling, and this geometry. The ML and transformer tracks will reuse every object.

> **Tip:** Print the top-k scores in every RAG log line. Text without scores is a story; scores are evidence.

\`\`\`quiz
Why is top-k retrieval alone a risky policy for agents?
- Cosine similarity cannot be implemented with lists
- *k neighbors are always returned, even if every score is poor, so the model may quote irrelevant memory
- Embeddings cannot live in 2-d even as a toy
- Temperature disables nearest neighbors
explain: Nearest neighbor always has a winner. Without a similarity threshold (or a refusal path), RAG will stuff weak chunks into the prompt.
\`\`\`
`,
    },
  ],
};
