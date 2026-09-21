import type { RawLesson } from "@/lib/types";

export const pythonAgents: RawLesson[] = [
  {
    slug: "packaging",
    title: "Virtual Envs and pip",
    summary:
      "A virtual env is a private folder of packages. Learn pip, pinned requirements.txt, and why Joeven’s browser has no pip.",
    minutes: 17,
    level: "intermediate",
    md: `
A **package** is extra Python code someone else wrote. You add it to a project so you do not write everything yourself. \`json\` is not a package you install. It is stdlib. \`httpx\` is a package. On a laptop you install it. On this site you cannot.

A **virtual env** (venv) is a private folder of packages. It belongs to one project. Other projects cannot see it. That way version 1 of a package in project A cannot break project B. The language is the same Python. The extra modules are isolated.

Joeven has no pip. This lesson still matters. The agent you ship on a laptop is defined by the packages you pin, not only by the functions you wrote.

\`\`\`viz flow
title Laptop vs this browser
layout lr
node lap Laptop
node venv venv
node pip pip
node joe Joeven
node std stdlib only
edge lap venv
edge venv pip
edge joe std
caption On your machine, packages live in a venv. Here there is no pip and no network.
\`\`\`

## What a virtual env is

On your laptop you create a folder, then turn it on:

\`\`\`bash
python -m venv .venv
\`\`\`

On Windows, run the \`activate\` file inside \`.venv/Scripts\`. On macOS and Linux, run \`source .venv/bin/activate\`. The command prompt often shows \`.venv\` when it is on.

When the venv is **on**, \`python\` and \`pip\` use that folder. They do not change the system Python. When you are done, type \`deactivate\`.

Do not commit the \`.venv\` folder to git. It is large and machine-specific. Commit the list of packages instead. If someone clones your repo and has no requirements file, they cannot rebuild your agent.

\`python -m venv\` uses the Python you already have. If \`python\` is 3.12, the venv is 3.12. Matching versions across machines reduces “works on my machine.”

## pip install

**pip** is the program that downloads packages into the venv. Prefer \`python -m pip\` so you know which Python you are filling.

\`\`\`bash
python -m pip install httpx pytest
\`\`\`

\`httpx\` talks to HTTP APIs. \`pytest\` runs tests. You will meet both ideas in the next lessons. You cannot run these commands in Joeven. This is what you do on a real machine.

Never install a package only because a model named it. Read the name. Bad names exist on purpose: a typo of a popular library that runs extra code at import time. Check the spelling. Check the source. Then pin it.

\`pip install\` without a pin grabs “whatever is latest.” Latest changes. A tool that worked on Monday can import-error on Tuesday. Pin for anything you ship.

## requirements.txt

A **requirements** file is a text list of package names and versions. One line per package.

\`\`\`text
httpx==0.27.2
pytest==8.3.2
\`\`\`

\`==\` means “this exact version.” Pin versions for an agent you ship. A surprise upgrade can break tools overnight. There are other operators (\`>=\`). Exact \`==\` is the beginner-safe pin.

Install the whole list:

\`\`\`bash
python -m pip install -r requirements.txt
\`\`\`

Lines that start with \`#\` are comments. Empty lines are ignored. You will parse that shape in the live box. Real pip also handles extras and hashes. The idea is the same: a text contract of what to install.

A **lock** goes further: it lists every package those pins pull in, including dependencies of dependencies. This lesson simulates a tiny resolver so you see why “I only installed httpx” still pulled other names.

## Joeven has no pip

Joeven runs Python in your browser (Pyodide). There is **no pip** here. There is **no network**. You only get the **standard library** — the modules that come with Python.

| Place | Packages |
|---|---|
| Joeven editor | Standard library only |
| Your laptop | venv + pip + requirements.txt |

Same language. Different sandbox. Code you write here should import \`json\`, \`re\`, and friends — not \`httpx\`. When you copy a lesson to a laptop, you may add HTTP. You still keep the venv.

If an import fails here with \`ModuleNotFoundError\`, it is not “run pip.” It is “this module is not in the sandbox.” Use stdlib or simulate with functions, as the HTTP lesson does.

A requirements line without \`==\` is a name with no pin. Real pip will fetch latest. Latest is not a version you can replay. For classwork, pins look fussy. For an agent that runs tomorrow, pins are the difference between “search still works” and “an upstream rename broke import.” Put the file in git. Install from the file on every machine, including CI.

\`python -m pip freeze\` prints what is actually installed, including transitive names. That dump can become a lock. This lesson’s resolver is freeze in miniature: you asked for httpx, you also got idna. Know that list before you ship.

## Common mistakes

- Installing into system Python instead of a venv.
- Committing \`.venv\`.
- No pins.
- Installing a name the model invented.
- Assuming Joeven can pip-install.

\`\`\`tryit python
INDEX = {
    "httpx": ["httpcore", "certifi", "idna"],
    "httpcore": ["h11", "idna"],
    "h11": [],
    "certifi": [],
    "idna": [],
    "pytest": ["pluggy", "iniconfig"],
    "pluggy": [],
    "iniconfig": [],
}

req_lines = [
    "httpx==0.27.2",
    "pytest==8.3.2",
    "# skip comments",
    "",
    "unknown-pkg==1.0",
]


def parse_line(line):
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    if "==" in line:
        name, version = line.split("==", 1)
        return name.strip(), version.strip()
    return line.strip(), None


def resolve(name):
    out = []
    stack = [name]
    seen = []
    while stack:
        pkg = stack.pop()
        if pkg in seen:
            continue
        seen.append(pkg)
        if pkg not in INDEX:
            print("not in index:", pkg)
            continue
        out.append(pkg)
        needs = INDEX[pkg]
        i = len(needs) - 1
        while i >= 0:
            stack.append(needs[i])
            i -= 1
    return out


for line in req_lines:
    parsed = parse_line(line)
    if parsed is None:
        continue
    name, version = parsed
    print("want", name, "pin", version)
    print("  pulls", resolve(name))
\`\`\`

Real pip reads PyPI. Here we **simulate**. Parse a requirements-like list of strings. Then “resolve” each name with a dict lookup: the dict says what extra packages that name needs. Change a pin. Add a line. Watch \`unknown-pkg\` miss the index. That miss is what a lock file is trying to prevent on a real machine.

Never \`pip install\` a name a model invented, on a machine that holds secrets. Check the name yourself. Then add it to \`requirements.txt\` in git.

## How agents use this

Your agent’s packages are part of the product. Pin them. Install the same list on every machine with \`requirements.txt\`. Joeven cannot pip-install, so these lessons stay on the standard library. On your laptop, HTTP clients and test tools live in the venv. When a tool works “on my machine,” ask: same requirements file?

A tool that imports \`httpx\` is not portable to this browser. Wrap the HTTP client behind a function. In Joeven, that function is fake. On a laptop, it is real. The loop does not care. The venv is where the real client lives.

Version pins also freeze *behavior*. A parser library that changes JSON defaults can break \`parse_action\` without you touching your code. Pin, test, then upgrade on purpose. Agents are programs. Programs have dependencies. Dependencies need a list.

\`\`\`quiz
What is a virtual env?
- A faster kind of Python
- *A private folder of packages for one project
- A status code from a server
- Joeven’s pip command
explain: A venv keeps one project’s packages away from other projects. It is a folder, not a faster language.
\`\`\`
`,
  },
  {
    slug: "http-apis",
    title: "HTTP and APIs",
    summary:
      "You ask a server, it answers. Learn methods, status codes, JSON bodies, headers, and timeouts — with fake functions, no network.",
    minutes: 20,
    level: "intermediate",
    md: `
An **API** is a way one program asks another for data. **HTTP** is a set of rules for that ask. You send a **request** (you ask). The server sends a **response** (it answers).

\`\`\`viz flow
title You ask. The server answers.
layout lr
node req Request
node srv Server
node res Response
edge req srv
edge srv res
caption Method, path, headers, body go out. Status and body come back. No real network in this box.
\`\`\`

Almost every agent tool is an HTTP API in disguise: search, tickets, email, even the model. Joeven blocks the network. We **simulate** with functions. No real URLs. No \`urllib\`. The shape is what you will keep when you later swap in a client on a laptop.

If you only memorize status codes, you can already branch a tool: 200 read the body, 400 do not retry, 429 retry later, 401 fix the key, timeout fail closed.

## You ask, the server answers

A request has parts:

| Part | Meaning | Example |
|---|---|---|
| Method | The verb | \`GET\` read, \`POST\` send |
| Path | What you want | \`/tools/search\` |
| Headers | Extra labels | \`Authorization\`, \`Content-Type\` |
| Body | The payload | JSON text |

A response has a **status code** (a number) and a body.

\`\`\`python
request = {
    "method": "POST",
    "path": "/tools/search",
    "headers": {"Authorization": "Bearer demo"},
    "body": {"q": "rain"},
}
response = {"status": 200, "body": {"hits": ["bring a coat"]}}
print(request["method"], response["status"])
\`\`\`

\`GET\` usually has no body. \`POST\` usually has a body. Agents POST JSON a lot: “here is my question.” The path is not the tool name the model sees. Your Python maps \`search(q)\` to \`POST /tools/search\`. The model should not pick raw paths.

## Status codes

The status is the first branch in your tool:

| Code | Meaning | What you do |
|---|---|---|
| 200 | OK | Read the JSON body |
| 400 | Bad request | Your args are wrong. Do not retry the same body. |
| 401 | Unauthorized | Missing or bad key |
| 404 | Not found | Wrong path |
| 429 | Too many requests | Wait, then retry (next lesson) |
| 500 | Server error | Their fault. Retry later, or fail |

**400** means you sent a bad question. Sending it again will fail again. **429** means “slow down.” **500** means the server tripped. **401** means the key is missing or wrong — fix the key, do not keep sending the same call.

A 200 is not always a business win. Some APIs return \`{"ok": false}\` with HTTP 200. Read the body too. Branch on both: transport status and business \`ok\`.

Timeout is not always a number status. In our fake client it is the string \`"timeout"\`. A real client raises or returns an error object. Normalize to a dict in one place.

## JSON body

Agents usually send and receive **JSON** — text that looks like a Python dict. \`Content-Type: application/json\` is the header that says “this body is JSON.”

You already know \`json.dumps\` (Python → text) and \`json.loads\` (text → Python). A real client does that for you. Here we pass a dict and pretend. The lesson is the dict’s fields, not the bytes on the wire.

Empty body vs missing \`q\` is a 400 in the fake search. That is your validator sitting in front of the “server.” On a laptop the server might 400. Either way, do not retry.

## Headers and timeouts

**Headers** are name tags on the request. Put API keys in \`Authorization\`. Never put keys in the prompt. Never put keys in a query string that gets logged. \`Bearer\` plus a token is a common pattern. The word Bearer is not the secret. The token is.

A **timeout** is a max wait. If the server is silent too long, you stop waiting. An agent with no timeout waits forever. In this editor we do not sleep. We compare a fake delay to the timeout and return \`"timeout"\`.

Retry comes in the next lesson. For now, just **see** 429 and timeout as results you might retry later. See 400 as a result you must not retry.

## A fake server in Python

A dict of \`(method, path)\` maps to a handler function. Your tool code should look the same when you later swap in a real HTTP client on your laptop: build a request, call \`request(...)\`, branch on status.

The fake \`CALLS\` dict is global on purpose so you can see 429 after two searches. In a real client, the server owns that counter. Tests should reset state between runs. Here, re-run the box to reset. If you add a fourth search, it should still 429. That is rate limiting as data, not as a lecture.

\`Authorization\` is compared as a full string. Extra spaces fail 401. Strip headers if you accept user-supplied keys, but do not log them after strip. 404 means your path table missed. The model should not see 404 for \`search\` if your adapter maps names to paths. Map first, then request.

## Common mistakes

- Retrying 400.
- Logging Authorization.
- No timeout.
- Treating 200 as success without reading \`ok\`.
- Letting the model choose method and path.

\`\`\`tryit python
CALLS = {"search": 0}
SLOW = {("GET", "/slow"): 10}


def health(req):
    return {"status": 200, "body": {"ok": True}}


def search(req):
    q = (req.get("body") or {}).get("q")
    if not q:
        return {"status": 400, "body": {"error": "q is required"}}
    CALLS["search"] += 1
    if CALLS["search"] > 2:
        return {"status": 429, "body": {"error": "too many requests"}}
    return {"status": 200, "body": {"hits": ["note about " + q]}}


def boom(req):
    return {"status": 500, "body": {"error": "server broke"}}


def messages(req):
    return {"status": 200, "body": {"type": "tool", "name": "search"}}


ROUTES = {
    ("GET", "/health"): health,
    ("POST", "/tools/search"): search,
    ("GET", "/boom"): boom,
    ("POST", "/v1/messages"): messages,
}


def request(method, path, body=None, headers=None, timeout=2):
    headers = headers or {}
    body = body or {}
    delay = SLOW.get((method, path), 0)
    if delay > timeout:
        return {"status": "timeout", "body": {"error": "no answer in time"}}
    if path.startswith("/v1/") and headers.get("Authorization") != "Bearer demo":
        return {"status": 401, "body": {"error": "need a key"}}
    handler = ROUTES.get((method, path))
    if handler is None:
        return {"status": 404, "body": {"error": "not found"}}
    req = {"method": method, "path": path, "body": body, "headers": headers}
    return handler(req)


print("health", request("GET", "/health"))
print("search", request("POST", "/tools/search", body={"q": "rain"}))
print("bad args", request("POST", "/tools/search", body={}))
print("auth", request("POST", "/v1/messages", body={"prompt": "hi"}))
print("ok auth", request("POST", "/v1/messages", headers={"Authorization": "Bearer demo"}))
print("search2", request("POST", "/tools/search", body={"q": "coat"}))
print("search3", request("POST", "/tools/search", body={"q": "hat"}))
print("boom", request("GET", "/boom"))
print("slow", request("GET", "/slow", timeout=2))
print("missing", request("GET", "/nope"))
\`\`\`

Read each line. Match the status to the table. The third search is 429. The slow path is a timeout. The missing key is 401.

On a real machine you would write something like: post the URL, send JSON, set a timeout, then branch on the status code. The **shape** does not change.

Put API keys in headers from the environment. Never in the prompt. Never in logs.

## How agents use this

The model endpoint is one more HTTP API: you POST messages, you get text or a tool call. Every other tool is the same shape with a different path. Your Python wraps status codes so the model sees \`search(q)\`, not 429. If you can handle 200, 400, 401, 429, 500, and timeout, you can wrap the world — even when we fake the network.

Hide HTTP from the loop. The loop should receive \`{"ok": False, "error": "too many requests"}\` or a result payload. If the transcript is full of status numbers, the model will try to “fix” HTTP. That is not its job. Your adapter already knows 429.

Timeouts belong on every outbound call, including the model. An agent with an infinite wait is an agent you cannot budget. The fake \`delay > timeout\` check is that rule in arithmetic. On a laptop, pass \`timeout=\` into the client. Same idea.

\`\`\`quiz
What does status 429 mean?
- The URL does not exist
- *Too many requests; wait and retry later may help
- The JSON body was fine and the call worked
- You must use eval()
explain: 429 means the server wants you to slow down. 400 is a bad request. 200 is success.
\`\`\`
`,
  },
  {
    slug: "parse-llm-json",
    title: "Parse JSON from a Model",
    summary:
      "Models wrap JSON in markdown fences and chat. Strip the fence, parse with json.loads, return an error dict, and never eval().",
    minutes: 20,
    level: "intermediate",
    md: `
Language models often wrap JSON in a markdown **fence**: three backticks, the word json, the object, then three backticks again. They also add chat around it: “Sure!” before, “Hope this helps” after.

Your runtime must still get a dict like \`{"tool": "search", "args": {"q": "rain"}}\`. The parser is a gate. If the gate is \`eval\`, the model can run Python. If the gate is \`json.loads\`, the model can only send data. Data can still be a wrong tool name. That is the allowlist’s job. Running code is the parser’s job to refuse.

\`\`\`viz flow
title Text in, object out
layout lr
node text Messy text
node strip Strip fence
node obj Dict
edge text strip
edge strip obj
caption Strip the wrapper. Then json.loads. Never eval model text.
\`\`\`

## Models wrap JSON in fences

A clean action looks like this:

\`\`\`python
action = {"tool": "search", "args": {"q": "rain"}}
print(action["tool"])
\`\`\`

A messy model reply looks like: extra words, a fence line, the same object, a closing fence, more words. You must strip the wrapper. Then parse. You do not need a full markdown parser. You need: trim, drop a first fence line, drop a last fence line, find the outermost object.

Fences might say json or say nothing after the backticks. \`startswith\` on the first line is enough. Do not require the word json. Require the backtick prefix.

## Strip, then json.loads

\`json.loads\` turns JSON **text** into a Python dict. If the text is not JSON, it raises \`json.JSONDecodeError\`. Catch that. Return an error dict. The loop can retry the model or stop. Do not crash the agent.

Never use \`eval()\` on model text. \`eval()\` runs Python. A model can write dangerous calls. \`json.loads\` only reads data. That is the point. \`exec\` is the same class of mistake. Do not use it on model text either. This site’s lessons will not show a working \`eval\` on purpose.

Building JSON with glued quotes also breaks when a value has quotes. Use \`json.dumps\` to *write* JSON. Use \`json.loads\` to *read* it.

## Extra text before and after

A useful trick: find the first \`{\` and the last \`}\`. Slice that piece. Then \`json.loads\`. Chat before and after drops away. Nested args still work, because the last \`}\` closes the outer object — if the model printed one object. If it printed two objects, last \`}\` still closes the second one and you may parse the wrong span. Prefer one object per reply.

If there is no \`{\`, you have no object. Return an error dict. If \`}\` comes before \`{\`, also fail.

\`str.find\` returns \`-1\` when missing. \`str.rfind\` finds from the right. Together they are the brace slice. Regex is optional here. Brace find is easier to test.

## A robust parse_action

\`parse_action(text)\` should return \`{"tool": name, "args": dict}\` on success. On failure it returns the same keys plus \`"error"\`. The caller always gets a dict. No crash.

Accept \`tool\` or \`name\`. Accept \`args\` or \`arguments\`. Models drift. Normalize to one shape: \`tool\` and \`args\`. Then the loop has one reader.

If \`args\` is missing, use \`{}\`. Then the tool might TypeError on a required field. You can treat missing args as an error instead. Either way, never pass a list as \`**args\`. Check \`isinstance(args, dict)\`.

If the loaded value is a list, it is not an action object. Return \`not_object\`. Do not take \`[0]\` and hope.

Strip before you extract braces, or extract then parse — both can work. The tryit strips fences first so a fence line of backticks is not part of the JSON. Then it slices from first \`{\` to last \`}\`. If the model put JSON in a fence *and* chatted after the closing fence, the last \`}\` still belongs to the object if there is only one object. If it also put a second \`{...}\` example in the chatter, last \`}\` is the wrong end. Prompt the model for one object. The parser is a seatbelt, not a mind reader.

Keep \`detail\` on parse errors for you. The model can see \`bad_json\` without a stack trace. A huge exception string in the next prompt wastes tokens and can leak paths.

## Common mistakes

- \`eval\` / \`exec\` on model text.
- Crashing the loop on \`JSONDecodeError\`.
- Assuming fences always exist, or never exist.
- \`**\` unpacking a non-dict.
- Parsing without logging the raw text on failure.

\`\`\`tryit python
import json

fence = "\`" * 3


def strip_fences(text):
    text = text.strip()
    lines = text.splitlines()
    if lines and lines[0].startswith(fence):
        lines = lines[1:]
        if lines and lines[-1].strip() == fence:
            lines = lines[:-1]
        text = chr(10).join(lines)
    return text.strip()


def extract_object(text):
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        return None
    return text[start : end + 1]


def parse_action(text):
    try:
        blob = strip_fences(text)
        blob = extract_object(blob) or blob
        data = json.loads(blob)
    except json.JSONDecodeError as exc:
        return {"tool": None, "args": {}, "error": "bad_json", "detail": str(exc)}
    if not isinstance(data, dict):
        return {"tool": None, "args": {}, "error": "not_object"}
    tool = data.get("tool") or data.get("name")
    args = data.get("args") or data.get("arguments") or {}
    if not tool:
        return {"tool": None, "args": {}, "error": "missing_tool"}
    if not isinstance(args, dict):
        return {"tool": None, "args": {}, "error": "args_not_object"}
    return {"tool": tool, "args": args}


clean = '{"tool": "search", "args": {"q": "rain"}}'
fenced = chr(10).join(
    [fence + "json", '{"tool": "search", "args": {"q": "coat"}}', fence]
)
noisy = (
    "Sure, here you go:"
    + chr(10)
    + '{"tool": "finish", "args": {"text": "done"}}'
    + chr(10)
    + "Thanks!"
)
bad = "not json at all"
# BAD, never do this with model text:
# action = eval(clean)

for label, sample in [
    ("clean", clean),
    ("fenced", fenced),
    ("noisy", noisy),
    ("bad", bad),
]:
    print(label, parse_action(sample))
\`\`\`

You should see three successful \`tool\` / \`args\` dicts, then an error dict. No \`eval\`. If parse fails in a real loop, you send the error back as an observation — or you retry the model. You do not run the text as Python.

## How agents use this

Every tool-using agent parses model text into a \`tool\` name and an \`args\` dict. Models will wrap, chatter, and typo. Your parser is the gate. If the gate uses \`eval()\`, the model can run anything. If the gate returns an error dict, the loop can recover. Later lessons reuse this \`parse_action\`.

Keep the raw model text in the transcript even when parse fails. Then you can see the fence you failed to strip. A parser that only stores \`bad_json\` without the raw line cannot be improved. Redact secrets first. Then store.

Tests should include: clean JSON, fenced JSON, chat wrapping, not JSON, a list, missing tool, args as a string. That set is this lesson’s try-it plus two more cases. The mini-agent lesson will parse clean JSON only, on purpose, so the loop stays readable. Production should use the robust parser.

Never feed parse errors into \`eval\` as a “fallback.” There is no fallback that runs model text. The only fallback is retry the model, or stop, or ask a human. \`json.loads\` plus an error dict is the whole parser contract. Everything else is stripping wrappers so \`loads\` can see the object.

\`\`\`quiz
Why should you never eval() text from a model?
- eval() is slower than json.loads
- *eval() can run any Python the model wrote, which is unsafe
- eval() cannot read dicts
- json.loads is not in the standard library
explain: json.loads only reads data. eval() runs code. Model text is not code you trust.
\`\`\`
`,
  },
  {
    slug: "retries",
    title: "Retries and Timeouts",
    summary:
      "Retry timeouts and 429. Do not retry 400 or 401. Cap tries, print backoff waits, and open a circuit after too many fails.",
    minutes: 19,
    level: "intermediate",
    md: `
A **retry** means try the same call again. Retries save you from flaky networks. They also multiply cost if you retry the wrong thing. A 400 with a missing field will 400 forever. A 429 might succeed if you wait.

Retry a **timeout** (no answer in time). Retry **429** (too many requests). Do **not** retry **400** (your request is wrong). The same body will fail again. Do not retry **401** either — fix the key.

This is still Python: sets of statuses, a for-loop with a cap, a list of wait numbers you print instead of sleeping. The policy is the point. \`time.sleep\` would freeze this page.

\`\`\`viz loop
title Retry some failures, then stop
step Try
step See status
step Wait
step Stop
caption Retry 429 and timeout. Do not retry 400. Cap the tries.
\`\`\`

## Retry only some failures

| Result | Retry? |
|---|---|
| 200 | No. You are done. |
| 400 | No. Fix args. |
| 401 | No. Fix the key. |
| 429 | Yes, with a wait. |
| timeout | Yes, with a wait. |
| 500 | Sometimes. Cap the tries. |

**Max tries** is a hard cap. Three is a common default. After that, fail. An agent that retries forever is a bill. Max tries applies per call, not per agent lifetime. The agent loop has its own \`max_steps\`. Nested unbounded retries inside each step are how 8 steps become 800 HTTP calls.

Idempotency matters. Retrying GET search is usually safe. Retrying “charge the card” may double-charge. This lesson’s fake API is search-like. Do not blindly retry every tool.

## Backoff: a list of waits

**Backoff** means wait longer each time. You do not need a fancy formula. Keep a list of wait numbers. Print the wait. Do **not** sleep for a long time in this editor — it would freeze the page.

\`\`\`python
waits = [0.5, 1.0, 2.0]
# try 1 fails -> would wait 0.5
# try 2 fails -> would wait 1.0
# try 3 fails -> stop
print(waits)
\`\`\`

On a laptop you might \`time.sleep(wait)\`. Here we only print \`would wait\`. Logging the wait is still useful in production. Then a trace explains the gap between two timestamps.

If you have more tries than waits, stop at max tries anyway. Do not invent waits with a while True. Index \`waits[attempt - 1]\` only when you will retry.

## A circuit: stop after N fails

A **circuit** counts fails in a row. After N fails, you **open** the circuit: stop calling that API for a while. That protects you from a dead server. A success **closes** it and resets the count.

Think of a fuse. Too many sparks, the fuse pops. You do not keep sending sparks. In code, \`open_\` is a bool (the name \`open\` would shadow the builtin). When open, skip the call. You can later add a cooldown timestamp. A skip loop is enough to see the idea.

A circuit is per *dependency*: the search API, not the whole agent. One broken tool should not freeze finish if finish is local.

**Jitter** means adding a little randomness to the wait so many agents do not retry on the same second. You do not need it in this box. On a laptop, a tiny \`random\` add is enough. Still cap tries. Jitter without a cap is still a bill.

Count attempts from 1 in logs. Humans say “third try.” \`range(1, max_tries + 1)\` matches that speech. If the script of fake statuses is shorter than max tries, stop when the script ends. Tests pass a list of statuses. Production passes a function that hits the network. Same loop.

Do not retry \`finish\`. Finish is local. Do not retry a parser error. The body is wrong. Retry is for “the other side blinked.” If you cannot tell those apart, default to no retry and log why.

500 is a maybe. One retry is reasonable. Three retries on a persistently 500 API is paying for their outage. After max tries, return an error dict and let the agent loop decide to finish or try a different tool. The circuit is for “this API is dead for this run.” It is not a substitute for max_steps on the agent.

## Common mistakes

- Retrying 400/401.
- No max tries.
- Sleeping 30s in a demo box.
- Retrying non-idempotent writes.
- A circuit that never resets on success (here, success resets \`fails\`; once open, this demo stays open — production would cooldown).

\`\`\`tryit python
RETRY_OK = {429, 500, "timeout"}
NO_RETRY = {400, 401}
waits = [0.5, 1.0, 2.0]
max_tries = 3


def request_with_retry(script):
    last = None
    n = min(max_tries, len(script))
    for attempt in range(1, n + 1):
        status = script[attempt - 1]
        print("attempt", attempt, "status", status)
        last = status
        if status == 200:
            print("success")
            return status
        if status in NO_RETRY:
            print("no retry")
            return status
        if status in RETRY_OK:
            if attempt == max_tries:
                print("gave up")
                return status
            wait = waits[attempt - 1]
            print("would wait", wait, "seconds")
            continue
        print("unknown status, stop")
        return status
    return last


print("--- 429 then 200 ---")
print("end", request_with_retry([429, 200]))
print("--- 400 ---")
print("end", request_with_retry([400, 200]))
print("--- three timeouts ---")
print("end", request_with_retry(["timeout", "timeout", "timeout"]))


def run_circuit(calls, fail_limit=3):
    fails = 0
    open_ = False
    for i, status in enumerate(calls, start=1):
        if open_:
            print("circuit open, skip call", i)
            continue
        print("call", i, "status", status)
        if status == 200:
            fails = 0
            print("ok, reset fails")
        else:
            fails += 1
            print("fails in a row", fails)
            if fails >= fail_limit:
                open_ = True
                print("circuit open: stop calling")
    return open_


print("--- circuit ---")
print("open?", run_circuit([500, 500, 500, 200, 200]))
\`\`\`

The 400 path never reaches the second status. The timeout path prints two waits, then gives up. The circuit opens after three fails and skips the rest — even a later 200.

Retry the **transport**, not the **business rule**. A missing field is not flaky. A rate limit is.

## How agents use this

Tools fail. Models time out. Rate limits hit. Your loop must retry the right errors, cap the tries, and back off. A circuit stops a loop of failing calls against a down API. Without this, one bad line becomes a hundred paid calls. Next you will overlap waits. First you must know which waits are worth repeating.

The model should see one observation: “search timed out after 3 tries.” It should not see three identical timeouts unless you want it to change query. Collapsing retries inside the tool adapter keeps \`max_steps\` honest.

Budget math should count failed tries if they hit a paid API. A 429 retry still cost a request. Your ledger is not only successful 200s. Print attempt numbers in the tool log. Then cost reviews make sense.

Honor \`Retry-After\` when a real server sends it. This box has no headers on the 429 body beyond an error string. On a laptop, if the header is a number of seconds, use that as the wait instead of your list, still capped. If the header is missing, use the list. Never wait minutes in a user-facing turn without telling the user. Print “would wait” even when you really sleep.

\`\`\`quiz
Which result should you retry?
- HTTP 400 with the same body
- HTTP 401 with a missing key
- *HTTP 429 or a timeout, with a max try count
- HTTP 200
explain: Retry flaky waits and rate limits. Do not retry a bad request or a missing key.
\`\`\`
`,
  },
  {
    slug: "async-intro",
    title: "Async in Simple Words",
    summary:
      "Async means wait for many tools at once. Simulate concurrent jobs with a queue and an in-flight limit. Skip event-loop internals.",
    minutes: 18,
    level: "intermediate",
    md: `
Sometimes an agent needs three tools. If you wait for each one to finish before starting the next, you waste time. Search can run while a page fetch runs. That overlap is the point of **async**.

Async does **not** mean extra CPU cores. It means: wait for many things without blocking the others. You will not run real \`asyncio\` well in every browser. We **simulate** with a queue of tasks in a loop. We will not teach event loop internals. You still need the idea: many jobs **in flight**.

Heavy math does not get faster from async alone. Network waits do. Disk waits sometimes do. \`time.sleep\` in a normal function blocks everything. That is why the stdlib lesson warned you.

## Why wait together

Three jobs take 3, 2, and 4 ticks.

| Schedule | Total ticks |
|---|---|
| One after another | 3 + 2 + 4 = 9 |
| All started together | 4 (the longest) |

If each tick is a network wait, this is a snappy agent vs a bored user. If the jobs must run in order (write then read the same file), overlap is a bug. Concurrent is for **independent** waits.

\`\`\`viz bars
title Sequential vs overlap
bar line,9,0
bar overlap,4,1
caption Three waits of 3, 2, and 4. In a line they cost 9. Together they cost 4 — the longest.
\`\`\`

## async and await in simple words

In real laptop code you may see:

\`\`\`python
async def search(q):
    result = await client.get(q)
    return result
\`\`\`

\`async def\` marks a function that can **pause**. \`await\` is the pause: “wait for this, let other work run.” You only need this when you **wait** (network, disk). Do not run that snippet here. Joeven’s sandbox is not a full asyncio playground. The words are vocabulary for when you leave the browser.

If you call \`search(q)\` without awaiting, you have not run the body yet in real asyncio. That surprise is why we simulate with a plain loop first. A queue you can print is easier than an event loop you cannot see.

## Concurrent means many jobs in flight

**Concurrent** means many jobs are **in flight**: started, not finished yet. A **queue** is a waiting line of jobs that have not started. A loop starts jobs until a limit (say 2 at a time), then ticks the clock, then finishes whoever is done.

Reads that do not touch each other are safe to overlap. Two tools that write the same file are not. Start simple: overlap reads, run writes one at a time. Two searches with different queries are independent. Search plus \`finish\` is not a pair to overlap if finish needs the search result. Data dependence is an order. Independence is overlap.

A limit of 2 in flight is a courtesy to the API and to your timeout slots. Unlimited in-flight is another way to 429.

## A queue of tasks

Each job has a \`wait\` (how many ticks it needs). Each tick, every in-flight job loses one tick. When a job hits zero, it is done. The queue fills in-flight up to a max. No threads. No event loop talk.

\`collections.deque\` is a list that is cheap to pop from the left. \`popleft\` is “next job please.” A normal list \`pop(0)\` also works for tiny queues and is slower for huge ones. For three jobs, either is fine.

Timeouts still matter. A hung tool that never finishes holds a slot. Cap waits. The retry lesson already taught you to stop. In this simulation, every job’s \`wait\` is finite. Real tools need a timeout so \`left\` cannot stay positive forever.

Wall time is \`max(waits)\` only if every job starts at once. With \`max_in_flight=1\`, wall time is the sum. With a limit of 2, wall time sits between those two numbers. Print start and done times. That print is how you debug “why is this turn slow?” without an event loop lecture.

Do not overlap a tool that needs the previous tool’s output. \`search\` then \`read\` the first hit is sequential on purpose. Overlap two searches. The agent loop can still be a simple for-step; only the executor’s wait is concurrent. That split keeps \`max_steps\` honest.

## Common mistakes

- Overlapping writes to one file.
- Unlimited in-flight.
- Thinking async speeds CPU loops.
- Using async for a single tool call with no siblings.
- Skipping timeouts so a hung job blocks a slot.

\`\`\`tryit python
from collections import deque

jobs = [
    {"name": "search", "wait": 3},
    {"name": "read", "wait": 2},
    {"name": "embed", "wait": 4},
]

print("one after another", sum(j["wait"] for j in jobs))
print("all at once", max(j["wait"] for j in jobs))

pending = deque({"name": j["name"], "left": j["wait"]} for j in jobs)
inflight = []
max_in_flight = 2
t = 0
print("queue run, max in flight", max_in_flight)

while pending or inflight:
    while pending and len(inflight) < max_in_flight:
        job = pending.popleft()
        inflight.append(job)
        print("t", t, "start", job["name"])
    t += 1
    still = []
    for job in inflight:
        job["left"] -= 1
        if job["left"] <= 0:
            print("t", t, "done", job["name"])
        else:
            still.append(job)
    inflight = still

print("wall ticks", t)
\`\`\`

Change \`max_in_flight\` to 1. Wall ticks should grow. Change it to 3. All three can start at t=0. **In flight** is the idea. That is enough.

## How agents use this

A turn can fire several independent tools. Sequential HTTP wastes the user’s time. Concurrent means many jobs in flight, not “smarter math.” Keep the agent loop easy to read. Use a queue (or \`asyncio.gather\` later, on a laptop) only for waits that do not collide. You do not need event loop internals to ship that rule.

The outer agent loop can stay synchronous: one think, then maybe gather two reads, then observe, then think. You do not have to make \`run_agent\` itself async on day one. Push concurrency to the executor: \`call_many(names)\`. Test that function with fake waits, like this lesson.

Never overlap a tool that spends money with no cap. Two concurrent model calls are two bills. Two concurrent searches may be cheaper than sequential if the user is waiting. Measure. The queue’s \`max_in_flight\` is a budget too.

If one of three jobs fails, decide: cancel the others, or keep them. Cancel is kinder to the wallet. This simulation has no cancel; jobs run until \`left\` is 0. On a laptop, a timeout is your cancel. Record which names finished. The observation should list successes and failures separately so the model does not assume all three returned.

\`\`\`quiz
In this lesson, concurrent means…
- Using extra CPU cores
- *Many jobs in flight at the same time, overlapping their waits
- Skipping tests
- Calling pip
explain: Concurrent here means several waits started, not finished yet. It is not about extra cores.
\`\`\`
`,
  },
  {
    slug: "testing",
    title: "Tests",
    summary:
      "Use assert to test a tool, goal_satisfied, and parse_action. lambda is a tiny check. A runner counts pass and fail.",
    minutes: 19,
    level: "intermediate",
    md: `
An agent with no tests is a **demo**. It has not failed in front of you yet. You cannot unit-test “the model will be wise.” You **can** test everything around it: tools, parsers, and “is the goal done?”

\`assert\` is the smallest testing tool. If the check is false, Python raises \`AssertionError\`. On a laptop, \`pytest\` finds functions named \`test_*\`. Here we write a tiny runner that works in the browser. The idea is the same: known input, expected output, a report of pass and fail.

If you only run the happy path by hand, you will ship a parser that crashes on bad JSON. That crash is a missed test, not a mean model.

\`\`\`viz flow
title Known in, expected out
layout lr
node in input
node fn function
node out output
node ok pass or fail
edge in fn
edge fn out
edge out ok
caption assert checks a tool, a parser, and goal_satisfied. The model can wait. Your code cannot.
\`\`\`

## lambda is a tiny unnamed function

A **lambda** is a one-line function with no \`def\` name. You will see it in tests: \`lambda: add(2, 3) == 5\`. That means “run this check.” \`lambda\` can only hold one expression. No \`if\` block inside.

Prefer a normal \`def\` when the body is more than one expression. Lambda is only a shortcut for a single value. The runner stores \`(name, fn)\` pairs. \`fn\` is the lambda. Calling \`fn()\` runs the check.

\`lambda: add(2, 3) == 5\` returns True or False. The runner then \`assert fn() is True\`. Using \`is True\` rejects a sloppy non-empty string that would pass \`if result\`. Done checks must be real booleans.

## assert

\`\`\`python
assert 2 + 3 == 5
assert True is True
\`\`\`

Write \`is True\` when the function must return a real \`True\`. \`assert some_text\` would also pass for a non-empty string. That is a sloppy “done” check. \`assert goal_satisfied(state) is True\` is the contract.

If you run Python with optimizations that skip asserts, tests would vanish. Beginners do not do that. In Joeven, assert works. On a laptop, pytest uses assert too.

## Test a tool

A **tool** is a function. Call it with known inputs. Check the output. Do not call the live web. Do not call a paid model. Stub those.

\`\`\`python
def add(a, b):
    return a + b

assert add(2, 3) == 5
\`\`\`

If \`add\` breaks, the test fails before any agent loop runs. Test edge cases: negatives, zeros. For search, test a known query against a fake index dict, like the mini-agent will.

A tool that hits the network is not a unit test. Inject a fake: pass a function that returns a fixed dict. The loop must run without a credit card.

## Test goal_satisfied and parse_action

\`goal_satisfied(state)\` returns True when the job is done. If this function is wrong, the agent stops early or never stops. Test the happy path. Test missing fields. Test a bad URL. Test empty answer. Empty \`"answer": ""\` must not count as done if you require text.

\`parse_action(text)\` must accept good JSON and reject junk. Test both. A crash on bad JSON is a bug in *your* parser. Return a dict with \`ok: False\`. Then the test asserts \`["ok"] is False\`.

## A tiny test runner

The runner calls each check, prints PASS or FAIL, and counts. That count is the report. Catch \`AssertionError\` as FAIL. Catch other exceptions as ERROR — a crash in the test is not a clean fail. You want to see \`TypeError\` if a helper is broken.

On a real machine:

\`\`\`bash
python -m pip install pytest
pytest -q
\`\`\`

Joeven’s runner is the same idea without files. Name tests so a FAIL line is readable: \`goal_empty\`, not \`test3\`.

Keep tools boring in tests. If search hits the web, inject a fake. The loop must run without a credit card.

A **table** of cases is easier to extend than copy-paste asserts. The runner already is a table: name plus lambda. Add a row for “args is a list” and expect \`ok is False\`. Add a row for \`done\` missing. If you cannot name the row, you do not know the contract.

Tests that import your module must not start the agent. That is the \`__name__ == "__main__"\` lesson. If \`run_tests()\` is called at import time, a later pytest collection would run it twice. In this box, calling \`run_tests()\` at the bottom is the program. On a laptop, put that call in the main block.

## Common mistakes

- Testing the model’s wisdom instead of your functions.
- \`assert result\` on a string.
- No test for bad JSON.
- Live network in unit tests.
- Asserting on print output only, never on return values.

\`\`\`tryit python
import json


def add(a, b):
    return a + b


def goal_satisfied(state):
    answer = state.get("answer")
    return state.get("done") is True and isinstance(answer, str) and len(answer) > 0


def parse_action(text):
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {"ok": False, "error": "bad_json"}
    tool = data.get("tool")
    args = data.get("args")
    if not tool or not isinstance(args, dict):
        return {"ok": False, "error": "shape"}
    return {"ok": True, "tool": tool, "args": args}


def run_tests():
    tests = [
        ("tool_add", lambda: add(2, 3) == 5),
        ("goal_yes", lambda: goal_satisfied({"done": True, "answer": "ok"}) is True),
        ("goal_no_flag", lambda: goal_satisfied({"done": False, "answer": "ok"}) is False),
        ("goal_empty", lambda: goal_satisfied({"done": True, "answer": ""}) is False),
        ("parse_ok", lambda: parse_action('{"tool": "add", "args": {"a": 1}}')["ok"] is True),
        ("parse_bad", lambda: parse_action("not json")["ok"] is False),
        ("parse_no_args", lambda: parse_action('{"tool": "add"}')["ok"] is False),
    ]
    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            assert fn() is True
            print(name, "PASS")
            passed += 1
        except AssertionError:
            print(name, "FAIL")
            failed += 1
        except Exception as exc:
            print(name, "ERROR", type(exc).__name__, exc)
            failed += 1
    print("passed", passed, "failed", failed)
    return failed


run_tests()
\`\`\`

Break \`goal_satisfied\` so an empty answer counts as done. Watch \`goal_empty\` go red. That is the loop you want: tests spell the contract.

## How agents use this

\`goal_satisfied\` is how “done” becomes checkable. The model can ramble. The function cannot. Test parsers so bad JSON becomes an observation, not a crash. Test tools so \`add(2, 3)\` stays 5. Later eval lessons test models. You start with \`assert\`. Agents without tests are demos.

The budget should be tested too: run the loop with \`max_steps=1\` and a script that wants two tools. Expect stop. That test lives in the next lesson’s second run. Promote it to \`assert\` when you extract \`run_agent\`.

Do not replace tests with a bigger model. A smarter model still emits fences. Your parser still has to strip them. Tests are cheaper than hope.

A failing test is a gift if the name is good. \`goal_empty FAIL\` tells you the contract. \`test7 FAIL\` tells you nothing. When you change \`goal_satisfied\`, run the table. When you change \`parse_action\`, run the table. The mini-agent is allowed to use those same functions. Then a parser bug fails in 0.1 seconds instead of at step 6 of a live run.

\`\`\`quiz
Why write tests for tools, parse_action, and goal_satisfied?
- Models never fail
- *They are your code. A stub model is enough to check them.
- assert only works on numbers
- Tests replace the need for a budget
explain: You cannot unit-test wisdom. You can test parsers, tools, and “is the job done?”
\`\`\`
`,
  },
  {
    slug: "agent-python",
    title: "A Mini Agent in Python",
    summary:
      "Put it together: a TOOLS dict, JSON parse, a budgeted loop, a transcript, a finish tool, a fake model, and a printed trace.",
    minutes: 22,
    level: "intermediate",
    md: `
This lesson puts the pieces together. You will run a **mini agent** in the browser. There is no paid model. A **fake model** is a function that returns the next action as JSON.

This is the shape of every later agent lesson. Other libraries wrap this. These objects stay: tools, parse, loop, transcript, finish, budget, trace. If you cannot find them in a framework, they are still there under a new name.

You already have the skills: dicts, functions, \`json\`, \`while\`/\`for\`, exceptions, unpacking \`**args\`. The new work is wiring, not new syntax.

## The pieces

| Piece | Job |
|---|---|
| \`TOOLS\` | Dict: name → function |
| \`parse_action\` | JSON text → \`{tool, args}\` |
| Loop | Repeat until finish or budget |
| \`max_steps\` | The **budget** — a hard cap |
| \`transcript\` | A list of what happened |
| \`finish\` | A tool that means “stop, here is the answer” |
| Fake model | Returns the next JSON action |

The loop is: ask the model, parse, call the tool, append to the transcript, print the trace, repeat.

\`\`\`viz loop
title The mini agent loop
step Ask model
step Parse
step Call tool
step Stop
caption Tools, parse, transcript, finish, budget. When the budget hits, stop even if the goal is not done.
\`\`\`

Each piece can be tested alone. Together they are an agent. Missing stop is an infinite furnace. Missing parse is a crash. Missing tools dict is \`eval\`-by-accident if you were tempted. We will not be tempted.

## A fake model

A real model is an HTTP call. Here the “model” is a function. It reads nothing fancy. It returns the next string from a script. You still parse that string. You still dispatch tools. The loop is real. The model is a list of strings.

\`\`\`python
def make_model(lines):
    i = {"n": 0}

    def fake_model(_transcript):
        if i["n"] >= len(lines):
            return '{"tool": "finish", "args": {"text": "stop"}}'
        text = lines[i["n"]]
        i["n"] += 1
        return text

    return fake_model
\`\`\`

\`i\` is a dict so the inner function can update \`n\` without a \`global\`. A list with one integer would also work. The fake ignores the transcript on purpose so the script is predictable. A real model would see the transcript. Tests want predictable.

If the script runs out, we still return a finish JSON. That is a seatbelt. The budget is the other seatbelt.

## The loop

Each step costs 1 budget. If parse fails, append an error observation and continue (or stop — your choice). If the tool is \`finish\`, stop. If \`max_steps\` is used up, stop even if the goal is unmet. Models do not reliably halt. Your Python must.

Print every step. That printout is a **trace**. If you cannot see what happened, you cannot debug it. Append to the transcript in **one** place. If every tool logs differently, you will never test a full run.

The \`else\` attached to the \`for\` runs only if the loop never \`break\`s. If \`finish\` never fires, you print \`stop: budget\`. That is the same loop-\`else\` idea from **Loops and Budgets**.

\`TOOLS[tool](**args)\` is the dispatch. Wrap it in \`try/except\` so a bad argument becomes an observation, not a dead process. Unknown tools are rejected in parse if you check \`tool not in TOOLS\`. Do both if you like belts and braces. One check is enough if it is always on.

## Try it: a tiny agent

\`TOOLS\` maps \`"search"\` and \`"finish"\` to functions. \`**args\` unpacks the dict into named inputs. Reuse the *idea* of \`parse_action\` from the JSON lesson. The fake model emits clean JSON, so the parser can stay short. Production should swap in the fence-stripping parser.

## What you still add later

- The robust fence-stripping parser
- Retries on 429 and timeout
- \`goal_satisfied\` as a stop check
- Tests for parse, budget, and tools
- A real model over HTTP on your laptop

The shape does not change.

Wire one transcript per \`run_agent\` call. The function already does \`transcript = [{"role": "user", "content": goal}]\`. Two calls in the tryit are two lists. If you accidentally make \`transcript\` a global, run 2 would start with run 1’s rows. That is the mutability lesson at agent scale.

Print \`step\` before you call the tool. Then a hang is still diagnosable: you know which step started. After the tool, print the result. The tryit does both. When you add retries, print attempt numbers inside the tool, not as extra agent steps, unless you *want* them to cost budget.

## Common mistakes

- No budget.
- Crashing on bad JSON.
- Sharing one transcript across runs.
- Letting the model invent tool names that are not in \`TOOLS\`.
- Printing without appending, or appending without printing, so debug and state diverge.

\`\`\`tryit python
import json


def search(q):
    hits = {"rain": "bring a coat", "python": "use a venv"}
    return hits.get(q, "no hits")


def finish(text):
    return {"final": text}


TOOLS = {
    "search": search,
    "finish": finish,
}


def parse_action(text):
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {"ok": False, "error": "bad_json"}
    tool = data.get("tool")
    args = data.get("args") if isinstance(data.get("args"), dict) else {}
    if tool not in TOOLS:
        return {"ok": False, "error": "unknown_tool"}
    return {"ok": True, "tool": tool, "args": args}


def make_model(lines):
    i = {"n": 0}

    def fake_model(_transcript):
        if i["n"] >= len(lines):
            return '{"tool": "finish", "args": {"text": "stop"}}'
        text = lines[i["n"]]
        i["n"] += 1
        return text

    return fake_model


def run_agent(goal, lines, max_steps=6):
    transcript = [{"role": "user", "content": goal}]
    model = make_model(lines)
    for step in range(1, max_steps + 1):
        raw = model(transcript)
        print("step", step, "model", raw)
        parsed = parse_action(raw)
        transcript.append({"role": "model", "content": raw})
        if not parsed["ok"]:
            obs = {"error": parsed["error"]}
            transcript.append({"role": "tool", "content": obs})
            print("  observe", obs)
            continue
        tool = parsed["tool"]
        args = parsed["args"]
        try:
            result = TOOLS[tool](**args)
        except Exception as exc:
            result = {"error": type(exc).__name__, "detail": str(exc)}
        transcript.append({"role": "tool", "name": tool, "content": result})
        print("  tool", tool, "->", result)
        if tool == "finish":
            print("done")
            break
    else:
        print("stop: budget")
    print("--- transcript ---")
    for row in transcript:
        print(row)
    return transcript


script = [
    '{"tool": "search", "args": {"q": "rain"}}',
    '{"tool": "finish", "args": {"text": "Bring a coat."}}',
]
print("=== run 1 ===")
run_agent("Should I take a coat?", script, max_steps=6)
print("=== run 2 budget ===")
run_agent("Should I take a coat?", script, max_steps=1)
\`\`\`

Run 1 should search, then finish, and print the transcript. Run 2 should stop after one step: **budget**. Raise a bad JSON line in the script and watch the error observation. That is the whole agent: tools, parse, loop, trace, cap.

## How agents use this

You now have the Python core of a tool-using agent: a \`TOOLS\` dict, JSON actions, a fake (then later real) model, a transcript, a finish tool, and a budget. Later tracks plug retrieval, planning, and production into this loop. When a library feels magical, find these objects. They are always there. This is the shape of every later agent lesson.

Swap the fake model for an HTTP POST when you have a laptop, a venv, and a key in the environment. Do not print the key. Keep \`parse_action\`. Keep \`TOOLS\`. Keep \`max_steps\`. Keep printing the trace. The model vendor is a detail. The loop is the product.

If finish never comes, the for-else prints budget and you still have a transcript. That transcript is how you write the next test: copy a failing raw line into \`parse_action\` tests. The mini agent is not the end of Python. It is the first program that behaves like the rest of this academy.

\`\`\`quiz
What should the loop do when it hits max_steps?
- Keep calling the model; it will stop itself
- *Stop, even if the goal is not done
- Delete the transcript
- Install a new package
explain: A budget is a hard stop. Models do not reliably halt. Your Python loop must.
\`\`\`
`,
  },
];
