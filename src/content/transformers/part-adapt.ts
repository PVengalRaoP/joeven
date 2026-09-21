import type { RawLesson } from "@/lib/types";

export const tfAdapt: RawLesson[] = [
  {
    slug: "fine-tuning",
    title: "Fine-Tuning",
    summary:
      "Continue training on your data. SFT copies demonstrations. Preference training copies taste. Prompting is cheaper.",
    minutes: 21,
    level: "intermediate",
    md: `
**Fine-tuning** continues training on **your** data so the model’s default behavior moves. It is not the first lever. Prompting, tools, and retrieval are cheaper and reversible. Fine-tune when the behavior must live **in the weights**: a dialect, a JSON shape the model keeps missing, a company voice at huge volume, or a small model you will run yourself.

The pretrained game is still next-token. Fine-tuning does not replace that game. It changes which continuations score high **on your prefixes**. If your demonstrations are mediocre, you will beat the model into mediocrity. If your facts change weekly, you will ship stale weights. If you never measured the base model on a frozen eval, you will not know whether the tune helped.

This lesson is full-weight (or full-last-layers) continuation: **SFT** and **preference** training. The next lesson is LoRA: the same idea as a small patch. Limitations after that are what neither will save you from.

## A wrong picture

A wrong picture is: “fine-tune so it knows our PDFs.” That is retrieval, unless you like stale weights. Documents that change should not be burned into matrices. Show them at call time.

Another wrong picture is: “SFT teaches the model to be right.” SFT teaches **imitation**. If the expert sometimes searches twice, the model will too. If the traces contain a leaked key, the model will complete toward leaked keys.

A third wrong picture is: “preference training is a moral compass.” Humans (or a judge model) pick A better than B. The weights raise the winner relative to the loser. This can over-refuse, flatter, or game the judge. It is taste. It is not a proof of safety.

## SFT (supervised fine-tuning)

Show \`(prompt, ideal completion)\` pairs. Loss is still next-token cross-entropy, usually only on the **assistant** tokens (not on the user prefix). This teaches **format and style**. It will also teach **whatever mistakes are in the demonstrations**. Ten thousand mediocre traces beat the model into mediocrity.

SFT is imitation. Masking the loss on user tokens is so the model does not spend capacity copying the user’s typos as if they were the target. You still need the prefix; you just do not ask the model to predict it.

Do not fine-tune if you do not have clean labels, if the facts change weekly (use retrieval), if you have not measured the base model on a frozen eval, or if you want to “make it know our PDFs.”

SFT on 100% tool JSON can make the model worse at ordinary chat. Mix in a little general data if the same weights must talk to humans. Eval **before and after** on your traces, a general instruction set, and a safety suite.

## Preference (RLHF / DPO / cousins)

Humans (or a judge model) pick **A better than B**. The weights move to raise the winner’s likelihood relative to the loser. This teaches **taste and safety** that are hard to write as a single gold string.

For agents, preference data should include **tool traces**, not just final prose: “this call was the right tool” vs “this one invented an API.” If you only rank paragraphs, you will get nicer paragraphs that still call the wrong tool.

RLHF classically trains a reward model, then scores samples. DPO-style methods skip some of that machinery and push directly on pairs. You do not need the acronyms to use the idea: **pairs of completions, one preferred**. Garbage pairs become garbage taste.

It can over-refuse, flatter, or game the judge. Eval those failure modes. A model that never calls \`sql\` because a judge hated risk is not a safe agent. It is a broken router.

## A tiny example in words

Toy vocab: search, sql, finish. Logits all 0.2. Gold is sql (index 1). Cross-entropy is high while the distribution is flat. Bump the gold logit. Loss drops. Argmax becomes sql. Real SFT is this idea on millions of tokens, with a small learning rate, on top of a frozen pretrain.

That bump is also how mistakes get burned in: if gold is the **wrong** tool in the dataset, you just made the wrong mode.

## Bump the gold logit (toy SFT)

Lists of numbers. Cross-entropy by hand. Print before and after.

\`\`\`viz bars
title Toy SFT: bump the gold logit
bar search,0.22,0
bar sql,0.56,2
bar finish,0.22,1
caption After the bump, sql is the mode. Imitation copies demos — including mistakes in the traces.
\`\`\`

\`\`\`tryit python
import math

vocab = ["search", "sql", "finish"]
logits = [0.2, 0.2, 0.2]
gold = 1

def ce(logits, k):
    m = max(logits)
    exps = [math.exp(z - m) for z in logits]
    z = sum(exps)
    p = exps[k] / z
    return -math.log(max(p, 1e-12)), p

loss0, p0 = ce(logits, gold)
print("before loss", round(loss0, 3), "p_gold", round(p0, 3), "argmax", vocab[max(range(3), key=lambda i: logits[i])])
logits[gold] += 1.5
loss1, p1 = ce(logits, gold)
print("after loss", round(loss1, 3), "p_gold", round(p1, 3), "argmax", vocab[max(range(3), key=lambda i: logits[i])])
print("logits", [round(x, 3) for x in logits])
print("SFT is this idea on millions of tokens")
\`\`\`

The gold token became the mode. Loss fell. Probability of sql rose. That is imitation of one id. Imagine 50,000 traces that all retry a timed-out tool twice: you just taught a religion.

If you bumped the wrong index, argmax would move to a mistake. Curate. Do not dump production logs into SFT unreviewed.

## When not to fine-tune

- Facts that move (prices, staff, tickets) — retrieve.
- A schema you can enforce with grammar and a better prompt — try that first.
- A safety rule that must be auditable — put it in code, not only in weights.
- No frozen eval — you cannot see forgetting.
- Tiny dirty data — you will overfit noise.

Catastrophic forgetting: a fine-tune can **erase** useful base skills. Eval general questions, not only your JSON. Mix a little general data if the same weights must stay a general assistant.

Keep tokenizer, prompt template, and weights in **one bundle**. Mixing adapter A with prompt B is a silent shift. The special-tokens lesson is still true after you train.

## How agents use this

Fine-tuning an agent on its **own** unreviewed logs is how loops become religion. Curate. Prefer SFT for schemas and preference data for “don’t call shell on prod.” Keep tokenizer, prompt template, and weights in one bundle.

A tune that fixes JSON and starts offering medical advice you did not ask for is a failed train, even if schema accuracy went up. Eval both.

Do not skip prompting, tools, and retrieval because fine-tuning sounds more serious. Serious is **measured**. Fine-tuning is expensive to reverse. Prompts you can revert today.

- **SFT:** copies demos, including mistakes.
- **Preference:** copies taste; can game the judge.
- **PDFs:** usually retrieval, not weights.
- **Bundle:** tokenizer + template + weights.
- **Eval:** your traces, general skill, safety — before and after.

> **Warning:** A fine-tune can erase useful base skills (catastrophic forgetting). Eval general questions, not only your JSON.

\`\`\`quiz
What does SFT mainly copy?
- The KV cache
- *The demonstrations you showed: format, style, and any mistakes in them
- The retrieval index
- Temperature
explain: Supervised fine-tuning is next-token imitation on your pairs. Garbage demos become garbage defaults.
\`\`\`
`,
  },
  {
    slug: "lora",
    title: "LoRA",
    summary:
      "Freeze the big matrix. Learn a small low-rank patch. Store adapters, not a second full model.",
    minutes: 20,
    level: "intermediate",
    md: `
Full fine-tunes rewrite large matrices. **LoRA** (low-rank adaptation) freezes the base weights \`W\` and learns two small matrices \`A\` and \`B\` so the effective map is \`W + B A\` (times a scale). You store a **patch** of megabytes instead of a full copy of gigabytes. At runtime you add the patch (or merge it).

That is why you can keep one base model and swap LoRA adapters per customer or per skill.

**Rank** is a hyperparameter: rank 8 is a thin patch; rank 64 is thicker and more able to overfit. LoRA usually sits on attention and MLP projections, not on the whole net. You are not “training a new transformer.” You are training a **delta** in a few maps, residual-style, in parameter space.

Checkpoints: keep the base, the adapter, the tokenizer, and the prompt template together. An adapter trained for model X on tokenizer Y will look “broken” on model Z — it is in the wrong space.

## A wrong picture

A wrong picture is: “LoRA replaces the tokenizer.” It does not. It patches linear maps. The vocab and merge list stay those of the base (unless you did something exotic you should not).

Another wrong picture is: “rank 64 is always better.” Thicker patches fit more, including noise. Rank is a capacity knob. Start small. Eval. Grow only if the eval says so.

A third wrong picture is: “a LoRA that raises JSON accuracy is done.” If it also starts offering medical advice you did not ask for, the train failed. Side effects are part of the eval. Same as full SFT, cheaper to store.

## Low rank in words

A full matrix \`W\` might be 4096 by 4096. A rank-\`r\` patch is \`B\` (4096 by \`r\`) times \`A\` (\`r\` by 4096). If \`r\` is 8, you store two thin matrices, not the square. The product \`B A\` can only express a limited family of updates. That limitation is the point: fewer parameters, less to overfit, less to ship.

Forward pass: compute \`W x\` as usual (frozen), compute \`A x\`, then \`B\` times that, add. Or merge \`W' = W + B A\` into one matrix for serving if you do not need to swap adapters live.

**QLoRA** loads the base in 4-bit and still trains the small patch. Same idea, less memory. The math of the adapter does not change. The base is quantized; the patch is usually higher precision.

Where to attach: typically the query/value (and often other) projection matrices inside attention, plus MLP maps. Papers differ. You will not pick this per request. You pick it when you train.

## A tiny example in words

\`W\` is a 3 by 3 identity. \`x = [1, 0, 1]\`. Base \`W x = [1, 0, 1]\`. A rank-1 patch: \`A\` is 1 by 3, \`B\` is 3 by 1. If \`A\` looks at the last slot and \`B\` writes into the middle slot, only dimension 1 picks up the adapter. The identity stayed; one direction gained a bump.

That is LoRA: freeze the big map, learn a small route that adds a delta.

## Frozen W plus a rank-1 patch

Lists of numbers. Hand matrices. Print base, patch, and sum.

\`\`\`viz flow
title Frozen W plus a small patch
layout lr
node W Frozen W
node A Thin A
node B Thin B
node y Wx plus BA
edge W y
edge A B
edge B y
caption Store a megabyte patch, not a second full model. Rank is a capacity knob. Start small.
\`\`\`

\`\`\`tryit python
W = [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
]
B = [[0.0], [0.5], [0.0]]
A = [[0.0, 0.0, 2.0]]

def matvec(M, x):
    return [sum(row[j] * x[j] for j in range(len(x))) for row in M]

def add(u, v):
    return [a + b for a, b in zip(u, v)]

x = [1.0, 0.0, 1.0]
base = matvec(W, x)
Ax = matvec(A, x)
patch = matvec(B, Ax)
y = add(base, patch)
print("x", x)
print("base Wx", base)
print("Ax", Ax)
print("LoRA patch", patch)
print("W+BA", y)
print("only dim 1 picked up the adapter")
x2 = [1.0, 0.0, 0.0]
print("x2", x2, "patch", matvec(B, matvec(A, x2)), "y", add(matvec(W, x2), matvec(B, matvec(A, x2))))
\`\`\`

The identity stayed; one direction gained a bump. \`x2\` that does not touch the last slot should get a zero patch. The adapter only fires when \`A\` sees the feature it was trained to see. Real LoRA is this on bigger maps, with learned numbers, many ranks, many layers.

If you loaded this patch onto a different \`W\` shape, \`matvec\` would crash. That is the “wrong base model” error in miniature.

## Swapping adapters

One base, many patches: staging vs production, customer A vs customer B, “SQL dialect” vs “polite chat.” Do not mix a production adapter that saw customer text into a staging toy. Do not mix an adapter trained on model family X onto family Z.

Merging a patch into \`W\` is convenient when you serve one skill. Keeping patches separate is convenient when you swap. Either way the **bundle** is base + adapter + tokenizer + template.

You can often get the same schema win with constrained decoding and a better prompt. LoRA earns its keep at volume, latency, or a style you cannot prompt into a small model. Try the cheap lever first. Measure.

## Common mistakes

Shipping an adapter without the base commit hash. Six weeks later nobody knows which \`W\` it was trained against. The patch loads, the shapes match, the generations are garbage because one layer width changed. Put the base id in the adapter filename and in the eval log.

Training on a mix of two chat templates. The special-token ids differ. The adapter learns a dialect that is neither wrap. At run time you pick one template and lose half the gain. Freeze the wrap before the first step of training.

Using rank as a status symbol. Rank 64 on 200 messy traces will memorize the mess. Rank 8 on 5,000 clean traces will often emit the schema more reliably. Capacity is not quality. Quality is the frozen eval plus a side-effect suite.

Merging a LoRA into \`W\` and then applying a second LoRA that was trained against the unmerged base. The deltas were not meant to stack that way. If you must combine skills, train a single patch on mixed data, or keep them as separate loads you do not add blindly.

Forgetting that QLoRA’s 4-bit base is an approximation. Tiny numeric drift is normal. Huge behavior drift means the quantization or the pack is wrong. Compare a short greedy completion on the full-precision base plus adapter versus the 4-bit path before you ship.

## How agents use this

A LoRA per environment is reasonable: a staging adapter should not contain production customer text. A LoRA that fixes schema and starts offering medical advice you did not ask for is a failed train, even if JSON accuracy went up. Eval both.

Store the bundle. Mixing adapter A with prompt B is a silent shift (special tokens still matter). Mixing adapter A with tokenizer C is a broken lookup table.

- **Patch, not a second full model:** \`W + B A\`.
- **Rank:** capacity vs overfit.
- **Bundle:** base, adapter, tokenizer, template.
- **Swap:** one frozen base, many skills.
- **Eval side effects:** schema wins that break safety are failures.

> **Note:** You can often get the same schema win with constrained decoding and a better prompt. LoRA earns its keep at volume, latency, or a style you cannot prompt into a small model.

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
    minutes: 22,
    level: "intermediate",
    md: `
Transformers are extraordinary compressors of text. They are not oracles, clocks, or file systems. If you skip this lesson you will ship a demo that dies in week two.

The last lessons taught you how to **adapt** weights. This lesson is what adaptation will not buy. Hallucination lives in the **objective**. Cutoff lives in the **calendar**. Quadratic attention lives in the **architecture**. You already met each piece. Here they are as landmines.

The next track (hosted language-model products) is APIs, cost, and chat messages. Stay here until the machine is clear: tokens, attention, decoding, adapters. Then go.

## A wrong picture

A wrong picture is: “a larger window removes retrieval.” Long context **reduces** the need to retrieve. It does not remove the need to **select**. Filling 200k tokens with junk is an expensive way to confuse the residual stream.

Another wrong picture is: “T=0 means true.” Decoding at temperature 0 makes the fake **stable**, not true. Greedy hallucination is a reproducible lie. That is worse for tests that check fluency, better for tests that check facts — you will fail every time until you ground.

A third wrong picture is: “chain-of-thought is a proof system.” It is more tokens of continuation. If the task is arithmetic, call a calculator. If the task is “what did the tool return?”, quote the observation.

## Hallucination is in the objective

Next-token training rewards **plausible continuation**. When the prefix asks for a citation, a URL, or a Python API, the plausible continuation is often a **well-formed fake**. Fluency is not a truthfulness signal.

Mitigations live **outside** the architecture: retrieval with citations, tools that return real data, schemas, abstain phrases, evals that punish unsupported claims. The model can still lie **about** tool results if you let it; show the observation, then ask it to quote.

Fine-tuning on facts helps until the facts move. LoRA on a polite style does not install a ledger. Preference training can punish “I don’t know” if judges liked confident tone. Then you get **confident** fakes. Measure that.

## Cutoff

Weights freeze. The world does not. “Who is the current CEO?” is a retrieval question after training day. Agents should have a **date** in context and a search tool, and should be allowed to say “I don’t know as of the tools I have.”

Adapters do not update the news. If you need today’s number, give a tool. Do not buy a larger window and hope.

## Quadratic attention

Self-attention compares every token to every token: time and memory grow with **n²**. Practical effects: longer context is not a linear bill; quality is uneven across the window; filling 200k tokens with junk is an expensive way to confuse the residual stream.

The KV cache and prefill lessons were this bill as latency. Here it is also **quality**: softmax dilutes; the middle fades. Architecture does not excuse a greedy packer.

## Other landmines

- **Reversal curse:** trained on “A is B,” may fail “B is A.”
- **Counting and arithmetic** without a calculator: tokens are a bad abacus.
- **“Ignore previous instructions”** as a token pattern, not a legal system. The model continues a jailbreak if that continuation was plausible and you did not constrain the loop.
- **Copy errors:** UUIDs split into ugly tiles; attention drowned; positions in the dip.
- **Forgetting after SFT:** you raised JSON skill and lost a base skill. Eval general questions.

## A tiny example in words

Naive attention cost \`n * n\`. A retrieval-shaped cost is query length plus \`chunks * chunk_len\`. As \`n\` grows, the square column becomes vicious. The retrieval column stays tied to how many chunks you admitted. That is why “just paste the wiki” is not a strategy even when the brochure says 128k.

## n squared vs a small retrieved set

Print both columns. Lists of integer costs. No extra libraries.

\`\`\`viz plot
title n squared vs a small retrieved set
xlabel tokens n
ylabel cost
fn square x*x 500 8000
fn retrieve 20*200+x 500 8000
caption The square becomes the monster. Selected chunks stay a small add. Architecture does not excuse a greedy packer.
\`\`\`

\`\`\`tryit python
def naive_attn_cost(n):
    return n * n

def retrieval_cost(chunks, chunk_len, query_len):
    return query_len + chunks * chunk_len

print("tokens | attn n^2 | 20 chunks x 200 toks retrieve-ish")
for n in (1024, 4096, 32768):
    print(n, naive_attn_cost(n), retrieval_cost(20, 200, n))
print("n^2 grows faster than selected chunks")
print("even at 32768, 20*200 is a small add; the square is the monster")
\`\`\`

The n² column grows viciously. The retrieval column stays tied to how many chunks you admitted. Architecture does not excuse a greedy packer.

If you retrieve 400 chunks of 500 tokens, you built a new monster. Selection still matters. Top-k exists for a reason.

## What adapters will not fix

A LoRA cannot make next-token training into a database. It can make the fake more on-brand. That is worse if you were hoping for truth.

A longer window cannot make cutoff into a news feed. It can hold a search result you fetched. Fetch it.

A bigger model cannot make n² cheap. It can make each pair more expensive. Pack anyway.

Preference training cannot make “I don’t know” popular if judges punished humility. If your taste data likes confidence, you will buy confident errors. Read the pairs before you train.

None of this says transformers are useless. It says the engine has a job: continue text. The agent has a job: constrain that continuation with tools, packing, decode policy, and evals. Mixing up those jobs is how week-two demos die.

## Design for failure

Verify with tools. Keep humans on irreversible actions. Bound loops. Treat cutoff as a feature of the calendar. The transformer is the engine. The agent is the **brakes**.

If a task needs today’s number, a citation, or exact arithmetic, give the model a tool. Do not buy a larger window and hope. Do not buy a LoRA and hope. Do not buy temperature 0 and hope.

Stay in this track’s lane: you now know why those hopes fail (objective, positions, softmax, n²). The next track is how hosted products wrap the engine. The brakes are still yours: packing, decoding, tools, evals.

## How agents use this

Design for **failure**: verify with tools, keep humans on irreversible actions, bound loops, treat cutoff as a feature of the calendar. Quote observations. Do not let the model narrate a tool result you never showed.

When something fails, name the landmine: hallucination (objective), cutoff (calendar), dilution (softmax / n²), reversal (A is B), arithmetic (no calculator), truncation (window). Named landmines beat “the model is being weird.”

- **Ground:** tools and retrieval, then quote.
- **Date:** cutoff is real; search is the patch.
- **Select:** do not fill the square with junk.
- **Arithmetic:** calculator.
- **Brakes:** loop bounds, human gates, evals.

> **Tip:** If a task needs today’s number, a citation, or exact arithmetic, give the model a tool. Do not buy a larger window and hope.

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
  {
    slug: "lost-in-middle",
    title: "Lost in the Middle",
    summary:
      "Models use the start and the end of a long prompt more reliably than the middle. Pack for that.",
    minutes: 19,
    level: "intermediate",
    md: `
Empirically, transformers use the **beginning and the end** of a long prompt more reliably than the **middle**. The brochure’s 128k tokens are not 128k equal slots.

So: pin the spec at the front, put the latest observation at the end, and do not hide the only relevant chunk at token 40,000. Recency bias is not a myth you debate. It is a packing rule.

Attention mass **dilutes** over a long row. Positions in the middle are also a region the model saw less often in training (or interpolates worse). Both stories point at the same engineering move: **shorten and order**.

You met positions, attention, and the context window. This lesson is those three as a **U-shape**: first and last matter more. Packing is how agents live with that shape.

## A wrong picture

A wrong picture is: “please read everything carefully” flattens the U. It does not. Editing the sequence does. Extra English is more tokens in the same dip.

Another wrong picture is: “if I dump 20 chunks, the gold one will be found because attention can look anywhere.” In principle it can. In practice the gold chunk in slot 17 of 20 is a different system from the same chunk in slot 2 or next to the latest user line. Eval both the text **and** the position.

A third wrong picture is: “the middle is useless, so delete it always.” The middle can still help. It is just **less reliable**. Prefer shorter windows. When you must keep a long one, repeat the goal at the end and put gold evidence near an end, not only in the fog.

## Why a U

**Softmax dilution:** one query’s weights sum to 1. More keys, smaller typical weights, more competition. Needles drown in hay.

**Position geometry:** rotary and absolute schemes are not even across a 100k window. Training lengths cluster. The middle of a packed window is often a worse neighborhood.

**Recency and primacy:** humans have this too; the architecture adds its own version. You do not need to pick one theory to pack well. You need: **ends are louder**.

Lost-in-the-middle is documented on retrieval-style tasks: a fact placed in the middle is used less than the same fact placed at the start or end. Your agent traces are retrieval-style tasks. Tool dumps are documents. Pack them like documents.

## A tiny example in words

Chunks: spec, old-1, old-2, GOLD, old-3, latest. A toy score that likes the ends (distance to the nearest end) will rank spec and latest above GOLD. Move GOLD next to latest. The toy score rises. Real models are not this cartoon, but the packing move is the same.

Rerank, then place the top chunks at the end (or right after the spec), not in a random dump.

## A score that likes ends

Lists of names and numbers. Print ranks before and after the move.

\`\`\`viz bars
title A score that likes the ends
bar spec,1.00,0
bar old-2,0.33,1
bar GOLD,0.33,2
bar latest,1.00,0
caption Spec and latest win. Gold in the middle fades. Move gold next to the latest observation.
\`\`\`

\`\`\`tryit python
chunks = ["spec", "old-1", "old-2", "GOLD", "old-3", "latest"]

def end_bias(xs):
    n = len(xs)
    scored = []
    for i, name in enumerate(xs):
        dist_end = min(i, n - 1 - i)
        score = 1.0 / (1.0 + dist_end)
        scored.append((score, i, name))
    scored.sort(key=lambda t: (-t[0], t[1]))
    return scored

print("if the model likes ends:")
for s, i, name in end_bias(chunks):
    print(round(s, 3), "idx", i, name)
print("GOLD is buried; spec and latest win the toy score")
moved = ["spec", "old-1", "old-2", "old-3", "GOLD", "latest"]
print("move GOLD next to latest:")
for s, i, name in end_bias(moved):
    print(round(s, 3), "idx", i, name)
print("repeat goal at end:")
repeated = ["spec", "old-1", "old-2", "GOLD", "old-3", "latest", "spec"]
for s, i, name in end_bias(repeated):
    print(round(s, 3), "idx", i, name)
\`\`\`

Moving the gold chunk toward the end raises its toy score. Repeating spec at the end gives the policy two loud seats. Real models are not this cartoon, but retrieval papers keep finding the same U-shape: first and last matter more.

If you must keep a long window, **repeat** the goal at the end (“remember: never delete rows”) instead of assuming the opening spec is still loud. Pinning the front **and** repeating at the end is allowed. Hiding GOLD at index 40,000 is not.

## Eval is position-sensitive

Eval retrieval with (query, must-include-chunk) **and** the position you stuffed it. A gold chunk in slot 17 of 20 is a different system from the same chunk in slot 2. Log the index. When quality drops, check whether a packer started burying gold.

Rerankers exist to pick the few chunks that deserve an end seat. Dumping all 20 “just in case” is how gold ends up in the dip. The n² lesson said selection matters for cost. This lesson says selection matters for **being used**.

## Common packing failures

A “fair” round-robin of twenty equally long chunks. Fair to the packer. Unfair to GOLD. Fairness is not a softmax property.

Putting the spec in the middle because “the user should see tools first.” Tools first means the policy sits in the dip. Pin the policy. Tools can follow. Latest observation last.

A sliding window that keeps the last k *messages* without counting tokens. Five huge tool dumps can be most of the window. The spec pin is still there, but the gold chunk from retrieval is gone. Count tiles. Cap tool dumps.

Repeating the entire spec five times “for emphasis.” You just spent five copies of the pin and pushed evidence toward the middle. Repeat a **short** rule at the end, not a novel.

Evaluating retrieval only on “was the chunk in the prompt at all.” In-the-prompt-in-the-middle is not the same system as in-the-prompt-at-the-end. Log the index. Fail a case if GOLD sat in the dip when you claimed the retriever worked.

## How agents use this

Eval retrieval with (query, must-include-chunk) **and** the position you stuffed it. Rerank, then place the top chunks at the end (or right after the spec), not in a random dump.

Put the latest tool observation near the end. Pin the spec at the front. Repeat the non-negotiable rule at the end when the window is long. Do not rely on a middle needle.

- **U-shape:** start and end are used more reliably.
- **Move gold:** toward an end after rerank.
- **Repeat goal:** last tokens can restate the spec.
- **Eval position:** same chunk, different index, different system.
- **Do not prompt the U away:** edit the sequence.

> **Warning:** Adding “please read everything carefully” does not flatten the U-shape. Editing the sequence does.

\`\`\`quiz
Where should the latest tool observation usually sit in a long prompt?
- In the middle, to be fair to all tokens
- *Near the end (and keep the spec pinned at the front)
- Only inside the embedding table
- After the EOS token
explain: Start and end are used more reliably. Pin policy first; put fresh evidence last.
\`\`\`
`,
  },
  {
    slug: "scaling",
    title: "Scaling",
    summary:
      "Bigger models, more data, more compute usually lower loss. They do not usually add obedience to your schema.",
    minutes: 20,
    level: "intermediate",
    md: `
**Scaling laws** say: if you grow parameters, data, and compute together, next-token loss tends to fall on a smooth curve. Skip one of the three and you bottleneck.

“Emergent” skills are often that curve crossing a **threshold** on a harsh metric (pass a coding test that was near 0%). The underlying loss was already sliding.

For agents, the practical law is different: a bigger model on a **bad** prompt, a stale index, or a fuzzy goal still calls the wrong tool. You are buying fluency, world knowledge, and sometimes better tool *use* — not a free skip of evals, packing, or greedy decode for actions.

This lesson is size. It is not “always buy the largest.” It is “know what size predicts, and what it does not.”

## A wrong picture

A wrong picture is: “bigger always follows company policy.” Policy is prompts, tools, fine-tunes, and code. Scale does not install your handbook.

Another wrong picture is: “emergence means a phase change in the universe.” Often your **metric** was a cliff (pass/fail JSON, pass/fail code test) sitting on a smooth loss curve. The table looks jumpy. The loss did not jump.

A third wrong picture is: “a frontier model with no tools beats a small model with tools on arithmetic and ‘what is in this file.’” Hands beat scale on those jobs. Scale is not a substitute for tools.

## Three knobs together

**Parameters:** width and depth (and vocab). More knobs can fit more patterns.

**Data:** more tokens, better filtered. Repeating a small crawl is not the same as new data.

**Compute:** how long you train, at what batch. You can waste a huge model on too little data, or starve a small model that could have trained longer.

Laws are **trends**, not promises for your JSON schema. They predict **loss** on the pretraining game. Your product metric (valid tool calls, grounded answers) is a different curve. Measure that curve on a frozen eval.

Mixture-of-Experts scales **parameters** faster than **compute**: a router picks one or two expert MLPs per token. Failure mode: the router ignores an expert, or all traffic hits one expert. Your tool router can fail the same way. You met this in the block lesson. Here it is a scaling trick.

## A tiny example in words

Cartoon: \`loss ~ 3 * N^(-0.1)\` with \`N\` in millions of parameters. Loss slides slowly. If your skill is “pass tool JSON” when loss drops below 1.7, the table looks like a jump: no, no, no, yes. The loss did not jump. Your **metric** was a cliff.

Do not plan a company around the jump. Plan around the eval you will actually run.

## Smooth loss, jumpy pass/fail

Print the cartoon. Lists of numbers. No extra libraries.

\`\`\`viz plot
title Smooth loss, jumpy pass/fail
xlabel params (millions)
ylabel toy loss
fn loss 3*pow(x,-0.1) 1 1000
hline 1.7 JSON cliff
caption Loss slides slowly. If your metric is a cliff, the table looks like a jump. Measure the real eval.
\`\`\`

\`\`\`tryit python
def loss(n_million):
    return 3.0 * (n_million ** -0.1)

print("params M | toy loss | pass tool JSON if loss < 1.7")
for n in (1, 10, 100, 1000):
    L = loss(n)
    flag = "yes" if L < 1.7 else "no"
    print(n, round(L, 3), flag)
print("smooth loss, sudden-looking skill if your metric is a cliff")
print("loss(50M)", round(loss(50), 3), "loss(200M)", round(loss(200), 3))
\`\`\`

The table looks like a jump. The loss did not jump. Your **metric** was a cliff.

Change the threshold to 2.0 and the jump moves. That is how brittle product metrics make “emergence” stories. Report the smooth thing when you can (calibrated error, token-level schema errors), not only pass/fail.

## Pick the smallest that meets the eval

Pick the smallest model that meets a frozen eval at the latency and price you can pay. Then spend the leftover money on **evals, retrieval, and tools**. A 10× larger model that still cannot emit valid JSON is a failed product, not an incomplete scale-up.

Small models plus tools often beat a frontier model with no tools on arithmetic, search, and “what is in this file.” Scale is not a substitute for **hands**.

Report quality per dollar and per second, not only per billion parameters. This track will not teach hosted price tables. It will teach you that **decode policy, packing, and adapters** still matter at every size.

LoRA and SFT are how you move a **small** model toward your schema without buying a 10× base. Try that before you assume you are bottlenecked on parameters.

## What size does not buy

Obedience to a schema you never showed. A 70B model will still invent keys if the prefix never named them and decode is sloppy. Grammar plus greedy is cheaper than a size bump for that bug.

A cure for cutoff. Bigger weights freeze on the same day unless the new model’s crawl is newer. Check the calendar, not the parameter count.

Even quality across a 100k window. Larger models can use long context better *sometimes*. They still dilute. They still fade in the middle. Pack.

Immunity to bad demos. SFT on junk at 70B is a more expensive religion than SFT on junk at 7B. Curate first.

A substitute for evals. The cliff metric will still jump on a smooth loss curve. Report pass rate, calibration, and dollars. Then pick a size.

When someone proposes “just use the biggest,” ask which frozen eval failed and which cheaper lever was tried: packing, greedy tools, a missing calculator, a LoRA on clean traces. Size last among those, not first.

## How agents use this

Pick the smallest model that meets a frozen eval at the latency you can pay. Then spend leftover budget on evals, retrieval, and tools. A 10× larger model that still cannot emit valid JSON is a failed product, not an incomplete scale-up.

When someone says “we need the bigger one,” ask which frozen eval failed, and whether packing, greedy tools, or a missing tool would have passed it. Size is a lever. It is not the only lever.

- **Laws:** loss vs params/data/compute, together.
- **Emergence:** often a cliff metric on a smooth curve.
- **MoE:** more params than compute; routers can fail.
- **Hands:** tools beat scale on arithmetic and files.
- **Pick small:** that still passes the eval.

> **Tip:** Report quality per dollar and per second, not only per billion parameters.

\`\`\`quiz
What do scaling laws mainly predict?
- That bigger models always follow your company policy
- *That loss tends to fall smoothly as you scale params, data, and compute together
- That attention becomes linear
- That retrieval is obsolete
explain: Loss curves are smooth. Product metrics can look jumpy. Obedience still needs evals and constraints.
\`\`\`
`,
  },
];
