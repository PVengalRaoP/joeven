import type { RawLesson } from "@/lib/types";

export const mlEval: RawLesson[] = [
  {
    slug: "regularization",
    title: "Regularization",
    summary:
      "A prior that says be boring: smaller weights, shorter prompts, fewer tools, stop when validation worsens.",
    minutes: 20,
    level: "intermediate",
    md: `
**Regularization** is extra pressure that keeps the model from using wild knobs. It is a prior that says **be boring**. Boring models travel better to next week.

You already met overfitting: train looks perfect, validation does not. Regularization is how you ask the function to stay simple **while** you still fit. It is not a separate religion. It is a term in the loss, a stop rule, or a smaller action space.

If you only add data, you may still need this. If you cannot add data, you almost always need this. Agents regularize with fewer tools and shorter prompts more often than with a fancy penalty — same idea.

## Weight penalties

**L2** (weight decay) adds \`lambda * sum(w squared)\` to the loss so large weights cost money. Large weights make wild curves: a huge \`w\` on a noisy flag will fire on accidents.

**L1** pushes weights toward exact zero (some features drop out). That is useful when you have many noisy flags and you want a sparse story: only a few words actually matter.

**Dropout** randomly ignores units during training so the net cannot rely on one fragile combination. At inference, dropout is off. Forgetting to turn it off makes traces jitter — a later page on train vs inference.

Lambda is a **hyperparameter**. Sweep it on validation. Zero is a valid answer if the model is already simple. Huge lambda is “always predict the prior”: you regularized so hard you underfit.

For prompts and agents, regularization looks like:

- Shorter system prompts
- Fewer tools
- Temperature not maxed
- Early stopping on a frozen eval set
- Not adding a new special-case sentence after every incident
- Smaller top-k (less junk context is a capacity cut)

## Early stopping

Watch validation. When it worsens for several checks, **stop** and keep the last good checkpoint (or prompt). This is the regularizer you will actually use.

You need a **patience** number: how many bad checks before you stop. Patience is a hyperparameter. Do not pick it on test. Plot train vs val. If you only plot train, you will never stop.

For prompt search, early stopping is: if the last five prompt edits did not improve the frozen validation slice, stop editing. Put the rest of the ideas in a backlog, not in production.

\`\`\`viz plot
title No L2: a wild weight chases the accident
xlabel x
ylabel y
fn wild 3.4*x 0 2.5
fn true 2*x 0 2.5
caption The steep line fits the noisy point. Tomorrow probably looks like the gentle line.
\`\`\`

\`\`\`viz plot
title With L2: stay closer to the simple pattern
xlabel x
ylabel y
fn l2 2.2*x 0 2.5
fn true 2*x 0 2.5
caption A cost on large weights keeps w nearer 2. Train fit may look worse. Next week is the bet.
\`\`\`

\`\`\`tryit python
# Fit y ≈ w*x on two points, then see L2 keep w smaller
xs = [1.0, 2.0]
ys = [2.0, 4.0]
# Extra noisy point that a huge w would chase
xs_noisy = [1.0, 2.0, 1.5]
ys_noisy = [2.0, 4.0, 10.0]

def loss_l2(w, xs, ys, lam):
    mse = sum((w * x - y) ** 2 for x, y in zip(xs, ys)) / len(xs)
    return mse + lam * (w * w)

def fit(xs, ys, lam, lr=0.05, steps=80):
    w = 0.0
    for _ in range(steps):
        mse_g = sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)
        g = mse_g + 2 * lam * w
        w = w - lr * g
    return w, loss_l2(w, xs, ys, 0.0)

w0, mse0 = fit(xs_noisy, ys_noisy, lam=0.0)
w1, mse1 = fit(xs_noisy, ys_noisy, lam=1.0)
print("no L2   w", round(w0, 3), "train MSE", round(mse0, 3))
print("with L2 w", round(w1, 3), "train MSE", round(mse1, 3))
print("true pattern is w=2; L2 stayed closer")
\`\`\`

**What printed:** without L2, \`w\` is dragged **up** by the odd point (10 at x=1.5), so train MSE can look “better” on that noisy pile while \`w\` leaves 2. With L2, \`w\` stays nearer 2. Train MSE may be **worse**. That is the point: we gave up a bit of train fit to keep a simpler function. The true pattern on the first two points was \`w = 2\`. Regularization is a bet that tomorrow looks like the simple pattern, not like the accident.

The gradient of L2 is \`2 * lam * w\`: a spring pulling every weight toward 0. MSE still pulls toward the labels. The sum is the compromise.

## Capacity is a regularizer too

More tools, more prompt clauses, more retrieved chunks — all of that is **capacity**. Capacity without new independent data is how an agent becomes a tribute to last week’s incidents. Cutting tools is regularization. Cutting few-shots is regularization. A smaller model is regularization.

**Data augmentation** (paraphrases, extra synthetic tickets) can help if they are independent enough. Paraphrasing the same twelve traces twelve ways is not independent. It is memorization with synonyms.

**Ensemble** and **bagging** are regularizers in textbooks. For agents, the practical ensemble is: a keyword rule plus a small router plus abstain to the LLM. Each piece is boring. Together they cover more without one huge prompt.

## Boring on purpose, in prompts and tools

Think of regularization as **taxing complexity**. Weight decay taxes large numbers in \`w\`. Early stopping taxes extra epochs. A tool allow-list taxes extra actions. A short system prompt taxes extra clauses. A small top-k taxes extra context. Each tax buys stability on next week’s tickets at the price of a little train fit.

The tax has to match the failure you actually see. If the agent memorizes rare words, L1 or a smaller bag helps. If the agent memorizes incidents as prompt paragraphs, **deleting paragraphs** helps — not a bigger net. If the agent overfits retrieval to the train corpus, freeze the index recipe and stop stuffing extra few-shots that duplicate the same three docs.

**Data** is also a regularizer when the new rows are independent. Ten paraphrases of one ticket are not ten tickets. Fifty tickets from one user are not fifty users. Grouped splits keep you honest about that. Regularization cannot rescue a sample that is secretly one conversation copied.

Dropout’s cousin in agents is: do not let the policy depend on one fragile signal. If the router only fires because the user said “select,” it will fail when they say “how many people signed up.” Multiple weak features plus a small weight penalty beat one magic word with a huge weight. That is L2 in English.

When validation is tiny, every regularizer looks like a coin flip. Get enough validation to see whether the tax helped. Lambda search on 12 traces is a ritual, not a result.

## Common mistakes

- Raising lambda until train is bad and calling it safety.
- Early-stopping on test.
- Adding dropout in training and leaving it on in production.
- Regularizing weights while the prompt still grows without bound.
- Treating “one more few-shot” as free.

## How agents use this

If every production incident adds a paragraph to the system prompt, you are anti-regularizing. Prefer a new eval case and a test. Prefer a smaller tool list. Prefer early stopping on a frozen trace set over “one more epoch / one more few-shot.”

Boring policies survive vendor model swaps better. A wild prompt that peaked on last Thursday’s mix is a high-variance function. Variance is the other name for overfitting. Regularization is how you buy a little bias to cut that variance.

> **Tip:** Lambda is a hyperparameter. Sweep it on validation. Zero is a valid answer if the model is already simple.

\`\`\`quiz
What is L2 regularization doing?
- Deleting the validation set
- *Adding a cost for large weights so the model prefers a simpler function
- Making softmax faster
- Labeling unlabeled data
explain: L2 adds lambda * sum of squares of weights to the loss. Large, wild weights become expensive.
\`\`\`
`,
  },
  {
    slug: "metrics",
    title: "Metrics That Matter",
    summary:
      "Accuracy lies when classes are rare. Count TP, FP, FN, TN. Then precision, recall, and F1.",
    minutes: 21,
    level: "beginner",
    md: `
After you fit, you **evaluate**. The wrong metric ships the wrong agent.

**Accuracy** is “how often did we match the label?” It is fine when classes are balanced and errors are equal. It is a trap when 99% of events are “not fraud,” “not jailbreak,” or “not the billing tool.” A model that always says “no” is 99% accurate and 0% useful.

You already saw majority-class baselines. This page names the four counts behind that trap, then the ratios product people argue about. Write the counts. Ratios without counts hide small samples: precision 1.0 on two alarms is not a safety story.

## The four counts

Pick a **positive** class you care about catching (fraud, urgent, “needs human”). The other class is negative. If you have eight tools, you either pick one vs rest, or you look at a **confusion matrix** with eight rows and eight columns. Start with one vs rest for the dangerous class.

|  | Label positive | Label negative |
|---|---|---|
| **Predicted positive** | True positive (TP) | False positive (FP) |
| **Predicted negative** | False negative (FN) | True negative (TN) |

- **Precision** = TP / (TP + FP) — of the alarms, how many were real?
- **Recall** = TP / (TP + FN) — of the real cases, how many did we catch?
- **F1** = harmonic mean of precision and recall — a compromise, not a religion
- **Accuracy** = (TP + TN) / all — can be high from TN alone

High recall, low precision: the agent escalates everything; humans drown. High precision, low recall: the agent almost never escalates; fires burn.

Division by zero: if you raised zero alarms, precision is undefined (we print 0.0 with a comment that there were no alarms). If there were no real positives, recall is undefined. Do not paper over empty slices with a pretty F1.

**Macro-F1** averages per-class F1. Use it when rare tools matter. **Micro-F1** is closer to overall accuracy. If you only report micro, the common tool hides the rare one. If you only report macro, one empty class can dominate. Report the matrix.

\`\`\`viz heat
title Confusion: predicted no vs yes
labels pred-no pred-yes
row 6 1
row 1 2
caption Top row is true-no. Bottom is true-yes. The off-diagonal 1s are a false alarm and a miss.
\`\`\`

\`\`\`viz bars
title Accuracy can hide a miss
bar accuracy,0.80,0
bar precision,0.67,1
bar recall,0.67,2
bar always-no,0.70,3
caption Always-no looks fine on accuracy and catches nobody. Read the rare class, not only the average.
\`\`\`

\`\`\`tryit python
# 1 = needs human, 0 = agent can finish
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

**What printed:** TP 2, FP 1, TN 6, FN 1 on ten tickets (three real positives; we caught two, missed one, raised one false alarm). Accuracy is 0.8. Precision is 2/3, recall is 2/3, F1 matches that. **Always-no** accuracy is 0.7 (the seven true negatives) and recall is 0.0 — it never caught a “needs human.” Always-no looks strong on accuracy and is a safety disaster if the positive class is “this action is irreversible.”

Read the four counts before the ratios. FN=1 is a missed human. FP=1 is an extra interruption. Product and safety will not value those equally.

## Slices beat averages

Averages hide slices. Report metrics **by tool**, by user tier, by language, by time of day. The agent that is great on English docs and random on logs will look “fine” in a single number.

A confusion matrix that is “mostly the diagonal” can still hide that \`sql\` is always confused with \`search\`. That off-diagonal cell is the next feature you add, or the next rubric you clarify.

For ranking (later), accuracy on “is this chunk relevant?” is the wrong family. You need precision at k. Do not average the two jobs into one F1 and hope.

## Costs are the missing column

Precision and recall are not morals. They are ratios. Attach **dollars or minutes**: FP costs a human 5 minutes; FN costs an incident. F1 assumes those hurts are similar. Often they are not. Write the costs. Pick a cutoff on validation (next page). Do not let F1 pick for you in silence.

## A three-tool matrix, and what to publish

Suppose tools are search, sql, finish. Accuracy can be 80% while every sql ticket is routed to search. The matrix would show a fat off-diagonal. That cell is the next feature, or a rubric bug (“revenue” tickets that also need a doc). Publish the matrix, not only a single F1.

For a dangerous class (\`ask_human\`, \`shell\`, jailbreak), publish **that** class’s precision, recall, support (how many real positives were in the slice), and the four counts. Support 3 means the recall is a coin flip no matter how many decimals you print. Get more positives before you argue.

**False discovery** is another name for 1 − precision: of the alarms, how many were junk. Safety teams often want that number next to recall. **Miss rate** is 1 − recall. Write the name the on-call uses.

Do not average English-language tickets with logs if those are different products. A slice table: language, tool, user tier, “has retrieval hit.” The agent that is “fine overall” and terrible on logs is how incidents start.

Metrics are not losses. You can select a checkpoint on recall@human while you train on cross-entropy. You cannot take a slope through a confusion matrix easily. That is fine. Training and reporting are different jobs. This page is reporting. Be boring and complete: counts, then ratios, then slices, then costs.

## Common mistakes

- Shipping on accuracy with 99% negatives.
- Precision on a slice of size 3, reported to three decimals.
- One F1 for eight tools with no matrix.
- Using F1 as the training loss.
- Comparing models with different positive-class definitions.

## How agents use this

Put the confusion matrix on the routing classifier that decides \`ask_human\`. Product will ask for fewer interruptions (precision). Safety will ask to never miss a dangerous action (recall). That disagreement is the job. Write the costs down; do not average them into an F1 and hope.

The same four counts apply to “forbidden tool called” vs not, “citation present” vs not, “schema valid” vs not. Name the positive class. Count. Then argue.

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
    slug: "imbalance-threshold",
    title: "Rare Classes and Thresholds",
    summary:
      "When the important class is rare, move the cutoff on validation. Accuracy will not tell you.",
    minutes: 20,
    level: "intermediate",
    md: `
If 1 in 20 tickets needs a human, a model can get 95% accuracy by never escalating. You already saw that. The fix is not a fancier net. The fix is to **choose a cutoff** for the score, using costs, on **validation**.

The model outputs a chance \`p\` (or a score you can sort). Default is “predict yes if p >= 0.5.” That 0.5 is a hyperparameter. Lower it if missing a yes is expensive. Raise it if extra yeses drown the team.

Imbalance is a **property of the world** (few jailbreaks, few refunds, few SQL questions). Thresholds are a **property of the decision**. You can also weight the rare class in the loss. That changes training. The cutoff changes **inference**. You can use both. The cutoff is cheaper to retune when product changes its mind.

## Precision and recall trade

As you lower the cutoff, you catch more real cases (recall up) and you also raise more false alarms (precision down). There is no free number. There is a **cost**: FP costs a human 5 minutes; FN costs an incident.

A **precision-recall curve** is that trade drawn on validation: each cutoff is a point. You pick a point, freeze it, then score test **once** at that frozen cutoff. Picking the cutoff on test is peeking.

Do not pick on the same 10 tickets you will publish. That is test-set peeking with extra steps.

Class weights in the loss (pay more when the rare class is wrong) are another lever. They change the chances coming out of training. After that, you still have a cutoff. Weights are not a substitute for costs. Costs live at the decision.

\`\`\`viz plot
title Lower cutoff: more catches, more alarms
xlabel cutoff
ylabel rate
fn recall min(1, max(0.2, 1.2-1.15*x)) 0.15 0.95
fn precision min(1, 0.35+0.7*x) 0.15 0.95
caption Pick the cutoff on validation with costs, then freeze it. Do not pick on the published test tickets.
\`\`\`

\`\`\`tryit python
# scores for 10 tickets, three are truly positive
scores = [0.05, 0.10, 0.12, 0.18, 0.25, 0.40, 0.55, 0.70, 0.82, 0.91]
y =      [0,    0,    0,    0,    0,    0,    1,    0,    1,    1]

def at_cutoff(c):
    pred = [1 if s >= c else 0 for s in scores]
    tp = sum(t == 1 and p == 1 for t, p in zip(y, pred))
    fp = sum(t == 0 and p == 1 for t, p in zip(y, pred))
    fn = sum(t == 1 and p == 0 for t, p in zip(y, pred))
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    return prec, rec, pred

for c in (0.5, 0.3, 0.8):
    prec, rec, pred = at_cutoff(c)
    print("cutoff", c, "pred", pred, "precision", round(prec, 2), "recall", round(rec, 2))
\`\`\`

**What printed:** three cutoffs, three decision lists. At \`0.5\`, pred is four yeses on the last four scores: precision 0.75 (one false alarm at 0.70) and recall 1.0 (all three true positives caught). At \`0.3\` an extra yes appears at 0.40: precision falls to 0.6, recall stays 1.0. At \`0.8\` only 0.82 and 0.91 fire: precision 1.0, recall 0.67 because the true positive at 0.55 is missed. Lower bar, more alarms. Higher bar, fewer misses of precision, more misses of recall. Pick using **validation costs**, then freeze. Do not pick on test.

Ten rows are a cartoon. In production you need enough positives on **validation** to see the curve. If you have three positives, your cutoff is a coin flip. Get more labels for the rare class, even if you undersample the common class for the plot.

## Operating points for agents

“Escalate if the router’s top chance is below 0.6” is a threshold (abstain when unsure). “Refuse the shell tool unless p(safe) > 0.95” is a threshold. “Retrieve if cosine >= 0.35” is a threshold, and cosine is not a chance — you still pick the number on labeled validation.

Log both the **score** and the **decision** so you can redraw the line next quarter without retraining. If you only log the yes/no, you cannot retune.

When the mix drifts (next part), the same cutoff can quietly fail. Recalibrate or re-pick on a fresh validation slice. Do not wait for accuracy to move. Accuracy may not.

## Sampling and training tricks (stay light)

You can **oversample** the rare class in train, or **undersample** the common class. That changes the mix the loss sees. It does not magically create information. It can bias the chances (they may no longer match frequencies). Then you need calibration or a cutoff chosen on a validation set that has the **real** mix, not the resampled mix.

That last sentence is the bug: train on a 50/50 remix, pick 0.5, deploy into 1/20 world. The cutoff was chosen for a fake world. Keep a validation slice with natural rates.

## A costed example you can copy

Suppose a false escalation costs 5 minutes of human time (say 5 dollars) and a missed dangerous action costs 500 dollars. On validation you have 1000 tickets, 50 real positives. At cutoff 0.5 you catch 30 (so 20 misses) and raise 20 false alarms: expected extra cost is 20*5 + 20*500. At cutoff 0.2 you catch 45 (5 misses) and raise 80 false alarms: 80*5 + 5*500. Compute both. Pick the lower expected cost. Freeze that cutoff. Then score test **once**.

The numbers in your product will differ. The shape will not: two error types, two prices, a curve of cutoffs, one freeze. If you cannot name the prices, you cannot name the cutoff. “F1 was higher” is not a price.

**Abstain** is a band, not a single line: if p is between 0.4 and 0.6, call the LLM or a human. That band is two hyperparameters. Sweep them on validation with the same cost table. Logging p is mandatory; without it you cannot move the band next quarter.

Rare-class detectors also need **enough positives on validation**. If you have four jailbreaks, every cutoff is folklore. Oversample for training if you must; keep natural rates for choosing the operating point. That split of jobs is this page in one line.

## Common mistakes

- Leaving 0.5 forever because it felt default.
- Picking cutoff on test.
- Picking cutoff on resampled validation.
- No logged scores, so you cannot retune.
- Treating cosine or “model confidence” as already a costed chance.

## How agents use this

Safety gates are thresholds. Human escalation is a threshold. Retrieval is a threshold plus a k. Write each as a named hyperparameter, sweep on frozen validation with explicit FP/FN costs, freeze, then touch test once.

If product says “fewer interruptions” next quarter, you may only move the cutoff. That is cheaper than a new model. It still needs a new look at validation, not a vibe.

> **Warning:** Do not pick the cutoff on the same 10 tickets you will publish. That is test-set peeking with extra steps.

\`\`\`quiz
You lower the yes-cutoff on a rare-class detector. What usually happens?
- Precision and recall both go to 1
- *Recall tends to rise and precision tends to fall (more alarms, more catches)
- The training loss becomes MSE
- The test set gets bigger
explain: A lower bar flags more examples as positive: you catch more true cases and more false alarms.
\`\`\`
`,
  },
  {
    slug: "calibration",
    title: "Calibration",
    summary:
      "A score of 0.9 should be wrong about one time in ten. Uncalibrated agents shout 99% on everything.",
    minutes: 20,
    level: "intermediate",
    md: `
A **score** is just a number you rank with. A **chance** is a number that should match frequencies. **Calibration** asks: when the model says 0.9, is it right about 90% of the time in that bin?

Agents that print “99% confident” on every tool call are **uncalibrated**. The number is a vibe. Do not put it in the UI. Do not skip a human gate because of it.

Ranking can still work when calibration fails. The right ticket can still come first even if every score is too sure. Use scores to **sort**. Use a calibrated chance only when you need a yes/no with a costed cutoff, or a sentence that claims a percent.

## A cheap check

Bin examples by predicted chance. In each bin, count how often the label was actually 1. If the top bin is only half true, you do not have 99% confidence. You have a loud score.

You need enough rows per bin for the true rate to mean anything. Five rows in the top bin is a story. A few hundred is a plot. Reliability diagrams are that plot: predicted chance on one axis, observed frequency on the other. Perfect calibration is the diagonal.

**Overconfidence:** mean score 0.95, true rate 0.50. **Underconfidence:** mean score 0.60, true rate 0.90. Overconfidence is the usual sin of small models and of language models asked to “give a confidence.”

Cosine 0.82 is not “82% true” either. It is an angle. Calibrate with labels; do not invent a percent.

\`\`\`viz plot
title A score of 0.9 should be right about nine times in ten
xlabel predicted chance
ylabel true rate
fn perfect x 0 1
mark 0.27,0.20 low-bin
mark 0.89,0.60 loud
caption Dots on the line are honest. A loud 0.9 that is only 0.6 true is overconfidence.
\`\`\`

\`\`\`tryit python
# predicted chances vs true labels
rows = [
    (0.92, 1), (0.91, 0), (0.88, 1), (0.87, 0), (0.85, 1),
    (0.40, 0), (0.35, 0), (0.30, 1), (0.20, 0), (0.10, 0),
]

def bin_mean(lo, hi):
    picked = [(p, y) for p, y in rows if lo <= p < hi]
    if not picked:
        return 0, 0.0, 0.0
    mean_p = sum(p for p, _ in picked) / len(picked)
    mean_y = sum(y for _, y in picked) / len(picked)
    return len(picked), mean_p, mean_y

for lo, hi in [(0.0, 0.5), (0.5, 1.01)]:
    n, mean_p, mean_y = bin_mean(lo, hi)
    print("bin", lo, "-", hi, "n", n, "mean score", round(mean_p, 2), "true rate", round(mean_y, 2))
\`\`\`

**What printed:** two bins. The low bin (scores under 0.5) has five rows, a mean score around 0.27, and a true rate of 0.2 (one of those five was actually positive). The high bin has five rows, mean score near 0.9, true rate 0.6 (three of five). Those high scores are **too sure**. A ranking that still puts some true tickets first can be useful. A sentence that says “91% sure” is a lie.

This is ten rows. Do not ship a calibration claim from ten rows. Do ship the habit: **table before percent**.

## What to do about it

**Temperature scaling** (one number on the logits, then softmax again) is often enough to flatten loud models. You fit that one number on **validation** chances vs labels. You do not need a new net. You need the plot — or this table — before you trust a number as a chance.

**Platt scaling** and isotonic regression are richer maps from score to chance. They also fit on validation. They can overfit if validation is tiny. A one-parameter temperature is the right first tool.

If you only need ranking, **do not** promise a percent. Show the ordered list. Show the raw score. Let a human or a later cutoff decide.

Sampling temperature on a language model is a different knob (how flat the next-token chances are). Do not confuse it with calibration temperature, even though both multiply logits. One is for generation diversity. One is for matching frequencies. Name them in the log so operators do not twist the wrong one.

## When a percent is a product lie

Language models, asked to “also give a confidence,” will often emit 99. Language is not a calibrated head. A linear router can be loud too after a few epochs of cross-entropy: chances pile near 0 and 1. Loudness is not skill. Skill is ranking the right tickets first **and**, separately, matching frequencies if you need a gate.

A cheap reliability table is enough to kill a bad UI: ten bins, or even two as in the live box. If the top bin is 0.9 vs 0.6 true, you may still use the score to sort tool docs. You may not write “I’m 90% sure this should run shell.” For shell, you want a **high-precision** operating point on a calibrated chance, or you do not use chance at all — you use an allow-list.

**Expected calibration error** is a fancy name for “average, over bins, of |mean score − true rate|, weighted by how many rows sat in the bin.” You do not need the acronym to compute the table. You need labels. Unlabeled “confidence” is decoration.

Recalibrate when the mix drifts. A temperature fitted in January can be wrong in September if the tool mix changed. Calibration is not a one-time baptism. It is a plot you redraw on a fresh slice, then you freeze a new temperature or you stop printing percents.

## Common mistakes

- UI copy that says “I’m 99% sure” from an uncalibrated logit.
- Calibrating on test.
- Calibrating on 20 rows.
- Treating retrieval cosine as a probability.
- Using ranking success as proof of calibration.

## How agents use this

Calibration decides **when to escalate**. An uncalibrated small model that is “sure” it should run \`shell\` is how you skip the human gate. Compare: use scores only to **rank** candidates; use a calibrated chance only when you need a yes/no with a costed cutoff.

Router abstain (“if top p < 0.6, call the LLM”) assumes p means something. If p is loud, you will never abstain. If p is timid, you will always abstain. Measure. Then freeze the cutoff on a slice with natural class rates.

> **Warning:** Cosine 0.82 is not “82% true” either. It is an angle. Calibrate with labels; do not invent a percent.

\`\`\`quiz
A model’s top bin has mean score 0.95 but only 50% true labels. What is that?
- Perfect calibration
- *Overconfidence: the scores are too sure compared with reality
- Proof the loss was MSE
- A good reason to skip the test set
explain: Calibration compares predicted chances with observed frequencies. 0.95 vs 50% is overconfident.
\`\`\`
`,
  },
  {
    slug: "ranking",
    title: "Ranking",
    summary:
      "Retrieval and rerank are not classification. Sort by a score and measure precision at k.",
    minutes: 21,
    level: "intermediate",
    md: `
**Classification** asks: which label? **Ranking** asks: which item should come first, second, third?

RAG is ranking. Tool-doc retrieval is ranking. “Which past ticket is nearest?” is ranking. A classifier that says “relevant / not” on each chunk independently can still dump 40 “relevant” chunks and miss the one the user needed at **position 1**.

The usual scores: cosine, a learned reranker, a cross-encoder. You do not need those names to measure. You need a sorted list and a set of gold items. The usual metrics:

- **Precision at k (P@k)** — of the first k items, how many are relevant?
- **Recall at k** — of all relevant items, how many appeared in the first k?
- **MRR** (mean reciprocal rank) — 1 / position of the first relevant item, averaged over queries

If the right paragraph is 5th and you only stuff top-3 into the prompt, recall at 3 is 0 for that query. The LLM never sees it. That is a ranker bug, not a “dumb model.” Prompting “please cite well” does not move the fifth chunk into the window.

Classification accuracy on “is this chunk relevant?” is not P@k. You can have high accuracy and still rank the useful chunk last among the yeses.

## What a ranking eval looks like

Each row is a **query** plus a gold set of relevant item ids (chunks, tickets, tool docs). You run your scorer, sort descending, compute P@k, recall@k, and the reciprocal rank of the first hit. Average over queries. Also report **by type**: policy vs table vs log, because averages hide a dead corpus slice.

k is a hyperparameter of the **agent**, not only of the metric. The k you measure should be the k you stuff into the prompt (or a bit larger, if a reranker will throw some away). Measuring P@20 while you only send 3 chunks is lying about what the generator saw.

\`\`\`viz bars
title Ranked chunks for one refund query
bar policy,0.77,2
bar faq,0.71,2
bar shipping,0.41,1
bar password,0.22,0
caption Highest first. If you only stuff top-1, the FAQ never enters the prompt.
\`\`\`

\`\`\`tryit python
# one query; gold relevant chunk is "refund-policy"
candidates = [
    ("shipping", 0.41),
    ("refund-policy", 0.77),
    ("password", 0.22),
    ("refund-faq", 0.71),
    ("office-hours", 0.18),
]
relevant = {"refund-policy", "refund-faq"}

ranked = sorted(candidates, key=lambda row: row[1], reverse=True)
print("rank order")
for i, (name, score) in enumerate(ranked, start=1):
    mark = "hit" if name in relevant else "-"
    print(i, name, score, mark)

def precision_at(k):
    top = [name for name, _ in ranked[:k]]
    hits = sum(1 for n in top if n in relevant)
    return hits / k

print("P@1", precision_at(1), "P@3", round(precision_at(3), 3))
first_hit = next(i for i, (n, _) in enumerate(ranked, start=1) if n in relevant)
print("reciprocal rank", round(1 / first_hit, 3))
\`\`\`

**What printed:** rank order by score, highest first. \`refund-policy\` at 0.77 is first (hit). \`refund-faq\` at 0.71 is second (hit). \`shipping\` at 0.41 is third (miss). Then password and office-hours. **P@1** is 1.0 (the first slot is gold). **P@3** is 2/3 because shipping sneaks into the top three. Reciprocal rank is 1.0 because the first relevant item is at position 1. If you had sorted by the wrong score, P@1 would collapse and the agent would cite shipping.

Change k in your head: if the agent only sees top-1, FAQ never enters. If it sees top-3, both gold chunks can enter, plus one distractor. Distractors are how generators cite the wrong policy.

## Rerank vs retrieve

First-stage retrieval might use a fast cosine over many chunks. A **reranker** then scores the top 50 with a slower function and keeps 4. Measure both stages. If gold is not in the 50, the reranker cannot save you. That is recall-at-50 of the first stage. Raise k, fix chunking, or fix the query text (the question was two turns ago; you embedded the last “thanks”).

Query construction is ranking work: embed the user question, not the whole fluffy chat, unless you have evidence the extra turns help. That evidence is P@k on a freeze, not a vibe.

## Gold sets, distractors, and k that matches the prompt

A ranking eval is only as honest as the gold set. If labelers mark every neighbor “relevant,” P@k cannot fall, and you will never see a miss. Mark **must-include** chunks: the paragraph that actually answers the question. Optional extras can be a second set. Metrics should use the must-include set.

**Distractors** are the point. A corpus of only the right docs is a toy. Include shipping policy next to refund policy. Include an outdated refund PDF if that PDF still sits in production. If the outdated chunk ranks first, you have a corpus bug, not a generator bug.

k must match the window. If the agent stuffs 4 chunks, report P@4 and recall@4. Also report recall@20 of the first stage if a reranker later cuts to 4: that tells you whether gold never entered the rerank pile. Two-stage systems need two numbers.

**MRR** cares about the first hit only. That is the right summary when one paragraph is enough. If two chunks must both enter the prompt (a table and a policy), look at recall@k of the set, not only MRR. Pick the metric from the job: “did the needed facts appear in the window?”

Log the ranked names. When the agent cites shipping, you want to see whether shipping was rank 1 (retriever) or rank 5 stuffed anyway (too-large k) or not in the list (generator invention). Ranking metrics without neighbor logs turn into arguments.

## Common mistakes

- Measuring classification accuracy of a relevance head and calling it retrieval quality.
- k in the metric not equal to k in the prompt.
- Gold labels that mark every neighbor relevant.
- One global P@k hiding a dead product area.
- Fixing ranking bugs by lengthening the generator prompt.

## How agents use this

Log **neighbors and scores** for every retrieval. Eval with (query, must-include-chunk) pairs. If top-k is 4 and the gold chunk is 5th, raise k, fix chunking, or train a reranker. Do not add “please cite well” to the prompt and call it a retrieval fix.

Tool routing can be ranking too: score each tool doc, pick top-1, abstain if the gap is tiny. Then you still want a confusion matrix on the final pick. Ranking metrics tell you whether the right tool was **near** the top. Classification metrics tell you whether you **called** it.

> **Note:** Classification accuracy on “is this chunk relevant?” is not P@k. You can have high accuracy and still rank the useful chunk last among the yeses.

\`\`\`quiz
The right chunk is 5th and the agent only sees top-3. What failed?
- Softmax overflow
- *Recall at 3 (the gold item never entered the prompt)
- L2 regularization
- The learning rate
explain: Ranking metrics care about position. If k is smaller than the gold rank, the generator cannot recover the fact.
\`\`\`
`,
  },
];
