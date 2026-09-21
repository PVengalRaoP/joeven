import type { RawLesson } from "@/lib/types";

export const multiWhy: RawLesson[] = [
  {
    slug: "why-multiagent",
    title: "Why Multi-Agent?",
    summary:
      "Split roles when tools, prompts, and success checks actually diverge — not because a slide showed four chatbots. Two LLM calls are a bill, not a society.",
    minutes: 21,
    level: "beginner",
    md: `
A **multi-agent system** is several **policies** that share one job, each with its own **trace**, its own **allow-list**, and its own definition of **done**. A policy is the rule that maps “what I see” to “what I may do next.” A trace is the log of that policy’s steps. An allow-list is the set of tools and paths that policy may touch. Done is a check you can run in code, not a vibe that the paragraph looks helpful.

That is not several marketing names around one prompt. It is not four system-prompt nicknames that all call the same \`search\` and the same \`finish\`. Two language-model calls do not make a society. They make a **bill**: tokens, hops, queues, and a new way to loop.

The Agents track already split **router, specialist, and verifier** as three **functions in one runtime**. One loop. One memory. One allow-list that the assembler could still advertise as a whole. This track starts when those specialists must **talk** as separate runtimes: different traces you can eval apart, different tools that must not sit in the same process, different stop checks that will not agree if you squash them into one “be helpful.”

Do not re-learn the single-agent loop here. You already have observe, act, stop. Multi-agent is **when that one loop is the wrong machine** — because the first agent’s context, tools, or incentives get in the way of the second job.

## Honest reasons to split

Pay for a second agent only when **isolation or parallelism** buys something you can name.

**Tool isolation.** A coder with \`run_shell\` should not also hold \`refund_customer\`. If both names live on one allow-list, a confused thought can refund a customer while “fixing a timeout.” Separate policies mean separate dispatchers. The Tools track already rejected unknown names. Here the question is **who is asking**.

**Context isolation.** A 40-page research dump will drown a patch-writing model. Attention is a budget. The researcher’s job is to return a **brief**: a short, checkable object the coder can use. The coder sees the brief plus the repo — not the entire web, not the researcher’s chain of thought, not every dead-end query. If you paste the dump into the coder’s prompt, you did not split. You bought two invoices for one drowning.

**Different success checks.** The researcher is done when citations exist and the brief parses. The coder is done when tests pass. One agent “being helpful” will stop at the first pretty paragraph. That is not laziness. It is one stop predicate covering two jobs that do not share a predicate. If you cannot write two different checks, you do not have two roles.

**Parallelism.** Independent sub-questions can run as concurrent jobs: score 200 tickets, extract fields from 80 PDFs. That is a **swarm** later in this track, not a roundtable now. Parallelism is an honest reason only when the sub-tasks do not share a mutable file or a customer record. If they share writes, you have a race with extra names.

| Reason | What diverges | Cheap test that you need it |
|---|---|---|
| Tool isolation | Allow-lists | A forbidden tool on role A would be legal on B |
| Context isolation | What each policy may see | Role B fails or bloats when it sees role A’s raw dump |
| Done-check isolation | Stop predicates | Role A “done” is not role B “done” |
| Parallelism | Independent items | Map has no shared writes; reduce is a table |

If none of those rows is true, keep one agent.

\`\`\`viz flow
title Split only when jobs diverge
layout lr
node research Research
node brief Brief
node coder Coder
edge research brief
edge brief coder
caption The coder sees a short brief, not the log mountain. Same tools means merge.
\`\`\`

## Dishonest reasons

These look like architecture. They are delay, fashion, or hope:

- The vendor slide had a “team of agents”
- You want to delay specifying the workflow (who speaks, what they return, when the job ends)
- You hope a critic **persona** will replace unit tests
- You like watching them talk
- You think more names mean more intelligence
- You copied a demo where four chatbots discussed a poem

Personas without **different tools or different stop conditions** are a more expensive single agent. Merge them. A nickname in a system prompt is not a security boundary and not a success check.

A critic that only says “looks good” is a random boolean you are paying tokens for. Tests, schemas, and citation ids are cheaper and repeatable. Debate, later in this track, is for high-stakes questions with a **grounded** judge — not for replacing \`pytest\`.

## Walkthrough: job 17 timed out

Acme’s on-call ticket: “Job 17 failed talking to the vendor. Open a PR.” Two designs.

**Single agent.** One policy reads logs, edits the repo, finishes. That is legal **if** log tools and edit tools are safe together **and** the log dump fits the coder’s context **and** “done” is one check (tests green). Many tickets should stay here. The Agents track already taught that loop.

**Split.** A researcher may \`read_logs\` and \`summarize\`. It cannot \`edit\`. It returns a brief: timeout talking to vendor; recommend a timeout bump; citation \`log-17\`. A coder may \`edit\` and \`run_tests\`. It cannot read the raw log mountain. It sees the brief plus the repo. The researcher is done when the brief parses with a citation. The coder is done when tests pass.

The split earns its keep only if the raw logs would drown the coder, or if \`read_logs\` and \`edit\` must not share an allow-list. If the log is three lines and both tools are safe together, the split is a tax. Pay it only when the table above has a true row.

\`\`\`tryit python
def single_agent(goal):
    log = "job 17 timeout talking to vendor"
    patch = "increase timeout from 5s to 30s"
    return {"trace": ["read_logs", "edit", "finish"], "log": log, "patch": patch}

def multi_agent(goal):
    researcher = {"role": "research", "tools": ["read_logs", "summarize"]}
    coder = {"role": "code", "tools": ["edit", "run_tests"]}
    brief = "timeout talking to vendor; recommend timeout bump"
    patch = "increase timeout from 5s to 30s"
    return {
        "agents": [researcher["role"], coder["role"]],
        "brief": brief,
        "patch": patch,
        "coder_saw_raw_logs": False,
    }

print("SINGLE", single_agent("fix job 17"))
print("MULTI", multi_agent("fix job 17"))
print("split value: smaller tools + smaller context")
\`\`\`

**What printed:** \`SINGLE\` is one trace that both read the log string and produced a patch. \`MULTI\` names two roles, returns a short \`brief\`, still produces the same patch, and sets \`coder_saw_raw_logs\` to \`False\`. The coder never sees raw logs. That is the whole point of an honest split: smaller tools and smaller context, not a second hat.

Change the brief string and run again. The patch function in this toy does not read the brief. In a real split, the coder’s only log-shaped input **is** that brief. If you sneak the raw log into the coder prompt “for luck,” delete the researcher. You are back to one agent with two invoices.

## What a split is not

A split is not “the model will collaborate.” Models do not form teams. **Your runtime** forms teams: parsers, allow-lists, orchestration, a store for the brief. If those are missing, you have a group chat. Group chats have no done-check.

A split is not automatic parallelism. Two agents in a conversation are usually **serial**: researcher then coder. Parallelism is a swarm of independent items, later. Do not spawn four personas to discuss one ticket unless you have a judge, a hop cap, and a reason a single sample fails.

A split is not a way to skip specifying the workflow. If you cannot name who speaks next, you are not ready. That tax is the next lesson.

## How agents use this

Keep a **single-agent baseline** on the same golden tickets: one loop, the tools that are safe together, the same success checks. If two agents do not beat it on quality, cost, latency, or incidents, delete one. Multi-agent is an **optimization**, not an identity. Teams that skip the baseline cannot tell whether the designer or the bill improved.

In a design review, refuse a slide that only shows four avatars. Demand the four rows: tools, context, done-check, parallelism. If the only difference is the system-prompt nickname, merge. If a dangerous tool must not sit next to another, split and put the allow-list in code, not in a paragraph that says “the coder is responsible.”

Log \`role\` on every tool call from day one. Incident response needs “who asked,” not “the team thought.” Eval the researcher’s briefs and the coder’s tests **apart**. A pretty brief that the coder cannot use is a researcher fail even if the final PR looks fine.

Budget hops and child jobs **before** you add a third name. The coordination tax, typed interfaces, and orchestration patterns in this track exist because extra agents are extra operations. Name the operations or do not split.

\`\`\`quiz
When is adding a second agent justified?
- Always, because teams are more intelligent
- *When tools, context, or success checks actually diverge
- When you need more tokens on the marketing site
- When the first prompt is already perfect
explain: Extra agents are extra coordination. Pay that tax only when isolation or parallelism buys something real.
\`\`\`
`,
  },
  {
    slug: "split-or-merge",
    title: "Split or Merge",
    summary:
      "If two roles share the same tools and the same done-check, they are one agent with two hats. Merge them. Draw the boundary as data.",
    minutes: 19,
    level: "beginner",
    md: `
Draw the boundary as **data**: this role **receives X** and **may call Y** and is **done when Z**. If X, Y, and Z are the same for two names, they are one agent. Extra names are a costume. Costumes invoice like people.

A **contract** here is not a legal PDF. It is a small object you can compare: input shape, tool set, stop predicate. The previous lesson said *when* a split can be honest. This lesson is the **review move**: put two proposed personas on the table and ask whether their contracts differ. If you cannot show a difference, you are proposing a soap opera.

Merge is the default. Split is the exception you can justify with a row in the contract table. Teams that skip this review accumulate intern, intern-2, manager, director, and a critic who all call \`search\` and all stop when the paragraph “feels done.” That is one policy with five system prompts and five traces to debug.

## The contract table

Write three columns before you write personas.

| Field | Question | Merge if… |
|---|---|---|
| Receives | What object does this role see? | Same payload shape |
| May call | Which tool names and paths? | Same allow-list |
| Done when | Which check must pass? | Same predicate |

\`\`\`viz flow
title Three columns before personas
layout lr
node recv Receives
node call May call
node done Done when
edge recv call
edge call done
caption If X, Y, and Z match, you have one agent with two hats. Merge them.
\`\`\`

**Receives.** A researcher that must see raw HTML is not the same as a writer that must see a 200-word brief. If both see the full ticket plus the full wiki, they share context. Shared context plus shared tools is one agent.

**May call.** Tools are the teeth. \`search\` plus \`finish\` is a different job from \`edit\` plus \`run_tests\`. \`refund\` is a different job from both. If both names can call the same writes, you did not isolate anything. You duplicated a dispatcher.

**Done when.** “Helpful” is not a check. \`has_cite\`, \`tests_green\`, \`refund_posted_and_hitl_ok\` are checks. If both roles stop on “looks good,” they share a stop. A shared stop plus a shared allow-list is one policy.

You split when **one** of these is true:

- Dangerous tools must not sit next to each other (coder vs billing)
- The context the first role needs would drown the second (logs vs patch)
- Done means different checks (citations vs tests vs a paid refund)

You merge when:

- Both can call the same writes
- Both stop on the same “looks good” vibe
- The only difference is the system-prompt nickname
- You added a “manager” so someone would pick the next speaker (that is orchestration, later — not a third hat with the same tools)

## Walkthrough: intern, manager, coder, research

Four names walk into a design review.

**Intern.** Tools: \`search\`, \`finish\`. Done: \`helpful\`. Sees the user ticket.

**Manager.** Tools: \`search\`, \`finish\`. Done: \`helpful\`. Sees the user ticket. System prompt says “you are senior.”

**Coder.** Tools: \`edit\`, \`run_tests\`. Done: \`tests_green\`. Sees a typed brief plus the repo.

**Research.** Tools: \`search\` only. Done: \`has_cite\`. Sees the web or the log dump. Returns a brief, does not finish the user-facing job.

Intern versus manager: same tools, same done, same inputs. Merge. The senior sentence does not change the dispatcher. If you needed someone to assign work, that is a **supervisor** with a different contract (assigns, does not search), not a manager who also searches.

Coder versus research: different tools, different done. Split can earn its keep. Coder versus intern: different tools and different done. Split.

If someone proposes “director” who also searches and also stops when helpful, you already know the answer. Merge into the intern/manager blob, then rename the blob to one agent.

\`\`\`tryit python
def same_contract(a, b):
    tools_same = set(a["tools"]) == set(b["tools"])
    done_same = a["done"] == b["done"]
    return tools_same and done_same

intern = {"name": "intern", "tools": ["search", "finish"], "done": "helpful"}
manager = {"name": "manager", "tools": ["search", "finish"], "done": "helpful"}
coder = {"name": "coder", "tools": ["edit", "run_tests"], "done": "tests_green"}
research = {"name": "research", "tools": ["search"], "done": "has_cite"}

print("intern vs manager", same_contract(intern, manager), "-> merge")
print("coder vs research", same_contract(coder, research), "-> split")
print("coder vs intern", same_contract(coder, intern), "-> split")
\`\`\`

**What printed:** intern versus manager is \`True\` then \`merge\`. Coder versus research is \`False\` then \`split\`. Coder versus intern is \`False\` then \`split\`. The function only compares tool sets and done strings. That is enough for this review. If you later add “receives,” compare that field too: two roles with different tools but the same drowning context may still be a bad split.

Flip manager’s \`done\` to \`plan_valid\` and give it no \`search\` — only \`assign\`. Then intern and manager would no longer match. That is a real supervisor, not a hat. Do not invent that change in a prompt. Change the object.

## Nicknames, committees, and fake critics

A nickname is a string in a system prompt. It does not change Y or Z. If your framework makes it easy to add agents by pasting a persona paragraph, you will add them. The contract table is the brake.

A committee of three “experts” who all search and all vote in chat is still one allow-list. Voting is not a done-check unless you **reduce** votes with a rule (majority label, then a verifier). That pattern belongs to swarms and debate, with caps. It is not “add Expert 2.”

A fake critic shares the worker’s write tools or shares the worker’s “looks good” stop. Then you have two workers. The next part of this track gives the critic **no writes** and a rubric. Until those differ, merge the critic into the worker and keep the tests.

## What goes wrong if you skip the merge

You will debug tone. Why did Manager sound annoyed. Why did Intern ignore Manager. The traces will be four novels. Cost will rise with no quality win. A forbidden tool will be “someone’s” because every name can call it. On-call will not know which policy to freeze.

You will also delay the real design: the typed brief, the hop list, the blackboard. Personas feel like progress. Contracts are progress.

## How agents use this

In a design review, show the **tool list** and the **done-check** on one slide. If you cannot show a difference, you are proposing a soap opera. Refuse to merge this review with “we will figure out orchestration later.” Orchestration is who speaks. It is not a reason to duplicate an allow-list.

Put \`same_contract\` in the repo next to the role catalog. A unit test can add a new persona and fail if it collides. That is cheaper than a postmortem titled “we had two refund agents.”

When product asks for a “team,” translate: which contract row is new? If the answer is “a grown-up voice,” merge and hire an editor for the system prompt of the one agent. If the answer is “billing must not clone the repo,” split and write the allow-list.

Deleting a persona is a valid ship. The baseline lesson will ask you to prove the remaining team still wins. Merge first when the contracts match; then measure.

\`\`\`quiz
Two personas can both search and both stop when the paragraph “feels done.” What should you do?
- Add a third persona named Director
- *Merge them — they are one agent
- Give both refund tools
- Run them in a swarm
explain: Same tools and same stop means one policy. Extra names are cost.
\`\`\`
`,
  },
  {
    slug: "coordination-tax",
    title: "The Coordination Tax",
    summary:
      "Every extra agent needs a message schema, an orchestration policy, shared memory with access control, team evals, and a story for loops. If you cannot name those, you are not ready to multiply agents.",
    minutes: 20,
    level: "beginner",
    md: `
Every extra agent is not “more intelligence.” It is a **tax**: work you must design, test, and operate because two policies now share a job. If you skip the tax, you still pay it — as incidents, as ping-pong, as a bill you cannot explain.

A single agent already needed a parser, a dispatcher, a stop, and a trace. You paid that in the Agents track. A second agent does not reuse those for free. You need a **message** the second policy can parse, a rule for **whose turn** it is, a **store** both can read with **access control**, **evals** that score the job not only the member, and a **cap** so A asking B asking A cannot melt the card.

If you cannot name those five, you are not ready to multiply agents. You are ready to write a better single-agent prompt, or a sequential workflow with no extra policy.

## The five line items

| You must name | If you skip it | Typical symptom |
|---|---|---|
| Message schema | Free-form Slack fanfic between models | The next hop treats a rant as instructions |
| Orchestration policy | Who speaks is a vibe | Loops, silence, two speakers at once |
| Shared memory with access control | Injection and leaked tools | A wiki line becomes a supervisor order; a coder sees refund tools |
| Evals for the **team** | Each member looks fine; the job fails | Pretty briefs, red tests, thumbs-up on a double refund |
| A story for loops | A asks B asks A until the card melts | Hop count in the thousands; duplicate payloads |

\`\`\`viz strip
title The coordination tax
chip Schema
chip Who-next
chip Memory
chip Team eval
chip Loop cap
caption Name all five before you multiply agents. A nickname is not a tax paid.
\`\`\`

**Message schema.** The interface-as-data lesson will freeze this as a dict: \`brief\`, \`citations\`, \`step_id\`, \`budget\`. Here you only need the rule: **chat is not a schema**. If the only wire is a paragraph, you will debug tone for a quarter.

**Orchestration policy.** Sequential pipeline, peer handoff with hop limits, or a supervisor star. Pick one and log it. “They will figure it out” is how you get a mesh. This track’s orchestration part exists because this tax line item is a product, not a prompt sentence.

**Shared memory with access control.** A blackboard keyed by the run, not a 90-turn group chat. Role A may write artifacts. Role B may read ids, not raw dumps, if that is the split. If every role can read and write everything, you undid tool isolation with a side channel.

**Team evals.** Member-level scores lie. A researcher can pass “has citations” while the coder never gets a usable brief. A critic can pass “left a comment” while the worker ignored it. The job score is: ticket resolved, tests green, no double refund, cost under cap. The evals track will go deep. You still owe the **name** of that score before you split.

**Loop cap.** Max hops, illegal edges, duplicate payload hashes, swarm price-before-launch. A story for loops means you can point to the function that returns \`cannot: ping-pong\` or \`priced_swarm launched False\`. Hope is not a story.

## Walkthrough: thin spec versus full spec

A team proposes researcher plus coder for job 17. The thin spec has a schema “we will use JSON” and nothing else. Who speaks after the brief? Unclear. Can the coder read the researcher’s scratchpad? Unclear. How do you know the pair beats one agent? Unclear. What if they bounce the brief? Unclear.

The full spec answers all five. Schema: \`parse_brief\` fail-closed. Who next: sequential researcher then coder then tests, code-owned. Memory: brief id on the blackboard; coder cannot fetch raw logs. Team eval: tests green and brief has a citation id and cost under 2× baseline. Loop cap: one handoff, no peer reverse edge.

The thin spec is a slide. The full spec is a product. \`ready_to_split\` in the box below is that review encoded as five keys.

\`\`\`tryit python
def ready_to_split(spec):
    need = ["schema", "who_next", "memory_acl", "team_eval", "loop_cap"]
    missing = [k for k in need if not spec.get(k)]
    return {"ok": not missing, "missing": missing}

thin = {"schema": True, "who_next": False}
full = {
    "schema": True,
    "who_next": True,
    "memory_acl": True,
    "team_eval": True,
    "loop_cap": True,
}
print(ready_to_split(thin))
print(ready_to_split(full))
\`\`\`

**What printed:** the thin spec is \`ok: False\` with \`missing\` listing \`who_next\`, \`memory_acl\`, \`team_eval\`, and \`loop_cap\`. A schema without “who speaks next” is still not a team. The full spec is \`ok: True\` with an empty missing list. The checklist is the design review. Add a sixth key in your company if you have a real extra (HITL on money, tenant ACL). Do not remove one of the five because it is hard.

False on a key means “we have not named it,” not “the framework will provide it.” Frameworks give you graphs. They do not give you a team eval or an allow-list for memory.

## Budget the tax in dollars

A second agent is rarely “one extra API call.” It is a new queue or child job, a new allow-list to audit, a new parser to fail-closed, a new dashboard slice (\`role=\`), a new golden that induces ping-pong, and on-call who must know which policy to freeze. Price that as engineering weeks plus token spend, then compare to the single-agent baseline.

If the quality win is a few points of pass rate and the tax is a new service, you may still split for **safety** (refund tools off the coder). Safety is a real win. Fashion is not. Write the win in the spec: “billing never clones the repo,” not “we have a team.”

Debate and swarms multiply the tax. Debate is three policies (proposer, opponent, judge) plus evidence plumbing. A swarm is N children plus reduce plus a write barrier. Do not start there. Start with two contracts that differ, sequential code, and this checklist all true.

## What goes wrong if you skip a line

Skip schema: injection travels sideways; the coder treats a wiki rant as a patch order.

Skip who-next: two speakers, or zero; hops explode; nobody calls finish.

Skip memory ACL: the planner “just this once” reads customer PII the researcher fetched; or the critic edits \`src\` through a shared scratch file.

Skip team eval: each demo looks smart; production double-refunds.

Skip loop cap: the failure-modes lesson’s ping-pong, now with a real card.

## How agents use this

Budget the tax in dollars **before** you budget personas. A second agent that needs a new queue, a new allow-list, and a new eval is a **product**, not a prompt tweak. Put \`ready_to_split\` in the RFC template. If \`ok\` is false, the RFC is a single-agent change or a workflow with no extra policy.

Name owners for each line item the way you name an owner for billing. Schema without an owner becomes chat again. Loop cap without an owner becomes a ticket titled “cost exploded.”

When a vendor shows a mesh of agents, translate it onto this table. If they cannot show hop caps and team evals, you are buying the skip column. Stay on one agent until the five keys are true in **your** repo, not in their GIF.

The rest of this track is how to pay each line item without theatre: typed interfaces, roles with teeth, orchestration you can log, debate and swarms with barriers, and the ways teams fail when you do not.

\`\`\`quiz
What is the coordination tax?
- Extra GPUs
- *Schema, who-speaks, memory access, team evals, and a loop cap — paid for every extra agent
- A longer system prompt
- More thumbs-up in chat
explain: Multiply agents and you multiply operations. Name the ops or do not split.
\`\`\`
`,
  },
  {
    slug: "interface-as-data",
    title: "The Interface Is Data",
    summary:
      "Researcher returns {brief, citations}. If the interface is “whatever they said in chat,” you will debug tone for a quarter and leak instructions sideways.",
    minutes: 21,
    level: "beginner",
    md: `
When you split, freeze the **interface**. An interface is the object one policy is allowed to send to the next: field names, types, required keys, what is forbidden. A researcher does not “tell” the coder a story. It returns a dict:

- \`brief\` — short, checkable prose
- \`citations\` — ids the coder may quote
- \`open_questions\` — a list, or empty

\`\`\`viz flow
title The wire is a parsed object
layout lr
node research Researcher
node packet Packet
node coder Coder
edge research packet
edge packet coder
caption Brief, citations, open questions. Chat is not a schema. Extra keys drop.
\`\`\`

If the interface is chat, the next hop will treat a wiki rant as **instructions**. That is how **injection travels sideways**. The evals track will measure injection on purpose. Here you need the mechanical fact: untyped text from another agent is still untyped text. A prompt that says “the previous agent is trusted” is how a poisoned search snippet becomes a patch.

The Agents track froze **payloads** inside one loop so a later thought could not change a tool call. This lesson is the same idea **between roles**. The coder must not see the researcher’s chain of thought. Thoughts are not a contract. Dicts that parse are a contract.

## Why chat fails as a wire

Chat is unordered, untyped, and friendly to extra sentences. Models pad. They apologize. They add “by the way, you should also.” The next policy is another model. It will obey the extra sentence more readily than your hope that it would only read the brief.

| Chat as interface | Typed object as interface |
|---|---|
| “please fix it, also refund them, love the intern” | \`{"brief": "timeout to vendor", "citations": ["log-17"]}\` |
| Tone becomes a ticket | Parser rejects missing keys |
| Injection rides along | Extra keys ignored; unknown cites fail |
| Cannot retry a paragraph | Can retry the same dict; hash it |

**Fail closed.** Empty brief, missing citations, citations that are not strings, a raw string instead of an object — all errors. The coder never starts. A human or a retry with a budget sees \`error\`. Fail open (“eh, use the paragraph”) is how job 17 becomes a refund.

**Do not pass thoughts.** Chain of thought is useful inside one policy’s assembler, if you even keep it. Across a handoff it is a side channel: it contains discarded plans, tool names the coder should not see, and copied wiki text. Store thoughts in the researcher’s trace. Hand the coder the parsed object only.

**Ids, not dumps.** Citations are ids into the blackboard (\`log-17\`, \`kb-44\`). The coder may fetch those artifacts if the ACL allows, or may only quote the id. The coder must not receive “the entire log file inlined because the researcher was helpful.” Helpful dumps undo context isolation.

## Walkthrough: three researcher outputs

Job 17 again. Three wires.

**String.** \`"please fix it"\`. Parser: \`not_object\`. No coder.

**Empty brief.** \`{"brief": "  ", "citations": ["log-17"]}\`. Parser: \`empty_brief\`. A citation without a claim is not a brief.

**Empty cites.** \`{"brief": "timeout", "citations": []}\`. Parser: \`need_citations\`. This researcher is the “helpful paragraph” failure from the split lesson: done-check was supposed to be \`has_cite\`.

**Good.** \`{"brief": "timeout to vendor", "citations": ["log-17"]}\`. Parser: \`ok\`. Coder may run.

A fourth failure shows up in incidents: a dict that includes \`brief\` plus \`instructions_for_coder\` copied from a web page that said “ignore tests.” If your parser only checks two keys and then passes **the whole dict** through, you failed. Pass a **new** object with only the allowed keys. Drop the rest. That is freeze-payload between agents.

\`\`\`tryit python
def parse_brief(raw):
    if not isinstance(raw, dict):
        return {"error": "not_object"}
    brief = raw.get("brief")
    cites = raw.get("citations")
    if not isinstance(brief, str) or not brief.strip():
        return {"error": "empty_brief"}
    if not isinstance(cites, list) or not cites:
        return {"error": "need_citations"}
    if not all(isinstance(c, str) for c in cites):
        return {"error": "bad_cite"}
    return {"ok": True, "brief": brief.strip(), "citations": list(cites)}

print(parse_brief("please fix it"))
print(parse_brief({"brief": "timeout to vendor", "citations": ["log-17"]}))
print(parse_brief({"brief": "  ", "citations": ["log-17"]}))
print(parse_brief({"brief": "timeout", "citations": []}))
\`\`\`

**What printed:** the string is \`not_object\`. The good dict is \`ok: True\` with a stripped brief and a list of cite ids. The whitespace brief is \`empty_brief\`. The empty list is \`need_citations\`. Chat is rejected. A short brief with an id passes. Empty brief fails closed.

This parser does not yet drop extra keys from a malicious dict. In production, build the return object from known fields only, as the last line already does for the happy path. Never \`return raw\`.

## Open questions and budgets

\`open_questions\` is part of the interface so the researcher can **stop without inventing**. An empty list means “I claim this is enough.” A non-empty list means the supervisor or a human must decide: fetch more, or hand the coder a partial. Do not let the coder treat open questions as extra instructions.

Budgets belong on the **handoff event** (next part): \`step_id\`, \`budget\` hops or dollars for the receiver. The brief is the payload. The event is the envelope. If you only have a brief with no budget, the coder can loop forever inside its own allow-list. Caps are not rude. Caps are the loop story from the tax lesson.

Version the schema. \`schema_id\` on the object lets you reject v1 briefs when v2 requires a severity field. Silent schema drift is how last quarter’s researcher breaks this week’s coder.

## How agents use this

Put this parser **in front of** the coder. The coder never sees the researcher’s chain of thought. Same idea as the Agents parser: text is not a decision until it types. Log \`from=research to=coder hash(payload)\`. If the hash repeats, that is ping-pong later, not a new thought.

Unit-test the parser with the four cases in the box plus one extra-key case. No tokens. If a teammate adds \`instructions\` as a pass-through field, the test should fail.

When you add a third role (critic), give it its own object: \`{issues, attempt, evidence_ids}\`, not a chatty “looks bad.” The blackboard stores artifacts by id so the critic can require \`kb-44\` without eating a novel.

If the interface is still Slack, you do not have multi-agent. You have a standup. Freeze the dict, fail closed, drop unknown keys, and only then write personas.

\`\`\`quiz
What should a researcher hand a coder?
- The full web dump plus thoughts
- *A typed brief with citation ids
- A poem about the bug
- Direct access to run_shell
explain: Interfaces are data. Chat is how tone becomes a production incident.
\`\`\`
`,
  },
  {
    slug: "single-agent-baseline",
    title: "Keep a Single-Agent Baseline",
    summary:
      "The split has to beat one loop on evals. If it does not, delete a persona. Multi-agent is not an identity. Score quality, cost, latency, and incidents.",
    minutes: 20,
    level: "beginner",
    md: `
Before you ship a team, freeze a **baseline**: one agent, the same tools that are **safe together**, the same golden tickets. A baseline is not “the intern we used in January.” It is a runnable policy you can still run in CI next to the team. If you cannot run it, you cannot beat it. You can only tell stories.

Score both the baseline and the team on the same fixtures:

- **Task success** — the job check: tests green, citation present, refund not double-paid
- **Cost** — tokens, steps, child jobs, dollars
- **Latency** — wall time to done or to legal stop
- **Incidents** — double refund, ping-pong, forbidden tool, leaked context

\`\`\`viz bars
title Beat the single-agent baseline
bar One loop,0.82,0
bar Team,0.80,1
bar Team cost,1.6,2
caption If quality is the same and cost doubles, keep the one loop unless safety won.
\`\`\`

If the team wins on vibes and loses on the numbers, keep the baseline. Multi-agent is an **optimization**. Optimizations that lose on the scoreboard are regressions. Deleting a persona is a valid ship.

This lesson is the last brake in the “why” part. You now know honest splits, merge rules, the coordination tax, and typed interfaces. None of those entitle you to keep a team that is worse.

## What “beat” means

A team **beats** the baseline when it wins on a named axis without a silent loss on another that you care about.

| Team result vs baseline | Verdict | Note |
|---|---|---|
| Better quality | Win | Even if a bit slower, if latency still under SLO |
| Same quality, cheaper or equal cost | Win | Isolation might still be the real win — record it |
| Same quality, more than 2× cost | Loss unless a **named** safety or incident win |
| Worse quality | Loss | Pretty traces do not count |
| Same quality, more incidents | Loss | Cost and pass rate can hide a double refund |

The 2× cost line in the toy below is a **policy**, not physics. Your company might allow 3× for a hard isolation win (refund tools off the coder). Write the policy down. “We like teams” is not a policy.

Safety can be the win: the team never lets the planner patch \`src\`, and the baseline cannot separate those tools without becoming two agents anyway. Then say “incident class planner-writes-src is now zero” and keep the team even if dollars ticked up. Do not hide a 5× bill inside that sentence if incidents did not change.

Latency can be the win for a swarm of cheap scorers versus one fat sequential pass. Latency can also be the loss: two serial LLM calls for a ticket one call used to close. Measure.

## Walkthrough: find why job 17 failed and open a PR

A **single** agent can search logs and edit files if both tools are safe together and the context fits. That is the baseline. Put it on the golden: same job 17 fixture, same tests.

Split when log search returns megabytes you must compress, or when opening a PR needs a different approval path than reading logs. Then the team must beat the baseline on the scoreboard, not on a whiteboard drawing of four boxes.

Three runs:

**Baseline.** Pass. $0.04. No incidents.

**Fancy team.** Pass. $0.20. Same quality. Five times the money. No new safety property. Loss.

**Good team.** Pass. $0.03. Cheaper. Win.

A fourth run you will see in reviews: team fails, baseline passes, but the team “found a nicer architecture.” Ship the baseline. Fix the team offline until it wins, or merge.

\`\`\`tryit python
def score(run):
    return {
        "ok": run["pass"],
        "cost": run["usd"],
        "better": None,
    }

def beats(team, base):
    if not team["pass"] and base["pass"]:
        return False, "worse quality"
    if team["usd"] > 2 * base["usd"] and team["pass"] == base["pass"]:
        return False, "more than 2x cost, same quality"
    if team["pass"] and not base["pass"]:
        return True, "quality"
    if team["pass"] and team["usd"] <= base["usd"]:
        return True, "cheaper or equal"
    return False, "no win"

base = {"pass": True, "usd": 0.04}
fancy = {"pass": True, "usd": 0.20}
good = {"pass": True, "usd": 0.03}
print(beats(fancy, base))
print(beats(good, base))
print(score(base))
\`\`\`

**What printed:** fancy versus base is \`False\` and \`more than 2x cost, same quality\`. Good versus base is \`True\` and \`cheaper or equal\`. \`score(base)\` reports the baseline is \`ok\` at \`0.04\`. Same-quality at 5× cost is a loss. Cheaper and still green is a win.

The toy does not yet encode incidents or latency. Add them as extra fields in your real \`beats\`: if \`team["incidents"] > base["incidents"]\`, return false. If you only compare dollars, a team that double-refunds cheaper will “win.”

## Keep the baseline alive

Baselines rot. Someone deletes the one-agent config because “we are a multi-agent shop now.” Then you cannot answer “did the team get worse?” except by arguing. Pin the baseline next to the team in CI. When the team loses for a week, the build should hurt.

Personas accrete. A director appears after an incident. An intern-2 appears after a demo. Check **monthly**: run \`same_contract\`, run \`beats\`, delete a name. A merge that restores the baseline cost with the same pass rate is a ship, not a demotion.

Do not A/B vibe on live customers as your only comparison. Use goldens first (evals track). Online incidents still matter: if the team’s ping-pong rate is new, that is a loss even when goldens are green — your goldens missed a bounce. Add the bounce as a fixture. Do not add a fourth persona to “manage” it.

## How agents use this

Check this monthly. Personas accrete. Deleting one is a valid ship. Publish a tiny table: baseline pass, team pass, cost ratio, incident count, hop count. If product wants the team for marketing, they can have a diagram. Production runs the winner.

When you later add debate or a swarm, the baseline is still the **one-agent** policy, not last week’s four-agent mesh. Each extra pattern must beat the cheapest machine that already works. The last lesson of this track will say the same in a ladder: workflow, one agent, sequential roles, supervisor, swarm, debate.

Wire \`beats\` to the job record: estimated cost before launch, actual cost after, pass boolean, incident tags. The failure-modes lesson will refuse a swarm of 50 when the price exceeds the cap. That is this lesson’s cost line with a hard stop instead of a review comment.

If the team matches the single agent on quality and costs 5×, keep the baseline unless you can prove a different win you are willing to pay for: isolation that removes a class of incidents, latency that hits an SLO, a legal approval path you cannot fold into one allow-list. Write that win. Then keep measuring, because wins decay when prompts drift.

\`\`\`quiz
The team matches the single agent on quality and costs 5×. What should you do?
- Add more personas
- *Keep the baseline (or prove a different win: safety, latency, incidents)
- Hide the cost in another budget
- Debate every FAQ
explain: Multi-agent is an optimization. No win on the scoreboard means merge.
\`\`\`
`,
  },
];
