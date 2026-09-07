# Response to review — eta-quotient preprint

Review received 2026-09-07 (DeepMind Deep Think). Recommendation: *Accept with Minor Revisions*.
All substantive items are addressed in Zenodo v4. Two items were **not** applied, and one of those
would have introduced a mathematical error; both are explained below.

## Accepted and applied

**A. Lean code snippets.** Two `Verbatim` blocks added: `etaQuotientRawOrder` with
`etaQuotient_cusp_order` (Theorem 3.1), and `etaQuotientModularForm` (Section 4). Both are quoted
**character-for-character from the compiled source** — the first attempt re-wrapped the signature
lines for column width, which broke the paper's own "verbatim from the compiled source" claim, so
the exact source lines are used instead. The caption notes that the two-sided bound is Mathlib's
`Asymptotics.IsTheta` at the filter `UpperHalfPlane.atImInfty`, as the reviewer suggested.

**B. Related work in other proof assistants.** The reviewer's specific pointer was checked rather
than taken on trust, and it is correct. Both AFP entries exist and are now cited:

- *Dedekind Sums* — Eberl, Bordg, Paulson, Li (2025), which defines
  `s(h,k) = Σ (r/k)({hr/k} − 1/2)` and proves reciprocity;
- *Rademacher's Series for the Partition Function* — Eberl, Paulson.

This is a genuine strengthening, not a courtesy citation: it shows the obstructed component is a
**gap in Mathlib**, not a difficulty of principle, and gives the eventual Mathlib PR a worked
reference. Section 5 now says so.

**C. Why soft methods fail on hyperbolic generators.** Expanded, in the reviewer's terms: a
character into `μ₂₄` factors through the abelianization; for genus ≥ 1 levels `Γ₀(N)^ab` has free
factors of rank `2·genus(X₀(N))`; on an infinite-order generator a torsion relation like `w²⁴ = 1`
constrains the image only to lie in `μ₂₄`, never says which root of unity. Added the contrast that
makes Section 4 work: at small level `Γ₀(N) = ⟨−I, T, V⟩` and `w` *is* pinned on each generator.

**D. Assembly into `ModularForm`.** This exposed a **stale limitation in the paper**, not just a
gap in the exposition. Limitation (d) said the assembly was "not yet done". It **is** done:
`etaQuotientModularForm` is a term of Mathlib's `ModularForm (Gamma0 N) k` for `N ≤ 4` and even `k`.
New Remark 4.2 states what it actually costs:

- Ligozat's condition (iii) enters as the hypothesis `hbd`, not derived from the cusp orders.
  Deriving it needs the order at a *general* cusp — the same obstruction. Theorem 3.1 supplies the
  analytic content; the missing piece is the bridge from a Θ-asymptotic to `IsBoundedAtImInfty` at
  a cusp of width ≠ 1. That is API resting on an obstructed input.
- The even-`k` hypothesis is **not** bookkeeping. For odd `k` the conclusion is *false*: at `N = 3`,
  `r₁ = −3`, `r₃ = 9` both congruences hold, yet the trivial-multiplier conclusion fails at
  `γ = −I`. The counterexample is formalized as a guard.

**Minor.** `14 (3%)` replaces the em-dash construction. The genus clause is parenthesised
(`genus(X₀(N)) ≥ 1 (for instance N = 11, and most N ≥ 17)`) so the em-dash cannot read as a minus
sign. "the Θ-relation is taken along the filter `atImInfty`" supplies the missing noun.

## Not applied

**The "single γ" correction would introduce an error.** The reviewer reads
*"For a single [MISSING] this period function is Rademacher's [MISSING]"* and proposes *"for a
single **γ**"*. The source reads **`For a single $\eta$`** — a single Dedekind **eta function**, not
a group element. The sentence says: when the eta-quotient is a single `η` rather than a product, the
period cocycle *is* Rademacher's `Φ`. "For a single γ" would be meaningless, since `Φ` is a function
*of* γ. Applying the fix would have inserted a false statement into the paper. The dropped glyphs
are `η` and `Φ`, and both render correctly — verified by rendering page 1 at 300 dpi.

**φ / ψ are already distinct.** Checked: the paper uses `\varphi` for Euler's totient and `\psi` for
the Dedekind psi function, which render as visibly different glyphs.

## What the review could not see, and what it caused

The reviewer flagged `ord^raw` as "mangled", `and every ∈ γ ∈ SL₂(ℤ)` as an extraneous symbol, and
several dropped glyphs — correctly hedging that these might be extraction artifacts. **All of them
were.** Each was checked against the LaTeX source and against the rendered page; the PDF is correct
in every case. This is the failure mode recorded as LL-16: `pdftotext` and rendering catch disjoint
defect classes, and extraction alone produces confident false reports.

The reverse also happened, and it justifies the review. Adding the artifact paragraph introduced a
**246 pt overfull hbox** — the module path ran visibly off the right edge of page 6 — which no text
extraction would have revealed and which I found only by rendering while checking the reviewer's
items. It is fixed; the worst remaining overfull is 7.3 pt, with none above 10 pt.
