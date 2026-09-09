---
description: Run the Fade Readers review panel — six expert reviewers in parallel, one consolidated report
argument-hint: [what to review] [--only art,ethics,ux,science,curriculum,a11y]
---

Run the Fade Readers review panel on: **$ARGUMENTS**

If `$ARGUMENTS` is empty, review the current live build end to end (`app-template-v9-linen.html` and what it produces).

## 1. Ground yourself first — do not skip

Read, in this order, before launching anyone:

1. `CLAUDE.md`
2. `FadeReaders-Vault/wiki/open-items.md`
3. The most recent note in `FadeReaders-Vault/wiki/journal/`
4. Whatever `$ARGUMENTS` names

Project root is the folder you are in locally, or `$HOME/mnt/Reading App` through a device bridge.

Every reviewer is bound by `.claude/agents/_PROTOCOL.md` — shared severity definitions, the evidence standard, the look-before-you-judge rule, and the requirement to honor Angela's prior rulings from the feedback log. Remind them of it in the prompt.

## 2. Launch the panel in parallel

Six reviewers, **all in one message** so they run concurrently:

**Craft panel** — the default, six agents, reviews what was built:

| agent | owns |
|---|---|
| `reading-science` | is the method sound — phonemes, mapping, cueing risk, the audio chain, transfer |
| `curriculum` | is this book/level built right — decodability, sequence, pacing, joy |
| `child-ux` | can a four-year-old who cannot read operate it |
| `accessibility` | WCAG AA on the adult surface, CVD, dyslexia, reduced motion |
| `art-director` | creature craft, fade stage integrity, footprint rule, palette, payoff art |
| `ethics-guardian` | gamification creep, dark patterns, privacy, honesty to parents |

**Venture panel** — three agents, reviews the product as a business. Runs on `--venture`, on `--all`, or whenever the target is a claim, a price, a listing, a launch, a contract, or a school:

| agent | owns |
|---|---|
| `legal` | regulatory exposure with authority named, and what actually needs counsel |
| `marketing` | positioning, message, pricing, channel — under a no-analytics, no-paid-UA constraint |
| `schools-and-efficacy` | what can honestly be claimed, to whom, and the cheapest study that raises it |

The three fight each other productively: `schools-and-efficacy` says what the evidence supports, `legal` prices the risk of saying more, `marketing` wants to say it well, and `ethics-guardian` vetoes. **Surface those collisions; never resolve them silently.**

**Process seat** — one agent, reviews the panel rather than the product. Runs on `--process`,
and **every fifth panel pass**. Never on a normal run — it measures cost, so adding it to every
run would make it the thing it is checking.

| agent | owns |
|---|---|
| `loop-engineer` | evidence discipline, padding, silent capitulation, spec-vs-code drift, estimated numbers, invocation cost, gate agreement rate |

It never opens the app and never files a product finding. Its inputs are `wiki/feedback/panel/`,
`lint-report.json`, `.claude/agents/` and the decision log. Give it the last five panel reports.

Groups: default = craft six · `--venture` = the three · `--all` = all nine · `--process` = `loop-engineer`. Honor `--only` if given (`a11y` → `accessibility`, `art` → `art-director`, `ux` → `child-ux`, `science` → `reading-science`, `ethics` → `ethics-guardian`, `schools` → `schools-and-efficacy`).

Give each one: what to review, the project root, and any context from step 1 that bears on it. Do not paste whole files into the prompt — they can read.

## 3. Consolidate — this is the part that earns the run

Do not concatenate six reports. Produce one:

- **Merge duplicates.** Where two reviewers found the same thing, state it once and credit both — agreement is signal, say so.
- **Surface disagreements explicitly**, under their own heading. `accessibility` wanting more contrast and `art-director` protecting the whisper is the most valuable output the panel produces. Never quietly pick a side; put both cases to Angela in two lines each and say which you would take and why.
- **Rank by severity across the whole panel**, not per reviewer.
- **Do not soften.** You are merging, not diplomacy. A blocker stays a blocker. Do not lead with praise to cushion the list; "Working well" comes after the findings for a reason.
- **Drop the noise.** If a reviewer padded, cut it. Twelve nits with two blockers buried in them is a failed report.

Format:

```
# Panel review — <target> — <date>

**Verdict:** SHIP / SHIP WITH FIXES / DON'T SHIP  (n blockers, n concerns)

## Blockers
## Concerns
## Where the panel disagrees
## Working well
## Nits (folded)
```

Keep the whole thing readable in one screen-and-a-bit. Angela is concise; emojis welcome. 🎉

## 4. Then stop

**Change nothing.** The panel reports; Angela decides. `.claude/SAFETY.md` sets the tiers — applying findings is 🟡, deploying is 🔴. End by asking which findings she wants acted on.

Once she picks, apply them the normal way — edit the source (`letters-src.js` / `finales-src.js` / `app-template-v9-linen.html`), rebuild linen only, bump `CACHE` in `beta/sw.js`, show her the render, and log the outcome in the letter or book note plus `FadeReaders-Vault/wiki/feedback/`.

**Never** hand-edit a `fade-readers-*.html` build. **Never** touch v8 or v9-kpop. **Never** change a letter's color, word, or fade tier on a reviewer's say-so alone.

## 5. Log the pass

Write the consolidated report to `FadeReaders-Vault/wiki/feedback/panel/<date>-<target>.md` (create the folder if needed, `tags: ['#feedback']`). Next run's reviewers read it, so they stop re-raising what this pass already settled.
