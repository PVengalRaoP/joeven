import type { TrackSource } from "@/lib/types";

export const start: TrackSource = {
  slug: "start",
  title: "Getting Started",
  short: "Start",
  tagline: "What autonomous agents are, how this academy works, and how to think in loops.",
  color: "#4c3dff",
  order: 1,
  lessons: [
    {
      slug: "welcome",
      title: "Welcome to Joeven",
      summary:
        "What Joeven is, how each page works, what you will build, and how to learn agents without skipping the boring checks.",
      minutes: 18,
      level: "beginner",
      md: `
Joeven is a guided academy for **autonomous AI agents**. An autonomous AI agent is software that uses a **language model** as a brain, **tools** as hands, and a **loop** as a heartbeat. A language model (often called an LLM) is a program that predicts the next piece of text. A tool is a function the program is allowed to call, such as “look up a ticket” or “run a test.” A loop is the repeat of: look at the world, decide, act, look again.

This site exists because a chat box is not an agent. A chat box answers when you type. An agent can keep working while you are not typing: it reads a log, calls an API, checks a result, and only then writes a reply. Teams that skip that difference ship demos that cannot stop, cannot be tested, and cannot be billed honestly. Joeven starts at that difference and stays there.

People confuse Joeven with three other things. It is not a prompt-meme blog. It is not a CSS course. It is not vendor documentation for one agent framework. You will use Python, a little math, and a lot of boring checks. The cinematic part — the model “thinking” — is the smallest piece of a real agent. The rest is code, logs, tests, and stop rules.

## How a Joeven page works

Every lesson is one idea. You read it. You run the **live Python** box in the browser. You answer a short check. You continue when you are ready.

The live box runs **Pyodide**. Pyodide is Python inside the browser. There is no server and no API key. Output appears only if the code calls \`print\`. Your progress is stored in this browser. Complete track quizzes at 80% or more to unlock a **certificate** you can download.

| Part of a page | What you do | Why it is there |
|---|---|---|
| Teaching text | Read one idea in simple English | You cannot debug a thing you cannot name |
| Table or numbered steps | See the mechanism, not a slogan | Agents fail in the details |
| Walkthrough | Follow a ticket, a refund, or a job | Abstract words hide real work |
| Try it | Run Python locally in the browser | If you cannot run it, you do not own it |
| Quiz | Pick the accurate sentence | A check stops you from nodding along |
| Next lesson | Continue when the check is done | Learning is a loop with a stop |

Read the table once more in words. The teaching text gives you a name. The table shows the moving parts. The walkthrough is a story with a goal. The Try it box is a tiny program. The quiz is a stop condition for the page. That is the same shape you will later put around a model.

\`\`\`viz flow
title How a Joeven lesson works
layout lr
node read Read
node run Run
node check Check
node next Next
edge read run
edge run check
edge check next
caption Read one idea. Run the box. Pass the check. Continue. That is a loop with a stop.
\`\`\`

The stack you will master is the stack that actually ships agents:

1. **Python** — the language of tools, APIs, tests, and orchestration. **Orchestration** means code that calls other code in order, with retries and limits.
2. **Mathematics** — vectors, probability, gradients, information. You need enough to debug retrieval that “feels random.”
3. **Machine learning and transformers** — how models represent text and generate the next token. A **token** is a chunk of text the model reads or writes.
4. **LLMs, prompting, tools, RAG, memory** — the agent toolkit. **RAG** means retrieval-augmented generation: fetch facts, then generate.
5. **Architectures** — ReAct, planning, reflection, multi-agent systems. These are costumes on the same loop.
6. **Production** — evals, safety, cost, tracing, deploy. An **eval** is a test for model behavior. A **trace** is a log of every thought and tool result.

## A first evening on Joeven

Walk through a real student, not a slogan. Maya wants a support agent that can look up invoices. She has used ChatGPT. She thinks “agent” means a nicer chat box with a logo.

She opens this page. She learns that an agent is a loop with tools, not a skin on a chatbot. She runs the box below. It prints the track list and walks it like a tiny observe/act loop: see a name, mark it seen, go to the next name, stop at the end. That is not a model. It is the **shape**. She answers the quiz. The browser stores that she finished Welcome.

She does not paste an API key. She does not skip to multi-agent. She opens the next lesson, which defines an agent with four pieces: goal, observations, actions, and a policy. If she is rusty at Python, she still finishes this Getting Started track first, then does Python before math. That order is the product.

The money-honest version of this site is the same as tutorial sites for twenty years:

- Free tutorials (this is the product that ranks and teaches)
- Sponsor slots and a job board for agent-engineer roles
- Certificates that signal you actually finished the work

You can learn everything here for free. The certificate is proof of completion, not a job offer. Treat the projects as a portfolio.

## What you will be able to build

By the last project you will have built:

- A tool-using ReAct agent. **ReAct** means the model emits a thought and an action, then sees the result.
- A retrieval (RAG) support agent with citations
- A multi-agent software team (planner, coder, reviewer)
- An ops agent with human approval gates
- A long-running personal agent with memory

Those builds sit at the end. The path to them is not a weekend of copying YAML. It is functions that parse JSON, budgets that stop loops, and tests that fail when the agent lies.

> **Tip:** Do not skip Python or math if you are rusty. Agents fail in boring ways — JSON, off-by-one chunking, bad probabilities — not in cinematic ways.

\`\`\`tryit python
# Joeven is a list of tracks. An agent is a list of steps.
# Same shape: observe the next item, act, stop when the list ends.

tracks = [
    "start",
    "python",
    "math",
    "ml",
    "transformers",
    "llm",
    "prompt",
    "tools",
    "rag",
    "agents",
    "multiagent",
    "eval",
    "prod",
    "projects",
]

print("tracks on this academy:", len(tracks))

i = 0
while i < len(tracks):
    name = tracks[i]
    print("observe:", name)
    print("act: open that track when you reach it")
    i = i + 1

print("stop: map is complete")
print("next action: stay on Getting Started")
\`\`\`

The first line of output is the count: 14 tracks. Then the loop prints each name after the word \`observe\`, and a reminder to open that track later. It ends with a stop line and a next action. Change a name and run again. The loop does not care what the strings are. That is the point of a list and a stop.

## What goes wrong

- **Skipping the Try it box.** Reading is not running. If you never press Run, you will treat slogans as skills.
- **Jumping to multi-agent first.** A swarm of confused loops is still confused. Learn one loop with two tools.
- **Pasting API keys into Joeven.** These boxes are a classroom. Keys belong on your machine, in environment variables, later.
- **Expecting a GPU.** You do not need one for this academy. You need \`print\`, JSON, and a stop condition.
- **Treating the certificate as the goal.** The goal is a program you can test. The certificate is a receipt.
- **Copying quiz answers.** The quiz is a stop check. If you guess, the next lesson will feel random.
- **Confusing Joeven with a framework tutorial.** Frameworks come after you can write the loop in plain Python.
- **Stopping after Welcome.** Welcome is a map. The definition of an agent is the next page.

## Where this goes next

The rest of Getting Started defines the agent, the loop, the difference from chatbots and workflows, the learning map, setup and secrets, the triad of tokens/tools/goals, and a tiny agent with a fake model. After that, the **Python** track is not optional. **Math** and **ML** come before RAG so retrieval is not a black box. **Tools**, **eval**, and **production** are where shipped agents live. This page does not teach those tracks. It names them so you do not wander.

## How agents use this

Joeven itself is an agent-shaped product. Your goal is “I can ship a small, testable agent.” Each page is an **observation**. Running the box is an **action**. The quiz is a **stop check** for that page. Progress in the browser is **memory**. If you skip checks, you drift, the same way a model drifts when nobody verifies the goal.

When you write agent code later, copy this page’s habits, not its marketing.

- **Code:** one idea per function. Names like \`goal\`, \`step\`, \`budget\`, \`trace\`. No mystery helpers named \`data\` or \`tmp\`.
- **Logs:** print what you observed and what you did. If a run cannot be replayed from logs, you cannot improve it.
- **Tests:** a function that returns true when the goal is met. Write it before the loop. Welcome’s quiz is that idea in English.
- **Stop conditions:** max pages you skip, max hours you spend without a working \`print\`, no keys in the browser. Later: max steps, max cost, handoff to a human.

A student who finishes this page and immediately opens a 40-tool framework has not started. A student who can explain the table above, run the track-list loop, and say what Joeven is teaching has started.

\`\`\`quiz
What is Joeven primarily teaching?
- Website CSS tricks and page layout
- *Autonomous AI agents, from first principles to production
- Only prompt-engineering jokes and viral screenshots
- How to install GPU drivers
explain: Joeven is a full curriculum for building autonomous agents: Python, math, models, tools, architectures, and production. It is not a CSS course, a meme blog, or a driver guide.
\`\`\`
`,
    },
    {
      slug: "what-is-an-agent",
      title: "What Is an AI Agent?",
      summary:
        "An agent pursues a goal by observing, acting, and looping. The model is not the agent. The loop around the model is.",
      minutes: 20,
      level: "beginner",
      md: `
An **agent** is a system that **pursues a goal** by **observing** an environment and **taking actions** over time.

That sentence is older than ChatGPT. It is the definition from AI textbooks (Russell and Norvig): sensors in, actuators out, a **policy** in the middle. A sensor is anything the system can read. An actuator is anything it can change. A policy is the rule that maps “what I see” to “what I do next.”

A **language-model agent** uses an LLM as part of that policy. The model is not the agent. The agent is the **loop around the model**: the goal, the tools, the memory, the stop rules, and the code that calls the model again after each observation. If you only have a model, you have a text generator. If you have a loop that can act without a human in every step, you have an agent.

People confuse three nearby things. A **chatbot** replies in language and waits. A **workflow** (a fixed pipeline) runs steps you already drew. An **agent** chooses the next step because the path is not known in advance. Marketing uses “agent” for anything with a chat box. Engineers should keep the word for systems that act in a loop toward a goal.

## The four pieces

| Piece | Role | Example |
|---|---|---|
| Goal | What “done” means | “Open a PR that fixes the failing test” |
| Observations | What the agent can read | Test logs, files, web pages, user messages |
| Actions | What the agent can do | Call APIs, run code, search, message a human |
| Policy | How it chooses the next action | An LLM plus code plus memory plus rules |

**Goal.** If you cannot write a check for “done,” you do not have a goal. You have a vibe. “Be helpful” is a vibe. “Return a GitHub issue URL whose body contains a reproducible test” is a goal.

**Observations.** These are the inputs after each action: tool results, files, error messages, the user’s last sentence. If the agent cannot see a fact, the policy cannot use that fact. Hidden logs are not observations.

**Actions.** These are the allowed verbs. Search, run tests, post a comment, refund, stop. An action with no permission in code is a wish. An action with too much permission is an incident.

**Policy.** This can be a boring \`if\` statement. It can be an LLM that returns a tool name. It can be an LLM plus rules that forbid some tools. Intelligence can come later. The **shape** is already an agent if these four pieces exist and they loop.

\`\`\`viz loop
title An agent is a loop
step Observe
step Think
step Act
step Stop
caption Look at the world. Decide. Do something. Stop when the goal is met. The model sits in Think. The loop is the agent.
\`\`\`

If any piece is missing, you do not have an agent. You have a demo. A model with no tools is a chatbot. Tools with no goal are a script someone clicks. A goal with no stop is a bill that never ends.

## Autonomy is a slider, not a switch

**Autonomy** means how much the system may do without asking you. It is not a badge. It is a risk setting.

- **Level 0** — autocomplete. Human does everything. The model finishes a line.
- **Level 1** — chatbot. Model replies. Human still acts in the world (copy, paste, click).
- **Level 2** — tool-using copilot. Model may call functions. Human approves anything that changes money, data, or production.
- **Level 3** — agent. Model loops: think, act, observe, think, until a stop condition.
- **Level 4** — long-running or multi-agent. Hours to days, multiple specialists, human on-call.

Joeven focuses on levels 2–4. Level 1 is useful. It is not this course’s product. Most companies should live at level 2 until they have evals (tests for behavior) and traces (logs of each step). Jumping to level 4 because a slide said “multi-agent” is how you get four loops arguing and one customer refunded twice.

## A ticket, then a tiny umbrella

A support ticket arrives: “It is raining and I am about to leave. Do I have an umbrella?” That sounds like a chatbot question. As an agent problem it has four pieces.

Goal: if it is raining, the user should have an umbrella before they leave. Observation: a tiny world dictionary, \`raining\` and \`has_umbrella\`. Actions: \`take_umbrella\` or \`stop\`. Policy: if raining and no umbrella, take one; otherwise stop.

No LLM is required. The policy is an \`if\` statement. That is the point. When you later replace \`policy\` with a call to a model that returns an action name, the loop does not change. The world might be a ticket API instead of a dictionary. The action might be \`issue_refund\` instead of \`take_umbrella\`. The shape stays.

Stop conditions belong in the same design. An agent that cannot stop is a denial-of-service attack against your wallet.

- **Success:** the goal check is true (if raining, umbrella is true).
- **Failure:** too many steps, too much money, a forbidden action.
- **Handoff:** ask a human, then halt.

Write those three before you add tools.

\`\`\`tryit python
goal = "have_umbrella_if_rain"

world = {"raining": True, "has_umbrella": False}

def observe(world):
    # Sensors: copy what the agent is allowed to see.
    return dict(world)

def act(world, action):
    # Actuators: only this verb can change the world.
    if action == "take_umbrella":
        world["has_umbrella"] = True
    return world

def policy(obs, goal):
    # The brain. Later this can call an LLM. Today it is an if.
    if goal == "have_umbrella_if_rain":
        if obs["raining"] and not obs["has_umbrella"]:
            return "take_umbrella"
    return "stop"

def goal_met(world, goal):
    if goal != "have_umbrella_if_rain":
        return False
    if world["raining"]:
        return world["has_umbrella"] is True
    return True

obs = observe(world)
steps = 0
while steps < 5:
    action = policy(obs, goal)
    print("obs:", obs, "-> action:", action)
    if action == "stop":
        break
    world = act(world, action)
    obs = observe(world)
    steps = steps + 1

print("done:", world)
print("steps used:", steps)
print("goal met:", goal_met(world, goal))
\`\`\`

First the program prints the starting observation: raining true, no umbrella, so the policy chooses \`take_umbrella\`. After the action it prints the new observation: raining true, umbrella true, so the policy chooses \`stop\`. Then it prints the final world, how many steps were used (1), and that the goal is met. Set \`raining\` to \`False\` and run again. The first action should be \`stop\`, steps used 0, goal still met — because the goal only requires an umbrella **if** it rains.

> **Note:** Marketing uses “agent” for anything with a chat box. Engineers should keep the word for systems that **act in a loop toward a goal**.

## What goes wrong

- **Calling the LLM the agent.** Then you cannot say who owns stop rules, tools, or logs. The model is a component.
- **No goal check.** The loop “finishes” when the model writes a cheerful sentence. That is a chatbot with extra steps.
- **No observations.** The policy guesses. Guessing looks fluent and is still guessing.
- **Actions that are not real.** The model says “I refunded you” but no function ran. Speech is not an actuator.
- **Autonomy at 100% on day one.** Irreversible tools (refund, delete, email all customers) without a human gate.
- **Infinite loop.** No max steps. The umbrella policy would be harmless. A paid search tool would not.
- **Hidden policy.** Prompt in a wiki, tools in another repo, stop rules in someone’s head. If it is not in code, it is not the policy.
- **Level mix-up.** A chatbot with one button labeled “Agent” is still level 1.

## Where this goes next

The next lesson is the loop in slow motion: assemble context, ask the model, parse, execute, append, repeat. Later, the **tools** track turns actions into real APIs. **Evals** turn \`goal_met\` into a suite. **Production** adds tracing and spend limits. **Multi-agent** is level 4, after one agent is honest. This page only gives you the four pieces and the slider.

## How agents use this

When you implement an agent, start from the table, not from a framework name.

Put the goal in code as a function that returns true or false. Put observations in a typed object you log. Put actions in a list the model is allowed to name. Put the policy behind one function so you can swap an \`if\` for an LLM without rewriting the loop.

- **Code:** \`observe\`, \`act\`, \`policy\`, \`goal_met\`, and a \`while\` with a cap. Keep world state separate from the policy so tests can feed fake observations.
- **Logs:** every step should print observation, action, and whether the goal is already true. That list is the ancestor of a production trace.
- **Tests:** rain and no umbrella must take the umbrella. Rain and umbrella must stop. No rain must stop. A missing action name must not crash the world into a random state.
- **Stop conditions:** success via \`goal_met\`, failure via max steps or forbidden action, handoff via an action named \`ask_human\` that ends the loop.

Replace \`policy\` with a call to an LLM that returns an action name, and you have a modern agent. The loop did not change. The rest of Joeven is how to make that swap reliable.

\`\`\`quiz
Which statement is most accurate?
- The language model by itself is the agent
- *The agent is the loop: goal, observations, actions, and a policy (often an LLM)
- Agents are forbidden from using tools
- Autonomy means you skip tests
explain: Models are a component. The agent is the closed loop around goals, observations, and actions. Tools are how it acts. Tests are how you know the goal is real.
\`\`\`
`,
    },
    {
      slug: "the-agent-loop",
      title: "The Agent Loop",
      summary:
        "Think, act, observe, repeat. Each turn adds tokens and a trace. Stop on success, budget, or a human handoff.",
      minutes: 21,
      level: "beginner",
      md: `
Every serious agent library is a costume on the same loop. The library may say ReAct, plan-and-execute, or “crew.” Under the costume, a program is still doing this:

1. **Assemble context** (goal, memory, observations, tool docs)
2. **Ask the model** what to do next
3. **Parse** a thought, a tool call, or a final answer
4. **Execute** tools in the real world
5. **Append results** to context
6. **Repeat** until a stop condition

\`\`\`viz loop
title Think, act, observe, repeat
step Assemble
step Ask
step Act
step Repeat
caption Each turn adds tokens and a trace. Stop on success, a budget, or a human handoff.
\`\`\`

This is **ReAct** when the model is asked to emit reasoning plus an action. **Reasoning** here means text the model writes before it names a tool — not a guarantee of truth. It is **plan-and-execute** when step 2 produces a whole plan first, then later steps run the plan. It is **multi-agent** when step 4 is “ask another agent.” The loop did not become a different species. The action got bigger.

People confuse the loop with “the model thinking forever.” Thinking is cheap to say and expensive to run. Each turn **rewrites history**. The model does not remember the previous call. You send the growing transcript again. Context grows. Cost grows. Attention gets noisier. That is why later tracks spend time on memory, retrieval, and summarization — not because they are fashionable, but because the loop is otherwise unbounded.

## What each step is doing

| Step | Name | What you put in code |
|---|---|---|
| 1 | Assemble | Goal string, tool schemas, last tool results, maybe a summary of old steps |
| 2 | Ask | An API call (or a fake script in this classroom) |
| 3 | Parse | JSON or a strict pattern: tool name plus args, or final text |
| 4 | Execute | A Python function with timeouts, not a wish in prose |
| 5 | Append | The true result, even when it is an error |
| 6 | Repeat or stop | Success check, max steps, max cost, or handoff |

**Assemble.** If you forget tool docs, the model invents APIs. If you dump the entire company wiki, you pay for noise and you hide the goal.

**Ask.** This is the only step that looks like “AI.” Treat it as a function from transcript to decision.

**Parse.** Models emit messy text. Your parser must fail loud when the shape is wrong. Silent repair is how you execute the wrong tool.

**Execute.** This is the real world: HTTP, SQL, files, refunds. It needs permissions, timeouts, and an allow-list of names.

**Append.** If a tool fails and you hide the error, the next ask repeats the same call. Errors are observations. Keep them short and true.

**Repeat or stop.** No stop is not “more autonomous.” It is a runaway process.

## Why loops eat tokens

A **token** is a chunk of text the model reads or writes. You pay for input tokens and output tokens. On step 1 the input is the goal. On step 10 the input is the goal plus nine tool results plus nine model messages. A 20-step run can cost many times a single chat.

Implications you will implement later, named only so the cost is not a surprise:

- Keep tool results short
- Summarize old steps
- Retrieve only the chunks you need
- Prefer small models for routing and big models for hard reasoning

The **trace** is the list of thoughts, calls, and results. It is the most important artifact you will produce in production. You cannot eval, debug, or bill without it.

## A warehouse ticket in slow motion

A warehouse system asks: “We have 3 pallets of 4 boxes. Each box ships in packs priced as 10. What is the number we need?” A human would add 3 and 4, then multiply by 10. An agent with two tools, \`add\` and \`mul\`, should do the same: call \`add\`, see 7, call \`mul\`, see 70, then stop with a final sentence.

In production, step 2 would be a model. In the box below, step 2 is a **script** — a hard-coded list of decisions. The script stands in for an LLM. That is honest. You can see the loop without paying for tokens. Notice that the script does **not** read the prior result. It already “knows” to multiply 7 and 10. A real model would have to look at the trace. The surrounding code — tools, events, stop on \`final\` — is the part you keep.

\`\`\`tryit python
import json

tools = {
    "add": lambda a, b: a + b,
    "mul": lambda a, b: a * b,
}

# A fake model: it "decides" from a script of tool calls.
# A real model would read the trace. This script does not.
script = [
    {"type": "tool", "name": "add", "args": {"a": 3, "b": 4}},
    {"type": "tool", "name": "mul", "args": {"a": 7, "b": 10}},
    {"type": "final", "text": "The result is 70"},
]

trace = []
for step, decision in enumerate(script, start=1):
    if decision["type"] == "tool":
        name = decision["name"]
        args = decision["args"]
        result = tools[name](**args)
        event = {"step": step, "call": name, "args": args, "result": result}
        trace.append(event)
        print(json.dumps(event))
    else:
        print("FINAL:", decision["text"])
        break

print("tool calls in trace:", len(trace))
print("last result:", trace[-1]["result"])
\`\`\`

You should see two JSON lines. The first is step 1, \`add\`, arguments 3 and 4, result 7. The second is step 2, \`mul\`, arguments 7 and 10, result 70. Then a line that starts with \`FINAL\` and the sentence about 70. Then the count of tool calls (2) and the last result (70). If you change the script’s multiply inputs, the final sentence will lie unless you change it too. That lie is **premature stop** in miniature: words that do not check the trace.

## What goes wrong

- **Infinite retry.** The tool fails. The model calls it the same way again. The trace grows. The bill grows. The bug stays.
- **Goal drift.** The user asked for a number. The model starts writing a warehouse essay. Neighboring problems feel helpful.
- **Context rot.** Old errors stay in the prompt. The model imitates the errors. Failed JSON becomes a style.
- **Premature stop.** The model claims success without reading the last tool result. Cheerful. Wrong.
- **Tool hallucination.** It invents \`multiply_boxes\` because that name sounds right. Your execute step must reject unknown names.
- **Parse mush.** You accept free-form text as a tool call. Sometimes it works. Then it refunds the wrong id.
- **No trace.** You cannot say which step burned the tokens. You cannot write an eval. You cannot replay.
- **Stop only on keyboard interrupt.** That is not a product. That is a process you kill by hand.

You will build defenses for each of these in later tracks: schemas, retries with wait, evals, allowed-tool lists, and “verify before final.” This lesson only names the failures so you can see them in the loop.

> **Tip:** Log every thought and tool result. If you cannot replay a run, you cannot improve a run.

## Where this goes next

**Prompting** and **structured output** are how step 3 stops being a hope. **Tools** is how step 4 becomes an API with a schema. **RAG** and **memory** are how step 1 stays small. **Agents** (the architecture track) puts costumes on this loop. **Evals** score traces. **Production** stores traces and caps spend. Do not skip the fake script. If you cannot follow two JSON lines, a live model will only hide the same loop in poetry.

## How agents use this

The loop is the product. Frameworks are optional. Your code should make the six steps visible.

- **Code:** a \`run\` function with a list of tools, a transcript, a parser, and a \`max_steps\` integer. One function per tool. Unknown tool names return an error object, not an exception that kills the process without a log.
- **Logs:** append one event per step: step number, tool name, arguments, result, tokens if you have them. The classroom \`json.dumps(event)\` is the seed of that log.
- **Tests:** feed a scripted model (like the list above) and assert the trace has two calls and a final. Then feed a model that tries an unknown tool and assert you stop with an error, not a hang.
- **Stop conditions:** success when a \`final\` decision appears **and** a check function agrees with the last result; failure when \`max_steps\` or a cost cap hits; handoff when the parser sees \`ask_human\`.

If you remember one sentence: the trace is the agent’s memory of the loop, and the stop condition is the agent’s contract with your wallet.

\`\`\`quiz
What should stop an agent loop?
- Nothing — let it think until the process dies
- *A success check, a max-step or max-cost limit, or a human handoff
- Only a keyboard interrupt from whoever is watching
- Deleting the system prompt so the model forgets the goal
explain: Stop conditions are part of the agent contract: success, budget, or escalation. Infinite thought is not autonomy. It is an unbounded bill.
\`\`\`
`,
    },
    {
      slug: "agents-vs-chatbots",
      title: "Agents vs Chatbots vs Workflows",
      summary:
        "Chatbots reply. Workflows follow your flowchart. Agents choose the next step. If you can draw the path, do not use an agent.",
      minutes: 20,
      level: "beginner",
      md: `
Three designs get mixed up in product meetings. They all might contain an LLM. They are not the same product. If you pick the wrong one, you will spend months “debugging the agent” when you actually needed a flowchart.

A **chatbot** takes a user message and returns an assistant message. It may use RAG (fetch a document, then answer). It has **no side effects** unless the user copies something and does the work. Good for Q&A, drafting, tutoring.

A **workflow** (also called a graph, pipeline, or DAG) is a path **you** already know. A **DAG** is a directed acyclic graph: steps with arrows, no loops that run forever by design. Example: extract, retrieve, generate, validate, save. An LLM may sit **inside** a step. Control flow is **your code**. Good for invoice processing, deterministic ETL with an LLM extract, most business automation. **ETL** means extract, transform, load — move data from one place to another in known stages.

An **agent** is the design where the model **chooses** the next step. You cannot write the DAG in advance because the path depends on observations. Good for research, messy debugging, computer use, open-ended ops, games, coding until tests pass.

People confuse them because demos look the same: a text box, a spinner, a paragraph. The difference is **who owns the branch**. If your code always classifies, then retrieves, then answers, you have a workflow even if a vendor stamped “agent” on the repo.

## Side by side

| Design | Who chooses the next step | Side effects | When to use |
|---|---|---|---|
| Chatbot | There is no next step in the world | None, unless the user acts | Q&A, drafts, tutoring |
| Workflow | Your code / your flowchart | Yes, in known steps | Invoices, ETL, most business automation |
| Agent | The model, inside a loop | Yes, chosen at run time | Unknown search path, unknown files, unknown tools |

**Chatbot.** Cheap to eval as “did the answer match the doc.” Hard to mistake for an agent unless you add tools and forget to say so.

**Workflow.** You can test step 2 without calling a 70B model. You can log which step failed. You can put schema validation after extract. This is the default for money-moving systems.

**Agent.** You need a trace, a budget, and a small tool list. You need evals that score trajectories, not just final prose. You need a human gate for irreversible actions.

\`\`\`viz flow
title A chatbot waits. A workflow is a line.
layout lr
node extract Extract
node check Check
node write Write
edge extract check
edge check write
caption You already know the path. Chatbots are an even shorter line: message in, reply out. If you can draw it, do not wrap it in an agent.
\`\`\`

\`\`\`viz flow
title An agent is a cycle
layout cycle
node obs Observe
node think Think
node act Act
edge obs think
edge think act
edge act obs
caption The next step depends on what just happened. That is when the model should choose. Still keep a small tool list and a stop.
\`\`\`

## The expensive mistake

Teams wrap a two-step workflow in an agent framework, then spend months debugging why the model skipped step 2.

**Rule:** if you can draw the flowchart without a diamond that says “LLM decides,” it is a workflow. Use a workflow.

Even when you need an agent, **constrain the action space**. An agent with 8 tools beats an agent with 80 tools. Unknown number of searches, unknown files, unknown whether the task is possible — those are agent-shaped. “Always extract, then write to the database” is not.

Autonomy without evals is just randomized production incidents.

## A billing ticket that should not be an agent

A ticket says “My invoice is wrong.” Another says “The runner crashed.” A third mixes both. Product wants “an agent that handles support.”

Look at the path you already know: classify the ticket, fetch two canned docs for that kind, return the first doc as the answer plus sources. That is three steps. You can write them in Python. In production, classify might be an LLM call with a schema: \`billing\` or \`tech\`. Retrieve might be a database. Answer might be a template. The LLM never chooses to skip retrieve. That is a feature.

The box below is that workflow. Control flow is in Python. You can test it without mocking a giant model. Watch what happens on a mixed ticket that contains both “invoice” and “runner.” A brittle \`if "invoice" in ticket\` will pick billing and ignore the crash. That is a workflow bug you can see. An agent would hide the same bug inside a trace.

\`\`\`tryit python
def workflow(ticket):
    # Step 1: classify (in production this can be an LLM call)
    kind = "billing" if "invoice" in ticket.lower() else "tech"
    # Step 2: retrieve
    docs = {
        "billing": ["Refunds take 5-7 days", "Invoices are in /billing"],
        "tech": ["Restart the agent runner", "Check API_KEY"],
    }[kind]
    # Step 3: answer
    return {"kind": kind, "answer": docs[0], "sources": docs}

print("invoice ticket:", workflow("My invoice is wrong"))
print("runner ticket:", workflow("The runner crashed"))
print("mixed ticket:", workflow("Where is last month invoice after the runner crashed"))
\`\`\`

The first print is billing, answer about refunds, both billing docs as sources. The second is tech, restart the runner. The third is also billing, because the string contains \`invoice\`. The crash is ignored. That output is the lesson: a workflow makes the branch visible. If you need both topics, you change **your** classify step (for example, allow two kinds). You do not give a model eight unrelated tools and hope.

## When the LLM should choose

Use an agent when the **branching factor** is high. Branching factor means how many next steps are plausible.

- Unknown number of searches
- Unknown files to open
- Unknown tools (calendar? browser? shell?)
- Unknown whether the task is even possible

Still constrain tools. Still write a goal check. Still prefer a workflow for the parts you **do** know. Hybrid systems are normal: a workflow that calls a small agent inside one diamond, then returns to your code.

> **Warning:** Autonomy without evals is just randomized production incidents.

## What goes wrong

- **Agent-washing a workflow.** Two known steps, wrapped in ReAct, now skip step 2 at 3 a.m.
- **Chatbot with a refund button in prose.** It says it refunded. No function ran. The customer waits. Finance is confused.
- **Eighty tools.** The model picks a nearby wrong one. Narrow APIs beat a Swiss army knife.
- **No schema after extract.** The workflow writes junk rows to the database. The agent version writes junk rows **and** wanders.
- **Mixed tickets with one keyword.** Like the Try it box. Keyword classify is a start, not a product.
- **Swarm first.** Multiple agents for a three-step invoice pipe. You added coordination cost and no new information.
- **User-facing “agent” that cannot act.** It is a chatbot. Call it a chatbot so people do not expect side effects.

## Where this goes next

**Tools** will show how to wrap one function so either a workflow or an agent can call it. **Prompting** is how a classify step returns JSON instead of a poem. **Evals** are how you catch the mixed-ticket failure with a test. **Multi-agent** is for when roles truly split, not for invoice extract. **Production** is queues and approval gates for the side effects. This lesson only teaches you to name the three designs.

## How agents use this

Default to a workflow. Promote a step to an agent only when you can say which observation would change the path.

- **Code:** write the flowchart as functions in order. If a step needs an LLM, that function returns data, not “whatever the model felt.” Keep an allow-list of kinds (\`billing\`, \`tech\`) rather than free text.
- **Logs:** log \`kind\`, retrieved ids, and whether a side effect ran. For an agent, log each chosen tool. For a workflow, log each step name. Same idea, shorter traces for workflows.
- **Tests:** invoice wording must classify billing. Runner wording must classify tech. Mixed tickets must match the rule you document — two labels, or a priority — not a surprise.
- **Stop conditions:** workflows stop at the end of the graph, plus validation failure. Agents stop on goal, budget, or handoff. Do not run an agent loop around a graph that already has an end.

You must extract fields from PDFs, then write rows to a database? That sentence already is a workflow. Put the model inside extract. Validate the schema. Then write. The next lesson is the map of Joeven so you know where classify, tools, and evals will be taught.

\`\`\`quiz
You must extract fields from PDFs, then write rows to a database. What should you build first?
- A multi-agent swarm that debates each PDF
- *A workflow with an LLM extract step and schema validation
- A chatbot with no tools and no database write
- An infinite ReAct loop until the model feels done
explain: The steps are known: extract, validate, write. That is a workflow. Put the model inside a typed step. A swarm, a mute chatbot, or an unbounded loop does not match the job.
\`\`\`
`,
    },
    {
      slug: "learning-path",
      title: "The Learning Path",
      summary:
        "Joeven is ordered like a degree, compressed: Python, math, models, the agent stack, then projects. Skip around only after the foundation.",
      minutes: 19,
      level: "beginner",
      md: `
Joeven is ordered like a degree, compressed. A degree would spend months on each layer. You will spend lessons. The order still matters. Later tracks assume you can write a function, parse JSON, and say what a vector is for.

This path exists so you do not learn RAG as a vendor button, then freeze when ranking looks random. It also exists so you do not learn “multi-agent” as a group chat, then freeze when two roles copy the same file. The academy is a stack. Each layer holds the next.

People confuse the path with a buffet. A buffet says “start anywhere.” That is fine for recipes. It is a bad idea for agents. If you cannot parse JSON, your tool layer is theater. If you cannot say what a probability is, your eval numbers are theater. You may peek ahead. You should not skip the foundation and hope.

## The map

| Layer | Tracks | What you gain |
|---|---|---|
| Foundation | Python, math | Programs, tests, vectors, probability |
| Models | ML, transformers, LLMs | Data to loss to eval; tokens; APIs and cost |
| Agent stack | Prompt, tools, RAG, agents, multi-agent | JSON in/out, hands, memory, loop costumes, roles |
| Proof | Evals, production, projects | Tests for behavior, tracing, a portfolio |

\`\`\`viz flow
title The order of the academy
layout lr
node py Python
node math Math
node models Models
node tools Tools
node agents Agents
node proof Projects
edge py math
edge math models
edge models tools
edge tools agents
edge agents proof
caption Python and math first. Then models. Then tools and the agent loop. Projects last. Skip a layer and the next one is a black box.
\`\`\`

**Python** is not optional. Agents are programs. You will write parsers, retries, tests, and HTTP clients. If you cannot write a function that parses JSON and raises a useful error, you cannot ship an agent. The browser boxes use only the Python standard library. Your laptop will add packages later.

**Math** is the language of embeddings, attention, loss, sampling, and Bayesian update. An **embedding** is a list of numbers that stands for a piece of text. You do not need a PhD. You need vectors, matrices, derivatives, probability, and entropy well enough to debug a retrieval system that “feels random.”

**Machine learning** teaches the habit: data, model, loss, eval. **Transformers** explain tokens, attention, and why context windows matter. A **context window** is the maximum number of tokens the model can read at once. **LLMs** are the APIs, costs, decoding, and failure modes you will live with.

The agent stack, in the order you will meet it:

- **Prompting and structured output** — how to talk to the model so it talks back in JSON
- **Tools and MCP** — how the model touches the world. **MCP** is a way to expose tools over a standard interface. You will meet the idea later, not here.
- **RAG and memory** — how it knows things that were not in the weights
- **Architectures** — ReAct, plan-execute, reflection, state machines
- **Multi-agent** — when to split roles
- **Evals and safety** — how you know it works and how it fails closed
- **Production** — tracing, queues, secrets, deploy, cost

**Projects** are five builds, beginner to advanced. Theory you cannot run is trivia. Treat projects as a portfolio, not as extra homework you skip.

## Time

If you already write Python, expect **4–8 weeks** at 8 hours per week to finish the core plus two projects. If you are starting from scratch, budget **3–4 months** and do every exercise. Those numbers assume you run the boxes and fail sometimes. Skimming quizzes in a weekend is not the same clock.

## Sam’s eight weeks

Sam can write Python at work but has not touched probability since school. Week 1 is Getting Started and a Python refresh: functions, JSON, errors, tests. Week 2 is math: vectors and probability until cosine similarity is not a magic word. **Cosine similarity** is a way to score how close two embeddings are. Week 3 is ML and transformers at a conceptual level — enough to know why a long transcript hurts. Week 4 is LLM APIs, cost, and prompting with a schema.

Weeks 5–6 are tools, RAG, and the agents track: one loop, then costumes. Week 7 is evals and a small production checklist: traces, keys, a spend cap. Week 8 is a project: a tool-using agent with tests. Sam does not start a multi-agent “company of gnomes” in week 1. When RAG ranking looks random in week 6, Sam has math words for it.

If Sam had started at RAG, week 6 would have been “tune the prompt” forever.

\`\`\`tryit python
path = [
    "start",
    "python",
    "math",
    "ml",
    "transformers",
    "llm",
    "prompt",
    "tools",
    "rag",
    "agents",
    "multiagent",
    "eval",
    "prod",
    "projects",
]
print("tracks:", len(path))
print(" -> ".join(path))
print("math index:", path.index("math"))
print("rag index:", path.index("rag"))
print("math comes before rag:", path.index("math") < path.index("rag"))
\`\`\`

The first line is 14. The second is the whole map joined with arrows. Then math’s position (2 if you count from 0), RAG’s later position, and \`True\` for “math comes before rag.” That boolean is the quiz hiding in a print. Change the list order and the boolean flips. The academy’s order is a choice, not a law of physics — but it is the choice that makes RAG debuggable.

> **Tip:** Use the left sidebar like a textbook table of contents. Skip around only after you have finished Python and the agent loop lessons.

## What goes wrong

- **Skipping Python because “the model writes code.”** The model writes code that you must read, test, and refuse. That is Python skill.
- **Skipping math because RAG has an API.** When scores look random, the API will not explain cosine or priors.
- **Framework first.** You learn a brand, not the loop. The brand changes. The loop does not.
- **Project first with no evals.** A demo on Friday, a silent failure on Monday.
- **Multi-agent as a personality test.** Split roles only when one loop is honest and overloaded.
- **Treating time estimates as guilt.** Slow is fine. Skipping checks is not.
- **Sidebar tourism.** Opening every track, finishing none. The map is ordered so you can stop wandering.

## Where this goes next

The next lesson is **setup**: Python on your machine, virtual environments, API keys, and the habit of treating model output as untrusted. After this Getting Started track, **Python** is the first long track. Do not wait for **tools** to learn functions. Do not wait for **eval** to learn \`assert\`. Peek at **projects** so you know the destination. Come back to the map when you feel lost. The Try it list is the sidebar in text form.

## How agents use this

A curriculum is a workflow with a goal. Your goal is a testable agent in the project track. Observations are quiz results and whether a Try it box ran. Actions are “do the next lesson” or “repeat Python.” Stop is “this lesson’s check passed,” not “I opened 12 tabs.”

When you build learning features **into** an agent (a tutor, an onboarding bot), use the same map discipline.

- **Code:** store progress as a list of finished slugs, like \`path\` above. Do not invent a second map in a prompt.
- **Logs:** record which lesson, which quiz outcome, which box was run. That is a trace of learning, not a vibe of “user is engaged.”
- **Tests:** math index is before RAG index. Python is in the list. A “skip to multiagent” button still shows a warning if Python is unfinished — if you build such a button at all.
- **Stop conditions:** for a student, stop skipping when Python and the agent loop are done. For a tutor agent, stop tutoring and hand off when the user asks for medical or legal advice, or when the budget for tokens hits a cap.

The path is long on purpose. Agents fail in the layers you skipped.

\`\`\`quiz
Why does Joeven teach math before RAG?
- To make the syllabus look longer
- *Because retrieval quality is geometry and probability, not just API calls
- Math is required by the domain registrar
- Transformers cannot run unless you finish calculus homework
explain: Embeddings, similarity, ranking, and sampling are mathematical. Skipping math makes RAG a black box you cannot debug. The registrar and homework jokes are not the reason.
\`\`\`
`,
    },
    {
      slug: "setup",
      title: "Setup: Python, Keys, and Safety",
      summary:
        "Install Python, use a virtual environment, load keys from the environment, and treat every model output as untrusted.",
      minutes: 21,
      level: "beginner",
      md: `
You can run most Joeven **Try it yourself** boxes in the browser. For projects, use a real machine. This lesson is the bridge: what to install, where secrets live, and which safety habit starts today.

It exists because agents touch APIs, files, and sometimes money. A leaked key is not a vibe. It is a billing event. An \`eval\` of model-written code on your laptop with full permissions is not a shortcut. It is a way to run an attacker’s instructions with your login.

People confuse setup with “install a 40-package agent framework.” You do not need that yet. You need Python 3.11 or newer, a **virtual environment**, and a place for keys that is not git. A virtual environment (venv) is a private folder of packages for one project so course libraries do not collide with the rest of your computer. You also do not need a GPU, Kubernetes, or a vector database account to begin.

## Python on your machine

Install Python 3.11+ from [python.org](https://www.python.org/downloads/). On Windows, tick **Add python.exe to PATH**. **PATH** is the list of folders your system searches for programs.

Create a virtual environment, turn it on, then upgrade \`pip\`. **pip** is the program that installs packages into the venv.

\`\`\`bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install --upgrade pip
\`\`\`

When the venv is on, \`python\` and \`pip\` use that folder. When you are done, type \`deactivate\`. Do not commit the \`.venv\` folder to git. Commit a list of packages later, when you have one.

## Packages you will actually use

Not fifty frameworks. A small core on your laptop:

- \`httpx\` or \`requests\` — HTTP. **HTTP** is how programs ask servers for data.
- \`pydantic\` — schemas. A **schema** is a description of what fields and types you allow.
- \`pytest\` — tests
- One vendor SDK when you need it (\`openai\`, \`anthropic\`, and similar)

Frameworks (LangChain, CrewAI, AutoGen, smolagents) are optional **after** you can write the loop yourself. Joeven teaches the loop first. Joeven’s browser has **no pip** and **no network**. Live boxes stay on the **standard library** — modules that come with Python, such as \`os\`, \`json\`, and \`math\`.

| Place | What you install |
|---|---|
| Joeven Try it box | Nothing. Standard library only |
| Your laptop | venv, then a short package list |
| Production | The same list, pinned, plus a secret manager |

## API keys

An **API key** is a secret string that proves you may call a vendor. Never paste keys into Joeven, GitHub, or a screenshot.

- Store keys in **environment variables** or a local \`.env\` file that is gitignored. An environment variable is a name your operating system keeps, like \`WEATHER_API_KEY\`, that programs can read without baking the value into source code.
- Restrict keys by origin and spend limit in the vendor dashboard
- Use a **separate key** for experiments with a hard monthly cap

\`\`\`viz flow
title Keys do not live in the browser
layout lr
node site Joeven
node no No keys
node env Env var
node app Your app
edge site no
edge env app
caption These boxes are a classroom. Load secrets from the environment on your laptop. Never paste a key here.
\`\`\`

If a key leaks, revoke it immediately. Then rotate (make a new key, delete the old one). Then check billing.

## A leaked-key story

Alex commits a file named \`demo.py\` with a real key in a string so “the team can run it.” GitHub scanners may catch it. Bots may catch it first. Overnight the experiment key is used from another country. The dashboard shows a spend spike. Alex revokes the key, but the commit still lives in history until it is treated as burned forever.

The fix is not a comment that says “do not share.” The fix is: load the key from the environment, fail if it is missing, never print the full value, never put it in the prompt. The classroom box simulates \`os.environ\` because the browser is not your laptop. The pattern is the same.

\`\`\`tryit python
import os

# DEMO: we simulate env vars. In real code, set them in the OS.
os.environ["WEATHER_API_KEY"] = "sk-demo-not-real"

def load_key(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError("Missing environment variable " + name)
    if value.startswith("sk-demo"):
        return value  # allowed in this classroom
    return value

key = load_key("WEATHER_API_KEY")
print("loaded key length:", len(key))
print("redacted prefix:", key[:7] + "...")
print("never print the full key in production logs")

missing_name = "OTHER_API_KEY"
missing = os.environ.get(missing_name, "").strip()
print("missing key empty:", missing == "")
\`\`\`

You should see the length of the demo string, a redacted prefix \`sk-demo...\`, the reminder not to log full keys, and \`True\` for the missing name. The loader concatenates the error text with the variable name; it does not use an f-string. In production you would raise if \`OTHER_API_KEY\` were required. Here we only show that \`get\` returns empty rather than crashing the demo. Try deleting the \`os.environ[...]\` line and calling \`load_key("WEATHER_API_KEY")\` — you should get a runtime error that names the variable, not a silent empty key.

> **Warning:** If a key leaks, revoke it immediately. Then rotate. Then check billing.

## What you do not need yet

- A GPU
- Kubernetes
- Fine-tuning
- A vector database account (we will simulate first, then you can bring Pinecone, pgvector, or Chroma)

## Safety default

Treat every model output as **untrusted**. It can be wrong, leaked, or **prompt-injected**. Prompt injection means untrusted text (a web page, an email, a ticket) that tries to change the model’s instructions. Later lessons make this precise. The habit starts now: validate JSON, sandbox tools, never \`eval\` model-generated code on your laptop with full permissions. Joeven lessons will not use \`exec\`. You should not either for model text.

## What goes wrong

- **Key in the prompt.** The transcript gets logged. The log is copied. The key is gone.
- **Key in git.** History keeps secrets after you delete them from the latest file.
- **One key for prod and play.** A toy loop burns the production spend cap.
- **Full key in \`print\`.** The same habit that helped you debug now ships secrets to log software.
- **pip install a name the model invented.** Typosquat packages exist on purpose. Read the name. Pin versions.
- **eval or exec on model code.** The model is not a safe compiler. It can follow injected instructions.
- **Assuming Joeven is a secret vault.** It is a browser classroom. No keys here.
- **Skipping the venv.** Global packages collide. A course install breaks another project.

## Where this goes next

The next lesson is **tokens, tools, and goals** — the three scarce resources once keys work. The **Python** track will go deeper on venv and HTTP on your laptop. **Production** will cover secret managers and rotation as a process. **Evals and safety** will turn “untrusted output” into tests and filters. **Tools** will add timeouts and allow-lists. Do not wait for those tracks to gitignore \`.env\`.

## How agents use this

Setup is part of the agent’s environment. A tool that reads \`os.environ\` is how the agent calls a vendor. A tool that prints the key is a bug.

- **Code:** one \`load_key\` function. Missing keys raise. Demo keys are clearly fake. Never concatenate a secret into a prompt string. Pass a client object that already has the key, not the key itself, into the loop.
- **Logs:** log key **length**, key **name**, and last four characters only if your security policy allows even that. Never log the full secret. Log \`missing: OTHER_API_KEY\` when load fails.
- **Tests:** missing env raises. Demo prefix is accepted only in classroom mode. A fake \`os.environ\` in tests must not use a real key. Assert that a trace fixture has no substring equal to the secret.
- **Stop conditions:** refuse to start the loop if required keys are missing. Refuse to start if spend-cap metadata says the experiment key is exhausted. Human handoff if a tool returns 401 unauthorized after a retry — do not spin.

The classroom returns a demo key so you can practice load and redact. On your machine, set the variable in the OS, not in a chat window.

\`\`\`quiz
Where should production API keys live?
- Inside the system prompt so the model can “remember” them
- In a public GitHub repo so teammates can copy them
- *In environment variables or a secret manager, never in git
- In the left sidebar of Joeven
explain: Secrets belong in environment variables or a secret manager. Prompts, git history, and this academy’s sidebar are not vaults.
\`\`\`
`,
    },
    {
      slug: "tokens-tools-goals",
      title: "Tokens, Tools, and Goals",
      summary:
        "Every agent spends three scarce things: context tokens, tool permissions, and a goal you can check with a function.",
      minutes: 20,
      level: "beginner",
      md: `
If you remember one lesson from Getting Started, remember this triad: **tokens**, **tools**, and **goals**.

A token is a chunk of text the model reads or writes. A tool is a function the model is allowed to call. A goal is a checkable “done.” Agents fail when any of the three is vague. They get expensive when tokens grow. They get dangerous when tools are too wide. They get fake when goals cannot be tested.

This triad exists because product language hides it. “Make it smart” does not name a token budget, a permission, or a predicate. A **predicate** is a function that returns true or false. Your job is to translate “smart” into those three.

People confuse tokens with words, tools with “the model can do anything,” and goals with mission statements. English words are not tokens (code and JSON often use more tokens than you think). A tool is not a superpower; it is an API with a blast radius. “Be helpful” is not a goal.

## The triad

| Resource | Scarce because | You design |
|---|---|---|
| Tokens | You pay per input and output; loops resend history | Short tool results, summaries, retrieval, model size |
| Tools | Each call can change the world or leak data | Narrow args, schemas, timeouts, approval |
| Goals | You cannot hit a target you cannot check | A function that returns true on success |

\`\`\`viz flow
title Three scarce things
layout lr
node tok Tokens
node tool Tools
node goal Goals
caption Tokens cost money as the loop grows. Tools can change the world. A goal is a check that returns true or false.
\`\`\`

## Tokens

LLMs read and write tokens, not words. English is often about four characters per token, but code and JSON are worse. You pay for **input plus output**. Agent loops re-send the growing transcript, so a 20-step run can cost many times a single chat.

Implications you will implement later:

- Keep tool results short
- Summarize old steps
- Retrieve only the chunks you need
- Prefer small models for routing and big models for hard reasoning

A **20-step research agent** that pastes a full HTML page on every turn is not “thorough.” It is a token hose. The fix is not a larger context window as a first move. The fix is to store a short observation: title, url, 500 characters of text, then retrieve more if the goal still fails.

## Tools

A tool is a function the model is allowed to call: search, SQL, shell, browser, ticket API.

Each tool is a **loaded gun**. A \`run_sql\` tool with \`DROP\` permission is not clever. It is an incident.

Design tools like public APIs:

- Narrow arguments
- JSON schema
- Timeouts
- **Idempotency** where you can. Idempotent means doing the action twice has the same effect as doing it once (charging a card twice is not).
- Human approval for irreversible actions

Eight tools with sharp edges beat eighty tools with poetic names. A refund tool that requires \`ticket_id\` and \`amount_cents\` plus an approval flag is safer than \`do_whatever(payload)\`.

## Goals

A goal that cannot be checked cannot be achieved. “Be helpful” is not a goal. “Return a GitHub issue URL whose body contains a reproducible test” is a goal.

Write \`goal_satisfied\` **before** you write the agent. That is **test-driven agent development**: the check exists first, the loop tries to make it true, the budget stops the loop if it cannot.

## An ops ticket for job docs

Ops asks: “Open or find a GitHub issue that describes how to reproduce the login bug, with a real test function in the body.” That sentence is already almost a predicate.

Check 1: there is a URL that starts with \`https://\`. Check 2: the body contains \`def test_\`, the usual start of a pytest function. If either fails, the agent is not done, no matter how confident the final sentence sounds.

Walk a good ticket: url \`https://github.com/x/y/issues/3\`, body with \`def test_login\`. Both checks pass. Walk a bad ticket: empty url, body “please fix.” Both checks fail. The agent should keep working or hand off — not invent a URL in prose.

Product managers will still say “make it smart.” You translate: tokens (do not paste the whole repo), tools (search issues, not \`rm\`), goals (\`goal_satisfied\`).

\`\`\`tryit python
def goal_satisfied(ticket):
    url = ticket.get("url", "")
    body = ticket.get("body", "")
    has_url = url.startswith("https://")
    has_test = "def test_" in body
    return has_url and has_test

good = {
    "url": "https://github.com/x/y/issues/3",
    "body": "def test_login():\\n    assert True",
}
bad = {"url": "", "body": "please fix"}

print("good ticket:", goal_satisfied(good))
print("empty ticket:", goal_satisfied(bad))
print("url ok only:", goal_satisfied({"url": "https://example.com", "body": "no test"}))
print("test ok only:", goal_satisfied({"url": "http://x", "body": "def test_x(): pass"}))
\`\`\`

Four lines of output. The good ticket is \`True\`. The empty ticket is \`False\`. A https URL without a test is \`False\`. A test with \`http://\` (not \`https://\`) is also \`False\`. The last two prints are the edges: both parts of the \`and\` must pass. If you weaken the function to only check the url, the empty-body https case will go green and you will ship a goal that forgot the test. That is how “smart” eats checks.

> **Note:** Product managers will still say “make it smart.” Your job is to translate that into predicates, budgets, and tools.

## What goes wrong

- **Unbounded tokens.** Every tool returns a novel. The window fills. The model attends to noise.
- **Counting words as tokens.** JSON keys and punctuation cost money too.
- **Wide tools.** Shell as the only tool. Now the policy includes \`rm\`.
- **Tools without timeouts.** A hung HTTP call is a loop that cannot observe.
- **Goals as slogans.** “Increase delight.” No function can return true.
- **Checking only the model’s last sentence.** Cheerful text is not \`goal_satisfied\`.
- **No budget next to the goal.** The check is never true, and the loop never stops.
- **Idempotency ignored.** The agent retries a refund and doubles it.

## Where this goes next

The last Getting Started lesson puts the triad into a tiny agent: a job lookup tool, a finish tool, a fake model, a step budget. **LLM** and **prompt** tracks go deeper on tokens and JSON. **Tools** is the home of schemas, timeouts, and approval. **RAG** is how you stop pasting the whole wiki into the transcript. **Evals** turn \`goal_satisfied\` into a suite. **Production** turns token counts into bills and alerts. You do not need those tracks to write a predicate today.

## How agents use this

Design in this order: goal function, tool list, token budget. Then the loop.

- **Code:** \`goal_satisfied(state)\` returns a boolean. Each tool is a small function with typed args. A \`max_steps\` and, later, a \`max_tokens\` integer live next to the loop, not in a wiki.
- **Logs:** per step, log tokens in, tokens out if the vendor sends them, tool name, and \`goal_satisfied\` after the step. When a run is expensive, the log should show which step bloated the context.
- **Tests:** the four cases from the Try it box: good, empty, url-only, test-only. Add a case where a tool result is huge and a trimmer cuts it — when you write that trimmer. Assert forbidden tools are not in the allow-list.
- **Stop conditions:** success when \`goal_satisfied\` is true; failure when steps or tokens exceed the cap; handoff when a tool would be irreversible and approval is missing.

The triad is the whole course in three words. The next page is a program that uses all three.

\`\`\`quiz
Why do agent loops get expensive quickly?
- GPUs dislike the Python language
- *Each step resends growing context, so token use scales with steps
- Tools are billed per millisecond of silent thought
- JSON is not allowed inside prompts
explain: Context is cumulative. Every turn resends history. Trimming, summarizing, and retrieval exist to fight this. GPUs, thought-time billing, and a JSON ban are not the reason.
\`\`\`
`,
    },
    {
      slug: "first-agent",
      title: "Your First Tiny Agent",
      summary:
        "A complete think-act-observe loop: fake model, two tools, a transcript, a step budget, and a final answer for job 17.",
      minutes: 22,
      level: "beginner",
      md: `
This lesson puts the whole Getting Started track into one small program. You will run a **file-answering agent** with no paid API. A fake model chooses tools from simple rules. The surrounding code is production-shaped: named tools, a **transcript**, a budget.

A transcript is the ordered list of messages the policy is allowed to see: the user goal, then tool results, then the next decision. The fake model is the policy. Later it becomes an LLM that must return JSON matching a tool name and arguments. The loop does not change.

People confuse this exercise with “a toy, so it does not count.” The toy is the model. The loop, the tools, the budget, and the finish action are the real thing. If you skip them and jump to a vendor SDK, you will still need them, only hidden.

## The pieces in this program

| Piece | In this box | Later |
|---|---|---|
| Goal | “What is the status of job 17?” | Any checkable question |
| Environment | \`JOBS\` dictionary | A real job API |
| Actions | \`get_job\`, \`finish\` | Search, SQL, shell, tickets |
| Policy | \`fake_model\` | An LLM call that returns JSON |
| Memory | \`transcript\` list | Traces in a database |
| Budget | \`max_steps\` | Max steps plus max tokens plus spend |

\`\`\`viz loop
title A tiny agent with two tools
step Think
step get_job
step See result
step finish
caption A fake model picks the next tool. The loop, the transcript, and the budget are the real product.
\`\`\`

**Goal.** Ops wants the status of job 17. Done means a final sentence that used the job record, not a guess.

**Environment.** Two jobs exist: 17 failed with a vendor timeout, 42 is ok. Unknown ids return an error object.

**Actions.** \`get_job\` reads. \`finish\` stops with an answer. There is no third tool yet. That is a feature.

**Policy.** If the transcript has no tool result yet, call \`get_job\` for 17. If it has a result, call \`finish\` with a sentence built from status and error.

**Memory.** Each tool result is appended. The fake model looks at the last tool message. A real model would look at all of them.

**Budget.** Four steps. If \`finish\` never comes, return \`budget exceeded\`.

## An ops person at 4 p.m.

Priya on-call sees “job 17 failed” in a dashboard with no error string. She should not paste a production key into a chat box. She should run an agent (or a workflow) that is allowed to call \`get_job\` and nothing else expensive.

Step 1: policy chooses \`get_job\` with \`job_id\` 17. Observation: status failed, error timeout talking to vendor. Step 2: policy chooses \`finish\` with a sentence that includes both. Stop. Two steps, under budget. If \`JOBS\` had no 17, the observation would be an error, and a better policy would finish with “not found” instead of inventing a status. Our fake model is naive: it still formats the error dict. That honesty is useful. You can see the weakness and fix the policy. A giant framework would hide the same weakness in three classes.

Write the stop rule in your head before you run: success is \`finish\`; failure is \`max_steps\`; there is no human handoff in this tiny version, but you can imagine \`ask_human\` as a third tool.

\`\`\`tryit python
from typing import Callable

JOBS = {
    17: {"status": "failed", "error": "timeout talking to vendor"},
    42: {"status": "ok", "error": None},
}

def tool_get_job(job_id):
    if job_id not in JOBS:
        return {"error": "not found"}
    return JOBS[job_id]

def tool_finish(answer):
    return {"final": answer}

TOOLS: dict[str, Callable] = {
    "get_job": lambda **kw: tool_get_job(int(kw["job_id"])),
    "finish": lambda **kw: tool_finish(str(kw["answer"])),
}

def fake_model(transcript):
    # Pretend the LLM read the user goal and tool docs.
    if not any(t.get("role") == "tool" for t in transcript):
        return {"tool": "get_job", "args": {"job_id": 17}}
    job = transcript[-1]["content"]
    status = str(job.get("status", job.get("error", "unknown")))
    err = job.get("error")
    if err is None:
        err_text = "none"
    else:
        err_text = str(err)
    answer = "Job 17 is " + status + ": " + err_text
    return {"tool": "finish", "args": {"answer": answer}}

def run_agent(goal, max_steps=4):
    transcript = [{"role": "user", "content": goal}]
    for step in range(1, max_steps + 1):
        decision = fake_model(transcript)
        name = decision["tool"]
        args = decision["args"]
        result = TOOLS[name](**args)
        print(
            "step "
            + str(step)
            + ": "
            + name
            + "("
            + str(args)
            + ") -> "
            + str(result)
        )
        if name == "finish":
            return result["final"]
        transcript.append({"role": "tool", "name": name, "content": result})
    return "budget exceeded"

print("ANSWER:", run_agent("What is the status of job 17?"))
print("unknown job probe:", tool_get_job(99))
\`\`\`

The first printed step is \`get_job\` with \`job_id\` 17, and the result dict with status failed and the timeout error. The second step is \`finish\` with an answer string, and a result dict that has \`final\`. Then \`ANSWER:\` repeats that sentence: job 17 is failed, timeout talking to vendor. Then a probe of job 99 prints \`not found\` — the tool is honest when the environment has no record. The fake model always asks for 17, even if you change the goal string. That is the next weakness to fix (the exercise below).

## What you just learned (the whole course in miniature)

- **Goal** — a question with a checkable answer
- **Tools** — \`get_job\`, \`finish\`
- **Policy** — \`fake_model\` (later: a real LLM)
- **Transcript** — the memory of the loop
- **Budget** — \`max_steps\`

When you swap \`fake_model\` for an API call that must return JSON matching tool plus args, you have a real agent. The rest of Joeven is how to make that swap reliable: schemas, evals, RAG, planning, multi-agent, and production.

## Exercise

Change the fake model so it can answer job 42 as well, by reading the goal string for a number. Then add a third tool \`list_failed_jobs\`. Keep \`max_steps\`. Do not add a paid API. If you parse no number, finish with a short “missing job id” instead of guessing 17.

Next track: **Python**, because the quality of your agents will never exceed the quality of your functions.

## What goes wrong

- **No \`finish\` tool.** The loop cannot stop except by blowing the budget. Always give the policy a legal way to end.
- **Guessing job 17 forever.** The policy ignores the user’s number. That is our fake model’s bug. Fix it in the exercise.
- **Swallowing \`not found\`.** The agent writes “all good” after an error dict. Append the error. Then finish with failure text.
- **Budget too high, no goal check.** Four steps is small. Four thousand with a paid search tool is a bill.
- **Printing secrets in the answer.** Job error strings might contain tokens. Redact in real tools.
- **Calling tools that are not in \`TOOLS\`.** A real model will try. Your execute line should catch \`KeyError\` and return an error result, not crash without a trace.
- **Replacing the loop with a chat SDK and no transcript.** You cannot test. You cannot eval. You cannot bill per step.
- **Skipping Python next.** This box used functions, dicts, and a \`for\` loop. The next track makes those boring and solid.

## Where this goes next

**Python** is next on purpose. Then **math**, **ML**, **transformers**, **LLMs**. Then **prompt**, **tools**, **RAG**, **agents**. Then **multi-agent**, **eval**, **production**, **projects**. This tiny agent is the costume rack empty: no RAG, no swarm, no vendor. Keep it in your head when a framework diagram has twelve boxes. Twelve boxes still need a goal, tools, a transcript, and a budget.

## How agents use this

Ship the shape you just ran. Swap the fake model last.

- **Code:** \`TOOLS\` as a dict of callables. \`run_agent(goal, max_steps)\`. \`fake_model\` isolated so tests can inject a script. Parse \`job_id\` with \`int(...)\` and handle bad values. Build answer strings with concatenation or \`str\` joins, not with silent guesswork.
- **Logs:** one print per step with name, args, and result — the classroom already does this. In production, write the same fields to a trace store, plus a run id.
- **Tests:** job 17 returns a sentence that contains \`failed\` and \`timeout\`. Job 99’s tool returns \`not found\`. \`max_steps=1\` returns \`budget exceeded\` because \`finish\` never runs. A decision with a fake tool name does not kill logging.
- **Stop conditions:** \`finish\` returns the final string; \`max_steps\` returns \`budget exceeded\`; later, \`ask_human\` returns control. Do not stop because the model wrote “done” inside \`get_job\`.

You now have the whole Joeven argument in one function: the model is replaceable; the loop is the product.

\`\`\`quiz
In the tiny agent, what is the policy?
- The JOBS dictionary with statuses
- The max_steps budget integer
- *fake_model (later a real LLM) choosing the next tool
- The print statements in the loop
explain: The policy maps transcript to next action. JOBS is the environment. max_steps is a stop rule. Prints are logs. Tools and data are not the policy.
\`\`\`
`,
    },
  ],
};
