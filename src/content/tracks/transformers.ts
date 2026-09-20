import type { TrackSource } from "@/lib/types";

export const transformers: TrackSource = {
  slug: "transformers",
  title: "Neural Nets & Transformers",
  short: "Transformers",
  tagline: "Tokens, embeddings, attention, decoding, context windows, fine-tuning.",
  color: "#EA580C",
  order: 5,
  lessons: [
    {
      slug: "tokens",
      title: "Tokens",
      summary:
        "Models do not read characters or words. They read tokens — with a tiny BPE-style merge you can run.",
      minutes: 16,
      level: "beginner",
      md: `
A language model does not see letters the way you do. It sees **tokens**: integer ids from a fixed vocabulary. Everything — cost, context limits, weird spelling bugs — starts here.

## Characters vs words vs tokens

| Unit | Problem |
|---|---|
| **Characters** | Sequences get long; the model must learn that \`c-a-t\` is a word |
| **Words** | Vocab explodes; \`refunds\` and \`refund\` are unrelated ids; new words are impossible |
| **Subword tokens** (BPE, WordPiece, Unigram) | A compromise: common words are one token; rare words split |

English prose is often **~4 characters per token**, but that is a rumor, not a law. Code, JSON, and non-English can be much worse. \`{"job_id": 17}\` is not “four words.”

Tokenization is **not** unique. Two tokenizers will split the same string differently. Two models with different tokenizers cannot share embedding tables. Mixing them in a RAG pipeline (embed with A, count cost with B) produces mysterious bills.

## Byte Pair Encoding, cartoon edition

**BPE** starts from characters (or bytes) and repeatedly **merges** the most frequent adjacent pair into a new token. After enough merges, \`ing\` might be a single token, \`attention\` might be two, and your company name might be twelve because it never appeared in the training corpus.

\`\`\`tryit python
from collections import Counter

def tokenize_chars(text):
    return list(text)

def pair_counts(seq):
    return Counter(zip(seq, seq[1:]))

def merge(seq, pair, new_tok):
    out = []
    i = 0
    while i < len(seq):
        if i < len(seq) - 1 and (seq[i], seq[i + 1]) == pair:
            out.append(new_tok)
            i += 2
        else:
            out.append(seq[i])
            i += 1
    return out

text = "low lower newest newest"
seq = tokenize_chars(text)
print("chars", len(seq), seq[:20], "...")

for step in range(1, 6):
    counts = pair_counts(seq)
    pair, n = counts.most_common(1)[0]
    name = pair[0] + pair[1]
    seq = merge(seq, pair, name)
    print("merge", step, pair, "x" + str(n), "->", name, "| tokens", len(seq))

print("result", seq)
\`\`\`

Watch frequent pairs like \`e s\` or spaces glue together. Real BPE trains on billions of bytes and a merge list of 50k+ operations. The algorithm you ran **is** the idea.

## Why agents should care

- **Cost** is tokens in + tokens out, every step of the loop
- **Context windows** are token budgets, not “pages”
- Tool JSON with verbose keys burns budget
- A tokenizer that splits \`get_job\` into five pieces makes the model worse at copying APIs
- Prompt injection and jailbreaks are also token sequences; filters that operate on words miss splits

## Tokenization bugs you will actually hit

Leading spaces: many tokenizers treat \` refund\` and \`refund\` as different ids. Copy-paste from logs introduces a space; the model then fails to match a few-shot example. Trailing newlines in tool results become extra tokens and sometimes extra “blank” assistant turns.

Count **the same tokenizer the API uses**. Character/4 is a planning heuristic from a later LLM lesson, not a bill. If you build a stop sequence, tokenize it and make sure it cannot appear inside a legal JSON string, or you will cut the model off mid-argument.

Chinese, code, and UUID strings are token-heavy. That is why a “short” error payload with a request id can still blow the budget.

## Agent connection

Log **token counts**, not characters, from the same tokenizer the model uses. When you trim a transcript, trim tokens. When you design a tool schema, short names are not aesthetics; they are runway.

> **Tip:** Paste a sample tool result into a tokenizer playground (vendor UI) once. The number will hurt, and then you will stop returning entire SQL tables.

\`\`\`quiz
Why do modern LLMs use subword tokens instead of whole words?
- Words cannot be stored on disk
- *A word vocab cannot handle new or rare spellings; subwords reuse pieces and keep the table finite
- Characters are illegal in UTF-8
- BPE requires a GPU
explain: Subword tokenizers balance a fixed vocab with the ability to represent unseen words as pieces.
\`\`\`
`,
    },
    {
      slug: "embedding-table",
      title: "The Embedding Table",
      summary:
        "Token id to vector: a lookup table that is the first layer of every transformer.",
      minutes: 14,
      level: "beginner",
      md: `
After tokenization you have integers. Neural nets want **vectors**. The **embedding table** is a matrix with one row per vocabulary item. Token id \`17\` means “return row 17.”

That is not a metaphor. The first layer of GPT-style models is an array lookup (plus extra tables for positions). Learning embeddings means **moving those rows** so that tokens used in similar contexts sit in similar places — the geometry from the ML track, now tied to ids.

## Lookup is not magic

If the table is 50,000 tokens by 768 dimensions, that is already ~38 million numbers **before** any attention layer. Small models still spend a large fraction of parameters here. That is why tokenizer choice is an architecture choice.

Position is a second signal: token 5 of “pay the invoice” is not token 5 of a stack trace. **Positional encodings** (sinusoids, learned, RoPE) mark *where* in the sequence a token sits. Without them, a transformer is a bag of tokens.

\`\`\`tryit python
# Tiny vocab and 3-D embeddings (learned values faked by hand)
stoi = {"<pad>": 0, "refund": 1, "invoice": 2, "please": 3, "now": 4}
itos = {i: t for t, i in stoi.items()}

table = [
    [0.0, 0.0, 0.0],    # pad
    [0.1, 0.0, 0.9],    # refund
    [0.0, 0.1, 0.8],    # invoice
    [0.5, 0.5, 0.1],    # please
    [0.4, 0.6, 0.0],    # now
]

def embed_ids(ids):
    return [table[i] for i in ids]

def encode(text):
    return [stoi[w] for w in text.split()]

ids = encode("please refund invoice")
vecs = embed_ids(ids)
print("ids", ids)
print("tokens", [itos[i] for i in ids])
for tok, v in zip(ids, vecs):
    print(itos[tok], v)

# Mean pool — a crude "sentence embedding"
pooled = [sum(row[d] for row in vecs) / len(vecs) for d in range(3)]
print("mean pool", [round(x, 3) for x in pooled])
\`\`\`

A production embedder is a full transformer whose **last hidden states** (often pooled) become the vector you store in a database. The table lookup is still the first move.

## Out-of-vocabulary and special tokens

Unknown pieces become \`<unk>\` or, with byte-level BPE, raw bytes. Special tokens (\`<pad>\`, \`<eos>\`, chat role markers, tool-call sentinels) are **extra rows**. If your fine-tune never sees \`<tool>\` but production injects it, that row is random noise wearing a hat.

## Positions are not optional

Without a position signal, “pay the invoice tomorrow” and “tomorrow pay the invoice” are the same bag of rows. Rotary embeddings (RoPE) and learned position tables are two ways to mark index. Long-context models stretch or interpolate those positions; quality often **dips in the middle** of a packed window even when the brochure says 128k.

Tied embeddings: some models use the same matrix to look up tokens and to predict them (transpose as the unembedding). That saves parameters. It also means a tokenizer change is a full retrain, not a config flag.

Padding: batching different lengths needs a pad id whose row should be ignored by attention masks. If you forget the mask, the model “attends to pad” and gets dumber in a way that looks like a random seed bug.

## Agent connection

When you cache embeddings for RAG, you cache **(tokenizer version, model version, instruction prefix)**. Change any of them and old vectors are in a different space. Mixing spaces looks like “retrieval suddenly got dumb.” It got **incompatible**.

> **Note:** One-hot vectors are embeddings too — huge, sparse, and orthogonal. Learned tables are small, dense, and share structure. That compression is the point.

\`\`\`quiz
What does an embedding table do?
- Compresses GPUs
- *Maps a token id to a vector by returning that id's row
- Deletes rare words
- Computes softmax
explain: Embedding is a lookup: id in, vector out. Training moves the rows.
\`\`\`
`,
    },
    {
      slug: "attention",
      title: "Attention",
      summary:
        "A 3-token attention map with dot products and softmax — how tokens talk to each other.",
      minutes: 18,
      level: "intermediate",
      md: `
**Attention** is a routing mechanism: each token builds a **query** vector, every token offers a **key**, the match scores (dot products) become weights via softmax, and the output is a **weighted sum of values**.

In one sentence: *look up relevant context, mix it in.*

For self-attention, queries, keys, and values all come from the same sequence (after linear maps). In this lesson we skip the linear maps and use the embeddings themselves so you can see the arithmetic.

## The recipe for one head

For token \`i\`:

1. \`score_ij = query_i · key_j\` (often divided by \`sqrt(d)\` so dots do not explode)
2. \`weight_i = softmax(scores_i)\`
3. \`out_i = sum_j weight_ij * value_j\`

Causal (decoder) attention **masks the future**: token \`i\` may not look at \`j > i\`. That is what makes next-token prediction honest. Bidirectional (encoder / BERT-style) attention lets everyone see everyone — good for embeddings, not for left-to-right generation.

\`\`\`tryit python
import math

# 3 tokens, d=4. Made-up vectors: token 2 resembles token 0.
X = [
    [1.0, 0.0, 0.0, 0.0],  # "invoice"
    [0.0, 1.0, 0.0, 0.0],  # "please"
    [0.8, 0.2, 0.0, 0.0],  # "refund" ~ invoice
]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]

def attention(X, causal=True):
    n, d = len(X), len(X[0])
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
print("causal attention weights (rows = query tokens):")
for i, row in enumerate(W):
    print(" q" + str(i), [round(x, 3) for x in row])
print("out[2] (refund, mixed)", [round(x, 3) for x in O[2]])
\`\`\`

Row \`q2\` can see tokens 0–2. Because \`refund\` aligns with \`invoice\`, weight should pile on 0 and 2 more than on \`please\`. That is “the model looked at the noun.”

## What attention is not

It is not an explanation API. High weight ≠ “the model used this fact correctly.” It is not free: **naive attention is O(n²)** in sequence length — every query against every key. That quadratic is why context windows are expensive and why long-agent transcripts rot.

## KV cache, in one paragraph

At generation time, keys and values for **past** tokens do not change. Servers store them (the KV cache) so each new token only computes one new row of scores. That is why the **first** token of a long prompt is slow (prefill) and later tokens are faster (decode) — until the cache is huge and memory-bound. Agent loops that resend a 20k-token transcript pay prefill again if the prefix is not cached. Stable pinned prefixes are a performance feature, not just a safety feature.

Softmax over a long row also **dilutes**: mass spreads across thousands of keys. That is lost-in-the-middle in mathematical clothing. You cannot fix it by asking the model to “pay attention.” You fix the sequence.

## Agent connection

When a 20-step ReAct transcript is dumped raw into the window, attention still **can** see the first tool error — in theory. In practice the mass spreads over repeated stack traces and the model re-commits the error. You help attention by **editing the sequence**: summarize, drop stale tools, put the goal and the latest observation near the end (recency bias is real).

> **Tip:** The scale \`1/sqrt(d)\` is not decoration. Large \`d\` makes dots huge, softmax turns into argmax, and gradients die.

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
      minutes: 14,
      level: "intermediate",
      md: `
One attention head is one way of matching queries to keys. Language needs several kinds of match at once: **syntax** (who is the subject?), **coreference** (“it” → “the invoice”), **recency** (the last tool result), **copying** (repeat the id from the JSON).

**Multi-head attention** splits the model dimension into \`h\` smaller heads, runs attention **in parallel**, concatenates the outputs, and mixes them with a linear layer.

If \`d_model = 8\` and \`h = 2\`, each head works in 4-D. You do not get eight times the compute of a full-dimension head; you get **several cheap views**.

## Why not one big head?

A single softmax is a **probability distribution**: it has to put mass somewhere and it tends to form one or two sharp peaks. Multiple heads can specialize. In real models, some heads look like positional (attend previous token), some like rare-word copiers. They are not labeled; we discover them with probes, when we bother.

Heads also provide **ensemble** robustness: if one subspace saturates, another may still route the tool name.

\`\`\`tryit python
import math

def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

# Two tokens, d_model=4, two heads of size 2
X = [
    [1.0, 0.0, 0.0, 1.0],  # token 0: "id" in dims 0-1, "time" in 2-3
    [0.9, 0.1, 1.0, 0.0],  # token 1: similar id, different time
]

def head(X, slice_from, slice_to):
    n = len(X)
    d = slice_to - slice_from
    W = []
    for i in range(n):
        qi = X[i][slice_from:slice_to]
        scores = [dot(qi, X[j][slice_from:slice_to]) / math.sqrt(d) for j in range(n)]
        W.append(softmax(scores))
    return W

print("head0 (id subspace) weights")
for row in head(X, 0, 2):
    print([round(x, 3) for x in row])
print("head1 (time subspace) weights")
for row in head(X, 2, 4):
    print([round(x, 3) for x in row])
\`\`\`

Head 0 should agree the two tokens match (id-like dims). Head 1 should disagree (time-like dims). One concatenated head forced to average those stories would blur both.

## Practical numbers

GPT-2 small: 12 layers, 12 heads. Bigger models: more of both. You cannot usefully set \`heads = 1\` on a 12k-dimensional model and expect the same behavior; the softmax bottleneck is real.

For agents, multi-head is not something you configure at runtime (except in research). You **feel** it when the model simultaneously copies a JSON field and obeys a system rule. When it fails one of those, it is often capacity or context, not “not enough heads in the API.”

## Width of a head

Each head’s dimension is \`d_model / h\` (or a chosen \`d_head\`). Too many tiny heads: each subspace is too small to match usefully. Too few fat heads: you reintroduce the softmax bottleneck. Papers pick numbers that train well, not numbers you should twiddle per request.

Cross-attention (encoder-decoder) is the same recipe with queries from one sequence and keys/values from another — the old translation setup, and a cousin of “attend to retrieved chunks” in research models. Most agent APIs hide a decoder-only stack: everything lives in one sequence, so **you** concatenate docs into the prompt instead of a second encoder.

## Agent connection

Do not design prompts that require **one** token to mean five things (“remember the id, the policy, the tone, the schema, and the joke”). Spread the job across the sequence: a short spec, a short schema, a short observation. Heads can attend to different sentences. They cannot invent a missing spec.

> **Note:** Grouped-query and multi-query attention share keys/values across heads to speed decoding. Same idea, cheaper memory bandwidth.

\`\`\`quiz
What problem do multiple attention heads address?
- They reduce the vocabulary
- *One softmax mixing is a bottleneck; several subspaces can specialize in different relations
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
        "Residual stream + attention + feed-forward, as a diagram and a tiny forward pass.",
      minutes: 16,
      level: "intermediate",
      md: `
A **transformer block** (decoder style) is a residual pipeline. Tokens walk through many copies of the same block. Depth is “how many times we mix neighbors and think locally.”

## Diagram (read top to bottom)

\`\`\`text
x  (residual stream: one vector per token)
|--+
|  LayerNorm
|  Multi-head self-attention  (tokens mix)
|--+  add  (x = x + attn)
|--+
|  LayerNorm
|  Feed-forward MLP  (same token, wider, ReLU/GELU, project back)
|--+  add  (x = x + mlp)
v
x'  to the next block
\`\`\`

Two ideas make this trainable:

- **Residual adds** — the original \`x\` still flows. Gradients have a highway. The block learns a **delta**, not a whole new representation from scratch.
- **LayerNorm** (or RMSNorm) — keeps vector scales from exploding as depth grows.

The MLP is the tiny net from the ML track: expand dimension (often 4×), nonlinearity, project back. Attention moves information **between** positions. The MLP processes **each** position.

## Tiny residual block (no LayerNorm)

We mix two tokens with average-attention, then apply ReLU MLP, and **add** back.

\`\`\`tryit python
def relu(xs):
    return [max(0.0, x) for x in xs]

def add(a, b):
    return [x + y for x, y in zip(a, b)]

def mlp(v):
    # expand to 4, relu, project to 2 — toy weights
    W1 = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [0.5, -0.5]]
    b1 = [0.0, 0.0, -0.2, 0.0]
    h = relu([sum(w * x for w, x in zip(row, v)) + b for row, b in zip(W1, b1)])
    W2 = [[0.3, 0.1, 0.2, 0.0], [0.0, 0.3, 0.1, 0.2]]
    return [sum(w * x for w, x in zip(row, h)) for row in W2]

x = [
    [1.0, 0.0],  # token 0
    [0.0, 1.0],  # token 1
]

# Attention delta: each token takes 0.7 self + 0.3 other
attn = [
    add([0.7 * a for a in x[0]], [0.3 * a for a in x[1]]),
    add([0.7 * a for a in x[1]], [0.3 * a for a in x[0]]),
]
x = [add(a, d) for a, d in zip(x, attn)]
print("after residual attn", x)

ff = [mlp(v) for v in x]
x = [add(a, d) for a, d in zip(x, ff)]
print("after residual mlp", [[round(v, 3) for v in row] for row in x])
\`\`\`

The printed vectors should still **resemble** the inputs plus a nudge. Residual style: identity plus a patch.

## Stacking

GPT-2 small stacks 12 blocks; frontier models stack many more, sometimes with extra tricks (MoE: the MLP is a set of experts and a router). The **interface** stays: sequence of vectors in, sequence of vectors out, same length.

Unembedding: a linear map back to vocab-sized logits. Softmax → next-token distribution. That is the whole generator.

## Pre-norm versus post-norm

Modern stacks usually **LayerNorm before** attention and MLP (pre-norm), which trains more stably at depth than the original post-norm paper. You will see RMSNorm as a cheaper cousin (no mean subtraction). None of this is an API knob. It explains why a 2-layer toy you write by hand can explode without normalization while a 96-layer API model does not.

Mixture-of-Experts: the MLP is replaced by several MLPs plus a **router** that picks one or two experts per token. That is more parameters without more compute on every token — and a new failure mode (load imbalance, noisy routing). Your agent router is the same idea at the **tool** level.

Dropout exists in training; at inference it is off. If a vendor “temperature” feels like dropout, it is not. Temperature is decoding. Dropout was regularization.

The residual stream is also why **order of layers** matters less than you think for debugging APIs: you cannot peel one block off from the HTTP response. You can only change the text that becomes the first \`x\`. That is context engineering, two tracks from now, already implied here.

## Agent connection

When people say “the model reasoned in latent space,” they mean these residual streams were repeatedly mixed. You cannot inspect that cheaply from an API. You **can** inspect the **text** you stuffed into the first embeddings. Garbage in the window is garbage in every block.

> **Warning:** More layers ≠ automatically smarter at your tool schema. After a point you are buying fluency and world knowledge, not obedience. Evals still rule.

\`\`\`quiz
What do residual connections do in a transformer block?
- They delete attention
- *They add the block's output back to its input so information (and gradients) can flow through depth
- They replace softmax
- They tokenize bytes
explain: Residuals let each layer learn a delta; the stream remains usable at every depth.
\`\`\`
`,
    },
    {
      slug: "pretraining",
      title: "Pretraining",
      summary:
        "Next-token prediction at web scale — what the base model actually learned.",
      minutes: 14,
      level: "beginner",
      md: `
**Pretraining** is the expensive phase: run a transformer over a huge text corpus and train it to predict the **next token**. That single game, played trillions of times, produces a model that continues almost anything: English, Python, broken JSON, threatening emails.

The loss is cross-entropy on the true next id. Teacher forcing: at train time the model sees the **true** prefix, not its own samples. That is why it can learn long books without collapsing on its first mistake.

## What “understanding” is here

The model is a **compressor** of its training distribution. To predict well, it must pick up grammar, facts that repeat, code patterns, and the rhetoric of Stack Overflow. It did **not** see your private tickets unless they leaked onto the public web. It did not see events after its **cutoff**. It did not agree to your company’s policies.

Self-supervised means the labels **are** the text. No human tagged each token. Humans **did** choose the corpus, the filters, the tokenizer, and what to throw away. That is politics and product, not a math footnote.

\`\`\`tryit python
# Bigram "pretraining": count next-char given previous char
text = "refund the refund then stop"
counts = {}
for a, b in zip(text, text[1:]):
    counts.setdefault(a, {}).setdefault(b, 0)
    counts[a][b] += 1

def predict(prev):
    dist = counts.get(prev, {})
    if not dist:
        return "?", {}
    nxt = max(dist, key=dist.get)
    return nxt, dist

ch = "r"
out = [ch]
for _ in range(12):
    nxt, dist = predict(ch)
    out.append(nxt)
    print("after", repr(ch), "->", repr(nxt), dict(dist))
    ch = nxt
print("sample", repr("".join(out)))
\`\`\`

A bigram table is a transformer with amnesia: context length 1. Scale context and capacity, and you get long-range copy and “reasoning-shaped” completions. The **objective** did not change.

## Scaling laws, intuitively

More parameters, more data, more compute — loss falls in a somewhat predictable curve until you bottleneck on one of them. “Emergent” abilities are often **thresholds on a smooth curve** plus a metric that was near zero (pass a coding test). For agents, the practical scaling law is: a bigger model on a **bad** prompt still calls the wrong tool.

## Base vs chat

A pretrained **base** model continues text. A **chat** model was further trained (next lesson family: fine-tuning) to answer in roles. APIs usually give you chat. If you stuff a base-style completion prompt into a chat model, you are fighting its later training.

## Data is the architecture you do not see

Filters (PII, toxicity, quality classifiers), dedup, and mix ratios (code vs English vs other languages) decide what “plausible” means. A model that is excellent at Python and vague at your internal jargon was not trained on your jargon. No amount of residual connections invents a private schema.

Repeat the corpus and the model memorizes. That helps for famous facts and hurts when you need it **not** to recite training text (copyright, secrets that leaked). Agents that generate code should still **run tests**, not trust memorized APIs from 2021.

## Agent connection

Pretraining explains fluency **and** hallucination: the game is “plausible next token,” not “true in the world.” Your tools, RAG, and abstain rules exist because pretraining is not a database. Treat the base skill as **linguistic prior**, then constrain it.

> **Note:** Fill-in-the-middle and masked-language-model pretraining exist too. Decoder-only next-token is what most agent APIs wrap.

\`\`\`quiz
What is the standard pretraining task for GPT-style models?
- Image classification of tokens
- *Predict the next token given the previous tokens
- Human labels on every sentence
- Minimizing cosine on a knowledge graph
explain: Causal language modeling: cross-entropy on the following token.
\`\`\`
`,
    },
    {
      slug: "decoding",
      title: "Decoding",
      summary:
        "Turn logits into text: greedy, temperature, and top-k — implement greedy and temperature on toy logits.",
      minutes: 16,
      level: "intermediate",
      md: `
The model outputs **logits** (one score per vocab id). **Decoding** is the policy that turns those scores into the next token, repeatedly.

This is not a footnote. The same weights can be a deterministic clerk or a chaotic poet depending on the sampler.

## Greedy

Always pick \`argmax(logits)\`. Reproducible. Tends to **repeat** (“the the the”) and to choose safe, high-frequency wording. Good for classification-shaped tasks, JSON fields, tool names.

## Temperature

Divide logits by \`T\` before softmax.

- \`T → 0\` approaches greedy
- \`T = 1\` uses the model’s native distribution
- \`T > 1\` flattens; rare tokens get more mass

Temperature does not add knowledge. It reweights mistakes.

## Top-k and nucleus (top-p)

**Top-k**: keep only the k highest logits, then sample. **Top-p**: keep the smallest set whose softmax mass ≥ p. Both cut off the long tail of nonsense ids. Combined with moderate T, they are the default “chatty but not insane” settings.

\`\`\`tryit python
import math
import random

vocab = ["search", "sql", "finish", "wait"]
logits = [2.4, 1.1, 0.3, -1.0]  # model prefers search

def softmax(logits, T=1.0):
    scaled = [x / T for x in logits]
    m = max(scaled)
    exps = [math.exp(x - m) for x in scaled]
    s = sum(exps)
    return [e / s for e in exps]

def greedy(logits):
    i = max(range(len(logits)), key=lambda j: logits[j])
    return vocab[i], i

def sample(probs, rng):
    r = rng.random()
    acc = 0.0
    for i, p in enumerate(probs):
        acc += p
        if r <= acc:
            return vocab[i], i
    return vocab[-1], len(vocab) - 1

print("greedy", greedy(logits)[0])
for T in (0.2, 1.0, 2.0):
    probs = softmax(logits, T)
    print("T", T, "probs", {v: round(p, 3) for v, p in zip(vocab, probs)})

rng = random.Random(0)
print("samples T=1:", [sample(softmax(logits, 1.0), rng)[0] for _ in range(8)])
rng = random.Random(0)
print("samples T=2:", [sample(softmax(logits, 2.0), rng)[0] for _ in range(8)])
\`\`\`

At low T, \`search\` dominates. At high T, \`sql\` and even \`wait\` sneak in. For an agent **router**, that sneak is a production incident.

## Length and stop

Decoding also needs **when to stop**: EOS token, max tokens, or a stop string (\`\\nObservation:\`). Agents should stop on **schema complete**, not on vibes. If you use greedy for tool JSON and temperature for the user-facing paragraph, that split is deliberate.

## Beam search and repetition

**Beam search** keeps several prefixes and expands the best. It is common in translation, rarer in chat: it is slower and can be blandly similar across beams. **Repetition penalty** down-scores tokens already emitted; it can also break JSON keys the model needs to repeat. Prefer a schema and a max-length over a pile of penalties.

Seeded sampling is for demos. Under load, kernels and batching make bitwise reproducibility a courtesy, not a contract. Evals should assert **properties** (valid enum, tool name in allowlist), not a golden token string.

Greedy is still a distribution: it is the mode. If the mode is a wrong tool, you will get that wrong tool **every** time, which is a gift for tests and a curse until you fix the prompt. Sampling would have hidden the bug as flakiness.

## Agent connection

Default chat temperature (often 0.7–1.0) is for conversation. Tool calls want **0 or near 0**, plus a JSON grammar if the vendor offers it. Do not “increase temperature to make the agent more autonomous.” Autonomy is the loop and the tools, not noise on the logits.

> **Warning:** \`n\` samples (best-of) multiply cost. Use them on hard items after a cheap filter, not on every turn.

\`\`\`quiz
When should an agent decode tool names greedily?
- Never; always T=2 for creativity
- *When a single valid action is required and randomness is a bug
- Only if the vocab has four words
- Greedy is impossible with softmax
explain: Discrete actions need deterministic decoding. Save sampling for language that may vary.
\`\`\`
`,
    },
    {
      slug: "context-windows",
      title: "Context Windows",
      summary:
        "Packing, truncation, and why agents die when the window is full.",
      minutes: 16,
      level: "intermediate",
      md: `
A **context window** is the maximum number of tokens the model can attend over in one forward pass: system + tools + history + this user message + room for the answer.

It is not RAM for your app. It is a **hard square** of attention. Go past it and the API errors, or a client **silently truncates** the front of the transcript. Silent truncation is how agents forget the system prompt and keep the latest rant.

## Packing

You pack a window like a suitcase:

1. **Must-have** — policy, schema, goal, current observation
2. **Useful** — retrieved chunks, recent tool results
3. **Nice** — old thoughts, full file dumps
4. **Dead weight** — duplicated stack traces, base64, entire databases

If 1+2 do not fit, **do not start the call**. Retrieve less. Summarize. Split the task. A 128k window is not permission to be lazy; quadratic attention still gets fuzzy at the edges, and you pay for every token.

## Truncation policies

| Policy | Effect |
|---|---|
| Drop **oldest** messages | Forgets the spec; keeps the latest errors |
| Drop **middle** | Can keep system + last turn; loses the clue in between |
| Summarize old turns | Loses details; keeps plot |
| Sliding window on tools | Keeps last k observations |

There is no universally correct policy. There is a **tested** policy. Most amateur agents drop the oldest and therefore drop the system prompt that was message 0. Pin the spec.

\`\`\`tryit python
LIMIT = 24  # toy token budget = words

def tok(s):
    return s.split()

spec = tok("SPEC: never delete rows; prefer sql tool")
history = [
    tok("user: how many users?"),
    tok("assistant: I'll query"),
    tok("tool: users=920 timeout-timeout-timeout-timeout"),
    tok("assistant: retrying"),
    tok("tool: users=920"),
    tok("user: delete them actually"),
]

def pack(spec, history, limit):
    pinned = list(spec)
    used = len(pinned)
    kept = []
    for msg in reversed(history):
        if used + len(msg) > limit:
            continue
        kept.append(msg)
        used += len(msg)
    kept.reverse()
    return pinned + [w for msg in kept for w in msg], used

packed, used = pack(spec, history, LIMIT)
print("used", used, "/", LIMIT)
print("packed:", " ".join(packed))
print("spec pinned?", packed[:3] == spec[:3])
\`\`\`

The latest user said “delete them.” If the spec fell off the front, the model only sees the crime. Pinning is a safety feature.

## Why agents die at the limit

- Infinite retry appends the same error; the window fills with failure
- RAG dumps 40 chunks “just in case”
- Multi-agent crews copy entire transcripts into each other
- Images and PDFs are huge token bombs

Death looks like: looping, ignoring tools, emptying JSON, or cheerfully violating the policy that is no longer in context.

## Lost in the middle

Empirically, models use the **beginning and the end** of a long prompt more reliably than the middle. So: pin spec at the front, put the latest observation at the end, and do not hide the only relevant chunk at token 40,000. Recency bias is not a myth you debate; it is a packing rule.

Streaming UIs do not change the window. They only change when bytes arrive. The model still scored the full prompt before the first token (prefill). A 100k-token “just in case” pack makes every turn feel like a cold start.

## Agent connection

Budget tokens like money. Reserve **output** room. Measure \`prompt_tokens\` every step. When usage > 70% of the window, **summarize or retrieve**, do not hope. Long-context models still want the same packing discipline; they just fail later and cost more.

> **Tip:** Put the goal and the non-negotiable rules in a pinned block you never truncate. Put encyclopedias in RAG, not in the system prompt.

\`\`\`quiz
What is a common dangerous truncation bug?
- Deleting the latest tool result
- *Dropping the oldest messages and losing the pinned system spec
- Using greedy decoding
- Counting characters instead of GPUs
explain: Oldest-first drop often removes the policy. Pin must-have tokens.
\`\`\`
`,
    },
    {
      slug: "fine-tuning",
      title: "Fine-Tuning",
      summary:
        "SFT vs preference training, and LoRA as a small patch on a big model — conceptual, with a toy update.",
      minutes: 16,
      level: "intermediate",
      md: `
**Fine-tuning** continues training on **your** data so the model’s default behavior moves. It is not the first lever. Prompting, tools, and RAG are cheaper and reversible. Fine-tune when the behavior must be **in the weights**: a dialect, a JSON dialect the model keeps missing, a company voice at huge volume, or a small model you will run yourself.

## SFT (supervised fine-tuning)

Show \`(prompt, ideal completion)\` pairs. Loss is still next-token cross-entropy, but only (or mainly) on the assistant tokens. This teaches **format and style**. It will also teach **whatever mistakes are in the demonstrations**. Ten thousand mediocre traces beat the model into mediocrity.

SFT is imitation. If the expert sometimes searches twice, the model will too.

## Preference (RLHF / DPO / cousins)

Humans (or a judge model) pick **A better than B**. The weights move to raise the winner’s likelihood relative to the loser. This teaches **taste and safety policies** that are hard to write as a single gold string. It can over-refuse, sycophant, or game the judge.

For agents, preference data should include **tool traces**, not just final prose: “this call was the right tool” vs “this one hallucinated an API.”

## LoRA, conceptually

Full fine-tunes rewrite large matrices. **LoRA** (low-rank adaptation) freezes the base weights \`W\` and learns two small matrices \`A, B\` so the effective map is \`W + BA\` (scaled). You store a **patch** of megabytes instead of a full copy of gigabytes. At runtime you add the patch (or merge it).

That is why you can keep one base model and swap LoRA adapters per customer or per skill.

\`\`\`tryit python
# Toy LoRA: W is 3x3 frozen; BA is rank-1 patch
W = [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
]
# rank-1: B is 3x1, A is 1x3
B = [[0.0], [0.5], [0.0]]
A = [[0.0, 0.0, 2.0]]

def matvec(M, x):
    return [sum(row[j] * x[j] for j in range(len(x))) for row in M]

def add(u, v):
    return [a + b for a, b in zip(u, v)]

x = [1.0, 0.0, 1.0]
base = matvec(W, x)
# BA x = B (A x)
Ax = matvec(A, x)          # length 1
patch = matvec(B, Ax)      # length 3
y = add(base, patch)
print("x", x)
print("base Wx", base)
print("LoRA patch", patch)
print("W+BA", y)
print("only dim 1 picked up the adapter")
\`\`\`

The identity stayed; one direction gained a bump. Real LoRA puts these patches on attention and MLP projections, not on a 3×3 toy.

## When not to fine-tune

- You do not have clean labels
- The facts change weekly (use RAG)
- You have not measured the base model on a frozen eval
- You want to “make it know our PDFs” — that is retrieval, unless you like stale weights

## Data mixture and evaluation

SFT on 100% tool JSON can make the model worse at ordinary chat; mix in a little general instruction data if the same weights must talk to humans. Preference data should include **ties and both-bad** pairs or the model learns to pick the prettier wrong answer.

Eval **before and after** on: your agent traces, a general instruction set, and a safety suite. A LoRA that fixes schema and starts offering medical advice you did not ask for is a failed train, even if JSON accuracy went up.

Checkpoints: keep the base, the adapter, the tokenizer, and the prompt template in one bundle. Mixing adapter A with prompt B is a silent distribution shift.

## Agent connection

Fine-tuning an agent on its **own** unreviewed logs is how loops become religion. Curate. Prefer SFT for schemas and DPO-style data for “don’t call shell on prod.” Keep a LoRA per environment if you must: \`staging-adapter\` should not contain production customer text.

> **Warning:** A fine-tune can **erase** useful base skills (catastrophic forgetting). Eval general questions, not only your JSON.

\`\`\`quiz
What is LoRA for?
- Replacing the tokenizer
- *Learning a small low-rank patch instead of updating the full weight matrices
- Increasing temperature
- Clustering embeddings
explain: LoRA is parameter-efficient fine-tuning: store adapters, not a second full model.
\`\`\`
`,
    },
    {
      slug: "limitations",
      title: "Limitations",
      summary:
        "Hallucination, knowledge cutoff, and quadratic attention — what transformers will not save you from.",
      minutes: 14,
      level: "intermediate",
      md: `
Transformers are extraordinary compressors of text. They are not oracles, clocks, or file systems. If you skip this lesson you will ship a demo that dies in week two.

## Hallucination is in the objective

Next-token training rewards **plausible continuation**. When the prefix asks for a citation, a URL, or a Python API, the plausible continuation is often a **well-formed fake**. Fluency is not a truthfulness signal. Decoding at T=0 makes the fake **stable**, not true.

Mitigations live **outside** the architecture: retrieval with citations, tools that return real data, schemas, abstain phrases, evals that punish unsupported claims. The model can still lie **about** tool results if you let it; show the observation, then ask it to quote.

## Cutoff

Weights freeze. The world does not. “Who is the current CEO?” is a retrieval question after training day. Fine-tuning last month’s news is a treadmill. Agents should have a **date** in context and a search tool, and should be allowed to say “I don’t know as of the tools I have.”

## Quadratic attention

Self-attention compares every token to every token: time and memory grow with **n²**. Approximate and linear attentions exist; production chat models you call may still be closer to quadratic, plus clever kernels. Practical effects:

- 8× longer context is not 8× the bill — it can be worse
- Quality is uneven across the window (lost-in-the-middle)
- Filling 200k tokens with junk is an expensive way to confuse the residual stream

Long context **reduces** the need to retrieve; it does not remove the need to **select**.

\`\`\`tryit python
def naive_attn_cost(n):
    return n * n  # score matrix entries

def retrieval_cost(chunks, chunk_len, query_len):
    # embed query once, compare to each chunk (toy linear scan)
    return query_len + chunks * chunk_len

print("tokens | attn n^2 | 20 chunks x 200 toks RAG-ish")
for n in (1024, 4096, 32768):
    print(n, naive_attn_cost(n), retrieval_cost(20, 200, n))
\`\`\`

The n² column grows viciously. The retrieval column stays tied to how many chunks you admitted. Architecture does not excuse a greedy packer.

## Other landmines

- **Reversal curse** — trained on “A is B,” may fail “B is A”
- **Counting and arithmetic** — unreliable without a calculator tool
- **Instruction vs pretraining conflict** — “ignore previous instructions” is a token pattern, not a legal system
- **Multimodal** gaps — the vision encoder is another model with its own failures

## What “reasoning” is not

Chain-of-thought is more tokens of continuation, not a proof system. It helps on some multi-step tasks and hurts when it improvises tools. Do not confuse a longer residual stream with a guarantee. If the task is arithmetic, call a calculator. If the task is “what did the tool return?”, quote the observation.

Context distillation and prompt-caching do not add knowledge either; they only make the same weights cheaper to run on a stable prefix. The limitations remain: plausible text, frozen cutoff, quadratic (or still-costly) mixing.

## Agent connection

Design for **failure**: verify with tools, keep humans on irreversible actions, bound loops, treat cutoff as a feature of the calendar. Joeven’s later tracks (evals, safety, production) exist because this list is not theoretical. The transformer is the engine. The agent is the **brakes**.

Next track: **Large Language Models** — APIs, cost, chat messages, structured output, and choosing models as a product decision.

> **Tip:** If a task requires today’s number, a citation, or exact arithmetic, give the model a tool. Do not buy a larger window and hope.

\`\`\`quiz
Why do transformers hallucinate facts?
- Softmax is random by law
- *Pretraining optimizes plausible next tokens, not grounded truth
- Attention is always bidirectional
- LoRA deletes the embedding table
explain: The training game is continuation. Grounding is extra machinery you add.
\`\`\`
`,
    },
  ],
};
