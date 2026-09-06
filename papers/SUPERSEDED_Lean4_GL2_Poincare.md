# SUPERSEDED — `Lean4_GL2_Poincare`

**This paper is not current. It is kept for provenance.** Its successor is
`Lean4_Fricke_Involution`, which is the same line of work after a pivot.

## Why it was superseded

An audit (`reviews/poincare_hardening_plan.md`, `reviews/poincare_novelty.md`) returned
**NOT READY**, for reasons that were verified by compiling rather than by reading:

- **No novelty survived.** Every mathematical statement is textbook (Diamond–Shurman §1.1,
  Miyake), and every formal statement was already in Mathlib and strictly more general —
  `denom_ne_zero`, `normSq_denom_pos`, `im_smul_eq_div_normSq` (which *is* the paper's Eq. (2),
  stated for arbitrary `GL (Fin 2) ℝ` via `|det|`), `Matrix.GLPos`, `SlashInvariantForm`,
  `ModularForm`, and even odd-weight vanishing — all since 2023.
- **The artifact did not match the paper.** The companion Lean module was over `ℤ`, with no
  `Complex`, no `Real`, no Mathlib dependency and no Möbius map constructed; its `ModularForm`
  structure was *vacuous* (a counterexample was compiled showing every function inhabits it).
- **Listing 2 did not compile as printed** (one tactic, `push_cast` where `exact_mod_cast` was
  needed). Listing 1 *did* compile exactly as printed, with a clean axiom footprint — the audit
  refuted three of its own upstream findings by running the compiler.

## What was done instead

The audit's own recommendation was that no research contribution existed on this topic, and that
any real formal content would have to be something Mathlib lacks. A gap search found that Mathlib
has no Fricke or Atkin–Lehner operator, and the work moved there. See
`papers/Lean4_Fricke_Involution.pdf` and `PRIOR_ART_FINDING.md` — the latter records that even
that successor makes **no priority claim**, because prior Lean 4 work exists outside Mathlib.
