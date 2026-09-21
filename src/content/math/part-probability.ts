import type { RawLesson } from "@/lib/types";

export const mathProbability: RawLesson[] = [
  {
    slug: "probability",
    title: "Probability",
    summary:
      "Sample spaces, counting, and simulation. Agents live in a world where tools and tokens are random events.",
    minutes: 21,
    level: "intermediate",
    md: `
**Probability** assigns a number in \`[0, 1]\` to an **event** — a subset of possible **outcomes**. The set of all outcomes is the **sample space**. For a fair six-sided die, the sample space is \`{1,2,3,4,5,6}\` and each outcome has chance \`1/6\`. The event “even” has three outcomes, so chance \`1/2\`.

Two events are **mutually exclusive** if they cannot both happen. Their chances **add**. If every outcome is equally likely, probability is **counting**: size of the event divided by size of the space. If outcomes are not equal (a bent coin, a language model), you cannot count; you **weigh**.

**Independence** means \`P(A and B) = P(A) P(B)\`. Coin flips are the textbook case. Agent tool failures are **not** independent if they share a downed API. Multiplying “99% reliable” twelve times is only legal if the failures do not cluster. They cluster.

The **complement** is cheap: \`P(not A) = 1 - P(A)\`. “Chance we never hit bad JSON in 8 calls” is 1 minus the chance of at least one bad call. If you cannot compute an event directly, compute the opposite and subtract.

## A wrong picture

A wrong picture is: “if each tool is 90% reliable, a 12-step agent is basically fine.” If you **assume independence**, \`0.9 ** 12 ≈ 0.28\`. The chain is not fine. If failures **share a cause**, the product is the wrong model entirely: one outage fails every call at once.

Another wrong picture is treating an eval pass rate as the true chance. Your eval set is a **sample**, not the whole space. 29/32 is a noisy frequency. Report counts. Small \`n\` cannot tell 0.80 from 0.88 (variance lesson).

A third wrong picture is: “mutually exclusive” and “independent” are the same. They are almost opposites. Exclusive events cannot both happen; their “and” chance is 0, which equals the product only if at least one chance is 0. Independent events **can** both happen; their “and” is the product.

## The formula in words

- Chance is a weight in \`[0, 1]\`. All outcomes together weigh 1.
- Exclusive “or”: add the chances.
- Independent “and”: multiply the chances.
- Complement: subtract from 1.
- Equal outcomes: count / total.
- Unequal: sum the weights of the outcomes in the event.

**Conditional** \`P(A|B)\`: restrict the space to B, then measure A. “Chance the ticket is fraud given the tool returned country mismatch.” Next lesson turns that into **Bayes**.

Simulation: draw many outcomes, measure frequencies. Frequencies get close to probabilities if draws are independent and from the same distribution. For agents, simulation is often the only honest tool: the space of “what the model might do” is too large to list.

## A tiny example

Two dice, 6×6 = 36 equally likely pairs. Sum to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) — six pairs. Chance \`6/36 = 1/6\`.

Biased coin, P(heads)=0.3. You cannot count faces. Simulate: many \`random.random() < 0.3\` checks, divide heads by n. Around 0.3 if n is large.

Five tools, each fails with 0.1, **independent**: chance any fails is \`1 - 0.9**5 ≈ 0.41\`. Shared outage with chance 0.1 that kills **all** of them: chance of “all fail via outage” is 0.1, not 0.41. Different sample spaces, different numbers.

\`\`\`viz bars
title Chance something fails: two models
bar independent,0.41,0
bar shared,0.10,1
caption Five tools at 10% fail. Independent any-fail is about 0.41. A shared outage is 0.10. Do not mix the two.
\`\`\`

## Counting vs simulation

\`\`\`tryit python
import random

random.seed(0)

outcomes = [(a, b) for a in range(1, 7) for b in range(1, 7)]
event = [o for o in outcomes if o[0] + o[1] == 7]
print("space", len(outcomes), "sum7", len(event), "P", len(event) / len(outcomes))

def trial():
    return "H" if random.random() < 0.3 else "T"

n = 5000
heads = sum(1 for _ in range(n) if trial() == "H")
print("simulated P(H)", heads / n)

def independent_tools(k=5, p_fail=0.1):
    return any(random.random() < p_fail for _ in range(k))

def shared_outage(k=5, p_outage=0.1):
    if random.random() < p_outage:
        return True
    return False

n = 3000
p_ind = sum(independent_tools() for _ in range(n)) / n
p_share = sum(shared_outage() for _ in range(n)) / n
print("P(any of 5 fail), independent", round(p_ind, 3))
print("P(all fail via shared outage)", round(p_share, 3))
\`\`\`

Dice: space 36, sum7 is 6, P is \`0.1666...\` which is 1/6. Simulated P(H) should sit near 0.3 (seed 0, 5000 trials: close, not exact). Independent any-of-5-fail should land near 0.41. Shared outage near 0.10. The two failure models do **not** give the same number. If your risk doc multiplies independent 10% chances, but production is a shared outage, you priced the wrong sample space.

\`random.random() < p\` is the Bernoulli trial you will name in the distributions lesson. Here it is just a biased coin.

When you write \`max_retries=3\`, you are asserting a model of how often independent retries help. Measure it. If errors are systematic (bad schema), retries sample the same failure. The complement “never succeeds” stays near 1.

## Conditional probability

\`P(A|B)\` is chance of A **given** that B happened: restrict the sample space to B, then measure A. All timeouts, then how many are “vendor down.” That is not the same as “how many downs time out.” Bayes next.

Token sampling is a weighted space: the vocab is the outcomes, softmax supplies the weights. You do not count tokens; you weigh them. Same definition of probability.

## How agents use this

Every decode step is a draw from a distribution over the vocabulary. Every tool call is an event: success, timeout, bad JSON, wrong side effect. Your eval set is a sample, not the whole space — so a 91% pass rate on 32 tickets is a **noisy** frequency. Report counts, not just percents: 29/32 is more honest than 0.91.

- **Tokens:** next token is a random event with a huge sample space (the vocab). Greedy decoding picks the mode; sampling draws. Both need the weights to sum to 1 (softmax).
- **Ranking:** retrieval is usually not random given the index. The **query** is random from users. Measure recall on a sample of queries, not on one lucky question.
- **Loss:** log-likelihood is the log of a product of token chances — independence **along the sequence given the model**. That is a modeling assumption, not a law of tickets.
- **Retries:** independent retries help blips. They do not help a wrong schema. Write down which sample space you think you are in.

When errors cluster, stop multiplying. Draw the events. Exclusive vs independent vs shared cause. That drawing is the risk doc.

> **Note:** \`random.random() < p\` is the Bernoulli trial you will name in the distributions lesson. Here it is just a biased coin.

\`\`\`quiz
If two events cannot happen at once, the chance that one or the other happens is
- Always 1
- The product of their chances
- *The sum of their chances (they are mutually exclusive)
- Undefined unless they are independent
explain: Mutually exclusive events add. Independence is a different idea (products for “and”).
\`\`\`
`,
  },
  {
    slug: "bayes",
    title: "Bayes' Rule",
    summary:
      "Update a prior with a likelihood after a tool observation. Agents should change their beliefs in numbers.",
    minutes: 21,
    level: "intermediate",
    md: `
**Bayes’ rule** is how you update a belief when a new observation arrives:

\`P(H|E) = P(E|H) P(H) / P(E)\`

- \`H\` is a **hypothesis** (the API is down; the user wants a refund; this chunk is relevant).
- \`E\` is **evidence** (the tool timed out; the message contains “invoice”; cosine is 0.8).
- \`P(H)\` is the **prior** — belief before the observation.
- \`P(E|H)\` is the **likelihood** — how expected the evidence is if H is true.
- \`P(H|E)\` is the **posterior** — belief after the observation.
- \`P(E)\` is the chance of the evidence overall, often a **sum** over hypotheses.

A well-behaved agent **changes its plan when observations arrive**. That is Bayes, even if you implement it with \`if\` statements.

## A wrong picture

The classic swap: people confuse \`P(E|H)\` with \`P(H|E)\`. “90% of down APIs time out” is not “90% of timeouts mean the API is down,” unless the prior is already extreme. Base rates matter.

People skip \`P(E)\` and then cannot compare scales. \`P(E)\` is the **normalizer**: total mass of “evidence under each hypothesis.” Without it you have unnormalized masses, not chances.

Another wrong picture: treating two timeouts as two independent observations when they are the **same** hung connection. You double-counted evidence. Real agents should know whether two observations are copies. Count it as one.

A third: a rare hypothesis plus a noisy detector. Likelihood ratio can look strong and the posterior still modest. That is alert fatigue: most alerts are still “not fraud” if fraud is rare.

## The formula in words

Posterior is proportional to likelihood times prior. Then divide by P(E) so the hypotheses you care about sum to 1.

P(E) for two hypotheses (down vs up): \`P(E|down)P(down) + P(E|up)P(up)\`. That is the law of total probability: weigh each world by how often it happens, then add.

**Odds form:** prior odds times **likelihood ratio** \`P(E|H)/P(E|not H)\` gives posterior odds. A test that is 18 times more likely under H than under not-H is strong, but a rare H can still lose.

## A tiny example

Prior: vendor down 10% of the time. If down, P(timeout)=0.9. If up, P(timeout)=0.05 (blips). You see a timeout. What is P(down | timeout)?

P(timeout) = 0.9*0.10 + 0.05*0.90 = 0.09 + 0.045 = 0.135.

P(down | timeout) = (0.9*0.10) / 0.135 = 0.09/0.135 = 2/3 ≈ 0.667.

The posterior is much larger than 10%, but it is **not** 90%. Base rates matter. A second **independent** timeout multiplies another 0.9 vs 0.05 into the masses and pushes further. If both timeouts are the same hung socket, do not multiply.

\`\`\`viz bars
title Timeout: prior vs posterior that the vendor is down
bar prior,0.10,0
bar posterior,0.67,1
caption Before the timeout, down is 10%. After, about 67%. Not 90% — the base rate still matters.
\`\`\`

## Moving parts

| Name | Meaning |
|---|---|
| Hypothesis \`H\` | The claim (API down, fraud, this chunk is gold). |
| Evidence \`E\` | What you just saw (timeout, alert, cosine). |
| Prior \`P(H)\` | Belief **before** E. |
| Likelihood \`P(E|H)\` | How expected E is if H is true. |
| \`P(E)\` | Normalizer: total mass of E under every H you listed. |
| Posterior \`P(H|E)\` | Belief **after** E. |

Posterior is proportional to likelihood times prior. Divide by \`P(E)\` so the hypotheses you care about sum to 1.

## A second walkthrough (rare fraud)

Fraud is rare: prior \`P(fraud) = 0.01\`. Detector: \`P(alert|fraud) = 0.90\`, \`P(alert|ok) = 0.05\`.

\`P(alert) = 0.90*0.01 + 0.05*0.99 = 0.009 + 0.0495 = 0.0585\`.

\`P(fraud|alert) = 0.009 / 0.0585 ≈ 0.154\`.

A “90% detector” on a 1% base rate still leaves about **15%** posterior. Most alerts are still not fraud. That is alert fatigue as a number, not a mood. Raise the prior (this tenant is already flagged) or lower the false-alert rate if you want a posterior you would act on.

Odds form, same story: prior odds 1:99. Likelihood ratio \`0.90/0.05 = 18\`. Posterior odds \`18/99 = 2/11\`, which is about 0.154 again.

Zero likelihood: if \`P(E|H) = 0\` for every H you listed, \`P(E) = 0\` and you cannot divide. You forgot a hypothesis (a third world: “bad schema,” not down vs up).

## A Friday ticket

Friday retries. First timeout: P(down|timeout) ≈ 0.67, so one retry is rational (could be a blip). The same hung socket timed out again. The code multiplied a second 0.90 vs 0.05 as if the draws were independent. Posterior jumped to ~0.97. The agent hammered a **live** API that was slow, not down.

They counted copies as **one** observation and added a third hypothesis: “slow but up.” After one timeout the mass split three ways instead of two. The retry policy followed the posterior, not the slogan “always retry twice.”

## A tool timeout

\`\`\`tryit python
p_down = 0.10
p_up = 1.0 - p_down
p_timeout_if_down = 0.90
p_timeout_if_up = 0.05

p_timeout = p_timeout_if_down * p_down + p_timeout_if_up * p_up
p_down_if_timeout = (p_timeout_if_down * p_down) / p_timeout

print("P(timeout)", round(p_timeout, 4))
print("P(down | timeout)", round(p_down_if_timeout, 4))

mass_down = p_timeout_if_down * p_down
mass_up = p_timeout_if_up * p_up
z = mass_down + mass_up
print("posterior down, up", round(mass_down / z, 4), round(mass_up / z, 4))

mass_down2 = mass_down * p_timeout_if_down
mass_up2 = mass_up * p_timeout_if_up
z2 = mass_down2 + mass_up2
print("after 2 timeouts, P(down)", round(mass_down2 / z2, 4))
\`\`\`

P(timeout) prints \`0.135\`. P(down | timeout) prints about \`0.6667\`. The mass line is the same posterior, written as two weights that sum to 1: down about 0.667, up about 0.333. After two **independent** timeouts, P(down) prints about \`0.973\`. That last jump is why people hammer retries — and why it is wrong if the two timeouts are copies.

If P(down | timeout) is only 0.67, one retry is rational (could be a blip). If it is 0.99, stop hammering and page a human. The number changes the policy.

Write the two masses even when you have more than two hypotheses (refund vs shipping vs auth). Each mass is likelihood times prior. Divide by the sum. That is all of Bayes for a finite list of buckets.

## What goes wrong

- **Swapping likelihood and posterior:** “90% of down APIs time out” is not “90% of timeouts mean down.” Base rates matter. Write both numbers.
- **Skipping P(E):** unnormalized masses are not chances. You cannot compare them to a 0.5 cutoff until you divide.
- **Double-counting copies:** two timeouts on one socket are one observation. Independent multiply is illegal.
- **Rare H plus noisy detector:** posterior stays modest. Acting on every alert is a false-positive factory.
- **Zero P(E):** you omitted a hypothesis. Add a bucket or refuse to update.

Production logs: prior, likelihoods, P(E), posterior, and whether evidence was counted as independent. Assert posteriors sum to 1 over the listed H, all ≥ 0, and P(E) > 0. A line \`prior=0.10 post=0.67 E=timeout copies=1\` is a policy. \`I am pretty sure the API is down\` is not.

## How agents use this

A well-behaved agent **changes its plan when observations arrive**. Prior “search the docs first”; evidence “search returned nothing”; posterior “ask a clarifying question.” Writing actual numbers is useful when you set **alert cutoffs** and **retry policy**.

RAG is Bayesian too, loosely: prior over documents (uniform or recency-weighted), likelihood from an embedding score. You will rarely write the formula, but when a high cosine from a garbage chunk beats a slightly lower cosine from a trusted source, you forgot the prior over sources. Trust and recency are priors. Cosine is (a stand-in for) likelihood. Posterior ranking should mix them.

- **Tokens:** the model’s next-token chances are a prior over words given the prompt. New tool output is evidence. A stubborn agent that ignores the tool result is refusing to update.
- **Ranking:** multiply (or add in log space) a source-trust weight with cosine. That is prior times likelihood without the full sermon.
- **Loss:** Bayes is not a training loss. Calibration (does 0.7 mean 70%?) is the cousin you plot in evals.
- **Sampling:** do not “Bayesian update” by sampling harder. Update the **plan**. Then sample from the new policy (maybe fewer tools).

Do not update as if evidence were independent when the same tool is retried on the same bug. Count it as one observation.

> **Warning:** Do not update as if evidence were independent when the same tool is retried on the same bug. Count it as one observation.

\`\`\`quiz
P(E|H) is
- The posterior belief in H
- The prior belief in H
- *The likelihood: chance of the evidence assuming H is true
- Always equal to P(H|E)
explain: Likelihood is evidence given hypothesis. Bayes flips it, using the prior and P(E), into the posterior P(H|E).
\`\`\`
`,
  },
  {
    slug: "distributions",
    title: "Distributions",
    summary:
      "Bernoulli, uniform, and Gaussian samples — the shapes behind coins, random picks, noise, and softmax.",
    minutes: 20,
    level: "intermediate",
    md: `
A **distribution** is a full assignment of chance to outcomes (discrete) or a density (continuous). Named families show up constantly:

- **Bernoulli(\`p\`)**: one toss, success with chance \`p\`. Tool call succeeds or not.
- **Uniform** on a set: every outcome equal. \`random.random()\` is uniform on \`[0, 1)\`. Uniform over a vocabulary would be a maximally confused model.
- **Gaussian** (normal): bell-shaped, with **mean** \`mu\` and **standard deviation** \`sigma\`. Measurement noise, some embedding coordinates.

You describe a distribution by **parameters**, then either write a formula or **draw samples** and look at mean and spread. Sampling is how you check you coded the right family.

A **categorical** distribution is a Bernoulli generalized to more than two labels: a list of chances that **sum to 1**. Softmax produces one. Sampling a token is a categorical draw.

## A wrong picture

A wrong picture is: “everything is Gaussian.” Production latency is often a bump plus a **timeout spike**. A Gaussian has unbounded tails and no hard cap. One family rarely describes traces by itself. Mix a body with a separate timeout event.

Another wrong picture is: “my confidence is 0.99, so I am Bernoulli(0.99) correct.” If you are wrong half the time at that confidence, you are **miscalibrated**. The named family is a claim. Plot predicted \`p\` vs empirical frequency (a reliability diagram).

A third: a Gaussian with \`sigma = 0\` is a constant. It will sneak into tests. Always print sample mean and std after you write a sampler. Dead embedding dimensions (std near 0 across a corpus) waste cosine; exploding dimensions dominate it.

## The formula in words

Every named family has a **support** (which values can appear) and **parameters** (which member of the family you picked).

- Bernoulli support is 0 and 1. Mean is \`p\`. Variance is \`p(1-p)\`.
- Uniform on [0, 10] cannot produce 11. Mean is the midpoint 5.
- Gaussian support is all real numbers. Mean \`mu\`, spread \`sigma\`. About 95% of mass sits within 2 sigma of the mean in the ideal story — a slogan, not a law of tickets.
- Categorical: a list \`p_i >= 0\` summing to 1. Mean is not “the average token id”; that number is usually meaningless. Entropy (next part) measures spread.

Bernoulli is a cutoff on a uniform: \`1 if random.random() < p else 0\`. Uniform floats: \`a + (b-a) * random.random()\`. Gaussians can be built from two uniforms (Box–Muller): if \`U1, U2\` are uniform, a formula gives a standard normal. Scale by \`sigma\` and add \`mu\`.

## A tiny example

Draw 4000 Bernoulli(0.3) samples. Mean should sit near 0.3, std near \`sqrt(0.3*0.7) ≈ 0.458\`.

Uniform 0–10: mean near 5.

Gaussian N(5, 2): mean near 5, std near 2. Tail \`P(X > 9)\` is a few percent — rare, not impossible. That is why “3 sigma” thinking exists: do not treat every outlier as a new regime, and do not treat a 4-sigma wait as a blip.

\`\`\`viz bars
title Sketch of many Gaussian draws
bar 1,2,0
bar 3,8,0
bar 5,16,0
bar 7,10,0
bar 9,3,0
caption Most samples pile near 5. A few land past 9. That bump is the Gaussian family, not a law of tickets.
\`\`\`

## Moving parts

| Family | Support | Parameters | Agent picture |
|---|---|---|---|
| Bernoulli | 0 or 1 | \`p\` | Tool success, binary eval |
| Uniform | an interval or a set | bounds, or “all equal” | \`random()\`, confused vocab |
| Gaussian | all reals | mean \`mu\`, std \`sigma\` | noise, some embedding axes |
| Categorical | k labels | chances that sum to 1 | next token, next tool |

Support is a contract. Uniform on [0, 10] cannot produce 11. Bernoulli cannot produce 2. A Gaussian **can** produce a negative wait — which is why it is a bad solo model of latency.

## A second walkthrough (body plus spike)

Eight independent tools, each fails Bernoulli(\`0.10\`). Chance all succeed: \`0.9 ** 8 ≈ 0.430\`. Chance at least one fails: \`1 - 0.430 = 0.570\`. That is not a Gaussian story. It is a product of Bernoullis.

Now latency. 95% of waits are about N(200 ms, 40 ms). 5% are a hard timeout at 8000 ms.

Mean wait = \`0.95*200 + 0.05*8000 = 190 + 400 = 590\` ms.

A Gaussian-only dashboard that reports “mean 200 ms” **missed the spike**. The spike **is** most of the mean. p95 vs mean will disagree. Model the body and the timeout as two families mixed, not as one bell.

\`sigma = 0\`: every Gaussian sample is \`mu\`. A dead embedding dimension (std ≈ 0 across a corpus) is this. It wastes cosine. An exploding dimension (std huge) dominates cosine. Print std per coordinate.

## A Friday ticket

Friday 19:00. p95 latency “looked Gaussian” on a chart that never showed the timeout bucket. On-call kept treating 8-second waits as 3-sigma blips of a 200 ms bell. They were the 5% timeout event. After they histogrammed waits, the mix was obvious: a bump near 200 ms and a spike at the cutoff. They split the metric: body mean, timeout rate, timeout cap. The Gaussian was allowed to describe the bump only.

## Draw three families

\`\`\`tryit python
import math
import random

random.seed(1)

def bernoulli(p):
    return 1 if random.random() < p else 0

def uniform(a, b):
    return a + (b - a) * random.random()

def gauss(mu=0.0, sigma=1.0):
    u1 = 1.0 - random.random()
    u2 = random.random()
    z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
    return mu + sigma * z

def summarize(xs):
    n = len(xs)
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / n
    return mean, var ** 0.5

n = 4000
b = [bernoulli(0.3) for _ in range(n)]
u = [uniform(0, 10) for _ in range(n)]
g = [gauss(5, 2) for _ in range(n)]

print("bernoulli mean, std", [round(x, 3) for x in summarize(b)])
print("uniform   mean, std", [round(x, 3) for x in summarize(u)])
print("gauss     mean, std", [round(x, 3) for x in summarize(g)])
print("P(gauss>9) ~", sum(1 for x in g if x > 9) / n)
\`\`\`

Bernoulli mean, std should be near \`0.3\` and \`0.46\`. Uniform mean near 5, std near \`10/sqrt(12) ≈ 2.89\`. Gauss mean near 5, std near 2. \`P(gauss>9)\` a few percent (about 0.02–0.03). Seed 1, n=4000: close, not exact. If Bernoulli mean printed 0.01, your cutoff is wrong. If Gauss std printed 0, you passed sigma 0.

The Box–Muller line uses \`1.0 - random.random()\` so \`u1\` is never 0 (log would die). That is the same “do not log 0” rule as the logs lesson.

## What goes wrong

- **Wrong family:** latency is not Gaussian. A cap plus a spike needs a mix. Support matters: if a formula cannot produce 0, it cannot model “zero retried calls.”
- **sigma = 0:** a constant sneaking into tests. Print sample std.
- **p outside [0, 1]:** Bernoulli(\`1.2\`) is not a chance. Clip or raise.
- **Miscalibration:** predicted 0.99, empirical 0.50. You are not Bernoulli(0.99) correct. Plot p vs frequency.
- **Categorical that does not sum to 1:** not a distribution. Softmax first.

Production logs: family name, parameters, sample mean, sample std, and (for latency) timeout rate separately. Assert \`0 <= p <= 1\`, \`sigma >= 0\`, categorical sums to 1. After you write a sampler, print mean and std once.

## Discrete vs categorical

Sampling a token is a categorical draw. The sampling lesson later implements that draw with a cumulative sum. Uniform over vocab is the maximum-entropy categorical (entropy lesson). Temperature moves you toward or away from that uniform.

Noise in embeddings is often treated as roughly Gaussian in each coordinate. That is a model, not a law. Still, **mean and std of a coordinate** across a corpus tell you whether a dimension is dead (std ≈ 0) or exploding.

## How agents use this

Calibrated agents need distributional honesty. If your “confidence” is always 0.99, you are not Bernoulli(\`p_correct\`); you are miscalibrated.

- **Tokens:** softmax output is categorical. Greedy is the mode. Sampling is a draw. Uniform would be temperature infinite in the slogan limit.
- **Ranking:** cosine scores are not a named family. You can still **histogram** them. A blob of similar top-k scores is a high-entropy retrieval neighborhood.
- **Loss:** Bernoulli log-loss is cross-entropy for two classes. Categorical cross-entropy is the same idea with more labels.
- **Latency / cost:** model the body and the timeout spike separately. A single Gaussian will smear the spike into fake “typical” waits.

Always print sample mean and std after you write a sampler. A Gaussian with std 0 is a constant, and it will sneak into tests. Support matters: if a formula cannot produce 0, it cannot model “zero retried calls.” Histogram waits before you name the family. Timeout rate is its own Bernoulli, not a tail of N(200, 40).

> **Tip:** Always print sample mean and std after you write a sampler. A Gaussian with std 0 is a constant, and it will sneak into tests.

\`\`\`quiz
A Bernoulli(p) random variable
- Is uniform on the real line
- *Takes value 1 with chance p and 0 otherwise
- Always has mean 0
- Cannot model tool success or failure
explain: Bernoulli is a single yes/no trial. Mean is p. It is the atom of tool success and binary classification.
\`\`\`
`,
  },
  {
    slug: "expectation-variance",
    title: "Expectation and Variance",
    summary:
      "Expected value is a probability-weighted average. Variance is spread. Use both to budget an agent step.",
    minutes: 21,
    level: "intermediate",
    md: `
The **expected value** \`E[X]\` is the chance-weighted average of a random variable. For a discrete \`X\` that takes values \`x_i\` with chances \`p_i\`, \`E[X] = sum p_i x_i\`. It is **not** always a value X can take (the expected die roll is 3.5). It **is** what the average of many independent copies converges to.

**Variance** is expected squared deviation from the mean: \`E[(X - mu)^2]\`. **Standard deviation** is its square root, in the same units as X. High variance means a single run is a poor guess of the mean — relevant when you quote “the agent costs $0.04 per ticket” from 8 tickets.

Linearity: \`E[A+B] = E[A]+E[B]\` even if A and B are dependent. Products do **not** work that way unless you have independence. If a slow tool is also expensive, ignoring that underprices the bad days.

A useful identity: \`Var(X) = E[X^2] - (E[X])^2\`. In code, sum \`p * c\` for the mean, sum \`p * (c ** 2)\` for E[X^2], subtract the square of the mean.

## A wrong picture

A wrong picture is: “budget the expectation and you will be fine.” Operations wants a **high percentile**. A few percent of runs hit the human path and cost 5 when the mean is 1.6. If you provision only 1.6, those runs overflow. Finance wants **expectation**; on-call wants the tail.

Another wrong picture is: “expectation is the typical outcome.” Typical often means the **mode** (most common). A die’s typical face is not 3.5. An agent’s typical ticket may be “one cheap tool call” while the mean is pulled by rare escalations.

A third: \`E[total] = E[steps] * E[cost per step]\` as a law. That needs extra assumptions (uncorrelated number of steps and cost per step, or independence). In practice, **measure** total cost from traces; use expectation as a model, not as a law of nature. Hard tickets take more steps **and** more expensive tools.

Evals: the expected pass rate is a Bernoulli mean. Variance of a proportion is \`p(1-p)/n\`. Small n means you cannot distinguish 0.80 from 0.88. Ship fewer claims, or gather more tickets.

## The formula in words

Expectation: multiply each outcome by its chance, add. That is a weighted average (sums lesson) where the weights are chances.

Variance: how far from the mean, squared, then averaged with the same chances. Std is the square root, back in dollars or tokens.

Tiny numeric. Three outcomes: one call cost 1 with chance 0.70; retry cost 2 with chance 0.20; human cost 5 with chance 0.10.

E[cost] = 0.70*1 + 0.20*2 + 0.10*5 = 0.70+0.40+0.50 = 1.60.

E[cost^2] = 0.70*1 + 0.20*4 + 0.10*25 = 0.70+0.80+2.50 = 4.00.

Var = 4.00 - 1.60^2 = 4 - 2.56 = 1.44. Std = 1.2.

A few percent? Chance of human is 0.10, cost 5, which is over 3 units. Fraction over 3 is 0.10 here (only the human path). Simulation should match.

\`\`\`viz bars
title Three ticket costs
bar cheap,1,0
bar retry,2,1
bar human,5,2
caption Cheap is 1, retry is 2, human is 5. The mean is 1.6 because the rare human path pulls it up.
\`\`\`

## Moving parts

| Name | Meaning |
|---|---|
| \`E[X]\` | Chance-weighted average. Need not be a value X can take. |
| \`Var(X)\` | Expected squared distance from the mean. |
| Std | Square root of variance. Same units as X. |
| Tail / p95 | A high percentile. Ops cares about this more than the mean. |

Linearity: \`E[A+B] = E[A]+E[B]\` even when A and B depend on each other. \`E[A*B] = E[A]E[B]\` needs extra assumptions. Hard tickets take more steps **and** more expensive tools — do not multiply those two means and call it a law.

## A second walkthrough (tokens)

Per ticket: 70% cheap (800 tokens), 20% medium (2000), 10% loop (12000).

\`E[tokens] = 0.70*800 + 0.20*2000 + 0.10*12000 = 560 + 400 + 1200 = 2160\`.

\`E[X^2] = 0.70*640000 + 0.20*4000000 + 0.10*144000000 = 448000 + 800000 + 14400000 = 15648000\`.

\`Var = 15648000 - 2160^2 = 15648000 - 4665600 = 10982400\`. Std ≈ 3314 tokens.

The mean is 2160. Ten percent of tickets are 12000 — more than 3 std-ish above a naive “typical” if you forgot the mix is discrete. If you provision only 2160, those loop tickets overflow. Finance wants 2160. On-call wants the 12000 path (or p95).

Zero-cost outcome with chance 0 still needs a row if you might hit it. A missing bucket silently understates the mean.

## A Friday ticket

Friday finance provisioned spend from \`E[cost] = 1.6\` units (the tryit). On-call spent the weekend on the 10% human path at 5 units. Mean and tail were both true. The dashboard had only the mean. They added \`std_tokens\`, \`p95_tokens\`, and \`fraction_human_path\` next to expected dollars. Same three-way mix, two audiences.

## Price a step

\`\`\`tryit python
import random

random.seed(2)

outcomes = [
    ("one_call", 0.70, 1.0),
    ("retry", 0.20, 2.0),
    ("human", 0.10, 5.0),
]

e_cost = sum(p * c for _, p, c in outcomes)
e_sq = sum(p * (c ** 2) for _, p, c in outcomes)
var = e_sq - e_cost ** 2
std = var ** 0.5

print("E[cost]", e_cost)
print("Var    ", round(var, 4), "std", round(std, 4))

price_per_unit = 0.002
print("E[dollars]", e_cost * price_per_unit)

def sample_cost():
    r = random.random()
    acc = 0.0
    for name, p, c in outcomes:
        acc += p
        if r <= acc:
            return c
    return outcomes[-1][2]

n = 8000
xs = [sample_cost() for _ in range(n)]
mean = sum(xs) / n
var_hat = sum((x - mean) ** 2 for x in xs) / n
print("simulated mean, var", round(mean, 4), round(var_hat, 4))
print("fraction over 3 units", sum(1 for x in xs if x > 3) / n)
\`\`\`

E[cost] is \`1.6\`. Var is \`1.44\`, std \`1.2\`. E[dollars] is \`0.0032\` (1.6 times 0.002). Simulated mean and var should land near 1.6 and 1.44. Fraction over 3 units should land near **0.10** (the human path). The simulation should match the closed form. If you provision only the expectation (~1.6), those 10% runs overflow.

The sampler walks a cumulative sum of chances — the same pattern as token sampling later. \`random.seed(2)\` makes the 8000 draws repeatable.

## What goes wrong

- **Budgeting only the mean:** the 10% path overflows. Log a high percentile.
- **Mean is not typical:** typical is often the **mode** (one cheap call). 3.5 is not a die face.
- **Multiplying means:** \`E[steps] * E[cost per step]\` underprices tickets where both are large together. Average **total** cost from traces.
- **Small n:** expected pass rate from 8 tickets is a noisy Bernoulli mean. Variance of a proportion is \`p(1-p)/n\`.
- **Empty mix:** chances that do not sum to 1. Assert unit sum before you quote E[X].

Production logs: mean, std, p95, n, and the rare-path rate. Assert chances sum to 1, costs ≥ 0, and that a fixture mix reproduces E and Var in closed form (the tryit). Quote mean **and** spread of pass/fail when T > 0.

## Nested loops

If each ticket is a sum of steps, linearity still gives \`E[sum of step costs] = sum of E[each step]\`. That is safer than multiplying means of counts and per-step costs. When in doubt, average **total** cost from traces.

When two designs have the same expected cost, pick the one with smaller variance unless you are deliberately buying a lottery ticket. A new tool with the same mean wait but 10× variance will dominate timeouts. That is a variance bug, not a mean bug — averaging dashboards hide it.

## How agents use this

Set \`max_steps\` and \`max_dollars\` from expectations **plus** a buffer scaled by observed std. Log both mean and std of tokens per tool.

- **Tokens:** mean tokens per ticket times price is expected dollars. Std of tokens tells you whether a single bill is a guess. A loop that resends the transcript raises **both** mean and variance.
- **Ranking:** expected recall@k is a Bernoulli mean over queries. Variance \`p(1-p)/n\` says how many questions you need.
- **Loss:** batch loss is a sample mean of per-example losses. Noisy batches are high-variance gradient estimates (optimization lesson). Smooth with a moving average.
- **Sampling:** each run is one draw. Quote the mean **and** the spread of pass/fail across seeds when temperature > 0. Unseeded T>0 makes “which prompt won?” a coin flip.

Evals: ship fewer claims on small n, or gather more tickets. Expected pass rate without a count is a poster. A production agent that logs only mean dollars will look healthy until the human path clusters on a Friday.

> **Tip:** When two designs have the same expected cost, pick the one with smaller variance unless you are deliberately buying a lottery ticket.

\`\`\`quiz
Expected cost of a random step is
- The most common cost
- The maximum cost
- *The sum of (chance of each outcome times its cost)
- Variance times standard deviation
explain: Expectation is a chance-weighted average. That is the number you multiply by price to get expected dollars.
\`\`\`
`,
  },
];
