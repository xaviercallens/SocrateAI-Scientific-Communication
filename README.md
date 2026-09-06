# SocrateAI — Scientific Communication

Papers, their reviews, and the record of what was found wrong with them.

This repository is deliberately organised around **claim strength**, not around results. Each
paper is published together with the review that examined it and with the status that review
produced. Where a claim did not survive, that is recorded here rather than quietly removed.

## Papers

| Paper | Status | Notes |
|---|---|---|
| [`Lean4_Fricke_Involution`](papers/Lean4_Fricke_Involution.pdf) | **Current — not submitted** | Reviewed; priority claim removed after prior art was found. See below. |
| [`Lean4_GL2_Poincare`](papers/Lean4_GL2_Poincare.pdf) | **Superseded** | Audited NOT READY; replaced by the Fricke paper. [Why](papers/SUPERSEDED_Lean4_GL2_Poincare.md) |

## The honest status of the current paper

The Fricke paper formalizes, in Lean 4 on top of Mathlib, the Fricke involution
`W_N = !![0,-1;N,0]` on `Γ₀(N)` and the operator it induces on modular forms — 27 declarations,
21 theorems, zero `sorry`, every headline theorem pinned by a build-failing `#guard_msgs` axiom
guard. The Lean is at
[`SocrateAI-Lean-Lib`, branch `fricke`](https://github.com/xaviercallens/SocrateAI-Lean-Lib/tree/fricke).

**It makes no priority claim, and it should not be submitted as one.** An earlier draft claimed
the first Lean 4 formalization of this material. That claim was false, and it was refuted by a
repository the paper itself cited: `anthropics/fermats-last-theorem` already contains Fricke and
Atkin–Lehner theory, including `atkinLehnerLin`, a **ℂ-linear** operator on `ModularForm` for the
whole Atkin–Lehner family. Full determination with evidence:
[`PRIOR_ART_FINDING.md`](PRIOR_ART_FINDING.md).

What remains is narrow and is stated as such in the paper: the literal matrix `W_N` over `ℝ`, the
explicit composite scalar `(-1)^k N^(k-2)`, and a four-named-import development using stock
tactics. The useful destination is a **Mathlib pull request** — Mathlib itself still has no
Fricke or Atkin–Lehner operator — not a venue submission. See [`SUBMISSION.md`](SUBMISSION.md).

## Reviews

- [`reviews/fricke_review_verdict.md`](reviews/fricke_review_verdict.md) — verdict **REJECT**,
  *"a claim-level rewrite, not a copy-edit"*, with the commands run for each finding.
- [`reviews/poincare_hardening_plan.md`](reviews/poincare_hardening_plan.md) — the audit that
  produced the pivot, including three of its own findings refuted by compilation.
- [`reviews/poincare_novelty.md`](reviews/poincare_novelty.md) — the prior-art assessment.

## Lessons learned

[`LL.md`](LL.md) records thirteen incidents from this work, each with the evidence and the
mechanical check that now prevents a repeat. Several are about the review process catching the
authors, including LL-13, where the correction to an over-claim was *itself* an over-claim and
only a second adversarial pass caught it.

## Method

Claims carry one label: **A1** formal (Lean, quantified over structures, clean axioms, faithful
statement) · **A2** computation · **L** literature · **C** derived · **D** conjecture · **E**
unsupported. Prior-art and impossibility claims about a formal library are settled by *compiling
against it*, never by memory or grep alone.
