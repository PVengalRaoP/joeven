import type { RawLesson } from "@/lib/types";

export const agentsOps: RawLesson[] = [
  {
    slug: "long-running",
    title: "Long-Running Agents",
    summary:
      "A job with a store and a wakeup, not a request that holds a socket for an hour.",
    minutes: 21,
    level: "intermediate",
    md: `
If a loop may wait on a human, a batch job, or tomorrow’s email, it is a **job**:

- \`run_id\`
- serialized state
- \`wake_when\` (event, cron, or approval)
- a worker that loads, steps, and saves

\`\`\`viz loop
title A job, not a held socket
step Load
step Step
step Save
step Wake
caption The worker loads, takes a slice, saves, and sleeps. The store is the truth.
\`\`\`

Do not hold an HTTP request open for an hour. Do not keep a chat socket as your only store. Cloud functions time out. Laptops sleep. The browser tab closes. HITL “waiting_human” is overnight by nature. An agent that emails you in three days is this pattern, not a longer prompt.

The loop you already wrote becomes \`step_job(state) -> new_state\`. The platform retries the worker, not the user’s browser tab. Anatomy still holds: each wakeup, you assemble (maybe), or you apply an event, then save. You do not restart the furnace from step 1 unless the checkpoint says so.

## Requests die, jobs resume

A request is a live connection. It has a timeout. It has a client that can hang up. It is the wrong container for “wait until the invoice email arrives.” A **job record** is a row (or document) that outlives the process. The worker is a short function: load, maybe step, save, exit. A scheduler or queue calls it again when \`wake_when\` matches.

If you only store the loop in RAM, a deploy kills the agent. If you only store the transcript in the model’s context window, you cannot wait at all. If you store in the user’s clipboard, you are joking — and yet people try “copy this JSON and paste tomorrow.” Use a store.

## The four fields

**run_id** — unique. Resume, traces, HITL links, freeze hashes all key off it.

**serialized state** — typed state plus memory pointers plus pending freeze. JSON. Version it if you can (\`v1\`). Pickle is how you cannot load after a class rename.

**wake_when** — why this job is asleep: \`mail:invoice\`, \`cron:tomorrow\`, \`approval:tix_9\`, \`tool:timeout-retry\`. Null means runnable now or done.

**worker** — \`step_job\`. Idempotent enough that a double wakeup does not double-write unless you intend it. Tools track owns idempotency keys. The worker should not call refund twice because the queue delivered twice — checkpoint and keys.

## step_job is the loop in slices

Each call does a little:

- phase start → park at wait_email, set wake_when
- phase wait_email without email → return unchanged (still waiting)
- phase wait_email with email on state → done, answer, clear wake_when

The email arrives on a **different** event: some inbound handler writes \`state["email"]\` and saves, then the worker runs. The socket that received the mail is not the agent loop. The store is the truth.

HITL pause is a wakeup: approval event sets a decision, worker resumes freeze check, maybe executes. Tool timeouts are a wakeup: retry once later, not while holding the request.

## Do not step forever in one worker

A worker that internally \`while True\` until done reintroduces wall-time death. Slice: one phase, or a small step cap, then save. The next wakeup continues. Stop budgets still apply across slices: store \`steps_used\` on state. An overnight job with no step cap is still a furnace; it just bills slowly.

## What the user sees

The user sees “working” or “waiting on email / waiting on a person.” They do not see a spinner tied to one HTTP call for an hour. Operators see run_id and wake_when. If wake_when is stuck, the job is stuck — not the model.

## What this is not

This is not a production course in queues and brokers. Dicts and a \`STORE\` in the live box are the shape. When you go to a real queue, keep the same names: run_id, state, wake_when, step. If the cloud diagram cannot map onto that, you bought a maze. Prod-as-a-track comes later. Here you need the loop to **survive sleep**.

Multi-agent does not replace jobs. Five specialists in one request still die when the request dies.

## Events, crons, and who is allowed to write state

Wakeups are **events** you name: mail received, approval clicked, cron tick, tool retry due. Each event handler should write a small, typed update (email id, decision, clock) then call the worker — or enqueue the run_id. Do not let the mail handler execute refund itself. It does not own the loop. It owns “this mail arrived.” The worker owns phase transitions.

Cron is a wakeup that says “it is tomorrow,” not a second brain. If nothing is due, \`step_job\` returns unchanged. That is cheap. A cron that starts a **new** agent every tick without run_id is a furnace factory.

Idempotency of the worker: two deliveries of the same mail should not file twice unless you want that. Store processed event ids on state, or use tool keys. \`step_job\` on wait_email when email is already filed should see phase done and return. The live box does not show that guard; add \`if phase == done: return state\` in your head. Missing it is how double wakeup double-files.

Serialization must round-trip every field the next step reads: phase, wake_when, email, pending freeze, steps_used, memory pointers. If JSON drops None vs missing, normalize on load. If you store only the transcript, you cannot wake. If you store only phase and forget wake_when, the scheduler cannot find you.

The user-facing “waiting on email” is a projection of phase. Operators get run_id. Support should not need to keep a tab open. That is the whole point of a job.

## Common mistakes

- Open HTTP for an hour.
- RAM-only loop.
- Worker while-True until dawn.
- No run_id.
- Pickle.
- Double wakeup double refund.
- Prompt: “wait three days then continue” with no store.

\`\`\`tryit python
import json

STORE = {}

def save(run_id, state):
    STORE[run_id] = json.dumps(state)

def load(run_id):
    return json.loads(STORE[run_id])

def step_job(state):
    phase = state["phase"]
    if phase == "start":
        state["phase"] = "wait_email"
        state["wake_when"] = "mail:invoice"
        return state
    if phase == "wait_email":
        if not state.get("email"):
            return state
        state["phase"] = "done"
        state["answer"] = "filed " + state["email"]["id"]
        state["wake_when"] = None
        return state
    return state

save("r1", {"phase": "start"})
s = step_job(load("r1"))
save("r1", s)
print("after start", load("r1")["phase"], "wake", load("r1")["wake_when"])
s = load("r1")
s["email"] = {"id": "m9"}
save("r1", s)
s = step_job(load("r1"))
save("r1", s)
print("after mail", load("r1")["phase"], load("r1").get("answer"))
\`\`\`

Start parks the job. Wakeup with an email finishes it. The store is the truth, not the socket. After start, phase is wait_email and wake is mail:invoice. After the mail is written onto state and stepped, phase is done and the answer cites m9. A step in the middle without email would have returned the same wait.

JSON dump/load is the serialization. If you added a nested freeze dict, it would survive the round trip. A live Python object in a global would not survive a process restart — this STORE is a stand-in for a database.

## How agents use this

Queue + DB + worker. HITL pause is a wakeup. Tool timeouts are a wakeup. “Agent that emails you in three days” is this pattern, not a longer prompt.

Checkpoints (next) are the snapshots inside the job. Jobs without checkpoints restart blindly. Checkpoints without jobs still die when the process dies. You want both.

\`\`\`quiz
How should a loop that waits overnight be stored?
- Keep the HTTP request open
- *A job record with serialized state and a wakeup condition
- Only in the model’s context window
- In the user’s clipboard
explain: Requests die. Jobs resume. State lives in a store.
\`\`\`
`,
  },
  {
    slug: "checkpoints",
    title: "Checkpoints You Can Replay",
    summary:
      "Save typed state after each step. Replay from a checkpoint instead of restarting the whole furnace.",
    minutes: 20,
    level: "intermediate",
    md: `
A **checkpoint** is a snapshot after a successful step:

- run_id, step number
- typed state
- last observation
- plan status (if you have a plan)

\`\`\`viz strip
title Replay from a named step
chip Step 1
chip Step 2
chip Step 3
chip Latest
caption Load the last good snapshot. Do not restart the furnace from step 1.
\`\`\`

On crash, load the last good checkpoint. Do **not** replay side-effecting tools unless they were idempotent (tools track). Prefer “resume from apply” over “search the web again.” Checkpoints exist so you do not buy the whole furnace twice.

Jobs save state; checkpoints are the **versioned** saves inside the run. Latest is what you resume by default. Named step numbers are what operators use: “replay from step 4 with a stubbed refund tool.” If you only have latest, you cannot go back. If you have no checkpoints, crash = start over.

## What to snapshot

Copy typed state (phase, ids, facts, pending freeze). Copy last obs. Copy plan statuses. Copy steps_used so the budget survives. Do not copy a live socket. Do not copy secrets in plain sight if you can point to a vault — but do not skip the snapshot because redaction is hard; redact and save.

Shallow-copy dicts at least. Nested objects need a JSON round-trip like freeze. The live box uses \`dict(state)\` which is shallow; keep checkpoints JSON-serializable so you do not lie to yourself.

## Resume vs replay

**Resume** — load latest, continue next_todo or next ReAct step. Do not re-run tools that already succeeded.

**Replay** — load a past step, maybe stub tools, run forward for debugging. Dangerous on writes. Stub refund. Do not hit production Stripe on replay.

On crash at step 5, load the last **good** checkpoint (4 if 5 never saved). Re-run only if the tool is safe or keyed. Missing step 9 returns None — fail closed, do not invent a state.

## Side effects

Search again wastes money and can change hits. Refund again is an incident. Idempotency keys make a second refund a no-op. If you do not have keys, do not replay writes. Operators should see “already applied” from the store, not from a thought.

The assembler after resume should see the scratchpad you saved, not an empty brain. Memory belongs in the checkpoint or in a store keyed by run_id.

## Fail closed on missing

\`resume_from(9)\` is None. Do not default to empty gather. Do not default to done. Empty gather plus a write tool is how you refund twice from a “helpful” resume. None → operator error → handoff.

## Frameworks

LangGraph checkpointers, Temporal histories, and your JSON column are this. The brand is furniture. Operators should still say “replay from step 4.” If the framework cannot export a typed snapshot, you do not have a checkpoint you can operate — you have a log you hope to parse.

## What “good” means, and how replay stubs work

A checkpoint after a **successful** step means: parser blessed, executor returned (even if the obs is an error you are willing to keep), state applied, then save. Do not save mid-execute with a half-refund. Do not save only after finish. If you crash between refund and save, keys save you; if you have no keys, you have a hole — prefer execute then save in a tight pair, or save a “doing” status then “done” (two checkpoints). Doing without a timeout sweeper is how jobs stuck forever.

Last **good** checkpoint on crash at 5: if 5 never saved, load 4. If 5 saved an error obs you accept, 5 is good. If 5 saved a corrupt blob, fail closed and handoff. Corruption is not “use gather.”

Replay for debugging: load step 4, replace refund with a stub that returns \`{"ok": true, "stub": true}\`, run forward in a **non-prod** worker. Label the run \`replay_of\`. Do not write replay results into the original run_id. Operators compare traces. Stubbing search is usually safe. Stubbing refund in prod is not a replay; it is an incident.

Memory and plan status belong in the snapshot or they will not resume. A checkpoint of phase apply without ticket_id is a broken object — do not save it. Validate the typed state on save the same way you validate on load.

Keep more than latest if you can afford it: last N steps, or every step until a retention policy. Storage is cheaper than re-searching. Redact secrets in snapshots the same as traces.

Resume is the default operator verb; replay is the debugger’s verb. Mixing them in prod is how stubs become real refunds. Name the entrypoint: \`resume(run_id)\` vs \`replay(run_id, from_step, stubs)\`.

## Common mistakes

- Only latest, no step index.
- Restart from 1 always.
- Replaying writes without keys.
- Inventing state when the id is missing.
- Checkpointing thoughts but not phase.
- Mutating the saved dict in place (alias again).

\`\`\`tryit python
CKPT = []

def checkpoint(step, state, obs):
    CKPT.append({
        "step": step,
        "state": dict(state),
        "obs": obs,
    })

def latest():
    return CKPT[-1] if CKPT else None

def resume_from(step_no):
    for c in reversed(CKPT):
        if c["step"] == step_no:
            return {"state": dict(c["state"]), "obs": c["obs"]}
    return None

state = {"phase": "gather", "ticket_id": None}
checkpoint(1, state, {"hits": 3})
state = {"phase": "apply", "ticket_id": "T1"}
checkpoint(2, state, {"id": "T1"})
print("latest phase", latest()["state"]["phase"])
print("resume step 1", resume_from(1)["state"]["phase"])
print("missing", resume_from(9))
\`\`\`

Step 2 is latest (apply). Replay from step 1 still has gather. Missing steps return None — fail closed, do not invent a state. Two checkpoints, two phases. That is how you avoid searching the web again just to reconstruct T1.

The box keeps CKPT in a list. A job store would key by run_id and step. Same idea. Copy on save and copy on load so later mutations of \`state\` do not rewrite history — here we assign a new dict before checkpoint 2, which is clean. If you mutated the same dict, you would need the copy even more.

## How agents use this

LangGraph checkpointers, Temporal histories, and your JSON column are this. Operators should be able to say “replay from step 4 with a stubbed refund tool.”

Error recovery next assumes you can stop calling a flaky tool without forgetting where you were. The checkpoint is that memory. The circuit breaker is the policy. Together they are how loops survive the world.

\`\`\`quiz
After a crash at step 5, what should you load?
- Always step 1 and every search again
- *The last good checkpoint, and only re-run non-idempotent tools with care
- An empty state and a pep talk
- The model’s last thought only
explain: Checkpoints exist so you do not buy the whole furnace twice.
\`\`\`
`,
  },
  {
    slug: "error-recovery",
    title: "Error Recovery",
    summary:
      "Timeouts, retries with a cap, circuit breakers, and fail-closed. Recovery is policy, not vibes.",
    minutes: 21,
    level: "intermediate",
    md: `
Tools fail. The loop must not fail as a personality. “Try harder” is not a policy. Timeouts, retries with a cap, circuit breakers, and fail-closed are a policy.

The tools track already cares about retries and keys. This lesson is what the **loop** does when the executor returns an error observation. You log the error as an observation the assembler can see. You do not hide failures in a thought. You do not pretend the tool returned success. You do not \`eval\` a fallback.

| Failure | Loop policy |
|---|---|
| Timeout | Retry once, then handoff or skip |
| 429 / rate limit | Backoff; count toward budget |
| 4xx schema | Do not retry the same args; repair or fail |
| 5xx flaky | Retry with cap; then circuit-break |
| Unknown tool | Fail closed (parser) |

A **circuit breaker** stops calling a tool that just failed N times. The model does not get a 12th try at the same flaky API. Caps and breakers are recovery. Infinite retry is a furnace.

\`\`\`viz flow
title Retry, then open the breaker
layout lr
node call Call tool
node fail Fail
node retry Retry once
node open Circuit open
edge call fail
edge fail retry
edge retry open
caption Two timeouts stop the calls. The third never hits the world.
\`\`\`

## Timeouts

Every outbound call has a timeout, including the model. A hung search is a hung step. Normalize to \`{"error": "timeout"}\`. Retry **once** if the tool is a read. Then skip or handoff. Writes: retry only with an idempotency key. Counting the retry toward the step budget is mandatory. A “free” timeout retry is how 8 steps become 40.

Jobs: timeout can be a wakeup. Park, retry later, do not hold the worker.

## 429 vs 400 vs 500

**400** — bad args. Repair once (parser/schema) or fail. Same body will fail again.

**429** — slow down. Backoff. Still a budget item. Do not spin.

**500** — their fault, maybe flaky. Retry with cap, then breaker.

**Unknown tool** — parser, not retry. Retrying launch_nukes is not recovery.

The loop should branch on a small error enum, not on a stack trace pasted into the prompt. Truncate traces. Models will “fix” HTTP if you dump it. Adapters should already have wrapped status codes.

## Circuit breakers

The breaker wraps a tool (or a host). Fail N times → open. Open means later calls return \`circuit_open\` **without** hitting the world. After a cooldown you may half-open (one probe). This lesson’s box opens and stays open so you can see the third call never touch \`flaky\`.

Per-tool breakers beat one global breaker (search down should not block get_ticket). Per-run counters belong on state so jobs resume the count.

When open, the observation is \`circuit_open\`. Stop may handoff. The model should not invent a search snippet. Observe-before-finish still applies: the obs is an error, finish that ignores it is a guess.

## Same error twice

If the error is identical (same tool, same args, same timeout), you are in thrash territory (next part). Breaker plus thrash plus budget is three backstops. You want all three. Personality “surely this time” is none of them.

## Fail closed

Unknown tools, bad JSON, open circuit, budget, guard failed: the world does not change. Recovery is not “guess a nearby API.” Recovery is retry with policy or stop.

## Backoff, what the assembler sees, and half-open

Backoff for 429 is wait-then-retry, not tight-loop retry. In a request, waiting might be a short sleep with a cap. In a job, waiting is \`wake_when\` plus a clock. Either way, count the attempt. Exponential backoff without a cap is a polite furnace. Cap the waits and the tries.

What the assembler sees after a failure must be the **error observation**, truncated: \`{"error": "timeout"}\` or \`circuit_open\`. If you hide it, the model will finish from the last happy thought. If you dump a stack trace, the model will try to patch your Python. Neither is recovery. Structured errors are recovery.

Half-open: after cooldown, allow **one** probe. Success closes the breaker (fails = 0). Failure opens again. Do not half-open ten tools at once on the same host if they share a quota. Per-host breakers are allowed; name them in the trace.

Repair vs retry: 400 with missing field → repair prompt once (parser). 400 with unknown enum → fail. 5xx → retry. Timeout → retry once for reads. Unknown tool → never retry as if the world were flaky. These branches belong in one function \`recover(error, tool, args, counts)\` so the loop does not grow if-else novels.

Do not recover by switching to a more dangerous executor (computer use, eval). That promotion is in the computer-use lesson as a trap. Recovery stays inside the same catalog, or handoff.

Log the error enum on the trace row every time. If operators only see a thought that says “search failed,” you will not know timeout from 400 from circuit_open. Recovery policy cannot fire on a poem.

## Common mistakes

- Retry forever.
- Retry 400 with the same args.
- Hide errors in thoughts.
- Pretend success.
- One global breaker for every tool.
- Not counting retries as steps.
- exec() as a fallback.

\`\`\`tryit python
class CircuitBreaker:
    def __init__(self, fail_max=2):
        self.fail_max = fail_max
        self.fails = 0
        self.open = False

    def call(self, fn):
        if self.open:
            return {"error": "circuit_open"}
        try:
            out = fn()
            self.fails = 0
            return {"ok": out}
        except Exception as e:
            self.fails += 1
            if self.fails >= self.fail_max:
                self.open = True
            return {"error": str(e), "fails": self.fails}

n = {"i": 0}

def flaky():
    n["i"] += 1
    if n["i"] < 3:
        raise RuntimeError("timeout")
    return "ok"

br = CircuitBreaker(fail_max=2)
print(br.call(flaky))
print(br.call(flaky))
print(br.call(flaky))
\`\`\`

Two timeouts open the circuit. The third call never hits \`flaky\` — it returns \`circuit_open\`. The function would have succeeded on the third **world** call (\`n["i"] < 3\`), but the breaker does not care. That is the point: you stop paying the same failure. A half-open design could probe later. This box shows the cap.

Broad \`except Exception\` is for the demo. In production, catch timeouts and 5xx-shaped errors, not KeyboardInterrupt. Still fail closed.

## How agents use this

Same retry budget as the tools track, owned here by the loop. Log \`error\` as an observation the assembler can see. Do not hide failures in a thought.

Pair with checkpoints: after two timeouts, save state, maybe wake later, do not lose phase. Pair with HITL: an open circuit on refund is a handoff, not a silent skip that claims done.

\`\`\`quiz
A tool timed out twice. What should the loop do next?
- Retry forever
- *Open a circuit (or handoff) — do not keep paying the same failure
- Switch to eval() as a fallback
- Pretend the tool returned success
explain: Caps and breakers are recovery. Infinite retry is a furnace.
\`\`\`
`,
  },
  {
    slug: "computer-use",
    title: "Computer Use in the Loop",
    summary:
      "A screenshot grid is a last resort. Prefer an API. If you must click, bound the grid and never click pay.",
    minutes: 19,
    level: "advanced",
    md: `
**Computer use** means the agent sees pixels (or a DOM dump) and emits clicks. It is the worst executor you should ship:

- Slow and expensive
- Easy to click the wrong thing
- Hard to audit
- Breaks when the UI moves

Prefer an API or a structured tool (tools track). Use computer use only when no API exists, and then treat it as a **bounded grid** with a ban list, a click budget, and observe-before-next-click. Never “almost Pay.”

\`\`\`viz flow
title Click, then look
layout lr
node click Click cell
node obs New screen
node next Next or stop
edge click obs
edge obs next
caption Observe the new screen before the next click. Pay is a stop, not a nearby cell.
\`\`\`

This lesson is **loop policy**, not a GUI driver. The tools track designed the GUI tool. Here: observe the new screenshot before the next click, budget the clicks, stop on banned labels, stop on unexpected copy. HITL still owns money. A screenshot of a Pay button is not an approval.

## Last resort

If \`refund(order_id, amount)\` exists, the agent must not click through the billing UI. Computer use is for the leftover: a vendor with no API and a rare flow. If the flow is common, build a tool. If the flow is money, still do not click Pay — build a typed money tool with HITL, or handoff.

“After three failed API calls, click Pay” is in the quiz for a reason. Failure of an API is a breaker/handoff, not a promotion to pixels.

## Bound the grid

A known grid of cells with labels is something you can log: clicked Save at [2,0]. A raw x,y on a 4k screenshot is not an audit. Bound the screen to a region. Map cells to labels. Empty cells error. Off-grid errors. The parser should emit a cell, not “click the green thing.”

Banned labels: Pay, Transfer, Delete, and anything your policy table would have marked needs_approval or irreversible. The loop treats \`banned\` as a **stop**, not as a retry with a nearby cell. Nearby is how you hit Pay after missing Save.

## Observe after every action

Computer use is still ReAct. Click is an action. The new screenshot (or a label diff) is the observation. Do not click twice from one thought. Observe-before-finish applies: do not claim “saved” until the obs shows Saved. Do not finish because the thought was confident.

Unexpected copy (“Are you sure you want to pay?”) is a stop. The model will click Yes. Code should not allow Yes on that dialog.

## Budget the clicks

Clicks are steps. Cap them. Thrash: same cell three times is a stop. A furnace that clicks File, File, File is still a furnace. Wall time is worse than API loops because each step is a screenshot token dump. Assembler budget: send a cropped grid, not a 20MB image every turn, if you can.

## Never click Pay

Pay is banned. Use a typed money tool with HITL. Pixel color is not a contract. The thought “the invoice is done” is not a contract. Three failed API calls are not a contract. If the only way to pay is the button and you have no typed tool, **handoff**. A human clicks Pay. That is HITL with a UI, not an agent with a banned cell.

## Dialogs, UI drift, and when this costume is allowed

Unexpected copy is a **stop class**: confirm-pay dialogs, 2FA prompts, “transfer to,” cookie walls. Maintain a list of banned substrings in the observation text (or OCR). Hitting one returns \`banned\` or \`unexpected_copy\` and stop/handoff. The model will always have a thought that says Continue is fine. Code disagrees.

UI drift: a button moved, the grid is wrong, Save is now at [2,1] where Pay was. That is why pixels are a last resort. If labels are parsed from a structured accessibility tree, prefer that over raw pixels — still bound, still ban Pay. When the tree lies, stop. Do not “find Pay by icon.”

Allowed computer-use jobs are narrow: download a CSV from a vendor with no API, click Save on a form you cannot POST, read a label. Even then: click budget, observe after, no writes that match the irreversible policy table. If the job is daily, **build the API adapter**. Computer use as a daily driver is a cost and audit hole.

Assembler: send the grid of labels, not a 20MB PNG, unless you have no alternative — and then crop. Dumping full screenshots every turn wrecks the budget and hides the ban list in noise. Trace: log label clicked and at [r,c], not a screenshot in the customer UI.

Parser: cell coordinates plus optional label check. If the model says “click Pay” as a name, that is unknown_tool or banned before the driver runs. Fail closed at the name, not at the pixel.

## Common mistakes

- Computer use as the default executor.
- Unbounded x,y clicks.
- Retrying a banned cell nearby.
- No screenshot observation.
- Treating green pixels as approve.
- Dumping full screenshots into every assemble.

\`\`\`tryit python
SCREEN = [
    ["File", "Edit", "Help"],
    ["Name", "Ada", ""],
    ["Save", "Pay", "Cancel"],
]

BANNED = {"Pay", "Transfer", "Delete"}

def click(r, c):
    label = SCREEN[r][c]
    if not label:
        return {"error": "empty"}
    if label in BANNED:
        return {"error": "banned", "label": label}
    return {"clicked": label, "at": [r, c]}

print(click(0, 0))
print(click(2, 0))
print(click(2, 1))
print(click(1, 2))
\`\`\`

Save is allowed. Pay is banned. Empty cells error. File is a harmless click. The loop should treat \`banned\` as a stop, not as a retry with a nearby cell. There is no “click [2,1] but nicer.” There is handoff.

A real driver would take a screenshot after Save and parse whether the name stuck. This box is the policy: labels plus a ban set. Keep the ban in code, not only in the prompt (“please do not click Pay”).

## How agents use this

The tools track designed the GUI tool. This lesson is the **loop policy**: observe the new screenshot before the next click, budget the clicks, never “almost Pay.”

Router/specialist/verifier next is how you keep computer use (if you must) inside a small specialist with a tight allowlist — not inside a god-loop that can also refund.

\`\`\`quiz
When should an agent click a Pay button on a screenshot?
- When the thought says the invoice is done
- *Never — Pay is banned; use a typed money tool with HITL
- If the pixel color looks green
- After three failed API calls
explain: Computer use is a last resort. Irreversible clicks stay banned.
\`\`\`
`,
  },
  {
    slug: "design-patterns",
    title: "Router, Specialist, Verifier",
    summary:
      "Small agents with jobs beat one god-loop. Route first, specialize second, verify before the world changes.",
    minutes: 22,
    level: "advanced",
    md: `
Three parts you can actually staff:

| Role | Job | Stop |
|---|---|---|
| Router | Pick a specialist from the user text | Unknown → handoff |
| Specialist | Use a small tool set | Budget or finish |
| Verifier | Check the specialist against evidence | Fail → retry or deny |

This is not a multi-agent society yet (next track). It is **one runtime** with three functions. The router does not call refund. The verifier does not search. The billing specialist does not answer poems. Small jobs. The router picks. The specialist acts. The verifier checks.

\`\`\`viz flow
title Router, specialist, verifier
layout lr
node route Router
node spec Specialist
node ver Verifier
edge route spec
edge spec ver
caption Route first. Specialize second. Verify before the world changes.
\`\`\`

Ship this before a swarm. Multi-agent is for when specialists must **talk to each other**. Most products need a router and a verifier first. A god-loop with forty tools is how gather refunds and FAQ specialists send email.

## Router

The router maps user text to a **kind**: billing, faq, handoff. It can be code (keywords) or a small model call with an enum schema. Fail closed: unknown → handoff, not “guess billing.” The router’s tool list is empty or is \`route\` only. It does not execute refund to “save a hop.” Saving a hop is how you skip policy.

Keep the router cheap. It runs every message. If it is a 40-tool ReAct agent, you did not route. You nested a god-loop.

## Specialist

Each specialist is the six-part loop with a **small** catalog: billing has lookup, policy, refund, finish, handoff. FAQ has search-hours, finish, handoff. Computer use, if you must, lives in a specialist that cannot refund.

Assembler advertises only that catalog. State machine is that specialist’s phases. Budget is per specialist run. You can share memory stores or not; do not share allowlists.

The specialist returns a **draft** plus evidence ids, not a live write, unless the verifier (or HITL) already sits in front of writes. Safer: specialist drafts, verifier checks, then executor writes. Money still HITL.

## Verifier

The verifier is the grounded critic with a job title. It sees the draft and the evidence the user will see. Billing must cite policy. FAQ must mention hours. Handoff is not ok as a “specialist success.” Fail → retry once or deny/handoff.

The verifier does not call refund. It does not search. If it needs evidence, the specialist should have fetched it. Asking the verifier to tool-call is how it becomes a fourth agent. Next track can do that on purpose. This track: a function.

## One runtime

Three functions, one process, one run_id, one trace. You can log \`role=router\` then \`role=billing\` then \`role=verifier\`. That is enough to debug. You do not need message buses yet. You do not need a crew of personas.

If billing must ask FAQ a question, you are at the border of the next track. Do not start there. Duplicate a hours note in billing’s retrieve if you must. Talking specialists is a product when the note is not enough.

## Before the world changes

Verify **before** writes. Router → specialist draft → verifier → HITL if needed → execute. If you execute then verify, the critic is a blog post about the incident.

Poems have no specialist: handoff. That is success of the router. Do not send poems to billing “in case.”

## Small catalogs, shared runtime, and what still sits in one loop

Each specialist’s catalog should fit on a notecard. Billing: get_order, check_window (code), refund, finish, handoff. FAQ: get_hours, finish, handoff. If billing also has run_sql, send_email, computer_use, and search_web, you rebuilt the god-loop inside a costume named billing. The assembler advertises the notecard. The parser fail-closes the rest.

Shared runtime means shared stop meters if you want a global cap, shared traces, shared run_id. It does not mean shared allowlists. Memory: a profile store can be shared; a billing scratchpad should not leak into FAQ as if it were policy. Retrieve can be per specialist index.

The verifier’s checklist is per kind. Billing: cites policy, amount present, no extra vendors. FAQ: hours string, no refund language. A shared vibe critic that only says “looks helpful” is ungrounded again. Fail closed on handoff kind: there is no draft to bless.

Writes: prefer draft-then-verify-then-HITL-then-execute. Reads can happen inside the specialist before the verifier. If the specialist executed refund before the verifier, the pattern is theater.

This is still **one** agent costume with three functions. Personas in the prompts (“you are BillingBot”) are optional and often harmful. Jobs are the functions. When billing must **call** FAQ as a peer with its own loop and mailbox, that is the next track. Until then, copy the hours snippet into billing’s notes or add get_hours to billing’s notecard if it is truly needed.

## Common mistakes

- Router calls refund.
- One specialist with every tool.
- Verifier that only reads vibes.
- Verify after the wire transfer.
- Calling this a multi-agent platform.
- Nested god-loop as “router.”

\`\`\`tryit python
def router(text):
    t = text.lower()
    if "refund" in t or "charge" in t:
        return "billing"
    if "hours" in t or "open" in t:
        return "faq"
    return "handoff"

def specialist(kind, text):
    if kind == "billing":
        return {"draft": "refund 40 on order 99", "cited": ["policy"]}
    if kind == "faq":
        return {"draft": "open 9-5", "cited": ["hours"]}
    return {"draft": None}

def verifier(kind, draft):
    if kind == "handoff":
        return {"ok": False, "why": "no specialist"}
    if kind == "billing" and "refund" in draft["draft"] and "policy" in draft["cited"]:
        return {"ok": True}
    if kind == "faq" and "open" in draft["draft"]:
        return {"ok": True}
    return {"ok": False, "why": "failed check"}

def handle(text):
    kind = router(text)
    d = specialist(kind, text)
    v = verifier(kind, d)
    print(text, "->", kind, "ok" if v["ok"] else v.get("why"))
    return v["ok"]

handle("I need a refund")
handle("what hours are you open")
handle("write a poem")
\`\`\`

Refund routes to billing and passes (draft cites policy). Hours route to faq. A poem has no specialist — handoff, not a guess. The verifier never ran a tool. The router never refunded. That is the pattern in three prints.

Keyword routing is blunt. A real router might parse JSON \`{"kind": "billing"}\` from a small model. Still an enum. Still fail closed to handoff. Still one runtime.

## How agents use this

Ship this before a swarm. Multiagent is for when specialists must **talk to each other**. Most products need a router and a verifier first.

Traces next will log these roles per step. Tool thrash still applies inside a specialist. Handoff is how the router’s unknown kind leaves the building with a packet, not a shrug.

\`\`\`quiz
Who should call the refund tool in this pattern?
- The router, to save a hop
- *The billing specialist, after the router picked billing — and only if the verifier (or HITL) agrees
- The verifier
- Every specialist, just in case
explain: Small jobs. The router picks. The specialist acts. The verifier checks.
\`\`\`
`,
  },
];
