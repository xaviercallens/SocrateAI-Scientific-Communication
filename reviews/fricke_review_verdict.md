# Review Outcome — `docs/Lean4_Fricke_Involution.tex`

**Targets:** CPP short paper; Mathlib pull request.
**Reviewed text:** the 14:01 revision (`docs/Lean4_Fricke_Involution.tex`, mtime `2026-09-06 14:01:28`), which post-dates the per-lens audits by ~17 minutes. Several findings below are therefore reported as *already fixed*; three that the upstream lenses graded blocking survive unchanged.

---

## 1. VERDICT

### **REJECT** — do not submit this text. Resubmittable after a claim-level rewrite, not a copy-edit.

Three reasons, each of which I established by running something in this session.

**(a) The abstract's headline claim is false, and it is refuted by a source the paper itself cites three times.** Line 76 reads "the first formalization, in Lean 4 with Mathlib, of the Fricke involution … *and of the operator it induces on modular forms*." `anthropics/fermats-last-theorem` — cited as `FLT2026` at lines 118, 362, 450 — went public `2026-09-04T14:21:04Z`, two days before this paper's `\today`. Its `Definitions/Def_CuspForm_AtkinLehnerOperator.lean` defines

```
def atkinLehnerLin [NeZero M] (W : AtkinLehnerDatum M q) (k : ℤ) :
    ModularForm (CongruenceSubgroup.Gamma0 M) k →ₗ[ℂ] ModularForm (CongruenceSubgroup.Gamma0 M) k
```

discharging `slash_action_eq'`, `holo'` and `bdd_at_cusps'` — the paper's (C5)+(C6), for the whole Atkin–Lehner family, **as a ℂ-linear map**. It contains no `sorry`, and its sibling `Def_ModularForm_AtkinLehnerDatum.lean` opens with `import Mathlib`, so the abstract's "with Mathlib" qualifier does not scope the claim away. The second conjunct of the priority sentence is simply false.

**(b) The artifact does not exist at the URL and tag the paper gives.** `git tag -l` in `/home/xavkal/xdev/SocrateAI-Lean-Lib` prints only `v1.0.0`; the cited `fricke-v1` (line 376) does not exist. `git ls-files Lean/SocrateAI/ModularForms/` returns exactly one file, `PoincareUpperHalfPlane.lean` — all four Fricke modules, `FinalCheck.lean` and `dag/` are `??` untracked. And `lakefile.lean` hard-codes `packagesDir := "/home/xavkal/xdev/SocrateAI-Scientific-Measure/lean/.lake/packages"` plus `require mathlib from "/home/xavkal/…/mathlib"`, so a fresh clone would not build even after a push. CPP runs artifact evaluation; this fails it on contact.

**(c) The stated justification for the paper's own (C5)/(C6) is false at the type they land in.** Line 176: "so that the Fricke operator can be composed with the rest of the library." I compiled against the shipped artifact: `Module ℂ (ModularForm (Gamma0GL N) k)` **fails instance synthesis**. The operator cannot currently be stated as ℂ-linear — precisely the form in which the prior art of (a) already ships it. The paper is, on this axis, strictly weaker than the uncited concurrent work.

