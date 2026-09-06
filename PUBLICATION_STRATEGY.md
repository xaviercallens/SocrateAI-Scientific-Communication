# Publication strategy — run 3 onward

*Written 2026-09-06, after the Fricke artifact was archived at
[10.5281/zenodo.22542571](https://doi.org/10.5281/zenodo.22542571).*

## 0. Where the programme actually stands

| | |
|---|---|
| Formal artifact | 27 declarations, 291 lines, 21 theorems, **0 `sorry`**, 3053-job build |
| Axiom discipline | 16 build-failing `#guard_msgs` guards; negative control verified failing |
| DAG | 15 nodes: **11 proved**, 3 open (`ALQ-01`, `ETA-01`, `FRK-11`), 1 blocked (`PHY-01`) |
| Published | GitHub (2 repos, releases), Zenodo (concept DOI, v1+v2), HuggingFace; HAL pending manual deposit |
| Standing verdict | **REJECT as a venue submission.** The Fricke note is archived, not submitted. |

The honest summary of runs 1–2: we built a small, genuinely verified artifact, discovered our
priority claim was refuted by a repository our own bibliography cited, withdrew it, and published
the result as an archival deposit with the withdrawal stated in every channel. That is a good
outcome. It is not yet a contribution the community has accepted.

## 1. The next move is not a paper

**Recommendation: `F3.0` — open the Mathlib PR first.** Before any new paper.

This is the single highest-value action available and it is already scoped. Mathlib has the machinery
to host a Fricke operator and none of the operator; the run-2 review's recommendation was a PR, not a
submission; and an accepted Mathlib PR is *community acceptance in the form the community actually
recognises*. A preprint nobody reviewed is not.

Fold into that PR the two frontier nodes that are **not** paper material:

- **`ALQ-01`** (Atkin–Lehner family `W_Q`, `Q ∥ N`) — the FLT artifact already ships
  `atkinLehnerLin`, a ℂ-linear operator on `ModularForm` for the whole family. Writing a paper about
  this would repeat run 1's exact mistake. As Mathlib code it is still wanted.
- **`FRK-11`** (even-`k` normalisation, `f ↦ N^(1-k/2)(f∣ₖW_N)` squaring to the identity, giving the
  ±1 eigenspace decomposition) — bookkeeping on an already-proved theorem, too small to publish.

Blockers to clear first, both already identified:

1. **Portable `lakefile.lean`** — currently hard-codes two absolute paths into a local Mathlib pool.
   Nobody outside this machine can build the artifact. This blocks the PR *and* it is the standing
   reproducibility defect stated in both papers.
2. Naming, `ℕ+`/`[NeZero N]` conventions, licence header, drop `Gamma0GL` as a standalone def, cite
   `[FLT2026]` in the module docstring.

Cost is small — days, not weeks — and it converts existing work into acceptance.

## 2. The next paper: Ligozat's criterion (`ETA-01`)

**Gate zero was run before recommending this**, which is the run-1 lesson applied. Evidence, with
the commands, on 2026-09-06:

| Corpus | Result |
|---|---|
| Mathlib @ `905b9581` | `DedekindEta.lean` exists — 20 declarations: `eta`, `eta_ne_zero`, `differentiableAt_eta`, `logDeriv_eta_eq_E2`. **`EtaQuotient`: 0 files. `Ligozat`: 0 files.** |
| `anthropics/fermats-last-theorem` | `Ligozat`: 3 files — but all are *namespace labels* (`LigozatUnitEngine`, `LigozatUnitAL`) on proof-internal modular-**unit** machinery over Laurent/Hahn series, **not** the modularity criterion. `etaQuotient`: 50 files, all `ModularCurve_*`/`sharpUnit*` — modular units, not eta-quotient modularity. |
| GitHub-wide `language:lean` | `Ligozat`: **0**. `etaQuotient`/`eta_quotient`: 5 hits, all unrelated projects (Chronofold, a Feit–Thompson development). |

**Not checked, and named as such:** Lean Zulip, open mathlib4 PRs, other proof assistants.
Coverage is evidence, never proof — and note the global index disagrees with repo-scoped counts, so
a global 0 is weaker than it looks.

**Verdict: `ETA-01` is a paper.** Mathlib has η but no eta-quotients; the criterion itself is
unformalized as far as three independent corpora can show. It also sits directly on run-2's work
(`ETA-01` depends on `FRK-09`, proved) and it is the only node that unblocks `PHY-01`, the bridge to
the programme's physics claims.

### The ladder — three deliverables, easiest first

Ligozat's criterion is too big for one jump. Its statement — that
$f(\tau) = \prod_{\delta\mid N}\eta(\delta\tau)^{r_\delta}$ lies in $M_k(\Gamma_0(N))$ given two
mod-24 congruences and nonnegative order at every cusp — needs the cusp-order formula, the
congruences, and the modularity transfer. Split it:

| | Deliverable | Content | Risk |
|---|---|---|---|
| **F3.1** | *Eta-quotients in Lean 4: definition, weight, and order at the cusps*<br>*Quotients êta en Lean 4 : définition, poids et ordre aux pointes* | The eta-quotient as a function on ℍ built on Mathlib's `eta`; weight $k=\tfrac12\sum r_\delta$; the order-at-cusp formula $\operatorname{ord}_{c}(f)=\frac{N}{24}\sum_{\delta\mid N}\frac{\gcd(\delta,c)^2 r_\delta}{\gcd(c,N/c)\,c\,\delta}$. Arithmetic and computable — every instance is machine-checkable against tables. | **Low.** Definitions plus one formula. Ships even if F3.2 stalls. |
| **F3.2** | *Ligozat's criterion, formalized*<br>*Le critère de Ligozat, formalisé* | The modularity theorem: the two mod-24 congruences + nonneg cusp orders ⟹ modular on $\Gamma_0(N)$. The main result. | **Medium-high.** The transfer to `ModularForm` is real work; the congruences are fiddly. |
| **F3.3** | *The extremal level-12 eta-quotient*<br>*Le quotient êta extrémal de niveau 12* | Applies F3.2 to the level-12 case. `docs/Extremal_Level12_EtaQuotient.tex` already exists as a draft. Unblocks `PHY-01` and is the first honest math→physics bridge in the programme. | **Medium.** Depends on F3.2 landing. |

Publish **F3.1 and F3.2 in English and French together**, from the start — retrofitting the French
version cost an extra rebuild cycle this run. F3.3 only after F3.2 is accepted somewhere.

Both languages go to Zenodo under one concept DOI; the French to HAL (`math.NT`, secondary
`cs.LO`); English to arXiv **only if** gate zero still holds at submission time and the review
verdict is PUBLISH rather than ARCHIVE_ONLY.

### Why this ordering earns consensus

Each rung is independently checkable, none claims priority it cannot defend, and F3.1 is publishable
on its own if F3.2 turns out harder than scoped. That is the opposite of run 1, which had a single
all-or-nothing claim that a single search destroyed.

## 3. The workflow

`.claude/workflows/paper-run.js` — seven phases, and the important change is that **the cheap phase
can kill the run**:

```
GateZero (T2 opus)  → prior art across 3 corpora; returns PAPER | MATHLIB_PR_ONLY | DROP
   ↳ aborts here if not PAPER — zero proof effort spent
Statements (T2)     → DAG nodes + Lean statement layer with `sorry`, typechecking
Compare (T2)        → statement comparator BEFORE any proof (LL-1: green build, wrong theorem)
Prove (T2, worktree)→ leaf-first, one agent per node, pipelined — no barrier
Guard (T0 haiku)    → build, guard count, negative control, DAG validator, char-count
Review (T2 ×3)      → novelty / correctness / reproducibility, in parallel
Verdict (T3 xhigh)  → PUBLISH | ARCHIVE_ONLY | MATHLIB_PR_ONLY | REWORK + the framing text
```

Two design points carried from the run-1/2 failures. Compare runs *before* Prove, pipelined per node,
so a mismatched statement is never proved. And the Verdict phase writes the framing that goes into
the README, dataset card and DOI description — not only the paper, because a downstream reader sees
the deposit description first. Run 2 had to retrofit that into three channels.

Model tiers follow the programme policy: T0 haiku for mechanical counting, T2 opus for judgment,
T3 opus xhigh for the reconciliation. Nothing needs T4/fable at this level — the mathematics is
classical and the difficulty is bookkeeping, not insight.

## 4. Cost — measured, not estimated

From this session's transcript, 929 API calls over 8.5 hours covering runs 1 and 2 end to end:

| Segment | Calls | Output | Cache write | Cache read | API-equiv |
|---|---|---|---|---|---|
| Formalization (runs 1–2) | 640 | 1,095,370 | 7,392,514 | 367,252,731 | $257 |
| Publication (run 2) | 289 | 305,685 | 5,554,483 | 79,739,868 | $82 |
| **Total** | **929** | **1,401,055** | **12,946,997** | **446,992,599** | **$339** |

API-equivalent at Opus 5 list ($5/$25 per 1M in/out, cache write 1.25×, cache read 0.1×). On a Max
subscription you are **not** billed this — it is the honest scale marker for what the work consumes.

**The cost is 66% cache reads.** Output is only 10%. That single fact is the lever: 447M cache-read
tokens across 929 calls means roughly **481k tokens of context re-read on every call**. This session
ran as one continuous 8.5-hour context covering two papers, a Mathlib integration, a pivot, and the
whole publication surface.

### Estimate for run 3 (F3.0 + F3.1 + F3.2)

| | Estimate | Reasoning |
|---|---|---|
| F3.0 Mathlib PR | ~$40–60 | Portable lakefile + naming. Mostly mechanical, no new mathematics. |
| F3.1 eta-quotients | ~$70–100 | One definition layer and one formula. Infrastructure now exists. |
| F3.2 Ligozat | ~$150–220 | The real proving effort; harder than Fricke. |
| Publication, both languages | ~$60–80 | Pipeline exists and is scripted now; French from the start avoids a rebuild. |
| **Run 3 total** | **~$320–460** | Comparable to this session, for more mathematics. |

**Cut it by roughly half by splitting the work into separate sessions** — one per phase (gate zero;
statements; proofs; paper; publication). Each starts with a small context instead of inheriting
480k. If average context drops to ~150k, cache reads fall ~3× and take most of the cost with them.
Concretely: run `F3.0`, `F3.1` and `F3.2` as three or four separate Claude Code sessions, not one
marathon. That is the highest-leverage change available and it costs nothing but discipline.

### Quota

I cannot read your quota meter — **run `/usage` in Claude Code** for actual remaining daily and
weekly allowance on your Max plan. What I can tell you is the shape of the demand:

- one session like this one = ~461M billable tokens of all kinds, 8.5 hours of near-continuous use;
- the binding constraint on Max is the rolling window, not a token budget, and long single sessions
  concentrate demand into one window — another argument for splitting;
- run F3.0 (cheap, mechanical) in a window where you have headroom, and reserve a fresh window for
  F3.2's proving phase, which is the part that will actually stall if throttled.

## 5. What would make me change this recommendation

- **Gate zero flips.** If a Lean formalization of Ligozat surfaces on Zulip or in an open mathlib4
  PR — the two corpora I did *not* check — `ETA-01` becomes `MATHLIB_PR_ONLY` and F3.2 is dropped.
  Check those two before starting F3.2, not after.
- **The Mathlib PR is rejected.** If maintainers do not want the Fricke operator, that is strong
  evidence the packaging contribution is worth less than assumed, and the programme should move to
  the physics bridge (F3.3/`PHY-01`) rather than more modular-forms infrastructure.
- **F3.2 stalls past its budget.** Ship F3.1 alone. It is designed to stand without F3.2.
