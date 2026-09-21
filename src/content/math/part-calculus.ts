import type { RawLesson } from "@/lib/types";

export const mathCalculus: RawLesson[] = [
  {
    slug: "derivatives",
    title: "Derivatives",
    summary:
      "Slope is rise over run. A tiny nudge estimates the derivative — how loss or a knob reacts if you move a little.",
    minutes: 21,
    level: "intermediate",
    md: `
The **derivative** of a function \`f\` at a point \`x\` is the **slope** of the graph there: how much \`f\` changes if you move \`x\` a little, divided by the size of the move.

In words: rise over run, for a tiny run. For a line \`f(x) = mx + b\`, the derivative is the constant \`m\`. For \`f(x) = x^2\`, the derivative is \`2x\`: steep far from zero, flat at the bottom of the bowl. That is why gradient descent can crawl in a valley and fly on a wall.

You do not have to memorize a table to **use** derivatives in software. You can **estimate** them: pick a small \`h\`, compute \`(f(x+h) - f(x)) / h\`. That is a **forward difference**. A **central difference** \`(f(x+h) - f(x-h)) / (2h)\` is usually more accurate for the same \`h\`.

## A wrong picture

A wrong picture is: “the derivative is how important a feature is, globally.” It is a **local** slope at one point. At another point the slope can flip sign. A weight that is “important” on Monday’s batch can be flat on Tuesday’s. Sensitivity analysis with a nudge is useful; it is still local.

Another wrong picture is: “smaller \`h\` is always better.” If \`h\` is huge, you measure a chord across the continent, not the tangent. If \`h\` is tiny like \`1e-20\`, floating point rounds \`x+h\` back to \`x\` and you get 0 or noise. Values around \`1e-5\` are a reasonable start.

A third wrong picture is: “to minimize, move with the slope.” If \`f'(x) > 0\`, increasing \`x\` **increases** \`f\`. To **minimize** \`f\`, you move **against** the slope: \`x - step * f'(x)\`. That one line is gradient descent in 1-d.

## The formula in words

True derivative: the limit of rise/run as the run goes to 0. In code we sneak up on it with a small \`h\`.

Forward: \`[f(x+h) - f(x)] / h\`. Cheap (two evaluations if you already have \`f(x)\`). Biased a little to one side.

Central: \`[f(x+h) - f(x-h)] / (2h)\`. Two evaluations. Usually closer.

Sign: positive slope means the graph rises to the right. Downhill to the left. Negative slope: downhill to the right.

## A tiny example

\`f(x) = x^2\` at \`x = 3\`. True slope is \`2 * 3 = 6\`. Forward with \`h = 1\`: \`(16 - 9)/1 = 7\` — close-ish, not 6. Forward with \`h = 0.01\`: about 6.01. Central with \`h = 0.01\` is even closer to 6. At \`h = 1e-12\` floats get messy.

To minimize at this point: slope is +6, so decrease \`x\`. A step \`x - 0.1 * 6 = 2.4\`. \`f(2.4) = 5.76\`, less than \`f(3) = 9\`. Downhill worked.

\`\`\`viz plot
title Slope of y = x squared at x = 3
xlabel x
ylabel y
fn curve x**2 -0.5 4
mark 3,9 x=3
tangent 3,9,6
caption The solid curve is the function. The dashed line is the slope at x = 3. Downhill is left, against that slope.
\`\`\`

## Check a slope with a loop

When you later write a formula for a slope (or trust a library), **check it** against a tiny nudge on a few points. Mismatches mean a bug, not a philosophical fight.

\`\`\`tryit python
def f(x):
    return x * x

def forward_diff(f, x, h):
    return (f(x + h) - f(x)) / h

def central_diff(f, x, h):
    return (f(x + h) - f(x - h)) / (2 * h)

x = 3.0
analytic = 2 * x
print("true slope at 3 =", analytic)
for h in [1.0, 0.1, 0.01, 1e-4, 1e-6, 1e-12]:
    fd = forward_diff(f, x, h)
    cd = central_diff(f, x, h)
    print("h", h, "forward", round(fd, 6), "central", round(cd, 6))
\`\`\`

Watch forward differences approach 6, then get messy at \`1e-12\`. At \`h = 1\` forward is 7.0 and central is 6.0 (central is exact here because \`x^2\` is a nice parabola). At \`h = 0.1\` forward is 6.1. At \`h = 0.01\` forward is 6.01. Central stays on 6.0 until floats bite. The derivative is not a vibe. It is a limit you can sneak up on with a loop.

Sign matters. If \`f'(x) > 0\`, increasing \`x\` increases \`f\`. To **minimize** \`f\`, you move **against** the slope: \`x - step * f'(x)\`. We will run that after gradients in several variables.

A finite difference needs two (or more) runs of \`f\`. Never nudge a function that hits a paid API in a tight loop without a budget. For local knobs (temperature, cutoff), nudge on a **small** held-out set.

## How agents use this

Loss is a function of weights, prompts, even knobs. “If I raise temperature by 0.1, does eval score go up?” is a derivative of an eval function (noisy, but the same idea). Tiny nudges on a **small** eval set are how you sanity-check that a knob does what the dashboard claims.

A useful 1-d derivative is **cost with respect to max_steps**: add one allowed step, measure dollars and quality. If quality is flat and dollars rise, the slope says stop. You do not need a GPU to compute that from logs.

- **Tokens / dollars:** treat total tokens as \`f(max_steps)\` or \`f(temperature)\` on a fixed ticket set. Finite difference is two complete runs. Budget it.
- **Ranking:** “if I raise the cosine cutoff by 0.05, what happens to recall?” That is a slope of an eval, with a jump (cutoff is discrete-ish). Sweep a few cutoffs rather than a tiny \`h\`.
- **Loss:** training uses analytic slopes (next lessons). Finite differences **check** those slopes on a toy \`f\`. If analytic and numeric disagree, the training code is wrong.
- **Sampling:** temperature’s effect on pass rate is noisy. Average several seeds before you believe a slope. A single draw is not a derivative.

Do not confuse a derivative with a causal story about users. It is how **this function** responds to **this input** nearby. If you differentiate the wrong scalar, you will energetically optimize the wrong product.

> **Warning:** A finite difference needs two (or more) runs of \`f\`. Never nudge a function that hits a paid API in a tight loop without a budget.

\`\`\`quiz
To minimize f when f'(x) is positive, you should
- Increase x (move with the slope)
- *Decrease x (move against the slope)
- Set h to 0
- Multiply x by f'(x)
explain: Positive slope means the graph rises to the right. Downhill is to the left: x minus a step times the derivative.
\`\`\`
`,
  },
  {
    slug: "gradients",
    title: "Gradients",
    summary:
      "One slope per input, packed into a vector. That vector points uphill. Training steps the other way.",
    minutes: 21,
    level: "intermediate",
    md: `
When \`f\` depends on **several** inputs, there is one derivative per input: a **partial derivative**. Hold the other inputs still. The **gradient** is the vector of all partials.

The gradient at a point **points uphill**: the direction you should walk if you want \`f\` to increase as fast as possible, nearby. Steepest **descent** is the negative gradient. Training a network is: compute the gradient of **loss**, step the opposite way.

The length of the gradient is how steep that best direction is. Near a minimum it should be **near zero**. If it is huge, a fixed step size will overshoot. If it is tiny but loss is still bad, you may be on a flat.

## A wrong picture

A wrong picture is: “the gradient is the weights” or “the gradient is the data.” The gradient is a **vector of slopes**, one per weight (or per input you differentiated). It has the same length as the thing you are moving. It is not the thing itself.

Another wrong picture is: “we always follow the gradient.” We follow it to **maximize**. We follow **minus** the gradient to **minimize**. Flipping that sign is a common training bug. Loss goes up. People blame the learning rate. Check the sign on a two-variable bowl first.

A third wrong picture is: “if the gradient is small, we are done and the model is good.” Small gradient means a **flat** of whatever scalar you differentiated. If that scalar is not the loss you care about, you found a flat of the wrong hill. If loss is still high on a flat, you may be stuck, saturated, or measuring a constant.

## The formula in words

Partial of \`f\` with respect to \`x\`: treat \`y, z, ...\` as frozen numbers. Slope as in the last lesson.

Gradient: pack those partials into a list \`[df/dx, df/dy, ...]\`.

Uphill step: \`point + step * gradient\`. Downhill: \`point - step * gradient\`.

Numeric partial: nudge **one** coordinate, central difference, put the others back.

## A tiny example

Let \`f(x, y) = x^2 + y^2\`, a bowl touching zero at the origin. Then \`df/dx = 2x\` and \`df/dy = 2y\`, so the gradient is \`[2x, 2y]\`. At \`(1, 0)\` the gradient is \`[2, 0]\` — purely in the x direction, which matches the picture: you are on the x-axis wall.

At \`(1, 2)\`, \`f = 1+4 = 5\`, gradient \`[2, 4]\`. Downhill with step 0.1: subtract \`[0.2, 0.4]\` to get \`(0.8, 1.6)\`. New \`f = 0.64 + 2.56 = 3.2\`, which is less than 5. Uphill would go to \`(1.2, 2.4)\` and \`f\` would rise.

A model with a million weights has a million-dimensional gradient. You cannot plot it. You can still plot **loss vs step**, **gradient length vs step**, and a couple of coordinates. The definition did not change.

\`\`\`viz plot
title A 1-d slice of the bowl: f(x) = x squared
xlabel x
ylabel f(x)
fn bowl x**2 -2.2 2.2
mark 1,1 start
mark 0.8,0.64 downhill
mark 0,0 floor
caption At x=1 the slope is +2 so you step left. The dots walk toward the floor at 0.
\`\`\`

\`\`\`viz vecs
title Gradient points uphill; training goes the other way
vec 2,4 uphill 1
vec -2,-4 downhill 0
caption At (1, 2) the gradient is [2, 4]. Subtract a bit of that arrow to lower the bowl.
\`\`\`

## Partials by hand and by nudge

\`\`\`tryit python
def f(x, y):
    return x * x + y * y

def analytic_grad(x, y):
    return [2 * x, 2 * y]

def numeric_grad(x, y, h=1e-5):
    dfdx = (f(x + h, y) - f(x - h, y)) / (2 * h)
    dfdy = (f(x, y + h) - f(x, y - h)) / (2 * h)
    return [dfdx, dfdy]

def add(u, v):
    return [a + b for a, b in zip(u, v)]

def scale(k, v):
    return [k * a for a in v]

x, y = 1.0, 2.0
g = analytic_grad(x, y)
g_num = numeric_grad(x, y)
print("point", (x, y), "f", f(x, y))
print("formula grad", g)
print("nudge    grad", [round(t, 6) for t in g_num])

step = 0.1
x2, y2 = add([x, y], scale(-step, g))
print("after downhill", (x2, y2), "f", f(x2, y2))

x3, y3 = add([x, y], scale(step, g))
print("after uphill  ", (x3, y3), "f", f(x3, y3))
\`\`\`

Point \`(1, 2)\`, \`f = 5\`. Formula grad \`[2.0, 4.0]\`. Nudge grad should match to many decimals. After downhill: \`(0.8, 1.6)\` with \`f = 3.2\`. After uphill: \`(1.2, 2.4)\` with \`f = 7.2\`. Loss should drop after a downhill step and rise after uphill. If your training loop does the opposite, you flipped a sign. That bug is common and **visible** with a two-variable bowl before you touch real models.

If analytic and numeric disagree, you differentiated the wrong expression, or \`h\` is bad, or \`f\` is not smooth (a cutoff jump). Check \`f\` on paper first.

## Many dimensions

You cannot draw a million arrows. You can still **use** the vector as a direction. Gradient length near 0 plus loss still high: flat or dead units. Gradient length exploding: shrink the step, or clip the gradient vector’s magnitude (same clip idea: cap length, keep direction).

Agents that **search** over continuous knobs (cutoffs, temperatures) can use tiny nudges on a held-out eval. Discrete choices (which tool) do not have classical gradients; there you use scores, bandits, or just rules.

## How agents use this

Two gradients show up in agent work. First, **training**: if you fine-tune or train a ranker, you are following \`-grad(loss)\`. Second, **sensitivity**: which input feature, if nudged, changes the score most? That is a partial of the score with respect to features — a poor person’s explanation tool. If the partial with respect to “contains the word refund” dwarfs everything else, your classifier is a keyword detector in costume.

- **Tokens:** you rarely take a gradient through a whole LLM by hand. You still use partials on **your** scalar: dollars vs max tokens, pass rate vs cutoff.
- **Ranking:** a linear scorer \`s = w · embed\` has gradient \`embed\` with respect to \`w\`. Training the scorer is this lesson plus a loss.
- **Loss:** the gradient is steepest ascent of **whatever scalar you differentiated**. If that scalar is not the loss you care about, you will energetically optimize the wrong product. Latency not in the loss means latency will not be optimized.
- **Sampling:** discrete draws do not have a classical gradient. People use tricks (REINFORCE, straight-through) outside this track. For agents, log the chance of the chosen tool instead of pretending the draw was a slope.

The gradient is a vector. Treat it like the vectors lesson: print its length, check dimension matches the weights, do not mix two models’ gradients.

> **Note:** The gradient is steepest ascent of whatever scalar you differentiated. If that scalar is not the loss you care about, you will energetically optimize the wrong product.

\`\`\`quiz
The gradient of a scalar function f is
- A single slope that ignores all but one variable
- *The vector of partial derivatives; it points toward steepest increase of f
- Always the zero vector
- A matrix-vector product with no meaning
explain: Each partial is one component. Together they form the uphill direction; descent uses the negative.
\`\`\`
`,
  },
  {
    slug: "chain-rule",
    title: "The Chain Rule",
    summary:
      "Nested functions multiply their slopes. That identity is backpropagation in one paragraph — and nested agent costs too.",
    minutes: 21,
    level: "intermediate",
    md: `
Most interesting functions are **pipelines**. \`y = f(g(x))\`. The **chain rule** says the slope of the outer function is the product of slopes along the path:

\`dy/dx = df/du * du/dx\`

where \`u = g(x)\`. If there are more nests, keep multiplying (and, with several paths, adding).

This is **backpropagation**. A deep net is a chain of maps: linear, ReLU, linear, softmax, loss. The derivative of loss with respect to an early weight is a product of many local derivatives. You compute it from the **output backward** because each local derivative is easy, and you reuse middle results. Forward: compute the numbers. Backward: multiply the slopes.

(Transformer internals: that chain is long. You do not need the blocks. You need the product.)

## A wrong picture

A wrong picture is: “backprop is a special ML trick unrelated to calculus.” It **is** the chain rule, implemented carefully. Libraries save the forward values so the backward multiply is cheap.

Another wrong picture is: “if the last layer has a slope, every weight gets a useful signal.” If any local derivative is 0 (a dead ReLU, a hard cutoff), the product is 0 and that weight **gets no signal**. A tool that is never called has local derivative zero with respect to that tool’s prompt: changing the prompt cannot affect a loss that never saw the tool.

A third wrong picture is ignoring **several paths**. If \`x\` is used twice, say \`y = x * x\`, then two paths contribute and you **add** the two products. Forgetting to add (overwriting) is a bug that looks like “half the gradient.”

Exploding and vanishing: if each factor is 2 and you have 40 layers, the product explodes. If each factor is 0.5, it vanishes. Those names are this product getting huge or tiny.

## The formula in words

Outer slope times inner slope. More boxes: more factors. Split and rejoin: **add** the incoming backward slopes.

Tiny numeric. Let \`g(x) = 3x + 1\` and \`f(u) = u^2\`, so \`y = (3x + 1)^2\`. Then \`df/du = 2u\` and \`dg/dx = 3\`, hence \`dy/dx = 2(3x+1)*3\`. At \`x = 2\`, \`u = 7\`, \`y = 49\`, slope \`2*7*3 = 42\`.

A tiny nudge: \`h = 1e-5\`, central difference on \`y\` should land on 42.

If \`y\` is a loss and \`w\` is the 3 in \`g\`, then \`du/dw = x = 2\`, so \`dy/dw = 2u * x = 14 * 2 = 28\`. Step \`w\` opposite that number to reduce \`y\`.

\`\`\`viz flow
title Nested maps: g then f
layout lr
node x x
node g g: 3x plus 1
node f f: u squared
node y y
edge x g
edge g f u
edge f y
caption x goes through g then f. The slope of y vs x is the product of the two local slopes.
\`\`\`

## Check a nest two ways

\`\`\`tryit python
def g(x):
    return 3 * x + 1

def f(u):
    return u * u

def y(x):
    return f(g(x))

x = 2.0
u = g(x)
dydx_chain = (2 * u) * 3

h = 1e-5
dydx_num = (y(x + h) - y(x - h)) / (2 * h)

print("x", x, "u=g(x)", u, "y", y(x))
print("chain rule dy/dx", dydx_chain)
print("nudge      dy/dx", dydx_num)

w, b = 3.0, 1.0
u = w * x + b
y_out = u * u
dy_du = 2 * u
du_dx = w
du_dw = x
dy_dx = dy_du * du_dx
dy_dw = dy_du * du_dw
print("backprop dy/dx", dy_dx, "dy/dw", dy_dw)
\`\`\`

You should see \`u=7\`, \`y=49\`, chain rule \`42\`, nudge about \`42.0\`. Backprop prints \`dy/dx 42.0\` and \`dy/dw 28.0\`. The last block is the spirit of autodiff: during the forward pass you remember \`u\` and \`x\`; going backward you multiply by the local slope. \`dy/dw\` tells you how to update the weight \`w\` if \`y\` were a loss (you would step opposite that number).

If the two \`dy/dx\` lines disagree, you mis-multiplied. If they agree, you are allowed to trust the chain on a longer pipeline — still check a numeric nudge on a **small** net when you write custom backward code.

## Several paths and zeros

\`y = x * x\` is two uses of \`x\`. Each path contributes \`x\` (because d(uv)/dx along one factor holding the other is the other factor). Sum: \`2x\`, which you already know. Frameworks sum gradients into the same tensor.

Hard cutoff: \`y = 1 if u >= 0.35 else 0\`. Local slope is 0 almost everywhere. A retrieval cutoff **blocks** gradient from the generator back to the embedder if you trained them as one pipe. In agents, that is often fine: you train retriever and generator **separately**, with their own scalars.

When people say “the loss doesn’t include latency, so the model will not optimize latency,” they are saying there is **no path** in the chain from latency to the scalar that training differentiates. Add a term, or don’t be surprised.

## How agents use this

You rarely hand-write backprop for a transformer. You still use the chain rule **in your head** when an agent’s metric is nested: dollars depend on tokens, tokens depend on steps, steps depend on a retry policy. A change in retry chance ripples through the product of local slopes. If you want less spend, you must change something that actually has a nonzero path to spend — a tool that is never called has local derivative zero with respect to that tool’s prompt.

- **Tokens:** \`d(dollars)/d(max_steps)\` is \`d(dollars)/d(tokens) * d(tokens)/d(max_steps)\`. Price is the first factor. The second is “does allowing another step actually add tokens on this ticket set?” If agents already stop early, the second factor is near 0.
- **Ranking:** retrieval cutoff is a jump. There is no useful classical slope through “did the gold chunk make top-k.” Eval the retriever with recall@k **directly**.
- **Loss:** training works because every weight has a path to the scalar. If you detach a tensor (stop the chain), those weights freeze. That is a switch, not a mystery.
- **Sampling:** a hard sample (one token id) is another jump. The **chance** of that token still has a slope (cross-entropy). That is why we train on log-chances, not on the random draw.

Draw the boxes. Arrows forward for values, arrows backward for slopes. If you cannot draw it, you cannot debug it. Nested agent costs are the same drawing with “retry,” “tokens,” and “dollars” as boxes.

> **Tip:** Draw the boxes. Arrows forward for values, arrows backward for slopes. If you cannot draw it, you cannot debug it.

\`\`\`quiz
Backpropagation is
- A way to sample tokens with temperature
- *The chain rule applied from the loss backward through nested maps
- Deleting gradients only to save memory
- Adding a bias vector
explain: Local derivatives multiply (and add on merged paths). Computing them from the output backward is backprop.
\`\`\`
`,
  },
  {
    slug: "optimization",
    title: "Optimization",
    summary:
      "Gradient descent follows the negative gradient. Minimize a 2-variable bowl the way training minimizes loss — and watch the step size.",
    minutes: 22,
    level: "intermediate",
    md: `
**Optimization** means pick weights to make a scalar **as small as possible** (or as large — then flip the sign). Training is optimization of a **loss**. Many agent knobs are optimization too: find a cutoff that maximizes F1 on a dev set.

**Gradient descent** is the algorithm: start at \`x\`, compute \`g = grad f(x)\`, set \`x ← x - lr * g\`. The **learning rate** \`lr\` is the step size. Too large, you bounce. Too small, you crawl. **Gradient ascent** drops the minus and is used when you maximize.

A **local minimum** is a valley that may not be the deepest on Earth. For the convex bowl below, local is global. For real nets, you settle for a good valley and **evals**, not for a philosophical minimum.

## A wrong picture

A wrong picture is: “more steps always better.” After a point you overfit (eval-scores, ML track). Infinite descent is a bill. Stop when the gradient is small, when \`f\` stops improving, or when you hit a step budget — the same three families as **agent stop conditions** (success, plateau, max steps).

Another wrong picture is: “the optimizer shares my unstated values.” The optimizer is loyal to the **scalar**, not to citations, not to latency, not to “be nice.” Agents that **self-improve** by hill-climbing “shorter answers” will cut citations. Choose \`f\` as carefully as you choose a loss.

A third wrong picture is: “a huge learning rate is faster.” On a bowl, too-large \`lr\` **increases** \`f\`. Same gradient, different step. Most “training is unstable” bugs in small models are this diagram. Also: optimizing pass-rate on 20 hand-picked tickets overfits as surely as 10,000 epochs on 20 images. Hold out evals.

## The formula in words

Repeat: measure gradient of \`f\` at the current point. Subtract learning-rate times that vector. That is one step.

Tiny numeric. \`f(x, y) = (x - 2)^2 + (y + 1)^2\`. Floor at \`(2, -1)\` where \`f = 0\`. Gradient \`[2(x-2), 2(y+1)]\`. Start \`(0, 0)\`, \`f = 4+1 = 5\`, gradient \`[-4, 2]\`. The update is **minus** learning-rate times gradient: minus \`0.2 * [-4, 2]\` = minus \`[-0.8, 0.4]\` = add \`[0.8, -0.4]\`. New point \`(0.8, -0.4)\`. Closer to \`(2, -1)\`. \`f\` drops.

With \`lr = 1.1\` on this bowl you can jump **over** the floor and climb the other wall. Print \`f\` and watch it fail to fall.

## Moving parts

| Piece | Role |
|---|---|
| \`f\` | The scalar you minimize (loss, or 1 minus F1). |
| \`x\` | The current point (weights, or a cutoff). |
| \`g\` | Gradient of f at x. Points uphill. |
| \`lr\` | Step size. Too big: bounce. Too small: crawl. |
| Stop | Small gradient, plateau of f, or step budget. |

Descent is \`x ← x - lr * g\`. Drop the minus and you **ascend**. That sign bug is common.

## A second walkthrough (one dimension)

\`f(x) = (x - 3)^2\`. True slope \`f' = 2(x-3)\`. Start at \`x = 0\`, \`f = 9\`, slope \`-6\`.

Step with \`lr = 0.25\`: \`x ← 0 - 0.25 * (-6) = 1.5\`. New \`f = (1.5-3)^2 = 2.25\`. Down.

Next slope \`2(1.5-3) = -3\`. \`x ← 1.5 - 0.25*(-3) = 2.25\`. \`f = 0.5625\`. Toward 3.

Same start, \`lr = 1.1\`: \`x ← 0 - 1.1*(-6) = 6.6\`. \`f = (6.6-3)^2 = 12.96\`. **Up.** Same gradient, different step. Most “training is unstable” bugs on a toy bowl are this diagram.

\`\`\`viz plot
title Descent on (x-3) squared with lr=0.25
xlabel x
ylabel f(x)
fn bowl (x-3)**2 -1 7
mark 0,9 start
mark 1.5,2.25 step1
mark 2.25,0.5625 step2
mark 3,0 floor
caption Start at 0 and walk toward 3. Each orange dot is one minus-gradient step. A huge lr would jump past the floor.
\`\`\`

Stop when \`|g|\` is tiny and f is near 0 (here, you reached the floor). Stop when f plateaus even if g is noisy (batches). Stop at a step budget so infinite descent is not an infinite bill.

## A Friday ticket

Friday they “optimized” \`max_steps\` by hill-climbing pass-rate on **20** golden tickets. Pass-rate hit 100% after the agent learned to skip search (shorter traces still passed those 20). Monday’s held-out tickets needed search. Pass-rate fell. Same loop as 10,000 epochs on 20 images.

The scalar was wrong for the product, and the set was too small. They froze a held-out eval, put a step budget on the search, and stopped treating 20 goldens as the world.

## Descend a bowl

\`\`\`tryit python
def f(x, y):
    return (x - 2) ** 2 + (y + 1) ** 2

def grad(x, y):
    return [2 * (x - 2), 2 * (y + 1)]

def add(u, v):
    return [a + b for a, b in zip(u, v)]

def scale(k, v):
    return [k * a for a in v]

x, y = 0.0, 0.0
lr = 0.2
print("step   x       y       f")
for t in range(12):
    print(t, round(x, 3), round(y, 3), round(f(x, y), 4))
    g = grad(x, y)
    x, y = add([x, y], scale(-lr, g))
print("true minimum at (2, -1)")

x, y = 0.0, 0.0
lr_bad = 1.1
print("bad lr f values:")
for t in range(6):
    print(round(f(x, y), 3))
    g = grad(x, y)
    x, y = add([x, y], scale(-lr_bad, g))
\`\`\`

With \`lr = 0.2\` the values walk toward \`(2, -1)\` and \`f\` drops: start \`f = 5\`, then about 1.8, 0.65, 0.23, … approaching 0. \`x\` climbs toward 2, \`y\` falls toward -1. With clumsy \`lr = 1.1\`, \`f\` can jump (watch the second table). Same gradient, different step.

If your print grows instead of shrinks on the first loop, you dropped the minus. That is the sign bug again.

## What goes wrong

- **Sign:** adding \`lr * g\` when you meant to minimize. f rises. People blame the learning rate. Print f after one step on a bowl first.
- **Huge lr:** f jumps. On this bowl, 1.1 already fails. Clip lr, or clip the gradient’s length (keep direction, cap magnitude).
- **Tiny lr:** crawl. Looks like “not training.” Check that f **does** drop, just slowly.
- **Wrong scalar:** shorter-answer ascent cuts citations. Latency not in f will not fall. Choose f as carefully as a loss.
- **No holdout:** optimizing pass-rate on 20 tickets overfits. Same geometry as memorizing 20 images.

Production logs: \`f\`, gradient length, \`lr\`, step index, and a held-out scalar that is **not** the training f. Assert f is finite, g has the same dimension as x, and that one downhill step on a fixture bowl lowers f. Stop conditions should match agents: success (small g / good f), plateau, max steps.

## Stopping, batches, schedules

Stop when the gradient is small, when \`f\` plateaus, or at a step budget.

Stochastic gradient descent replaces \`f\` with a **batch** estimate. The direction is noisy; you still go downhill **on average**. That noise is why you log smoothed loss, not only the last mini-batch. A moving average (sums lesson) is the smoother.

You can **schedule** the learning rate: start larger to make progress, shrink later to settle. Momentum methods add a fraction of the previous step so you do not zigzag in a ravine. For this academy, master the minus-gradient update first; fancy variants are the same geometry with extra memory.

Discrete search (which prompt, which tool set) is **not** this loop. There is no honest gradient. Use eval scores, not backprop. Still optimization: you pick the option with the best scalar on a held-out set.

## How agents use this

You will not train GPT from this page. You will train **small** things: a linear scorer on embeddings, a calibrated cutoff, maybe a prompt via discrete search (not slope-based — use eval, not backprop). When a vendor fine-tunes, their loop is this loop plus automatic gradients.

- **Tokens:** \`max_tokens\` and \`max_steps\` are budgets, not learning rates. Do not “descend” them without measuring quality. A tiny eval finite-difference (derivatives lesson) is the honest slope.
- **Ranking:** train a projection or a linear ranker with descent on a pairwise or softmax loss. Then **freeze** and retrieve. Re-index after weights move.
- **Loss:** the scalar is the product. If you add a length penalty, answers get shorter. If you only optimize training loss, held-out perplexity can still jump (cross-entropy lesson).
- **Sampling:** greedy decoding is argmax, not descent. Temperature is a knob you can **search** with evals. Do not backprop through production sampling without a research setup.

Log \`f\` and \`|g|\` every step on anything you actually descend. If \`|g|\` explodes, shrink lr or clip. If \`|g|\` is tiny and held-out f is still bad, you are on a flat of the wrong hill — or you overfit the 20 goldens.

Agents that **self-improve** by hill-climbing a metric on stored traces are doing ascent on that metric. If the metric is “shorter answers,” they will cut citations. Choose \`f\` as carefully as you choose a loss. Hold out evals. Twenty golden tickets are not a world.

> **Warning:** Optimizing pass-rate on 20 hand-picked tickets overfits as surely as 10,000 epochs on 20 images. Hold out evals.

\`\`\`quiz
Gradient descent updates weights by
- Adding the gradient times the learning rate
- *Subtracting the gradient times the learning rate
- Setting all weights to zero
- Multiplying weights by entropy
explain: The gradient points uphill. Minimizing a loss means stepping the opposite way, scaled by the learning rate.
\`\`\`
`,
  },
];
