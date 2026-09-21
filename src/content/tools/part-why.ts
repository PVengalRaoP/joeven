import type { RawLesson } from "@/lib/types";

export const toolsWhy: RawLesson[] = [
  {
    slug: "why-tools",
    title: "Why Tools",
    summary:
      "Weights guess. Tools fetch, compute, and change the world. Agents need both.",
    minutes: 20,
    level: "beginner",
    md: `
A language model predicts the next token. That is the whole trick. It does not know the time, your tickets, whether a refund landed, or what is in ticket 9182. It will still **speak** as if it does. Fluency is not a database. Confidence is not a side effect.

A **tool** is a function **your code** runs because the model asked — or because your workflow asked, without a model in the middle. The model proposes a name and arguments. The runtime validates, dispatches, and logs. The world is the only source of truth. If there is no log line, it did not happen.

This track is about those functions and the runtime around them: schema, dispatch, idempotency, sandboxes, MCP, and permissions **your process actually enforces**. The agent loop is a **client** of tools. It does not become a tool by writing a story about one.

Weights freeze at train time. Tools run now. You need both. Weights give you language, ranking, and a guess at *which* tool to call. Tools give you four things weights cannot:

| Need | Weights | Tool |
|---|---|---|
| Fresh facts | Frozen at train time | Search, SQL, HTTP GET |
| Side effects | Cannot email or pay | Mail, GitHub, refunds |
| Trusted math | Approximate arithmetic | Calculator, interpreter |
| Private data | Not in the corpus | Your CRM, with auth |

If the user asks “what is in ticket 9182?”, the honest design is: call \`get_ticket\`. The dishonest design is: hope the model memorized Jira. The model may still *summarize* the ticket after the tool returns. Summarizing is language. Fetching is a tool.

\`\`\`viz flow
title Weights guess. Tools act.
layout lr
node ask Ask
node tool Tool
node world World
edge ask tool
edge tool world
caption Fresh facts and side effects live in functions you run now.
\`\`\`

## Without tools you have a chatbot

A chatbot continues text. An agent with tools has **hands**. Hands are not a personality. They are a catalog of functions plus a dispatcher that will not run unknown names.

The split is easy to blur in a demo. You print “I emailed the user” and the audience nods. No mail server ran. The next demo adds “I refunded INV-17.” Still no ledger. Then you ship, and a real refund function exists, and the model has learned that *saying* the action is the same as *doing* it. That is the failure this lesson exists to prevent.

Never let the model “execute” by writing a story about having executed. The UI must not show “Refund sent” because the assistant wrote a polite paragraph. Only the dispatcher’s log is truth. Later lessons make that log mechanical. Here you only need the rule: **speech is not a side effect**.

Tools are also how you stop paying a model to do work a function already knows. If the step is “count open bugs in this dict,” do not prompt. Call \`tool_sprint\`. Deterministic work belongs in code. The model should spend tokens on *choosing* and *wording*, not on pretending to have a clock.

## What a tool is allowed to be

A tool is small and typed. It has a stable name, a schema for arguments, a return blob, and a place in a registry. It is not a 40-page SDK dumped into the prompt. It is not “the internet.” It is not a comment in Figma. If the runtime cannot call it, it is fan fiction. The next lessons name that test. Keep it in your head now: **callable or not a tool**.

A tool may be a read (observe the world) or a write (change it). Mixing them in one function named \`sync_customer\` is how traces lie. Split them. Reads are cheap to retry. Writes are product risk. You will spend a whole lesson on that split. The reason it exists is this one: weights cannot change the world, so every change must go through a named write.

Private data is the quiet reason companies add tools. The corpus does not contain Ada’s invoices. Your CRM does. The tool is the *only* legal path to that row, and it carries auth. If you paste Ada’s row into the system prompt “so the model knows,” you have turned private data into prompt text and given up the gate. Fetch through the tool. Pass the observation. Cap it.

Trusted math is the other quiet reason. Models are messy calculators. A calculator tool, a code interpreter in a sandbox, or a billing function that uses integer cents — those are tools. Do not ask the model to multiply refunds in its head and then wire money.

## Freshness is a contract

“As of” is part of the answer. A closed-book model will tell you the sprint is all green because that sentence was likely in 2023. A tool can return \`bugs_open: 7\` and \`as_of: 2026-09-21\`. Put the timestamp in the observation. The model may still ignore it. Your UI should still show it. Humans debug dates. Models do not feel embarrassed about being a year off.

Search, HTTP GET, and SQL are freshness tools. They can also be injection surfaces and cost centers. That does not make them optional. It makes the runtime’s job bigger: validate args, allowlist hosts, truncate results. Those are later lessons. The point now is: **if the fact can change, it is not in the weights**.

## Side effects are the product

Mail, GitHub, refunds, ticket state, calendar invites: these are why someone funded the agent. They are also why someone will page you. A wrong \`get_job\` wastes tokens. A wrong \`refund\` wastes money. Treat writes as the product, not as a clever extra.

The model does not “have” your Stripe key. It has a string that looks like arguments. If your code does not run, nothing in the world changes. That is good. It is why a demo that prints success with no backend is a lie, and why a production agent that skips the dispatcher is a larger lie.

## How the classroom box maps to a real catalog

The live box is a tiny closed world. \`WEIGHTS\` is the frozen book. \`WORLD\` is the live dict. \`closed_book\` answers from training-like memory. \`tool_sprint\` reads \`WORLD\`. \`agent\` is a fake chooser: if the question is about the sprint, it calls the tool; otherwise it stays closed-book. There is no vendor API. There is no loop library. That is the point. The loop, when you build one, is a client of this same idea: choose a name, run a function, use the blob.

Run it. Read the three prints. The closed-book sprint line is **stale on purpose**. The tool sprint line can be checked against \`WORLD\`. The capital of France never needed a tool — weights are allowed to know Paris. Knowing Paris does not mean knowing your bug count.

Change \`WORLD["bugs_open"]\` and run again. The tool answer moves. The closed-book answer does not. That is the whole argument for tools, in one dict.

\`\`\`tryit python
WEIGHTS = {
    "capital of france": "Paris",
    "sprint status": "All green (training cutoff: 2023)",
}
WORLD = {"bugs_open": 7, "as_of": "2026-09-21"}

def closed_book(question):
    q = question.lower()
    for k, v in WEIGHTS.items():
        if k in q:
            return v
    return "I am not sure (and might make it up)."

def tool_sprint():
    return dict(WORLD)

def agent(question):
    q = question.lower()
    if "sprint" in q or "bugs" in q:
        obs = tool_sprint()
        return "Open bugs: " + str(obs["bugs_open"]) + " (as of " + obs["as_of"] + ")"
    return closed_book(question)

print("closed-book sprint:", closed_book("sprint status"))
print("tool sprint:", agent("sprint status"))
print("closed-book fact:", agent("capital of France"))
print("world is still", WORLD)
\`\`\`

**What printed:** closed-book sprint is the 2023 green sentence. Tool sprint names 7 bugs and today’s date. Capital of France is Paris from weights. \`WORLD\` did not change — this tool was a read. If your UI had shown “all green” from the first line, you would have lied about the sprint.

## What goes wrong

Teams skip tools because the model “already knows” the handbook. Then finance changes the refund window and the bot keeps quoting the old one. Teams skip tools because HTTP is fussy. Then they paste a CSV into the prompt every morning. Teams add tools and then let the model narrate success without checking the log. Users learn to trust the paragraph. On-call learns the paragraph was fiction.

The other failure is **tool as personality**. “You have access to the internet” in a system prompt is not a tool. The runtime still cannot browse. You will meet that lesson by name. Do not advertise hands you did not build.

## How agents use this

Skip the model when a deterministic function already answers the step. Tools are not only for the LLM — your workflow can call them too. A cron that calls \`get_ticket\` is using the same catalog the agent uses. That is a feature: one registry, many clients.

When you design a product, list the questions that **must** hit a tool: anything fresh, private, numeric-with-money, or world-changing. If that list is empty, you may not need an agent. You may need a FAQ. If the list is long, you need a runtime, not a longer prompt.

Name tools after jobs, not after vendors. \`get_ticket\` not \`jira_magic\`. The loop should not care which HTTP client sits behind the name. The loop is a client. The tool is the contract.

> **Note:** Later lessons add schema, dispatch, and permissions. None of those replace this rule: if the fact can move, fetch it.

\`\`\`quiz
What do tools add that model weights cannot?
- Extra adjectives in the system prompt
- *Fresh data, side effects, and computations your runtime actually runs
- A guarantee the model never errs
- Unlimited context without tokens
explain: Tools are functions you run. Weights are frozen guesses. Truth and side effects live in the runtime.
\`\`\`
`,
  },
  {
    slug: "model-vs-runtime",
    title: "Model vs Runtime",
    summary:
      "The model proposes a name and arguments. Your code validates, runs, and logs. That split is the product.",
    minutes: 19,
    level: "beginner",
    md: `
Keep three jobs separate, or you will debug them as one blob at 3 a.m.

- **Model:** choose a tool name and arguments, or a final answer
- **Your runtime:** validate args, check permissions, execute, truncate the result
- **The world:** whether the goal is actually done

The model never “has” your database password. It has a **string** that looks like arguments. If your code does not run, nothing in the world changes. That is the security boundary and the honesty boundary at the same time.

This split **is** the product. Frameworks add glue. Vendors add a “tools” flag. None of that moves execution into the GPU. The GPU proposes. Your process disposes.

\`\`\`viz flow
title Three jobs, not one blob
layout lr
node model Model proposes
node run Runtime runs
node log Log is truth
edge model run
edge run log
caption The GPU asks. Your process executes. The log is the product of record.
\`\`\`

## Why the split exists

Models are untrusted. They are trained to be helpful, not to be your IAM. They will emit \`refund\` with a guessed invoice id. They will claim they already refunded. They will mix a thought with a tool call. If the runtime treats the assistant’s last sentence as a ledger, you have no product. You have a narrator.

The runtime is trusted in the opposite direction: it holds keys, talks to Stripe, opens files, hits MCP servers. That trust is dangerous if it believes the model. So the runtime must **not** believe the model. It believes a parsed name, a validated argument object, a policy table, and a function return.

The world is a third party. Your function can return \`ok: true\` and still be wrong if Stripe later reverses, or if the ticket was already closed. Traces should record what **your** function returned. Reconciliation with the world is a later job (webhooks, polls). Do not pretend the model can see Stripe directly.

## Trace is truth

Your UI must not show “Refund sent” because the assistant wrote a polite paragraph. Only the dispatcher’s log is truth. If the model **claims** it called a tool without emitting a tool call, treat the claim as fiction. Store the claim if you want to grade honesty. Do not store it as an event in the ledger.

A useful log line is boring: tool name, args (redacted), result size, duration, policy version, who approved. You cannot replay 3 a.m. refunds from a chat screenshot. You can replay them from that line.

Redact. Invoice ids may stay. Card numbers, tokens, emails, and raw SQL must not. Truncation is a later lesson; redaction starts now: if you would not paste it into Slack, do not paste it into the trace UI the model will see on the next turn.

## The model is a client, not a kernel

The agent loop — assemble context, call the model, parse, execute, stop — is a **client** of the tool runtime. It should look like any other client: it sends a name and a dict, it gets a JSON blob, it does not hold the Stripe key. If the loop inlines \`requests.post\` next to the prompt, you have collapsed client and kernel. Then a parser bug is a payment bug.

Treat the dispatcher as an internal API. Unit-test it with a fake model: a list of \`{name, args}\` dicts. You do not need an LLM to prove unknown names fail and known names return JSON. The next lessons build that dispatcher. This lesson only demands that you **see** the three jobs.

## Claims versus calls

People write “the model refunded the user.” No. The model emitted text. Maybe that text was a structured tool call. Maybe it was a paragraph. Only the second job — runtime — can refund. Speak that way in tickets or you will assign the incident to “the AI” instead of to a missing validator.

The live box makes the difference visible. \`ui_status\` looks at a flag \`ran\`, not at the politeness of \`assistant_text\`. The first print is a story with an empty log. After \`refund("INV-17")\`, the log has a row, and the UI is allowed to say the refund happened.

\`\`\`tryit python
LOG = []

def refund(invoice_id):
    LOG.append({"tool": "refund", "invoice_id": invoice_id})
    return {"ok": True, "invoice_id": invoice_id}

def ui_status(assistant_text, ran):
    if ran:
        return "Refund sent (from log)"
    if "refund" in assistant_text.lower():
        return "Assistant claimed a refund — not in the log"
    return "No refund"

print(ui_status("I have refunded INV-17.", ran=False))
print("log empty", LOG)
print(refund("INV-17"))
print(ui_status("Done.", ran=True))
print("log", LOG)
\`\`\`

**What printed:** the first status line is a claim with an empty log. \`refund\` appends a row and returns ok. The second status is allowed because \`ran\` is true. The log finally names \`INV-17\`. That is the only sequence a product should trust.

## What goes wrong

A chat UI that streams tokens and paints “Done” when the model says Done. A support agent that posts internal notes from the assistant message instead of from tool results. A test suite that asserts on the final sentence and never opens \`LOG\`. A wrapper that “helpfully” executes whatever JSON appears inside a thought. All of these collapse model and runtime.

The opposite bug is also real: a runtime so chatty that it executes tools the model did not ask for “because the user probably wants a refund.” That is not a runtime. That is a second unlogged agent. The model proposes. The policy may **deny**. It should not **invent** a call.

## How to test the split

Write two fixtures. One: assistant text mentions refund, no tool call in the parsed decision, log stays empty, UI must not show success. Two: parsed call \`refund\` with valid args, function returns, log has one row, UI may show success. Neither fixture needs a vendor model. If you cannot write them, you do not have a split. You have a script.

## How agents use this

Every tool call writes an event: name, args (redacted), result size, duration, who approved. If you cannot replay the log, you cannot debug 3 a.m. refunds. Put the event in the same store the loop already uses for memory — as **data**, not as new policy.

When you add a tool, you add a runtime path, not a prompt sentence. The prompt may mention the name. The name must exist in the registry or the mention is a lie. Generate the prompt snippet from the registry so those two lists cannot drift. That generation is runtime work, not poetry.

> **Warning:** A demo that prints “I emailed the user” with no mail server is a lie. Treat it as a failed test, not as a UX flourish.

\`\`\`quiz
Who decides that a refund really happened?
- The assistant’s last sentence
- *Your runtime log after the refund function returned
- The system prompt
- A confident thought
explain: The model proposes. The runtime executes. The log is the product of record.
\`\`\`
`,
  },
  {
    slug: "read-vs-write",
    title: "Read vs Write Tools",
    summary:
      "Getters observe. Writers change the world. Mix them and retries become incidents.",
    minutes: 21,
    level: "beginner",
    md: `
Split the catalog into two families and put the label **on the tool**, not only in a prompt comment.

- **Read tools** — \`get_ticket\`, \`search\`, \`list_orders\`. They should not change the world. Safe to retry. Often safe to run in parallel.
- **Write tools** — \`refund\`, \`send_email\`, \`merge_pr\`. They have **side effects**. Retry only if they are idempotent. Often need a human.

If a “read” tool secretly writes, your traces lie and your allowlists fail. \`sync_customer\` that “just updates the cache” is a write. Name it \`upsert_customer\`. The model will still mix them up sometimes. Your policy must not.

\`\`\`viz bars
title Reads retry. Writes cost.
bar Reads,3,0
bar Writes,1,1
caption Many reads in one turn can be fine. Two refunds are an incident.
\`\`\`

## Why the split is a runtime fact

Retries are normal. The HTTP client retries. The model retries because the first observation fell off the context. The user double-clicks Send. A read that runs twice should return the same kind of blob (maybe fresher). A write that runs twice should not send two emails unless you meant to.

Parallel calls are normal too. Models emit several tool calls in one turn. Independent reads can run together. Two refunds of the same invoice cannot, unless they share an idempotency key. You will get a lesson on parallel dispatch. It is unusable if you cannot label read versus write.

Permissions split the same way. A research session may have every read and zero writes. A billing session may have \`get_invoice\` plus a capped \`refund\`. If you only have one bucket called “tools,” you will ship \`run_shell\` next to \`search\` because they shared a config list.

## Side effects are the product risk

A wrong \`get_job\` wastes tokens. A wrong \`refund\` wastes money. Put risk on the tool itself: \`read\`, \`write\`, \`irreversible\`. Irreversible is a write with no realistic undo: wire transfers, public posts, deletes without a trash. Those wait for a human. Reads auto-approve. That policy belongs in the runtime table, not in “please be careful.”

Do not hide a write inside a getter. Engineers do this to save a round trip: \`get_or_create_ticket\`. Then every retry creates. Then the model calls it twice because the first observation truncated. Then you have three tickets. Split: \`get_ticket\` and \`create_ticket\` with an idempotency key. Extra round trips are cheaper than duplicate rows.

Logging must follow the label. Reads can log query and hit count. Writes must log before-and-after or a receipt id. If you cannot tell from the log whether the world changed, you labeled the tool wrong.

## Retries, caps, and order

Reads: retry on timeout with backoff. Cap total read calls per turn so a confused model cannot search forever. Writes: do not retry on timeout unless you have a key or a status poll. A timeout is not “nothing happened.” The mail server may have accepted the message after you hung up.

Order matters when a write and a read share state. \`close_ticket\` then \`get_ticket\` must be sequential. Two \`get_ticket\` calls can be parallel. \`refund\` plus \`send_mail\` is two writes: queue them, key them, or ask a human. Do not “optimize” them into one god tool to make order go away.

## The classroom world

Tickets and mail are enough to feel the split. \`get_ticket\` copies a row. \`close_ticket\` mutates \`state\`. \`send_mail\` appends to \`MAIL\`. The prints show: a read leaves the ticket open; a write closes it; two mails make two messages. That last fact is the incident. Reads can be sloppy. Writes cannot.

Try calling \`get_ticket\` twice. You should see the same title. Try calling \`send_mail\` twice with the same body. You should see \`count\` 2. That is why later lessons add keys. This lesson only makes you **want** them.

\`\`\`tryit python
TICKETS = {"9182": {"title": "Runner OOM", "state": "open"}}
MAIL = []

def get_ticket(ticket_id):
    row = TICKETS.get(ticket_id)
    if row is None:
        return {"error": "not_found"}
    return {"ok": True, "ticket": dict(row)}

def close_ticket(ticket_id):
    row = TICKETS.get(ticket_id)
    if row is None:
        return {"error": "not_found"}
    row["state"] = "closed"
    return {"ok": True, "ticket_id": ticket_id, "state": "closed"}

def send_mail(to, body):
    MAIL.append({"to": to, "body": body})
    return {"ok": True, "n": len(MAIL)}

print("read", get_ticket("9182"))
print("still open", TICKETS["9182"]["state"])
print("write", close_ticket("9182"))
print("now", TICKETS["9182"]["state"])
print("mail", send_mail("ada@example.com", "closed"))
print("mail again", send_mail("ada@example.com", "closed"), "count", len(MAIL))
\`\`\`

**What printed:** the first get is ok and the ticket is still open. Close returns closed and the dict agrees. Two \`send_mail\` calls leave two rows in \`MAIL\`. If this were production without a key, Ada would have two emails. Label \`send_mail\` a write. Cap it. Key it. Do not call it a getter.

## What goes wrong

A “search” tool that writes a telemetry row with PII. A “list_orders” that lazily creates the customer. A cache warmer named \`get_user\` that upserts. All of these make read-only sessions mutate production. Your allowlist said “reads only.” The function did not read the allowlist. The function did what it was written to do.

The other failure is refusing to label anything a write because “the model needs flexibility.” Flexibility is how you double-submit. Label every registry row. Default new tools to write until proven otherwise. Default-deny is cheaper than a surprise email.

## How to test the label

For each tool, write a fixture world. Call the tool twice. If the world (row, mail list, refunded flag) changed twice, it is a write — and it is not idempotent yet. If the world did not change, it is a read, or it is a write that already had a key. Put that test in CI. Do not argue from the name.

## How agents use this

The model may call many reads in one turn. Writes go through a tighter policy: caps, approvals, idempotency keys. Label every tool \`read\` or \`write\` in the registry, not only in the prompt. The loop reads that label when it decides parallel versus serial. The policy reads it when it decides auto-approve versus queue.

When you add a tool, fill the risk field before you write the description. If you cannot pick \`read\` or \`write\`, the tool is two tools. Split it. The agent loop is a client: it should not have to infer side effects from English. If a retry policy cannot be stated from the label alone, the label is wrong — split the function until a retry table is obvious.

> **Tip:** Irreversible is a subclass of write. Use it for money, public posts, and deletes. Humans see that color in the approval UI.

\`\`\`quiz
Which tools are usually safe to retry without extra keys?
- Refund and send_email
- *Read-only getters that do not change the world
- Any tool with a friendly name
- Tools the model called twice
explain: Reads should be cheap to retry. Writes need idempotency or they double-submit.
\`\`\`
`,
  },
  {
    slug: "not-a-tool",
    title: "What Is Not a Tool",
    summary:
      "A paragraph in a prompt is not a function. If the runtime cannot call it, it is fan fiction.",
    minutes: 18,
    level: "beginner",
    md: `
A tool is not:

- A sentence in the system prompt that *describes* an API
- A fake “I have access to the internet” persona
- A comment in the UI
- Dumping a 40-page SDK into context and hoping the model types a curl you then run as a string
- A Slack emoji, a sparkle icon, or a marketing bullet

If your runtime cannot **validate arguments and execute** it, it is not a tool. The model can still talk about it. Talking is not calling.

\`\`\`viz flow
title Callable or fan fiction
layout lr
node claim Prompt claim
node reg Registry
node run Execute
edge claim reg
edge reg run
caption If the runtime cannot call it, it is not a tool.
\`\`\`

This rule is how you keep the catalog honest. Prompting tracks already told you not to advertise missing tools. Here it is a **runtime** rule: the list you send to the model is generated from the same registry the dispatcher uses. If a name is missing from the dict, it is missing from the prompt. If someone comments out a handler on Friday, the name disappears from Monday’s sessions.

## Prompt text is not a handler

“You may browse the web” does not open a socket. “You may refund up to $50” does not cap Stripe. Those sentences can still help the model *choose*. They cannot *enforce*. Enforcement is schema, allowlists, and credentials. If you only have the sentence, you have theater.

SDK dumps fail in a second way. The model types a plausible curl. A junior wrapper pipes it to a shell. Now you have a tool you never designed: unrestricted command execution, named “the model was being helpful.” Register functions explicitly. Parse JSON. Call a Python function. Do not treat model text as a program.

UI copy fails in a third way. A button labeled “AI can file tickets” trains users. If \`create_ticket\` is not in the registry, the button is a bug. Product and runtime must share the catalog.

## Sync vs wait

**Synchronous** tools return a small JSON blob now (\`get_job\`). The loop can append the observation and call the model again in the same slice.

**Asynchronous** tools return a handle (\`job_id\`) because compile, email, or a human will take seconds to hours. Agents must poll or wait on a queue. If you pretend a 10-minute refund is sync, you will timeout and double-submit.

A handle is still a tool result. It is not a promise that the work finished. The next turn calls \`poll(job_id)\`. It does not invent “compile finished.” If poll says running, the loop should wait or stop, not start a second compile with a new id.

Long work belongs in a worker you already trust: a CI system, a mail provider, an approval queue. The tool starts it and returns an id. The tool does not block the Python process on \`sleep\` until the universe is done. Blocking is how one hung job freezes the agent.

## Registry is the only advertisement

The live box has a prompt claim and a runtime dict. \`PROMPTED\` says the assistant may browse. \`RUNTIME\` only has \`get_job\`. \`is_real_tool("browse_web")\` is false. That is the correct product state: the prompt lied, the registry did not, and only the registry counts. In a real system you would **fix the prompt** by generating it from \`RUNTIME\`, not by teaching the model to ignore the lie.

Jobs show the async shape. \`start_compile\` returns \`j1\` still running. \`poll("j1")\` is still running. \`poll("j2")\` is done. The model does not get to skip poll because it is impatient. Impatience is a retry incident.

\`\`\`tryit python
import json

PROMPTED = {"internet": "The assistant may browse the web."}
RUNTIME = {"get_job": True}

def is_real_tool(name):
    return name in RUNTIME

JOBS = {"j1": {"status": "running"}, "j2": {"status": "done", "result": "ok"}}

def start_compile():
    return {"job_id": "j1", "status": "running"}

def poll(job_id):
    return JOBS.get(job_id, {"error": "not_found"})

print("prompt claims internet", "internet" in PROMPTED)
print("runtime can browse", is_real_tool("browse_web"))
print("runtime can get_job", is_real_tool("get_job"))
print("start", json.dumps(start_compile()))
print("poll too soon", json.dumps(poll("j1")))
print("poll done job", json.dumps(poll("j2")))
print("unknown poll", json.dumps(poll("nope")))
\`\`\`

**What printed:** the prompt claims internet; browse is not in the runtime; \`get_job\` is. Start returns a running id. Polling \`j1\` is still running. Polling \`j2\` is done. Unknown ids are \`not_found\`, not “probably fine.” Advertise \`poll\`. Do not advertise browse.

## What else people mistake for tools

Retrieval is a tool when it is \`search(q)\` with a schema. A silent pre-fetch that pastes ten chunks into the system prompt is **not** a tool call. It is assembler work. The model did not choose it. You cannot log it as a call the model made. You can still log it as context. Do not confuse those logs.

Memory writes are tools if the agent chooses \`remember(note)\`. A hidden summary job after every turn is runtime. Both are fine. Names matter when you grade “did it call the right tool?”

MCP servers expose tools. MCP is a transport, not a brain and not a permission system. You will get two lessons on that. For now: a server that is not installed is not a tool, even if a blog post named it.

## How to test “is this a tool?”

Write \`is_real_tool(name)\` against the registry. For every name in the prompt fixture, assert true. For a name the marketing site loves, assert false until the handler exists. For async tools, assert that the start result contains a handle and that a second function polls it. If start returns a 10 MB log and no id, you built a sync trap.

## How agents use this

Advertise in the prompt **only** names that exist in the registry. Long jobs return ids. The next turn calls \`poll(job_id)\` — it does not invent “compile finished.” The loop is a client: it must understand \`running\` versus \`done\` as data, not as vibes.

When a vendor ships a new “computer use” demo, ask: what is the function signature, what is the allowlist, what is the log line? If those are missing, you watched a video, not a tool. A checkbox in an admin UI that says “enable browsing” is still not a tool until \`browse_web\` exists in the registry and the worker can actually fetch. Toggle the flag only after the handler, schema, and fixtures exist. Marketing copy that lists twenty integrations is a roadmap. The registry is the product.

> **Note:** Disabled tools must vanish from both prompt and dispatcher. A 404 from the dispatcher after you advertised the name is how models invent args for ghosts.

\`\`\`quiz
When is something a real tool?
- When the system prompt names it
- *When your runtime can validate args and execute it
- When the model writes “I called it”
- When the UI has a sparkle icon
explain: Tools are callable functions. Prompt text without a handler is fiction.
\`\`\`
`,
  },
];
