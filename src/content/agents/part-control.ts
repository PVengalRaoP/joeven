import type { RawLesson } from "@/lib/types";

export const agentsControl: RawLesson[] = [
  {
    slug: "agent-memory",
    title: "Working Memory in the Loop",
    summary:
      "Scratchpad, rolling summary, and retrieve-on-demand. The loop uses stores; it is not one vector soup.",
    minutes: 20,
    level: "intermediate",
    md: `
The RAG track named four stores. This lesson is how the **loop** uses them. Memory is not a vibe and it is not one cosine search over everything the agent ever said.

The assembler reads memory. Memory is not the context window. The window is a **view** over stores. If you dump the whole week into every call, you skipped the assembler budget. If you retrieve a thought from last Tuesday as if it were a fact, you skipped the distinction between stores.

| Kind | What the loop does |
|---|---|
| Scratchpad | Last N actions and observations, always in the assembler |
| Summary | Compress older turns when the window is full |
| Retrieve | Pull notes by query when the goal needs them |
| Profile | Stable user facts — not mixed into the scratchpad |

Do not dump the whole week into every call. Do not treat “memory” as one vector soup.

\`\`\`viz strip
title Four stores, not one soup
chip Scratch
chip Summary
chip Retrieve
chip Profile
caption RAM, a compress, notes on demand, and stable facts. Keep them apart.
\`\`\`

## Scratchpad is RAM

The scratchpad is the recent act/obs pairs. It is the ReAct scratchpad with a budget. Last N turns, always assembled. This is how step 4 sees step 3’s observation. Observe-before-finish depends on this store being honest.

When the window is full, older turns **roll into a summary**. They are not deleted forever (you may retrieve later). They are not pasted into every future prompt. They are not written into the system prompt as law. RAM overflows into a summary. The assembler stays on a budget.

N is a product choice (2, 4, 6). The live box uses 2 so you can see a roll. Production might use token weight, not turn count. The policy is the same: bound the RAM.

## Summary is lossy on purpose

A rolling summary is a compress: “searched docs, mentioned Paris.” You lose detail. That is the trade. If you need the detail again, retrieve (if you stored notes) or look at the trace (operators). Do not keep an unbounded summary either. Summaries that grow forever are a second furnace.

Summarize with code when you can (join old acts). Summarize with a model call when the window is large. Cap that call. Do not summarize every step if N is small.

The last observation should still sit on the scratchpad, not only in the summary. Truncate old, keep last. The assembler lesson said this. Memory is how you implement it.

## Retrieve is RAG, not reminiscence

Notes you \`remember()\` are durable facts or user preferences. Retrieve them by query when the goal needs them. “User wants C not F” is a profile note. It should not ride the scratchpad until it rolls off and dies.

Do not index every thought as a note. Thoughts are not facts. If you only have one vector index, you will retrieve a thought from last Tuesday as if it were a ticket status. Split stores even if the split is “list of strings” vs “last N dicts.” Vectors can wait. The loop needs the split now.

## Profile is stable

Profile is user or org facts that change rarely. Do not mix them into the scratchpad. Pin a short profile or retrieve on demand. If the user changes units, update the profile store, do not append a contradictory scratch line and hope.

## What the assembler should receive

\`for_assembler(query)\` returns a small object: summary string, scratch list, retrieved notes. That is the memory API. The assembler then applies a token budget. Memory should not return a novel. If notes are many, retrieve already ranked a few.

Typed state (next lesson) is **not** the same as these stores. Phase and ticket_id are a contract object. Scratchpad is a log. Do not encode phase only as a sentence in the summary. You will parse it wrong.

## Persistence

Long-running jobs later serialize memory into a store. Scratchpad plus summary plus notes plus profile. JSON is enough. Do not pickle a 4k “memory” string and call it architecture. Checkpoints should round-trip these fields.

## What not to remember, and when to retrieve

Not every string the model emits is a note. Thoughts are working scratch; they die with the window or live in the operator trace. Observations that are huge HTML should be truncated **before** they become scratch, then maybe stored as a pointer (doc id) you can retrieve. If you \`remember()\` every observation, retrieve becomes a junk drawer and the assembler will pack last Tuesday’s rain into a refund prompt.

Retrieve when the **goal** needs it, with a query you can log: “user units,” “ticket T1,” “policy refund window.” Vague queries (“context”) return noise. Retrieving on every step with the whole user message as the query is how you blow the budget and still miss the profile line. Once per phase is a reasonable default: gather may retrieve policy, apply may retrieve the ticket note, done retrieves nothing.

Profile updates are explicit. The user said “always Celsius” — that is \`remember\`, not an obs on the scratchpad. If you only append it as a turn, window 2 will roll it into a summary that might drop the word Celsius. Stable facts get a store that does not roll.

Amnesia in traces looks like thrash: same search, same q. Before you blame the model, print \`for_assembler\` for that step. Empty scratch is a missing \`add_turn\`. Empty notes with a profile that should have hit is a bad query. Fat scratch with an old failed call is the assembler imitating errors — memory did its job too well and the window was wrong.

Four stores is the design even if two of them are lists of strings in a dict. You can add vectors later. You cannot add a split after you indexed thoughts as facts.

## Common mistakes

- One vector index for thoughts, obs, and profile.
- Unbounded scratchpad.
- Deleting old turns forever with no summary and no trace.
- Putting profile in the system prompt as a page of wiki.
- Retrieving on every step with a vague query.
- Encoding ticket_id only in prose.

\`\`\`tryit python
class AgentMemory:
    def __init__(self, window=4):
        self.scratch = []
        self.notes = []
        self.summary = ""
        self.window = window

    def add_turn(self, act, obs):
        self.scratch.append({"act": act, "obs": obs})
        if len(self.scratch) > self.window:
            old = self.scratch.pop(0)
            extra = old["act"] + " -> " + str(old["obs"])
            if self.summary:
                self.summary = self.summary + "; " + extra
            else:
                self.summary = extra

    def remember(self, text):
        self.notes.append(text)

    def retrieve(self, q):
        hits = []
        for n in self.notes:
            if q.lower() in n.lower():
                hits.append(n)
        return hits

    def for_assembler(self, q):
        return {
            "summary": self.summary,
            "scratch": self.scratch,
            "notes": self.retrieve(q),
        }

m = AgentMemory(window=2)
m.add_turn("search", "docs mention Paris")
m.add_turn("search", "rain 12C")
m.add_turn("finish", "umbrella")
m.remember("user: always wants C not F")
ctx = m.for_assembler("user")
print("scratch len", len(ctx["scratch"]))
print("summary", ctx["summary"])
print("notes", ctx["notes"])
\`\`\`

Window 2: the first search rolled into summary. Scratch length is 2 (rain, finish). The assembler still sees recent turns plus a retrieved profile note because the query was \`"user"\`. Change the query to \`"zzz"\` in your head: notes would be empty. Retrieve is not a dump.

The summary is a string join, not a second model. That is enough to learn overflow. A fancier summarizer still writes to \`self.summary\`, not into the system prompt.

## How agents use this

Scratchpad is the loop’s RAM. Summary is a cheap compress. Retrieve is RAG. If you only have one vector index, you will retrieve a thought from last Tuesday as if it were a fact.

The assembler budget and this lesson are one design: stores first, then a window. Typed state next is the third piece: a contract object the assembler also reads, so legal tools do not live only in prose.

\`\`\`quiz
When the scratchpad window is full, what should happen to older turns?
- Delete them forever
- *Roll them into a summary (and retrieve later if needed)
- Paste them into every future prompt
- Write them to the system prompt as law
explain: RAM overflows into a summary. The assembler stays on a budget.
\`\`\`
`,
  },
  {
    slug: "typed-state",
    title: "Typed State Beats a Blob",
    summary:
      "A dict with allowed keys is a contract. A giant string named state is how illegal tools sneak in.",
    minutes: 19,
    level: "intermediate",
    md: `
Agent state is not “whatever the last model said.” It is a **typed object**: a dict with allowed keys and allowed values. A giant string named \`state\` is how illegal tools sneak in. You cannot ask a paragraph whether \`phase\` is gather. You can ask a dict.

The assembler reads this object to pick legal tools. The parser refuses tools that do not match the phase. Stop may read \`phase == done\`. Checkpoints serialize this object. HITL stores frozen args beside it. None of that works if state is a 4k memory poem.

Memory stores (scratch, summary, notes) are logs and retrieval. Typed state is the **contract** of the run: where we are, what ids we hold, what is pending. Do not encode the contract only in the summary.

## Keys that earn their keep

A typical object:

- \`phase\`: gather | apply | done
- \`ticket_id\`: string or null
- \`facts\`: dict of checked claims
- \`pending_approval\`: frozen args or null
- \`plan\`: list of step objects, or null

\`\`\`viz flow
title State is named boxes
layout lr
node gather Gather
node apply Apply
node done Done
edge gather apply
edge apply done
caption Phase is an enum. Refund is illegal in gather. The model does not set phase.
\`\`\`

Start small. Every key should have a reader in code. Keys nobody reads are a blob again.

\`phase\` is an enum. Not “we are kind of ready.” If you need a new phase, add it to the enum and to the allowlist. Do not invent phases in a thought.

## Assembler and parser both read it

Assembler: advertise only \`ALLOWED[phase]\`. Parser: if name not in that list, \`unknown_tool\` or \`illegal_in_phase\`. Defense in depth. If only the prompt says “do not refund yet,” the model will refund. If only the assembler hides refund, a buggy model call that still emits refund must die in the parser. If only the parser refuses, you still wasted tokens advertising it.

The live box uses \`can_run(state, name)\` as the contract. \`apply_obs\` updates ticket_id and phase when the world says the ticket is ready. The model does not set phase. The **observation** does, through your function. That is the same “world is truth” rule as the executor.

## Updates are functions

Do not let the model patch state with free JSON merges. Apply a known observation through \`apply_obs\`. If get_ticket returns ready, phase becomes apply. If refund returns ok, phase becomes done. Unknown updates are errors.

Facts should be checked claims: \`{"window_ok": True}\` after policy code ran, not “seems refundable” from a thought.

## Blobs hide illegal tools

A paragraph “We looked up T1 and it is probably fine to pay” does not change the allowlist. A typed \`phase: apply\` plus \`ticket_id: T1\` does. Operators can print the object at 3 a.m. They cannot parse a poem.

Serialize this object in the checkpoint (later lesson). JSON round-trip. Do not pickle a custom class you forgot to version. Do not pickle a 4k-character “memory” string and call it state.

## Typed state vs plan vs memory

| Object | Role |
|---|---|
| Typed state | Phase, ids, flags, pending approval |
| Plan | List of steps with status |
| Memory | Scratch, summary, notes |

A plan can live **inside** state as a key. Memory usually sits beside it (larger). Do not fold all three into one string for “simplicity.” You will spend the simplicity on bugs.

## Tests without tokens

\`new_state()\` then \`can_run(..., "refund")\` is false. After a ready ticket, true. That test is cheaper than hoping the model “knows” not to refund in gather. State machines (next) add guards on transitions. Typed state is the object those guards read.

## Who is allowed to write a key

Every key needs a writer you trust. \`phase\` and \`ticket_id\` update in \`apply_obs\` from **tool output**. \`pending_approval\` updates in the HITL pause from **your** freeze function. \`facts["window_ok"]\` updates from policy code, not from a thought that says “seems fine.” If the model emits a JSON patch, parse it as a proposal at most — then run it through the same functions. A free merge is a blob with extra steps.

Missing vs null vs wrong type are three bugs. Missing \`phase\` should fail closed at load (checkpoint corrupt). \`ticket_id: null\` is a legal gather. \`ticket_id: 12\` as an int may break the assembler if you expected a string — normalize in \`apply_obs\`. Do not let two spellings (\`ticketId\`, \`ticket_id\`) exist. One schema.

Reads: the assembler reads phase for tools, the parser reads phase again, the UI reads phase for a badge, stop may read phase == done. If a field has no readers, delete it. If a reader needs a field that is only in the summary sentence, you failed this lesson — lift it into a key.

Version the object when you add keys (\`state_v: 1\`). Jobs will load old runs. Unknown keys on load: ignore or fail, pick one policy and test it. Dropping \`pending_approval\` on an old resume is how you execute an unfrozen refund.

The model may **see** a projection of state (phase, ticket id) in the assembled context. That is courtesy, like step 3/8. Enforcement stays in \`can_run\` and \`apply_obs\`. If you only print state in the prompt, you have a blob again.

## Common mistakes

- \`state = transcript[-1]["content"]\`.
- Model-written phase.
- Advertising all tools regardless of phase.
- Ticket id only in prose.
- Pickling blobs.
- One key \`misc\` that holds everything.

\`\`\`tryit python
ALLOWED = {
    "gather": ["search", "get_ticket", "handoff", "finish"],
    "apply": ["refund", "handoff", "finish"],
    "done": ["finish"],
}

def new_state():
    return {"phase": "gather", "ticket_id": None, "facts": {}}

def can_run(state, name):
    return name in ALLOWED[state["phase"]]

def apply_obs(state, name, obs):
    if name == "get_ticket" and isinstance(obs, dict):
        state["ticket_id"] = obs.get("id")
        if obs.get("ready"):
            state["phase"] = "apply"
    if name == "refund":
        state["phase"] = "done"
    return state

st = new_state()
print("refund in gather", can_run(st, "refund"))
st = apply_obs(st, "get_ticket", {"id": "T1", "ready": True})
print("phase", st["phase"], "ticket", st["ticket_id"])
print("refund in apply", can_run(st, "refund"))
\`\`\`

Gather cannot refund. After a ready ticket, phase becomes apply and ticket is T1. That is a contract, not a hope. If \`ready\` were false, phase would stay gather and you would still hold the id. Add that case in your head: id without apply is allowed; refund is still illegal.

\`ALLOWED["done"]\` is finish only. After refund, even search is gone. That is how you stop the furnace from “just checking” after money moved.

## How agents use this

Serialize this object in the checkpoint (later lesson). Do not pickle a 4k-character “memory” string and call it state.

The assembler budget filters tools from this object. HITL stores \`pending_approval\` on it. Jobs load it from JSON. If a teammate cannot print \`phase\`, you are back to anatomy: you cannot operate the loop.

\`\`\`quiz
Why keep agent state as a typed dict instead of a paragraph?
- Paragraphs are easier to log
- *The assembler and parser can allow tools by phase and field
- Models cannot read dicts
- Typed state is only for compilers
explain: Illegal tools sneak in through blobs. Typed keys are the lock.
\`\`\`
`,
  },
  {
    slug: "state-machines",
    title: "State Machines for Agents",
    summary:
      "Named states, allowed tools per state, and guards on transitions. Graphs you can draw beat loops you cannot.",
    minutes: 21,
    level: "intermediate",
    md: `
A **state machine** is typed state plus **explicit transitions**:

- From \`gather\`, \`get_ticket\` may move you to \`apply\` only if the ticket is open
- From \`apply\`, \`refund\` may move you to \`done\` only if amount ≤ cap
- Unknown transitions are errors, not improvisation

Typed state gave you a dict. The machine gives you **edges**. Allowed tools are not enough. Guards check the **world** before the phase changes. Refund in gather is illegal even if the model is sure. Open ticket with amount 80 fails the apply guard even if refund is a legal **name** in apply.

If you cannot draw the graph on a whiteboard, operators cannot debug 3 a.m. runs. Draw: gather → apply → done, plus handoff loops that stay put, plus search that stays in gather.

\`\`\`viz flow
title Allowed edges, not vibes
layout lr
node gather Gather
node apply Apply
node done Done
edge gather apply get_ticket
edge apply done refund
caption Search stays in gather. Refund may move apply to done only if the guard passes.
\`\`\`

LangGraph-style node graphs are this idea with nicer furniture. The furniture is not the architecture. If the library cannot express “refund illegal in gather,” you still write the allowlist.

## Allowed vs guard vs next

Three tables:

1. **Allowed** — which tool **names** may run in this state
2. **Guards** — extra predicates on the observation (or on args) before a transition fires
3. **Next** — where you go if allowed and guard pass

Search is allowed in gather and next is gather (self-loop). Get_ticket is allowed in gather; guard is status open; next is apply. Refund is not in gather’s allowed list — you never consult a guard. Amount 80 in apply: name allowed, guard fails, **state does not change**.

Failing a guard is not “try a nearby tool.” It is \`guard failed\` as an observation. The model may try a different path. Stop still caps. Do not auto-jump to done.

## Unknown transitions are errors

If the model emits a tool that has no row, that is illegal tool. If you forgot to add a next mapping, fail closed — do not default to \`done\`. Missing next is a programmer bug. Defaulting to stay is safer than defaulting to success.

Handoff often **stays** in the same state and stops the loop. Done has an empty allowlist. Those are explicit.

## Draw it, then test it

Tests can fire illegal edges with no tokens: \`transition("gather", "refund", {})\` must not become apply. \`transition("gather", "get_ticket", {"status": "closed"})\` stays gather. Open ticket moves. Amount 12 refunds to done. Amount 80 stays apply.

That is cheaper than hoping the model “knows.” Put the graph in config (dicts), not only in a prompt. The prompt may mention the phases. Code enforces them.

## Guards read the world

Guards should read observations and typed fields, not thoughts. \`obs.get("status") == "open"\` is a guard. “The thought said it was open” is not. Caps on amount belong here and in the tool policy table (tools track). Duplicate the cap if you must. Do not leave it only in English.

## Graphs you can operate

Operators should ask “which node?” not “what was the vibe?” The trace logs state before, tool, guard result, state after. When money moved, you should see apply → done on an allowed edge with a passing guard. If you see gather → done, you have a bug in next maps, not a clever model.

## What this is not

This is not a multi-agent workflow of people. It is one agent’s phase graph. Multi-agent next track may use graphs between specialists. You still need this graph **inside** a specialist. Skip it and the swarm will refund in gather with extra hops.

This is not production orchestration (queues, k8s). Jobs later **load** this state. The machine is the logic. The worker is the runner.

## Self-loops, illegal edges, and drawing the picture

Search that stays in gather is a **self-loop**: allowed, no phase change, still costs a step. You still append an observation. You still check thrash. A self-loop is not “free thinking.” Handoff that stays in apply is a self-loop plus a stop: phase remains so a human can resume the same node.

Illegal edges should be noisy. Return \`illegal tool refund\` as the message and as an observation. Silent ignore looks like the model “did nothing” and it will retry the same edge until budget. Pair with thrash. Tests should include at least one illegal edge per node, one failed guard per guarded edge, and one happy path across the whole graph.

Draw it: boxes for gather / apply / done, arrows labeled with tool names, notes on arrows for guards (“status open”, “amount <= 50”). If you cannot draw it in five minutes, the graph is too clever or it lives only in a prompt. Operators at 3 a.m. get the drawing, not your memory of the LangGraph blog.

Config shape is three dicts (allowed, guards, next) or one list of edges \`{from, tool, guard, to}\`. Either is fine. What is not fine is “the model will figure out the phase.” Next maps that default to done are how gather plus a typo pays money. Prefer default stay + error.

Guards can read typed state as well as obs: “refund only if ticket_id is not null.” That is still the world (you stored the id from a prior obs). They must not read the thought string.

## Common mistakes

- Allowed names without guards.
- Guards that read thoughts.
- Default next = done.
- Graph only in the prompt.
- Cannot draw it.
- Empty error on illegal tool so the model retries the same edge forever (pair with thrash later).

\`\`\`tryit python
ALLOWED = {
    "gather": ["search", "get_ticket", "handoff"],
    "apply": ["refund", "handoff"],
    "done": [],
}

GUARDS = {
    ("gather", "get_ticket"): lambda obs: obs.get("status") == "open",
    ("apply", "refund"): lambda obs: obs.get("amount", 999) <= 50,
}

def transition(state, tool, obs):
    if tool not in ALLOWED[state]:
        return state, "illegal tool " + tool
    key = (state, tool)
    if key in GUARDS and not GUARDS[key](obs):
        return state, "guard failed"
    nxt = {"get_ticket": "apply", "refund": "done", "search": "gather", "handoff": state}
    return nxt.get(tool, state), "ok"

print(transition("gather", "refund", {}))
print(transition("gather", "get_ticket", {"status": "closed"}))
print(transition("gather", "get_ticket", {"status": "open"}))
print(transition("apply", "refund", {"amount": 12}))
print(transition("apply", "refund", {"amount": 80}))
\`\`\`

Refund in gather is illegal. Closed ticket fails the guard. Open ticket moves to apply. Amount 80 fails the apply guard; amount 12 moves to done. Read the tuples: state plus message. Unchanged state plus \`guard failed\` is a successful **control** outcome. The world did not lie; the machine refused.

The default amount in the refund guard is 999, so a missing amount fails the cap. Fail closed on missing money fields.

## How agents use this

Put the graph in config, not only in a prompt. Tests can fire illegal edges with no tokens. That is cheaper than hoping the model “knows” not to refund in gather.

HITL is a special kind of stay: you leave phase as apply, set \`pending_approval\`, and stop the worker until a human resumes. The edge to done does not fire until approve. Next two lessons.

\`\`\`quiz
What does a guard do in an agent state machine?
- Replace the model
- *Block a transition even if the tool name is allowed, unless the observation passes a check
- Hide tools from the schema forever
- Retry the model forever
explain: Allowed names are not enough. Guards check the world before the phase changes.
\`\`\`
`,
  },
  {
    slug: "human-in-the-loop",
    title: "Human in the Loop",
    summary:
      "Pause before irreversible tools. The human sees a frozen payload. They do not become a free-text second model.",
    minutes: 22,
    level: "intermediate",
    md: `
**HITL** is a stop that waits for a person. Use it for:

- Money leaving the house
- Email to a real customer
- Deletes, deploys, permission changes
- Anything the policy table marked \`needs_approval\` (tools track)

The agent must **not** keep chatting in the same loop while waiting. Persist the run, freeze the args, notify the human, resume on approve/deny. If you hold the HTTP request open, the socket dies and you either double-run or drop the approval. Long-running jobs (next part) are how you wait overnight. This lesson is the **pause contract**.

\`\`\`viz flow
title Pause for a human
layout lr
node tool Blessed tool
node pause Freeze args
node human Approve or deny
node run Run or stop
edge tool pause
edge pause human
edge human run
caption The human sees a form. They do not write the next thought.
\`\`\`

The human’s job is **approve / deny / edit a form**, not “write the next ReAct thought.” If they type free prose into the loop, you just hired a slower, unpaid model. Thoughts are not a contract. A frozen copy of tool name plus arguments is a contract.

## Pause, do not chatter

When the parser blesses \`refund\` and policy says needs_approval, you do **not** execute. You create a ticket:

- status \`waiting_human\`
- tool name
- frozen args (deep copy)
- run_id, step, hashes (next lesson)

Stop the worker. Save typed state with \`pending_approval\` set. Notify. The assembler should not keep calling the model in that phase except to tell the user “waiting.” Extra thoughts cannot mutate the frozen args. If they can, you did not freeze.

## Approve / deny / edit

**Deny** stops. No tool run. Maybe handoff packet. Status denied.

**Approve** with the **same** args runs the executor. Status approved_run.

**Edit** is a new form submit: new frozen snapshot, new hash, maybe a second approve. It is not a silent extra key on resume.

The live box rejects mutation: if resume args differ from frozen, \`rejected_mutation\`. Raising 40 to 400 after a click is the incident. Catch it.

A blank check (“approve any follow-up tool”) is not HITL. It is turning the human into a rubber stamp for the rest of the furnace.

## Humans are not a second model

Do not paste the chain of thought into a ticket and ask “what next?” Ask them to confirm a form: order 99, amount 40, tool refund. If they need context, show the last observation and the policy line, not a novel.

If they must choose among tools, give buttons, not a chat box that gets parsed as ReAct. Free text is how you get \`eval\` energy in a support queue.

## Policy table vs pause

The tools track owns **which** names need approval. This lesson owns the **pause**. Never pass a live mutable dict into the worker after the human clicked — copy the frozen snapshot. The next lesson is the copy and the hash. Here: the control flow.

Irreversible tools without HITL are a product decision you should be afraid of. Computer-use “Pay” buttons are banned later; money tools go through this pause.

## Same queue as handoff

Waiting_human and handoff are cousins. Both persist a packet. Both wake a person. Handoff may have no pending tool (unknown intent). HITL has a pending tool. Wire them to the same operator queue so you do not build two inboxes.

Multi-agent is not a substitute for HITL. Another specialist is not a human. Next track can send a packet to a specialist. Money still needs a person unless you like incidents.

## What the human sees, and what happens while you wait

The form is tool, args, maybe last observation, maybe policy line, run_id, hash. That is enough. A week of traces is a link, not the body. If you paste thoughts, the human will argue with the thought instead of checking the amount. If you paste nothing, they will approve on vibes. Frozen args in a table (order_id 99, amount 40) is the product.

While waiting, the worker is **asleep**. Jobs set \`wake_when\` to the approval id. The assembler must not keep emitting new refunds. Typed state holds \`pending_approval\`. Phase stays apply (or a dedicated \`wait_human\` phase if you want it on the whiteboard). Search during wait is usually illegal: it tempts the model to change the story. If you allow reads while waiting, you still must not change frozen args.

Timeouts on humans are a policy: after N hours, handoff to a broader queue or deny. That is stop, not a model “nudge.” Nudging the same human with extra thoughts is chatter.

Deny should be easy. Approve should be the same args. Edit is a new freeze (next lesson). “Approve and also email the CEO” is extra keys — reject. The human is not a tool catalog.

Who is the human? A role (billing_ops), not “anyone in Slack.” The packet goes to a queue. The click is authenticated. This track does not build auth, but the loop should not resume because a chat message said “ok” without a signed form. Free-text “ok” is a second unpaid model.

## Common mistakes

- Keep chatting while waiting.
- Human writes the next thought.
- Approve any future tool.
- Live dict mutation after pause.
- HITL only in the prompt (“please confirm”).
- Executing before the click because the model said “user would approve.”

\`\`\`tryit python
NEEDS_APPROVAL = {"refund", "send_email"}

def request_approval(name, args):
    return {
        "status": "waiting_human",
        "tool": name,
        "frozen_args": dict(args),
    }

def resume(ticket, decision, extra_args=None):
    if decision == "deny":
        return {"status": "denied", "tool": ticket["tool"]}
    args = dict(ticket["frozen_args"])
    if extra_args:
        args.update(extra_args)
    if args != ticket["frozen_args"]:
        return {"status": "rejected_mutation", "got": args}
    return {"status": "approved_run", "tool": ticket["tool"], "args": args}

t = request_approval("refund", {"order_id": "99", "amount": 40})
print("pause", t["status"], t["frozen_args"])
print(resume(t, "deny"))
print(resume(t, "approve"))
print(resume(t, "approve", {"amount": 400}))
\`\`\`

Deny stops. Approve with the same args runs. Approve that silently raises the amount is **rejected_mutation**. The pause dict is the ticket. \`NEEDS_APPROVAL\` is the policy set; this box does not branch on it, but a real worker would request approval only for those names.

\`dict(args)\` is a **shallow** copy. Nested dicts need a deeper freeze (next lesson uses JSON round-trip). If amount is a top-level int, shallow is enough to see the idea. Do not stop at shallow in production.

## How agents use this

The tools track owns the policy table. This lesson owns the **pause**. Never pass a live mutable dict into the worker after the human clicked — copy the frozen snapshot.

Jobs: \`wake_when\` is approval. The worker loads state, sees pending, does not call the model for a new refund. Resume is a different entrypoint than step. Keep them straight.

\`\`\`quiz
What should a human approve?
- The model’s latest thought
- *A frozen copy of tool name plus arguments
- A blank check for any follow-up tool
- The entire week of traces
explain: HITL is a signed payload. Thoughts are not a contract.
\`\`\`
`,
  },
  {
    slug: "freeze-payload",
    title: "Freeze the Approval Payload",
    summary:
      "Args at pause time are the contract. Resume must not pick up mutated dicts or extra keys from later thoughts.",
    minutes: 20,
    level: "intermediate",
    md: `
Three classic HITL bugs:

1. Freeze a **reference** to a dict the loop still mutates
2. Let the model add keys after the human clicked Approve
3. Resume the wrong run because ids were reused

Fix: freeze with a **deep copy** plus a **hash** at pause. Store \`run_id\`. On resume, compare hashes. If they differ, refuse.

\`\`\`viz flow
title Freeze is a copy plus a hash
layout lr
node live Live args
node copy Deep copy
node hash Hash
node resume Resume check
edge live copy
edge copy hash
edge hash resume
caption Mutate the live dict all you want. The ticket must not notice.
\`\`\`

The human may **edit the form** (new frozen snapshot, new hash). That is a new decision, not a silent mutation. Silent mutation is how 40 becomes 400 while the UI still shows 40.

This is the same idempotency idea as tool keys: the payload is the contract. Logs should show a short hash at pause and at resume. Operators should match them with their eyes.

## A reference is not a freeze

In Python, \`frozen_args = args\` is a nickname for the same dict. The worker later does \`args["amount"] = 400\` (or the model’s next thought merges keys into that dict) and the ticket lies. \`dict(args)\` is a shallow copy: nested dicts still alias. \`json.loads(json.dumps(args))\` is a simple deep copy for JSON-safe values. Use that at pause. Then mutate the live dict all you want. The ticket should not notice.

The live box mutates \`live["amount"]\` after freeze. Frozen stays 40. Hash of live fails. Hash of ticket args passes.

## Hash the canonical bytes

Sort keys. Dump JSON. Hash. Store a short hex. On resume, hash the args you are about to run the same way. Equality of hashes is the contract. Also keep the copied args so you can show the form again. Hash without copy cannot render the ticket. Copy without hash can drift if someone edits the store by hand — still compare.

If resume args pick up extra keys from a later thought, the hash changes. Refuse. Do not “merge extra metadata.” Extra keys are how you smuggle a second order id.

## run_id is part of the contract

Resume must load **this** run. Reused ids (row 1 always) resume the wrong freeze. Generate run ids. Pass them in the operator link. If the id is missing, fail closed. Do not resume “the latest refund” globally.

Step number plus run_id plus hash is enough to debug “which click.”

## Edit is a new freeze

The human changes amount to 35 in the form. That is not mutation of the old hash. You make a new snapshot, new hash, maybe require approve again. Audit: pause hash abc, edit hash def, resume def. Three lines. Silent in-place edit of the old ticket is how audit dies.

## What not to freeze

Do not freeze the thought. Do not freeze the whole week of traces as the contract (you may **link** the trace). Freeze tool name plus args. Policy version is worth freezing too if the cap can change under you: “approved amount 40 under policy v3.” That is still data, not a poem.

## After resume

Copy the frozen snapshot into the executor. Do not pass the live dict the worker still holds. After run, clear \`pending_approval\`. Checkpoint. If the tool fails, you have a separate error path — do not treat failure as a chance to mutate args and retry as if approved.

## Canonical JSON, extra keys, and nested money

Hashing only works if both sides dump the same way: sorted keys, no extra whitespace surprises, the same types (40 vs 40.0 can be different JSON). Pick a canonical dump and use it at pause and at resume. Nested objects (\`customer: {id, email}\`) are why JSON round-trip beats \`dict(args)\`. A shallow copy freezes the outer keys and still aliases the inner customer. Mutating \`live["customer"]["id"]\` then resumes the new id against an old hash if you hashed the outer dict before the inner change — or worse, the frozen args **show** the new id because they shared the inner dict. Deep copy first, then hash.

Extra keys after approve are not “metadata.” \`note\` from a later thought, \`notify: true\`, a second \`order_id\` — reject. If operators need a comment, store it **beside** the freeze (\`operator_note\`), not inside args the tool will receive. The executor should see only the blessed keys the schema allows.

List order in args: if \`items\` is a list, JSON dumps it in list order. Canonicalize lists if order does not matter, or treat order as part of the contract if it does. Be explicit.

Clock and random fields the model adds (\`requested_at\`) will make every pause unique and every resume fail if the worker adds a new timestamp. Strip unknown fields at parse time (tools schema) so they never reach freeze.

Log the short hash on the HITL row, the trace row, and the resume log line. Three places, same value, or refuse. That is how you debug “which click” without dumping amounts into Slack.

## Common mistakes

- \`frozen = args\` (alias).
- Shallow copy of nested money objects.
- Merging extra keys on resume.
- Reused run ids.
- Editing in place without a new hash.
- Logging args and not hashes (hard to compare).

\`\`\`tryit python
import json
import hashlib

def freeze(args):
    blob = json.dumps(args, sort_keys=True)
    return {
        "args": json.loads(blob),
        "hash": hashlib.sha256(blob.encode()).hexdigest()[:12],
    }

def same(ticket, args):
    blob = json.dumps(args, sort_keys=True)
    h = hashlib.sha256(blob.encode()).hexdigest()[:12]
    return h == ticket["hash"]

live = {"order_id": "99", "amount": 40}
ticket = freeze(live)
live["amount"] = 400
print("live mutated", live["amount"], "frozen", ticket["args"]["amount"])
print("same as frozen", same(ticket, ticket["args"]))
print("same as live", same(ticket, live))
\`\`\`

The live dict changed to 400. The ticket stayed 40. Resume with live args fails the hash. Resume with ticket args passes. That is a freeze. JSON round-trip plus hash is the contract. A reference is not.

Twelve hex chars are a short fingerprint for the box. Use the full digest in production. Sort keys so \`amount\` then \`order_id\` hashes the same as the reverse insertion order.

## How agents use this

This is the same idempotency idea as tool keys: the payload is the contract. Logs should show \`hash=abc\` at pause and at resume.

Checkpoints should store the freeze, not a pointer. Jobs should load JSON, not a live object from an old process. If resume cannot recompute the same hash, refuse. Fail closed is how money tools stay boring.

\`\`\`quiz
The loop mutates the args dict after pause. What did you freeze?
- *A deep copy (JSON round-trip) plus a hash, not a live reference
- The Python object the worker still holds
- The model’s thought about the amount
- Nothing — trust resume
explain: A reference is not a freeze. JSON copy plus hash is the contract.
\`\`\`
`,
  },
];
