# Auditing the agents themselves

> The panel being audited here is the one that reviews
> [Fade Readers](https://github.com/angspos/fade-readers), an early-reading app for children.
> Context for why any of this exists is in [the main README](README.md).

2026-09-08. Twelve files checked mechanically against the current build and spec, repaired, then
probed live. **Eleven findings, all fixed, no agent rebuilt** — every defect was drift from a spec
that moved underneath them.

The point of writing this up is not the findings. It is that **nothing was watching for them**, and
the scan that found them takes nine seconds.

## The scan

A single script, run from the project root. For each of `.claude/agents/*.md`,
`.claude/commands/panel.md` and `.claude/SAFETY.md`:

- does every path the file tells a reviewer to read actually resolve?
- does it carry a settled / do-not-relitigate block?
- does it know about the tools that now exist (`fr-lint.js`, `letters.json`)?
- does its stated reviewer count match reality?
- American spelling, since the copy was standardised?
- and separately: do the vault's wikilinks resolve, path-aware?

## What it found

**Two blockers.**

`curriculum.md:13` carried the **retired level ladder** — a structure replaced weeks earlier. Every
pacing finding it made was measured against the wrong yardstick.

`CLAUDE.md` **stated a false fact** about which books had payoff art, and every agent is instructed
to ground itself in `CLAUDE.md` first — so all nine inherited it. Checked against the source:
the spec named four books as having no art; all four had entries, and a different book was the only
one without.

**Four concerns**, including three agents with no settled block while the vault note claimed every
one carried it — and `ethics-guardian`, the least agreeable reviewer by design, was among them.

**Three nits**, including surviving British spellings from a standardisation a previous pass had
recorded as complete.

## The live probe

Static checks pass easily and prove little. So a fresh agent was sent through to read four files
and report facts that could be checked against the source. Three of four were exact — a letter's
color and its reverted predecessor, a rule and its numeric threshold, a quoted protocol line.

The fourth asked how many items were in a file. It answered **"approximately 48." The actual number
was 59.**

Every *quotation* was perfect and the one *number* was 19% low. That is the useful result: a model
reading a list estimates its length rather than counting it, and a count is exactly what an evidence
standard treats as hard proof, on a par with a `file:line`.

Now a rule: **compute numbers, do not estimate them.** Any count, total or measurement in a finding
comes from running something. If the agent cannot run it, it gives the quote and says the number is
uncounted.

## The pattern underneath

Three of the day's findings were **stale facts in the spec file** — the one file every agent is told
to trust first, and the only one nothing checks.

The protocol already said *verify against the code, never a note.* It did not prevent any of the
three, because the same protocol also says *ground yourself in the spec first.*

**A reminder is not a control.** The fix is not a fourth correction; it is a lint rule that diffs the
spec's factual claims against the source.

## Two things worth admitting

The fix pass **introduced two new defects** while repairing nine — British spellings, in the very
blocks being written about correctness. Caught by re-running the scan, not by reading.

And building the report page surfaced a CSS collision that rendered half a matrix at triple size.
Caught by measuring the elements in a headless browser, not by looking at a screenshot.

Both point the same way: **the scan is worth more than the fix.** It should run on every build.

## What still nobody owns

- **A real child.** The tester file is empty. The protocol names this in writing as the panel's
  largest blind spot; every child-facing finding from all nine is a hypothesis.
- **The consolidation step.** A role rather than an agent, so no audit of the agents folder reaches
  it. Now assigned to `loop-engineer`.
- **Agent upkeep itself.** Two blockers were agents drifting from a spec that moved. The nine-second
  scan should run on every build, not when someone thinks to look.
