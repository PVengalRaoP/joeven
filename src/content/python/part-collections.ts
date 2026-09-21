import type { RawLesson } from "@/lib/types";

export const pythonCollections: RawLesson[] = [
  {
    slug: "lists",
    title: "Lists",
    summary:
      "A list is a row of values you can change. Index, slice, append, pop, and keep an agent's step memory without losing order.",
    minutes: 18,
    level: "beginner",
    md: `
A **list** is a row of values. You write it with square brackets and commas. Values keep their order. You can change a list later: add a value, take one off, or replace one. That is why agents use lists as **memory**. Here, memory means a log of steps. Each thought, tool call, and result can be one item in the list.

A list can hold mixed types, but you usually should not. A list of step strings is clear. A list that mixes numbers, dicts, and None is hard to print and hard to test. Pick one kind of item, or later use a list of dicts with the same keys.

\`\`\`viz strip
title Memory is a row of boxes
chip user
chip thought
chip action
chip result
caption A list keeps order. Append adds a box at the end. That row is the agent's memory.
\`\`\`

## Make a list

Values sit in order. The first value is on the left.

\`\`\`python
memory = ["user: book a flight", "thought: need dates"]
tools = ["search", "read"]
empty = []
print(memory)
print(len(empty))
\`\`\`

An empty list is \`[]\`. Start there, then add steps as the agent works. \`len(empty)\` is \`0\`. \`len\` counts items, not characters. For a list of strings, \`len(memory)\` is how many steps, not how long the text is.

You can write a list across several lines. The commas still separate items. A trailing comma after the last item is allowed and often nicer when you add a row later.

## Read, add, and remove

An **index** is a position number. Counting starts at **0**, not 1. So \`memory[0]\` is the first item. \`memory[-1]\` is the last item. \`memory[-2]\` is the second last.

A missing index **crashes** with \`IndexError\`. \`empty[0]\` fails. Check \`len\` or use a slice when the list might be empty.

| Code | What it does |
|---|---|
| \`memory[0]\` | First item |
| \`memory[-1]\` | Last item |
| \`memory[1:]\` | From index 1 to the end (a **slice**, a piece) |
| \`len(memory)\` | How many items |
| \`"search" in tools\` | True if that value is in the list |
| \`memory.append(x)\` | Add \`x\` at the end |
| \`memory.pop()\` | Take off the last item and give it back |
| \`memory[0] = "new"\` | Replace the first item |

\`append\` changes the list. It does **not** give you a new list. It gives you \`None\` (Python's "nothing"). Never write \`memory = memory.append(x)\`. That name would then hold \`None\`, and the next \`append\` would crash because \`None\` has no append.

\`pop()\` removes the last item and returns it. \`pop(0)\` removes the first item. Popping an empty list raises \`IndexError\`. If you need to undo only when there is something to undo, check \`if memory:\` first.

\`in\` on a list checks values with \`==\`. It scans from the left. For a few tool names it is fine. For a large allowlist, a **set** (next lessons) is faster. For a log, \`in\` asks “did this exact step string already appear?”

\`\`\`python
memory = ["user: book a flight"]
memory.append("thought: need dates")
print(memory[0])
print(len(memory))
print("thought: need dates" in memory)
last = memory.pop()
print(last)
print(memory)
\`\`\`

If you need the last five steps, use a slice: \`memory[-5:]\`. That is a simple memory rule. If the list has fewer than five items, you just get them all. Slices do not crash.

## A list of steps

Each turn, **append** what happened. The list grows. That log is the agent's memory. Print it when you debug. Save it when you test.

You can also **pop** the last step to undo a bad action. Undo is not magic. It only works if the world outside the list can also be undone. Popping “sent email” from memory does not unsend the email. Use undo for thoughts and uncommitted drafts, not for irreversible tools.

Replace one slot when you correct a field: \`memory[1] = "thought: need dates and city"\`. The rest of the list stays.

Start with \`memory = []\`. After the user message, append. After a thought, append. After a tool result, append. Print \`len(memory)\` if you are lost. The length should grow by one per event. If it grows by two, you appended twice. If it stays the same, you printed but did not append, or you appended to a different list.

\`in\` checks equality of whole items. \`"flight" in memory\` is False if the item is \`"user: book a flight"\`. Searching inside each string is a loop, not list membership. Keep those two ideas apart.

## Lists inside lists

A **nested list** is a list inside another list. Read it with two indexes: first the outer item, then the inner one.

\`\`\`python
step = ["action", ["search", "weather"]]
print(step[0])      # action
print(step[1][0])   # search
print(step[1][1])   # weather
\`\`\`

Keep this light. Real agent logs usually nest **dicts** (named fields), not only lists. Named fields are easier to read than “the thing at index 1 of index 1.” Nested lists still show up in tables and in some tool results.

## Common mistakes

- \`memory = memory.append(x)\` stores \`None\`.
- Assuming the first item is index 1.
- \`pop\` on an empty list.
- Using a list as an allowlist of thousands of names (a set is better).
- Sharing one list across two agents by assignment (\`b = a\`). The next lesson on copies goes deeper; know that \`b = a\` does not copy.
- Forgetting that \`append\` returns \`None\`, then printing that return and thinking the list vanished.

\`\`\`tryit python
memory = ["user: book a flight", "thought: need dates"]
print("first:", memory[0])
print("last:", memory[-1])
print("from index 1:", memory[1:])
print("count:", len(memory))

memory.append("action: ask_user")
print("after append:", memory)
print("ask_user in list?", "action: ask_user" in memory)

undone = memory.pop()
print("popped:", undone)
print("now:", memory)

step = ["action", ["search", "weather"]]
print("inner first:", step[1][0])

# append changes the list and gives back None
print("append returns:", memory.append("obs: next week"))
print("memory is still a list:", memory)
\`\`\`

Add another \`append\`, run, then \`pop\` twice. Watch the list grow and shrink. The prints are the story of memory: first, last, count, then a change.

## How agents use this

An agent keeps a list of steps. Each turn it appends what it thought, what tool it called, and what it saw. You debug by printing that list. You shorten cost by keeping only the last few items: \`memory = memory[-8:]\`. That assignment replaces the name with a shorter list. The old long list is dropped if nothing else points at it.

When people say the agent has memory, they often mean this list was not thrown away between turns. A function that creates a new \`[]\` every call has no memory. A function that receives \`memory\`, appends, and returns it does. You will write that pattern in the functions lessons. The list is the data. The loop is the user of the data.

Order matters. A set of steps would lose duplicates and order. “search, fail, search again” is a different story from one search. Keep the log as a list. Use other collections for uniqueness and for named fields.

\`\`\`quiz
What does memory.append("act") give you back?
- A new list that includes "act"
- The string "act"
- *None, and the list itself is changed
- A copy of the list
explain: append changes the list in place and gives you None. Do not write memory = memory.append(x).
\`\`\`
`,
  },
  {
    slug: "slicing",
    title: "Index and Slice",
    summary:
      "Count from 0. A slice is a piece of a list or a string. Off-by-one errors break chunks of text and log windows.",
    minutes: 18,
    level: "beginner",
    md: `
An **index** is a position number. Python starts at **0**. The first item is index 0. The second is index 1. The last item of a 4-item list is index 3, which is also \`-1\`.

\`\`\`viz strip
title Index 0 is the first box
chip a
chip b
chip c
chip d
caption A slice [1:3] keeps b and c. The stop index is not included. The same rule works on text.
\`\`\`

A **slice** is a piece. You write it as \`[start:stop]\`. You get items from \`start\` up to — but **not including** — \`stop\`. The same rules work on a **string** (text) and on a **list**. Learn them once. Use them on prompts, logs, and chunks.

## Count from zero

\`word[0]\` is the first character. \`word[-1]\` is the last. Negative indexes count from the end: \`-2\` is the second last. \`word[-len(word)]\` is the first character again.

A missing index **crashes**. Python stops with \`IndexError\`: that position does not exist. A slice does not crash. A slice that is past the end is just empty. That difference matters when you take \`memory[-1]\` on an empty log (crash) versus \`memory[-5:]\` on a short log (fine).

\`\`\`python
word = "hello"
print(word[0])    # h
print(word[-1])   # o
print(word[1:4])  # ell  (indexes 1, 2, 3 — not 4)

nums = ["a", "b", "c", "d"]
print(nums[1:4])  # ['b', 'c', 'd']
print(nums[9:12]) # []
\`\`\`

If you need the last item but the list might be empty, check first:

\`\`\`python
if nums:
    print(nums[-1])
else:
    print("no items")
\`\`\`

## Start, stop, and step

You can skip the start or the stop. You can also add a **step** (how many items to jump).

| Code | Meaning |
|---|---|
| \`s[0]\` | Item at index 0 |
| \`s[-1]\` | Last item |
| \`s[1:4]\` | Indexes 1, 2, 3 (stop is not included) |
| \`s[:3]\` | From the start up to index 3 |
| \`s[3:]\` | From index 3 to the end |
| \`s[::2]\` | Every second item |
| \`s[:]\` | A **copy** (a new list with the same items) |
| \`s[-5:]\` | Last five items (or all, if fewer) |

\`s[start:stop:step]\` is the full form. \`s[::-1]\` walks backward. That is a trick. Real agent code uses slices to keep a tail of a log, not to reverse a prompt. If you reverse a transcript, the model sees the story backwards.

A step of 2 on \`"abcde"\` with \`[0:5:2]\` is \`"ace"\`. Useful in puzzles. Rare in agents. Prefer a loop if you are picking items by a rule other than “a window of the log.”

## Copy with [:]

\`b = a\` does **not** copy. Both names point at the same list. If you append through \`b\`, you also change \`a\`.

\`c = a[:]\` makes a new list. Changing \`c\` does not change \`a\`. \`list(a)\` is the same kind of copy. Both are **shallow**: inner lists inside \`a\` are still shared. Deep copy comes later. For a list of strings, \`[:]\` is enough.

\`\`\`python
original = [1, 2, 3]
same = original
copy = original[:]
same.append(99)
print(original)  # [1, 2, 3, 99]
print(copy)      # [1, 2, 3]
\`\`\`

Strings do not need this copy for safety, because you cannot change a string in place. \`t = s\` for two strings is still two names on one text, but nothing can edit that text.

## Off-by-one breaks chunking

**Chunking** means cutting a long text into small pieces (**chunks**) so a model can read them. Each chunk is a slice. The next chunk should start where the last one stopped.

**Off-by-one** means you are one item too short or too long. It happens because \`stop\` is not included.

If you want 4 letters, the stop is \`start + 4\`, not \`start + 3\`. The next chunk should start at that same stop. If you start the next chunk one too far, you skip a letter. If you stop one too soon, you drop a letter.

\`\`\`python
text = "abcdefgh"
print(text[0:4], text[4:8])  # abcd efgh  — good 4-letter chunks
print(text[0:3], text[3:6])  # abc def    — too short (off by one)
\`\`\`

A small loop that does this right:

\`\`\`python
text = "abcdefgh"
size = 4
start = 0
while start < len(text):
    piece = text[start:start + size]
    print(piece)
    start = start + size
\`\`\`

The next \`start\` is the old stop. That single assignment is the whole trick.

A log window is the same arithmetic. \`memory[-8:]\` means start at \`len(memory)-8\`, stop at the end. If you write \`memory[-8:-1]\` you drop the last item. That is a classic off-by-one: you wanted the last eight, including the newest. The missing last row is often the observation the model needed. Prefer \`[-n:]\` with no stop, or \`[start:]\`.

Indexes on a 5-item list are 0,1,2,3,4. There is no 5. \`nums[5]\` crashes. \`nums[5:]\` is empty. When you compute \`i + size\` as the next start, that number is allowed to equal \`len\`. The next slice is then empty and your while loop should stop. \`start < len(text)\` is the right test. \`start <= len(text)\` would spin on empty slices.

## Common mistakes

- \`memory[-1]\` on an empty list.
- Using \`s[0:4]\` and thinking index 4 was included.
- \`b = a\` when you needed a copy.
- Overlapping chunks by restarting at \`stop - 1\` without meaning to.
- Reversing a log with \`[::-1]\` and sending that to the model.

\`\`\`tryit python
word = "hello"
print("index 0:", word[0])
print("index -1:", word[-1])
print("slice 1:4:", word[1:4])
print("copy of word:", word[:])

nums = ["a", "b", "c", "d", "e"]
print("list slice 1:4:", nums[1:4])
print("every second:", nums[0:5:2])
print("last three:", nums[-3:])
print("past the end:", nums[9:12])

original = [1, 2, 3]
same = original
copy = original[:]
same.append(99)
print("original changed:", original)
print("copy unchanged:", copy)

text = "abcdefgh"
print("good chunks:", text[0:4], text[4:8])
print("too short:", text[0:3], text[3:6], text[6:9])
\`\`\`

Change the chunk size in your head from 4 to 2 and predict \`text[0:2], text[2:4], text[4:6], text[6:8]\`. Then print those slices. Prediction is how off-by-one dies.

## How agents use this

Agents slice the last few messages so the prompt stays short: \`transcript[-10:]\`. They also slice long documents into chunks. If the stop index is wrong, a chunk loses a letter or skips one. That is an off-by-one bug. The same slice rules work on strings and on lists.

A window that is too long wastes tokens and buries the newest observation. A window that is too short forgets the user goal. Pick a number, slice, print \`len(window)\`. When cost spikes, shorten the slice before you blame the model.

Copy before you isolate: if you pass a slice of a log into a helper that \`append\`s, a slice of a list is already a new list, so appends stay in the helper. A slice of a string is a new string anyway. Indexing a single dict out of a list of dicts does **not** copy the dict. Nested data comes in two lessons. For now: slices of lists copy the outer row of labels.

\`\`\`quiz
What does "abcd"[1:3] give you?
- "abc"
- *"bc"
- "bcd"
- "abcd"
explain: The stop index is not included. Indexes 1 and 2 are the letters b and c.
\`\`\`
`,
  },
  {
    slug: "tuples-sets",
    title: "Tuples and Sets",
    summary:
      "A tuple is a pair you should not change. A set holds unique names, like allowed tools. Empty set is set(), not {}.",
    minutes: 17,
    level: "beginner",
    md: `
A **tuple** is a row that **cannot change** after you make it. You write it with parentheses: \`(tool, args)\`. Use a tuple for a pair you should not edit: a parsed tool name plus its arguments, a \`(ok, body)\` result, a point that should stay still.

A **set** is a bag of **unique** names. Unique means each name appears once. A set has no order. Use a set for an **allowlist**: the tools the agent is allowed to run. Membership tests (\`name in allowed\`) are the point.

\`\`\`viz strip
title Unique names, no extras
chip search
chip read
chip write
caption A set drops duplicates. Use it as an allowlist. Keep the step log as a list so order stays.
\`\`\`

Lists stay for logs. Tuples stay for fixed pairs. Sets stay for uniqueness and membership. If you mix those jobs, you will lose order or gain accidental duplicates.

## Tuples: a pair you do not edit

You can read a tuple by index, like a list. You cannot \`append\`. You cannot replace an item. \`pair[0] = "read"\` raises \`TypeError\`. That is the point.

**Unpack** means split the pair into two names:

\`\`\`python
pair = ("search", "weather nyc")
tool, args = pair
print(tool)
print(args)
print(pair[0])
\`\`\`

The number of names must match. \`a, b = (1, 2, 3)\` raises \`ValueError\`. \`a, b, c = (1, 2)\` also fails. Unpack only when you know the length.

A function that gives back two values is really giving back a tuple. \`return ok, hits\` is \`return (ok, hits)\`. The caller writes \`ok, hits = call_search(q)\`.

A one-item tuple needs a comma: \`(3,)\` is a tuple. \`(3)\` is just the number 3 with parentheses. That surprise bites people who write \`(name)\` and think they made a tuple.

You cannot change the tuple's slots. If a slot holds a list, that inner list can still change. For tool names and argument text, this does not come up. Do not put a mutable log inside a “frozen” tuple and expect the log to freeze.

## Sets: unique names

Write a set with curly braces: \`{"search", "read"}\`. An empty set is \`set()\`, not \`{}\`. \`{}\` is an empty **dict** (the next lesson). \`type({})\` is dict. \`type(set())\` is set. Print both once so the trap sticks.

Duplicates disappear. \`{"search", "search"}\` is just \`{"search"}\`. \`set(["search", "read", "search"])\` is two names.

\`"search" in allowed\` asks if that name is allowed. That is the allowlist check.

| Code | Meaning |
|---|---|
| \`set()\` | Empty set |
| \`{"search", "read"}\` | Two allowed names |
| \`name in allowed\` | Is this name allowed? |
| \`set(raw)\` | Unique names from a list |
| \`left - right\` | In the left set, not the right |
| \`left & right\` | In both sets |
| \`left | right\` | In either set |
| \`allowed.add("write")\` | Add a name (changes the set) |

Sets have no order. Do not use \`allowed[0]\`. That is a \`TypeError\`. Print with \`sorted(allowed)\` if you want a stable order. \`sorted\` returns a list. The set is unchanged.

Do **not** use a set as the step log. You would lose order and repeated steps. Both matter in a log. Keep the log as a list. Use a set at the gate: "is this tool allowed?"

\`\`\`python
allowed = {"search", "read"}
print("write" in allowed)  # False
raw = ["search", "read", "search"]
print(sorted(set(raw)))    # ['read', 'search']
print(sorted(set(raw) - allowed))  # extra names not allowed
\`\`\`

\`add\` changes the set in place, like \`append\` on a list. \`allowed.add("write")\` returns \`None\`. Use the set after you add. Frozen sets exist (\`frozenset\`) when you need a set that cannot change. You do not need them to write an allowlist constant. A normal set assigned once at the top is enough for this track.

A tuple can be a dict key because it does not change. A list cannot. You will rarely need that in an agent, but it explains why a parsed \`(name, q)\` pair is a tuple if you want to count unique calls with a Counter. Convert with \`tuple(row)\` only when the row itself should not grow.

When you load tool names from a config list, duplicates happen. \`allowed = set(raw_names)\` is the cleanup. Then \`name in allowed\` is the gate. Print \`sorted(allowed)\` at startup so a human can audit the gate. Do not print a set directly if you need a stable test; order is not promised.

A tuple of one tool name is \`(name,)\` with a comma. Without the comma you have just the name. If unpacking fails with “not enough values,” you probably forgot the comma or you unpacked a string into two names: \`"ab"\` unpacks to \`'a', 'b'\` because a string is a row of characters. Tool names should stay strings. Unpack tuples you built, not random text.

## Common mistakes

- Writing \`{}\` for an empty set.
- Indexing a set.
- Using a set as a transcript.
- Unpacking the wrong number of values.
- Forgetting the comma in a one-item tuple.
- Comparing two sets with \`==\` when you meant “same names” — that part is actually fine; \`==\` on sets ignores order. Do not compare a set to a list with \`==\` and expect True.

\`\`\`tryit python
pair = ("search", "weather nyc")
tool, args = pair
print("tool:", tool)
print("args:", args)
print("pair unchanged:", pair)

raw = ["search", "read", "search", "write", "read"]
unique = set(raw)
print("unique names:", sorted(unique))

allowed = {"search", "read"}
print("write allowed?", "write" in allowed)
print("search allowed?", "search" in allowed)
print("blocked:", sorted(set(raw) - allowed))

print("empty set type:", type(set()))
print("empty {} type:", type({}))
\`\`\`

Add \`"write"\` to \`allowed\` in the editor and run again. \`blocked\` should shrink. That is the allowlist working.

## How agents use this

A tool call can be a pair \`(name, args)\` you should not edit after you parse it. Unpack it, look up the function, call it. If you later mutate \`args\` while retrying, you no longer know what the model asked for. Keep the original pair. Build a new args dict if you must fill defaults.

A set of allowed names is a safety gate. If the model asks for a tool that is not in the set, you reject it. You do not run it. You append an observation like “unknown tool.” Keep the step log as a list. Use the set only to check names.

When you load a config list of tools that might contain duplicates, \`sorted(set(names))\` is a clean print and a unique gate. When you compute “tools the model used that we never allowed,” that is a set difference. Those two lines are half of a simple policy.

\`\`\`quiz
How do you write an empty set?
- {}
- *set()
- []
- ()
explain: {} is an empty dict. set() is an empty set. [] is a list. () is an empty tuple.
\`\`\`
`,
  },
  {
    slug: "dicts",
    title: "Dictionaries",
    summary:
      "A dict maps a key to a value. Learn [], .get, in, items, nested args, and why this is how JSON and tool calls look.",
    minutes: 20,
    level: "beginner",
    md: `
A **dict** (dictionary) maps a **key** to a **value**. A key is the name you look up. A value is the data stored under that name. Keys are usually strings. Values can be anything: numbers, text, lists, other dicts, \`None\`.

This is how tool calls look: \`{"name": "search", "args": {"q": "..."}}\`.

\`\`\`viz flow
title A key points at a value
layout lr
node key name
node val search
edge key val
caption Look up the key. You get the value. Tool calls are dicts: name, args, result.
\`\`\`

**JSON** is a text format for objects. Models send JSON. In Python, that object becomes a dict. If lists are memory, dicts are **records** with named fields. Named fields beat guessing that index 2 is the query.

Keys in one dict are unique. Writing \`d["name"] = "read"\` when \`name\` already exists replaces the value. It does not add a second \`name\` key.

## Keys and values

Look up with square brackets. Assign to add or replace a field.

\`\`\`python
action = {"type": "tool", "name": "search"}
print(action["name"])
action["name"] = "read"
action["ok"] = True
print(action)
\`\`\`

\`action["thought"]\` **crashes** if \`thought\` is missing. That error is called \`KeyError\`: the key is not in the dict. When a missing key is normal, use \`.get\`. When a key **must** exist, square brackets are fine. A crash then means your parser failed, which is information.

Keys can be strings, numbers, or tuples of immutable values. Beginners should use strings. \`0\` as a key is legal and confusing. \`"0"\` is a different key from \`0\`.

## .get, in, keys, values, items

\`in\` on a dict checks **keys**, not values. \`"name" in action\` is True. \`"search" in action\` is False unless you have a key called \`"search"\`. To ask “is this value present?”, walk \`.values()\` or keep a list. Do not write \`"search" in action\` expecting to find the tool name in the values.

| Code | What you get |
|---|---|
| \`d[k]\` | The value, or a crash if \`k\` is missing |
| \`d.get(k)\` | The value, or \`None\` |
| \`d.get(k, default)\` | The value, or your default |
| \`k in d\` | True if that **key** exists |
| \`d.keys()\` | The keys |
| \`d.values()\` | The values |
| \`d.items()\` | Each \`(key, value)\` pair |
| \`d.pop(k)\` | Remove a key and return its value |

Walk both names and values with \`.items()\`:

\`\`\`python
for key, value in action.items():
    print(key, value)
\`\`\`

\`list(d.keys())\` is a list of key names, useful to print. Direct \`print(d.keys())\` shows a dict_keys view. Wrap with \`list\` when you want a normal list.

\`.get("thought", "")\` is a good default for optional text. Then a missing thought is \`""\`, not \`None\`. Empty text is easier to print and to join. Use \`.get("count", 0)\` for optional numbers. Use \`.get("args", {})\` for an optional inner dict. Match the default to the type you want next.

## Nesting and JSON-shaped data

**Nesting** means a value is another dict (or a list). JSON is nested dicts and lists. Walk one level at a time. Print the middle value if you get lost.

\`d.get(k, default)\` is the safe lookup. A useful default for a missing inner dict is \`{}\`:

\`\`\`python
q = action.get("args", {}).get("q")
print(q)
\`\`\`

If \`args\` is missing, the first \`.get\` gives \`{}\`. The second \`.get\` gives \`None\` instead of crashing. If \`args\` is present but \`q\` is missing, you also get \`None\`. If you need a string, pass a second default on the inner get: \`.get("q", "")\`.

Updating nested data changes the inner object:

\`\`\`python
action["args"]["k"] = 5
\`\`\`

That requires \`args\` to exist and to be a dict. If you are not sure, set a whole inner dict: \`action["args"] = {"q": "python lists", "k": 5}\`.

To drop a field, \`d.pop("thought", None)\` removes the key if it exists and does not crash if it does not. Use that when you compact a row before sending it back to a model: huge HTML in \`result\` can cost tokens. Keep \`ok\` and a short \`result\`. The original dict can stay in your log file.

Copying a dict with \`dict(d)\` or \`{**d}\` is shallow. The inner \`args\` dict is still shared. If you compact by mutating \`args\`, you also change the transcript’s copy. Build a new inner dict when you isolate: \`{"name": d["name"], "args": dict(d.get("args", {}))}\`. Named fields make that copy obvious. Index-based records do not.

Walk keys you expect, not every key a model invented. Extra keys are allowed in JSON. Your code should \`.get\` the ones you need and ignore the rest, unless you are writing a strict schema check. Strict is good at the tool edge. Loose is fine inside a trace viewer.

## Common mistakes

- \`d["thought"]\` when the key is optional — \`KeyError\`.
- \`"search" in action\` when you meant the value, not the key.
- Defaulting a missing dict to \`None\` then calling \`.get\` on \`None\`.
- Using a list as a record (\`[name, args]\`) instead of a dict when fields have names.
- Mutating a nested dict that is shared with another record (copy lesson later).
- Forgetting that \`0\` and \`"0"\` are different keys.

\`\`\`tryit python
action = {
    "type": "tool",
    "name": "search",
    "args": {"q": "python lists", "k": 3},
}
print("name:", action["name"])
print("thought or default:", action.get("thought", ""))
print("nested q:", action["args"]["q"])

action["args"]["k"] = 5
print("updated k:", action["args"]["k"])

print("name in action?", "name" in action)
print("thought in action?", "thought" in action)

print("keys:", list(action.keys()))
print("values:", list(action.values()))
for key, value in action.items():
    print("item:", key, value)

missing = action.get("meta", {}).get("source")
print("missing nested:", missing)
\`\`\`

Print \`action.get("args", {}).get("q")\` after deleting the idea of \`args\` from your head: add a second dict with no \`args\` key and use the same get chain. You should see \`None\`, not a crash.

## How agents use this

The model sends an object: tool name, args, result. You store that as a dict. Read \`name\`, then pass \`args\` into a function. Use \`.get\` so a missing key does not crash the loop. The observation you append is another dict. Learn to read a dict like a form with named fields.

A stable shape helps tests: always \`{"ok": True, "result": ...}\` or \`{"ok": False, "error": ...}\`. Do not return a string on success and a dict on failure. Then every caller needs two readers.

Trace rows are dicts: \`{"role": "user", "content": "..."}\`. Tool calls are dicts. HTTP JSON is dicts. Once you can \`.get\` and nest, you can walk almost every payload an agent sees. The next lesson is only “more of this,” not a new idea.

\`\`\`quiz
What does action.get("thought", "") give you if thought is missing?
- A KeyError crash
- None
- *an empty string
- False
explain: get(key, default) gives the default when the key is missing. Here the default is "".
\`\`\`
`,
  },
  {
    slug: "nested-data",
    title: "Nested Data (Traces)",
    summary:
      "Walk traces as dicts of lists of dicts. Change one field. Chain .get so missing keys do not crash an agent loop.",
    minutes: 21,
    level: "beginner",
    md: `
**Nested** means data inside other data. A **trace** (also called a **transcript**) is a log of what the agent did. In code it is often a dict that holds a list of step dicts. Tool results look the same: a dict, with lists, with dicts inside.

You walk one level at a time. You name each level: trace, steps, step, result, hits. Nested data looks scary until those names exist. Then it is just “open the form, open the row, read the field.” A missing branch is normal. A wrong type at a branch is also normal. Never assume every step has the same keys.

\`\`\`viz flow
title A trace is boxes inside boxes
layout tb
node goal goal
node steps steps
node step one step
edge goal steps
edge steps step
caption Open the outer dict, then the list, then one step. Walk one level at a time.
\`\`\`

## A fake agent trace

Read this like a form. The outer dict has a goal and a list of steps. Each step is a dict with a \`role\` (who spoke) and more fields.

\`\`\`python
trace = {
    "goal": "book a flight",
    "steps": [
        {"role": "user", "content": "book a flight to nyc"},
        {"role": "assistant", "tool": "search", "args": {"q": "flights nyc"}},
        {"role": "tool", "name": "search", "result": {"ok": True, "hits": 2}},
    ],
}
print(trace["goal"])
print(trace["steps"][0]["role"])
print(trace["steps"][1]["args"]["q"])
\`\`\`

| You want | Path |
|---|---|
| The goal | \`trace["goal"]\` |
| How many steps | \`len(trace["steps"])\` |
| First step | \`trace["steps"][0]\` |
| The tool name | \`trace["steps"][1]["tool"]\` |
| The search query | \`trace["steps"][1]["args"]["q"]\` |
| Whether the tool worked | \`trace["steps"][2]["result"]["ok"]\` |

Square brackets crash if a key or index is missing. That is useful when the field **must** exist. It is painful when a field is optional. Real traces are messy: some steps have \`tool\`, some have \`content\`, some have \`error\`. Optional fields need \`.get\`.

Print a middle level when you get lost:

\`\`\`python
print(trace["steps"][1])
print(trace["steps"][1]["args"])
\`\`\`

Do not try to see the whole tree in your head. Print the node you are standing on.

## Required vs optional fields

Not every key is the same kind of promise. Treat required keys as crashes you want. Treat optional keys as \`.get\`.

| Field | Typical home | Missing means | Read it with |
|---|---|---|---|
| \`goal\` | outer trace | the run has no job | \`trace["goal"]\` if you always set it |
| \`steps\` | outer trace | empty run or a bad save | \`trace.get("steps", [])\` |
| \`args\` | assistant tool call | the model omitted inputs | \`step.get("args", {})\` |
| \`meta\` | outer trace | no extra debug bag | \`trace.get("meta", {})\` |

Square brackets on missing \`meta\` kill the loop for a debug field. If *your* code always built \`steps\`, square brackets on \`steps\` are fine: a crash means you forgot the list.

## Walkthrough: a tool result with hits

Tool results nest again. \`result\` is a dict. Inside it, \`hits\` is often a list. Each hit may be a dict with a title, or it may be a plain string. You do not know until you print a hit.

\`\`\`python
result = {"ok": True, "hits": [{"title": "Flight A"}, {"title": "Flight B"}]}
hits = result.get("hits", [])
print("how many hits:", len(hits))
if hits:
    first = hits[0]
    if isinstance(first, dict):
        print("first title:", first.get("title", ""))
    else:
        print("first hit text:", first)
\`\`\`

Walk it in four names: \`result\`, \`hits\`, \`first\`, \`title\`. If you write \`result["hits"][0]["title"]\` in one shot, three failures look the same: missing \`hits\`, empty list, or a string hit. Named steps make the error obvious. Some tools return \`{"ok": True, "text": "..."}\` with no \`hits\`. Use \`.get("hits", [])\` and treat a missing list as “no rows.”

## Change one field

You do not rebuild the whole log. You change one value. Other steps stay the same.

\`\`\`python
trace["steps"][2]["result"]["ok"] = False
\`\`\`

The list still has three steps. The user message did not change. Only \`ok\` flipped. That is how you mark a tool error in a trace. You can also append a new step: \`trace["steps"].append({"role": "tool", "name": "search", "result": {"ok": False}})\`. Append is the usual way to grow a log. Editing an old \`ok\` is for corrections and tests.

If two names point at the same inner dict, editing through one name shows up through the other. That is the shared-object rule. Copy when you must isolate. For a single trace you own, in-place edits are normal.

When you compact a row for the next prompt, build a small new dict. Do not delete keys from the only copy you saved. Huge HTML in \`result\` blows the token budget; the full row is what you debug.

## A safe .get chain

A **safe .get chain** means call \`.get\` at each level. Give a safe default when the next level might be missing. For a missing dict, the default is \`{}\`. For missing text, the default is \`""\`. For a missing list, the default is \`[]\`.

\`\`\`python
source = trace.get("meta", {}).get("source", "missing")
steps = trace.get("steps", [])
first = {}
if steps:
    first = steps[0]
content = first.get("content", "")
print(source)
print(content)
\`\`\`

If \`meta\` is missing, you get \`"missing"\` — not a crash. If \`steps\` is missing, you get \`[]\`. Then you check before you take \`[0]\`. Never write \`trace.get("steps", [])[0]\` unless you already know the list is not empty. An empty list plus \`[0]\` is \`IndexError\`.

A long chain of \`["a"]["b"]["c"]["d"]\` is brittle. Three \`.get\`s plus a named middle variable is readable. If you need four levels, you probably want a small helper function later.

Walk the list of steps with a loop when you need every row, not one path:

\`\`\`python
for i, step in enumerate(trace.get("steps", []), start=1):
    role = step.get("role", "?")
    print(i, role, step.get("tool") or step.get("name") or "")
\`\`\`

That print is a table of the trace. When a nested lookup fails, this loop still shows how far you got. If \`role\` is missing, you see \`?\` instead of a crash. Helpers should take a step dict, not the whole trace, when they only need one row.

## What goes wrong

Three errors show up constantly on nested traces. Learn the name, then you can fix the path.

| Error | Typical cause | Fix |
|---|---|---|
| \`KeyError\` | square brackets on a missing key | \`.get\`, or set the key when you build the row |
| \`IndexError\` | \`[0]\` or \`[-1]\` on an empty list | \`if steps:\` before indexing |
| \`TypeError\` | you called \`.get\` on a string, list, or \`None\` | check \`isinstance(node, dict)\` before \`.get\` |

The TypeError is the sneaky one. A tool that failed may store \`result\` as the string \`"timeout"\` instead of \`{"ok": False}\`. Then \`result.get("ok")\` dies because strings have no \`.get\`. Guard:

\`\`\`python
result = step.get("result")
ok = False
if isinstance(result, dict):
    ok = bool(result.get("ok"))
\`\`\`

\`in\` on the outer dict does not search nested values. \`"flights nyc" in trace\` is False. If \`args\` is a list, \`args.get("q")\` is TypeError. At the tool edge, require a dict. In a viewer, skip the wrong type and keep printing.

## Common mistakes

- \`trace["meta"]["source"]\` when \`meta\` is optional.
- Taking \`[0]\` without checking the list.
- Assuming every step has the same keys.
- Rebuilding the whole trace to flip one \`ok\`.
- Using \`in\` on the outer dict to search for a nested value. \`in\` does not walk inside.
- Calling \`.get\` on a value that is not a dict.
- Mutating a compacted inner dict that is still shared with the saved log.

\`\`\`tryit python
trace = {
    "goal": "book a flight",
    "steps": [
        {"role": "user", "content": "book a flight to nyc"},
        {
            "role": "assistant",
            "tool": "search",
            "args": {"q": "flights nyc"},
        },
        {
            "role": "tool",
            "name": "search",
            "result": {"ok": True, "hits": ["flight A", "flight B"]},
        },
    ],
}

print("goal:", trace["goal"])
print("how many steps:", len(trace["steps"]))
print("first role:", trace["steps"][0]["role"])
print("tool name:", trace["steps"][1]["tool"])
print("query:", trace["steps"][1]["args"]["q"])

# Change one field. The rest of the trace stays.
trace["steps"][2]["result"]["ok"] = False
print("updated ok:", trace["steps"][2]["result"]["ok"])
print("hits still there:", trace["steps"][2]["result"]["hits"])

# Safe .get chain: missing keys do not crash
print("no meta:", trace.get("meta", {}).get("source", "missing"))

steps = trace.get("steps", [])
first = {}
if steps:
    first = steps[0]
print("first content:", first.get("content", ""))
print("no thought:", first.get("thought", ""))

print("last step:", steps[-1] if steps else {})
for i, step in enumerate(steps, start=1):
    print(i, step.get("role", "?"), step.get("tool") or step.get("name") or "")

result = steps[2].get("result") if len(steps) > 2 else None
if isinstance(result, dict):
    print("result ok field:", result.get("ok"))
else:
    print("result was not a dict:", result)
\`\`\`

Flip \`ok\` back to \`True\` in the editor and print \`hits\` again. One field changed. The list of hits did not need to be rebuilt. The loop at the end is the debug table you will copy into real traces.

## How agents use this

A real trace is a dict of lists of dicts. Tool results nest again: \`result\`, then \`hits\`, then one hit. You walk one level at a time. You change one field, like \`ok\`, without rebuilding the log. Safe \`.get\` chains keep a missing key from stopping the agent. This is how traces and tool results look.

When you debug, print \`len(trace["steps"])\` and the last step: \`trace["steps"][-1]\`. The last observation is usually the reason the next thought is wrong. You do not need a fancy viewer. You need a path and a print.

Parsers should produce this shape on purpose. If one tool returns a string and another returns a nested dict, the loop cannot treat observations the same. Normalize at the tool edge: always a dict with \`ok\`, then either \`result\` or \`error\`.

Prompt builders walk the same tree: take \`steps[-8:]\`, drop huge \`result\` bodies, keep \`role\` and a short \`content\` or \`error\`. Build a *new* list of small dicts. Do not delete keys from the only copy on disk.

When a nested lookup fails, log the path you tried and \`type(result).__name__\`. “Expected dict, got str” is a one-line diagnosis. Rebuilding the agent will not fix a tool that returned a string.

\`\`\`quiz
How do you read a nested field without crashing if a key is missing?
- trace["meta"]["source"]
- *trace.get("meta", {}).get("source")
- trace.source
- get(trace, "meta.source")
explain: .get at each level returns the default when a key is missing. Square brackets crash with KeyError.
\`\`\`
`,
  },
  {
    slug: "conditionals",
    title: "If, Elif, and Else",
    summary:
      "Branch with if, elif, and else. Return early. Guard unknown tools, empty text, and errors before the happy path.",
    minutes: 20,
    level: "beginner",
    md: `
An **if** runs a block of code only when a test is true. **elif** means "else if": try this test if the ones above were false. **else** runs if none of the tests were true.

Python uses spaces at the start of a line to show which lines belong to the \`if\`. Use four spaces. End the \`if\` line with a colon. Forget the colon, and you get a \`SyntaxError\`. Forget the indent, and you get an \`IndentationError\`.

Agents use these tests as **rules**: unknown tool? reject. Empty query? ask again. Error? retry. Budget gone? stop. The model can suggest. Your \`if\`s decide whether the suggestion is legal.

## if, elif, else

Only one branch runs. Python checks from the top. The first true test wins. Later tests are skipped even if they would also be true.

\`\`\`viz flow
title The first true test wins
layout lr
node if if error
node yes retry
node no think
edge if yes
edge if no
caption If the guard is true, take that path. Else is the leftover path. Order is the policy.
\`\`\`

\`\`\`python
obs = {"error": None, "done": False}
if obs.get("error"):
    action = "retry"
elif obs.get("done"):
    action = "stop"
else:
    action = "think"
print(action)
\`\`\`

You can chain many \`elif\` lines. \`else\` is optional. If you omit \`else\` and no test is true, nothing in those branches runs. That can be a bug if you assumed one path always ran.

A test can be any value. Empty values count as false: \`""\`, \`[]\`, \`0\`, \`None\`. Prefer a clear check when that might surprise you. \`if obs.get("error"):\` is fine when error is \`None\` or a non-empty string. It is a lie if error could be \`0\`. Use \`if obs.get("error") is not None:\` when you need that exact idea.

Nested \`if\` inside \`if\` works. It gets hard to read fast. Prefer **early return** in a function instead of nesting four levels.

## Truthiness you will actually hit

| Value | Counts as | Agent meaning |
|---|---|---|
| \`None\` | false | missing field, no error object |
| \`""\` | false | empty text |
| \`"   "\` | true until you \`strip\` | model sent only spaces |
| \`[]\` | false | no hits |
| \`0\` | false | a count of zero — often valid |
| \`False\` | false | explicit no |
| \`{"ok": False}\` | true | a non-empty dict is true even if \`ok\` is False |

That last row bites. \`if result:\` is true for \`{"ok": False, "error": "timeout"}\`. You wanted \`if result.get("ok"):\`. Truth of the container is not truth of a field inside it.

\`\`\`python
result = {"ok": False, "error": "timeout"}
if result:
    print("this still runs — the dict is not empty")
if result.get("ok"):
    print("this does not run")
\`\`\`

## Early return

**Early return** means leave a function as soon as you know the answer. The rest of the function does not run.

A **guard** is a check that stops bad input. Put guards first. The happy path stays flat and easy to read.

\`\`\`python
def next_action(obs):
    if obs.get("error"):
        return "retry"
    if obs.get("done"):
        return "stop"
    return "think"
\`\`\`

That is easier to extend than a tall pile of nested \`if\`s. Add a new guard as a new block at the top. Do not wrap the whole function in another indent.

\`return\` exits the function, not only the \`if\`. Lines after the \`if\` / \`return\` still belong to the function, and they run when the test was false. That is the flat style. Use \`elif\` when cases exclude each other and share one result name. Use stacked early returns when each guard is a different reason to leave. Agent policy is usually the second: unknown tool, empty query, over budget, then run.

## Guard unknown tools and empty strings

An **unknown tool** is a name that is not in the allowlist. Reject it. Do not run it. Do not try to guess a close name unless you have a dedicated, tested mapper. Guessing \`read\` from \`reed\` is how you run the wrong tool.

An **empty string** is \`""\`. In an \`if text:\` test, empty text is false. A model may also send only spaces. \`strip()\` removes spaces. Then \`"   "\` becomes \`""\` and you can treat it as empty.

| Pattern | Use it when |
|---|---|
| \`if / elif / else\` | One of several cases |
| Early \`return\` | You already know the answer |
| \`if name not in allowed\` | Unknown tool |
| \`if not text.strip()\` | Empty or blank text |
| \`if error is not None\` | An error message is present |
| \`if used >= max_steps\` | Budget is gone |

\`if not text.strip():\` is a common guard. If \`text\` might not be a string, check \`isinstance(text, str)\` first, or the \`strip\` call crashes. That check belongs at the trust edge, where model JSON arrives.

Write failure cases first: unknown tool, empty query, error. What is left is the normal path. \`if\` tests can use \`and\` / \`or\`. Split them if the return value should differ: unknown tool vs empty query. The model (and your tests) need distinct error strings.

\`and\` / \`or\` **short-circuit**. \`if name and name not in allowed:\` does not evaluate the \`in\` test when \`name\` is missing. That saves a TypeError if \`name\` is \`None\` and you later call a method on it. Put the cheap, failing-closed check first.

A missing colon after \`if\` is a \`SyntaxError\`. An extra colon on the next line is also a syntax error. Copy the shape from a working function until your fingers know it: test, colon, newline, four spaces, body.

## Walkthrough: overlapping tests

Order is policy. Pass both \`error\` and \`done\` in one dict. The first true guard wins.

\`\`\`python
def next_action(obs):
    if obs.get("error"):
        return "retry"
    if obs.get("done"):
        return "stop"
    return "think"

print(next_action({"error": "timeout", "done": True}))  # retry
\`\`\`

If you swap those two \`if\`s, a failed-but-finished run would \`stop\` and never retry. There is no universal right order. There is only the order you chose and the tests that lock it.

\`=\` inside a test is a \`SyntaxError\` (or, in rare old patterns, an assignment that is not a comparison). You want \`==\` for equality. \`if name = "search":\` does not run the search. It fails to parse.

## What goes wrong

- Missing colon after \`if\`.
- Mixing tabs and spaces.
- Using \`=\` inside the test instead of \`==\`.
- \`if result\` when \`0\` is valid, or when \`result\` is a dict with \`ok: False\`.
- Putting the wide case first so specific cases never run (more in match/case).
- Forgetting that \`elif\` only runs if earlier tests were false.
- Combining two failures into one \`if\` so tests cannot tell them apart.
- Calling \`.strip()\` on \`None\` because the JSON field was missing.

A budget guard belongs in the loop, not only in the model prompt. \`if used >= max_steps: return "stop"\` is a hard stop. The model does not get a vote. If you only *ask* the model to stop, it may keep calling tools.

\`\`\`tryit python
def next_action(obs):
    if obs.get("error"):
        return "retry"
    if obs.get("done"):
        return "stop"
    if obs.get("needs_tool"):
        return "call_tool"
    return "think"

print("tool:", next_action({"needs_tool": True}))
print("error:", next_action({"error": "timeout"}))
print("done:", next_action({"done": True}))
print("idle:", next_action({}))
print("error wins:", next_action({"error": "timeout", "done": True}))

ALLOWED = {"search", "read"}

def gated(name):
    if name not in ALLOWED:
        return "reject"
    return "run"

print("search:", gated("search"))
print("shell:", gated("shell"))

def handle_query(text):
    if not text:
        return "empty"
    if not text.strip():
        return "empty"
    return "ok"

print("blank quotes:", handle_query(""))
print("only spaces:", handle_query("   "))
print("real text:", handle_query("weather"))

result = {"ok": False, "error": "timeout"}
print("dict is truthy?", bool(result))
print("ok field?", bool(result.get("ok")))
\`\`\`

Pass both \`error\` and \`done\` in one dict. Which return wins? The first guard. Order is policy. The last two prints show why \`if result:\` is the wrong test for a result dict.

## How agents use this

Before a model runs, \`if\` statements are the rules. Unknown tool? Reject. Empty query? Ask again. Error? Retry. Budget gone? Stop. Early return keeps each rule in one short block. Replacing the policy with a model does not remove these guards.

A production loop still has a hard \`if step >= max_steps: return\`. The model does not get a vote on the budget. A production tool runner still has \`if name not in TOOLS: return error\`. The model does not get a vote on \`os.system\`.

When you read an agent and cannot find these guards, they are missing, not implied. Write them as functions with names: \`gated\`, \`handle_query\`, \`next_action\`. Tests can call those functions with tiny dicts. That is cheaper than waiting for a live model to hit the bad path.

Keep the error strings distinct. \`"unknown tool"\` vs \`"empty query"\` vs \`"budget"\` is how you score a test suite. One \`"bad"\` return hides which rule fired.

Guards also belong after tools return. \`if not obs.get("ok"):\` decides retry vs give up. The model can *suggest* “search again.” Your \`if used < 3\` decides whether that suggestion is legal.

\`\`\`quiz
What does handle_query("") return if empty text is treated as false?
- ok
- *empty
- a crash
- None
explain: An empty string is false in an if test. The guard returns "empty" and the rest of the function does not run.
\`\`\`
`,
  },
  {
    slug: "match-case",
    title: "Match and Case",
    summary:
      "match picks the first shape that fits. Route a tool dict with case. Keep if for simple yes/no tests.",
    minutes: 20,
    level: "beginner",
    md: `
\`match\` looks at one value and runs the first \`case\` that **fits**. Fit means the shape matches: the keys you named are there, and the extra names fill in.

This is Python 3.10+. Joeven runs a newer Python, so it works here. Older books will not show it. You can do everything in this lesson with \`if\` and \`.get\`. \`match\` is a clearer way when the value is a dict with a few known shapes.

Use \`match\` when you branch on the **shape** of a dict (a tool call). Use \`if\` when you have a simple yes/no test: empty text, under budget, \`error is None\`.

\`match\` does not replace your allowlist. A case that binds any \`name\` still has to be checked against allowed tools, or you put only known names in the specific cases and let \`_\` reject the rest. Routing is not the same as permission. Both are required.

## match looks at a value

Write \`match value:\` then one or more \`case\` lines. Only the first fit runs. The rest are skipped.

\`\`\`viz flow
title First shape that fits
layout tb
node act action
node search search
node finish finish
node other unknown
edge act search
edge act finish
edge act other
caption Specific cases first. A leftover case last. If you put the wide case first, search never runs.
\`\`\`

\`_\` means “anything else.” Put it last. If you put it first, every value matches \`_\` and the rest of the cases never run.

\`\`\`python
status = 429
match status:
    case 200:
        print("ok")
    case 400:
        print("bad request")
    case 429:
        print("slow down")
    case _:
        print("other")
\`\`\`

For a single number, \`if / elif\` is also fine. \`match\` shines when the value is a dict. Status codes still make a nice small example of first-fit.

The \`case\` body is indented. You can have several lines. You can \`return\` from a function inside a case.

Several numbers in one case use \`|\`: \`case 401 | 403:\`. That is “unauthorized or forbidden.” Do not pile policy into one case if the observation should differ. \`401\` and \`429\` are different stories for an agent: one is credentials, one is slow down.

## Route a tool dict

A model action is often \`{"tool": "...", "args": {...}}\`. Each \`case\` can name the keys and bind the pieces.

\`\`\`python
def handle(action):
    match action:
        case {"tool": "search", "args": {"q": q}}:
            return "search " + q
        case {"tool": "finish", "args": {"text": text}}:
            return "done: " + text
        case {"tool": name, "args": args}:
            return "unknown " + str(name)
        case _:
            return "bad action"
\`\`\`

Read the first case as: “if this is a dict with tool equal to search, and args is a dict with q, call that text \`q\`.” \`q\` is a new name filled from the dict. You do not write \`action["args"]["q"]\` inside that case. The match already pulled it out.

| Case | What it fits |
|---|---|
| \`{"tool": "search", "args": {"q": q}}\` | Search with a query string |
| \`{"tool": "finish", "args": {"text": text}}\` | Stop with an answer |
| \`{"tool": name, "args": args}\` | Some other tool name |
| \`_\` | Not a dict, or missing keys |

The third case still needs \`args\` to be there. A dict with only \`{"tool": "search"}\` falls through to \`_\`. Extra keys in the dict are usually allowed; missing required keys are not. If \`q\` is missing, the search case does not fit.

If \`q\` is not a string, the case may still fit. Match is about structure more than about types. Check \`isinstance\` if you need a string.

| Situation | \`if\` / \`.get\` | \`match\` / \`case\` |
|---|---|---|
| Empty text, budget, \`error is None\` | Better | Overkill |
| A dict that is search, finish, or other | Works, gets tall | Clearer shapes |
| Not a dict at all | \`if not isinstance(...)\` | \`case _:\` |
| Need a type check on \`q\` | \`isinstance\` after \`.get\` | Still \`isinstance\` inside the case |

Clear beats clever. A five-line \`if\` that a beginner can trace is better than a clever pattern nobody dares to edit.

## First fit wins

Put the **specific** cases first. Put the **wide** cases later.

If you put \`{"tool": name, "args": args}\` first, it would catch search too, and the search case would never run. That bug looks like “search is always unknown.” The match is working. Your order is wrong.

The same rule exists in \`if / elif\`. \`match\` makes the shapes visible, so the order mistake is a bit easier to see.

## Walkthrough: swap two cases

\`\`\`python
def broken(action):
    match action:
        case {"tool": name, "args": args}:
            return "wide " + str(name)
        case {"tool": "search", "args": {"q": q}}:
            return "search " + q
        case _:
            return "bad"

print(broken({"tool": "search", "args": {"q": "rain"}}))
\`\`\`

That prints \`wide search\`, not \`search rain\`. The wide case already fit. The search case is dead code. Python will not warn you. Tests will, if you have one test per case.

Write one test per case, including \`_\`. Include \`{"tool": "search"}\` with no \`args\`. Include a string, a list, and a dict with the wrong keys. Those are the leftover shapes.

## Keep if for simple tests

Do not replace every \`if\` with \`match\`.

- Empty text? \`if not text.strip():\`
- Under budget? \`if step < max_steps:\`
- Missing key? \`if error is None:\`

\`match\` is for “this object looks like A, or B, or something else.”

You can match a tuple too: \`match pair: case ("search", q): ...\`. That is the same first-fit idea. Tool dicts are the usual agent shape, so this lesson spends its pages there. Status numbers are the simple warmup.

If two cases look the same except for the tool string, you may want a registry dict instead of ten cases. \`match\` is for shapes. A dict of functions is for names. Combine them: match to confirm you have \`tool\` and \`args\`, then \`TOOLS[name](**args)\`. The leftover \`_\` still returns \`bad action\` when the object is not a dict.

## What goes wrong

- Putting \`case _:\` first.
- Putting the wide tool case above specific tool names.
- Expecting \`match\` to check types.
- Using \`match\` for a boolean.
- Forgetting that missing nested keys fail the case, which is often what you want.
- Matching the raw model string instead of the parsed dict.
- Treating extra keys as a failure — extra keys usually still fit.

A dict with extra keys like \`"id"\` still matches \`{"tool": "search", "args": {"q": q}}\`. Missing \`q\` does not. That split is the point: required shape vs leftover fields. If you need to *forbid* extra keys, that is a separate schema check, not \`match\`.

Do not \`match\` on raw model text. Parse first with \`json.loads\`. Then match the object. Text matching belongs to strings and regex, with all their substring traps. \`case "search":\` on the whole reply will miss \`"Let me search..."\`.

\`\`\`tryit python
def handle(action):
    match action:
        case {"tool": "search", "args": {"q": q}}:
            return "search " + q
        case {"tool": "finish", "args": {"text": text}}:
            return "done: " + text
        case {"tool": name, "args": args}:
            return "unknown " + str(name)
        case _:
            return "bad action"

print(handle({"tool": "search", "args": {"q": "rain"}}))
print(handle({"tool": "finish", "args": {"text": "Bring a coat."}}))
print(handle({"tool": "shell", "args": {"cmd": "ls"}}))
print(handle({"tool": "search"}))
print(handle("not a dict"))
print(handle({"nope": 1}))
print(handle({"tool": "search", "args": {"q": "rain", "k": 3}}))

status = 429
match status:
    case 200:
        print("status ok")
    case 401 | 403:
        print("status forbidden")
    case 429:
        print("status slow down")
    case _:
        print("status other")
\`\`\`

\`{"tool": "search"}\` has no \`args\`. Predict \`bad action\`, then confirm. That miss is a parser problem, not a search problem. The extra \`k\` on search still fits the search case: extra keys are allowed.

## How agents use this

After you parse JSON, you have a dict. \`match\` routes that dict to the right tool without a tall pile of \`if\`s. Put exact tool names first. Put a catch-all \`_\` last so a weird object becomes an error observation, not a crash. Guards like empty text still belong in \`if\`.

You can \`match\` on a status code after an HTTP-like result, or on a tool dict after \`json.loads\`. Do not \`match\` on raw model text. Parse first. Then match the object.

If your team does not know \`match\`, write \`if action.get("tool") == "search":\`. Same policy. The language feature is optional. The routing idea is not: every agent must map a shape to a function, and must have a leftover case that does not run unknown tools.

A good executor is two layers. Layer one: \`match\` (or \`if\`) confirms you have a dict with \`tool\` and \`args\`. Layer two: \`name in TOOLS\` and \`fn(**args)\`. If you skip layer two, the wide case that binds \`name\` will call anything the model spelled. The leftover \`_\` is for *shape* failures. The allowlist is for *permission* failures. Return two different error strings so tests and traces can tell them apart.

When you add a tool, add a specific case only if that tool needs a unique shape (search needs \`q\`, finish needs \`text\`). Tools that share \`{name, args}\` belong in the registry, not in a growing pile of clones. \`match\` is the bouncer at the door. The dict of functions is the room inside.

\`\`\`quiz
What does case _ mean in a match?
- It matches only empty dicts
- *It matches anything that did not fit a case above
- It is a syntax error in Python 3.12
- It runs every case
explain: _ is the leftover case. Put it last. Specific shapes must sit above it.
\`\`\`
`,
  },
  {
    slug: "loops",
    title: "Loops and Budgets",
    summary:
      "for and while repeat work. enumerate, zip, break, continue, any/all, and a hard step budget so the loop cannot run forever.",
    minutes: 20,
    level: "beginner",
    md: `
A **loop** does the same kind of work more than once. **for** walks every item in a list. **while** keeps going until a test is false.

A **budget** is a max number of steps. An agent **is** a loop: while the goal is not done and the budget remains, think, act, observe. Always count steps. Never write a loop with no stop. A model that never says “finish” must still hit \`max_steps\`.

\`\`\`viz loop
title A loop with a budget
step Observe
step Think
step Act
step Budget
caption While the goal is not done and steps remain, repeat. Budget is a hard stop.
\`\`\`

If a live box hangs, you probably wrote \`while True\` without \`break\`, or you forgot to add to the counter. The site will eventually stop it. On a paid API, that hang is money.

## for, range, enumerate, zip

\`for item in tools:\` sets \`item\` to each value, one at a time. A string, list, tuple, or dict keys can all be walked this way. \`for ch in "act":\` walks characters. \`for key in action:\` walks keys. Prefer \`for key, value in action.items():\` when you need both.

\`range(n)\` is the numbers \`0\` through \`n - 1\`. \`range(1, 4)\` is 1, 2, 3. \`range\` is not a list. Wrap with \`list(range(3))\` if you want to print it as a list. \`for i in range(3):\` is the usual retry loop: three tries, numbered 0, 1, 2. Use \`start=1\` in \`enumerate\` when you want to print “step 1.”

**enumerate** gives you \`(index, item)\` together. **zip** walks two lists side by side and stops at the shorter one. Extra items on the longer list are ignored. If you need to notice a length mismatch, compare \`len\` first.

\`\`\`python
for name in ["search", "read", "answer"]:
    print(name)

for i in range(3):
    print(i)  # 0, 1, 2

for i, name in enumerate(["search", "read"], start=1):
    print(i, name)

for tool, query in zip(["search", "read"], ["weather", "file.txt"]):
    print(tool, query)
\`\`\`

## while, break, continue, and a budget

\`while test:\` repeats as long as the test is true. You must make the test false later. Forgetting to add to a counter is how you get an **infinite loop** (a loop that never ends).

**break** leaves the loop now. **continue** skips the rest of this round and starts the next one. Neither is evil. \`break\` on “goal done” is the agent’s success exit. \`continue\` on empty text skips a bad observation.

| Code | Typical use |
|---|---|
| \`for msg in messages\` | Walk a log to build a prompt |
| \`for i in range(3)\` | Retry a small number of times |
| \`enumerate(steps, start=1)\` | Print step numbers |
| \`zip(names, args)\` | Pair tool names with arguments |
| \`while used < max_steps\` | The agent loop with a budget |
| \`any(flags)\` / \`all(flags)\` | Did any fail? Did every field arrive? |
| \`sorted(names)\` | Stable order for a print |
| \`break\` | Goal met, or a fatal error |
| \`continue\` | Skip empty text |

Never \`while True\` around a paid model call without a hard cap. Always count \`used\` against \`max_steps\`. A second cap on tokens or dollars is even better. The step cap is the one you can write today.

\`used += 1\` should happen once per turn, at a known place. If you increment in two branches, you will double-count. If you increment after \`continue\`, you might skip counting. Put the increment at the top of the loop body.

## any, all, and sorted

\`any(tests)\` is True if **at least one** item counts as yes. \`all(tests)\` is True only if **every** item counts as yes. Empty \`any([])\` is False. Empty \`all([])\` is True (no counterexamples). That empty case surprises people. Prefer not to call them on lists that might be empty unless you know the rule.

\`\`\`python
oks = [True, True, False]
print(any(oks))  # True — at least one step worked
print(all(oks))  # False — not every step worked
\`\`\`

Use \`any\` for "did any tool fail?" Use \`all\` for "did every required field arrive?"

\`sorted(names)\` returns a **new** list in order. The old list does not change. Print a set of tool names with \`sorted(...)\` so the order is stable. \`list.sort()\` changes the list in place and returns \`None\` — the same trap as \`append\`.

## else on a for or while

A loop can have \`else\`. That \`else\` runs only if the loop **did not** \`break\`.

\`\`\`python
for step in range(1, 4):
    if step == 99:
        print("found")
        break
else:
    print("never found")
\`\`\`

That is how a budget stop can print "stop: budget" when \`finish\` never happened. If you \`break\` on finish, the \`else\` is skipped. The word \`else\` is confusing here. Think “if no break.” You will use this in the mini-agent lesson.

## Common mistakes

- \`while True\` with no \`break\` and no budget.
- Forgetting \`used += 1\`.
- \`continue\` before you record the step.
- Expecting \`zip\` to error on different lengths.
- \`for i in len(xs):\` — \`len\` returns a number, which you cannot walk. Use \`range(len(xs))\` or, better, \`enumerate\`.
- Using \`for\` when the stop condition is “until done or budget,” which is a \`while\`.

\`\`\`tryit python
print("range:")
for i in range(3):
    print(i)

print("enumerate:")
for i, name in enumerate(["search", "read", "answer"], start=1):
    print(i, name)

print("zip:")
tools = ["search", "read"]
queries = ["weather", "file.txt"]
for tool, query in zip(tools, queries):
    print(tool, query)

obs = ["rain", "", "umbrella"]
kept = []
for text in obs:
    if not text:
        continue
    kept.append(text)
print("kept:", kept)

max_steps = 8
used = 0
goal_done = False
log = []
while used < max_steps and not goal_done:
    used += 1
    log.append(used)
    if used >= 4:
        goal_done = True
        break
print("used:", used)
print("log:", log)
print("stopped before budget 8:", used < max_steps)

oks = [True, True, False]
print("any ok?", any(oks))
print("all ok?", all(oks))
print("sorted names:", sorted({"write", "read", "search"}))

for step in range(1, 4):
    if step == 99:
        break
else:
    print("loop else: never broke")
\`\`\`

Change the inner \`if used >= 4\` to \`if used >= 99\` so finish never happens. Then \`used\` should hit 8 and the while should stop on budget. That is the agent’s last seatbelt.

## How agents use this

An agent is a \`while\` loop with a budget. Each turn adds one to \`used\`. \`for\` walks messages or tool names. \`enumerate\` numbers the trace so a person can say "step 7". \`any\` / \`all\` check a list of flags. \`break\` stops when the goal is done. A loop \`else\` runs only if you never broke — that is a clean "budget used up" message. Never let this loop run with no stop.

Retries are a small \`for i in range(3)\` around one tool, not a second infinite while. Nested unbounded loops are how a single user request becomes a thousand model calls. One outer while with \`max_steps\`. Inner loops over known lists.

Print \`used\`, \`goal_done\`, and the last observation every turn while you learn. That print is the trace. Later you append dicts instead of only printing. The loop does not change: test, act, record, test again.

\`\`\`quiz
Which loop fits "run until the goal is true or steps hit 8"?
- for item in goal
- *while used < 8 and not goal_done
- if used < 8
- range(goal)
explain: A while loop tests a stop condition each turn. for walks a known list. A budget belongs in that test.
\`\`\`
`,
  },
];
