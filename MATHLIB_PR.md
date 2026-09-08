# Mathlib contribution guideline

Three candidate PRs came out of runs 2 and 3. They are listed in the order we should attempt them,
which is **not** the order of mathematical importance — it is the order of increasing risk, so that
the first one teaches us the review process before we spend effort on the one that matters most.

| | PR | Size | Risk | Value |
|---|---|---|---|---|
| **PR-1** | Fricke involution `W_N` and its operator | ~300 lines | Low | Fills a real gap; small |
| **PR-2** | Dedekind sums `s(d,c)` + reciprocity | ~200 lines | Low | Prerequisite for PR-3 |
| **PR-3** | Rademacher `Φ` as the period of `E₂` | ~400 lines | Medium | **Unlocks general-N Ligozat for everyone** |

PR-3 is the one that matters. It is also the one where Mathlib already did half the work for us:
the analytic side (`E2_slash_action`, the `D2` machinery in
`NumberTheory/ModularForms/EisensteinSeries/E2/Transform.lean`) exists, and `Φ` is exactly the
period cocycle of `E₂`. Building it that way rather than via an explicit Dedekind-sum formula is
both more idiomatic and less work.

## Before any PR: the blocker that applied to all three — RESOLVED (commit 0b25c93)

The lakefile used to hard-code two absolute paths into a local Mathlib package pool. Fixed:
`lakefile.lean` now requires Mathlib from git at the pinned revision, and `lakefile.lean`,
`lake-manifest.json`, `lean-toolchain` are committed. `BUILDING.md` documents the local-pool
convenience override (`local-packages.json`, gitignored) separately from the portable committed
config. Not yet independently verified by an actual from-scratch clean-clone build on a machine
with enough disk for a fresh `lake exe cache get` — that remains the real test.

## Prior art discovered since (2026-09-08) — applies to PR-2 and PR-3, not just PR-1

