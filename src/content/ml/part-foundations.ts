import type { RawLesson } from "@/lib/types";

export const mlFoundations: RawLesson[] = [
  {
    slug: "what-is-ml",
    title: "What Is Machine Learning?",
    summary:
      "ML fits a function from examples, then checks it on data it has not seen. That habit is how you ship agents.",
    minutes: 20,
    level: "beginner",
    md: `
**Machine learning** is a way to get a computer to do a job by showing it **examples**, not by writing every rule yourself. You collect inputs that already have answers. You **fit** a function that maps those inputs to those answers. You **measure** how often the function is wrong on examples it has never seen. That last sentence is the whole subject. Neural nets, “AI,” and vendor APIs are families of functions and measuring sticks. They do not replace the loop.

A normal program says: if the subject contains the word invoice, send it to billing. That works until the next thousand tickets use different words, different languages, or a screenshot instead of a subject line. The ML program is: collect tickets with labels, search for knobs that match those labels, then refuse to believe the result until a **held-out** pile agrees.

You already know the cheap version of this loop. A new hire writes ten keyword rules. You score them on last week’s tickets. You keep the rules that beat “always search.” Machine learning is that habit with more knobs and a more honest exam.

## Fit, then measure, on new data

Three verbs, in order:

1. **Fit** — change the function so it matches the labeled examples you are allowed to look at (the training set).
2. **Measure** — compute a number that says how often it is wrong, or how expensive the mistakes are.
3. **On new data** — the number that counts is the one from examples the fitting did not see.

Skip any verb and you are doing something else. Fitting without measuring is a demo. Measuring on the same rows you fitted is a memorization contest. Measuring on new data without a clear goal is a well-scored answer to the wrong question.

**Generalization** is the name for “still works tomorrow.” A lookup table of yesterday’s tickets does not generalize. A function that captured a pattern (the word “down” plus a VIP flag predicts urgent) might. You cannot see generalization by staring at training accuracy. You need a split. The next lessons will make that split a ritual.

## Three families

| Family | What you have | What you want |
|---|---|---|
| **Supervised** | Inputs **and** labels | Predict the label |
| **Unsupervised** | Inputs only | Groups, compression, oddballs |
| **Reinforcement** | Actions and rewards | A policy that scores high over time |

Joeven agents mostly **use** supervised models: classifiers that pick a tool, rankers that order chunks, embedders that turn text into a list of numbers. Even when the brain is a hosted language model, you still need labeled traces and a score. That is the same habit. The model family is not the scientific method. The method is: examples, a function, a number on unseen work.

Unsupervised work still shows up. You cluster failed traces to name failure modes. You compress a conversation into a short list of numbers for search. You flag oddballs. Those are not classifiers until you later **promote** a cluster into a label and train.

Reinforcement shows up whenever you cannot label every step. The user did not mark each tool call. They closed the ticket, or they did not. A **reward** after the episode is a delayed label on a whole path. You do not need a research stack to use the idea. You need a number you can compute and a policy you can compare to a dummy.

## A model is a function with knobs

A **model** is a function from input to output. The shape of the function is your choice (a linear score, a small net, a nearest-neighbor vote). The **parameters** are the knobs inside that shape. Learning is the search for knobs that match the labels.

Suppose you want to guess if a ticket is urgent from one number: how many times the word “down” appears.

\`score = w * downs + b\`

Then you pick a cutoff. If the score is at least 0.5, predict urgent. \`w\` and \`b\` are parameters. You can set them by hand. You can search them with a loop. Both are machine learning. Gradient descent later replaces you as the searcher. The loop does not change: propose knobs, score them, keep the better ones.

You do not start by believing the function. You start by **scoring** it. Accuracy on five toy tickets is not a product metric, but it is enough to feel the idea: some knobs match the labels, some do not, and you can print the difference.

A **hyperparameter** is a knob **you** choose and do not fit inside that loop: the cutoff, the learning rate, which words count as features. Parameters are fitted. Hyperparameters are chosen on a validation pile. Mixing those two jobs is how people accidentally train on the exam.

\`\`\`viz scatter
title Five tickets: “down” count vs urgent
xlabel downs
ylabel urgent
xmin -0.5
xmax 4.5
ymin -0.2
ymax 1.3
dot 0,0 not-urgent 0
dot 1,0 not-urgent 0
dot 2,1 urgent 1
dot 3,1 urgent 1
dot 4,1 urgent 1
caption More “down” counts sit with urgent. A line can split these five rows. That is a tiny model.
\`\`\`

\`\`\`viz flow
title Fit, then measure on new data
layout lr
node fit Fit
node measure Measure
node newdata New data
edge fit measure
edge measure newdata
caption Training looks at the first pile. The number that counts is from a pile it did not see.
\`\`\`

\`\`\`tryit python
tickets = [
    {"downs": 0, "urgent": 0},
    {"downs": 1, "urgent": 0},
    {"downs": 2, "urgent": 1},
    {"downs": 3, "urgent": 1},
    {"downs": 4, "urgent": 1},
]

def predict(downs, w, b, cutoff=0.5):
    score = w * downs + b
    return (1 if score >= cutoff else 0, score)

def accuracy(w, b):
    ok = 0
    for row in tickets:
        yhat, _ = predict(row["downs"], w, b)
        if yhat == row["urgent"]:
            ok += 1
    return ok / len(tickets)

for w, b in [(0.0, 0.0), (0.4, -0.5), (1.0, -1.5)]:
    print("w", w, "b", b, "acc", accuracy(w, b))
\`\`\`

**What printed:** three lines. \`w 0.0 b 0.0 acc 0.4\` — a flat score of zero never clears 0.5, so every ticket is “not urgent.” Two of five labels are 0, so accuracy is 2/5. \`w 0.4 b -0.5 acc 0.8\` — the score grows with “down” counts, but two downs still sit under the 0.5 cutoff, so one urgent row is missed. \`w 1.0 b -1.5 acc 1.0\` — zero and one “down” stay below the cutoff; two and above go urgent. Hand-tuning is still machine learning: a slow optimizer (you). A pair that looks “almost right” can still miss a row. You only know after you print. That is why you will later measure on **new** tickets, not only on the five you fitted.

Change \`w\` and \`b\` and run again. Watch accuracy jump. Then notice the trap: 1.0 on five rows is not a ship decision. It is a story about five rows.

## What ML is not

It is not magic. Bad labels make bad policies. If “urgent” means three different things to three labelers, the function will average the confusion.

It is not “the model understands.” It is curve fitting with a test set. A router that picks \`sql\` for “revenue” does not know finance. It saw that pattern enough times, or a nearby embedding, or a keyword cousin.

It is not a substitute for a goal. A 99% accurate classifier that answers the wrong question is a well-measured failure. “Is this English?” is not “did we close the ticket without a forbidden refund?”

It is not the same as **prompting**. Prompting changes the **input** to a frozen function. Fine-tuning changes **weights**. Both can overfit an eval. Both still need the fit-measure-on-new-data loop.

It is not “bigger model always wins.” A keyword rule that is already 96% on a frozen slice is the thing to beat. Compute, latency, and drift are part of the comparison.

Ask first: **what would a dumb rule score?** If “always call search” is already 80%, your classifier has a high bar. Machine learning is the move when the rule book is too large to write **and** you can measure the rest.

## Common mistakes

- Fitting on all the logs you have, then reporting that number as “accuracy.”
- Changing the prompt until the demo passes, then calling the demo a test set.
- Treating a hosted model as if it learned from your tickets. It did inference on your tickets. Learning is a different product.
- Optimizing a metric that is not the product (fluency, thumbs-up, “the JSON parsed”) while the agent still calls the wrong tool.
- Skipping the dummy. Without a baseline, every model is a hero.

## How agents use this

Tool routing (“search or SQL?”), memory (“which chunk?”), and “did we finish the ticket?” are all prediction problems. When you log traces and score them, you are doing ML even if the brain is an API.

Write the **metric** before you pick the model. “Lower the loss” is not a product. “On held-out traces, the router matches the senior-engineer tool, and the agent does not call refund on FAQ tickets” is a product. The rest of this track is the machinery under that sentence: features, splits, loss, ranking, and the loop you use to judge an agent.

A production agent is a function from a conversation state to an action. You will not write every rule for that function. You will collect examples, fit something (a rule, a prompt, a small classifier, rarely a fine-tune), and measure it on a freeze of traces it did not train on. That is machine learning. The later pages name the parts. This page is the habit.

> **Tip:** Write the **metric** before you pick the model. “Lower the loss” is not a product.

\`\`\`quiz
What is the core activity of machine learning?
- Writing a longer chain of if-statements
- *Fitting a function from examples and measuring it on unseen data
- Buying a GPU
- Replacing tests with vibes
explain: ML is empirical. Parameters are fit on examples, then judged on data the fitting did not see.
\`\`\`
`,
  },
  {
    slug: "features",
    title: "Features",
    summary:
      "A feature is a number the model is allowed to see. Garbage features make garbage agents.",
    minutes: 20,
    level: "beginner",
    md: `
A **feature** is one number (or a short list of numbers) you extract from a raw example. The model never sees the ticket. It sees the features you chose.

That sentence is easy to skip and expensive to skip. If you pick the wrong features, no amount of training will save you. If you pick a feature that **is** the answer, the model will look perfect and fail in production. That second bug is **leakage**. We will meet it again on the splits page. Here, the job is to see features as a **contract**: “at decision time, the model is allowed to know exactly these numbers.”

Raw input is messy: a chat, a PDF, a stack trace, a user tier. A model wants a **list of floats**. Feature engineering is the work of turning messy into that list without cheating.

## From text to numbers

A tiny, honest start is a **bag of words**: a 0 or 1 for each word you care about.

\`[has_down, has_refund, has_please]\`

The sentence “the site is down” becomes \`[1, 0, 0]\`. “please refund” becomes \`[0, 1, 1]\`. The model only sees that list. Order disappeared. “down the site is” would look the same. That is a limitation, not a mystery. Bags of words are still useful for routers: a handful of domain words often beat a vague embedding of chat fluff.

Counts (how many times), lengths (how many tokens), and flags (is the user VIP?) are also features. **One-hot** features are a list of 0/1 flags for a category: plan is free, pro, or enterprise becomes three slots, one of them 1. Do not feed a tool id as a single integer 0, 1, 2, 3 if those numbers are not ordered. The model will treat 3 as “more” than 0.

**Embeddings** (later) are features too — a long list from another model. You did not hand-write those slots. You still chose the encoder, the text you fed it, and whether you mixed that list with flags. Choice of input is still feature work.

Missing values need a policy. “No last error” is not the number 0 unless 0 already means something. A common pattern is a flag \`has_last_error\` plus a code. Silent zeros invent fake structure.

\`\`\`viz strip
title Bag of words: three flags
chip down
chip refund
chip please
caption The ticket becomes 0s and 1s on this list. Order is gone. The model never sees the English.
\`\`\`

\`\`\`viz bars
title “the site is down”
bar down,1,1
bar refund,0,0
bar please,0,0
caption Only the down flag fires. A greeting would be three zeros — the model would see nothing domain-like.
\`\`\`

\`\`\`tryit python
WORDS = ["down", "refund", "please"]

def features(text):
    t = text.lower()
    return [1 if w in t.split() else 0 for w in WORDS]

rows = [
    "the site is down",
    "please refund my order",
    "hello there",
    "down please refund",
]

print("words", WORDS)
for text in rows:
    print(features(text), text)
\`\`\`

**What printed:** the word list, then four feature lists. \`[1, 0, 0]\` for the outage sentence — only “down” fired. \`[0, 1, 1]\` for the refund ask. \`[0, 0, 0]\` for the greeting: the model sees **nothing** domain-like. \`[1, 1, 1]\` for the last line, which has all three flags on. That last list is a richer input than the greeting. Same idea as a real featurizer, only smaller.

Split on whitespace is crude. “down.” with a period would miss the flag. Real tokenizers and a small word list you maintain beat cleverness. The lesson is the shape: raw text in, a list of numbers out, and the model is blind to whatever you did not encode.

## Scale, units, and dominance

If one feature is latency in milliseconds (800) and another is a 0/1 flag, the big number will dominate any distance or any unscaled linear model. Divide each column by a typical size, or keep them in separate heads. Mixing units without scaling is a common silent bug.

**Standardizing** (subtract a typical center, divide by a typical spread) is one habit. **Min-max** scaling to 0–1 is another. Either is chosen on **train** statistics and frozen. Computing the scale on train-plus-test is leakage: the test rows nudged the scale.

Counts of rare words can be huge on one ticket and zero on others. Logs or caps (“token count, but at most 4000”) keep one explosion from owning the score. You are allowed to use human sense. Features are not more scientific because you refused to clip them.

## Leakage: features that are the answer

A feature that exists only **after** the action must not be in the input at decision time.

Examples that have shipped:

- \`status=resolved\` while you predict “resolved”
- The final assistant message, while you predict which tool to call first
- The close reason, the refund amount, the human’s later tag
- Retrieval that indexed the eval question itself
- A timestamp of “when the ticket closed” used to predict “will it close”

If a human sitting at decision time could not have known the number, the model may not use it. Write features as of a **cutoff**: the last user message, tools already called, last error type, token count so far, cosine to each tool doc.

The opposite bug is **starvation**: you hid the only signal that existed. If the router cannot see that SQL was already called twice and failed, it will call SQL a third time. Decision-time state **is** a feature.

## What to put in the list for an agent

Before you fine-tune anything, write the features a **router** would see. If a human cannot guess the label from that list, a tiny model cannot either.

Useful families:

- **Text flags and counts** from the latest user turn (and maybe a short window, not the whole year of chat)
- **Tool history** — names already called, how many times, last error class
- **Retrieval scores** — top cosine, gap between first and second neighbor
- **Budgets** — steps left, tokens so far
- **Identity that is allowed** — plan tier, language, region, if policy may use them

Useless or dangerous families:

- Gold labels sitting in the table
- Future messages
- Global “this user is difficult” scores computed from the whole ticket including the end
- IDs that encode the answer (ticket prefixes that mean “VIP refund queue”)

## Common mistakes

- Feeding raw Unicode and hoping the linear model “reads.” It sees numbers you made, or it sees nothing.
- Concatenating an embedding and a millisecond latency without scaling.
- Using the same feature list for “which tool?” and “was the final answer good?” Those are different times, different x.
- A 500-word bag with 12 labeled rows. You will memorize which rare word appeared in the one urgent ticket.
- Treating cosine 0.82 as a feature named “82% true.” It is an angle. Later: calibration.

## How agents use this

A production router is often this list: bag of a few domain words, or an embedding of the utterance, plus tool-history flags, plus a budget. A retrieval step is features too: each chunk’s vector is the feature; the query’s vector is the other feature; the score is geometry.

If the list includes the future, you cheated. If the list is only “the whole chat as one blob” and the decision needed the last error, you starved the model. Draw the line at **decision time**, write the numbers, and then pick a function. Features first. Model second.

> **Warning:** A feature that exists only after the action (the final assistant message, the close reason) must not be in the input at decision time.

\`\`\`quiz
What is a feature?
- The GPU brand
- *A number (or list of numbers) you extract from an example for the model to see
- The test-set accuracy
- A Python comment
explain: Models consume numbers. Features are how raw tickets, logs, or chats become those numbers.
\`\`\`
`,
  },
  {
    slug: "data-and-splits",
    title: "Data and Splits",
    summary:
      "Train, validation, and test sets — and the leakage bugs that make agent evals lie.",
    minutes: 21,
    level: "beginner",
    md: `
A model that memorizes its homework and fails the exam is not a model. It is a lookup table. The way you prevent that is simple and often skipped: **split the data**.

The split is not a formality for a homework PDF. For agents, the “exam” is next week’s tickets, a new user, a new product name. If those rows influenced which prompt you kept, which features you built, or which cutoff you froze, you already peeked. The published number is then a story about the peek, not a prediction of tomorrow.

## Three piles, three jobs

| Split | Used for | You may |
|---|---|---|
| **Train** | Fit parameters | Look as much as you want |
| **Validation** | Choose knobs, stop training, pick a prompt | Look, but do not fit weights on it |
| **Test** | One final number you publish | Look **once**, when you are done |

If you tune on the test set, it is not a test set. It is a second training set you are lying about.

A common default is **80 / 10 / 10**. The percentages matter less than the **rule**: test examples must not influence any choice, including which features you built, which words went into the bag, which few-shots sit in the prompt, and which cutoff you picked.

**Validation** is the working exam during development. You will look at it many times. That slowly wears it out: each look is a bit of leakage. That is why test still exists. When validation has been stared at for a quarter, freeze a **new** test slice from later traces and retire the old one as extra train, or keep it as a historical benchmark with a version stamp.

## Shuffle — except when time is the feature

Random shuffle is correct when examples are independent: spam emails, isolated tickets with no user overlap. It is **wrong** when the future must not leak into the past. Agent logs are a time series. If Tuesday’s incident write-up is in train and Monday’s related thread is in test, you inverted time. If the same user’s style is in both, you may be testing “do we recognize this person,” not “do we route this kind of ask.”

For traces, split **by time**, **by user**, or **by conversation id**, not by random row.

**Grouped splits** mean: all chunks of one ticket stay together. All messages of one conversation stay together. If you split a ticket into five retrieval chunks and scatter them, the model can “find” the test chunk because its sibling sat in train.

**Time splits** mean: train on January–March, validate on April, test on May. Product launches, new error strings, and new tools live in the later months. That is the point. A random shuffle would sprinkle May into train and make May look easy.

**User splits** mean: some customers never appear in train. If you serve enterprises that each have a private dialect, this is the honest exam.

Small data needs honesty more, not less. With 40 traces, a lucky shuffle can put all the hard tickets in train. Freeze the ids. Report them. Do not reshuffle until you bump the dataset version.

## Leakage

**Leakage** means the model saw the answer, or a proxy for the answer, during training or during “eval.”

Common agent leaks:

- The label column left in the feature table
- Retrieval that indexes the eval questions
- Training on the whole chat, including the assistant’s **final** message, while predicting an earlier tool
- The same ticket in train and test after you split it into chunks
- Few-shot examples in the prompt that are also in the test conversations
- Scaling, vocab, or IDF weights computed on the full file including test
- A human “cleaned” a test label after seeing the model’s answer, then republished last quarter’s number

Deduplicate on **conversation id**, not on chunk text alone. The same ticket pasted twice is leakage’s cousin. Near-duplicates (“please refund” vs “pls refund”) can still leak if they are the same user and the same order id.

\`\`\`viz flow
title Three piles, three jobs
layout lr
node train Train
node val Validation
node test Test
edge train val
edge val test
caption Fit on train. Choose knobs on validation. Publish test once. If you tune on test, it is not a test.
\`\`\`

\`\`\`viz bars
title Same 20 rows, two split rules
bar random-overlap,4,1
bar user-split,0,2
caption Random split shares people. User split does not. For support tickets, the second exam is honest.
\`\`\`

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
print("random split train", len(tr), "test", len(te), "user overlap", sorted(overlap))

tr2, te2 = by_user_split(rows, train_users={0, 1, 2})
overlap2 = {r["user"] for r in tr2} & {r["user"] for r in te2}
print("user split train", len(tr2), "test", len(te2), "user overlap", sorted(overlap2))
\`\`\`

**What printed:** the random split has 14 train rows and 6 test rows, and **user overlap** is \`[0, 1, 2, 3]\` — four of five users appear on both sides (user 4 happened to land on one side only). The user split has 12 train and 8 test, and overlap is \`[]\`. Random split shares people. User split does not. For support agents, the second one is the honest exam: can you route a **new** customer, not a customer you already memorized.

The seed is fixed so this page is repeatable. That is the other half of splitting: **freeze**. Store the list of example ids next to the code. If you reshuffle every experiment, you cannot compare two prompts. Freeze at a timestamp. If someone “cleans” a test label, that is a **new** dataset — bump the version.

## Version the exam

A dataset for agents is not a CSV you overwrite. It is:

- A snapshot of traces (or ids pointing at immutable logs)
- A rubric for \`y\`
- A split file: which ids are train, val, test
- A version name

When policy changes (refunds now take ten days), old labels can become wrong. You either relabel and bump the version, or you keep the old exam as “historical January policy” and add a new exam. Silent relabeling of test is how dashboards heal themselves.

## Common mistakes

- 90/10 with no validation, then picking the cutoff on test.
- Splitting rows after exploding a conversation into messages, so the same ticket is in two piles.
- Indexing the knowledge base with the test questions “just for the demo.”
- Using production traces that already contain the current prompt’s few-shots.
- Comparing model A and model B on different random splits and declaring a winner.

## How agents use this

Your production logs are the dataset. Before you fine-tune or even tune a prompt, freeze a **held-out** slice of traces. If the retrieval index contains the test questions, every RAG demo is leaking.

Split by conversation id first. Then, if the product is seasonal or launching weekly, prefer a time cut for the test slice: the last two weeks, untouched. Validation can be the two weeks before that. Train is everything older that you are allowed to use.

The scientific method from the first lesson is unusable without this page. Fit on train. Choose on validation. Publish test once. Watch a **new** slice next week, because the world moves (drift, later).

> **Warning:** Deduplicate on conversation id, not on chunk text alone. The same ticket pasted twice is leakage’s cousin.

\`\`\`quiz
When is a random shuffle a bad way to split agent data?
- Never; shuffle is always correct
- *When examples are linked by time, user, or conversation, so the future or the same person leaks
- Only when the file is CSV
- When accuracy is already 100%
explain: Independent rows can shuffle. Traces, users, and timestamps need grouped or time splits.
\`\`\`
`,
  },
  {
    slug: "baselines",
    title: "Baselines",
    summary:
      "Always beat a dummy: majority class, last week’s prompt, or a keyword rule. If you cannot, you do not have a win.",
    minutes: 19,
    level: "beginner",
    md: `
A **baseline** is a stupid, honest predictor you publish next to your fancy one. Majority class. Keyword rules. “Always call search.” Last week’s prompt. A one-line function a new hire could write in a morning.

If the neural net cannot beat the dummy, you do not have a modeling win. You have a demo. Teams skip this because baselines are embarrassing. That is the point. Embarrassment is cheaper than a GPU bill and a quarter of prompt poetry that loses to \`if "password" in text\`.

A baseline is also a **product decision**. If keywords are 96% and the remainder is rare and unstructured, ship the keywords. Training is for the remainder that is large, stable, and labeled.

## Majority class

Count the labels in **train**. Always predict the most common one. On a set that is 90% “not urgent,” that dummy is 90% accurate. Any real model must beat **that** number, not 50%.

Do not count majority on train-plus-test. That peeks. Do not count it on test and then also report test accuracy of the dummy as if it were a secret you discovered after training. Publish the dummy from **train** frequencies, scored on the frozen test slice — the same protocol as the real model.

For regression, the dummy is often “always predict the train mean” or “always predict last week’s average latency.” Beating the mean is the bar, not beating zero.

## Constant policies and last week’s prompt

**Always-search** is a policy. **Always-finish** is a policy. **Always-ask-human** is a policy. Score them. Always-ask-human may have beautiful safety numbers and terrible cost. Always-search may have decent task success on a doc-heavy product and fail the moment someone asks for a count of users.

**Last week’s prompt** is the baseline that product actually cares about. A new chain-of-thought template that loses to last week is a regression, even if it beats majority. Freeze the old prompt as a named version. Rerun it on the new eval slice when the data changes, so you are not comparing a new model on new data against an old model on old data.

A **random** policy (pick a tool uniformly) is sometimes worth printing so people see that 33% on three tools is chance, not skill. A **stratified random** that respects class frequencies is a slightly sharper dummy.

## A keyword policy

Write ten lines that a new hire would write. That is often already a strong router. ML is for the remainder those lines cannot cover.

Do not tune the keywords on the test set. Write them from train examples and documentation, freeze them, score test once. If you keep adding a special case after every incident, you are training by hand on a stream that includes what you will later call eval. Version the rule file.

\`\`\`viz bars
title Dummy vs rule on a toy router
bar majority,0.38,0
bar always-search,0.38,1
bar keywords,1.0,2
caption Keywords beat the dummy. A net that scores 0.75 on the same freeze is a loss, not a win.
\`\`\`

\`\`\`tryit python
# 0 = search, 1 = sql, 2 = finish
examples = [
    ("weather", 0),
    ("docs", 0),
    ("revenue", 1),
    ("users", 1),
    ("done", 2),
    ("thanks", 2),
    ("select", 1),
    ("hello", 0),
]

def majority(rows):
    counts = {}
    for _, y in rows:
        counts[y] = counts.get(y, 0) + 1
    return max(counts, key=counts.get)

def keywords(text):
    t = text.lower()
    if t in {"revenue", "users", "select"}:
        return 1
    if t in {"done", "thanks", "stop"}:
        return 2
    return 0

def acc(fn):
    return sum(fn(x) == y for x, y in examples) / len(examples)

maj = majority(examples)
print("majority class", maj, "acc", round(sum(maj == y for _, y in examples) / len(examples), 2))
print("keyword acc", round(acc(keywords), 2))
print("always-search acc", round(sum(0 == y for _, y in examples) / len(examples), 2))
\`\`\`

**What printed:** majority class is \`0\` (search appears most), accuracy about \`0.38\`. Keyword accuracy is \`1.0\` on this toy set. Always-search matches majority here, about \`0.38\`. Keywords beat majority. A transformer that scores 0.75 on the **same** frozen examples is a **loss** against this keyword policy, not a win. The neural net has to beat 1.0 here, or you do not train.

This file is tiny and the keywords were written while looking at the same rows. In production you would freeze keywords from train and score a held-out slice. The shape of the comparison stays: dummy, rule, then anything fancier.

## Cost, latency, and “beats” means all of it

Accuracy is not the only column. A tiny rule that runs in a millisecond and needs no vendor call can lose 2 points of accuracy and still win the product. A fine-tune that beats keywords by 1% and costs 50 times more is a choice, not an automatic promotion.

Publish a small table: method, metric on frozen test, latency, dollar cost per 1000 tickets, and whether it needs labels to refresh. Baselines make that table make sense. Without them, the table is three fancy rows arguing with each other.

## When the baseline wins

Ship it. Put the remainder on a dashboard. If the remainder grows and clusters (unsupervised later), promote a new rule or a small model for **that** cluster. Do not train a global net to avoid writing \`if "password" in text\`.

If you cannot beat majority, debug labels, features, and leakage before you buy a larger model. The data is often the dummy’s ally: noisy y, leaked x, or a question nobody defined.

## Common mistakes

- Reporting 91% without saying majority is 90%.
- Tuning 40 keyword special cases on the same tickets you publish.
- Changing the eval when the model loses to the dummy, instead of publishing the loss.
- Using a weak dummy (random) when a strong one (last week’s prompt) exists.
- Forgetting that “always escalate” is a baseline with a human-hours cost.

## How agents use this

Before you train a router, log one week of traces and score **always-search** and a 20-line keyword file. Put those two numbers on the dashboard. The ML model’s only job is to beat them on the frozen test slice — and stay cheaper than another LLM call.

Last week’s prompt belongs on that dashboard forever. Regressions against it are incidents. Improvements against it are the only kind of modeling win that counts after you already beat majority.

> **Tip:** A baseline is a product decision too. If keywords are 96% and the remainder is rare, ship the keywords.

\`\`\`quiz
Why report a majority-class baseline?
- It trains the neural net
- *It shows the accuracy you get by always guessing the common label, so a real model has a bar to beat
- It removes leakage
- It replaces the test set
explain: On imbalanced data, 90% accuracy can be a dummy. The baseline makes that visible.
\`\`\`
`,
  },
  {
    slug: "supervised",
    title: "Supervised Learning",
    summary:
      "Every training row has an input x and a target y. No labels, no supervised learning.",
    minutes: 20,
    level: "beginner",
    md: `
**Supervised learning** means every training example has an **input** \`x\` and a **target** \`y\`. The algorithm’s job is to predict \`y\` from \`x\` for new rows.

The word is literal: a supervisor (human, script, or downstream system) provided the answers. No labels, no supervised learning. You may still cluster or embed. You may not claim you “trained a classifier.” You may not treat the agent’s own guesses as gold and then celebrate that the agent agrees with itself.

\`x\` is what is known at decision time. \`y\` is the decision you wish the system had made, or the number you wish it had estimated. Get those two aligned and the rest of the track is search and measurement. Get them wrong and you will fit a function that answers a question nobody asked.

## Classification vs regression

| | Classification | Regression |
|---|---|---|
| \`y\` | A **category** (spam / ham, tool A / tool B) | A **number** (latency, price, 1–5 stars) |
| Typical loss | Cross-entropy | Mean squared error |
| Output | Class or chances | Real value |
| Agent examples | Route this ticket; pick a tool | Estimate tokens left; score a trace |

Do not turn regression into classification without a reason. “Latency > 800ms” as a yes/no throws away how late it was. Do not predict \`3.7\` for a tool id either: that is not a tool call. Ordered classes (1–5 stars) sit in the middle: sometimes a regression, sometimes five classes. Pick from the product, not from habit.

**Binary** classification is two labels (urgent / not). **Multi-class** means more than two labels, **one** of them true (which of eight tools). **Multi-label** means several can be true at once (billing **and** outage). Those are different schemas. Mixing them is a silent eval bug: a multi-label ticket scored as if only one tool were allowed will look like model failure when it is schema failure.

If the action space is “call one tool, or finish, or ask a human,” that is multi-class. If the agent may legally call search **and** sql in one step, that is multi-label or a sequence of decisions. Write the action space down before you label.

## What a label is

A label is a decision you wish the system had made:

- The tool a senior engineer would have called
- Whether the final answer is supported by a source
- The JSON that passed the schema
- A thumbs-down from a user
- Whether a human should have been in the loop

Labels are not “the meaning of the ticket.” They are **actions and judgments**. If two labelers disagree 30% of the time, the **ceiling** of your model is near 70%, not 100%. You cannot train your way past a fuzzy rubric. You fix the rubric, add \`abstain\`, or split the label into two questions.

**Agreement** is a measurement: two people (or a person and a written spec) on the same sample. If they disagree, modeling is early. If they agree but the labels still feel wrong in production, the rubric does not match the product.

Ambiguous items belong in a third bucket — \`abstain\` or \`ask_human\`. Forcing a hard class invents noise. Noise looks like a model that “regressed overnight” after a labeling pass.

## Noisy labels and weak labels

A **noisy** label is a lie or a coin flip: the wrong tool tagged, a script that used the current agent as truth, a row where nobody read the policy. A **weak** label is a cheap hint: the agent’s own action, a keyword, a user thumbs-up. Weak labels can start a dataset. They cannot finish one. Sample for humans.

Do not label data with the agent itself and then treat that as gold. That **amplifies** the first version’s bias. Every systematic mistake becomes “the right answer” and the next model copies it harder.

\`\`\`viz scatter
title Each row is an input and a target
xlabel feature
ylabel label
xmin -0.1
xmax 1.1
ymin -0.3
ymax 2.4
dot 0.1,0 search 0
dot 0.2,0 search 0
dot 0.8,1 sql 1
dot 0.9,1 sql 1
dot 0.45,2 finish 2
dot 0.55,2 finish 2
caption Supervised means someone wrote y. Clustering is a different job until you promote a blob into a label.
\`\`\`

\`\`\`tryit python
# 0 = search, 1 = sql, 2 = finish
clean = [
    ("weather", 0),
    ("docs", 0),
    ("revenue", 1),
    ("users", 1),
    ("done", 2),
    ("thanks", 2),
]

def keywords(text):
    t = text.lower()
    if t in {"revenue", "users", "select"}:
        return 1
    if t in {"done", "thanks"}:
        return 2
    return 0

def acc(rows):
    return sum(keywords(x) == y for x, y in rows) / len(rows)

noisy = list(clean)
noisy[0] = ("weather", 1)  # wrong on purpose
print("clean acc", round(acc(clean), 2))
print("noisy acc", round(acc(noisy), 2))
print("the policy did not get worse — the labels did")
\`\`\`

**What printed:** \`clean acc 1.0\`. \`noisy acc 0.83\` (one of six targets is a lie, so 5/6). Then the sentence that the policy did not get worse — the labels did. The keyword rule is the same function. The score dropped because one \`y\` was wrong. That is how noisy agent traces look on a dashboard: the model “regressed” overnight after a bad labeling pass, or after someone used the agent’s own tool calls as gold.

In a real freeze you would not score the rule on the same six rows you used to invent it. The print is about **labels**, not about validation protocol.

## Where labels come from in an agent stack

Good sources: a written rubric plus humans; a replay against a fixture world (\`goal_satisfied\`); a schema checker; a forbidden-tool list; an exact match to a required citation id.

Bad sources: “whatever the LLM did last week”; thumbs-up without looking at tools; the retrieval corpus as if every neighbor were relevant; mixing several raters’ private scales.

If you can compute \`y\` with a script (JSON valid, required substring present, tool in allow-list), do that first. Humans are for leftover judgment. Script labels still need a split: the script can overfit a prompt if you tune the prompt on the same traces.

## Common mistakes

- Calling clustering “supervised” because you named the clusters after the fact.
- Predicting a tool id as a real number.
- Multi-label tickets scored with single-class accuracy.
- A model ceiling of 100% on a task where people agree 70%.
- Training on agent outputs and calling it ground truth.

## How agents use this

Every router in front of a big LLM is a supervised classifier, even if you implement it with embeddings. Define the label set as **your action space** (\`search\`, \`code\`, \`ask_human\`, \`final\`). If a label is not an action you can run, it does not belong.

Six demo examples are a story, not a result. Next pages give you a real **loss**, a search over knobs, and metrics that do not lie when one class is rare. Supervised learning only starts when \`x\` and \`y\` are honest. The function you pick is secondary.

> **Note:** Six demo examples are a story, not a result. Next: a real **loss**.

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
];
