# SUBMISSION — Fricke involution work

**Status changed 2026-09-06: DO NOT submit as a paper. Pursue the Mathlib PR.**

## Why the change

The prior-art determination in `PRIOR_ART_FINDING.md` established that
`anthropics/fermats-last-theorem` — a public Lean 4 + Mathlib artifact this work cites — already
contains Fricke and Atkin–Lehner material covering strictly more than ours, including a
near-verbatim equivalent of our `frickeConj`. The paper's priority claim was therefore false and
has been removed; the paper now carries a `Related work` section stating the situation plainly.

What survives is real but modest: **Mathlib itself still has no Fricke/Atkin–Lehner operator**
(verified by compiling), and our development is packaged as reusable API rather than
proof-internal infrastructure. That is a contribution judged on usefulness, which is what a
library PR is for — and not enough to carry a formalization-venue paper on its own.

## Recommended path: Mathlib pull request

1. **Commit and tag the work.** Currently all four Fricke modules, `FinalCheck.lean` and `dag/`
   are untracked, and the tag `fricke-v1` does not exist (only `v1.0.0`):
   ```bash
   cd ~/xdev/SocrateAI-Lean-Lib
   git add Lean/SocrateAI/ModularForms/Fricke*.lean Lean/SocrateAI/FinalCheck.lean dag/ lakefile.lean lake-manifest.json
   git commit -m "Fricke involution on Gamma0(N) and its operator on modular forms"
   git tag fricke-v1 && git push origin main --tags
   ```
2. **Port to Mathlib conventions** — this is the substantive step, not a formality:
   - target file `Mathlib/NumberTheory/ModularForms/AtkinLehner.lean`;
   - drop the `SocrateAI` namespace; use Mathlib naming (`fricke`, not `frickeW`);
   - generalize `N : ℕ` with `0 < N` to `N : ℕ+` or add `[NeZero N]`;
   - `Gamma0GL` should probably not exist as a standalone definition — Mathlib will likely want
     the statements phrased directly over `(Gamma0 N).map (mapGL ℝ)`;
   - the local `lakefile.lean` hard-codes absolute paths to a shared package pool and must not be
     part of the PR.
3. **Cite `[FLT2026]` in the module docstring** as related work. Reviewers will find it anyway;
   finding it in your own docstring is much better than finding it themselves.
4. Expect review on the API shape. That is the point of the exercise.

## Fixes already applied from the review (workflow `w7vzrm9j2`)

| Finding | Status |
|---|---|
| Priority claim false | **fixed** — claim removed, `Related work` section added |
| `\detokenize` doubled `#` (`##print axioms`) | fixed |
| Listings visually corrupted (`{γ`→`γ{`, `hdet⟩`→`)hdet`) | fixed — `listings` → `fancyvrb` |
| Stale "single self-contained module" / guard counts | fixed |
| "Normalizes" over-claim vs. one-sided containment | fixed |
| `Gamma0GL` plain `def` blocks `HasDetOne` | fixed — now `abbrev`; instance verified to fire for the underlying expression (needs rebuild to confirm end-to-end) |
| Artifact absent at cited address (tag, untracked files) | **open** — step 1 above |
| Missed prior art: `ModularForm.translate`, `ModularGroup.S` (N=1 case) | **open** — add to the Related work inventory |

## If a paper is still wanted later

The honest framing would be an experience report — *what it costs to build a small piece of
library-quality formal API, and what an adversarial review pass catches* — with this episode as
its central case study. That is a different paper, and `LL.md` is most of its raw material.
