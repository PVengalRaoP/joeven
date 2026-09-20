import type { Exercise } from "@/lib/types";

export const exercises: Exercise[] = [
  {
    id: "start-01",
    track: "start",
    title: "Write a goal predicate",
    prompt:
      "goal_satisfied(ticket) is True only if url starts with https:// and the body contains def test_. Fill in the function and print both cases.",
    starter: `def goal_satisfied(ticket: dict) -> bool:
    # TODO: check url and body
    return False

print(goal_satisfied({"url": "https://github.com/x/y/issues/3", "body": "def test_login():\\n    assert True"}))
print(goal_satisfied({"url": "", "body": "please fix"}))
`,
    solution: `def goal_satisfied(ticket: dict) -> bool:
    url = ticket.get("url", "")
    body = ticket.get("body", "")
    return url.startswith("https://") and "def test_" in body

print(goal_satisfied({"url": "https://github.com/x/y/issues/3", "body": "def test_login():\\n    assert True"}))
print(goal_satisfied({"url": "", "body": "please fix"}))
`,
    hint: "Read ticket.get('url') and ticket.get('body'). Both checks must pass.",
    lang: "python",
  },
  {
    id: "start-02",
    track: "start",
    title: "Stop a loop on budget",
    prompt:
      "Run a think-act loop that prints step N until action is stop or steps reach max_steps. The policy returns stop on step 3. Print DONE or BUDGET.",
    starter: `def policy(step):
    return "stop" if step >= 3 else "look"

def run(max_steps=5):
    # TODO: loop, return DONE or BUDGET
    return "TODO"

print(run(5))
print(run(2))
`,
    solution: `def policy(step):
    return "stop" if step >= 3 else "look"

def run(max_steps=5):
    for step in range(1, max_steps + 1):
        action = policy(step)
        print("step", step, action)
        if action == "stop":
            return "DONE"
    return "BUDGET"

print(run(5))
print(run(2))
`,
    hint: "Use for step in range(1, max_steps+1). Break with DONE when policy returns stop.",
    lang: "python",
  },
  {
    id: "start-03",
    track: "start",
    title: "Classify chatbot vs workflow vs agent",
    prompt:
      "kind_of(description) returns chatbot, workflow, or agent. Use simple keyword rules: no side effects → chatbot; known steps → workflow; model chooses next tool → agent.",
    starter: `def kind_of(text: str) -> str:
    t = text.lower()
    # TODO
    return "chatbot"

for row in [
    "User asks a question, model replies, nobody calls APIs",
    "Extract fields then write the database; steps are fixed",
    "Model picks search or sql until the goal is met",
]:
    print(kind_of(row))
`,
    solution: `def kind_of(text: str) -> str:
    t = text.lower()
    if "picks" in t or "chooses" in t or "until the goal" in t:
        return "agent"
    if "then" in t or "steps are fixed" in t or "extract" in t:
        return "workflow"
    return "chatbot"

for row in [
    "User asks a question, model replies, nobody calls APIs",
    "Extract fields then write the database; steps are fixed",
    "Model picks search or sql until the goal is met",
]:
    print(kind_of(row))
`,
    hint: "Check agent keywords first, then workflow (then / fixed steps), else chatbot.",
    lang: "python",
  },
  {
    id: "python-01",
    track: "python",
    title: "Parse a JSON action",
    prompt:
      "parse_action(text) returns a dict with keys tool and args only. Reject extra keys and non-objects. Print the valid action and the error from the bad one.",
    starter: `import json

def parse_action(text):
    # TODO
    return json.loads(text)

print(parse_action('{"tool": "geocode", "args": {"city": "Paris"}}'))
try:
    print(parse_action('{"tool": "geocode", "args": {}, "extra": 1}'))
except Exception as exc:
    print(type(exc).__name__)
`,
    solution: `import json

def parse_action(text):
    obj = json.loads(text)
    if not isinstance(obj, dict) or set(obj.keys()) != {"tool", "args"}:
        raise ValueError("shape")
    if not isinstance(obj["tool"], str) or not isinstance(obj["args"], dict):
        raise ValueError("types")
    return obj

print(parse_action('{"tool": "geocode", "args": {"city": "Paris"}}'))
try:
    print(parse_action('{"tool": "geocode", "args": {}, "extra": 1}'))
except Exception as exc:
    print(type(exc).__name__)
`,
    hint: "After json.loads, assert set(obj) == {'tool', 'args'}.",
    lang: "python",
  },
  {
    id: "python-02",
    track: "python",
    title: "Tool registry dispatch",
    prompt:
      "call(name, args) looks up TOOLS and returns unknown_tool if missing. add(a,b) and finish(answer) are registered. Call add and a fake name.",
    starter: `TOOLS = {
    "add": lambda **kw: kw["a"] + kw["b"],
    "finish": lambda **kw: {"final": kw["answer"]},
}

def call(name, args):
    # TODO
    return TOOLS[name](**args)

print(call("add", {"a": 2, "b": 5}))
print(call("explode", {}))
`,
    solution: `TOOLS = {
    "add": lambda **kw: kw["a"] + kw["b"],
    "finish": lambda **kw: {"final": kw["answer"]},
}

def call(name, args):
    if name not in TOOLS:
        return {"error": "unknown_tool", "name": name}
    if not isinstance(args, dict):
        return {"error": "bad_args"}
    return TOOLS[name](**args)

print(call("add", {"a": 2, "b": 5}))
print(call("explode", {}))
`,
    hint: "Never use globals()[name]. Check name in TOOLS first.",
    lang: "python",
  },
  {
    id: "python-03",
    track: "python",
    title: "Retry on timeout only",
    prompt:
      "flaky() fails with timeout twice then returns ok. retry(fn, n) retries only if the result dict has error == timeout. Print the successful result and call count.",
    starter: `STATE = {"n": 0}

def flaky():
    STATE["n"] += 1
    if STATE["n"] < 3:
        return {"error": "timeout"}
    return {"ok": True}

def retry(fn, n=5):
    # TODO
    return fn()

print(retry(flaky))
print("calls", STATE["n"])
`,
    solution: `STATE = {"n": 0}

def flaky():
    STATE["n"] += 1
    if STATE["n"] < 3:
        return {"error": "timeout"}
    return {"ok": True}

def retry(fn, n=5):
    last = None
    for _ in range(n):
        last = fn()
        if last.get("error") != "timeout":
            return last
    return last

print(retry(flaky))
print("calls", STATE["n"])
`,
    hint: "Loop n times. Return immediately unless error is timeout.",
    lang: "python",
  },
  {
    id: "python-04",
    track: "python",
    title: "Normalize a city name",
    prompt:
      "norm_city collapses case and whitespace so '  PARIS  ' and 'Paris' match the same catalog key.",
    starter: `CITIES = {"paris": {"lat": 48.86}}

def norm_city(city: str) -> str:
    # TODO
    return city

def geocode(city: str):
    return CITIES.get(norm_city(city), {"error": "unknown_city"})

print(geocode("  PARIS  "))
print(geocode("Lyon"))
`,
    solution: `CITIES = {"paris": {"lat": 48.86}}

def norm_city(city: str) -> str:
    return " ".join(city.strip().lower().split())

def geocode(city: str):
    return CITIES.get(norm_city(city), {"error": "unknown_city"})

print(geocode("  PARIS  "))
print(geocode("Lyon"))
`,
    hint: "strip, lower, then split/join to squash repeated spaces.",
    lang: "python",
  },
  {
    id: "math-01",
    track: "math",
    title: "Cosine similarity",
    prompt:
      "Implement cosine(a, b) with stdlib math. Zero-norm vectors return 0.0. Print cosine of [1,0] with [1,0], [0,1], and [0,0].",
    starter: `import math

def cosine(a, b):
    # TODO
    return 0.0

print(round(cosine([1, 0], [1, 0]), 3))
print(round(cosine([1, 0], [0, 1]), 3))
print(round(cosine([0, 0], [1, 1]), 3))
`,
    solution: `import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(a):
    return math.sqrt(sum(x * x for x in a))

def cosine(a, b):
    na, nb = norm(a), norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return dot(a, b) / (na * nb)

print(round(cosine([1, 0], [1, 0]), 3))
print(round(cosine([1, 0], [0, 1]), 3))
print(round(cosine([0, 0], [1, 1]), 3))
`,
    hint: "dot / (norm(a)*norm(b)). Guard both norms.",
    lang: "python",
  },
  {
    id: "math-02",
    track: "math",
    title: "Softmax",
    prompt:
      "softmax(xs) returns a list of probabilities that sum to 1. Use math.exp. Print softmax([1, 1]) and softmax([10, 0]).",
    starter: `import math

def softmax(xs):
    # TODO
    return xs

print(softmax([1, 1]))
print([round(p, 4) for p in softmax([10, 0])])
`,
    solution: `import math

def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    z = sum(exps)
    return [e / z for e in exps]

print(softmax([1, 1]))
print([round(p, 4) for p in softmax([10, 0])])
`,
    hint: "Subtract max(xs) before exp so large logits do not overflow.",
    lang: "python",
  },
  {
    id: "math-03",
    track: "math",
    title: "Binary entropy",
    prompt:
      "entropy_bits(p) is the Shannon entropy of a Bernoulli(p) in bits. Use 0*log(0)=0. Print entropy of 0.5, 0.0, and 0.9 rounded to 3 decimals.",
    starter: `import math

def entropy_bits(p: float) -> float:
    # TODO
    return 0.0

for p in (0.5, 0.0, 0.9):
    print(p, round(entropy_bits(p), 3))
`,
    solution: `import math

def entropy_bits(p: float) -> float:
    if p <= 0.0 or p >= 1.0:
        return 0.0
    q = 1.0 - p
    return -(p * math.log(p, 2) + q * math.log(q, 2))

for p in (0.5, 0.0, 0.9):
    print(p, round(entropy_bits(p), 3))
`,
    hint: "H = -p log2 p - (1-p) log2(1-p). Treat p in {0,1} as 0.",
    lang: "python",
  },
  {
    id: "ml-01",
    track: "ml",
    title: "Train/test split",
    prompt:
      "split(xs, ratio=0.75) returns (train, test) keeping order: first 75% train. Print lengths for 8 items.",
    starter: `def split(xs, ratio=0.75):
    # TODO
    return xs, []

data = list(range(8))
train, test = split(data)
print(len(train), len(test), train, test)
`,
    solution: `def split(xs, ratio=0.75):
    n = int(len(xs) * ratio)
    return xs[:n], xs[n:]

data = list(range(8))
train, test = split(data)
print(len(train), len(test), train, test)
`,
    hint: "n = int(len(xs) * ratio); return xs[:n], xs[n:].",
    lang: "python",
  },
  {
    id: "ml-02",
    track: "ml",
    title: "Accuracy from labels",
    prompt:
      "accuracy(y_true, y_pred) is the fraction of matches. Print accuracy of [0,1,1,0] vs [0,1,0,0].",
    starter: `def accuracy(y_true, y_pred):
    # TODO
    return 0.0

print(accuracy([0, 1, 1, 0], [0, 1, 0, 0]))
`,
    solution: `def accuracy(y_true, y_pred):
    if len(y_true) != len(y_pred) or not y_true:
        raise ValueError("length")
    hits = sum(a == b for a, b in zip(y_true, y_pred))
    return hits / len(y_true)

print(accuracy([0, 1, 1, 0], [0, 1, 0, 0]))
`,
    hint: "Count equal pairs and divide by n. This should print 0.75.",
    lang: "python",
  },
  {
    id: "ml-03",
    track: "ml",
    title: "Mean squared error",
    prompt:
      "mse(y, yhat) is the mean of squared differences. Print mse([2, 2, 2], [0, 2, 4]).",
    starter: `def mse(y, yhat):
    # TODO
    return 0.0

print(mse([2, 2, 2], [0, 2, 4]))
`,
    solution: `def mse(y, yhat):
    n = len(y)
    return sum((a - b) ** 2 for a, b in zip(y, yhat)) / n

print(mse([2, 2, 2], [0, 2, 4]))
`,
    hint: "Errors are -2, 0, +2. Squares 4+0+4, mean 8/3.",
    lang: "python",
  },
  {
    id: "transformers-01",
    track: "transformers",
    title: "Whitespace tokenize",
    prompt:
      "tokenize(text) lowercases and splits on spaces. Detokenize with join. Round-trip a short sentence and print token count.",
    starter: `def tokenize(text):
    # TODO
    return text.split()

def detok(tokens):
    return " ".join(tokens)

toks = tokenize("Hello Agent Loop")
print(toks)
print(len(toks), detok(toks))
`,
    solution: `def tokenize(text):
    return text.lower().split()

def detok(tokens):
    return " ".join(tokens)

toks = tokenize("Hello Agent Loop")
print(toks)
print(len(toks), detok(toks))
`,
    hint: "Use text.lower().split(). Real BPE is harder; this is the classroom tokenizer.",
    lang: "python",
  },
  {
    id: "transformers-02",
    track: "transformers",
    title: "Normalize attention weights",
    prompt:
      "Given raw scores [2, 0, 0], turn them into a probability vector with softmax (math.exp). Print the weights rounded to 3 decimals and check they sum to 1.",
    starter: `import math

def attn(scores):
    # TODO
    return scores

w = attn([2, 0, 0])
print([round(x, 3) for x in w], round(sum(w), 5))
`,
    solution: `import math

def attn(scores):
    m = max(scores)
    exps = [math.exp(s - m) for s in scores]
    z = sum(exps)
    return [e / z for e in exps]

w = attn([2, 0, 0])
print([round(x, 3) for x in w], round(sum(w), 5))
`,
    hint: "Same as softmax. First weight should be near 0.881.",
    lang: "python",
  },
  {
    id: "transformers-03",
    track: "transformers",
    title: "Trim a context window",
    prompt:
      "trim(messages, max_items=3) keeps the first system message (if any) plus the last messages, never exceeding max_items. Print the roles that survive.",
    starter: `msgs = [
    {"role": "system", "content": "json only"},
    {"role": "user", "content": "a"},
    {"role": "assistant", "content": "b"},
    {"role": "user", "content": "c"},
    {"role": "assistant", "content": "d"},
]

def trim(messages, max_items=3):
    # TODO: keep system + newest
    return messages[-max_items:]

print([m["role"] for m in trim(msgs, 3)])
`,
    solution: `msgs = [
    {"role": "system", "content": "json only"},
    {"role": "user", "content": "a"},
    {"role": "assistant", "content": "b"},
    {"role": "user", "content": "c"},
    {"role": "assistant", "content": "d"},
]

def trim(messages, max_items=3):
    if not messages:
        return []
    head = []
    rest = messages
    if messages[0]["role"] == "system":
        head = [messages[0]]
        rest = messages[1:]
        max_items = max(max_items - 1, 0)
    return head + rest[-max_items:]

print([m["role"] for m in trim(msgs, 3)])
`,
    hint: "Peel off messages[0] if role is system, then take rest[-k:]. Expect system, user, assistant.",
    lang: "python",
  },
  {
    id: "llm-01",
    track: "llm",
    title: "Count message tokens (approx)",
    prompt:
      "approx_tokens(messages) is words*1.3 plus 4 per message (role overhead). Print the estimate for a 2-message chat.",
    starter: `def approx_tokens(messages):
    # TODO
    return 0

chat = [
    {"role": "system", "content": "You are terse."},
    {"role": "user", "content": "List three agent stop conditions"},
]
print(approx_tokens(chat))
`,
    solution: `def approx_tokens(messages):
    total = 0
    for m in messages:
        words = len(m["content"].split())
        total += int(words * 1.3) + 4
    return total

chat = [
    {"role": "system", "content": "You are terse."},
    {"role": "user", "content": "List three agent stop conditions"},
]
print(approx_tokens(chat))
`,
    hint: "Loop messages: int(len(split)*1.3)+4.",
    lang: "python",
  },
  {
    id: "llm-02",
    track: "llm",
    title: "Estimate USD cost",
    prompt:
      "cost(in_tokens, out_tokens, in_rate=0.5, out_rate=1.5) uses rates per 1M tokens. Print cost for 2000 in and 400 out, rounded to 6 decimals.",
    starter: `def cost(in_tokens, out_tokens, in_rate=0.5, out_rate=1.5):
    # rates are USD per 1_000_000 tokens
    # TODO
    return 0.0

print(round(cost(2000, 400), 6))
`,
    solution: `def cost(in_tokens, out_tokens, in_rate=0.5, out_rate=1.5):
    return in_tokens * in_rate / 1_000_000 + out_tokens * out_rate / 1_000_000

print(round(cost(2000, 400), 6))
`,
    hint: "Do not use $ { } in f-strings if you print money; concatenate. Formula is n * rate / 1e6.",
    lang: "python",
  },
  {
    id: "llm-03",
    track: "llm",
    title: "Greedy vs sample",
    prompt:
      "pick(logits, greedy=True) returns argmax index, or a weighted sample with random.choices. With seed 0 and greedy False, print both strategies on [0.1, 0.8, 0.1].",
    starter: `import random

def pick(weights, greedy=True):
    # TODO
    return 0

print("greedy", pick([0.1, 0.8, 0.1], True))
random.seed(0)
print("sample", pick([0.1, 0.8, 0.1], False))
`,
    solution: `import random

def pick(weights, greedy=True):
    if greedy:
        return max(range(len(weights)), key=lambda i: weights[i])
    return random.choices(range(len(weights)), weights=weights, k=1)[0]

print("greedy", pick([0.1, 0.8, 0.1], True))
random.seed(0)
print("sample", pick([0.1, 0.8, 0.1], False))
`,
    hint: "Greedy is max index. Else random.choices with weights.",
    lang: "python",
  },
  {
    id: "prompt-01",
    track: "prompt",
    title: "Extract JSON from a fence",
    prompt:
      "extract_json(text) finds the first { and last } and json.loads that slice. Handle a markdown-fenced model reply.",
    starter: `import json

raw = """Sure!
\`\`\`json
{"tool": "search", "args": {"query": "Ada"}}
\`\`\`
"""

def extract_json(text):
    # TODO
    return json.loads(text)

print(extract_json(raw))
`,
    solution: `import json

raw = """Sure!
\`\`\`json
{"tool": "search", "args": {"query": "Ada"}}
\`\`\`
"""

def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end < start:
        raise ValueError("no json")
    return json.loads(text[start : end + 1])

print(extract_json(raw))
`,
    hint: "find('{') and rfind('}'). Do not json.loads the whole prose.",
    lang: "python",
  },
  {
    id: "prompt-02",
    track: "prompt",
    title: "Format a few-shot block",
    prompt:
      "few_shot(examples) joins lines 'Q: ... / A: ...' for a list of (q, a) pairs. Print the block for two examples.",
    starter: `def few_shot(examples):
    # TODO
    return ""

print(few_shot([
    ("Paris weather?", "geocode then weather"),
    ("Unknown city?", "finish cannot:"),
]))
`,
    solution: `def few_shot(examples):
    lines = []
    for q, a in examples:
        lines.append("Q: " + q)
        lines.append("A: " + a)
    return "\\n".join(lines)

print(few_shot([
    ("Paris weather?", "geocode then weather"),
    ("Unknown city?", "finish cannot:"),
]))
`,
    hint: "Loop pairs and append Q: / A: lines, join with newlines.",
    lang: "python",
  },
  {
    id: "prompt-03",
    track: "prompt",
    title: "Build a chat payload",
    prompt:
      "build(system, user) returns a list of two message dicts with roles system and user. Print the roles.",
    starter: `def build(system, user):
    # TODO
    return []

payload = build("JSON only.", "Weather in Oslo?")
print([m["role"] for m in payload], payload[1]["content"])
`,
    solution: `def build(system, user):
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

payload = build("JSON only.", "Weather in Oslo?")
print([m["role"] for m in payload], payload[1]["content"])
`,
    hint: "Two dicts. Never put secrets in system; this exercise is shape only.",
    lang: "python",
  },
  {
    id: "tools-01",
    track: "tools",
    title: "Validate tool args",
    prompt:
      "validate('geocode', args) returns None or an error string. city must be a non-empty str. extra keys fail. Test three payloads.",
    starter: `def validate(name, args):
    # TODO
    return None

print(validate("geocode", {"city": "Paris"}))
print(validate("geocode", {"city": ""}))
print(validate("geocode", {"city": "Paris", "drop": True}))
`,
    solution: `def validate(name, args):
    if not isinstance(args, dict):
        return "not_object"
    if name != "geocode":
        return "unknown_tool"
    if set(args.keys()) != {"city"}:
        return "extra_or_missing"
    city = args.get("city")
    if not isinstance(city, str) or not city.strip():
        return "city"
    return None

print(validate("geocode", {"city": "Paris"}))
print(validate("geocode", {"city": ""}))
print(validate("geocode", {"city": "Paris", "drop": True}))
`,
    hint: "Require exact key set {'city'} then check type/strip.",
    lang: "python",
  },
  {
    id: "tools-02",
    track: "tools",
    title: "Simulate a 429 then succeed",
    prompt:
      "weather() rate-limits the 4th call. RATE_LIMIT=3. Call it 5 times and print error codes or temp.",
    starter: `N = {"k": 0}
RATE = 3

def weather():
    # TODO increment and maybe rate_limit
    return {"temp_c": 18}

for i in range(5):
    print(i + 1, weather())
`,
    solution: `N = {"k": 0}
RATE = 3

def weather():
    N["k"] += 1
    if N["k"] > RATE:
        return {"error": "rate_limit"}
    return {"temp_c": 18}

for i in range(5):
    print(i + 1, weather())
`,
    hint: "Increment a counter in a dict. If k > RATE return rate_limit.",
    lang: "python",
  },
  {
    id: "tools-03",
    track: "tools",
    title: "Allowlist HTTP-like get",
    prompt:
      "http_get(url) only fetches if the host is in ALLOW. Simulate pages as a dict. Try example.com and evil.example.",
    starter: `PAGES = {"https://example.com/a": "hello"}
ALLOW = {"example.com"}

def host(url):
    # naive: https://host/path
    return url.split("/")[2]

def http_get(url):
    # TODO
    return PAGES[url]

print(http_get("https://example.com/a"))
print(http_get("https://evil.example/x"))
`,
    solution: `PAGES = {"https://example.com/a": "hello"}
ALLOW = {"example.com"}

def host(url):
    return url.split("/")[2]

def http_get(url):
    if host(url) not in ALLOW:
        return {"error": "blocked_host", "host": host(url)}
    if url not in PAGES:
        return {"error": "not_found"}
    return {"body": PAGES[url]}

print(http_get("https://example.com/a"))
print(http_get("https://evil.example/x"))
`,
    hint: "Check host before dict lookup. Never fetch first and filter later.",
    lang: "python",
  },
  {
    id: "tools-04",
    track: "tools",
    title: "Idempotent finish",
    prompt:
      "finish(answer) returns the same dict if called twice with the same answer (store last). Print both calls and a changed answer.",
    starter: `LAST = {}

def finish(answer):
    # TODO cache by answer
    return {"final": answer}

print(finish("ok"))
print(finish("ok"))
print(finish("other"))
`,
    solution: `LAST = {}

def finish(answer):
    if LAST.get("answer") == answer:
        return dict(LAST["result"])
    result = {"final": answer}
    LAST["answer"] = answer
    LAST["result"] = result
    return dict(result)

print(finish("ok"))
print(finish("ok"))
print(finish("other"))
`,
    hint: "Cache the last answer. Return a copy so callers cannot mutate the store.",
    lang: "python",
  },
  {
    id: "rag-01",
    track: "rag",
    title: "Chunk on headings",
    prompt:
      "chunk(doc) splits a string on lines that start with '# '. Return a list of {id, heading, text}. Print ids and headings.",
    starter: `DOC = """# Refunds
Refunds take 5-7 days.
# Privacy
Never ask for passwords.
"""

def chunk(doc):
    # TODO
    return []

print([(c["id"], c["heading"]) for c in chunk(DOC)])
`,
    solution: `import re

DOC = """# Refunds
Refunds take 5-7 days.
# Privacy
Never ask for passwords.
"""

def chunk(doc):
    parts = re.split(r"(?m)^# ", doc.strip())
    out = []
    n = 0
    for part in parts:
        part = part.strip()
        if not part:
            continue
        heading, _, body = part.partition("\\n")
        n += 1
        text = heading.strip() + ". " + body.strip()
        out.append({"id": f"chunk-{n:02d}", "heading": heading.strip(), "text": text})
    return out

print([(c["id"], c["heading"]) for c in chunk(DOC)])
`,
    hint: "re.split on ^#  with (?m). partition on newline for heading vs body.",
    lang: "python",
  },
  {
    id: "rag-02",
    track: "rag",
    title: "Retrieve top-k by overlap",
    prompt:
      "retrieve(query, chunks, k=1) ranks by count of overlapping lowercase words. Print the winning id for 'refund days'.",
    starter: `CHUNKS = [
    {"id": "chunk-01", "text": "Refunds take 5-7 business days"},
    {"id": "chunk-02", "text": "Rate limit 60 requests per minute"},
]

def retrieve(query, chunks, k=1):
    # TODO
    return chunks[:k]

print(retrieve("refund days", CHUNKS, 1)[0]["id"])
`,
    solution: `CHUNKS = [
    {"id": "chunk-01", "text": "Refunds take 5-7 business days"},
    {"id": "chunk-02", "text": "Rate limit 60 requests per minute"},
]

def words(text):
    return set(text.lower().replace("-", " ").split())

def retrieve(query, chunks, k=1):
    q = words(query)
    ranked = sorted(chunks, key=lambda c: -len(q & words(c["text"])))
    return ranked[:k]

print(retrieve("refund days", CHUNKS, 1)[0]["id"])
`,
    hint: "Score = len(query_words & chunk_words). Sort descending.",
    lang: "python",
  },
  {
    id: "rag-03",
    track: "rag",
    title: "Refuse below tau",
    prompt:
      "answer(query) retrieves one chunk with overlap score. If best score < 1, refuse with cannot:. Print refund vs equine.",
    starter: `CHUNKS = [
    {"id": "chunk-01", "text": "Refunds take 5-7 business days"},
]

def score(query, text):
    return len(set(query.lower().split()) & set(text.lower().split()))

def answer(query, tau=1):
    # TODO
    return "TODO"

print(answer("refunds days"))
print(answer("equine dental"))
`,
    solution: `CHUNKS = [
    {"id": "chunk-01", "text": "Refunds take 5-7 business days"},
]

def score(query, text):
    return len(set(query.lower().split()) & set(text.lower().split()))

def answer(query, tau=1):
    best = max(CHUNKS, key=lambda c: score(query, c["text"]))
    s = score(query, best["text"])
    if s < tau:
        return {"answer": "cannot: not in handbook", "refused": True, "score": s}
    return {"answer": best["text"], "citations": [best["id"]], "refused": False, "score": s}

print(answer("refunds days"))
print(answer("equine dental"))
`,
    hint: "Compute overlap; if s < tau return cannot: not in handbook.",
    lang: "python",
  },
  {
    id: "agents-01",
    track: "agents",
    title: "Parse a ReAct triple",
    prompt:
      "parse_react(text) returns {thought, tool, args} from Thought/Action/Action Input lines. Search args is {query: input}.",
    starter: `text = """Thought: look it up
Action: search
Action Input: Ada Ortiz founder
"""

def parse_react(text):
    # TODO
    return {}

print(parse_react(text))
`,
    solution: `import re

text = """Thought: look it up
Action: search
Action Input: Ada Ortiz founder
"""

def parse_react(text):
    thought = re.search(r"Thought:\\s*(.*)", text).group(1).strip()
    action = re.search(r"Action:\\s*(\\w+)", text).group(1).strip()
    inp = re.search(r"Action Input:\\s*(.*)", text, re.S).group(1).strip()
    args = {"query": inp} if action == "search" else {"raw": inp}
    return {"thought": thought, "tool": action, "args": args}

print(parse_react(text))
`,
    hint: "Three regexes. Action Input can be the rest of the string.",
    lang: "python",
  },
  {
    id: "agents-02",
    track: "agents",
    title: "Tiny tool loop",
    prompt:
      "fake_model geocodes first, then finishes. run_agent prints each tool name and returns the final answer for Paris.",
    starter: `TOOLS = {
    "geocode": lambda **kw: {"lat": 48.86, "name": kw["city"]},
    "finish": lambda **kw: {"final": kw["answer"]},
}

def fake_model(transcript):
    # TODO: geocode then finish
    return {"tool": "finish", "args": {"answer": "todo"}}

def run_agent(goal):
    transcript = [{"role": "user", "content": goal}]
    # TODO loop max 4
    return "missing"

print(run_agent("Paris"))
`,
    solution: `TOOLS = {
    "geocode": lambda **kw: {"lat": 48.86, "name": kw["city"]},
    "finish": lambda **kw: {"final": kw["answer"]},
}

def fake_model(transcript):
    if not any(t.get("name") == "geocode" for t in transcript):
        return {"tool": "geocode", "args": {"city": "Paris"}}
    geo = next(t["content"] for t in transcript if t.get("name") == "geocode")
    return {"tool": "finish", "args": {"answer": geo["name"] + " at " + str(geo["lat"])}}

def run_agent(goal):
    transcript = [{"role": "user", "content": goal}]
    for _ in range(4):
        action = fake_model(transcript)
        result = TOOLS[action["tool"]](**action["args"])
        print(action["tool"], result)
        transcript.append({"role": "tool", "name": action["tool"], "content": result})
        if action["tool"] == "finish":
            return result["final"]
    return "budget"

print(run_agent("Paris"))
`,
    hint: "If no geocode event yet, geocode. Else finish using that observation.",
    lang: "python",
  },
  {
    id: "agents-03",
    track: "agents",
    title: "Citation subset check",
    prompt:
      "valid_finish(payload, opened) is True iff citations is a subset of opened and, when cannot_answer, citations is empty.",
    starter: `def valid_finish(payload, opened):
    # TODO
    return False

opened = {"https://wiki.example/acme"}
print(valid_finish({"cannot_answer": False, "citations": ["https://wiki.example/acme"]}, opened))
print(valid_finish({"cannot_answer": False, "citations": ["https://evil.example"]}, opened))
print(valid_finish({"cannot_answer": True, "citations": []}, opened))
`,
    solution: `def valid_finish(payload, opened):
    cites = payload.get("citations") or []
    if payload.get("cannot_answer"):
        return cites == []
    if not cites:
        return False
    return all(url in opened for url in cites)

opened = {"https://wiki.example/acme"}
print(valid_finish({"cannot_answer": False, "citations": ["https://wiki.example/acme"]}, opened))
print(valid_finish({"cannot_answer": False, "citations": ["https://evil.example"]}, opened))
print(valid_finish({"cannot_answer": True, "citations": []}, opened))
`,
    hint: "Use all(url in opened for url in cites). Abstain requires empty citations.",
    lang: "python",
  },
  {
    id: "agents-04",
    track: "agents",
    title: "Cannot-answer on max steps",
    prompt:
      "run(max_steps) always searches (never finishes). When the budget hits, return cannot: step budget. Print that string.",
    starter: `def run(max_steps=3):
    for step in range(max_steps):
        print("search", step + 1)
        # never finishes
    # TODO return cannot
    return "I guess Ada Ortiz"

print(run())
`,
    solution: `def run(max_steps=3):
    for step in range(max_steps):
        print("search", step + 1)
    return "cannot: step budget"

print(run())
`,
    hint: "Do not invent an answer after the loop. Return cannot: step budget.",
    lang: "python",
  },
  {
    id: "multiagent-01",
    track: "multiagent",
    title: "Allowlisted patch",
    prompt:
      "apply_patch(repo, role, path, content) only allows coder → src/app.py. Planner writing src must error. Print both outcomes.",
    starter: `ALLOW = {"coder": {"src/app.py"}, "planner": {"PLAN.md"}}

def apply_patch(repo, role, path, content):
    # TODO
    repo[path] = content
    return {"ok": True, "repo": repo}

repo = {"src/app.py": "x", "PLAN.md": ""}
print(apply_patch(dict(repo), "coder", "src/app.py", "y")["ok"])
print(apply_patch(dict(repo), "planner", "src/app.py", "hack")["ok"])
`,
    solution: `ALLOW = {"coder": {"src/app.py"}, "planner": {"PLAN.md"}}

def apply_patch(repo, role, path, content):
    if path not in ALLOW.get(role, set()):
        return {"ok": False, "error": "forbidden_path", "repo": repo}
    nxt = dict(repo)
    nxt[path] = content
    return {"ok": True, "repo": nxt}

repo = {"src/app.py": "x", "PLAN.md": ""}
print(apply_patch(dict(repo), "coder", "src/app.py", "y")["ok"])
print(apply_patch(dict(repo), "planner", "src/app.py", "hack")["ok"])
`,
    hint: "Copy the repo. Reject if path not in ALLOW[role].",
    lang: "python",
  },
  {
    id: "multiagent-02",
    track: "multiagent",
    title: "Fizzbuzz test oracle",
    prompt:
      "run_tests(src) execs source in a tiny namespace and checks 3→Fizz, 5→Buzz. Print ok for a correct function and a stub.",
    starter: `CASES = [(3, "Fizz"), (5, "Buzz"), (1, "1")]

def run_tests(src):
    # TODO exec and score
    return {"ok": False}

stub = "def fizzbuzz(n):\\n    return str(n)\\n"
good = "def fizzbuzz(n):\\n    if n % 3 == 0: return 'Fizz'\\n    if n % 5 == 0: return 'Buzz'\\n    return str(n)\\n"
print(run_tests(stub)["ok"], run_tests(good)["ok"])
`,
    solution: `CASES = [(3, "Fizz"), (5, "Buzz"), (1, "1")]
SAFE = {"str": str, "int": int}

def run_tests(src):
    ns = {"__builtins__": SAFE}
    try:
        exec(src, ns, ns)
        fn = ns["fizzbuzz"]
    except Exception as exc:
        return {"ok": False, "errors": [str(exc)]}
    errors = []
    for n, want in CASES:
        got = fn(n)
        if got != want:
            errors.append((n, got, want))
    return {"ok": not errors, "errors": errors}

stub = "def fizzbuzz(n):\\n    return str(n)\\n"
good = "def fizzbuzz(n):\\n    if n % 3 == 0: return 'Fizz'\\n    if n % 5 == 0: return 'Buzz'\\n    return str(n)\\n"
print(run_tests(stub)["ok"], run_tests(good)["ok"])
`,
    hint: "exec into a dict, call fizzbuzz, compare CASES. Stub should be False, good True.",
    lang: "python",
  },
  {
    id: "multiagent-03",
    track: "multiagent",
    title: "Supervisor stop on green",
    prompt:
      "next_role(tests_ok, had_plan) returns planner if no plan, coder if plan and not green, stop if tests_ok. Print the three cases.",
    starter: `def next_role(tests_ok, had_plan):
    # TODO
    return "coder"

print(next_role(False, False))
print(next_role(False, True))
print(next_role(True, True))
`,
    solution: `def next_role(tests_ok, had_plan):
    if tests_ok:
        return "stop"
    if not had_plan:
        return "planner"
    return "coder"

print(next_role(False, False))
print(next_role(False, True))
print(next_role(True, True))
`,
    hint: "Check tests_ok first so a green repo never plans forever.",
    lang: "python",
  },
  {
    id: "eval-01",
    track: "eval",
    title: "Pass rate",
    prompt:
      "pass_rate(rows) where each row is {pass: bool}. Print pass_rate of [T, T, F] as a fraction string and a float.",
    starter: `def pass_rate(rows):
    # TODO
    return 0.0

rows = [{"pass": True}, {"pass": True}, {"pass": False}]
print(pass_rate(rows))
`,
    solution: `def pass_rate(rows):
    if not rows:
        return 0.0
    hits = sum(1 for r in rows if r.get("pass"))
    return hits / len(rows)

rows = [{"pass": True}, {"pass": True}, {"pass": False}]
print(pass_rate(rows))
print(sum(r["pass"] for r in rows), "/", len(rows))
`,
    hint: "hits / n. Should be 0.666....",
    lang: "python",
  },
  {
    id: "eval-02",
    track: "eval",
    title: "Golden tool sequence",
    prompt:
      "matches(names, golden) is True if the list of tool names equals the golden list. Test Paris vs a skipped-weather trace.",
    starter: `def matches(names, golden):
    # TODO
    return names == []

print(matches(["geocode", "weather", "finish"], ["geocode", "weather", "finish"]))
print(matches(["geocode", "finish"], ["geocode", "weather", "finish"]))
`,
    solution: `def matches(names, golden):
    return list(names) == list(golden)

print(matches(["geocode", "weather", "finish"], ["geocode", "weather", "finish"]))
print(matches(["geocode", "finish"], ["geocode", "weather", "finish"]))
`,
    hint: "Exact list equality. Do not use sets; order matters.",
    lang: "python",
  },
  {
    id: "eval-03",
    track: "eval",
    title: "Quarantine flaky rows",
    prompt:
      "score(rows) ignores rows with quarantine True when computing pass_rate. Print rate for one fail, one pass, one quarantined fail.",
    starter: `def score(rows):
    # TODO skip quarantine
    return 0.0

rows = [
    {"id": "a", "pass": False, "quarantine": False},
    {"id": "b", "pass": True, "quarantine": False},
    {"id": "c", "pass": False, "quarantine": True},
]
print(score(rows))
`,
    solution: `def score(rows):
    active = [r for r in rows if not r.get("quarantine")]
    if not active:
        return 0.0
    return sum(1 for r in active if r["pass"]) / len(active)

rows = [
    {"id": "a", "pass": False, "quarantine": False},
    {"id": "b", "pass": True, "quarantine": False},
    {"id": "c", "pass": False, "quarantine": True},
]
print(score(rows))
`,
    hint: "Filter quarantine first. Rate should be 0.5, not 1/3.",
    lang: "python",
  },
  {
    id: "prod-01",
    track: "prod",
    title: "Redact API keys",
    prompt:
      "redact(text) replaces tokens that start with sk- and are 8+ chars with sk-***. Print the redacted log line.",
    starter: `import re

def redact(text):
    # TODO
    return text

print(redact("key=sk-demo123 billed=ok"))
`,
    solution: `import re

def redact(text):
    return re.sub(r"sk-[A-Za-z0-9]{6,}", "sk-***", text)

print(redact("key=sk-demo123 billed=ok"))
`,
    hint: "re.sub on sk- plus six or more alphanumerics.",
    lang: "python",
  },
  {
    id: "prod-02",
    track: "prod",
    title: "Approval digest",
    prompt:
      "digest(proposal) is sha256 of canonical JSON (sort_keys) of id, tool, args. Print 12-char prefixes for a proposal and a tampered copy; they must differ.",
    starter: `import hashlib
import json

def digest(proposal):
    # TODO
    return ""

p = {"id": "act-01", "tool": "rollback_deploy", "args": {"to": "d43"}}
q = {"id": "act-01", "tool": "rollback_deploy", "args": {"to": "d0"}}
print(digest(p)[:12])
print(digest(q)[:12])
print(digest(p) == digest(q))
`,
    solution: `import hashlib
import json

def digest(proposal):
    payload = {"id": proposal["id"], "tool": proposal["tool"], "args": proposal["args"]}
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode()).hexdigest()

p = {"id": "act-01", "tool": "rollback_deploy", "args": {"to": "d43"}}
q = {"id": "act-01", "tool": "rollback_deploy", "args": {"to": "d0"}}
print(digest(p)[:12])
print(digest(q)[:12])
print(digest(p) == digest(q))
`,
    hint: "json.dumps(..., sort_keys=True) then sha256 hexdigest.",
    lang: "python",
  },
  {
    id: "prod-03",
    track: "prod",
    title: "Trace an event",
    prompt:
      "trace_event(step, tool, ok) returns a dict with those fields plus ts index from a counter. Print two events.",
    starter: `CLOCK = {"t": 0}

def trace_event(step, tool, ok):
    # TODO
    return {}

print(trace_event(1, "get_metrics", True))
print(trace_event(2, "rollback_deploy", False))
`,
    solution: `CLOCK = {"t": 0}

def trace_event(step, tool, ok):
    CLOCK["t"] += 1
    return {"ts": CLOCK["t"], "step": step, "tool": tool, "ok": ok}

print(trace_event(1, "get_metrics", True))
print(trace_event(2, "rollback_deploy", False))
`,
    hint: "Increment CLOCK['t'] each call. Include step, tool, ok.",
    lang: "python",
  },
  {
    id: "prod-04",
    track: "prod",
    title: "Fail closed without approval",
    prompt:
      "execute(mutate, approval) applies rollback only if approval is allow. WORLD deploy_id starts at d44. Print status and deploy_id for missing vs allow.",
    starter: `WORLD = {"deploy_id": "d44"}

def execute(approval):
    # TODO
    WORLD["deploy_id"] = "d43"
    return "applied"

print(execute(None), WORLD["deploy_id"])
WORLD["deploy_id"] = "d44"
print(execute("allow"), WORLD["deploy_id"])
`,
    solution: `WORLD = {"deploy_id": "d44"}

def execute(approval):
    if approval != "allow":
        return "needs_approval"
    WORLD["deploy_id"] = "d43"
    return "applied"

print(execute(None), WORLD["deploy_id"])
WORLD["deploy_id"] = "d44"
print(execute("allow"), WORLD["deploy_id"])
`,
    hint: "Return needs_approval before touching WORLD when approval is missing.",
    lang: "python",
  },
];
