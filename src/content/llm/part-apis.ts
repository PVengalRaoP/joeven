import type { RawLesson } from "@/lib/types";

export const llmApis: RawLesson[] = [
  {
    slug: "what-is-an-llm",
    title: "What Is an LLM?",
    summary:
      "A large language model continues text. Treat it as a guessing policy over tokens, not as a database or a mind.",
    minutes: 20,
    level: "beginner",
    md: `
A **large language model (LLM)** is a program that guesses the **next token**. A token is a chunk of text — a word, a piece of a word, a punctuation mark, or a bit of code. The Transformers track already showed how tokens, attention, and decoding work inside the network. This track is the **product** around that network: the HTTP call, the bill, the message list, and the wrap you put on the guess so an agent can ship.

When the model is big enough, those guesses look like skill. It can follow instructions, draft code, extract a field, and imitate an expert. That look is useful. It is also the trap. Fluency is not a proof. The training game is **plausible continuation**, not “look this up and only say it if it is true.”

“Large” is not a legal word. It means: too big to train on your laptop, usually served through an **API**, with a tokenizer, a **context window**, and a **decoding policy**. An API is a contract: you send data, you get data back. The context window is the maximum number of tokens the model can read in one call. The decoding policy is how the server turns a pile of next-token scores into actual text (greedy, sampled, stopped at a limit). The **product** you buy is not intelligence. It is **tokens in, tokens out**, with a wait time and a price.

## The stack you actually touch

You never “talk to the weights” in production. You talk to a stack. Name the layers or you will debug the wrong one.

| Layer | What it is | What fails here |
|---|---|---|
| Weights | The neural net, frozen when you call it | Wrong model, stale cutoff, bad fine-tune |
| Tokenizer | Text ↔ token ids | Cost lies, prompts that “fit” in characters overflow |
| Server | Batches, KV cache, streaming | Timeouts, 429s, first-token delay |
| Chat API | Messages, tools, safety filters | Bad roles, empty filtered content, ignored usage |
| Your agent | The loop: tools, memory, stop rules | Infinite steps, invented actions, no budget |

Joeven agents live in the last row. If you confuse the API with the agent, you will patch the prompt when the stop rule is missing, or blame “the model” when you never appended the tool result. The model is a function. The agent is everything that calls that function more than once.

The weights do not update when a user talks to your product. Each call is a fresh read of the messages you send. Memory is **your** object: the transcript, the database, the files. Saying “the LLM remembered” means you resent old text.

## Good at / bad at

**Good at:** turning messy language into a draft of structure; proposing the next tool from a documented list; writing glue code; extracting a field when the pattern is sitting in the prompt; summarizing a page you actually provided; sounding like a careful employee.

**Bad at, alone:** knowing if a fact is true **today**; exact arithmetic on long numbers; remembering anything not in the weights or the window; obeying a policy it can also be talked out of; being the **system of record** (the place the business treats as truth); counting, totals, and checksums you need to *guarantee*.

Stable facts and small math sometimes work because they were **easy patterns** in pretraining. “Paris” after “The capital of France is” is a dense pattern. “The CEO of Acme as of today” is a **retrieval** problem wearing a language costume. Retrieval means: go get a document or a row, then speak. Do not skip the get.

\`\`\`viz flow
title Tokens in, a guess out
layout lr
node tin Tokens in
node guess Guess next
node tout Tokens out
edge tin guess
edge guess tout
caption An LLM continues text. Fluency is not a proof. Wrap the guess with tools, schemas, and a stop.
\`\`\`

\`\`\`tryit python
def complete(prefix, table):
    return table.get(prefix, "...")

table = {
    "The capital of France is": " Paris.",
    "SELECT * FROM": " users;",
    "2 + 2 =": " 4",
    "The CEO of Acme as of today is": " [plausible name]",
}

for p in [
    "The capital of France is",
    "2 + 2 =",
    "The CEO of Acme as of today is",
]:
    print(repr(p), "->", repr(complete(p, table)))
print("the last line is fluent and maybe wrong — that is the product")
\`\`\`

The box is a lookup table pretending to be a model. The first two prefixes hit dense patterns. The third returns a plausible name that is not checked against any database. That is the honest demo: **continuation**, not knowledge. A real model is a huge, fuzzy version of the same game. Your wrap — schemas, tools, evals, budgets — is how you stop shipping the plausible name as if it were HR.

Change a prefix so it is missing from \`table\`. You get \`"..."\`. A hosted model will not print dots. It will invent a sentence. That difference is why agents need a **check** after the guess, not a vibe in the prompt that says “be accurate.”

## A walkthrough: Maya’s CEO question

Maya builds a briefing agent. A user asks, “Who is the CEO of Acme today?” She sends the question to a chat API. The model answers with a confident name and a biography. The name is last year’s CEO. The biography mixes two people. The UI shows a green check because the JSON parsed.

Nothing in the stack was “broken.” The model did the job it was trained for: continue the question as if it were a news blurb. The product was broken because Maya treated the completion as a database. The fix is not a bigger model. The fix is: call a search or an internal directory tool, put the result in a **tool** message, and refuse to name a CEO if the tool is empty. That pattern — guess only after an observation — is the rest of this track and the tools/RAG tracks after it.

## What an LLM is not

It is not a knowledge graph with proofs. It is not a Python interpreter (do not \`exec\` model text). It is not your authorization layer. It is not a clock; “today” in the prompt is a string you injected, or it is a guess. It is not cheaper than a \`SELECT\` when you already have the row.

Teams skip this list because the demo is pretty. Then finance asks why the bill is a novel, legal asks why the bot invented a policy clause, and ops asks why the agent refunded twice. All three failures start by treating tokens-out as truth.

## What goes wrong

- **Using the model as the system of record.** Ticket state lives in the database. The model may *describe* it after a tool call.
- **Skipping tools for “easy” facts.** Easy facts go stale. Today’s hours, prices, and names are tools or retrieval.
- **Debugging the weights first.** Check the message list, the finish reason, and the parser before you switch vendors.
- **Paying for a poem when a table would do.** The last lesson of this track is when not to call a model. Start that habit here.
- **Confusing chat UIs with APIs.** Pasting customer data into a consumer chatbot is a leak, not an integration.
- **Ignoring the window.** If the spec, the tools, and the observation do not fit, the model did not “forget.” You overflowed.

## How agents use this

Treat the LLM as a **guessing policy** over tokens. Wrap it until the wrap is safe enough to ship. The wrap is not a paragraph of adjectives. It is code:

- **Schema:** the model may only emit actions you can parse.
- **Tools:** facts and side effects go through functions you wrote.
- **Evals:** a frozen set of tickets that must pass after you change the spec.
- **Budgets:** max steps and max dollars, then stop.
- **Logs:** model name, usage, finish reason, message roles.

If you can replace the model with a lookup table or a workflow, do that. Save the model for branches you cannot draw: messy language, a long menu of tools, a draft the user will edit. A branch you *can* draw belongs in \`if\` and SQL.

Name the function \`complete(messages)\` (or \`chat\`) and keep it tiny. The agent loop should not know whether the other side is a hosted API, a local server, or a fake client in a test. Tests should not need a network. Joeven’s Try it boxes cannot hit a network on purpose. That is the same discipline as a unit test: script the assistant turn, assert the next tool.

> **Tip:** The rest of this track is the wrap — APIs, money, roles, JSON, knobs, lies, packing, and model choice. Attention math already had its track. Prompt injection as a writing craft is the next track. Here you learn the call.

\`\`\`quiz
What is the honest interface of an LLM?
- A knowledge graph with proofs
- *Tokens in, a distribution over next tokens out (plus a decoder that picks them)
- A guaranteed database
- A Python interpreter
explain: LLMs generate token sequences. Tools and retrieval are how you ground them. Fluency is not a proof.
\`\`\`
`,
  },
  {
    slug: "base-vs-chat",
    title: "Base vs Chat Models",
    summary:
      "A base model continues text. A chat model answers as an assistant. Hosted APIs almost always give you chat.",
    minutes: 19,
    level: "beginner",
    md: `
A **base** model is the pretrained continuer. Give it a webpage, it writes more webpage. Give it Python, it writes more Python. Give it a half-finished email, it finishes the email in the same voice. It does not wait politely for a question. It does not know it is an “assistant.” It knows how to keep going.

A **chat** (instruction-tuned) model was trained further to answer in **roles**: system, user, assistant. That is why it waits for you. It is also why it hedges, refuses, or moralizes in ways the base model would not. The extra training is not a different kind of attention. It is more next-token training on a new kind of document: conversations with a spec at the top.

When a blog says “this model can do X,” check whether they meant base, chat, or a tool-using **wrapper**. Those are three different products on related weights. A leaderboard number for “GPT can do X” is often a chat model plus tools plus a hidden scaffold. Your hosted call may be weaker, safer, or both.

## Three trainings, one family of weights

1. **Pretraining** — continue the internet (and code, and books). This is the base model.
2. **Instruction / chat tuning** — continue conversations that look like “system / user / assistant,” including “helpful” answers and some refusals.
3. **Preference tuning** (RLHF, DPO, and cousins) — prefer answers raters liked, which includes “don’t help with this class of request.”

You do not need the math of those methods in this lesson. You need the product fact: chat behavior is **extra training plus a template**. The template is a way of wrapping roles in special tokens so the model can see who spoke. The Transformers track already showed why special tokens matter. If you ignore the template and paste a raw document, you are feeding a different string than the vendor used in training.

Almost every commercial **chat API** hides the template. You send JSON messages. The server wraps them. That is a gift. It is also why “I copied a completion prompt from a 2022 blog into Chat Completions” fights the model: you are asking a chat model to pretend it is still a base model.

## What you send vs what the model sees

You send a list of dicts. The vendor turns that list into one token sequence with markers for roles. Tool calls may be extra structured fields, not prose. Your agent should think in **messages**. Do not try to reverse-engineer the wrapper unless you are hosting open weights and you own the tokenizer files.

Base-style hosts still exist: some research endpoints, some self-hosted completions, some “fill in the middle” code models. For agents, default to chat. Completions are a special case you opt into when the host has nothing else.

\`\`\`viz strip
title A chat document the model actually reads
chip system
chip user
chip assistant
caption A base model continues a webpage. A chat model answers in roles. Hosted APIs almost always give you chat.
\`\`\`

\`\`\`tryit python
def base_complete(prefix):
    return prefix + " the next sentence of the same document."

def chat_complete(messages):
    last = messages[-1]["content"]
    if last.endswith("?"):
        return "Answer: I will look that up with a tool."
    return "Okay."

print("base:", base_complete("Refunds take 5-7 days."))
msgs = [
    {"role": "system", "content": "You are a support agent."},
    {"role": "user", "content": "How long do refunds take?"},
]
print("chat:", chat_complete(msgs))
print("same family of weights, different training, different default behavior")
\`\`\`

The base function *continues the policy paragraph*. The chat function *answers the user* and, in this toy, even proposes a tool. Same family of idea, different default. A real chat model might still continue a document if you force it, but you will be fighting later training. Use the chat template. Put the spec in \`system\`, the question in \`user\`.

## Context windows, tools, and JSON mode are product features

A longer window, native tool-calling, and “JSON mode” sit **around** the weights. They change what you can parse and how much history you can afford. They do not turn the network into a database. A 128k window filled with a stale wiki is still stale. JSON mode that emits \`{"ceo": "plausible"}\` is still a guess.

Tool-calling is a chat feature: the assistant turn may contain a structured call instead of (or as well as) prose. You will wire that in later lessons. The point here is: **do not expect a base model to emit a clean tool call** just because you wrote a poem about functions. Chat models were shown that shape. Base models were shown websites.

## Refusals and hedges are trained, not magic ethics

Preference-tuning is why chat models refuse some requests — and why they sometimes refuse too much (a medical-adjacent question that is actually a billing FAQ) or too little (a polite jailbreak; the Prompt track covers injection as text). Your **runtime** must still allowlist tools. A refusal in prose is not an authorization layer. A smiling “sure, I’ll refund” is not a payment API.

If you need a model that will discuss security incidents, pick a vendor and a spec that allow that topic, plus human review. Do not keep a base model in production “because it won’t refuse.” It also won’t follow your stop rules.

## What goes wrong

- **Pasting “continue this document” into a chat model** and wondering why it answers as an assistant.
- **Assuming a chat model will follow a safety poem a base model never saw.** Put refusals in code too.
- **Reading a base-model paper** and buying a chat API, then being surprised by hedges.
- **Using one global temperature** for both JSON tools and marketing copy. Knobs come later; the split starts with “this is a chat product.”
- **Pretending roles are optional.** Empty system + a huge user blob is how specs disappear under tickets.

## How agents use this

Call the **chat** API unless you have a rare completion-only host. Put the spec in \`system\`, the human in \`user\`, and append **exactly** what the assistant produced (text and/or tool calls). Never invent a fake assistant confession to “steer” the model unless you are writing a test double and you label it as one.

Keep a tiny adapter: \`complete(messages) -> assistant message + usage + finish_reason\`. Behind it, hosted chat, local chat, or \`FakeChatClient\`. The loop does not change.

When you host open weights, load **that** model’s chat template. Mixing Model A’s roles with Model B’s tokenizer is a silent quality bug. Tokenizers differ; prompts that depend on exact token counts need a second look after a swap. That constraint beats a screenshot of a leaderboard.

> **Note:** “This model can do X” on a leaderboard is often a chat model with tools. Your hosted call may be weaker, safer, or both. Measure *your* tickets.

\`\`\`quiz
Why does a chat model wait for your question instead of rambling like a webpage?
- GPUs prefer questions
- *It was instruction-tuned (and often preference-tuned) to answer in assistant turns
- Base models cannot tokenize
- Chat is a different kind of attention
explain: Chat behavior is extra training on top of next-token pretraining, plus a template of roles. It is not a new attention algorithm.
\`\`\`
`,
  },
  {
    slug: "open-closed",
    title: "Open Weights vs Hosted APIs",
    summary:
      "Closed: you send text and get text. Open weights: you can host and fine-tune. Neither one is truth.",
    minutes: 20,
    level: "beginner",
    md: `
**Closed / hosted** means a vendor keeps the weights. You send text (and maybe files) and get text. You cannot inspect layers. You **can** still eval the inputs and outputs. Keys, rate limits, a data policy, and a region come with the bill. You are renting a completion.

**Open weights** means you can download (or license) the parameters, host them, and sometimes fine-tune. You get more control over privacy and unit cost at high volume. You also get ops: GPUs, queues, tokenizer files, CUDA drivers, and security patches. You are running a factory.

Neither kind is a database. Open does not mean honest. Closed does not mean safe. The wrap around the model still does the grounding: tools, schemas, allowlists, evals. A local model that emits a fake invoice id is still a fake invoice id. A hosted model that cites a tool you actually ran is still only as true as that tool.

## What you actually buy

| Need | Hosted API | Open weights you host |
|---|---|---|
| Time to first demo | Hours | Days to weeks if you have no GPU team |
| Privacy of prompts | Vendor policy + DPA | Your VPC, if you configured it |
| Fine-tune | Vendor product, or not at all | Full or adapter-tune, plus data ops |
| Inspect weights | No | Yes, as tensors, not as “explanations” |
| Patch a jailbreak in the net | Wait for the vendor | Retrain or swap — still not a substitute for code |
| Bill shape | Tokens and seats | Hardware, power, idle time, people |

A **DPA** is a data processing agreement: the legal text about whether the vendor trains on your prompts. Read it. “We do not train on API data” is a product sentence. The contract is the thing that matters when a customer asks.

“Open weights” is not always “do anything.” Licenses differ. Some forbid commercial hosting. Some require you to name the model. Some restrict military use. Read the license **before** you ship a customer-facing agent on them. Open is a distribution model, not a moral halo.

## A decision you can write down

Start with a hosted API if you have no GPU team and no hard privacy wall. Move to open weights when logs cannot leave, or when token bills beat hardware **on your measured mix**, not on a tweet. Fine-tune **last**. The ML and Transformers tracks already said why: you need data, evals, and a reason a prompt plus retrieval lost. Fine-tuning is not how you fix a missing tool.

Vendor fine-tune products sit in the middle: you still do not hold the base weights, but you can adapt. They have the same eval duty as anything else. A fine-tune that memorizes last quarter’s CEOs is a stale database with extra steps.

\`\`\`viz flow
title Pick a house for the weights
layout tb
node privacy Must stay?
node host Host in VPC
node no-gpu No GPU team?
node api Hosted API
edge privacy host
edge no-gpu api
caption Open weights add control, not honesty. Truth still needs tools and evals.
\`\`\`

\`\`\`tryit python
def choose(needs):
    if needs["data_must_stay"]:
        return "host open weights in your VPC"
    if needs["no_gpu_team"]:
        return "hosted API"
    if needs["must_fine_tune"]:
        return "open weights or a vendor fine-tune product"
    return "hosted API first, measure, then decide"

cases = [
    {"data_must_stay": True, "no_gpu_team": False, "must_fine_tune": False},
    {"data_must_stay": False, "no_gpu_team": True, "must_fine_tune": False},
    {"data_must_stay": False, "no_gpu_team": False, "must_fine_tune": True},
]
for n in cases:
    print(n, "->", choose(n))
\`\`\`

The first case is a privacy wall: host. The second is a team without GPUs: hosted API. The third is a genuine fine-tune need: open weights or a vendor product. Most student projects are case two. Most regulated customers start as case one even if they later keep a hosted model for a non-sensitive slice.

The function is a sketch, not a complete policy. Real choices add region, latency p95, JSON reliability, and “does this vendor even offer tool-calling.” Put those on a spreadsheet next to **your** eval, not next to a generic “arena” rank.

## Privacy is a catalog constraint

If traces cannot leave the VPC, the catalog shrinks to what you host — that constraint beats a leaderboard. If only *some* fields are sensitive, split: run the classifier on a small hosted model with redacted text, run the tool that touches account numbers inside the VPC. Splitting is architecture. Pretending one frontier chat is the whole company is a bill.

Consumer chatbot UIs are not APIs. Sending customer tickets to a web UI is a leak: you do not control retention, training, or who screenshots the thread. Integration means a key in the environment, HTTPS from **your** server, and a written data policy.

## Tokenizers and evals when you swap

Keep \`complete(messages)\` behind **your** function. Swap hosted vs local as a config change. Re-run the eval. Tokenizers differ, so prompts that depend on exact token counts, or on a stop sequence that is one token in model A and three in model B, need a second look. Chat templates differ. A system prompt that was “short” on a hosted tokenizer can blow the window on a local one.

You still do not get truth from open weights. You get control. Truth still needs tools, retrieval, and evals.

## What goes wrong

- **Choosing open because it feels virtuous**, then discovering you have no one to page when the GPU node dies.
- **Choosing hosted because it is easy**, then pasting secrets into a consumer UI “just to try.”
- **Fine-tuning first** to “make it know our docs.” Retrieval is cheaper to iterate. Fine-tune when retrieval lost on a measured set.
- **Ignoring licenses** until legal reviews the week before launch.
- **Assuming evals are optional** because you can “see the weights.” Seeing tensors does not score tickets.

## How agents use this

Config: \`provider = hosted | local\`, \`model = name\`, \`base_url = ...\`. The agent loop stays the same. Tests use a fake client. Production uses the config. When privacy says local, the router’s catalog is the local list — including “we do not have a 70B, so this step is extract-only on a 7B with a schema.”

Log the provider and the model id on every span. A week of traces will tell you whether “we must self-host” was a real constraint or a slogan. If you self-host, log GPU queue time too. Latency is part of which model you chose.

> **Warning:** Sending customer tickets to a consumer chatbot UI is not an API integration. It is a leak.

\`\`\`quiz
What do you still not get from open weights?
- A tokenizer
- *A guarantee that outputs are true or safe
- The ability to host the model
- The ability to fine-tune
explain: Open weights add control. Truth still needs tools, retrieval, and evals. Hosting is not honesty.
\`\`\`
`,
  },
  {
    slug: "vendor-apis",
    title: "Vendor APIs",
    summary:
      "Chat is an HTTP POST with a model name and a message list. The SDK is a thin costume. The server is stateless.",
    minutes: 21,
    level: "beginner",
    md: `
You will talk to almost every commercial LLM through a **chat** API: an HTTP **POST** with a JSON body. HTTP is the web’s request/response protocol. POST means “here is a body, do this.” If you can write the JSON, you can debug the SDK. The SDK is a library that builds that JSON and parses the reply. When the SDK is confusing, print the JSON.

A typical request includes:

- \`model\` — which weights + tokenizer + alignment (a name like a product SKU)
- \`messages\` — a list of \`role\` + \`content\` (later: tool calls as structured fields)
- \`temperature\`, \`max_tokens\` — decoding knobs (own lesson)
- optional: \`tools\`, \`response_format\`, seed, stop sequences, whether to stream

A typical response includes:

- **output messages** — usually one assistant turn
- **usage** — prompt tokens vs completion tokens (and sometimes cached tokens)
- **finish reason** — \`stop\`, \`length\`, \`tool_calls\`, content filter
- **id** — a request id you log next to your trace step

Agents that ignore \`finish_reason\` and \`usage\` are flying without instruments. Truncated JSON looks like a “dumb model.” A silent 2x bill looks like “the model was thinking.” Both are readable from the response if you store it.

## The server does not remember you

**You** append the assistant and tool turns. The server is **stateless**. Stateless means: this POST does not know about the last POST unless you resend the history. If you forget to send the tool result back, the model never saw it. “The API has memory” is a myth. **Your transcript** is the memory.

Some vendor products offer “threads” or stored conversations. That is **their** database wrapped as a convenience. For an agent you operate, keep the transcript in **your** store so you can redact, trim, test, and replay. Convenience threads are fine for a chat UI toy. They are a problem when you need to prove what the model saw.

Joeven’s Try it boxes cannot hit a network. The client below records calls, checks the schema, and returns a scripted assistant turn. Production looks the same until \`complete()\` becomes an HTTP POST. That is the point of the fake: your loop should not care.

\`\`\`viz flow
title A chat call is a POST
layout lr
node req Messages
node post HTTP POST
node resp Text + usage
edge req post
edge post resp
caption The server is stateless. You resend the list. The SDK is a thin costume on this JSON.
\`\`\`

\`\`\`tryit python
import json

class FakeChatClient:
    def __init__(self, script):
        self.script = list(script)
        self.calls = []

    def complete(self, model, messages, temperature=0, max_tokens=256):
        for m in messages:
            if m.get("role") not in {"system", "user", "assistant", "tool"}:
                raise ValueError("bad role: " + str(m.get("role")))
            if "content" not in m:
                raise ValueError("missing content")
        self.calls.append({"model": model, "n": len(messages)})
        if not self.script:
            raise RuntimeError("model over-called")
        text = self.script.pop(0)
        prompt_tokens = sum(len(str(m["content"]).split()) for m in messages)
        return {
            "message": {"role": "assistant", "content": text},
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": len(text.split()),
            },
            "finish_reason": "stop",
        }

client = FakeChatClient(["Need a tool: get_job", "Job 17 failed: timeout"])
msgs = [
    {"role": "system", "content": "You are a job-status agent."},
    {"role": "user", "content": "Status of job 17?"},
]
r1 = client.complete("tiny-1", msgs, temperature=0)
print(json.dumps(r1, indent=2))
msgs.append(r1["message"])
msgs.append({"role": "tool", "content": "status=failed error=timeout"})
r2 = client.complete("tiny-1", msgs)
print("second:", r2["message"]["content"])
print("calls billed:", len(client.calls))
\`\`\`

The first print is a JSON object with an assistant message, usage, and \`finish_reason\`. You then append that message **and** a tool result, and call again. The second answer can use the observation. \`calls billed\` is 2. That is an agent loop: two POSTs, growing messages, two lines on the invoice. If you skipped \`msgs.append\` for the tool, the second call would still only know the question.

The fake counts prompt tokens as words. Real usage comes from the vendor tokenizer. Use their \`usage\` for money. Use a local estimate only for packing. Mixing the two is how you “stay under budget” in a notebook and overflow in production.

## Vendor differences are real but shallow

OpenAI-style, Anthropic-style, Gemini-style: roles, where the system prompt sits, the JSON shape of a tool call, whether there is a \`developer\` role. Wrap one \`complete(messages)\` so the agent loop does not care. Inside the wrapper, map to the vendor. Do not sprinkle vendor field names through the planner.

Auth: a bearer token or a vendor-specific key header. The key lives in the **environment**, not in the message list, not in the system prompt, not in a git repo. If the model ever sees \`sk-live-...\`, you have a logging and prompt-injection problem. Rotate the key.

Timeouts: set a client timeout shorter than the user will wait, and shorter than your spend-cap patience. A hung POST is the errors lesson. Headers: request id you generate, plus the vendor’s id you store from the response. Content-type JSON. Do not gzip the body unless you know the vendor accepts it.

SDKs hide retries. Turn off the SDK’s silent retry or you will double-call next to your own retry policy. Print the JSON once in a staging log (redacted) when you integrate a new vendor; after that, trust your wrapper tests.

Idempotency and retries are the next lesson. Streaming is the lesson after that. Structured output is a later part. This lesson is the POST and the transcript.

## A walkthrough: job 17

The user asks for job 17. Your code builds \`messages\`: system spec, user text. POST. Assistant says it needs \`get_job\`. You run \`get_job(17)\` in **your** process. You append a tool message. POST again. Assistant quotes \`status=failed\`. You parse, you stop. Four objects in the list. Two billed calls. One tool execution that never went to the GPU. That split is the whole craft.

## What goes wrong

- **Treating the SDK session as memory** and sending only the new user line.
- **Dropping usage** so finance cannot see which feature burned the budget.
- **Putting API keys in messages** “so the model can call the vendor.” The model should not hold the key. Your tool should.
- **Parsing only \`choices[0].message.content\`** and ignoring \`tool_calls\` and \`finish_reason\`.
- **Retrying the whole loop** when one POST 500s, duplicating a refund tool. Next lesson.

## How agents use this

Log every request id, model, usage, and finish reason next to the trace step. When finance asks why the bill jumped, you will answer with a **call count** and a token sum, not with a story about thinking.

Unit-test the loop with \`FakeChatClient\`. Script the assistant turns. Assert which tool ran. You do not need a paid key to prove the transcript is appended correctly. You need a paid key to prove the vendor’s live schema still matches your wrapper — that is a smaller, rarer test.

Never put API keys in messages. Never log raw keys. Redact in the logger, not as a comment.

The fake counts words as tokens. Production uses \`usage\`. Tests assert call count and message roles. That is enough to catch “forgot to append tool” without spending a dollar.

> **Warning:** Streaming is UX, not a different model. Parse the **final** tool call after you assemble the text (or use native tool-call events). Next lessons: when the POST fails, then streaming.

\`\`\`quiz
Who stores the conversation between two HTTP calls to a typical chat API?
- The GPU
- *Your application: you resend the message list each time
- DNS
- The tokenizer
explain: Chat APIs are stateless. The transcript is your object. Convenience “threads” are still someone’s database — prefer yours for agents.
\`\`\`
`,
  },
  {
    slug: "errors-retries",
    title: "Errors and Retries",
    summary:
      "401, 429, 5xx, and timeouts are agent outcomes. Retry only what is safe to repeat. Map errors in code, not in the prompt.",
    minutes: 20,
    level: "beginner",
    md: `
Networks fail. Vendors fail. Your key fails. The model is slow. A filter blanks the completion. An agent that treats every exception as “the model was dumb” will double-refund and then loop.

An **error** here is anything that is not a usable assistant turn: HTTP status codes, SDK exceptions, empty filtered content, a hang past your timeout. Map those signals to **outcomes** your loop already understands: retry, stop, handoff. Do not invent a fourth control plane inside the prompt (“if you see an error, try harder”).

| Signal | Typical meaning | Agent move |
|---|---|---|
| **401 / 403** | Bad, expired, or blocked key; or you may not use this model | Stop. Page a human. Do not retry. |
| **429** | Rate limit or quota | Wait (backoff), then retry **read-only** or idempotent calls |
| **5xx** | Their server fault | Retry a few times with backoff, then hand off |
| **timeout** | Slow or stuck; maybe the write happened | Retry if the call was safe; else check for a duplicate |
| **content filter** | Finish with no useful text, or an HTTP error | Do not parse empty JSON. Handoff or refuse. |
| **400** on your body | You sent a bad schema (wrong role, huge payload) | Stop and fix the client. Retrying the same body is a loop. |

**Handoff** means: stop the model loop and give a human (or a ticket queue) the trace. **Backoff** means: wait longer each time, with a cap, so you do not hammer a 429 into a ban.

Retry **only** when the call is safe to repeat, or use an **idempotency key**. Idempotent means a second POST with the same key is a no-op or returns the same result, not a second refund. A retry that re-runs \`refund_customer\` without a key is a double refund. Time out **shorter** than your user will wait, then handoff. An agent that waits 120 seconds on a payment API while the user stares is already a product failure.

## Safe vs unsafe

\`get_job\` is a **read**. Reads are usually safe to retry. \`refund\` is a **write**. Writes need a story: a key, a “get refund by id” check, or a human. Timeouts on writes are **ambiguous**: maybe the vendor ran the refund and your HTTP client gave up; maybe they never saw the request. Blind retry is how you pay twice.

The LLM call itself is usually a read in the sense that it does not charge the customer’s card. It still **costs tokens** if the vendor bills a partial. It still **must not** be retried forever. Cap attempts. Count them on the trace.

\`\`\`viz flow
title Map the error before you hammer retry
layout lr
node err Error
node retry Retry if safe
node stop Stop or handoff
edge err retry
edge err stop
caption 401 stops. 429 on a read can wait. A refund timeout is not “try again so the user is happy.”
\`\`\`

\`\`\`tryit python
def decide(error, tool_is_safe):
    if error in {"401", "403"}:
        return "stop"
    if error == "filter":
        return "handoff"
    if error in {"429", "500", "timeout"} and tool_is_safe:
        return "retry"
    if error in {"429", "500", "timeout"} and not tool_is_safe:
        return "handoff"
    return "stop"

cases = [
    ("401", True),
    ("429", True),
    ("429", False),
    ("timeout", False),
    ("filter", True),
]
for err, safe in cases:
    print("error", err, "safe", safe, "->", decide(err, safe))
\`\`\`

Read the five lines. 401 always stops, even if the tool was safe — a bad key will not heal. 429 on a safe tool retries. 429 on an unsafe tool hands off (or you would need an idempotency path not shown here). Timeout on an unsafe tool hands off. Filter hands off; you do not parse empty content. That table **is** the policy. Put it next to the HTTP client.

Backoff: wait 1s, 2s, 4s, then cap (for example 16s). Add a small random extra so many agents do not retry in lockstep. Do not hammer 429. Do not retry 401. Do not retry 400 that is your JSON.

## Filters are not \`{}\`

Empty filtered content is **not** an empty object. If you \`json.loads\` it, you will crash or invent a tool. Branch on finish reason and status **first**. The safety-filters lesson will go deeper. Here: treat filter as a stop, not as a parse.

## A walkthrough: refund timeout

The assistant emits \`refund\` with amount 40. Your executor POSTs the payment API. The client times out at 10 seconds. You do not know if 40 left the account. \`decide("timeout", False)\` is handoff. A human (or a reconcilers job) checks the payment id. If you had an idempotency key, you could POST again with the same key and the processor would return the original refund. Without the key, code must not “just retry so the user is happy.”

The LLM retry is a different object. If the **chat** POST 500s before any tool runs, retrying the chat is usually safe. If the chat succeeded, you already have an assistant message, and you already ran the tool, do not replay the whole trace from step 0.

## What goes wrong

- **Retry everything** with a generic \`except Exception\`. You will retry auth failures and double writes.
- **No cap.** Ten 429s with no sleep is a ban. Ten 500s is a token furnace if the vendor still bills.
- **Parsing error bodies as model JSON.** A vendor HTML 502 is not \`{"action": "get_job"}\`.
- **Hiding the error class** so the trace says “model failed.” Finance and ops need \`429\` vs \`timeout\`.
- **Retrying a filter with a sneakier prompt.** That is how you get banned. Change the product, not the jailbreak.

## How agents use this

Put \`decide(error, safe)\` next to the HTTP client, not inside the prompt. Each tool declaration should include \`safe_to_retry: true/false\` (or “idempotent if key present”). Log the error class, attempt number, and sleep on the trace.

Circuit: if 50% of calls to a vendor 503 in five minutes, stop sending that model and fail closed or switch a pre-approved backup. That is ops, not a cleverer temperature.

Idempotency keys belong on money and deletes. Reads can retry. Writes need a story. The Tools track will go deeper on idempotency. This lesson is the LLM POST and the first hop into tools.

> **Tip:** Time out shorter than the user’s patience. Then handoff. A hanging spinner is not “robust.”

\`\`\`quiz
A refund tool timed out. You do not have an idempotency key. What next?
- Retry immediately so the user is happy
- *Handoff or check whether the refund already happened; a blind retry can pay twice
- Set temperature to 0 and retry
- Drop the system prompt
explain: Timeouts on side effects are ambiguous. Retrying a write is how you double-charge. Temperature does not make HTTP safe.
\`\`\`
`,
  },
  {
    slug: "streaming",
    title: "Streaming",
    summary:
      "Streaming shows tokens as they arrive. The model is the same. Parse only finished text, or native tool events.",
    minutes: 19,
    level: "beginner",
    md: `
**Streaming** sends pieces of the completion as they are generated. The UI can type. The user feels faster. The **model is the same**. You did not get a smarter network. You got a different delivery: many small events instead of one JSON blob at the end.

The Transformers track split **prefill** (read the whole prompt) from **decode** (emit one token at a time). Streaming does not skip prefill. The first token still waits until the prompt is processed. A spinner during that wait is honest. A fake “thinking” paragraph you wrote in the client is a costume.

Rules that keep agents from executing garbage:

- Concatenate **deltas** into one string (a delta is a small piece of text).
- Validate JSON / tool calls only when the stream **ends**, or when the vendor sends a finished tool-call event.
- Partial JSON is not an action.
- If the stream dies mid-sentence, treat it like a timeout or a truncated completion (\`finish_reason\` may be missing; you must still decide).

## Why partial JSON is poison

A tool call that looks like \`{"ac\` is not \`{"action": "get_job"}\`. If you \`json.loads\` early, you throw. If you “repair” early, you guess a key. If you execute the guess, you might call the wrong tool or the right tool with a truncated id. Agents fail here in production when someone wanted the UI to feel snappy.

Some vendors stream **native** \`tool_calls\` objects with an index and a finished flag. Prefer those over regex on prose. Still validate arguments against **your** schema. Vendors are not your type checker. A finished native call with \`job_id: -1\` is perfect JSON and a bad business object.

\`\`\`viz strip
title Assemble deltas, then parse
chip {"ac
chip tion":
chip "get_job"}
caption One chunk is not an action. Join the pieces. Parse only the finished string.
\`\`\`

\`\`\`tryit python
deltas = ['{"ac', 'tion": "get_job", ', '"job_id": 17}']

def assemble(chunks):
    return "".join(chunks)

def parse_action(text):
    import json
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        return None
    if obj.get("action") == "get_job" and isinstance(obj.get("job_id"), int):
        return obj
    return None

partial = assemble(deltas[:1])
full = assemble(deltas)
print("after 1 chunk", repr(partial), "parsed", parse_action(partial))
print("after all", repr(full), "parsed", parse_action(full))
\`\`\`

After one chunk the text is \`'{"ac'\` and \`parsed\` is \`None\`. After all chunks you get a dict with \`get_job\` and \`17\`. If you had executed the partial, you would have executed garbage. The lesson is mechanical: **assemble, then parse**.

Try printing \`parse_action(assemble(deltas[:2]))\`. You still should not get a valid object. Two thirds of a JSON string is not an action either.

## UX without lying

Use streaming for **user-visible prose**: a draft email, a status explanation, a “here is what I found.” For tools, wait for a complete object (or the native event). You can still show “Calling get_job…” from **your** code once the call is validated — that is your UI, not a partial model string.

Show a spinner during prefill. First token is not “the model started thinking in the UI.” It is “prefill finished.” If first token is slow, the prompt is fat, the vendor is loaded, or the region is wrong. That is a packing and capacity problem (later lessons), not a reason to parse early.

If you stream to a user, decide what happens when they hit stop. Cancel the HTTP stream. Do **not** execute a half tool call. Do **not** store an incomplete assistant message as if it were a finished action. You may store it as a truncated draft with \`finish_reason=cancelled\`.

Many vendors use server-sent events: many small JSON rows, each with a text delta or a tool-call delta, and a final row with usage. Assemble by **index** when they stream parallel tool arguments. Buffer bytes until you have a complete event; do not \`json.loads\` a half event line. If the connection dies, you may have usage missing — still treat the text as truncated.

Backpressure: if the UI cannot paint as fast as tokens arrive, drop paint frames, not tokens. Your assembler must keep every delta. The user-visible typewriter is optional. The string you parse is not.

## Logging and secrets

Logging every delta can leak partial secrets into debug stores and can 10x your log volume. Log the **assembled** message, redacted. If you need to debug stream assembly, do it in a locked debug bucket for a sample of traces, not in the product warehouse.

A mid-stream disconnect is an error. Apply the previous lesson: if no tool ran, you may retry the LLM call; if you already displayed a partial refund sentence, do not also execute a guessed refund.

Usage often arrives only on the last event. If you never see a final event, you have no usage and no finish reason — treat as timeout/truncated, not as \`stop\`. Do not parse. Do not bill-guess from character counts as if they were vendor usage; you may estimate for the cap, then reconcile when a later retry succeeds.

Streaming a tool call to a customer UI is usually the wrong UX. Stream the *explanation* after the tool succeeded. The typewriter on arguments is how a job id appears one digit at a time and someone screenshots a half id.

## What goes wrong

- **json.loads on every delta** “for snappiness.”
- **Regex for the first curly brace** and executing whatever follows.
- **Treating stream UX as a different model** and changing temperature only on streamed calls, accidentally.
- **Not handling cancel.** The user clicked stop; your executor still POSTed the payment API.
- **Storing raw deltas** with API keys the user pasted mid-sentence.

## How agents use this

Two paths in code: \`complete()\` (one blob) for tools and tests; \`stream()\` for prose. Both return the same finished type: message + usage + finish_reason. Tests should use \`complete()\`. Do not require a stream assembler to unit-test the parser.

When the vendor supports native tool events, parse those. When it only streams text, assemble then \`json.loads\` then validate. Cap \`max_tokens\` so a stream cannot ramble for a novel while you wait to parse.

Tests: one chunk fails parse; all chunks pass; cancel means no tool. If you cannot write those three tests, you are not ready to stream tools.

> **Warning:** Partial JSON is not an action. Assemble, then parse. Logging every delta is how secrets and noise enter the warehouse.

\`\`\`quiz
When should you json.loads a streamed tool call?
- After the first character so the agent feels snappy
- *After the stream finishes (or the vendor marks the tool call complete)
- Whenever a curly brace appears
- Only on 429
explain: Partial JSON is not an action. Assemble, then parse. 429 is a rate limit, not a parse hint.
\`\`\`
`,
  },
];
