import type { RawLesson } from "@/lib/types";

export const agentsLoops: RawLesson[] = [
  {
    slug: "observe-before-finish",
    title: "Observe Before You Finish",
    summary:
      "A finish that ignores the last observation is a guess. The loop must read the world before it claims success.",
    minutes: 20,
    level: "intermediate",
    md: `
ReAct’s most common bug is **skipping the observation**. The model calls a tool, then finishes with a pre-written answer. The thought already “knew” it would rain. The search was theater. Your loop must refuse that.

This is architecture, not a pep talk. Code it. A prompt that says “use the observation” is a wish. A gate that says finish is illegal until the last event is an observation is a system.

The six-part loop already appends observations in memory. This lesson is the **rule** on top: \`finish\` is not legal until the world has spoken, unless the goal is already solved in the prompt (rare: the user pasted the only fact you needed, and even then you should be honest that no tool ran).

## The skip looks confident

Traces of the skip:

1. Thought: I know Paris weather.
2. Action: search (or get_weather)
3. Observation: {rain, 12C} — or the model never waits
4. Finish: “Bring shorts, it is hot.”

Sometimes step 3 is missing entirely: the model emits search and finish in one breath, or the assembler dropped the observation. Sometimes step 3 exists and finish ignores it. Both are guesses. The second is worse because you **paid** for a tool and then ignored it.

A verifier that only checks “did we call finish?” will pass both. A verifier that checks “does the answer mention retrieved facts?” or “was the last event an obs?” will fail them. Fail them.

## Rules you can implement

- After a tool that is not \`finish\`, the next model call must include that observation
- \`finish\` is only legal after at least one observation **or** when the goal is already in the prompt (rare, and you should log \`no_tool_finish\`)
- If the model emits \`finish\` with an answer that does not mention retrieved facts, the verifier can reject it
- The executor always appends an observation after a non-finish tool, even if the observation is \`{"error": "timeout"}\`. Empty skip is how the gate is fooled.

\`\`\`viz flow
title Observe before you finish
layout lr
node act Action
node obs Observe
node fin Finish
edge act obs
edge obs fin
caption The world speaks, then you may claim success. Finish-first is a guess.
\`\`\`

The legal-finish gate in the live box is the blunt version: last event must be kind \`obs\`. That does not prove the answer **used** the obs. Grounded critics (later) score that. Start with the blunt gate. You cannot use evidence you never stored.

## Finish-first is illegal

Finish as the first action means the model never looked. That is a chatbot with a \`finish\` sticker. For this track’s default (tools exist, the world might disagree), refuse it. Return \`illegal finish\` as an observation or as a stop. Do not run \`finish\`. Do not show the user a final answer.

If your product is “answer from weights, tools optional,” you still want a flag: \`used_tools: false\`. Do not pretend a tool was used.

## The assembler can cause the skip

If the window dropped the latest observation to save tokens, the model will finish from the thought. Truncate old events, not the last obs. If you must truncate observations, keep the last one whole. The assembler budget lesson said never drop the goal. Here: never drop the latest observation either.

If you summarize, the summary must include the last tool JSON, not only “we searched.”

## Parallel calls do not skip observe

Two reads in one turn still produce two observations before finish is legal. Do not finish in the same turn as a write. Do not finish in the same turn as a read unless you already stuffed those observations into the model’s next call — which means it is the **next** turn.

Classic ReAct: one action, then observe, then maybe finish. Keep that until you have a reason.

## Illegal finish is a trace event

Log \`illegal_finish\` with the events you had. That is a better eval later than reading thoughts. This track: make the event exist so operators can search for it. If half your runs are illegal finish, the prompt is wrong or the assembler is dropping obs. If a few are, the model is rushing. The gate catches both.

## What this is not

This is not multi-agent debate (“another agent checks the answer”). It is one loop that will not claim success before the executor has written. A critic can sit on top later. The gate is cheaper than a second model call.

Error observations count. A timeout is still an observation: the world spoke, it said fail. Finish that ignores the timeout is the skip in a different costume. The blunt gate (last kind is obs) would allow finish after a timeout; the grounded critic should not. Use both: legality of the name, then quality of the answer.

## Common mistakes

- Prompt-only “please use the tool result.”
- Finish in the same breath as the first tool.
- Truncating the last observation.
- Treating a thought as evidence.
- Verifying only that finish was called.
- Swallowing tool errors so no obs is appended.

\`\`\`tryit python
def finish_ok(events):
    if not events:
        return False
    return events[-1]["kind"] == "obs"

def step(events, name, obs=None):
    if name == "finish" and not finish_ok(events):
        return events, "illegal finish"
    if name == "finish":
        return events + [{"kind": "act", "name": "finish"}], "ok"
    rec = [{"kind": "act", "name": name}, {"kind": "obs", "value": obs}]
    return events + rec, "ok"

ev = []
ev, msg = step(ev, "finish")
print("first", msg)
ev, msg = step(ev, "search", {"hits": 1})
print("search", msg, "last", ev[-1]["kind"])
ev, msg = step(ev, "finish")
print("after obs", msg)
\`\`\`

Finish-first is illegal. After search, the executor always appends an observation. Finish is then legal. The gate is: last event must be an observation. The event list never gains a finish act on the first call. After search, \`last\` is \`obs\`. Then finish is \`ok\`.

This gate does not read the answer text. It only checks that the world spoke. Pair it with a grounded critic when the answer must cite the obs. Do not skip the gate because you plan to add a critic. The gate is free.

## How agents use this

If traces show \`finish\` with an answer that does not match the last tool JSON, fail the run in review. That is cheaper than hoping the prompt said “use the observation.”

Put \`finish_ok\` next to \`should_stop\`. Stop on success only if finish was legal. An illegal finish should not count as success even if the model used the \`finish\` name.

\`\`\`quiz
When is finish legal in a ReAct-style loop?
- As the first action, always
- *After the executor has written at least one observation (unless the goal is already solved in context)
- Whenever the thought feels confident
- After any number of thoughts with no tools
explain: Finish without an observation is a guess. The world has not spoken yet.
\`\`\`
`,
  },
  {
    slug: "plan-and-execute",
    title: "Plan and Execute",
    summary:
      "Write a short plan first, then run steps. Better for multi-hop work; worse when the world changes under you.",
    minutes: 21,
    level: "intermediate",
    md: `
**Plan-and-execute** splits the loop:

1. **Planner** — write a short list of steps (and maybe which tool each step needs)
2. **Executor** — walk the list, calling tools
3. **Replan** (optional) — if a step fails or the world disagrees, write a new list

\`\`\`viz flow
title Planner then worker
layout lr
node plan Planner
node work Worker
node replan Replan
edge plan work
edge work replan
caption Write a short plan. Walk the steps. Replan only if the world moved.
\`\`\`

You still have the six parts. The planner is a model call (or a template) whose parser output is a **plan**, not a single action. The executor of the plan is a loop over steps; each step may still call the tool executor. Stop still caps the whole run. Memory still stores what happened — including the plan itself.

This is cheaper than ReAct when the path is obvious: research with three known sources, a refund that always needs lookup then policy then write. You pay for one planning call, then cheap steps, instead of re-deciding the next tool from scratch every turn.

It is **worse** when every observation can invalidate the rest of the plan: live incidents, bargaining, anything that waits on a human or another system. A plan that cannot be updated is a script. A plan you throw away after every step is ReAct with extra tokens.

## When the path is obvious

A refund window check is a path:

1. Lookup the order
2. Compare \`days_ago\` to policy
3. Approve or deny

You do not need a thought at each hop if policy lives in **code**. The planner can emit those three steps. The executor walks them. The model should not re-invent the window as “90 days” in a thought. Policy in code is the point of this costume.

Research with three known sources is similar: fetch A, fetch B, fetch C, then write. ReAct might fetch A twice and forget C. A plan lists C.

## When the world moves

Live incident: you planned “restart the box,” then the observation says the box is gone. The rest of the plan is harmful. Replan or switch to ReAct. Bargaining: the user’s new message invalidates “send the standard email.” HITL: you planned refund, the human denied — do not execute step 3.

A frozen plan dies when the world moves. That is the quiz. Use ReAct (or replan) there.

## Replan is not restart

When a step fails, **replan from here** unless the goal changed. Keep done steps marked done. Keep the old plan in the trace. Restarting from step 1 re-runs side effects. Lookup might be safe to retry. Charge is not.

The next lesson makes the plan a list of objects with status. Here, know the control flow: planner → walk → maybe planner again, not planner → walk → throw away memory.

## Policy in code, not in the model

The live box looks up an order, checks \`window_days\` in a dict, then decides. The planner did not “reason” about 30 days. The executor applied POLICY. That split is the win. If the model writes the plan as “be fair about refunds,” you are back to vibes.

The planner chooses **structure**. Code chooses **rules**. ReAct mixes them every turn. Plan-and-execute lets you mix less.

## Plans are visible

Product managers can read a three-step plan. They cannot read a 40-step ReAct thought dump. Store the plan as JSON on the run record. When you replan, keep the old plan. Operators ask “what did it intend?” before “what did it think?”

UI progress is “step 2 of 3.” You cannot do that with a paragraph. Next lesson.

## Cost and latency

One plan call plus N tool calls can beat N full ReAct turns if each ReAct turn restates tools and history. It can lose if you replan every step. Measure. Do not assume plan-and-execute is “more advanced” and therefore better. It is a costume for **stable paths**.

## What this is not

This is not a multi-agent crew (planner agent, worker agents, critic agents talking). It is **one runtime** with a planner function and an execute-plan function. Specialists that talk to each other are the next track. You can staff a planner as a separate prompt later. You do not need a society to walk a list.

## Common mistakes

- Frozen plans for live incidents.
- Policy only in the planner’s English.
- Replanning from step 1 after a write.
- No stop cap on the walk (a 40-step plan is still a furnace).
- Treating a paragraph as a plan.
- Using plan-and-execute to skip observations: each tool step still observes.

\`\`\`tryit python
POLICY = {"window_days": 30}

def lookup_order(oid):
    return {"id": oid, "days_ago": 12, "paid": 40}

def planner(goal):
    return [
        {"id": 1, "do": "lookup", "tool": "lookup_order"},
        {"id": 2, "do": "check_window", "tool": None},
        {"id": 3, "do": "decide", "tool": None},
    ]

def execute_plan(plan, oid):
    notes = {}
    for step in plan:
        if step["do"] == "lookup":
            notes["order"] = lookup_order(oid)
        elif step["do"] == "check_window":
            notes["ok"] = notes["order"]["days_ago"] <= POLICY["window_days"]
        elif step["do"] == "decide":
            if notes["ok"]:
                notes["answer"] = "approve " + str(notes["order"]["paid"])
            else:
                notes["answer"] = "deny: outside window"
        print("step", step["id"], step["do"], notes.get("answer") or notes.get("ok") or notes.get("order"))
    return notes["answer"]

print("RESULT", execute_plan(planner("refund 99"), "99"))
\`\`\`

The plan is data. The executor walks it. Policy lives in code, not in the model. Order 99 is 12 days ago, inside 30, so the answer is approve 40. Change \`days_ago\` in \`lookup_order\` to 90 and the same plan denies. You did not re-prompt. You changed the world.

\`planner\` ignores \`goal\` on purpose in this fake: the path is stable. A real planner would parse the goal for the order id. The id here is an argument to \`execute_plan\`. That is allowed: not every field must come from the model.

## How agents use this

Store the plan as JSON on the run record. When you replan, keep the old plan in the trace. Product managers can read a plan; they cannot read a 40-step ReAct thought dump.

Pick the costume from the world: stable path → plan-and-execute; moving world → ReAct or replan. Do not pick it from a blog post about “agentic.” The next lesson types the plan so you can skip, retry, and show status.

A plan is still a loop with six parts: the planner is a model (or a template), the plan parser fail-closes, each tool step has an executor and an observation, stop still caps the walk. Do not drop observe-before-finish because a list exists. Step 3 still reads what step 1 fetched.

\`\`\`quiz
When is plan-and-execute a bad default?
- Research with three known sources
- *Live incidents where each observation can invalidate the rest of the plan
- A refund that always needs lookup, then policy, then write
- A checklist with no tools
explain: A frozen plan dies when the world moves. ReAct (or replan) is for that.
\`\`\`
`,
  },
  {
    slug: "plan-as-data",
    title: "Plans Are Data, Not Poetry",
    summary:
      "A plan is a list of typed steps with ids. Free-text paragraphs cannot be skipped, retried, or shown in a UI.",
    minutes: 19,
    level: "intermediate",
    md: `
If the planner writes a paragraph, you cannot:

- Skip a step that is already done
- Retry only the failed step
- Show progress in a UI
- Guard which tools exist on which step
- Replan from a step id
- Freeze **one** step’s args for a human

So the plan is **JSON**: a list of objects with \`id\`, \`do\`, optional \`tool\`, optional \`depends_on\`, and a \`status\` your runtime owns (\`todo\`, \`doing\`, \`done\`, \`failed\`).

Poetry cannot be retried. Operations need ids and status.

\`\`\`viz strip
title A plan is a list of steps
chip id
chip do
chip tool
chip status
caption Skip, retry, and a progress bar need these fields. A paragraph cannot.
\`\`\`

The planner may **draft** English. The parser must turn it into this list or reject the plan. A plan missing \`do\` is rejected **before** the loop starts. You do not begin a furnace because the model wrote a nice essay.

## Fields that earn their keep

| Field | Why |
|---|---|
| \`id\` | Stable handle for retry, UI, HITL, traces |
| \`do\` | What this step means in your runtime |
| \`tool\` | Optional; some steps are pure code (check_window) |
| \`depends_on\` | Optional; do not run 3 before 1 |
| \`status\` | Owned by the runtime, not the model |

The model should not set \`status: done\` in the draft. You mark done after the executor succeeds. If the planner is allowed to mark done, it will skip work.

\`do\` is a small enum you handle in code: lookup, check_window, decide, refund. Open English \`do\` (“maybe be nice”) is a paragraph again.

## Parse, then walk

\`parse_plan\` is the parser costume for plans. Fail closed: missing \`do\`, unknown \`tool\`, duplicate \`id\`, empty list. Do not start \`execute_plan\` on an error object.

Default \`id\` to the enumeration index only if you must. Prefer ids from the planner so replans can keep them. If you replan and ids change, UI progress lies.

## Skip, retry, next

\`next_todo\` is the cursor. After a crash, you do not guess the cursor from prose. You look at status. Skip means mark done without running (already have the lookup in notes). Retry means set one failed step back to todo. Restart-all is a last resort when the goal changed.

When a step fails, **replan from here**, do not restart from step 1 unless the goal changed. Side-effecting tools on done steps must not run again unless they are idempotent (tools track).

## Guards on steps

Typed state said: refund is illegal in gather. Plans can carry the same idea: the refund step’s tool is only legal if notes have \`ok: true\`. That is a guard on the step, not a hope in the paragraph “then refund if appropriate.”

HITL later freezes **one step’s args**, not a poem. You need an id to freeze.

## UI is done / total

The progress bar is count of \`done\` over length of plan. Blocked is “waiting_human on step 3.” Failed is step id plus error. None of that exists for a paragraph. If your UI shows a spinner and a thought, you do not have a plan product. You have ReAct with a planning essay up front.

## Replans are versions

Store \`plan_v1\`, \`plan_v2\` on the run. Do not overwrite. Operators ask what you intended at step 0 vs after the lookup failed. A single mutating list without history is how you gaslight yourself.

## depends_on, failure records, and empty plans

If step 3 needs the order dict from step 1, say so as data: \`depends_on: [1]\`. The walker should not run 3 while 1 is todo or failed. Implicit order (list index) is fine for linear refunds. The moment you have two lookups that could run in either order, ids plus depends_on beat a paragraph that says “then, after the lookups.” Parallel reads are an optimization the tools track already allowed. Parallel writes of dependent steps are how you charge before you check the window. The plan object is where you forbid that.

When a step fails, record **why** on the step: \`status: failed\`, \`error: timeout\`, maybe \`obs\` truncated. The replan prompt (or the code path that rebuilds the list) should see that record, not a thought that “something went wrong.” If you delete the failed step instead of marking it, you cannot retry only that id. If you leave it todo, \`next_todo\` will spin on a broken lookup until the budget. Failed is a real status. Skip is a real status (already have the data). Todo / doing / done / failed / skipped is enough. Do not invent “kinda.”

Empty plans and one-step plans are parse errors or special cases you decide in code. An empty list is not “the model wants to finish.” It is \`bad_plan\`. A one-step plan that is only \`finish\` is observe-before-finish again: illegal unless evidence is already in context. A plan that lists tools not in the registry is the parser’s unknown_tool, applied to the whole list **before** step 1 runs. Rejecting the plan is cheaper than executing step 1 and dying on step 2’s invented name.

The planner is a model call with a schema. Temperature and poetry belong in a scratch thought you throw away. The object you store is the list. If the model also writes a rationale field, log it like a ReAct thought: operator UI only, never the thing the walker switches on.

## Common mistakes

- Storing the plan as markdown bullets only.
- Letting the model own \`status\`.
- Open-ended \`do\` strings you cannot switch on.
- Restarting from 1 after a write.
- No parse of the plan (walking a blob).
- Changing ids on every replan.

\`\`\`tryit python
def parse_plan(raw_steps):
    plan = []
    for i, row in enumerate(raw_steps, start=1):
        if "do" not in row:
            return {"error": "step missing do", "i": i}
        plan.append({
            "id": row.get("id", i),
            "do": row["do"],
            "tool": row.get("tool"),
            "status": "todo",
        })
    return {"ok": True, "plan": plan}

def mark(plan, step_id, status):
    for s in plan:
        if s["id"] == step_id:
            s["status"] = status
            return True
    return False

def next_todo(plan):
    for s in plan:
        if s["status"] == "todo":
            return s
    return None

parsed = parse_plan([
    {"do": "lookup", "tool": "get_order"},
    {"do": "refund", "tool": "charge"},
])
plan = parsed["plan"]
mark(plan, 1, "done")
print("next", next_todo(plan)["do"])
print("bad", parse_plan([{"tool": "oops"}]))
\`\`\`

Step 1 is done. Next is refund. A step without \`do\` is rejected before the loop starts. \`mark\` returns True when the id exists. \`next_todo\` walks in list order. That order is your default \`depends_on\`. If you need real edges, add them as data; do not encode them in a sentence.

The bad parse never produces a plan you can mark. That is fail closed for planners.

## How agents use this

The UI progress bar is \`done / total\` on this list. Human-in-the-loop later freezes **one step’s args**, not a poem.

Checkpoints (later) should save this list, not a 4k “memory” string. Replay means load statuses and continue \`next_todo\`. If you only saved the paragraph, replay is “ask the model what we were doing.” That is not a checkpoint.

\`\`\`quiz
Why store a plan as a list of objects instead of a paragraph?
- Paragraphs score better on vibe evals
- *You can skip, retry, and show status on typed steps
- JSON is always shorter
- Models cannot write lists
explain: Operations need ids and status. Poetry cannot be retried.
\`\`\`
`,
  },
  {
    slug: "reflection",
    title: "Reflection and Self-Critique",
    summary:
      "A second pass that scores the draft against a checklist. It is not a second personality — it is a function.",
    minutes: 20,
    level: "intermediate",
    md: `
**Reflection** is a second model call (or a cheap program) that looks at a draft and says: ship, retry, or hand off.

\`\`\`viz loop
title Reflect with a cap
step Draft
step Critique
step Retry or ship
caption Score the draft against a checklist. Cap retries. Never exec the draft.
\`\`\`

It is not a second personality. It is not “another agent” in the multi-agent sense. It is a **function** over a draft: input dict, output score and errors. You can implement it with code when the checklist is mechanical (tests, arithmetic, required keys). You can implement it with a model call when the checklist is linguistic (tone, citations present). Either way, cap retries. Either way, **never \`exec\` the draft**.

The original Joeven demo used \`exec\` on model code. **Never do that.** A critic that runs model Python is a shell as a service. The critic here is a function over a dict. The live box keeps that rule. Do not “improve” it by executing strings.

## When reflection helps

Use it when:

- The first pass is often almost-right (code, citations, tone)
- You have a **checklist** the critic can score
- A retry is cheaper than a human
- You can stop if the same error repeats

Do not use it when the first pass is already a guess with no evidence. Reflection cannot invent a source. Observe-before-finish still applies: if there is no observation, a critic that says “looks good” is a vibe rater. Ground the critic in the next lesson.

Do not use it as a substitute for stop. “Try again” without a cap is a furnace. “Are you sure?” with no rubric is a coin flip that costs tokens.

## Checklist, not vibes

A checklist is pass/fail items:

- Output equals \`n * n\`
- JSON has keys name and args
- Answer cites snippet ids that exist
- Tests green

A vibe is “be better” or “are you sure?” The critic must return \`ok\` plus \`errors\` you can log. If it only returns a paragraph of praise, you cannot branch.

Code critics are cheap and strict. Model critics are expensive and fuzzy. Prefer code when the check is mechanical. This lesson’s square critic is code. You do not need a model to know 4 squared is 16.

## Retry cap and the same error

Cap at two or three tries. If try 2 has the same error as try 1, stop — that is a tool or spec bug, not a missing pep talk. Changing the draft function (or the prompt) after a structured error is allowed. Blindly calling the same model again is thrash.

The live box simulates a fix by swapping \`make_draft\` after a failed critic. In production you might send the error string back to the model once. You would still cap. You would still not exec.

## Reflection sits on the six parts

The draft comes from the main loop (model + maybe tools). The critic is another model call **or** a program. The parser still fail-closes the draft if it is supposed to be JSON. Stop still owns the cap. Memory should store critic errors as observations so the next draft sees them — as data, not as a new personality.

Do not spin a second infinite loop. One critic call per try. Max tries in the reflect loop. Then ship, cannot, or handoff.

## What you do not reflect

Do not reflect a pending write into existence. If the draft is “refund 400,” the critic should check policy, not cheer. HITL still freezes args. A critic is not an approver of money unless your checklist is the policy table — and even then, irreversible tools may still need a human.

Do not exec code to “see if it works.” Run tests in a sandbox you own, or check outputs as data. This lesson checks \`out == n * n\`. That is enough to learn the shape.

## What the critic returns, and who retries

A useful critic return is small: \`ok\`, \`score\` if you want a number, \`errors\` as a list of strings the next draft can see. Do not return a three-page essay. The assembler will stuff errors into the next context as an observation. If that observation is huge, you recreated the assembler-budget bug inside reflection. Truncate errors. One line per checklist miss is enough: “expected 16 got 8.”

Who retries? The **same** specialist loop, with a cap. Not a new agent with a new personality. Not a crew. You swap the draft function (as the box does) or you send the error list back to the same model once. If try 2 fails the **same** error string, stop. That is how you tell a spec bug from a sloppy first draft. Spec bugs belong in your tests and your tool, not in try 6.

Reflection does not replace stop, HITL, or observe-before-finish. Order of gates:

1. Parser blessed the draft shape.
2. Executor (or a dry run) produced evidence if tools were needed.
3. Critic scored the checklist.
4. HITL if the tool is irreversible.
5. Then the world changes.

If you criticise after the refund, you wrote a postmortem. If you criticise without evidence, you wrote a vibe. If you exec the draft to “run the tests,” you gave the model a shell. The square example is deliberately not code execution: it compares two numbers. When you later test real code, run **your** tests on **your** runner with an allowlist, never \`exec\` of model text. That rule does not relax because the critic “looked careful.”

## Common mistakes

- \`exec\` / \`eval\` on model text.
- “Are you sure?” with no rubric.
- No retry cap.
- Critic with no evidence (next lesson).
- Treating reflection as a second agent society.
- Using reflection to skip observe-before-finish.

\`\`\`tryit python
def draft_square(n):
    return {"kind": "code", "n": n, "out": n * n}

def draft_wrong(n):
    return {"kind": "code", "n": n, "out": n + n}

def critic(draft):
    n = draft["n"]
    expect = n * n
    if draft["out"] == expect:
        return {"ok": True, "score": 1}
    return {
        "ok": False,
        "score": 0,
        "error": "expected " + str(expect) + " got " + str(draft["out"]),
    }

def reflect_loop(make_draft, n, max_tries=3):
    for i in range(1, max_tries + 1):
        d = make_draft(n)
        c = critic(d)
        print("try", i, "out", d["out"], "critic", c)
        if c["ok"]:
            return d
        if i == 1:
            make_draft = draft_square
    return {"cannot": "critic rejected"}

print("fixed", reflect_loop(draft_wrong, 4))
print("already good", reflect_loop(draft_square, 5))
\`\`\`

Try 1 fails the checklist (8 is not 16). Try 2 uses the corrected draft function and passes. No \`exec\`. No second soul. The already-good path passes on try 1. The critic is arithmetic. That is the point: a function over a dict.

If both drafts were wrong, the loop would hit \`cannot\`. That is a stop, not a fourth try. Keep it that way.

## How agents use this

Ground the critic (next lesson). Cap retries. If the same error repeats, stop — that is a tool or spec bug, not a missing pep talk.

Put critic results in the trace: score, errors, try index. Operators should see “critic rejected expected 16 got 8,” not “the agent reflected.” Names of parts, again.

\`\`\`quiz
What is a safe critic for agent output?
- exec() the model’s Python
- *A function (or model call) that scores a draft against a checklist, with a retry cap
- A second agent with no stop
- Asking the same model “are you sure?” with no rubric
explain: Reflection is a scored second pass. exec of model text is a shell as a service.
\`\`\`
`,
  },
  {
    slug: "grounded-critic",
    title: "Ground the Critic",
    summary:
      "A critic that cannot see citations, tests, or policy will rubber-stamp vibes. Give it the same evidence the user will see.",
    minutes: 21,
    level: "intermediate",
    md: `
An ungrounded critic says “looks good.” A **grounded** critic gets:

- The draft answer
- The retrieved snippets (RAG track)
- The tool JSON
- A pass/fail checklist: cites ids, no extra vendors, tests green

\`\`\`viz flow
title Ground the critic
layout lr
node draft Draft
node evid Evidence
node stamp Stamp or fail
edge draft evid
edge evid stamp
caption Same snippets, tool JSON, and tests the user will see. No secret notes.
\`\`\`

If the critic cannot point at evidence, it is a vibe rater. Vibe raters agree with confident lies. They are worse than no critic: they add a stamp that looks like quality.

This is the same idea as observe-before-finish and as citation subset in RAG. The critic is another parser of evidence, not a cheerleader. Reflection without grounding is “are you sure?” Grounding is “show me s1.”

## Evidence the user will see

Give the critic the **same** evidence the user will see. If the user sees snippets s1 and s2, the critic sees s1 and s2. If you hide s1 from the critic but put it in the user answer, the critic cannot catch an ignore. If you give the critic extra secret notes the user will not see, the critic will bless answers the user cannot verify.

Tool JSON is evidence. Tests are evidence. Policy tables are evidence. Private thoughts are not evidence. Yesterday’s Slack is not evidence unless it was retrieved as a snippet with an id.

## Checks that mean something

Unknown cite: the answer cites \`s9\` which is not in the snippet map. Fail.

Missing cite: the checklist required \`s1\` and it is not in \`cited\`. Fail.

Answer ignores snippet: the cite list includes \`s1\` but the prose does not use the facts (here, a naive word check). Fail.

Extra vendor or extra promise: if policy forbids it, fail.

These are code checks. A model critic can still help with tone, but it must receive the snippets and return structured errors, not “great job.”

## Rubber stamps

“Bring shorts, it is hot” with a cite of s1 (Paris rain) is the rubber stamp if the critic only checks that **a** cite exists. Require that the answer is consistent with the snippet text. The live box uses a blunt “first word of snippet in answer” check so you can see a fail. Production checks will be tighter (numbers, named entities). The shape is: **compare draft to evidence**, do not score confidence.

A critic that only reads the draft will bless fluent weather that is wrong. That is an ungrounded critic.

## Grounding does not invent sources

If there are no snippets, the critic should fail “no evidence,” not invent s1. Reflection cannot fetch. If you need evidence, the main loop must tool-call first. The critic is a gate on a draft that already had a chance to observe.

If tool JSON says timeout, a draft that answers anyway should fail. That is observe-before-finish inside the critic.

## Where it sits in the loop

After a finish draft (or a write draft), run the critic **before** the world changes or before the user sees success. If the critic fails, retry with the errors as an observation, or handoff. Do not send the email and then critique.

Cap retries. Same error twice → stop. The critic is not a specialist society. It is a function. Multi-agent comes next track if you need specialists to talk. You do not need that to check cites.

## Tool JSON, tests, and policy are evidence too

Snippets are the RAG-shaped case. Agents also draft from **tool JSON**: weather dicts, ticket rows, SQL counts. Give the critic that JSON, not a paraphrase. If the tool said \`temp_c: 12\` and \`sky: rain\`, the critic can require those tokens or numbers in the answer. If you only pass the prose “it is raining,” the critic cannot catch a 28C lie that still says rain.

Tests are evidence for code drafts: a list of \`{name, passed}\` from **your** runner. The critic checks that required tests are green and that the draft does not claim tests it did not run. It does not run the tests by executing the draft. Policy tables are evidence for money: \`window_days: 30\`, \`cap: 50\`. A billing draft that approves 80 against cap 50 fails the critic **and** should have failed a guard. Defense in depth is allowed. A critic that cannot see the cap will bless 80 if the prose sounds fair.

Must-cite is a checklist the product owns, not a model whim. Support answers might must-cite the policy snippet. Weather answers might must-cite the latest observation id. If must-cite is empty and cited is empty, you are back to ungrounded. Empty evidence plus empty cites should fail “no evidence,” not pass “nothing to check.”

Do not ground the critic on private thoughts (“I decided it was hot”). Do not ground it on a Slack dump that the user will never see. Same-evidence is the fairness rule: if the user cannot see it, it does not count as a stamp. If operators need extra notes, put them in the operator trace, not in the ship gate.

## Common mistakes

- Critic sees only the prose.
- Critic sees secret evidence the user will not see.
- Cite list checked, facts not checked.
- Blessing answers after tool timeout.
- Second infinite model loop.
- Using a vibe score as a ship gate.

\`\`\`tryit python
SNIPS = {
    "s1": "Paris rain 12C",
    "s2": "Museum closed Mondays",
}

def critic(answer, cited, snips, must_cite):
    errors = []
    for sid in cited:
        if sid not in snips:
            errors.append("unknown cite " + sid)
    for sid in must_cite:
        if sid not in cited:
            errors.append("missing " + sid)
        elif snips[sid].split()[0].lower() not in answer.lower():
            errors.append("answer ignores " + sid)
    if errors:
        return {"ok": False, "errors": errors}
    return {"ok": True, "errors": []}

print(critic("Paris rain 12C. Museum closed Mondays.", ["s1", "s2"], SNIPS, ["s1", "s2"]))
print(critic("Bring shorts, it is hot.", ["s1"], SNIPS, ["s1"]))
print(critic("Paris rain 12C.", ["s9"], SNIPS, ["s1"]))
\`\`\`

Hot-weather advice fails: the answer ignores snippet s1 (no “paris”). Unknown cite s9 fails, and s1 is missing from cited. Grounded rain plus museum passes with empty errors. Read the three dicts. Two are \`ok: False\`. That is a critic doing work.

The first-word check is crude on purpose so the box stays small. A real checker might require the temperature number. Crude and grounded still beats eloquent and blind.

## How agents use this

Same idea as citation subset (RAG) and as “observe before finish.” The critic is another parser of evidence, not a cheerleader.

Wire critic errors into the trace next to parse errors. When you add eval later, these structured errors are already a gold-shaped signal. This track only needs the gate: no evidence, no stamp.

\`\`\`quiz
What must a critic see to be more than a vibe rater?
- Only the draft prose
- *The draft plus the same evidence the user will see (snippets, tool JSON, tests)
- The model’s private thoughts only
- Yesterday’s Slack
explain: Ungrounded reflection rubber-stamps confidence. Evidence makes it a check.
\`\`\`
`,
  },
];
