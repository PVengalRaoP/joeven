import type { RawLesson } from "@/lib/types";

export const llmOutput: RawLesson[] = [
  {
    slug: "structured-output",
    title: "Structured Output",
    summary:
      "JSON, validation, and a short retry — how agents return actions instead of essays. Never exec the string.",
    minutes: 22,
    level: "intermediate",
    md: `
Agents need **actions**, not vibes. The reliable way is **structured output**: the model must emit data that your code can parse and check against a schema. A schema is a list of fields, types, and allowed values. Free prose is for the user. Tool choice, arguments, and “final vs continue” are for parsers.

If you parse English with a pile of regexes, you will eventually execute a sentence you did not intend. If you \`eval\` the string as Python because it “looks like code,” you handed the model a shell. This site’s live boxes, and your production executor, should never \`exec\` model text.

## The loop

1. Ask for JSON (prompt + vendor \`response_format\` / tool-calling if available).
2. Parse (\`json.loads\`, after stripping a markdown fence if you must).
3. Validate types, enums, ranges, extra keys, missing keys.
4. On failure: **retry once** with the validator’s error, or hand off.
5. Never execute a string the model labeled python.

Vendor-native **tool calling** is structured output with extra ceremony: the model emits a function name and argument object the API already parsed. Prefer that when you can. Still validate. Vendors are not your type checker. \`job_id: -1\` can be perfect JSON.

Constrained decoding (JSON schema, vendor \`response_format\`) makes invalid tokens unlikely. Use it. It does not validate **business** rules. Your validator still runs.

Ask for **less**. Two fields parse more often than twelve optional ones. Optional fields become hallucinations: the model fills them because the schema made them legal, not because the user provided them.

## Repair vs refuse

Models wrap JSON in markdown fences, add trailing commas, or use single quotes. You can strip fences. You should not write a heroic repair parser that guesses keys. Repair is how you execute a poisoned id. Two retries max, then a deterministic fallback (handoff). Send the **schema error**, not “be better.”

**Typed** fields: ids are ints or uuid strings, not “the latest one.” Enums beat free text for actions. If the action is not in \`{"get_job", "finish", "abstain"}\`, it is not an action.

\`\`\`viz flow
title Actions, not essays
layout lr
node ask Ask JSON
node parse Parse
node check Validate
node retry Retry once
edge ask parse
edge parse check
edge check retry
caption Never exec the string. Two retries max, then hand off. Vendors are not your type checker.
\`\`\`

\`\`\`tryit python
import json

SCHEMA_KEYS = {"action", "job_id"}
ACTIONS = {"get_job", "finish"}

def validate(obj):
    if not isinstance(obj, dict):
        return "not an object"
    extra = set(obj) - SCHEMA_KEYS
    missing = SCHEMA_KEYS - set(obj)
    if extra:
        return "extra keys: " + str(sorted(extra))
    if missing:
        return "missing keys: " + str(sorted(missing))
    if obj["action"] not in ACTIONS:
        return "bad action"
    if not isinstance(obj["job_id"], int) or obj["job_id"] < 0:
        return "bad job_id"
    return None

def parse_model_text(text):
    try:
        obj = json.loads(text)
    except json.JSONDecodeError as e:
        return None, "json error: " + e.msg
    err = validate(obj)
    return (obj, None) if not err else (None, err)

def run_with_retry(raw_outputs):
    errors = []
    for i, raw in enumerate(raw_outputs, start=1):
        obj, err = parse_model_text(raw)
        print("attempt", i, "raw", raw, "->", err or obj)
        if not err:
            return obj
        errors.append(err)
    return {"action": "finish", "job_id": 0, "handoff": True, "errors": errors}

script = [
    "Sure, let's get_job(17)",
    '{"action": "get_job", "job_id": 17}',
]
print("result", run_with_retry(script))
\`\`\`

Attempt 1 is prose; you get a json error. Attempt 2 is a dict with \`get_job\` and \`17\`. \`result\` is that dict. If both failed, you would get \`handoff: True\` instead of a guessed tool. That fallback is the product. Guessing \`get_job\` from the English of attempt 1 would have worked *this* time and failed on “Sure, let's delete_job(17).”

Log parse failures as their own metric. If 8% of calls fail JSON, you have a prompt, a model-size, or a temperature problem — the user did not type the JSON, the policy did.

## Native tools vs JSON in prose

If the vendor returns \`tool_calls\`, do not also regex the assistant prose for JSON. Two channels will disagree. Prefer native. If you only have prose, require **one** object, no chatter, temperature 0 (next lesson). Strip a single markdown fence around the object if present; if you see two objects, fail.

Fences: models like to wrap JSON in a markdown code block. Strip a leading fence line and a trailing fence line, then parse. If after stripping you still have English before the first brace, fail — do not search for the first \`{\` in a paragraph that also contains an example object. Heroic brace-slicing is how you execute the example instead of the action.

Enums and ranges: \`action\` must be in a frozen set. \`job_id\` must be an int >= 0 (or a UUID string with a regex you wrote). Coercing \`"17"\` to 17 is a product choice; coercing \`"seventeen"\` is a guess. Document the choice. Default: refuse strings for int fields.

Retry body: second call messages include a user or tool-style note with the **exact** validator string (\`missing keys: job_id\`). Do not say “please output valid JSON.” The model already tried to be valid. The error is the missing key.

## A walkthrough: extra keys

The schema has \`action\` and \`job_id\`. The model adds \`comment": "user seemed angry"\`. Extra keys fail validation. You could strip extras. Stripping is how a sneaky \`confirm: true\` survives if you later add that field carelessly. **Reject extras** unless you have a documented bag for notes that **code never executes**.

## What goes wrong

- \`eval\` or \`exec\` on model text.
- Infinite retry with the same prompt.
- Optional fields that the model fills with invented amounts.
- Accepting \`job_id\` as a string \`"seventeen"\`.
- Repair parsers that swap digits to “make JSON work.”
- Using an LLM-as-judge to “fix” JSON instead of a schema error string. Costly and circular.

## How agents use this

Every tool argument hits the real world. Schema validation is an eval you run **in the hot path**. Two retries max, then hand off. Store validator errors on the trace. Temperature 0 for JSON steps. Native tool-calling when you can.

Unit-test \`validate\` with extras, missing keys, negative ids, and a fence-wrapped object. Unit-test \`run_with_retry\` with the prose-then-JSON script. You do not need a live model to prove the parser is strict.

Log \`parse_ok\` on the span. Alert if the fail rate leaves your baseline. The fix is usually temperature, a tighter schema, native tools, or a smaller set of fields — not a larger model that essays more confidently.

> **Tip:** Send the schema error, not “be better.” Never execute a string the model labeled python. Ask for fewer fields.

\`\`\`quiz
What should happen when JSON validation fails twice?
- eval() the text as Python
- *Retry budget exhausted: hand off or fail closed, do not guess an action
- Increase temperature to 2
- Drop the system prompt
explain: Invalid structure is not a tool call. Guessing is how you take the wrong action. eval is a shell. Temperature 2 makes JSON worse.
\`\`\`
`,
  },
  {
    slug: "finish-reason",
    title: "Finish Reason",
    summary:
      "stop, length, tool_calls, content_filter — read this before you blame the weights or parse truncated JSON.",
    minutes: 19,
    level: "beginner",
    md: `
Every completion ends for a **reason**. If you ignore it, truncated JSON looks like a stupid model, and a filter looks like an empty bug. The vendor tells you why it stopped. Believe that field before you swap networks.

| Reason | Meaning | First move |
|---|---|---|
| \`stop\` | Hit a stop sequence or natural end | Parse as usual |
| \`length\` | Hit \`max_tokens\` | Do not parse as complete JSON. Grow the cap or shrink the prompt. |
| \`tool_calls\` | Native tools were emitted | Validate each call. Do not also regex the prose. |
| \`content_filter\` | Safety blocked | Refuse / handoff. Empty is not JSON. |

Reserve space before you call: \`window - prompt_tokens - margin >= max_tokens\`. If that fails, **shrink the prompt** first. Raising \`max_tokens\` when the window is already full just fails in a different way (or the vendor truncates the *prompt*, which is worse: your spec falls off the front).

\`n=3\` completions triple the output bill. Use them for offline eval, not the hot path, unless you have a measured win. Finish reason applies to **each** choice if you sample many.

## Length is a budget, not a personality

A cut-off \`{"action": "get_job", "job_id": 1\` is not a model that “doesn’t know JSON.” It is a cap. First: treat as truncated. Then: raise \`max_tokens\` **or** shrink what you asked for (shorter reasoning, smaller schema, less chatter in the spec). Then parse again. Do not lower yourself into regex salvage on the fragment.

If the vendor supports parallel tool calls, validate **each** argument object. One valid call plus one malformed call is not a pass. Partial application is how you refund the customer and fail to log it.

\`\`\`viz bars
title Finish reason is an instrument
bar stop,12,2
bar length,3,1
bar filter,1,0
caption A cut-off JSON is often a budget, not a dumb model. Branch on this field before you blame the weights.
\`\`\`

\`\`\`tryit python
def finish_reason(completion, max_tokens, stop):
    words = completion.split()
    for i, w in enumerate(words):
        if w == stop:
            return "stop", " ".join(words[:i])
        if i + 1 >= max_tokens:
            return "length", " ".join(words[:max_tokens])
    return "stop", completion

def looks_json(text):
    t = text.strip()
    return t.startswith("{") and t.endswith("}")

raw = '{ "action": "get_job", "job_id": 17'
reason, text = finish_reason(raw, max_tokens=6, stop="END")
print("reason", reason, "text", text, "valid", looks_json(text))

raw2 = '{ "action": "get_job", "job_id": 17 } END extra'
reason2, text2 = finish_reason(raw2, max_tokens=50, stop="END")
print("reason", reason2, "text", text2.strip(), "valid", looks_json(text2))
\`\`\`

The first call hits the word budget before a closing brace: \`reason\` is \`length\`, \`valid\` is \`False\`. The second hits the stop word \`END\` with a complete object: \`stop\` and \`valid\` True. Always branch on finish reason before you blame weights. The first call looks like a broken model. It is a **budget**.

Stop sequences cut off when the model starts imitating your scaffold (\`User:\`, \`END\`). They are useful. They can also clip JSON if you chose a stop that appears inside a string. Pick stops that cannot appear in arguments.

## Window math before you call

You need three numbers: context window, prompt tokens (estimate or tokenizer), \`max_tokens\`. Leave a **margin** (a few hundred tokens) so the vendor does not silently drop the end of the prompt. If \`prompt + max_tokens + margin > window\`, shrink the prompt in \`build_context\` (later packing lesson) **before** you raise \`max_tokens\`. Raising the completion budget into a full window is how the spec falls off.

Tool steps should use a small \`max_tokens\` (a few hundred). Final prose can be larger. A global 4096 is a latency and cost bug that *also* hides length errors on JSON (the object fits, then the model keeps talking until the cap, and you parse a truncated essay after the JSON). Prefer stop-after-object via native tools or a stop sequence.

If \`finish_reason\` is missing (some stream disconnects), treat it as unknown: do not parse as complete JSON unless you have a valid object **and** you are willing to accept a truncated tail. Default: truncated.

Parallel tool calls: \`finish_reason=tool_calls\` plus three argument objects. Validate each. If the second is malformed, do not execute the first if they were meant as a transaction. If they are independent reads, you may run the valid reads and return an error payload for the broken one — write that policy down. Default for money: all-or-nothing.

## Dashboards

Store finish_reason on the trace. Dashboard: percent \`length\`, percent \`filter\`, percent \`stop\`, percent \`tool_calls\`. A spike in \`length\` is a packing or cap bug. A spike in \`filter\` is a prompt or user-mix bug. Neither is “we need a bigger model” until you check.

If \`tool_calls\` arrives with empty arguments, that is still a parse problem, not a reason to read the prose channel.

## What goes wrong

- **Parsing length-truncated JSON** and filling defaults.
- **Ignoring tool_calls** and reading “I’ll call get_job” from content.
- **Raising max_tokens to 4096** “just in case,” then paying for novels (decoding knobs next).
- **No margin** between prompt size and window, so the vendor silently drops the spec.
- **Blaming the model** on a day the length rate jumped after someone added a 2k few-shot.
- **Parsing \`stop\` JSON that is missing a closing brace** because “it is close enough.” Close enough is a guess.

## How agents use this

\`handle_response\` (previous lesson) already branched filter vs length vs ok. Wire \`length\` to a single retry with more room **or** a packer that drops RAG, then give up. Never retry length seven times with the same prompt.

Tests: truncated fixture must not call a tool; complete JSON with \`stop\` may. Store the reason on the span next to usage. If parallel \`tool_calls\` arrive, fail the step if any argument object fails validation — do not apply the valid ones and skip the broken one when the broken one was \`refund\`.

A length spike after a spec PR is packing, not a new vendor. Check \`max_tokens\` and prompt size on the same dashboard before you file a model bug.

Reserve window margin in \`complete()\` so you never send a prompt that cannot also hold the completion. If the packer cannot make it fit, fail closed — do not POST and hope.

> **Note:** \`n=3\` triples the output bill. Use it for offline eval, not the hot path, unless you measured a win. Score with your validator, not with another LLM judge, unless you have measured the judge.

\`\`\`quiz
The model returned cut-off JSON and finish_reason=length. What first?
- Switch vendors immediately
- *Treat it as a truncated completion: raise max_tokens or shrink the prompt, then parse again
- Set temperature to 2
- Delete stop sequences and hope
explain: length means the token cap, not necessarily a stupid model. Temperature 2 and vendor-hopping do not close a brace.
\`\`\`
`,
  },
  {
    slug: "decoding-knobs",
    title: "Decoding Knobs",
    summary:
      "Temperature, max tokens, and stop sequences — the runtime policy around the same weights. Wrong knobs look like model failures.",
    minutes: 20,
    level: "beginner",
    md: `
You already saw temperature in the Transformers track as a math knob on next-token scores. In an API, it is a **product knob**, sitting next to \`max_tokens\`, stop sequences, and sometimes seed, top_p, and penalties. Wrong knobs look like model failures. They are often configuration.

Change **one** knob per eval run. If you twist temperature and top_p and the spec on the same day, you will not know what fixed JSON.

## Temperature and top_p

For **tool calls and JSON**, use temperature **0** (or the vendor’s minimum) and native structured output. For **user-facing prose**, 0.3–0.7 is a common band. Above 1.0 is a party trick, not an agent policy.

If you set temperature **and** a tight top_p, you can accidentally **double-cut** the tail. \`top_p=0.9\` keeps the smallest set of tokens whose probabilities sum to 90% and drops the rest. Combined with temperature 0 it does almost nothing (the mass is already a spike). Combined with temperature 1.5 it is the only thing between you and noise. Change one variable at a time on an eval set.

This lesson will not re-teach softmax. You need the product rule: **JSON wants argmax-like decoding. Creativity belongs in user-facing prose, if anywhere.**

## max_tokens and stops

\`max_tokens\` is the **completion** budget, not the window. A 128k window with \`max_tokens=16\` still cannot emit a long JSON object. A 8k window with \`max_tokens=4096\` can ramble until you pay for the tail.

Stop sequences cut off when the model starts imitating your scaffold (\`User:\`). Frequency and presence penalties reduce repetition in stories. They can also wreck code and repeated ids (\`job_id\` mentioned twice). For agents, prefer stop sequences, max tokens, and lower temperature — not a penalty that fights legitimate repetition.

Seeds are **best effort**, not a scientific guarantee under load. Evals should tolerate small drift or use greedy plus structured tools. Do not advertise “deterministic” to legal if the vendor says seed is best effort.

Store knobs **per step type**: router temperature 0, writer 0.5, tool \`max_tokens\` 200, final 800. One global temperature for the whole agent is how JSON grows poetry. When latency spikes, check whether \`max_tokens\` is 4096 “just in case” — you pay for the long tail of rambling, and you wait for it if you are not streaming.

\`\`\`viz plot
title JSON wants a peak; prose can share
xlabel temperature T
ylabel P(top tool)
fn peak 1/(1+exp(-2.4/x)) 0.15 2.2
caption Near T=0 the mode owns the mass. Store knobs per step type, not one global temperature.
\`\`\`

\`\`\`tryit python
def pick(weights, greedy):
    if greedy:
        return weights.index(max(weights))
    total = sum(weights)
    acc = 0.0
    cut = 0.35 * total
    for i, w in enumerate(weights):
        acc += w
        if acc >= cut:
            return i
    return len(weights) - 1

logits = [0.1, 0.8, 0.1]
print("greedy (JSON tools)", pick(logits, True))
print("sample (prose)", pick(logits, False))
print("store knobs per step type, not one global temperature")
\`\`\`

Greedy picks index 1 (the 0.8 peak) — the JSON/tool default. The toy sample walks until it passes 35% of the mass and may pick an earlier, less likely index. The numbers are a cartoon of temperature vs argmax, not a vendor-accurate sampler. The print line is the policy: **per step type**. A router and a poet should not share a config struct.

## Penalties, n, and eval

Presence/frequency penalties fight loops in stories. They also fight legitimate repetition of \`job_id\`. Leave them off for tool steps unless you measured a win.

\`n>1\` is an eval trick: generate several completions, score with **your validator**, pick a winner. Using another LLM as a judge is a later, loaded choice (Eval track). Do not do it on the hot path by default.

## What goes wrong

- **Playground defaults** copied into prod (temperature 1, max tokens huge).
- **Creative JSON.** Extra keys, invented enums.
- **Stops that appear inside URLs or JSON strings.**
- **Tuning knobs instead of the spec** when the model lacks a tool.
- **Declaring reproducibility** from a seed on a busy hosted API.

## How agents use this

A config map: \`step_kind -> {temperature, max_tokens, stop, top_p}\`. Tool kinds: 0 and 200. Writer kinds: 0.5 and 800. Log knobs on the span with the model name. When JSON fail rate spikes, look at knobs **and** spec version before you swap vendors.

Tests do not need a real sampler. Tests need: the HTTP wrapper actually sends temperature 0 on tool steps. A miswired default is a common bug.

Do not copy playground defaults. Playgrounds are for humans exploring. Agents are a policy. If a new hire pastes \`temperature: 1\` because the docs example used it, your JSON step is now a creative writer. Code review the knobs like you review SQL.

top_p: leave it unset (vendor default) unless you have a measured reason. Setting 0.9 and temperature 0 is cargo cult. Setting 0.9 and temperature 1.5 is a sampler you must eval. Penalties: off for tools. Seeds: log them if you send them; do not promise bit-identical replays on a hosted API.

Latency: \`max_tokens\` is an upper bound the model can use. Some vendors bill only what was produced; you still **wait** through a ramble if you are not streaming and you asked for 4096. Tool steps should not wait on a novel.

Store knobs per step kind in config, not in comments in a notebook. When JSON fails, diff knobs on the span against last week’s baseline before you blame the weights. A Tuesday bump in temperature is a deploy, not a mystery.

JSON steps: temperature 0, small \`max_tokens\`, native schema if you have it. Prose steps: a modest temperature, a larger cap, stops that match your scaffold. Never one global struct named \`LLM_DEFAULTS\` copied from a playground.

> **Note:** Change one knob per eval run. \`n>1\` is for offline eval unless you measured a hot-path win. For agents, prefer stop sequences and max tokens over frequency penalties.

\`\`\`quiz
Default temperature for emitting tool JSON?
- 1.5 so the agent is creative
- *0 (or the vendor minimum), plus a schema
- Whatever the playground default is
- Negative
explain: Tool calls need argmax-like decoding. Creativity belongs in user-facing prose, if anywhere. Playground defaults are not a policy. Temperature is not negative.
\`\`\`
`,
  },
];
