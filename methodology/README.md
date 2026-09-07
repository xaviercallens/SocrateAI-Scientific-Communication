# Methodology

The reusable machinery behind the papers in this repository: the skills that encode hard-won rules,
the workflows that orchestrate a run, and the deposit scripts.

These lived unversioned on one machine until 2026-09-07. That was a real risk — `LL.md` records
twenty-one lessons, and the mechanisms that *enforce* them were a single `rm` from being lost.

## Skills

| | |
|---|---|
| `skills/formalization-dag` | The statement-DAG architecture, and **gate zero**: prior art decides whether a paper exists, before any Lean is written. Run 1 wrote the paper first and had its central claim refuted by a repository its own bibliography cited. |
| `skills/lean4-formalization` | Statement-faithfulness, the axiom audit as a build target, and the character-vs-byte counting rule (LL-17). |
| `skills/scientific-publication` | The publication surface: concept DOIs, the irreversible-action rule, credential files, the two-check PDF fidelity gate. Every rule here was paid for by a failure in run 2. |

## Workflows

| | |
|---|---|
| `workflows/paper-run.js` | Generic: gate zero (can abort) → statements → comparator → prove → guard → review → verdict. |
| `workflows/eta-quotient-run.js` | Run 3, Lean-specific. **Serializes every build** — concurrent `lake build`s on one build directory destroyed a 4.7 GB Mathlib pool in run 1 (LL-12). |
| `workflows/paper-review-improve.js` | Referee simulation across three lenses with adversarial verification. |

## Scripts

`scripts/zenodo_deposit*.py` — deposit and publish. Note the guard: `--publish` **refuses** without
an explicit `--deposition <id>`, and refuses to republish a published record. Without that guard the
script once minted a DOI for a deposition nobody had reviewed, while the papers cited a reserved DOI
that resolved to nothing (LL-14).

## The two rules that matter most

1. **Absence claims use `grep -ri`.** A case-sensitive search on a lower-camelCase name returns zero
   and means nothing — `orderAt` returns 0 files, `orderat` returns 19 (LL-20).
2. **An irreversible action names its target.** Never a default, never "create one for me."
