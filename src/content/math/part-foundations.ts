import type { RawLesson } from "@/lib/types";

export const mathFoundations: RawLesson[] = [
  {
    slug: "why-math",
    title: "Why Agents Need Math",
    summary:
      "Agents look like English on the outside. Inside they are lists of numbers, scores, chances, and a few formulas you can debug.",
    minutes: 20,
    level: "beginner",
    md: `
Agents look like English on the outside. A support bot answers a refund question. A coding helper picks a tool. A search step returns a paragraph. You read words. Inside the machine there are **no words** until the last layer turns numbers back into tokens. There are **lists of numbers**, **scores**, and **chances**.

This track teaches those objects in simple English, with Python **lists of floats**. No NumPy. No special array type. If you can loop over a list, you can run every formula an agent actually uses.

## What is going on inside

When a support agent finds the right paragraph, it is not “vibes.” A question becomes a **list of numbers**. Each document becomes a list of numbers. A score ranks those lists. The highest score is the chunk stuffed into the prompt. If the wrong chunk wins, the model never sees the right paragraph. That failure is geometry, not personality.

When a model picks a slightly different next word, that is **chance**. The model first writes one number per possible token (a **logit**). Those numbers become chances. A random draw picks one token. Change temperature and you change the chances. The English changes because the draw changed.

When a dashboard says loss went from 2.4 to 1.1, that is a **function** of weights. Training nudges those weights so the function’s output gets smaller. If loss does not move, the slope is zero, huge, or pointed at the wrong thing.

Joeven teaches this math so you can **debug**. A search that “feels random” is often a geometry bug: bad chunks, unnormalized lists, or a score on the wrong axis. A model that repeats itself is often temperature or sampling. A fine-tune that does nothing is a slope that is zero, huge, or pointing at the wrong loss.

## A wrong picture

A common wrong picture is: “the agent understands English, so math is optional.” The product is English. The machinery is numbers. If you skip the numbers you can still call APIs. You cannot explain why Tuesday’s agent is worse than Monday’s. You cannot fix a retriever that quietly ranks the wrong chunk first. You will argue with the model instead of measuring a score.

Another wrong picture is: “I need a PhD.” You do not. You need a working picture of six objects: **functions**, **vectors**, **matrices**, **derivatives**, **probability**, and **entropy**. We implement them with Python lists. The agent use sits next to the formula. Later lessons stay in this lane: tokens, ranking, loss, sampling. They do not teach transformer internals. One later page will say, in one line, that attention is a weighted average — and then stay on the average.

## The map

Every expensive part of an agent has a name on the right.

| Agent idea | Math object |
|---|---|
| Embedding | Vector (a list of floats) |
| RAG ranking | Dot product, cosine similarity |
| Linear layer | Matrix times vector |
| Loss | Function from weights to one number |
| Training | Gradients and small steps downhill |
| Softmax / temperature | Probability, \`exp\` |
| Next token / tool | Sampling |
| Uncertainty | Entropy |
| Belief after a tool result | Bayes |

If you can code the right-hand column with lists and loops, vendor docs stop looking like magic. You will see the same six objects in RAG, training, and evals.

## Tiny numbers, same shape

Take a query as four numbers: \`[0.2, 0.8, 0.1, 0.0]\`. Pretend “refund policy” is \`[0.1, 0.9, 0.0, 0.1]\` and “password reset” is \`[0.0, 0.2, 0.1, 0.9]\`. Slot by slot, the query and the refund list both have a large second number. The password list has its large number in a different slot. A score that multiplies matching slots and adds them up will rank refund higher. That is ranking.

In production the list has 384, 768, or 1536 numbers. The **shape** is the same: close lists rank high, far lists rank low. You do not need to see 1536 arrows. You need to believe that “close” is a formula you can print.

\`\`\`viz scatter
title Close lists sit together (2-d sketch of ranking)
xlabel axis 1
ylabel axis 2
xmin -0.2
xmax 1.1
ymin -0.1
ymax 1.1
dot 0.22,0.80 query 0
dot 0.18,0.88 refund 1
dot 0.82,0.18 shipping 2
dot 0.08,0.22 password 3
caption Query sits next to refund. Password is far. Real embeddings have hundreds of axes; “near” is still this picture.
\`\`\`

Tokens are counts. A prompt of 800 tokens plus a reply of 200 tokens is 1000 tokens. Cost is tokens times price times steps. If a 20-step loop resends a growing transcript, you **sum** the tokens at each step. You do not multiply 20 by the first prompt.

Chance is a number between 0 and 1. If a tool is “usually fine” with chance 0.9 of success, twelve independent steps have chance \`0.9 ** 12\` of all succeeding — already ugly. If the failures share one downed API, you must not multiply. Probability later names that trap.

Entropy is “how spread out is this list of chances?” A model that puts 0.95 on \`search\` is sure. A model that puts about 0.33 on three tools is unsure. Unsure policies waste calls. Confident-and-wrong policies waste the whole ticket.

## A ranking you can see

This box pretends a tiny 4-number embedding model exists. The **shape** is the same in 4 numbers as in 1536.

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
    print(name, round(score, 3))
\`\`\`

Run it. You should see refund policy near **0.978**, shipping times near **0.35**, password reset near **0.221**. The query is close to “refund policy” and far from “password reset.” That is ranking.

\`mag\` is length: square each slot, add, take the square root. \`cosine\` is “multiply matching slots, add, then divide by both lengths.” Later lessons name the formula (**cosine**) and the list (**a vector**). Change the query toward \`[0.0, 0.2, 0.1, 0.9]\` and watch password reset rise. The English did not change. The numbers did.

If you forget to divide by lengths, a longer list can win just because its numbers are bigger. That is a real RAG bug. Normalization (making length 1) is the fix you will code on the vectors page.

## What this track will teach, in order

First: functions, sums, logs, min/max/clip. Those are the arithmetic of loss, cost, and cutoffs.

Then: vectors, dot products, matrices, linear maps. Those are embeddings, ranking, and the shape of a linear layer.

Then: slope, gradients, the chain rule, downhill steps. Those are training and “what happens if I nudge this knob.”

Then: chance, Bayes, named distributions, expectation and spread. Those are sampling, retries, and budgets.

Then: entropy, softmax, temperature, cross-entropy, a weighted average (attention in one picture), embedding geometry, and precision/recall. Those are the numbers on agent dashboards.

You will not train a giant model here. You will compute the **tiny** versions until the giant ones look like the same objects with more slots.

## How agents use this

Every expensive part of an agent is a number you can measure:

- Context length is a **count** (tokens). Cost is tokens times price times steps. A loop that resends the whole transcript is a **sum** that grows, not a flat fee.
- Memory is a set of **vectors** you search. Retrieval is a score (often cosine) plus a sort plus a cutoff. If top-k is 4 and the right paragraph is 5th, the model never sees it.
- The policy is a **chance** over tokens or tools. Temperature reshapes those chances. Sampling draws one. Entropy says how flat the list was.
- Training and many evals are a **function** from weights or traces to one number (loss, pass rate, dollars). You shrink or grow that number on purpose.
- After a tool result, belief should **update**. That is Bayes, even when you write it as \`if timeout: retry once, then page\`.

When an agent fails, ask **which number was wrong**: a similarity, a probability, a count, or a cutoff. Write the number in the log next to the decision. “Skipped chunk cosine=0.22 threshold=0.35” is a fixable sentence. “The model was weird today” is not.

If you skip math, you can still ship a demo. You cannot tell ranking bugs from sampling bugs from loss bugs. Those three look the same in English and different in numbers.

> **Tip:** When an agent fails, ask which number was wrong: a similarity, a probability, a count, or a cutoff. That question is this track.

\`\`\`quiz
What is an embedding, in math?
- A paragraph of English stored in the prompt
- *A vector: a list of numbers that stands for text (or an image, or a tool)
- A Python error type
- A GPU setting
explain: Embeddings turn stuff into vectors so similarity, clustering, and retrieval become arithmetic.
\`\`\`
`,
  },
  {
    slug: "functions-graphs",
    title: "Functions and Graphs",
    summary:
      "A function sends each input to one output. Print a table. See loss, policies, and temperature as functions you can graph.",
    minutes: 20,
    level: "beginner",
    md: `
A **function** is a rule that sends each allowed input to **exactly one** output. Write \`y = f(x)\`. The set of legal \`x\` is the **domain**. The outputs that actually appear are the **range**.

That sounds like school. It is also the whole model.

- A language model is a function from a token list to a list of **logits** (one number per word in the vocab).
- A **loss** is a function from weights (and a batch of data) to one number that should not be negative.
- A **policy** is a function from what you saw to an action, or to chances over actions.
- **Temperature** is a function that reshapes logits before they become chances.

If two inputs can map to the same output, that is still a function. Many tickets can map to “call search.” If one input would need two outputs at once, that is not a function — and it is a bug in your API. A tool that sometimes returns a string and sometimes a dict for the same arguments is not a function you can test.

## A wrong picture

A wrong picture is: “the model is random, so it is not a function.” Randomness is extra input. If you include the **seed** (and the draw) in the domain, the map is still a function: same transcript, same weights, same seed, same next token. When people say “the model is random,” they mean this function also depends on a draw you did not log. Still a function — the domain includes the random draw.

Another wrong picture is: “a graph is only a drawing.” A **graph** is the set of pairs \`(x, f(x))\`. On this page you get a **drawn curve**, then a table you can print. You will not plot a 7-billion-weight network. You will plot the **tiny** functions that network is made of.

A third wrong picture is: “functions must be smooth formulas.” A lookup table is a function. A 20-line \`def\` is a function. A transformer is a function. Same idea, different cost.

## The formula in words

Pick an allowed input. Apply a rule. Get one output. That is all.

A **table** is a function you can read with your eyes: each row is an input, the last column is the output. A **formula** is a function you can compute: \`f(w) = (w - 3)^2\`. A **program** is a function you can run. Training is the sport of changing the program’s **weights** so the outputs on data get closer to what you wanted.

Composition means stacking: \`h(x) = f(g(x))\`. Agents stack constantly. \`softmax(logits / T)\` is three maps: scale by temperature, turn into chances, then (later) pick a token. If any stage is wrong, the outer function is wrong. Debugging is isolating **which** map failed.

## A tiny example

Try a toy **loss** \`f(w) = (w - 3)^2\`. In words: take the weight, subtract 3, square it. At \`w = 3\` you get 0. At \`w = 2\` you get 1. At \`w = 5\` you get 4. At \`w = 0\` you get 9. That is a U shape with a lowest point at \`w = 3\`. Training is “walk downhill on this graph.” You do not need calculus yet to **see** the valley.

\`\`\`viz plot
title Loss bowl: f(w) = (w - 3) squared
xlabel weight w
ylabel loss
fn bowl (x-3)**2 -1 8
mark 3,0 lowest
caption The curve is the graph. The orange dot is the bottom. Training is walking downhill toward that dot.
\`\`\`

Change the function. \`abs(w - 3)\` is a V: same bottom, sharp corner. \`2 ** (-abs(w - 3))\` is a bump: high at 3, low far away. Same loop, different mapping. Loss bowls and policy bumps are the same object: a function you can print.

## Tables are graphs

Print \`w\` and \`f(w)\` for a few points. Draw hashes so the eye sees height. That is a graph without a plotting library.

\`\`\`tryit python
def loss(w):
    return (w - 3) ** 2

print("  w   loss   graph")
for w in range(-1, 8):
    y = loss(w)
    bars = int(y)
    print(w, y, "#" * bars)
\`\`\`

As \`w\` gets near 3, the bar shrinks. At 3 you get \`0\` and no hashes. Past 3 it grows again: 4, 5, 6, 7 give 1, 4, 9, 16 hashes (16 is \`int(16)\`). Later lessons name the **slope** of this graph and a rule for picking the next \`w\`. For now, notice: left of 3, increasing \`w\` lowers loss; right of 3, increasing \`w\` raises loss. Downhill is toward 3 from both sides.

Swap \`loss\` for \`abs(w - 3)\` and rerun. The valley is a V. Swap for \`2 ** (-abs(w - 3))\` if you like a bump you would **maximize** instead of minimize. Sign of the goal matters: training usually minimizes loss; some agent knobs maximize an eval score.

## Discrete vs continuous

Token ids are discrete: 0, 1, 2, … A temperature slider is continuous: 0.2, 0.7, 1.0. A function can have either kind of input. A policy over tools is a function from a transcript to a list of chances (continuous numbers) and then a draw (a discrete pick). When you log \`p_tool_search=0.61\`, you are reading the continuous output. When you log \`tool=search\`, you are reading the discrete pick.

Step functions show up as **cutoffs**: \`1 if cosine >= 0.35 else 0\`. That is still a function. Its graph is a jump. Derivatives later will complain about jumps. Agents use jumps anyway: refuse, retry, stop.

## Stack functions

Agents stack functions. A tool-using agent is also a function: transcript in, next tool out. Retrieval is a function from a query vector to a ranked list. The generator is a function from (prompt + chunks) to tokens. The product is the composition. If retrieval is wrong, the generator never sees the right text. The outer function is then “wrong” even if the generator is fine. That is why you eval the retriever **and** the generator, not only the English at the end.

A function can ignore some of its input. A broken router that always returns \`search\` is still a function. It is a **constant** function of the ticket. Constants are easy to test and useless as policies. If your logs show one tool 100% of the time, you implemented a constant.

## How agents use this

When you log \`loss=1.83\` or \`p_tool_search=0.61\`, you are reading \`f(current_state)\`. Plots of those numbers over steps show **goal drift** (the function you meant to shrink is not the one going down) and **mode collapse** (almost all chance sits on one action).

Treat every knob as a function:

- Temperature \`T\` maps logits to a new list of chances. Same logits, different \`T\`, different policy.
- A cutoff maps a cosine to {keep, skip}. Sweeping the cutoff traces a graph of precision and recall (last lesson in this track).
- \`max_steps\` maps a run to “stop or continue.” Dollars are a function of that choice.

You will not graph a 7-billion-weight network here. You will graph the **tiny** functions that network is made of, until “the model is a function” feels obvious. Then, when loss is flat, you will ask: is this function actually depending on the weights I am changing? A constant does not care about your learning rate.

If two stages are composed and the outer metric is bad, isolate the inner map. Print \`f(x)\` for a few hand-picked \`x\`. Functions become debuggable when you treat them as tables.

> **Note:** A lookup table is a function. A 20-line \`def\` is a function. A transformer is a function. Same idea, different cost.

\`\`\`quiz
Which statement is true of a function f?
- One input is allowed to produce two different outputs
- *Each input in the domain maps to exactly one output
- Graphs never appear in agents
- Temperature is not a function because it is a slider
explain: The definition is unique output per input. Models, losses, and decode steps are all functions (sometimes with extra random input).
\`\`\`
`,
  },
  {
    slug: "sums-notation",
    title: "Sums, Products, and Averages",
    summary:
      "Sigma is a loop that adds. Products multiply. Averages divide a sum by a count — loss, cost, and token budgets.",
    minutes: 21,
    level: "beginner",
    md: `
Almost every formula in this track is a **loop that adds**. Math writes a capital sigma: the sum of \`x_i\` from \`i = 1\` to \`n\`. In Python that is \`s = 0\` then \`s += x\`, or \`sum(xs)\`.

A **product** multiplies instead. Independent chances multiply. So do token chances: the chance of a whole sentence is the product of next-token chances (or a sum if you take logs — next lesson).

An **average** (the mean) is a sum divided by a count. Batch loss is an average. Cost per ticket is an average. “The agent usually takes 8 steps” is a mean hiding a spread.

## A wrong picture

A wrong picture is: “sigma is advanced notation I can skip.” It is a for-loop. If you can add a list, you can read a paper’s loss. Another wrong picture is averaging **percentages** that came from different counts: 90% of 10 tickets and 50% of 200 tickets is not “70%.” You must go back to the raw sums: total passed over total tickets. A third wrong picture is treating a **product of success chances** as if retries and tools fail independently when they share one API. The formula is only as honest as the independence you assumed.

## The formula in words

- **Sum:** start at 0. For each number, add it. That is sigma.
- **Product:** start at 1. For each number, multiply. That is the capital pi you will see next to likelihood.
- **Mean:** sum, then divide by how many items. That is the average.
- **Weighted mean:** multiply each item by a weight, add, and (if the weights do not already add to 1) divide by the sum of weights. Softmax output is a list of weights. Attention is a weighted average of value vectors. You do not need the transformer lesson yet. You need “sum of weight times vector.”

**Mean squared error** against a target: for each item, subtract the target, square, add all those squares, divide by the count. In words: “how wrong, on average, if we always predicted this target.” Training will **change weights** so that a similar sum gets smaller.

## Indexes

If \`x\` is a list, \`x[0]\` is the first item in Python. Papers often write \`x_1\` for the first item. Off-by-one between papers and code is a classic bug. Write the range down: \`i\` from 0 to \`n-1\`, or 1 to \`n\`. When a formula says “sum from i = 1 to n,” your Python is \`for i in range(n)\` if you stored items starting at index 0.

A **moving average** is the same idea over time: fold each new loss into a running mean so a dashboard does not twitch. Agents do this to token counts and tool wait times. You are still dividing a sum by a count. You just pick which window to include. A window of 1 is the last point (noisy). A window of all history is slow to show a regression.

## A tiny example

Five numbers: \`[2, 5, 5, 8, 1]\`. Count \`n = 5\`. Sum is \`2+5+5+8+1 = 21\`. Mean is \`21 / 5 = 4.2\`. Product is \`2*5*5*8*1 = 400\`. If the target is 5, the squared errors are \`(2-5)^2=9\`, \`0\`, \`0\`, \`(8-5)^2=9\`, \`(1-5)^2=16\`. Sum of squares is 34. MSE is \`34 / 5 = 6.8\`. That is “how wrong, on average, if we always predicted 5.”

The **log of the product** equals the **sum of the logs**: \`log(400)\` matches \`log(2)+log(5)+log(5)+log(8)+log(1)\`. Next lesson uses that identity so long products of chances do not hit 0.0.

## Run the operations

\`\`\`tryit python
import math

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

log_prod = sum(math.log(x) for x in xs)
print("log(product)", log_prod)
print("check", math.log(prod))
\`\`\`

You should see \`n 5\`, \`sum 21\`, \`mean 4.2\`, \`product 400\`, \`mse vs 5 6.8\`. The two log lines should match (tiny float noise is fine). \`math.log\` is natural log, base \`e\`. The identity does not care which base you pick, as long as you are consistent.

The sum is the fancy-looking sigma in the blog post. MSE is the shape of many training losses: add up how wrong each example is, then average so a bigger batch does not automatically look like a bigger loss.

## Token budgets are sums

A 20-step loop that resends a growing transcript is a sum of **tokens per step**, not “20 times the first prompt.” If step \`t\` costs \`c_t\` tokens, total tokens are those \`c\` values added up. Dollars are that sum times price. If step 1 is 800 tokens and each later step adds 100 new tokens but resends the old ones, the costs look like 800, 900, 1000, … That is an **arithmetic** growth you can sum. People who budget “20 * 800” underprice the loop.

\`\`\`viz bars
title Tokens per step in a growing loop
bar s1,800,0
bar s2,900,0
bar s3,1000,1
bar s4,1100,1
bar s5,1200,2
caption Step 1 is 800 tokens. Each later step resends the old text plus 100 new. Total is the sum of the bars, not 5 times 800.
\`\`\`

When you average eval scores, know **what** you averaged. Mean pass-rate over 50 tickets hides that 10 tickets are impossible. A product of per-step success chances (if you assume they do not share a cause) shows why long runs fail even when each tool is “usually fine”: \`0.9 ** 12\` is already about 0.28. Twelve “almost sure” steps are not almost sure as a chain.

Prefer **sums of logs** over giant products. Products of chances underflow to 0.0 in floats. Log-likelihood is just a sum. The next lesson is that move.

Weighted averages show up again in retrieval: if you average chunk embeddings to make one document vector, you **add** the lists slot by slot, then **scale** by \`1/n\`. That is only legal if every chunk used the same embedder. Mixing models is adding lists that do not live in the same space.

## How agents use this

Budgets, losses, and evals are sums and averages. Write them that way in logs.

- **Cost:** sum tokens per step, then multiply by price. Print the sum, not only the mean, when one ticket exploded.
- **Batch loss:** average of per-example losses. If you forget to divide by \`n\`, bigger batches look worse even when they are not.
- **Success chains:** product of per-step chances, or sum of logs. Long agents fail because products shrink, not because each tool is terrible.
- **Dashboards:** a moving average of latency hides spikes. Pair it with max, or with a high percentile later. Mean alone is a lie when variance is huge (expectation lesson).
- **Attention / RAG mix:** weighted sum of vectors. Weights from softmax. Same “sum of weight times vector” as here.

Off-by-one in a sum is a silent bug: skipping the last token chance, or adding an extra zero. Print \`n\` next to the sum. If \`n\` is not the length you expected, the formula in the comment is not the loop you wrote.

> **Tip:** Prefer sums of logs over giant products. Products of chances underflow to 0.0 in floats. Log-likelihood is just a sum.

\`\`\`quiz
Mean squared error is which mix?
- A product of absolute errors
- *A sum of squared errors, then divided by the count
- The maximum error only
- Entropy of the labels
explain: MSE is an average of squared misses — a sum scaled by n. That is the loss you will later slope.
\`\`\`
`,
  },
  {
    slug: "logs-exp",
    title: "Logs and Exp",
    summary:
      "exp grows fast. log undoes exp. Use them for softmax, likelihood, and to stop products of chances from hitting zero.",
    minutes: 21,
    level: "beginner",
    md: `
**exp** means \`e\` to a power. In Python that is \`math.exp(x)\`. It grows **fast**. \`exp(0)\` is 1. \`exp(1)\` is about 2.718. \`exp(10)\` is already about 22,026. \`exp(1000)\` is too big for a normal float: you get \`inf\`.

**log** undoes exp. \`math.log(x)\` is the natural log (base \`e\`). \`math.log(x, 2)\` is log base 2, measured in **bits**. We will use bits for entropy later. Natural log is measured in **nats**. Same story, different unit. Be consistent.

These two show up every day in agents:

- Softmax uses \`exp\` to turn logits into chances.
- The chance of a whole sentence is a **product** of token chances. Products of small numbers hit 0.0. \`log\` of a product is a **sum** of logs. Sums stay safe.

## A wrong picture

A wrong picture is: “log of a probability is still a probability.” It is not. Chances live in \`[0, 1]\`. Log of a chance is **zero or negative** (for chances ≤ 1). \`log(1) = 0\`. \`log(0.5)\` is negative. People still say “logprob” on dashboards. That number is not a chance. You must \`exp\` it if you want a chance back (and even then, a sum of logprobs is the log of a **product**, not a chance of a single token).

Another wrong picture is: “I can \`exp\` any logit.” \`exp(1000)\` overflows. Softmax subtracts the biggest logit first. The chances do **not** change, because the same shift hits every term and cancels. You will code this in the softmax lesson. Here, just see that \`exp\` is touchy.

A third wrong picture is taking \`log(0)\`. That is not a real number. In code, skip zeros or add a tiny floor before you log. Training that puts chance 0 on the true token is infinite loss. That is a feature of the formula, not a GPU mystery.

## The formula in words

- \`exp(x)\` is “e multiplied by itself x-ish-ways.” Bigger \`x\`, much bigger output.
- \`log(x)\` asks “what power of e gives x?” Only for **positive** \`x\`.
- They undo each other: \`exp(log(x)) = x\` when \`x > 0\`, and \`log(exp(x)) = x\`.
- Log turns a **product** into a **sum**: \`log(a * b) = log(a) + log(b)\`. That is why long sentences are scored as a sum of token logprobs.
- Log turns a **divide** into a subtract: \`log(a / b) = log(a) - log(b)\`.
- Exp turns a **sum** into a **product**: \`exp(a + b) = exp(a) * exp(b)\`. Softmax lives here.

\`\`\`viz plot
title exp grows; log climbs slowly
xlabel x
ylabel y
fn exp exp(x) -2 2
fn log log(x) 0.2 4
caption Orange log is only drawn for x > 0. They undo each other. Softmax needs exp; sentence scores need log.
\`\`\`

## A tiny example

Three token chances: \`0.5\`, \`0.25\`, \`0.25\`. Product is \`0.5 * 0.25 * 0.25 = 0.03125\`. Sum of logs (natural) is \`log(0.5)+log(0.25)+log(0.25)\`. Exp of that sum is again \`0.03125\`. The sentence chance is the product. The number you store is the sum of logs.

\`log2(8) = 3\` because \`2^3 = 8\`. That is 3 bits. \`log2(0.5) = -1\`. A fair coin landing heads is 1 bit of surprise (entropy lesson will say “minus log”). For now, bits are just log base 2.

Subtract-the-max: logits \`[1, 3, 2]\`. Max is 3. Shifted: \`[1-3, 3-3, 2-3] = [-2, 0, -1]\`. Exp of those is a short list of ordinary numbers. Exp of the raw logits is larger, but **ratios** match. Softmax cares about ratios after you divide by the sum.

## Rules you will use

| Rule | Meaning |
|---|---|
| \`exp(log(x)) = x\` | They undo each other (\`x > 0\`) |
| \`log(exp(x)) = x\` | Same, other way |
| \`log(a * b) = log(a) + log(b)\` | Product becomes a sum |
| \`log(a / b) = log(a) - log(b)\` | Divide becomes a subtract |
| \`exp(a + b) = exp(a) * exp(b)\` | Sum in exp-space is a product |

\`log\` is only for **positive** numbers. \`log(0)\` is not a real number. In code, skip zeros or add a tiny floor.

## Why we subtract the max

\`exp(1000)\` overflows. Softmax does this trick: subtract the biggest logit first. Try the box.

\`\`\`tryit python
import math

print("exp(0)", math.exp(0))
print("exp(1)", round(math.exp(1), 3))
print("log(exp(2))", math.log(math.exp(2)))

chances = [0.5, 0.25, 0.25]
log_prod = sum(math.log(p) for p in chances)
prod = 1.0
for p in chances:
    prod *= p
print("product of chances", prod)
print("exp of sum of logs", math.exp(log_prod))

print("log2(8) bits", math.log(8, 2))
print("log2(0.5) bits", math.log(0.5, 2))

# same softmax shift: subtract max, exp still comparable
logits = [1.0, 3.0, 2.0]
m = max(logits)
shifted = [math.exp(z - m) for z in logits]
raw = [math.exp(z) for z in logits]
print("shifted exps", [round(x, 3) for x in shifted])
print("raw / min raw", [round(x / min(raw), 3) for x in raw])
\`\`\`

Read the prints. \`exp(0)\` is \`1.0\`. \`exp(1)\` is about \`2.718\`. \`log(exp(2))\` returns \`2.0\`. Product of chances is \`0.03125\`. Exp of the sum of logs matches it. \`log2(8)\` is \`3.0\`. \`log2(0.5)\` is \`-1.0\`. Shifted exps are about \`[0.135, 1.0, 0.368]\` — the max logit became \`exp(0)=1\`. The last line shows raw exps in the same **ratios** as the shifted ones (divided by the smallest raw). That is why the trick is safe: chance is exp divided by sum of exps, and a common factor cancels.

The product of the three chances matches \`exp\` of the sum of logs. That is why training talks about **log-likelihood**: it is a sum you can add, not a product that vanishes.

If you ever multiply 200 token chances like 0.4, 0.3, 0.2, … the product hits 0.0 in float math long before the sentence is impossible. The sum of logs is a perfectly ordinary negative number, like \`-80\`. Dashboards plot that.

## How agents use this

A model scores a token with a logit. Softmax is \`exp\`, then divide so the list sums to 1. Sequence chance is a product. You log it. Cost dashboards that plot “average logprob” are this sum, averaged. If you ever see \`0.0\` for a long prompt’s chance, you forgot to log.

Agent connections, in one place:

- **Tokens:** next-token chance \`p\`, stored as \`log(p)\`. Beam search and scoring add those logs.
- **Ranking:** some retrievers use log of a score; most of this track uses cosine (a different formula). Do not mix them without knowing which.
- **Loss:** cross-entropy is \`-log(q_true)\` for a one-hot label. Small \`q_true\` means a large loss. You will code it later.
- **Sampling:** temperature divides logits **before** exp. That is still this pair of functions.

Never \`exp\` a huge logit without subtracting the max. The page may print \`inf\` or \`nan\`. Never log a chance that rounding pushed to a tiny negative — clip first (next lesson).

> **Warning:** Do not \`exp\` a huge logit without subtracting the max. The page may print \`inf\` or \`nan\`.

\`\`\`quiz
Why do we use log of a product of token chances?
- Logs make the model faster on a GPU
- *A product of small chances hits 0.0; a sum of logs stays a usable number
- log(0) is 1
- Exp and log are the same function
explain: log(a*b) = log(a)+log(b). Long products underflow. Log-likelihood is the safe sum.
\`\`\`
`,
  },
  {
    slug: "min-max-clip",
    title: "Min, Max, Percent, and Clip",
    summary:
      "Cutoffs, rates, and clip keep scores in a safe range. Agents use them for thresholds, budgets, logs, and evals.",
    minutes: 19,
    level: "beginner",
    md: `
**min** picks the smallest number. **max** picks the largest. **clip** means “if it is too small, raise it; if it is too big, cut it.”

Agents use these all day:

- A **threshold** is a cutoff: if cosine is below 0.35, do not quote the chunk.
- A **budget** is a max: stop at 8 steps.
- A **rate** is “how many out of 100”: 29/32 pass is about 91%.
- **Clip** keeps a chance in \`[0, 1]\` or a temperature above a tiny floor.

## A wrong picture

A wrong picture is: “clip is smoothing” or “clip trains the model.” Clip does not learn. It **cuts**. Values inside the range pass through. Values outside jump to the wall. If you clip a cosine that is 0.12 up to 0.35, you **lied** about retrieval quality. Clip is for **safety of the next formula** (no log of negatives, no negative tokens left), not for making a bad score look like a hit.

Another wrong picture is reporting **only** a percent. 91% of 32 tickets is 29/32. 91% of 11 tickets is 10/11. Those are different amounts of evidence. Always keep the **counts**. A third wrong picture is using min/max on the wrong axis: taking max cosine across **documents** is ranking; taking max across **random seeds** is hiding variance. Say what you maxed.

## The formula in words

- \`min(a, b, ...)\` is the smallest.
- \`max(a, b, ...)\` is the largest.
- \`clip(x, lo, hi) = min(hi, max(lo, x))\`. If \`x\` is already inside, you get \`x\`. If it is below \`lo\`, you get \`lo\`. If it is above \`hi\`, you get \`hi\`.
- A **percent** is a rate times 100. Rate is passed divided by total. Percent is \`100 * passed / total\`.
- A **ratio** is one count divided by another. Precision and recall (last lesson) are ratios. Cost per ticket is a ratio.

\`max(0, budget - used)\` is clip on the low side: leftover tokens cannot be negative.

## A tiny example

Scores \`[0.91, 0.12, 0.40, 0.77]\`. Best is 0.91. Worst is 0.12. Keep if ≥ 0.35: you keep 0.91, 0.40, 0.77. You drop 0.12. That is a threshold, not a clip: the 0.12 stays 0.12 in the log; you just do not quote that chunk.

\`clip(1.2, 0, 1)\` is 1. \`clip(-0.1, 0, 1)\` is 0. \`clip(0.4, 0, 1)\` is 0.4. Passed 29 of 32: rate \`29/32 ≈ 0.906\`, percent about 90.6. Tokens left \`max(0, 800 - 950)\` is 0, not -150.

\`\`\`viz plot
title clip(x) to the range 0 through 1
xlabel x
ylabel clip(x)
xmin -0.5
xmax 1.8
ymin -0.2
ymax 1.4
fn identity x -0.5 1.8
fn clip min(1,max(0,x)) -0.5 1.8
mark 1.2,1 too high
mark -0.1,0 too low
mark 0.4,0.4 inside
caption Outside 0 and 1 the clip line is flat. Inside, it is just x. Clip bounds a value; a threshold decides keep vs skip.
\`\`\`

## Percent and rate

A **percent** is a rate times 100. Always keep the **counts**. 29/32 is more honest than “91%” when the set is small. If you later average percents from two days, go back to counts: (29+40)/(32+50), not the average of 91% and 80%.

A **ratio** is one count divided by another. Precision and recall are ratios. Cost per ticket is a ratio. If the denominator is 0 (no predicted yeses, no tokens), the ratio is undefined. In code, return 0.0 or skip — and log that the denominator was 0. Do not print 100%.

## Clip

Clip is three numbers: the value, a low bound, a high bound.

\`\`\`python
def clip(x, lo, hi):
    return min(hi, max(lo, x))
\`\`\`

Use clip on:

- probabilities that drifted to 1.0000001 from rounding (so they stay in \`[0, 1]\`)
- a chance you will \`log\` (must stay **positive**, so the low bound might be \`1e-12\`, not 0)
- a learning rate that must stay positive
- a similarity you will treat as a weight (weights should not be negative if your formula assumes that)

Do **not** clip a retrieval score up to the threshold and then call it a hit. Thresholds **filter**. Clips **bound**.

\`\`\`tryit python
def clip(x, lo, hi):
    return min(hi, max(lo, x))

scores = [0.91, 0.12, 0.40, 0.77]
print("best", max(scores))
print("worst", min(scores))
print("keep if >= 0.35", [s for s in scores if s >= 0.35])

passed = 29
total = 32
rate = passed / total
print("rate", round(rate, 3))
print("percent", round(100 * rate, 1))

print("clip 1.2 to [0,1]", clip(1.2, 0, 1))
print("clip -0.1 to [0,1]", clip(-0.1, 0, 1))
print("clip 0.4 to [0,1]", clip(0.4, 0, 1))

step = 3
max_steps = 8
print("under budget", step < max_steps)
print("tokens left", max(0, 800 - 950))
\`\`\`

Read the prints. Best is \`0.91\`, worst \`0.12\`. The keep list has three scores; 0.12 is gone. Rate is about \`0.906\`, percent \`90.6\`. Clips: \`1.2\` becomes \`1\`, \`-0.1\` becomes \`0\`, \`0.4\` stays \`0.4\`. \`step < max_steps\` is True (3 < 8). Tokens left is \`0\`, not \`-150\`. You cannot have negative tokens left. \`max(0, ...)\` is the same idea as clip on the low side.

A retriever without a cutoff always returns k neighbors, even if every score is junk. \`if score < 0.35: refuse\` is min/max thinking. A retry loop is \`min(attempt, max_tries)\`. Eval dashboards that only show percent hide small \`n\`. Print \`passed/total\`.

## How agents use this

Cutoffs, budgets, and floors are product decisions you write with min, max, and clip.

- **RAG:** log \`cosine=0.22 threshold=0.35 skip\`. Later you tune the cutoff from data (precision/recall). Without a cutoff, top-k always stuffs k chunks into the prompt, including noise.
- **Loops:** \`step < max_steps\` is a max budget. \`min(retries, 3)\` caps hammering a dead API.
- **Chances:** clip to \`[1e-12, 1]\` before \`log\`, so you never log a negative from rounding and you never log exact 0.
- **Temperature:** \`max(T, 1e-5)\` so you never divide logits by 0.
- **Evals:** print counts. Clip nothing. A percent without \`n\` is a poster, not a measurement.
- **Tokens left:** \`max(0, budget - used)\`. Negative leftover is a bookkeeping bug that will look like “free tokens.”

Write the cutoff next to the score in the log. Write the budget next to the step. Write \`passed/total\` next to the percent. Min, max, and clip are how agents stay in a legal range. They are not how agents get smarter.

> **Tip:** Write the cutoff next to the score in the log: \`cosine=0.22 threshold=0.35 skip\`. Later you can tune the cutoff from data.

\`\`\`quiz
clip(1.4, 0, 1) returns
- 1.4
- 0
- *1
- -1
explain: Clip cuts values above the high bound. 1.4 is above 1, so the result is 1.
\`\`\`
`,
  },
];
