import type { RawLesson } from "@/lib/types";

export const tfTokens: RawLesson[] = [
  {
    slug: "tokens",
    title: "Tokens",
    summary:
      "Models do not read letters or words. They read tokens — small pieces with integer ids.",
    minutes: 20,
    level: "beginner",
    md: `
A language model does not see letters the way you do. It does not see words the way a dictionary does either. It sees **tokens**: small pieces of text, each stuck to an integer **id**. The rest of this track — attention, decoding, adapters — all starts from that list of ids. Cost, context limits, copy bugs, and many “the model cannot spell” complaints start here too.

Think of a token as a **tile**. Some tiles are whole common words. Some tiles are pieces like \`ing\` or \`##tion\`. Some tiles are a single character or even a single byte. The model only knows the tile **number**. It does not “read English.” It looks up row 17 in a table, then row 4, then row 881, and mixes those rows.

If you skip this lesson, later lessons will sound like magic. They are not. A transformer is a machine that maps a **sequence of token ids** to scores for the **next** token id. Everything you type, every tool name, every JSON key, first becomes ids.

## A wrong picture

A wrong picture is: “the model reads characters, so length in letters is the budget.” Letters are not the budget. **Token count** is the budget. A short-looking JSON blob can be many tokens. A long-looking English sentence can be fewer.

Another wrong picture is: “the model reads words, so \`refunds\` and \`refund\` are the same idea.” In a word table they would be **different ids** with no shared pieces. Subword tokens are the compromise that lets \`refund\` and \`refunds\` share a stem tile.

A third wrong picture is: “any tokenizer is fine; they all split text the same way.” They do not. Two models with two tokenizers cannot share embedding rows. Count cost with tokenizer B while you embed with tokenizer A, and the number will lie.

## Characters vs words vs tokens

| Unit | What you get | The problem |
|---|---|---|
| **Characters** | \`c\`, \`a\`, \`t\` | Sequences get very long. The model must learn that those three tiles are one word. |
| **Words** | \`refunds\` as one id | The table explodes. New spellings have no id. \`refund\` and \`refunds\` do not share a row. |
| **Subword tokens** | common words stay whole; rare words split | A finite table that can still write new words as pieces |

English prose is often about **four characters per token**. That is a rumor people repeat, not a law. Code, JSON, URLs, and other languages can be much worse. \`{"job_id": 17}\` is not “four words.” Quotes, braces, colons, and digits often become their own tiles.

Leading spaces matter. \` refund\` (space plus word) and \`refund\` (no space) are often **different ids**. So are \`Refund\` and \`refund\`. The tokenizer is picky about the exact bytes you send, not the “meaning” you had in mind.

## A tiny example in words

Take the string \`please refund invoice 17\`.

- As **characters**, you have every letter and the spaces. That is a long list.
- As **words** split on spaces, you have four pieces: please, refund, invoice, 17.
- As a **toy subword** rule “keep words, split digits,” you keep the three English words and break \`17\` into \`1\` and \`7\`. That is five tiles.

A real tokenizer is closer to the third story, with a trained list of tiles instead of our toy rule. The number 17 might stay one tile if it was common in training, or split if it was not. You cannot know without **that** tokenizer.

JSON is worse than English. The characters \`{\`, \`"\`, \`_\`, \`: \` each tend to cost. A tool result that dumps a whole table is not “a short message.” It is a pile of punctuation tiles.

## Count three ways on the same string

This box does not run a real tokenizer. It shows why the **unit** you count changes the number. Lists of pieces are the point.

\`\`\`viz strip
title Toy tiles for “please refund invoice 17”
chip please
chip refund
chip invoice
chip 1
chip 7
caption Words stay whole. The number splits. Real tokenizers sit between characters and words.
\`\`\`

\`\`\`tryit python
text = "please refund invoice 17"
chars = list(text)
words = text.split()
pieces = []
for w in words:
    if w.isdigit():
        pieces.extend(list(w))
    else:
        pieces.append(w)
json_text = '{"job_id": 17}'
print("text", text)
print("char count", len(chars))
print("char list", chars[:8], "...")
print("word count", len(words))
print("word list", words)
print("toy piece count", len(pieces))
print("toy pieces", pieces)
print("json char count", len(list(json_text)))
print("json chars", list(json_text))
\`\`\`

You should see more characters than words. The toy pieces sit in the middle: four words, but \`17\` splits, so five pieces. The JSON string is short to a human and long as a character list because almost every symbol is a separate tile in this toy. Real tokenizers sit between characters and words — and JSON still hurts.

Change \`17\` to \`invoice\`. The toy piece count drops because nothing is digits. Change the text to a UUID-like string such as \`a1b2c3d4\`. If you treat the whole thing as one “word,” the toy stays one piece; a real byte-level tokenizer will smash it into many tiles. That is the production surprise.

## What an id actually is

After tokenization you do not keep the strings. You keep **integers**. Token \`refund\` might be id 4481 in one vocab and id 902 in another. The model’s first layer is “return row number 4481.” There is no extra English sitting beside the number.

A **vocabulary** is the finite list of tiles the tokenizer knows. Typical sizes are tens of thousands to a few hundred thousand. Every id you send must be in that range. If you invent an id, you are pointing at a random row or crashing the lookup.

Two models cannot share those rows unless they share the tokenizer (and usually the whole embedding table). Mixing is not “close enough.”

## Why the count is never just English

- **Whitespace:** two spaces, a tab, a newline — different bytes, often different tiles.
- **Case:** \`SQL\` and \`sql\` may be different ids.
- **Code:** names like \`get_job\` can split on the underscore into several tiles. \`getJob\` camel-case can split at the case change.
- **Numbers:** long integers and timestamps often split digit by digit or in small groups.
- **Other languages:** a “short” sentence in a language that was rarer in training can use many more tiles than English of the same meaning.

That last point is fairness and cost together. A user who writes in a language that tokenizes “badly” burns the window faster. The model is not “worse at their language” only because of training data. The **budget** is also tighter.

## How agents use this

Log **token counts**, not character counts. When you trim a transcript, trim tokens. When you design a tool name or a JSON key, short names are runway, not style. \`get_job\` that splits into five tiles is harder to copy faithfully than a name that stays one or two tiles.

Filters that look at “words” miss jailbreaks that split across tokens. A banned string can be one word to you and three tiles to the model, or the other way around. Safety checks that only search the raw string still matter, but they are not the same as “what the model saw.”

When you compare two prompts, compare tokenized length with **the same tokenizer the model uses**. A “shorter” prompt in characters can be longer in tiles.

Count tool results before you stuff them back into the next prompt. Paste one real tool payload into a tokenizer once. The number will hurt. Then you will stop returning whole SQL tables.

- **Budget:** every step of an agent loop pays tokens in plus tokens out.
- **Window:** context is a token suitcase, not a page count.
- **Names:** tool names and enum values that tokenize cleanly are easier to emit.
- **Trim:** drop stale tool dumps by token budget, not by “it looks short.”
- **Debug:** if the model “forgets” a policy, first check whether that policy is still in the token window.

> **Tip:** Paste one real tool result into a tokenizer playground once. The number will hurt. Then you will stop returning whole SQL tables.

\`\`\`quiz
Why do modern language models use subword tokens instead of whole words?
- Words cannot be stored on disk
- *A word table cannot handle new or rare spellings; subwords reuse pieces and keep the table finite
- Characters are illegal in UTF-8
- Token ids only work for English
explain: Subword tokenizers keep a fixed table but can still represent unseen words as pieces.
\`\`\`
`,
  },
  {
    slug: "bpe",
    title: "Byte Pair Encoding",
    summary:
      "BPE starts from characters and glues frequent pairs into new tokens. That merge list is the tokenizer.",
    minutes: 21,
    level: "beginner",
    md: `
**Byte Pair Encoding (BPE)** is the usual recipe behind subword tokens. It is not a neural net. It is a **compression-style loop** that builds a tile list from data, then a **fixed procedure** that splits new text using that list.

Start from characters (or from raw **bytes**). Count which two neighbors sit next to each other most often. **Glue** that pair into a new token. Repeat. After enough merges, \`ing\` might be one token, \`attention\` might be two, and your company name might be twelve because it never appeared in the training corpus.

The trained tokenizer is a **vocab** plus a **merge list**. Encoding a new string means: split to bytes (or characters), then apply the merges **in the order they were learned**. Decoding joins the pieces back to text. There is no “understanding” in this step. There is only “which pair was glued first.”

If two products use different merge lists, the same sentence becomes different id sequences. Few-shot examples copied from one model onto another are then **off-distribution**, even if the English looks identical to you.

## A wrong picture

A wrong picture is: “BPE reads English and picks words.” It never sees a dictionary. It only sees frequent neighbor pairs in the training bytes. \`the\` is a token because those letters sat together often, not because someone labeled it a word.

Another wrong picture is: “once trained, BPE still counts pairs on every new sentence and invents new tiles.” At **train** time you count and glue. At **use** time you only apply the saved merge list. A brand-new company name does not get a new row. It gets split into old pieces.

A third wrong picture is: “unknown words crash the model.” Byte-level BPE can always fall back to raw bytes, so there is no true unknown tile. The cost is that ugly strings become **many** tokens. That is a feature for coverage and a tax for UUIDs, hashes, and base64.

## The loop in words

1. Start with a sequence of tiny tiles (characters or bytes).
2. Count adjacent pairs. Find the pair that appears most often.
3. Replace every run of that pair with a new tile name (the two pieces stuck together).
4. Repeat until you have enough merges (often tens of thousands).
5. Save the vocab and the ordered merge list.

To **encode** later: split the new text the same way you started, then walk the merge list from first merge to last. If a pair is present, glue it. If not, leave it. You are replaying history, not inventing.

To **decode**: concatenate the tile strings (careful with the special spaces some tokenizers store on the tile). You should get the original bytes back. If you do not, the tokenizer is broken or you stripped a special token you should not have.

Cousins exist. **WordPiece** scores pieces a bit differently. **Unigram** starts from a large set and prunes. Same job: a finite table that can still write new words. You do not need to implement them. You need to know they are not interchangeable with your BPE list.

## A tiny example in words

Corpus: \`low lower newest newest\` as characters, including spaces.

Early merges often glue space-plus-letter or common letter pairs. Frequent pairs like \`e s\` or \`s t\` show up because \`newest\` appears twice. After a few glues, you will see longer chunks in the sequence and a smaller tile count.

That is the whole idea. Real BPE does this on billions of bytes. Your five-step toy is the same loop with a tiny corpus.

## Glue the most common pair, five times

This toy counts pairs with a counter, glues the winner, and prints the sequence. It uses lists of characters, not a neural net.

\`\`\`viz loop
title Glue the most common pair
step Count pairs
step Glue winner
step Shorter list
caption Start from letters. Stick frequent neighbors together. Repeat. That merge list is the tokenizer.
\`\`\`

\`\`\`tryit python
from collections import Counter

def pair_counts(seq):
    return Counter(zip(seq, seq[1:]))

def merge(seq, pair, new_tok):
    out = []
    i = 0
    while i < len(seq):
        if i < len(seq) - 1 and (seq[i], seq[i + 1]) == pair:
            out.append(new_tok)
            i += 2
        else:
            out.append(seq[i])
            i += 1
    return out

text = "low lower newest newest"
seq = list(text)
print("start n", len(seq))
print("start", seq)
for step in range(1, 6):
    pair, n = pair_counts(seq).most_common(1)[0]
    name = pair[0] + pair[1]
    seq = merge(seq, pair, name)
    print("step", step, "glue", pair, "count", n, "new", name, "n", len(seq))
print("result n", len(seq))
print("result", seq)
\`\`\`

Frequent pairs glue first. Watch the length drop. The printed \`result\` list is still readable as glued chunks. Real BPE trains many more steps and uses bytes, so you would not recognize every tile as an English syllable. The loop you ran **is** the idea.

If you change the corpus to one rare name repeated, that name’s letters will glue into a long tile. If the name never repeats, it stays shattered. That is why internal product names tokenize “badly” until they appear often in the tokenizer’s training data — which they usually do not.

## Bytes, not letters

Modern BPE is often **byte-level**. The starting alphabet is 256 byte values, not “English letters.” That means any Unicode string can be encoded. Emoji, Chinese, broken UTF-8 — all become bytes, then merges.

Coverage is complete. Efficiency is not equal. A language or a symbol set that was rare in the merge-training data will need more tiles for the same meaning. A UUID is almost all unique bytes. Merges barely help. Base64 is a pile of almost-random characters. Same tax.

Stop strings interact with this. If you stop generation when a certain English phrase appears, you must think in **tiles**, not in Python \`in\` on the decoded string only. A stop phrase can sit across a tile boundary. Decode, then search, or tokenize the stop string and match ids — but know which one your stack does.

## How agents use this

If two stacks tokenize \`getUserById\` differently, copied few-shot tool traces will not match. Pin the model and its tokenizer together. Do not mix id sequences from two vocabs.

When a stop string must not appear inside JSON, tokenize that stop string and check. A quote or a brace that is a stop tile will cut the model off mid-argument.

Chinese, code, request ids, and stack traces are token-heavy. A “short” error payload can still blow the budget. Count it. Truncate with a tokenizer, not with \`text[:500]\` characters.

Company names, SKUs, and camel-case APIs will split. If the model must copy them exactly, put them in a short, loud place in the prompt (you will see why after positions and attention). If you can rename a tool to something that stays one or two tiles, do it.

- **Pin:** model, vocab, merge list, chat wrapping — one bundle.
- **Ugly strings:** UUIDs and hashes are many tiles; summarize or hash them yourself before prompting.
- **Stop:** define stops that cannot appear in legal tool JSON.
- **Names:** prefer token-cheap tool names if you control the schema.

> **Note:** WordPiece and Unigram are cousins. Same job: a finite table that can still write new words.

\`\`\`quiz
What does one BPE merge do?
- Deletes rare words from English
- *Glues the most common neighboring pair into a new token
- Trains the attention heads
- Converts ids into logits
explain: BPE repeatedly replaces the most frequent adjacent pair with a new symbol. That is how subwords are born.
\`\`\`
`,
  },
  {
    slug: "special-tokens",
    title: "Special Tokens",
    summary:
      "Pad, end, and chat-role markers are extra rows in the table. Agents live and die by them.",
    minutes: 19,
    level: "beginner",
    md: `
Most tokens stand for pieces of English or code. **Special tokens** stand for **structure**: start, stop, pad, “this is the user,” “this is a tool result.” They are extra rows in the embedding table, with ids like every other tile. The model does not know they are “special” except that training kept showing them in the same jobs.

If production injects a token the model never trained on, that row is random noise wearing a hat. If production **drops** a token the model always saw between roles, you are speaking a dialect the fine-tune never saw.

Chat models were trained on a **chat template**: a wrapping of special tokens plus punctuation around each turn. The wrapping is part of the language. Skipping it is not a style choice. It is a different language.

## A wrong picture

A wrong picture is: “the model reads the words user and assistant in English, so I can write them however I like.” Role markers are usually **reserved ids**, not the English words. Writing \`User:\` as plain text is not the same as the \`<user>\` id the template uses (the real strings differ by model).

Another wrong picture is: “pad is just empty space, so attending to it is harmless.” Pad is a real id with a real row. If you forget the mask, the model mixes that row into every token. Generations get dumber in a way that looks like a random seed bug.

A third wrong picture is: “I can strip special tokens from logs to make them pretty, then replay the call from the pretty log.” Replay needs the **ids** (or a faithful detokenize that puts specials back). Pretty logs that drop role markers cannot rebuild the prompt.

## The usual cast

| Token | Job |
|---|---|
| **PAD** | Fill a batch so rows have equal length; attention should ignore it |
| **BOS / start** | “A sequence begins” |
| **EOS / stop** | “I am done generating” |
| **UNK** | Unknown piece (byte-level BPE often skips this) |
| **Role markers** | user / assistant / system / tool |

Some stacks add **begin-tool** and **end-tool**, or a reserved name for each function. Those ids are part of the **contract**. A prompt that says “call tools as JSON” in English, without the tokens the model was trained on, is a different language. The model might still emit JSON because pretraining saw JSON. It will not match the tool protocol it was aligned to.

Never type the letters \`<pad>\` into a prompt to “save space.” That is English (or a lookalike string), not the pad **id**. The pad id is for batching. It is not a compression trick.

## A tiny example in words

Toy vocab: pad=0, eos=1, user=2, assistant=3, refund=4, now=5.

A user turn “refund now” becomes ids like \`[2, 4, 5, 1]\`: role, two content tiles, end. An assistant turn “refund” becomes \`[3, 4, 1]\`. Concatenate them and you have a tiny chat.

The model does not “know” roles as English. It knows **ids**. Swap the user id and the assistant id and you have asked it to continue as the customer.

If you forget eos, the model may keep going into the next role. If you put eos in the middle of a tool argument, you cut the call off. Stop rules and specials are the same family of bug.

## Encode two turns as ids

This toy uses a tiny lookup both ways: string to id, id to string. Lists of integers are what a real model would see.

\`\`\`viz strip
title Two chat turns as ids
chip user
chip refund
chip now
chip eos
chip assistant
chip refund
chip eos
caption Role markers are extra rows, not the English words “user” and “assistant.” Swap them and you asked it to continue as the customer.
\`\`\`

\`\`\`tryit python
stoi = {
    "<pad>": 0,
    "<eos>": 1,
    "<user>": 2,
    "<assistant>": 3,
    "refund": 4,
    "now": 5,
}
itos = {i: t for t, i in stoi.items()}

def encode_turn(role, text):
    rid = stoi["<" + role + ">"]
    ids = [rid]
    for w in text.split():
        ids.append(stoi[w])
    ids.append(stoi["<eos>"])
    return ids

ids = encode_turn("user", "refund now") + encode_turn("assistant", "refund")
print("ids", ids)
print("tokens", [itos[i] for i in ids])
swapped = encode_turn("assistant", "refund now") + encode_turn("user", "refund")
print("swapped ids", swapped)
print("swapped tokens", [itos[i] for i in swapped])
print("pad id", stoi["<pad>"], "must not be generated")
print("eos id", stoi["<eos>"], "ends the turn")
\`\`\`

The first id list should start with 2 (user) and later include 3 (assistant). The swapped list flips those role ids. Same English words, different structure. That is enough to change the next-token scores in a real model.

Print the tokens back with \`itos\` whenever you debug. Humans read strings. The stack reads ids. You need both views.

## Templates are not decoration

A chat template decides:

- which specials wrap the system spec
- whether a newline sits before the assistant id
- whether a trailing assistant marker is added so the model continues in the right role
- how tool results are wrapped

If you build a prompt by concatenating \`"user: " + text\` and skip the template, you are off-distribution. If you mix two templates across turns, you are also off-distribution. Pin the template to the model version.

When you add a stop sequence, make sure it cannot appear inside a legal tool argument. A stop on \`}\` will kill JSON early. A stop on a role marker is common and safer if that marker cannot appear in arguments.

Padding ids in the **prompt** without a mask means the model attends to pad. That looks like a random bug. It is a mask bug. The padding-and-masks lesson later in this track shows the picture.

## How agents use this

Never strip special tokens from logs if you need to replay a call. Store the wrapped prompt or enough structure to rebuild it. Pin the chat template to the model version. When the model updates, re-check the template; silent wrap changes look like “the model got worse.”

If you build a stop sequence, test it against a legal tool call. If the stop fires inside a string field, you will ship truncated JSON and then blame the model.

Do not invent extra specials at runtime. You cannot add a \`<customer_vip>\` id and expect a trained row. Put VIP in the text (or in a tool result) using tokens the model already has.

- **Replay:** keep role markers.
- **Pin:** template plus tokenizer plus weights.
- **Stop:** cannot fire inside legal JSON.
- **Roles:** swapping user and assistant in the wrap is a different request.
- **Pad:** never generate it; always mask it.

> **Warning:** Padding ids in the prompt without a mask means the model attends to pad. That looks like a random bug. It is a mask bug.

\`\`\`quiz
What is a chat template for?
- Speeding up the hardware
- *Wrapping roles and turns in the special tokens the model was trained to expect
- Deleting the system prompt
- Training BPE from scratch
explain: Chat models learned a specific wrapping. Skip it and you are off-distribution.
\`\`\`
`,
  },
  {
    slug: "embedding-table",
    title: "The Embedding Table",
    summary:
      "Token id to vector: a lookup table that is the first layer of every transformer.",
    minutes: 20,
    level: "beginner",
    md: `
After tokenization you have integers. Neural nets want **vectors**: lists of numbers. The **embedding table** is a matrix with one row per vocabulary item. Token id 17 means “return row 17.”

That is not a metaphor. The first layer of a GPT-style model is an array lookup. Learning embeddings means **moving those rows** so tokens used in similar contexts sit nearby. You already met that geometry on the math and ML tracks. Here it is tied to **ids**.

If the table is 50,000 tokens by 768 dimensions, that is already tens of millions of numbers **before** any attention layer. Tokenizer choice is an architecture choice. Change the vocab and you change which rows exist. You do not “just retokenize” a trained table.

## A wrong picture

A wrong picture is: “the embedding is the meaning of the word, stored as text.” It is a list of floats. You cannot read it. You can only compare it, add it, or send it into the next layer.

Another wrong picture is: “two models with 768-d rows live in the same space.” Dimension match is necessary, not sufficient. The axes mean different things. Mixing rows from two tables is how retrieval “gets dumb.”

A third wrong picture is: “one-hot is totally different from an embedding.” A one-hot vector **is** an embedding: huge, sparse, all at right angles. A learned table is small, dense, and shares structure. That compression is the point. Lookup of a learned row is what production uses.

## The lookup in words

Vocab size \`V\`. Width \`d\`. Table shape \`V\` by \`d\`. Token id \`i\` (an integer from 0 to \`V-1\`) returns row \`i\`, a list of \`d\` numbers.

No multiply is required for the lookup itself. Later layers will multiply. The embedding step is **index, copy row**.

Training nudges the numbers in those rows. Tokens that appear in similar neighbors move toward each other. \`refund\` and \`invoice\` might share a direction after training. \`please\` might sit elsewhere. Pad should stay a row you **mask**, not a row you treat as content.

Some models **tie** the embedding table to the output map (the unembedding you will meet later). Then the same numbers go **id to vector** and **vector to id scores**. A tokenizer change is a full retrain, not a config flag.

A production sentence embedder is usually a full transformer whose last hidden states (often pooled) become the vector you store. The table lookup is still the **first** move inside that embedder. Do not confuse “the embedding table row for one token” with “the vector for a whole chunk.” Agents that store memory usually store the second kind, which still depends on the first.

## A tiny example in words

Toy table, width 3:

- pad: \`[0.0, 0.0, 0.0]\`
- refund: \`[0.1, 0.0, 0.9]\`
- invoice: \`[0.0, 0.1, 0.8]\`
- please: \`[0.5, 0.5, 0.1]\`
- now: \`[0.4, 0.6, 0.0]\`

The sentence \`please refund invoice\` becomes ids, then three lists of numbers. Mean-pool those three lists (add, divide by 3) and you get one 3-d summary. That summary is a toy document vector. Real systems may pool, or use the last token, or use a special pool token. The idea is the same: ids became lists of numbers, then we mixed the lists.

Refund and invoice both have a large last slot in this toy. Please does not. A later attention layer (next part of the track) can use that.

## Lookup rows, then mean-pool

Lists of numbers only. No extra libraries. Print ids, tokens, rows, and the mean.

\`\`\`viz grid
title Toy embedding table (one row per token)
labels d0 d1 d2
row 0.0 0.0 0.0
row 0.1 0.0 0.9
row 0.0 0.1 0.8
row 0.5 0.5 0.1
caption Row 0 is pad. Billing tokens share a large last slot. Lookup is “return that id’s row.”
\`\`\`

\`\`\`tryit python
stoi = {"<pad>": 0, "refund": 1, "invoice": 2, "please": 3, "now": 4}
itos = {i: t for t, i in stoi.items()}

table = [
    [0.0, 0.0, 0.0],
    [0.1, 0.0, 0.9],
    [0.0, 0.1, 0.8],
    [0.5, 0.5, 0.1],
    [0.4, 0.6, 0.0],
]

def encode(text):
    return [stoi[w] for w in text.split()]

ids = encode("please refund invoice")
vecs = [table[i] for i in ids]
print("ids", ids)
print("tokens", [itos[i] for i in ids])
for i, v in zip(ids, vecs):
    print(itos[i], v)
pooled = [sum(row[d] for row in vecs) / len(vecs) for d in range(3)]
print("mean pool", [round(x, 3) for x in pooled])
pad_row = table[0]
print("pad row", pad_row)
print("width", len(table[1]), "vocab", len(table))
\`\`\`

You should see three ids, three tokens, and three rows. Mean pool prints a 3-number list that sits between please and the two billing-ish rows. Pad is all zeros in this toy. If you accidentally include pad in a mean without masking, you pull the mean toward zero. That is a real bug in clumsy pooling.

Change the sentence to \`please now\`. The pool should move toward the first two slots, away from the large third slot that refund and invoice owned. Same table, different ids, different list of numbers.

## Size, tying, and mixing

The table is often one of the largest single parameter blocks in a small model. Wider models (bigger \`d\`) make every row longer. Bigger vocabs make more rows. Byte-level vocabs that include many specials still have a finite \`V\`.

Tied input/output embeddings save parameters and couple “what this token looks like” with “when we predict this token.” Untied maps can be more flexible and more expensive. You do not pick this per request. You pick it when you train.

When you **cache** vectors for retrieval, you cache a bundle: tokenizer version, model version, and any instruction prefix the embedder prepends. Change any of them and old vectors live in a different space. Mixing spaces looks like “retrieval got dumb.” It got **incompatible**.

The pad row should be ignored later by an attention mask. If you forget the mask, the model attends to zeros (or to whatever pad trained to be) and gets dumber. Masks are not optional decoration.

## How agents use this

When you store memory as vectors, store **(tokenizer, model, prefix)** next to the floats. If any of those change, rebuild the index. Do not average vectors from two embedders. Same length is not the same space.

Token embeddings (one row per id) are not chunk embeddings (one vector per paragraph). RAG memory is usually chunk embeddings from a full model. Generation still begins with token rows. Both depend on the tokenizer. Both break if you mix versions.

If a tool name tokenizes into five ids, that is five rows mixed by attention before the model can “hold” the name. Prefer names that stay few tiles, as the tokens lesson said. The table cannot invent a row you did not train.

- **Lookup:** id in, list of numbers out. That is layer zero.
- **Cache key:** tokenizer + model + prefix, not only the text.
- **Pool:** do not mean-pool pad.
- **Mix:** never mix two tables.
- **Tie:** a vocab change may mean a full retrain.

> **Note:** The pad row should be ignored later by an attention mask. If you forget the mask, the model attends to zeros and gets dumber.

\`\`\`quiz
What does an embedding table do?
- Compresses the hardware
- *Maps a token id to a vector by returning that id's row
- Deletes rare words
- Computes softmax
explain: Embedding is a lookup: id in, vector out. Training moves the rows.
\`\`\`
`,
  },
  {
    slug: "positions",
    title: "Positions",
    summary:
      "Without a position signal, a transformer is a bag of tokens. Order is how 'pay now' differs from 'now pay'.",
    minutes: 21,
    level: "intermediate",
    md: `
Attention (next lessons) looks at **which** tokens are present and how their vectors match. By itself, classic attention does not know **where** they sat. Without a position signal, “pay the invoice tomorrow” and “tomorrow pay the invoice” are the same bag of rows.

Agents would not know whether the latest tool result is at the end or buried in the middle. Order is not a stylistic extra. Order is how “never delete” at the start can still lose to “delete them” at the end — and how a model can tell those two clauses apart at all.

**Positional encodings** mark the index. Old models added a **learned table** (one vector per position) or a sine/cosine pattern. Many modern models use **RoPE** (rotary embeddings): they rotate query and key vectors by an angle that depends on position, so the **dot product** cares about relative distance.

You do not need the trigonometry. You need the contract: **same tokens, different order, different meaning.**

## A wrong picture

A wrong picture is: “the model reads left to right like a person, so it must know order.” The mix inside a layer is a set of weighted sums. Without a position mark, the mix is a bag. Causal masking (later) hides the future, which is also an order fact, but it does not by itself encode “this is position 7.”

Another wrong picture is: “a 128k window means 128k equal slots.” Long-context models **stretch** or interpolate positions. Quality often **dips in the middle** of a packed window. That is a position-and-attention problem, not a vibe. A later lesson named Lost in the Middle is this fact as packing advice.

A third wrong picture is: “absolute learned tables grow forever.” They cannot grow past the train length without a trick. Relative and rotary schemes generalize further — still not infinitely, still not evenly. “We trained to 4k and you stuffed 100k” is a position story even when the brochure says you may.

## How position is added, in words

**Absolute learned:** a second table, one row per index 0, 1, 2, … Add (or concat) that row to the token embedding. Token \`pay\` at index 0 is not the same vector as \`pay\` at index 9.

**Sinusoidal:** a fixed pattern of sines and cosines so nearby indices look related and you can in theory extrapolate. Still an absolute mark, just not a learned table.

**RoPE:** do not add a position row. Rotate the query and key so that the **match score** depends on how far apart two positions are. Relative distance becomes geometry. This is the common modern default. You will not code the rotations here. You will remember that **distance between tokens** starts to matter in the dots.

All three exist to break the bag-of-tokens symmetry. After they are applied, two sequences with the same ids in different orders produce different vectors going into attention.

## A tiny example in words

Toy token table:

- pay: \`[1.0, 0.0]\`
- now: \`[0.0, 1.0]\`

Toy position: index \`i\` adds \`[0.1 * i, -0.1 * i]\`.

\`pay now\` is index 0 then 1. \`now pay\` is index 0 then 1 with the words swapped. The vectors will not match. The sums will not match. That is enough to prove order entered the lists of numbers.

## Add a position list so order changes the vectors

Lists of numbers only. Print both orders.

\`\`\`viz vecs
title Same words, different order, different arrows
vec 1.0,0.0 pay@0 0
vec 0.1,0.9 now@1 1
caption “Pay now” is not “now pay.” Positions mark the index so the mix can tell them apart.
\`\`\`

\`\`\`tryit python
table = {
    "pay": [1.0, 0.0],
    "now": [0.0, 1.0],
}

def pos_vec(i):
    return [0.1 * i, -0.1 * i]

def embed(words):
    out = []
    for i, w in enumerate(words):
        v = [a + b for a, b in zip(table[w], pos_vec(i))]
        out.append(v)
    return out

def round_rows(rows):
    return [[round(x, 3) for x in row] for row in rows]

a = embed(["pay", "now"])
b = embed(["now", "pay"])
print("pay now", round_rows(a))
print("now pay", round_rows(b))
print("same words", ["pay", "now"] == ["now", "pay"])
print("same vectors", a == b)
sum_a = [a[0][d] + a[1][d] for d in range(2)]
sum_b = [b[0][d] + b[1][d] for d in range(2)]
print("sum pay now", [round(x, 3) for x in sum_a])
print("sum now pay", [round(x, 3) for x in sum_b])
\`\`\`

\`pay now\` and \`now pay\` print different pairs of lists. \`same words\` is False as Python lists, but even if you compared bags of words, \`same vectors\` is False because the index changed. The sums differ too. Order is in the numbers.

If \`pos_vec\` always returned \`[0.0, 0.0]\`, the two orders would still have different **sequences** of rows (pay then now vs now then pay), but a later mix that ignored order could still smash them. The added position is what makes even a careless mix feel the index.

## Long context is not even

Absolute learned tables stop at the max index seen in training unless you interpolate. Rotary schemes can be stretched. Stretching is a compromise: you reuse a pattern outside the range it was tuned on. Expect quality to be best near lengths the model actually trained on, worse far past that, and often worse in the **middle** of a packed window even inside the advertised max.

Positions also interact with **recency**. Later indices are a different region of the rotation (or a different row of the absolute table). Putting the latest observation at the end is not only human habit. It is a different place in position space.

Mixing two sequences without a separator and without positions is how “the error from step 1” and “the error from step 9” become one blob. Special tokens (last lesson) are separators. Positions are indices. You want both.

## How agents use this

Put the **goal and the latest observation near the ends** (start and last tokens). Do not hide the only relevant chunk at token 40,000 and hope rotation will find it. Recency is partly architecture: later positions are a different region.

When you concatenate a spec, old tools, retrieved chunks, and a new user line, you are choosing positions for every tile. That choice is a product decision. A later lesson on packing the window will turn this into a suitcase policy. Here the rule is already: **order is meaning**.

Do not shuffle few-shot examples “for variety” unless you measured it. You are moving them through position space. Do not insert a huge blob in the middle “just in case.” You are pushing the gold chunk into the dip.

- **Ends:** pin policy first; put fresh evidence last.
- **Separators:** special tokens between sources so two errors do not merge.
- **Length:** advertised max is not even quality.
- **Copy:** ids that must be copied exactly should not sit only in the faded middle.
- **Debug:** “it ignored the spec” is sometimes “the spec’s positions fell off or sat in the dip.”

> **Warning:** Mixing two sequences without a separator and without positions is how “the error from step 1” and “the error from step 9” become one blob.

\`\`\`quiz
Why do transformers need a position signal?
- Softmax cannot run without it
- *Without it, order is lost and the same words in a new order look the same
- It replaces the embedding table
- It trains BPE
explain: Attention mixes tokens. Positions tell the mix where each token sat.
\`\`\`
`,
  },
];
