import type { TrackSource } from "@/lib/types";

export const start: TrackSource = {
  slug: "start",
  title: "Getting Started",
  short: "Start",
  tagline: "What autonomous agents are, how this academy works, and how to think in loops.",
  color: "#04AA6D",
  order: 1,
  lessons: [
    {
      slug: "welcome",
      title: "Welcome to Joeven",
      summary: "How this academy is organized and how to learn autonomous AI agents from zero to production.",
      minutes: 8,
      level: "beginner",
      md: `
Joeven is a tutorial academy for **autonomous AI agents** — software that uses a language model as a brain, tools as hands, and a loop as a heartbeat.

If you have used [W3Schools](https://www.w3schools.com), you already know the rhythm: short pages, live examples, Next / Previous, exercises, certificates. That is the product. The subject is different. Instead of HTML tags, you will master the stack that actually ships agents:

1. **Python** — the language of tools, APIs, tests, and orchestration
2. **Mathematics** — vectors, probability, gradients, information
3. **Machine learning and transformers** — how models represent and generate
4. **LLMs, prompting, tools, RAG, memory** — the agent toolkit
5. **Architectures** — ReAct, planning, reflection, multi-agent systems
6. **Production** — evals, safety, cost, tracing, deploy

## How a Joeven page works

Every tutorial page is a single idea. Read it. Run the **Try it yourself** box in the browser (Python runs locally via Pyodide — no server, no API key). Answer the quiz. Click **Next**.

Your progress is stored in this browser. Complete track quizzes at 80%+ to unlock a **certificate** you can download.

## The money-honest version of this site

Joeven is designed to be a real business, the same way tutorial sites have been for twenty years:

- Free tutorials (this is the product that ranks and teaches)
- Optional **Joeven Pro** (ad-free, cloud progress, extra project reviews)
- Sponsor slots and a job board for agent-engineer roles
- Certificates that signal you actually finished the work

You can learn everything here for free. Pro is for people who want the extras.

## What you will be able to build

By the last project you will have built:

- A tool-using ReAct agent
- A retrieval (RAG) support agent with citations
- A multi-agent software team (planner, coder, reviewer)
- An ops agent with human approval gates
- A long-running personal agent with memory

> **Tip:** Do not skip Python or math if you are rusty. Agents fail in boring ways — JSON, off-by-one chunking, bad probabilities — not in cinematic ways.

\`\`\`quiz
What is Joeven primarily teaching?
- Website CSS tricks
- *Autonomous AI agents, from first principles to production
- Only prompt engineering memes
- GPU driver installation
explain: Joeven is a full curriculum for building autonomous agents: Python, math, models, tools, architectures, and production.
\`\`\`
`,
    },
    {
      slug: "what-is-an-agent",
      title: "What Is an AI Agent?",
      summary: "A precise definition: goals, observations, actions, and a loop that can run without a human in every step.",
      minutes: 12,
      level: "beginner",
      md: `
An **agent** is a system that **pursues a goal** by **observing** an environment and **taking actions** over time.

That sentence is older than ChatGPT. It is the definition from AI textbooks (Russell & Norvig): sensors in, actuators out, a policy in the middle.

A **language-model agent** uses an LLM as part of that policy. The model is not the agent. The agent is the **loop around the model**.

## The four pieces

| Piece | Role | Example |
|---|---|---|
| Goal | What “done” means | “Open a PR that fixes the failing test” |
| Observations | What the agent can read | Test logs, files, web pages, user messages |
| Actions | What the agent can do | Call APIs, run code, search, message a human |
| Policy | How it chooses the next action | An LLM + code + memory + rules |

If any piece is missing, you do not have an agent. You have a demo.

## Autonomy is a slider, not a switch

- **Level 0** — autocomplete. Human does everything.
- **Level 1** — chatbot. Model replies. Human still acts in the world.
- **Level 2** — tool-using copilot. Model may call functions, human approves.
- **Level 3** — agent. Model loops: think → act → observe → think, until a stop condition.
- **Level 4** — long-running / multi-agent. Hours to days, multiple specialists, human on-call.

Joeven focuses on levels 2–4.

## A tiny agent in Python (no API)

This agent has a goal, a world, and a policy. The policy is a boring \`if\` statement — that is the point. Intelligence can come later. The **shape** is already an agent.

\`\`\`tryit python
goal = "have_umbrella_if_rain"

world = {"raining": True, "has_umbrella": False}

def observe(world):
    return dict(world)

def act(world, action):
    if action == "take_umbrella":
        world["has_umbrella"] = True
    return world

def policy(obs, goal):
    if goal == "have_umbrella_if_rain":
        if obs["raining"] and not obs["has_umbrella"]:
            return "take_umbrella"
    return "stop"

obs = observe(world)
steps = 0
while steps < 5:
    action = policy(obs, goal)
    print("obs:", obs, "-> action:", action)
    if action == "stop":
        break
    world = act(world, action)
    obs = observe(world)
    steps += 1

print("done:", world)
\`\`\`

Replace \`policy\` with a call to an LLM that returns an action name, and you have a modern agent. The loop did not change.

> **Note:** Marketing uses “agent” for anything with a chat box. Engineers should keep the word for systems that **act in a loop toward a goal**.

## Stop conditions

An agent that cannot stop is a denial-of-service attack against your wallet. Always define:

- Success: goal predicate is true
- Failure: too many steps, too much money, forbidden action
- Handoff: ask a human

\`\`\`quiz
Which statement is most accurate?
- The LLM is the agent
- *The agent is the loop: goal, observations, actions, and a policy (often an LLM)
- Agents cannot use tools
- Autonomy means zero tests
explain: Models are a component. The agent is the closed loop around goals, observations, and actions.
\`\`\`
`,
    },
    {
      slug: "the-agent-loop",
      title: "The Agent Loop",
      summary: "Think, act, observe, repeat. Tokens, tools, traces, and why this loop is the whole subject.",
      minutes: 14,
      level: "beginner",
      md: `
Every serious agent library is a costume on the same loop:

1. **Assemble context** (goal, memory, observations, tool docs)
2. **Ask the model** what to do next
3. **Parse** a thought, a tool call, or a final answer
4. **Execute** tools in the real world
5. **Append results** to context
6. **Repeat** until a stop condition

This is **ReAct** when the model is asked to emit reasoning + an action. It is **plan-and-execute** when step 2 produces a whole plan first. It is **multi-agent** when step 4 is “ask another agent”.

## Why loops eat tokens

Each turn **rewrites history**. Context grows. Cost grows. Attention gets noisier. This is why later tracks spend so much time on memory, retrieval, and summarization — not because they are fashionable, but because the loop is otherwise unbounded.

## A loop you can see

\`\`\`tryit python
import json

tools = {
    "add": lambda a, b: a + b,
    "mul": lambda a, b: a * b,
}

# A fake model: it "decides" from a script of tool calls.
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
\`\`\`

The **trace** (the list of thoughts, calls, and results) is the most important artifact you will produce in production. You cannot eval, debug, or bill without it.

## Failure modes of the loop

- **Infinite retry** — tool fails, model calls it the same way again
- **Goal drift** — model starts solving a neighboring problem
- **Context rot** — old errors stay in the prompt and get imitated
- **Premature stop** — model claims success without checking
- **Tool hallucination** — invents an API that does not exist

You will build defenses for each of these: schemas, retries with jitter, evals, allowed-tool lists, and “verify before final”.

> **Tip:** Log every thought and tool result. If you cannot replay a run, you cannot improve a run.

\`\`\`quiz
What should stop an agent loop?
- Nothing — let it think forever
- *A success check, a max-step/max-cost limit, or a human handoff
- Only a keyboard interrupt
- Deleting the system prompt
explain: Stop conditions are part of the agent contract: success, budget, or escalation.
\`\`\`
`,
    },
    {
      slug: "agents-vs-chatbots",
      title: "Agents vs Chatbots vs Workflows",
      summary: "When you need an agent, when a script is better, and why most “agents” should be workflows.",
      minutes: 12,
      level: "beginner",
      md: `
Three designs get mixed up in product meetings.

### Chatbot

User message in, assistant message out. Maybe RAG. **No side effects** unless the user copies something.

Good for: Q&A, drafting, tutoring.

### Workflow (also called a graph, pipeline, or DAG)

You, the engineer, already know the steps: extract → retrieve → generate → validate → save. An LLM may sit **inside** a step. Control flow is **your code**.

Good for: invoice processing, deterministic ETL with an LLM extract, most business automation.

### Agent

The model **chooses** the next step. You cannot write the DAG in advance because the path depends on observations.

Good for: research, messy debugging, computer use, open-ended ops, games, coding until tests pass.

## The expensive mistake

Teams wrap a two-step workflow in an agent framework, then spend months debugging why the model skipped step 2.

**Rule:** if you can draw the flowchart without a diamond that says “LLM decides”, it is a workflow. Use a workflow.

## A workflow that looks like an agent (and that is OK)

\`\`\`tryit python
def workflow(ticket: str) -> dict:
    # Step 1: classify (in production this is an LLM call)
    kind = "billing" if "invoice" in ticket.lower() else "tech"
    # Step 2: retrieve
    docs = {
        "billing": ["Refunds take 5-7 days", "Invoices are in /billing"],
        "tech": ["Restart the agent runner", "Check API_KEY"],
    }[kind]
    # Step 3: answer
    return {"kind": kind, "answer": docs[0], "sources": docs}

print(workflow("My invoice is wrong"))
print(workflow("The runner crashed"))
\`\`\`

Control flow is in Python. That is a feature. You can test it without mocking a 70B model.

## When the LLM should choose

Use an agent when the **branching factor** is high:

- Unknown number of searches
- Unknown files to open
- Unknown tools (calendar? browser? shell?)
- Unknown whether the task is even possible

Even then: **constrain the action space**. An agent with 8 tools beats an agent with 80 tools.

> **Warning:** Autonomy without evals is just randomized production incidents.

\`\`\`quiz
You must extract fields from PDFs, then write rows to a database. What should you build first?
- A multi-agent swarm
- *A workflow with an LLM extract step and schema validation
- A chatbot with no tools
- An infinite ReAct loop
explain: The steps are known. That is a workflow. Put the model inside a typed step.
\`\`\`
`,
    },
    {
      slug: "learning-path",
      title: "The Learning Path",
      summary: "The full map: Python, math, ML, LLMs, tools, RAG, agent architectures, evals, production, projects.",
      minutes: 10,
      level: "beginner",
      md: `
Joeven is ordered like a degree, compressed.

## Foundation

**Python** is not optional. Agents are programs. You will write parsers, retries, tests, and HTTP clients. If you cannot write a function that parses JSON and raises a useful error, you cannot ship an agent.

**Math** is the language of embeddings, attention, loss, sampling, and Bayesian update. You do not need a PhD. You need vectors, matrices, derivatives, probability, and entropy well enough to debug a retrieval system that “feels random”.

## Models

**Machine learning** teaches the habit: data → model → loss → eval. **Transformers** explain tokens, attention, and why context windows matter. **LLMs** are the APIs, costs, decoding, and failure modes you will live with.

## Agent stack

- **Prompting & structured output** — how to talk to the model so it talks back in JSON
- **Tools & MCP** — how the model touches the world
- **RAG & memory** — how it knows things that were not in the weights
- **Architectures** — ReAct, plan-execute, reflection, state machines
- **Multi-agent** — when to split roles
- **Evals & safety** — how you know it works and how it fails closed
- **Production** — tracing, queues, secrets, deploy, cost

## Projects

Theory that you cannot run is trivia. The project track is five builds, beginner to advanced. Treat them as a portfolio.

## Time

If you already write Python, expect **4–8 weeks** at 8 hours/week to finish the core plus two projects. If you are starting from scratch, budget **3–4 months** and do every exercise.

\`\`\`tryit python
path = [
    "start", "python", "math", "ml", "transformers",
    "llm", "prompt", "tools", "rag", "agents",
    "multiagent", "eval", "prod", "projects",
]
print("tracks:", len(path))
print(" -> ".join(path))
\`\`\`

> **Tip:** Use the left sidebar like a textbook table of contents. Skip around only after you have finished Python and the agent loop lessons.

\`\`\`quiz
Why does Joeven teach math before RAG?
- To inflate the syllabus
- *Because retrieval quality is geometry and probability, not just API calls
- Math is required by the domain registrar
- Transformers cannot run without calculus homework
explain: Embeddings, similarity, ranking, and sampling are mathematical. Skipping math makes RAG a black box you cannot debug.
\`\`\`
`,
    },
    {
      slug: "setup",
      title: "Setup: Python, Keys, and Safety",
      summary: "Install Python, use virtual environments, handle API keys, and never put secrets in prompts or git.",
      minutes: 14,
      level: "beginner",
      md: `
You can run most Joeven **Try it yourself** boxes in the browser. For projects, use a real machine.

## Python

Install Python 3.11+ from [python.org](https://www.python.org/downloads/). On Windows, tick **Add python.exe to PATH**.

Create a virtual environment so course packages do not collide with the rest of your computer:

\`\`\`bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install --upgrade pip
\`\`\`

## Packages you will actually use

Not fifty frameworks. A small core:

- \`httpx\` or \`requests\` — HTTP
- \`pydantic\` — schemas
- \`pytest\` — tests
- One vendor SDK when you need it (\`openai\`, \`anthropic\`, etc.)

Frameworks (LangChain, CrewAI, AutoGen, smolagents) are optional **after** you can write the loop yourself. Joeven teaches the loop first.

## API keys

Never paste keys into Joeven, GitHub, or a screenshot.

- Store keys in environment variables or a local \`.env\` that is gitignored
- Restrict keys by origin and spend limit in the vendor dashboard
- Use a **separate key** for experiments with a hard monthly cap

\`\`\`tryit python
import os

# DEMO: we simulate env vars. In real code, set them in the OS.
os.environ["WEATHER_API_KEY"] = "sk-demo-not-real"

def load_key(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable {name}")
    if value.startswith("sk-demo"):
        return value  # allowed in this classroom
    return value

key = load_key("WEATHER_API_KEY")
print("loaded key length:", len(key))
print("never print the full key in production logs")
\`\`\`

> **Warning:** If a key leaks, revoke it immediately. Then rotate. Then check billing.

## What you do not need yet

- A GPU
- Kubernetes
- Fine-tuning
- A vector database account (we will simulate first, then you can bring Pinecone/pgvector/Chroma)

## Safety default

Treat every model output as **untrusted**. It can be wrong, leaked, or prompt-injected. Later lessons make this precise. The habit starts now: validate JSON, sandbox tools, never \`eval\` model-generated code on your laptop with full permissions.

\`\`\`quiz
Where should production API keys live?
- In the system prompt
- In a public GitHub repo so teammates can copy them
- *In environment variables or a secret manager, never in git
- In the left sidebar of Joeven
explain: Secrets belong in env/secret managers. Prompts and git history are not vaults.
\`\`\`
`,
    },
    {
      slug: "tokens-tools-goals",
      title: "Tokens, Tools, and Goals",
      summary: "The three scarce resources of every agent: context tokens, tool permissions, and a testable goal.",
      minutes: 12,
      level: "beginner",
      md: `
If you remember one lesson from Getting Started, remember this triad.

## Tokens

LLMs read and write **tokens**, not words. A token is a chunk of text. English is often ~4 characters per token, but code and JSON are worse.

You pay for **input + output** tokens. Agent loops re-send the growing transcript, so a 20-step run can cost 20× a single chat.

Implications you will implement later:

- Keep tool results short
- Summarize old steps
- Retrieve only the chunks you need
- Prefer small models for routing and big models for hard reasoning

## Tools

A tool is a function the model is allowed to call: search, SQL, shell, browser, ticket API.

Each tool is a **loaded gun**. A \`run_sql\` tool with \`DROP\` permission is not clever; it is an incident.

Design tools like public APIs:

- Narrow arguments
- JSON schema
- Timeouts
- Idempotency where you can
- Human approval for irreversible actions

## Goals

A goal that cannot be checked cannot be achieved. “Be helpful” is not a goal. “Return a GitHub issue URL whose body contains a reproducible test” is a goal.

\`\`\`tryit python
def goal_satisfied(ticket: dict) -> bool:
    url = ticket.get("url", "")
    body = ticket.get("body", "")
    return url.startswith("https://") and "def test_" in body

print(goal_satisfied({"url": "https://github.com/x/y/issues/3", "body": "def test_login():\\n    assert True"}))
print(goal_satisfied({"url": "", "body": "please fix"}))
\`\`\`

Write \`goal_satisfied\` **before** you write the agent. That is test-driven agent development.

> **Note:** Product managers will still say “make it smart”. Your job is to translate that into predicates, budgets, and tools.

\`\`\`quiz
Why do agent loops get expensive quickly?
- GPUs dislike Python
- *Each step resends growing context, so token use scales with steps
- Tools are billed per millisecond of thought
- JSON is illegal in prompts
explain: Context is cumulative. Trimming, summarizing, and retrieval exist to fight this.
\`\`\`
`,
    },
    {
      slug: "first-agent",
      title: "Your First Tiny Agent",
      summary: "Build a complete think-act-observe loop with a fake model, two tools, and a real stop condition.",
      minutes: 16,
      level: "beginner",
      md: `
We will build a **file-answering agent** with no paid API. A fake model chooses tools from a script. The surrounding code is production-shaped: typed tools, a transcript, a budget.

Goal: answer “What is the status of job 17?” using a toy database.

\`\`\`tryit python
from typing import Callable

JOBS = {
    17: {"status": "failed", "error": "timeout talking to vendor"},
    42: {"status": "ok", "error": None},
}

def tool_get_job(job_id: int):
    if job_id not in JOBS:
        return {"error": "not found"}
    return JOBS[job_id]

def tool_finish(answer: str):
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
    answer = f"Job 17 is {job['status']}: {job.get('error')}"
    return {"tool": "finish", "args": {"answer": answer}}

def run_agent(goal: str, max_steps: int = 4) -> str:
    transcript = [{"role": "user", "content": goal}]
    for step in range(1, max_steps + 1):
        decision = fake_model(transcript)
        name, args = decision["tool"], decision["args"]
        result = TOOLS[name](**args)
        print(f"step {step}: {name}({args}) -> {result}")
        if name == "finish":
            return result["final"]
        transcript.append({"role": "tool", "name": name, "content": result})
    return "budget exceeded"

print("ANSWER:", run_agent("What is the status of job 17?"))
\`\`\`

## What you just learned (the whole course in miniature)

- **Goal** — a question with a checkable answer
- **Tools** — \`get_job\`, \`finish\`
- **Policy** — \`fake_model\` (later: a real LLM)
- **Transcript** — the memory of the loop
- **Budget** — \`max_steps\`

When you swap \`fake_model\` for an API call that must return JSON matching \`{tool, args}\`, you have a real agent. The rest of Joeven is how to make that swap reliable: schemas, evals, RAG, planning, multi-agent, and production.

## Exercise

Change the fake model so it can answer job 42 as well, by reading the goal string for a number. Then add a third tool \`list_failed_jobs\`.

Next track: **Python**, because the quality of your agents will never exceed the quality of your functions.

\`\`\`quiz
In the tiny agent, what is the policy?
- The JOBS dictionary
- max_steps
- *fake_model (later a real LLM) choosing the next tool
- print statements
explain: The policy maps transcript → next action. Tools and data are the environment.
\`\`\`
`,
    },
  ],
};
