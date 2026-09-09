# Loop engineering

**A review panel of ten AI agents, and the machinery that keeps a human able to check it.**

📄 **[The full document (PDF)](the-panel-loop.pdf)** · 🌐 **[as a web page](the-panel-loop.html)** · 🔎 **[sources](sources.pdf)** · 🧾 **[the agent audit](AGENT-AUDIT.md)**

---

## Where this came from

I'm building **[Fade Readers](https://fadereaders.com)** — an early-reading web app where children read real books *before* they know letter sounds. Every letter is drawn as the thing it starts with (the **a** is an apple, the **b** a bee), so a child who's never been taught a sound can still make something of *c a t*. Then the pictures fade to plain ink. ([its repo](https://github.com/angspos/fade-readers))

It's a small product with an unreasonable number of hard rules: a unique color per letter, nothing outside a letter's footprint, sounds and never letter names, one typeface, a contrast floor at every fade stage, no rewards or streaks ever, builds generated from templates and never hand-edited — plus claims about children's reading that have to stay honest.

**One person can't check all that on every iteration.** So I built a review panel: nine expert-persona agents that fan out in parallel and file findings before anything reaches me.

Then the panel developed its own problem. **Nine reviewers producing nine reports isn't faster than reading carefully myself — it's slower.** The bottleneck moved. It was never the reviewing; it was me, checking the reviewing.

This repo is about that: not the app, but *the loop around the reviewing.* Nothing here is hypothetical — the agent files, the linter and the audit are the ones in use.

---

## The one constraint

> "Usually they are doing the generation, and we as humans are doing the verification. **It is in our interest to make this loop go as fast as possible.**"
> — Andrej Karpathy, [*Software Is Changing (Again)*](https://singjupost.com/andrej-karpathy-software-is-changing-again/), June 2025

![Autonomy is a slider you may move only as far as verification reaches](diagrams/1-autonomy-slider.png)

Autonomy is a slider you may move only as far as your verification reaches. Past the line you don't get speed — you get **confident garbage**: output that costs more to audit than it saved. Everything below exists to push the ochre line rightward.

---

## The loop

![The panel loop, end to end](diagrams/2-the-loop.png)

Solid boxes run fixed checklists; dashed boxes explore freely — **that difference is the autonomy dial.** The green bypass sends mechanically verifiable findings past a debate they can't benefit from. The ochre return turns disagreeing with the panel into rubric and lint rather than a feeling.

The unit of work is *"Should Level 3 keep partial coloring?"* — never *"review Level 3."* Each seat files 0–3 findings; **zero is allowed.**

---

## Step 1 — a deterministic gate before any agent

[`lint/fr-lint.js`](lint/fr-lint.js) — 21 checks, no dependencies, one second, zero LLM calls. If it fails, no agent is invoked.

Its strongest check reproduces the shipped build from source and diffs it, then compares mtimes to say which failure it is: **STALE** (rebuild) or **HAND-EDITED** (a rule violation). It caught a real one on its first run — an illustration nudged 12px, never rebuilt, shipped clipped for a day. No panel of nine would have found that; a diff found it in a second.

It emits [`lint/letters.json`](lint/letters.json), a manifest agents cite instead of parsing source. **A rule the lint covers and passes is settled, not a finding.**

> **Worth stealing:** the first run threw three false positives by matching the *comments asserting the rules*. It now strips comments first. Check what ships, not what the comments claim.

---

## What you actually look at

> Karpathy: a GUI uses "your computer vision GPU"; reading text is effortful.

![The visual verification surface](diagrams/6-the-visual-verification-surface.png)

Green strip means the hard rules held, so you skip to judgment. Findings are **pinned to the letters they concern**, so location is free information. A live disagreement renders as both positions side by side — you see the argument, not a verdict about it.

---

## Actor · Critic · Reviser

> Andrew Ng, [*Agentic Design Patterns, Part 1*](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance) — the Reflection pattern.

![Collapsed versus split](diagrams/3-actor-critic-reviser-collapsed-vs-split.png)

An agent that critiques and rewrites in one pass spends the rewrite **defending its first opinion.** Split them and the critique has to survive being handed to someone who owes it nothing. *No benchmark is offered here on purpose — nobody has isolated this split and measured it.*

![The roles are a layer across the pipeline, not three seats](diagrams/4-where-the-roles-live.png)

- **Actor** — the build. Not an agent; the files that made the work.
- **Critic** — *all nine seats*, both rounds. Two leave after Round 1 because a measured standard doesn't improve by being argued over.
- **Reviser** — `/panel` step 3, run by the orchestrator. A role, not an agent; no file in [`agents/`](agents/).

The rule underneath: **no seat writes the consolidated report.** The moment `ethics-guardian` both argues to cut a page and writes up what the panel concluded, the write-up becomes a defence of `ethics-guardian`.

**Known gap:** consolidation has never been tested, and it's the step with the worst incentive — the orchestrator that merges also chose the question and presents the result. Because it's a role, no audit of `agents/` will ever reach it. [`loop-engineer`](agents/loop-engineer.md) owns it now.

---

## Autonomy, dialed per seat

> Ng, [The Batch 253](https://www.deeplearning.ai/the-batch/issue-253/) — "different degrees to which systems can be agentic."

![The dial per seat](diagrams/5-autonomy-dialed-per-seat.png)

| dial | seats | why |
|---|---|---|
| **Low** — a fixed standard to check | `accessibility` · `curriculum` · `loop-engineer` | freedom buys variance, not insight |
| **Medium** — picks which criteria apply | `art-director` · `child-ux` · `legal` | |
| **High** — finds what nobody listed | `reading-science` · `ethics-guardian` · `marketing` · `schools-and-efficacy` | a checklist would defeat the seat |

**Nothing was assigned — it was read off the files.** `accessibility` cites criteria by number; `ethics-guardian` is told in its own file to be the least agreeable reviewer. The dial is a description, not a policy.

`legal` sits at Medium **by choice**: it walked past trademark once, so it now runs a standing checklist and reports every item.

---

## Who gets what

![The packet matrix](diagrams/8-who-gets-what-packet.png)

Scoped by group, not per agent — one file to keep current instead of ten ([`_PROTOCOL.md`](agents/_PROTOCOL.md) §1).

`your_leaning` is the row that matters: **never, by design.** A panel that knows the CEO's preference stops being a panel. `your_raw_text` goes to the high-autonomy seats, which need your intent in order to argue against it.

```jsonc
// letters.json — emitted by fr-lint.js on every run, never hand-written
{ "b": { "word": "bee", "color": "#f8d67c", "cBase": "#b09033",
         "contrastOnCanvas": 3.0, "survivesFade1": false, "font": "Andika-Bold" } }
```

That's *"build for agents as a third consumer"* concretely. Humans get a GUI, computers get an API, agents get neither — machine-speed but they read like people.

---

## The tenth seat — `loop-engineer`

The nine ask whether the product is good. This one asks whether **the reviewing** is good, and whether it earns its cost.

![Three things caught by nothing](diagrams/7-caught-by-nothing.png)

**What it measures — thresholds, not vibes.** Evidence compliance under 90% · a seat filing the same count every pass · a Round 1 finding vanishing from Round 2 without a concede · any spec claim the code contradicts · any number not traceable to a command · gate agreement rate · report length against findings that changed a decision.

**Two guardrails, and they are the design.** It **never opens the app** — a process reviewer with opinions about letter colors is just a tenth product reviewer. And it runs **every fifth pass**: it measures cost, so it must not add it. Most of its passes should end in "nothing found."

It carries its principles **unattributed** — a reviewer that invents a position for a living author has done the exact thing this seat exists to catch.

---

## Evals start as a log

> Ng, [*Evals and Error Analysis*](https://www.deeplearning.ai/the-batch/improve-agentic-performance-with-evals-and-error-analysis-part-1): disciplined evals are the "single biggest predictor of how rapidly a team makes progress."

![Log, count, fix, judge](diagrams/10-evals-log-count-fix-judge.png)

**Log** every gate decision → **count** the recurring types at ~run 10 → **fix** each one into a rubric line, lint rule or dial change → **judge** with an LLM only once counts stabilise. Your agreement rate with the panel is the number that unlocks the ladder.

---

## The counter-argument this has to survive

Cognition's [*Don't Build Multi-Agents*](https://cognition.com/blog/dont-build-multi-agents) is the case *against* a panel — but its failure cases are agents **writing** in parallel, and [LangChain draws the same line](https://www.langchain.com/blog/how-and-when-to-build-multi-agent-systems): read-heavy work parallelises, write-heavy work collides. Their principle *"share full traces, not fragments"* is why Round 2 passes whole reports.

> **The panel reviews in parallel. The build is edited by one thread.**

---

## The autonomy ladder

![The five rungs against the verification ceiling](diagrams/9-the-autonomy-ladder.png)

| rung | it **is** | costs | state |
|---|---|---|---|
| 1 · lint | `fr-lint.js` → `letters.json` | a build | **built ✓** |
| 2 · visual surface | `review-<date>.html` | a build | next |
| 3 · decision log | `decisions.md` — panel said / you did / why | a habit | |
| 4 · auto-approve reversible | a section in the spec | a paragraph | |
| 5 · scheduled runs | a setting | a switch | |

Only rungs 1 and 2 are real building. The dashed line is how fast you can check; **a block may only rise as high as the line has already reached.** Build rung 4 before rung 3 and it sticks out above the line — which is the definition of confident garbage.

---

## What's here

| path | what it is |
|---|---|
| [`the-panel-loop.pdf`](the-panel-loop.pdf) · [`.html`](the-panel-loop.html) | The full document, 12 pages. |
| [`sources.pdf`](sources.pdf) | Every borrowed claim traced to its sentence. |
| [`AGENT-AUDIT.md`](AGENT-AUDIT.md) | Auditing the agents themselves — 11 findings, a nine-second scan. |
| [`diagrams/`](diagrams/) | Every diagram above, rendered at 1.5×. |
| [`agents/`](agents/) | Ten seat definitions + [`_PROTOCOL.md`](agents/_PROTOCOL.md). |
| [`commands/panel.md`](commands/panel.md) | The `/panel` command. |
| [`lint/`](lint/) | The gate and the manifest it emits. |
| [`SAFETY.md`](SAFETY.md) | Autonomy tiered by **reversibility**, not difficulty. |
| [`docs/`](docs/) | [the panel](docs/the-panel.md) · [design notes](docs/design-notes.md) · [adapting it](docs/adapting.md) |

---

## Sources

Karpathy — [*Software Is Changing (Again)*](https://singjupost.com/andrej-karpathy-software-is-changing-again/), June 2025 · Ng — [*Agentic Design Patterns Pt 1*](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance) (Mar 2024), [degrees of agency](https://www.deeplearning.ai/the-batch/issue-253/) (Jun 2024), [*Evals and Error Analysis Pt 1*](https://www.deeplearning.ai/the-batch/improve-agentic-performance-with-evals-and-error-analysis-part-1) (Oct 2025) · Cognition — [*Don't Build Multi-Agents*](https://cognition.com/blog/dont-build-multi-agents) · LangChain — [*How and when to build multi-agent systems*](https://www.langchain.com/blog/how-and-when-to-build-multi-agent-systems)

---

## What this is not

The seat roster, the packet contract, the triage split, the ladder and every Fade Readers rule are **this project's** — argued from those sources, not endorsed by them. Where a claim is borrowed it's quoted and linked; where this goes beyond a source, it says so.

The panel was built for one product and its examples are all reading-app examples. The transferable part is the shape: **a deterministic gate before any agent, autonomy dialed per seat rather than per system, a role split that stops a reviewer from grading itself, an output built for looking rather than reading, and a seat whose only job is asking whether the loop still earns its cost.**

---

© 2026 Angela Sposato. All rights reserved — published for reference ([LICENSE](LICENSE)). The *approach* is free to take; reusing the files isn't, so open an Issue and ask.
