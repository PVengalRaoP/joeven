import type { RawLesson } from "@/lib/types";

export const mlAgents: RawLesson[] = [
  {
    slug: "train-vs-infer",
    title: "Train vs Inference",
    summary:
      "Training updates knobs. Inference freezes them and only runs the forward pass. APIs you call are inference.",
    minutes: 19,
    level: "beginner",
    md: `
**Training** is the loop that **changes** parameters: forward, loss, backward, step. **Inference** (also called serving or eval mode) is the forward pass with knobs **frozen**.

When you call a vendor LLM, you are buying inference. Fine-tuning is when someone runs training on **your** data. Prompting is neither: you are changing the **input**, not the weights. It can still overfit an eval. It can still leak a test conversation into a few-shot. It is not “the model learned from this ticket” unless weights moved.

This distinction is how you log a change. If you do not know whether you changed weights, input, index, or code, you cannot debug which one broke Tuesday.

## What is frozen

At inference:

- Dropout is off
- Batch-norm uses stored stats
- You do not compute slopes
- You may still sample (temperature, top-p) — that is randomness on the **output**, not learning
- Weights do not update because a customer was unhappy

At training you shuffle (train only), you compute loss, you step. Mixing a test row into a gradient is leakage with extra ceremony. Mixing a production ticket into a fine-tune without a split is how you un-test your own exam.

\`model.eval()\` in frameworks means inference mode. Forgetting it leaves dropout on and makes traces jitter. The same policy, same input, different dropped units: you will chase a ghost.

Sampling is not training. Temperature 0.8 does not update \`W\`. It reshapes chances and draws. Run the same frozen model twice and you may get two answers. That variance is inference. Logging the seed and temperature is how you make it less mysterious.

\`\`\`viz flow
title Training updates knobs; inference does not
layout lr
node fwd Forward
node loss Loss
node step Step
edge fwd loss
edge loss step
edge step fwd
caption The train loop walks downhill. A hosted API call is only the frozen forward pass.
\`\`\`

\`\`\`tryit python
# Same tiny net as before. "Train" would change W. Inference does not.
W = [[1.0, -0.5]]
b = [-0.2]

def forward(x, W, b):
    return W[0][0] * x[0] + W[0][1] * x[1] + b[0]

x = [1.0, 0.0]
print("infer score", round(forward(x, W, b), 3))

# Training would copy weights and nudge them. Inference leaves W alone.
W_trained = [[W[0][0] - 0.1, W[0][1]]]
print("after one fake step", round(forward(x, W_trained, b), 3))
print("original W unchanged", W[0], "still", round(forward(x, W, b), 3))
\`\`\`

**What printed:** \`infer score 0.8\` from the frozen weights (1.0 * 1 + -0.5 * 0 + -0.2). After a fake training step on a **copy**, the score drops to 0.7 because the first weight became 0.9. The last line shows original \`W\` still \`[1.0, -0.5]\` and the original score still 0.8. Inference leaves the table untouched — like a production model while you experiment in a notebook.

If production wrote back into \`W\` on every ticket, you would have an unsupervised, unbounded, unsplit “online learning” loop. That is a research product with a safety story, not a default. Frozen weights plus logged traces is the default.

## Cost

Training needs labels, machines, and a loop. Inference needs a machine (or an API bill) per call. Agents spend almost all money on inference: every tool-planning token is a forward pass. A small local classifier in front of the LLM is a bet that cheap inference can skip expensive inference.

Fine-tunes have a second cost: you must **re-eval** when the base model vendor moves, and you must watch drift. You bought a new set of weights that will go stale. Inference-only prompting goes stale too, but you can swap a prompt faster than you can rebuild a fine-tune — if you have a frozen eval.

## Four kinds of change

Log whether a change was:

- **Weights** (fine-tune)
- **Prompt** (input)
- **Index** (retrieval corpus or encoder)
- **Code** (tools, parser, cutoff)

Those four fail differently. A fine-tune that looked good offline can still be the wrong move if the prompt and the index were the real bugs — you trained on a symptom. A prompt fix will not repair a stale index. A code fix (schema check) is often the cheapest “model improvement.”

## Caching, batches, and “did it learn from this user?”

Inference can still look like learning because of **caches** and **memory stores**. A retrieval index that appended today’s ticket is not training the LLM. It is changing the **index** (one of the four change types). A conversation buffer that carries the last tool result into the next prompt is not training. It is a longer **input**. Users will still say “the agent learned.” Log the truth: frozen weights, growing context, maybe a growing index.

**Batching** at inference packs several requests into one forward pass for speed. It does not mix their gradients; there are no gradients. It can mix their **timing** and their max-token settings if you are sloppy. Keep batching as a serving trick, not as a training story.

Online learning — update weights on every live ticket — needs a split you no longer have, a reward you trust, and a rollback. Default off. If a vendor offers “the model improves from your traffic,” ask whether weights move, whether you can freeze a version, and whether your test ids are excluded. If those answers are vague, treat it as uncontrolled training.

Eval mode vs train mode is not academic. Dropout on at serving makes the same ticket bounce between tools. Batch-norm using batch stats instead of stored stats makes a singleton request look unlike training. For small routers you ship, a unit test that **the same \`x\` twice yields the same \`p\`** (with temperature 0) catches this. Sampling models will not be bit-identical; then compare chances, not the drawn token.

## Common mistakes

- Calling prompting “training.”
- Leaving dropout on in production.
- Fine-tuning on traces that include the test ids.
- Assuming an API call updates the vendor’s weights on your data.
- One changelog that says “improved the agent” with no which-of-four.

## How agents use this

Treat production as inference of a frozen policy. Collect traces. Fit offline on train. Choose on validation. Deploy new weights or a new prompt as a **versioned** inference artifact. Do not learn on the live path unless you have a separate design for that (and you still need an eval).

When someone asks “did we train on that customer?”, the honest answers are: we ran inference; we stored the trace; we might later fine-tune on a sampled, consented, split dataset. Mixing those sentences is how policy teams lose trust.

> **Note:** \`model.eval()\` in frameworks means inference mode. Forgetting it leaves dropout on and makes traces jitter.

\`\`\`quiz
What are you doing when you call a hosted LLM with a prompt?
- Updating the model’s weights on your traces
- *Inference: a frozen model runs a forward pass on your input
- Unsupervised k-means
- Gradient descent on the vendor’s GPU, billed to you as tokens
explain: APIs expose inference. Fine-tuning is a separate product. Prompting changes the input, not the stored weights.
\`\`\`
`,
  },
  {
    slug: "drift",
    title: "Drift",
    summary:
      "The world moves. A model fit on last quarter’s words fails on this quarter’s words. Watch the slice.",
    minutes: 20,
    level: "intermediate",
    md: `
**Drift** means the data you see now is not the data you trained on. Labels shift (what “urgent” means). Features shift (people say “down” instead of “crash”). The mix of tools shifts (a new billing API). Documents shift (the policy PDF was rewritten).

A frozen test set from January will not catch a February product launch. You need a **fresh slice** of traces, on a schedule, with the same metric.

Two names you will hear:

- **Covariate shift** — the inputs \`x\` change (new phrasing, new users)
- **Label shift / concept drift** — the meaning of \`y\` given \`x\` changes (the policy for refunds changed)

You do not need the names to act. You need a dashboard that is **not** only the old eval. The old eval is still useful as a regression suite. It is not a substitute for this week.

## What drift looks like in an agent

The router still scores 95% on January’s freeze and 60% on this week’s tickets. Retrieval P@k dies after a docs migration even though cosine code did not change. The keyword “crash” stops firing because the status page now says “down.” A new tool exists and the policy never calls it. Humans changed what “done” means (close the ticket vs send a survey).

Nothing in the **training loss** of last quarter warns you. Loss is a function of last quarter’s pile. Only a **new** labeled slice, or a computable metric on fresh traces, warns you.

A/B tests on prompts are drift detectors too. If the user mix changed the same day you shipped a prompt, you do not know which one moved the metric. Segment. Or do not ship on a launch day and call it science.

\`\`\`viz plot
title Same policy, new words
xlabel week
ylabel accuracy
fn freeze 0.95+0*x 0 12
fn live 0.95-0.45/(1+exp(-(x-6)*1.2)) 0 12
caption January’s freeze stays high. Live tickets drop when people say “down” instead of “crash.”
\`\`\`

\`\`\`tryit python
# Train keyword: "crash" means urgent. Production switched to "down".
def policy(text):
    return 1 if "crash" in text.lower().split() else 0

train = [
    ("server crash tonight", 1),
    ("hello", 0),
    ("crash in payments", 1),
    ("thanks", 0),
]
prod = [
    ("site is down", 1),
    ("hello", 0),
    ("down in payments", 1),
    ("thanks", 0),
]

def acc(rows):
    return sum(policy(x) == y for x, y in rows) / len(rows)

print("train acc", acc(train))
print("prod  acc", acc(prod))
print("same policy, new words, silent fail")
\`\`\`

**What printed:** \`train acc 1.0\` — the word “crash” matches the old urgent tickets. \`prod acc 0.5\` — on this four-row cartoon that is the two easy negatives only; the two urgent rows use “down” and the policy misses them (2/4). Then the sentence: same policy, new words, silent fail. Train accuracy is perfect. Production accuracy is the dummy that always predicts 0 on the urgent class. Nothing in the training loss warned you. Only a **new** labeled slice would.

Retrain, add features, or write a rule — **after** you measure. Do not “fix the prompt” in a vacuum if the retrieval corpus is a month stale. That is drift in the index: the geometry is fine, the documents are not.

## A weekly habit

Sample live traces every week. Label a hundred, or compute y where you can (\`goal_satisfied\`, schema, forbidden tools). Score the router, the retriever (P@k), and the product metric. If last month’s number was 0.81 and this week is 0.64, you have drift or a break.

Then freeze a **new eval version** (new ids, new timestamp). Change **one** thing. Re-measure. If you change prompt, index, and model on the same day, you will not know which one answered the drift.

Watch **mix**: fraction of SQL vs search, fraction of new-user tickets, languages. Mix shift can move a metric without any single example looking weird. Stratify.

## Retraining is not automatic virtue

Retraining on the latest month can fit the new words and forget the old incident, or fit a labeling error that crept in. Keep a regression slice of old critical cases. Drift response is: measure, then choose among rule, prompt, index refresh, small-model retrain, cutoff retune. Last on the list is a giant fine-tune.

## Slices that name the move

When the number drops, cut the fresh sample before you retrain:

- **New strings:** “down” vs “crash,” a new product name, a new error code
- **New tools:** an API that did not exist in January
- **New docs:** policy PDF replaced, index not rebuilt
- **New mix:** more VIP tickets, a new language, a seasonal surge
- **New labels:** refunds now take ten days, so old y is wrong
- **New policy in the prompt:** you shipped a clause and the world also moved

Each cut points to a different fix. New strings → features or keywords. New tools → action space and labels. New docs → re-embed, P@k. New mix → maybe only the cutoff or the prior, not the whole net. New labels → dataset version. New prompt plus new mix → you cannot credit the prompt until you segment.

**Index drift** is the quiet one. Cosine code is unchanged. Neighbors are wrong because the corpus is wrong. Score P@k on a freeze of queries against the **current** index, not against a pickle from launch.

Feature drift can be watched without full labels: the rate of the word “down,” the mean cosine to the billing tool doc, the fraction of traces that call sql. Those are not y. They are alarms to sample. Then you label. Unlabeled dashboards do not replace a hundred honest rows; they tell you when to spend the hundred.

## Common mistakes

- Only the January eval on the dashboard.
- Shipping a prompt the same day the product launches and crediting the prompt.
- Refreshing the index without re-running P@k.
- Silent relabeling of old test to match new policy, without a version bump.
- Retraining weekly with no frozen comparison.

## How agents use this

The ML move is the same as the ops move: freeze a new eval version, then change **one** thing. Drift is why “we measured once at launch” is not a quality program.

Put the date on every number. “Router 0.81” is not a fact. “Router 0.81 on freeze 2026-01-15” is a fact. “Router 0.64 on sample 2026-09-14” is a different fact. Drift is the gap. Your job is to explain the gap with slices (new words, new tools, new docs), not with vibes.

> **Warning:** A/B tests on prompts are drift detectors too. If the user mix changed the same day you shipped a prompt, you do not know which one moved the metric.

\`\`\`quiz
A router is 95% on the January test set and 60% on this week’s tickets. What should you do first?
- Delete the test set so the number looks better
- *Label a fresh slice, compare it to January, and look for new words, tools, or policies
- Raise the learning rate
- Switch the loss to MSE
explain: A stale eval hides drift. A new labeled slice tells you whether the world moved.
\`\`\`
`,
  },
  {
    slug: "rl-lite",
    title: "Rewards and Policies",
    summary:
      "A policy maps a state to an action. A reward says how well that went. Agents already live in this loop.",
    minutes: 21,
    level: "intermediate",
    md: `
**Reinforcement learning (RL)** is learning from **rewards**, not from a correct label on every step.

A **state** is what you can see (the ticket, the last tool result). An **action** is what you do (call search, call sql, finish). A **policy** maps state → action, or state → chances over actions. A **reward** is a number after (or during) the episode: +1 if the ticket closed, −1 if you refunded the wrong order, 0 otherwise.

Supervised learning says “the label was sql.” RL says “you called search, then sql, then finish, and the user was happy.” The credit is delayed. That is harder. It is also how real agents get scored: the user does not label each tool call.

You do not need PPO to use the idea. You need a **reward you can compute** and a policy you can compare. Keyword policies, always-search, and “ask a human if p < 0.6” are policies. Average reward is the metric. Gradient methods are ways to raise that average when you cannot write the keywords. They still need a reward that matches the product.

## Episodes, return, and delayed credit

An **episode** is one ticket, one conversation, one run until finish or budget death. The **return** is the sum of rewards (sometimes discounted, which means later rewards count less). A router that is 99% on step 1 and then loops until the budget dies has a terrible return. Per-step accuracy would lie.

Delayed credit is the pain: which action caused the +1? Maybe the second search, maybe the schema retry, maybe luck. Supervised routing on the **first** tool, when you can label it, is easier. Use RL-shaped scoring when the right action depends on later outcomes you cannot label step by step.

A reward that is “user clicked thumbs up” will teach click-bait. A reward that is “schema valid” will teach valid JSON that is still wrong. A reward that is “refunded so the chat stopped” will teach refunds. **No reward, no RL** — and a bad reward is worse than a keyword baseline.

\`\`\`viz loop
title A policy in a loop
step State
step Action
step Reward
caption See the ticket, pick a tool, get a number after the episode. Average reward is the metric.
\`\`\`

\`\`\`tryit python
import random

# Gold tool in each state. Reward +1 only if the first action matches.
states = ["weather", "revenue", "users", "docs"]
gold = {"weather": "search", "revenue": "sql", "users": "sql", "docs": "search"}
actions = ["search", "sql"]

def run(policy, n=200, seed=0):
    rng = random.Random(seed)
    total = 0.0
    for _ in range(n):
        s = rng.choice(states)
        a = policy(s, rng)
        total += 1.0 if a == gold[s] else 0.0
    return total / n

def always_search(s, rng):
    return "search"

def random_policy(s, rng):
    return rng.choice(actions)

def keyword_policy(s, rng):
    if s in {"revenue", "users"}:
        return "sql"
    return "search"

print("always search  reward", run(always_search))
print("random         reward", run(random_policy))
print("keyword policy reward", run(keyword_policy))
\`\`\`

**What printed:** three average rewards over 200 sampled states (seed 0, so repeatable). Always-search is about 0.5 here because half the gold map is search. Random is about 0.5 with more noise. Keyword policy is **1.0** — it matches gold every time. Always-search is a policy. Random is a policy. Keywords are a policy. The **average reward** is the metric. You would not start PPO on this table. You would ship the keywords.

The reward here is dense (every episode, first action, +1 or 0). Real tickets are sparser. The print is the habit: name the policy, sample episodes, average the return, compare to dummies.

## RLHF in one paragraph

RLHF / preference training is: humans (or a judge model) pick the better of two answers; a reward model fits that; a policy is pushed toward high reward. Same loop, bigger machinery. The eval track will treat judges as **metrics**. Here, remember the failure mode: if the judge likes polite wrong answers, the policy will be polite and wrong. The judge is a loss. Write it down.

You will rarely implement REINFORCE in this course. You will often implement **return logging**: per ticket, a number. That is the RL lens without the optimizer.

## Exploration

If the policy never tries a tool, it cannot learn that the tool is good. Dead tools are dead ReLUs in policy space. Eval can force a tool. Production might allow a small chance of a safe exploration, or not — safety may forbid exploring \`shell\`. Exploration is a product choice, not only an algorithm.

## Reward hacking and a three-step ticket

**Reward hacking** is getting a high number without doing the job. If you reward “user stopped messaging,” refunds win. If you reward “short traces,” the agent finishes too early. If you reward “JSON valid,” you get valid nonsense. If you reward a judge model that loves polite tone, you get apologies and wrong totals. The optimizer is innocent. The contract was sloppy.

Write rewards like losses: one sentence, computable, frozen. Example: +1 if \`goal_satisfied\`, −1 if a forbidden tool ran, −0.2 if schema failed, 0 otherwise. Average return on a freeze. Compare always-search. That is already RL as **evaluation**. Climbing that average with PPO is optional and late.

Credit assignment in a three-step ticket: search (useful), sql (wrong schema), sql retry (correct), finish (user happy). Who gets the +1? Supervised learning on first-tool labels would only score the search. Full-episode return scores the path and cannot say which step mattered. If you can label the first tool, do that. If the bug is “loops until budget dies,” the return catches it and per-step accuracy may not.

Do not call “we added a critic prompt” RLHF. A judge is a metric. RLHF is a training loop that uses a fitted reward model to push a policy. You can use a judge every day without that loop. Most teams should.

## Common mistakes

- Per-step accuracy instead of episode return.
- Rewarding chat closure.
- Calling a prompt tweak “RLHF.”
- Training RL on a reward you cannot recompute on a freeze.
- Skipping the keyword policy comparison.

## How agents use this

Every think-act loop is a policy. \`max_steps\`, “stop on goal_satisfied,” and “ask a human if p < 0.6” are parts of that policy. Log the **episode return** (sum of rewards) per ticket, not only per-step accuracy.

If you can label the correct first tool, start with supervised routing. Use RL-shaped metrics when the path matters. Use RL optimizers last, after a dummy, a rule, and a small supervised model lose on honest data — and after the reward matches the product.

> **Tip:** If you can label the correct first tool, start with supervised routing. Use RL when the right action depends on later outcomes you cannot label step by step.

\`\`\`quiz
What does a policy do?
- It stores the test set
- *It maps a state (what you see) to an action, or to chances over actions
- It computes MSE
- It splits data by user
explain: A policy is the agent’s decision rule. Rewards judge trajectories. RL is how you improve the policy when labels per step are missing.
\`\`\`
`,
  },
  {
    slug: "when-to-train",
    title: "Rules, Prompts, or Train",
    summary:
      "Start with a rule. Then a prompt. Train a small model when the remainder is large, stable, and labeled.",
    minutes: 20,
    level: "intermediate",
    md: `
Not every prediction problem wants a neural net. Agents get expensive when teams skip the cheap rungs.

**1. Rule.** Keywords, schemas, allow-lists. Fast, explainable, easy to test. Ship this if it already beats the bar.

**2. Prompt.** Frozen LLM, better instructions, few-shot traces. You are doing inference plus hyperparameter search. Good when the task is language-heavy and volume is low.

**3. Retrieve.** k-NN / RAG when the answer lives in docs that change. You train an **index**, not a net.

**4. Small model.** Linear router, tiny classifier, reranker. Train when you have labels, a stable task, and a latency/cost budget the LLM misses.

**5. Fine-tune the big model.** Last. Needs more data, more eval, more drift pain. Do it when 1–4 cannot close the gap.

The ladder is not a vibe. It is measured on a frozen slice: dummy, rule, last week’s prompt, retrieve, small model, then maybe a fine-tune. Promote a problem **up** only when the lower rung’s metric, cost, and latency lose. Demote when a new API makes a rule possible again (password reset should not be an agent forever).

Fine-tuning will not fix a broken tool, a stale index, or a fuzzy goal. Train last among those bugs.

## Measure the remainder

In production, measure the **remainder**: tickets the rule gets wrong. If that remainder is 2% and random, you need better labels, not gradient descent. If it is 30% and patterned, then train — or write a better rule for that pattern.

Few-shot examples in a prompt **are** training data. They leak if they also sit in the test conversations. Version them. They also have a capacity cost: more tokens, more chances to memorize last week.

\`\`\`viz flow
title Climb only when the cheaper rung loses
layout tb
node rule Rule
node prompt Prompt
node retrieve Retrieve
node small Small model
node ft Fine-tune
edge rule prompt
edge prompt retrieve
edge retrieve small
edge small ft
caption Start at the top. Promote only when the remainder is large, stable, and labeled.
\`\`\`

\`\`\`tryit python
rows = [
    ("reset password", "workflow"),
    ("forgot password", "workflow"),
    ("where is my invoice", "search"),
    ("show invoice 17", "search"),
    ("revenue by week", "sql"),
    ("count users", "sql"),
]

def rule(text):
    t = text.lower()
    if "password" in t:
        return "workflow"
    if "revenue" in t or "count" in t:
        return "sql"
    return "search"

def always_search(text):
    return "search"

def acc(fn):
    return sum(fn(x) == y for x, y in rows) / len(rows)

print("always search", acc(always_search))
print("keyword rule ", acc(rule))
print("a 6-row neural net cannot honestly beat a rule that is already 1.0")
\`\`\`

**What printed:** always-search accuracy 2/6 (only the invoice rows). Keyword rule **1.0** on these six. Then the reminder: a 6-row neural net cannot honestly beat a rule that is already perfect here. Training a net on this table is theater. The remainder is empty. There is nothing to fit.

In a real freeze the rule would be written from train and scored on test, and 1.0 would be suspicious. The lesson stands: **beat the next cheaper rung**, do not skip rungs.

## Stability and labels

“Stable” means the task will still exist next month with the same action space. If the tool list changes weekly, a trained router needs weekly labels. A rule that reads the tool registry may keep up cheaper.

“Labeled” means honest \`y\`, a rubric, agreement, a split. Weak labels from the current agent are how you clone its mistakes. Sample for humans before you climb to rung 4.

Cost belongs on the ladder. An LLM prompt that is 2 points better than a linear router and 50 times more expensive is a product choice. Training a small model is often the move that **saves** inference money, not a science project.

## Worked remainder, and when to demote

Imagine 10,000 tickets. Always-search is 62%. Keywords hit 91%. The 9% remainder is not random: a cluster of “how many / revenue / count” that the rule missed because users said “headcount,” and a cluster of password-adjacent phrases without the word password. You now have two patterned remainders. For headcount, add a word to the rule or a bag-of-words feature. For password-adjacent, a tiny supervised router on a few hundred labels may beat another year of prompt clauses. You do **not** fine-tune the big model on 10,000 traces to avoid adding “headcount.”

Retrieve when the **answer** moves with documents: policy PDFs, ticket history, SKU tables. Prompt when the **procedure** is language-heavy and rare. Rule when the **action** is obvious from a string or a schema. Small model when the remainder is large, stable, and you can label it. Fine-tune when 1–4 lose on the freeze **and** you can afford drift and eval cost.

Demote aggressively. If finance ships a \`reset_password\` API, the agent should call a workflow, not a 12-step search. That is a product win that looks like a modeling loss on last quarter’s taxonomy. Bump the dataset version. The ladder is allowed to go down.

Volume matters. A task with 20 tickets a week will never grow an honest train set. Prompt plus a rule. A task with 20,000 a week and a 15% remainder is where a linear router pays rent.

## Common mistakes

- Fine-tuning to avoid writing an allow-list.
- A prompt with 40 few-shots that are the test set.
- Training on six rows because a blog used a neural net.
- Never demoting: password reset still goes through a 12-step agent.
- Climbing the ladder without a remainder dashboard.

## How agents use this

Write the ladder in the design doc: rule → prompt → retrieve → small router → fine-tune. Each rung has an owner, a metric, and a freeze. The scientific method from lesson one is this ladder plus a split.

When someone says “we should train,” the questions are: what is the dummy, what is the rule, what is the remainder, how many honest labels, is the task stable, what does it cost if we only prompt? If those have no answers, you are not ready to train. You are ready to measure.

> **Warning:** Fine-tuning will not fix a broken tool, a stale index, or a fuzzy goal. Train last among those bugs.

\`\`\`quiz
When should you train a small router instead of writing a rule?
- Always; rules are obsolete
- *When a simple rule cannot cover a large, stable, labeled remainder and a small model beats that rule on a frozen eval
- When you want to skip validation
- When the LLM API is free
explain: Training has cost and drift. It earns its keep only after a dummy and a rule lose on honest data.
\`\`\`
`,
  },
  {
    slug: "agent-dataset",
    title: "Traces as a Dataset",
    summary:
      "Production logs are the dataset. Freeze ids, write a rubric, label a sample, version the split.",
    minutes: 22,
    level: "intermediate",
    md: `
For agents, a **row** is usually a whole conversation (a **trace**): messages, tool calls, errors, tokens, the final answer. ML only starts when you can turn that into \`x\`, \`y\`, and a split.

This page is the scientific method from lesson 1, applied to production. If you skip the freeze, every dashboard is a story. If you skip the baseline, every model is a hero. If you skip the rubric, every accuracy is a coincidence.

The next track (transformers) is how the big function is built. This track was how you **fit, split, and judge** any function — including that one. Stay here until the dataset is honest. Architecture will not save a mushy \`y\`.

## Freeze ids

Give every trace an id. Store three lists: train, validation, test. If you shuffle again next week, you cannot compare two prompts. If a labeler fixes a test row, bump the **dataset version** instead of silently improving last quarter’s number.

Prefer grouped splits: by conversation id, by user, or by time. Deduplicate on conversation id. Store the id lists in git or an object store next to the rubric. The model code is not the dataset. The ids are.

\`\`\`viz flow
title Traces become a dataset
layout lr
node log Log
node freeze Freeze ids
node label Label y
node score Score
edge log freeze
edge freeze label
edge label score
caption Freeze the exam paper. Then label. Then score a dummy. Then change one thing.
\`\`\`

\`\`\`tryit python
import random

ids = ["t%02d" % i for i in range(10)]

def split_ids(seed):
    rng = random.Random(seed)
    order = list(ids)
    rng.shuffle(order)
    return order[:7], order[7:]

a_train, a_test = split_ids(1)
b_train, b_test = split_ids(2)
print("seed1 test", a_test)
print("seed2 test", b_test)
print("same traces, different exams, incomparable scores")

# The honest move: freeze one
frozen_test = a_test
print("frozen test ids", frozen_test)
\`\`\`

**What printed:** two different test lists from two seeds — for example seed1 might show \`['t03', ...]\` and seed2 a different trio. Same ten traces, different exams, incomparable scores. A prompt that “won” on seed 2 may have merely drawn easier tickets. Then \`frozen test ids\` reprints seed1’s test list: that is the exam paper you publish against. Keep it.

The \`"t%02d" % i\` line is old-style formatting, not an f-string. It names traces \`t00\` through \`t09\`. Names beat anonymous rows when you debug a single miss.

## Write a rubric

Before anyone labels, write one page: when is \`sql\` correct even if \`search\` would also work? Ambiguous traces go to \`abstain\`. Two labelers on a sample: if they disagree a lot, stop modeling and fix the action space.

Sample for humans. Do not treat the agent’s own output as gold except as a **weak** hint. Script what you can (\`goal_satisfied\`, schema, forbidden tools). Humans get the leftover judgment.

A hundred clean, versioned traces beat ten thousand unlabeled dumps. Coverage of tools and failure modes matters more than row count. Stratify the sample: include rare dangerous actions on purpose.

## What to put in x

Only what the agent had **at decision time**: user text so far, tools already called, last error, retrieved chunk ids. Not the final assistant message. Not the close reason. Those are leakage.

If you train a first-tool router, \`x\` is the opening state. If you train a reranker, \`x\` is (query, chunk) at retrieval time. Different times, different rows. Do not smash the whole trace into one \`x\` unless the decision really saw the whole trace.

## The loop you actually run

1. Log traces
2. Freeze a split
3. Label (or compute) \`y\`
4. Score a baseline
5. Change one thing (rule, prompt, index, small model)
6. Measure on validation
7. Touch test once
8. Watch drift next week

That is every lesson in this track in eight lines. Features, loss, ranking, calibration, thresholds — they plug into steps 3–6. Train vs inference is step 5’s type. Rewards are a form of \`y\` for a whole episode.

## What a row contains, and how you version it

A practical row is a dict you could print:

- \`id\` — immutable
- \`split\` — train / val / test, from the freeze file, not recomputed
- \`x\` — decision-time fields only (text so far, tools so far, last error, chunk ids)
- \`y\` — rubric output (tool, pass/fail, reward, abstain)
- \`meta\` — product, language, timestamp, prompt version then in force (for drift slices, not as a feature unless it was known at decision time)

PII does not belong in the feature list you ship to a notebook. Redact. Access-control the freeze. A dataset of traces is customer data with a schema.

**Coverage** is a table: each tool, each forbidden action, each language you claim to support, a minimum count in val and test. If \`shell\` never appears, you cannot report recall on \`shell\`. Oversample the dangerous class into the labeled sample on purpose.

Versioning policy: changing a test label, adding ids, or changing the rubric bumps the version. Retraining on the same freeze does not. Publishing a number requires the version string. “Accuracy 0.81” is incomplete. “Accuracy 0.81 on traces-2026-03-01 test ids” can be compared to next week’s experiment.

A hundred rows with coverage beat ten thousand dumps of the happy path. The dump is for clustering and for finding what to label next. The freeze is for judging.

Store who labeled, when, and which rubric version. If two people disagree, keep the disagreement; do not silently pick the model’s answer as a tie-break. That tie-break is how the agent becomes the supervisor of its own exam. Sample disagreements into the next labeling round until the ceiling is a number you can live with.

## Common mistakes

- Reshuffling test to make a prompt win.
- Relabeling test in place.
- \`x\` that includes the future.
- Ten thousand dumps, no rubric.
- No baseline on the same freeze.

## How agents use this

Own the dataset like a product: version, rubric, ids, coverage. The model is replaceable. The freeze is the company memory of what “good” meant.

When a vendor ships a new checkpoint, you rerun this freeze. When policy changes, you bump a version and say so. When someone wants to train, you point at the remainder on this freeze. That is judging an agent with ML instead of with a demo.

> **Tip:** A hundred clean, versioned traces beat ten thousand unlabeled dumps. Coverage of tools and failure modes matters more than row count.

\`\`\`quiz
Why freeze the list of test trace ids?
- So training can use the test set
- *So two experiments are scored on the same exam and you can actually compare them
- So leakage is required
- So k-means can pick k
explain: Reshuffling the test set each time makes scores incomparable. Frozen ids are the exam paper.
\`\`\`
`,
  },
];
