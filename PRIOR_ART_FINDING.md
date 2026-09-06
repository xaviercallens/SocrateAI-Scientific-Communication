# Prior-art determination: the Fricke priority claim is refuted

**Date:** 2026-09-06 · **Method:** GitHub code search + raw file fetch, authenticated as `xaviercallens`.
**Verdict: the paper's central priority claim is false. Do not submit it as a novelty claim.**

## What was claimed

`docs/Lean4_Fricke_Involution.tex` abstract: *"We report the first formalization, in Lean 4 with
Mathlib, of the Fricke involution … and of the operator it induces on modular forms."*

## What is actually there

`anthropics/fermats-last-theorem` — a public Lean 4 + Mathlib development, **cited by this paper
itself as `[FLT2026]` in three places** — already contains the material.

| Query (repo-scoped) | Hits |
|---|---|
| `Fricke`, `extension:lean` | **2720 files** |
| `AtkinLehner`, `extension:lean` | **3576 files** |
| `"def fricke"` | 62 |

Representative declarations:

- `Theorems/Thm_ModularForm_heckeU_add_slash_fricke_eq_zero.lean`
- `Theorems/Thm_CuspForm_hasNebentypus_inv_and_qCoeff_hecke_eigen_of_fricke.lean`
- `Theorems/Thm_ModularForm_etaProductEleven_fricke.lean`
- `Definitions/Def_CohCarrier_Fricke.lean`, `Definitions/Def_ModularCurve_AtkinLehner.lean`

Their `heckeU_add_slash_fricke_eq_zero` uses **the identical matrix and the identical Mathlib API**:

```lean
theorem ModularForm.heckeU_add_slash_fricke_eq_zero (p : ℕ) [Fact p.Prime]
    (f : ModularForm (CongruenceSubgroup.Gamma0 p) 2) (W : Matrix.GeneralLinearGroup (Fin 2) ℝ)
    (hW : (W : Matrix (Fin 2) (Fin 2) ℝ) = !![0, -1; (p : ℝ), 0]) :
    ModularForm.heckeU 2 p ⇑f + ⇑f ∣[(2 : ℤ)] W = 0
```

## The duplication is near-verbatim, including the proof

`Definitions/Def_CohCarrier_Fricke.lean`:

```lean
def frickeMat (A : SL(2, ℤ)) (h : (N : ℤ) ∣ A 1 0) : SL(2, ℤ) :=
  ⟨!![A 1 1, -(A 1 0 / N); -(N * A 0 1), A 0 0], by
    rw [Matrix.det_fin_two_of]
    have hdet := Matrix.SpecialLinearGroup.det_coe A
    rw [Matrix.det_fin_two] at hdet
    ... linear_combination hdet⟩
```

Ours (`SocrateAI.ModularForms.frickeConj`): same conjugate matrix `!![d, -c/N; -Nb, a]`, same
divisibility hypothesis, same tactic skeleton ending in `linear_combination hdet`. Independently
arrived at — but that is irrelevant to priority.

Their work additionally covers Hecke operators, eigenforms with nebentypus, modular curves and
Atkin–Lehner on curves: **strictly more than ours**, and it predates this paper (public Aug 2026).

## Why our own checks missed it

We settled prior art by compiling **against Mathlib**, which genuinely has zero Fricke content
(that check was correct and remains correct). We never searched the *other Lean developments the
paper cites*. The paper's own limitations section admitted this — *"We have not searched
non-Mathlib Lean developments"* — while the abstract simultaneously claimed a Lean-4-wide first.
The contradiction was inside one document and went unnoticed until the review workflow's novelty
lens flagged it from two independent directions.

## Deeper evidence from the review's verification stage

The review's adversarial verifier went further than the search above and found the files that
matter most — which my own first determination **understated**:

