import type { RawLesson } from "@/lib/types";

export const tfAttention: RawLesson[] = [
  {
    slug: "attention",
    title: "Attention",
    summary:
      "Each token builds a query, matches keys, softmax to weights, then a weighted sum of values.",
    minutes: 22,
    level: "intermediate",
    md: `
**Attention** is a routing trick: each token builds a **query** vector, every token offers a **key**, the match scores (dot products) become weights via softmax, and the output is a **weighted sum of values**.

In one sentence: look up relevant context, mix it in.

For **self-attention**, queries, keys, and values all come from the same sequence (after linear maps). In this lesson we skip the linear maps and use the embeddings themselves so you can see the arithmetic. Production models learn those maps. The recipe does not change.

This is the mechanism people mean when they say “the model looked at the invoice id.” Sometimes the weights really pile on that id. Sometimes they do not, and the copy still happens in a later layer. Attention weights are a clue, not an explanation API.

## A wrong picture

A wrong picture is: “attention is understanding.” It is multiply, add, softmax, and a weighted sum of lists of numbers. High weight on a token does not mean the model used that fact correctly. Low weight does not mean the fact was ignored forever — a later layer can still mix it.

Another wrong picture is: “every token can always see every other token.” **Causal** (decoder) attention hides the future: token \`i\` may not look at \`j > i\`. That is what makes next-token prediction honest. Bidirectional attention lets everyone see everyone — good for embeddings, not for left-to-right generation.

A third wrong picture is: “if the prompt is long, attention will find the needle.” Softmax over a long row **dilutes**. Mass spreads. Lost-in-the-middle is this fact in clothing. You cannot fix it by asking the model to “pay attention.” You fix the **sequence**.

## The recipe for one head

For token \`i\`:

1. \`score_ij = query_i · key_j\` (often divided by \`sqrt(d)\` so dots do not explode)
2. \`weight_i = softmax(scores_i)\`
3. \`out_i = sum_j weight_ij * value_j\`

The **dot product** is the same multiply-and-add from the math track. Large dots mean “this query matches this key.” Softmax turns the row of scores into a row of weights that are positive and sum to 1. Then you mix the value lists with those weights.

The scale \`1/sqrt(d)\` is not decoration. Large \`d\` makes dots huge. Softmax then turns into almost-argmax: one weight near 1, the rest near 0, and the slopes that training needs die. Scaling keeps the scores in a civilized range.

**Causal mask:** if \`j > i\`, set \`score_ij\` to a huge negative number before softmax. After softmax that weight is ~0. Token \`i\` cannot peek at the future. Bidirectional skips that mask.

Naive attention is **O(n²)** in sequence length: every query against every key. That quadratic is why long transcripts are expensive and fuzzy. Kernels can be clever. The bill still grows faster than linear.

## A tiny example in words

Three tokens as lists of numbers (width 4):

- invoice: \`[1.0, 0.0, 0.0, 0.0]\`
- please: \`[0.0, 1.0, 0.0, 0.0]\`
- refund: \`[0.8, 0.2, 0.0, 0.0]\`

Refund points mostly the same way as invoice. Under causal attention, the last token may look at all three. Weight should pile on invoice and refund more than on please. That is “the model looked at the noun,” as a cartoon.

Token 0 can only look at itself. Token 1 can look at 0 and 1. That triangle is the causal picture.

## Causal weights on three toy tokens

Lists of numbers. Softmax by hand. Print the weight rows and the last mixed vector.

\`\`\`viz heat
title Causal attention weights (query rows, key columns)
labels inv please refund
row 1.00 0.00 0.00
row 0.35 0.65 0.00
row 0.45 0.12 0.43
caption Future cells are zero. Refund lines up with invoice, so weight piles there more than on please.
\`\`\`

\`\`\`viz flow
title One attention step
layout lr
node q Query
node k Keys
node w Weights
node v Mix values
edge q k
edge k w
edge w v
caption Match the query to keys, softmax to weights, then mix the values. That mix is the output.
\`\`\`

\`\`\`tryit python
import math

X = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.8, 0.2, 0.0, 0.0],
]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]

def attention(X, causal=True):
    n = len(X)
    d = len(X[0])
    scale = math.sqrt(d)
    weights = []
    outs = []
    for i in range(n):
        scores = []
        for j in range(n):
            if causal and j > i:
                scores.append(-1e9)
            else:
                scores.append(dot(X[i], X[j]) / scale)
        w = softmax(scores)
        weights.append(w)
        mixed = [0.0] * d
        for j, wj in enumerate(w):
            for k in range(d):
                mixed[k] += wj * X[j][k]
        outs.append(mixed)
    return weights, outs

W, O = attention(X, causal=True)
print("causal weights (rows = query tokens):")
for i, row in enumerate(W):
    print("q" + str(i), [round(x, 3) for x in row])
print("out2", [round(x, 3) for x in O[2]])
Wb, _ = attention(X, causal=False)
print("bidirectional last row", [round(x, 3) for x in Wb[2]])
\`\`\`

Row \`q2\` can see tokens 0–2. Because refund aligns with invoice, weight piles on 0 and 2 more than on please. Future cells on earlier rows should print as 0.000 after softmax (the huge negative did its job).

The last output list is a mix of the three rows, with more invoice-ish first slot than please-ish second slot. Bidirectional last row may look similar here because token 2 already sees everyone under causal. The difference shows up on **earlier** queries, which bidirectional lets look forward.

Read the weight matrix whenever you debug a toy. Rows are queries. Columns are keys. That picture is the whole mechanism.

## Dilution, copy, and honesty

If you append twenty copies of a stack trace, each new row of softmax has more keys to share mass with. The invoice id still sits there. Its weight often **shrinks**. That is why editing the sequence (summarize, drop stale tools, put the goal at the end) is the real “attention control” you have from outside the weights.

Copying a UUID can happen in one hop: the query at the tool-argument position matches the key at the UUID position, the value carries those dimensions, the next layer reads them. If it fails, the UUID was too far, too drowned, or split into ugly tiles — not “attention is broken.” Fix the sequence and the tokenizer.

Causal masking is honesty for training: you cannot predict token \`i+1\` using token \`i+1\`. At generation time the future does not exist yet, so the mask matches reality. Bidirectional models that see the whole sentence are for **understanding** jobs (classify, embed), not for writing the next id.

## How agents use this

When a 20-step loop transcript is dumped raw, attention **can** see the first tool error in theory. In practice the mass spreads over repeated stack traces and the model re-commits the error. You help attention by **editing the sequence**: summarize, drop stale tools, put the goal and the latest observation near the end.

Do not prompt “look carefully at every token.” Softmax cannot give every token a large weight. The weights sum to 1. If you need a fact to win, make it **short, unique, and well placed**, not buried in a 40k-token dump.

- **Edit:** you cannot set the weights; you can change the keys they see.
- **Dilute:** long rows spread mass; shorten.
- **Mask:** future stays hidden in decoder stacks; do not expect bidirectional tricks from a chat generator.
- **Explain:** do not ship “attention heatmap” as proof the agent used a policy.
- **Copy:** ids that must be copied need a clear, nearby home in the sequence.

> **Tip:** Softmax over a long row dilutes. Lost-in-the-middle is this fact in clothing. You cannot fix it by asking the model to “pay attention.”

\`\`\`quiz
In causal self-attention, why are some scores set to a huge negative number?
- To speed up softmax
- *So token i cannot attend to future tokens j > i
- Because cosine is negative
- To implement dropout
explain: Masking the future keeps generation a valid next-token problem.
\`\`\`
`,
  },
  {
    slug: "multi-head",
    title: "Multi-Head Attention",
    summary:
      "Several attention heads in parallel: different subspaces, different relationships.",
    minutes: 20,
    level: "intermediate",
    md: `
One attention head is one way of matching queries to keys. Language needs several kinds of match at once: **syntax**, **coreference** (“it” pointing at “the invoice”), **recency** (the last tool result), **copying** (repeat the id from the JSON).

**Multi-head attention** splits the model width into \`h\` smaller heads, runs attention **in parallel**, concatenates the outputs, and mixes them with a linear layer.

If the model width is 8 and \`h = 2\`, each head works in 4-d. You do not get eight times the compute of one fat head. You get **several cheap views**. A single softmax is one distribution: it tends to form one or two sharp peaks. Multiple heads can specialize. They are not labeled “syntax” and “copy” in the file. We discover them with probes, when we bother.

You do not twiddle head count per request. Papers pick numbers that train well. Your job is still the sequence those heads look at.

## A wrong picture

A wrong picture is: “more heads means the model is more careful.” Too many tiny heads: each subspace is too small to match well. Too few fat heads: you reintroduce the softmax bottleneck. Head count is an architecture pick, not a quality slider.

Another wrong picture is: “one head is one human-readable skill.” A head might copy numbers on Monday and attend to punctuation on Tuesday. Do not write product docs that say “head 7 is the SQL head.”

A third wrong picture is: “cross-attention is a different math.” **Cross-attention** is the same recipe with queries from one sequence and keys/values from another. Encoder-decoder translation used that. Most agent stacks you will meet later are **decoder-only**: there is no second encoder. You concatenate docs into the prompt. The heads attend inside **one** sequence.

## Parallel views, then concat

Width \`d\`. Heads \`h\`. Each head uses \`d/h\` dimensions (in the simple split). For each head:

1. Take the slice (or a learned map into that slice).
2. Run the attention recipe: dots, scale, softmax, mix values.
3. Get one output list per token, of length \`d/h\`.

Concatenate the \`h\` lists back to length \`d\`. Multiply by an output matrix so the heads can mix. Residual add comes later, in the block lesson.

**Grouped-query** and **multi-query** attention share keys and values across heads to speed decoding and shrink the cache. Same idea, cheaper memory. You will feel that in the KV-cache lesson: cache size is layers × heads × sequence × key width. Sharing keys cuts that bill.

## A tiny example in words

Two tokens, width 4, two heads of width 2.

Token 0: \`[1.0, 0.0, 0.0, 1.0]\` — id-like in slots 0–1, time-like in slots 2–3.
Token 1: \`[0.9, 0.1, 1.0, 0.0]\` — similar id, different time.

Head 0 uses slots 0–1 (id). Head 1 uses slots 2–3 (time). Head 0 should agree the two tokens match. Head 1 should disagree. One concatenated fat head forced to average those stories would blur both.

## Two heads, two subspaces

Lists of numbers. Print softmax rows per head. No extra libraries beyond math.

\`\`\`viz heat
title Head 0 (id) vs head 1 (time)
labels tok0 tok1
row 0.48 0.52
row 0.52 0.48
caption One head agrees the two tokens match. Another head can disagree. Several cheap views beat one fat softmax.
\`\`\`

\`\`\`tryit python
import math

def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

X = [
    [1.0, 0.0, 0.0, 1.0],
    [0.9, 0.1, 1.0, 0.0],
]

def head(X, lo, hi):
    n = len(X)
    d = hi - lo
    rows = []
    for i in range(n):
        qi = X[i][lo:hi]
        scores = [dot(qi, X[j][lo:hi]) / math.sqrt(d) for j in range(n)]
        rows.append(softmax(scores))
    return rows

print("head0 id subspace")
for row in head(X, 0, 2):
    print([round(x, 3) for x in row])
print("head1 time subspace")
for row in head(X, 2, 4):
    print([round(x, 3) for x in row])
print("token0", X[0])
print("token1", X[1])
\`\`\`

Head 0 agrees the two tokens match (id-like dims): off-diagonal weights stay healthy. Head 1 disagrees (time-like dims): each token prefers itself more. That is the cartoon of specialization.

If you averaged the two subspaces into one 4-d softmax, the id match and the time clash would fight inside **one** distribution. Multi-head lets both stories survive until the concat mix.

Change token 1’s last two numbers to match token 0. Head 1 should start to agree too. That is how you debug a toy: **change one subspace**, watch one head.

## What you cannot see from outside

You cannot set head 3 to “always copy the job id.” You can:

- Put the job id in a short, unique span so some head can match it.
- Avoid packing five jobs into one token (“remember the id, the policy, the tone, the schema, and the joke”).
- Spread the job across sentences: a short spec, a short schema, a short observation.

Heads can attend to different sentences. They cannot invent a missing spec. They cannot split a single overloaded sentence into five clean views if you never wrote the five views.

Sharing keys across heads (grouped-query) is a speed/memory move at decode time. It is not a prompt trick. Do not try to “turn on grouped-query” from a chat box.

## How agents use this

Do not design prompts that require **one** token to mean five things. Spread the job across the sequence. A short spec. A short schema. A short observation. Heads can attend to different sentences. They cannot invent a missing spec.

When a tool argument must copy an id and also obey a policy, put those as **two spans**, not as one tangled clause. You are feeding different keys to different heads.

Decoder-only stacks do not have a hidden encoder “document memory.” Retrieved chunks are more tokens in the same self-attention. They compete for softmax mass with the spec and the history. Multi-head helps that competition a bit. It does not remove it.

- **Spread:** one idea per short span when you can.
- **Do not label heads:** you will be wrong next week.
- **Cross vs self:** agent prompts are usually one concatenated sequence.
- **Cache:** more heads can mean a bigger KV cache unless keys are shared.
- **Missing spec:** no head can attend to a sentence you deleted.

> **Note:** Cross-attention is the same recipe with queries from one sequence and keys from another. Most agent stacks hide a decoder-only model: you concatenate docs into the prompt.

\`\`\`quiz
What problem do multiple attention heads address?
- They reduce the vocabulary
- *One softmax mix is a bottleneck; several subspaces can specialize in different relations
- They delete positional encoding
- They make tokens into characters
explain: Multi-head attention is parallel specialized routing, then a merge.
\`\`\`
`,
  },
  {
    slug: "transformer-block",
    title: "The Transformer Block",
    summary:
      "Residual stream, attention, then a feed-forward net. Depth is how many times we mix and think.",
    minutes: 21,
    level: "intermediate",
    md: `
A **transformer block** (decoder style) is a residual pipeline. Tokens walk through many copies of the same block. Depth is “how many times we mix neighbors and think locally.”

Attention moves information **between** positions. The **MLP** (feed-forward net) processes **each** position. Residuals add the original stream back. LayerNorm (or RMSNorm) keeps sizes civilized. Unembedding at the end — next part of the track — maps the last vectors to vocab-sized **logits**.

GPT-2 small stacks 12 blocks. Frontier models stack many more. The **interface** stays: sequence of vectors in, sequence of vectors out, same length. You do not add or drop tokens inside a block. You only change the lists of numbers at each position.

## A wrong picture

A wrong picture is: “each layer rewrites the sentence from scratch.” Residual style means each layer learns a **delta**. The original embedding still flows. A 96-layer model can still look like “the embeddings plus a pile of patches.”

Another wrong picture is: “more layers is automatically better at my tool schema.” After a point you are buying fluency, not obedience. Evals still rule. A deep stack on a missing spec still cannot attend to a sentence you never sent.

A third wrong picture is: “the MLP is another attention.” The MLP does not mix positions. It is the same small net applied at every index. Mix happens in attention. Think-locally happens in the MLP.

## Diagram (top to bottom)

\`\`\`text
x  (one vector per token)
|--+
|  LayerNorm
|  Multi-head self-attention  (tokens mix)
|--+  add  (x = x + attn)
|--+
|  LayerNorm
|  Feed-forward MLP  (same token, wider, then back)
|--+  add  (x = x + mlp)
v
x'  to the next block
\`\`\`

Two ideas make this trainable:

- **Residual adds** — the original \`x\` still flows. The block learns a **delta**, not a whole new picture from scratch.
- **LayerNorm** (or RMSNorm) — keeps vector sizes from exploding as depth grows.

Modern stacks usually **normalize before** attention and MLP (pre-norm), which trains more stably at depth. Older stacks normalized after (post-norm). You will not switch this from a prompt. You will remember that deep nets need a size-taming step.

**Mixture-of-Experts** replaces the MLP with several MLPs plus a router: more parameters without running every expert on every token. Your agent **tool** router is the same idea at a coarser grain. Failure modes rhyme: the router ignores an expert, or all traffic hits one expert.

## A tiny example in words

Two tokens, width 2. Fake attention mixes 70% self and 30% the other token. Then a tiny MLP with ReLU expands to 4 numbers and back to 2. Residual adds after each step. The printed vectors should still **resemble** the inputs plus a nudge. That is residual style: identity plus a patch.

If the residual were missing, two nonlinear maps could smash the picture. With the residual, you can still see the old axes in the new lists.

## Residual attention, then residual MLP

Lists of numbers. Small hand-written matrices. Print after each add.

\`\`\`viz flow
title One transformer block
layout tb
node x Tokens in
node attn Mix (attention)
node ff Think (MLP)
node out Tokens out
edge x attn
edge attn ff
edge ff out
caption Mix neighbors, then think at each position. Length stays the same. Residuals add the old stream back.
\`\`\`

\`\`\`tryit python
def relu(xs):
    return [max(0.0, x) for x in xs]

def add(a, b):
    return [x + y for x, y in zip(a, b)]

def mlp(v):
    W1 = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [0.5, -0.5]]
    b1 = [0.0, 0.0, -0.2, 0.0]
    h = relu([sum(w * x for w, x in zip(row, v)) + b for row, b in zip(W1, b1)])
    W2 = [[0.3, 0.1, 0.2, 0.0], [0.0, 0.3, 0.1, 0.2]]
    return [sum(w * x for w, x in zip(row, h)) for row in W2]

x = [
    [1.0, 0.0],
    [0.0, 1.0],
]
print("in", x)
attn = [
    add([0.7 * a for a in x[0]], [0.3 * a for a in x[1]]),
    add([0.7 * a for a in x[1]], [0.3 * a for a in x[0]]),
]
x = [add(a, d) for a, d in zip(x, attn)]
print("after residual attn", [[round(v, 3) for v in row] for row in x])
ff = [mlp(v) for v in x]
x = [add(a, d) for a, d in zip(x, ff)]
print("after residual mlp", [[round(v, 3) for v in row] for row in x])
print("length still", len(x), "width still", len(x[0]))
\`\`\`

The printed vectors still resemble the inputs plus a nudge. Length of the sequence is still 2. Width is still 2. That is the block contract: same shape in and out.

After residual attention, each token has borrowed a bit of the other. After residual MLP, both lists get a nonlinear patch, still added on top. If a number looks huge, you are seeing why LayerNorm exists (next lesson). This toy is shallow enough to stay finite.

## Depth is repeated mix-and-think

One block: mix neighbors, think locally. Two blocks: mix again, including things that only became visible after the first mix. That is how information can hop. In principle, \`L\` layers can move a fact about \`L\` hops. In practice residual streams and attention patterns are messier. Still, **depth is repeated opportunity to mix**, not a separate “reasoning module.”

When people say “the model reasoned in latent space,” they mean these residual streams were mixed again and again. You cannot inspect that cheaply from a typical hosted call. You **can** inspect the **text** you stuffed into the first embeddings. Garbage in the window is garbage in every block.

The last block’s vectors go to unembedding (later). Only then do you get logits over the vocab. Until that map, you still have lists of numbers, not words.

## Common mistakes

Thinking of depth as “more thinking steps” the way a human would count. The model does not pause and reflect between blocks. Every block runs. Every token position gets a new vector. There is no skip-if-easy. If you want fewer steps, you want a smaller model or early-exit research, not a prompt that says “only use layer 3.”

Stuffing a chain-of-thought into the prompt and assuming that is the same as extra blocks. Extra **tokens** are extra keys for attention. Extra **blocks** are extra mix-and-think on whatever tokens you already sent. They are different knobs. You control tokens. You do not control block count on a hosted stack.

Copying a block diagram into twenty lines of Python without residuals or norm, then deciding transformers “do not work.” The diagram omitted the two ideas that make depth trainable. The next lesson is those two ideas slowly.

Expecting Mixture-of-Experts to pick your **tool**. The expert router picks MLPs inside a layer. Your tool router is a decode decision on ids. Do not conflate them. They rhyme. They are not wired together unless you built that.

## How agents use this

When a call fails, people blame “the model.” Named parts of the block help you assign the failure:

- Wrong copy of an id: attention mix (and token split, and position).
- Fluent but empty: the MLP and the unembedding can still write pretty tokens.
- Policy ignored: often the policy tokens never entered \`x\`, or they drowned, not “layer 47 refused.”

You cannot peel one block off a hosted response. You can only change the text that becomes the first \`x\`. That is context engineering — already implied here.

More layers is not a substitute for a schema, a stop rule, or a tool that returns a real number. After a point you are buying fluency, not obedience. Evals still rule.

- **Shape:** sequence length does not change inside the block.
- **Mix then think:** attention across positions, MLP at each position.
- **Delta:** residuals keep the old stream.
- **MoE:** extra MLPs plus a router; same grain as a tool router, finer.
- **Inspect:** you inspect tokens in and tokens out, not the residual stream.

> **Warning:** More layers is not automatically smarter at your tool schema. After a point you are buying fluency, not obedience. Evals still rule.

\`\`\`quiz
What do residual connections do in a transformer block?
- They delete attention
- *They add the block's output back to its input so information (and slopes) can flow through depth
- They replace softmax
- They tokenize bytes
explain: Residuals let each layer learn a delta. The stream remains usable at every depth.
\`\`\`
`,
  },
  {
    slug: "residuals",
    title: "Residuals and LayerNorm",
    summary:
      "Add the delta back. Normalize so depth does not explode. That highway is why 96 layers can train.",
    minutes: 19,
    level: "intermediate",
    md: `
A residual connection means:

\`output = input + layer(input)\`

The layer is allowed to be “almost zero.” Then the output is almost the input. Depth does not have to reinvent the representation at every step. Slopes have a **highway** back to the first tokens.

Without residuals, stacking many nonlinear maps tends to smash the signal (or blow it up). With residuals, a 96-layer model can still look like “the embeddings plus a pile of patches.”

**LayerNorm** rescales a vector so its numbers have a stable size (zero mean, unit variance, then a learned scale and shift). **RMSNorm** is a cheaper cousin: no mean subtraction, divide by the root-mean-square, then a learned scale. Neither is a knob you set per request. They explain why a 2-layer toy you write by hand can explode while a deep trained model does not.

This lesson is the same residual you saw inside the block, slowed down, plus the size-taming step that makes depth possible.

## A wrong picture

A wrong picture is: “residual means skip the layer.” The layer still runs. Its output is **added**, not used instead of the input. Both paths exist.

Another wrong picture is: “LayerNorm is dropout” or “LayerNorm is temperature.” Dropout exists in **training**; at inference it is off. Temperature is decoding (later). Norm is “make this vector a civilized size so the next matmul does not explode.”

A third wrong picture is: “if numbers become inf in my toy, the idea of transformers is wrong.” You are seeing the problem LayerNorm was hired to prevent. Print the size of the vector. Then divide. That is the move.

## Highway for slopes

Training needs slopes (gradients) to reach early tokens and early layers. A long chain of multiplies can shrink those slopes to zero (vanishing) or grow them to inf (exploding). Adding the input every time gives a path whose local slope is “1 + whatever the layer did.” If the layer is small, that path is about 1. Signal and slope can travel.

This is why residual nets trained when very deep plain nets did not. Transformers borrowed that idea. The residual **stream** is the running total of all those patches. Interpreters who read models talk about writing into and reading from that stream. You do not need that vocabulary to use an agent. You need: **do not smash the first embeddings**.

## Norm in words

For a vector \`v\` of length \`d\`:

**LayerNorm:** subtract the mean of the \`d\` slots, divide by the standard deviation (plus a tiny \`eps\`), then multiply by a learned gain and add a learned bias.

**RMSNorm:** skip the mean. Compute \`sqrt(mean of squares + eps)\`. Divide \`v\` by that. Then a learned gain.

Both make the **size** predictable. Direction stays roughly the same if you only rescale. Adding a delta, then normalizing, is “nudge, then tame.”

\`eps\` is a tiny number so you never divide by zero. You will not tune it in production prompts.

## Add a delta, then tame the size

Lists of numbers. RMSNorm by hand. Print sizes.

\`\`\`viz flow
title Residual skip: add the delta back
layout lr
node xin Input
node layer Layer
node add Add
node yout Output
edge xin layer
edge layer add
edge xin add
edge add yout
caption The layer still runs. Its output is added, not used instead of the input. Depth can learn a small patch.
\`\`\`

\`\`\`tryit python
def add(a, b):
    return [x + y for x, y in zip(a, b)]

def rmsnorm(v, eps=1e-5):
    ms = sum(x * x for x in v) / len(v)
    scale = (ms + eps) ** 0.5
    return [x / scale for x in v]

def mag(v):
    return sum(x * x for x in v) ** 0.5

x = [3.0, -1.0, 2.0]
delta = [0.5, 0.0, -0.5]
y = add(x, delta)
print("x", x, "mag", round(mag(x), 3))
print("x + delta", y, "mag", round(mag(y), 3))
nx = rmsnorm(x)
ny = rmsnorm(y)
print("rmsnorm(x)", [round(v, 3) for v in nx], "mag", round(mag(nx), 3))
print("rmsnorm(x+delta)", [round(v, 3) for v in ny], "mag", round(mag(ny), 3))
print("direction kept, size tamed")
huge = [30.0, -10.0, 20.0]
print("rmsnorm(10*x)", [round(v, 3) for v in rmsnorm(huge)])
\`\`\`

The sum still points a similar way. The size is pulled back. \`rmsnorm(10*x)\` should match \`rmsnorm(x)\` in this toy because RMSNorm cares about direction and relative slot sizes, not global scale. That is what lets the next block see a civilized vector.

If \`delta\` were huge, the sum would point a new way, then get tamed to unit-ish size. Norm does not undo a bad layer. It only stops the fire from spreading as **magnitude**.

When a toy net’s numbers become inf, print \`mag(v)\` before the next multiply. That print is the debugging habit LayerNorm automates.

## Train vs run

Dropout randomly zeros slots **during training** so the net cannot rely on one path. At **inference** (generation) dropout is off. If a vendor “temperature” feels like dropout, it is not. Temperature reweights logits. Dropout was regularization.

You cannot peel LayerNorm off a hosted model. You can only change the first \`x\`. If the first embeddings are a duplicated stack trace, every residual patch is a patch on junk. Norm will still tame the size of junk.

Pre-norm vs post-norm (last lesson) is about **where** this taming sits relative to attention and the MLP. Pre-norm is the common modern default at depth.

## Common mistakes

Removing the residual “to see what the layer really does” in a deep toy, then watching inf. You saw why the highway exists. Put it back.

Treating RMSNorm as a semantic operation: “it removes meaning so the model is fair.” It tames **size**. Direction mostly stays. Meaning lives in direction and in later mixes, not in the overall scale of one vector.

Matching dropout to temperature in a design doc. Dropout is a train-time coin flip on slots. Temperature is decode-time reweighting of logits. One is off at inference. Mixing the words makes the serving team turn the wrong knob.

Forgetting that the first \`x\` is your prompt’s embeddings. If you duplicate a stack trace, you did not “add context.” You added a loud junk direction that every residual patch will try to work around. Norm will keep it a civilized size of junk.

## How agents use this

You cannot peel one block off a hosted response. You can only change the text that becomes the first \`x\`. If the first embeddings are a duplicated stack trace, every residual patch is a patch on junk.

When a local toy explodes, you are not failing “math.” You are missing the highway and the taming that production models have. Do not copy a 96-layer picture into 20 lines of Python and expect it to be stable without residuals and norm.

- **Add, do not replace:** \`x + layer(x)\`.
- **Tame size:** LayerNorm or RMSNorm.
- **Dropout:** train only; not a decode knob.
- **Junk in:** junk patched 96 times is still junk.
- **Debug toys:** print vector size when numbers blow up.

> **Tip:** When a toy net’s numbers become inf, you are seeing the problem LayerNorm was hired to prevent. Print the size of the vector.

\`\`\`quiz
Why add the layer output back to the input (a residual)?
- To delete the embedding table
- *So each layer can learn a small change, and slopes still reach the early tokens
- So softmax becomes greedy
- To train BPE faster
explain: Residuals are a highway: identity plus a delta. Depth stays trainable.
\`\`\`
`,
  },
  {
    slug: "encoder-decoder",
    title: "Encoder vs Decoder",
    summary:
      "Decoders generate left to right with a causal mask. Encoders see both sides. Agents almost always call a decoder.",
    minutes: 20,
    level: "intermediate",
    md: `
There are two classic transformer shapes.

An **encoder** lets every token see every other token (bidirectional attention). BERT-style. Good at **understanding** a whole sentence: classify, embed, fill a blank in the middle.

A **decoder** lets token \`i\` see only tokens \`≤ i\` (causal mask). GPT-style. Good at **generating** the next token, then the next.

An **encoder-decoder** (old translation models) encodes the source with a bidirectional stack, then a decoder attends to that memory while generating the target. Cross-attention sits in the decoder: queries from the target so far, keys and values from the source encoding.

Most stacks you will call for an agent **loop** are **decoder-only**: everything lives in one sequence. Docs, tools, and instructions are concatenated into the prompt. There is no second encoder behind the curtain. Retrieval is not a hidden encoder. Retrieval is more tokens you pasted.

## A wrong picture

A wrong picture is: “encoder means it is smarter.” Encoder means **bidirectional mix**. That is the right inductive bias for “what is this sentence about?” It is the wrong bias for “write the next id without cheating.”

Another wrong picture is: “my chat model has a secret encoder for documents.” If the product is decoder-only, your documents are in the **same** causal sequence. They compete for softmax mass. They get positions. They can be truncated.

A third wrong picture is: “you can stuff chat completions into an embedding endpoint.” Embedding models are often encoder-like (or a decoder with pooling). Chat models are decoders trained to continue roles. The vectors are not interchangeable. Mixing those spaces is the embedding-table lesson again.

## Masks are the difference you can draw

For a sequence of length 4, query rows vs key columns:

**Encoder:** a full square of allowed. Position 0 may look at 3. Position 3 may look at 0.

**Decoder:** a triangle. Position 0 looks only at 0. Position 3 looks at 0, 1, 2, 3. The future is dots (blocked).

That triangle **is** next-token training. If the decoder could see the future token, “predict the next id” would be cheating. Teacher forcing still feeds the **true** past (next lesson on pretraining), but never the future id being predicted.

Fill-in-the-middle and masked-language models exist too. A masked model hides random tiles and guesses them from both sides. Chat agents still wrap a causal decoder almost every time.

Prefix language models (mask the prompt as bidirectional, generate the answer causal) show up in research. Your hosted chat still looks like a transcript with a causal generator.

## Print a Y/. mask for both kinds

No neural net. Nested loops. \`Y\` means allowed, \`.\` means blocked.

\`\`\`viz heat
title Decoder mask: a triangle
labels k0 k1 k2 k3
row 1 0 0 0
row 1 1 0 0
row 1 1 1 0
row 1 1 1 1
caption Position i may look at j only if j is not the future. That triangle is next-token honesty.
\`\`\`

\`\`\`tryit python
def allowed(i, j, kind):
    if kind == "encoder":
        return True
    if kind == "decoder":
        return j <= i
    return False

n = 4
for kind in ("encoder", "decoder"):
    print(kind)
    for i in range(n):
        row = [("Y" if allowed(i, j, kind) else ".") for j in range(n)]
        print("q" + str(i), " ".join(row))
print("encoder-decoder would encode with a full square, then decode with a triangle plus cross-attn to the encoder")
\`\`\`

Encoder: a full square of Y. Decoder: a triangle. That picture is the lesson. Cross-attention would be a second grid: every decoder position (that exists so far) against every encoder position. Decoder-only skips that second grid and puts the “source” into the same triangle as extra past tokens.

If you add a pad mask later, some Y cells become blocked too. Causal plus pad is the production decoder mask. Bidirectional plus pad is the production encoder mask.

## What each shape is for

| Shape | Attention | Typical job |
|---|---|---|
| Encoder | Bidirectional | Classify, embed, span labels |
| Decoder | Causal | Next token, chat, tool calls as tokens |
| Encoder-decoder | Encode full, decode causal + cross | Translation, old seq2seq |

Agents that **generate** actions need a decoder. Agents that **index** memory often need an encoder-like embedder. Those are two models, two tokenizers, two vector spaces. Do not mix them.

Decoder-only RAG is: embed with the embedder (encoder-like), retrieve strings, paste strings into the decoder prompt. The decoder never saw the embedding table of the embedder. It sees tokens.

## Common mistakes

Calling a decoder a “BERT” because both are transformers. The mask is the product difference. Bidirectional mix vs causal mix. Wrong mask, wrong job.

Pasting retrieved chunks into an embedding model and expecting a tool call out. Embedders are not generators. Generators are not drop-in embedders. Two models, two tokenizers, two spaces.

Hoping a chat decoder will “read both sides” of a JSON key you put after the slot being predicted. Causal means the key after the cursor is the future. Put the schema **before** the object you want filled, or use a grammar. Do not hide the spec on the right.

Building a toy encoder-decoder and then concatenating source and target into one causal stack “to simplify.” You just built a decoder-only model. That can be fine. It is not the translation picture. Name it honestly.

## How agents use this

When a product sells an **embedding model**, it is often encoder-like (or a decoder with pooling). When it sells a **chat model**, it is a decoder. Do not stuff chat continuations into an embedding endpoint or the other way around. For retrieval plus generation, embed with the encoder-like model, generate with the decoder, and never mix vector spaces.

You will not switch a hosted chat model into bidirectional mode to “make it read the middle better.” Packing the window (later) is the lever. Architecture is frozen.

If you train a small classifier on tickets, an encoder is a natural backbone. If you train a small policy that emits tool names left to right, a decoder is the backbone. Same block pieces, different mask.

- **Chat / tools:** decoder, causal triangle.
- **Embeddings:** encoder-like, full square, then pool.
- **No secret encoder:** pasted docs are more decoder tokens.
- **Do not mix spaces:** embedder rows are not chat rows.
- **Honesty:** causal mask is why next-token training works.

> **Note:** Prefix language models (mask the prompt as bidirectional, generate the answer causal) show up in research. Your hosted chat still looks like a transcript.

\`\`\`quiz
Why must a GPT-style decoder hide future tokens?
- Hardware cannot store them
- *Otherwise next-token training would see the answer and the game would be fake
- Softmax requires a triangle
- Encoders cannot run without a GPU
explain: Causal masking keeps generation honest: each token is predicted only from the past.
\`\`\`
`,
  },
];
