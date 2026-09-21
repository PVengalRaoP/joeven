import type { RawLesson } from "@/lib/types";

export const pythonFunctions: RawLesson[] = [
  {
    slug: "functions",
    title: "Functions",
    summary:
      "Define a function with def, return a value, write a docstring, pass keyword arguments, and store tools in a dict.",
    minutes: 20,
    level: "beginner",
    md: `
A **function** is a block of code with a name. You **define** it once. You **call** it when you need that work done. The definition is the recipe. The call is cooking one meal. You can call the same function many times with different inputs.

In an agent, a **tool** is a function. A tool is an action the program can run, such as search or add. The model picks a tool name and inputs. Your Python looks up the function and calls it. If you can write a small function that **returns** a value, you can write a tool.

\`\`\`viz flow
title In, then out
layout lr
node in q, k
node fn search
node out hits
edge in fn
edge fn out
caption A function takes inputs and returns a value. print only shows text. return is for other code.
\`\`\`

Functions also keep you from copying the same five lines into every branch. Name the work. Call the name. Test the name.

## What you will learn

- \`def\` starts a function
- \`return\` sends a value back; \`print\` only shows text
- A **docstring** is a note inside the function
- Keyword arguments and \`**\` in a **call**
- A dict of functions, plus \`call_tool(name, **kwargs)\`

## The parts of a function

| Word | Meaning | Example |
|---|---|---|
| Name | What you call | \`search\` |
| Parameters | Input names in the definition | \`q\`, \`k\` |
| Arguments | Values you pass in a call | \`"rain"\`, \`2\` |
| Return | The value sent back | a list of hits |
| Body | The indented lines | the work |

The name should be a verb or a job: \`search\`, \`add\`, \`call_tool\`. \`data\` is a bad function name. snake_case, like variables.

## def and return

\`def\` means “define this function.” Names in parentheses are **parameters** (the inputs). The body is indented. \`return\` hands a value back and stops the function. Lines after \`return\` in that path do not run.

\`\`\`python
def search(q, k=3):
    hits = []
    for i in range(k):
        hits.append("doc " + str(i) + " about " + q)
    return hits

print(search("weather"))
print(search("weather", 1))
\`\`\`

- No \`return\` means the function returns \`None\`. \`None\` means “no value.”
- \`search("weather")\` is a **positional** call: values line up in order. First value fills first parameter.
- \`search(q="weather", k=1)\` is a **keyword** call: you pass inputs by name. Order can change: \`search(k=1, q="weather")\` is the same.

After you use a keyword, the rest of that call must be keywords too. \`search(q="weather", 1)\` is a syntax error. \`search("weather", k=1)\` is fine: positional first, then keyword.

Defaults like \`k=3\` mean the caller may skip that input. Defaults have a trap when the default is a list. The next lesson covers that. Numbers and strings as defaults are safe.

## Return vs print

\`print\` is for people. It writes text on the screen. \`return\` is for other code. It sends a value back to the caller. You can do both. Beginners often print and forget to return. Then \`hits = search("rain")\` stores \`None\`.

A tool must **return** data. Then the agent can save that data in a **transcript** (a list of what happened). You may also print while you debug. The useful result is still the return value.

\`\`\`python
def add(a, b):
    print("adding")  # for you to read
    return a + b     # for the program to use

total = add(2, 3)
print("got", total)
\`\`\`

If you only print inside \`add\` and do not return, \`total\` is \`None\`, and \`print("got", total)\` shows \`None\`. The addition happened. Nobody handed it back.

\`return\` can send any value: number, string, list, dict, tuple, \`None\`. Tools often return a dict: \`{"ok": True, "result": ...}\`. That shape is easy to store and easy to test.

## A note inside the function

The first string in a function body is a **docstring**. A docstring is a note inside the function. It tells a person (or a model) what the function does. It does not change the result. Triple quotes let the note span lines.

\`\`\`python
def search(q, k=3):
    """Return k fake documents for query q."""
    return ["doc 0 about " + q]
\`\`\`

Keep the note short and clear. Tool descriptions you send to a model are the same idea: they say how to call the function. A docstring that lies is worse than none. Update it when you change the return shape.

You can read it with \`search.__doc__\`. You do not need that often. Editors show it. Tests sometimes check it. Humans read it first.

## pass means "do nothing yet"

Python needs at least one line in a block. \`pass\` is that line when you have not written the real body yet.

\`\`\`python
def search(q):
    pass  # fill this in later
\`\`\`

If you leave the body empty, Python raises an error. \`pass\` is the empty body. Use it while you design a tool. Replace it before you ship. A function that only \`pass\`es returns \`None\`. That can look like “the tool ran” if you forget to fill it in.

## Keyword arguments and unpacking a dict

Models often send inputs as a dict, like \`{"q": "agents", "k": 2}\`.

In a **call**, two stars in front of a dict unpack it. **Unpack** means “turn this dict into named inputs.”

\`\`\`python
args = {"q": "agents", "k": 2}
print(search(**args))   # same as search(q="agents", k=2)
\`\`\`

That \`**\` is in the call. If the dict has a key the function does not accept, Python raises \`TypeError\`. Check keys, or write a function that accepts extras (next lesson). If a required name is missing, you also get \`TypeError\`.

## A dict of functions

Functions are values. You can store them in a dict without calling them. \`search\` is the function. \`search("q")\` is a call. The dict stores the function.

That dict is a **tool registry**: a map from a name to a function.

\`\`\`python
tools = {"search": search, "add": add}
print(tools["search"]("python"))
\`\`\`

A helper like \`call_tool(name, **kwargs)\` looks up the name, then calls the function with the named inputs. If the name is missing, return an error dict. Do not crash the agent loop.

## Common mistakes

- Printing instead of returning.
- \`memory = memory.append(x)\` inside a function, same \`None\` trap.
- Calling \`tools["search"]\` without \`()\` when you meant to run it — you get the function object.
- \`**args\` with extra or missing keys.
- Forgetting parentheses on \`def search():\` or the colon.

\`\`\`tryit python
def search(q, k=3):
    """A note inside the function: return k fake documents."""
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
        return {"ok": False, "error": "unknown tool " + name}
    return {"ok": True, "result": fn(**kwargs)}

print(call_tool("search", q="agents", k=2))
print(call_tool("add", a=3, b=4))
print(call_tool("shell", cmd="rm"))

args = {"q": "nyc", "k": 1}
print("unpacked dict", search(**args))
print("keyword call", search(q="nyc", k=1))
\`\`\`

Change \`"shell"\` to \`"add"\` and pass \`a\` and \`b\`. Click **Run**. Unknown names should stay error dicts, not crashes.

If a Try it box looks empty, you forgot \`print\`. The function returned a value and nobody showed it.

## How agents use this

When a model asks for a tool, it sends a name and a dict of inputs. Your job is \`registry[name](**inputs)\`. That is the whole trick. Keep each tool small. Give it clear inputs. Return a dict, list, string, or number. Huge functions with hidden names are hard to test and hard to read in a log.

\`call_tool\` is the executor. The model never calls Python directly. It only emits a name. Your registry is the allowlist and the lookup table in one. If a name is not in the dict, it is not a tool. There is no second back door.

Docstrings (or a separate description string) are what you later send the model so it knows the arguments. The function body is what actually runs. Keep those two aligned. A tool that claims it searches the web but returns a constant string will pass a demo and fail in production. Return real data. Print only for you.

\`\`\`quiz
What does return do that print does not?
- Shows text on the screen for a person
- *Sends a value back to the caller so other code can use it
- Writes a docstring
- Stores the function in a dict
explain: print is for people. return is for code. Tools must return data so the agent can save it.
\`\`\`
`,
  },
  {
    slug: "scope-args",
    title: "Scope, Defaults, and Extra Arguments",
    summary:
      "Local vs global names, default arguments, *args and **kwargs, and why a list default leaks agent memory.",
    minutes: 19,
    level: "beginner",
    md: `
**Scope** means “where a name lives.” A **local** name lives inside one function. It is born when the function starts. It dies when the function ends. Code outside cannot read it. A second call does not remember the previous local names — unless you cheated with a default list, which this lesson forbids.

A **global** name lives in the whole file. Functions can read it. Changing it from inside a function is easy to get wrong. Prefer passing values in and returning values out. Agents should pass \`state\` in and get \`state\` back.

\`\`\`viz flow
title Pass in, return out
layout lr
node in current
node fn next_score
node out new score
edge in fn
edge fn out
caption Local names die when the function ends. Do not hide agent memory in a global or a list default.
\`\`\`

This lesson also covers **defaults** (inputs you may skip) and extra inputs. Together, these rules decide whether two users share memory by accident.

## What you will learn

- Local names vs global names
- Default arguments
- Why a list default is a bug
- \`*args\` and \`**kwargs\` as extra inputs

## Local vs global

Assignment inside a function makes a **local** name. The name outside does not change.

\`\`\`python
score = 10

def bump():
    score = 1
    print("inside, score is", score)

bump()
print("outside, score is still", score)
\`\`\`

The \`score = 1\` line makes a new local \`score\`. The global \`score\` stays \`10\`. If you only *read* a global, Python uses it. If you assign, Python treats the name as local for the whole function. Then \`print(score)\` before the assignment inside the function can raise \`UnboundLocalError\`. If you need to read and then store a new value, pass the old value in.

If you need a new value, **return** it:

\`\`\`python
score = 10

def next_score(current):
    return current + 1

score = next_score(score)
print(score)
\`\`\`

That is safer than editing a global. \`global score\` exists. Do not use it in agent tools. Hidden writes make tests lie.

Reading a constant like \`ALLOWED = {"search", "read"}\` from inside a function is normal. You are not assigning. You are looking up a policy.

## Default arguments

A **default** is a value used when the caller skips that input.

\`def search(q, k=3):\` lets you call \`search("rain")\`. Then \`k\` is \`3\`. You can still pass \`k=1\`.

Defaults are set **once**, when Python first creates the function. They are not rebuilt on every call. That sentence is the whole list-default bug.

Parameters with defaults must sit after parameters without defaults. \`def search(q="rain", k):\` is illegal. \`def search(q, k=3):\` is legal.

## Never use a list as a default

This looks handy. It is a bug:

\`\`\`python
def add_event(event, history=[]):  # BAD
    history.append(event)
    return history
\`\`\`

Every call that skips \`history\` shares **one** list. The second call still sees the first event. In an agent, that looks like memory leaking from one user to the next. The same bug happens with \`dict\` defaults: \`def f(x, cache={}):\`.

**Fix:** default to \`None\`. Make a new list inside the function.

| Default | Safe? | Why |
|---|---|---|
| \`k=3\` | Yes | Numbers cannot change in place |
| \`label="user"\` | Yes | Strings cannot change in place |
| \`history=[]\` | No | One list is reused; \`append\` keeps old items |
| \`history=None\` then \`[]\` | Yes | Each call can get a fresh list |

Never use a list or a dict as a default. Use \`None\`, then build a new one inside. If the caller passes a list, use that list. If they skip it, make a new one. That is how a tool can optionally record into a transcript you own.

## Extra inputs: *args and **kwargs

Sometimes you want a function to accept extra values you did not name one by one.

- \`*args\` means extra **positional** inputs (in order). It is a **tuple** — a fixed row of values.
- \`**kwargs\` means extra **named** inputs. It is a **dict** — a map of names to values.

Say it in plain words: extra inputs. The names \`args\` and \`kwargs\` are convention. \`*parts\` and \`**fields\` work too. The stars are the syntax.

| Form | Where | Meaning |
|---|---|---|
| \`*args\` | in \`def\` | Extra values in order, as a tuple |
| \`**kwargs\` | in \`def\` | Extra named values, as a dict |
| \`*row\` | in a call | Unpack a list or tuple into order |
| \`**d\` | in a call | Unpack a dict into names |

\`\`\`python
def log_all(*parts, **fields):
    print("parts", parts)
    print("fields", fields)

log_all("tool", "search", ok=True, ms=12)
\`\`\`

A tool runner often looks like \`def call_tool(name, **kwargs):\` then \`fn(**kwargs)\`. Extra named inputs pass through. Required names stay explicit: \`name\` is not in kwargs. That split is useful. The tool name is policy. The rest is payload.

Do not swallow extras forever without noticing. Unknown keys on a strict tool should error. Unknown keys on a wrapper may pass through. Choose.

## Common mistakes

- List or dict defaults.
- Assigning to a name inside a function and thinking the global changed.
- \`global\` to dodge passing state.
- Calling \`fn(kwargs)\` instead of \`fn(**kwargs)\` — you pass one dict as the first argument.
- Putting \`*args\` after \`**kwargs\` in the definition (illegal order).

\`\`\`tryit python
def add_event(event, history=None):
    if history is None:
        history = []
    history.append(event)
    return history

print("good", add_event("a"))
print("good", add_event("b"))

def bad_add(item, bag=[]):
    bag.append(item)
    return bag

print("bad", bad_add("x"))
print("bad", bad_add("y"))

def log_all(*parts, **fields):
    print("extra positional", parts)
    print("extra named", fields)

log_all("tool", "search", ok=True, ms=12)

score = 10

def bump():
    score = 1
    print("inside function, score is", score)

bump()
print("outside function, score is still", score)
\`\`\`

You should see \`bad ['x']\` then \`bad ['x', 'y']\`. That shared list is the leak. The good function prints \`['a']\` then \`['b']\`.

## How agents use this

\`call_tool(name, **kwargs)\` plus a registry is the usual runner. Defaults give a search tool a sensible \`k=5\` when the model skips a field. A list default will merge two chats into one. Pass the transcript in. Default it to \`None\`. Make a new list for each agent.

Global registries of tools are fine as constants. Global *transcripts* are not. If \`MEMORY = []\` sits at module top and every request appends, users share a diary. That is the list-default bug at file scale. Return new state. Or pass a per-run list.

When the model omits \`k\`, the default saves you. When the model sends an extra key, \`**kwargs\` on a strict \`search(q, k=3)\` still raises unless you filter the dict first. Filtering unknown keys at the executor is a good guard. Passing them blindly is how a renamed field becomes a crash in the loop.

\`\`\`quiz
Why is def add_event(event, history=[]) dangerous?
- Empty lists are not allowed as defaults
- *The same list is reused on every call that skips history
- Python copies the list each call, which is slow
- [] means the same as None
explain: Defaults are built once. append then leaks items into later calls — bad for agent memory.
\`\`\`
`,
  },
  {
    slug: "unpacking",
    title: "Unpacking",
    summary:
      "Split a pair into names, peel the rest of a list, merge dicts with **, and unpack a tool result without losing defaults.",
    minutes: 20,
    level: "beginner",
    md: `
**Unpacking** means “take a row apart and give each piece a name.” You already pass a dict into a call with \`**args\`. This lesson also splits lists, merges dicts, and unpacks what a tool returns.

The point is readable names. \`name, args = pair\` is clearer than \`pair[0]\` and \`pair[1]\` everywhere. If the row is the wrong length, unpacking crashes loudly. That is better than silently using the wrong slot.

\`\`\`viz strip
title Split a pair into names
chip search
chip args
caption name, args = pair. Then call the function with those names.
\`\`\`

Agents unpack at three edges: a parsed \`(name, args)\` pair, a merged settings dict, and sometimes an \`(ok, data)\` result. Get those three right and you will stop writing \`pair[0]\` in five places.

## What you will learn

- \`a, b = pair\`
- \`first, *rest = row\`
- \`{**a, **b}\` to merge dicts
- \`**kwargs\` in calls
- Swap two names
- Unpack a tool result

## Split a pair

If a value has two parts, you can name both at once.

\`\`\`python
pair = ("search", {"q": "weather"})
name, args = pair
print(name)
print(args)
\`\`\`

The number of names must match the number of parts. \`a, b = ["think"]\` raises \`ValueError\`. \`a, b, c = pair\` also fails. Check \`len\` if the data comes from a model. After a parser you trust, unpack freely.

You can unpack a list the same way. Tuples are the usual pair type because they signal “do not append.”

Nested unpacking exists: \`(tool, (q, k)) = ...\`. Skip it until the shape is boring and tested. Nested unpacking of messy JSON is a gift to bugs.

Unpacking a string is legal and usually wrong: \`a, b = "ab"\` sets \`a\` to \`"a"\`. Tool names should stay whole strings. If you see a \`ValueError: too many values to unpack\`, you may have unpacked text by accident.

## First and the rest

A star on the left keeps leftover items in a list.

\`\`\`python
steps = ["think", "act", "observe"]
first, *rest = steps
print(first)  # think
print(rest)   # ['act', 'observe']
\`\`\`

This is handy for a transcript: the first message vs everything after. \`*rest\` is always a list, even if it has one item or zero items. \`head, *tail = ["only"]\` sets \`tail\` to \`[]\`.

You can also write \`*start, last = steps\` to peel the last item. Useful for “final answer vs the path.” Do not peel from both ends in one line if you cannot say the lengths out loud.

| Pattern | Meaning | Agent use |
|---|---|---|
| \`a, b = pair\` | Two names from a pair | tool name plus args |
| \`first, *rest = row\` | First item, then a list of the rest | system prompt vs later turns |
| \`*start, last = row\` | All but last, then last | path vs final answer |
| \`{**a, **b}\` | Merge dicts; \`b\` wins on clashes | defaults, then model args |
| \`fn(**d)\` | Unpack a dict into named inputs | \`call_tool\` |
| \`left, right = right, left\` | Swap | rare; same “right side first” rule |

A starred list in a call is the positional cousin of \`**\`: \`fn(*row)\` turns a list into ordered arguments. You will use this less than \`**\` for tools, because tool inputs have names.

## Swap

Python reads the right side first, then binds the names. That is why swap needs no extra box.

\`\`\`python
left = "user"
right = "assistant"
left, right = right, left
print(left, right)
\`\`\`

The right side builds a tuple \`(right, left)\` using the old values. Then unpacking writes the new names. You will rarely swap roles in an agent. The same rule explains why \`step, budget = step + 1, budget - 1\` works: right side first.

## Merge dicts

\`{**a, **b}\` copies \`a\`, then copies \`b\` on top. If both have the same key, **the later dict wins**.

\`\`\`python
base = {"model": "tiny", "temp": 0}
extra = {"temp": 0.2, "max_tokens": 64}
merged = {**base, **extra}
print(merged)
\`\`\`

\`temp\` becomes \`0.2\`. Agent use: start with defaults, then overlay the model’s arguments. The original \`base\` is unchanged. You built a new dict. That is important. Do not mutate the default dict you keep for the next call.

Later Python also has \`base | extra\` for dict merge. \`{**base, **extra}\` is enough here and works the same idea: new dict, later keys win.

If merge order is wrong, defaults overwrite the model. \`{**args, **defaults}\` would ignore the model’s \`temp\`. You almost never want that. Write defaults first, overlay second. Print the merged dict in a test. That test has no model. It still saves you.

## Unpack in a call, and unpack a result

In a call, \`**d\` turns a dict into keyword arguments.

A tool can return a pair. Unpack that pair the same way.

\`\`\`python
def call_search(q):
    ok = True
    hits = ["doc 0 about " + q]
    return ok, hits

ok, hits = call_search("rain")
print(ok, hits)
\`\`\`

\`fn(**args)\` raises \`TypeError\` if the dict has a key the function does not accept. Check the keys before you unpack. A small allowlist of argument names is a good filter: build a new dict with only \`q\` and \`k\`, then unpack that.

Returning a dict is often clearer than a pair: \`{"ok": True, "hits": ...}\`. Then you do not unpack; you \`.get\`. Pairs are fine when the two fields are obvious and stable.

## Walkthrough: filter keys, then unpack

Models send extra keys. A strict \`search(q, k=3)\` will \`TypeError\` on \`{"q": "rain", "k": 1, "pretty": True}\`. Filter first.

\`\`\`python
def only(keys, data):
    out = {}
    for key in keys:
        if key in data:
            out[key] = data[key]
    return out

raw = {"q": "rain", "k": 1, "pretty": True}
print(only(("q", "k"), raw))
\`\`\`

Then \`search(**only(("q", "k"), raw))\` is safe. Unknown keys stay out. Missing required keys still raise, which is what you want when \`q\` never arrived.

\`fn(args)\` vs \`fn(**args)\` is a different bug. Without stars, the whole dict becomes the first positional argument. \`search\` then sees \`q\` as a dict and concatenates badly, or raises. The star is the difference between “one mapping” and “named inputs.”

## What goes wrong

- Wrong number of names (\`ValueError\`).
- \`fn(args)\` vs \`fn(**args)\`.
- Mutating \`base\` instead of merging into a new dict.
- Unpacking a dict like a pair: \`a, b = {"q": 1, "k": 2}\` unpacks **keys**, not values, and the order is not a pair you chose. Do not do that.
- Unpacking a string into characters.
- \`{**args, **defaults}\` so defaults win and the model is ignored.
- Unpacking before you know parse succeeded: \`**\` on an error string.

\`_\` as a throwaway name is a convention: \`ok, _ = call_search(q)\` when you do not need hits. It still must match the length. It does not mean “ignore extras.” For extras you need \`*rest\`.

Do not mix \`*args\` in a \`def\` with \`*rest\` in assignment in your head: one collects extras in a function, the other peels a row. The star is the same character. The place is the meaning.

\`\`\`tryit python
pair = ("search", {"q": "weather"})
name, args = pair
print("tool", name)
print("args", args)

steps = ["think", "act", "observe", "think"]
first, *rest = steps
print("first", first)
print("rest", rest)
*start, last = steps
print("last", last)
print("start", start)

left = "user"
right = "assistant"
left, right = right, left
print("swapped", left, right)

base = {"model": "tiny", "temp": 0}
extra = {"temp": 0.2, "max_tokens": 64}
merged = {**base, **extra}
print("merged", merged)
print("wrong order", {**extra, **base})

def greet(name, city):
    return "hi " + name + " in " + city

kwargs = {"name": "Ada", "city": "London"}
print(greet(**kwargs))

def call_search(q):
    return True, ["doc 0 about " + q]

ok, hits = call_search("rain")
print("unpacked result", ok, hits)
\`\`\`

Change the first step in the list and run again. \`first\` should follow. \`rest\` should still be a list. Compare \`merged\` with \`wrong order\`: only the first should let \`temp\` stay \`0.2\`.

## How agents use this

A tool call is often a pair: name plus args. Unpack it, then call \`fn(**args)\`. Merge default settings with the model’s dict using \`{**defaults, **args}\`. Split a transcript with \`first, *rest\` when the first row is special. If a tool returns \`(ok, data)\`, unpack it so the loop can branch on \`ok\`.

Defaults should sit on your side, not in the model’s JSON. If the model omits \`temp\`, the merge keeps \`0\`. If the model sends \`temp\`, the overlay wins. That is a policy you can test without a model: merge two dicts, assert the result.

Be strict at the call boundary. Unpack only after the parser promised a dict of args. If parse failed, do not \`**\` an error string. The TypeError would hide the parse error. Branch on \`ok\` first, then unpack.

Filter unknown keys at the executor. Passing them blindly is how a renamed field becomes a crash in the loop. A small \`only(("q", "k"), args)\` is more honest than a \`**kwargs\` sink that swallows typos.

When the first transcript row is a system message, \`first, *rest = messages\` lets you always send \`first\` and slice \`rest[-8:]\`. That is unpack plus slice, not a new idea. If the list is empty, unpacking \`first, *rest\` raises \`ValueError\`. Guard with \`if not messages: return\`. Empty logs are a real startup state.

\`\`\`quiz
After first, *rest = ["think", "act", "observe"], what is rest?
- "think"
- *the list ["act", "observe"]
- "observe" only
- a dict of leftover keys
explain: The star collects leftover items into a list. first is "think". rest is the rest.
\`\`\`
`,
  },
  {
    slug: "modules",
    title: "Modules",
    summary:
      "Import a file of code, rename it with as, pull one name with from, and only run a main block when this file is the program.",
    minutes: 18,
    level: "beginner",
    md: `
A **module** is a Python file you can import. \`import\` means “load that file and use its names.” Real agents are several files, not one giant script. This editor cannot make sibling files, so you will import **stdlib** modules here. Stdlib means the modules that come with Python. Then you will *plan* how to split an agent on paper.

\`\`\`viz flow
title Load a file of names
layout lr
node file tools.py
node imp import
node use search
edge file imp
edge imp use
caption import loads a module. The loop file imports tools. Tools should not import the loop.
\`\`\`

Without modules, every example lives in one box. With modules, \`tools.py\` can be tested without starting the loop. That split is how agents stay editable.

## What you will learn

- \`import\`, \`from\`, and \`as\`
- \`if __name__ == "__main__":\` in plain words
- How you would split an agent into files
- Practice with \`math\`, \`json\`, and \`datetime\`

## Three ways to import

\`\`\`python
import math
import json as js
from datetime import date
\`\`\`

- \`import math\` loads the module. You write \`math.sqrt\`. The prefix shows where the name came from.
- \`import json as js\` loads it under a short name. \`as\` means “call it this instead.” Use this when the module name is long, not to hide it.
- \`from datetime import date\` pulls one name out. You write \`date\`, not \`datetime.date\`.

Do not write \`from math import *\`. That dumps many names into your file. You will not know where \`sqrt\` came from. You might overwrite your own \`pow\`.

| Form | How you use it |
|---|---|
| \`import math\` | \`math.ceil(2.1)\` |
| \`import json as js\` | \`js.dumps({...})\` |
| \`from datetime import date\` | \`date(2026, 9, 21)\` |

Python runs a module the first time you import it. Keep the top of a file thin. Put work in functions. If you connect to a database at import time, every test pays that cost. If you append to a global list at import time, tests share that list.

Import the same module twice in one program: the second time is cheap. Python reuses the already loaded module. Side effects at import still happened once. That is why side effects at import are painful.

## Only run this when this file is the program

Every module has a name flag called \`__name__\`.

- When you **run** this file as the program, \`__name__\` is \`"__main__"\`.
- When another file **imports** this file, \`__name__\` is the module’s name, not \`"__main__"\`.

So this block means: only run this when this file is the program.

\`\`\`python
def main():
    print("start the agent")

if __name__ == "__main__":
    main()
\`\`\`

Tests can import your functions without starting the agent. That is the whole reason. If \`main()\` sat naked at the bottom of \`loop.py\`, then \`import loop\` would launch the agent in the middle of a test.

Put almost nothing else at the top besides imports, constants, and \`def\`. The \`if __name__\` block calls \`main\`. \`main\` calls the loop. Tests call smaller functions.

## How you would split an agent into files

Imagine three files:

| File | Job |
|---|---|
| \`loop.py\` | The while loop: think, act, observe |
| \`tools.py\` | \`search\`, \`read\`, and other tool functions |
| \`prompts.py\` | The text you send the model |

\`loop.py\` would \`import tools\`. \`tools.py\` would not import \`loop.py\`. That keeps a one-way line. If two files import each other, you get a **circular import**. Python may hand you a half-loaded module and a confusing error.

Add \`tests/test_loop.py\` later. Tests import \`loop\` functions. They do not run the \`__main__\` block.

On your computer you save those files next to each other. Here, we only **describe** the split and import stdlib modules instead.

If import fails with \`ModuleNotFoundError\`, you typed a wrong name, or that package is not installed. \`json\` and \`math\` are always there. \`httpx\` is not, until you install it on a real machine. This site cannot install it.

A **package** in Python can also mean a folder of modules with an \`__init__.py\`. You do not need that for a three-file agent. Three modules in one folder, imported by name, is enough. If you name a file \`json.py\`, you hide the stdlib \`json\`. The error looks like \`dumps\` is missing. Rename your file. Never shadow stdlib names.

\`import tools\` looks for \`tools.py\` on \`sys.path\`, which includes the current directory when you run a file. From a tests folder the path can differ. Running \`python -m pytest\` from the project root is the usual fix on a laptop. Here, you only import stdlib, so the path lesson is for later. Still: one-way imports, thin tops, \`main\` behind a name check.

## Common mistakes

- \`from math import *\`.
- Work at import time: opening files, launching loops.
- Circular imports: loop imports tools imports loop.
- Naming your file \`json.py\` so it hides the stdlib module.
- Forgetting that this editor has no sibling files.

\`\`\`tryit python
import math
import json
import datetime

print(math.ceil(2.1))
print(math.sqrt(9))
print(json.dumps({"goal": "done"}))
print(datetime.date(2026, 9, 21))
print("this file name flag:", __name__)
print("is this the program?", __name__ == "__main__")

if __name__ == "__main__":
    print("this ran because this file is the program")

layout = {
    "loop.py": "the agent while-loop",
    "tools.py": "search, read, and other tools",
    "prompts.py": "the text you send the model",
}
for path, role in layout.items():
    print(path, "-", role)
\`\`\`

In this editor, \`__name__\` is usually \`"__main__"\`, so the extra line prints. On a real import, that line would stay quiet.

## How agents use this

Treat the agent as a few files from day one. The loop imports tools. Tests import the loop. Only a main block starts the program. When you add a tool, you add a function in \`tools.py\`, not another hundred lines in one file. Import is how that split stays clean.

Prompts as a module let you change text without touching the loop. Tools as a module let you stub \`search\` in tests by passing a fake registry. The loop should accept a tool dict and a model function. \`if __name__ == "__main__":\` is where you wire the real ones.

Joeven lessons stay in one box. Your laptop should not. Copy the layout table into a folder when you leave the browser. The language feature you practiced is \`import\`. The design feature is one-way dependencies.

\`\`\`quiz
When is a module’s __name__ equal to "__main__"?
- Always, in every import
- Never in Python 3
- *When this file is the program you started, not when it is imported
- Only inside the math module
explain: Python sets __name__ to "__main__" for the file you ran. The if-block means: only run this when this file is the program.
\`\`\`
`,
  },
  {
    slug: "files-json",
    title: "JSON and Text",
    summary:
      "Round-trip Python data with dumps and loads. Know what JSON allows, fake a file with a string, and split a CSV line.",
    minutes: 21,
    level: "beginner",
    md: `
Agents live on two kinds of text: **prose** (prompts and logs) and **JSON** (tool calls, API bodies, saved state).

**JSON** is a text format for data. It looks like Python dicts and lists, with small differences. Python’s \`json\` module is stdlib. You will use it every day. This site may not have a real disk. We **simulate** files with strings. Simulate means “pretend.” A string can hold the same text a file would hold.

If you cannot round-trip a dict through JSON, you cannot save memory, cannot parse a tool call, and cannot talk to most APIs. This lesson is that round trip.

\`\`\`viz flow
title Dump, then load
layout lr
node py dict
node dump dumps
node file JSON text
node load loads
edge py dump
edge dump file
edge file load
caption dumps turns data into text. loads turns text back into data. Never eval model text.
\`\`\`

## What you will learn

- \`json.dumps\` and \`json.loads\`
- \`indent\` and \`sort_keys\`
- What JSON allows
- Strings as fake files, and utf-8 in one sentence
- A tiny CSV line with \`split\`

## dumps and loads

- \`json.dumps(obj)\` — Python → JSON **string**. The “s” means string.
- \`json.loads(text)\` — JSON string → Python.

On a real computer, \`dump\` / \`load\` (no “s”) talk to file objects. Here we stay with strings. Remember the s: string. Without the s: file. Mixing them up is a TypeError.

\`\`\`python
import json
state = {"goal": "fix the test", "steps": 2}
text = json.dumps(state)
print(text)
print(json.loads(text)["goal"])
\`\`\`

Never use \`eval\` on model text. \`eval\` runs code. \`json.loads\` only reads data. A later lesson repeats this because people forget when a model wraps JSON in words.

\`dumps\` fails if the object holds a set, a datetime, or a custom class. Convert those first: \`list(a_set)\`, or a string timestamp. \`None\` becomes \`null\`. Tuples become JSON arrays (lists when loaded back). You lose “this was a tuple.”

| Call | Direction | Input | Output |
|---|---|---|---|
| \`json.dumps(obj)\` | Python to text | dict / list / … | \`str\` |
| \`json.loads(text)\` | text to Python | JSON \`str\` | dict / list / … |
| \`json.dump(obj, file)\` | Python to file | file object | None (writes) |
| \`json.load(file)\` | file to Python | file object | dict / list / … |

\`json.load(text)\` when \`text\` is a string fails: a string has no \`.read\` the way a file does. Use \`loads\`. The extra \`s\` is the whole difference.

## Pretty print

- \`indent=2\` adds spaces so people can read the text.
- \`sort_keys=True\` sorts keys A–Z. That makes two dumps easier to compare.

\`\`\`python
import json
print(json.dumps({"b": 2, "a": 1}, indent=2, sort_keys=True))
\`\`\`

Pretty JSON is for logs and files humans read. Compact JSON (no indent) is smaller for prompts. Same data. Different whitespace. \`loads\` accepts both.

\`sort_keys\` helps tests: two dicts with the same fields dump to the same text. Without sort, key order can differ and a string compare fails even when the data matches. For equality in tests, compare the loaded dicts, not always the text.

## What JSON allows

| JSON | Python |
|---|---|
| object \`{...}\` | \`dict\` |
| array \`[...]\` | \`list\` |
| string | \`str\` |
| number | \`int\` or \`float\` |
| true / false | \`True\` / \`False\` |
| null | \`None\` |

JSON does **not** allow comments, trailing commas, or Python sets. It does not allow single quotes. \`{'q': 'rain'}\` is Python, not JSON. \`"q": "rain"\` inside braces with double quotes is JSON.

Models often add trailing commas or single quotes. Then \`json.loads\` raises \`json.JSONDecodeError\`. Catch it and retry. Do not \`eval\`. Do not \`replace("'", '"')\` as a general parser. That breaks apostrophes inside strings.

True/false/null in JSON are lowercase. Python’s \`True\` dumps as \`true\`. After \`loads\`, you have Python \`True\` again.

## Round-trip surprises

Round-trip a value whenever you are unsure: \`dumps\` then \`loads\` then \`==\`.

| Python in | JSON text | Python out |
|---|---|---|
| \`True\` / \`False\` | \`true\` / \`false\` | \`True\` / \`False\` |
| \`None\` | \`null\` | \`None\` |
| \`(1, 2)\` | \`[1, 2]\` | \`[1, 2]\` (a list) |
| \`{1, 2}\` | error | — convert with \`list\` first |
| \`{"n": 1}\` | object | same dict |

If your test compares a tuple to the loaded value, it will fail even though the data is “the same.” Dump tuples as lists on purpose, or accept lists after load.

\`json.dumps(x, ensure_ascii=True)\` is the default and escapes non-ASCII. For logs you may want \`ensure_ascii=False\` so a city name stays readable. For APIs, follow the server.

## Fake files, utf-8, and a tiny CSV

**utf-8** is a way to store letters as bytes. English, accents, and other alphabets all fit. On a real machine, open text files with \`encoding="utf-8"\`.

Here, a string is the file:

\`\`\`python
saved = json.dumps(state, indent=2)
loaded = json.loads(saved)
\`\`\`

**CSV** is text with commas. One row can be split on \`","\`. This is enough for a tiny table. It is not a full CSV parser. Fields that contain commas need a real library later. For \`atlas,paris,ok\`, \`split\` is fine.

\`\`\`python
line = "atlas,paris,ok"
name, city, status = line.split(",")
print(name, city, status)
\`\`\`

Do not build JSON by joining strings if values can hold quotes. \`dumps\` escapes those characters for you. That is the same warning as the strings lesson, now with the right tool.

**JSONL** means one JSON object per line. A cheap eval file is \`dumps(case)\` for each case, joined with newlines. Reading it is \`for line in text.splitlines(): json.loads(line)\`. Nested args survive. CSV does not like nested args. Prefer JSONL when a column would have to hold a dict.

## Walkthrough: the errors models actually send

\`\`\`python
import json

def try_load(label, text):
    try:
        print(label, json.loads(text))
    except json.JSONDecodeError as e:
        print(label, "decode error")

try_load("ok", '{"q": "rain"}')
try_load("single quotes", "{'q': 'rain'}")
try_load("trailing comma", '{"q": "rain",}')
try_load("python True", '{"ok": True}')
\`\`\`

Single quotes fail. A trailing comma fails. Python’s \`True\` inside a string that you thought was JSON fails — JSON wants \`true\`. The model wrapping JSON in “Sure! \`{...}\` thanks” also fails until you slice out the object. Catch \`JSONDecodeError\`. Return \`{"ok": False, "error": "bad json"}\`. Do not crash the loop.

## What goes wrong

- \`eval\` on model output.
- \`json.load\` on a string (needs a file object).
- Single quotes, trailing commas, Python \`True\` / \`None\` in the text.
- Forgetting that \`null\` becomes \`None\`.
- Dumping a set.
- Splitting CSV that contains commas inside fields.
- Building JSON with string concat so a quote in the query breaks the object.
- Comparing dumped text in tests without \`sort_keys\` when you meant “same data.”

\`\`\`tryit python
import json

state = {
    "goal": "fix the test",
    "steps": 2,
    "tools": ["read", "run"],
    "error": None,
}
text = json.dumps(state, indent=2, sort_keys=True)
print(text)

loaded = json.loads(text)
print("goal", loaded["goal"])
print("error is missing?", loaded["error"] is None)

fake_file = json.dumps(state)
print("from fake file", json.loads(fake_file)["tools"])

print("JSON likes", json.dumps({"n": 1, "ok": True, "tags": ["a"], "x": None}))
print("tuple becomes", json.loads(json.dumps((1, 2))))

line = "atlas,paris,ok"
name, city, status = line.split(",")
print("csv", name, city, status)

rows = ["name,city", "atlas,paris", "bolt,oslo"]
for row in rows[1:]:
    parts = row.split(",")
    print("row", parts)

try:
    json.loads("{not json")
except json.JSONDecodeError:
    print("decode error as expected")
\`\`\`

No real file is opened. The saved text is a string. Change \`error\` to a string message, dump, load, and confirm it is not \`None\`. The tuple line should print a list \`[1, 2]\`.

## How agents use this

A model action is often a JSON object. Your runtime \`loads\` it, runs a tool, then \`dumps\` the result into the next prompt. Saved memory is JSON text. A string is enough to practice: dump, store, load. On a real disk, write that same string with utf-8. Fail here and you cannot even read what the model asked for.

Pretty dumps belong in traces you read. Compact dumps belong in prompts you pay for. \`sort_keys\` helps tests. For equality, compare the loaded dicts when whitespace should not matter.

CSV shows up as cheap eval sets: one row per example, columns for input and expected tool. \`split\` is a start. JSONL (one JSON object per line) is often better for nested args. You already have \`dumps\` and \`splitlines\`. That file format is those two functions.

Never hand the model a Python dict printed with \`print(state)\`. \`print\` uses single quotes and \`None\`. That is not JSON. The next \`loads\` will fail. Always \`dumps\` when the next reader is a JSON parser — including the model, if you asked it to read an object.

When parse fails, keep the raw string in the trace (shortened if huge). “bad json” plus a 200-character prefix is enough to see a trailing comma. Without the raw text, you will guess. Guessing at this layer wastes a whole debug session.

\`\`\`quiz
Which call turns a Python dict into a JSON string?
- json.loads(data)
- json.load(data)
- *json.dumps(data)
- json.dump(data)
explain: dumps means dump to a string. loads reads a string back into Python.
\`\`\`
`,
  },
  {
    slug: "with-files",
    title: "with, Files, and Paths",
    summary:
      "with always closes. pathlib Path names a file. utf-8 turns text into bytes. This is how read and write tools work.",
    minutes: 19,
    level: "beginner",
    md: `
A **file** is text (or bytes) stored under a name. Agent tools like \`read_file\` and \`write_file\` are file work. If you open a file and never close it, the handle can stay locked. On a laptop that looks like “the file is busy.” In a long agent, it looks like a leak.

\`with\` means: open, do the work, then **always close** — even if an error happens. That close step is why we use \`with\` instead of a bare \`open\`.

\`\`\`viz flow
title Open, work, always close
layout lr
node open open
node work work
node close close
edge open work
edge work close
caption with runs close even if work fails. That is how read and write tools should treat files.
\`\`\`

**pathlib** is the standard way to name files. A **Path** is an object for a file name. You can ask for the name, check if it exists, and read or write text. You do not glue strings with \`+\` and hope the slash is right.

## with always closes

Think of \`with\` as a promise: when the indented block ends, Python runs the close step.

Here is a tiny object that prints open and close so you can see the order:

\`\`\`python
class Box:
    def __enter__(self):
        print("open")
        return self

    def __exit__(self, *unused):
        print("close")
        return False

with Box():
    print("work")
\`\`\`

Output order is open, work, close. If \`work\` raised an error, close would still run. \`__enter__\` and \`__exit__\` are the protocol. You do not write them for real files. \`open\` already has them. The demo is so you believe “always close.”

On a real computer, a file looks like this:

\`\`\`python
with open("note.txt", "w", encoding="utf-8") as f:
    f.write("goal: find weather" + chr(10))
\`\`\`

- \`"w"\` means write (replace the file)
- \`"r"\` means read
- \`"a"\` means append
- \`encoding="utf-8"\` stores letters as **bytes** the whole world can read

**utf-8** is the usual encoding. Text in Python is \`str\`. On disk it is bytes. utf-8 is the bridge. If you skip encoding on some systems, a café in the text becomes mojibake.

\`as f\` names the file object. \`f.write\` writes. \`f.read\` reads. Prefer pathlib for whole-file text: \`Path.write_text\` / \`read_text\`. They still close for you.

## pathlib Path

\`Path("note.txt")\` is a path object. You do not have to call \`open\` yourself for simple text.

| Code | What it does |
|---|---|
| \`Path("note.txt")\` | A path named note.txt |
| \`p.name\` | The file name |
| \`p.exists()\` | True if that file is there |
| \`p.write_text(s, encoding="utf-8")\` | Write the whole string |
| \`p.read_text(encoding="utf-8")\` | Read the whole string |
| \`p.with_suffix(".json")\` | Same name, new ending |
| \`p.unlink()\` | Delete the file |

\`/\` on a Path joins parts: \`Path("logs") / "run1.json"\`. It works on Windows and Linux. String glue does not.

Never let a model pick a path like \`../secrets.txt\` without a check. Keep file tools inside one folder you control. Resolve the path, then check that it still starts with the allowed folder. This lesson only warns. The check is a later safety habit: \`p = (root / name).resolve()\` then reject if \`root\` is not a parent.

## Bytes vs text

- \`str\` is text you can print and slice
- \`bytes\` is raw data, like \`b"hello"\`
- \`s.encode("utf-8")\` turns text into bytes
- \`b.decode("utf-8")\` turns bytes into text

HTTP bodies and hashes use bytes. Prompts use text. Convert at the edge. Do not pass bytes into a prompt assembler. Do not pass a str into \`sha256\` without encoding.

\`write_text\` wants str. \`write_bytes\` wants bytes. Mixing them is a TypeError.

Check \`exists\` before a read tool returns a surprise. If the file is missing, return \`{"ok": False, "error": "not found"}\` instead of letting \`FileNotFoundError\` kill the loop. You will wrap that in \`try\` in the next lesson. Pathlib still helps: \`p.exists()\` is a bool you can test in \`if\`.

\`"a"\` appends. \`"w"\` replaces the whole file. A write tool that was meant to append a log line but opened with \`"w"\` will wipe the run. That is a one-character bug. Prefer \`write_text\` for replace, and read-modify-write for small files: read the string, add a line, write the whole string. For huge logs, append mode on a laptop is better. Here, whole-string is clearer.

Join paths with \`/\` on a Path: \`root / "traces" / "run.json"\`. Then resolve and check the result still sits under \`root\`. Model-supplied \`".."\` is the attack. The check is string prefix or \`.parents\`. Do it every time a tool takes a path.

## Common mistakes

- \`open\` without \`with\` and without \`close\`.
- Forgetting \`encoding="utf-8"\`.
- Letting the model choose \`../\` paths.
- Using \`+\` to join path parts.
- Reading bytes and treating them as a prompt string.

\`\`\`tryit python
from pathlib import Path


class Box:
    def __enter__(self):
        print("open")
        return self

    def __exit__(self, *unused):
        print("close")
        return False


with Box():
    print("work")

p = Path("agent-note.txt")
p.write_text(chr(10).join(["goal: find weather", "step: 1", ""]), encoding="utf-8")
print("name", p.name)
print("exists", p.exists())
print("text:")
print(p.read_text(encoding="utf-8"))
print("as json name", p.with_suffix(".json").name)

raw = "café".encode("utf-8")
print("bytes", raw)
print("back to text", raw.decode("utf-8"))

p.unlink()
print("deleted", not p.exists())
\`\`\`

This editor has a small virtual disk. Writing \`agent-note.txt\` is safe here. Then we delete it. On your laptop, wrap real \`open\` in \`with\`, or use \`Path.write_text\`. Both close for you. Catch file errors in the next lesson.

## How agents use this

A read tool is \`Path(name).read_text(encoding="utf-8")\` plus a folder check. A write tool is \`write_text\`. \`with\` is how you close a handle if you use \`open\`. Convert to bytes only when a library asks for bytes (hashes, some HTTP bodies). If you skip close, files stay locked. If you skip utf-8, accents break.

Traces saved as JSON are files: dump to a string, write the string, later read and load. The JSON lesson and this lesson are one pipeline. The agent should not hold the only copy of a long run in memory if you need to debug after a crash. Write the trace. Close the file. Open it in a test.

Model-chosen paths are a tool-safety problem, not a pathlib problem. Pathlib makes the check easier because you have \`.resolve()\` and parts. Still check. A string \`open(user_path)\` is how secrets leave the machine.

\`\`\`quiz
Why use with when you open a file?
- It makes Python faster
- *It closes the file even if an error happens
- It encrypts the file
- It skips utf-8
explain: with runs the close step when the block ends, including after an error. That is the point.
\`\`\`
`,
  },
  {
    slug: "exceptions",
    title: "Errors and try/except",
    summary:
      "Catch specific errors, clean up with finally, and turn tool failures into dicts the agent loop can read.",
    minutes: 21,
    level: "beginner",
    md: `
An **exception** is an error that stops normal flow. If nobody **catches** it, the whole program dies. The last line of the message is usually the type and a short reason: \`ValueError: only https allowed\`. Read that line first. Then read the traceback from the bottom up to see which of your lines threw.

Tools fail all the time: bad URL, missing key, timeout. In an agent, that should rarely kill the process. You catch the error at the tool edge, save it as data, and let the loop choose: retry, skip, or stop.

\`\`\`viz flow
title Catch, then keep going
layout lr
node try try
node ok result
node ex except
node err error dict
edge try ok
edge try ex
edge ex err
caption If the tool fails, catch it and return a dict. The loop reads ok. It should not crash.
\`\`\`

A crash inside \`search\` that you never wrap becomes a crashed loop. The model never sees “search timed out.” You see a traceback in a terminal. Those are different products. One is an agent. The other is a broken script.

## What you will learn

- \`try\`, \`except\`, \`else\`, \`finally\`
- \`raise\` with a custom message
- Tool failure as a dict vs an exception
- Never write a bare \`except:\`

## try / except / else / finally

\`\`\`python
try:
    result = read_url(url)
except ValueError as e:
    result = "failed: " + str(e)
else:
    print("no error")
finally:
    print("tool finished")
\`\`\`

| Word | When it runs |
|---|---|
| \`try\` | The risky work |
| \`except ValueError\` | Only if that error type happened |
| \`else\` | Only if \`try\` had **no** error |
| \`finally\` | Always — success, failure, or \`return\` |

Catch a **specific** type. \`except ValueError\` is clear. \`except Exception\` is wide. Start specific. \`KeyError\`, \`TypeError\`, \`json.JSONDecodeError\`, \`ValueError\` are the usual agent set.

\`as e\` names the error object. \`str(e)\` is the message. \`type(e).__name__\` is the type as text, useful in a dict you print.

\`else\` is optional. Use it when the success path should not run if you caught. Putting success code in \`try\` also works, but then a bug in the success path is caught by the same \`except\`. \`else\` avoids hiding those bugs.

\`finally\` is for cleanup: close, print “finished,” reset a flag. A \`return\` inside \`try\` still runs \`finally\` before the function actually returns. That is why the live box prints \`finished\` on every URL.

## raise and a custom message

\`raise\` throws an error. You can attach a **message** (a string that explains what went wrong).

\`\`\`python
def read_url(url):
    if not url.startswith("https://"):
        raise ValueError("only https allowed")
    return "ok body"
\`\`\`

\`raise ValueError("only https allowed")\` is a built-in error type plus your message. The agent can print that message or store it. Write messages that help a person: what was wrong, what is allowed. \`"bad"\` is not a message.

Inside \`except\`, a bare \`raise\` throws the same error again. Use that after you log, if you still cannot handle it. That is for unexpected bugs in *your* loop. Tool failures should become dicts instead, so the loop keeps running.

You can also \`raise ValueError("...") from e\` to chain. Skip that until you need it. A single clear \`raise\` is enough.

Do not put secrets in the message. Raise \`ValueError("missing API_KEY")\`, not \`ValueError("bad key " + key)\`. Traces copy messages.

## Dict vs exception

Two ways a tool can fail:

| Style | Example | Effect |
|---|---|---|
| Exception | \`raise ValueError("timed out")\` | Must be caught, or the program stops |
| Dict | \`{"ok": False, "error": "timed out"}\` | The loop keeps running and reads \`ok\` |

At the tool edge, convert exceptions to **data**: a dict with \`ok\` and \`error\`. Inside the while loop, work with data. That is easier to test. Tests pass a dict. They do not have to catch.

Inside a tool, \`raise\` is still fine to stop bad input. \`call_tool\` catches and wraps. One wrapper, many tools.

You can list more than one type: \`except (ValueError, TypeError) as e:\`. Keep the tuple tight. Do not add \`Exception\` to that tuple “just in case.” Order matters if you stack \`except\` blocks: specific types first, wider later. \`except Exception\` then \`except ValueError\` will never hit ValueError, because Exception already caught it. Put ValueError first.

\`else\` on \`try\` is “no error.” It is not the same as \`else\` on \`if\`. If you skip \`else\` and put success code after the whole try/except/finally, \`finally\` has already run. The live box uses \`return\` inside \`except\` and \`else\`, and \`print\` in \`finally\`. Copy that shape for tools.

## Walkthrough: one wrapper, many failures

\`\`\`python
import json

def call_tool(name, raw):
    try:
        args = json.loads(raw)
        if name == "read_url":
            return {"ok": True, "body": "ok body"}
        raise ValueError("unknown tool")
    except json.JSONDecodeError as e:
        return {"ok": False, "error": "bad json"}
    except ValueError as e:
        return {"ok": False, "error": str(e)}
\`\`\`

JSON parse errors belong in the same wrapper. \`JSONDecodeError\` is expected from models. Catch it. Do not catch \`NameError\` in the same bucket. \`NameError\` means you typo’d a variable. That should fail the test, not become an observation.

| Type | Usually means | Catch at tool edge? |
|---|---|---|
| \`ValueError\` | bad input, policy reject | yes |
| \`KeyError\` | missing required field | yes, or prevent with \`.get\` |
| \`TypeError\` | wrong type or extra \`**\` key | yes at executor |
| \`json.JSONDecodeError\` | model text was not JSON | yes |
| \`NameError\` | your typo | no — let tests fail |
| \`KeyboardInterrupt\` | user stopped the program | never catch to swallow |

## Never a bare except

\`except:\` with no type catches **everything**, including errors you should not hide: \`KeyboardInterrupt\`, \`SystemExit\`, memory errors, syntax bugs you introduced.

Never write a bare \`except:\`. Catch \`ValueError\`, \`KeyError\`, or another real type. Then log it. Swallowing every error is how agents “do nothing” and leave no trace. A silent \`except: pass\` is a defect, not a safety feature.

## What goes wrong

- Bare \`except:\`.
- Catching too wide and hiding bugs.
- Forgetting \`str(e)\`, then storing the error object in JSON (\`dumps\` may fail).
- Raising in the loop instead of returning a dict.
- Catching \`Exception\` around the whole agent, so nothing ever crashes even when your parser is wrong.
- Wide \`except\` above a specific one, so the specific block is dead.
- Putting success logic in \`try\` so a later \`KeyError\` looks like a tool failure.

Always store \`str(e)\` in the dict. An exception object is not JSON. \`json.dumps({"error": e})\` can fail and hide the original error.

\`\`\`tryit python
def read_url(url):
    if not url.startswith("https://"):
        raise ValueError("only https allowed")
    if url.endswith("/timeout"):
        raise ValueError("timed out")
    return "ok body"

def run(url):
    try:
        body = read_url(url)
    except ValueError as e:
        return {"ok": False, "error": str(e)}
    else:
        return {"ok": True, "body": body}
    finally:
        print("finished", url)

print(run("http://example.com"))
print(run("https://example.com/timeout"))
print(run("https://example.com"))

import json
try:
    json.loads("{not json")
except json.JSONDecodeError as e:
    print("bad json", e.msg)
\`\`\`

Each call prints \`finished\` because \`finally\` always runs. Bad URLs return a dict, not a crash. Change the successful URL and watch \`else\` still return \`{"ok": True, ...}\`.

## How agents use this

Tool failures are normal. The model should see “search timed out” as a row in the transcript, not as a crashed Python process. Catch at \`call_tool\`. Return \`{"ok": False, "error": ...}\`. Retry only when it makes sense. Let true bugs in *your* loop still show up. A custom message on \`raise\` is how you say what went wrong in one short line.

JSON parse errors belong in the same wrapper. \`JSONDecodeError\` is expected from models. Catch it. Do not catch \`NameError\` in the same bucket.

Print \`finished\` or append a trace row in \`finally\` if you need “this tool ended” even when it raised. Then the log has a close parenthesis. Agents that crash mid-tool with no row look like they hung. They did not hang. They died without logging.

Retry policy sits *above* the wrapper, in the loop, using the dict. \`if not obs["ok"] and "timeout" in obs["error"] and used < 3:\` then try again. The wrapper does not retry. If it did, a single user turn could hide a dozen failed calls. One catch, one dict, one loop decision.

Do not wrap the whole \`while\` in \`try/except Exception\`. A bug in *your* prompt builder would then become an observation forever, and you would ship it. Wrap tools. Let the loop crash in tests when *you* are wrong. That split is the whole lesson applied at agent scale.

\`\`\`quiz
What is wrong with writing except: with no error type?
- It is too slow
- *It catches every error, including ones you should not hide
- finally will not run
- raise stops working
explain: A bare except hides bugs. Catch a specific type, record it, and keep going if the tool failed.
\`\`\`
`,
  },
  {
    slug: "mutability",
    title: "Copy vs Change in Place",
    summary:
      "Lists and dicts change in place. Copy when you must not share. Never give two agents one transcript list.",
    minutes: 20,
    level: "beginner",
    md: `
Some values can **change in place**. That means you edit the same object. You do not make a new one.

Lists and dicts can change in place. \`nums.append(3)\` edits \`nums\`. Strings and numbers cannot. \`name = name + "!"\` makes a new string. \`step += 1\` makes a new number and moves the name.

If two names point at one list, a change through either name shows up in both. That is the whole lesson. It is also a privacy bug if those names belong to two users.

\`\`\`viz flow
title Two names, one list
layout lr
node a agent A
node list transcript
node b agent B
edge a list
edge b list
caption If both agents point at one list, an append shows up in both chats. Give each agent its own list.
\`\`\`

## What you will learn

- Change in place vs a new value
- \`id()\` as a light check for “same object”
- \`copy.copy\` vs \`copy.deepcopy\`
- Why two agents must not share one transcript list

## One list, two names

\`\`\`python
transcript = ["hello"]
shared = transcript
shared.append("oops")
print(transcript)  # ['hello', 'oops']
\`\`\`

\`shared = transcript\` does not copy. It sticks a second name on the same list.

**Rebind** is different. \`transcript = ["hello"]\` later points the name at a **new** list. The old list is unchanged if another name still holds it. \`append\` is not rebind. \`=\` of a new list is rebind.

Functions get the same rule. If you pass a list and the function \`append\`s, the caller sees the extra item. If the function assigns a new list to its parameter name, the caller’s name is unchanged. Passing a list is not passing a copy.

| Kind | Examples | In-place change? |
|---|---|---|
| Mutable | list, dict, set | yes: \`append\`, \`d[k]=v\`, \`add\` |
| Immutable | str, int, float, bool, tuple, \`None\` | no; you make a new value |

A tuple’s slots cannot be replaced. If a slot holds a list, that inner list can still change. Frozen outer, mutable inner: the same story as a frozen dataclass with a dict field.

## Rebind vs mutate

| Code | What happens to the caller’s list |
|---|---|
| \`xs.append(row)\` | caller sees the new row |
| \`xs[0] = row\` | caller’s first slot changes |
| \`xs = xs + [row]\` | new list; caller unchanged |
| \`xs = []\` | parameter name rebound; caller unchanged |

\`\`\`python
def record(log, row):
    log.append(row)

memory = []
record(memory, "step 1")
print(memory)  # ['step 1']
\`\`\`

That can be what you want (record a step). It is a bug when two users share one list. Name the contract: “this function mutates \`log\`” or “this function returns a new list.” Silent sharing is the defect. Visible sharing is a tool.

## id() lightly

\`id(x)\` is a number for that object in memory. Same \`id\` means the **same** object. Different \`id\` means two objects.

You do not need \`id\` in production code. It is a teaching light: “are these two names the same list?”

\`\`\`python
a = ["hi"]
b = a
c = list(a)  # a new list with the same items
print(id(a) == id(b))  # True
print(id(a) == id(c))  # False
\`\`\`

\`list(a)\` copies the outer list. Inner lists inside \`a\` would still be shared. That is a **shallow** copy: a new box, same insides. \`a[:]\` is the same kind of copy for lists. \`dict(d)\` is a shallow copy of a dict.

Do not use \`id\` of small ints as a uniqueness scheme. Some small integers are interned. Use \`id\` only to compare “same list?” while you learn.

## copy.copy vs copy.deepcopy

The \`copy\` module is stdlib.

| Call | What you get |
|---|---|
| \`copy.copy(x)\` | New outer list or dict; inner lists still shared |
| \`copy.deepcopy(x)\` | New outer object **and** new copies of what is inside |
| \`list(xs)\` / \`dict(d)\` | Shallow copy, like \`copy.copy\` for those types |

\`\`\`python
import copy
a = {"msgs": ["hi"]}
shallow = copy.copy(a)
shallow["msgs"].append("there")
print(a)  # inner list changed — shared

b = {"msgs": ["hi"]}
deep = copy.deepcopy(b)
deep["msgs"].append("there")
print(b)  # still ['hi']
\`\`\`

Use a deep copy when the object has lists inside lists (or dicts inside dicts) and you must not share any of them. Traces are dicts of lists of dicts. Isolating a trace for a second agent is a deep copy — or, simpler, start from \`[]\` and do not share.

Deep copy is slower and can copy too much. Do not deep-copy on every turn as a reflex. Copy when you branch: snapshot before a risky experiment, or split two agents.

## Two agents, one transcript

A **transcript** is a list of messages. If you write:

\`\`\`python
memory = []
agent_a = {"name": "atlas", "transcript": memory}
agent_b = {"name": "bolt", "transcript": memory}
\`\`\`

then Atlas’s \`append\` also appears in Bolt’s memory. Users can see each other’s prompts. That is a serious bug.

**Fix:** give each agent its own list.

\`\`\`python
agent_a = {"name": "atlas", "transcript": []}
agent_b = {"name": "bolt", "transcript": []}
\`\`\`

If you must start from old rows, copy: \`list(old)\` or \`copy.deepcopy(old)\` when rows are dicts. \`list(old)\` on a list of dicts still shares the dict rows. Editing \`agent_b["transcript"][0]["content"]\` would edit Atlas’s first message too. Nested rows need a deep copy, or you must not mutate old rows.

The same bug appears if \`__init__\` does \`self.log = default_log\` and every Agent gets the same argument. Pass \`None\` and create \`[]\` inside, like the defaults lesson. A list on a **class body** (\`class Bad: log = []\`) is shared by every instance. Classes lesson, same object.

Strings and ints hide the issue because assignment makes a new object. \`a = 1; b = a; b = b + 1\` does not change \`a\`. Beginners then believe \`b = a\` always copies. It copies the label. For lists, the label points at a changeable object. Draw two arrows to one row of boxes. That picture is the lesson.

## Walkthrough: shallow copy of a list of dicts

\`\`\`python
old = [{"role": "user", "content": "hi"}]
clone = list(old)
clone[0]["content"] = "secret"
print(old[0]["content"])  # secret — the dict was shared
\`\`\`

\`list(old)\` made a new list. It did not copy the dict inside. A second agent that “cloned” a transcript this way still edits the first agent’s words. For rows that are dicts, \`copy.deepcopy(old)\` or a loop that builds new dicts: \`{"role": row["role"], "content": row["content"]}\`.

## What goes wrong

- \`b = a\` as a copy.
- Shallow copy of a trace of dicts, then mutating a row.
- A list default (previous lesson) — same shared object.
- Putting \`log = []\` on a class body so every instance shares it.
- Trusting \`id\` of small ints as a uniqueness scheme.
- Popping a transcript row and thinking the side effect (sent email) undid itself.

\`\`\`tryit python
import copy

transcript = ["hello"]
shared = transcript
shared.append("oops")
print("shared list", transcript)
print("same object?", id(transcript) == id(shared))

a = {"msgs": ["hi"]}
shallow = copy.copy(a)
shallow["msgs"].append("there")
print("after shallow copy, original", a)

b = {"msgs": ["hi"]}
deep = copy.deepcopy(b)
deep["msgs"].append("there")
print("after deep copy, original", b)

agent1 = ["user: hi"]
agent2 = agent1
agent2.append("assistant: hello")
print("agent1 saw agent2", agent1)

own1 = ["user: hi"]
own2 = list(own1)
own2.append("assistant: hello")
print("own1", own1)
print("own2", own2)
print("own lists same object?", id(own1) == id(own2))

rows = [{"content": "hi"}]
shallow_rows = list(rows)
shallow_rows[0]["content"] = "edited"
print("original row after shallow list copy", rows[0]["content"])
\`\`\`

Give agent 2 its own list in the last shared block if you change \`agent2 = agent1\`. The prints should then diverge. Same id means same list. The final line should show \`edited\`: shallow list copy does not copy inner dicts.

## How agents use this

Each agent needs its own transcript list. Sharing one list mixes chats. \`append\` changes the list in place, so every name on that list sees the new row. Copy before you isolate. Use \`copy.deepcopy\` when messages are dicts nested in lists. \`id()\` can prove two names are one object while you learn. In real code, just make a new list per agent.

Retries that “roll back” a step must not assume the world rolled back. Popping the last transcript row undoes the log, not the email you sent. Copy-on-write snapshots of *state you own* are for search trees and what-if plans. Side effects outside Python are not undone by deepcopy.

When you pass \`state\` into \`run(state)\`, decide if \`run\` may mutate it. If tests reuse one state dict, mutate will leak between tests. Either copy at the start of \`run\`, or treat state as owned by the caller and document that appends are visible.

Global \`MEMORY = []\` at module top is the same bug at file scale. Every request appends to one diary. Return new state. Or pass a per-run list. Tool registries as constant dicts of functions are fine to share: you are not appending user text to them. Share code. Do not share memory.

Prompt compactors should build a new list of small dicts, not delete keys from the live trace. If they mutate, your debug file loses the HTML you needed. Isolation is a copy (or a new object). It is not a comment that says “do not share.”

\`\`\`quiz
Two agents share one transcript list. Agent A appends a message. What happens?
- Agent B is unchanged
- *Agent B’s transcript also has that message
- Python copies the list automatically
- id() makes a new list
explain: append changes the list in place. Every name pointing at that list sees the change.
\`\`\`
`,
  },
];