- `Definitions/Def_ModularForm_AtkinLehnerDatum.lean` (157 lines, 0 `sorry`, `import Mathlib`):
  defines `AtkinLehnerDatum M q` and builds `alGL : GL (Fin 2) ℝ` **via the same
  `Matrix.GeneralLinearGroup.mkOfDetNeZero` idiom we use**, with `val_det_alGL`, `det_alGL_pos`,
  `σ_alGL_apply`, and `mat_sq : W.mat * W.mat = q • W.sqUnit` together with
  `sqUnitSL_mem : W.sqUnitSL ∈ Gamma0 M`. That is a generalisation of our (C1), (C2) **and (C7)**.
- `Definitions/Def_CuspForm_AtkinLehnerOperator.lean` (64 lines, 0 `sorry`):
  ```lean
  def atkinLehnerLin [NeZero M] (W : AtkinLehnerDatum M q) (k : ℤ) :
      ModularForm (Gamma0 M) k →ₗ[ℂ] ModularForm (Gamma0 M) k
  ```
  discharging `slash_action_eq'`, `holo'` and `bdd_at_cusps'` exactly as our
  `frickeModularOperator` does — our **(C5)+(C6)**, for the entire Atkin–Lehner family, and as a
  **ℂ-linear map**.
- `Def_CohCarrier_Fricke.lean` also contains `N_dvd_of_mem_Gamma0` (our `gamma0_dvd_lower_left`,
  character-for-character the same one-line proof), `frickeMat_mem_Gamma0`, `frickeMat_mul`,
  `frickeMat_frickeMat`, `frickeHom`, and `frickeEquiv : GammaH N H ≃* GammaH N H`.
- A `sorry` search over the repository returns hits only in README/HTML/config — none in
  `Definitions/` or `Theorems/`.

Two corrections to the record, neither of which changes the outcome: the repository went public
**2026-09-04T14:21:04Z**, not "August 2026" (still two days before this paper's date); and
`Thm_ModularForm_heckeU_add_slash_fricke_eq_zero` takes `W` as a *hypothesis* and constructs
nothing, so it is not itself the anticipating file — the two `AtkinLehner` definition files are.

## What survives, honestly

1. **Mathlib still lacks Fricke/Atkin–Lehner** — verified by compiling. Upstreaming remains
   genuinely useful: the FLT material lives in a bespoke `CohCarrier` namespace inside a
   proof-specific artifact, not as reusable library API.
2. **A genuinely thin residual, stated precisely.** After honest disclosure the delta is:
   (i) the literal matrix `W_N` over ℝ — FLT's `AtkinLehnerDatum.mat` has lower-right entry `q`,
   so it cannot express `W_N` on the nose, and a `frickeW` search there returns 0 hits;
   (ii) the explicit composite scalar `(-1)^k N^(k-2)` of (C7); and
   (iii) a four-named-import development using stock tactics, against FLT's wholesale
   `import Mathlib` plus its bespoke `p2m_exact_reverting` proof harness.
   That is a *methodology* difference, not a priority one, and it is a different paper from the
   one written.
3. **One review finding is now fixed, and it was real.** The reviewer compiled
   `Module ℂ (ModularForm (Gamma0GL N) k)` against the shipped artifact and it **failed** — our
   operator could not even be stated ℂ-linear, which is exactly the form the prior art ships.
   Root cause was `Gamma0GL` being a plain `def`; changing it to `abbrev` fixes it, and we
   verified that `Module ℂ` and `HasDetOne` both synthesize for the underlying expression.
   Matching the prior art's form is not, however, an argument for publishing.

## Recommendation

**Do not submit as a paper.** The novelty claim is unsupportable and the nearest honest reframing
("a Mathlib-idiomatic API") is too thin to carry a formalization-venue submission on its own.

**Do open the Mathlib PR.** That is where the remaining value is, it is judged on usefulness rather
than priority, and it converts the work into something the community can build on. Fix
`Gamma0GL` (make it `abbrev`/`@[reducible]`), cite the FLT artifact as related work, and let the
Mathlib reviewers decide the API shape.
