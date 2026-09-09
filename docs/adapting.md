# Adapting this to your own project

> These files are published for reference, not under an open-source license (see the repository [LICENSE](../LICENSE)). The *approach* below is free to take — that is why this guide exists. To reuse the agent files themselves, open an Issue and ask.

The agents here are saturated with one app's specifics — hex values, book titles, fade stages, a service worker's cache key. **Do not strip that out and keep the shell.** The specificity is what makes them work; a generic "accessibility reviewer" produces findings you could have gotten from a linter.

Port the *structure*, then re-saturate it with your project's specifics.

---

## 1. Pick reviewers that can actually review something

The panel came from a hiring question: *who would you hire to make this a serious product?* Roles that could critique a build became agents. Roles that couldn't — growth, partnerships, finance, localization — stayed advisory. A CFO persona reviewing your commit is theater.

A good test: **can this reviewer open the artifact and be wrong about something specific?** If not, it isn't a reviewer.

Six is about the ceiling. Past that, findings duplicate faster than they accumulate.

## 2. Give each one non-overlapping ownership

Write the boundary into both files, not just one. Where two genuinely share a surface, split by *frame*, not by topic:

> `child-ux` owns the child-development threshold. `accessibility` owns the conformance number. You will sometimes disagree — surface it, don't resolve it.

Overlap you've named is productive. Overlap you haven't is duplicate findings and wasted tokens.

## 3. Equip them, don't just cast them

Each agent needs four things beyond a job title:

- **Frameworks** — the actual claims it tests against. Not "familiar with WCAG" but the criterion numbers it cites.
- **Thresholds** — numbers it can compute and fail. "Decodability ≥ 80%." "ΔE < 10." "4.5:1." A reviewer without a threshold produces adjectives.
- **A fixed method** — the order it works in, so passes are comparable. *Extract the table, state the numbers, walk one book, then judge.*
- **A calibration pair** — one real finding and one piece of noise, both written out. This does more to control output quality than any amount of instruction about being rigorous.

## 4. Write the guardrails a competent reviewer would get wrong

This is the highest-value paragraph in any agent file.

Every project has deliberate choices that look like defects to someone seeing them fresh. Here it's the pale illustrations — an accessibility reviewer's first instinct is to raise contrast, which would break the product on purpose. So the exemption is stated as a hard rule, with the reasoning, in every agent that could trip over it.

Find yours. They're usually the decisions you've had to explain more than twice.

## 5. Give them memory

Without it, every pass re-raises what you settled last month.

Point each agent at wherever your decisions live — a decision log, ADRs, `CLAUDE.md`, closed issues — and make prior rulings binding:

> A finding already rejected is dead unless you open with *"rejected on ⟨date⟩ because ⟨reason⟩; re-raising because ⟨what changed⟩."*

Then log each report where the next pass will read it. That loop is most of the value.

## 6. Make padding unrewarding

Six eager reviewers will bury two real blockers under forty nits unless you stop them:

- A shared severity scale, defined once, so "blocker" means one thing.
- An evidence standard — file:line, a number, a rendered image, or a named standard. Nothing else counts.
- A nit cap. Five.
- Explicit permission to find nothing: *a clean pass is a legitimate result.*

That last line matters more than it looks. A reviewer that invents findings to seem useful teaches you to skim its section — and then the one real blocker it eventually finds gets skimmed too.

## 7. Name what the panel doesn't cover

Write it down. Six thorough-sounding reports feel like coverage, and the failure mode is trusting them past their evidence. Here: build QA, legal review, and — the big one — no reviewer has ever watched a child use the app.

---

## Files to change first

1. **`_PROTOCOL.md`** — swap the grounding file paths and the "does not cover" list. Severity, evidence standard, prior-rulings rule and the two modes port unchanged.
2. **`commands/panel.md`** — swap the agent roster, the grounding reads, and the report destination. The merge rules port unchanged.
3. **The agents themselves** — replace wholesale. Keep the *shape*: role and experience, project root, equipment, method, also-check, settled list, calibration pair, boundary.

The two files that port nearly as-is are the protocol and the merge logic. The agents are where your project has to show up.
