# Tactics — every lesson mapped to its enforcement

`LL.md` records what went wrong. This file records the countermeasure for each lesson and **where
it is enforced** — a lesson whose countermeasure is prose is a lesson waiting to repeat. Three
enforcement classes: **[G]** a gate in `scripts/paper_gate.py` (mechanical, blocks publication),
**[S]** a rule in a skill (loaded every run), **[W]** structure in a workflow (shapes how agents
are dispatched).

| LL | Failure | Tactic | Enforced |
|----|---------|--------|----------|
| 1 | Green build proved the wrong theorem | Statement comparator before proving; state in English what was proved | [W] Compare phase precedes Prove |
| 2 | Tier-A claim named a nonexistent theorem | Every DAG `proved` node must name a resolving declaration | [G] DAG validator; [W] Guard phase |
| 3 | "Verified in Lean" without Mathlib | Build is a gate input, not a memory | [G] build gate |
| 4 | Novelty settled by compiler, both directions | Prior art by compiling/searching, never recall | [S] formalization-dag §7; [W] GateZero can abort |
| 5 | Skills carried phantom claims | Every cited Lean name must resolve in source or Mathlib | [G] lean-name gate |
| 7 | Axiom footprint drift | `#guard_msgs` as build target + negative controls | [G] guard-parse + negative-control gates |
| 12 | Concurrent lake builds ate the pool | `pgrep -x lake` before building; builds serialized | [G] first gate; [W] serial Prove loop |
| 14 | DOI minted for the wrong deposition | Irreversible actions name their target | [S] publication skill; `--deposition` guard in deposit scripts |
| 15 | Mid-session export never arrives | Token files, checked once, names only | [S] publication skill §2 |
| 16 | Extraction and rendering each lie alone | Both checks + settle by codepoint; overfull gate | [G] code-verbatim ×2 + overfull gates |
| 17 | Bytes counted as characters | `len(str)` with utf-8, unit stated | [G] all counts in Python; [S] lean4-formalization |
| 19 | Prior art after the work | Gate zero decides whether the paper exists | [W] GateZero phase, aborts run |
| 20 | Case-sensitive grep manufactured absence | All absence claims `grep -ri`; re-verify inherited blockers | [G] name gate is case-insensitive; [S] both Lean skills |
| 21 | — (obstruction as deliverable: a success) | Keep `open`/`blocked` nodes with `lean_name: null` | [G] DAG validator honours null |
| 22 | Review-response text introduced errors; stale counts | Revision text gets the full pass; **every number recomputed at gate time** | [G] number-check gates recompute from artifact |
| 22b | Whole-library claims checked on a subset | Library-wide axiom scan vs explicit allowlist | [G] axiom gate (caught postulate 6 on first run) |
| 23 | Five versions in one day, checks ran after publishing | **One green gate before any publish**; new failure ⇒ new gate in the script | [G] `paper_gate.py` exit code |
| 24 | 504 on an irreversible POST | Read server state before any retry | [S] publication skill §3 |

## The invariant

Before anything is published — Zenodo, HF, GitHub, HAL hand-off:

```bash
python3 scripts/paper_gate.py docs/<paper>.tex     # must print: ALL GATES GREEN
```

A finding that the gate *could* have caught but didn't is a bug in the gate. Fix the gate in the
same commit as the finding.
