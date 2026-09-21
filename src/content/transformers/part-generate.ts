import type { RawLesson } from "@/lib/types";

export const tfGenerate: RawLesson[] = [
  {
    slug: "pretraining",
    title: "Pretraining",
    summary:
      "Next-token prediction at web scale. The game is plausible continuation, not a database of truth.",
    minutes: 20,
    level: "beginner",
    md: `
**Pretraining** is the expensive phase: run a transformer over a huge text corpus and train it to predict the **next token**. That single game, played trillions of times, produces a model that continues almost anything: English, Python, broken JSON, threatening emails.

The loss is **cross-entropy** on the true next id. **Teacher forcing**: at train time the model sees the **true** prefix, not its own samples. That is why it can learn long books without collapsing on its first mistake. If it were trained only on its own rollouts, early errors would poison the rest of the sequence and learning would stall.

**Self-supervised** means the labels **are** the text. No human tagged each token. Humans **did** choose the corpus, the filters, the tokenizer, and the cutoff date. That is product, not a math footnote. Garbage in the crawl becomes fluent garbage in the weights.

This lesson is the objective. Later lessons are how scores become a token, how past keys are cached, and how the window is a suitcase. Do not skip the objective. Hallucination is not a mysterious disease. It is what “plausible next token” looks like when the prefix asks for a fact.

## A wrong picture

A wrong picture is: “pretraining stores a database of true sentences.” It stores **weights** that score continuations. Many true facts are easy to continue. Many false facts are also easy to continue if they are fluent. The loss does not know about the world. It knows about the next id in the corpus.

Another wrong picture is: “bigger pretraining means the model follows my policy.” Policy is later: fine-tuning, preference data, prompts, tools. A bigger pretrained model is a stronger **linguistic prior**. It will still invent a URL if inventing a URL is the plausible continuation.

A third wrong picture is: “the model saw my private tickets.” It did not, unless they leaked onto the public web or you later fine-tuned on them. It did not see events after its cutoff. It did not agree to your policies.

## The game in words

1. Take a sequence of token ids from the corpus.
2. For each position \`i\`, hide the future (causal mask).
3. Score every vocab id as a possible next token.
4. Loss is “how surprised were we that the true id was the one that followed?”
5. Nudge weights to be less surprised next time.

Teacher forcing means position \`i\` always sees the **true** tokens \`< i\`, even if a sampled model would have already gone off the rails. Generation later **does** go off the rails; training did not practice recovery unless you add that later.

A **base** model continues text: it will finish a blog post, a function, a rant. A **chat** model was further trained to answer in roles (fine-tuning part of this track). If you stuff a base-style completion prompt into a chat model, you are fighting its later training. If you stuff a chat wrap into a base model, you are speaking specials it never learned as roles.

Scale: more parameters, more data, more compute — loss falls until you bottleneck on one of them. “Emergent” abilities are often thresholds on a smooth curve plus a metric that was near zero. For agents, a bigger model on a **bad** prompt still calls the wrong tool. Scaling is a later lesson. The objective does not change.

## A tiny example in words

A character-level bigram table is a transformer with amnesia: context length 1. Count how often \`b\` follows \`a\`. Predict with the most common follower. Sample a string. You will see loops and local habits, not long-range copy.

Scale context and capacity, and you get long-range copy and “reasoning-shaped” completions. The **objective** did not change. Only the function class did. That is the whole jump from a bigram table to a deep decoder: same next-piece game, richer conditioning.

## A bigram table is next-token with memory 1

Count neighbors. Greedy-continue. Print the table slices and the sample. Characters here stand in for tokens so the lists stay short.

\`\`\`viz loop
title Next-token is the same game forever
step Read prefix
step Score next id
step Nudge weights
caption Pretraining is “guess the next tile” at web scale. Fluency is not a truth contract.
\`\`\`

\`\`\`tryit python
text = "refund the refund then stop"
counts = {}
for a, b in zip(text, text[1:]):
    counts.setdefault(a, {}).setdefault(b, 0)
    counts[a][b] += 1

def predict(prev):
    dist = counts.get(prev, {})
    if not dist:
        return "?"
    return max(dist, key=dist.get)

ch = "r"
out = [ch]
print("followers of r", counts.get("r", {}))
print("followers of n", counts.get("n", {}))
for _ in range(12):
    nxt = predict(ch)
    print("after", repr(ch), "->", repr(nxt), counts.get(ch, {}))
    out.append(nxt)
    ch = nxt
print("sample", repr("".join(out)))
print("true next after 're' would need context 2; this toy only sees one char")
\`\`\`

You should see a greedy loop: the most common follower of the last character wins every time. \`sample\` will look stuck or chanting. That is maximum-likelihood with no long context.

A real pretrained transformer conditions on **thousands** of previous ids, not one character. It can copy a job id from the start of the prompt into a tool call at the end — when attention and positions cooperate. The loss is still “next id.”

Change the corpus to a palindrome-like string and watch the table change. Pretraining is this counting idea on a giant, rich function, not a spreadsheet of facts.

## What the objective will not give you

- **Truth:** plausible is not true.
- **Freshness:** weights freeze; the world does not.
- **Your schema:** unless that schema was common in the crawl or you train later.
- **Permission:** continuing a threatening email is still next-token.
- **Tools:** the model does not call Python because it predicted the word \`search\`. Your loop does.

Tools, retrieval, abstain rules, and evals exist because pretraining is not a database. Treat the base skill as a **linguistic prior**, then constrain it. The next track (hosted chat products) is how people wrap that prior. This track is the prior itself.

## How agents use this

Pretraining explains fluency **and** hallucination: the game is “plausible next token,” not “true in the world.” When the prefix asks for a citation, a URL, or a Python API, the plausible continuation is often a **well-formed fake**. Fluency is not a truthfulness signal.

Give the model a tool that returns a real number. Put the observation in the sequence. Ask it to quote. That is how you use a linguistic prior without pretending it is a ledger.

Do not fine-tune on unreviewed logs to “make it know our PDFs” if the PDFs change weekly. That is retrieval, unless you like stale weights. Fine-tuning is a later lesson. The point here: **the pretrained game is continuation**.

- **Prior:** fluent English and code, not a knowledge contract.
- **Cutoff:** no events after train day, unless tools.
- **Private data:** not inside the base weights.
- **Chat vs base:** later training changes the default wrap; the next-token game remains.
- **Agents:** constrain with tools, schemas, and stop rules.

> **Note:** The model did not see your private tickets unless they leaked onto the public web. It did not see events after its cutoff. It did not agree to your policies.

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
    slug: "unembedding",
    title: "Logits and Unembedding",
    summary:
      "The last vectors become one score per vocab id. Softmax turns those logits into chances.",
    minutes: 19,
    level: "intermediate",
    md: `
After the last transformer block you still have **vectors**, one per token. Generation cares about the **last** vector (the position you are predicting).

**Unembedding** is a linear map: multiply that vector by a big matrix with one column (or row) per vocab item. You get **logits**: raw scores, one per token id. They can be negative. They do not sum to 1. They are not chances yet.

**Softmax** turns logits into chances that are positive and sum to 1. Decoding (next lesson) picks an id from those chances, or just takes the argmax of the logits. The embedding table went **id → vector**. Unembedding goes **vector → id scores**. Some models use the **same** matrix both ways (tied weights).

If you already have log-chances from a stack, do not softmax twice. If you have logits, do not treat them as chances that already sum to 1. Those two bugs show up in homemade samplers and in confused evals.

## A wrong picture

A wrong picture is: “a logit is a probability.” A logit is a raw score. It can be 12.4 or -3.1. Softmax is the map to chances. People say “logit” loosely. Your code should not.

Another wrong picture is: “we need softmax to pick a winner.” Argmax of logits is the **same** winner as argmax of softmax chances. Softmax is for sampling and for the training loss, not for picking a winner you already know.

A third wrong picture is: “the last-token vector of a chat model is a great embedding for retrieval.” Sometimes people pool it anyway. Chat models were not always trained for that. Dedicated embedders are. Mixing those vectors is a space bug.

## The map in words

Hidden vector \`h\` of width \`d\`. Unembedding matrix \`U\` with \`V\` rows (or columns) of width \`d\`. Logit for vocab item \`k\` is the dot product of \`h\` with row \`k\` of \`U\`.

That is one number per tile in the vocab. Softmax:

1. Subtract the max logit (stable).
2. Exp each.
3. Divide by the sum.

The largest logit becomes the largest chance. Temperature (next lesson) divides logits **before** this softmax.

Tied weights: \`U\` is the embedding table (transposed). Then “tokens that sit nearby as rows” are also “tokens that are easy to predict from nearby hidden states.” A tokenizer change breaks both ends at once.

## A tiny example in words

Vocab: search, sql, finish. Hidden \`h = [0.8, 0.1]\`. Rows of \`U\`:

- search: \`[1.0, 0.0]\`
- sql: \`[0.2, 1.0]\`
- finish: \`[0.0, 0.3]\`

\`h\` is closer to search, so search should win both as logit and as chance. If you bump the sql row toward \`h\`, sql can overtake. That bump is what training does, slowly, on millions of tokens.

## Dots to logits to chances

Lists of numbers. Print logits, chances, and argmax. Use math.exp, not extra libraries.

\`\`\`viz bars
title Last vector becomes one score per word
bar search,0.80,0
bar sql,0.26,1
bar finish,0.03,2
caption These are logits, then chances. Search wins. Softmax is for sampling and loss, not for picking a winner you already know.
\`\`\`

\`\`\`tryit python
import math

vocab = ["search", "sql", "finish"]
h = [0.8, 0.1]
U = [
    [1.0, 0.0],
    [0.2, 1.0],
    [0.0, 0.3],
]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

logits = [dot(h, row) for row in U]
m = max(logits)
exps = [math.exp(z - m) for z in logits]
z = sum(exps)
probs = [e / z for e in exps]
winner = vocab[max(range(len(logits)), key=lambda i: logits[i])]
print("h", h)
print("logits", [round(x, 3) for x in logits])
print("probs", [round(p, 3) for p in probs])
print("sum probs", round(sum(probs), 3))
print("argmax", winner)
print("argmax from probs", vocab[max(range(len(probs)), key=lambda i: probs[i])])
\`\`\`

\`h\` is closer to the search row, so search wins. \`sum probs\` should print 1.0 (tiny float noise is fine). Argmax from logits and from chances should match.

Change \`h\` to \`[0.0, 1.0]\`. Sql should win. That is the unembedding: **direction of the last vector vs direction of each vocab row**.

If you softmax the already-printed \`probs\` again, you will sharpen them and they will no longer mean “the model’s chances.” One softmax after logits. Stop.

## Confidence is a shape, not a vibe

If the top chance is 0.92 and the rest is a thin tail, the unembedding is peaked. If the top chance is 0.34 and the rest is a pile, the unembedding is saying “I don’t know” in distribution form. Argmax still returns **some** id. A peaked wrong id is a confident mistake. A flat distribution is an uncertain mistake. Treat them differently in a router.

Logits on **tool names** (a small subset of the vocab) are a router you can threshold. You do not need the whole 100k-way softmax to notice the model is torn between \`search\` and \`sql\`. You do need to remember that the rest of the vocab still ate some mass if you computed softmax over all tiles.

The last-token vector is also what some tools pool for **embeddings**. Chat models were not always trained for that; dedicated embedders are. Do not mix.

## Common mistakes

Softmax twice: you took chances, then treated them as logits, then softmax again. The peak gets fake-sharp. Log the raw logits or the first chances. Not both stacked.

Comparing logit 4.2 from model A to logit 4.2 from model B. Scales differ. Unembedding matrices differ. Compare chances inside one model, or compare winners, not raw scores across stacks.

Reading logits at a pad index after a clumsy collator. You will get a confident pad or a nonsense tile. The padding lesson is this bug. Unembedding is innocent.

Using the last hidden state of a chat decoder as a memory vector for retrieval without checking neighbors. Sometimes it works. Often it clusters by length or by “assistant tone.” Dedicated embedders exist because this shortcut is unreliable.

Thresholding the whole vocab’s top chance when you only care about three tool names. Mass leaked to “the”, “,” and random tiles. Restrict the view to the legal action set, then threshold.

## How agents use this

Logits on **tool names** are a router you can threshold. If the top chance is 0.34 and the rest is a pile, the unembedding is saying “I don’t know.” Escalate. Do not pretend argmax is a plan.

When you log a decision, log the top ids and their chances (or logits), not only the decoded string. “It called sql” and “it called sql at 0.41 vs search at 0.39” are different incidents.

Do not softmax twice. Do not treat logits as percents. Do not compare logits from two different models as if they share a scale.

- **Logits:** raw scores, one per vocab id.
- **Softmax once:** then chances.
- **Argmax:** same winner with or without softmax.
- **Flat top:** escalate; do not “just decode.”
- **Tied tables:** vocab change hits both ends.

> **Tip:** Argmax of logits is the same as argmax of softmax chances. Softmax is for sampling and for loss, not for picking a winner you already know.

\`\`\`quiz
What is a logit in a language model?
- A guaranteed probability
- *A raw score for one vocab id, before softmax
- A BPE merge rule
- A residual connection
explain: Unembedding produces logits. Softmax (or a sampler) comes after.
\`\`\`
`,
  },
  {
    slug: "decoding",
    title: "Decoding",
    summary:
      "Turn logits into the next token: greedy, temperature, then repeat until stop.",
    minutes: 22,
    level: "intermediate",
    md: `
The model outputs **logits**. **Decoding** is the policy that turns those scores into the next token, again and again, until you stop.

This is not a footnote. The same weights can be a deterministic clerk or a chaotic poet depending on the sampler. Agents die here: a tool name sampled from a flat tail is a production incident; a JSON key sampled with high temperature is a parse error that looks like “the model is bad.”

You already have logits. This lesson is the **policy**. Greedy. Temperature. Top-k. Top-p. Stop rules. Repeat.

## A wrong picture

A wrong picture is: “raise temperature to make the agent more autonomous.” Autonomy is the loop and the tools, not noise on the logits. Temperature reweights mistakes. It does not add knowledge.

Another wrong picture is: “greedy is always boring and therefore always worse.” Greedy is the **mode**. If the mode is the right tool name, you want it **every** time — a gift for tests. If the mode is the wrong tool, you will get that wrong tool every time — a curse until you fix the prompt. Sampling would have hidden the bug as flakiness.

A third wrong picture is: “stop when the answer feels done.” Stop when you see **EOS**, hit max tokens, match a stop string, or the schema is complete. Feelings are not a stop rule. A stop string that appears inside legal JSON will cut the model off mid-argument.

## Greedy

Always pick \`argmax(logits)\`. Reproducible. Tends to **repeat** and to choose safe, high-frequency wording. Good for JSON fields and tool names. Bad for variety in a poem. Agents that emit discrete actions want greedy (or a grammar that only allows legal tokens).

Greedy is still a distribution: it is the mode. Tests love it. Prompt bugs cannot hide behind a lucky sample.

## Temperature

Divide logits by \`T\` before softmax.

- \`T\` near 0 approaches greedy (the max dominates)
- \`T = 1\` uses the model’s native distribution
- \`T > 1\` flattens; rare tokens get more mass

Temperature does not add knowledge. It reweights the same logits. At high \`T\`, a wrong tool name that had a small chance becomes a sometimes-event. For a router, that sometimes is an incident.

## Top-k and top-p

**Top-k:** keep only the k highest logits, zero the rest (or drop them), then softmax and sample. Cuts the long tail of nonsense ids.

**Top-p** (nucleus): sort chances, keep the smallest set whose mass is at least p, drop the rest, renorm, sample. Adaptive: peaked rows keep few tiles; flat rows keep more.

Both are tail clips. They do not replace a schema. A grammar that only allows legal JSON is stronger than top-p = 0.9 when the job is a tool call.

## Stop

Stop when:

- you sample EOS
- you hit max new tokens
- you match a stop string (after decode, or as ids)
- the structured object is complete (schema / grammar)

Agents should stop on **schema complete**, not on vibes. Greedy for tool JSON, a little temperature for the user-facing paragraph, is a deliberate split — two decode policies, one system.

Best-of-n samples multiply cost. Use them on hard items after a cheap filter, not on every turn. You are paying decode (and maybe prefill) n times.

## Sample the same logits at three temperatures

Lists of numbers. A tiny vocab. Print greedy, chances, and samples. No f-strings. \`random.Random\` is seeded so you can rerun.

\`\`\`viz plot
title Temperature flattens the same logits
xlabel temperature T
ylabel P(search)
fn psearch 1/(1+exp(-2.2/x)) 0.2 2.5
caption Near T=0 the winner owns almost all mass. High T shares mass with worse tools. That sometimes is an incident.
\`\`\`

\`\`\`viz bars
title Same logits, T = 1
bar search,0.70,0
bar sql,0.19,1
bar finish,0.09,2
bar wait,0.02,3
caption Greedy still picks search. Sampling can pick sql. Tool names want greedy, not a poet.
\`\`\`

\`\`\`tryit python
import math
import random

vocab = ["search", "sql", "finish", "wait"]
logits = [2.4, 1.1, 0.3, -1.0]

def softmax(logits, T=1.0):
    scaled = [x / T for x in logits]
    m = max(scaled)
    exps = [math.exp(x - m) for x in scaled]
    s = sum(exps)
    return [e / s for e in exps]

def greedy(logits):
    i = max(range(len(logits)), key=lambda j: logits[j])
    return vocab[i]

def sample(probs, rng):
    r = rng.random()
    acc = 0.0
    for i, p in enumerate(probs):
        acc += p
        if r <= acc:
            return vocab[i]
    return vocab[-1]

print("greedy", greedy(logits))
for T in (0.2, 1.0, 2.0):
    probs = softmax(logits, T)
    print("T", T, "probs", [vocab[i] + "=" + str(round(probs[i], 3)) for i in range(len(vocab))])

rng = random.Random(0)
print("samples T=1", [sample(softmax(logits, 1.0), rng) for _ in range(8)])
rng = random.Random(0)
print("samples T=2", [sample(softmax(logits, 2.0), rng) for _ in range(8)])
print("wait logit is lowest; high T still lets it sneak in")
\`\`\`

At low T, search dominates. At high T, sql and even wait sneak in. For an agent **router**, that sneak is a production incident.

Rerun: greedy never changes. Samples at T=2 should look more mixed than at T=1 with the same seed start. That is the whole knob.

## Two policies in one product

Tool names, enum fields, JSON keys: **greedy** or a constrained grammar. User-facing prose: a little temperature if you want variety, still clipped with top-p so you do not sample garbage ids.

Do not share one high temperature across both. The JSON will break and the router will wander. Split the decode policy even if you use one set of weights.

Repetition: greedy and low T can loop (“wait wait wait”). A repetition penalty is an extra decode hack. Summarizing the transcript is usually a better fix than a magic penalty — you are feeding better prefixes into the same logits.

## Common mistakes

One global temperature for tools and prose. The router wanders. The JSON breaks. Split the policy even if the weights are one.

A stop string copied from a blog (\`}\` or \`\\n\\n\`) that also appears inside legal arguments. You will ship truncated objects and blame the model. Test stops against a valid tool call.

Top-p at 0.95 plus T at 1.2 plus no grammar, then wondering why the tool name is \`Searchh\`. The tail was invited. Clip it or forbid it.

Calling best-of-n on every turn “for quality.” You paid n times. A cheap filter plus one greedy decode would have caught the empty JSON. Save n for the hard slice.

Changing T to debug a prompt bug. The bug is in the prefix. Greedy makes it show every time. Sampling hides it. Debug greedy, then set T for the product.

## How agents use this

Default chat temperature (often in the 0.7–1.0 rumor range) is for conversation. Tool calls want **0 or near 0**, plus a JSON grammar if the stack offers it. Do not “increase temperature to make the agent more autonomous.” Autonomy is the loop and the tools, not noise on the logits.

Log the decode policy next to the trace: greedy or T, top-p, stop strings. Otherwise you cannot reproduce a bug. A test suite that samples T=1 will flake. A test suite that decodes tools greedily will catch prompt regressions.

- **Discrete actions:** greedy (or grammar).
- **Prose:** mild T, clipped tail.
- **Stop:** schema complete; stops that cannot appear in legal JSON.
- **Tests:** greedy so bugs cannot hide.
- **Best-of-n:** costs n; use after a cheap filter.

> **Warning:** Best-of-n samples multiply cost. Use them on hard items after a cheap filter, not on every turn.

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
    slug: "kv-cache",
    title: "The KV Cache",
    summary:
      "Past keys and values do not change. Store them. That is why the first token is slow and the rest are faster.",
    minutes: 20,
    level: "intermediate",
    md: `
At generation time, keys and values for **past** tokens do not change. Servers store them in a **KV cache** so each new token only computes **one new row** of scores against the stored keys.

That is why the **first** token of a long prompt is slow (**prefill**: attend over the whole prompt) and later tokens are faster (**decode**: attend to the cache plus the new token) — until the cache is huge and memory-bound.

Agent loops that resend a 20k-token transcript **from scratch** pay prefill again if the prefix is not cached. A stable pinned prefix is a performance feature, not just a safety feature. If you edit a token in the middle of the prompt, every key after that is invalid. That is why “edit the system prompt every turn” kills cache hits.

This lesson is the cache. The next two lessons are the window as a suitcase, and prefill vs decode as a latency picture. They are the same machine from three sides.

## A wrong picture

A wrong picture is: “the cache stores the answer.” It stores **keys and values** for tokens already processed: lists of numbers from each layer and head. It does not store the user’s goal as English.

Another wrong picture is: “decode is free.” Each new token still scores against the growing cache. Long traces are a **memory** bill, not only a token bill. Cache size grows with **layers × heads × sequence × key width**. Grouped-query attention (multi-head lesson) exists partly to shrink this.

A third wrong picture is: “I can rewrite the spec every turn and still hit the cache.” Byte-for-byte prefix stability is the hit. A timestamp in the system spec, a shuffled tool list, a comma change — any of those can miss.

## Prefill writes, decode appends

**Prefill:** run every prompt token through the stack. Write K and V for each position into the cache. Produce logits for the **next** id. Cost grows with prompt length (and with n² attention unless the kernel is clever).

**Decode:** take the newly chosen id, embed it, run it through the stack **as one position**, score against all cached keys, append the new K/V, sample the next id. Repeat until stop.

If you change token 5 of a 5,000-token prompt, positions 5…4999 must be recomputed. Positions 0…4 could stay. In practice many stacks drop the whole suffix after the edit. Put volatile text at the **end** so the long prefix can stay cached.

## A tiny example in words

Toy: keys **are** the token vectors. Prefill three prompt vectors. Cache length 3. Decode one new vector: dots against the three stored keys, then append. Cache length 4. You did not rebuild the prompt keys.

That is the whole idea, without layers and heads. Production is this per layer, per head, with larger lists of numbers.

## Store keys, then append one

Lists of numbers. Print cache length and scores. No extra libraries.

\`\`\`viz flow
title Prefill writes the cache; decode appends
layout lr
node prefill Prefill
node cache KV cache
node decode Decode one
edge prefill cache
edge cache decode
edge decode cache
caption Past keys do not change. Store them. The first token is slow; later tokens append one row.
\`\`\`

\`\`\`tryit python
past_keys = []

def prefill(prompt_vecs):
    past_keys.clear()
    past_keys.extend(prompt_vecs)
    return len(past_keys)

def decode_one(new_vec):
    scores = [sum(a * b for a, b in zip(new_vec, k)) for k in past_keys]
    past_keys.append(new_vec)
    return scores, len(past_keys)

prompt = [[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]]
print("prefill tokens", prefill(prompt), "cache", len(past_keys))
print("cache rows", past_keys)
scores, n = decode_one([0.9, 0.1])
print("decode scores vs cache", [round(s, 3) for s in scores], "cache now", n)
print("last cache row", past_keys[-1])
print("we did not recompute the prompt keys")
scores2, n2 = decode_one([0.0, 1.0])
print("second decode scores", [round(s, 3) for s in scores2], "cache now", n2)
\`\`\`

Prefill writes the cache. Decode only **appends**. Second decode scores against four keys, including the first generated vector. That growing list is why very long generations become memory-bound.

If you mutated \`prompt[1]\` after prefill, this toy would **not** update \`past_keys[1]\`. That stale key is the bug a real cache would have if you edited the middle and forgot to invalidate. Real servers invalidate. You still pay to rebuild.

## What blows the cache

- Spec text that includes “today’s date” rewritten every call
- Tool schemas serialized in random key order
- Injecting a new “remember:” line at the **front**
- Summaries that replace the **head** instead of the tail
- Multi-agent copies of the full transcript as a new prefix

Keep the system spec **byte-for-byte stable** across turns. Put volatile stuff (the latest observation) at the **end**. If you must summarize, replace the tail, not the pinned head.

Cache is also why streaming UIs feel fast after the first token: you are watching decode. They do not shrink prefill. A 100k-token “just in case” pack still makes every turn feel like a cold start if the prefix cannot be reused.

## Common mistakes

Putting a request id or a wall-clock timestamp in the **system** spec every turn. The prefix never matches. Prefill runs in full. Put clocks in the tail.

Serializing tool schemas with unsorted keys. One extra space, one shuffled field, cache miss. Canonicalize the schema bytes.

Summarizing by rewriting the spec (“here is a shorter policy”). You just invalidated every cached key after token 0. Summarize history. Pin the spec as a frozen string.

Assuming a multi-agent crew can each send a unique 8k spec and still share a cache. They cannot, unless the bytes match. Share one pin.

Watching later tokens crawl and adding more prompt “for context.” You made the cache longer. Shorten. The memory bill is layers × heads × sequence × width, every decode step.

## How agents use this

Keep the system spec **byte-for-byte stable** across turns so the prefix can be cached. Put volatile stuff at the **end**. If you must summarize, do it in a way that replaces the tail, not the pinned head.

Measure: if every turn’s first token is slow, you are probably missing the cache (or the prompt is huge). If later tokens crawl, the cache may be huge — shorten the sequence.

- **Stable head:** spec and tool schemas frozen as bytes.
- **Volatile tail:** latest observation last.
- **Edits:** middle edits invalidate the suffix.
- **Memory bill:** layers × heads × sequence × width.
- **Streaming:** does not erase prefill.

> **Tip:** Prefill cost is why a 100k-token “just in case” pack makes every turn feel like a cold start. Streaming UIs do not change that. They only change when bytes arrive.

\`\`\`quiz
What does the KV cache store?
- The tokenizer merge list
- *Keys and values for tokens already processed, so new tokens need not recompute them
- The test set
- Softmax temperature
explain: Past keys and values are fixed. Caching them is what makes decode cheaper than prefill.
\`\`\`
`,
  },
  {
    slug: "context-windows",
    title: "Context Windows",
    summary:
      "A hard token budget for one forward pass. Pack it like a suitcase. Silent truncation forgets the spec.",
    minutes: 21,
    level: "intermediate",
    md: `
A **context window** is the maximum number of tokens the model can attend over in one forward pass: system + tools + history + this user message + room for the answer.

It is not RAM for your app. It is a **hard square** of attention. Go past it and the call errors, or a client **silently truncates** the front of the transcript. Silent truncation is how agents forget the system prompt and keep the latest rant.

Long-context models still want packing discipline. They just fail later and cost more. Attention is still n² in the naive picture. Softmax still dilutes. Positions still treat the middle as a different, often weaker, region. A 128k window is not permission to be lazy.

## A wrong picture

A wrong picture is: “the window is pages.” Pages are not the unit. Tokens are. JSON, code, and ids pack worse than English. Count tiles.

Another wrong picture is: “drop the oldest messages; that is FIFO, so it is fair.” Oldest-first often drops **message 0**, the spec. The model then only sees the latest user line, which might be “delete them actually.” Pin must-have tokens so they cannot fall off.

A third wrong picture is: “if 1+2 do not fit, start anyway and hope.” Do not start the call. Retrieve less. Summarize. Split the task. A truncated policy is a different product.

## Packing

1. **Must-have** — policy, schema, goal, current observation
2. **Useful** — retrieved chunks, recent tool results
3. **Nice** — old thoughts, full file dumps
4. **Dead weight** — duplicated stack traces, base64, entire databases

If 1+2 do not fit, **do not start the call**.

| Policy | Effect |
|---|---|
| Drop **oldest** messages | Forgets the spec; keeps the latest errors |
| Drop **middle** | Can keep system + last turn; loses the clue in between |
| Summarize old turns | Loses details; keeps plot |
| Sliding window on tools | Keeps last k observations |

Most amateur loops drop the oldest and therefore drop the system prompt that was message 0. Pin the spec. Put the latest observation at the end (positions lesson, lost-in-the-middle lesson). Reserve **output** room so generation does not immediately overflow.

Agents die at the limit by looping retries, dumping 40 retrieved chunks, copying whole transcripts between crew members, or stuffing images. Death looks like: looping, ignoring tools, emptying JSON, or cheerfully violating the policy that is no longer in context.

## A tiny example in words

Limit 24 toy tiles (words). Spec is pinned: never delete rows; prefer sql. History includes a timeout dump and a last user line “delete them actually.” A packer that keeps the spec and fills remaining space from the **end** of history should still show the spec at the front. A packer that only keeps the newest messages with no pin would keep the crime and lose the law.

That is the safety feature. Not a sermon. A list of ids that still includes the policy tiles.

## Pin the spec, then fill from the end

Word tiles as a stand-in for tokens. Print packed text and whether the spec survived.

\`\`\`viz bars
title One suitcase: 24 tiles
bar spec,8,0
bar history,12,1
bar latest,4,2
caption Pin the spec. Fill the rest from the end. Oldest-first drop often throws away the policy.
\`\`\`

\`\`\`tryit python
LIMIT = 24

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
    packed = pinned + [w for msg in kept for w in msg]
    return packed, used

packed, used = pack(spec, history, LIMIT)
print("used", used, "/", LIMIT)
print("packed:", " ".join(packed))
print("spec pinned?", packed[:3] == spec[:3])
print("last user kept?", "delete" in packed)

def drop_oldest(spec, history, limit):
    msgs = [spec] + history
    flat = []
    for msg in msgs:
        flat.extend(msg)
    if len(flat) <= limit:
        return flat
    return flat[len(flat) - limit :]

dropped = drop_oldest(spec, history, LIMIT)
print("drop oldest starts", dropped[:6])
print("drop oldest lost spec?", dropped[:3] != spec[:3])
\`\`\`

The latest user said “delete them.” If the spec fell off the front, the model only sees the crime. Pinning is a safety feature. \`drop oldest\` should show the spec missing when the history is fat. \`pack\` should keep \`SPEC:\` at the front.

Tune \`LIMIT\` down until even the pin barely fits. Then 1+2 do not fit. The correct product behavior is **refuse or split**, not a silent chop.

## Measure, reserve, refuse

Budget tokens like money. Reserve **output** room. Measure prompt tokens every step with the **same tokenizer** the model uses. When usage is past about 70% of the window, **summarize or retrieve**, do not hope.

Put encyclopedias in retrieval, not in the system prompt. The spec should be short and loud. The knowledge should be fetched. That is packing plus the embedding-table lesson (do not stuff a library into layer zero every time).

Repeating the goal at the **end** (“remember: never delete rows”) is allowed when the window is long and the middle is fog. It is not a substitute for pinning the front. Do both when the task is dangerous.

## Common mistakes

Counting characters or words, then being surprised the call overflowed. Count tiles with the model’s tokenizer.

Dropping the oldest *and* dropping the latest tool result to “keep the spec.” You kept the law and lost the evidence. Pin the spec **and** keep the current observation. Cut the middle dumps.

Starting the call at 99% of the window with max output 1024. Decode has nowhere to go. Reserve output room or the stack truncates the **answer**, which looks like a stop bug.

Stuffing forty retrieval chunks because the window “has space.” Space is not even quality. You met lost-in-the-middle. Select.

Silent truncation in a client library with no log. The pin is gone. The trace still looks long. Log whether message 0 is still present, every turn.

## How agents use this

Budget tokens like money. Reserve **output** room. Measure prompt tokens every step. When usage is past 70% of the window, **summarize or retrieve**, do not hope. Long-context models still want the same packing discipline; they just fail later and cost more.

Log window use on every turn: prompt tiles, reserved output, whether the pin is still present. “Forgot the policy” is often truncation, not rebellion.

- **Pin:** must-have tokens cannot drop.
- **Tail:** latest observation last.
- **Refuse:** if must-have plus current obs do not fit, do not call.
- **Dead weight:** traces, base64, whole tables — cut them.
- **70%:** summarize or retrieve before you hit the wall.

> **Tip:** Put the goal and the non-negotiable rules in a pinned block you never truncate. Put encyclopedias in retrieval, not in the system prompt.

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
    slug: "prefill-decode",
    title: "Prefill and Decode",
    summary:
      "Prefill reads the prompt. Decode writes one token at a time. Agent latency is usually prefill plus a short decode.",
    minutes: 20,
    level: "intermediate",
    md: `
One model call has two phases.

**Prefill** — run the whole prompt through the stack, fill the KV cache, produce logits for the **next** token. Cost grows with prompt length (and with n² attention unless the kernel is clever).

**Decode** — sample one token, append it, score the next, repeat until stop. Cost grows with **output** length. Each step is cheaper than prefill but you may do hundreds of them.

Time to **first** token is mostly prefill. Time to **last** token is prefill plus decode. Streaming shows decode as it happens; it does not shrink prefill. Users who say “the model is slow to start” are often holding a fat prompt. Users who say “it streams forever” are holding a large max-output (or a missing stop).

This is the KV-cache lesson as a **clock**. Same cache, now with a toy bill.

## A wrong picture

A wrong picture is: “latency is max_tokens.” Output length is only the decode part. A two-sentence reply after a 40k-token dump is still slow to **start**.

Another wrong picture is: “streaming makes prefill cheaper.” Streaming changes when bytes arrive, not how much work prefill did. The first token still waits on the prompt.

A third wrong picture is: “speculative decoding and draft models make a junk prompt free.” They make **decode** faster by guessing ahead. They do not make a 200k junk prompt free.

## Two clocks

**TTFT** (time to first token): dominated by prefill on long prompts. This is the pause before the cursor moves.

**TTLT** (time to last token): TTFT plus every decode step. This is when the JSON is complete.

Agent loops often emit **short** outputs (a tool name, a small object) after a **long** prompt (spec + tools + history). Then TTFT is the pain and TTLT is TTFT plus a blink. People still “optimize the sampler” and ignore the suitcase.

Parallel tool calls still serialize into **one** next prompt — one more prefill — unless you cache the shared prefix. Several tools in one turn can mean one fat observation block at the end. That is good for the cache head and bad for prompt length. Summarize tool dumps before the next prefill.

Output tokens are often priced higher than input tokens in hosted products. This track is not that product lesson. Still: decode is where the JSON is born, and long rambling decode is a bill you chose with max-tokens and stop rules.

## A tiny example in words

Toy: prefill cost grows with \`n * n\` a little plus linear in \`n\`. Decode cost adds a bit per extra cache slot each new token. Doubling the prompt hurts first-token time more than doubling a short 80-token answer. That matches the “RAG dump feels slow to start” story.

The numbers are fake. The **shape** is the lesson.

## Toy milliseconds for fat prompt, short answer

Lists of numbers as lengths. Print prefill vs decode. No extra libraries.

\`\`\`viz bars
title Fat prompt, short answer
bar prefill,82,1
bar decode,8,2
caption Time to first token is mostly prefill. Streaming does not shrink that wait. Shorten the prompt.
\`\`\`

\`\`\`tryit python
def ms_prefill(n_prompt, cost_per_tok=0.02):
    return n_prompt * n_prompt * 0.000002 + n_prompt * cost_per_tok

def ms_decode(n_out, cache_len, cost_per_tok=0.05):
    total = 0.0
    for i in range(n_out):
        total += cost_per_tok + cache_len * 0.00001
        cache_len += 1
    return total

prompt = 4000
out = 80
p = ms_prefill(prompt)
d = ms_decode(out, prompt)
print("prompt", prompt, "out", out)
print("prefill ms", round(p, 1))
print("decode ms", round(d, 1))
print("first token waits on prefill; the 80 output tokens are extra")
print("double prompt prefill", round(ms_prefill(8000), 1))
print("double out decode", round(ms_decode(160, prompt), 1))
print("short prompt 500 prefill", round(ms_prefill(500), 1))
\`\`\`

Doubling the prompt hurts first-token latency more than doubling a short answer in this toy. Doubling output grows decode, not the start pause. A 500-token prompt prefill should look cheap next to 4000.

If your agent’s output is 20 tokens of JSON and the prompt is 8,000, do not start by cutting max-tokens from 256 to 64. Cut the prompt.

## What to look at when the user waits

Look at **prompt tokens**, not only max_tokens. A router that runs a 2k-token spec every turn should keep that spec cacheable. A tool that returns 10k tokens of logs should summarize before the next prefill.

If first token is slow and prompt is huge: packing and cache. If first token is fine and the stream crawls: output length, stop rules, or a memory-bound cache. If both are slow: both.

Speculative decoding, draft models, and clever kernels are serving tricks. They do not excuse a greedy packer. Your lever from outside the weights is still the **sequence** and the **stop**.

## Common mistakes

Cutting max output to “make it faster” when TTFT is the complaint. Max output is decode. TTFT is prefill. Cut the prompt.

Enabling a stream and calling the problem solved. The user still waits the same prefill. They just see a cursor sooner after it.

Logging only total latency. You cannot tell prefill from decode. Split the clock: time to first token, time to last, prompt tiles, output tiles. Then you know which lesson to reopen.

Running five tools, concatenating five fat dumps, and acting shocked the next call’s first token is slow. That next call is a new prefill. Summarize dumps before you concatenate.

Leaving max new tokens at 2048 for a router that should emit one enum. Decode will ramble if the stop never fires. Stop on schema complete.

## How agents use this

If the user waits, look at **prompt tokens**, not only max output. A stable pinned prefix is a latency feature (KV-cache lesson). A tool that returns 10k tokens of logs should summarize before the next prefill. Parallel tool results still become **one** next prompt — one more prefill.

Reserve output room in the window (last lesson) so decode has space. Then **stop** so decode does not fill that room with poetry when you needed one JSON object.

- **TTFT:** mostly prefill; fat prompt.
- **TTLT:** prefill plus decode.
- **Stream:** does not shrink prefill.
- **Short JSON, long prompt:** optimize the prompt.
- **Stop:** schema complete, so decode ends.

> **Note:** Output tokens are often priced higher than input tokens. Decode is where the poetry (and the JSON) is billed. Packing still dominates the start pause.

\`\`\`quiz
Why is time-to-first-token mostly prefill?
- Decode cannot start on GPUs
- *The model must read the whole prompt and fill the cache before it can score the first new token
- Softmax runs only once ever
- BPE happens after the last token
explain: Prefill processes the prompt. The first generated token waits on that pass.
\`\`\`
`,
  },
];
