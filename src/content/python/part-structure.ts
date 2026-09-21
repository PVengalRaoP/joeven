import type { RawLesson } from "@/lib/types";

export const pythonStructure: RawLesson[] = [
  {
    slug: "comprehensions",
    title: "Comprehensions",
    summary:
      "Build lists, dicts, and sets in one expression. Filter a trace of dicts. Use a for-loop when the body is more than one step.",
    minutes: 20,
    level: "intermediate",
    md: `
A **comprehension** is a short line that builds a new list, dict, or set from an old one. It is a loop packed into one expression. The result is a **new** collection. The old one is not changed.

Agents store a **trace**: a list of dicts, one dict per step. You often want names, failed steps, or unique tools. A comprehension does that in one line. They are not magic. Keep them short. If the line is hard to read, use a for-loop.

You already know the long form: make an empty list, \`for\`, \`append\`. The short form is for when the body is one value and maybe one test. That is most “filter this trace” work.

\`\`\`viz flow
title List in, list out
layout lr
node inn trace
node rule keep failed
node out new list
edge inn rule
edge rule out
caption A comprehension builds a new list. The old trace stays. If the body is more than one step, use a for-loop.
\`\`\`

## List comprehensions

A list comprehension makes a new list.

| Form | Meaning |
|---|---|
| \`[x["name"] for x in trace]\` | Take one field from each row |
| \`[x for x in trace if not x["ok"]]\` | Keep only some rows |
| \`{x["name"]: x["ms"] for x in trace}\` | Build a dict |
| \`{x["name"] for x in trace}\` | Build a set of unique names |

Read it as: “make a list of *this*, for each *item* in *the old list*, if *this test*.”

\`\`\`python
trace = [{"name": "search"}, {"name": "read"}]
names = [row["name"] for row in trace]
print(names)
\`\`\`

That is the same idea as:

\`\`\`python
names = []
for row in trace:
    names.append(row["name"])
print(names)
\`\`\`

Use the short form when the body is one simple value. If you need a comment in the middle, you needed a loop.

You can walk any iterable: a list, a tuple, a set, \`range\`, dict keys. \`[n * 2 for n in range(4)]\` is \`[0, 2, 4, 6]\`. Prefer naming the source: \`for row in trace\`, not \`for x in t\`.

## Filter a list

Add \`if\` at the end to keep only some items. There is no \`else\` in a simple filter comprehension. You either keep the item or you skip it.

\`\`\`python
failed = [row for row in trace if not row["ok"]]
slow = [row["name"] for row in trace if row["ms"] > 100]
\`\`\`

The test uses truth. \`if row["ok"]\` drops rows where \`ok\` is \`False\`. If \`ok\` might be missing, use \`if not row.get("ok")\` or a loop with \`.get\`. A missing key in \`row["ok"]\` is still \`KeyError\` inside a comprehension.

You can have more than one \`for\` (nested). Nested comprehensions get unreadable quickly. Nested loops are allowed to stay loops.

| Want | Comprehension | Loop instead when |
|---|---|---|
| Field from each row | \`[row["name"] for row in trace]\` | you also print |
| Some rows | \`[row for row in trace if ...]\` | missing keys, \`try\` |
| Last value per name | \`{row["name"]: row["ms"] for row in trace}\` | you wanted *all* times |
| Unique names | \`{row["name"] for row in trace}\` | you needed order |

## Dict and set comprehensions

A **dict comprehension** builds a mapping. If a key appears twice, the last value wins. That is useful for “last latency per tool name.”

A **set comprehension** keeps unique values. Order is not the point. Uniqueness is. \`{row["name"] for row in trace}\` is the set of tools that ran.

\`\`\`python
last_ms = {row["name"]: row["ms"] for row in trace}
tools = {row["name"] for row in trace}
print(last_ms)
print(tools)
\`\`\`

Do not use a set comprehension as the transcript. You would drop duplicates and order. Same rule as the sets lesson.

## Filter a trace of dicts

A trace is a list of dicts like \`{"name": "search", "ok": True, "ms": 120}\`.

Common jobs:

- keep only tool rows
- drop failed steps, or keep only failed steps
- make a smaller dict for the next prompt (fewer keys, fewer tokens)

Name the result. \`failed\` is better than a long line inside \`print\`. Named results are testable: \`assert len(failed) == 1\`.

Compacting a row is often a loop because you also print:

\`\`\`python
compact = []
for row in trace:
    if row["ok"]:
        compact.append({"name": row["name"], "ms": row["ms"]})
\`\`\`

That is two actions (test and build a smaller dict) plus maybe a print. A comprehension can build \`compact\` in one line. The print cannot live inside it cleanly. When you need the print, keep the loop.

Token budgets often start with a comprehension: \`rows = [r for r in trace if r.get("role") != "debug"]\` then maybe \`rows[-8:]\`. That is filter then slice. Two clear steps. Do not pack both into an unreadable line.

## Walkthrough: last-wins and .get

\`\`\`python
trace = [
    {"name": "search", "ok": True, "ms": 120},
    {"name": "search", "ok": True, "ms": 80},
]
last = {row["name"]: row["ms"] for row in trace}
print(last)  # {'search': 80} — last wins
\`\`\`

If you needed both times, you wanted a list: \`[row["ms"] for row in trace if row["name"] == "search"]\`. Dict keys are unique. Last write wins. That is not a bug in Python. It is the wrong collection if you needed history.

Optional fields:

\`\`\`python
safe = [row for row in trace if not row.get("ok")]
\`\`\`

\`.get("ok")\` is \`None\` when missing, and \`not None\` is True, so missing \`ok\` counts as failed. Square brackets would crash the whole comprehension on the first bad row. A loop can skip one row and keep going. That is why messy traces prefer loops.

## When a for-loop is clearer

Use a **for-loop** when you need more than one action:

- append *and* print
- handle a missing key
- update two lists
- nest a lot of tests
- \`try/except\` per item

A comprehension should not hide a whole program. If the line does not fit on the screen, it is not a good comprehension. Write a loop.

There is also a **generator expression**: \`(row["name"] for row in trace)\`. It is lazy. You do not need it to filter a normal agent trace. \`list(...)\` around it makes a list. Stick to \`[...]\` until you have a huge file.

Side effects inside a comprehension (print, append to another list) are legal Python and a bad habit. Readers expect a new collection, not a second mutation. Put mutations in a loop.

## What goes wrong

- Side effects inside a comprehension (print, append to another list).
- \`KeyError\` because you used \`[]\` on optional fields.
- Set comprehension as a log.
- Nested comprehensions nobody can read.
- Forgetting that dict comprehensions overwrite duplicate keys — sometimes you wanted a list of all times, not the last.
- Packing filter plus slice plus a nested dict into one line.

\`\`\`tryit python
trace = [
    {"name": "search", "ok": True, "ms": 120},
    {"name": "read", "ok": False, "ms": 40},
    {"name": "search", "ok": True, "ms": 80},
    {"name": "write", "ok": True, "ms": 15},
]

names = [row["name"] for row in trace]
failed = [row for row in trace if not row["ok"]]
slow = {row["name"]: row["ms"] for row in trace if row["ms"] > 50}
unique = {row["name"] for row in trace}

print("names", names)
print("failed", failed)
print("slow", slow)
print("unique", unique)

compact = []
for row in trace:
    if row["ok"]:
        compact.append({"name": row["name"], "ms": row["ms"]})
        print("kept", row["name"])
print("compact", compact)

safe = [row.get("name") for row in trace if not row.get("ok")]
print("failed names via get", safe)
\`\`\`

Add a fifth row with a high \`ms\` and watch \`slow\` take the last value for that name. That last-wins rule is the dict comprehension. \`safe\` uses \`.get\` so a missing \`ok\` would not crash.

## How agents use this

An agent trace is a list of dicts. You filter it before you send it back to the model. Keep failed tools. Drop huge fields. Take unique tool names with a set. If you also need to print or catch errors, use a for-loop. Short lines are a tool, not a rule.

Eval reports use the same idea: \`failed = [c for c in cases if not c["pass"]]\`. Then \`len(failed)\` is the scoreboard. You will write tiny test runners later. They are loops. The filter of results can be a comprehension. Mix them on purpose, not by habit.

Compacting for tokens is the daily job: keep \`role\` and a short \`content\`, drop \`debug\` rows, then slice the tail. Three named results beat one clever line. Tests can assert \`len(compact) <= 8\` and \`"html" not in str(compact)\`.

Allowlist diffs are a set comprehension plus a set: \`{row["name"] for row in trace} - ALLOWED\`. Tools the model used that you never allowed. That is a policy report in one expression. Keep \`ALLOWED\` as a set. Keep \`trace\` as a list.

When a comprehension crashes halfway, you get no list at all. A loop can append the good rows and record the bad index. At the trust edge (model JSON, files), prefer the loop. On traces *you* built with a stable shape, comprehensions are fine.

\`\`\`quiz
When is a for-loop clearer than a comprehension?
- Always. Never write a comprehension.
- *When you need several steps, prints, or extra checks inside the loop
- Only when you build a dict
- Only in the browser
explain: A comprehension is one expression. A loop is better when the body has more than one action.
\`\`\`
`,
  },
  {
    slug: "oop",
    title: "Classes",
    summary:
      "Make a class with __init__, self, and methods. Build a tiny Agent with goal, step, and run. Know when a function is enough.",
    minutes: 21,
    level: "intermediate",
    md: `
A **class** is a plan for an object. An **instance** is one object made from that plan. A **method** is a function that lives on the class. You already use classes. \`str\`, \`list\`, and \`dict\` are types. Now you write your own.

An agent is a natural object. It has a goal. It has a step count. It has a log. It can run. You can store the same facts in a dict. A class helps when those facts travel together *and* you have actions: \`run\`, \`reset\`, \`record\`.

\`\`\`viz flow
title Data on the object, plus actions
layout lr
node goal goal
node step step
node log log
node run run()
edge goal run
edge step run
edge log run
caption A class is a plan. An instance holds goal, step, and log. run() is a method on that object.
\`\`\`

Classes are not required to write an agent. Many good agents are functions plus a state dict. Use a class when the object is real in your head: this agent, that counter, this tool runner.

## class, __init__, and self

| Piece | Role |
|---|---|
| \`class Agent\` | The plan |
| \`__init__\` | Runs when you make one object |
| \`self\` | This object |
| \`self.goal\` | Data on this object |
| \`run\` | A method you can call |

\`self\` is the first parameter of every method. Python fills it in. You do not pass it at the call site. \`agent.run(3)\` is \`Agent.run(agent, 3)\` underneath. If you forget \`self\` in the definition, the first argument you pass is swallowed as \`self\` and the error is confusing.

\`\`\`python
class Counter:
    def __init__(self, start):
        self.n = start

    def inc(self):
        self.n += 1
        return self.n

c = Counter(0)
print(c.inc())
print(c.n)
\`\`\`

- \`Counter(0)\` calls \`__init__\`
- \`self.n\` belongs to *this* counter
- Two counters do not share \`n\`

Class names use CapitalizedWord: \`Agent\`, \`Counter\`, \`ToolCall\`. That is the usual style. The instance is snake_case: \`agent\`, \`counter\`.

\`__init__\` should store data and maybe validate. It should not start a paid loop. Call \`run\` separately. Tests then build an \`Agent\` without spending tokens.

## Methods

A method can read and change \`self\`. Prefer methods that return a value you can test. A method that only prints is hard to check later. \`run\` should return the log or a result dict.

Keep methods small. \`run\` can call a smaller method. Do not put the whole program in one method. \`record(self, row)\` that appends to \`self.log\` is easier to test than a 200-line \`run\`.

A method can take extra arguments after \`self\`: \`def run(self, max_steps):\`. Defaults work: \`def run(self, max_steps=8):\`. List defaults are still a bug. Do not write \`def run(self, log=[]):\`.

A method should not need ten arguments if those values already live on \`self\`. Pass \`max_steps\` because it varies per run. Do not pass \`goal\` into \`run\` if \`self.goal\` already holds it. Duplicate sources of truth get out of sync. Read from \`self\`. Return something tests can see.

## A tiny Agent

Here is a small agent. It stores a **goal** (what to do), a **step** (how far it has gone), and a **log** (what happened). \`run\` loops until it hits a max.

\`\`\`python
class Agent:
    def __init__(self, goal):
        self.goal = goal
        self.step = 0
        self.log = []

    def run(self, max_steps):
        while self.step < max_steps:
            self.step += 1
            self.log.append({"step": self.step, "goal": self.goal})
        return self.log
\`\`\`

That is enough to see the shape. Later lessons add tools and model calls. The class is still: data on \`self\`, plus a few methods.

Two objects must not share one log list by accident. Put \`self.log = []\` in \`__init__\`. Do not put a list on the class body:

\`\`\`python
class Bad:
    log = []  # shared by every Bad instance
\`\`\`

That is the mutability lesson on a class. Every instance would append to one list. The same bug happens if you write \`def __init__(self, log=[]):\` and skip passing log. Defaults lesson, again.

| Where the list lives | Shared? | Safe for two agents? |
|---|---|---|
| \`self.log = []\` in \`__init__\` | no | yes |
| \`log = []\` on the class body | yes | no |
| \`def __init__(self, log=[])\` | yes, if callers skip \`log\` | no |
| \`self.log = given_list\` | yes, if two agents get the same list | only if each caller passes a new list |

## Walkthrough: leftover state and reset

\`run\` mutates \`self.step\` and \`self.log\`. Call \`run\` twice on the same instance and the second call continues from the old step unless you reset. Tests should build a new instance, or you add \`reset\`:

\`\`\`python
def reset(self):
    self.step = 0
    self.log = []
\`\`\`

A new empty list, not \`self.log.clear()\`, if any caller still holds the old log. \`clear()\` mutates the shared object. A new \`[]\` isolates. Same copy-vs-change rule.

Validate in \`__init__\` when a bad goal should not create an object: empty goal string, missing tools dict. Raise \`ValueError\` with a clear message. Do not start \`run\` from \`__init__\`. Construction and execution are different moments. Tests need the first without the second.

## When not to use a class

A **function** is enough when you have one job and little saved state.

\`\`\`python
def done(step, max_steps):
    return step >= max_steps
\`\`\`

Do not wrap that in a class. Extra classes make the file longer and the idea harder.

Use a class when several values travel together *and* you have actions on them: \`goal\`, \`step\`, \`log\`, plus \`run\`.

| You have | Pick |
|---|---|
| One job, little saved state | A function |
| Several values plus actions | A class |
| Only a pile of fields, almost no behavior | A dataclass (next lesson) |

## Dataclasses come later

Typing \`__init__\` by hand gets old when the class is mostly data. The next lesson shows **dataclasses**. They write some of this for you. Learn \`class\`, \`self\`, and methods first. Then use the short form when it fits.

## What goes wrong

- Forgetting \`self\`.
- Shared list on the class body.
- Doing all the work in \`__init__\`.
- A class with one method that is really a function.
- Mutating another instance’s log because you copied the name, not the list.
- Calling \`run\` again in a test and not noticing \`step\` continued.
- A method that only prints, so tests have nothing to assert.

\`\`\`tryit python
class Agent:
    def __init__(self, goal):
        self.goal = goal
        self.step = 0
        self.log = []

    def run(self, max_steps):
        while self.step < max_steps:
            self.step += 1
            row = {"step": self.step, "goal": self.goal}
            self.log.append(row)
        return self.log

agent = Agent("find a file")
print(agent.run(3))
print("step now", agent.step)

other = Agent("write a note")
print("other starts at", other.step, "log", other.log)
print("same log object?", agent.log is other.log)

def done(step, max_steps):
    return step >= max_steps

print("done?", done(agent.step, 3))
print("run again continues", agent.run(4)[-1])
\`\`\`

Make two agents. Confirm their logs are different lists. Then call \`run\` again on the first agent: \`step\` continues from 3 unless you reset. That leftover state is why tests should build a new instance. \`agent.log is other.log\` should be False.

## How agents use this

You can store agent state in a dict. A class helps when that state grows: goal, step, log, budget. Keep methods small. \`run\` should be a short loop. If a job is one function with two arguments, do not make a class. Save classes for objects that hold data and act on it.

A tool runner can be a class with a registry on \`self.tools\` and a method \`call(self, name, **kwargs)\`. Two runners then have two registries. That is how you stub tools in tests: pass a fake dict into \`__init__\`.

Frameworks hide this behind graphs and nodes. Underneath there is still an object or a dict with a loop. If you cannot point to \`self.step\` or \`state["step"]\`, you cannot cap the budget. The class is a naming device for that state.

\`record\` as its own method is the test seam: tests call \`record\` with a fake observation and skip the model. \`run\` only loops. If \`run\` also parses JSON, calls HTTP, and writes files, you cannot test the budget without a network. Split methods the way you split files.

Two \`Agent\` instances in one process is the multi-user case. Each needs its own \`self.log\`. Sharing \`self.tools\` (a dict of functions) is fine. Sharing \`self.log\` is a leak. Put mutable user data on \`self\` in \`__init__\` as a **new** list or dict. Put shared code on the class as methods.

\`\`\`quiz
When is a function enough, with no class?
- Never. Always write a class.
- *When you have one job and little saved state
- Only for text
- Only in Pyodide
explain: A class pays off when several values travel together and you have methods. A single job can be a function.
\`\`\`
`,
  },
  {
    slug: "dataclasses",
    title: "Dataclasses",
    summary:
      "Use dataclass to hold data. Freeze a ToolCall snapshot. Set list defaults with field(default_factory=list). Compare with a plain dict.",
    minutes: 20,
    level: "intermediate",
    md: `
A **dataclass** is a short way to make a class that mainly holds data. Python writes \`__init__\` and a useful print form for you. You still have a real class. You can add methods later. Start with fields.

Import it from the standard library:

\`\`\`python
from dataclasses import dataclass
\`\`\`

Put \`@dataclass\` on the line above the class. List fields with types. That is the record. \`@dataclass\` is a **decorator**: a line that wraps the class and fills in boilerplate. You do not need to write other decorators in this track.

Use a dataclass when the object is a **record**: a tool call, a run state, a case in an eval file. Use a normal class when behavior is the point and data is leftover. Use a dict when the shape is still JSON you do not trust.

\`\`\`viz flow
title A record with named fields
layout lr
node name name
node query query
node call ToolCall
edge name call
edge query call
caption A dataclass is a short class for data. Freeze a snapshot you must not edit.
\`\`\`

## @dataclass

\`\`\`python
from dataclasses import dataclass

@dataclass
class ToolCall:
    name: str
    query: str
\`\`\`

Then:

\`\`\`python
call = ToolCall("search", "python lists")
print(call.name)
print(call)
\`\`\`

The print form shows field names and values. That is nicer in a trace than \`<__main__.ToolCall object>\`. Equality compares fields: two \`ToolCall\`s with the same name and query compare equal. Two dicts also compare equal that way, but a typo key in a dict is still “equal to itself” and wrong.

You construct with positional or keyword args: \`ToolCall(name="search", query="python lists")\`. Required fields have no default and must be passed.

## frozen=True

**Frozen** means you cannot change the fields after you make the object. That is useful for a **ToolCall** record: the model asked for a tool, and you want that fact to stay still.

\`\`\`python
@dataclass(frozen=True)
class ToolCall:
    name: str
    query: str
\`\`\`

\`call.name = "read"\` then fails. The object is a snapshot. The error type is \`FrozenInstanceError\` (a dataclass error). Catch \`Exception\` in a demo; in real code you simply do not assign.

If a field is a dict, the *dict itself* can still change. Frozen stops \`call.name = ...\`. It does not freeze objects inside fields. Keep ToolCall fields simple when you can: strings, numbers, tuples. If you need args, a frozen dataclass with \`args: tuple\` is safer than a dict you might mutate. Or copy args when you run the tool.

Do not freeze the live agent state if \`step\` must rise each turn. Freeze the *request*. Mutate the *state*. That split matches the system: the model asked once; the loop counts many times.

## Field defaults

A field can have a default. Use \`=\` for numbers and text.

For a new list on every object, use \`field(default_factory=list)\`. If you write \`log: list = []\`, objects may share one list. That bug is hard to see. It is the same shared-default bug as \`def f(x, log=[]):\`.

\`\`\`python
from dataclasses import dataclass, field

@dataclass
class State:
    goal: str
    step: int = 0
    log: list = field(default_factory=list)
\`\`\`

| Default | Use |
|---|---|
| \`step: int = 0\` | Fine. \`0\` cannot change in place. |
| \`log: list = field(default_factory=list)\` | Each object gets its own list. |
| \`log: list = []\` | Avoid. Lists can be shared. |

Fields without defaults must come first. \`goal: str\` then \`step: int = 0\` is legal. The other order is not.

\`default_factory=list\` is a function that is called to make a new list. \`list\` with no parentheses is the function. Do not write \`default_factory=list()\` — that would call it once. The dataclass factory would then be the same mistake in a different coat.

For a dict, \`default_factory=dict\`. Never \`[]\` or \`{}\` as the default value on the field.

## vs a plain dict

A **dict** is flexible. You can add any key. That is also the problem: a typo like \`nam\` makes a new key and does not fail.

A dataclass names the fields. \`call.query\` is clear. Editors can hint. Equality works field by field.

Use a dict for raw JSON you just loaded. Turn it into a dataclass when the shape is stable. At the edge, \`isinstance\` and \`.get\`. Inside, \`call.query\`.

You can convert with a small helper: \`ToolCall(name=d["name"], query=d["query"])\`. If a key is missing, that helper crashes. That is good after you validated.

| Need | Dict | Dataclass | Frozen dataclass |
|---|---|---|---|
| Raw model JSON | yes | after you check | after you check |
| Typo should fail | no | yes (\`nam\` is AttributeError) | yes |
| Snapshot of a request | maybe | maybe | yes |
| \`step\` that rises | yes | yes | no |
| \`json.dumps\` directly | yes | no — convert first | no |

\`json.dumps\` does not understand your class unless you convert. \`asdict\` from \`dataclasses\` builds a dict of fields. Convert at the edge. Keep the record inside the loop.

Equality on dataclasses compares fields, not object identity. \`ToolCall("search", "q") == ToolCall("search", "q")\` is True even though they are two objects. That is what you want in tests. Frozen plus equality makes a nice set of unique calls if fields are immutable. If \`args\` is a dict, it is not hashable in the usual frozen way unless you set \`unsafe_hash\` — skip that. Keep frozen records simple.

## Walkthrough: JSON to record to JSON

\`\`\`python
from dataclasses import dataclass, asdict

@dataclass
class ToolCall:
    name: str
    query: str

raw = {"name": "search", "query": "python lists", "extra": 1}
call = ToolCall(name=raw["name"], query=raw["query"])
print(call)
print(asdict(call))
\`\`\`

\`extra\` is dropped on purpose. That is the schema. Unknown keys do not become mystery fields. If you needed to keep extras, you wanted a dict, not a record.

If you add fields later, put them at the end with defaults so old constructors still work: \`goal\`, then \`step=0\`. Dataclasses are still classes. You can add \`def as_row(self):\` that returns a dict for JSON. Prefer an explicit method when the dump shape is not identical to the fields.

You can put a method on the state dataclass: \`def budget_left(self, max_steps): return max_steps - self.step\`. If methods grow, you still have a class. The decorator only saved \`__init__\` and printing. A dataclass with ten methods is a hint you wanted a normal class.

## What goes wrong

- \`log: list = []\` on a dataclass.
- Expecting frozen to freeze inner dicts.
- Using a dataclass for JSON you have not validated.
- A dataclass with ten methods — you wanted a normal class.
- Forgetting to import \`field\`.
- \`json.dumps(call)\` without converting.
- \`default_factory=list()\` with parentheses, so every object shares one list.

\`\`\`tryit python
from dataclasses import dataclass, field, asdict

@dataclass(frozen=True)
class ToolCall:
    name: str
    query: str

call = ToolCall("search", "python lists")
print(call)
print(call.name, call.query)
print("as dict", asdict(call))

try:
    call.name = "read"
except Exception as e:
    print("frozen:", type(e).__name__)

as_dict = {"name": "search", "query": "python lists"}
as_dict["nam"] = "oops"
print("dict typo stays", as_dict)

@dataclass
class State:
    goal: str
    step: int = 0
    log: list = field(default_factory=list)

a = State("find a file")
b = State("find a file")
a.log.append("start")
print("a.log", a.log)
print("b.log", b.log)
print("step default", a.step)
print("equal calls?", ToolCall("search", "q") == ToolCall("search", "q"))
\`\`\`

\`a.log\` grew. \`b.log\` stayed empty. That is \`default_factory\` doing its job. The dict typo \`nam\` stayed, which is why snapshots prefer a dataclass. Equal frozen calls compare by fields.

## How agents use this

A tool call is a small record: name plus arguments. \`frozen=True\` keeps that snapshot still while you run the tool. Agent state (goal, step, log) fits a dataclass with defaults. Raw model JSON can stay a dict until you check it. Then copy the fields into a dataclass so typos fail early.

You can put a method on the state dataclass: \`def budget_left(self, max_steps): return max_steps - self.step\`. If methods grow, you still have a class. The decorator only saved \`__init__\` and printing.

Eval cases are records too: \`input\`, \`expected_tool\`, \`expected_args\`. A dataclass makes a missing column an error at construction, not a silent \`KeyError\` in the middle of a 200-row file. Build them in a loop from JSONL. If a line fails, skip that case and count it. Do not dump the whole run because one row has a typo — unless you *want* fail-fast on fixtures. Pick, then test.

When you log, \`asdict(state)\` plus \`json.dumps\` is the file. When you run, \`state.step += 1\` is the loop. Do not mix: do not freeze state, do not mutate the request. Two types, two jobs. That is the agent-shaped use of dataclasses.

\`\`\`quiz
What does frozen=True do on a dataclass?
- It deletes the object after one use
- *It stops you from changing the fields after you make the object
- It turns the object into a dict
- It is required for every dataclass
explain: Frozen makes the record a snapshot. Setting call.name = "read" raises an error.
\`\`\`
`,
  },
  {
    slug: "typing-hints",
    title: "Type Hints",
    summary:
      "Write list[str], dict[str, int], and X | None. Hints help you and your editor. They do not stop bad JSON at runtime.",
    minutes: 20,
    level: "intermediate",
    md: `
A **type hint** is a note on a name. It says what type you expect. Python does not enforce that note by itself. The program will still run if a caller passes the wrong thing. That surprise is the lesson.

Joeven runs **Python 3.12** (Pyodide). So you can write \`list[str]\` and \`str | None\`. The \`X | None\` form needs Python 3.10 or newer. Older code used \`List[str]\` from \`typing\`. New code uses built-in generics: \`list[str]\`, \`dict[str, int]\`, \`tuple[str, int]\`.

Hints help you and your editor. They do not stop a model from sending bad JSON. Checks do.

\`\`\`viz strip
title Hints are notes, not locks
chip list of str
chip a dict
chip str or None
caption Python still runs if the value is wrong. Check JSON with isinstance at the edge.
\`\`\`

Write hints on public functions first: tools, parsers, \`goal_satisfied\`. Skip hints on a two-line loop inside a tryit if they add noise. When a name is \`| None\`, the next line should handle None. If it does not, the hint is a lie.

## list[str] and dict[str, int]

Write the type after a colon. Write the return type after \`->\`.

| Hint | Meaning |
|---|---|
| \`names: list[str]\` | A list of strings |
| \`used: dict[str, int]\` | Keys are strings, values are ints |
| \`label: str\` | A string |
| \`ok: bool\` | True or False |
| \`row: dict\` | A dict (values unspecified) |
| \`args: dict[str, object]\` | JSON-like mapping |
| \`q or None\` | string or missing |

\`\`\`python
def tool_names(trace: list[dict]) -> list[str]:
    return [row["name"] for row in trace]
\`\`\`

The hint says “I mean to return a list of strings.” You can still return something else. Python will still run. A checker like \`mypy\` on your laptop can warn. This browser will not.

\`list[dict]\` does not specify the dict’s keys. You can write \`dict[str, object]\` when values mix. You cannot express “must have key q” in a hint alone. That is \`isinstance\` and \`"q" in args\`.

A return type of \`list[str]\` does not freeze the list’s contents. Callers can still append. Hints describe intent, not a lock. \`tuple[str, ...]\` means a tuple of strings of unknown length. You do not need that for this track.

## None with X | None

**None** means “missing.” Write \`str | None\` when a value can be text *or* missing.

Older code used \`Optional[str]\` from \`typing\`. That means the same thing as \`str | None\`. Prefer \`str | None\` in new code.

\`\`\`python
def last_error(trace: list[dict]) -> str | None:
    for row in reversed(trace):
        err = row.get("error")
        if isinstance(err, str):
            return err
    return None
\`\`\`

Do not mark every value as \`| None\` “just in case.” Then every caller must check None. Mark it when missing is part of the contract: no error yet, no query yet, tool skipped.

\`reversed(trace)\` walks from the last step. That is the usual “latest error” search. The return type documents that you might find nothing.

When the return is \`str | None\`, the caller writes \`if err is None:\` before using \`err\` as text. If the caller concatenates without a check, you get \`TypeError\`. The hint warned a human. Runtime still needs the \`if\`.

## Hints do not run

Hints are notes. They are not checks. This still runs:

\`\`\`python
def greet(name: str) -> str:
    return name

print(greet(12))
\`\`\`

\`12\` is not a string. Python does not stop it. A tool like \`mypy\` can warn on your machine. The running program does not care unless you check.

You can even assign against a hint: \`raw: dict[str, int] = {"k": "3"}\`. The hint says int. The value is str. Runtime is silent. That is why JSON is dangerous: it looks like your types and is not.

## Check with isinstance

At the **trust edge** — data from JSON, a model, or a file — check the real type.

\`isinstance(value, str)\` is True if \`value\` is a string. Check before you use the value as text. \`isinstance(x, int)\` is True for ints. \`bool\` is a subclass of \`int\` in Python, so \`isinstance(True, int)\` is True. If you must reject booleans, check \`type(x) is int\` or check bool first. For token counts, also reject \`True\`.

\`isinstance(x, list)\` does **not** check the items inside. Loop and check each item if you need that.

\`isinstance(x, dict)\` does not check keys. Loop items if you need string keys.

| Check | Catches | Misses |
|---|---|---|
| hint \`k: int\` | nothing at run time | \`"3"\`, \`True\` |
| \`isinstance(x, int)\` | strings, dicts | \`True\` (bool is an int) |
| \`type(x) is int\` | bools too | still not “in range” |
| \`"q" in args\` | missing key | wrong type of value |
| \`isinstance(q, str) and q.strip()\` | missing, numbers, blank text | valid text that is the wrong query |

Treat hints as a map for humans. Treat \`isinstance\` as a gate for machines.

## Walkthrough: parse, then check, then call

\`\`\`python
def parse_query(args: dict[str, object]) -> str | None:
    q = args.get("q")
    if not isinstance(q, str):
        return None
    if not q.strip():
        return None
    return q
\`\`\`

The hint on \`args\` did not save you. The \`isinstance\` gate did. A number \`12\` returns \`None\`. Missing \`q\` returns \`None\`. Spaces-only returns \`None\`. The tool \`search(q: str)\` can assume a real string because *you* already checked. Put the hint on \`search\`. Put the gate in \`parse_query\`. Tests should send a bad \`q\` and expect \`None\` or an error dict, not a \`TypeError\` from inside \`search\`.

## Bad JSON

A model might send \`"k": "3"\` when you wanted an int. A hint \`dict[str, int]\` will not catch that. \`isinstance\` will. Convert with \`int\` only after you know it is a string of digits, or catch \`ValueError\`.

Do not send type hints to the model and hope. The model gets a docstring or a JSON schema (later tracks). Python hints are for people and checkers. Runtime validation is for data you did not create.

## What goes wrong

- Believing hints enforce types at run time.
- Marking everything \`| None\`.
- Skipping \`isinstance\` at the JSON edge.
- Using old \`List[str]\` in new 3.12 code without need (it still works; \`list[str]\` is shorter).
- \`isinstance(True, int)\` surprises in flags vs counts.
- Concatenating a \`str | None\` without a None check.
- Hinting \`dict[str, int]\` on raw JSON and then doing math on a string.

\`\`\`tryit python
def parse_query(args: dict[str, object]) -> str | None:
    q = args.get("q")
    if not isinstance(q, str):
        return None
    return q

def budget_left(used: dict[str, int], limit: int) -> int | None:
    total = 0
    for n in used.values():
        if not isinstance(n, int):
            return None
        total += n
    left = limit - total
    if left < 0:
        return None
    return left

print("good", parse_query({"q": "python"}))
print("bad json number", parse_query({"q": 12}))
print("missing", parse_query({}))

print("left", budget_left({"search": 2, "read": 1}, 8))

raw: dict[str, int] = {"k": "3"}  # hint says int; value is str
print("hint says int, real type", type(raw["k"]).__name__)
print("isinstance int?", isinstance(raw["k"], int))
print("True is int?", isinstance(True, int))
print("True is bool first", isinstance(True, bool))
\`\`\`

\`parse_query\` returns \`None\` for a number. The hint on \`args\` did not save you. The \`isinstance\` gate did. The last prints show why token counts should reject \`True\`.

## How agents use this

Tool arguments arrive as JSON. JSON does not know your Python hints. Write \`list[str]\` so *you* remember the contract. Then check with \`isinstance\` before you call the tool. \`str | None\` is right for “no error yet.” Hints help the team. Checks keep a bad model reply from crashing the loop.

Put hints on your functions: \`def call_tool(name: str, args: dict[str, object]) -> dict\`. Put checks inside: name is str, args is dict, then each field. Tests should send a bad \`q\` and expect a dict error, not a \`TypeError\` from inside \`search\`.

A good boundary is three layers. Hints on the inner tool (\`q: str\`). A parser that returns \`str | None\` or an error dict. An executor that never calls the inner tool on \`None\`. If you hint the inner tool as \`q: str | None\` “to be safe,” you pushed the mess inward. Keep the core function strict. Validate at the edge.

Checkers (\`mypy\`) are optional on this site and useful on a laptop. They catch *your* mistakes: returning \`None\` from a function hinted as \`str\`. They do not catch the model. Runtime \`isinstance\` catches the model. You need both stories: one for code you wrote, one for data you did not.

\`\`\`quiz
Do type hints stop a wrong JSON value when the program runs?
- Yes. Python always blocks a wrong type.
- *No. Hints help you. You still check with isinstance.
- Only for lists
- Only in Python 3.12
explain: Hints are notes. CPython does not enforce them. Validate model JSON yourself.
\`\`\`
`,
  },
  {
    slug: "stdlib",
    title: "Useful Standard Library",
    summary:
      "Use datetime, Counter, defaultdict, islice, sha256, uuid, and copy. Know that time.sleep blocks the whole program.",
    minutes: 20,
    level: "intermediate",
    md: `
The **standard library** is the set of modules that come with Python. You do not need \`pip\` for these. They run in Joeven. Look here before you add a package. Agent code leans on a small set: time stamps, counts, copies, ids, and hashes.

You already used \`json\`, \`pathlib\`, \`copy\`, \`math\`, and \`re\` (next lesson). This page is a map of a few more that show up in traces and tests. It is not a tour of every stdlib module. \`http.client\` exists; we still will not hit the network here.

\`\`\`viz strip
title A few stdlib tools
chip datetime
chip Counter
chip sha256
chip uuid
caption These modules come with Python. Stamp time, count tools, id a run. Do not sleep for long.
\`\`\`

## Cheat sheet

| Module | Job |
|---|---|
| \`datetime\` | When did this step happen? |
| \`collections.Counter\` | How often did each tool run? |
| \`collections.defaultdict\` | Group rows without a KeyError |
| \`itertools.islice\` | Take the first n items |
| \`hashlib.sha256\` | Fingerprint bytes; \`.hexdigest()\` is hex text |
| \`uuid.uuid4\` | A unique id |
| \`copy\` | Copy a list or dict |
| \`time.sleep\` | Wait. This **blocks**. |
| \`time.time\` | A clock number you can print |

## datetime

Store time in **UTC**. Use \`.isoformat()\` when you put a timestamp in a trace. Local time depends on the machine. UTC is comparable.

\`timedelta\` is a duration, like five minutes. Add it to a datetime to get a later time. Useful for “this observation is stale.” Do not parse model-written dates with guesswork if you can store ISO strings you created.

\`datetime.now(timezone.utc)\` is the current UTC time. Naive datetimes (no timezone) cause bugs when you compare. Prefer timezone-aware.

## Counter and defaultdict

\`Counter\` counts hashable items. Tool names, error words, status flags. \`Counter(tools)["search"]\` is how many times search ran. \`Counter\` is a dict subclass. Missing keys look like 0 when you index, which is handy. Still \`.get\` if you want.

\`defaultdict(list)\` makes a new list when a key is new. You can \`append\` without checking \`if key in d\` first. \`defaultdict(int)\` is a manual counter. \`Counter\` is clearer for counts.

Do not \`defaultdict(list)\` as a transcript. You would still need an order of keys. Use a list of rows for order, then group with defaultdict when you report.

## islice, sha256, uuid, copy

\`islice(items, n)\` takes the first n items. Useful when a trace is long and you only want a prefix. For a suffix, slice the list: \`items[-n:]\`. \`islice\` shines on lazy iterators. On a list, a slice is fine.

\`hashlib.sha256(data).hexdigest()\` turns bytes into a hex string. Use it to see if text changed. Pass **bytes**, like \`b"hello"\` or \`text.encode("utf-8")\`. Do not hash secrets into a public log if the secret can be guessed. Hash prompts to detect “same prompt as last time,” not passwords.

\`uuid.uuid4()\` makes a random unique id. Turn it into text with \`str(...)\`. Good for a run id. Not good as a security token by itself in every system, but fine as a log correlation id.

\`copy.copy\` copies the outer object. Nested dicts are still shared. \`copy.deepcopy\` copies nested objects too. You saw this in mutability. It lives in stdlib, so it belongs on the map.

## time.sleep blocks

**Blocks** means the program waits and does nothing else. A long \`time.sleep(30)\` freezes that wait. In Joeven it would freeze the page. In an agent loop it would stall every other step.

Mention sleep. Do not sleep for a long time here. If you need a pause on a real server, keep it short and log why. Retries should print “would wait” in this editor. The next agent lesson on retries follows that rule.

Do not call a long \`time.sleep\` in a Try it box. The page waits until it finishes.

\`random.choice\` is also stdlib and useful for a fake model that picks a canned line. \`random\` is not a substitute for tests. \`urllib\` exists and still needs a network. Skip it here. \`argparse\` builds command-line flags for a laptop \`main\`. Skip it here. The table above is the set you will actually type in traces.

When you group with \`defaultdict(list)\`, convert to \`dict(grouped)\` before you JSON-dump if you want a plain object. \`json.dumps\` can dump a defaultdict, but tests that compare to a literal dict are easier with a plain dict. \`Counter\` dumps as an object of counts. Good for a report row.

## Common mistakes

- Naive datetime vs UTC.
- Hashing a str without \`.encode\`.
- \`time.sleep\` in the agent loop as “backoff” with huge numbers.
- \`defaultdict\` hiding missing-key bugs you needed to see.
- Using \`uuid\` as a substitute for checking allowlists.

\`\`\`tryit python
from datetime import datetime, timezone, timedelta
from collections import Counter, defaultdict
from itertools import islice
import hashlib
import uuid
import copy
import time

now = datetime.now(timezone.utc)
print("now", now.isoformat())
print("later", (now + timedelta(minutes=2)).isoformat())

tools = ["search", "read", "search", "search"]
print("counts", Counter(tools))

grouped = defaultdict(list)
for name in tools:
    grouped[name].append("ok")
print("grouped", dict(grouped))

print("first 3", list(islice(tools, 3)))

digest = hashlib.sha256(b"hello").hexdigest()
print("sha256", digest[:16])

print("run_id", str(uuid.uuid4()))

original = {"nested": {"n": 1}}
shallow = copy.copy(original)
deep = copy.deepcopy(original)
shallow["nested"]["n"] = 2
print("after shallow copy, original", original["nested"]["n"])
print("deepcopy stayed", deep["nested"]["n"])

# time.sleep(5)  # do not: this blocks and would freeze the page
print("sleep skipped; clock", time.time())
\`\`\`

Read \`counts\` as a policy report: search ran more than read. That report is how you catch a loop that hammers one tool.

## How agents use this

Stamp each trace row with UTC time. Count tool names with \`Counter\`. Group errors with \`defaultdict\`. Take the last few steps with \`islice\` (or a slice on a list). Hash a prompt to see if it changed. Give each run a \`uuid4\` id. Copy state before a risky step. Do not \`sleep\` for a long time in the loop — that blocks everything else.

A run id in every log line lets you grep one conversation out of a file of many. A hash of the assembled prompt lets you notice “we sent the same 8k characters again.” A Counter in a weekly report lets you see that \`search\` is 90% of calls. None of that needs a third-party package.

When you later install \`httpx\` on a laptop, you still keep these modules. The stdlib is the floor. Packages are extra. Joeven’s sandbox is that floor on purpose.

\`\`\`quiz
Why is a long time.sleep a problem in an agent loop?
- It deletes the log
- *It blocks. The program waits and cannot do other work.
- It is not in the standard library
- It prints API keys
explain: sleep pauses the whole program. A long wait stalls every later step.
\`\`\`
`,
  },
  {
    slug: "regex",
    title: "Regular Expressions",
    summary:
      "Use re.search, findall, and groups. Pull a URL or a small blob from messy model text. Prefer json.loads when you already have JSON.",
    minutes: 19,
    level: "intermediate",
    md: `
A **regular expression** (regex) is a pattern that finds pieces of text. Import the standard library module \`re\`. Models often wrap a useful bit in extra words. “Sure! Here is https://example.com/doc thanks.” Regex can pull the URL. It is also easy to get wrong.

If you already have a clean JSON string, use \`json.loads\`. Do not invent a regex for full JSON. JSON has nested braces, escaped quotes, and strings that contain \`}\`. A greedy \`.*\` will grab too much or too little. The JSON parser already knows the rules.

\`\`\`viz strip
title Groups keep the pieces
chip step 9 of 20
chip 9
caption The whole match is the line. Group 1 is the digits in parentheses. Prefer json.loads when you already have JSON.
\`\`\`

Regex is a scalpel for small pieces: a URL, a step number, an id with a known shape. It is not a second programming language you should use for policy.

## search and findall

| Call | Result |
|---|---|
| \`re.search(pattern, text)\` | First match, or \`None\` |
| \`re.findall(pattern, text)\` | A list of all matches |
| \`match.group()\` | The matched text |
| \`match.group(1)\` | The first group in \`( )\`. |
| \`re.match(pattern, text)\` | Match only at the start |

If \`search\` finds nothing, it returns \`None\`. Check before you call \`.group()\`. \`None.group()\` is an \`AttributeError\`. That crash is common.

\`\`\`python
import re

text = "step 3 of 12"
print(re.findall("[0-9]+", text))
m = re.search("step ([0-9]+)", text)
if m:
    print(m.group(1))
\`\`\`

\`[0-9]+\` means “one or more digits.” \`+\` means one or more. \`*\` means zero or more. \`?\` means optional. You do not need all of regex. You need “digits,” “not a space,” and “this literal prefix.”

\`findall\` with a group returns the group contents, not always the whole match. Print and look. Do not assume.

## Groups

Parentheses mark a **group**. You keep the whole match with \`group(0)\` or \`group()\`. You keep the piece in parentheses with \`group(1)\`.

Use one or two groups. A pattern with many groups is hard to trust. Name the piece you needed in a variable: \`step_no = m.group(1)\`.

If the pattern has no match, skip. Do not invent a default step number from thin air unless you log that you guessed.

## Extract a URL

Model text is messy. Look for \`https://\` then take characters until a space.

\`\`\`python
import re
text = "Read https://example.com/doc and stop"
m = re.search("https://[^ ]+", text)
if m:
    print(m.group())
\`\`\`

\`[^ ]+\` means “one or more characters that are not a space.” URLs can still contain trailing punctuation like \`.\` or \`)\`. Strip those if you need a clean href. This pattern is a start, not a full URL parser.

\`findall\` pulls several URLs. Check they start with \`https://\` before a fetch tool runs. \`http://\` can be rejected in the same guard you already wrote in exceptions.

## Extract a JSON blob

Sometimes the model prints words, then a \`{...}\` object, then more words. You can search for a \`{\` … \`}\` blob, then \`json.loads\`.

This is fragile. Extra braces break it. Nested objects can confuse \`.*\`. Prefer a clean JSON string when you control the prompt. A later lesson strips markdown fences and finds the first \`{\` and last \`}\` with \`find\` / \`rfind\`, which is often enough without regex.

Order of attack:

1. If the whole string is JSON, \`json.loads(text)\`.
2. If you must, pull a small URL or id with regex.
3. Do not write a regex that “parses JSON.”

Regex is easy to get wrong. A pattern that works on one reply can fail on the next. Prefer \`json.loads\` when you can.

A **raw string** \`r"\\d+"\` is how many tutorials write digits. In this course we often write \`"[0-9]+"\` to avoid backslash fights inside other languages’ strings. Both mean digits. A dot \`.\` in regex means “any character.” To match a real dot in \`file.json\`, you need a different pattern than “any char + json.” Prefer \`endswith(".json")\` for suffixes. Regex is overkill for a suffix.

\`re.compile(pattern)\` builds the pattern once. For a few searches in a tool, compiling is optional. If you search a huge log in a loop, compile. Always check for \`None\` before \`.group\`. Always log the input when there is no match. Silent empty lists from \`findall\` look like success.

## Common mistakes

- \`.group()\` on \`None\`.
- Greedy \`.*\` across the whole document.
- Parsing JSON with regex.
- \`in\` substring checks you thought were “regex-level” careful — they are not.
- Forgetting \`import re\`.

\`\`\`tryit python
import json
import re

messy = 'Sure. Here is the data: {"city": "Paris", "ok": true} thanks'
blob = re.search("[{].*[}]", messy)
if blob:
    data = json.loads(blob.group())
    print("city", data["city"])
    print("ok", data["ok"])

text = "see https://example.com/a and https://example.com/b please"
print("urls", re.findall("https://[^ ]+", text))

step_line = "error at step 9 of 20"
m = re.search("step ([0-9]+)", step_line)
if m:
    print("whole", m.group(0))
    print("group1", m.group(1))

no_link = re.search("https://[^ ]+", "no link here")
if no_link:
    print(no_link.group())
else:
    print("no url")

clean = '{"n": 3}'
print("json.loads", json.loads(clean))
\`\`\`

The messy line works because there is one object. Nested braces would make \`.*\` greedy. That is why \`json.loads\` on a sliced first-brace to last-brace (next JSON-from-model lesson) is the more robust cousin.

## How agents use this

Models mix prose and data. Use regex to pull a URL or a step number from that mix. If the model returned JSON, run \`json.loads\` on that string. Do not scrape a full JSON document with a clever pattern. Log the raw text when a parse fails so you can see why.

Tool routing should not be regex on the whole reply (“if the text contains search, call search”). Parse an action object. Then look at \`tool\`. Substring policy is how “I do not want to search” still fires search because the word appears.

When fence-stripping fails, regex will not save a badly specified contract. Fix the prompt to ask for a single JSON object. Use regex as a backup extractor for ids you already know the shape of. Keep the pattern next to a test string. If you cannot write two tests, you cannot afford the pattern.

A ticket id like \`T-[0-9]+\` is a fair regex. A “parse any JSON” pattern is not. When a match fails, return \`None\` and let the loop ask the model to try again with a cleaner shape. Do not invent a default id. Invented ids look like success and route the agent to the wrong record.

\`\`\`quiz
You have a full, clean JSON string from the model. What should you try first?
- A long regex that matches every key
- *json.loads
- print only, then guess
- time.sleep
explain: json.loads follows JSON rules. Regex is a guess and breaks on real objects.
\`\`\`
`,
  },
  {
    slug: "logging-env",
    title: "Logging and Secrets",
    summary:
      "Log with a list of dicts and levels. Read env vars with os.environ.get. Never print API keys. Redact them with ***.",
    minutes: 18,
    level: "intermediate",
    md: `
A **log** is a list of what happened. \`print\` shows text now. A log list you can filter, hide, and save. A **secret** is a value that must not leak: an API key, a token, a password. Read secrets from the environment. Never print them. Never put them in the prompt. Never put them in the transcript you send back to a model.

This lesson is Python: lists, strings, \`os.environ.get\`, and \`replace\`. It is also policy: assume a screenshot of the output will leave the building.

\`\`\`viz flow
title Read a key. Do not log it.
layout lr
node env env var
node code load
node log log ***
edge env code
edge code log
caption Get the secret from the environment. Replace it with *** before you print or save a row.
\`\`\`

## print vs a log list

\`print\` is fine while you learn. It is weak in a real agent:

- you cannot filter “errors only”
- you cannot hide a key after the fact
- you cannot send the same rows to a file later

A simple log is a list of dicts:

\`\`\`python
log = []
log.append({"level": "info", "msg": "agent start"})
print(log)
\`\`\`

Each row has a **level** and a **message**. You can loop later and print only errors. You can \`json.dumps\` the list and write it with pathlib. That is a file log without a logging framework.

The stdlib \`logging\` module exists. It is useful on a laptop. Here, a list is visible and testable. Tests assert \`log[-1]["level"] == "error"\`. They cannot easily assert on a print.

## Levels in simple words

| Level | Meaning |
|---|---|
| \`debug\` | Extra detail while you build |
| \`info\` | Normal progress |
| \`warning\` | Odd, but we continue |
| \`error\` | Something failed |

Pick one level per row. Do not mark everything as \`error\`. Then nothing stands out. Do not mark everything as \`debug\`. Then you will never look.

A production switch is “print warnings and errors only.” That is a filter over the same list: \`[row for row in log if row["level"] in ("warning", "error")]\`.

Stamp a step number or run id when you have one. \`{"level": "info", "msg": "...", "step": 3}\` is easier to grep. Keep values JSON-safe: strings, numbers, bools, None. Error objects should be \`str(e)\` first.

## os.environ.get

The **environment** is a set of names the computer keeps outside your file. \`os.environ.get("API_KEY")\` reads one name.

If the name is missing, \`.get\` returns \`None\`. You can pass a default: \`os.environ.get("API_KEY", "")\`.

Joeven’s browser has no real secret store. On your machine, you set \`API_KEY\` in the environment. You do not paste keys into source files. You do not commit \`.env\` files that hold live keys. A placeholder default in a demo is fine if it is obviously fake.

\`\`\`python
import os

key = os.environ.get("API_KEY")
if not key:
    print("missing key")
\`\`\`

Missing key should be a startup error, not a 401 after ten paid calls. Check once in \`main\`. Do not print the key when it is present. Print \`bool(key)\` or \`"key set"\` if you must.

## Never print API keys

A key in a log is a leak. Screenshots, traces, and bug reports all copy the log. Assume someone else will read it. Support tickets include logs. Models that see a transcript will echo secrets if you put them there.

Do not do this:

\`\`\`python
print("using", api_key)
\`\`\`

Do not put the key in the goal string. Do not put it in tool args that get logged. Headers belong in the HTTP client, not in \`print(headers)\` unless you redacted first.

## Redaction

**Redact** means hide a secret by replacing it. A simple form: replace the key with \`***\`.

\`\`\`python
def redact(text, secret):
    if secret and secret in text:
        return text.replace(secret, "***")
    return text
\`\`\`

Run redaction *before* you append to the log. Then even an error message that included the key is safe to print. If you print first and redact later, the leak already happened in the output panel.

Redact every secret you know: key, token, password. If you have several, loop. If a secret is empty, skip — \`"" in text\` is True for every string, and you would replace nothing useful or behave oddly. The \`if secret and\` guard matters.

A comment that says “do not log keys” does not hide them. Replace the key in code.

If you have several secrets, loop them through \`redact\`. If a new token appears only in an error message you did not expect, you cannot redact what you do not know. Avoid putting secrets in exception messages. Raise \`ValueError("missing API_KEY")\` not \`ValueError("bad key " + key)\`. The tryit shows redaction because the demo *intentionally* concatenates the key. Real raise messages should never include it.

Levels are not a substitute for a trace. A trace is the transcript of the agent. A log is how your runtime talks to operators. Both must be redacted. Filter logs by level. Slice traces by step.

## Common mistakes

- Printing \`headers\` with Authorization.
- Defaulting a missing key to a real key in source.
- Redacting after print.
- Using \`if not text:\` on a key and then logging the error that still contains the key.
- Storing secrets in the transcript list.

\`\`\`tryit python
import os

secret = os.environ.get("API_KEY", "sk-demo-not-real")
log = []

def redact(text, hidden):
    if hidden and hidden in text:
        return text.replace(hidden, "***")
    return text

def add(level, msg):
    clean = redact(str(msg), secret)
    log.append({"level": level, "msg": clean})

add("debug", "checking tools")
add("info", "call model")
add("warning", "slow tool")
add("error", "bad key " + secret)

print("raw key stays out of the log")
for row in log:
    print(row["level"], row["msg"])

errors = []
for row in log:
    if row["level"] == "error":
        errors.append(row)
print("errors", errors)
print("get missing", os.environ.get("NO_SUCH_VAR"))
\`\`\`

The error row should contain \`***\`, not \`sk-demo-not-real\`. Filter \`errors\` the same way you would in a dashboard.

## How agents use this

Print while you learn, then store rows in a log list. Use levels so you can show errors first. Read \`API_KEY\` with \`os.environ.get\`. Never print the raw key. Replace it with \`***\` before a row is saved. Traces go to files, other people, and sometimes back into a model — keep secrets out.

The executor should redact observations too. A tool that returns a URL with a signed query might leak a token. If you know the token, replace it. If you do not know it, do not log full URLs from unknown tools without a review.

Startup should fail closed: no key, no loop. That is an \`if not key: return\` in \`main\`, not a comment. The environment is how machines get secrets. Python’s job is to read them quietly and never write them back out.

\`\`\`quiz
How should an API key appear in a log?
- The full key, so you can debug faster
- *Replaced with ***
- In the page title
- Only in error rows, still full
explain: A key in a log is a leak. Redact it before you store or print the row.
\`\`\`
`,
  },
];