**On the residual contribution.** After an honest FLT disclosure the delta is: the literal matrix $W_N$ over ℝ (FLT's `frickeW` search returns 0 hits; its `AtkinLehnerDatum.mat` has lower-right entry $q$, so it cannot express $W_N$ on the nose), the explicit composite scalar $(-1)^kN^{k-2}$ of (C7), and a four-named-import development against FLT's `import Mathlib` + bespoke `p2m_exact_reverting` harness. That is real but thin, and it is a *different paper* from the one submitted — a minimal-import/axiom-gate methodology note, not a priority note. The rewrite is therefore not a revision of this text's claim; it is a replacement of it. Hence REJECT rather than MAJOR_REVISION.

**Mathlib PR:** proceed, and proceed *first* — it is the stronger route and is unaffected by (a). It is blocked only on licensing/header/naming and the `HasDetOne` instance, all mechanical.

---

## 2. BLOCKING

| # | Finding | Evidence I ran |
|---|---|---|
| **B1** | **Priority claim refuted** (abstract :76). | `gh api repos/anthropics/fermats-last-theorem --jq .created_at` → `2026-09-04T14:21:04Z`. Fetched three files: `Def_CohCarrier_Fricke.lean` (177 lines, `grep -c sorry` = 0) with `frickeMat`, `N_dvd_of_mem_Gamma0`, `frickeMat_mem_Gamma0`, `frickeMat_mul`, `frickeMat_frickeMat`, `frickeHom`, `frickeEquiv : GammaH N H ≃* GammaH N H`; `Def_ModularForm_AtkinLehnerDatum.lean` (157 lines, 0 sorry, `import Mathlib`) with `alGL` built by the *same* `Matrix.GeneralLinearGroup.mkOfDetNeZero` idiom, `val_det_alGL`, `det_alGL_pos`, `σ_alGL_apply`, `mat_sq`, `sqUnitSL_mem`; `Def_CuspForm_AtkinLehnerOperator.lean` (64 lines, 0 sorry) with `ModularForm.atkinLehnerLin` and `CuspForm.atkinLehnerLin`, both `→ₗ[ℂ]`. Sympy check that the datum specializes: `q=M, R=1, a=0, b=-1` ⟹ bezout `q*a − R*b = 1` ✓, `mat = !![0,−1;M,M]`, and `W_M⁻¹ · mat = !![1,1;0,1]` with lower-left `0`, i.e. in `Gamma0(M)`. |
| **B2** | **Artifact unpublished; cited tag does not exist; lakefile unportable.** | `git tag -l` → `v1.0.0` only. `git ls-files Lean/SocrateAI/ModularForms/` → `PoincareUpperHalfPlane.lean` only. `git status --short` → `?? FrickeInvolution.lean`, `?? FrickeSlash.lean`, `?? FrickeModular.lean`, `?? FrickeComposite.lean`, `?? Lean/SocrateAI/FinalCheck.lean`, `?? dag/`. `cat lakefile.lean` → two absolute `/home/xavkal/…` paths. |
| **B3** | **"composed with the rest of the library" (:176) false as shipped.** | `lake env lean scratch/LeadC03.lean`: the *unfolded* `((Gamma0 N).map (Matrix.SpecialLinearGroup.mapGL ℝ)).HasDetOne` synthesizes clean; through the paper's abbreviation, both `(Gamma0GL N).HasDetOne` and `Module ℂ (ModularForm (Gamma0GL N) k)` fail (`EXIT=1`). Two-line repair `instance : (Gamma0GL N).HasDetOne := by unfold Gamma0GL; infer_instance` makes `Module ℂ (…)` synthesize — `lake env lean scratch/LeadC03fix.lean`, `EXIT=0`. |

**Also must-fix before any submission (not verdict-driving, but each is a wrong number a referee reproduces in one command):**

- **:381** "2346 jobs" — `lake build SocrateAI` here: `Build completed successfully (3053 jobs).` `EXIT=0`, 3.2 s. The upstream pass reported 3052 on the same tree, so the figure is not stable; delete the clause rather than correct it.
- **:91** "16 build-failing `#guard_msgs` checks" — `grep -c '^#guard_msgs' FinalCheck.lean` → **15**. The 16th match of the bare string is inside the file's header comment at line 4.
- **:364** "each of the eight headline theorems" — `cat -n FinalCheck.lean` shows 15 guards spanning all four modules (`frickeMatrix_det` … `frickeW_sq_slash`), including `slash_frickeW_invariant` (C5), `frickeModularOperator` (C6), `frickeW_sq_slash` (C7). The abstract and §6 contradict each other.
- **:213–215** Listing 1 is captioned "verbatim from the compiled source" but applies `frickeMatrix_det_ne_zero`, which it never defines and which no ellipsis marks. I transcribed it as printed with only the module's real imports/opens: `error(lean.unknownIdentifier): Unknown identifier 'frickeMatrix_det_ne_zero'`.
- **:355** "Every declaration in **the module** compiles" — singular survivor of the one-module draft; :204 now correctly says "four modules".
- **:85** abstract says "$W_N$ **normalizes** $\Gamma_0(N)$", but the shipped theorem is the one-sided inclusion and (C4) at :162–165 already discloses "we formalize the containment". The abstract should not be stronger than the contribution list.
- **Licensing (Mathlib PR only).** Artifact headers: `Copyright (c) 2026 SocrateAI Contributors. Released under MIT license.`; `LICENSE` is MIT. Mathlib at the pin requires the Apache-2.0 block with an `Authors:` line, then `module` / `public import` — I read `Mathlib/NumberTheory/ModularForms/CongruenceSubgroups.lean` head, the very file the artifact imports. Namespace is `SocrateAI.ModularForms`.

---

## 3. APPLY ORDER

Apply in this order; each group is independently buildable.

**Group 0 — author decisions required first (these change what the paper claims).**

| # | Patch | Decision needed |
|---|---|---|
| 1 | `C-01` abstract rewrite (:76) — drop "the first", insert "We claim no priority" + forward-ref to `\S\ref{sec:related}`. | **Accept.** The proposed replacement is correct and I verified its factual content. Do *not* try to rescue the claim by narrowing to "the literal matrix $W_N$" — that is true (`frickeW` → 0 hits in FLT) but is not a CPP contribution on its own. |
| 2 | `C-01` new `\paragraph{Concurrent formal work.}` in §7 (before "We state the limitations plainly."). | **Accept with one correction.** The draft is accurate. Verify the sentence "None of those files contains a `sorry`" — I confirmed it for the three files (`grep -c sorry` = 0 each), but it must not be generalized to the repository. Keep the explicit "We did not compile [FLT2026]" caveat; it is the honest tier statement. |
| 3 | `C-02` artifact-paragraph rewrite (:374–390). | **Decide the artifact question, then choose.** If you push+tag+fix `lakefile.lean` before submission, keep a normal artifact paragraph with the *real* tag and drop the job count. If you do not, the proposed "Artifact, and its present unavailability" wording is the only honest option — but a paper that admits its artifact is unavailable will not pass CPP artifact evaluation. **Recommendation: fix the repository, don't document the breakage.** |
| 4 | `C-03` conclusion caveat (:176) + the `HasDetOne` instance in `FrickeModular.lean`. | **Land the Lean instance instead of the caveat.** I compiled the two-line fix (`EXIT=0`). Adding it makes :176 true and removes the need for the paragraph-long disclosure; then patch :176 only to say the operator is ℂ-linear once you have actually restated it as such. If you ship without the instance, the caveat is mandatory. |
| 5 | `EXPO-13` drop "eleven days" (:118). | **Accept.** The FLT README states no overall duration (I fetched it via `gh api`; only build/comparator/nanoda timings). The figure appears in your own `references.json` summary for `FLT2026`, so it is traceable but not sourced by the citation attached to it. Either drop it or cite something that states it. |
| 6 | `EXPO-16` `\date{\today}` → fixed date (:70). | **Accept.** Pin to the submission date. |

**Group 1 — factual corrections (safe, apply verbatim).**

7. `C-05` :91 `16` → `15`.
8. `C-05` :363–364 "eight headline theorems" → "fifteen theorems spanning all four modules, inside the default build target (`Lean/SocrateAI.lean` imports `FinalCheck`)". Verified: `Lean/SocrateAI.lean:91` is `import SocrateAI.FinalCheck`, and `lake build SocrateAI` exits 0.
9. `C-06` :355 "the module" → "the four modules".
10. `EXPO-10` Listing 1: restore `frickeMatrix_det_ne_zero` and `frickeMatrix_det_pos` verbatim from `FrickeInvolution.lean:35–42`. (I confirmed the listing fails to compile without them.)
11. `C-07` :85 abstract "normalizes" → "conjugation-stability, $W_Ng W_N^{-1}\in\Gamma_0(N)$"; theorem head :~258 "normalization" → "conjugation stability".
12. `C-01` :152–156 add "(re-run as `git grep -niE 'fricke|atkin' 905b9581 -- Mathlib/`, which matches no lines)" + the pointer to `\S\ref{sec:related}`. I re-ran this: **0 lines**. Keep the sentence; it is exactly right.
13. `C-09` §6 DAG paragraph: state that `check_dag.py` is a source-text regex and that enforcement comes from the guards. `python3 dag/check_dag.py` → `PASS — 15 nodes`, `EXIT=0`. *Correction to the upstream rationale:* `--` line comments do **not** match the regex (it anchors `^\s*` immediately before the keyword); only `/- … -/` block comments do. Edit the patch text accordingly.
14. `C-10` σ display (:142–143) → `σ_g(f(g·τ))` with a definition. `#check @UpperHalfPlane.σ` → `GL (Fin 2) ℝ → ℂ ≃A[ℝ] ℂ`.
15. `NOV-04` extend the Mathlib inventory (:144–146) with `ModularForm.translate`, `CuspForm.translate`, `conjGL`, `ModularGroup.S`. Verified at the pin by `git show 905b9581`: `Basic.lean:690`, `Basic.lean:707`, `CongruenceSubgroups.lean:200`, `SpecialLinearGroup.lean:819/826/829`.

**Group 2 — typesetting (safe).**

16. `\emergencystretch=4em` after `geometry`. Current log: **10** overfull hboxes (16.03, 20.75, 14.30, 2.42, 87.12, 25.99, 4.37, 10.78, **144.46**, 10.62 pt) — five of them at :375–390, the artifact paragraph.
17. Reword the two `\lean{}`-terminated list items (`denom_ne_zero_of_im`, `SlashInvariantForm`) per `EXPO-07`.
18. `\lean` macro (:15): add `\upshape`. Confirmed by reading the 150 dpi page-3 render — Theorems 3.1 and 3.2 set `frickeW_mem_GLPos …` in *slanted* monospace, inheriting the theorem environment's italic shape.

**Group 3 — Mathlib PR only (do not apply to the paper).**

19. Relicense the four modules to Apache 2.0 with an `Authors:` line; add the `module` / `public import` header; move to `Mathlib/NumberTheory/ModularForms/AtkinLehner.lean` under Mathlib's namespace; generalize `N : ℕ` + `0 < N` to `[NeZero N]`; land the `HasDetOne` instance.

**Patches to drop entirely:** none of the proposed set targets bibliography — correct, see §5. The `EXPO-02` (listing glyph) and `EXPO-06` (`##`) patches were not in the set and must not be applied: both defects are already fixed in the current build.

---

## 4. WHAT I VERIFIED MYSELF

| Command | Result |
|---|---|
| `git tag -l` / `git ls-files Lean/SocrateAI/ModularForms/` / `git status --short` (SocrateAI-Lean-Lib) | `v1.0.0` only; one tracked file (`PoincareUpperHalfPlane.lean`); four Fricke modules + `FinalCheck.lean` + `dag/` untracked. **B2 confirmed.** |
| `lake build SocrateAI` | `Build completed successfully (3053 jobs).` `EXIT=0`, 3.2 s. Paper says 2346. |
| `gh api repos/anthropics/fermats-last-theorem --jq '.created_at,.visibility,.pushed_at'` | `2026-09-04T14:21:04Z`, `public`, `2026-09-04T14:59:12Z`. |
| `gh api …/git/trees/main?recursive=1` \| `grep -iE 'fricke|atkin'` | 5 `Definitions/*` files + ~100 `P2M/Sol/*`. |
| Fetched + decoded `Def_CohCarrier_Fricke.lean`, `Def_ModularForm_AtkinLehnerDatum.lean`, `Def_CuspForm_AtkinLehnerOperator.lean` | 177/157/64 lines, `grep -c sorry` = 0/0/0. Read all declaration heads. `atkinLehnerLin : ModularForm (Gamma0 M) k →ₗ[ℂ] ModularForm (Gamma0 M) k`. `AtkinLehnerDatum` file opens `import Mathlib`. **B1 confirmed.** |
| Sympy check of the FLT datum at `q=M,R=1,a=0,b=−1` | bezout = 1 ✓, `hM` ✓, `mat = !![0,−1;M,M]`, `det = M`, `W_M⁻¹·mat = !![1,1;0,1]` (lower-left 0, det 1) ⟹ in `Gamma0(M)`. Specialization is admissible. |
| `lake env lean scratch/LeadC03.lean` | unfolded `HasDetOne` OK; `(Gamma0GL N).HasDetOne` and `Module ℂ (ModularForm (Gamma0GL N) k)` both `synthInstanceFailed`. `EXIT=1`. **B3 confirmed.** |
| `lake env lean scratch/LeadC03fix.lean` | two-line instance ⟹ `Module ℂ (…)` synthesizes. `EXIT=0`. Fix is real. |
| `lake env lean scratch/LeadL1.lean` (Listing 1 as printed) | `Unknown identifier 'frickeMatrix_det_ne_zero'`. "Verbatim" falsified. |
| `grep -c '#guard_msgs'` / `grep -c '^#guard_msgs'` on `FinalCheck.lean` | 16 / **15**; 16th match is the header comment at line 4. Guard targets listed (`frickeMatrix_det` … `frickeW_sq_slash`). |
| `grep -n 'FinalCheck' Lean/SocrateAI.lean` | line 91, `import SocrateAI.FinalCheck` — guards are in the default target. |
| `lake env lean scratch/GuardNegativeControl.lean` | fails as designed: `❌️ Docstring on '#guard_msgs' does not match generated message`, `- axioms: []` vs `+ [propext, Classical.choice, Quot.sound]`. The checker can fail (LL-1 hygiene satisfied). |
| Declaration census on the four modules | 27 decls (15/5/3/4), 21 theorems/lemmas, 291 lines (127+60+55+49), `grep -c sorry` = 0 in all four. **Paper's 27 / 21 / 291 / 0 are all correct.** |
| `cat lean-toolchain`; `git rev-parse --short=8 HEAD` + `git log -1 --date=short` in the pinned Mathlib | `leanprover/lean4:v4.32.2`; `905b9581`, `2026-07-28`. **Both paper claims correct.** |
| `git grep -niE 'fricke|atkinlehner' 905b9581 -- Mathlib/` \| `wc -l` | **0**. The paper's zero-occurrence sentence is exact. |
| `git show 905b9581:…` for `ModularForm.translate`, `conjGL`, `ModularGroup.S/coe_S/S_inv` | `Basic.lean:690`, `CongruenceSubgroups.lean:200`, `SpecialLinearGroup.lean:819/826/829`. All present. |
| `python3` `\cite`-extraction (multiline regex) against `references/references.json` | 12 cited keys, **all 12 present**; 159 top-level entries + a `references` list of 162. `FLT2026`, `Prove2Me2026`, `Tao2026AI`, `TaoEstimates2025` live in the list. |
| `pdftotext -layout` \| `grep 'γ'` and `grep '##'`; `pdftoppm -r 150` page 3, read directly | Listing 2 renders `{γ : SL(2, ℤ)} (hγ : γ ∈ Gamma0 N)` **correctly ordered**; zero `##` in the PDF. Theorem heads 3.1/3.2 render in *slanted* monospace. |
| `grep -c Overfull` on the log; `pdfinfo` | **10** overfull hboxes, worst 144.46 pt. **7 pages** (`SUBMISSION.md` says 5). |
| `python3 dag/check_dag.py` | `PASS — 15 nodes`, `EXIT=0`; `FRK-11` open. |
| `head -3` artifact modules + `LICENSE` vs Mathlib's `CongruenceSubgroups.lean` head | MIT + "SocrateAI Contributors" vs required Apache-2.0 + `Authors:` + `module`/`public import`. Namespace `SocrateAI.ModularForms`. |

---

## 5. CORRECTIONS TO THE REVIEWERS

**The reproduction block's `bibkeys_missing` is wrong — withdraw it.** It reports `FLT2026`, `Tao2026AI`, `TaoEstimates2025` missing. All twelve cited keys are present. `references.json` is a dict with 159 top-level keyed records **plus** a top-level `references` key holding a list of 162; those four live in the list. My script printed `top=False inner=True` for each. The block also silently *missed* `Prove2Me2026` — the Introduction's cite spans a line break (`\cite{FLT2026,\nProve2Me2026}`) and a single-line regex drops it. `EXPO-12` refuted this correctly; the correctness lens's `C-08` repeated the error and should be withdrawn too. **No bibliography patch is needed.** (Copy-editing only: `Mathlib2020` omits pages 367–381 and arXiv:1910.09336; `deMoura2021` prints "et al." where the DB has two authors.)

**`EXPO-02` (listing glyph corruption, `γh` / `γ{` / `⟨γ!!`) is fixed — do not patch it.** Graded blocking on a 13:44 PDF; the 14:01 rebuild removed `γ` from the `literate` table, and both `pdftotext` and my 150 dpi page-3 render show the correct order. `⟨`/`⟩` remain in `literate` but sit next to whitespace, so they are unaffected. The diagnosis of the mechanism was right; the defect is gone.

**`EXPO-06` (`##` doubling from `\detokenize`) is fixed — do not patch it.** `grep '##'` on the current PDF returns nothing. The author switched the three sites to `\texttt{\#guard\_msgs}` / `\texttt{\#print axioms}`. The `\lean` macro still contains `\detokenize`, but no `\lean{}` argument now contains `#` (`grep -n '\\lean{[^}]*#'` → no hits). Leave it; only add `\upshape`.

**`EXPO-04` / `C-06` are half-fixed.** :204 now reads "The development is four modules." Only the singular at :355 survives. Grade drops from major to a one-word edit.

**`NOV-08` identifies no defect.** The Mathlib zero-occurrence sentence is exactly true — I re-ran the grep at the pin and got 0 lines. Keep the sentence; drop the entry.

**`NOV-09` (Gamma0GL as duplicated infrastructure) was correctly refuted upstream** and is additionally moot: the paper now scopes to four modules.

**`C-09`'s "commented-out region" clause is half wrong.** `--` line comments defeat the regex (it anchors `^\s*` directly before the keyword). Only `/- … -/` block comments slip through. The two load-bearing sub-claims — sorry-blindness and namespace-stripped homonym collision — stand.

**`C-04` (job count) severity:** the upstream correction to *minor* is right, and my own run supplies the reason — 3053 here against 3052 on the same tree for the same command. A number that is not reproducible in principle should be deleted, not corrected.

**`C-01`'s date is right in the corrected form, wrong in the original.** The repository was created `2026-09-04`, not "public Aug 2026". Priority still favours FLT by two days.

---

## 6. RESIDUAL RISK

Things a referee could raise that I could **not** settle from here:

1. **FLT is read, not compiled.** I fetched its sources over `gh api contents`. "These declarations exist, sorry-free, in public source" is verified (**A2/L**); "they kernel-compile" is **not** — different toolchain, not checked out here. A referee with the repository built could sharpen or soften B1. It cannot overturn it: `frickeMat` and `frickeMat_mem_Gamma0` alone anticipate (C3)/(C4).
2. **The FLT-datum ⟹ Fricke-operator step is my derivation (tier C).** The matrix arithmetic is symbolically verified, but "$f|_kW_NT = f|_kW_N$ for $T\in\Gamma_0(N)$ and $\Gamma_0(N)$-invariant $f$" is standard slash-action functoriality that I did not compile. If a referee rejected it, the abstract's *second* conjunct would need re-argument — but `atkinLehnerLin` still constructs a bundled-`ModularForm` Atkin–Lehner operator, and the first conjunct is still refuted by `frickeMat`.
3. **Limitation (c) is a real, unclosed exposure.** No search of Isabelle/HOL, Coq/Rocq, Metamath, the Lean Zulip, arXiv, or non-Mathlib Lean repositories. The `git grep` covers Mathlib only. FLT was found by search of one repository I happened to have a URL for; there is no reason to think it is the only one.
4. **`Prove2Me2026` / `Tao2026AI` / `TaoEstimates2025` bibliographic accuracy is unverified.** The records exist in `references.json` with arXiv ids and DOIs; I did not fetch arXiv to confirm those papers exist as described.
5. **Version brittleness reported upstream, not re-run by me.** An upstream verifier reports `FrickeInvolution.lean` failing with four `linarith` errors at line 105 under Mathlib `810b3888` / v4.34.0-rc2. I did not reproduce this — I only built at the pin, where it is green. If true it matters for the Mathlib PR, whose target is `master`, not `905b9581`.
6. **Page count.** The PDF is 7 pages. CPP short papers are capped (typically 6 pages excluding references, acmart `sigplan`). Meeting the cap while *adding* the required related-work paragraph is a real editorial squeeze that this review did not attempt.
7. **`docs/SUBMISSION.md` is stale and asserts readiness.** It says "READY FOR SUBMISSION", "5 pages", "2346 jobs", "8/8 pass", "14 nodes", "15 files uncommitted". Measured: 7 pages, 3053 jobs, 15 guards, 15 DAG nodes. It should be corrected before it is used to drive anything.

---

## 7. SUBMISSION READINESS

### **NO** — for CPP. **NO, but nearly** — for the Mathlib PR.

**CPP.** Blocked on B1 (false priority claim against a self-cited source), B2 (artifact absent), B3 (false composability claim). B2 and B3 are hours of work. B1 is a rewrite of what the paper is *for*, and the honest post-rewrite contribution may not clear a CPP short-paper bar as a Fricke note. My recommendation: reframe as a methodology short paper — build-failing axiom guards as a compile-time gate, minimal named imports, and an explicit formal/informal tier discipline, with the Fricke development as the worked example — and let the priority question go entirely. That paper is defensible and the artifact already supports it.

**Manual steps, in order:**

1. **Push and tag.** `git add` the four Fricke modules + `FinalCheck.lean` + `dag/`, commit, `git tag fricke-v1`, push with `--tags`. Verify by `gh api …/contents/Lean/SocrateAI/ModularForms` returning the four files.
2. **Make `lakefile.lean` portable.** Replace both absolute paths with a normal `require mathlib from git … @ "905b9581"`; confirm with a clone into a clean directory and a build from scratch. Without this, step 1 does not achieve reproducibility.
3. **Archive.** Zenodo DOI for the tagged snapshot; add hardware and wall-clock to the artifact paragraph (neither is currently stated).
4. **Land the `HasDetOne` instance** and restate `frickeModularOperator` as `→ₗ[ℂ]`. This closes B3 *and* is the cheapest way to narrow the gap to the prior art of B1.
5. **Apply Groups 0–2** above; rebuild; confirm 0 overfull hboxes and re-grep the PDF for `##` and for glyph order.
6. **Correct `docs/SUBMISSION.md`** (pages, jobs, guard count, DAG nodes) and drop the "READY FOR SUBMISSION" banner.
7. **Then** open the Mathlib PR from the tag — Apache-2.0 headers with `Authors:`, `module`/`public import`, `Mathlib/NumberTheory/ModularForms/AtkinLehner.lean`, `[NeZero N]`. Expect reviewers to ask for the full Atkin–Lehner family; consider pre-empting that by generalizing to `W_Q` for `Q ‖ N` before opening, since `FLT2026` shows it is not much more work.
8. **Only after 1–7**, decide whether the reframed note goes to CPP or straight to arXiv `math.NT`/`cs.LO` as a companion to the PR.