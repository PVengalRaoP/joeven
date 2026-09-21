import type { RawLesson } from "@/lib/types";

export const multiRoles: RawLesson[] = [
  {
    slug: "roles",
    title: "Roles: Planner, Worker, Critic",
    summary:
      "Three classic roles with different tools, outputs, and stop conditions. The critic should not hold the worker’s write tools. Start with this trio, not a soap opera.",
    minutes: 21,
    level: "intermediate",
    md: `
If you only ever add extra agents once, add **roles with teeth**: different tools, different outputs, different definitions of done. The split-or-merge lesson asked for a contract table. This lesson fills the most common honest table: **planner**, **worker**, **critic**.

This is the Agents track’s **router / specialist / verifier** idea with **separate traces**. You can eval the planner for coverage (did every constraint get a step?), the worker for tool correctness (did it only call what the step allowed?), the critic for false rejects (did it block a draft that already met the rubric?). One runtime with three functions cannot give you those three traces. Three names with the same tools still cannot. You need the teeth.

The planner should not quietly do the work. If it can \`run_shell\`, it will “save a round trip” and you are back to one agent with a hat. Workers return **artifacts** (files, JSON), not chat. Cap their budget per assignment. The critic is grounded. If tests exist, it **reads the test report**. A critic that only says “looks good” is a random boolean you could have replaced with \`return True\`.

## The three contracts

| Role | Sees | May do | Done when |
|---|---|---|---|
| Planner | Goal, constraints, catalog of workers | Emit a plan / assignments | Plan is valid or approved |
| Worker | A step plus the tools for that step | Call domain tools | Step predicate is true |
| Critic | Worker output plus evidence | Accept, reject, comment — usually **no writes** | Rubric returns pass or a fix list |

\`\`\`viz flow
title Three roles with teeth
layout lr
node planner Planner
node worker Worker
node critic Critic
edge planner worker
edge worker critic
caption Different tools, different done checks. The critic does not hold write tools.
\`\`\`

**Planner.** Input: the user goal and a catalog like \`docs\`, \`writer\`, \`coder\`. Output: a **list of typed steps**, not a pep talk. Each step names a worker, an intent, and later a budget. The planner does not fetch the policy and does not write the user-facing draft. If your planner’s allow-list includes the worker’s writes, the planner will skip the worker when it is “sure.” Sure is how \`src/app.py\` gets patched without tests.

**Worker.** Input: one step from the board, plus only the tools for that step. A **docs** worker may fetch. A **writer** worker may draft from an artifact id. A **coder** worker may edit and run tests. Workers do not pick the next worker. That is orchestration (next part). Workers do not hold the critic’s rubric. They produce an artifact with an id.

**Critic.** Input: the artifact plus evidence ids (doc id, test report id, policy snippet). Output: \`{ok, issues[]}\`. No \`edit\`, no \`refund\`, no \`send_email\`. If issues exist, the runtime **reassigns the worker** with those issues on the board. If you give the critic writes, you have two workers, and the critique path disappears into extra side effects. The next two lessons lock isolation and the no-write rule. Here you only need the shape.

You can eval them **apart**. Planner coverage: every required intent appears. Worker: schema of the artifact, tools actually called. Critic: on a fixture that is already correct, it must not invent issues; on a fixture missing \`5-7\`, it must not pass.

## Walkthrough: quote the refund delay

Board goal: summarize refund policy with a quote. This is not a coding ticket. It is a small team so you can see the teeth.

1. Planner emits two steps: docs worker fetches the policy; writer worker quotes the delay in days.
2. Docs worker writes artifact \`kb-44\` with the sentence about 5-7 business days. It does not write the user draft. Done-check: artifact has a doc string and an id.
3. Writer worker reads \`kb-44\` from the board, not from chat. It writes a draft with text, quote, and source id. Done-check: those keys exist.
4. Critic has **no tools**. It checks: delay \`5-7\` in the text, source id \`kb-44\`, a quote field. Pass or a fix list.

If the writer omits the delay, the critic returns issues and the runtime sends the writer back — it does not let the critic type a new sentence into production. If the planner had fetched the doc itself, you would have no docs artifact to eval, and the writer would depend on planner prose.

Start with this trio on **one** product surface. Adding intern, intern-2, and manager is how you get a soap opera. A second worker type (coder vs docs) is a new **contract**, not a new nickname. A supervisor, later, is a planner that only assigns and never chats with workers as peers.

\`\`\`tryit python
board = {"goal": "summarize refund policy with a quote", "plan": [], "artifact": None}

def planner(board):
    board["plan"] = [
        {"id": 1, "worker": "docs", "intent": "fetch refund policy"},
        {"id": 2, "worker": "writer", "intent": "quote the delay in days"},
    ]
    return board["plan"]

def docs_worker(step, board):
    board["artifact"] = {
        "doc": "Refunds are issued in 5-7 business days after approval.",
        "id": "kb-44",
    }
    return board["artifact"]

def writer_worker(step, board):
    doc = board["artifact"]["doc"]
    board["draft"] = {
        "text": "Refunds take 5-7 business days.",
        "quote": doc,
        "source": board["artifact"]["id"],
    }
    return board["draft"]

def critic(board):
    draft = board.get("draft") or {}
    issues = []
    if "5-7" not in draft.get("text", ""):
        issues.append("missing delay")
    if draft.get("source") != "kb-44":
        issues.append("missing source id")
    if "quote" not in draft:
        issues.append("no quote")
    return {"ok": not issues, "issues": issues}

print("PLAN", planner(board))
print("DOCS", docs_worker(board["plan"][0], board))
print("DRAFT", writer_worker(board["plan"][1], board))
print("CRITIC", critic(board))
print("critic tools: none")
\`\`\`

**What printed:** \`PLAN\` is two typed steps, not a paragraph. \`DOCS\` is artifact \`kb-44\` with the 5-7 sentence. \`DRAFT\` quotes that doc and sets \`source\` to \`kb-44\`. \`CRITIC\` is \`ok: True\` with an empty issue list. The last line reminds you the critic has no tools. Break the draft: delete \`5-7\` from \`text\` and run again. The critic should list \`missing delay\`. That is a grounded rubric, not a personality.

This toy mutates one \`board\` dict in place so you can read it. Production should copy-on-write (blackboard lesson) so a failed critic cannot leave a half-edit. The planner here is a function that always returns the same two steps. A model planner still must emit this **shape**. If it emits a novel, parse fail-closed like the brief parser.

## What this trio is not

It is not ReAct with three hats. ReAct is one policy calling tools in a loop. Here three policies exist, and **code** (or a supervisor) moves the board. Workers do not “think about who is next” unless you chose peer handoff on purpose, with hop limits.

It is not debate. Debate is two answers plus a judge on a hard, checkable question. A critic with a rubric is cheaper. Use debate later when single-sample workers fail in a known way and you have evidence for the judge.

It is not a swarm. One docs worker and one writer is a pipeline. Fifty writers on the same draft is a race.

## How agents use this

Handoffs are typed events (next lessons). If those structs are not in the codebase, you have a group chat with job titles. Name three functions you can grep: \`plan_ticket\`, \`run_step\`, \`review_artifact\`. If a teammate cannot find the critic’s forbid-writes, you do not have a critic.

Eval each role on fixtures that **only that role** can fail. Planner: omit a required step, expect the plan parser to reject. Worker: illegal tool, expect dispatcher deny. Critic: golden-good draft, expect \`ok\`; golden-bad draft, expect a named issue, not a poem.

Cap worker budget per step on the assignment object. A writer that calls search forty times is not “thorough.” It is a furnace inside a specialist. The stop belongs to the worker’s loop **and** to the team hop cap.

When product asks for intern and manager, show this table. If intern and manager would share the writer’s tools and the writer’s done-check, merge them into the writer. If you need assignment, that is the planner or a supervisor, with **no** domain writes.

\`\`\`quiz
Why should the critic usually not have write tools?
- Critics are not smart enough to write
- *Otherwise you have two workers, and the critique path disappears into extra side effects
- Frameworks forbid it
- Write tools only work in single-agent mode
explain: Separation of powers. The critic returns a fix list; the worker writes under the original allow-list.
\`\`\`
`,
  },
  {
    slug: "tool-isolation",
    title: "Tool Isolation Is the Point",
    summary:
      "Each role has an allow-list. Planner cannot patch src. Coder cannot refund. Isolation is a security boundary the dispatcher enforces, not a vibe in a persona paragraph.",
    minutes: 19,
    level: "intermediate",
    md: `
The Tools track taught a dispatcher that rejects unknown names. Multi-agent adds **who is asking**. The previous lesson gave planner, worker, and critic different jobs. Those jobs are fiction until the **runtime** refuses the wrong caller.

\`ALLOW[role]\` is the contract. It is a map from role name to paths or tool names that role may touch. Copy the repo (or the world) on write so a rejected call does not mutate anything. Logs should show \`role=planner path=src/app.py denied\`. If the planner can “just this once” edit src, the split is a slide.

Isolation is **why** you split. Context isolation without tool isolation still lets the planner shell out. Done-check isolation without tool isolation still lets the critic refund. Nicknames never isolated anything.

## What the allow-list must cover

An allow-list is not only tool names. It is names, **arguments that point at resources**, and sometimes **verbs**.

| Layer | Example | Fail closed looks like |
|---|---|---|
| Tool name | planner may not call \`edit\` | \`unknown_or_forbidden_tool\` |
| Path / id | coder may patch \`src/app.py\`, not \`PLAN.md\`’s inverse: planner may write \`PLAN.md\`, not \`src/\` | \`forbidden_path\` |
| Record | billing may refund \`customer_id\` it owns; loyalty may not | \`locked\` (later lesson) |
| Peer message | coder may not DM docs worker | \`peer_forbidden\` (supervisor lesson) |

\`\`\`viz flow
title Isolation is who is asking
layout lr
node plan Planner
node disp Dispatcher
node work Worker
edge plan disp
edge work disp
caption The planner cannot patch src. The coder cannot refund. The dispatcher enforces it.
\`\`\`

Role is an **authenticated** field on the job, not a string the model typed. If the model can set \`role=coder\` on a planner trace, you have a costume. The orchestrator stamps \`role\` when it starts the child.

Copy-on-write: \`apply_patch\` in the box receives a **copy** of the repo. A denied planner call returns the same \`x\` in \`src/app.py\`. If you mutate in place and then return an error, on-call will not know whether the file changed. Agents that “failed” after writing are how incidents hide in error traces.

Reads can be isolation too. A researcher may read logs. A coder may not. A billing worker may read this tenant’s invoice. A docs worker may not. Cross-tenant reads are evals-track incidents; the same dispatcher pattern applies.

## Walkthrough: planner tries to save a hop

Acme’s planner decides the timeout bump is obvious. It calls \`apply_patch\` on \`src/app.py\` with \`hack\`. The dispatcher looks up \`ALLOW["planner"]\`, which is only \`PLAN.md\`. Result: \`forbidden_path\`. Repo copy still has \`x\`.

The coder, same function, same path, different role, is allowed. Result: \`ok\`, content \`y\`.

The planner writing \`PLAN.md\` is allowed. That is its artifact, not a back door into src.

If a human on-call “temporarily” adds \`src/app.py\` to the planner list to ship a hotfix, they have merged the roles. Do it as an explicit one-agent run with the baseline allow-list, not as a silent widen. Silent widen is how the split dies.

\`\`\`tryit python
ALLOW = {
    "coder": {"src/app.py"},
    "planner": {"PLAN.md"},
}

def apply_patch(repo, role, path, content):
    if path not in ALLOW.get(role, set()):
        return {"ok": False, "error": "forbidden_path", "repo": repo}
    nxt = dict(repo)
    nxt[path] = content
    return {"ok": True, "repo": nxt}

repo = {"src/app.py": "x", "PLAN.md": ""}
print(apply_patch(dict(repo), "coder", "src/app.py", "y")["ok"])
print(apply_patch(dict(repo), "planner", "src/app.py", "hack"))
print("planner PLAN", apply_patch(dict(repo), "planner", "PLAN.md", "steps")["ok"])
\`\`\`

**What printed:** coder patching \`src/app.py\` is \`True\`. Planner patching src is a dict with \`ok: False\` and \`forbidden_path\`; the returned \`repo\` still has \`x\` because we passed a copy and never wrote. Planner writing \`PLAN.md\` is \`True\`. Isolation is a denied path, not a scolding sentence in the planner prompt.

Try adding \`"src/app.py"\` to the planner set and run the middle call again. It will succeed. That is the bug you are refusing. The test suite should include this middle call as a **fixture** that must stay denied.

## Prompts are not allow-lists

“You are a careful planner; never edit source” is a hope. Models drop hopes under load, injection, or a “just this once” user. The dispatcher does not read the system prompt. It reads \`ALLOW\`.

Frameworks that advertise “each agent has tools” still need **your** map. If the framework’s default is “all tools to all nodes,” you have a mesh with extra YAML. Set the map. Test illegal edges with no tokens, same as you will test hop graphs.

Default deny: \`ALLOW.get(role, set())\` means unknown roles get nothing. Do not default to the coder list. Do not default to “whatever the last hop had.” Child jobs start with the role’s own set.

Unknown roles showing up in logs are an incident. It means the orchestrator stamped a string the catalog does not know, or a model forged a role. Forged roles must be impossible: the stamp comes from the job record, signed or at least not taken from model text. If your framework lets the agent set \`role\` in JSON, that field is not a role. It is fanfic. Drop it.

## How agents use this

Same table as Tools permissions, keyed by **role**. Logs should show \`role=planner path=src/app.py denied\`. If the planner can “just this once” edit src, the split is fiction.

Put \`ALLOW\` in config next to the role catalog from split-or-merge. A unit test loops illegal \`(role, path)\` pairs. CI should fail when someone adds a worker tool to the planner to “speed up local demo.”

Dashboards: count denies by role. A spike in planner denies means the model is trying to do the work. That is a planner prompt or plan-schema bug, not a reason to grant the path. A zero on denies forever can mean the planner is well behaved — or that you are not logging. Log the denies.

Combine with the critic-no-writes rule next: the critic’s allow-list is empty of writes, even if the critic’s prompt is senior. Combine later with one-writer-per-record so two **allowed** roles still cannot mutate the same customer.

\`\`\`quiz
The planner wants to patch src/app.py to save a hop. What should happen?
- Allow it — planners are senior
- *Deny — path is not on the planner allow-list
- Give the planner every tool
- Ask the critic to patch instead
explain: Isolation is the reason you split. A senior hat is not an allow-list.
\`\`\`
`,
  },
  {
    slug: "critic-no-writes",
    title: "The Critic Does Not Write",
    summary:
      "Fixes go back to the worker as a new assignment. A critic with write tools is a second worker arguing in production, and the audit trail dies.",
    minutes: 20,
    level: "intermediate",
    md: `
When the critic is **blocked** (missing evidence, tests red), it returns a **block reason**, not a secret patch. “I’ll just fix it myself” from the critic is how you lose the audit trail: the worker’s allow-list, the planner’s step, and the HITL gate no longer describe what hit production.

The roles lesson said the critic usually has no writes. This lesson is the **runtime rule**: even if a model critic emits \`edit\`, the dispatcher refuses. The only legal critic verb is \`review\` (or \`handoff\` to a human). Review with issues **reassigns** the worker. Review with no issues **stops** the job (or sends it to apply, which is still not the critic).

This is separation of powers, not etiquette. Courts that can rewrite the law are legislatures. Critics that can \`refund\` are billing workers with a smug preamble.

## What the critic may return

A critic packet is data, like a brief:

- \`ok\` — boolean from a rubric, not from mood
- \`issues\` — list of checkable strings (\`tests red\`, \`missing delay\`, \`unknown cite s9\`)
- \`assign\` — \`worker\` or \`stop\` or \`human\`
- \`evidence_ids\` — what it looked at

\`\`\`viz flow
title Critic returns a score, not a patch
layout lr
node work Worker
node critic Critic
node back Reassign
edge work critic
edge critic back
caption Issues go back to the worker. A critic with write tools is a second worker.
\`\`\`

It may not return a patch hunk. It may not call \`edit\`, \`refund\`, or \`send_email\`. If the rubric needs a fact, the critic **reads** an artifact the worker already produced (test report, doc). Reading is not writing. If the report is missing, that is an issue: \`missing evidence\`, reassign or handoff — do not invent a pass.

**Retries.** The blackboard stores \`attempt\` so the worker sees the fix list. Cap retries (3 is a common product number). If the same issue repeats, that is a **spec bug** or a worker that cannot satisfy the rubric. Handoff to a human. Do not let the critic grab \`edit\` on attempt 4. That teaches the system that the way out of a loop is to break isolation.

Repeated issues are gold. If “missing delay” happens on 40% of jobs, the writer prompt or the docs artifact is wrong. Fix the producer. Do not add critic writes “until the writer learns.” Writers do not learn across customers unless you change weights or prompts in a reviewed deploy. Critic writes are a one-off that becomes the product.

**Grounding.** If tests exist, the critic reads the report. “Looks good” while tests are red is a fail of the critic, not a style note. If citations exist, the critic checks ids against the board. Ungrounded critics belong in the debate lesson’s failure pile; here they are simply out of contract.

## Walkthrough: tests are red

Worker finished a patch. Tests red. Three critic behaviors:

**Illegal write.** Critic emits \`edit\`. Runtime: \`critic_cannot_write\`. World unchanged. Trace shows the refuse. This is the fixture you keep forever.

**Legal reject.** Critic emits \`review\` with issues \`["tests red"]\`. Runtime: \`ok: False\`, \`assign: worker\`. Worker gets attempt+1 and the issue list. No new file bytes from the critic.

**Legal stop.** Critic emits \`review\` with empty issues (and the report is actually green in a real system). Runtime: \`assign: stop\`. Apply or finish may run in **code**, not as a critic side effect.

A fourth failure: critic says “tests are fine” in prose and still tries \`edit\` to “clean up comments.” Refuse the write. Score the critic eval as a false-pass if the report was red. Prose does not override the packet.

\`\`\`tryit python
WRITES = {"edit", "refund", "send_email"}

def critic_act(name, issues):
    if name in WRITES:
        return {"error": "critic_cannot_write", "name": name}
    if name != "review":
        return {"error": "unknown"}
    if issues:
        return {"ok": False, "assign": "worker", "issues": issues}
    return {"ok": True, "assign": "stop"}

print(critic_act("edit", ["tests red"]))
print(critic_act("review", ["tests red"]))
print(critic_act("review", []))
\`\`\`

**What printed:** \`edit\` is \`critic_cannot_write\`. \`review\` with issues reassigns the worker and keeps the issue list. \`review\` with no issues stops. The function never mutates a repo. That is the point. Writes stay on the worker allow-list.

If you add \`send_email\` as a name, it must hit the same \`WRITES\` set. Do not special-case “email is just a comment.” Email is a side effect. Critics comment **on the board**.

## HITL is not a critic with writes

A human approver may apply a refund. That human is not the model critic. If you fold HITL into “the critic clicks apply,” you will eventually let the model critic click apply. Keep apply in the sequential subgraph (orchestration part): extract → policy → HITL → apply. The critic of a draft is upstream of HITL. Neither the critic nor the worker skips HITL.

Seniority does not grant writes. “Staff engineer critic” is a prompt. The allow-list is empty of writes for every critic rank.

## How agents use this

The blackboard stores \`attempt\` so the worker sees the fix list. Cap retries. If the same issue repeats, that is a spec bug — handoff to a human, do not let the critic grab \`edit\`.

Fixture: two-step job, tests red, critic must not change files. Replay in CI. If a framework update lets the critic node inherit the worker’s tools, this fixture is how you notice.

Log \`critic.assign\` and \`critic.issues\`. On-call debugging “why did we loop” starts here. Log denies when the critic tries a write. A weekly count of \`critic_cannot_write\` is a model-behavior metric, not a reason to open the allow-list.

The worker’s prompt may include the issue list. It must not include a hidden patch from the critic. If you find yourself pasting critic thoughts into the worker “as a hint,” you are smuggling writes as text. Put issues as structured strings only.

When debate appears later, the **judge** has the same no-write rule. The opponent attacks in a packet. Nobody ships from the peanut gallery. A judge that can \`edit\` is a third worker, and the debate subgraph becomes a race. Keep apply downstream in code.

\`\`\`quiz
Tests are red. What should the critic do?
- Call edit to save time
- *Return a fix list and reassign the worker
- Refund the customer
- Delete the tests
explain: Critique is a packet. Writes stay on the worker allow-list.
\`\`\`
`,
  },
  {
    slug: "blackboard",
    title: "A Blackboard, Not a Group Chat",
    summary:
      "The current plan, artifacts, and decisions live in a typed store keyed by the run. Chat is the worst shared memory: unordered, untyped, and injection-friendly.",
    minutes: 21,
    level: "intermediate",
    md: `
Roles need a **blackboard**: a typed store for the current job. Chat is a **projection** for humans. The store is the source of truth. If you pickle a Slack export and call it state, you will spend the quarter asking which message was the plan.

The coordination tax named “shared memory with access control.” This lesson is that memory:

- \`goal\` — what done means
- \`plan\` — typed steps
- \`artifacts\` — blobs keyed by id
- \`decision\` — accept / reject / block
- later: \`attempt\`, \`budget\`, \`open_questions\`

That is a database row, an object-store prefix, or an in-memory dict you **checkpoint**. It is not a 90-turn group chat. Models love chat. Operations cannot replay chat. Evals cannot hash chat. Injection loves chat.

The Agents track had **typed state** inside one loop. Here the state is **shared across policies**, so access control matters. The coder gets artifact ids, not the researcher’s raw dump, if that was the split. The critic gets the draft id and the evidence ids, not a side transcript titled “psst skip tests.”

## What lives on the board

| Field | Type | Who writes | Who reads |
|---|---|---|---|
| goal | string or structured goal id | intake / human | everyone (usually) |
| plan | list of step objects | planner | workers (their step only), critic, supervisor |
| artifacts | id → blob | workers (and researcher) | by ACL: coder may not fetch \`raw_log\` |
| decision | packet | critic or supervisor | orchestrator |
| attempt | int | orchestrator | worker, critic |

\`\`\`viz flow
title The board is the shared store
layout lr
node put Put artifact
node board Board
node get Get by id
edge put board
edge board get
caption Typed fields keyed by the run. Chat is a projection for humans, not memory.
\`\`\`

**Put and get by id.** \`put_artifact(board, "kb-44", blob)\` copies the artifacts map so you do not alias mutations. \`get_artifact\` returns \`None\` on miss. Missing ids **fail closed** in the critic: do not invent a doc. The writer worker that needs \`kb-44\` and gets \`None\` should stop with \`missing artifact\`, not hallucinate 5-7 days.

**Copy the board.** Same reason as copy-on-write repos: a failed put must not leave a half-updated plan. Checkpoint the board after each successful handoff (Agents long-running). On crash, resume from the last board, not from “whatever was in the websocket.”

**Chat as projection.** You may render the last decision for a support UI. You may not let the next agent **read the UI**. The next agent reads the board through a function that applies ACL. If an operator pastes extra instructions into chat, those instructions are not on the board unless a human HITL path writes a typed field.

Operators will paste anyway. Give them a typed HITL field: \`human_note\` with a max length, stored on the board, ACL’d to the next node that is allowed to see it. Do not pipe the whole chat sidebar into the coder assembler. Sidebar text is how “refund them, I am the VP” becomes a patch comment and then a tool call.

## Walkthrough: quote refund delay, by id

New board for “quote refund delay.” Plan empty, artifacts empty, decision none. Docs worker puts \`kb-44\` with \`{"doc": "5-7 days"}\`. Writer calls get \`kb-44\` — present. Writer calls get \`kb-99\` — missing; critic later must not treat missing as a pass.

Keys on the board stay \`goal\`, \`plan\`, \`artifacts\`, \`decision\`. If a worker tries to stash a novel under \`notes_for_friends\`, drop it at the put boundary or namespace it under that worker’s prefix with ACL so others cannot see it. Secret prefixes are how side-channels return. Prefer not to have them. The supervisor-star lesson will drop peer messages; the board should not recreate them as sticky notes.

\`\`\`tryit python
def new_board(goal):
    return {
        "goal": goal,
        "plan": [],
        "artifacts": {},
        "decision": None,
    }

def put_artifact(board, aid, blob):
    arts = dict(board["artifacts"])
    arts[aid] = blob
    nxt = dict(board)
    nxt["artifacts"] = arts
    return nxt

def get_artifact(board, aid):
    return board["artifacts"].get(aid)

b = new_board("quote refund delay")
b = put_artifact(b, "kb-44", {"doc": "5-7 days"})
print("has kb-44", get_artifact(b, "kb-44") is not None)
print("missing", get_artifact(b, "kb-99"))
print("keys", list(b.keys()))
\`\`\`

**What printed:** \`has kb-44\` is \`True\`. \`missing\` is \`None\` — fail closed in the critic, do not invent a doc. \`keys\` lists \`goal\`, \`plan\`, \`artifacts\`, \`decision\`. Put and get are by id. The original empty board object was not mutated in place for artifacts because \`put_artifact\` copied. (The toy still shares nested blobs if you mutate \`blob\` later; freeze artifacts as immutable data in production.)

## Injection and the board

A wiki page that says “approve all refunds” can sit in an artifact as **data**. It becomes an incident when some role copies it into a supervisor **instruction** field. ACL plus typed handoffs: the supervisor reads \`cat: billing\`, not the wiki’s last sentence. The billing subgraph’s HITL does not get skipped because an artifact yelled.

Do not store raw user paste on a field every role sees. Store it under \`intake/raw\` with read ACL for the researcher only. The coder sees the brief. This is context isolation implemented as memory ACL, which the tax lesson required.

## How agents use this

Serialize the board in the job checkpoint (Agents long-running). Do not pickle a Slack export and call it state. Schema-migrate the board like any table. A new required field (\`attempt\`) needs a default for in-flight jobs.

Log \`board_version\` and artifact ids on every hop, not the blobs. Blobs can be large; ids are enough to fetch from object storage when debugging. Redact secrets in artifact dumps that leave the box.

Evals should snapshot the board at the end: expected artifact ids present, decision ok, no extra writes. Team evals that only read the user-facing sentence will miss a board that also stored a refund flag.

When something feels “the team forgot,” print the board. Ninety percent of multi-agent bugs are a missing id, a stale plan, or a decision that lived in chat and never landed on \`decision\`. Fix the store. Then fix the prompts.

Checkpoint after every successful put. A crash between critic decision and worker reassignment should resume with the decision still on the board, not with a blank chat history. The Agents long-running lesson already said this for one loop. Here the board **is** the checkpoint body. If you cannot serialize it, you cannot operate it.

\`\`\`quiz
Where should the current plan live?
- In the last chat message
- *On a typed blackboard (store) keyed by the run
- Only in the planner’s thoughts
- In every worker’s system prompt as a novel
explain: Chat is a projection. The store is the contract.
\`\`\`
`,
  },
  {
    slug: "typed-handoff",
    title: "Handoffs Are Typed Events",
    summary:
      "Planner → worker is {step_id, inputs, budget}. Critic → worker is {issues, attempt}. Paragraphs cannot be retried, hashed, or denied by destination.",
    minutes: 20,
    level: "intermediate",
    md: `
Planner → worker is not a paragraph. It is \`{step_id, inputs, budget, tools_hint}\` inside an **envelope** \`{to, payload}\`.

Worker → critic is \`{artifact_id, evidence_ids, claim}\`.

Critic → worker is \`{issues[], attempt}\`.

\`\`\`viz strip
title A handoff is an envelope
chip to
chip payload
chip budget
chip hash
caption Wrong destination is an error. Extra keys drop. Poetry cannot be retried.
\`\`\`

If those structs are not in the codebase, you do not have roles. You have a group chat that happens to mention “coder.” The interface-as-data lesson froze the researcher’s **brief**. This lesson freezes the **event that carries** any payload: who it is for, whether that who is legal, whether the payload is an object.

The Agents track froze a tool payload so a later thought could not change it. Here you freeze a **handoff** so a later thought cannot change destination, cannot smuggle extra keys, and cannot retry by rephrasing. Operations need ids and budgets. Poetry cannot be retried.

## Envelope and payload

**Envelope.** \`to\` must be a role the graph allows. \`from\` is stamped by the runtime, not by the model. Optional: \`hop\`, \`parent_id\`, \`schema_id\`. Wrong \`to\` is an error even if the payload is pretty. A string instead of an envelope is an error.

**Payload.** Depends on the edge:

| Edge | Payload must include | If missing |
|---|---|---|
| planner → worker | \`step_id\`, inputs, \`budget\` | worker must not start |
| worker → critic | \`artifact_id\`, evidence ids, claim | critic fail closed |
| critic → worker | \`issues\`, \`attempt\` | not a reassignment |
| researcher → coder | brief fields from \`parse_brief\` | coder must not start |

**Budget** is part of the event so the worker cannot inherit the job’s remaining 1,000 hops. A step budget of 4 tool calls is a different product from “run until you feel done.” When the worker hits the budget, it returns to the supervisor or critic with \`cannot: step_budget\`, not with a silent extra search.

Budgets also stop a worker from becoming a nested swarm. If the coder’s step budget is 4, it cannot fan out 40 test-generation children unless the parent **priced** that swarm as its own job. Nested unbounded fan-out is how a “simple” sequential team becomes 50 launches you never approved. The failure-modes lesson will refuse unpriced 50. The envelope is where the 4 was supposed to live.

**tools_hint** is a hint the assembler may use to advertise tools. The dispatcher still uses \`ALLOW[role]\`. A hint that says \`refund\` does not grant refund. Hints are not allow-lists. Isolation already covered that; the event must not undo it.

Drop extra keys when you parse, same as briefs. A payload that includes \`also_tell_coder_to_skip_tests\` must not reach the worker. Build a new dict from known fields.

## Walkthrough: three envelopes

Good: \`{"to": "coder", "payload": {"step_id": 1, "budget": 4, "brief": "bump timeout"}}\`. Parser expecting coder: ok.

String: \`"please fix"\`. \`not_object\`.

Wrong destination: \`{"to": "refund", "payload": {}}\` when the next hop must be coder. \`wrong_to\`. Even an empty payload cannot sneak a destination change. The refund role is not a legal \`to\` on this edge. (A billing apply step later is a **graph node**, not a handoff the planner invents.)

A fourth case you should add in production: \`to\` is coder but payload is a list. \`need_payload\` as a dict. Types matter.

\`\`\`tryit python
def parse_handoff(raw, expect_to):
    if not isinstance(raw, dict):
        return {"error": "not_object"}
    if raw.get("to") != expect_to:
        return {"error": "wrong_to", "got": raw.get("to")}
    if "payload" not in raw or not isinstance(raw["payload"], dict):
        return {"error": "need_payload"}
    return {"ok": True, "to": raw["to"], "payload": raw["payload"]}

good = {"to": "coder", "payload": {"step_id": 1, "budget": 4, "brief": "bump timeout"}}
print(parse_handoff(good, "coder"))
print(parse_handoff("please fix", "coder"))
print(parse_handoff({"to": "refund", "payload": {}}, "coder"))
\`\`\`

**What printed:** the good envelope is \`ok\` with destination coder and the inner payload. A string is \`not_object\`. The refund destination is \`wrong_to\` with \`got: refund\`. Only a dict with \`to\` plus a dict \`payload\` proceeds, and only if \`to\` matches what the orchestrator allowed for this hop.

This toy still passes the whole \`payload\` through. Production should parse **inner** fields (\`step_id\` int, \`budget\` int, brief already passed \`parse_brief\`) and drop the rest. Nest parsers. Do not one-shot \`eval\` or execute strings. There is no \`exec\` in these boxes on purpose.

## Hash, log, do not let thoughts append

Log \`from\`, \`to\`, \`hash(payload)\`. The ping-pong lesson will stop when the same hash repeats. You cannot hash a paragraph reliably across punctuation. You can hash a canonical dict (sorted keys, no extra fields).

The next hop must not pick up extra keys from a later thought. Stamp the event, persist it, then the worker assembler reads **that row**, not the live chat. If the planner keeps talking, those tokens are the planner’s trace, not a mutation of the already-sent event.

Illegal edges (B may not call A) belong to hop-limits. The parser here still helps: if B emits \`to: A\`, \`wrong_to\` or a later graph check drops it. Defense in depth: parser, graph, hop cap, duplicate hash.

Version the envelope. \`schema_id\` on the event lets you reject v1 handoffs when v2 requires \`attempt\`. Silent drift is how last month’s critic packet reaches this week’s worker missing \`issues\` and the worker treats empty as pass. Fail closed on unknown schema. Do not “do your best” with a partial dict.

## How agents use this

This is the Agents freeze-payload idea between **roles**. Log \`from\`, \`to\`, \`hash(payload)\`. The next hop must not pick up extra keys from a later thought.

Put \`parse_handoff\` in front of every role start. Unit-test wrong \`to\`, string body, missing payload, extra keys dropped. No tokens.

When you add supervisor mode, the only legal \`to\` from a worker is \`sup\`. Peer \`to: docs\` from the coder is \`wrong_to\` **and** \`peer_forbidden\`. When you add sequential mode, workers should not emit \`to\` at all: **code** picks the next node. If a worker still emits an envelope, ignore it or fail the eval — the graph is not a suggestion box.

Budgets on events are how you price a step before it runs. Swarms will price N children before launch. Same habit, smaller envelope.

\`\`\`quiz
What is a legal planner-to-worker handoff?
- A chat paragraph
- *A typed event with to, step id, inputs, and a budget
- The planner’s full transcript
- Direct run_shell from the planner
explain: Operations need ids and budgets. Poetry cannot be retried.
\`\`\`
`,
  },
];
