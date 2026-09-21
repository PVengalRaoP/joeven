import type { RawLesson } from "@/lib/types";

export const tfServe: RawLesson[] = [
  {
    slug: "padding-mask",
    title: "Padding and Masks",
    summary:
      "Batches need equal length. Pad on the right (or left), then mask so attention does not look at pad.",
    minutes: 19,
    level: "intermediate",
    md: `
Training and some local stacks **batch** several sequences. They must have the same length, so shorter rows get **pad** tokens.

Attention must **not** treat pad as content. A **mask** sets those scores to a huge negative number before softmax, the same trick as hiding the future. Forget the mask and the model “attends to pad” and gets dumber in a way that looks like a random seed bug.

**Left pad vs right pad** matters for decoders. Causal models usually want the real tokens packed so the **last** position is the last real token (the one you read logits from). Pad the unused side, then mask it. If you left-pad a decoder and then read logits at the last index, you may be reading a pad position. That is a silent empty generation.

You rarely write the mask by hand on a hosted call. You **do** hit pad bugs when you build a local batcher or a fine-tune collator. This lesson is that collator.

## A wrong picture

A wrong picture is: “pad is empty, so mixing it in is like mixing zeros, harmless.” Pad is a real id with a real embedding row. Even a zero row, if unmasked, dilutes softmax mass. A trained pad row can be worse than zeros. Mask it.

Another wrong picture is: “I can type \`<pad>\` in the prompt to save space.” That is English (or a lookalike), not the pad **id**. Special tokens lesson: do not confuse the string with the id.

A third wrong picture is: “one EOS for the whole batch.” Variable-length generation needs EOS **per row**. A naive loop that waits for the longest answer bills you for pad decode on the finished rows unless the server is clever. Finished rows should stop; siblings may continue.

## Pad for shape, mask for mix

Batch two sequences:

- \`[4, 5, 6]\`
- \`[7, 8]\`

Max length 3. Right pad the second: \`[7, 8, 0]\` if pad id is 0. The tensor is now 2 by 3. Attention on row 1 must block column 2 (the pad). Causal must also block the future. Combined: pad OR future → blocked.

Legal Y marks sit only on real tokens, and never on the future. That combined mask is what production kernels implement.

Left pad would yield \`[0, 7, 8]\` for the short row. Then the last index is a real token, which can be convenient for “read logits at position -1.” You must still mask the leading pad. Mixing left-pad and “read last index” without thinking is how people read pad logits.

## Causal plus pad, in words

For query index \`i\` and key index \`j\` on one row:

- If the key is pad → illegal
- If the query is pad → do not care; you will not use those logits
- If causal and \`j > i\` → illegal
- Else legal

Softmax on illegal scores (huge negative) gives ~0 weight. The mix ignores pad. Residuals still add whatever the layer outputs; if the layer ignored pad, you are safe.

Never generate pad as a content token. EOS ends a row. Pad is for shape.

## Right-pad a batch and print the mask

Lists of integer ids. \`Y\` allowed, \`.\` blocked. Pad id 0.

\`\`\`viz heat
title Short row, right-padded: mask the pad
labels k0 k1 k2
row 1 0 0
row 1 1 0
row 0 0 0
caption Pad is only for batch shape. The last query is pad — do not read logits there.
\`\`\`

\`\`\`tryit python
PAD = 0
seqs = [
    [4, 5, 6],
    [7, 8],
]
max_len = max(len(s) for s in seqs)

def right_pad(s):
    return s + [PAD] * (max_len - len(s))

batch = [right_pad(s) for s in seqs]
print("batch", batch)

def attn_legal(query_i, key_j, seq, causal=True):
    if seq[key_j] == PAD:
        return False
    if causal and key_j > query_i:
        return False
    if seq[query_i] == PAD:
        return False
    return True

seq = batch[1]
print("mask for shorter row", seq)
for i in range(max_len):
    row = [("Y" if attn_legal(i, j, seq) else ".") for j in range(max_len)]
    print("q" + str(i), " ".join(row))
print("long row", batch[0])
for i in range(max_len):
    row = [("Y" if attn_legal(i, j, batch[0]) else ".") for j in range(max_len)]
    print("q" + str(i), " ".join(row))
\`\`\`

The shorter row has pad on the right. Legal Y marks sit only on real tokens, and never on the future. The last query on the short row is pad: all dots. Do not read logits there.

The long row is a causal triangle of Y. That is the decoder picture with no pad.

If loss is weirdly good and generations are garbage, print a batch and look for pad ids inside the “content.” If labels were not masked, the model is rewarded for predicting pad. That collator bug is famous.

## Collator bugs that look like model bugs

- Labels include pad, so loss is easy (predict 0)
- Attention unmasked, so pad dilutes every row
- Left-pad + logits at last index on a short row that was actually right-padded
- EOS missing, so the row never stops and pad decode continues
- Different max length at train vs run, so position tables disagree

Print the batch. Print the mask. Print which index you read logits from. That is the debug ritual. The transformer block is innocent until those prints are clean.

Fine-tunes die here more often than people admit. A LoRA cannot fix a collator that trains on pad.

## Common mistakes

Right-padding a decoder batch and then always reading logits at index \`max_len - 1\`. Short rows are pad there. You sample pad or junk. Read the last **real** token index, or left-pad carefully and still mask.

Masking the future but forgetting pad. Pad sits in the past, so causal allows it. Softmax then mixes pad into every real token. Combined mask: future OR pad.

Training with pad in the label tensor. Loss on “predict pad” is easy. The reported loss looks great. Generation is garbage. Mask labels too.

Using the English string \`<pad>\` as if it were free space in a chat prompt. It is content tiles, or a lookalike of a special, not a shorter window.

Batching two different tasks with different EOS habits and sharing one stop. One row finishes; the other eats pad decode. Per-row EOS.

## How agents use this

You rarely write the mask by hand on a hosted chat call. You **do** hit pad bugs when you build a local batcher or a fine-tune collator. If loss is weirdly good and generations are garbage, print a batch and look for pad ids inside the “content.” If you left-pad a decoder and then read logits at the last index, you may be reading a pad position.

When you pad tool traces to a fixed length for a tiny local model, mask them. When you pack a window (context-window lesson), you are choosing **content**, not pad. Do not pad a prompt with pad ids “to fill 4k.” That is not a packing strategy. That is noise.

- **Pad:** shape only.
- **Mask:** pad out of softmax.
- **Last index:** must be a real token if you read logits there.
- **EOS:** per row, not per batch.
- **Collator:** print ids before you blame the tune.

> **Warning:** Special token pad in the prompt text as English is not the same as the pad id. Do not type it to “save space.”

\`\`\`quiz
What is an attention mask for padding doing?
- Deleting the vocab
- *Stopping pad positions from getting softmax weight so they do not mix into real tokens
- Raising temperature
- Training LoRA
explain: Pad is only for batch shape. The mask keeps it out of the mix.
\`\`\`
`,
  },
  {
    slug: "why-transformers",
    title: "Why Transformers",
    summary:
      "They mix any pair of tokens in one layer and train in parallel over the sequence. That beat RNNs for language.",
    minutes: 20,
    level: "beginner",
    md: `
Before transformers, the default sequence model was an **RNN**: read one token, update a hidden state, read the next. To mix token 1 with token 100, the signal had to survive 99 steps. Training was sequential: you could not compute step 50 before step 49.

Transformers mix **any pair** in one attention layer (in principle). Training scores all positions of the prefix **in parallel** (with the causal mask). Hardware likes that. That is the boring reason they won.

They are not magic at long distance: n² still hurts, and the middle still fades. They are a better default than a vanishing RNN state.

You now have tokens, attention, blocks, residuals, and decoding. This lesson is **why this shape**, so the stack in the next lesson feels inevitable instead of fashionable.

## A wrong picture

A wrong picture is: “transformers won because they understand language.” They won because they **train in parallel** and can **copy in one hop**, at a cost of n². Understanding is a story we tell after the loss falls.

Another wrong picture is: “RNNs cannot do language at all.” They did, for years. They were slower to train on long sequences and worse at long copies. Transformers ate that lunch.

A third wrong picture is: “n² is solved, so architecture no longer matters.” State-space and linear-attention models try to keep the parallel train and drop the n². The stacks you call today are still mostly transformers. Packing still matters.

## Three graphs of mix

**CNN on text:** local window. Token 1 sees 2 and 3, not 100, unless you stack many layers (slow hop).

**RNN:** a chain. Token 100’s hidden state is a function of 1…99 in order. Long copies must survive a long multiply chain. Train step 50 waits on step 49.

**Transformer attention:** a complete graph (minus the causal triangle). Token 100 can match token 1 in **one** layer. Train can score every prefix position at once given the true past (teacher forcing). Complete graphs are expensive. They are also how “the id in the JSON at the start” can copy into the tool call at the end **without** walking a chain of hidden states.

The MLP still thinks **locally** after the mix. The residual stream still carries the original embedding. You already met those parts. The new idea vs RNNs is the **mix any pair** plus **parallel train**.

## A tiny example in words

For length \`n\`:

- RNN steps: \`n\` (must walk the chain)
- Attention pairs: \`n * n\` (or half of that with a causal triangle, still quadratic)
- Train positions in parallel: \`n\` (every prefix slot scored together)

Small \`n\`, RNN looks cheap. Large \`n\`, attention’s pair count explodes, but training still uses the GPU in parallel across positions. That trade is why transformers own language **and** why your 100k dump is expensive.

## Count steps vs pairs vs parallel slots

Print a table of integer costs. No extra libraries.

\`\`\`viz bars
title Mix cost at length 64
bar rnn-steps,64,0
bar attn-pairs,4096,1
bar parallel-slots,64,2
caption RNNs walk a chain. Attention mixes any pair and trains in parallel. That trade is why transformers won language.
\`\`\`

\`\`\`tryit python
def rnn_steps(n):
    return n

def transformer_pairs(n):
    return n * n

def parallel_train_positions(n):
    return n

print("n | rnn steps | attn pairs | train positions in parallel")
for n in (8, 64, 512):
    print(n, rnn_steps(n), transformer_pairs(n), parallel_train_positions(n))
print("RNNs scale with depth of time; attention scales with pairs; training still parallel")
print("causal triangle is about n*(n+1)/2 pairs, still quadratic")
for n in (8, 64, 512):
    print("causal pairs", n, n * (n + 1) // 2)
\`\`\`

RNNs scale with depth of time; attention scales with pairs; training still parallel. The causal triangle is still quadratic. At 512, pairs are already huge compared with 512 RNN steps. Hardware still prefers the transformer train because those pairs are a big matmul, not a 512-step Python loop of hidden states.

When a tool argument must copy a UUID from the user message, attention is the mechanism that can copy it in one hop. When it **fails**, the UUID was too far, too drowned, or split into ugly tokens — not “the RNN died.” Fix the sequence and the tokenizer, then the copy.

## What did not go away

Vanishing long-range mix is **reduced**, not deleted. The middle still fades. Softmax still dilutes. Positions still need a signal. You still pack a window.

CNNs are still useful for local patterns. RNNs still show up in small on-device models. Linear-time sequence models will keep trying to replace n². Your agent-engineering levers stay: tokens, packing, decode policy, adapters. Those levers do not vanish if the mixer changes.

Teacher forcing plus causal mask is why a transformer can train on a whole book in parallel and still be a valid next-token model. That pair (parallel train, honest generate) is the design win.

## Common mistakes

Blaming “the RNN in the API” when a copy fails. Hosted chat is almost never an RNN. The copy failed because tiles split, the id drowned, or it sat in the middle. Reopen those lessons.

Assuming one-hop mix means one-hop **reliability**. In principle any pair can match. In practice softmax shares mass with thousands of other keys. One hop is permission, not a guarantee. Shorten the haystack.

Waiting for linear attention to make packing optional. Even if mix becomes linear, positions and dilution-like effects can remain. Your suitcase policy still pays.

Writing a toy RNN in the live box, seeing it copy a length-4 string, and concluding you do not need attention. Length 4 is not a UUID at position 0 copied into a tool call at position 800. The hop distance is the point.

## How agents use this

When a tool argument must copy a UUID from the user message, attention is the mechanism that can copy it in one hop. When it **fails**, the UUID was too far, too drowned, or split into ugly tokens — not “the RNN died.” Fix the sequence and the tokenizer, then the copy.

Do not wait for a linear-attention product to save a greedy packer. The boring reason transformers won (parallel train, one-hop mix) is also why a fat prompt is a fat matmul. Shorten.

- **One hop:** any pair can match in a layer (in principle).
- **Parallel train:** all prefix positions scored together.
- **n²:** the bill; pack anyway.
- **Not magic:** middle fades; still pack.
- **Copy bugs:** sequence and tiles, not a vanished RNN.

> **Note:** State-space and linear-attention models try to keep the parallel train and drop the n². The stacks you call today are still mostly transformers.

\`\`\`quiz
What is a main training advantage of transformers over classic RNNs?
- They do not need a tokenizer
- *They can score all prefix positions in parallel instead of stepping token by token
- They never use softmax
- They cannot overfit
explain: Attention plus teacher forcing lets hardware compute a whole sequence’s loss at once. RNNs were a time chain.
\`\`\`
`,
  },
  {
    slug: "agent-stack",
    title: "The Stack an Agent Actually Runs",
    summary:
      "One call is tokens, embeddings, blocks, logits, decode, cache. Your job is the sequence and the stop rules.",
    minutes: 22,
    level: "intermediate",
    md: `
You now have the machine. An agent **call** is this pipeline:

1. **Chat template** wraps roles into special tokens
2. **Tokenizer** turns text into ids
3. **Embedding table + positions** turn ids into vectors
4. **N blocks** mix (attention) and think (MLP) with residuals
5. **Unembedding** turns the last vector into logits
6. **Decode** picks a token (greedy for tools, sampled for prose)
7. **KV cache** stores past keys/values; repeat 6 until EOS or stop
8. Ids map back to text (a tool call, a sentence, a refusal)

You do not configure heads at runtime. You configure the **sequence** that becomes step 1–2, the **sampler** at step 6, and the **stop / schema** that ends step 7.

This is the recap lesson. Stay in this track’s lane: the machine. Hosted product choices (which vendor, which price table, which HTTP shape) belong to the next track. Here you assign failures to **named steps**.

## A wrong picture

A wrong picture is: “the model is a blob; when it fails, switch blobs.” Sometimes you should switch size or adapter. Often the failure is packing, template, decode, or stop. Named steps beat blob-swapping.

Another wrong picture is: “I can inspect the residual stream from a typical hosted call.” You cannot. You can always inspect the tokens you sent and the tokens you got. Start there.

A third wrong picture is: “autonomy is temperature.” Autonomy is the loop, the tools, and the stop rules. Temperature is decode noise. You already paid for that lesson. Do not forget it at the recap.

## What you control vs what is frozen

**Frozen in a hosted stack:** vocab, merges, embedding rows, block weights, LayerNorm, head count, RoPE, unembedding. Maybe an adapter you loaded. You do not set LayerNorm \`eps\` per ticket.

**You control:**

- which strings enter the template
- whether the template matches the model
- packing (pin, tail, refuse if must-have does not fit)
- decode policy (greedy tools, milder prose)
- stop / schema / max new tokens
- whether the prefix is byte-stable for the cache
- whether you adapt (SFT / LoRA) on curated data — off to the side, not per request

If those are green and it still fails, **then** change model size, LoRA, or stack. The next track is that product layer.

## Assign the failure to a step

| Symptom | Likely step |
|---|---|
| Forgot the policy | Truncation / packing (1–2), or buried in the middle |
| Invented a tool | Decode + missing schema (6–7), or never in the vocab as a clean name |
| Slow to start | Prefill on a fat prompt (cache / window) |
| Slow to finish | Decode length; missing stop |
| JSON cut in half | Stop string fired inside legal text |
| “Random” dumbness after a tune | Pad mask / collator, or mixed tokenizer |
| Retrieval got dumb | Mixed embedding spaces (table + tokenizer versions) |
| Fluent lie | Objective (pretrain); needs tools, not a larger T |
| Copy UUID failed | Tokens split, drowned, or middle position |

Draw this pipeline on the design doc. Assign each failure to a step. Named steps beat vibes.

## Same observation, different prefix

A cartoon function: pinned spec vs dropped spec. Fake logits over three actions. Lists of strings as toy tiles. No hosted client.

\`\`\`viz flow
title One agent call
layout tb
node tok Tokens
node emb Embed
node blk Blocks
node log Logits
node dec Decode
edge tok emb
edge emb blk
edge blk log
edge log dec
caption You control the sequence, the sampler, and the stop. You do not twiddle heads per ticket.
\`\`\`

\`\`\`tryit python
def agent_call(spec, observation, greedy=True):
    prompt = spec + " | obs: " + observation
    ids = prompt.split()
    print("prompt tokens", len(ids), ids)
    logits = {"search": 1.2, "sql": 2.0, "finish": 0.1}
    if "delete" in observation and "never-delete" in spec:
        logits["sql"] = -2.0
        logits["finish"] = 1.5
    if greedy:
        act = max(logits, key=logits.get)
    else:
        act = "search"
    print("greedy", greedy, "action", act, "logits", logits)
    return act

print("--- spec pinned ---")
agent_call("SPEC never-delete prefer-sql", "user: delete them actually")
print("--- spec dropped ---")
agent_call("chat", "user: delete them actually")
print("--- spec pinned, noisy decode ---")
agent_call("SPEC never-delete prefer-sql", "user: delete them actually", greedy=False)
\`\`\`

Same observation, different prefix. The stack did not grow morals. The **pinned tokens** changed the logits. Noisy decode ignored the better mode and picked search. That is this whole track in one function: sequence, then sampler.

When the spec is dropped, sql can stay the mode and “delete them” looks like a sql job. Pinning flipped finish up and sql down. Packing is safety. Decode is whether you take the mode.

## Checklist before you blame “the model”

- Tokenizer and template match the model
- Spec is pinned and still in the window
- Latest observation is at the end, not drowned
- Tool names decode greedily (or with a grammar)
- Stop rules cannot fire inside legal JSON
- Cache-friendly prefix is stable across turns
- You measured on a frozen eval, not the demo
- Pad/collator is clean if you trained
- Adapter bundle includes tokenizer and template
- Facts that move go to tools/retrieval, not a hope in the weights

If those are green and it still fails, **then** change model size, LoRA, or vendor stack. You earned that move.

## Common mistakes

Skipping the checklist and swapping models first. You spend a week and keep the silent truncation.

Logging only the decoded string. You cannot see whether the pin was present, whether decode was greedy, whether the stop fired early. Log tiles in, tiles out, decode policy, and “was spec prefix still there.”

Treating this recap as an API lesson. HTTP shapes, price tables, and vendor SDKs are the next track. This track is why those calls are slow, why JSON truncates, and why a LoRA did not install a ledger.

Editing the spec to “be helpful” mid-incident. You miss the cache and you move the policy. Freeze the pin. Change the tail.

## How agents use this

Draw this pipeline on the design doc. Assign each failure to a step. “Hallucinated a tool” is often decode + missing schema (step 6–7). “Forgot the policy” is often truncation (step 1–2). “Slow” is often prefill on a fat prompt (cache). Named steps beat vibes.

You cannot inspect the residual stream from a typical hosted call. You can always inspect the tokens you sent and the tokens you got. Start there. Count them. Print the pin. Print the last observation. Print greedy vs sampled. Then change one thing.

The next track is large language models as a **product**: chat wraps, cost, choosing a hosted brain. This track was the engine: tokens, attention, decoding, adapters. Keep the engine picture when the product layer gets loud.

- **Sequence:** template, tokenize, pack.
- **Mix:** embeddings, positions, blocks.
- **Pick:** unembed, decode, stop, cache.
- **Adapt off to the side:** SFT / LoRA, bundled.
- **You:** packing, sampler, stops, evals.

> **Tip:** You cannot inspect the residual stream from a typical hosted call. You can always inspect the tokens you sent and the tokens you got. Start there.

\`\`\`quiz
What is the main thing you control in a hosted transformer agent?
- The number of heads in block 17
- *The token sequence, the sampler, and the stop/schema rules
- The embedding table rows by hand each turn
- LayerNorm eps
explain: Hosted weights are frozen. Your job is packing, decoding, and stopping — then eval.
\`\`\`
`,
  },
];
