import type { RawLesson } from "@/lib/types";

export const mathAgents: RawLesson[] = [
  {
    slug: "entropy",
    title: "Entropy",
    summary:
      "Surprise measured in bits. High-entropy next-token or tool distributions are uncertain — not automatically wrong.",
    minutes: 20,
    level: "intermediate",
    md: `
**Information content** of an event with chance \`p\` is \`-log2(p)\` **bits**. Rare events are surprising and take more bits to name. A fair coin landing heads is 1 bit. A one-in-a-million incident is about 20 bits of surprise.

**Entropy** of a distribution is the **expected** surprise: \`H = -sum p_i log2(p_i)\`. A certain outcome (\`p=1\` for one item) has entropy 0. A uniform distribution over \`k\` labels has entropy \`log2(k)\`, the maximum for that many labels.

Entropy is not “how wrong.” A model can be confidently wrong (entropy low, accuracy low) or uncertain and honest (entropy high). Calibration is the extra requirement that \`p\` matches frequencies. Entropy is only about **spread**.

## A wrong picture

A wrong picture is: “high entropy means the model is wrong; low entropy means it is right.” Entropy 0 on the **wrong** tool is a disaster. Entropy high on a genuinely ambiguous ticket can be honest. You want **low entropy on the right answer**, which is a joint statement about entropy and accuracy.

Another wrong picture is using a different log base and comparing numbers. Bits use log base 2. Natural log gives **nats**. Same story, different unit. \`H_nats = H_bits * ln(2)\`. Be consistent with your log. Dashboards that mix them look like a regression.

A third: including \`p = 0\` as \`0 * log(0)\` in a naive loop. Skip those terms: \`0 log 0\` is treated as 0. If you clip chances up from 0, you **change** entropy — be consistent.

## The formula in words

Surprise of one outcome: minus log2 of its chance. Smaller p, larger surprise.

Entropy: chance-weighted average of those surprises. Same weighted-average idea as expectation, with surprise as the value.

Maximum for k labels: all chances \`1/k\`, H = log2(k). Two labels uniform: 1 bit. Three labels uniform: about 1.585 bits. Eight labels uniform: 3 bits.

Tiny numeric. Peaked \`[0.90, 0.05, 0.05]\`: surprise of the big one is \`-log2(0.9) ≈ 0.152\` bits; the two tails are about 4.32 bits each but they are rare. H lands well under 1 bit (about 0.57). Flat \`[1/3, 1/3, 1/3]\`: H ≈ 1.585. A coin \`[0.5, 0.5]\`: H = 1.

A next-token distribution with entropy 10 bits is as uncertain as a uniform choice among about 1024 tokens (\`2^10\`). The model does not “know” the next word.

\`\`\`viz bars
title Peaked policy: most mass on one tool
bar search,0.90,0
bar sql,0.05,1
bar wait,0.05,2
caption Almost sure. Entropy is low (about 0.57 bits). That is spread, not accuracy.
\`\`\`

\`\`\`viz bars
title Flat policy: a three-way coin
bar search,0.33,0
bar sql,0.33,1
bar wait,0.34,2
caption Even spread. Entropy is about 1.59 bits — the most confused three-way list.
\`\`\`

## Moving parts

| Piece | What it is |
|---|---|
| \`p_i\` | Chance of outcome i. Each is at least 0. The list sums to 1. |
| Surprise | \`-log2(p_i)\` bits for one outcome. Rare → large. |
| Entropy \`H\` | Chance-weighted average of those surprises. |
| Max \`H\` | \`log2(k)\` when k labels are uniform. |

You only need those four. Calibration (does 0.7 happen 70% of the time?) is a **different** check.

## A second walkthrough (four tools)

Four tools with chances \`[0.70, 0.20, 0.08, 0.02]\` — search, sql, finish, wait.

Surprise of each, by hand:

- 0.70 → \`-log2(0.70) ≈ 0.515\` bits
- 0.20 → \`-log2(0.20) = 2.322\` bits
- 0.08 → \`-log2(0.08) ≈ 3.644\` bits
- 0.02 → \`-log2(0.02) ≈ 5.644\` bits

Entropy is the weighted average:

\`0.70*0.515 + 0.20*2.322 + 0.08*3.644 + 0.02*5.644\`

\`= 0.361 + 0.464 + 0.292 + 0.113 ≈ 1.230\` bits.

Uniform four-way is \`log2(4) = 2\` bits. This policy is peaked, not confused. A nearly flat four-way sits at 2 bits — almost a full extra bit of average surprise. That extra bit is extra samples and extra tool dithering.

Certain policy \`[1, 0, 0, 0]\`: skip the zeros, \`H = 0\`. Half-and-half with a dead tool \`[0.5, 0.5, 0, 0]\`: \`H = 1\`, same as a fair coin. Unused tools do not add surprise. A **wrong** certain policy (entropy 0 on the bad tool) is worse than a confused one: you will not even try the right hand.

## Tokens and bits

Uncertain tokens are expensive because:

- You may need **more samples** (majority vote, rerank) to stabilize an action.
- Sequences wander; **more tokens** get spent repairing the plan.
- A high-entropy **tool** distribution means the policy does not know which hand to use; wasted calls follow.

Low entropy is not automatically good. Pair it with accuracy or with a gold tool label.

## A Friday ticket

Friday 16:40. Support tickets started taking three tools instead of one. The prompt had not changed. Someone had added \`wait\` to the catalog with an empty description. Mean **tool entropy** jumped from about 0.75 bits (three labels, peaked on search) to about 1.55 bits (four labels, nearly flat). The incident title was “model quality.” The number was entropy: the policy no longer knew which hand to use.

The fix was not a longer system prompt. They logged \`tool_entropy_bits\` on every step, alerted when the hourly mean exceeded \`0.6 * log2(n_tools)\`, and wrote a one-line description for \`wait\`. Entropy fell. Search stopped sharing mass with wait. Same logits family, better constraint.

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

tools = ["search", "sql", "finish"]
print("confident policy H", round(entropy([0.85, 0.10, 0.05]), 3), tools)
print("confused  policy H", round(entropy([0.34, 0.33, 0.33]), 3), tools)
\`\`\`

Surprise of p=0.5 is \`1.0\` bit. Surprise of p=0.9 is about \`0.152\`. H peaked is about \`0.569\`. H flat is about \`1.585\`. H coin is \`1.0\`. Max for 8 labels is \`3.0\`. Confident policy H is about \`0.748\` on search/sql/finish. Confused policy H is about \`1.585\` — the same as a flat 3-way choice, the maximum for three options. An agent that logs entropy of the tool distribution (when you have logits) gets a **numeric** “I don’t know” instead of a vibe.

Skip \`p = 0\` terms. If your softmax produces exact zeros, that is fine. If you clip chances, you change entropy — be consistent.

## What goes wrong

- **Zeros:** \`0 * log(0)\` is treated as 0. Skip \`p == 0\`. If you clip every chance up to \`1e-12\` “to be safe,” you **raise** entropy a little. Pick a rule and keep it.
- **List that does not sum to 1:** H of \`[0.9, 0.9]\` is nonsense. Assert \`abs(sum(p) - 1) < 1e-6\` before you log H.
- **Bits vs nats:** \`math.log\` vs \`math.log(..., 2)\`. A chart that mixed them looked like a 30% regression. Label the unit on the series.
- **Ties / flat top-k:** retrieval scores \`[0.41, 0.40, 0.39]\` softmax to a high-H blob. Rank-1 is not destiny. Entropy of that list is the confusion number.
- **Overflow into \`-inf\`:** if a chance underflowed to 0 and you still take \`log\`, you get \`-inf\`. Same clip story as cross-entropy.

Production logs: \`tool_entropy_bits\`, \`mean_token_entropy_bits\`, \`n_tools\` (so a catalog change is visible), and the **argmax tool** next to its chance. Assert non-negative \`p_i\`, unit sum, and that you skipped zeros. A line like \`H=1.55 n=4 argmax=wait p=0.28\` is a policy you can debug. \`H=1.55\` alone is a vibe.

## How agents use this

Production teams watch **average entropy** of generations. Spikes mean the prompt stopped constraining the model (new tool added, schema missing, temperature too high). Combined with temperature, entropy is a knob-and-gauge pair: temperature reshapes logits; entropy measures how flat the result became.

For ranking, a query whose top-k cosine scores are almost equal is high-entropy retrieval: the neighborhood is a blob, not a nearest neighbor. Do not pretend rank-1 is destiny.

- **Tokens:** log mean token entropy per reply. A jump after a prompt or temperature change is a constraint failure, not “creativity.” Pair it with exact-match or gold-tool accuracy so you do not celebrate a peaked **wrong** policy.
- **Ranking:** turn top-k scores into a softmax over documents; the entropy of that list is retrieval confusion. High H: refuse or clarify. Log the entropy **and** the top cosine.
- **Loss:** cross-entropy is at least the entropy of the true labels. You cannot beat \`H(p)\` on average. KL (next lessons) is the extra bits.
- **Sampling:** high T raises entropy. Low T lowers it. Greedy is entropy toward 0 given a unique max logit. If greedy still looks high-entropy, you have a **tie** in the logits, not a temperature bug.

> **Note:** Bits use log base 2. Natural log gives **nats**. Same story, different unit. Be consistent with your log.

\`\`\`quiz
Entropy of a distribution is highest when
- One outcome has chance 1
- *Chance is spread as evenly as possible over the outcomes
- You use a smaller log base
- The mean is zero
explain: Uniform distributions maximize entropy for a fixed support. Peaked distributions are low surprise on average.
\`\`\`
`,
  },
  {
    slug: "softmax",
    title: "Softmax",
    summary:
      "Softmax turns a list of logits into chances that sum to 1. Subtract the max first so exp does not explode.",
    minutes: 20,
    level: "intermediate",
    md: `
A model does not emit chances directly. It emits **logits**: real numbers, one per token (or per tool). They can be negative. They do not sum to 1.

**Softmax** converts a list of logits \`z\` into a categorical distribution:

\`p_i = exp(z_i) / sum_j exp(z_j)\`

The \`exp\` is huge for large logits, so in code you subtract \`max(z)\` first. That does not change \`p\` (it cancels) and it stops overflow.

After softmax:

- every \`p_i\` is at least 0
- the list **sums to 1**
- a bigger logit becomes a bigger chance, but not in a straight line

\`\`\`viz bars
title After softmax: chances that add to 1
bar search,0.88,0
bar sql,0.09,1
bar finish,0.03,2
caption Logits [2.0, 0.1, -1.0] become this pile. Search is most of the mass, not all of it.
\`\`\`

Argmax of logits is the same as argmax of softmax chances. Softmax is for **sampling** and for **loss** (cross-entropy next), not for picking a winner you already know.

## A wrong picture

A wrong picture is: “logits are already probabilities.” They are not. They can be 1000, or -3, and they need not add to 1. Mixing raw logits with softmax chances on a dashboard makes the dashboard lie. Ask the vendor: is this already softmax, or a raw logit?

Another wrong picture is softmax **twice**. You squash an already-valid chance list toward a new, usually peakier, list that is not the model’s distribution. If you already have log-chances, you still exp and normalize — same function, once.

A third: skipping subtract-max. \`exp(1000)\` overflows. Some environments print \`inf\` then \`nan\` after you divide. Subtract max(logit) **every** time. Algebra: \`exp(z_i - m) / sum exp(z_j - m)\` equals \`exp(z_i)/sum exp(z_j)\` because \`exp(-m)\` cancels.

Softmax does not “add information.” It is a map from a list of reals to a list of chances. Temperature (next lesson) rescales logits **before** this map.

## The formula in words

Exp every logit (after subtracting the max). Add those exps. Divide each exp by the total. You now have a categorical: weights that sum to 1.

Tiny numeric. Equal logits \`[1, 1, 1]\` → equal chances \`[1/3, 1/3, 1/3]\`. Clear winner \`[4, 1, 0]\`: the 4 dominates, but the others are not zero. Sum is 1. Huge logits \`[1000, 999, 998]\`: subtract 1000 first, then exp of \`[0, -1, -2]\`, still a valid list — the same shape as softmax of \`[0, -1, -2]\`.

Winner: argmax of \`[2.0, 0.1, -1.0]\` is index 0, same before and after softmax.

## Moving parts

| Piece | Role |
|---|---|
| \`z_i\` | Logit: any real number. Need not be positive. Need not sum to 1. |
| \`m\` | \`max(z)\`. Subtract first so \`exp\` does not explode. |
| \`exp(z_i - m)\` | Unnormalized weight. Always > 0. |
| \`p_i\` | Weight divided by the total. Chance. Sums to 1. |

Only **differences** between logits matter. Adding 10 to every logit does not change \`p\`. Dividing by temperature (next lesson) **does**, because it changes differences.

## A second walkthrough (tied losers)

Tool logits \`[2.0, 0.5, 0.5]\` for search, sql, finish. Max is 2. Shifted: \`[0, -1.5, -1.5]\`.

Exp: \`[1, exp(-1.5), exp(-1.5)]\` ≈ \`[1, 0.2231, 0.2231]\`. Sum ≈ 1.446.

Chances ≈ \`[0.691, 0.154, 0.154]\`. Search wins, but the two tied losers **share** the leftover mass equally. Softmax does not pick a unique second place when logits tie. Greedy still picks search. Sampling (next lesson) will draw sql and finish equally often among the tail.

One logit: softmax(\`[7.0]\`) is always \`[1.0]\`. Two equal logits, any size: always \`[0.5, 0.5]\`. Huge gap \`[20, 0]\`: the winner is ~1.0 for any practical printout; a tiny tail remains in theory.

## A Friday ticket

Friday 17:10. A guardrail used cutoff \`0.35\` on a column named \`probability\`. The vendor was sending **raw logits**. Search sat at 4.2, sql at 1.1. Both passed 0.35. The bot called two tools every turn. After they ran softmax, search was about 0.95 and sql about 0.05. Only search passed the cutoff.

The ticket was titled “duplicate tool calls.” The math was: logits are not chances. They asserted \`abs(sum(p) - 1) < 1e-6\` after softmax, labeled the log column \`p_tool\`, and refused to compare a cutoff meant for chances against a logit.

## Implement it

\`\`\`tryit python
import math

def softmax(zs):
    m = max(zs)
    exps = [math.exp(z - m) for z in zs]
    total = sum(exps)
    return [e / total for e in exps]

def pretty(ps):
    return [round(p, 3) for p in ps]

print("equal logits", pretty(softmax([1, 1, 1])))
print("clear winner", pretty(softmax([4, 1, 0])))
print("sum", round(sum(softmax([4, 1, 0])), 6))

# subtracting max does not change p
z = [1000.0, 999.0, 998.0]
print("stable huge", pretty(softmax(z)))

# without the max trick this would overflow:
# math.exp(1000)  # inf
print("argmax", ["search", "sql", "finish"][softmax([2.0, 0.1, -1.0]).index(max(softmax([2.0, 0.1, -1.0])))])
\`\`\`

Equal logits → \`[0.333, 0.333, 0.333]\`. Clear winner → about \`[0.936, 0.047, 0.017]\` — most of the mass, not all of it. Sum prints \`1.0\`. Stable huge prints the same shape as softmax of \`[0, -1, -2]\`, about \`[0.665, 0.245, 0.090]\`. Argmax prints \`search\`. The huge-logit line still prints numbers because we subtracted 1000 first.

Never softmax twice. Never treat logits as if they already sum to 1. In tests, check \`sum(p) == 1\` within a tiny tolerance, and check that a huge logit does not become \`nan\`.

Empty list or a single logit: one logit softmax is always \`[1.0]\`. Two equal logits always split 50/50, regardless of how large they both are — only **differences** matter.

Hand-check \`[4, 1, 0]\` without a computer. Max is 4. Shifted: \`[0, -3, -4]\`. Exp: \`[1, exp(-3), exp(-4)]\` ≈ \`[1, 0.050, 0.018]\`. Sum ≈ 1.068. Chances ≈ \`[0.936, 0.047, 0.017]\` (the box rounds a bit differently if it does not subtract 4 first — algebra says the same p). The winner is not 100%. Softmax always leaves a tail unless the logit gap is huge.

Logits are not embeddings. Softmax is not a normalize-to-length-1 step (that is \`v / |v|\` from the vectors lesson). Confusing those two maps is how people “softmax an embedding” and then wonder why ranking broke. Use cosine or dot product for ranking lists of floats that stand for text. Use softmax when you need **chances that sum to 1** so you can sample or take \`-log q_true\`.

## What goes wrong

- **Overflow:** \`exp(1000)\` is \`inf\`. Then \`inf/inf\` is \`nan\`. Subtract \`max(z)\` **every** time. The box already does this. Copy that pattern into production.
- **Softmax twice:** you squash an already-valid chance list toward a peakier list that is not the model’s distribution. If you already have chances, stop. If you have log-chances, exp and normalize **once**.
- **Empty list:** no logits, no distribution. Raise. Do not return \`[]\` and later divide by \`sum = 0\`.
- **Ties:** equal logits share mass. Argmax needs a documented tie-break (first index, or a reserved \`finish\`). Silent “first in the list” is a policy. Write it down.
- **Cutoff on the wrong column:** 0.35 on a logit is not 0.35 on a chance. Assert the column sums to 1 if you claim it is a chance.

Production logs: the **full** small catalog of \`p_i\` (tools are few), or at least argmax name, argmax p, and entropy of p. Assert no \`nan\`, no negative p, unit sum. A test vector \`[1000, 999, 998]\` must return finite chances, same shape as softmax of \`[0, -1, -2]\`.

## How agents use this

Tool-calling models score tools with the same machinery as tokens. Softmax is the last map before a draw. If you log “probability” from a vendor, ask: is that already softmax, or a raw logit?

- **Tokens:** vocab-sized logit list → softmax → chances. Loss is \`-log\` of the chance on the true token (next lesson). Sampling draws from this list (lesson after).
- **Ranking:** you can softmax **scores** over a small candidate set to get a distribution over chunks. Entropy of that list is retrieval confusion. This is not required for top-k; it is useful when you need weights that sum to 1 (attention, mixture).
- **Loss:** softmax + cross-entropy is the usual classification loss. Numerically, people use log-softmax (subtract max, then log of normalized exp) so they never exp then log.
- **Temperature:** divide logits by T **before** softmax. Same function, different input. Argmax of logits does not change when T > 0.

Subtract max(logit) inside softmax every time. Overflow is a silent NaN in some environments and a crash in others. The algebra is the same; the float is not.

> **Warning:** Subtract max(logit) inside softmax every time. Overflow is a silent NaN in some environments and a crash in others.

\`\`\`quiz
Why subtract max(z) before exp in softmax?
- It changes which token wins
- *It stops overflow; the chances stay the same
- It turns logits into embeddings
- It makes all chances zero
explain: exp(z - max) / sum is algebraically the same as exp(z) / sum, but it does not explode.
\`\`\`
`,
  },
  {
    slug: "sampling",
    title: "Sampling and Temperature",
    summary:
      "Temperature rescales logits before softmax. Then you draw with random(). Low T is greedy; high T is noisy.",
    minutes: 21,
    level: "intermediate",
    md: `
**Temperature** \`T > 0\` rescales logits **before** softmax: use \`z_i / T\`.

- \`T → 0\`: the largest logit dominates; you approach **greedy** argmax (repeatable, given ties).
- \`T = 1\`: the model’s native distribution.
- \`T > 1\`: the distribution **flattens** toward uniform; more entropy, more chance of a weird token.

Temperature does not “add creativity” as a slogan. It **changes the categorical you sample**. At high T you spend entropy; at low T you copy the mode.

Sampling: draw \`u\` uniform on \`[0,1)\`, walk the cumulative sum of \`p_i\`, pick the first index where the cumulative meets \`u\`. That is the same walk as the cost-sampler in the expectation lesson.

Tiny walk: chances \`[0.50, 0.30, 0.20]\`. Draw \`u = 0.55\`. After index 0 the cumulative is 0.50 (not enough). After index 1 it is 0.80 (enough). You pick index 1. If \`u = 0.02\`, you pick index 0. If \`u = 0.99\`, you pick index 2. The last index is a safety net when rounding leaves a hair of mass unused.

## A wrong picture

A wrong picture is: “temperature changes which token has the biggest logit.” It does **not**. Argmax of logits is invariant to dividing by T > 0. Softmax **chances** change; the winner of greedy does not (ties aside). Raising T does not flip the softmax winner. It flattens chances so samples **diversify**.

Another wrong picture is: “high T is smarter” or “low T is always safer.” Low T is repeatable, which evals love, and it can trap loops (“I’ll search again”). High T makes a ditherer: more wasted tools, more weird tokens. Moderate T plus a **stop** tool and a max-step budget is a typical compromise.

A third: comparing two prompts at T>0 **without a seed** (or without many draws). “Which prompt won?” is then a coin flip. Seed evals when you compare prompts. Score the **distribution** of plans, not a single lucky run.

Clip T above a tiny floor so you never divide by 0.

## The formula in words

Scale logits by 1/T. Softmax. Draw.

Tiny numeric. Logits \`[2.0, 1.0, 0.2, -1.0]\` for search, sql, finish, wait. At T=0.2 the gap 2 vs 1 becomes 10 vs 5; search eats almost all mass. At T=2 the gap becomes 1 vs 0.5; sql, finish, even wait show up in 12 samples. Same logits, different agent. If your production temperature is accidentally 2.0, “the model got worse” is a **sampling** bug.

Greedy: pick \`search\` every time from these logits.

\`\`\`viz bars
title Same logits at T=0.2 (almost greedy)
bar search,0.99,0
bar sql,0.01,1
bar finish,0.00,2
bar wait,0.00,3
caption Search eats the pile. Low T copies the winner.
\`\`\`

\`\`\`viz bars
title Same logits at T=2 (flatter)
bar search,0.45,0
bar sql,0.27,1
bar finish,0.18,2
bar wait,0.10,3
caption Gaps shrink. Wait now shows up. High T spends entropy.
\`\`\`

## Moving parts

| Piece | Role |
|---|---|
| \`T\` | Temperature. Divides logits **before** softmax. Must be > 0. |
| \`p\` | Chances after softmax. Sum to 1. |
| \`u\` | One draw, uniform on \`[0, 1)\`. |
| Top-k / top-p | Optional cutoff on \`p\`, then **renormalize**. |
| Seed | Makes the sequence of \`u\` repeatable. |

Argmax of logits does **not** move when you change T > 0. The **chances** move. Samples follow the chances.

## A second walkthrough (top-k and top-p)

Start from chances \`[0.50, 0.30, 0.15, 0.05]\` on search, sql, finish, wait.

**Top-k = 2:** keep the two largest, drop finish and wait, renormalize. Remaining mass is 0.80. New chances \`[0.50/0.80, 0.30/0.80] = [0.625, 0.375]\`. You will never sample finish. The tail is gone.

**Top-p = 0.90 (nucleus):** walk largest-first until the cumulative meets 0.90. Sorted: 0.50, then 0.80, then 0.95. After three tokens you have 0.95 ≥ 0.90, so the nucleus is search+sql+finish. Drop wait (0.05). Renormalize by 0.95: about \`[0.526, 0.316, 0.158]\`. Wait is gone; finish still lives.

**Draw \`u = 0.55\`** on the original list: cumulative 0.50 (not enough), 0.80 (enough) → sql. Same \`u\` after top-k=2: cumulative 0.625 (enough) → still sql. Same \`u\` is not a different universe if the cutoff did not remove the winner of that \`u\`.

Tie at greedy: logits \`[2.0, 2.0, 0.0]\`. Two winners. Pick a rule (first index, or prefer \`finish\`). Do not leave it to “whatever Python’s max does on a list.”

## A Friday ticket

Friday eval bake-off. Prompt A beat prompt B on 12 tickets at \`T = 0.8\` with **no seed**. Monday they reran. B won. The logits had not changed. The draws had. After they seeded 20 traces per prompt, pass rates matched within a few points. The “winner” had been one lucky \`u\`.

A second Friday: production temperature was accidentally \`2.0\` after a config merge (default in a client library). Tool entropy jumped. Wait and finish showed up on refund tickets. The logits were the same as Thursday. Sampling was not.

## Implement softmax with T and a draw

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
    print("T", T)
    for tok, pi in zip(tokens, p):
        print(" ", tok, round(pi, 3))
    draws = [tokens[sample(p)] for _ in range(12)]
    print("  samples", draws)

print("greedy", tokens[max(range(len(logits)), key=lambda i: logits[i])])
\`\`\`

At \`T = 0.2\` almost every sample is \`search\` (chance about 0.993 on search, tiny on the rest). At \`T = 1\` search still leads but sql appears. At \`T = 2\` you will see \`sql\`, \`finish\`, even \`wait\`. Greedy prints \`search\`. Seed 3 makes the 12-draw lists repeatable. Rerun with another seed to see T>0 move; greedy will not.

If T is 0.2 and you still see lots of \`wait\`, you did not divide logits (you might have multiplied). Check the chance table before the samples.

## What goes wrong

- **T = 0:** division by zero. Clip T above a tiny floor (for example \`1e-5\`) if you want “almost greedy.” True greedy is argmax, not softmax at T=0.
- **Multiplied instead of divided:** T=2 should flatten. If it peaks harder, you used \`z * T\`. Print the chance table before you look at samples.
- **Cutoff then forgot to renormalize:** remaining mass is 0.80, but you still draw \`u\` against the old list. Some \`u\` land in the dropped tail and hit the safety-net last index. Always renormalize after top-k / top-p.
- **Ties:** two equal max logits. Greedy needs a written tie-break. Sampling will split them 50/50 at any T.
- **Unseeded evals:** one lucky \`u\` is not a prompt winner. Seed, or average many draws.

Production logs: \`T\`, seed (or \`unseeded\`), chosen token/tool, \`p_chosen\`, and entropy of p. Assert \`T > 0\`, unit sum after softmax **and after** any nucleus cutoff, and that the last-index safety net rarely fires (if it fires often, mass does not sum to 1).

## How agents use this

Temperature on **tool** logits is a policy knob: near-greedy makes a stubborn specialist; high T makes a ditherer. Log the chosen tool **and** its chance. A long tail of 0.15 decisions is an entropy problem you can fix with a better prompt, fewer tools, or lower T.

- **Tokens:** production often uses T near 0 for tools and slightly higher for prose. Split them if the API allows. Do not raise T on tool names to “add creativity.”
- **Ranking:** retrieval is usually greedy top-k, not sampled. Sampling documents is a rare product choice; if you do it, seed it and log the scores.
- **Loss:** train at the model’s native distribution (T=1 in the loss). Do not train with a high T and then decode greedy without measuring the gap.
- **Evals:** seed when you compare prompts. Unseeded T>0 makes “which prompt won?” a coin flip. For diversity, **many** seeded draws, then score the set of plans.

Top-k and top-p are extra filters on the same \`p\` list, not a different softmax. They cut the long weird tail without driving T all the way to 0. Seeded sampling with T > 0 is how you generate diverse traces for evals: same prompt, many draws, then score the distribution of plans rather than a single lucky run.

> **Tip:** Seed evals when you compare prompts. Unseeded T>0 makes “which prompt won?” a coin flip.

\`\`\`quiz
Raising temperature above 1, with the same logits, generally
- Makes greedy argmax more likely to change the softmax winner
- *Flattens the chance distribution, increasing entropy of samples
- Converts logits into embeddings
- Sets all chances to zero
explain: Dividing logits by T>1 shrinks gaps between them. Softmax then looks closer to uniform; samples diversify.
\`\`\`
`,
  },
  {
    slug: "cross-entropy",
    title: "Cross-Entropy, KL, and Perplexity",
    summary:
      "Cross-entropy scores a predicted distribution against the true one. KL is extra bits. Perplexity is exp of that.",
    minutes: 21,
    level: "intermediate",
    md: `
**Cross-entropy** asks: if the truth is distribution \`p\`, and the model predicts \`q\`, how many bits do we spend on average to name the outcome using \`q\`?

\`H(p, q) = -sum p_i log q_i\`

If \`p\` is a one-hot (the true next token is index k), this collapses to \`-log q_k\`. That is the usual **token loss**. A model that put chance 0.5 on the right token pays 1 bit. Chance 0.25 pays 2 bits. Chance near 0 pays a huge bill.

**KL divergence** \`D_KL(p || q)\` is extra bits beyond the entropy of \`p\`:

\`D_KL(p || q) = H(p, q) - H(p)\`

It is 0 when \`p = q\`. It is not a distance: \`D_KL(p || q)\` is not \`D_KL(q || p)\`. Training a classifier is often “drive KL (or cross-entropy) down on the training labels.”

**Perplexity** is \`2^{H}\` when H is in bits, or \`exp(H)\` when H is in nats. It is “how many options does this feel like, on average?” Perplexity 10 means as confused as a uniform choice among 10 tokens. Lower is sharper (on that data). Lower on **training** data can also mean memorization. Use a held-out set.

## A wrong picture

A wrong picture is: “training cross-entropy is quality.” Perplexity does not know if the answer was **useful**. A model can pay few bits copying the training set and still fail the ticket. Use eval tasks. Held-out perplexity is a **health check** (prompt, tokenizer, or model id changed), not a trophy.

Another wrong picture is: “KL is a distance.” Distances are symmetric. KL is not. Print both directions if you compare two policies. Distillation often minimizes KL from teacher to student — the order is a product choice.

A third: \`log(0)\` on the true class. Infinite loss, NaNs in the log. Guard \`q\` with a tiny floor, or use log-softmax. That is why people clip \`q\` away from 0 before they log.

You cannot beat H(p) on average: cross-entropy is at least entropy of the truth. The extra is KL. If labels are noisy, the model will still try to put mass there. Garbage labels, garbage \`q\`.

## The formula in words

Cross-entropy: weighted average of \`-log q_i\` with weights \`p_i\`. One-hot p: only the true index survives, so \`-log q_true\`.

KL: cross-entropy minus entropy of p. Extra bits the model wastes relative to a perfect encoder of p.

Perplexity: 2 to the power of bits of cross-entropy (or e to the nats). Units: “effective number of choices.”

Tiny numeric. True one-hot \`[0, 1, 0]\`. Good \`q = [0.05, 0.90, 0.05]\`: CE = \`-log2(0.90) ≈ 0.152\` bits, perplexity \`2^0.152 ≈ 1.11\`. Bad \`q = [0.40, 0.20, 0.40]\`: CE = \`-log2(0.20) = 2.32\` bits, ppl about 5. Flat 1/3: CE = \`-log2(1/3) ≈ 1.585\`.

Asymmetric KL: p=\`[0.7, 0.3]\`, q=\`[0.6, 0.4]\` vs swapped — two different numbers.

\`\`\`viz bars
title Truth is one-hot on the middle token
bar a,0.00,0
bar true,1.00,1
bar c,0.00,2
caption All mass on the true index. Cross-entropy is then minus log of q on that index.
\`\`\`

\`\`\`viz bars
title Good q puts 0.90 on the true token
bar a,0.05,0
bar true,0.90,1
bar c,0.05,2
caption Pays about 0.15 bits. A bad q with only 0.20 on true would pay 2.32 bits.
\`\`\`

## Moving parts

| Name | Formula in words |
|---|---|
| Cross-entropy \`H(p,q)\` | Average \`-log q_i\` with weights \`p_i\` |
| Entropy \`H(p)\` | Average \`-log p_i\` with weights \`p_i\` |
| KL | Extra bits: CE minus H(p). Not symmetric. |
| Perplexity | \`2^H\` in bits, or \`exp(H)\` in nats |

One-hot p: only the true index survives, so CE is \`-log q_true\`. That is the usual token loss.

## A second walkthrough (soft labels)

Truth is not one-hot this time: \`p = [0.80, 0.20]\`, model \`q = [0.60, 0.40]\`.

\`-log2(0.60) ≈ 0.737\`, \`-log2(0.40) ≈ 1.322\`.

CE = \`0.80*0.737 + 0.20*1.322 = 0.590 + 0.264 = 0.854\` bits.

Entropy of p: \`-log2(0.80) ≈ 0.322\`, \`-log2(0.20) = 2.322\`.

\`H(p) = 0.80*0.322 + 0.20*2.322 = 0.258 + 0.464 = 0.722\` bits.

KL = \`0.854 - 0.722 = 0.132\` bits. The model is close, not equal. Swap p and q and you get a **different** KL (the tryit prints both). Distances are symmetric. KL is not.

If q were one-hot on the wrong class, CE is huge (clip at \`1e-12\` → about 40 bits). If q matches p exactly, KL is 0 and CE equals H(p). You cannot beat H(p) on average.

## A Friday ticket

Friday 11:00. Training loss was still falling. Held-out perplexity jumped from about 12 to about 31 overnight. The incident title was “the model got worse.” A tokenizer config had changed; token ids on the held-out set no longer matched the ids the model was trained on. Train CE kept looking healthy because it was computed on the new ids against the same files, now misaligned in a way that still had a frequent token to copy.

They started logging \`ppl_heldout_bits\` on a frozen transcript set at T=1, with the tokenizer version next to it. Shipping on training CE alone was banned. Perplexity is a health check, not a trophy.

## Code the three numbers

\`\`\`tryit python
import math

def entropy(ps):
    return -sum(p * math.log(p, 2) for p in ps if p > 0)

def cross_entropy(p, q):
    total = 0.0
    for pi, qi in zip(p, q):
        if pi == 0:
            continue
        qi = max(qi, 1e-12)
        total -= pi * math.log(qi, 2)
    return total

def kl(p, q):
    return cross_entropy(p, q) - entropy(p)

def perplexity_bits(h):
    return 2 ** h

true = [0, 1, 0]
good = [0.05, 0.90, 0.05]
bad = [0.40, 0.20, 0.40]
flat = [1 / 3, 1 / 3, 1 / 3]

print("H(true) one-hot", entropy([1.0]))
print("CE good", round(cross_entropy(true, good), 3), "ppl", round(perplexity_bits(cross_entropy(true, good)), 3))
print("CE bad ", round(cross_entropy(true, bad), 3), "ppl", round(perplexity_bits(cross_entropy(true, bad)), 3))
print("CE flat", round(cross_entropy(true, flat), 3))

p = [0.7, 0.3]
q = [0.6, 0.4]
print("KL(p||q)", round(kl(p, q), 3))
print("KL(q||p)", round(kl(q, p), 3))
\`\`\`

H(true) one-hot is \`0.0\` (we passed \`[1.0]\` as a peaked distribution). CE good about \`0.152\`, ppl about \`1.111\`. CE bad about \`2.322\`, ppl about \`5.0\`. CE flat about \`1.585\`. KL(p||q) and KL(q||p) print two **different** small numbers (about 0.031 vs 0.033 — order matters). The good predictor pays fewer bits than the bad one. Clip \`q\` away from 0 before you log, or a single zero chance on a true token is infinite loss.

Fine-tunes minimize cross-entropy on “the right next token” (or the right tool name). If your labels are noisy, the model will still try to put mass there.

## What goes wrong

- **\`log(0)\`:** infinite loss, then NaNs. Guard \`q\` with a tiny floor, or use log-softmax so you never exp then log a zero.
- **Mixing bits and nats:** \`math.log\` vs \`log2\`. Perplexity is \`2^H\` only if H is in bits. If H is in nats, use \`exp(H)\`. Label the unit.
- **Train CE as quality:** falling train CE can be memorization. Held-out CE / perplexity is the health check. Eval tasks are the trophy.
- **Asymmetric KL:** printing one direction and comparing it to a paper that used the other looks like a regression. Distillation order is a product choice: teacher→student is not student→teacher.
- **Softmax twice before CE:** you score a different \`q\` than the model. Loss then trains the wrong object.

Production logs: mean token CE (say bits or nats), held-out perplexity, tokenizer/model id, and a canary that CE stays finite on a batch with a rare token. Assert \`q_i >= floor\`, unit sum, and that KL ≥ -tiny (floating noise). A sudden ppl jump is a prompt, tokenizer, or model-id change until proven otherwise.

## How agents use this

Perplexity on a **held-out** transcript set is a cheap health check: a sudden jump means the prompt, tokenizer, or model id changed. Distillation and some ranking heads minimize KL from a teacher distribution to a student.

- **Tokens:** usual training loss is token cross-entropy. Average it over a batch (sums lesson). Log in nats or bits; say which.
- **Ranking:** a softmax over candidate chunks plus CE toward the gold chunk is a listwise ranking loss. Pairwise “gold should beat distractor” is a cousin.
- **Loss:** this **is** the loss for classification and next-token training. It is not F1. It is not dollars. If you want those, put them in eval, or add a term (chain rule: no path, no optimize).
- **Sampling:** decode T does not change the trained \`q\` unless you divide logits at train time too. Measure CE at T=1.

You cannot beat H(p) on average: cross-entropy is at least entropy of the truth. The extra is KL. If labels are noisy, the model will still try to put mass there. Garbage labels, garbage \`q\`.

> **Warning:** \`log(0)\` on the true class is infinite loss. Guard \`q\` with a tiny floor, or you will debug NaNs instead of agents.

\`\`\`quiz
For a one-hot true token k, cross-entropy is
- Entropy of a uniform distribution
- *Minus log of the model’s chance on k
- Always 0
- The learning rate
explain: One-hot p puts all mass on k, so -sum p log q becomes -log q_k. That is the usual token loss.
\`\`\`
`,
  },
  {
    slug: "attention-mean",
    title: "Weighted Averages and Attention",
    summary:
      "Attention is a weighted average of value vectors. The weights come from softmax of scores — the same mix as a tiny memory.",
    minutes: 20,
    level: "intermediate",
    md: `
A **weighted average** is \`sum(w_i * x_i)\` where the weights are chances: they are ≥ 0 and they **sum to 1**. You already met this in the sums lesson. Softmax builds those weights.

**Attention** is that idea with extra names:

1. Compare a **query** to each **key**. Each comparison is a score (often a dot product).
2. Softmax the scores. Now you have weights.
3. Take the weighted average of the **value** vectors.

The output is one vector: a mix of the values, with more mix from the keys that matched the query. That is “look at the relevant tokens.” You do not need a GPU to see it. You need a query, some keys, some values, and softmax.

(Transformer internals, one line: real models also scale the dots by sqrt of dimension and run several of these mixes in parallel heads. The object did not change.)

## A wrong picture

A wrong picture is: “attention is the model thinking” or “attention means the model understands that span.” Attention means **those softmax weights were large** on that span’s value. You can log weights in a toy loop. In a giant model you usually cannot — you infer it from behavior.

Another wrong picture is: “the output is always the value with the biggest key.” Only if softmax is extremely peaked (huge score gaps, or tiny temperature). If scores are equal, the output is the **mean** of the values. If every weight is ~1/n, attention is just a mean. The query is not distinguishing anything. Check the scores.

A third: mixing queries and keys from different spaces (linear-maps lesson). Dot products then rank noise. Same transform on both, or none.

## The formula in words

Score_i = dot(query, key_i). Weights = softmax(scores). Output = sum weight_i * value_i (slot by slot).

Tiny numeric. Query \`[1, 0]\`. Keys \`[1, 0]\` and \`[0, 1]\`. Values \`[10, 0]\` and \`[0, 10]\`. First score is 1, second is 0. Softmax puts most weight on the first. Output looks like \`[10, 0]\` mixed with a little of the second. Flip the query to \`[0, 1]\` and the output looks like the second value.

If both scores were 0, weights 50/50, output \`[5, 5]\` — the mean.

## Moving parts

| Piece | Role |
|---|---|
| Query | The question, as a vector. |
| Key | What you compare the query to. One per memory slot. |
| Score | Usually \`dot(query, key)\`. |
| Weight | Softmax of the scores. ≥ 0, sum to 1. |
| Value | The payload you mix. Can equal the key in toys; not required. |
| Output | \`sum weight_i * value_i\`, slot by slot. |

If scores are equal, weights are \`1/n\` and the output is the **mean** of the values. Attention is then just an average. The query is not distinguishing anything.

## A second walkthrough (three slots)

Query \`[1, 0]\`. Keys \`[1, 0]\`, \`[0.7, 0.7]\`, \`[0, 1]\`. Scores: \`1\`, \`0.7\`, \`0\`.

Max is 1. Shifted: \`[0, -0.3, -1]\`. Exp ≈ \`[1, 0.741, 0.368]\`. Sum ≈ 2.109.

Weights ≈ \`[0.474, 0.351, 0.174]\`. Most mass on slot 0, but not a hard pick. Softmax of 1 vs 0.7 vs 0 is still a mix.

\`\`\`viz heat
title Attention weights on three memory slots
row 0.47,0.35,0.17
labels slot0 slot1 slot2
caption Darker means more mix. Slot 0 wins, but 0.47 is still a mix — not a hard look.
\`\`\`

Values \`[8, 0]\`, \`[0, 8]\`, \`[4, 4]\`:

- x = \`0.474*8 + 0.351*0 + 0.174*4 ≈ 3.792 + 0.696 = 4.488\`
- y = \`0.474*0 + 0.351*8 + 0.174*4 ≈ 2.808 + 0.696 = 3.504\`

Output about \`[4.49, 3.50]\`. Flip the query to \`[0, 1]\` and the scores become \`0\`, \`0.7\`, \`1\` — mass moves toward the last value. Same mixer, different mix.

Huge score gap, say \`[10, 0, 0]\`: weights ≈ \`[1, 0, 0]\`, output ≈ first value. Tiny temperature on the scores (divide scores by T < 1 before softmax) peaks the same way.

## A Friday ticket

Friday 15:20. A postmortem said “the model attended to the refund policy.” Someone had dumped three attention weights: \`0.34, 0.33, 0.33\`. That is a **mean**, not a look. The scores were nearly equal. The mixer was averaging the refund FAQ with a password snippet and a cafeteria line. The generator then blended them.

They started logging \`attn_max_weight\`, entropy of the weights, and the score list. A rule: if max weight < 0.45 on a 3-slot memory, treat the mix as confused — ask a clarifying question instead of quoting the average.

## A 2-token picture

Two memory slots. A query that looks like slot 0 should put most weight on value 0.

\`\`\`tryit python
import math

def dot(u, v):
    return sum(a * b for a, b in zip(u, v))

def softmax(zs):
    m = max(zs)
    exps = [math.exp(z - m) for z in zs]
    z = sum(exps)
    return [e / z for e in exps]

def attention(query, keys, values):
    scores = [dot(query, k) for k in keys]
    weights = softmax(scores)
    dim = len(values[0])
    out = [0.0] * dim
    for w, val in zip(weights, values):
        for i, x in enumerate(val):
            out[i] += w * x
    return weights, out

query = [1.0, 0.0]
keys = [
    [1.0, 0.0],
    [0.0, 1.0],
]
values = [
    [10.0, 0.0],
    [0.0, 10.0],
]
w, out = attention(query, keys, values)
print("weights", [round(x, 3) for x in w])
print("output ", [round(x, 3) for x in out])

query2 = [0.0, 1.0]
w2, out2 = attention(query2, keys, values)
print("weights", [round(x, 3) for x in w2])
print("output ", [round(x, 3) for x in out2])
\`\`\`

First query sits on the first key: weights about \`[0.731, 0.269]\`, output about \`[7.31, 2.69]\` — mostly the first value \`[10, 0]\`, some mix of \`[0, 10]\`. Second query sits on the second key: weights flipped, output about \`[2.69, 7.31]\`. Softmax of scores 1 and 0 is not a hard 1.0 — exp(1) vs exp(0) is about 2.718 vs 1, so 73% / 27%. If you wanted a harder pick, larger score gaps (or lower T on the scores) would peak the weights.

If the scores were equal, the output would be the mean of the values. That is attention with a confused query.

## What goes wrong

- **Equal scores:** weights \`1/n\`, output is the mean. Logging “attended to chunk 1” is a lie if weight is 0.34 of 0.33. Print the weights.
- **Score overflow:** same as softmax. Subtract max(score) before exp. A huge dot from an unnormalized key can \`nan\` the mix.
- **Mismatched spaces:** query from embedder A, keys from embedder B. Dots rank noise. Same transform on both, or none.
- **Mixing query/key/value lengths:** zip truncates. Assert one dimension for keys vs query, and all values the same width.
- **Hard select vs mix:** top-1 of values is not attention unless softmax is extremely peaked. If you wanted a hard select, say so. If you wanted a mix, check entropy of the weights.

Production logs: scores, weights (they are few in a toy memory), output magnitude, \`max(weight)\`, entropy of weights. Assert weights sum to 1, no \`nan\`, and that values have equal dimension. Sampling happens **after** this mix, on token logits — attention itself is deterministic given query, keys, values.

## How agents use this

Long context is “which past tokens should this step mix?” Retrieval outside the net is the same geometry: neighbors in, then a mix or a hard top-k. The generator cannot recover a chunk that never made the candidate set.

- **Tokens:** inside a model, this mix is how past tokens influence the next. You do not implement it here. You **do** implement the same mix for memories you own: weighted average of retrieved vectors.
- **Ranking:** scores are dots (or cosines). Softmax turns them into mix weights. Top-k without softmax is a hard select, not a mix.
- **Loss:** if you train a tiny mixer, CE or a ranking loss on the output vector is legal. Giant-model attention weights are usually not your training handle.
- **Sampling:** attention is deterministic given query, keys, values. Sampling happens **after**, on token logits.

When a paper says “the model attended to the tool result,” they mean those softmax weights were large on that span. Check the numbers. If every weight is ~1/n, the query is not distinguishing anything.

> **Tip:** If every weight is ~1/n, attention is just a mean. The query is not distinguishing anything. Check the scores.

\`\`\`quiz
Attention’s output is
- Always the value with the biggest key
- *A weighted average of the value vectors, with weights from softmax of scores
- The raw query vector unchanged
- A probability that sums to n
explain: Softmax turns scores into weights that sum to 1. Mix the values with those weights. That mix is the output.
\`\`\`
`,
  },
  {
    slug: "embeddings-geometry",
    title: "Embedding Geometry",
    summary:
      "Nearest neighbors in a list of 2-d and 3-d points. RAG is this picture in a few hundred dimensions — plus a cutoff.",
    minutes: 21,
    level: "intermediate",
    md: `
An **embedding space** is just a vector space where you decided that **nearby** means **related**. The embedder is a function from text (or images, or tool traces) to a point. Retrieval is **nearest neighbor search**: given a query point, return the stored points with best cosine (or smallest distance).

You cannot see 1536 dimensions. You can see 2 and 3. The algorithms do not change: same list, same cosine, same sort. Clusters that look obvious in 2-d are the same phenomenon as “all refund FAQs sit in a blob” in high-d. Failures also match: a query on the **boundary** between two blobs retrieves a mix; a query in empty space retrieves **something** anyway, because top-k always returns k.

That last point is why RAG needs a **score cutoff**, not only k. The nearest neighbor of a garbage query is still a neighbor, not a refusal.

## A wrong picture

A wrong picture is: “more dimensions always separate topics better, so ranking gets easier.” Extra axes **can** separate (an infra axis in 3-d). They also make pairwise distances look more similar. That is one reason cosine and normalization matter **more**, not less, as models get wider.

Another wrong picture: “top-k means the chunks are relevant.” k neighbors are **always** returned, even if every score is poor. Without a similarity cutoff (or a refusal path), RAG will stuff weak chunks into the prompt. Look at the **score**.

A third: “improving the LLM fixes a broken neighborhood.” The generator cannot recover a chunk that never made top-k. Evaluate the **retriever** with recall@k on (question, gold chunk) pairs **before** you judge the generator.

Mixing embedders, stretching only documents, and averaging across models: all two-space bugs from earlier lessons. Geometry here assumes one space.

## The formula in words

For each stored vector, cosine(query, vector). Sort descending. Take k. Optionally drop any with cosine below a threshold.

Tiny numeric. Billing cloud near \`[0.9, 0.1]\`, auth near \`[0.1, 0.9]\`. Query \`[0.85, 0.15]\` should pick billing. A vague query in 3-d \`[0.4, 0.4, 0.4]\` still gets two “hits” — read the scores; if they are mediocre, refuse.

\`\`\`viz scatter
title Two clusters: billing vs auth
xlabel axis 1
ylabel axis 2
xmin -0.1
xmax 1.1
ymin -0.1
ymax 1.1
dot 0.9,0.1 refund 0
dot 0.8,0.2 invoice 0
dot 0.1,0.9 password 1
dot 0.2,0.8 SSO 1
dot 0.85,0.15 query 2
caption Query sits in the billing blob. Auth is the other cloud. Nearest neighbor is geometry plus a sort.
\`\`\`

## Moving parts

| Piece | Role |
|---|---|
| Query vector | The question, in the same space as the store. |
| Store | Labeled points (text + vector). |
| Score | Cosine (or dot, if both are length 1). |
| \`k\` | How many neighbors to keep. Always returns k. |
| Cutoff | Drop neighbors below a similarity. This is the refusal. |

Top-k without a cutoff **always** returns k points, even if every score is poor. That is geometry, not a product opinion.

## A second walkthrough (by hand)

Query \`q = [0.85, 0.15]\`. Magnitude \`sqrt(0.85^2 + 0.15^2) = sqrt(0.745) ≈ 0.863\`.

Billing \`b = [0.9, 0.1]\`. Magnitude \`sqrt(0.81 + 0.01) = sqrt(0.82) ≈ 0.906\`.

Dot \`0.85*0.9 + 0.15*0.1 = 0.765 + 0.015 = 0.780\`.

Cosine \`0.780 / (0.863 * 0.906) ≈ 0.780 / 0.782 ≈ 0.997\`.

Auth \`a = [0.1, 0.9]\`. Same magnitude ≈ 0.906. Dot \`0.85*0.1 + 0.15*0.9 = 0.085 + 0.135 = 0.220\`.

Cosine \`0.220 / 0.782 ≈ 0.281\`.

A cutoff of 0.35 **keeps** billing and **drops** auth. Top-2 with no cutoff would still return auth as a “hit.” The 0.281 is a neighbor, not a relevant paragraph.

Zero vector: magnitude 0, cosine undefined (divide by zero). Treat as a failed embed. Do not rank it.

Tied scores: two billing FAQs at 0.99. Break the tie with recency or a trusted source. Geometry should not be the only policy.

## A Friday ticket

Friday 18:05. A garbage query (“asdf”) stuffed a cafeteria-menu chunk into a refund prompt. Top-2 had done its job: it returned two neighbors. The winning cosine was **0.22**. Nobody had logged the score. The generator quoted pizza hours as a refund policy.

They added \`if score < 0.35: refuse\` and printed the top-k scores on every retrieve line. The neighborhood did not get smarter. The policy stopped treating a poor neighbor as evidence.

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
print("2d billing query:")
for row in topk(q_bill, store2d, 2):
    print(" ", round(row[0], 3), row[1], row[2])

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
    print(" ", round(row[0], 3), row[1], row[2])

q_far = [0.4, 0.4, 0.4]
print("3d vague query (still top-2):")
for row in topk(q_far, store3d, 2):
    print(" ", round(row[0], 3), row[1], row[2])
\`\`\`

The 2-d billing query should print two billing rows with high cosines (near 0.99 and 0.99). The 3-d infra query should print the two infra rows with high cosines (near 0.99). The vague query still prints two “hits.” Look at the **score**. If both cosines are mediocre (often ~0.7 here, not 0.99), the agent should say “I don’t have this in memory” instead of quoting a random snippet. That check is one \`if score < 0.35\`. Geometry plus a cutoff is an API.

(Your vague scores depend on the points; what matters is they are **weaker** than the on-cloud queries and **still returned**.)

## What goes wrong

- **No cutoff:** k neighbors always come back. A 0.22 winner is still a winner. Refuse on the **score**, not on the English.
- **Zero / failed embeds:** cosine divides by length. Length 0 is undefined. Drop the row. Do not insert it.
- **Mixed spaces:** query from model A, store from model B. Same dimension is not the same geometry. Scores become noise.
- **Ties:** two chunks at 0.81. Sort is stable or not depending on the language. Add recency or source trust.
- **Empty space:** a query in a hole still has a nearest neighbor. High-d makes many distances look similar. Cutoff matters **more**, not less.

Production logs: top-k **scores** next to texts, the cutoff, whether you refused, and \`len(vec)\` / magnitude on insert. Assert dimension match, no zero vectors, and that a fixture query (billing) out-cosines a fixture distractor (auth). Text without scores is a story.

## What RAG actually adds

Real RAG is this neighbor loop plus: chunking (how a document becomes several points), metadata filters (only search \`label == billing\`), and a generator that **reads** the neighbors. Improving the LLM does not fix a broken neighborhood.

Long-running agents store **memories as points**. If you never decay or cluster them, the store becomes a fog: everything is a weak neighbor of everything. Periodically merge near-duplicates (high cosine to each other) and drop low-magnitude failed embeds.

When you evaluate retrieval, gold chunk should out-cosine the distractors. If it does not, fix chunking or the embedder, not the prompt poem.

## How agents use this

On each turn, retrieve a few memories. Print the top-k **scores** in every retrieve log line. Text without scores is a story; scores are evidence.

- **Tokens:** retrieved text becomes tokens in the prompt. Cost is extra prompt tokens. Bad neighbors cost tokens **and** confuse the generator. A refusal (no chunks) is cheaper than four 0.22 chunks.
- **Ranking:** this lesson **is** ranking. Filters change the candidate set. Cutoff changes precision/recall (next lesson).
- **Loss:** train or choose embedders so gold chunks rank above distractors. Do not use generator CE as a substitute for recall@k.
- **Sampling:** retrieval is greedy given the store. The generator then samples. Failures split cleanly: wrong neighbors vs unlucky decode.

You have the Mathematics track’s toolkit: functions, sums, logs, vectors, dot products, matrices, maps, derivatives, gradients, the chain rule, probability, Bayes, distributions, expectation, entropy, softmax, descent, sampling, cross-entropy, attention, and this geometry. The ML and transformer tracks will reuse every object.

> **Tip:** Print the top-k scores in every retrieve log line. Text without scores is a story; scores are evidence.

\`\`\`quiz
Why is top-k retrieval alone a risky policy for agents?
- Cosine similarity cannot be implemented with lists
- *k neighbors are always returned, even if every score is poor, so the model may quote irrelevant memory
- Embeddings cannot live in 2-d even as a toy
- Temperature disables nearest neighbors
explain: Nearest neighbor always has a winner. Without a similarity cutoff (or a refusal path), RAG will stuff weak chunks into the prompt.
\`\`\`
`,
  },
  {
    slug: "eval-scores",
    title: "Accuracy, Precision, Recall, F1",
    summary:
      "Count true positives. Precision is ‘of the yes-es, how many were right?’ Recall is ‘of the real yes-es, how many did we catch?’",
    minutes: 22,
    level: "intermediate",
    md: `
An agent eval is often a **yes/no** on each ticket: did we pass? did we retrieve the gold chunk? did we call the forbidden tool?

Four counts:

| Name | Meaning |
|---|---|
| **TP** true positive | You said yes, truth is yes |
| **FP** false positive | You said yes, truth is no |
| **TN** true negative | You said no, truth is no |
| **FN** false negative | You said no, truth is yes |

**Accuracy** is \`(TP + TN) / all\`. It lies when most tickets are easy no. A retriever that always says “not found” can look accurate if gold is rare.

**Precision** is \`TP / (TP + FP)\`: of the times you said yes, how often were you right? High precision, low recall means you are picky.

**Recall** is \`TP / (TP + FN)\`: of the real yes-es, how many did you catch? High recall, low precision means you grab everything.

**F1** is the harmonic mean of precision and recall: \`2 * P * R / (P + R)\`. It is 0 if either is 0. Use it when you care about both.

A **cutoff** on a score (cosine, chance) moves you along that tradeoff. Raise the cutoff: fewer yes-es, usually higher precision, lower recall.

## A wrong picture

A wrong picture is: “accuracy is the score to optimize.” Always-no on a set with 80 easy negatives and 20 golds: accuracy 80%, recall **zero**. Do not ship it. If a metric always goes up when you say yes more often, you are looking at recall (or a cousin), not at quality. Pair it with precision.

Another wrong picture is a percent without counts. Five tickets can print 100% F1. Report \`TP/FP/TN/FN\`. Small n cannot tell 0.80 from 0.88 (variance of a proportion).

A third: treating F1 as a physical law. F1 balances P and R **equally**. A refund bot may want high recall (missed gold chunks hurt). A “delete this account” tool may want high precision (false yeses hurt). The cutoff you pick is a product decision, not a math law.

Division by zero: no predicted yeses means precision is undefined; no real yeses means recall is undefined. In code, return 0.0 **and** log that the denominator was 0. Do not print 100%.

## The formula in words

Accuracy: how many decisions matched the label, over all decisions.

Precision: among predicted yes, fraction that were truly yes.

Recall: among truly yes, fraction you predicted yes.

F1: 2PR/(P+R) — zero if either is zero.

Tiny numeric. Balanced: TP=40, FP=10, TN=40, FN=10. All=100. Acc=0.80, P=40/50=0.80, R=40/50=0.80, F1=0.80.

Always no: TP=0, FP=0, TN=80, FN=20. Acc=0.80, P=0 (no predicted yes), R=0, F1=0.

Always yes: TP=20, FP=80, TN=0, FN=0. Acc=0.20, P=0.20, R=1.0, F1 about 0.33.

Sweeping a cosine cutoff on a handful of (score, gold) rows moves these four counts. That is how you pick 0.35 vs 0.5 vs 0.8.

\`\`\`viz heat
title Four counts for the balanced toy
row 40,10,40,10
labels TP FP TN FN
caption Forty true hits, ten false alarms, forty true skips, ten misses. Percents without these four counts are posters.
\`\`\`

\`\`\`viz bars
title Always-no: accuracy hides recall
bar accuracy,0.80,0
bar precision,0.00,1
bar recall,0.00,2
caption Eighty true skips and twenty missed golds. Accuracy is 0.80. Recall is 0. Do not ship it.
\`\`\`

## Moving parts

| Name | Question it answers |
|---|---|
| Accuracy | Of all decisions, how many matched the label? |
| Precision | Of predicted yes, how many were truly yes? |
| Recall | Of truly yes, how many did we catch? |
| F1 | Harmonic mean of P and R. 0 if either is 0. |
| Cutoff | Score threshold that moves you along the P/R tradeoff. |

Report the four counts. A percent without TP/FP/TN/FN is a poster.

## A second walkthrough (ten tickets)

Ten retrieve decisions. Three golds. Cutoff 0.50. Predicted yes on four rows; two of those are gold.

Counts: TP=2, FP=2, FN=1, TN=5.

- Accuracy = \`(2+5)/10 = 0.70\`
- Precision = \`2/(2+2) = 0.50\`
- Recall = \`2/(2+1) ≈ 0.667\`
- F1 = \`2 * 0.50 * 0.667 / (0.50 + 0.667) ≈ 0.667 / 1.167 ≈ 0.571\`

Raise the cutoff to 0.80: maybe only one predicted yes, that one gold. TP=1, FP=0, FN=2, TN=5. Precision 1.0, recall \`1/3 ≈ 0.333\`, F1 0.50. Picky. Lower to 0.20: almost always yes, recall climbs, precision falls. The cutoff is a **product** choice, not a math law.

Always-no on this set: TP=0, FN=3, TN=7, FP=0. Accuracy 0.70, recall **0**, F1 0. Same accuracy as the 0.50 cutoff, useless recall.

Division by zero: no predicted yes → precision undefined. No real yes → recall undefined. Return 0.0 **and** log that the denominator was 0. Do not print 100%.

## A Friday ticket

Friday standup: “retriever accuracy is 94%.” One hundred tickets, six gold chunks. The policy was always-no (cutoff 0.99). TN=94, FN=6, TP=0. Accuracy 0.94, recall 0. They had shipped a polite mute.

The fix was to print \`TP/FP/TN/FN\` on the dashboard and to track recall@k on (question, gold chunk) **before** judging the generator. Accuracy stayed on the chart as a warning label, not as the score to maximize.

## Try the counts and a cutoff

\`\`\`tryit python
def scores(tp, fp, tn, fn):
    all_n = tp + fp + tn + fn
    acc = (tp + tn) / all_n
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) else 0.0
    return acc, prec, rec, f1

# retriever: gold chunk in top-k?
print("balanced", [round(x, 3) for x in scores(40, 10, 40, 10)])
print("always no", [round(x, 3) for x in scores(0, 0, 80, 20)])
print("always yes", [round(x, 3) for x in scores(20, 80, 0, 0)])

# cutoff on cosine: each row is (score, gold)
rows = [
    (0.91, True),
    (0.72, True),
    (0.40, False),
    (0.33, True),
    (0.20, False),
    (0.15, False),
]

def confusion(cutoff):
    tp = fp = tn = fn = 0
    for score, gold in rows:
        pred = score >= cutoff
        if pred and gold:
            tp += 1
        elif pred and not gold:
            fp += 1
        elif (not pred) and (not gold):
            tn += 1
        else:
            fn += 1
    return tp, fp, tn, fn

for c in [0.3, 0.5, 0.8]:
    tp, fp, tn, fn = confusion(c)
    print("cutoff", c, "counts", (tp, fp, tn, fn), "F1", round(scores(tp, fp, tn, fn)[3], 3))
\`\`\`

Balanced prints about \`[0.8, 0.8, 0.8, 0.8]\`. Always no: acc 0.8, precision 0, recall 0, F1 0. Always yes: acc 0.2, precision 0.2, recall 1, F1 about 0.333. “Always no” has high accuracy here and **zero** recall. Do not ship it.

On the six rows, cutoff 0.3 predicts yes for 0.91, 0.72, 0.40, 0.33: TP=3, FP=1, TN=2, FN=0, F1 high. Cutoff 0.5 drops 0.40 and 0.33: you miss a gold at 0.33 (FN), you drop the false 0.40 (good). Cutoff 0.8 keeps only 0.91: very picky, misses 0.72 gold too. Sweeping the cutoff shows the tradeoff on this tiny set. On a real set you plot precision vs recall and pick a point that matches the product.

Evaluate the **retriever** with recall@k on (question, gold chunk) **before** you judge the generator. Evaluate a **guardrail** with precision (false blocks annoy users) and recall (missed blocks leak).

## What goes wrong

- **Accuracy on rare yes:** always-no looks great. Print counts. Pair with recall.
- **Percent without n:** five tickets at 100% F1. Variance of a proportion cannot tell 0.80 from 0.88 on small n.
- **F1 as a law:** F1 weighs P and R equally. Refund recall may matter more than F1. Delete-account precision may matter more than F1. Pick the cutoff for the product.
- **Cutoff ties:** score == cutoff. Decide \`>=\` vs \`>\` and keep it. Off-by-one on a handful of rows moves F1 around.
- **Undefined P or R:** denominator 0. Return 0.0 and log it. Never print 100% from an empty yes set.

Production logs: the four counts, P, R, F1, cutoff, and n. Assert denominators, and that a fixture set with a known confusion matrix reproduces those counts. At T>0, average F1 over seeds or decode greedy for a stable eval.

## How agents use this

The cutoff you pick is a product decision, not a math law. A refund bot may want high recall; a delete-account tool may want high precision.

- **Tokens:** these scores are not token counts. They measure **decisions**. Do not confuse F1 with perplexity. A fluent wrong refusal can have low CE and terrible recall.
- **Ranking:** recall@k is recall where “yes” means “gold in the k neighbors.” Precision@k is “of the k, how many were useful” if you have usefulness labels. Log scores next to the cutoff.
- **Loss:** training CE does not maximize F1. If you need F1, sweep a cutoff on a **held-out** set after you have scores. Nested: no path from F1 into backprop unless you built one.
- **Sampling:** at T>0, pass/fail is random. Average F1 over seeds, or decode greedy for a stable eval. Report n.

If a metric always goes up when you say yes more often, you are looking at recall (or a cousin), not at quality. Pair it with precision. Print counts.

> **Tip:** If a metric always goes up when you say yes more often, you are looking at recall (or a cousin), not at quality. Pair it with precision.

\`\`\`quiz
Precision is
- How many tickets you graded
- *Of the times you predicted yes, the fraction that were truly yes
- Always equal to accuracy
- 1 minus entropy
explain: Precision = TP / (TP + FP). It asks: when the system claimed a hit, was it real?
\`\`\`
`,
  },
];
