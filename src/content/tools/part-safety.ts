import type { RawLesson } from "@/lib/types";

export const toolsSafety: RawLesson[] = [
  {
    slug: "permissions",
    title: "Permissions and Least Privilege",
    summary:
      "Allowlists, argument bounds, and tight credentials: the model proposes, the policy disposes.",
    minutes: 22,
    level: "advanced",
    md: `
The model is **not** a security boundary. It is a confused intern with network access if you give it that. **Permissions** live in your runtime:

- **Allowlists** of tools per session / per user / per task
- **Argument constraints** (this agent may \`read_file\` under \`/workspace\` only)
- **Human approval** for irreversible or costly actions
- **Least privilege** credentials behind each tool (a read-only DB role, not admin)
- **Session caps** (one refund, N searches, a wall clock)

If you hand an agent the same cloud key a senior SRE uses, you have automated that SRE’s worst day. Schema and dispatch keep the call well-formed. Permissions decide whether a well-formed call **runs**. The loop is a client of that decision. It may beg in the prompt. The policy should not listen.

Write the policy table **before** the system prompt. The prompt can mention the same names. The names that run are the names in the table.

\`\`\`viz bars
title Allowlist this session
bar search,1,0
bar refund,1,1
bar shell,0,2
caption Start empty. Add tools when the task needs them. Shell stays at zero.
\`\`\`

## Allowlists are per task, not per company

A research agent needs \`search\` and \`fetch_url\`. It does not need \`wire_money\`. A billing agent needs \`refund\` with a max amount. It does not need random blogs.

Start empty. Add tools when an eval proves the task needs them.

Default-deny: a new tool is off until a policy row says otherwise. Default-allow is how \`run_shell\` ships on Friday because someone copied a demo config. MCP hosts have the same rule: filter the server catalog. Local registries have the same rule: a second dict of enabled names, not “whatever is imported.”

Per-user and per-tenant overlays sit on top. Ada may refund. Guest may not. Tenant A’s session must not enable Tenant B’s Slack server. The process allowlist is not the user allowlist. Confused deputy is the next-next lesson. Here, already: **two layers** — tool on the catalog, tool on this session.

## Argument bounds

A tool on the allowlist can still be abused by arguments. Caps: max refund amount, path prefixes, host allowlists, max rows. Those checks run in the same policy function, before the handler. They are not descriptions. They are branches that return \`denied\`.

Credentials behind the tool should not be able to exceed the bound even if the check is buggy. A Stripe key limited to 50 dollars is defense in depth. A read-only DB role cannot DELETE. Least privilege is layers: session allowlist, argument bound, tight key, human on irreversible.

## Caps and versions

Session caps stop loops: max writes, max cost, max wall time. Hit the cap, return \`denied\` with a reason, stop the loop. Do not reset the cap because the model said “new user message.” Caps are per job unless you have a real product reason.

Policy has a version. Log it. When an incident happens, you need to know which allowlist ran. Changing the table without a version is how you cannot replay.

## Classroom policy

Search and refund are allowed. run_shell is not. Max one refund. The second refund dies on the cap. Shell never reaches a binary. The audit is the session dict. That is least privilege as data.

\`\`\`tryit python
import json

TOOLS = {
    "search": lambda q: {"hits": ["12 C in Oslo"]},
    "refund": lambda invoice_id: {"ok": True, "invoice_id": invoice_id},
    "run_shell": lambda cmd: {"oh_no": cmd},
}

POLICY = {"allowed": {"search", "refund"}, "max_refunds": 1}
session = {"refunds": 0}

def execute(name, args):
    if name not in POLICY["allowed"]:
        return {"error": "denied", "reason": "tool not on allowlist", "name": name}
    if name == "refund":
        if session["refunds"] >= POLICY["max_refunds"]:
            return {"error": "denied", "reason": "session refund cap"}
        session["refunds"] += 1
    return {"ok": True, "result": TOOLS[name](**args)}

print("search", execute("search", {"q": "Oslo weather"}))
print("refund", execute("refund", {"invoice_id": "INV-17"}))
print("cap", execute("refund", {"invoice_id": "INV-18"}))
print("shell", execute("run_shell", {"cmd": "rm -rf /"}))
print("audit", json.dumps(session))
\`\`\`

**What printed:** search ok, first refund ok, second refund denied on cap, shell denied on allowlist, audit shows one refund. The dangerous command never ran. The policy did not parse the command. It never got that far.

## What goes wrong

Policy in the system prompt only. One global allowlist for every agent in the company. Admin keys “for now.” Caps that reset per model turn. New tools default-on. Logging without policy version. Letting the session grow the allowlist from model output. All of these treat the intern as the firewall.

## How to test permissions

For every tool not in the session set, assert denied and handler not called. For caps, assert the N+1 write is denied and the world changed N times. For argument bounds, assert amount over max is denied. Keep a golden enabled-set per product surface in git.

## Policy is a table with a version, not a vibe

Write the enabled set per product surface before you write the system prompt. Research: search and fetch. Billing: get_invoice and a capped refund. Empty by default. Add a name when an eval proves the task needs it. Default-on is how a demo \`run_shell\` ships. MCP hosts use the same table on top of \`tools/list\`. Local registries use a second dict of enabled names, not “whatever was imported.”

Argument bounds sit in the same function. Max cents, path prefixes, host allowlists, max rows. They run before the handler. Descriptions do not enforce them. Dual gate: assembler advertises allowed names, dispatcher checks again. A leftover prompt cache is not permission.

Credentials behind each tool must be weaker than the intern’s imagination. Read-only DB. Refund key with a hard provider cap. GitHub bot that cannot delete the org. If the policy check is buggy, the world still refuses. Session caps stop loops; they are not IAM. Policy version goes in every log line. Changing the table without a version is how you cannot replay Tuesday.

Never let the session grow the allowlist from model output. Shrink, yes. Grow, no. \`denied\` is not a retry. The loop stops or asks a human. It does not write a longer thought and fire \`run_shell\` again.

## How agents use this

The assembler advertises only allowed names. The dispatcher checks again. Dual gate. When a tool is denied, the observation is \`denied\` with a reason the model should not argue with. The loop stops or asks a human. It does not retry denied with a longer thought.

Credentials live in the tool service, scoped. The model never sees them. The prompt never lists them. Least privilege is enforced in runtime policy: allowlists, argument bounds, and tight credentials behind tools.

> **Warning:** Prompts are extra. Policy and credentials are the boundary.

\`\`\`quiz
Where should least privilege be enforced?
- Only in the system prompt, as a polite request
- *In runtime policy: allowlists, argument bounds, and tight credentials behind tools
- In the marketing site
- By using more adjectives
explain: Models are not boundaries. Policy and credentials are. Prompts are extra.
\`\`\`
`,
  },
  {
    slug: "human-approval",
    title: "Human Approval",
    summary:
      "Irreversible calls enqueue for a human. Timeout is a deny. Silence is not consent.",
    minutes: 20,
    level: "advanced",
    md: `
Do not block the Python process on \`input()\` in production. Enqueue a ticket: status \`needs_approval\`, plus the action, args, and risk.

A human UI accepts or denies. The next model turn sees \`denied\` or \`approved\`. **Timeouts are denials.** Silence is not consent. The loop is a client of that queue. It may wait. It may stop. It must not treat “no click yet” as yes.

Risk labels help humans: \`read\`, \`write\`, \`irreversible\`, \`exfil\`. Color them in the UI. Do not make “Approve all” the default. Auto-approve only boring reads. Money, mail, and deletes wait.

Approval is part of the tool runtime, not a Slack DM you hope someone sees. Store the pending action, the policy version, the idempotency key, and the human who clicked. If nobody clicks, deny and hand off. Do not auto-approve because the queue is long. A long queue is a staffing problem. It is not a signature.

\`\`\`viz flow
title Irreversible waits
layout lr
node write Write
node queue Queue
node human Human
node run Run or deny
edge write queue
edge queue human
edge human run
caption Timeout is a deny. Silence is not consent.
\`\`\`

## What waits

Irreversible writes: refunds, wires, public posts, deletes without trash, production deploys, computer-use Pay clicks. High-exfil reads: bulk export, other-tenant lookups. You can auto-approve \`get_ticket\` for the user’s own id and still queue \`list_all_invoices\`.

Argument bounds still run **before** the human sees the ticket. Do not ask a human to approve a refund of -1 or a path with \`..\`. Invalid should never reach the queue. Denied by allowlist should never reach the queue. Humans are for legal-but-dangerous, not for garbage.

Show the human the **packed** args, redacted, plus a diff of what will change if you have it. Do not show a 2 MB log. Do not show the model’s thought as if it were evidence. Show the tool name, the risk, the tenant, the amount.

## Timeout, deny, approve

Three outcomes:

- **approve** — dispatcher runs the function once, with the stored args and key. It does not re-parse a new model message.
- **deny** — observation \`denied: human\`. Loop stops or explains. World unchanged.
- **timeout** — same as deny. Function never runs. Log \`approval_timeout\`.

Never re-quote the amount after approve. The queued object is the object. If the model emits a new refund while one is pending, it is a second ticket or a collision on the key, not a quiet mutation of the first.

Idempotency still applies after approve. A double click on Approve returns the same receipt.

## Classroom enqueue

Search is read and auto-runs. Refund is irreversible and returns needs_approval without a human flag. With \`human=approve\` it runs. With \`timeout\` it is denied and never refunds INV-18. The function is the policy. The prompt is not consulted.

\`\`\`tryit python
POLICY = {"allowed": {"search", "refund"}, "auto_approve_risk": {"read"}}
TOOLS = {
    "search": {"risk": "read", "fn": lambda q: {"hits": [q]}},
    "refund": {
        "risk": "irreversible",
        "fn": lambda invoice_id: {"ok": True, "invoice_id": invoice_id},
    },
}

def execute(name, args, human=None):
    if name not in POLICY["allowed"]:
        return {"error": "denied", "name": name}
    risk = TOOLS[name]["risk"]
    if risk not in POLICY["auto_approve_risk"]:
        if human == "approve":
            pass
        elif human == "timeout":
            return {"error": "denied", "reason": "approval_timeout"}
        else:
            return {"status": "needs_approval", "name": name, "args": args, "risk": risk}
    return {"ok": True, "result": TOOLS[name]["fn"](**args)}

print("search", execute("search", {"q": "Oslo"}))
print("pending", execute("refund", {"invoice_id": "INV-17"}))
print("go", execute("refund", {"invoice_id": "INV-17"}, human="approve"))
print("silence", execute("refund", {"invoice_id": "INV-18"}, human="timeout"))
\`\`\`

**What printed:** search runs at once. Refund without a human is needs_approval. Approve runs INV-17. Timeout on INV-18 is denied. The function never ran for silence. That is fail closed.

## What goes wrong

\`input()\` in a worker. Auto-approve on timeout. Approve-all in the UI. Showing the model’s paragraph instead of the args. Letting the model “approve itself” with a tool named \`confirm\`. Mutating queued args after display. Dropping the key. These turn a human into theater.

## How to test approval

Assert read tools never enqueue. Assert irreversible without human is needs_approval and handler flag false. Assert timeout does not set the flag. Assert approve sets it once. Assert a second approve is idempotent if you added a key. Snapshot the UI payload: name, risk, redacted args, policy version.

## The queued object is the object that runs

When a write is irreversible, the runtime stores name, args, risk, policy version, tenant, actor, and idempotency key, then returns \`needs_approval\`. The human UI shows a packed, redacted view of **that** object. It does not show the model’s paragraph as evidence. It does not show a 2 MB log. Amounts, paths, and destinations must match what will execute. After approve, dispatch runs the stored args once. It does not re-parse a new assistant message. If the model emits another refund while one is pending, that is a second ticket or a key collision, not a quiet edit of the first.

Timeouts are denials. Queue length is not a signature. Auto-approve-all is how you un-invent the feature. Double-click approve must be idempotent: same receipt. Deny and timeout never call the handler. Invalid args and allowlist misses never reach the queue — humans are for legal-but-dangerous, not for garbage.

The loop pauses. It does not spin and emit sibling writes. A “still waiting” path, if you have one, cannot advertise refund. Store who clicked. If nobody clicks, deny and hand off. Approval is product UI plus runtime, not a Slack DM and hope. The pending row should expire into deny on a clock you named in the policy, and that clock should be visible to the human (“expires in 15 minutes”). If the job dies while pending, reload must still show the same stored args — not a reconstructed guess from chat. On-call should be able to list every open approval by tenant without opening a model trace. That list is part of the tool runtime, same as the dispatcher log.

## How agents use this

The approval UI is part of the product. The loop should pause on needs_approval, not spin. When the human returns, the next observation is approved or denied. Do not call the model while waiting unless you have a separate “still waiting” path that cannot emit another write.

Store who clicked. If nobody clicks, deny and hand off. Do not auto-approve because the queue is long.

> **Warning:** Silence is not consent. Timeouts fail closed.

\`\`\`quiz
What should happen if a human never answers an approval?
- Run the refund anyway
- *Treat timeout as deny; do not execute
- Ask the model to approve itself
- Retry 100 times
explain: Silence is not consent. Timeouts fail closed.
\`\`\`
`,
  },
  {
    slug: "path-and-host-allowlists",
    title: "Path and Host Allowlists",
    summary:
      "read_file needs a folder jail. http_get needs a host allowlist. Check before you fetch, not after.",
    minutes: 21,
    level: "advanced",
    md: `
Even a tool on the allowlist can be abused by **arguments**.

- \`read_file(path)\` must stay under a workspace root. Reject \`../.env\` and absolute paths you did not plan.
- \`http_get(url)\` must check the **host** before any request. Fetching first and filtering later still sent the packet (and maybe your cloud metadata).

Never let the model pass a raw SQL string. If you need SQL, expose \`get_order(order_id)\` instead. Extra keys already blocked the SQL field. Path and host checks block the remaining smuggle: a legal field whose **value** is the attack.

These checks belong in the tool implementation and in a shared policy helper. Prompts that say “stay in /workspace” are not gates. The worker is the gate. Check **before** IO.

\`\`\`viz flow
title Check, then IO
layout lr
node args Args
node jail Jail check
node io Open or fetch
edge args jail
edge jail io
caption Filter before you touch the world. Fetch then filter still sent the packet.
\`\`\`

## Paths

Canonicalize, then prefix-check. Naive \`startswith(ROOT)\` loses to \`/workspace/../.env\` unless you also reject \`..\` and extra slashes, or you resolve to an absolute real path **inside** a jail and compare. Classroom code rejects any \`..\` segment and requires the root prefix. Production should resolve and then compare to the real workspace root, on a machine where that resolve cannot follow a symlink out of the jail if policy forbids it.

Absolute paths the model invented (\`/etc/passwd\`) fail the prefix. Relative paths should be joined to the root in the handler, not passed through from the model as “maybe relative, maybe not.” Pick one: always relative to workspace, always absolute under workspace. Document it in the schema description. Still enforce in code.

\`read_file\` is a read. \`write_file\` is a write with a tighter jail and usually approval. Do not share the path helper’s defaults accidentally with a delete tool.

## Hosts

Parse the URL, extract host, compare to an allowlist. Block link-local and localhost unless the tool is explicitly a loopback debug probe. Cloud metadata IPs (169.254.169.254 and cousins) are a classic exfil. Redirects: if you follow them, re-check the host **after** each hop, or do not follow. Fetching then filtering still talked to the attacker on the first hop.

DNS rebinding and weird encodings exist. Use a real URL parser, not a split on slashes, in production. The classroom parser is naive on purpose so you can see the **when**: before PAGES lookup, before any socket. The order is the lesson. The parser quality is your platform team’s job.

HTTPS does not make a host safe. evil.example can be HTTPS. Allowlist names, not schemes alone.

## Check, then IO

The observation should be \`path_denied\` or \`blocked_host\` without a body from the forbidden place. If you include the file contents “for the error,” you lost. If you include the metadata document “to debug,” you lost.

The same helper should run in MCP file servers and in local tools. Hosts do not get a pass because the URL came from a resource.

## Classroom jail

Root is \`/workspace/\`. Allow host is example.com. Good file, escape, passwd, good http, evil host, metadata IP. Only the two “ok” lines succeed. The metadata call never “fetches.” There is no network here; the allowlist still runs first.

\`\`\`tryit python
import json

ROOT = "/workspace/"
PAGES = {"https://example.com/a": "hello"}
ALLOW_HOSTS = {"example.com"}

def safe_path(path):
    if not path.startswith(ROOT):
        return None
    if ".." in path.split("/"):
        return None
    return path

def read_file(path):
    ok = safe_path(path)
    if ok is None:
        return {"error": "path_denied", "path": path}
    return {"ok": True, "path": ok}

def host(url):
    parts = url.split("/")
    if len(parts) < 3:
        return ""
    return parts[2]

def http_get(url):
    h = host(url)
    if h not in ALLOW_HOSTS:
        return {"error": "blocked_host", "host": h}
    if url not in PAGES:
        return {"error": "not_found"}
    return {"body": PAGES[url]}

print("ok file", read_file("/workspace/README.md"))
print("escape", read_file("/workspace/../.env"))
print("abs", read_file("/etc/passwd"))
print("ok http", http_get("https://example.com/a"))
print("evil", http_get("https://evil.example/x"))
print("meta", json.dumps(http_get("https://169.254.169.254/latest")))
\`\`\`

**What printed:** README ok, \`..\` denied, passwd denied, example.com hello, evil blocked, metadata blocked. The \`..\` path never opens. Evil hosts never fetch. Check **before** IO.

## What goes wrong

Filter after fetch. \`startswith\` without canonicalization. Allowing \`*\`. Following redirects off-list. Passing SQL. Logging denied paths that include secrets from query strings. Using the prompt as the only jail. These send packets or open files you did not intend.

## How to test allowlists

A table of paths to ok/denied including \`..\`, encoded dots if you handle them, absolute escapes, the exact root. A table of URLs including metadata IPs, localhost, evil hosts, the allowed host, a redirect target if you implement hops. Assert no handler IO on deny — flags again.

## Canonicalize, then compare, then touch the world

Path jails fail when you prefix-check a string the model still controls. Resolve to a real path inside the workspace, then confirm it still sits under the real root. Reject \`..\` segments, odd encodings, and symlink walks if policy forbids leaving the jail. Pick one public shape in the schema — always relative to workspace, or always absolute under it — and join in the handler. Do not accept both. \`write_file\` and delete tools need the same helper with tighter risk labels, not a copy that forgot the check.

Hosts fail when you fetch first. Parse, allowlist, then connect. Re-check after every redirect hop, or do not follow redirects. HTTPS does not make evil.example safe. Block link-local, localhost, and cloud metadata unless the tool is an explicit loopback probe. Production parsers are real URL libraries. Classroom split-on-slash is to show **when**. DNS rebinding is why you do not pin an IP once and forget the name.

SQL never belongs as an argument. \`get_order(order_id)\` writes the query. Denied paths and hosts must not include the forbidden body “for debugging.” The observation is \`path_denied\` or \`blocked_host\`. MCP file servers use the same helpers. Prompts that say “stay in workspace” are not a jail. Tests should include the ugly strings: encoded dots, extra slashes, a host that looks like example.com.evil.example, and a metadata IP on HTTP. If those are not in CI, they will be in an incident. The helper that returns None must be the only path to open() or to the HTTP client.

## How agents use this

Put the same allowlists in the worker, even if the prompt already lists them. Prompts are not gates. For cloud metadata IPs, block link-local and localhost unless the tool is explicitly a loopback debug probe. The loop should see \`path_denied\` and stop guessing paths, not retry \`../..\`.

Schema can still say “path relative to workspace.” The worker still checks. Dual gate.

> **Warning:** Filter then fetch. Fetch then filter still talks to the attacker.

\`\`\`quiz
When should you check that a URL host is allowed?
- After you download the page
- *Before any network call
- Only if the model looks nervous
- In the CSS
explain: Filter then fetch. Fetch then filter still talks to the attacker.
\`\`\`
`,
  },
  {
    slug: "confused-deputy",
    title: "Identity and the Confused Deputy",
    summary:
      "The bot’s credential is not the user’s authority. Check what Ada may do, not only what the process key can do.",
    minutes: 20,
    level: "advanced",
    md: `
Identity is easy to get wrong. The agent acts as a **bot**, but the user is **Ada**.

A **confused deputy** happens when Ada cannot refund $10,000, yet the bot’s credential can. Injection (or a confused model) then spends Ada’s neighbor’s money. The tool ran. The allowlist said refund is on. The process key was strong. The **user** was not allowed. You automated a deputy that could not say no to the wrong principal.

Check **the user’s** authority, not only whether the tool is on the process allowlist. Session caps (one refund per run) are extra, not a substitute for IAM. Caps stop loops. IAM stops Ada from becoming Bob.

\`\`\`viz flow
title Check Ada, then the bot key
layout tb
node ada User limit
node bot Bot credential
node world World
edge ada bot
edge bot world
caption A strong process key plus a weak user is a confused deputy.
\`\`\`

The GitHub token for \`open_pr\` should be a bot that can only push to feature branches, not delete the org. The SQL tool should hit a replica with a view, not \`DELETE\`. Defense in depth: even if injection forces a call, the **world** refuses. Least privilege credentials are the last fence, not the first. The first fence is Ada’s limit.

## Pass the actor into every write

The dispatcher should receive \`actor\` from the session, not from the model. If the model can pass \`user_id: bob\` on a refund, you built cross-tenant write. \`get_my_invoice\` takes no victim id. \`refund\` uses the session’s customer, or an invoice that is already bound to that customer in **your** lookup.

Log actor, not only tool name. Audit without actor is how you cannot tell whose money moved. Policy version plus actor plus invoice is the replay key.

Reads exfil too. \`get_other_user\` is the confused deputy for data. Same rule: authorize on the session user, not on the process being in the “support” namespace.

## Bot key versus user limit

The classroom bot key can pay ten million cents. Ada’s limit is 5000. Guest’s is 0. Ada’s small refund passes. Ada’s huge refund dies on user_limit even though the bot key would have allowed it. Guest dies on 1 cent. The tool checks Ada. The print includes \`bot_key_would_allow\` so you can **see** the deputy problem. Production should not echo that field to the model. It is a teaching leak.

\`\`\`tryit python
USERS = {
    "ada": {"refund_limit_cents": 5000},
    "guest": {"refund_limit_cents": 0},
}
BOT_KEY_CAN_REFUND = 10000000

def refund(actor, amount_cents):
    user = USERS.get(actor)
    if user is None:
        return {"error": "unknown_user"}
    if amount_cents > user["refund_limit_cents"]:
        return {
            "error": "denied",
            "reason": "user_limit",
            "limit": user["refund_limit_cents"],
            "bot_key_would_allow": amount_cents <= BOT_KEY_CAN_REFUND,
        }
    return {"ok": True, "amount_cents": amount_cents, "actor": actor}

print("ada small", refund("ada", 4000))
print("ada huge", refund("ada", 9000))
print("guest", refund("guest", 1))
print("unknown", refund("nobody", 1))
\`\`\`

**What printed:** Ada 4000 ok. Ada 9000 denied with bot_key_would_allow true — that true is the deputy. Guest denied. Unknown user denied. The process could pay. The user could not. The function followed the user.

## What goes wrong

Authorizing only on “the agent process is in the billing namespace.” Taking \`actor\` from args the model filled. Shared bot tokens across tenants. Logging tool name without actor. Using session caps as IAM. Trusting MCP server identity as user identity. These are how neighbor refunds happen.

## How to test identity

Call refund as Ada under limit, Ada over limit, guest, missing actor. Assert the handler’s Stripe fake is not called on deny. Assert actor cannot come from args — if your signature still has user_id, assert it must equal the session or deny. Cross-tenant: Ada cannot read Bob’s invoice.

## Session identity, not model-supplied victims

\`actor\` comes from the authenticated session, not from a field the model filled. If \`refund\` accepts \`user_id: bob\` from arguments, you built a cross-tenant write. Prefer \`get_my_invoice\` and a refund that looks up invoices already bound to Ada. Admin products that truly need “as user” require a second approval and a tighter bot key, not a default agent flag.

Reads exfiltrate too. \`get_other_user\` is the deputy for data. Authorize on the session. Log actor plus tool plus object id plus policy version. Audit without actor is a ghost story. Session caps still matter — they stop loops — but a cap of one refund does not stop Ada from refunding Bob if Bob’s id is in the args.

Bot credentials remain the last fence: Stripe key that cannot exceed Ada’s product limit, GitHub bot that cannot delete the org, SQL replica that cannot DELETE. If injection forces a call, the world still refuses. Two fences. User first, then the key. MCP servers do not get to replace the user with “the GitHub app can.” A job that was created for Ada must still be Ada after a model restart, a worker retry, and an MCP round trip. If any of those hops drop the actor and fall back to the process identity, you have rebuilt the deputy. Put the actor on the job row at enqueue time and make dispatch refuse to run a write without it.

## How agents use this

Pass the end-user id into every write from the **session**. Authorize on that id. Never authorize only on the process key. Log actor. The loop must not have a tool argument “as_user” unless you are a real admin product with a second approval. Default agents are deputies. Make them timid deputies.

Do not send \`bot_key_would_allow\` to the model in production. It trains the intern to argue with IAM. Pass the actor in from the gateway when the job is created, store it on the job row, and refuse to take a replacement from any tool argument. Cross-tenant tests are not optional: Ada’s session plus Bob’s invoice id must deny before the handler, and the fake Stripe counter must stay zero. If that test is hard to write, the signature is already a deputy.

Tight bot credentials remain. If injection forces a call, the world still refuses admin deletes. Two fences. User first.

> **Warning:** A powerful bot key plus a weak user is a confused deputy. Check the user first.

\`\`\`quiz
Whose permission should a refund check?
- Only the cloud key on the server
- *The end user’s authority, then the tight bot credential as a second fence
- The system prompt
- Whoever spoke last in the chat
explain: A powerful bot key plus a weak user is a confused deputy. Check the user first.
\`\`\`
`,
  },
  {
    slug: "tool-fixtures",
    title: "Tool Fixtures and When Tools Fail",
    summary:
      "Every tool needs a valid call, a missing field, and an extra key in CI. When the catalog is wrong, stop prompting and fix the functions.",
    minutes: 21,
    level: "advanced",
    md: `
You do not need an LLM to test tools. You need **fixtures**:

1. A valid argument object → \`ok\`
2. Missing required field → \`missing\`
3. Extra key → \`unknown field\`
4. A write called twice → same receipt
5. A name not on the allowlist → \`denied\`
6. Path or host escape → denied before IO
7. Actor over limit → \`user_limit\`
8. Huge result → truncated true

\`\`\`viz bars
title Three fixtures, zero LLM
bar Valid,1,0
bar Missing,1,1
bar Extra key,1,2
caption Run them in CI. The model is not the schema test.
\`\`\`

Re-run this set in CI when someone “just adds a parameter.” Schema drift is how agents break on Tuesday. The loop is a client. If the catalog is wrong, the loop cannot save you with a better thought. Stop prompting. Fix the functions.

Tools are functions. Unit-test them. Models are for choosing when to call them. Grade agents on **whether they called a legal tool**, not on whether the prose sounded sure. If prompting cannot save a god tool, delete the god tool.

## Keep fixtures next to the schema

Same directory, same review, same deploy. When the schema gains a field, the valid fixture gains it and a new missing-field case exists. When a tool is disabled, its fixtures still run against deny. Golden lists of enabled names per surface belong here too.

Do not harvest fixtures only from production traffic. Production is late and messy. You still want a live shadow log of real arg shapes — to **add** cases, not to be the only suite.

## When this track is not enough

If the model picks the wrong tool, first check **descriptions and names**. If it picks the right tool with extra keys, check the **validator**. If it never stops calling tools, you need stop rules (prompting track) and caps (this track). If it refunds the neighbor, you have a confused-deputy bug, not a temperature bug.

The next tracks are **RAG** (search as a tool with citations) and **agents** (loops, memory, when not to agent). Tools stay the hands. Those tracks stay the brain and the library. Do not drag loop design into the dispatcher. Do not drag retrieval ranking into JSON Schema. Stay in lane: schema, dispatch, idempotency, sandboxes, MCP, permissions the runtime enforces.

## Classroom fixture runner

Three rows: Paris ok, empty object missing city, extra drop unknown. \`failures\` must print 0. Change the validator to ignore extra keys and watch FAIL. That FAIL is the CI you wanted before shipping.

\`\`\`tryit python
REQUIRED = ["city"]
PROPS = {"city": str}

def validate(args):
    if not isinstance(args, dict):
        return "not_object"
    for key in REQUIRED:
        if key not in args:
            return "missing " + key
    for key in args:
        if key not in PROPS:
            return "unknown field " + key
    if not isinstance(args["city"], str) or not args["city"].strip():
        return "city"
    return None

FIXTURES = [
    ({"city": "Paris"}, None),
    ({}, "missing city"),
    ({"city": "Paris", "drop": True}, "unknown field drop"),
]

failed = 0
for args, expected in FIXTURES:
    got = validate(args)
    ok = got == expected
    if not ok:
        failed += 1
    print(args, "expected", expected, "got", got, "PASS" if ok else "FAIL")
print("failures", failed)
\`\`\`

**What printed:** three PASS lines and failures 0. When failures is not 0, do not ship the tool. Do not “see how the model does.” The model is not the schema test.

## What goes wrong

Only production traffic. Only happy-path demos. Fixtures in a notebook nobody runs. Grading on prose. Adding parameters without adding extra-key cases. Skipping write-twice. Skipping deny. These green-light catalogs that injection already owns.

## How to test the suite itself

Count fixtures per tool. Fail CI if a tool has fewer than the minimum three. Fail if a write tool lacks a double-call case. Fail if the enabled-set golden drifted from the registry keys without a review marker. This is boring. Boring is operable.

## When the catalog is wrong, stop prompting

Wrong-tool rates that survive a rename and a clearer description are often a god tool, a rhyming pair, or a missing getter. Extra keys in traces mean the validator is not actually \`additionalProperties: false\`. Double emails mean the write has no key. Neighbor refunds mean actor is not from the session. Huge next-prompts mean the packer is not on the path. None of those are temperature. None of those are “add please to the system prompt.” Add a fixture that would have failed CI, then change the function.

Minimum suite per tool: valid, missing required, extra key. Writes add double-call. Allowlists add deny. Path and host tools add escape cases. Identity adds actor-over-limit. Packing adds a huge result. CI fails if a tool has fewer than the minimum, or if the enabled-set golden drifted from registry keys without review. Harvest production shapes to **add** cases. Do not wait for production to be the suite.

Stay in lane when you debug. Retrieval ranking is not JSON Schema. Loop stop rules are not the dispatcher. This track owns schema, dispatch, idempotency, sandboxes, MCP filters, and permissions the runtime enforces. The agent loop is a client of that contract. If the contract is untested, you have hope with JSON. When a fixture fails, the owner of the tool — not the prompt author — gets the ticket. That ownership line is how catalogs stay small. Tools nobody will fixture should not ship. A green demo without the eight cases above is not a catalog. It is a risk with a name. The cheapest honest run is still three dicts and a loop with no model: valid, missing, extra key. Everything else in this track — keys, jails, actors, packed observations — is more of the same idea. If you cannot run it in CI, you cannot claim the runtime enforces it.

## How agents use this

Keep fixtures next to the schema in git. The loop’s evals should **import** the same validators. When a new MCP server version lands, run host-policy goldens before you advertise a name. When tools fail in production, add a fixture that would have caught it, then change code. Do not add a sentence to the system prompt and call it a fix.

This track’s contract: the runtime enforces schema, dispatch, idempotency, sandboxes, MCP filters, and permissions. The agent loop consumes that contract. If the contract is untested, you do not have tools. You have hope with JSON.

> **Note:** Three fixtures, zero LLM calls. That is the cheapest honest test.

\`\`\`quiz
What is the cheapest way to test a tool schema?
- Hire a larger model
- *A fixture list: valid, missing field, extra key — run in CI
- Only production traffic
- Reading the README once
explain: Tools are functions. Unit-test them. Models are for choosing when to call them.
\`\`\`
`,
  },
];
