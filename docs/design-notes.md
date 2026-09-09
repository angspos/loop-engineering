# Design notes

Why each agent is shaped the way it is, and what went wrong in the first cut.

---

## The first version was worse, and instructively so

The first cut asserted expertise without equipping it. Every agent opened with a line like *"You are a structured-literacy researcher"* and then listed six to thirteen things to check. That produces a competent junior reviewer: it will find surface problems and miss the ones that need a framework.

Six systemic defects, all fixed in the second pass:

| Defect | Fix |
|---|---|
| Name-dropping instead of frameworks | Each agent carries the actual claims it tests against, not a reading list |
| Almost no numbers | Real thresholds, computed — decodability %, ΔE, contrast ratios, target sizes |
| Judging a visual product from source | Rendering made mandatory; unlooked-at visual claims capped at Concern |
| No memory across passes | Every agent reads the feedback log; prior rulings bind |
| "Blocker" meaning six different things | One severity scale in `_PROTOCOL.md` |
| Nothing discouraging padding | Nit cap, evidence standard, calibration pairs, explicit permission to find nothing |

A third pass — a line-by-line comb — caught four more:

- **27 British spellings** in agents reviewing a product whose copy was deliberately standardized to American English. An agent that writes "colour" while auditing a project that ruled on "color" undermines itself.
- **Nobody was checking the audio.** The hard rule is *letter tap = phoneme only, never the letter name.* The fallback chain runs `.m4a` → `.mp3` → `.wav` → a TTS map, and **the TTS map is exactly where a letter name leaks**. No agent owned it. It went to `reading-science`, along with measuring stop-consonant durations for schwa contamination ("buh" for /b/), which is the near-universal error in home phonics recordings.
- **Two agents overlapped on touch targets** with no rule for who wins. Now `child-ux` owns the child-development threshold and `accessibility` owns the conformance number — and they are *told* they will sometimes disagree, because a target can pass SC 2.5.5 at 44px and still fail a four-year-old. That disagreement is output, not a bug.
- **No proposal mode.** All six were written to audit things that exist. Asked *"should we add uppercase?"* they would have hunted defects in unwritten code. `_PROTOCOL.md` now defines two modes and requires the agent to say which it's in.

---

## Why "settled — do not relitigate" exists

Every agent carries a list of decisions already made: the active build, the typeface, one color per letter, zero gamification, covers title-only.

Without it, a fresh reviewer with a strong opinion spends the pass re-arguing choices that were settled months ago with reasons it can't see. That isn't rigor, it's amnesia wearing rigor's clothes. The list is short, and any agent may still *recommend* a change to something on it — it just can't treat the question as open.

## Why the whisper-scene exemption is stated three times

Fade Readers puts a very pale illustration behind the words on each page. It's pale on purpose: **a child who can read the picture doesn't have to read the word.**

Every accessibility reviewer's first instinct is to raise contrast. Doing it here would break the product deliberately. So the exemption appears in `accessibility` (as a hard rule, with the reasoning), in `art-director` (judge composition, never contrast), and in `reading-science` (it's a cueing surface — check it's still a whisper, don't ask for it to be louder).

The same logic covers faded letters: a letter at fade 3 is the exercise, not a legibility bug.

This is the clearest example of the general principle — **domain guardrails have to be stated, because a competent generalist reviewer will reliably get them wrong.**

## Why disagreements are surfaced instead of resolved

The merge step is told never to quietly pick a side. Two structural conflicts recur:

- `accessibility` wants contrast; `art-director` protects the whisper.
- `accessibility` says 44px passes; `child-ux` says a four-year-old needs 60px+.

Both sides are correct within their frame. A merged report that silently resolves them hides the actual decision from the person who should be making it. Both cases go in, two lines each, with a recommendation.

## Why they're read-only

The project's own rules say not to change a letter's color, word, or fade tier without asking. A reviewer with write access is one confident wrong finding away from breaking a design decision it didn't have the context to question.

Reviewers report. A human picks. Then the normal loop runs: edit source, rebuild, render, show, log.

## Why the blind spots are documented

`_PROTOCOL.md` ends with what the panel doesn't cover: build QA, legal review, and real children.

The third is the important one. Six well-equipped agents produce enough plausible output to feel like coverage, and the most seductive failure mode is mistaking a thorough review for evidence about actual users. None of these reviewers has watched a child use the app. Their child-facing findings are hypotheses, and the ten watched families are what turns them into results.

Naming a blind spot doesn't fix it. It stops it being mistaken for a covered area.

---

## Interviewing an agent before accepting it

The three venture agents were each given one hard scenario and judged on the answer before being kept. It is a cheap, high-yield step and it should be standard.

A good interview question has a generic answer available that a weak persona will reach for. `legal` was asked to price the exposure on three planned moves; the failure mode being tested was hedging into "consult a lawyer." `marketing` was asked for sixty days of moves with no analytics, no budget and no users; the failure mode was "build brand awareness." `schools-and-efficacy` was asked for the cheapest path from no evidence to a district sale; the failure mode was "conduct research to build credibility."

All three passed, and — the part that justified the exercise — **the interviews produced content good enough to promote back into the agent files**, so it is guaranteed on every future run rather than dependent on a lucky one:

- named on-point precedent instead of abstract regulation, and the observation that a subscription's whole compliance surface collapses if billing goes through the platform;
- the fact that the cheapest evidence unlock in the product is a **document, not a study**;
- two traps in the study design — that a transfer probe must not use the app's own typeface, and that the tap-to-restore affordance is a confound *and* the real research question;
- and, for a product forbidden from having analytics, the list of things that may still legitimately be counted.

One agent also made a small factual error about the product's history while arguing a position. It was caught by checking the primary source — which is precisely what the protocol's "facts go stale, verify, do not trust" rule exists for, and a useful demonstration that the rule earns its place.

**Re-interview after any substantial edit to an agent.** A persona that was sharp can be dulled by a well-meant addition.