A follow-up run found that `anthropics/fermats-last-theorem` (Apache-2.0) already contains, sorry-
free: `Definitions/Def_NumberTheory_DedekindSum.lean` (the Dedekind sum and 19 lemmas — **PR-2's
core content is close to a verbatim match**, confirmed 21/21 declarations byte-identical after
whitespace normalisation) and `Theorems/Thm_rademacher_phi_step.lean` (a Euclidean-descent step
toward Φ, though not Φ itself as a named function with a cocycle law). See
`Lean-Lib/ATTRIBUTION.md` for the full, file-by-file account, including what our own port added
and what remains independently ours. **Any PR-2 or PR-3 submission must disclose this in the PR
description and the module docstring** — the same standard PR-1's guideline already applied to the
Fricke prior art. Apache-2.0 to Apache-2.0 (Mathlib's own licence) is licence-clean; a maintainer
discovering unattributed near-identical text after merge is a much worse outcome than disclosing
it up front.

## House rules (they will be enforced in review)

- **Line length is 100 characters.** Count *characters*, not bytes — Lean source is dense with
  multi-byte Unicode and `awk`/`wc -c` over-report by 10–20%. Use
  `python3 -c "..."` with `encoding='utf-8'` and `len(str)`. We once reported a phantom
  seven-line violation this way (LL-17).
- **Licence header** on every file: `Copyright (c) 2026 ... Released under Apache 2.0 license as
  described in the file LICENSE.` with `Authors:`. Mathlib is Apache-2.0; our repo is MIT, so this
  must be changed for the PR.
- **Module docstring** stating what the file provides and its main results.
- **Docstring on every public declaration**, `/-- ... -/`.
- **Naming**: `lowerCamelCase` for `def`, `snake_case` describing the statement for `theorem`
  (`frickeW_mem_GLPos`, not `fricke_positive`). Names read as the statement.
- **No `sorry`**, obviously; also no project-local axioms.
- Prefer `ℕ+` or `[NeZero N]` over a bare `0 < N` hypothesis where the level must be positive.
- Do not introduce a competing notion of something Mathlib already has. Run 3 deliberately used
  Mathlib's `meromorphicOrderAt` and `cuspFunction` rather than defining an order-at-a-cusp.

## PR-1 — Fricke involution

**Files**: `Mathlib/NumberTheory/ModularForms/FrickeInvolution.lean` (one file; our four modules
should be merged, they are small).

**Content**: `frickeW` as a `GL (Fin 2) ℝ` element via `mkOfDetNeZero`; `frickeW_mem_GLPos`;
`frickeW_sq_coe : W² = -N • 1`; `frickeConj` and the conjugation formula; `frickeW_normalizes_Gamma0`;
the induced operators on `SlashInvariantForm` and `ModularForm`; `frickeW_sq_slash`.

**Changes required from our version**:

1. Drop `Gamma0GL` as a standalone declaration — inline `(Gamma0 N).map (mapGL ℝ)`, or propose it
   separately. As an `abbrev` it was only introduced to make instances synthesize.
2. Re-parameterise on `ℕ+` / `[NeZero N]`.
3. Apache-2.0 header, module docstring, per-declaration docstrings.
4. **Cite the prior art in the module docstring.** `anthropics/fermats-last-theorem` contains
   `atkinLehnerLin`, a ℂ-linear operator on `ModularForm` for the whole Atkin–Lehner family, and
   `CohCarrier.frickeMat` which is our `frickeConj`. We claim no priority and the docstring should
   say so. A maintainer who discovers this after merge is a much worse outcome than one who reads it
   in the diff.

**Expected pushback**: "why not the whole Atkin–Lehner family?" A fair question. The honest answer
is that `W_N` is the case with a canonical name and the widest downstream use, and the family
(`ALQ-01`) is a natural follow-up we have scoped but not proved. Be ready to either commit to the
family or justify the special case.

## PR-2 — Dedekind sums

**File**: `Mathlib/NumberTheory/DedekindSum.lean`.

**Content**: `s(d,c) = Σ_{n=1}^{c-1} ((n/c)) ((nd/c))` with `((x))` the sawtooth, plus:
elementary values, `s(d,c)` depends only on `d mod c`, `s(-d,c) = -s(d,c)`, and **reciprocity**
`s(d,c) + s(c,d) = -1/4 + (c/d + d/c + 1/(cd))/12` for coprime positive `c,d`.

Mathlib has `Int.fract` and the tooling for the sawtooth. Reciprocity is the one real proof; the
standard route is the cotangent-sum or the lattice-point count. This is self-contained, classical,
and uncontroversial — a good PR to run second.

## PR-3 — Rademacher's `Φ` (the one that matters)

**File**: `Mathlib/NumberTheory/ModularForms/RademacherPhi.lean`.

**Content**: `Φ : SL(2,ℤ) → ℤ` with

- the cocycle law `Φ(AB) = Φ(A) + Φ(B) − 3·sign(c_A · c_B · c_AB)`;
- the closed form `Φ(γ) = (a+d)/c − 12·sign(c)·s(d,|c|) − 3·sign(c(a+d))` for `c ≠ 0`, linking it
  to PR-2;
- as a corollary, the **Petersson–Rademacher multiplier**
  `η(γz) = exp(πi((a+d)/(12c) − s(d,c) − 1/4)) · √(cz+d) · η(z)` for `c > 0`.

**Build it as the period of `E₂`.** `Φ` is the period cocycle of the weight-2 quasi-modular
`E₂`, and Mathlib already has `E2_slash_action` and the `D2` machinery. Constructing `Φ` from the
existing `E₂` transformation gives the cocycle law almost for free and makes the PR read as an
extension of what is there rather than a new island. This is the argument to lead with when
proposing it on Zulip.

**Why it is worth more than PR-1**: with the multiplier, general-`N` Ligozat becomes moderate
bookkeeping on top of what run 3 already formalized — so this single addition converts our bounded
`N ∈ {1,2,3,4,5,7,13}` result into the general theorem, and does the same for anyone else who needs
eta-quotients. It is the highest-leverage thing this programme can contribute upstream.

## Process

1. **Zulip first.** Post in `#mathlib4` → `Is there interest in X?` before opening any PR. For PR-3
   describe it as "Rademacher's Φ as the period of E₂" and mention the existing `E2` machinery.
   This also closes the two prior-art corpora we have never checked — Zulip and open mathlib4 PRs —
   which is the standing gap in every novelty claim we have made.
2. Sign the CLA; fork; branch per PR.
3. Open as **draft** until CI is green. `lake exe cache get` before building.
4. Expect the style linter to be strict and mechanical. Fix and move on.
5. One reviewer, several rounds, weeks not days. Do not batch unrelated changes.

## Order of operations

```
portable lakefile  →  Zulip post (all three)  →  PR-1 Fricke  →  PR-2 Dedekind sums  →  PR-3 Φ
                                                     ↑                                    ↓
                                              learn the process              general-N Ligozat unlocked
```

If Zulip says PR-3 is already in progress by someone else, that is a **good** outcome: it removes
the obstruction without our effort, and the draft paper's §5 should then cite their work and drop
the obstruction to a remark.
