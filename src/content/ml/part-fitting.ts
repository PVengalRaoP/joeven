import type { RawLesson } from "@/lib/types";

export const mlFitting: RawLesson[] = [
  {
    slug: "loss-functions",
    title: "Loss Functions",
    summary:
      "A loss is a number that is small when the model is right. Training is making that number go down.",
    minutes: 21,
    level: "beginner",
    md: `
A **loss** (also called a cost) is a number that is **small when the model is right** and **large when it is wrong**. Training is “change parameters to make this number go down on the training set,” and hope it also goes down on validation.

If you cannot write the loss, you do not know what you are optimizing. Accuracy is a **metric**. You usually cannot take a slope through a hard yes/no, so we train on a smooth cousin. The cousin is the loss. The metric is what you report to humans. They are allowed to disagree. When they disagree, believe the metric for shipping and the loss for the training loop — then ask whether the loss is the wrong cousin.

A loss is a **function**: parameters plus a batch of examples in, one number out. Gradient descent (next) is how you walk that function downhill. This page is the map of which mountain you chose.

## Mean squared error (regression)

For predictions \`p\` and targets \`t\`:

\`MSE = average of (p - t) squared\`

Squares punish large mistakes more than small ones. Predicting 10 when the answer is 0 is much worse than predicting 1. That is often what you want for numbers (latency, a quality score, tokens remaining). It is a bad idea for classifying tools: being “off by 2 tool ids” is meaningless. Tool 4 is not “twice” tool 2.

**Mean absolute error** (average of absolute gaps) punishes large mistakes more gently. Use it when a few wild outliers should not own the fit. **Huber**-style hybrids exist; you do not need the name to know the product question: should one crazy row dominate training?

MSE on chances for a classifier is also a mismatch. It does not treat “true class has chance 0.001” as the disaster that **cross-entropy** does. Use MSE for numbers that live on a line. Use cross-entropy for exclusive classes.

## Cross-entropy (classification)

The model outputs **logits** (raw scores, one per class). Softmax turns them into **chances** that add up to 1. Then we punish a low chance on the **correct** class:

\`loss = -log(chance of the true class)\`

If the true class has chance 1, loss is 0. If it has chance 0.001, loss is large. During training the model is not asked to pick a class. It is asked to put mass on the right class. The hard pick (argmax) is for inference and for accuracy.

Softmax, in code: subtract the max logit (so \`exp\` does not explode), exponentiate, divide by the sum. Subtracting the max does not change the chances. It saves you from overflow. You will see this trick everywhere. It is numerics, not a new model.

**Binary cross-entropy** is the two-class version: one chance \`p\` from a sigmoid, loss is \`-log(p)\` if the label is 1 and \`-log(1-p)\` if the label is 0. Same idea: punish a confident wrong chance.

If missing a jailbreak is a hundred times worse than a false alarm, say so: **class weights** (multiply that example’s loss), or a metric you **select** on. Unweighted averages spend all their effort on the common class. The loss will happily ignore the rare disaster unless you make the disaster expensive.

\`\`\`viz plot
title MSE grows when the miss is large
xlabel prediction minus target
ylabel loss
fn mse x**2 -4 4
caption Squares punish large mistakes more than small ones. Do not use this shape on tool ids.
\`\`\`

\`\`\`viz bars
title Cross-entropy on the true class
bar correct,0.05,2
bar unsure,1.10,1
bar wrong,3.70,0
caption Low chance on the right class is a large loss. Training pushes mass onto that class.
\`\`\`

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

**What printed:** MSE of a perfect pair is \`0.0\`. A bit off is a small positive number. Way off is much larger — squares amplify the 7-point miss. Then three classification rows, true class always index 0. **Confident-correct** puts almost all mass on class 0; loss is near 0. **Unsure** is roughly equal chances (~0.333 each); loss is about \`1.1\` (\`-log(1/3)\`). **Confident-wrong** puts mass on class 2; chance of the true class is tiny; loss is several nats — a disaster. That is the loss telling the optimizer what we care about.

The \`1e-12\` floor keeps \`log(0)\` from exploding if a chance underflows. It is a numeric seatbelt, not a modeling idea.

## Loss vs metric

| | Loss | Metric |
|---|---|---|
| Role | Drive training | Report quality |
| Smooth? | Usually yes | Often no (accuracy, pass rate) |
| Human meaning | Indirect | Direct (“did the agent finish?”) |

You can overfit a loss and still fail a product metric. Agents should log **both**: a training-style score (valid JSON? citation present?) and a business score (ticket closed without reopen).

A loss that is “average token surprise” of a language model is not “did we call the right tool.” Fine-tuning on next-token text can drop loss while tool choice gets worse. If the product is a tool policy, the loss should see tools — or you accept that you are training a different job and you **select** checkpoints on the tool metric.

**Surrogate** is the honest word: cross-entropy is a smooth stand-in for “wrong class.” It is a good stand-in when chances are calibrated enough to rank. It is a bad stand-in when you need a costed cutoff on a rare class. Then you still train on cross-entropy, and you **choose the cutoff** on validation with the real costs (later lessons).

## Designing a loss for traces

When you “train” a prompt on ten traces by eyeball, you still have a loss — it is just in your head and unstable. Write it down:

- \`1.0\` if schema-invalid
- \`0.3\` if no citation
- \`0.0\` if gold match
- extra if a forbidden tool ran

Average it. That number is more honest than “it feels better.” You can still not take a slope through a prompt. You can **search**: try neighbors, keep the winner. The ML habit is: define downhill, then walk.

If two errors should hurt equally, do not use MSE. If a miss on the rare class is fatal, do not optimize plain accuracy, and do not use unweighted cross-entropy without looking at recall.

## Common mistakes

- Training a router with MSE on integer tool ids.
- Reporting loss as if it were pass rate.
- Ignoring the rare class in an unweighted average.
- Changing the loss until the demo looks good, without renaming the dataset version.
- Using accuracy as the training objective (zero slope almost everywhere).

## How agents use this

A judge that scores traces is a loss you can compute without GPUs. Put it on a frozen slice. Compare rules, prompts, and small models with the **same** number. When you later fit weights, pick a smooth cousin that points at the same idea: put mass on the right tool, punish forbidden tools, do not square a class index.

Loss is not morality. It is a contract with the optimizer. Write the contract in one sentence before you train: “downhill means higher chance on the senior-engineer tool, on train, without using test.” Then keep a metric that says whether that contract was the right product.

> **Tip:** If two errors should hurt equally, do not use MSE. If a miss on the rare class is fatal, do not optimize plain accuracy.

\`\`\`quiz
Why train a classifier with cross-entropy instead of accuracy?
- Accuracy is illegal in Python
- *Accuracy uses a hard decision and is not a smooth signal; cross-entropy penalizes low chance on the true class
- Cross-entropy always equals MSE
- Softmax deletes the true class
explain: Training needs a smooth objective. Cross-entropy uses chances; accuracy uses a hard pick.
\`\`\`
`,
  },
  {
    slug: "gradient-descent",
    title: "Gradient Descent",
    summary:
      "Measure how the loss changes when you nudge a knob, then nudge the knob downhill.",
    minutes: 21,
    level: "intermediate",
    md: `
**Gradient descent** is the algorithm behind almost every neural net you will use: measure how the loss changes when you nudge each parameter, then nudge the parameters **downhill**.

For a scalar parameter \`w\`, the **gradient** is the slope. Update:

\`w = w - learning_rate * slope\`

If the slope is positive, \`w\` is too big; we decrease it. If negative, we increase it. The **learning rate** (\`lr\`) is how brave the step is. Too large: you jump over the valley. Too small: you wait forever (and pay the cloud).

You do not need to love calculus to use this. You need the picture: the loss is a landscape; parameters are coordinates; the slope says which way is up; we walk the other way a little. Automatic differentiation computes that slope for millions of knobs. On this page we do one knob by hand so the loop is visible.

## A one-parameter universe

We fit \`y ≈ w * x\` with MSE. True \`w\` is 2. We start at 0 and only look at the data.

The slope of MSE for one example is \`2 * (w*x - y) * x\`, then average. You can also estimate the slope with a tiny bump (**finite difference**): raise \`w\` a hair, lower it a hair, subtract the losses, divide. If analytic slope and finite difference disagree, your formula is wrong — a debugging trick that still works on tiny agent-scoring functions you wrote yourself.

The loop is always:

1. **Forward** — compute predictions from current knobs
2. **Loss** — one number
3. **Backward** — slope of that number with respect to each knob
4. **Step** — move knobs opposite the slope

Print loss every few steps. If it becomes inf, your \`lr\` is a dare. If it never moves, the slope is near 0 (a bug, a dead unit, or \`lr\` too small) or you are already in a flat spot.

\`\`\`viz plot
title Loss falls as w walks downhill
xlabel step
ylabel loss
fn loss 28*exp(-0.16*x)+0.3 0 25
mark 0,28.3 start
mark 25,0.5 later
caption Each step nudges w against the slope. If the curve explodes, the learning rate is too brave.
\`\`\`

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

**What printed:** at step 0, \`w\` is 0 and loss is large (the targets are 2, 4, 6, 8 and you predict all zeros). At step 1, analytic gradient and finite-difference gradient match to several decimals — the formula is not a typo. Then \`w\` climbs toward 2 and loss falls: after 25 steps you should be near the true slope, with a small leftover depending on \`lr\`. Bigger models have millions of \`w\`s and use automatic differentiation, but the loop is the same: forward, loss, backward, step.

If you set \`lr\` to 1.0 in your head, \`w\` would leap past 2 and might diverge. If you set \`lr\` to 0.0001, 25 steps would barely move. That is the next lesson’s table. Here, notice the minus sign: we subtract the slope because we want **descent**.

## Mini-batches and noise

**Full-batch** uses every example in the gradient. The slope is stable and potentially slow. **SGD** (stochastic gradient descent) uses one example or a small **batch**. The gradient gets noisy; that noise sometimes helps escape a bad valley. For agents scoring traces, a “batch” might be 16 conversations — the same idea.

Shuffle train between epochs so the batches are not always the same order. A frozen unlucky order can stall. That shuffle is not a test-set shuffle. It is only train.

**Epoch** means one pass over the training set. People quote epochs because it is easy. What the optimizer actually sees is **steps**. A huge dataset with tiny batches can do many steps per epoch.

Non-convex losses (neural nets) have many valleys. Gradient descent does not promise the global best \`w\`. It promises “from here, go downhill.” Early stopping on validation is how practitioners stay honest: when the working exam worsens, stop, even if train loss still falls.

## When the slope lies

The slope is the derivative of **the loss you wrote**, not of the product. If the loss ignores forbidden tools, descent will not avoid them. If the loss is next-token surprise, descent will make fluent text. If labels are noisy, descent will fit the noise given enough knobs.

Vanishing slopes (sigmoid stuck at 0 or 1, ReLU units that never fire) look like “training did nothing.” Exploding slopes look like NaN. Clipping gradients (cap the length of the slope list) is a seatbelt, not a model. Print. Do not guess.

## Schedules, clipping, and scoring functions

People often **decay** the learning rate: start brave, then take smaller steps so you settle in a valley instead of hopping out. A simple version is “use 0.02 for 50 steps, then 0.005.” That decay is a hyperparameter. So is **clipping**: if the slope list is huge, shrink it before the step. Neither is magic. Both are reactions to a printed loss that jumped.

Momentum (keep a running average of the slope, then step along that average) smooths noisy batches. Adaptive methods (one effective step size per knob) exist in every library. You do not need to implement them here. You need to know they still do \`w = w - something * slope\`. If the loss is the wrong product, a fancier stepper will descend the wrong hill faster.

Agent work often has **no analytic slope**. You have a scoring function on a freeze of traces: schema penalty plus missing citation plus forbidden tool. You cannot backprop through a hosted model easily. You can still walk downhill: change one prompt sentence, rescore the freeze, keep the winner. That is coordinate descent. The gradient-descent lesson still applies: define the number, take small steps, print, stop when validation turns. Do not take a huge prompt rewrite and call it one step — you will not know which sentence moved the score.

When you *can* train a small router, print three numbers per N steps: train loss, validation loss, and a product metric (recall on \`ask_human\`). If train loss falls and the product metric does not, your loss is a bad cousin. Change the loss, not the stepper.

## Common mistakes

- Forgetting the minus sign and climbing the loss.
- A learning rate that worked at \`w = 0\` and explodes later.
- Computing the gradient on validation or test (leakage with extra ceremony).
- Comparing two runs that used different step counts and calling it architecture.
- No print of loss, then a week of “maybe it is learning.”

## How agents use this

You will rarely write GPU kernels. You will often write a scoring function and a search: prompt candidates, tool-order candidates, chunk-size candidates. If you can compute a numeric score, you can descend — even if the “gradient” is “try the neighbor and keep the winner” (**coordinate search**). The ML habit is: **define downhill**, then walk.

Fine-tuning is this loop on someone else’s architecture. You still own the loss, the split, and the print. If you cannot say what downhill means on a frozen validation slice, you are not training. You are burning compute.

> **Warning:** A learning rate that works at \`w = 0\` can explode later. Print loss every N steps. If it becomes inf, your \`lr\` is a dare.

\`\`\`quiz
In the update w = w - lr * slope, why is there a minus sign?
- Python lists are 0-indexed
- *Because we want to decrease the loss, so we move opposite the slope
- Gradients are always negative
- Minus makes the learning rate learn
explain: The gradient points toward increase. Descent flips it.
\`\`\`
`,
  },
  {
    slug: "linear-classifier",
    title: "A Linear Classifier",
    summary:
      "A score, a sigmoid, a cutoff. This is the shape of every routing head you will train.",
    minutes: 20,
    level: "intermediate",
    md: `
A **linear classifier** is the smallest real model: one score per class, or one score plus a cutoff for yes/no. It is not a toy you outgrow on day two. A huge amount of production routing is this shape: a list of features, a list of weights, a chance, a cutoff.

For two classes (urgent / not):

1. \`score = w * x + b\` (or a dot product if \`x\` is a list)
2. \`p = sigmoid(score)\` — a chance between 0 and 1
3. Predict 1 if \`p >= 0.5\` (or another cutoff you pick on validation)

**Sigmoid** is \`1 / (1 + exp(-score))\`. Large positive scores become chances near 1. Large negative scores become chances near 0. We clip the score in code so \`exp\` does not explode. That is numerics.

This is **logistic regression**. The name is old. The object is a linear score plus a smooth chance. You already know the training rule: take the slope of **binary cross-entropy** and step downhill. The slope for one example has a kind form: \`(p - y) * x\` for \`w\`, and \`p - y\` for \`b\`. You do not need to derive it at 2 a.m. You need to know it is just gradient descent on a classification loss.

For several tools, you use one score per tool (a **logit**), then **softmax**. Same idea: linear scores, then chances that sum to 1. The predicted tool is the largest chance, unless you use a cutoff to **abstain** when the top chance is weak.

## What “linear” actually allows

A linear model can only draw a **straight cut** in feature space. If urgent tickets are “down **or** refund,” one weight on a single count may not be enough. Then you add features — an extra flag, a product of two flags you computed yourself — or a hidden layer (later). Adding a feature is often cheaper than adding depth.

Linearity is a **feature-space** statement. If you feed an embedding, the cut is straight in embedding space, which can be a curved story in English. That is why bag-of-words linear routers still work: the space is already a pile of useful flags.

If \`w\` goes to a huge number, the sigmoid saturates (\`p\` stuck at 0 or 1) and the slope dies. Smaller steps, or regularization, keep it trainable. Saturation looks like “accuracy froze.” Print \`p\` on a few rows.

\`\`\`viz plot
title Sigmoid: a score becomes a chance
xlabel score
ylabel chance
fn sigmoid 1/(1+exp(-x)) -6 6
mark 0,0.5 cutoff
caption Large positive scores sit near 1. Large negative scores sit near 0. The 0.5 line is a cutoff you pick later.
\`\`\`

\`\`\`tryit python
import math

# x = how many times "down" appears, y = urgent
xs = [0.0, 1.0, 2.0, 3.0, 4.0]
ys = [0.0, 0.0, 1.0, 1.0, 1.0]

def sigmoid(z):
    z = max(-30.0, min(30.0, z))
    return 1.0 / (1.0 + math.exp(-z))

def predict_p(x, w, b):
    return sigmoid(w * x + b)

w, b = 0.0, 0.0
lr = 0.5
for step in range(1, 81):
    gw = gb = 0.0
    for x, y in zip(xs, ys):
        p = predict_p(x, w, b)
        gw += (p - y) * x
        gb += p - y
    n = len(xs)
    w -= lr * gw / n
    b -= lr * gb / n

print("w", round(w, 3), "b", round(b, 3))
for x, y in zip(xs, ys):
    p = predict_p(x, w, b)
    yhat = 1 if p >= 0.5 else 0
    print("downs", int(x), "p", round(p, 3), "pred", yhat, "true", int(y))
\`\`\`

**What printed:** a fitted \`w\` (positive) and \`b\` (negative-ish). Then five rows. Low “down” counts get a small chance and predict 0. High counts get a large chance and predict 1. The middle of the table is where the cutoff matters. You just trained a router on one feature with 80 steps of gradient descent. No library. Lists of floats.

This run used **all five rows** as train. There is no test here. The print is to see the S-shape of sigmoid, not to publish a number. On a real freeze, you would fit on train and print this table on validation.

## Cutoff is not training

The 0.5 in \`p >= 0.5\` is a **hyperparameter**. Training put mass on the right class. The cutoff turns mass into a yes/no with costs. Rare classes and thresholds get their own page. Remember the split of jobs: weights from descent on train; cutoff from costs on validation.

**Abstain** is a second cutoff: if \`p\` is between 0.4 and 0.6, call a human or call the LLM. A linear router plus abstain is often the whole architecture in front of an expensive model.

## From one number to a list

Replace \`w * x\` with a dot product: each feature has a weight. Bag-of-words is this. Embeddings are this (a long list). You can add a bias per class for multi-class. You still print chances. You still need a split. You still need a dummy.

Calibration (later) asks whether a printed 0.9 is right 90% of the time. Linear models are not automatically calibrated. Do not put \`p\` in the UI until you check.

## Several tools, one linear map

A real router has more than urgent/not. You keep a weight list (or a row of a matrix) **per tool**. Features go in, one score per tool comes out, softmax turns scores into chances that add to 1, and you pick the largest chance — or you abstain if the top two are close.

That is still a linear classifier. The cut is a set of planes in feature space, one per pair of tools. If “refund” tickets look like a blob that is not linearly separable from “search” — mixed in the same bag-of-words region — no amount of extra epochs will draw a curve. You add a feature (a VIP flag, a cosine to the refund-policy chunk, a “already called search” flag) or you add a hidden layer.

Read the weights after a fit. A large positive weight on the word “select” for the sql class is a story you can test. A huge weight on a rare token that appeared once in train is overfitting you can delete. Linear models earn their keep because you can **print the story**. If you cannot name a feature that should matter, do not start with a net; start with better \`x\`.

The intercept \`b\` is the log-odds when all features are zero: the prior, roughly. If most tickets are search, \`b\` for search should help search win on a blank greeting. That is not a bug. That is majority class baked into the model. You still publish the majority dummy so people do not confuse “the intercept learned the base rate” with “we found a clever pattern.”

## Common mistakes

- Treating tool id as \`x\` and fitting a line through 0, 1, 2, 3.
- Training with 0.5 cutoff in mind, then changing cutoff on test.
- Unscaled features so one column owns \`w\`.
- Calling it deep learning because you used sigmoid.
- No majority baseline next to the fitted accuracy.

## How agents use this

A cheap **tool router** is often this: embed the user text (or use bag-of-words), multiply by a small weight list or matrix, softmax over tools. You can train it on a few thousand labeled traces and call it in milliseconds. Use the LLM when the router is unsure (chance of top tool below a cutoff). That cutoff is a hyperparameter.

Keep the router small enough to log. Print the score, the chance, the decision, and the features that fired. When it fails, you want “VIP flag and the word invoice pushed sql” not “the net was in a mood.” Linear models explain themselves if you do not hide the weights.

> **Note:** If \`w\` goes to a huge number, the sigmoid saturates (p stuck at 0 or 1) and the slope dies. Smaller steps, or regularization, keep it trainable.

\`\`\`quiz
What does sigmoid do to a linear score?
- It picks a tool id
- *It squashes the score into a chance between 0 and 1
- It splits the data into train and test
- It deletes negative features
explain: Sigmoid maps any real score to (0, 1) so you can treat it as P(class=1) and train with cross-entropy.
\`\`\`
`,
  },
  {
    slug: "hyperparameters",
    title: "Hyperparameters",
    summary:
      "Learning rate, epochs, batch size, and seeds are knobs you choose — on validation, not on test.",
    minutes: 19,
    level: "beginner",
    md: `
**Parameters** are numbers the training loop **fits** (\`w\`, \`b\`, millions of weights). **Hyperparameters** are numbers **you** choose: learning rate, number of epochs, batch size, cutoff, temperature, top-k.

If you pick them by looking at the test set, the test set is no longer a test. Pick on **validation**. Touch test once.

This distinction is the most violated rule in agent work, because “hyperparameters” sound like training, and prompts sound like English. Temperature, top-k retrieved chunks, max steps, and “escalate if p < 0.6” are hyperparameters of the **agent**. Sweeping them on the published eval is the same crime as tuning \`lr\` on test.

## The knobs you will actually turn

| Knob | If too small | If too large |
|---|---|---|
| **Learning rate** | Loss barely moves | Loss explodes or jumps |
| **Epochs** | Underfit | Overfit (next lesson) |
| **Batch size** | Noisy, slow wall-clock if tiny | Smooth, may need more memory |
| **Seed** | — | Different seed, slightly different run |
| **Cutoff** | Too many yeses | Misses the rare class |
| **Top-k** | Gold chunk never enters the prompt | Extra junk drowns the model |

An **epoch** is one pass over the training set. A **batch** is the slice you use for one gradient step. More epochs is not more virtue. It is more chances to memorize train.

**Weight decay**, dropout rate, hidden size, and prompt length are hyperparameters too. Anything you choose rather than fit belongs on the list. Write the list. Change **one** knob at a time. If you change lr, batch, and prompt in one commit, you will not know which one helped.

\`\`\`viz plot
title Same 25 steps, three learning rates
xlabel step
ylabel gap from true w
fn tiny 2*exp(-0.004*x) 0 25
fn good 2*exp(-0.18*x) 0 25
fn huge min(8, 0.15*exp(0.22*x)) 0 25
caption Tiny lr barely moves. Good lr finds the valley. Huge lr blows up. Only the knob changed.
\`\`\`

\`\`\`tryit python
xs = [1.0, 2.0, 3.0, 4.0]
ys = [2.0, 4.0, 6.0, 8.0]

def run(lr, steps):
    w = 0.0
    for _ in range(steps):
        g = sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)
        w = w - lr * g
        if w != w or abs(w) > 1e6:
            return "exploded"
    loss = sum((w * x - y) ** 2 for x, y in zip(xs, ys)) / len(xs)
    return "w=" + str(round(w, 3)) + " loss=" + str(round(loss, 4))

print("tiny lr  ", run(0.0001, 25))
print("good lr  ", run(0.02, 25))
print("huge lr  ", run(1.0, 25))
\`\`\`

**What printed:** three outcomes on the **same** data and the **same** 25 steps. Tiny \`lr\` barely moved: \`w\` still near 0, loss still large. Good \`lr\` found \`w\` near 2 with a small loss. Huge \`lr\` returned \`exploded\` — the update jumped so far that \`w\` became nonsense (\`w != w\` is the NaN check, or the absolute value blew past a million). Only \`lr\` changed. That is why people plot loss.

The \`w != w\` test is a Python trick: NaN is not equal to itself. You do not need a library to see a failed run.

## Seeds and “it worked once”

\`random.Random(0)\` makes shuffle and init repeatable. A result that only works on seed 7 is not a result. Report the seed. Run more than one if the set is small. Agent evals with 40 traces are small. One lucky split plus one lucky temperature is a story.

Seeds are hyperparameters you should **not** optimize. Do not search 200 seeds and keep the winner on test. Freeze a seed for reproducibility, then run a few extra seeds on validation to see spread.

## Search without cheating

Grid search: try a few learning rates, a few cutoffs, write a table on validation. Random search: pick random combinations when there are many knobs. Either is fine at this scale. **Nested** cheating is not: picking the best prompt on test, then picking the best cutoff on the same test.

Use a **budget**: you may look at validation N times. After that, freeze. If you must keep searching, get a new validation slice from later traces and treat the old one as worn.

For agents, log every trial: prompt version, k, temperature, cutoff, seed, validation score. The log is the experiment. Memory is not.

## What counts as a knob on an agent

Write a one-page catalog so the team stops arguing about “the model” when they mean a cutoff.

- **Generation:** temperature, top-p, max tokens, whether you sample or take the greedy token
- **Loop:** max steps, retry counts, whether \`finish\` is allowed before a required tool
- **Retrieval:** encoder name, chunk size, overlap, top-k, score cutoff, prefixes
- **Router:** decision cutoff, abstain band, class weights used in training
- **Training:** learning rate, epochs, batch size, weight decay, seed
- **Prompt:** template version, few-shot ids (those ids are data, and a hyperparameter of which data you stuffed)

Each row needs: default, range you are willing to try, which split you tune on, and whether changing it requires a new dataset version. Temperature 0 vs 0.7 can move a tool-calling agent more than a new base model. Treat it with the same respect as \`lr\`.

**Nested** mistakes look like science: you pick the best of 20 prompts on validation, *then* pick the best cutoff on the same validation, *then* pick the best k, and you report the winner as if it were one pre-registered model. Each look wears the slice. Budget the looks. When the budget is spent, freeze and take the test number once. If you must keep searching, get a new validation slice from later traces.

A result that moves by 2 points when you change the seed on 40 traces is noise. Report spread, or get more traces, before you ship a knob change as a win.

## Common mistakes

- “Fixing” the demo until the published number moves.
- Searching temperature on the live customer mix and calling it science.
- One huge change-set of knobs.
- Treating seed search as modeling.
- No record of what was tried, so you retry last month’s failure.

## How agents use this

Prompt length, temperature, top-k retrieved chunks, max steps, and “escalate if p < 0.6” are hyperparameters of the **agent**. Sweep them on a frozen validation slice of traces. Do not “fix” the demo until the published number moves. That is the same crime as tuning on test.

When a vendor ships a new model, those knobs may need a **re-sweep** on validation. The old temperature is not a law of nature. Re-sweep does not mean peek at test. It means the working exam again, then one test run.

> **Tip:** Change one knob at a time. If you change lr, batch, and prompt in one commit, you will not know which one helped.

\`\`\`quiz
Where should you pick the learning rate and the decision cutoff?
- On the test set, so the published number looks good
- *On the validation set, then freeze them before you touch test
- On production traffic only
- Inside the loss formula
explain: Validation is for choices. Test is for one honest number after those choices are frozen.
\`\`\`
`,
  },
  {
    slug: "overfitting",
    title: "Overfitting",
    summary:
      "The model fits the training sample, including accidents, instead of the pattern that will appear tomorrow.",
    minutes: 21,
    level: "intermediate",
    md: `
**Overfitting** is when the model fits the **training sample**, including accidents, instead of the **pattern** that will appear tomorrow.

The giveaway is a split personality: training loss goes to zero; validation loss goes the wrong way. Accuracy on the demo is 100%. Accuracy on next week’s tickets is a coin flip.

This is not a moral failing of neural nets. It is what a flexible function does when you give it more knobs than independent facts. A 200-line system prompt that enumerates every anecdote from last month is the same picture without a GPU: you fitted the sample.

## Noise teaches the wrong lesson

If labels are noisy, a flexible model will learn the noise. If you have more knobs than independent examples, you can interpolate anything. Neural nets are often in that regime. They still generalize if you stop in time and if the data matches production. They do not get a pass on a 12-trace “eval.”

A high-degree curve that hits every training point and goes wild in between is the textbook drawing. Agents do the same when few-shots are the twelve incidents from Slack, or when retrieval always returns the same three docs that happened to sit in the train conversations.

**Memorization** is overfitting as a dictionary: if this \`x\` appeared, return that \`y\`; otherwise guess nothing useful. Perfect train, useless val.

\`\`\`viz plot
title Train looks perfect; validation turns up
xlabel steps
ylabel loss
fn train 2.2*exp(-0.12*x)+0.05 0 40
fn val 0.85+0.018*x+0.45*exp(-0.14*x) 0 40
vline 18 stop
caption The gap is overfitting. Stop when the validation curve turns, not when train hits zero.
\`\`\`

\`\`\`tryit python
train_x = [0, 1, 2, 3, 4]
train_y = [0.2, 2.1, 3.7, 6.4, 7.8]  # roughly 2x
val_x = [0.5, 1.5, 2.5, 3.5]
val_y = [1.0, 3.0, 5.0, 7.0]

def predict_linear(x):
    return 2.0 * x

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

**What printed:** the linear rule (predict twice \`x\`) has a small train MSE and a small val MSE — it captured the pattern, not the exact noisy train points. The memorizer has train MSE \`0.0\` and a **large** val MSE, because validation \`x\` never appeared as keys, so it predicts \`0.0\` every time. That is overfitting as a dictionary. Train looks perfect. Tomorrow looks like a different job.

The linear function is slightly **underfit** on the noisy train points (it does not hit 6.4 exactly). That is allowed. Slightly underfit and stable beats perfect on twelve examples.

## Underfitting is the other side

A model that is too simple (always predict 0, or a line through a curve) is **underfit**: train and validation are both bad. You want the middle: simple enough to be stable, rich enough to fit the real pattern.

If train is bad **and** val is bad, add features, add capacity, or fix labels — do not immediately add more epochs. If train is great and val is bad, you already have too much capacity or too little data or leakage that does not transfer. **Early stopping** (regularization next) is the practical middle: watch val, stop when it turns.

Capacity is not only net width. For agents: more tools, more prompt clauses, more retrieved chunks, more few-shots, more special-case sentences. Each is a knob that can memorize last week.

## Contamination

A huge chat model can “overfit” your forty-example eval without a single gradient step if those examples leaked into pretraining, into the system prompt as few-shots, or into the retrieval index. That is **contamination**, not a polynomial. Treat few-shot examples as training data. They do not belong in the conversations you report as test.

If you iterate the eval until the model passes, you fitted the eval. Rotate items. Hold out users. Keep a slice that nobody is allowed to “fix” except by bumping the dataset version.

## How to fight it (preview)

- More independent data (new tickets, not paraphrases of the same five)
- Simpler functions (keywords, linear router)
- Regularization and early stopping (next part)
- Frozen splits and no test peeking
- Features that exist at decision time only

You cannot fight overfitting by staring at train accuracy. The plot you want is **two** curves: train and validation, versus steps or versus prompt versions.

## Two curves, and the fake “we generalized”

Leakage can **hide** overfitting. If test is a paraphrase of train, both curves look great and next week still dies. Contamination is that plot in disguise: the published exam was in the prompt, in the index, or in pretraining. You did not generalize to the phenomenon. You recognized the sample.

The honest picture is three numbers, not one:

1. Train metric
2. Validation metric on a freeze that did not guide the last fit
3. A **fresh** slice from a later week (drift, later)

If 1 is great, 2 is great, and 3 is poor, you overfit the freeze (eval overfitting) or the world moved. If 1 is great and 2 is poor, you overfit train. If all three are poor, you underfit or you are answering the wrong question.

Agent-specific overfitting is often **policy memorization**: the system prompt lists last month’s outage, the few-shots are the same six Slack threads, retrieval always returns the same three docs because those docs were in the train conversations. The model is a lookup table with extra English. Cutting capacity (shorter prompt, fewer tools, smaller k) is a real fix. Adding another anecdote is not.

Stop rules belong with regularization, but the diagnosis belongs here: whenever someone shows 100% on a demo, ask whether the demo ids sit in train, in the prompt, or in the index. If yes, you have not measured generalization. You have measured a mirror.

## Common mistakes

- 100% on the demo script, which is also the train file.
- Adding a prompt paragraph per incident, forever.
- Few-shots copied from the test conversations.
- Celebrating train loss of 0.0.
- Calling a memorizing k-NN (\`k = 1\` on duplicate tickets) a “retrieval win.”

## How agents use this

Overfit agents quote yesterday’s outage as if it were physics. They retrieve the same three docs for every question. They pass an internal eval that was updated until it passed. Hold out users. Rotate evals. If train traces and the demo script are the same file, you are the memorizer.

A model that is slightly underfit and stable beats a model that is perfect on twelve examples. Ship the stable one. Put the twelve examples in train or in a gallery of bugs, not in the published exam.

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
];
