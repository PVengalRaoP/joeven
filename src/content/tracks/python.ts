import type { TrackSource } from "@/lib/types";

export const python: TrackSource = {
  slug: "python",
  title: "Python",
  short: "Python",
  tagline: "The language of agents: syntax, data, functions, OOP, typing, HTTP, async, tests.",
  color: "#3776AB",
  order: 2,
  lessons: [
    {
      slug: "intro",
      title: "Why Python for Agents",
      summary: "Why agent stacks are written in Python, how print and comments work, and how Joeven runs code in the browser.",
      minutes: 10,
      level: "beginner",
      md: `
Python is the default language of autonomous agents. Not because it is the fastest language, and not because models can only emit Python — they can emit anything. Python wins because the rest of the stack already lives here: HTTP clients, JSON, tests, files, data tools, and every major model SDK.

When an agent calls a **tool**, that tool is almost always a Python function. When you log a **trace**, you serialize a dict. When you decide the goal is done, you write a predicate. This track teaches those primitives until they feel boring. Boring is what you want. Agents fail on types, slices, and bad JSON — not on mysterious genius.

Joeven runs Python in your browser with [Pyodide](https://pyodide.org). There is no server and no \`pip\`. Use the **standard library**. Output appears because you \`print()\`.

## What this page covers

- Why teams pick Python for orchestration
- How a program is a list of statements
- \`print\` as your first observability tool
- Comments, and what belongs in them

## A program is statements in order

Python reads from top to bottom. A **statement** is an instruction: assign a name, call a function, print a value. Blank lines are ignored. Indentation will matter later (blocks). For now, keep every statement at the left edge.

\`print\` writes text to standard output. In Joeven that is the Try it yourself panel. In production you will replace prints with structured logs. The habit is the same: make the hidden visible.

\`\`\`python
print("hello")
print("step", 1)
\`\`\`

You can pass several values. Python inserts a space between them and ends with a newline.

## Comments

A comment starts with \`#\` and runs to the end of the line. The interpreter skips it. Use comments for *why*, not for restating the code.

\`\`\`python
budget = 8  # remaining model calls this turn
# Do not log API keys. Ever.
\`\`\`

> **Warning:** Comments are not security. A comment that says “do not send secrets” does not stop a model from doing it. Guardrails belong in code.

## Try a first script

### The editor loop

This script already has the shape of an agent log: state a goal, then emit what happened.

\`\`\`tryit python
# A first agent-shaped script: say what you are doing, then do it.
goal = "greet the operator"
print("Goal:", goal)       # observation-style log
print("Hello, Joeven")     # an action
print("Done")
\`\`\`

Change the strings and click **Run**. That is the whole editor loop: edit, run, read the output, edit again.

## Why not JavaScript, Go, or Rust?

You can build agents in any language. Python is the lingua franca because:

| Need | Why Python |
|---|---|
| Tools | Functions + dict arguments map cleanly to JSON tool calls |
| Vendors | OpenAI, Anthropic, Google, local runtimes all ship Python SDKs first |
| Data | JSON, CSV, embeddings, and evaluation sets are trivial to load |
| Tests | \`pytest\` culture — agents without tests are demos |
| Teaching | Readable syntax, huge standard library |

Joeven still runs in the browser, so these lessons stay on the **stdlib**. Later, on your machine, you will add packages. The language does not change.

## Running code on your machine (preview)

On a real computer you save a file such as \`hello.py\` and run \`python hello.py\`. Joeven’s editor is that file, plus an output pane. Same language, smaller sandbox: no network, no \`pip\`, no files unless you simulate them.

> **Tip:** If a Try it box looks empty, you forgot \`print\`. Python computed the value and threw it away.

## Agent connection

An agent is a loop that prints (or logs) every thought, tool call, and observation. If you cannot see what happened, you cannot debug it. Treat \`print\` as a tiny tracer. In later lessons you will store the same information in a list called a **transcript** — but the first skill is still: make the program talk.

\`\`\`quiz
How does output appear in Joeven’s Python editor?
- The last expression is always shown automatically
- *You call print(), and that text is the output
- Joeven emails the result to you
- Only errors are displayed
explain: Pyodide runs your script; print() writes to the output panel. Unused values are discarded.
\`\`\`
`,
    },
    {
      slug: "variables",
      title: "Variables and Names",
      summary: "Assignment, snake_case names, reassignment, and unpacking — the labels an agent hangs on its state.",
      minutes: 9,
      level: "beginner",
      md: `
A **variable** is a name bound to a value. Python does not declare types at the name. You write \`name = value\` and the name now refers to that object.

Agents are full of names: \`goal\`, \`step\`, \`trace\`, \`model\`, \`budget\`. Bad names make the loop unreadable. Good names make the policy obvious.

## Assignment

The \`=\` sign is **not** mathematics. It means “bind this name to this object.”

\`\`\`python
agent_name = "atlas"
step = 0
step = step + 1
\`\`\`

The third line reads the old \`step\`, adds one, and binds \`step\` to the new integer. Integers are immutable; you are not changing \`0\` in place. You are pointing the name at \`1\`.

## Naming rules

Python names:

- Start with a letter or underscore
- Contain letters, digits, and underscores
- Are case-sensitive: \`Goal\` and \`goal\` are different
- Must not be keywords (\`if\`, \`for\`, \`class\`, \`return\`, …)

By convention (see [PEP 8](https://peps.python.org/pep-0008/)), variables and functions use **snake_case**: lowercase words joined by underscores.

| Kind | Convention | Example |
|---|---|---|
| Variable | snake_case | \`max_steps\` |
| Function | snake_case | \`call_tool\` |
| Constant | UPPER_SNAKE | \`DEFAULT_BUDGET\` |
| Class | CapWords | \`AgentLoop\` |

> **Tip:** Name the thing, not the type. Prefer \`transcript\` over \`my_list\`. Six months from now you will thank yourself.

## Multiple assignment and swapping

Python can bind several names at once:

\`\`\`python
role, content = "user", "book a flight"
left, right = right, left  # swap — after both names exist
\`\`\`

The right-hand side is fully evaluated first, then names are bound. That is why swapping works without a temporary variable.

## Names are labels, not boxes

Several names can refer to the **same** object. That matters later for lists (mutating through one name is visible through the other). For numbers and strings you will rarely notice, because those objects cannot be changed in place.

\`\`\`tryit python
agent_name = "atlas"
step_count = 0
step_count = step_count + 1
max_steps = 8
print(agent_name, step_count, max_steps)

first, second = "think", "act"
print(first, "then", second)

DEFAULT_BUDGET = 16
print("constant-style name:", DEFAULT_BUDGET)

# Two names, one string object
label = agent_name
print(label)
\`\`\`

## Rebinding vs mutating

### Labels on the same object

Integers and strings are immutable, so \`step += 1\` *rebinds* the name. Lists are mutable, so \`trace.append(x)\` changes the object that every name pointing at that list can see. Agents mix both: the step counter is rebound; the transcript is mutated. If you pass \`trace\` into a function and that function appends, your caller’s list grows. That is usually what you want for memory. It is disastrous if two users share one global list.

## Common mistakes

- **Typo names.** \`max_step\` vs \`max_steps\` creates a *new* variable. You do not get a compiler error. You get a logic bug. Print your state.
- **Using a name before assignment.** Python raises \`NameError\`. Initialize counters to \`0\` and lists to \`[]\` before the loop.
- **Keywords as names.** \`class = "Agent"\` is a \`SyntaxError\`. Use \`cls\` or \`agent_class\`.
- **Unpacking length mismatch.** \`a, b = ["think"]\` raises \`ValueError\`. The number of names must match the number of values, unless you use starred unpacking (\`first, *rest = row\`).

## Agent connection

The agent loop is a handful of variables updated every turn: \`messages\`, \`step\`, \`budget_used\`, \`last_observation\`. If those names are vague (\`data\`, \`tmp\`, \`x\`), you will not be able to read a trace at 2 a.m. Pick names that match the textbook loop: goal, observation, action, result.

\`\`\`quiz
Which name follows usual Python style for a variable?
- MaxSteps
- *max_steps
- max-steps
- maxSteps
explain: PEP 8 uses snake_case for variables and functions. Hyphens are subtraction, not name characters.
\`\`\`
`,
    },
    {
      slug: "types",
      title: "Types: int, float, str, bool, None",
      summary: "The five values you will see constantly, type(), and converting between types without lying to yourself.",
      minutes: 10,
      level: "beginner",
      md: `
Every value in Python has a **type**. The type decides what you can do with it: add it, index it, call it, or serialize it to JSON.

Agents live on a small set of types. Tool arguments arrive as JSON, which becomes \`dict\`, \`list\`, \`str\`, \`int\`, \`float\`, \`bool\`, or \`None\`. If you do not know which one you have, you will write \`if result:\` and be surprised.

## The core types

| Type | Examples | Typical agent use |
|---|---|---|
| \`int\` | \`0\`, \`8\`, \`-1\` | step counts, token counts |
| \`float\` | \`0.002\`, \`3.14\` | prices, temperatures |
| \`str\` | \`"search"\`, \`""\` | prompts, names, JSON text |
| \`bool\` | \`True\`, \`False\` | flags, goal predicates |
| \`None\` | \`None\` | missing error, no result yet |

\`True\`, \`False\`, and \`None\` are **literals**. They are not strings. \`"True"\` is a string of four characters.

## type()

\`type(x)\` returns the type object. Print it when you are confused. In real code you more often use \`isinstance(x, int)\` because it plays nicely with inheritance.

\`\`\`python
print(type(128))     # <class 'int'>
print(type(0.5))     # <class 'float'>
print(type("hi"))    # <class 'str'>
print(type(True))    # <class 'bool'>
print(type(None))    # <class 'NoneType'>
\`\`\`

## Conversion (casting)

Constructors convert when the conversion is defined:

- \`int("42")\` → \`42\`
- \`float("3.5")\` → \`3.5\`
- \`str(7)\` → \`"7"\`
- \`bool(0)\` → \`False\`, \`bool(1)\` → \`True\`

\`int("3.5")\` fails. Trim the string first, or go through \`float\`. \`int(3.9)\` **truncates toward zero**, it does not round.

\`\`\`tryit python
tokens = 128
cost = 0.002
model = "local-demo"
ready = True
error = None

print(type(tokens), type(cost), type(model), type(ready), type(error))
print(isinstance(tokens, int))

print(int("42"), float("3.5"), str(7), bool(0), bool("False"))

# Truncation vs rounding
print("int(3.9) =", int(3.9))
print("round(3.9) =", round(3.9))

# A JSON-like payload after parsing
payload = {"k": 3, "q": "weather"}
print(type(payload), type(payload["k"]), type(payload["q"]))
\`\`\`

Notice \`bool("False")\` is **True**. A non-empty string is truthy. Convert flags explicitly: compare to \`True\`, or parse \`"true"\` yourself.

## Dynamic typing

A name can be rebound to a different type:

\`\`\`python
n = 3
n = "three"
\`\`\`

Legal, and usually a mistake. Later we add **type hints** so tools and editors can catch this. The runtime will still let you do it.

## isinstance at the door

### Check JSON at the wrapper

\`type(x) is int\` fails for subclasses and is brittle. \`isinstance(x, int)\` is the usual check. JSON numbers that look like integers become \`int\`; numbers with a decimal become \`float\`. A tool argument \`"8"\` is still a \`str\` until you convert it. Decide *one* place — the tool wrapper — that coerces and rejects, so the rest of the loop can assume \`k\` is an \`int\`.

Booleans are a subclass of \`int\` in Python (\`True == 1\`). Prefer \`is True\` / \`is False\` when a JSON field must be a real flag, not a count.

> **Note:** JSON has \`null\`; Python has \`None\`. After \`json.loads\`, missing data is \`None\`, not the string \`"null"\`. Empty JSON \`""\` is a string, not None. Those three — missing, null, blank — show up constantly in tool results.

## Agent connection

Tool schemas are types. If the model passes \`"3"\` (a string) where your function expects an \`int\`, \`range(k)\` may still work in surprising ways or throw. Validate and convert at the tool boundary: one place, loud errors, no silent coercion in the middle of the loop.

\`\`\`quiz
What is bool("False") in Python?
- False, because the text says false
- *True, because a non-empty string is truthy
- None
- A TypeError
explain: bool(x) is about emptiness, not English. Non-empty strings are True. Parse flags with explicit comparisons.
\`\`\`
`,
    },
    {
      slug: "strings",
      title: "Strings",
      summary: "Indexing, slicing, f-strings, split/join/strip — how agents chew on text from models and tools.",
      minutes: 12,
      level: "beginner",
      md: `
A **string** (\`str\`) is an immutable sequence of Unicode characters. Almost everything an LLM touches is a string: the prompt, the tool name, the JSON blob, the observation you stuff back into context.

If you can slice, split, strip, and format strings, you can debug half of production agent failures.

## Quotes and escapes

Single or double quotes both work. Use the other kind inside the string, or escape with a backslash. Triple quotes make multi-line strings — useful for prompts.

\`\`\`python
tool = "search"
line = 'He said "stop"'
prompt = """You are a careful agent.
Call tools only when needed."""
\`\`\`

## Index and slice

Characters are numbered from **0**. Negative indexes count from the end: \`-1\` is the last character.

A **slice** \`s[start:stop]\` is the half-open interval \`[start, stop)\`. Omit \`start\` to mean 0. Omit \`stop\` to mean the end.

\`\`\`python
s = "Action"
print(s[0])      # A
print(s[-1])     # n
print(s[0:3])    # Act
print(s[:3])     # Act
print(s[3:])     # ion
\`\`\`

Strings cannot be mutated. \`s[0] = "a"\` raises \`TypeError\`. Build a new string instead.

## f-strings

An **f-string** interpolates expressions inside braces:

\`\`\`python
name = "search"
q = "nyc"
print(f"Calling {name}({q})")
print(f"{2 + 2=}")
\`\`\`

This is how you build log lines and, carefully, prompts. Do not assemble JSON with f-strings if the values might contain quotes — use the \`json\` module (later lesson).

## split, join, strip

| Method | Role |
|---|---|
| \`s.strip()\` | Remove leading/trailing whitespace |
| \`s.split()\` | Break on whitespace into a list |
| \`s.split(",")\` | Break on a delimiter |
| \`",".join(parts)\` | Glue a list of strings |
| \`s.lower()\` / \`s.upper()\` | Case fold |
| \`s.replace(a, b)\` | Copy with substitutions |
| \`s.startswith(p)\` | Prefix test |

\`join\` is a **string** method. You write the glue first: \`" | ".join(parts)\`.

\`\`\`tryit python
trace = "Thought: search. Action: search[weather nyc]"
print(trace[:8])
print(trace[9:15])
print(trace[-10:])

tool = "search"
city = "nyc"
print(f"Calling {tool}({city})")

parts = trace.split()
print(parts)
print(" | ".join(parts[:3]))
print("  search  ".strip())
print(trace.lower().startswith("thought"))

# Immutable: concatenation builds a new string
base = "obs:"
print(base + " rain")
\`\`\`

## Length, \`in\`, and prompts

### Context budgets are string budgets

\`len(s)\` is the number of characters, not bytes. For a context budget you often care about characters *or* tokens; characters are the cheap proxy. \`"error" in log.lower()\` is the simplest classifier you will ever write. It is also how you accidentally match \`terror\` — add spaces or use regex later if that matters.

Multi-line strings (triple quotes) are the usual way to store a **system prompt** in code. Keep the prompt next to the loop, or load it from a file on a real machine. Either way it is still a \`str\` you concatenate with the transcript.

\`s[start:stop:step]\` can skip characters (\`s[::2]\`) or reverse (\`s[::-1]\`). Reversing a prompt is a party trick. Slicing the last 4,000 characters of a log is an actual memory policy.

## Common mistakes

- **Off-by-one slices.** \`s[0:4]\` is four characters, indexes 0,1,2,3.
- **Splitting JSON by hand.** \`split\` is for simple logs, not nested objects.
- **Forgetting \`strip\`.** Model output often has trailing newlines. Compare after \`strip()\`.
- **Formatting JSON with f-strings.** Quotes inside user text will break the object. Use \`json.dumps\`.

> **Tip:** Prefer \`in\` for substring tests: \`"error" in text.lower()\`. Use regex only when \`in\`, \`split\`, and \`startswith\` are not enough.

## Agent connection

Observations arrive as messy text. Before you feed them back to the model, normalize: strip, maybe truncate to a character budget, maybe keep only the last *n* lines of a log. String slicing is your first **context compression** tool. Later tracks replace ad-hoc slices with proper memory policies — the underlying type is still \`str\`.

\`\`\`quiz
What does "abcdef"[1:4] return?
- "abcd"
- *"bcd"
- "bcde"
- "abcdef"
explain: Slices are half-open. Indexes 1, 2, 3 are the characters b, c, d.
\`\`\`
`,
    },
    {
      slug: "numbers",
      title: "Numbers and Arithmetic",
      summary: "int vs float, operators, integer division, modulo, rounding, and counting tokens and cost.",
      minutes: 9,
      level: "beginner",
      md: `
Agents count. They count **steps**, **tokens**, **retries**, and **dollars**. Getting the arithmetic wrong is how you loop until the bill arrives.

Python has two everyday numeric types: \`int\` (unlimited size) and \`float\` (IEEE 754 binary floating point). Use \`int\` for counters. Use \`float\` for measurements and money *displayed* in dollars — or better, count **integer cents** if you need exact cash.

## Operators

| Op | Meaning | Example |
|---|---|---|
| \`+\` \`-\` \`*\` | Add, subtract, multiply | \`3 * 4\` |
| \`/\` | True division, always \`float\` | \`7 / 2\` → \`3.5\` |
| \`//\` | Floor division | \`7 // 2\` → \`3\` |
| \`%\` | Remainder (modulo) | \`7 % 2\` → \`1\` |
| \`**\` | Power | \`2 ** 10\` → \`1024\` |

\`/\` on two ints still returns a float. If you wanted a whole number of pages or batches, use \`//\`.

## Precedence

Power binds first, then unary minus, then multiply/divide, then add/subtract. Use parentheses when you have to think. Cost formulas should look like the comment next to them, not like a puzzle.

\`\`\`python
cost = (prompt_tokens / 1000) * price_in + (completion_tokens / 1000) * price_out
\`\`\`

## round and int

\`round(x, n)\` rounds to \`n\` digits after the decimal. \`round(x)\` returns an \`int\` (banker’s rounding on \`.5\` — prefer being explicit for money).

\`int(x)\` truncates toward zero. \`abs(x)\` is absolute value. \`min\` and \`max\` take any number of arguments.

\`\`\`tryit python
prompt_tokens = 1200
completion_tokens = 350
price_in = 0.005   # dollars per 1K prompt tokens
price_out = 0.015  # dollars per 1K completion tokens

cost = prompt_tokens / 1000 * price_in + completion_tokens / 1000 * price_out
print("cost_usd", round(cost, 4))

print("true div", 7 / 2)
print("floor div", 7 // 2)
print("remainder", 7 % 2)
print("power", 2 ** 10)

# Batching: how many full chunks of 512 tokens?
window = 512
print("full windows", prompt_tokens // window)
print("leftover tokens", prompt_tokens % window)

print("min/max", min(1200, 350, 800), max(1200, 350, 800))
print("int(3.9) =", int(3.9), "round(3.9) =", round(3.9))
\`\`\`

## Floats are approximate

\`0.1 + 0.2\` is not exactly \`0.3\`. Do not compare floats with \`==\`. Compare with a tolerance, or round for display, or use integers (cents, milliseconds).

> **Warning:** Temperature, top_p, and dollar costs are floats. Step counts and list lengths are ints. Mixing them with \`==\` is a classic “works in the demo” bug.

## Mixed ints and floats

### Keep counters as int

\`3 * 0.5\` is \`1.5\`. Once a float enters an expression, the result is usually a float. Token counts should stay \`int\` until you multiply by a **price**. Then you have dollars, which you \`round\` for display. Do not store \`cost\` as a string.

Floor division with negatives surprises people: \`-7 // 2\` is \`-4\` in Python (floor, not truncate). Agent budgets are non-negative; if you see a negative step count, you have a bug, not a math puzzle.

## Compound assignment

\`step += 1\` is the same as \`step = step + 1\`. Also \`-=\`, \`*=\`, \`/=\`, \`//=\`. Useful in a budget loop. Still not mutation of the number object — rebinding the name.

## Agent connection

A production loop has a **budget**: max steps, max tokens, max dollars. Implement it with \`int\` counters and a float cost accumulator you \`round\` for logs. Stop when \`steps >= max_steps\` or \`cost >= max_usd\`. The arithmetic is the kill switch. Without it the agent is a \`while True\` against your wallet.

\`\`\`quiz
What is the value of 7 // 2 in Python 3?
- 3.5
- *3
- 4
- "3"
explain: // is floor division and returns an integer for two ints. Use / when you want 3.5.
\`\`\`
`,
    },
    {
      slug: "booleans-none",
      title: "Booleans, Truthiness, and None",
      summary: "True/False, and/or/not, truthy values, and why you check for None with is — not with luck.",
      minutes: 10,
      level: "beginner",
      md: `
A **boolean** is \`True\` or \`False\`. Agent code is full of them: did the tool succeed, is the goal satisfied, should we stop, may we call this tool.

Python also has a broader idea: **truthiness**. Many values can be used in an \`if\` without being actual bools. That is convenient and a source of bugs when \`""\`, \`[]\`, \`0\`, and \`None\` all look like “no.”

## Comparisons produce bools

| Op | Meaning |
|---|---|
| \`==\` \`!=\` | Equal, not equal |
| \`<\` \`<=\` \`>\` \`>=\` | Ordered comparison |
| \`is\` \`is not\` | Same object |
| \`in\` \`not in\` | Membership |

Use \`==\` for values. Use \`is\` for \`None\` (and sometimes booleans, though \`==\` is fine for \`True\`/\`False\`).

## and, or, not

- \`not x\` flips truthiness
- \`x and y\` returns \`x\` if \`x\` is falsy, otherwise \`y\`
- \`x or y\` returns \`x\` if \`x\` is truthy, otherwise \`y\`

They **short-circuit**: \`or\` does not evaluate the right side if the left is enough. That lets you write \`name or "anonymous"\` as a default.

\`\`\`python
print("" or "default")     # default
print("atlas" or "default")  # atlas
print(True and False)      # False
\`\`\`

## Truthiness table

These are **falsy**: \`False\`, \`None\`, \`0\`, \`0.0\`, \`""\`, \`[]\`, \`{}\`, \`set()\`.

Everything else is **truthy**, including \`"0"\`, \`"False"\`, and \`[0]\`.

> **Warning:** \`if error:\` is false when \`error is None\` *and* when \`error == ""\`. If empty string is a real observation, check \`if error is not None\`.

## None means “no value”

Functions that do not \`return\` actually return \`None\`. Missing JSON fields become \`None\` after \`.get\`. Do not use \`None\` as a stand-in for \`0\` or \`""\` unless you mean “unknown.”

\`\`\`tryit python
obs = {"error": None, "text": "", "items": []}
print("bool error", bool(obs["error"]))
print("bool text", bool(obs["text"]))
print("bool items", bool(obs["items"]))
print("error is None", obs["error"] is None)

ok = True
print("ok and True", ok and True)
print("False or fallback", False or "fallback")
print("not ok", not ok)

# Short-circuit default
name = ""
print("display", name or "anonymous")

# None vs empty vs zero
for value in [None, "", 0, "0", []]:
    print(repr(value), "truthy=", bool(value), "is None=", value is None)
\`\`\`

## Combining checks

Write the precise condition:

\`\`\`python
if obs.get("error") is not None:
    ...
if not obs.get("items"):
    ...  # missing or empty list
if obs.get("done") is True:
    ...  # not just truthy
\`\`\`

Goal predicates should usually be explicit booleans. \`if state.get("pr_url")\` treats any non-empty string as success, which is often what you want. \`if state.get("tests_passed")\` treats a missing key as failure — also often what you want. Document it.

### JSON flags are not English

JSON booleans arrive as real \`True\`/\`False\`. JSON sometimes also uses \`1\` and \`0\`, or the strings \`"true"\` and \`"false"\`. Those are all different Python objects. A predicate that does \`if state["tests_passed"]:\` will treat \`1\` as success and \`"false"\` as success (non-empty string). Be strict at the boundary: accept \`True\`, reject everything else, or coerce once with a helper.

\`and\` / \`or\` are not just for bools. \`obs.get("text") or "(empty)"\` fills in a display string. That is handy in logs. It is the wrong tool if \`0\` is a legal measurement you must keep.

## Agent connection

Stop conditions are booleans: \`goal_satisfied(state)\`, \`budget.remaining <= 0\`, \`last_tool_failed\`. Mix them with \`and\`/\`or\` in one place so the loop condition reads like English. Check \`None\` with \`is None\` at tool boundaries, because JSON \`null\`, missing keys, and empty strings mean three different operational stories (unknown, absent, present-but-blank).

\`\`\`quiz
How should you test that a variable has no value (None)?
- if value == False
- if not value == None
- *if value is None
- if value == "None"
explain: Use is None. Equality can be overloaded; None is a singleton. Empty string and 0 are not None.
\`\`\`
`,
    },
    {
      slug: "lists",
      title: "Lists",
      summary: "Index, slice, append, and why a list is the natural memory and transcript of an agent.",
      minutes: 12,
      level: "beginner",
      md: `
A **list** is an ordered, mutable sequence. Square brackets, commas, any types (usually one type per list). This is the data structure you will use for messages, tool names, retrieved chunks, and the step transcript.

If you remember only one collection in Python, remember lists.

## Build, index, slice

\`\`\`python
memory = ["user: book a flight", "thought: need dates"]
print(memory[0])     # first
print(memory[-1])    # last
print(memory[1:])    # from index 1
print(len(memory))   # 2
\`\`\`

Indexing a missing position raises \`IndexError\`. Check \`len\` or use a loop. Slices never raise: they return a shorter list, possibly empty.

## Mutating methods

| Method | Effect |
|---|---|
| \`append(x)\` | Add one item at the end |
| \`extend(xs)\` | Add all items from another sequence |
| \`insert(i, x)\` | Insert at index \`i\` |
| \`pop()\` | Remove and return the last item |
| \`pop(i)\` | Remove and return index \`i\` |
| \`remove(x)\` | Remove the first matching *value* |
| \`clear()\` | Empty the list in place |

Assignment to an index replaces that slot: \`memory[0] = "..."\`.

\`+\` concatenates and returns a **new** list. \`append\` changes the existing list. Mixing them up is a rite of passage: \`memory = memory.append(x)\` sets \`memory\` to \`None\` because \`append\` returns \`None\`.

## Lists as agent memory

A chatty agent is a list of role/content dicts. A ReAct trace is a list of steps. A retrieval result is a list of chunks. The loop **appends** observations; a memory policy may later **slice** to the last *k* items.

\`\`\`tryit python
memory = ["user: book a flight", "thought: need dates"]
memory.append("action: ask_user")
print("first:", memory[0])
print("last:", memory[-1])
print("tail:", memory[1:])
print("len:", len(memory))

# pop the last action (undo)
undone = memory.pop()
print("undid:", undone)
print("now:", memory)

# Concatenate vs append
extra = ["obs: user said next week"]
print("new list", memory + extra)
print("original unchanged", memory)
memory.extend(extra)
print("extended", memory)

# Dangerous: append returns None
# bad = memory.append("nope")
print("append returns", memory.append("tool: search"))
print("after mistaken use, memory is still a list:", memory)
\`\`\`

### append returns None

Wait: that last \`print\` shows \`append\` returning \`None\` *and* mutating \`memory\`. Run it. Then never write \`memory = memory.append(...)\`.

## Membership, sort, and nested lists

\`"search" in tools\` scans a list from the left. Fine for a handful of names; use a \`set\` when the allow-list grows. \`list.sort()\` sorts **in place** and returns \`None\` (same trap as \`append\`). \`sorted(lst)\` returns a new list.

A chat transcript is a list of dicts, which is a nested structure: \`messages[0]["role"]\`. Slicing \`messages[-10:]\` keeps the last ten turns but those dicts are still the original objects — editing one later edits “history.” Copy dicts if a tool is allowed to scribble.

## Copying

\`b = a\` does not copy. Both names point at one list. \`b = a[:]\` or \`list(a)\` or \`a.copy()\` makes a shallow copy. Nested lists still share inner objects — enough to know for now.

> **Tip:** For a rolling window of the last 5 observations: \`memory = memory[-5:]\`. Cheap, obvious, and a real (if naive) memory policy.

## Agent connection

The **transcript** is a list you append to on every thought, tool call, and observation. Debugging an agent is printing that list. Trimming cost is slicing that list. Evaluation is replaying that list. When people say “the agent has memory,” they often mean “we kept a Python list and did not drop it.”

\`\`\`quiz
What does lst.append(x) return?
- The new list
- x
- *None (and it mutates lst in place)
- A copy of lst
explain: append mutates and returns None. Writing lst = lst.append(x) destroys the list name.
\`\`\`
`,
    },
    {
      slug: "tuples-sets",
      title: "Tuples and Sets",
      summary: "Immutable sequences, unique collections, and using a set of allowed tool names as a safety gate.",
      minutes: 11,
      level: "beginner",
      md: `
Lists are not the only sequences. A **tuple** is ordered and **immutable**. A **set** is unordered and stores **unique** items. Agents use both: tuples for fixed records (coordinates, pairs), sets for “is this tool allowed?”

## Tuples

Parentheses, commas. A trailing comma makes a one-element tuple: \`(42,)\`. Without the comma, \`(42)\` is just an int in grouping parentheses.

\`\`\`python
origin = (0, 0)
role_and_name = ("tool", "search")
print(origin[0], len(origin))
\`\`\`

You can slice and iterate tuples like lists. You cannot \`append\`. You cannot assign to an index. That is the point: a tuple is a frozen row.

**Unpacking** is the everyday superpower:

\`\`\`python
role, name = ("tool", "search")
\`\`\`

Functions that return two values are really returning a tuple.

> **Note:** A tuple’s *slots* cannot be replaced, but if a slot holds a list, that list can still be mutated. Immutability is shallow.

## Why immutability matters

Hashes and dict keys must be immutable. Tuples of strings/numbers can be dict keys; lists cannot. Tool signatures like \`("search", "q")\` can label a cache.

## Sets

Curly braces of values: \`{"search", "read"}\`. Empty set is \`set()\`, not \`{}\` (that is an empty **dict**).

Duplicates collapse. Membership tests are average **O(1)**. That is why allow-lists of tool names should be sets, not lists you scan linearly (the list is fine at three tools; a habit of sets scales).

| Operation | Meaning |
|---|---|
| \`.intersection\` (\`&\`) | In both |
| \`.union\` | In either (also the pipe operator) |
| \`-\` | In left, not right |
| \`in\` | Membership |
| \`.add\` / \`.discard\` | Mutate |

Sets are unordered. Do not index them. \`sorted(the_set)\` if you need a stable print.

\`\`\`tryit python
origin = (0, 0)
role, name = ("tool", "search")
print("tuple", origin, role, name)

# Unique tool names from a noisy trace
raw = ["search", "read", "search", "write", "read"]
tool_names = set(raw)
print("unique", sorted(tool_names))

allowed = {"search", "read"}
requested = "write"
print("write allowed?", requested in allowed)
print("denied", sorted(set(raw) - allowed))
print("overlap", sorted(set(raw) & allowed))

# Empty collections
print(type(set()), type({}))

# Tuple as a frozen pair (cache key shape)
key = ("search", "python agents")
print(key)
\`\`\`

## When a list should become a set

### Order vs uniqueness

If you need **order and duplicates**, keep a list (the transcript). If you need **membership and uniqueness**, use a set (allowed tools, seen URLs, ids already fetched). Convert at the boundary: \`seen = set(urls)\` then later \`if url in seen\`. Do not use a set as memory of what the model said — you will lose order and repeated steps, both of which matter in a trace.

Tuples vs lists in returns: \`return ok, result\` is a tuple. The caller unpacks it. If the result might grow more fields next month, return a dict instead so callers can \`.get\` new keys.

## frozenset

\`frozenset\` is an immutable set — usable as a dict key. Rare in day-one code; useful for a frozen permission set you pass around without fearing \`.add\`.

## Agent connection

Every serious agent has an **allow-list** of tools. Parse the model’s action name, then \`if name not in ALLOWED: reject\`. A \`set\` makes that check obvious and fast. Tuples show up as structured returns: \`(ok, result)\` or \`(action_type, payload)\` before you graduate to dicts and dataclasses. Immutability is a safety feature: the policy should not accidentally append to the list of permitted tools at runtime.

\`\`\`quiz
How do you write an empty set?
- {}
- *set()
- []
- ()
explain: {} is an empty dict. set() is an empty set. [] is a list and () is an empty tuple.
\`\`\`
`,
    },
    {
      slug: "dicts",
      title: "Dictionaries",
      summary: "JSON-shaped key/value data, .get, nesting, and the payload shape of every tool call.",
      minutes: 13,
      level: "beginner",
      md: `
A **dict** maps keys to values. Keys are usually strings. This is JSON’s object, Python’s default record type, and the shape of almost every LLM tool call: \`{"name": "search", "args": {"q": "..."}}\`.

If lists are memory, dicts are **messages**.

## Literals and lookup

\`\`\`python
action = {"type": "tool", "name": "search"}
print(action["name"])
action["name"] = "read"
action["ok"] = True
\`\`\`

\`d[key]\` raises \`KeyError\` if the key is missing. That is often what you want — fail loud. When absence is normal, use \`.get\`.

## .get, membership, keys

| Call | Behavior |
|---|---|
| \`d[k]\` | Value or \`KeyError\` |
| \`d.get(k)\` | Value or \`None\` |
| \`d.get(k, default)\` | Value or default |
| \`k in d\` | Key present? |
| \`d.keys()\` / \`.values()\` / \`.items()\` | Views |
| \`d.setdefault(k, v)\` | Get, or set if missing |
| \`del d[k]\` | Remove key |

Iterate \`.items()\` when you need both:

\`\`\`python
for key, value in action.items():
    print(key, value)
\`\`\`

## Nesting

JSON is nested dicts and lists. Walk one level at a time. Optional chaining is just \`.get\` twice:

\`\`\`python
q = action.get("args", {}).get("q")
\`\`\`

If \`args\` is missing, \`.get("args", {})\` gives an empty dict and the second \`.get\` returns \`None\` instead of crashing.

## Dicts and JSON

After \`json.loads\`, you have dicts and lists. Before \`json.dumps\`, you must have JSON-serializable types: \`str\`, \`int\`, \`float\`, \`bool\`, \`None\`, lists, dicts with string keys. Tuples dump as arrays. \`set\` does not dump — convert with \`list\` or \`sorted\`.

\`\`\`tryit python
action = {
    "type": "tool",
    "name": "search",
    "args": {"q": "python json", "k": 3},
}
print(action["name"])
print("thought via get:", action.get("thought", ""))
print("nested q:", action["args"]["q"])

action["args"]["k"] = 5
print(action)

# Safe walk
missing = action.get("meta", {}).get("source")
print("missing nested", missing)

print("name" in action, "thought" in action)

for key, value in action.items():
    print(f"{key} = {value}")

# Building a message list (chat memory)
messages = [
    {"role": "user", "content": "summarize this"},
    {"role": "assistant", "content": None, "tool": action},
]
print("roles", [m["role"] for m in messages])
\`\`\`

## Merging

\`{**a, **b}\` makes a new dict; keys in \`b\` win. Useful for default tool args: \`{**defaults, **model_args}\`.

> **Tip:** Use string keys that match your schema exactly: \`role\`, \`content\`, \`name\`, \`args\`. Do not invent \`Name\` vs \`name\` — JSON and models are case-sensitive.

## update, pop, and defaults

### Stable observation keys

\`d.update(other)\` copies keys from \`other\` in place. \`{**defaults, **args}\` builds a new dict and is easier to reason about in a tool wrapper: model args override defaults, originals stay intact. \`d.pop(k)\` removes a key and returns the value; \`d.pop(k, None)\` is the safe form.

Building an observation often looks like: start with a skeleton \`{"ok": True, "error": None}\`, then \`update\` with the tool’s return. Keep a stable key set so the model and your tests see the same shape every turn.

## Common mistakes

- **\`d.get["k"]\`** — \`.get\` is a method. Call it: \`d.get("k")\`.
- **Assuming key order is random.** Since Python 3.7, dicts remember insertion order. Do not rely on it for logic; do enjoy stable prints.
- **Using a list as a record.** If fields have names, use a dict (or a dataclass, later).
- **Non-string keys in JSON.** \`json.dumps({1: "a"})\` will stringify the key. Your loader will not get an \`int\` key back. Use strings on the wire.

## Agent connection

The model speaks JSON. You \`json.loads\` it into a dict, read \`type\` and \`name\`, pass \`args\` into a Python function with \`fn(**args)\` (next lessons). The observation you append is another dict. Learn to look at a nested dict and see the protocol: who said what, which tool, which arguments, which result. That is the wire format of an agent.

\`\`\`quiz
What does action.get("thought", "") return if thought is missing?
- KeyError
- None
- *an empty string
- False
explain: get(key, default) returns the default when the key is absent. Here the default is "".
\`\`\`
`,
    },
    {
      slug: "conditionals",
      title: "Conditionals",
      summary: "if, elif, else, and early return — the policy of a tiny agent before you add a model.",
      minutes: 10,
      level: "beginner",
      md: `
**Conditionals** choose a branch. An agent’s **policy** is a pile of conditions until you replace the pile with a model — and even then the *guardrails* stay as \`if\` statements: allow-lists, budget checks, “if JSON is invalid, retry.”

## if, elif, else

Python uses indentation (four spaces by convention) to mark a block. The colon at the end of \`if\` is required.

\`\`\`python
if obs.get("error"):
    action = "retry"
elif obs.get("done"):
    action = "stop"
else:
    action = "think"
\`\`\`

**elif** means “else if.” You can chain many. Only one branch runs. \`else\` is optional.

Conditions can be any truthy/falsy value. Prefer explicit comparisons when the data might be \`None\`, \`0\`, or \`""\`.

## Comparison chaining

\`0 <= n < 8\` works in Python. Useful for budgets: \`if used < max_steps:\`.

## Early return

Inside a function, **return as soon as you know the answer**. This keeps the happy path unindented and is how you write readable tool handlers and goal checks.

\`\`\`python
def next_action(obs):
    if obs.get("error"):
        return "retry"
    if obs.get("done"):
        return "stop"
    if obs.get("needs_tool"):
        return "call_tool"
    return "think"
\`\`\`

That is easier to extend than a nested \`if/else\` pyramid. Each guard is a sentence.

\`\`\`tryit python
def next_action(obs):
    if obs.get("error"):
        return "retry"
    if obs.get("done"):
        return "stop"
    if obs.get("needs_tool"):
        return "call_tool"
    return "think"

print("needs tool ->", next_action({"needs_tool": True}))
print("error ->", next_action({"error": "timeout"}))
print("done ->", next_action({"done": True}))
print("idle ->", next_action({}))

# Guardrail: only listed tools
ALLOWED = {"search", "read"}

def gated(name):
    if name not in ALLOWED:
        return "reject"
    return "run"

print("search", gated("search"))
print("shell", gated("shell"))

# Budget
used, max_steps = 8, 8
if used >= max_steps:
    print("stop: budget")
else:
    print("continue")
\`\`\`

## Nested vs flat

Nesting is legal. Deep nesting is how tool code becomes untestable. Flatten with elif, early return, or helper functions. If you need more than three levels, you probably want a dict of handlers (a jump table) instead of a 40-line \`if\`.

| Pattern | Use when |
|---|---|
| \`if / elif / else\` | One of several categories |
| Early \`return\` | Invalid input or terminal states |
| Guard \`if name not in allowed\` | Safety |
| Dict of functions | Many tool names |

> **Tip:** Write the failure cases first: bad JSON, unknown tool, empty query. The model path is what is left.

## Ternary

\`value if condition else other\` is an expression. Fine for small things: \`status = "ok" if err is None else "fail"\`. Do not nest ternaries.

## Compound stop conditions

### One function named should_stop

The agent’s while-loop condition is just a boolean: \`while not done and used < max_steps:\`. Write a function \`should_stop(state)\` that returns \`True\` for success, budget, or policy violation. Keep the loop body for work, not for a forest of flags. When you add a new kill switch (timeout, user cancel, forbidden tool), you add one \`or\` inside \`should_stop\`, not another indent level around the model call.

## Agent connection

Before you wire an LLM, write the policy as functions of observations. That tiny \`next_action\` *is* an agent. Replacing it with a model call does not remove conditionals: you still reject unknown tools, still stop on budget, still branch on parse errors. Architecture is the loop; \`if\` is the immune system.

\`\`\`quiz
After an early return runs, what happens to the rest of the function?
- It still runs
- *It is skipped; the function ends immediately
- Python runs else anyway
- It raises ReturnError
explain: return exits the function with a value. Code below it in that call does not run.
\`\`\`
`,
    },
    {
      slug: "loops",
      title: "Loops",
      summary: "for, while, break, continue, enumerate, and looping an agent until the budget is gone.",
      minutes: 12,
      level: "beginner",
      md: `
An agent **is** a loop: while the goal is unmet and the budget remains, think, act, observe. Python gives you \`for\` and \`while\`. You will use both — \`for\` over collections, \`while\` for “until a stop condition.”

## for

\`for item in sequence:\` binds \`item\` to each element. Strings, lists, tuples, dict keys, and ranges are all iterable.

\`\`\`python
for name in ["search", "read", "answer"]:
    print(name)

for i in range(3):
    print(i)  # 0, 1, 2
\`\`\`

\`range(n)\` is \`0 .. n-1\`. \`range(start, stop)\` and \`range(start, stop, step)\` exist. \`range\` is not a list; it is a lazy sequence. Wrap with \`list(range(5))\` to print it.

## enumerate and zip

\`enumerate(xs, start=1)\` yields \`(index, item)\` — perfect for numbered steps. \`zip(a, b)\` walks two sequences in parallel, stopping at the shorter one.

## while

\`while condition:\` repeats as long as the condition is truthy. You are responsible for making it false. Forgetting to increment a counter is an infinite loop. In Joeven, that will hang the editor until the runtime gives up. Always pair \`while\` with a budget.

## break and continue

- \`break\` leaves the innermost loop immediately
- \`continue\` skips the rest of this iteration and starts the next

\`else\` on a loop runs if the loop **did not** \`break\`. Rare, occasionally elegant for “search failed to find.”

\`\`\`tryit python
budget = 5
trace = []
step = 0
while step < budget:
    step += 1
    trace.append(f"step {step}")
    if step == 3:
        break
print("while+break", trace)

for i, item in enumerate(["search", "read", "answer"], start=1):
    print(i, item)

# continue: skip empty observations
obs = ["rain", "", "umbrella"]
kept = []
for text in obs:
    if not text.strip():
        continue
    kept.append(text)
print("kept", kept)

# Agent-shaped loop
max_steps = 8
goal_done = False
used = 0
log = []
while used < max_steps and not goal_done:
    used += 1
    log.append(used)
    if used >= 4:      # pretend the goal became true
        goal_done = True
print("used", used, "log", log)
\`\`\`

## Infinite loops

### Caps before while True

\`while True:\` is common when the stop is inside the body (\`break\` on success). It is only safe with:

- a step counter
- a wall-clock or token budget
- a maximum retry count

Otherwise you have a process that cannot die.

> **Warning:** Never \`while True\` around a paid model API without a hard cap. The bug is indistinguishable from a successful long job until finance pings you.

## Nested loops

A loop inside a loop is fine for small products (every tool × every arg). For transcripts, prefer one loop over steps. Nested loops over “every past message × every tool” get expensive in tokens *and* in CPU.

| Loop | Typical agent use |
|---|---|
| \`for msg in messages\` | Build a prompt |
| \`for i in range(max_retries)\` | Retry a tool |
| \`while used < budget\` | The agent heartbeat |
| \`break\` | Goal met or fatal error |

## Agent connection

The agent loop is a \`while\` with three exits: success, failure, handoff. Implement them as \`break\` or flags, and **always** count steps. \`enumerate\` your transcript when you print it so humans can point at “step 7.” Later libraries hide this loop; you should still be able to write it in twenty lines. That is the whole subject of Joeven, in Python form.

\`\`\`quiz
Which loop is the best fit for “run until the goal is true or steps hit 8”?
- for item in goal
- *while used < 8 and not goal_done
- if used < 8
- range(goal)
explain: A while loop tests a stop condition each turn. for is for walking a known collection.
\`\`\`
`,
    },
    {
      slug: "functions",
      title: "Functions",
      summary: "def, return, keyword arguments, and the fact that every agent tool is a function.",
      minutes: 13,
      level: "beginner",
      md: `
A **function** names a piece of behavior. You define it once with \`def\` and call it many times. In an agent, **tools are functions**. The model chooses a name and arguments; your runtime looks up the function and calls it.

If you can write a clear function with a return value, you can write a tool.

## Anatomy of a tool

| Piece | Example | Role |
|---|---|---|
| Name | \`search\` | What the model calls |
| Parameters | \`q\`, \`k=3\` | JSON keys become these |
| Return | \`list\` of strings | Observation for the next turn |
| Errors | \`raise\` or \`{"ok": False}\` | The loop must see failure |

## def and return

\`\`\`python
def search(q, k=3):
    hits = []
    for i in range(k):
        hits.append("doc " + str(i) + " about " + q)
    return hits
\`\`\`

- \`def\` starts the definition
- parameters are names in parentheses
- the body is indented
- \`return\` hands a value back and exits
- no \`return\` means the function returns \`None\`

Call with positional args \`search("weather")\` or keywords \`search(q="weather", k=2)\`. Keywords can be in any order. After a keyword, everything else must be keywords too.

## Why return, not just print

\`print\` is for humans. \`return\` is for programs. Tools must **return** data so the loop can append it to the transcript. You may also print for debugging, but the contract is the return value (or an exception).

## Keyword arguments and tools

JSON tool calls map to keywords:

\`\`\`python
args = {"q": "agents", "k": 2}
search(**args)   # unpack dict into keywords
\`\`\`

The \`**\` in a *call* unpacks a dict. (In a *definition*, \`**kwargs\` collects extras — next lesson.)

## Functions as values

### The registry dict

Functions are objects. You can put them in a dict — a **tool registry**:

\`\`\`python
tools = {"search": search}
tools["search"]("python")
\`\`\`

That registry is the heart of a tool-using agent.

\`\`\`tryit python
def search(q, k=3):
    hits = []
    for i in range(k):
        hits.append("doc " + str(i) + " about " + q)
    return hits

def add(a, b):
    return a + b

def call_tool(name, **kwargs):
    registry = {"search": search, "add": add}
    fn = registry.get(name)
    if fn is None:
        return {"ok": False, "error": f"unknown tool {name}"}
    return {"ok": True, "result": fn(**kwargs)}

print(call_tool("search", q="agents", k=2))
print(call_tool("add", a=3, b=4))
print(call_tool("shell", cmd="rm"))

# Positional vs keyword
print(search("nyc"))
print(search(q="nyc", k=1))
\`\`\`

## Docstrings

The first string in a function body is the **docstring**. \`help(fn)\` shows it. Tool descriptions you send to a model are cousins of docstrings: they tell *another mind* how to call the function. Keep them short and precise.

\`\`\`python
def search(q, k=3):
    """Return k fake documents for query q."""
    ...
\`\`\`

## Pure vs side-effecting

A **pure** function depends only on its args and returns a value (\`add\`). A **side-effecting** function sends email, writes a file, charges a card. Agents need both. Label them. Require approval for the second kind. The Python syntax is the same; the *policy* is not.

> **Note:** Default values are bound **once**, at definition time. Never use a mutable list as a default. Next lesson unpacks that trap.

## Agent connection

When a model emits \`{"name": "search", "arguments": {"q": "..."}}\`, your job is \`tools[name](**arguments)\`. That is the entire tool-calling miracle, mechanically. Design each tool as a small function with explicit arguments and a JSON-friendly return value (dict, list, str, number). Huge functions with hidden globals make traces unreadable and tests impossible.

\`\`\`quiz
What does a Python function return if it has no return statement?
- An error
- *None
- 0
- The last printed line
explain: Falling off the end of a function returns None. That is why memory = lst.append(x) becomes None.
\`\`\`
`,
    },
    {
      slug: "scope-args",
      title: "Scope, Defaults, and *args / **kwargs",
      summary: "LEGB scope, default argument pitfalls, unpacking, and why mutable defaults corrupt agent state.",
      minutes: 12,
      level: "beginner",
      md: `
Functions have **scope**: names inside are local unless you go out of your way. Arguments have **defaults**. Extra positional args can be collected with \`*args\`, extra keywords with \`**kwargs\`. These features are how flexible tools are written — and how silent bugs land in transcripts.

## LEGB in one minute

### Lookup order

When Python looks up a name, it searches:

1. **L**ocal — this function
2. **E**nclosing — outer functions (closures)
3. **G**lobal — this module
4. **B**uiltin — \`len\`, \`print\`, \`range\`

Assignment inside a function makes a name **local** for the whole function. If you meant to update a global counter, you will instead create a new local and get \`UnboundLocalError\` if you read it first. Prefer **returning** new values over mutating globals. Agents should pass \`state\` in and out.

## Default argument values

\`def search(q, k=3):\` lets callers omit \`k\`. Defaults are evaluated **once**, when \`def\` runs, not on every call.

That is why this is a classic bug:

\`\`\`python
def add_event(event, history=[]):  # BAD
    history.append(event)
    return history
\`\`\`

Every call shares **one** list. The second call still sees the first event. In an agent, that looks like “memory leaked across users.”

**Fix:** default to \`None\`, create a new list inside.

## *args and **kwargs

| Form | Place | Meaning |
|---|---|---|
| \`*args\` | \`def\` | Extra positional args as a tuple |
| \`**kwargs\` | \`def\` | Extra keyword args as a dict |
| \`*seq\` | call | Unpack a list/tuple into positionals |
| \`**d\` | call | Unpack a dict into keywords |

In a definition:

- \`*args\` is a **tuple** of extra positional arguments
- \`**kwargs\` is a **dict** of extra keyword arguments

In a call, \`*\` unpacks a sequence and \`**\` unpacks a dict.

Order in a \`def\`: normal args, then \`*args\`, then keyword-only args, then \`**kwargs\`.

\`\`\`tryit python
def add_event(event, history=None):
    if history is None:
        history = []
    history.append(event)
    return history

print("good", add_event("a"))
print("good", add_event("b"))  # a fresh list, not ['a', 'b']

def bad_add(item, bag=[]):
    bag.append(item)
    return bag

print("bad", bad_add("x"))
print("bad", bad_add("y"))     # shared default list

def log_all(*parts, **fields):
    print("parts", parts)
    print("fields", fields)

log_all("tool", "search", ok=True, ms=12)

def call(fn, *args, **kwargs):
    return fn(*args, **kwargs)

print(call(len, "trace"))
print(call(add_event, "obs", history=["start"]))
\`\`\`

## Mutability pitfall beyond defaults

If you pass a list or dict into a function and mutate it, the caller sees the change. That can be a feature (append to the transcript) or a bug (a tool silently edits the user message). **Copy** if you need isolation: \`list(xs)\`, \`dict(d)\`, or \`copy.deepcopy\` for nested structures.

> **Warning:** \`fn(**args)\` will throw \`TypeError\` if the JSON object contains keys the function does not accept. Validate args against the tool schema before unpacking.

## Keyword-only arguments

\`def run(*, dry_run=True):\` forces \`run(dry_run=False)\`. Nice for dangerous flags so nobody passes a positional by accident.

## Agent connection

The tool runner is usually \`def call_tool(name, **kwargs)\` plus a registry. Defaults give tools sensible \`k=5\` search sizes when the model omits a field. Mutable defaults will merge two conversations’ histories. Pass \`transcript\` explicitly, default \`None\`, allocate a new list per agent instance. Scope plus mutability is how “it worked in the notebook” becomes “users saw each other’s prompts.”

\`\`\`quiz
Why is def f(history=[]) dangerous?
- Empty lists are illegal defaults
- *The same list object is reused on every call that omits history
- Python copies the list each call, which is slow
- [] is None
explain: Defaults bind once at def time. append then leaks state across calls — disaster for agent memory.
\`\`\`
`,
    },
    {
      slug: "modules",
      title: "Modules and Packages",
      summary: "import, from, __name__, and how to structure an agent as a small Python package.",
      minutes: 11,
      level: "beginner",
      md: `
A **module** is a \`.py\` file. A **package** is a directory of modules (usually with \`__init__.py\`). \`import\` is how you reuse the standard library and your own code. Real agents are packages, not one 2,000-line file.

Joeven’s editor cannot create sibling files, so you will import **stdlib** modules here and *design* a package layout on paper.

## import forms

\`\`\`python
import math
import json as js
from collections import Counter
from math import sqrt, ceil
\`\`\`

- \`import math\` binds the module; you write \`math.sqrt\`
- \`import json as js\` is a short alias
- \`from math import sqrt\` binds the name \`sqrt\` directly

\`from math import *\` dumps names into your namespace. Do not do that in agent code. You will not know where \`loads\` came from.

## What import does

The first time a module is imported, Python runs the file and caches it in \`sys.modules\`. Later imports reuse the cache. Side effects at module top level (connecting to a database, loading a 4 GB model) run on import — keep top level **thin**. Put work in functions.

## __name__ and the main block

Every module has \`__name__\`. If you run the file directly, it is \`"__main__"\`. If you import it, it is the module name.

\`\`\`python
def main():
    ...

if __name__ == "__main__":
    main()
\`\`\`

This lets \`loop.py\` be both a library and a CLI. Tests can import \`run_agent\` without launching the agent.

\`\`\`tryit python
import math
import json as js
from collections import Counter

print(math.ceil(2.1))
print(js.dumps({"a": 1}))
print(Counter("banana"))
print("this module name:", __name__)

if __name__ == "__main__":
    print("ran as a script (typical in this editor)")

# A tiny 'package map' you would split across files
layout = {
    "agent_app/__init__.py": "package marker",
    "agent_app/loop.py": "while budget: think/act/observe",
    "agent_app/tools/__init__.py": "registry of tools",
    "agent_app/tools/search.py": "def search(q, k=5): ...",
    "agent_app/tools/read.py": "def read(path): ...",
    "tests/test_loop.py": "goal_satisfied tests",
}
for path, role in layout.items():
    print(f"{path:32} {role}")
\`\`\`

## Structuring an agent package

### Files, not a 2,000-line main

A layout that stays readable as the project grows:

| Path | Responsibility |
|---|---|
| \`loop.py\` | The while-loop, budget, stop conditions |
| \`tools/\` | One module per tool, plus a registry |
| \`prompts.py\` | System strings (or load from files) |
| \`schemas.py\` | Dict shapes / later Pydantic models |
| \`tests/\` | Tests that do not need a paid API |

Keep **I/O at the edges**. \`search.py\` can call the network on your machine; the loop should call \`search(q)\` and not care. That split is what makes tests possible.

> **Tip:** Circular imports (\`loop\` imports \`tools\` imports \`loop\`) mean your registry should live in a third module, or tools should not import the loop.

## Standard library vs packages

\`import json\` works everywhere, including Joeven. \`import httpx\` needs \`pip\` on a real machine (packaging lesson). If an import fails with \`ModuleNotFoundError\`, you either misspelled a stdlib name or you are not in an environment where the package is installed.

## Agent connection

Treat the agent as a package from day one. The loop imports tools; tests import the loop’s predicates; a CLI module is the only \`__main__\`. When you later add RAG or extra tools, you add a file, not another hundred lines in \`main.py\`. Import discipline is architecture.

\`\`\`quiz
When is a module’s __name__ equal to "__main__"?
- Always
- Never in Python 3
- *When the file is run as the program entry point, not imported
- Only inside packages
explain: Python sets __name__ to "__main__" for the entry script so you can put CLI code behind a guard.
\`\`\`
`,
    },
    {
      slug: "files-json",
      title: "JSON and Text",
      summary: "json.dumps/loads, pretty printing, in-memory files, and why agents speak JSON on the wire.",
      minutes: 13,
      level: "beginner",
      md: `
Agents live on two text formats: **free prose** (prompts, logs) and **JSON** (tool calls, API bodies, saved state). Python’s \`json\` module is in the standard library. You will use it every day.

Joeven cannot rely on a real disk, so this lesson uses **in-memory** buffers. The functions are the same as writing \`*.json\` files.

## dumps and loads

- \`json.dumps(obj)\` — Python → JSON **string**
- \`json.loads(text)\` — JSON string → Python
- \`json.dump(obj, file)\` — Python → file object
- \`json.load(file)\` — file object → Python

The “s” means string. Remember: dumps/loads for strings, dump/load for files.

JSON types map like this:

| JSON | Python |
|---|---|
| object | \`dict\` |
| array | \`list\` |
| string | \`str\` |
| number | \`int\` or \`float\` |
| true/false | \`True\`/\`False\` |
| null | \`None\` |

## Pretty print and separators

\`json.dumps(obj, indent=2)\` is readable. \`sort_keys=True\` stabilizes diffs. For compact logs use default separators. Always \`json.loads\` model output — do not \`eval\`.

## Invalid JSON

Models love trailing commas, single quotes, and commentary. \`json.loads\` raises \`json.JSONDecodeError\`. Catch it and retry or extract a \`{...}\` slice. Do not silently \`eval\`.

\`\`\`tryit python
import json
import io

state = {
    "goal": "fix the failing test",
    "steps": 2,
    "tools": ["pytest", "read_file"],
    "error": None,
}
text = json.dumps(state, indent=2)
print(text)
loaded = json.loads(text)
print("goal", loaded["goal"])
print("error is None", loaded["error"] is None)

# In-memory file (stand-in for state.json)
fake_file = io.StringIO()
json.dump(state, fake_file)
fake_file.seek(0)
print("from file", json.load(fake_file)["tools"])

# Compact action line
action = {"type": "tool", "name": "search", "args": {"q": "pytest"}}
print(json.dumps(action, separators=(",", ":")))

# Round-trip a transcript
transcript = [
    {"role": "user", "content": "fix tests"},
    {"role": "tool", "name": "pytest", "ok": False},
]
blob = json.dumps(transcript)
print(json.loads(blob)[1]["name"])
\`\`\`

## Reading ordinary text

On a real machine:

\`\`\`python
from pathlib import Path
text = Path("notes.txt").read_text(encoding="utf-8")
Path("out.json").write_text(json.dumps(state), encoding="utf-8")
\`\`\`

Always pass \`encoding="utf-8"\`. Always close files — or use \`with open(...) as f:\` so it closes even on error. In this sandbox, \`io.StringIO\` is a file-like object: it has \`write\`, \`read\`, \`seek\`.

> **Warning:** Do not build JSON with f-strings if values can contain quotes or newlines. \`dumps\` handles escaping. Hand-rolled JSON will break the first time a user searches for \`it's\`.

## What cannot dump

\`set\`, \`bytes\`, datetime objects, and custom classes need help (\`list(set)\`, \`.isoformat()\`, \`default=\` on dumps). If a tool returns a set, convert it before you append to the transcript.

## JSONL and saved memory

### One object per line

Eval sets and traces are often **JSONL**: one JSON object per line, not one giant array. That way you can append a turn without rewriting the file. In memory that is still \`json.dumps(row)\` plus a newline. \`ensure_ascii=True\` (the default) escapes non-ASCII; set \`ensure_ascii=False\` if you want readable Unicode in logs.

On disk, always open with \`encoding="utf-8"\` and a \`with\` block. A crashed agent that leaves a half-written \`state.json\` is easier to recover if you write to a temp file and rename — a pattern for later. The skill on this page is: objects in, text out, text in, objects back, no \`eval\`.

## Agent connection

A typical model action is a JSON object. Your runtime \`loads\` it, dispatches a tool, then \`dumps\` the observation back into the next prompt. Saved memory is JSON on disk. Traces shipped to an eval harness are JSONL (one object per line). Master \`dumps\`/\`loads\` and you can serialize the entire loop. Fail here and you cannot even parse what the model asked for.

\`\`\`quiz
Which call turns a Python dict into a JSON string?
- json.loads(dict)
- json.load(dict)
- *json.dumps(dict)
- json.dump(dict)
explain: dumps (dump-string) serializes to str. dump writes to a file object. loads is the inverse.
\`\`\`
`,
    },
    {
      slug: "exceptions",
      title: "Exceptions",
      summary: "try/except/finally, raising custom errors, and turning tool failures into observations instead of crashes.",
      minutes: 12,
      level: "beginner",
      md: `
When a tool fails — timeout, bad URL, missing key — Python **raises** an exception. Uncaught, it aborts the script. In an agent, that should rarely kill the whole process. You **catch** at the tool boundary, record the error in the transcript, and let the policy decide: retry, skip, or stop.

## try, except, finally

\`\`\`python
try:
    result = read_url(url)
except ToolError as e:
    result = f"failed: {e}"
finally:
    print("tool finished")
\`\`\`

- \`try\` is the risky work
- \`except Type as name\` catches that type (and subclasses)
- \`finally\` always runs — success, failure, or \`return\`
- bare \`except:\` catches everything including \`KeyboardInterrupt\`. Do not.

Catch **specific** types. Log the rest. Swallowing \`Exception\` without recording it is how agents “do nothing” and leave no trace.

## raise

\`raise ValueError("empty query")\` throws. \`raise\` with no argument inside \`except\` re-raises the current error. After retries are exhausted, re-raise or return a structured failure.

## Custom errors

Subclass \`Exception\` (not \`BaseException\`). Add fields the loop can read: which tool, whether retry is sensible, an error code.

\`\`\`python
class ToolError(Exception):
    def __init__(self, tool, message, retryable=False):
        super().__init__(f"{tool}: {message}")
        self.tool = tool
        self.retryable = retryable
\`\`\`

## EAFP vs LBYL

Python style is **Easier to Ask Forgiveness than Permission**: try the operation, catch \`KeyError\` / \`IndexError\`. The alternative is looking before you leap (\`if k in d\`). Both are valid. At tool edges, prefer explicit validation (schema) *plus* try/except for the wild world (network, files).

## Hierarchy and \`else\`

### Narrow except first

Catch \`ToolError\` before \`Exception\`. Python uses the first matching \`except\`. A broad \`except Exception\` at the top will hide your custom type if you list it second — you will not get there. \`except json.JSONDecodeError\` is more precise than \`except ValueError\` even though decode errors subclass \`ValueError\`.

\`try/except/else/finally\`: the \`else\` block runs when **no** exception happened. Useful for “parse succeeded, now dispatch.” \`finally\` still runs after \`else\`.

| Situation | Pattern |
|---|---|
| Bad model JSON | \`JSONDecodeError\` → retry parse |
| Unknown tool | \`KeyError\` / custom → do not retry |
| Timeout / 429 | retryable \`ToolError\` |
| Bug in *your* loop | let it crash in tests; log in prod |

\`\`\`tryit python
class ToolError(Exception):
    def __init__(self, tool, message, retryable=False):
        super().__init__(f"{tool}: {message}")
        self.tool = tool
        self.retryable = retryable

def read_url(url):
    if not url.startswith("https://"):
        raise ToolError("read_url", "only https allowed", retryable=False)
    if url.endswith("/timeout"):
        raise ToolError("read_url", "timed out", retryable=True)
    return "ok body"

def run(url):
    try:
        body = read_url(url)
        return {"ok": True, "body": body}
    except ToolError as e:
        return {"ok": False, "error": str(e), "retryable": e.retryable}
    finally:
        print("finished", url)

print(run("http://example.com"))
print(run("https://example.com/timeout"))
print(run("https://example.com"))

# JSON parse errors are exceptions too
import json
try:
    json.loads("{not json")
except json.JSONDecodeError as e:
    print("bad json", e.msg)
\`\`\`

## finally and resources

\`finally\` (or a \`with\` block) closes files and sockets. If you open it, close it even when the tool explodes. Leaked handles will take down a long-running agent days later.

> **Tip:** Convert exceptions to **data** at the edge: a dict with \`ok\` and \`error\` keys. Inside your loop, work with data. That keeps the while-loop simple and testable.

## Agent connection

Tool failures are normal. The model should *see* “search timed out” as an observation, not as a crashed Python process. Catch at \`call_tool\`, append a structured error, optionally retry retryable errors, and only abort the agent on bugs in *your* code (unexpected \`TypeError\` in the loop). Custom exception types are how you distinguish “the web flaked” from “we passed a list where a string was required.”

\`\`\`quiz
What does a finally block do?
- Runs only if an exception occurred
- Runs only on success
- *Runs whether the try succeeded or failed
- Replaces except
explain: finally is for cleanup. It runs on both paths, and even if you return inside try or except.
\`\`\`
`,
    },
    {
      slug: "oop",
      title: "Classes and the Agent Object",
      summary: "Classes, methods, dataclasses, and bundling name, tools, transcript, and budget into an Agent.",
      minutes: 14,
      level: "intermediate",
      md: `
A **class** bundles data and the functions that operate on it. An instance is one concrete object. You have been using classes already: \`str\`, \`list\`, and \`dict\` are types. Now you define your own.

An agent is a natural object: it has a **name**, a **tool registry**, a **transcript**, a **budget**, and **methods** like \`record\` and \`step\`.

## class, self, methods

| Piece | Role |
|---|---|
| \`class Agent\` | The type |
| \`__init__\` / dataclass fields | Per-instance state |
| \`self.transcript\` | This agent's memory |
| \`record\` / \`over_budget\` | Behavior the loop can call |

\`\`\`python
class Counter:
    def __init__(self, start=0):
        self.n = start

    def inc(self):
        self.n += 1
\`\`\`

- \`__init__\` runs on construction: \`Counter(3)\`
- \`self\` is the instance; by convention it is the first parameter
- attributes live on \`self\`: \`self.n\`
- methods are functions in the class body

## dataclass-like patterns

Typing the same \`__init__\` gets old. The standard library \`dataclasses\` module writes it for you, including nice \`repr\` and equality.

\`\`\`python
from dataclasses import dataclass, field

@dataclass
class Agent:
    name: str
    max_steps: int = 8
    transcript: list = field(default_factory=list)
\`\`\`

Use \`field(default_factory=list)\` — **not** \`transcript: list = []\` — for the same mutable-default reason as functions.

Dataclasses are records with methods. They are perfect for \`Agent\`, \`ToolResult\`, and \`Budget\`. When you need validation and JSON schemas, later stacks add Pydantic; the idea is the same.

## Composition over mystery inheritance

An \`Agent\` *has* tools, *has* a budget, *has* a transcript. Prefer that over a deep class tree (\`BaseAgent\` → \`ChatAgent\` → \`RagAgent\` → …). Inheritance is useful for a shared \`Tool\` interface; it is rarely useful for “kinds of agents.”

## Class vs instance state

### Transcripts live on self

If you write \`transcript = []\` directly on the class body (not on \`self\`, not via \`default_factory\`), **every instance shares one list**. That is the mutable-default bug in costume: two agents, one memory. Instance attributes set in \`__init__\` or on \`self\` belong to that object. Class attributes are shared. Tools, max_steps defaults, and constants can live on the class. Transcripts, budgets-used, and user ids must live on \`self\`.

Methods should return values the loop can test. A method that only prints is hard to assert on. \`record\` returns nothing on purpose (it mutates); \`over_budget\` returns a bool; \`last\` returns a dict or \`None\`.

\`\`\`tryit python
from dataclasses import dataclass, field

@dataclass
class Agent:
    name: str
    max_steps: int = 8
    transcript: list = field(default_factory=list)

    def record(self, role, text):
        self.transcript.append({"role": role, "text": text})

    def over_budget(self):
        n = 0
        for m in self.transcript:
            if m["role"] != "user":
                n += 1
        return n >= self.max_steps

    def last(self):
        return self.transcript[-1] if self.transcript else None

a = Agent("atlas")
b = Agent("bravo")
a.record("user", "summarize this page")
a.record("assistant", "I'll fetch it")
print(a.name, "over_budget", a.over_budget())
print("last", a.last())
print("bravo still empty", b.transcript)

# Two instances do not share memory (because default_factory)
b.record("user", "hello")
print("atlas len", len(a.transcript), "bravo len", len(b.transcript))

class Budget:
    def __init__(self, steps):
        self.steps = steps
        self.used = 0

    def consume(self):
        if self.used >= self.steps:
            raise RuntimeError("budget exhausted")
        self.used += 1
        return self.used

bag = Budget(2)
print("used", bag.consume(), bag.consume())
\`\`\`

## str and repr

\`__repr__\` is for developers (debugging). \`__str__\` is for users. Dataclasses give you a decent \`repr\` for free. Print \`agent\` in a trace dump.

> **Note:** Methods can read \`self\`. They should return values the loop can test. A method that only prints is hard to assert on.

## Agent connection

\`Agent\` as a class is not required — a dict plus functions works. The class pays off when state grows: streaming, retries, callbacks. Keep methods small: \`record\`, \`consume_budget\`, \`call_tool\`. The LLM call is one method; the while-loop is another. If the class becomes a god object, split \`Budget\` and \`ToolRegistry\` back out — composition, the same idea as modules.

\`\`\`quiz
Why use field(default_factory=list) on a dataclass?
- lists are not allowed on dataclasses
- *So each instance gets its own list, not one shared default
- It makes the list immutable
- It is required by Python 3
explain: The same mutable-default trap as def f(xs=[]). default_factory calls list() per instance.
\`\`\`
`,
    },
    {
      slug: "typing-hints",
      title: "Type Hints and Schemas",
      summary: "list[str], dict, Optional, isinstance, and why tool schemas are type hints the model can read.",
      minutes: 13,
      level: "intermediate",
      md: `
Python type hints are **optional annotations**. They do not change runtime by themselves (unless you use a library that reads them). They document the contract: this function takes a \`str\` and returns \`list[str]\`. Editors, \`mypy\`, and schema generators use that contract. Agent tools need contracts because the caller is a language model that guesses.

## Syntax

| Annotation | Meaning |
|---|---|
| \`x: str\` | Parameter or variable is a string |
| \`-> list[str]\` | Returns a list of strings |
| \`dict[str, object]\` | JSON-like object, unvalidated |
| \`Optional[str]\` | String or missing (\`None\` allowed) |
| \`list[dict]\` | List of mappings (elements unchecked at runtime) |

\`\`\`python
def search(q: str, k: int = 3) -> list[str]:
    ...
\`\`\`

- Parameter types after a colon
- Return type after \`->\`
- Built-in generics: \`list[str]\`, \`dict[str, int]\`, \`tuple[str, int]\`
- Unions: \`str | None\` (Python 3.10+) or \`Optional[str]\`

Hints can be wrong; Python will still run. They are not enforcement. Add \`isinstance\` checks at the **trust boundary** (tool args from JSON).

## Optional and None

\`Optional[X]\` means \`X | None\`. Use it when absence is allowed: last error, optional path, no tool call this turn. Do not mark everything Optional “just in case” — that spreads \`None\` checks through the codebase.

## Why schemas matter

A **schema** says which keys exist, which types they have, and which are required. You already do this mentally: a tool call is \`name: str\` plus \`args: dict\`. Writing it in types (and later JSON Schema / Pydantic) lets you:

- Reject extra keys before \`fn(**args)\`
- Coerce \`"3"\` to \`3\` in one place
- Generate the tool list you send to the model
- Generate tests

Hints without checks are documentation. Checks without hints are tribal knowledge. Use both at the edge.

\`\`\`tryit python
from typing import Optional

def parse_tool(name: str, args: dict[str, object]) -> str:
    q = args.get("q")
    if not isinstance(q, str):
        return "invalid"
    return f"{name}:{q}"

def last_error(trace: list[dict]) -> Optional[str]:
    for item in reversed(trace):
        err = item.get("error")
        if isinstance(err, str):
            return err
    return None

def goal_satisfied(state: dict) -> bool:
    url = state.get("pr_url")
    passed = state.get("tests_passed")
    return isinstance(url, str) and len(url) > 0 and passed is True

print(parse_tool("search", {"q": "python"}))
print(parse_tool("search", {"q": 12}))
print(last_error([{"ok": True}, {"error": "timeout"}]))
print(last_error([{"ok": True}]))
print("goal", goal_satisfied({"pr_url": "https://x/y", "tests_passed": True}))

# A tiny runtime schema
REQUIRED = {"q": str, "k": int}

def validate(args: dict) -> list[str]:
    problems = []
    for key, typ in REQUIRED.items():
        if key not in args:
            problems.append(f"missing {key}")
        elif not isinstance(args[key], typ):
            problems.append(f"{key} should be {typ.__name__}")
    return problems

print("schema", validate({"q": "x", "k": 3}))
print("schema", validate({"q": "x", "k": "3"}))
\`\`\`

## Any, object, and dict[str, object]

JSON objects that you have not yet validated are \`dict[str, object]\` (or \`Any\`). After validation, use a narrower type or a dataclass. Do not pretend an untrusted dict is \`dict[str, str]\`.

A **TypedDict** (in \`typing\`) describes a dict’s keys in the type checker without changing runtime. Useful for \`{"role": str, "content": str}\` messages. Pydantic models go further: they parse and coerce. You do not need Pydantic to start — you need \`isinstance\` at the door and hints for humans. When the model’s JSON grows optional nested objects, a real schema library earns its dependency.

### Built-in generics

Aliases: \`list[str]\` replaced \`List[str]\` from \`typing\` in 3.9+. New code should use the built-ins. \`Optional[str]\` and \`str | None\` mean the same thing; pick one style per file.

> **Tip:** \`list[str]\` is a hint. \`isinstance(x, list)\` does **not** check the elements. Loop and check, or use a library.

## Agent connection

The model never “knows” your Python types. It sees a JSON schema you generated from those types (or from a parallel description). When tool calls fail in production, it is usually a schema mismatch: extra key, string instead of int, null instead of []. Type hints are how *your* team stays honest; runtime \`isinstance\` is how you survive the model. Treat schemas as part of the agent, not as optional decoration.

\`\`\`quiz
Do Python type hints by themselves reject a wrong argument at runtime?
- Yes, always
- *No. They are annotations unless another tool checks them
- Only for lists
- Only in Pyodide
explain: CPython ignores hints for enforcement. Validate JSON tool args with isinstance or a schema library.
\`\`\`
`,
    },
    {
      slug: "comprehensions",
      title: "Comprehensions",
      summary: "List and dict comprehensions for mapping, filtering traces, and keeping data transforms in one line.",
      minutes: 11,
      level: "intermediate",
      md: `
A **comprehension** builds a list, dict, or set from an iterable in one expression. It is a loop plus an optional filter, packed tight. Agent code uses them constantly: extract tool names from a trace, drop failed steps, index observations by id.

They are not magic. They are readable when short and hostile when nested.

## List comprehensions

| Form | Reads as |
|---|---|
| \`[f(x) for x in xs]\` | Map |
| \`[x for x in xs if p(x)]\` | Filter |
| \`{k: v for ...}\` | Dict comp |
| \`{x for x in xs}\` | Unique set |

\`\`\`python
names = [t["name"] for t in trace]
failed = [t for t in trace if not t["ok"]]
slow = [t["name"] for t in trace if t.get("ms", 0) > 100]
\`\`\`

Read them as “make a list of *X* for each *item* in *iterable* if *condition*.”

Equivalent for-loop:

\`\`\`python
names = []
for t in trace:
    names.append(t["name"])
\`\`\`

Prefer the comprehension when the body is a single expression. Prefer a loop when you need multiple statements, exceptions, or side effects.

## Dict and set comprehensions

\`\`\`python
by_name = {t["name"]: t["ms"] for t in trace}
unique = {t["name"] for t in trace}
\`\`\`

If keys repeat, the last value wins. For “list of times per tool,” that is the wrong shape — use a list or \`collections.defaultdict(list)\`.

## Filtering traces

Traces grow. Before you send them back to a model, you often:

- keep only \`role == "tool"\`
- drop huge binary fields
- take the last *k* errors
- project to \`{name, ok, ms}\` so tokens stay small

Comprehensions plus slicing: \`errors[-3:]\`.

## Nested and too clever

Two \`for\` clauses are legal: \`[c for row in matrix for c in row]\`. A comprehension inside a comprehension is where teammates stop reading. If you nest, stop and write a helper.

## Mapping vs filtering vs if/else

### Filter drops rows; if/else does not

\`[t["name"] for t in trace if t["ok"]]\` **filters** rows. \`[t["name"] if t["ok"] else "FAIL" for t in trace]\` **maps** every row and never drops one. Mixing them up is how you lose failed steps from a dashboard. For “replace secrets with \`***\` but keep length,” you want if/else in the expression. For “only errors,” you want \`if\` at the end.

Dict comprehensions overwrite duplicate keys. \`{t["name"]: t["ms"] for t in trace}\` keeps the *last* duration per tool, not the sum. If you need totals, use \`Counter\` or a loop. The comprehension is the wrong fold.

\`\`\`tryit python
trace = [
    {"role": "tool", "name": "search", "ok": True, "ms": 120},
    {"role": "tool", "name": "read", "ok": False, "ms": 40},
    {"role": "assistant", "name": None, "ok": True, "ms": 10},
    {"role": "tool", "name": "search", "ok": True, "ms": 80},
]

names = [t["name"] for t in trace if t["name"]]
failed = [t for t in trace if not t["ok"]]
by_name = {t["name"]: t["ms"] for t in trace if t["role"] == "tool"}
slow = [t["name"] for t in trace if t["ms"] > 100]
tool_ok = {t["name"] for t in trace if t["role"] == "tool" and t["ok"]}

print("names", names)
print("failed", failed)
print("last ms per tool", by_name)
print("slow", slow)
print("successful tools", tool_ok)

# Project a smaller trace for the next prompt
compact = [
    {"name": t["name"], "ok": t["ok"]}
    for t in trace
    if t["role"] == "tool"
]
print("compact", compact)
print("last two tools", compact[-2:])
\`\`\`

## Generator expressions

\`(t["ms"] for t in trace)\` is lazy — no list until you consume it. \`sum(t["ms"] for t in trace)\` is idiomatic. Use a list when you need length, reuse, or slicing.

> **Tip:** If the line does not fit in ~80–100 characters, it is not a good comprehension anymore.

## Agent connection

Eval harnesses and memory policies are filters over traces. “Drop successful searches older than 10 steps” is a comprehension plus a slice. “All unique tools the agent used” is a set comprehension. Writing these as one-liners keeps the loop readable — as long as you name the result (\`failed\`, \`compact\`) instead of stuffing a 3-clause monster into \`print\`.

\`\`\`quiz
What does [x for x in xs if x] remove?
- Duplicates
- *Falsy items (None, 0, "", [], False)
- Only None
- Negative numbers only
explain: The if x test is truthiness. Empty strings and zeros are dropped too, which may or may not be what you want.
\`\`\`
`,
    },
    {
      slug: "stdlib",
      title: "The Standard Library",
      summary: "datetime, Counter, pathlib as strings, re, hashlib, and itertools — batteries you can use without pip.",
      minutes: 15,
      level: "intermediate",
      md: `
Python’s slogan is “batteries included.” Before you add a package, look in the [standard library](https://docs.python.org/3/library/). Agent runtimes lean on a handful of modules: time stamps, counters, paths, regex, hashing, and iteration tools.

These all run in Joeven (no network).

## datetime

\`datetime.now(timezone.utc)\` is the current UTC time. Always store UTC in traces. Use \`.isoformat()\` in JSON. \`timedelta(seconds=30)\` is a duration. Naive datetimes (no timezone) are how logs lie about “when.”

## collections.Counter

\`Counter\` counts hashable items. Tool-name histograms, token-ish word counts, “how often did search fail?” — all \`Counter\`. \`.most_common(3)\` is a one-liner dashboard.

## pathlib as strings

\`Path\` objects join with \`/\` on every OS: \`Path("agents") / "tools" / "search.py"\`. Tool APIs often want a **string** path. Convert with \`str(p)\` or \`p.as_posix()\` (forward slashes, friendly in JSON). You do not need the file to exist to manipulate the path.

## re

Regex is for patterns \`split\` cannot express: extract the first URL, pull \`step 12\`. Compile if you reuse a pattern. Prefer \`[0-9]+\` or \`r"\\d+"\` in raw strings. If \`in\` and \`startswith\` work, skip regex.

## hashlib

\`hashlib.sha256(bytes).hexdigest()\` fingerprints content. Hash a transcript to detect “did this run change?” Hash a file body for cache keys. Do not use MD5 for security; SHA-256 is the default habit.

## itertools

\`islice\`, \`cycle\`, \`repeat\`, \`product\`, \`chain\`. Lazy iterators for “first 5,” “round-robin tools,” “all (action, retry) pairs.” They avoid building huge lists.

\`\`\`tryit python
from datetime import datetime, timezone, timedelta
from collections import Counter
from pathlib import Path
import re
import hashlib
import itertools

now = datetime.now(timezone.utc)
print("iso", now.isoformat())
print("later", (now + timedelta(minutes=5)).time().isoformat())

print(Counter(["search", "read", "search", "search"]))

p = Path("agents") / "tools" / "search.py"
print("posix", p.as_posix(), "suffix", p.suffix, "stem", p.stem)
print("as str", str(p))

text = "step 12 of 20; see https://example.com/x"
print("nums", re.findall("[0-9]+", text))
print("url", re.search("https://[^ ]+", text).group())

print("sha", hashlib.sha256(b"transcript").hexdigest()[:12])
print("cycle", list(itertools.islice(itertools.cycle(["think", "act"]), 5)))
print("product", list(itertools.product(["search", "read"], [1, 2])))
\`\`\`

### Prefer stdlib until it hurts

These modules are how you stay portable. A Joeven lesson, a CI job, and a laptop with no extra \`pip\` packages can all timestamp a trace, count tool names, join a path, extract an id, and hash a body. Reach for a third-party library when the stdlib is honestly worse — HTTP clients, pydantic, vendor SDKs — not for \`Counter\`.

## Cheat sheet

| Module | Agent job |
|---|---|
| \`datetime\` | Trace timestamps, deadlines |
| \`Counter\` | Tool usage, error frequencies |
| \`pathlib\` | Safe join, then pass strings to tools |
| \`re\` | Extract ids and URLs from model text |
| \`hashlib\` | Cache keys, change detection |
| \`itertools\` | Bounded lazy iteration |
| \`json\` | Wire format (previous lesson) |

> **Note:** \`pathlib\` is not a sandbox. \`Path("../secrets")\` still points at secrets on a real machine. Constrain tool paths with an allow-listed directory.

## Agent connection

Production traces without timestamps are folklore. \`datetime\` plus \`json.dumps\` is a tracer. \`Counter\` on tool names is your first eval dashboard. \`hashlib\` lets you skip re-embedding unchanged chunks. \`Path.as_posix()\` keeps tool arguments OS-agnostic. The stdlib is the agent platform you already installed.

\`\`\`quiz
Why convert pathlib.Path to a string before putting it in a tool argument?
- Path cannot be printed
- *JSON and most tool APIs expect text paths, not Path objects
- Strings are faster than Path
- Path only works on Windows
explain: json.dumps cannot encode Path. Tools and models speak strings. Use as_posix() or str(path).
\`\`\`
`,
    },
    {
      slug: "packaging",
      title: "Virtual Envs and Packages",
      summary: "venv, pip, requirements.txt, and a tiny resolver simulation so you see how dependencies fan out.",
      minutes: 12,
      level: "intermediate",
      md: `
Joeven’s editor has no \`pip\`. Your laptop does. **Packaging** is how you install libraries into an isolated environment so “the agent” does not collide with every other Python project on the machine.

This lesson explains the real workflow, then **simulates** a resolver in Pyodide so you can see why \`httpx\` is never just one package.

## venv

A **virtual environment** is a directory with its own \`python\` and \`site-packages\`.

\`\`\`bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS / Linux
source .venv/bin/activate
python -m pip install --upgrade pip
\`\`\`

When the venv is active, \`pip install httpx\` goes *there*, not into the system Python. Deactivate with \`deactivate\`. Commit the code, not the \`.venv\` folder.

## pip and requirements.txt

\`pip install httpx pytest pydantic\` fetches wheels from [PyPI](https://pypi.org). Freeze what you use:

\`\`\`text
httpx==0.27.2
pydantic==2.8.2
pytest==8.3.2
\`\`\`

\`pip install -r requirements.txt\` recreates the environment. Pin **versions** for agents you ship. A surprise upgrade of an HTTP library is an incident.

There is also \`pip freeze > requirements.txt\`, which dumps *everything* transitive. Fine for apps; noisy for libraries. Many teams use lock files (\`uv lock\`, poetry) for the same idea: reproducible installs.

## What you actually need for agents

Keep the default stack small:

| Package | Role |
|---|---|
| \`httpx\` or \`requests\` | HTTP |
| \`pydantic\` | Schemas |
| \`pytest\` | Tests |
| One vendor SDK | Model calls |

Frameworks are optional. They pull a lot of transitive dependencies. You now know why that is not free.

## A tiny resolver (simulation)

Real pip solves version constraints. Here we only expand **requires** so you see the fan-out. No network.

\`\`\`tryit python
INDEX = {
    "httpx": {"version": "0.27.2", "requires": ["anyio", "certifi", "idna"]},
    "anyio": {"version": "4.4.0", "requires": ["idna"]},
    "certifi": {"version": "2024.7.4", "requires": []},
    "idna": {"version": "3.7", "requires": []},
    "pydantic": {"version": "2.8.2", "requires": ["annotated-types", "pydantic-core", "typing-extensions"]},
    "annotated-types": {"version": "0.7.0", "requires": []},
    "pydantic-core": {"version": "2.20.1", "requires": ["typing-extensions"]},
    "typing-extensions": {"version": "4.12.2", "requires": []},
}

def resolve(root):
    seen = []
    stack = [root]
    while stack:
        name = stack.pop()
        if name in seen:
            continue
        if name not in INDEX:
            raise KeyError("unknown package " + name)
        seen.append(name)
        stack.extend(reversed(INDEX[name]["requires"]))
    return [(n, INDEX[n]["version"]) for n in seen]

print("installing httpx pulls:")
for name, ver in resolve("httpx"):
    print(f"  {name}=={ver}")

print("installing pydantic pulls:")
for name, ver in resolve("pydantic"):
    print(f"  {name}=={ver}")
\`\`\`

Each line would become a row in \`pip freeze\`. Conflicts (two packages wanting different \`idna\` majors) are why lock files exist. This toy resolver ignores versions on purpose.

### Pins are part of the product

Version specifiers you will see: \`==\` exact pin, \`>=\` minimum, \`~=\` compatible release. Applications (your agent) should pin. Libraries (if you publish a toolkit) should be looser. Never let the model \`pip install\` a package it invented. Typosquatters wait for that. Review names against PyPI yourself, then add them to \`requirements.txt\` in git.

> **Warning:** Never \`pip install\` a package because a model told you to, on a machine with secrets. Read the name. Typosquatting is real.

## Agent connection

Your agent’s environment is part of the product. Pin it. Recreate it in CI. The loop you wrote in the stdlib still runs, but HTTP, pydantic, and the vendor SDK live in the venv. When a tool works “on my machine,” the next question is: same \`requirements.txt\`? Packaging is how you stop “it imported yesterday.”

\`\`\`quiz
What is the main purpose of a virtual environment?
- Make Python faster
- *Isolate project packages from the system and other projects
- Compile Python to C
- Skip requirements.txt
explain: venv gives you a private site-packages so versions do not collide across projects.
\`\`\`
`,
    },
    {
      slug: "http-apis",
      title: "HTTP and APIs",
      summary: "Requests, responses, status codes, JSON bodies — simulated with functions because the browser sandbox has no network.",
      minutes: 14,
      level: "intermediate",
      md: `
Almost every agent tool is an **HTTP API** in disguise: search, tickets, email, the model itself. You send a **request** (method, URL, headers, body) and receive a **response** (status, headers, body). You do not need \`urllib\` in Joeven — the network is blocked — but you do need the model in your head.

## The request

| Part | Meaning | Example |
|---|---|---|
| Method | Verb | \`GET\` read, \`POST\` create, \`DELETE\` remove |
| Path | Resource | \`/v1/search\` |
| Query | Filters | \`?q=python&k=3\` |
| Headers | Metadata | \`Authorization\`, \`Content-Type\` |
| Body | Payload | JSON object |

\`GET\` should not have a meaningful body. \`POST\` to an LLM endpoint carries the prompt as JSON.

## The response

Status codes are the first branch in your tool:

- **2xx** success — parse JSON
- **4xx** your fault — bad args, 401 auth, 404 missing, 429 rate limit (retry)
- **5xx** their fault — retry with backoff or fail

The body is often JSON. \`Content-Type: application/json\` tells you to \`json.loads\`. Never assume 200 means the *business* succeeded — some APIs return \`{"ok": false}\` with HTTP 200.

## Idempotency and safety

\`GET\` should be safe to retry. \`POST /charge\` is not. Agent tools that money-move or delete need idempotency keys and human approval. HTTP does not save you from a loop that retries a purchase.

## Simulate a gateway

Here a dict of \`(method, path)\` handlers stands in for a server. Your tool code should look the same when you later swap in \`httpx\`.

\`\`\`tryit python
ROUTES = {}

def route(method, path):
    def wrap(fn):
        ROUTES[(method, path)] = fn
        return fn
    return wrap

@route("GET", "/health")
def health(req):
    return {"status": 200, "body": {"ok": True}}

@route("POST", "/tools/search")
def search(req):
    q = (req.get("body") or {}).get("q")
    if not q:
        return {"status": 400, "body": {"error": "q required"}}
    return {"status": 200, "body": {"hits": [f"result for {q}"]}}

@route("POST", "/v1/messages")
def model(req):
    # fake LLM: echo a tool call
    return {
        "status": 200,
        "body": {
            "type": "tool",
            "name": "search",
            "args": {"q": "python agents"},
        },
    }

def request(method, path, body=None, headers=None):
    req = {
        "method": method,
        "path": path,
        "body": body or {},
        "headers": headers or {},
    }
    handler = ROUTES.get((method, path))
    if handler is None:
        return {"status": 404, "body": {"error": "not found"}}
    return handler(req)

print(request("GET", "/health"))
print(request("POST", "/tools/search", body={"q": "python agents"}))
print(request("POST", "/tools/search", body={}))
print(request("GET", "/secret"))
print(request("POST", "/v1/messages", headers={"Authorization": "Bearer demo"}))
\`\`\`

On a real machine you would write something like \`httpx.post(url, json=body, headers=headers, timeout=30.0)\` and then branch on \`response.status_code\`. Timeouts are part of the API. An agent without timeouts waits forever.

> **Warning:** Put API keys in headers from the environment, never in the prompt, never in query strings that get logged.

## Designing tools as HTTP wrappers

### Hide status codes from the model

A good tool function hides HTTP:

\`\`\`python
def search(q: str, k: int = 5) -> list[str]:
    data = client.post("/tools/search", json={"q": q, "k": k})
    return data["hits"]
\`\`\`

The model sees \`search(q, k)\`. You see status codes, retries, and JSON. That split is the job.

## Agent connection

The LLM HTTP endpoint is one more API: you POST messages, you get a completion or a tool call. Every other tool is the same shape with a different path. If you can write \`request(method, path, body)\` and handle 400/404/429/500, you can wrap the world. The sandbox forced us to fake the transport; the **interface** is the real lesson.

\`\`\`quiz
A tool gets HTTP 429 from an API. What is the usual meaning?
- The URL does not exist
- *You are rate-limited; backing off and retrying may be appropriate
- The JSON body was fine and the call succeeded
- The server does not speak HTTP
explain: 429 means too many requests. Retryable, unlike 400 validation errors or 401 bad keys.
\`\`\`
`,
    },
    {
      slug: "async-intro",
      title: "Async Thinking",
      summary: "Why async exists for waiting on tools and APIs, and a sequential simulation of concurrent work.",
      minutes: 13,
      level: "intermediate",
      md: `
**Async** is Python’s way to overlap **waiting**. While search is on the network, you could fetch a URL and embed a document. You are not using extra CPU cores (that is threading or multiprocessing). You are not blocking the event loop on I/O.

Agent runtimes care because a turn often fires **several independent tools**. Sequential HTTP wastes wall-clock. Concurrent I/O feels instant. Joeven cannot run a real event loop against the network here, so we **simulate** overlap with clocks.

## The problem async solves

| Schedule | Wall time for 300+150+200 ms |
|---|---|
| Sequential | 650 ms (sum) |
| Concurrent starts | 300 ms (max) |

Three tools, durations 300 ms, 150 ms, 200 ms:

- Sequential: 300 + 150 + 200 = **650 ms**
- Concurrent (all start together): **300 ms** (the max)

If each “ms” is a network round trip, this is the difference between a snappy agent and a bored user.

## async def and await (concept)

In real code you write:

\`\`\`python
async def search(q):
    await client.get(...)
    return hits

results = await asyncio.gather(search("a"), search("b"))
\`\`\`

\`async def\` defines a coroutine. \`await\` pauses it until the I/O finishes, letting other coroutines run. \`asyncio.gather\` starts several and waits for all.

You only need async when you **wait**. CPU-heavy work (parsing a huge JSON, hashing gigabytes) does not get faster with \`async\` alone.

## A fake scheduler

Treat each job’s \`ms\` as completion time from t=0 (they all start together). Finish in that order. No threads. No \`asyncio\`. The numbers still teach the budget.

\`\`\`tryit python
jobs = [
    {"name": "search", "ms": 300},
    {"name": "fetch", "ms": 150},
    {"name": "embed", "ms": 200},
]

sequential = sum(j["ms"] for j in jobs)
parallel = max(j["ms"] for j in jobs)
print("sequential_ms", sequential)
print("parallel_ms", parallel)
print("saved_ms", sequential - parallel)

# Completions in time order (all started at t=0)
pending = list(jobs)
print("completion order:")
while pending:
    pending.sort(key=lambda j: j["ms"])
    done = pending.pop(0)
    print(f"  t={done['ms']}: {done['name']} done")

# Sequential fake of the same tools (one after another)
t = 0
print("sequential order:")
for j in jobs:
    t += j["ms"]
    print(f"  t={t}: {j['name']} done")
\`\`\`

## When agents should be concurrent

### Overlap reads, serialize writes

Safe to overlap: independent **reads** (search, fetch, retrieve chunks).

Dangerous to overlap: writes that collide (two tools editing one file), anything with side effects you cannot roll back, anything the user must approve **one at a time**.

A simple rule: \`asyncio.gather\` only over tools marked \`readonly=True\` in the registry. Serialise the rest.

> **Warning:** Concurrent tools still share one transcript. Append results with a lock or gather then extend — do not interleave \`list.append\` from real threads without care. Async on one thread is usually easier than threads.

## Timeouts are async’s friend

Every await should have a timeout. An agent that waits forever on one hung tool is a stuck loop. In \`httpx\`: \`timeout=30\`. In asyncio: \`asyncio.wait_for(coro, 30)\`. Our simulation used a known \`ms\`; production does not.

## Agent connection

The agent loop can stay sequential and still be correct. Async is an optimization for **I/O-bound** tool batches. Learn to see a turn as a graph: which tools need whose outputs? Independent nodes can run together; dependent ones stay \`await\`ed in order. You do not need to write \`async def\` in Joeven — you need to stop assuming every tool must wait for the previous one when they do not share data.

\`\`\`quiz
Async mainly helps when the program is…
- *Waiting on I/O (network, disk) and can overlap those waits
- Doing heavy CPU math in pure Python
- Avoiding the need for tests
- Making HTTP optional
explain: async overlaps waiting. CPU-bound work needs other tools. Agent APIs are mostly I/O.
\`\`\`
`,
    },
    {
      slug: "testing",
      title: "Testing Tools and Goals",
      summary: "assert, small test runners, and writing tests for tools plus goal_satisfied — the difference between a demo and a system.",
      minutes: 14,
      level: "intermediate",
      md: `
An agent without tests is a demo that has not failed yet. You cannot unit-test “the model will be wise,” but you **can** test everything around it: tools, parsers, budgets, and the **goal predicate**.

\`assert\` is the smallest testing tool. If the condition is false, Python raises \`AssertionError\`. \`pytest\` (on your machine) turns functions named \`test_*\` into a suite. Here we write a tiny runner that works in the browser.

## What to test

### Test your code, stub the model

| Piece | Why |
|---|---|
| Pure tools | \`add(2,3)==5\`, search stub returns a list |
| Parsers | JSON actions, invalid JSON raises or returns error |
| \`goal_satisfied(state)\` | Done means done; missing fields are not success |
| Guardrails | Unknown tool rejected; http URLs blocked |
| Budget | Ninth step refused when max is 8 |

Do **not** start with “call the live LLM.” That is slow, flaky, and expensive. Stub the model with a script of actions (you did this in Getting Started). Test the loop with a fake policy.

## assert

\`\`\`python
assert add(2, 3) == 5
assert goal_satisfied({"pr_url": "https://x", "tests_passed": True}) is True
\`\`\`

Write \`is True\` when the function must return a real bool — \`assert goal_satisfied(...)\` would also pass for a truthy string, which is a sloppy predicate.

## goal_satisfied

This function is the product. If it is wrong, the agent stops early or never stops. Test the happy path **and** every missing piece.

\`\`\`tryit python
def goal_satisfied(state):
    url = state.get("pr_url")
    return isinstance(url, str) and url.startswith("https://") and state.get("tests_passed") is True

def add(a, b):
    return a + b

def parse_action_type(text):
    import json
    data = json.loads(text)
    return data["type"]

def run_tests():
    tests = [
        ("add_ints", lambda: add(2, 3) == 5),
        ("goal_happy", lambda: goal_satisfied({"pr_url": "https://x/y", "tests_passed": True}) is True),
        ("goal_no_pr", lambda: goal_satisfied({"tests_passed": True}) is False),
        ("goal_http", lambda: goal_satisfied({"pr_url": "http://x", "tests_passed": True}) is False),
        ("goal_failed_tests", lambda: goal_satisfied({"pr_url": "https://x/y", "tests_passed": False}) is False),
        ("parse_tool", lambda: parse_action_type('{"type": "tool"}') == "tool"),
    ]
    failed = 0
    for name, fn in tests:
        try:
            assert fn() is True
            print(name, "PASS")
        except AssertionError:
            print(name, "FAIL")
            failed += 1
        except Exception as e:
            print(name, "ERROR", type(e).__name__, e)
            failed += 1
    print("failed", failed)
    return failed

run_tests()
\`\`\`

Change \`goal_satisfied\` so that \`http://\` URLs pass, and watch \`goal_http\` go red. That is the loop you want: tests specify the contract.

## Arrange, act, assert

Structure each test: build state, call the function, assert. One behavior per test. Names should read like sentences: \`goal_no_pr\`, \`unknown_tool_rejected\`.

Do not test the vendor model’s prose. Do not assert on the exact wording of a thought. Do assert that an unknown tool never executes, that retries stop at three, and that \`goal_satisfied\` is false when \`tests_passed\` is missing. Those tests survive prompt changes. They are the contract between your Python and the rest of the world.

On a real machine:

\`\`\`bash
pip install pytest
pytest -q
\`\`\`

Joeven’s runner is the same idea without files.

> **Tip:** Keep tools deterministic in tests. If search hits the web, inject a fake client. The lesson is not “mock everything”; it is “the loop must run without a credit card.”

## Agent connection

\`goal_satisfied\` is how autonomy becomes **checkable**. The model can ramble; the predicate cannot. Test it like a lock. Test parsers so a bad JSON action becomes an observation, not a crash. Test budgets so a bug cannot \`while True\` a paid API. Joeven’s later eval track generalizes this: tests for tools, evals for models. You start with \`assert\`.

\`\`\`quiz
Why test goal_satisfied instead of only chatting with the model?
- Models cannot be wrong
- *The stop condition is code you own; it must be right even with a stub policy
- assert does not work with dicts
- Tests replace the need for a budget
explain: You control the predicate. Unit-test it. The LLM is a component you stub while the loop and tools stay honest.
\`\`\`
`,
    },
    {
      slug: "agent-python",
      title: "A Mini Agent Toolkit",
      summary: "Parse JSON actions, retry with a helper, keep a transcript, enforce a budget — the Python core of a tool-using loop.",
      minutes: 16,
      level: "intermediate",
      md: `
This lesson puts the track together. You will run a **mini toolkit**: parse a JSON action, call a tool, **retry** flaky failures, append to a **transcript**, and stop when a **budget** is consumed. There is still no paid model. The policy is a script of actions — the same trick as the Getting Started track, now with adult error handling.

If you can hold this in your head, every framework you meet later is a costume.

## The pieces

| Piece | Job |
|---|---|
| \`parse_action\` | \`json.loads\` + check \`type\` is \`tool\` or \`final\` |
| \`retry\` | Call \`fn(attempt)\` up to N times |
| \`transcript\` | List of \`{role, content}\` dicts |
| \`budget\` | Integer cap on steps |
| \`execute\` | Dispatch on tool name |

The loop is: for each action, consume budget, parse, either stop on \`final\` or execute with retry, then append.

## Parse strictly

Invalid JSON and unknown types should fail **before** a tool runs. That is a safety feature. Convert parse errors into transcript rows in a fuller system; here we let them raise so you see them.

## Retry is not a second loop with no cap

\`retry(fn, times=3)\` is a bounded \`for\`. Log each failure. After the last attempt, raise. Only retry errors you consider **transient** (rate limits, timeouts). Do not retry \`400 Bad Request\` or unknown tools.

\`\`\`tryit python
import json

def parse_action(text):
    data = json.loads(text)
    kind = data.get("type")
    if kind not in ("tool", "final"):
        raise ValueError("unknown action type: " + str(kind))
    return data

def retry(fn, times=3):
    last_error = None
    for attempt in range(1, times + 1):
        try:
            return fn(attempt)
        except Exception as exc:
            last_error = exc
            print(f"attempt {attempt} failed: {exc}")
    raise last_error

transcript = []
max_steps = 6
used = 0

actions = [
    {"type": "tool", "name": "search", "args": {"q": "python retry"}},
    {"type": "tool", "name": "flaky", "args": {}},
    {"type": "final", "text": "Search complete."},
]

flaky_fails_left = {"n": 2}

def execute(name, args, attempt):
    if name == "flaky" and flaky_fails_left["n"] > 0:
        flaky_fails_left["n"] -= 1
        raise RuntimeError("429 rate limit")
    if name not in ("search", "flaky"):
        raise ValueError("unknown tool")
    return {"ok": True, "name": name, "args": args, "attempt": attempt}

for action in actions:
    used += 1
    if used > max_steps:
        print("stop: budget")
        break
    if action["type"] == "final":
        transcript.append({"role": "assistant", "content": action["text"]})
        break
    result = retry(
        lambda attempt: execute(action["name"], action.get("args", {}), attempt)
    )
    transcript.append({"role": "tool", "content": result})

print("used", used, "of", max_steps)
for row in transcript:
    print(row["role"], row["content"])
\`\`\`

You should see two failed attempts on \`flaky\`, then success on attempt 3, then a final assistant line. \`used\` is 3. Raise \`max_steps\` to 2 and the loop should stop early — add that experiment.

## From script to model

### Same toolkit, statistical policy

Replace the \`actions\` list with:

1. Build a prompt from \`transcript\`
2. Call a model (HTTP)
3. \`parse_action\` on the response text
4. Same execute / retry / budget

The toolkit does not change. The policy becomes statistical. That is why Joeven taught Python before prompting: the container has to be solid.

## What you still need in production

- Timeouts on every tool
- Allow-listed tool names
- Schema validation of \`args\`
- Redaction of secrets in the transcript
- \`goal_satisfied\` as a first-class stop
- Tests for parse, retry, and budget (you can add them in the editor)

> **Tip:** Keep the transcript append in **one** function. If every tool logs differently, you will never write an eval harness.

## Agent connection

You now have the Python core of an autonomous agent: JSON actions, tools as functions, retries, memory as a list, a kill switch. The rest of the academy — math, models, RAG, multi-agent, production — plugs into this shape. When a library feels magical, find these five objects. They are always there.

\`\`\`quiz
What should happen when the step counter exceeds max_steps?
- Keep calling the model; it will stop itself
- *Stop the loop (budget exhausted), even if the goal is unmet
- Delete the transcript
- Retry forever
explain: A budget is a hard stop. Models do not reliably halt. Your Python loop must.
\`\`\`
`,
    },
  ],
};
