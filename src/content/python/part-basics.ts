import type { RawLesson } from "@/lib/types";

export const pythonBasics: RawLesson[] = [
  {
    slug: "intro",
    title: "Why Python for Agents",
    summary:
      "What Python is, why agents are built in it, how print and comments work, and how to run code on this site from zero.",
    minutes: 18,
    level: "beginner",
    md: `
Python is a programming language. A **program** is a list of instructions a computer follows from top to bottom. You will use Python to name values, make decisions, loop, call functions, read JSON, and catch errors. Those skills are the whole foundation of an agent.

An **agent** is a program that has a **goal**, looks at what just happened, and then takes a next **step**. The “brain” of many agents is a language model. The **hands** are Python functions. The **loop** that calls those functions is also Python. If you cannot read Python yet, you cannot debug an agent yet. That is why this track starts from zero.

This site runs Python in your browser. You do not need to install Python first. Click **Run** under a live code box to see output. Output appears only if you call \`print()\`. If you compute a value and never print it, the work still happens, but you see nothing.

## Why Python

Python is not the fastest language. Models can write many languages. Python wins for agents because the rest of the work already lives here: files, tests, data, and libraries that talk to models.

A **library** is code other people wrote that you can use. The **standard library** is the set of libraries that ship with Python itself: \`json\`, \`math\`, \`re\`, \`pathlib\`, and more. This editor only has the standard library. There is no \`pip\` and no internet inside a live box.

| Need | Why Python helps |
|---|---|
| Tools | A tool is a function you call by name |
| Models | Many model libraries ship Python first |
| Data | JSON, files, and tables are easy to load |
| Tests | You can write checks so bugs show up early |
| Reading | Python looks close to English |

**JSON** is a common text format for data. It can hold numbers, text, true/false, lists, and null. In Python, JSON null becomes \`None\`. You will see this in later lessons. For now, know that almost every tool call an agent makes is “a name plus JSON-shaped data.”

You can build agents in other languages too. Python is the common choice, not the only choice. We use it here because tools are easy to write as functions, and a **function** is a named piece of code you can call, like \`print\`. When an agent uses a **tool**, that tool is almost always a Python function.

\`\`\`viz flow
title Python is the hands
layout lr
node goal Goal
node py Python
node tool Tool
node log Log
edge goal py
edge py tool
edge tool log
caption The model can talk. Python calls the tool, prints what happened, and stops.
\`\`\`

## print writes a line

Python reads a program from top to bottom. Each line is an instruction. Blank lines are ignored. You can put more than one statement on a line with a semicolon, but beginners should not. One idea per line is easier to debug.

\`print\` writes text you can see. On this site, that text shows up in the output panel. In a real agent, you will later write the same idea as a **log**. A **log** is a record of what happened, often saved as a list or a file. For now, \`print\` is enough.

\`\`\`python
print("hello")
print("step", 1)
print("goal:", "say hello")
\`\`\`

You can pass more than one value. Python puts a space between them. Then it starts a new line. \`print("step", 1)\` writes \`step 1\`. The number is converted to text for you. You do not have to wrap it yourself when you use \`print\` with several arguments.

If you forget \`print\`, Python still does the work, but you see nothing. The value is thrown away. This is the first “my code did nothing” bug. The code ran. Nobody showed the result.

\`print\` can write anything Python can turn into text: numbers, \`True\`, \`None\`, lists, and dicts. Later lessons explain those types. You can print them today.

## Comments start with #

A **comment** is a note for humans. It starts with \`#\` and runs to the end of the line. Python skips it. Comments do not change what the program does.

Write comments to say *why*. Do not repeat the code in English. \`step = step + 1  # add one to step\` is noise. \`budget = 8  # remaining model calls before we stop\` is useful, because the number 8 does not explain the rule.

\`\`\`python
budget = 8  # how many model calls we have left
# Do not print secret keys.
print("budget", budget)
\`\`\`

A comment is not a lock. A comment that says “do not send secrets” does not stop the program. Safety belongs in real checks, not in notes. If you need the program to refuse a bad tool name, you will write an \`if\` later, not a comment.

You can also put a comment after code on the same line. Keep it short. If the explanation needs a paragraph, put it above the line instead.

## Indent comes later

An **indent** is spaces at the start of a line. Later, Python uses indent to group lines under \`if\` and \`for\`. That grouping is called a **block**. For now, start every line at the left edge. Do not add extra spaces in front of a normal instruction.

If you indent a line that is not inside \`if\`, \`for\`, \`def\`, or similar, Python raises \`IndentationError\`. If a live box fails immediately with that word, look at spaces at the start of lines first.

Blank lines are fine. Python ignores them. Use them to separate ideas, the way paragraphs separate ideas in English.

Tabs and spaces both indent, but mixing them causes errors. This site’s editor uses spaces. Use four spaces when you later write a block. Do not guess.

## Run code on this page

This page runs Python with a tool called **Pyodide**. Pyodide is Python inside the browser. It is real Python, with limits.

Rules for the live boxes:

- Use the **standard library** (the tools that come with Python)
- There is no \`pip\` and no internet
- You must \`print()\` to see a result
- A run that never finishes will be stopped by the site
- Errors print in the output panel. Read the last line first. It names the error.

On your own computer you save a file like \`hello.py\` and run \`python hello.py\`. This editor is that file, plus an output panel. The loop is simple: edit, run, read the output, edit again.

If the output is empty, you probably forgot \`print\`. If the output is an error, the program stopped at that line. Lines above it did run. That is useful: print above the crash to see what the names held.

## Common mistakes

- Forgetting \`print\` and thinking the program “did nothing.”
- Adding spaces at the start of a line “to make it look nested.” Python treats those spaces as structure.
- Putting quotes around a comment: \`#" note"\` is still a comment, but \`" # note"\` is text.
- Writing \`Print("hi")\` with a capital P. Names are case-sensitive. The function is \`print\`.
- Expecting the last line to show automatically, like a calculator. This site is a script runner, not a calculator.

\`\`\`tryit python
# A tiny log of what an agent did
goal = "say hello"
print("Goal:", goal)
print("Action: greet")
print("Done")
\`\`\`

Change the text and click **Run**. Watch the output panel. Then delete one \`print\` and run again. Notice the missing line. That experiment is the whole editor habit: change one thing, read the output, put the line back.

## How agents use this

A **tool** is a function with a name, like \`search\` or \`print\`. An agent calls a tool, then reads the result. A **trace** is a printed log of each step: the goal, the tool, and what came back. If you cannot see the trace, you cannot fix a bug.

Start every script by printing the goal. Then print each action. Then print “done” or the error. That three-line habit is how you learn to read a loop before you write one. Later you will store the same facts in a list instead of only printing them. The facts do not change: goal, action, result.

When a real agent fails, people often blame the model. The first check is still Python: did the tool run, did it print, did it return, did the next line see that return? \`print\` is how you answer those questions while you are still learning names and types. Logging libraries come later. The idea is the same.

You will also see comments in agent code that describe policy: “reject unknown tools,” “never log the API key.” Treat those as reminders to write real checks. The language starts here: a line of code, a comment, and output you can read.

\`\`\`quiz
How does output appear in the Python boxes on this site?
- The last line is always shown for you
- *You call print(), and that text is the output
- The site emails the result to you
- Only errors are shown
explain: The browser runs your script. print() writes to the output panel. Unused values are thrown away.
\`\`\`
`,
  },
  {
    slug: "variables",
    title: "Variables and Names",
    summary:
      "Assignment gives a value a name. Learn naming rules, snake_case, rebinding, and the names every agent loop uses.",
    minutes: 18,
    level: "beginner",
    md: `
A **variable** is a name stuck on a value. You write \`name = value\`. After that, the name means that value until you stick the name on something else.

The \`=\` sign is not math. It does not ask “are these equal?” That question uses \`==\`, which you will meet in the next comparison lesson. \`=\` means **assignment**: “this name now points to this value.”

Agent code is full of names. Good names make the story easy to read: \`goal\`, \`step\`, \`budget\`. Bad names hide the story: \`x\`, \`data\`, \`tmp\`. When a trace prints \`x=3\`, you do not know if 3 is a step, a retry count, or a price. When it prints \`step=3\`, you do.

## Assignment

**Assignment** is the act of giving a name to a value. Python evaluates the right side first, then attaches the name on the left.

\`\`\`viz strip
title A name points at a value
chip goal
chip find weather
caption The left chip is the name. The right chip is the value. Assignment sticks the name on that value.
\`\`\`

\`\`\`python
agent_name = "atlas"
step = 0
step = step + 1
print(agent_name)
print(step)
\`\`\`

The third line reads the old \`step\` (0), adds one, and points \`step\` at the new number 1. You did not change the number 0. You moved the name to 1. Numbers do not get edited in place. Names get moved.

You can change a name as many times as you need. That is how a loop counts. Each turn does \`step = step + 1\` and maybe \`budget = budget - 1\`.

You may also assign several names in one line: \`step, budget = 0, 8\`. That is two assignments. Beginners can skip it until unpacking. One name per line is clearer while you learn.

## Naming rules

Python names:

- Start with a letter or an underscore
- Can hold letters, digits, and underscores
- Care about upper and lower case: \`Goal\` and \`goal\` are different
- Cannot be special words like \`if\`, \`for\`, \`class\`, or \`return\`

\`2step\` is illegal because it starts with a digit. \`max-steps\` is illegal as a name because \`-\` means subtract. \`max_steps\` is legal.

Python’s common style guide is called **PEP 8**. You do not need to memorize it. One useful rule is **snake_case**: lowercase words joined with underscores, like \`max_steps\`.

| Kind | Style | Example |
|---|---|---|
| Variable | snake_case | \`max_steps\` |
| Function | snake_case | \`call_tool\` |
| Constant | UPPER_SNAKE | \`DEFAULT_BUDGET\` |

A **constant** is a name you do not plan to change. Python does not lock it. The uppercase is a hint for humans. You can still write \`DEFAULT_BUDGET = 99\`. The language will not stop you. The hint is for readers.

Name the thing, not the type. Prefer \`trace\` over \`my_list\`. Prefer \`budget\` over \`num\`. Prefer \`tool_name\` over \`s\`. If you need the type, Python can tell you later with \`type()\`. The name should tell the job.

Underscore-only names like \`_\` sometimes mean “I do not need this value.” You will see that in unpacking. Do not use \`_\` for an important counter.

## Names that agents use

Three names show up again and again:

- \`goal\` — what “done” means
- \`step\` — how many turns the loop has run
- \`budget\` — how much you can still spend (calls, tokens, or dollars)

Later you will add \`transcript\` or \`memory\` (a list of what happened), \`error\` (missing, or a message), and \`tool\` (the name of the function to run). If those names are vague, a printed trace is hard to read. Pick names that match the loop.

\`\`\`python
goal = "find the weather"
step = 0
budget = 5
print(goal, step, budget)
\`\`\`

Read that print as a sentence: the goal is find the weather, we are on step 0, five calls remain. That sentence is the state of a tiny agent.

## Two names can share one value

A name is a **label**, not a box that owns a private copy. Two labels can point at the same value.

\`label = agent_name\` does not copy the text into a new box. It sticks a second label on the same value. For numbers and text you rarely notice, because you cannot change a number in place. For a **list** (a row of values), a change through one name can show up through the other. We will use lists more later. Remember the rule now: assignment copies the label, not a deep clone of the value.

\`\`\`python
agent_name = "atlas"
label = agent_name
print(label)
agent_name = "bolt"
print("label still", label)
print("agent_name now", agent_name)
\`\`\`

After the third assignment, \`agent_name\` points at \`"bolt"\`. \`label\` still points at \`"atlas"\`. Rebinding one name does not rebind the other. That is different from editing a shared list, which you will see in the lists lesson.

## Common mistakes

- A typo makes a **new** name. \`max_step\` and \`max_steps\` are different. Python will not always warn you. Print your state.
- Using a name before you assign it causes \`NameError\`. Set counters to \`0\` first. Set text to \`""\` if you need empty text. Set “missing” to \`None\` later.
- \`class = "Agent"\` is a syntax error. \`class\` is a special word. Use \`agent_class\`.
- \`==\` instead of \`=\` on an assignment line does not store a value. It asks a question and throws the answer away unless you print it or use it in \`if\`.
- Putting spaces in a name: \`max steps = 8\` is two names and a syntax error.

\`\`\`tryit python
goal = "find the weather"
step = 0
budget = 5

step = step + 1
budget = budget - 1

print("goal:", goal)
print("step:", step)
print("budget:", budget)

agent_name = "atlas"
label = agent_name
print("label:", label)

DEFAULT_BUDGET = 16
print("default budget:", DEFAULT_BUDGET)
\`\`\`

Change \`goal\` and run again. Watch how every print follows the names. Then change \`step = step + 1\` to \`step = step + 2\` and see the printed step jump. The prints are following the labels, not a hidden calculator.

## How agents use this

The agent loop is a handful of names updated every turn: \`goal\`, \`step\`, \`budget\`, and later a list of messages. A **trace** prints those names so you can see the story. If the names are \`x\` and \`tmp\`, you will not understand the log, and neither will the next person who debugs a failed run.

When you read someone else’s agent, start by listing the names that change each turn. Those names *are* the state. Everything else is helpers. If a name is assigned in three different places with three different meanings, that is a bug waiting to happen. Use one name for one job.

Passing state into functions comes later. The habit starts here: pick \`budget\` not \`n\`, update it on purpose, print it after you update it. An agent that cannot say its own \`step\` and \`budget\` out loud is already hard to operate.

\`\`\`quiz
Which name follows usual Python style for a variable?
- MaxSteps
- *max_steps
- max-steps
- maxSteps
explain: PEP 8 uses snake_case for variables. A hyphen is subtraction, not part of a name.
\`\`\`
`,
  },
  {
    slug: "types",
    title: "Types: Numbers, Text, True/False, and None",
    summary:
      "Every value has a type. Learn int, float, str, bool, and None, how to convert, and why bool('False') is True.",
    minutes: 18,
    level: "beginner",
    md: `
Every value in Python has a **type**. The type is the kind of value it is. The type decides what you can do: add it, slice it, or turn it into JSON. \`"3" + "1"\` is \`"31"\` because both sides are text. \`3 + 1\` is \`4\` because both sides are numbers. \`"3" + 1\` crashes, because Python will not guess.

Agents live on a small set of types. Tool arguments often arrive as JSON. JSON becomes numbers, text, true/false, lists, or \`None\`. If you do not know which one you have, your code will surprise you. A model that sends \`"8"\` (text) where you expected \`8\` (int) will break a budget check until you convert.

## The five types you will see most

| Type | Examples | Typical use |
|---|---|---|
| \`int\` | \`0\`, \`8\`, \`-1\` | step counts, token counts |
| \`float\` | \`0.002\`, \`3.14\` | prices, temperatures |
| \`str\` | \`"search"\`, \`""\` | prompts, names, JSON text |
| \`bool\` | \`True\`, \`False\` | yes/no flags |
| \`None\` | \`None\` | missing value, no result yet |

An **int** is a whole number. It has no decimal point. A **float** is a number with a decimal point, even if the extra part is zero: \`3.0\` is a float. A **str** (string) is text. A **bool** (boolean) is \`True\` or \`False\`. **None** means missing.

\`\`\`viz strip
title Five types you will see most
chip int
chip float
chip str
chip bool
chip None
caption int for counts. float for prices. str for text. bool for yes or no. None for missing.
\`\`\`

\`True\`, \`False\`, and \`None\` are not strings. \`"True"\` is four characters of text. \`True\` is a boolean. \`"None"\` is four characters. \`None\` is missing. Beginners mix these constantly when they read model output, because models emit text.

Quotes make a string. \`128\` is an int. \`"128"\` is a string of three characters. You can count tokens with the int. You cannot subtract 1 from the string without converting first.

## type() tells you the kind

\`type(x)\` returns the type of \`x\`. Print it when you are confused. The printed form looks like \`<class 'int'>\`. Read the word inside: \`int\`, \`str\`, \`bool\`, \`NoneType\`.

\`\`\`python
print(type(128))     # int
print(type(0.5))     # float
print(type("hi"))    # str
print(type(True))    # bool
print(type(None))    # NoneType
\`\`\`

Read the output. Match it to the table above. This is the first debugging move when a tool argument “looks like a number” but will not add.

You can also compare types, but the usual check later is \`isinstance(x, int)\`. \`type()\` is the flashlight. \`isinstance\` is the gate. Use the flashlight while you learn.

## Convert with int() and str()

You can ask Python to change a value into another type when the change makes sense.

- \`int("42")\` → \`42\`
- \`str(7)\` → \`"7"\`
- \`float("3.5")\` → \`3.5\`
- \`bool(0)\` → \`False\`, \`bool(1)\` → \`True\`

\`int("3.5")\` fails, because that text is not a whole number. Go through \`float\` first, or clean the text. \`int(float("3.5"))\` is \`3\`.

\`int(3.9)\` cuts off the extra part toward zero. It does **not** round. \`int(3.9)\` is \`3\`. \`round(3.9)\` is \`4\`. \`int(-3.9)\` is \`-3\`, still toward zero, not toward more negative.

\`int("42")\` works. \`int(" 42 ")\` also works; extra spaces around a whole number are allowed. \`int("42abc")\` fails. \`int("")\` fails. When a model might send junk, convert inside \`try\` later. For now, convert known-clean text.

\`\`\`python
print(int("42"))
print(str(7))
print(int(3.9))
print(round(3.9))
print(float("3.5"))
\`\`\`

To build a log line from a number, wrap the number: \`"step " + str(step)\`. \`print("step", step)\` also works because \`print\` converts each argument. The \`+\` operator on strings does not convert for you.

## A trap: bool("False")

\`bool("False")\` is **True**. A string with any characters in it counts as yes. The letters F-a-l-s-e do not matter. \`bool("")\` is False. \`bool("0")\` is True, because \`"0"\` is not empty.

If a flag arrives as text, compare it yourself: \`flag == "true"\` or \`flag.lower() == "true"\`. Do not trust \`bool(flag)\` for English words. JSON \`true\` becomes Python \`True\` when you use \`json.loads\`. JSON \`"true"\` (with quotes) becomes the string \`"true"\`. Those are different.

\`bool(None)\` is False. \`bool(0)\` is False. \`bool([])\` is False. We go deeper on that in the True/False lesson. Remember the string trap now, because tool args are often strings.

## A name can change type

This is legal: \`n = 3\` and later \`n = "three"\`.

It is usually a mistake. Keep \`step\` as an \`int\`. Keep \`goal\` as a \`str\`. Keep \`ready\` as a \`bool\`. Keep \`error\` as \`None\` or a string message, on purpose. The running program will still let you switch types. Your future self will not thank you.

JSON numbers that look whole become \`int\`. Numbers with a dot become \`float\`. A tool argument \`"8"\` is still a \`str\` until you convert it. Convert once, before the rest of the loop uses the value. Do not convert in five different \`if\`s.

## Common mistakes

- Adding a string to a number: \`"step " + 3\` raises \`TypeError\`. Use \`str(3)\` or \`print("step", 3)\`.
- Comparing \`"8" == 8\`, which is False. Convert first.
- Using \`int("3.5")\` instead of \`int(float("3.5"))\`.
- Treating \`"None"\` as missing. It is text. Missing is \`None\` with no quotes.
- Calling \`bool("False")\` and believing the English.

\`\`\`tryit python
tokens = 128
cost = 0.002
model = "local-demo"
ready = True
error = None

print(type(tokens))
print(type(cost))
print(type(model))
print(type(ready))
print(type(error))

print(int("42"), str(7), float("3.5"))
print("int(3.9) =", int(3.9))
print("round(3.9) =", round(3.9))
print("bool('False') =", bool("False"))
\`\`\`

Run it. Read each \`type(...)\` line. Then change \`tokens = 128\` to \`tokens = "128"\` and run again. The first type line should change. That is the same surprise a JSON string will give your budget math.

## How agents use this

JSON uses these same types: numbers, text, true/false, lists, and null. After Python reads JSON, null becomes \`None\`. Tool arguments arrive as these types. If the model sends \`"3"\` (text) where you need a count, call \`int()\` before you use it. One clear conversion is better than silent guessing in the middle of the loop.

A tool result should use one type per field, every time. \`ok\` should be a bool, not \`"yes"\`. \`error\` should be \`None\` or a string, not \`False\`. \`hits\` should be a list, even if it has one item. Mixed types make \`if\` tests lie and make traces hard to compare in tests.

When you print a trace, print the type of any value that looks “wrong.” \`print(type(k), k)\` is a complete debugging sentence. Later, \`isinstance\` will turn that sentence into a gate at the edge of \`call_tool\`. The type lesson is that gate in slow motion.

\`\`\`quiz
What is bool("False") in Python?
- False, because the text says false
- *True, because non-empty text counts as yes
- None
- An error
explain: bool() cares about empty vs not empty, not English. Any string with characters in it is True.
\`\`\`
`,
  },
  {
    slug: "operators",
    title: "Compare and Combine Values",
    summary:
      "Use ==, !=, <, in, is, and, or, not. Know same value versus same object, short-circuit, and beginner traps.",
    minutes: 18,
    level: "beginner",
    md: `
An **operator** is a symbol that compares or combines values. Agents use these all day: is the step still under the budget, is the tool name allowed, is the error still missing.

A comparison gives you \`True\` or \`False\`. You then use that answer in \`if\`, in \`while\`, or in a print while you debug. If you write \`step = 3\` you store 3. If you write \`step == 3\` you ask a question. Mixing those two is a classic bug.

## Compare values

| Operator | Meaning | Example |
|---|---|---|
| \`==\` | same value | \`step == 3\` |
| \`!=\` | not the same value | \`step != 8\` |
| \`<\` \`<=\` \`>\` \`>=\` | less / more | \`step < budget\` |
| \`in\` | found inside | \`"search" in text\` |
| \`is\` | same object | \`error is None\` |

\`==\` asks: do these have the **same value**? \`is\` asks: are these the **same object**?

An **object** is the actual value in memory. A name is a label stuck on that object. Two rows can hold the same numbers. That is \`==\`. Two names stuck on one row is \`is\`.

\`\`\`viz flow
title A comparison is a yes or no
layout lr
node ask step == 3
node yes True
node no False
edge ask yes
edge ask no
caption == asks if the values match. is asks if two names point at the same object. Use is for None.
\`\`\`

You can chain comparisons: \`0 < step < budget\`. That is true when step is greater than 0 and also less than budget. It reads like math. It is legal Python. \`step < budget and step > 0\` is the same idea with \`and\`.

## Same value vs same object

A **list** is a row of values in square brackets, like \`[1, 2]\`.

\`\`\`python
a = [1, 2]
b = [1, 2]
c = a
print(a == b)  # True — same values
print(a is b)  # False — two different rows
print(a is c)  # True — same row, two names
\`\`\`

Use \`==\` for numbers, text, and “does this match.” Use \`is\` for \`None\`. Do not use \`is\` to compare numbers or text. Small numbers can look like the same object by accident. That trick will confuse you. \`step is 3\` might print True in a demo and False tomorrow. \`step == 3\` is the check you meant.

\`None\` is missing. There is only one \`None\`. So \`error is None\` is the usual check. \`error == None\` often works, but style and a few edge cases prefer \`is\`. Learn \`is None\` and \`is not None\`.

## in

\`in\` asks if something is found inside something else.

- \`"act" in "action"\` is \`True\`
- \`"search" in ["read", "search"]\` is \`True\`
- \`3 in [1, 2, 3]\` is \`True\`

Watch out: \`"error" in "terror"\` is also \`True\`, because those letters sit inside the word. For a careful check, compare full words, or add spaces, or use \`==\` against a list of allowed names.

On a **dict** (named fields, later lesson), \`in\` checks **keys**, not values. \`"name" in action\` might be True while \`"search" in action\` is False. Do not use \`in\` on a dict until you know you are asking about keys.

\`not in\` is the opposite: \`"write" not in allowed\` is a good unknown-tool guard.

## Combine with and, or, not

- \`not x\` flips yes and no
- \`x and y\` is yes only if both are yes
- \`x or y\` is yes if at least one is yes

\`\`\`python
step = 3
budget = 8
print(step < budget and step > 0)
print(step == 99 or step == 3)
print(not False)
print(not (step == 3))
\`\`\`

Parentheses help when you mix \`and\` and \`or\`. \`and\` binds tighter than \`or\`, the way multiply binds tighter than add. If you have to look it up, use parentheses. Clear checks beat clever checks.

\`not\` applies to one value. \`not step < budget\` is easy to misread. Write \`not (step < budget)\` or \`step >= budget\`.

## Short-circuit

**Short-circuit** means stop early.

- \`and\` does not look at the right side if the left side is already False
- \`or\` does not look at the right side if the left side is already True

That is useful. You can write \`name or "guest"\`. If \`name\` is empty, you get \`"guest"\`. If \`name\` has text, you keep \`name\`. You can write \`error is None and step < budget\` and the second check never runs if error is already set.

Empty text \`""\` counts as no in this kind of check. Zero counts as no. \`None\` counts as no. We will go deeper on that in the True/False lesson. Do not use \`or "guest"\` when \`0\` is a legal measurement you must keep.

## Read a check out loud

Before you put a comparison in an \`if\` or a \`while\`, print it. \`print("under budget", step < max_steps)\` is not a toy. It is how you confirm the operator did what you think. Beginners often write \`step < max_steps\` when they meant \`step <= max_steps\`. The difference is whether you are allowed to use the last slot. A budget of 8 with \`<\` allows steps 0 through 7 if you count from zero, or 1 through 7 if you already incremented. Print \`step\` next to the boolean and you will see.

\`not in\` is the unknown-tool check: \`if name not in allowed\`. That is clearer than \`if not name in allowed\`, which is legal but easy to misread. Parentheses around the membership test are optional. Readability is not.

When both sides are strings, \`<\` uses dictionary order: \`"a" < "b"\` is True. Do not sort version numbers as strings if you can avoid it. Do not compare a tool name to a number. Mixed-type ordering can error or, worse, quietly be False.

## Common mistakes

- Writing \`=\` when you meant \`==\`. Assignment does not ask a question.
- Using \`is\` for strings or numbers.
- \`"error" in "terror"\` treated as a real error flag.
- Forgetting parentheses: \`not a == b\` is \`(not a) == b\`, which is rarely what you wanted. Write \`a != b\` or \`not (a == b)\`.
- Comparing mixed types: \`"3" == 3\` is False, not an error. The check is quiet and wrong.

\`\`\`tryit python
step = 3
max_steps = 8
print("equal", step == 3)
print("not equal", step != max_steps)
print("under budget", step < max_steps)

print("search" in "search the web")
print("error" in "terror")

error = None
print("error is None", error is None)

a = [1, 2]
b = [1, 2]
print("same value", a == b)
print("same object", a is b)

print("and", True and step < max_steps)
print("or default", "" or "guest")
print("not", not True)
\`\`\`

Read \`"error" in "terror"\` out loud. Then imagine a tool result that contains the word “terror” and an agent that stops because it thought it saw “error.” That is why exact checks matter.

## How agents use this

Agents compare on every turn: step vs budget, tool name in the allowed list, and \`error is None\`. Use \`==\` for values. Use \`is\` for \`None\`. Combine checks with \`and\` and \`or\`, and remember they can stop early.

A clear stop rule looks like \`step < max_steps and not done and error is None\`. Each piece is one question. If you pack five ideas into one clever line, you will not know which piece flipped when the loop dies.

Allowlists use \`in\` on a list or a set of tool names. That is a full-name check: \`"search" in allowed\`. Do not use substring \`in\` on a blob of model text to decide whether a tool ran. Parse the action into a name, then compare the name.

Traces should print the boolean that caused a branch: \`print("under budget", step < max_steps)\`. When the agent stops early, you want that line in the log. Operators are how the loop chooses. Printing the choice is how you debug it.

\`\`\`quiz
You have a = [1, 2] and b = [1, 2]. What is true?
- a is b is True, because the rows look the same
- *a == b is True, and a is b is False
- a == b is False
- a is None
explain: == checks values. is checks whether two names point at the same object. Two matching lists are still two lists.
\`\`\`
`,
  },
  {
    slug: "strings",
    title: "Strings (Text)",
    summary:
      "Make, slice, and clean text with concat, split, join, strip, and replace — the work of prompts and tool names.",
    minutes: 20,
    level: "beginner",
    md: `
A **string** (\`str\`) is text. Almost everything a model touches is a string: the prompt, the tool name, the JSON text, and the result you feed back. If you can cut, clean, glue, and search strings, you can debug a lot of agent failures.

Strings are **immutable**. That means you cannot change one character in place. Any “change” builds a **new** string. The old one stays if another name still points at it.

## Quotes and new lines

Single quotes or double quotes both work. Use the other kind inside the string. \`"He said 'stop'"\` is fine. \`'He said "stop"'\` is fine. If you need both kinds, you will later escape with a backslash, or use triple quotes.

Triple quotes make text with more than one line. That is useful for prompts. The line breaks inside the triple quotes are part of the string.

A backslash plus \`n\` in Python source is a **new line**. Those two characters tell Python to break the line. In a live box it is safer to build a multi-line string with \`chr(10).join(...)\`, because \`chr(10)\` is the new-line character. \`splitlines()\` then splits on that character.

\`\`\`python
tool = "search"
line = 'He said "stop"'
prompt = """You are a careful agent.
Call tools only when needed."""
print(tool)
print(line)
print(prompt)
print(chr(10).join(["hello", "world"]))
\`\`\`

An empty string is \`""\`. It is still a string. Its length is 0. It is not \`None\`.

## Index and slice

Characters are numbered from **0**. The first character is \`s[0]\`. The last character is \`s[-1]\`. \`s[1]\` is the second character.

\`\`\`viz strip
title Letters in a row, counted from 0
chip A
chip c
chip t
chip i
chip o
chip n
caption A slice keeps a piece. The original string does not change. "Act" is the first three letters.
\`\`\`

A **slice** is a piece of the text. \`s[:3]\` is the first three characters. \`s[0:3]\` is the same thing: characters at 0, 1, and 2. The 3 is where to stop. It is not included. \`s[3:]\` is from index 3 to the end.

\`\`\`python
s = "Action"
print(s[0])    # A
print(s[-1])   # n
print(s[:3])   # Act
print(s[3:])   # ion
print(s[1:4])  # cti
\`\`\`

You cannot change one character in place. \`s[0] = "a"\` fails with \`TypeError\`. Build a new string instead: \`"a" + s[1:]\`.

A bad index raises \`IndexError\`. \`s[99]\` crashes on a short string. A slice does not crash. \`s[99:120]\` is \`""\`.

## Glue text with +

To fill names into a line, **concatenate**: join strings with \`+\`. Every piece must be a string. Numbers need \`str(...)\`.

\`\`\`python
tool = "search"
city = "nyc"
step = 1
print("Calling " + tool + " for " + city)
print("step " + str(step))
\`\`\`

\`print("Calling", tool, "for", city)\` also works, because \`print\` inserts spaces. Use \`+\` when you need one string to store, not only to show: a prompt, a tool argument, a file name.

Do not build JSON by gluing quotes yourself if values can hold quotes. \`"{\\"q\\": " + city + "}"\` breaks when \`city\` has a quote. The \`json\` library comes later and does that job safely.

Repeating text uses \`*\`: \`"ab" * 3\` is \`"ababab"\`. Useful for a tiny fence of backticks later, not for prompts.

## Clean text: strip, split, join, replace

| Method | What it does |
|---|---|
| \`s.strip()\` | Remove spaces at the start and end |
| \`s.split()\` | Break on spaces into a list (a row of values) |
| \`s.split(",")\` | Break on a chosen mark |
| \`",".join(parts)\` | Glue a row of strings into one string |
| \`s.replace(a, b)\` | Copy the text with a change |
| \`s.lower()\` | Make letters lowercase |
| \`s.upper()\` | Make letters uppercase |

None of these change \`s\`. They return a new string or a new list. You must use the return value: \`clean = line.strip()\`. Writing \`line.strip()\` alone throws the clean copy away.

\`join\` belongs to the glue string. You write the glue first: \`" | ".join(parts)\`. Every part must be a string. \`" ".join([1, 2])\` fails. Convert first, or join names you already know are text.

\`len(s)\` counts characters. For a size limit, character count is a simple way to estimate tokens. It is not a real tokenizer. It is good enough to stop a prompt from growing without bound while you learn.

Model output often has extra spaces and extra new lines. \`strip()\` before you compare. \`"search" == "search\\n"\` is False until you strip. In code, strip the model line, then compare.

## Check the start, the end, and each line

| Method | What it does |
|---|---|
| \`s.startswith("https://")\` | True if the text begins this way |
| \`s.endswith(".json")\` | True if the text ends this way |
| \`s.find("error")\` | Index of the first match, or \`-1\` if missing |
| \`s.splitlines()\` | Break on new lines into a list |

\`find\` is safer than \`index\`. \`index\` **crashes** when the piece is missing. \`find\` gives \`-1\`. Use \`find\` unless you *want* a crash.

\`splitlines()\` walks a multi-line model reply. It still works when the line break is Windows-style. Later you will use first-line / last-line checks to strip markdown fences.

\`in\` works on strings too: \`"act" in "action"\` is True. **Warning:** \`"error" in "terror"\` is True. For a full word, compare with \`==\`, or use \`startswith\` / \`endswith\`, or split on spaces and test the list.

## Common mistakes

- \`"step " + 3\` — \`TypeError\`. Use \`str(3)\`.
- Forgetting to save \`strip()\` / \`replace()\` / \`lower()\`.
- Off-by-one slices: \`"abcdef"[1:4]\` is \`"bcd"\`, not \`"bcde"\`.
- Using \`index\` on text that might not contain the piece.
- Building JSON with \`+\` and quotes.
- Comparing without \`strip\`, then wondering why the tool name never matches.

\`\`\`tryit python
tool = "search"
city = "nyc"
print("Calling " + tool + " for " + city)

text = "Action"
print("first:", text[0])
print("slice:", text[:3])
print("len:", len(text))
print(chr(10).join(["hello", "world"]))

line = "  search,read,write  "
clean = line.strip()
print("strip:", clean)
print("split:", clean.split(","))
print("join:", " | ".join(["think", "act", "observe"]))
print("replace:", "Hello".replace("H", "h"))
print("https?", "https://example.com".startswith("https://"))
print("json file?", "state.json".endswith(".json"))
print("find error:", "terror".find("error"), "find missing:", "ok".find("error"))
print("lines:", chr(10).join(["think", "act", "observe"]).splitlines())
print("error in terror:", "error" in "terror")
\`\`\`

Change \`city\` and run again. Then \`strip\` a tool name with extra spaces and compare it to \`"search"\`. Matching names is most of tool routing.

## How agents use this

Prompts, tool names, and model replies are all strings. You slice a long log to fit a size limit. You strip spaces, split lines, and glue names with \`+\` before you print a trace. You check \`startswith("https://")\` before a fetch tool runs. Clean the text first, then decide what the agent should do.

A typical tool-name path is: take the model line, \`strip()\`, maybe \`lower()\` if you chose case-insensitive names, then compare to an allowlist. If you skip \`strip\`, \`"search "\` is not \`"search"\`, and the agent reports an unknown tool even though a human sees the right word.

JSON text is a string until you parse it. Fence stripping is string work: drop the first line if it starts with backticks, drop the last line if it is only backticks, then parse. You will write that parser later. It is this lesson’s methods in a row: \`splitlines\`, \`startswith\`, \`join\`, \`strip\`.

Character counts also gate cost. \`if len(prompt) > 8000: prompt = prompt[:8000]\` is a blunt knife, but it is a real budget. Better packing comes later. Knowing \`len\` and slices is how you hold the knife.

\`\`\`quiz
What does "abcdef"[1:4] return?
- "abcd"
- *"bcd"
- "bcde"
- "abcdef"
explain: A slice stops before the end index. Indexes 1, 2, and 3 are b, c, and d.
\`\`\`
`,
  },
  {
    slug: "numbers",
    title: "Numbers and Math",
    summary:
      "Integers, floats, division, rounding, remainders, and how agents count steps, tokens, and cost without lying.",
    minutes: 18,
    level: "beginner",
    md: `
Agents count. They count **steps**, **tokens**, and **cost**. Get the math wrong, and the loop runs until the bill arrives. Python’s everyday math is small. You need it to be automatic.

A **token** is a chunk of text the model reads or writes. Think of it as a piece of a word. We count tokens because they cost money. This lesson does not tokenize for real. It teaches the arithmetic you run *after* you have counts.

Python has two everyday number types. An **int** is a whole number. A **float** is a number with a decimal point. Use \`int\` for counters. Use \`float\` for prices. For exact money, you can also count cents as whole numbers and divide by 100 only when you print.

## The math operators

| Op | Meaning | Example |
|---|---|---|
| \`+\` \`-\` \`*\` | Add, subtract, multiply | \`3 * 4\` is \`12\` |
| \`/\` | Divide, always a float | \`7 / 2\` is \`3.5\` |
| \`//\` | Divide, drop the leftover fraction | \`7 // 2\` is \`3\` |
| \`%\` | Remainder | \`7 % 2\` is \`1\` |
| \`**\` | Power | \`2 ** 10\` is \`1024\` |

\`/\` on two whole numbers still gives a float. \`10 / 2\` is \`5.0\`, not \`5\`. If you want a whole number of batches, use \`//\`.

\`%\` is what is left. \`7 % 2\` is \`1\` because 2 fits into 7 three times, with 1 left. \`window = 512\` and \`prompt_tokens % window\` is leftover tokens after filling full windows.

\`**\` multiplies a number by itself. \`2 ** 10\` is 2 times itself, 10 times. \`10 ** 3\` is 1000. Useful for “per thousand tokens” as \`tokens / 10 ** 3\`, though writing \`/ 1000\` is clearer.

Parentheses change order. \`prompt_tokens / 1000 * price\` multiplies after dividing. Write the formula so it matches the comment next to it. If you cannot read it, neither can the next reviewer.

## round and int

\`round(x)\` goes to the nearest whole number. \`round(x, 4)\` keeps 4 digits after the dot. \`round(2.5)\` in Python 3 goes to the even choice in the halfway case. Do not use halfway cases for money demos. Round to 4 digits for logs.

\`int(x)\` cuts off the extra part toward zero. \`int(3.9)\` is \`3\`. That is not rounding. \`int(3.1)\` is also \`3\`.

\`min\` and \`max\` pick the smallest and largest values. \`abs(-3)\` drops the sign and gives \`3\`. \`sum([1, 2, 3])\` adds a list of numbers. \`sum\` needs a list (or similar), not loose arguments: \`sum([1200, 350])\` works; \`sum(1200, 350)\` does not.

\`\`\`python
print(7 / 2)
print(7 // 2)
print(7 % 2)
print(2 ** 10)
print(round(3.9), int(3.9))
print(min(1200, 350, 800), max(1200, 350, 800))
\`\`\`

## Count tokens and cost

A simple cost line looks like this:

\`\`\`python
prompt_tokens = 1200
completion_tokens = 350
price_in = 0.005
price_out = 0.015
cost = prompt_tokens / 1000 * price_in + completion_tokens / 1000 * price_out
print(round(cost, 4))
\`\`\`

Keep token counts as \`int\` until you multiply by a **price**. Then you have dollars. Round for the log. Do not store cost as text. If you \`str(cost)\` too early, you cannot add the next call’s cost without converting back.

\`\`\`viz bars
title Tokens in, tokens out
bar prompt,1200,0
bar reply,350,1
caption You pay for both. Cost is tokens times price. Count as ints. Round dollars for the log.
\`\`\`

Prices are usually “dollars per 1K tokens.” That is why we divide by 1000. If a vendor prices per million, divide by \`1_000_000\`. Underscores in numbers are allowed in Python: \`1_000_000\` is a million. They are only for reading.

## Floats are not exact

\`0.1 + 0.2\` is not exactly \`0.3\`. Binary floats cannot hold some decimals. Do not compare money with \`==\`. Round for display, or count cents as whole numbers: \`cents = 15\` then print dollars as \`cents / 100\`.

Step counts and list lengths are ints. Prices are floats. Mixing them with \`==\` is a classic demo bug. \`step == 3.0\` may be True, but \`cost == 0.3\` after addition may be False. Compare costs with a round, or compare ints.

\`step += 1\` means \`step = step + 1\`. \`budget -= 1\` subtracts. \`cost += line_cost\` accumulates. You are moving the name to a new number, not changing the old number.

Division by zero raises \`ZeroDivisionError\`. A price of 0 is legal. A window size of 0 is not if you \`//\` by it. Guard those.

## A budget line you can copy

Keep four numbers in an agent: \`step\`, \`max_steps\`, \`tokens\`, \`cost\`. Update them in one place at the end of a turn:

\`\`\`python
step = 0
max_steps = 8
tokens = 0
cost = 0.0
# one turn:
step += 1
tokens += 1200 + 350
cost += 1200 / 1000 * 0.005 + 350 / 1000 * 0.015
print("step", step, "of", max_steps)
print("tokens", tokens, "cost", round(cost, 4))
print("stop?", step >= max_steps or cost > 0.05)
\`\`\`

The last print is the policy. Change the threshold in one place. Do not hide a second stop rule inside a tool. If two places both decide to stop, you will not know which one fired. Numbers are the policy’s inputs. \`if\` is the policy. This lesson is the inputs.

Negative costs mean you subtracted in the wrong order. \`abs\` is not a fix for that. Print the prompt tokens and the completion tokens separately until the formula looks like the vendor’s docs.

## Common mistakes

- Using \`/\` where you needed \`//\` (or the other way around).
- Treating \`int(3.9)\` as round.
- Comparing floats with \`==\`.
- Forgetting parentheses in a cost formula.
- Storing \`cost\` as a string, then trying to add it.
- Using \`sum(1, 2, 3)\` instead of \`sum([1, 2, 3])\`.

\`\`\`tryit python
prompt_tokens = 1200
completion_tokens = 350
price_in = 0.005    # dollars per 1K prompt tokens
price_out = 0.015   # dollars per 1K completion tokens

cost = prompt_tokens / 1000 * price_in + completion_tokens / 1000 * price_out
print("cost_usd", round(cost, 4))

print("true divide", 7 / 2)
print("drop extra", 7 // 2)
print("remainder", 7 % 2)
print("power", 2 ** 10)

window = 512
print("full windows", prompt_tokens // window)
print("leftover tokens", prompt_tokens % window)
print("int vs round", int(3.9), round(3.9))
print("min/max", min(1200, 350, 800), max(1200, 350, 800))
print("abs", abs(-3))
print("sum tokens", sum([1200, 350]))
\`\`\`

Change \`prompt_tokens\` to \`2000\` and watch cost and window counts move together. The same numbers feed the bill and the chunking.

## How agents use this

A real loop has a **budget**: max steps, max tokens, or max dollars. Keep \`step\` as a whole number. Multiply tokens by a price to get cost, then \`round\` for the log. Stop when \`step\` is too high or \`cost\` is too high. That math is what protects your wallet.

Each turn should add the new tokens to a running int, add the new dollars to a running float, then print both. If you only print the last call’s cost, you will miss the sum. If you never cap \`max_steps\`, a confused model will spend the whole key.

Integer division also shows up in batching: how many full chunks of 512 characters, how many leftover characters. Off-by-one in \`//\` and \`%\` drops a tail of a document. Print \`full\` and \`leftover\` when you split text. The numbers lesson is the chunking lesson’s arithmetic.

Do not let the model invent the budget math. Your Python should compute cost from counts you measured. The model can propose a tool. It should not keep the ledger.

\`\`\`quiz
What is the value of 7 // 2 in Python 3?
- 3.5
- *3
- 4
- "3"
explain: // divides and drops the leftover fraction. For two ints, you get a whole number. Use / when you want 3.5.
\`\`\`
`,
  },
  {
    slug: "booleans-none",
    title: "True, False, and None",
    summary:
      "Truth tests, empty values, None vs 0 vs empty text, and why if result can lie when result is 0 or a blank string.",
    minutes: 18,
    level: "beginner",
    md: `
A **boolean** is \`True\` or \`False\`. Agent code is full of them: did the tool work, are we done, should we stop. You write them with capital letters. \`true\` and \`false\` are not Python booleans. They are NameErrors unless you defined them.

Python also does a **truth test**. Many values can be used in an \`if\` even when they are not real booleans. That is handy. It is also how \`0\`, \`""\`, and \`[]\` all look like “no.” This lesson is about when that shortcut is a lie.

## What counts as no

These values count as **no** in an \`if\`:

| Value | Meaning |
|---|---|
| \`False\` | the boolean no |
| \`None\` | missing |
| \`0\` and \`0.0\` | zero |
| \`""\` | empty text |
| \`[]\` | an empty list (a row with no values) |
| \`{}\` | no named keys yet |

Everything else counts as **yes**, including \`"0"\`, \`"False"\`, and \`[0]\`. A list that holds a zero is not empty. A string that holds the character 0 is not empty.

\`None\` means missing. It is not \`0\`. It is not \`""\`. JSON uses **null** for the same idea. After Python reads JSON, null becomes \`None\`. If a field is absent from a dict, \`.get\` also gives \`None\` unless you pass another default.

\`bool(x)\` is the explicit truth test. \`print(bool(0))\` prints False. Use it while you learn. In \`if x:\`, Python calls the same idea without you writing \`bool\`.

## Why if result can lie

Look at this:

\`\`\`python
result = 0
if result:
    print("got a result")
else:
    print("looks empty")
\`\`\`

Zero can be a real answer: zero matches, zero tokens left, zero errors. \`if result\` still skips, because \`0\` counts as no. The program takes the empty path even though the tool succeeded and said “0.”

\`\`\`viz flow
title Zero can look empty
layout lr
node res result is 0
node test if result
node skip looks empty
edge res test
edge test skip
caption 0, empty text, and None all look like no in an if. Check with == 0 or is None when those values are real answers.
\`\`\`

Empty text is the same trap. \`""\` can mean “the tool ran, and it returned a blank message.” \`if result\` treats that as missing. A search that returns no snippet is not the same as a search that never ran.

Use an exact check:

- missing: \`result is None\`
- empty text: \`result == ""\`
- zero: \`result == 0\`
- empty list: \`result == []\` or \`len(result) == 0\`

If you need “missing or empty text,” write that out: \`result is None or result == ""\`. Then you know which idea you meant.

## None is missing

Functions that do not \`return\` a value actually return \`None\`. A missing JSON field often becomes \`None\`. Do not use \`None\` as a stand-in for \`0\` or \`""\` unless you mean “unknown.”

Check \`None\` with \`is None\`. Do not write \`== "None"\`. That is text. Do not write \`== False\`. That is a boolean. \`None == False\` is False. \`None == 0\` is False. \`None == ""\` is False. Those three “empty looking” values are three different facts.

A useful pattern for errors:

\`\`\`python
error = None
# ... tool may set error to a string ...
if error is None:
    print("no error")
else:
    print("error was", error)
\`\`\`

Keep \`error\` as \`None\` or a string. Do not set it to \`False\` on success. Then you would have two success signals.

A function that returns \`True\` or \`False\` should return those exact objects, not \`1\` and \`0\`, and not \`"yes"\`. \`done() is True\` is a test you will write later. \`done()\` that returns \`"ok"\` will pass \`if done():\` and fail a strict test. Be boring. Return booleans from predicates. Return \`None\` from “no value yet.” Return \`0\` from “the count is zero.” Three names, three types.

## and, or, and empty values

You already saw \`and\`, \`or\`, and \`not\`. They use a truth test, not only real booleans. They also **return one of the inputs**, not always \`True\` or \`False\`.

\`name or "guest"\` is handy in a log. If \`name\` is \`"atlas"\`, you get \`"atlas"\`. If \`name\` is \`""\`, you get \`"guest"\`. It is the wrong tool if \`0\` is a legal measurement you must keep. \`0 or "missing"\` becomes \`"missing"\`, which is a lie.

\`x and y\` returns \`x\` if \`x\` is no, otherwise \`y\`. You do not need that trick yet. Prefer \`if\` when the reader must see the rule.

The indented line under \`if\` belongs to that \`if\`. That is the indent we flagged in the first lesson. Forget the indent, and Python raises \`IndentationError\`. Indent the body four spaces. Do not indent the \`if\` line itself.

## Common mistakes

- \`if result\` when \`0\` or \`""\` is a valid result.
- \`if error:\` when you meant \`if error is not None:\` — a missing error is \`None\`, which already counts as no, but an error string of \`""\` would also look like no.
- Writing \`true\` / \`false\` / \`none\` in lowercase.
- Using \`or "guest"\` on a counter.
- Comparing to the string \`"None"\`.
- Treating \`[0]\` as empty because it “has a zero.”

\`\`\`tryit python
result = 0
text = ""
items = []
error = None

print("bool(0) =", bool(result))
print("bool('') =", bool(text))
print("bool([]) =", bool(items))
print("error is None =", error is None)
print("bool('0') =", bool("0"))
print("bool([1]) =", bool([1]))

if result:
    print("if result ran")
else:
    print("if result skipped because 0 counts as no")

if error is None:
    print("error is missing, not zero, not blank")

print("0 or fallback =", result or "fallback")
print("'' or guest =", text or "guest")
\`\`\`

After you run it, set \`result = 5\` and confirm the \`if result\` branch runs. Then set \`result = 0\` again. Zero is the interesting case, not five.

## How agents use this

A missing tool result is \`None\`, not \`0\` and not \`""\`. An empty list means “no items,” and \`if\` treats it as no. Zero matches is a real answer, so do not write \`if result\` when result might be \`0\`. Check \`None\` with \`is None\`. Be exact, or the agent will stop for the wrong reason.

Stop conditions should use booleans you named: \`done = True\`, \`ok = False\`. Do not overload \`result\` as both “the number of hits” and “whether we got something.” If you need both, use two names: \`hits = 0\` and \`error = None\`. Then \`if error is None:\` means the tool ran. \`if hits == 0:\` means it found nothing. Those are different next actions: maybe finish, maybe try another query.

JSON null, missing keys, empty strings, and false booleans all show up in tool payloads. Map them on purpose at the edge: missing key → \`None\`, empty query → reject, \`ok: false\` → retry or stop. The truth test is a shortcut for *your* values. It is a trap for *the model’s* values. Be exact at the trust edge.

\`\`\`quiz
Why can if result lie when result is 0?
- *0 counts as False, even when 0 is a real answer
- 0 is the same as None
- print cannot show 0
- 0 is not a number
explain: A truth test treats 0, empty text, and empty lists as no. Use an exact check when those values are real answers.
\`\`\`
`,
  },
];
