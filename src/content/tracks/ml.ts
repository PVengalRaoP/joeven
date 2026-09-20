import type { TrackSource } from "@/lib/types";

export const ml: TrackSource = {
  slug: "ml",
  title: "Machine Learning",
  short: "ML",
  tagline: "Data, loss, gradient descent, evals, embeddings — the scientific method for agents.",
  color: "#DC2626",
  order: 4,
  lessons: [
    {
      slug: "what-is-ml",
      title: "What Is Machine Learning?",
      summary:
        "ML fits a function from examples instead of writing the function by hand — the habit every agent eval depends on.",
      minutes: 14,
      level: "beginner",
      md: `
**Machine learning** is a way to get a computer to do a task by showing it **examples**, not by writing every rule yourself.

The classical program is: \`if subject contains invoice then route to billing\`. That works until the next thousand tickets use different words. The ML program is: collect tickets with labels, **fit** a function that maps text (or numbers) to a label, then **measure** how often it is wrong on data it has never seen.

That last sentence is the whole subject. Fit. Measure. On **unseen** data. Everything else — neural nets, transformers, “AI” — is a family of functions and a family of measuring sticks.

## The three families

| Family | What you have | What you want |
|---|---|---|
| **Supervised** | Inputs **and** labels | Predict the label |
| **Unsupervised** | Inputs only | Structure: clusters, compression, anomalies |
| **Reinforcement** | Actions and rewards | A policy that scores high over time |

Joeven agents mostly **consume** supervised models (classifiers, rankers, embedders) and **imitate** the supervised habit even when the “model” is an LLM: you still need labeled traces and a score.

## A model is just a function with knobs

Suppose you want to predict whether a support ticket is urgent from one number: how many times the word “down” appears. A tiny model is:

\`urgency_score = w * downs + b\`

Then you threshold the score. \`w\` and \`b\` are **parameters**. Learning is the search for parameters that make the predictions match the labels as well as possible.

You do not start by believing the function. You start by **scoring** it.

\`\`\`tryit python
tickets = [
    {"downs": 0, "urgent": 0},
    {"downs": 1, "urgent": 0},
    {"downs": 2, "urgent": 1},
    {"downs": 3, "urgent": 1},
    {"downs": 4, "urgent": 1},
]

def predict(downs, w, b, threshold=0.5):
    score = w * downs + b
    return 1 if score >= threshold else 0, score

def accuracy(w, b):
    ok = 0
    for row in tickets:
        yhat, _ = predict(row["downs"], w, b)
        if yhat == row["urgent"]:
            ok += 1
    return ok / len(tickets)

for w, b in [(0.0, 0.0), (0.4, -0.5), (1.0, -1.5)]:
    print("w", w, "b", b, "acc", accuracy(w, b))
    for row in tickets:
        yhat, score = predict(row["downs"], w, b)
        print("  downs", row["downs"], "score", round(score, 2), "pred", yhat, "true", row["urgent"])
\`\`\`

Hand-tuning \`w\` and \`b\` is still machine learning — a very slow optimizer (you). Later lessons replace you with **gradient descent**. The scientific loop does not change.

## What ML is not

- It is not magic. Garbage labels produce garbage policies.
- It is not “the model understands.” It is curve fitting with a test set.
- It is not a substitute for a goal. A 99% accurate classifier that answers the wrong question is a well-measured failure.

## The loop you will reuse

Collect examples. Split them. Pick a function class — even a threshold. Fit. Score on **validation**. Only then touch the test set or production. That is the same loop whether the “model” is \`w * x + b\`, a boosted tree, or a prompt you are iterating. Joeven’s later eval track is this loop with agent traces as the dataset.

A useful question at the start of any modeling discussion: **what would a dumb rule score?** If “always route to search” is already 80%, your classifier has a high bar. Machine learning is not obligatory. It is the move when the rule book is too large to write and you can **measure** the remainder.

## Agent connection

An autonomous agent that never measures itself is not an agent you can ship. Tool-routing (“search or SQL?”), memory retrieval (“which chunk?”), and “did we finish the ticket?” are all prediction problems. When you log traces and score them, you are doing ML even if the brain is an API.

> **Tip:** Write the **metric** before you pick the model. “Lower the loss” is not a product.

\`\`\`quiz
What is the core activity of machine learning?
- Writing a longer chain of if-statements
- *Fitting a function from examples and measuring it on unseen data
- Buying a GPU
- Replacing tests with vibes
explain: ML is empirical: parameters are fit on examples, then judged on data the fitting procedure did not see.
\`\`\`
`,
    },
    {
      slug: "data-and-splits",
      title: "Data and Splits",
      summary:
        "Train, validation, and test sets — and the leakage bugs that make agent evals lie.",
      minutes: 16,
      level: "beginner",
      md: `
A model that memorizes its homework and fails the exam is not a model. It is a lookup table with extra steps. The way you prevent that is painfully simple and constantly skipped: **split the data**.

## Three piles, three jobs

| Split | Used for | You may |
|---|---|---|
| **Train** | Fit parameters | Look as much as you want |
| **Validation** | Choose hyperparameters, stop training, pick a prompt | Look, but not fit weights on it |
| **Test** | One final number you publish | Look **once**, when you are done |

If you tune on the test set, it is not a test set. It is a second training set you are lying about.

A common default is **80 / 10 / 10**, or 70 / 15 / 15 when data is scarce. The percentages matter less than the **rule**: the test examples must not influence any choice, including which features you engineered.

## Shuffle — except when time is the feature

Random shuffle is correct when examples are independent: spam emails, product photos, isolated tickets. It is **wrong** when the future must not leak into the past. Agent logs are time series. If Tuesday’s incident is in train and Monday’s RCA is in test, you have inverted causality.

For traces, split **by time** or **by user** or **by conversation id**, not by random row.

## Leakage: the silent A+

**Leakage** means the model saw the answer, or a proxy for the answer, during training.

Examples that show up in agent systems every week:

- The label column left in the feature table (\`status=resolved\` predicting \`resolved\`)
- Retrieval that indexes the eval questions
- A “customer id” that is unique per label
- Training on the whole chat, including the assistant’s **final** message, then asking the model to produce that message
- Copying the same ticket into train and test because you split after exploding chunks

\`\`\`tryit python
import random

rng = random.Random(0)
rows = [{"id": i, "user": i % 5, "y": int(i % 3 == 0)} for i in range(20)]

def random_split(data, frac=0.7):
    data = list(data)
    rng.shuffle(data)
    n = int(frac * len(data))
    return data[:n], data[n:]

def by_user_split(data, train_users):
    train = [r for r in data if r["user"] in train_users]
    test = [r for r in data if r["user"] not in train_users]
    return train, test

tr, te = random_split(rows)
overlap = {r["user"] for r in tr} & {r["user"] for r in te}
print("random split: train", len(tr), "test", len(te), "user overlap", overlap)

tr2, te2 = by_user_split(rows, train_users={0, 1, 2})
overlap2 = {r["user"] for r in tr2} & {r["user"] for r in te2}
print("user split: train", len(tr2), "test", len(te2), "user overlap", overlap2)

# Leakage demo: using the label as a feature
leaky_acc = sum(1 for r in te if r["y"] == r["y"]) / len(te)
honest = sum(1 for r in te if 0 == r["y"]) / len(te)
print("leaky 'model' acc", leaky_acc)
print("predict-all-zero acc", round(honest, 2))
\`\`\`

The leaky model is perfect because it **is** the label. Your eval dashboard will look the same if you accidentally retrieve the gold answer into the prompt.

## How much data?

More is better until it is the **wrong** more. One thousand clean, representative traces beat one hundred thousand scraped chats that do not match production. For agents, **coverage of tools and failure modes** matters more than raw row count. If the eval set has no “user changed their mind” dialogues, you will not measure that failure.

## Version the split

Store the list of example ids for train, validation, and test next to the code that produced them. If you reshuffle every experiment, you cannot compare two prompts. Agents make this worse because a “row” is often a whole conversation that grows over days — freeze at a timestamp. When someone “cleans” a label in the test set, that is a new dataset; bump the version instead of silently improving last quarter’s number.

Duplicates are leakage’s cousin: the same ticket pasted twice, once in train and once in test, after you exploded it into chunks. Deduplicate on **conversation id**, not on chunk text alone.

## Agent connection

Your production logs are the dataset. Before you fine-tune or even tune a prompt, freeze a **held-out** slice of traces. Version it. If marketing wants a better number, they get a new eval set — they do not get to re-grade the old one until it cooperates.

> **Warning:** If the retrieval index contains the test questions, every RAG demo is leaking. Index train documents only, or strip eval queries from the corpus.

\`\`\`quiz
When is a random shuffle a bad way to split agent data?
- Never; shuffle is always correct
- *When examples are linked by time, user, or conversation, so the future or the same person leaks
- Only when the file is CSV
- When accuracy is already 100%
explain: Independent rows can shuffle. Traces, users, and timestamps need grouped or chronological splits.
\`\`\`
`,
    },
    {
      slug: "supervised",
      title: "Supervised Learning",
      summary:
        "Labels turn data into a teaching signal. Classification vs regression, and why noisy labels wreck agents.",
      minutes: 14,
      level: "beginner",
      md: `
**Supervised learning** means every training example has an **input** \`x\` and a **target** \`y\`. The algorithm’s job is to predict \`y\` from \`x\` for new rows.

The word “supervised” is literal: a supervisor (human, script, or downstream system) provided the answers. No labels, no supervised learning. You may still cluster or embed. You may not claim you “trained a classifier.”

## Classification vs regression

| | Classification | Regression |
|---|---|---|
| \`y\` | A **category** (spam / ham, tool A / tool B) | A **number** (latency, price, 1–5 stars) |
| Typical loss | Cross-entropy | Mean squared error |
| Output | Class or probabilities | Real value |
| Agent examples | Route this ticket; pick a tool; detect jailbreak | Estimate tokens left; rank chunks; score a trace |

Do not turn regression into classification without a reason. “Latency > 800ms” as a boolean throws away how late it was. Do not turn classification into regression without a reason either: predicting \`3.7\` for a tool id is not a tool call.

Multi-class means more than two labels (which of eight tools). Multi-label means several can be true at once (a ticket is both billing **and** outage). Those are different schemas. Mixing them is a silent eval bug.

## What a label actually is

A label is a decision you wish the system had made. In agents that decision might be:

- The tool name a senior engineer would have called
- Whether the final answer is factually supported
- The JSON that passed the schema
- A thumbs-down from a user

If two labelers disagree 30% of the time, the **ceiling** of your model is near 70%, not 100%. You cannot gradient-descent your way past disagreement. You fix the rubric.

\`\`\`tryit python
# Toy: classify tool from a one-word intent
# 0 = search, 1 = sql, 2 = finish
examples = [
    ("weather", 0),
    ("docs", 0),
    ("revenue", 1),
    ("users", 1),
    ("done", 2),
    ("thanks", 2),
]

def majority_baseline(rows):
    counts = {}
    for _, y in rows:
        counts[y] = counts.get(y, 0) + 1
    return max(counts, key=counts.get)

def keyword_policy(text):
    t = text.lower()
    if t in {"revenue", "users", "select"}:
        return 1
    if t in {"done", "thanks", "stop"}:
        return 2
    return 0

maj = majority_baseline(examples)
correct_kw = sum(keyword_policy(x) == y for x, y in examples)
correct_maj = sum(maj == y for _, y in examples)
print("majority class", maj, "acc", round(correct_maj / len(examples), 2))
print("keyword policy acc", round(correct_kw / len(examples), 2))

# Label noise: one example flipped
noisy = list(examples)
noisy[0] = ("weather", 1)  # wrong on purpose
correct_noisy = sum(keyword_policy(x) == y for x, y in noisy)
print("same policy on noisy labels acc", round(correct_noisy / len(noisy), 2))
print("the policy did not get worse — the labels did")
\`\`\`

Always report a **baseline**. Majority class. Keyword rules. Last week’s prompt. If your neural net cannot beat “always call search,” you do not have a modeling win.

## Weak labels and circular agents

Agents are tempted to label their own data: run the agent, treat its output as gold, train on it. That **amplifies** whatever bias the first version had. Use it only as **weak** supervision, then sample for humans.

## Who writes the labels?

For tool-routing, the best labeler is often a senior engineer on two hundred traces, not a crowd with no rubric. Write one page: when is \`sql\` correct even if \`search\` would also work? Ambiguous items belong in a third bucket — \`abstain\` or \`ask_human\`. Forcing a hard class invents noise that no loss function can unsay.

Inter-annotator agreement is a number you should know before you celebrate 95% accuracy. If two experts disagree a fifth of the time, that fifth is not a modeling problem yet. It is a product problem: the action space is fuzzy.

## Agent connection

Every router in front of a big LLM is a supervised classifier, even if you implement it with embeddings or a small model. Define the label set as **your action space** (\`search\`, \`code\`, \`ask_human\`, \`final\`). If a label is not an action you can execute, it does not belong.

> **Note:** Classification accuracy on a demo of six examples is a story, not a result. Next lesson: a real **loss**.

\`\`\`quiz
What is required for supervised learning?
- Unlabeled logs and a clustering algorithm
- *An input and a target label for each training example
- A transformer
- Reinforcement rewards only
explain: Supervised means the dataset includes the answers you want predicted.
\`\`\`
`,
    },
    {
      slug: "loss-functions",
      title: "Loss Functions",
      summary:
        "MSE and cross-entropy in pure Python — loss is a number that says how wrong the model is.",
      minutes: 16,
      level: "beginner",
      md: `
A **loss** (also called a cost or objective) is a number that is **small when the model is right** and **large when it is wrong**. Training is “change parameters to make this number go down on the training set,” while hoping it also goes down on validation.

If you cannot write the loss, you do not know what you are optimizing. Accuracy is a **metric**. You usually cannot differentiate a hard argmax, so we train on a smooth cousin.

## Mean squared error (regression)

For predictions \`p\` and targets \`t\`:

\`MSE = average of (p - t) squared\`

Squares punish large mistakes more than small ones. Predicting 10 when the answer is 0 is much worse than predicting 1. That is often what you want for numbers (latency, score). It is a bad idea for classifying tools: being “off by 2 tool ids” is meaningless.

## Cross-entropy (classification)

The model outputs **logits** (raw scores), we convert them to **probabilities** with softmax, then we punish a low probability on the **correct** class:

\`loss = -log(probability of the true class)\`

If the true class has probability 1, loss is 0. If it has probability 0.001, loss is large. The model is not asked to pick a class during training; it is asked to put mass on the right class.

Softmax:

1. Subtract the max logit (numerical stability)
2. Exponentiate
3. Divide by the sum

\`\`\`tryit python
import math

def mse(preds, targets):
    n = len(preds)
    return sum((p - t) ** 2 for p, t in zip(preds, targets)) / n

print("MSE all-right", mse([2.0, 4.0], [2.0, 4.0]))
print("MSE a bit off", mse([2.2, 3.5], [2.0, 4.0]))
print("MSE way off", mse([9.0, 0.0], [2.0, 4.0]))

def softmax(logits):
    m = max(logits)
    exps = [math.exp(x - m) for x in logits]
    total = sum(exps)
    return [e / total for e in exps]

def cross_entropy(logits, target_index):
    probs = softmax(logits)
    p = max(probs[target_index], 1e-12)
    return -math.log(p), probs

for logits, name in [
    ([4.0, 0.1, 0.1], "confident-correct"),
    ([0.2, 0.2, 0.2], "unsure"),
    ([0.1, 0.1, 4.0], "confident-wrong"),
]:
    loss, probs = cross_entropy(logits, target_index=0)
    print(name, "probs", [round(p, 3) for p in probs], "loss", round(loss, 3))
\`\`\`

Read the three classification rows. Confident-and-correct is cheap. Uniform is expensive. Confident-and-wrong is a disaster. That is the loss telling the optimizer what we actually care about.

## Loss vs metric

| | Loss | Metric |
|---|---|---|
| Role | Drive training | Report quality |
| Smooth? | Usually yes | Often no (accuracy, pass@k) |
| Human meaning | Indirect | Direct (“did the agent finish?”) |

You can overfit a loss and still fail a product metric. Agents should log **both**: the training-style score (valid JSON? citation present?) and the business score (ticket closed without reopen).

## Weighted errors

If missing a jailbreak is a hundred times worse than a false alarm, say so in the objective: class weights, or a metric you **select** on, not a footnote in Slack. Unweighted averages spend all their effort on the common class because that is where the mean lives. MSE on a mix of “latency in milliseconds” and “error count in 0/1” is also a units bug — scale features, or keep separate heads.

Huber loss (quadratic near zero, linear far away) is the usual answer when a few wild targets should not dominate. For agents, a few traces with 40k-token tool dumps should not dominate a length penalty either: cap, then score.

## Agent connection

When you “train” a prompt on ten traces by eyeball, you still have a loss — it is just in your head and unstable. Write it down: \`1.0\` if schema-invalid, \`0.3\` if no citation, \`0.0\` if gold match. Average it. That number is more honest than “it feels better.”

> **Tip:** If two errors should hurt equally, do not use MSE. If a miss on the rare class is fatal, do not optimize plain accuracy; the next metrics lesson is waiting.

\`\`\`quiz
Why train a classifier with cross-entropy instead of accuracy?
- Accuracy is illegal in Python
- *Accuracy uses a hard decision and is not a smooth signal; cross-entropy penalizes low probability on the true class
- Cross-entropy always equals MSE
- Softmax deletes the true class
explain: Training needs a differentiable (or at least smooth) objective. Cross-entropy uses probabilities; accuracy uses argmax.
\`\`\`
`,
    },
    {
      slug: "gradient-descent",
      title: "Gradient Descent",
      summary:
        "Implement gradient descent on y = w x and watch a parameter walk downhill.",
      minutes: 18,
      level: "intermediate",
      md: `
**Gradient descent** is the algorithm behind almost every neural net you will use: measure how the loss changes when you nudge each parameter, then nudge the parameters **downhill**.

For a scalar parameter \`w\`, the **gradient** \`dL/dw\` is the slope. Update:

\`w <- w - learning_rate * slope\`

If the slope is positive, \`w\` is too big; we decrease it. If negative, we increase it. The **learning rate** (\`lr\`) is how brave the step is. Too large: you jump over the valley and diverge. Too small: you die of boredom (and of cloud bills).

## A one-parameter universe

We fit \`y ≈ w * x\` with MSE. True \`w\` is 2. We start at 0 and only look at the data.

Analytic slope of MSE for one example: \`2 * (w*x - y) * x\`, then average. You can also estimate the slope with a tiny bump (**finite difference**). If they disagree, your formula is wrong — a debugging trick that still works on tiny agent-scoring functions.

\`\`\`tryit python
xs = [1.0, 2.0, 3.0, 4.0]
ys = [2.0, 4.0, 6.0, 8.0]  # true w = 2

def mse(w):
    return sum((w * x - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def grad_analytic(w):
    n = len(xs)
    return sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / n

def grad_finite(w, eps=1e-5):
    return (mse(w + eps) - mse(w - eps)) / (2 * eps)

w = 0.0
lr = 0.02
print("step", 0, "w", round(w, 4), "loss", round(mse(w), 4))
for step in range(1, 26):
    g = grad_analytic(w)
    if step == 1:
        print("analytic grad", round(g, 4), "finite grad", round(grad_finite(w), 4))
    w = w - lr * g
    if step in {1, 5, 10, 25}:
        print("step", step, "w", round(w, 4), "loss", round(mse(w), 4), "grad", round(g, 4))
\`\`\`

You should see \`w\` climb toward 2 and the loss fall. That plot, in one column of numbers, is deep learning. Bigger models have millions of \`w\`s and use automatic differentiation, but the loop is the same: forward, loss, backward, step.

## Mini-batches and stochasticity

Full-batch uses every example in the gradient. **SGD** uses one example or a mini-batch. The gradient gets noisy; that noise sometimes helps escape bad valleys. For agents scoring traces, a “batch” might be 16 conversations — the same idea.

## Local minima and saddles

Non-convex losses (neural nets) have many valleys. Gradient descent does not promise the global best \`w\`. It promises “from here, go downhill.” Random restarts, smaller models, and **early stopping on validation** are how practitioners stay honest.

## Learning rates in practice

People often start with a larger \`lr\` to make progress, then **decay** it so the parameter settles. In prompt search you do the analog: try big edits first (rewrite the spec), then small ones (swap one example). If the loss jumps around with no trend, your step size is a random walk — plot it. If it never moves, the gradient is ~0 (saturated softmax, dead ReLU, or a bug) or \`lr\` is a rounding error.

Momentum and Adam keep a running average of gradients so you do not zigzag in ravines. You do not need to implement them here. You need to know why dashboards show \`lr\` and \`grad_norm\`: if the norm explodes, clip it; if it vanishes, the signal died.

## Agent connection

You will rarely write CUDA kernels. You will often write a scoring function and a search: prompt candidates, tool-order candidates, chunk-size candidates. If you can compute a numeric score, you can descend — even if the “gradient” is “try the neighbor and keep the winner” (coordinate descent). The ML habit is: **define downhill**, then walk.

> **Warning:** A learning rate that works at \`w=0\` can explode later. Print loss every N steps. If it becomes \`inf\`, your \`lr\` is a dare.

\`\`\`quiz
In the update w <- w - lr * slope, why is there a minus sign?
- Python lists are 0-indexed
- *Because we want to decrease the loss, so we move opposite the slope
- Gradients are always negative
- Minus makes the learning rate learn
explain: The gradient points toward increase. Descent flips it.
\`\`\`
`,
    },
    {
      slug: "overfitting",
      title: "Overfitting",
      summary:
        "A model that memorizes noise. Train vs validation curves, and regularization as humility.",
      minutes: 16,
      level: "intermediate",
      md: `
**Overfitting** is when the model fits the **training sample**, including accidents, instead of the **pattern** that will appear tomorrow.

The giveaway is a split personality: training loss goes to zero; validation loss goes the wrong way. Accuracy on the demo is 100%. Accuracy on next week’s tickets is coin-flip.

## Noise is a teacher of the wrong lesson

If labels are noisy, a sufficiently flexible model will learn the noise. If you have more parameters than independent examples, you can interpolate anything. Neural nets are often in that regime; they still generalize if you stop in time and if the architecture matches the data. They do not get a pass on a 12-trace “eval.”

## A polynomial that shows off

Fit a line (degree 1) vs a high-degree polynomial through a few noisy points. The fancy curve hits every training point and goes wild in between. Agents do the same when a 200-line system prompt enumerates every anecdote from last month.

\`\`\`tryit python
# y = 2x plus noise. Fit degree-1 vs a lookup (overfit).
train_x = [0, 1, 2, 3, 4]
train_y = [0.2, 2.1, 3.7, 6.4, 7.8]  # roughly 2x
val_x = [0.5, 1.5, 2.5, 3.5]
val_y = [1.0, 3.0, 5.0, 7.0]

def predict_linear(x, w=2.0, b=0.0):
    return w * x + b

# Overfit "model": memorize train, elsewhere 0
mem = dict(zip(train_x, train_y))

def predict_mem(x):
    return mem.get(x, 0.0)

def mse(xs, ys, fn):
    return sum((fn(x) - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

print("linear train MSE", round(mse(train_x, train_y, predict_linear), 3))
print("linear val   MSE", round(mse(val_x, val_y, predict_linear), 3))
print("memorizer train MSE", round(mse(train_x, train_y, predict_mem), 3))
print("memorizer val   MSE", round(mse(val_x, val_y, predict_mem), 3))
\`\`\`

The memorizer is perfect on train and useless on val because validation \`x\` never appeared as keys. That is overfitting as a dictionary.

## Regularization is a prior that says “be boring”

**L2** (weight decay) adds \`lambda * sum(w squared)\` to the loss so large weights cost money. Large weights make wild curves. **L1** pushes weights toward exact zero (sparsity). **Dropout** randomly ignores units during training so the net cannot rely on one fragile co-adaptation.

For prompts and agents, regularization looks like:

- Shorter system prompts
- Fewer tools
- Temperature not maxed
- Early stopping on a frozen eval set
- Not adding a new special-case sentence after every incident

## Early stopping

Watch validation. When it worsens for several checks, **stop** and keep the last good checkpoint (or prompt). This is the most important regularizer you will actually use.

## Capacity versus contamination

A huge chat model can “overfit” your forty-example eval without a single gradient step if those examples leaked into pretraining, into the system prompt as few-shots, or into the retrieval index. That is **contamination**, not a polynomial. Deduplicate eval against prompts, docs, and known public write-ups when you can. Treat few-shot examples as training data: they do not belong in the conversations you report as test.

More tools, more prompt clauses, more retrieved chunks — all of that is capacity. Capacity without new independent data is how an agent becomes a tribute to last week’s incidents.

## Agent connection

Overfit agents quote yesterday’s outage as if it were physics. They retrieve the same three docs for every question. They pass an internal eval that was updated until it passed. Hold out users. Rotate evals. If train traces and the demo script are the same file, you are the memorizer.

> **Tip:** A model that is slightly underfit and stable beats a model that is perfect on twelve examples.

\`\`\`quiz
What is the signature of overfitting?
- Train and validation both terrible
- *Train performance excellent, validation (or next week) much worse
- The learning rate is 0.01
- Softmax is used
explain: Overfitting is a generalization gap: the fit succeeded on the sample, not the phenomenon.
\`\`\`
`,
    },
    {
      slug: "metrics",
      title: "Metrics That Matter",
      summary:
        "Accuracy lies. Count a confusion matrix; learn precision, recall, and when each one is the product.",
      minutes: 16,
      level: "beginner",
      md: `
After you fit, you **evaluate**. The wrong metric ships the wrong agent.

**Accuracy** is “how often did we match the label?” It is fine when classes are balanced and errors are equal. It is a trap when 99% of events are “not fraud,” “not jailbreak,” or “not the billing tool.” A model that always says “no” is 99% accurate and 0% useful.

## The four counts

Pick a **positive** class you care about catching (fraud, urgent, “needs human”).

|  | Label positive | Label negative |
|---|---|---|
| **Predicted positive** | True positive (TP) | False positive (FP) |
| **Predicted negative** | False negative (FN) | True negative (TN) |

- **Precision** = TP / (TP + FP) — of the alarms, how many were real?
- **Recall** = TP / (TP + FN) — of the real cases, how many did we catch?
- **F1** = harmonic mean of precision and recall — a compromise, not a religion

High recall, low precision: the agent escalates everything; humans drown. High precision, low recall: the agent almost never escalates; fires burn.

\`\`\`tryit python
# 1 = "needs human", 0 = "agent can finish"
y_true = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1]
y_pred = [0, 0, 0, 0, 0, 1, 0, 1, 0, 1]  # missed one, one false alarm

def counts(y_true, y_pred):
    tp = fp = tn = fn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1:
            tp += 1
        elif t == 0 and p == 1:
            fp += 1
        elif t == 0 and p == 0:
            tn += 1
        else:
            fn += 1
    return tp, fp, tn, fn

tp, fp, tn, fn = counts(y_true, y_pred)
acc = (tp + tn) / len(y_true)
prec = tp / (tp + fp) if tp + fp else 0.0
rec = tp / (tp + fn) if tp + fn else 0.0
f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
print("TP", tp, "FP", fp, "TN", tn, "FN", fn)
print("accuracy", acc)
print("precision", round(prec, 3), "recall", round(rec, 3), "F1", round(f1, 3))

always_no = [0] * len(y_true)
tp2, fp2, tn2, fn2 = counts(y_true, always_no)
print("always-no accuracy", (tp2 + tn2) / len(y_true), "recall", 0.0)
\`\`\`

Always-no looks strong on accuracy and is a safety disaster if the positive class is “this action is irreversible.”

## Thresholds

If the model outputs a score, **precision and recall trade** as you move the threshold. Pick the threshold on **validation**, not on test, and pick it for a cost: FP costs a human 5 minutes; FN costs a production incident.

## Agent metrics beyond class labels

- **Task success** — did \`goal_satisfied\` return true?
- **Citation rate** — answers with a source
- **Schema validity** — JSON parse + fields
- **Cost / latency** — tokens and seconds
- **Harm** — policy violations, even if rare

Averages hide slices. Report metrics **by tool**, by user tier, by language. The agent that is great on English docs and random on logs will look “fine” in a single number.

## Calibration

If a score is supposed to be a probability, a prediction of 0.9 should be wrong about one time in ten in that bin. Agents that shout 0.99 on everything are **uncalibrated**. A cheap check: bin by score, count actual positives. If the top bin is only half true, do not print “99% confident” in the UI. Temperature scaling (a single number on the logits) is often enough; do not skip the plot.

For routing, calibration decides **when to escalate**. An uncalibrated small model that is “sure” it should \`shell\` is how you skip the human gate.

## Agent connection

Put the confusion matrix on the routing classifier that decides \`ask_human\`. Product will ask for fewer interruptions (precision). Safety will ask to never miss a dangerous action (recall). That disagreement is the job. Write the costs down; do not average them into an F1 and hope.

> **Note:** Macro-F1 averages per-class F1. Use it when rare tools matter. Micro-F1 is closer to overall accuracy.

\`\`\`quiz
A dataset is 95% class 0. A model always predicts 0. What is true?
- Precision and recall for class 1 are both excellent
- *Accuracy is high, but recall for class 1 is zero
- MSE is undefined
- The confusion matrix has no TN
explain: Majority-class predictors inflate accuracy and miss every rare positive.
\`\`\`
`,
    },
    {
      slug: "embeddings-ml",
      title: "Embeddings",
      summary:
        "Meaning as vectors: lookup, cosine similarity, and why retrieval is geometry.",
      minutes: 16,
      level: "intermediate",
      md: `
An **embedding** is a list of numbers that stands in for a discrete thing — a word, a sentence, a ticket, a tool description — so that **geometry approximates meaning**.

“Cat” and “kitten” should be closer than “cat” and “invoice.” Closer usually means **cosine similarity**: the cosine of the angle between two vectors. It ignores length, which is useful because some embedding models encode frequency in the norm and you often do not want that.

You do not need to understand every dimension. You need to know:

1. Same encoder for queries and documents (or a trained pair)
2. A similarity function
3. A leftover error that you must eval

## From id to vector

In classical NLP, each word had a row in a table (lesson 2 of Transformers will build this). In RAG, each **chunk of text** is sent through a model once and stored. At query time you embed the query and take nearest neighbors.

Until then, we can fake a tiny table and still practice the math agents run a million times per day.

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

\`cat\` pulls \`kitten\` and \`dog\`. \`invoice\` pulls \`refund\` and \`sql\`. That is retrieval. Scale the table to millions of chunks and you have a vector index. The geometry did not change.

## Dot product vs cosine vs Euclidean

If vectors are **normalized** to length 1, cosine and dot product are the same. Euclidean distance then ranks the same order too. Production bugs happen when you **train** with one and **search** with another, or you forget to normalize only one side.

## Prefixes and spaces

Many embedding models expect different prefixes: \`query: ...\` versus \`passage: ...\`. If you embed both sides the same way, neighbors get worse in a way that looks like a “bad index.” Read the model card. The toy table in this lesson had **one** shared space. Production often has two spaces that must not be mixed, plus a version pin.

Chunk size is geometry too. A 20-token query against a 2,000-token chunk is a mismatch of **what was averaged**. That is why later RAG lessons split documents on purpose, not because PDFs are fashionable.

## Agent connection

Agents fail at retrieval in geometric ways:

- Query is 20 tokens of chat fluff; the chunk is a table — different region of space
- You embed the user’s latest sentence but the question was two turns ago
- Top-k=3 is too small for the comparison the user asked
- You dump 50 chunks into the window and the LLM attends to the wrong one (similarity ≠ usefulness)

Log the **neighbors and scores**. A routing classifier over tools can be “embed the utterance, embed each tool doc, pick max cosine,” which you should still eval with the confusion counts from the previous lesson.

> **Warning:** Cosine 0.82 is not “82% true.” It is an angle. Calibrate with labels; do not invent a percent.

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
      slug: "unsupervised",
      title: "Unsupervised Learning",
      summary:
        "No labels: find structure. Run tiny 2D k-means in pure Python.",
      minutes: 16,
      level: "intermediate",
      md: `
**Unsupervised** learning is what you do when nobody labeled \`y\`. The questions change: which points clump together? Which traces are unlike the rest? Can we compress this conversation into a smaller vector?

You still evaluate — just not with “accuracy against gold” unless you later obtain gold. You look at cluster sizes, stability, and **whether a human can name the cluster**. Unnamed clusters are not a product.

## K-means in one paragraph

1. Place \`k\` **centroids** (means) in the space
2. Assign each point to the nearest centroid
3. Move each centroid to the mean of its points
4. Repeat until assignments stop changing (or you hit a step budget)

It minimizes within-cluster squared error. It is not magic: \`k\` is a choice, initialization matters, and clusters are **spherical** in spirit. Weird rings and crescents will be sliced badly. For a first map of embedding space it is still the right hammer.

\`\`\`tryit python
import math
import random

points = [
    (0.0, 0.1), (0.2, 0.0), (0.1, 0.2), (0.15, 0.15),  # blob A
    (5.0, 5.1), (5.2, 4.9), (4.8, 5.0), (5.1, 5.2),  # blob B
]

def dist(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def mean(group):
    n = len(group)
    return (sum(p[0] for p in group) / n, sum(p[1] for p in group) / n)

rng = random.Random(1)
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

Assignments should snap to two groups: the origin blob vs the \`(5,5)\` blob. That is k-means doing its only trick.

## How this shows up in agent traces

Cluster **failed** runs by embedding the last tool error. You will find “timeout,” “schema,” and “user cancelled” as separate weather systems. Cluster **user goals** to discover that 40% of volume is “reset password,” which should be a workflow, not an agent.

Anomaly detection is the cousin: a point far from every centroid is a candidate for a new tool or a new eval case.

## Choosing k

The “elbow” of reconstruction error vs \`k\` is a heuristic. For product work, pick \`k\` you can **label in a meeting**. Five named failure modes beat twenty anonymous ones.

## Stability and scale

Run k-means twice with different seeds. If points jump clusters, the structure is weak or \`k\` is wrong. For traces, cluster **errors** or **intents** after embedding, then have a human name twenty examples per cluster. Unlabeled dashboards do not ship.

Scale your dimensions. If one feature is a job id in the thousands and another is a 0–1 flag, Euclidean k-means will cluster by id and ignore the flag. Embeddings from a model are usually comparable across coordinates; homemade feature dumps are not.

Empty clusters happen when a centroid is stranded. The code above reuses the old centroid if a bucket is empty — a small act of self-defense you should copy.

## Agent connection

Unsupervised methods are how you mine the backlog without labeling everything. Then you **promote** a cluster into a supervised label (“this cluster is SQL-timeout; add a retry tool”). Unsupervised finds the taxonomy; supervised ships it.

> **Note:** Running k-means on raw chat tokens is hopeless. Embed first (previous lesson), then cluster the vectors.

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
        "A perceptron, then a one-hidden-layer forward pass with lists — the shape of every LLM block.",
      minutes: 18,
      level: "intermediate",
      md: `
A **neural network** is a stack of linear maps with **nonlinearities** between them. Without the nonlinearity, the whole stack is still one linear map and cannot learn XOR-shaped problems. With it, you get universal function approximation in theory, and “a messy function that fits your data” in practice.

## Perceptron (one neuron)

A neuron: \`z = w · x + b\`, then \`a = f(z)\`. For a step function, \`f\` is 0/1. For modern nets, \`f\` is **ReLU** (\`max(0, z)\`) or similar. Logistic sigmoid squashes to (0, 1) for probabilities.

The perceptron learning rule is gradient descent on a classification loss, or the older “if wrong, add/subtract x.” You already know the modern version from the GD lesson.

## One hidden layer

Input \`x\` (length 2) → hidden (length 2) → output (length 1):

1. \`h_raw = W1 x + b1\`
2. \`h = relu(h_raw)\`
3. \`y = W2 h + b2\`

\`W1\` is a **matrix**: two hidden neurons, each with two weights. We will store matrices as lists of rows. This is the same arithmetic a transformer feed-forward block does, only smaller.

\`\`\`tryit python
def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def matvec(W, x):
    return [dot(row, x) for row in W]

def relu(xs):
    return [max(0.0, v) for v in xs]

# Hand-set weights that compute a simple "both inputs large" detector
W1 = [
    [1.0, 0.0],   # hidden0 looks at x0
    [0.0, 1.0],   # hidden1 looks at x1
]
b1 = [-0.5, -0.5]
W2 = [[1.0, 1.0]]  # output sums hidden
b2 = [-0.5]

def forward(x):
    h = relu([z + b for z, b in zip(matvec(W1, x), b1)])
    y = [z + b for z, b in zip(matvec(W2, h), b2)]
    return h, y[0]

for x in ([0.0, 0.0], [1.0, 0.0], [0.0, 1.0], [1.0, 1.0]):
    h, y = forward(x)
    print("x", x, "hidden", h, "y", y, "fire" if y > 0 else "quiet")
\`\`\`

Only \`(1, 1)\` clears both ReLUs and the output threshold. That is a **nonlinear** decision. A single linear neuron cannot draw that “both must be on” region as cleanly without the hidden layer.

## What you are looking at when you call an LLM

A transformer layer is: attention (next track) plus a **feed-forward net** like this on every token, plus residual adds. Billions of parameters are still \`Wx + b\` and a nonlinearity, repeated. Forward pass = predict. Backward pass = GD on a next-token loss.

You do not need to derive every gradient by hand. You do need to know that **depth** (more layers) and **width** (more hidden units) add capacity — and overfitting, cost, and latency.

## Training versus inference

The snippet was **inference**: weights frozen, data flows forward. Training would compute how each weight changed the loss and step it (backpropagation). You do not need to implement backprop to call an LLM, but you do need to remember that APIs expose inference. Fine-tuning, in the next track, is when someone runs the backward pass on **your** data.

When ReLU outputs zero, the gradient through that unit is zero for that example — a “dead” ReLU if it stays off. For agents, the analog is a tool the policy never calls: it cannot learn from a path it never takes. Exploration (a little temperature on the router, or a forced tool on eval) is how you keep units — and tools — alive.

Initialize weights small and random in real nets so symmetry breaks; our hand-set table was a demonstration, not a training recipe.

## Agent connection

Small nets still earn rent **around** the LLM: a tiny classifier for prompt injection, a ranker for chunks, a calibrated “should we abstain?” head. Running a 2-layer net on CPU is cheaper than another 8k-token call. The scientific method from this track still applies: split data, pick a loss, report precision/recall, watch the validation curve.

Next track: **Neural Nets & Transformers** — tokens, attention, and the real architecture behind the APIs.

> **Tip:** If you can write \`matvec\`, you can read a paper’s “linear projection” without panic. It is a matrix multiplying a vector.

\`\`\`quiz
Why put a nonlinearity between two linear layers?
- To make Python faster
- *Otherwise the composition is still one linear map and cannot learn many patterns
- ReLU deletes the gradient forever
- Softmax requires three layers
explain: Linear o linear = linear. The activation is what makes depth useful.
\`\`\`
`,
    },
  ],
};
