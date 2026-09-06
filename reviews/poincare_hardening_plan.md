# HARDENING PLAN — `docs/Lean4_GL2_Poincare.tex`

**Prepared by: program lead. Every fact below was verified by direct read or by running the compiler. Corrections to the upstream audits are flagged inline.**

---

## 0. What I verified myself (and three corrections to the incoming reports)

Facts established in this session, not inherited:

| # | Fact | How verified |
|---|---|---|
| V1 | Companion file `/home/xavkal/xdev/SocrateAI-Lean-Lib/Lean/SocrateAI/ModularForms/PoincareUpperHalfPlane.lean` is 185 lines, entirely over `Int`. No `Complex`, no `Real`, no division, no Möbius map. | Read in full |
| V2 | `lake-manifest.json` = `{"packages": []}`, `lakefile.lean` has no `require mathlib`, `grep -rn "import Mathlib" Lean/` → **zero hits**. The listings in the paper cannot have been built in that repo. | Read + grep |
| V3 | Repo axioms: `mobius_preserves_uhp`, `denom_norm_sq_pos`, `sl2z_det_pos`, `modular_form_closure_witness` → `[propext, Quot.sound]`; `im_numerator_pos` → `[propext]`. | `lake env lean` with `#print axioms` |
| V4 | **The repo's `ModularForm k` is vacuous.** `def anyForm (k : Int) (f : UpperHalfPlanePoint → Int) : ModularForm k := { eval := f, transform_certificate := fun M z => mobius_preserves_uhp M.toGLPos2 z }` typechecks. Every function is a modular form, at every weight. | Compiled it |
| V5 | **Listing 1 (tex:99–170) COMPILES verbatim** against Mathlib `0df444a3` (2026‑08‑21), Lean v4.33.1 — warnings only (5 unused `simp` args). `positivity` closes the final goal; `simp only [..., normSq]; ring` closes `h_im_div`. | `lake env lean` on the verbatim listing |
| V6 | **Listing 1's theorems depend on `[propext, Classical.choice, Quot.sound]`.** | `#print axioms` on the compiled listing |
| V7 | **Listing 2 (tex:178–210) FAILS as printed**, at tex:195: `push_cast; exact congrArg Int.cast M.det_one` → `typeclass instance problem is stuck: IntCast ?m.24`. Replacing that one tactic with `exact_mod_cast congrArg (fun n : Int => (n : ℝ)) M.det_one` makes the entire listing compile, `ModularForm` structure included. | Compiled both versions |
| V8 | Mathlib already contains, strictly more generally: `denom_ne_zero_of_im` / `denom_ne_zero` / `normSq_denom_pos` / `normSq_denom_ne_zero` (`Mathlib/Analysis/Complex/UpperHalfPlane/MoebiusAction.lean:59,64,67,71`), `im_smul_eq_div_normSq` (:220 for `GL (Fin 2) ℝ`, :470 for `SL`), `Matrix.GLPos` (`LinearAlgebra/Matrix/GeneralLinearGroup/Defs.lean:325`), `SlashInvariantForm` (`NumberTheory/ModularForms/SlashInvariantForms.lean:34`), `ModularForm` (`NumberTheory/ModularForms/Basic.lean:75`). Files added to mathlib4 2023‑06‑27/28 and 2023‑07‑03. | grep + `git log --diff-filter=A` |
| V9 | Mathlib **also** has odd‑weight vanishing: `ModularForm.eq_zero_of_neg_one_mem` (`NumberTheory/ModularForms/Basic.lean:225`). | Read the lemma |
| V10 | `outputs/formal_manifest.json` claim `GL2-WN-01` names `lean_theorem: "fricke_involution_det_pos"` in module `SocrateAI.ModularForms.PoincareUpperHalfPlane`. **No such theorem exists in any module.** The real object is `Lean/SocrateAI/LeanScratchDB.lean:484`, `theorem fricke_involution_12_is_positive : fricke_det_12 = 12 ∧ fricke_det_12 > 0 := by decide`. | grep -rn -i fricke |
| V11 | `Shimura1971` (cited in the Lean header, lines 13–14, with a DOI) is **not** among the 159 keys in `references/references.json`. `DiamondShurman2005`, `Miyake2006`, `Serre1973`, `Mathlib2020`, `Buzzard2021`, `deMoura2021`, `Ono2004`, `Bringmann2012`, `Martin1996` all are. | JSON key check |

**Correction 1 (to OP‑3 and OP‑4).** The open‑points report predicted that `positivity` at tex:168 "cannot close that goal" and that `simp only [..., normSq]` "is not a valid unfolding". **Both predictions are wrong.** I compiled the listing; modern `positivity` resolves atoms against hypotheses (`hdet` is in context), and the `simp only`/`ring` pair discharges `h_im_div`. Those two items are struck from the plan. This matters: the paper's proof script is better than the audit assumed, and Eq. (2) *is* mechanized — inside Listing 1, as the `have h_im_div`.

**Correction 2 (to PAPER‑FRAMEWORK‑01).** The refutation shard concluded Eq. (2) has "no Lean referent at all." That is true **of the repository** and false **of the paper's printed code**: `h_im_div` states exactly Eq. (2) over ℂ and it typechecks. The defect is that it lives as an anonymous `have` inside a listing that is not in the companion repo — not that it is unproved.

**Correction 3 (to OP‑13).** Odd‑weight vanishing was nominated as "the best novelty‑per‑line available here." It is in Mathlib (V9). There is no novelty there either.

---

## 1. CLAIM LEDGER

Label column reads **claimed → earned**. "Earned" is against the artifact as it stands today.

| id | claim | label (claimed → earned) | prose used | mismatch? | required action |
|---|---|---|---|---|---|
| **GL2-TOP-01** | "GL₂⁺(ℝ) group condition: det M = ad − bc > 0" | A → **A1 (as `sl2z_det_pos` only)** | tex:84, manifest | **YES.** Manifest points at `im_numerator_pos`, whose statement is `0 < imNumerator M z`, not `0 < ad − bc`. For `GLPos2` the positivity of det is a *structure field* (`det_pos`, Lean:82), i.e. a hypothesis, not a theorem. | Repoint manifest to `sl2z_det_pos` (Lean:163) and rewrite the description as "SL₂(ℤ) matrices have positive determinant". Delete the GL₂⁺ framing — nothing is proved there, it is assumed. |
| **GL2-DEN-01** | "\|cz+d\|² = (cx+d)² + c²y² > 0 for all z ∈ ℍ" | A → **A1 over ℤ / B over ℂ** | tex:93, tex:124–145 | **PARTIAL.** `denom_norm_sq_pos` (Lean:100–126) is a genuine A1 theorem quantified over `GLPos2` and `UpperHalfPlanePoint` — the single most substantive lemma in the file (real case split on `M.c = 0`, deriving `M.d ≠ 0` from `det_pos`). But it is over `Int` and never mentions ℂ. The paper's ℂ version (`denom_ne_zero`, tex:124) compiles (V5) but is **not in the companion repo** and duplicates Mathlib `denom_ne_zero` (V8). | Keep the ℤ theorem, label it A1, and state its scope honestly. Move the ℂ version into the repo (§4 item H2) or cite Mathlib. |
| **GL2-PRE-01** | "Möbius action preserves ℍ: Im(M·z) = (ad−bc)y/\|cz+d\|² > 0" | A → **A1 for a weaker statement; C for the claim as written** | tex:73, tex:90–93, tex:148 | **YES — the headline mismatch.** Repo `mobius_preserves_uhp` (Lean:136–138) proves `0 < imNumerator M z ∧ 0 < denomNormSq M z`. The quotient is never formed. No object is shown to lie in ℍ. The word "preserves" in the theorem name is discharged by nothing in the statement. | Either (a) replace with the compiling ℂ version (V5) — recommended — or (b) restate the repo theorem's caption as "the numerator and denominator of Im(M·z) are separately positive" and demote the ℍ‑closure claim to **C**. |
| **GL2-SL2-01** | "SL₂(ℤ) embeds into GL₂⁺(ℝ) with det = 1 > 0" | A → **A1 over ℤ; the ℝ embedding does not compile** | tex:176, tex:188–197 | **YES.** `SL2Z.toGLPos2` (Lean:152) embeds into `GLPos2` over ℤ, fine. `SL2Z.toGLPos2Real` as printed at tex:188–197 **fails to compile** (V7). | Apply the one‑token fix at tex:195 (verbatim replacement in §3). |
| **GL2-WN-01** | "Fricke involution W_N for N = 12 has det = 12 > 0" | A → **A2** | tex:214–216 | **YES, twice.** (i) The named theorem `fricke_involution_det_pos` **does not exist** (V10). (ii) The real object is a `decide` over three literals in a different module — arithmetic, not mathematics. (iii) The remark quantifies over "any level N > 0"; nothing in Lean quantifies over N. | Repoint the manifest at `SocrateAI.LeanScratchDB.fricke_involution_12_is_positive`, tier **A2**. Add `def frickeW (N : ℝ) (hN : 0 < N) : GLPos2Real := ⟨0, -1, N, 0, by nlinarith⟩` to Listing 2 if the remark is to keep a referent. |
| **GL2-MOD-01** | "ModularForm structure encapsulates transformation law with UHP closure certificate" | A → **E** | tex:172–212, manifest | **YES — the worst item in the ledger.** Verified vacuous (V4): `transform_certificate` does not mention `eval`, is a closed proposition, and `ModularForm k` is inhabited by every `UpperHalfPlanePoint → Int`. The paper prints the strong version (tex:204–207, which binds `func`); the repo verifies the empty one. | The repo structure must be **removed or rewritten**. Until it binds `eval`, no claim may cite it. Replacement sentence in §3. |
| **PAPER-AX-01** | "axiom-free foundational component" / "without unverified axioms (zero sorry)" | (unlabelled) → **E, false as stated** | tex:73, tex:226 | **YES.** Repo: `[propext, Quot.sound]` (V3). Paper's ℝ/ℂ listing: `[propext, Classical.choice, Quot.sound]` (V6). Neither is axiom‑free. | Replace with the axiom table (§3). The true statement is *stronger* evidence than the false one. |
| **PAPER-DIV-01** | "eliminating division-by-zero edge cases" | (unlabelled) → **E, category error** | tex:73 | **YES.** Division is total in Lean (`x/0 = 0`). There is no edge case to eliminate. An ITP referee will flag this in the first paragraph. | Replacement sentence in §3. |
| **PAPER-NOV-01** | ℍ is in Mathlib, but the GL₂⁺ denominator certificate "remains a foundational exercise" | (unlabelled) → **E, refuted** | tex:80 | **YES.** V8: six Mathlib declarations, all more general, all ~3 years older. | Replacement paragraph in §6. |
| **PAPER-WHF-01** | "weakly holomorphic modular forms ... require explicit handling of fractional linear domains with proven non-vanishing denominators" | (unlabelled) → **E** | tex:80 | **YES.** Asserted, never derived, never used. Nothing in the paper touches weakly holomorphic forms. `Bringmann2012` is in `references.json` and is not cited. | Delete the sentence, or cite `Bringmann2012` and delete the causal claim. |
| **PAPER-EQ2-01** | Eq. (2), `Im(M·z) = (ad−bc)Im(z)/\|cz+d\|²` | (unlabelled) → **B**, and **A1 if named** | tex:90 | **PARTIAL.** Textbook (`DiamondShurman2005` §1.1) and in Mathlib as `im_smul_eq_div_normSq`. But it *is* mechanized in the paper's own Listing 1 as the `have h_im_div` (V5, correcting the audit). | Cite `DiamondShurman2005` §1.1 with the equation number **and** promote `h_im_div` to a named top‑level lemma so the A1 is visible. |
| **PAPER-REPO-01** | "the fully compilable Lean 4 source is available in the companion repository" | (unlabelled) → **E, false** | tex:226 | **YES.** The companion repo contains a different theorem over a different ring, with no Mathlib and no Möbius map (V1, V2); and the printed source does not compile (V7). Neither half of the sentence holds. | Replacement sentence in §3. Repository is never even named — see §4 H5. |
| **PAPER-FRICKE-02** | Fricke certificate "immediately provided" by `mobius_preserves_uhp` | (unlabelled) → **C** | tex:215 | **YES.** True for the ℍ‑preservation half *if* the ℝ theorem exists; but §4's transformation law is stated only for det = 1, so W_N (det = N) is outside the group the paper's modularity law covers. §4 and the remark do not compose. | Replacement sentence in §3. |
| **PAPER-META-01** | Author block, bibkey, build record | — → **housekeeping** | tex:61–65; Lean:13–14 | **YES.** `\author{\textbf{[Votre Nom/Prénom]} ... \texttt{[Votre Email]}}` still in the source, and the PDF was built 2026‑09‑05 with the placeholders. `Shimura1971` is an unregistered bibkey (V11). | Fill the author block. Add `Shimura1971` via `build_reference_db.py` or drop it from the Lean header. |

---

## 2. WHAT IS PROVED — the A1 content

This is the paper's real formal content. It is small, but it is real: every statement below is quantified over defined structures, contains no bare numerals, is `sorry`‑free, and I re‑verified its axiom footprint this session.

| Lean theorem | file:line | statement | axioms | why it is A1 |
|---|---|---|---|---|
| `denom_norm_sq_pos` | `PoincareUpperHalfPlane.lean:100` | `∀ (M : GLPos2) (z : UpperHalfPlanePoint), 0 < denomNormSq M z` | `[propext, Quot.sound]` | Quantified over two structures; genuine proof (case split `M.c = 0`, `M.d ≠ 0` derived from `det_pos`, then `omega`). **The one substantive lemma in the module.** |
| `mobius_preserves_uhp` | `:136` | `∀ (M : GLPos2) (z : UpperHalfPlanePoint), 0 < imNumerator M z ∧ 0 < denomNormSq M z` | `[propext, Quot.sound]` | A1 **for what it states** — which is not ℍ‑preservation. See ledger GL2‑PRE‑01. |
| `im_numerator_pos` | `:129` | `∀ (M : GLPos2) (z : UpperHalfPlanePoint), 0 < imNumerator M z` | `[propext]` | A1, but one `Int.mul_pos` away from two structure fields. Near‑trivial. |
| `sl2z_det_pos` | `:163` | `∀ (M : SL2Z), 0 < M.a * M.d - M.b * M.c` | `[propext, Quot.sound]` | A1; trivial (`omega` from `det_one`). |
| `int_sq_nonneg`, `sq_pos_of_ne_zero` | `:41`, `:51` | integer square positivity | — | A1 support lemmas; both are `Int` facts Mathlib already has. |
| `SL2Z.toGLPos2` | `:152` | `SL2Z → GLPos2` | — | A1 definition with a discharged proof obligation. |
| **(paper only)** `ModularGeometry.denom_ne_zero` | tex:124–145 | `∀ (M : GLPos2Real) (z : UpperHalfPlane), ↑M.c * z.val + ↑M.d ≠ 0` over ℂ | `[propext, Classical.choice, Quot.sound]` | **Compiles (V5).** A1 — but not in the companion repo, and duplicates Mathlib. |
| **(paper only)** `ModularGeometry.mobius_preserves_uhp` | tex:148–168 | `∀ (M : GLPos2Real) (z : UpperHalfPlane), 0 < (mobius_action M z.val).im` | `[propext, Classical.choice, Quot.sound]` | **Compiles (V5).** This is the theorem the paper claims. It exists. It just isn't in the artifact, and Mathlib proved it in 2023 for arbitrary `GL (Fin 2) ℝ`. |
| **(paper only)** `h_im_div` | tex:159–162 | Eq. (2) over ℂ | (inherited) | **Compiles (V5).** Currently an anonymous `have`; promote to a named lemma. |

**Total honest A1 yield of the current companion repo: one non‑trivial lemma (`denom_norm_sq_pos`) plus four near‑trivial ones, all over ℤ.**

---

## 3. WHAT IS COMPUTED, NOT PROVED — A2 claims, with the exact prose change

There is exactly one A2 claim, plus four false-or-unlabelled prose claims that must be rewritten. Verbatim replacements follow.

### 3.1 GL2-WN-01 — Fricke determinant (**A2**)

The only Lean content is `LeanScratchDB.lean:481–484`: three literals and a `decide`. It fixes N = 12; the paper's remark quantifies over all N > 0.

**Manifest edit (required):**
```json
{ "claim_id": "GL2-WN-01", "tier": "A2",
  "lean_module": "SocrateAI.LeanScratchDB",
  "lean_theorem": "fricke_involution_12_is_positive",
  "validation_note": "Arithmetic identity over literals: det W_12 = 0*0 - (-1)*12 = 12 > 0. No quantification over N; no GLPos2 term is constructed for W_N." }
```

**Verbatim replacement for the last sentence of the Fricke remark (tex:215):**
> Instantiating `mobius_preserves_uhp` at `frickeW N hN : GLPos2Real` yields the topological certificate for the map $z \mapsto -1/(Nz)$ for every real $N > 0$. We note that the transformation law of Section~4 is stated only for $\det M = 1$, so $W_N$ lies outside the group it covers; extending modularity to the Fricke case requires the weight-$k$ slash operator with its $(\det M)^{k/2}$ factor, which we do not formalize here.

and add to Listing 2, so the remark has a referent:
```lean
def frickeW (N : ℝ) (hN : 0 < N) : GLPos2Real :=
  { a := 0, b := -1, c := N, d := 0, det_pos := by simpa using hN }
```

### 3.2 "Axiom-free" (**E → replace with the axiom table**)

**Verbatim replacement for the third sentence of the abstract (tex:73):**
> The development is `sorry`-free and, as reported by `#print axioms`, depends only on Lean's three standard axioms — `propext`, `Classical.choice`, and `Quot.sound`; the integer model in the companion repository avoids `Classical.choice` entirely and depends only on `propext` and `Quot.sound`.

**And add to §5 (Discussion), verbatim:**
> \paragraph{Axiom footprint.} Running `#print axioms` on Lean~4.33.1 gives: `mobius_preserves_uhp` and `denom_ne_zero` (Listing~1, over $\mathbb{C}$) $\to$ `[propext, Classical.choice, Quot.sound]`; and, for the Mathlib-free integer model, `denom_norm_sq_pos`, `mobius_preserves_uhp`, `sl2z_det_pos`, `modular_form_closure_witness` $\to$ `[propext, Quot.sound]`, with `im_numerator_pos` $\to$ `[propext]`. No `sorryAx` appears anywhere.

### 3.3 "Eliminating division-by-zero edge cases" (**E, category error → replace**)

**Verbatim replacement (tex:73):**
> Division is total in Lean ($x/0 = 0$), so the denominator lemma is not needed to avoid an undefined term; it is needed to make $\mathrm{normSq}(cz+d)$ strictly positive, which is precisely what the final `positivity` step consumes.

### 3.4 The vacuous `ModularForm` in the repo (**E → must be removed or rewritten**)

**Verbatim sentence to insert wherever the companion integer model is described, if that model is kept at all:**
> The `ModularForm` structure in the integer model carries a `transform_certificate` field that does not mention `eval`. It is therefore a closed proposition, already discharged unconditionally by `modular_form_closure_witness`, and `ModularForm k` is inhabited by every function `UpperHalfPlanePoint → Int` at every weight $k$. It imposes no modularity constraint and is cited as evidence for nothing in this paper.

The honest alternative is to delete `structure ModularForm` and `modular_form_closure_witness` from `PoincareUpperHalfPlane.lean` outright (lines 167–183) and let Listing 2 carry the definition.

### 3.5 "Fully compilable source in the companion repository" (**E, false → replace**)

**Verbatim replacement (tex:226):**
> Listings~1 and~2 are the complete source. They compile as printed under Lean~4.33.1 against Mathlib at commit `0df444a3`; the build transcript, including `#print axioms` output, is reproduced in Appendix~A. The repository at \url{<URL>}, commit `<SHA>`, contains this file at `<path>`.

---

## 4. WHAT REMAINS TO PROVE — ordered by value × tractability

**H1 — Fix tex:195. (minutes; unblocks the whole paper)**
Replace `push_cast; exact congrArg Int.cast M.det_one` with:
```lean
      exact_mod_cast congrArg (fun n : Int => (n : ℝ)) M.det_one
```
I verified this makes Listings 1 **and** 2 compile end to end, `ModularForm` structure included (V7). Until this is done, §5's compilability claim is simply false and everything else is moot.

**H2 — Make the artifact be the paper. (a Mathlib build, then hours)**
Add `require "leanprover-community" / "mathlib" @ git "<pin>"` to `/home/xavkal/xdev/SocrateAI-Lean-Lib/lakefile.lean`, create `Lean/SocrateAI/ModularForms/MobiusRealAction.lean` containing the fixed Listings 1+2 verbatim, and `lake build`. **The code is already verified to compile** — this is a packaging task, not a proof task. This single item closes GL2‑PRE‑01, GL2‑DEN‑01, GL2‑SL2‑01, GL2‑MOD‑01 and PAPER‑REPO‑01 at once. It is the highest-value action in this plan.

*Cheap fallback if a Mathlib dependency is unacceptable:* move the integer model to ℚ. `structure UHPRat where x y : ℚ; y_pos : 0 < y` **is** closed under the SL₂(ℤ) action, stays decidable, needs no Mathlib, and lets you actually define `mobiusIm` and prove `0 < mobiusIm M z`. The ℤ model cannot be extended this way — $S \cdot (1+i) = -(1-i)/2$ is not a lattice point — so ℤ is a dead end, not a stepping stone.

**H3 — Name Eq. (2) and state ℍ‑closure as a closure statement. (an hour, after H2)**
Promote `h_im_div` to a top-level `lemma im_mobius_eq` and restate the main theorem as producing an element of `UpperHalfPlane`, i.e. `def mobiusUHP (M : GLPos2Real) (z : UpperHalfPlane) : UpperHalfPlane := ⟨mobius_action M z.val, mobius_preserves_uhp M z⟩`. Only then does the word "preserves" have content in the kernel rather than in a docstring.

**H4 — Repair `outputs/formal_manifest.json` and add a resolution check. (an hour)**
Fix GL2‑WN‑01 (V10), GL2‑TOP‑01 (points at the wrong theorem), GL2‑MOD‑01 (demote to E). Then add a CI step that, for each manifest row, runs `#print axioms <lean_theorem>` and fails on `unknown identifier`. **Note that `docs/peerreview/audit_PAPER_C.md` marked this paper "ACCEPT AS SUBMISSION-READY" while listing exactly one theorem (`scratch_db_initialized`) — it never checked this paper's theorems at all.** That audit should be superseded, not cited.

**H5 — Artifact paragraph. (30 minutes)**
The repository is never named in the paper. Add: repo URL, commit SHA, `lean-toolchain` (`leanprover/lean4:v4.33.1`), Mathlib pin, exact file path, `lake build` wall-clock. This is the first thing a CPP/ITP referee checks.

**H6 — Slash operator with the determinant factor. (a day)**
§4 (tex:174) correctly explains that GL₂⁺ needs $(\det M)^{k/2}(cz+d)^{-k}$, then defines `transform` **without** it. Either define the slash properly over `GLPos2Real` — which would finally make the Fricke remark compose with §4 — or delete the GL₂⁺ framing from §4 and state the law honestly for SL₂(ℤ) only.

**H7 — Odd weight. (two sentences)**
For odd $k$, $-I \in \mathrm{SL}_2(\mathbb{Z})$ forces $f \equiv 0$. Add a remark. **Do not formalize it as a novelty item**: Mathlib has `ModularForm.eq_zero_of_neg_one_mem` (V9). The earlier recommendation to treat this as "the best novelty return available" is withdrawn.

**H8 — Housekeeping. (an hour)** Author block (tex:61–65); `Shimura1971` registered or dropped (Lean:13–14); Eq. (2) given its `DiamondShurman2005` §1.1 pointer or its three lines of algebra; the `k : ℤ` power convention (zpow, and where `denom_ne_zero` is consumed) stated in one sentence; per-claim ladder labels added throughout (the paper currently has none).

**Struck from the plan:** the previously listed OP‑3 (`positivity` fails) and OP‑4 (`simp only [normSq]` invalid). Both refuted by compilation (V5). No work is needed there.

---

## 5. WHAT REMAINS TO EXPERIMENT

**Nothing. This paper contains zero physical claims, zero numerical predictions, and zero data.** There is no baseline to establish, no χ²/dof, no convergence residual, and no falsification test against public data. The paper should say so explicitly rather than leaving a referee to infer it, because a reader arriving from the rest of this program will look for those sections and find them missing.

The correct analogue of "the experiment" for a formalization paper is the **reproducible build record**, and it is entirely absent (H5). That is the only empirical obligation this paper carries, and it is currently unmet:

| Required record | Status |
|---|---|
| Lean toolchain version | absent from paper (`v4.33.1` in the repo) |
| Mathlib commit pin | absent — **and the companion repo has no Mathlib at all** |
| `lake build` transcript | absent |
| `#print axioms` output | absent (computed in V3/V6, must be printed as Table 1) |
| Repository URL + commit SHA | absent — repository never named |
| Wall-clock compile time | absent |

---

## 6. NOVELTY STATEMENT

**Verdict: no novelty claim is supported.** Every mathematical statement is category (a) — textbook, in `DiamondShurman2005` §1.1 and `Miyake2006`. Every formal statement is category (b) — formalization of a known theorem — which is normally a legitimate contribution, *except* when the theorem is already in the standard library, which is exactly this case: `denom_ne_zero`, `normSq_denom_pos`, `im_smul_eq_div_normSq`, `GLPos`, `SlashInvariantForm`, `ModularForm`, and even odd-weight vanishing all predate this work by roughly three years and are all strictly more general (Mathlib works over arbitrary `GL (Fin 2) ℝ` using $|\det|$; the paper restricts to $\det > 0$). The paper cites `Mathlib2020` but never names a single declaration it duplicates and never argues why a from-scratch `structure GLPos2Real` is preferable to `Matrix.GLPos (Fin 2) ℝ`.

**Paragraph the paper can honestly use, verbatim:**

> This note makes no claim of new mathematics and no claim of new formal content. The preservation of $\mathbb{H}$ under $GL_2^+(\mathbb{R})$, the non-vanishing of $cz+d$, the identity $\operatorname{Im}(M\cdot z) = (\det M)\operatorname{Im}(z)/|cz+d|^2$, the embedding of $\mathrm{SL}_2(\mathbb{Z})$, and the weight-$k$ transformation law are all present in Mathlib4 — as `UpperHalfPlane.denom_ne_zero`, `UpperHalfPlane.normSq_denom_pos`, `UpperHalfPlane.im_smul_eq_div_normSq`, `Matrix.GLPos`, `SlashInvariantForm` and `ModularForm` — in forms that are strictly more general than ours and that have been available since 2023. What we offer instead is a short, self-contained derivation of the preservation proof written directly from the `Complex` and `Real` primitives, together with an explicit account of where the coercion friction actually falls: the imaginary part must be isolated by `simp only [div_im, mul_im, ofReal_re, ofReal_im, normSq]` followed by `ring` before `positivity` can consume the determinant hypothesis, and the $\mathrm{SL}_2(\mathbb{Z}) \to GL_2^+(\mathbb{R})$ coercion requires `exact_mod_cast` rather than `push_cast` because the target `IntCast` instance is otherwise a metavariable. This is a teaching note about dependent-type friction, not a research result, and it should be read as such.

Everything else — "we provide an axiom-free foundational component", "remains a foundational exercise", the weakly-holomorphic motivation, the "key advantage" framing of the Fricke remark — must be deleted.

**Uncertainty reported:** I checked Mathlib at two local checkouts (commits `0df444a3` of 2026‑08‑21 and `905b9581` of 2026‑07‑28). I did **not** search arXiv, the Lean Zulip, or non-Mathlib Lean projects, so "no prior formalization outside Mathlib" is unverified. That is not load-bearing: prior art inside Mathlib already settles the question.

---

## 7. FALSIFIERS

**There are no physical claims in this paper, so there are no physical falsifiers.** Stating that plainly is required; leaving the section out invites the referee to assume it was overlooked.

The machine-checkable substitute — each row is a command that would *refute* the claim if it produced the stated output. Rows marked ✗ are currently falsified.

| claim | executable falsifier | current result |
|---|---|---|
| GL2‑DEN‑01 (ℤ) | `#print axioms denom_norm_sq_pos` returns `sorryAx`; or `grep sorry` in the module | ✓ passes — `[propext, Quot.sound]`, no `sorry` |
| GL2‑PRE‑01 (as claimed: ℍ‑closure) | exhibit the theorem statement and check that it mentions the image point | ✗ **falsified** — statement is a conjunction of two `Int` positivities; no image point exists |
| GL2‑MOD‑01 (modularity constraint) | construct `anyForm k f : ModularForm k` for arbitrary `f` and typecheck | ✗ **falsified** — it typechecks (V4); the structure constrains nothing |
| GL2‑WN‑01 (general $N>0$) | `grep -rn "fricke_involution_det_pos" Lean/` | ✗ **falsified** — theorem does not exist; only an N = 12 `decide` in another module |
| PAPER‑AX‑01 ("axiom-free") | `#print axioms` on any listed theorem returns a non-empty list | ✗ **falsified** — `[propext, Classical.choice, Quot.sound]` (V6) |
| PAPER‑REPO‑01 ("fully compilable source in companion repo") | `grep -rn "import Mathlib" Lean/` returns nothing, or `lake env lean` on the printed listing errors | ✗ **falsified twice** — no Mathlib (V2); tex:195 errors (V7) |
| PAPER‑NOV‑01 ("remains a foundational exercise") | find the statement already in Mathlib | ✗ **falsified** — six declarations, 2023 (V8, V9) |
| Listing 1 compiles | `lake env lean` on the verbatim listing errors | ✓ passes (V5) — warnings only |
| Listing 2 compiles | `lake env lean` on the verbatim listing errors | ✗ **falsified** at tex:195 (V7) |

Five of nine falsifiers currently fire. That is the submission verdict in one table.

---

## 8. SUBMISSION VERDICT

# NOT READY.

Not "ready after listed edits." The paper asserts, in its abstract and in its conclusion, that a specific verified artifact exists; the artifact that exists proves a different theorem over a different ring, and the code the paper prints does not compile. Those are not presentation defects.

**Three blocking reasons:**

1. **Artifact/paper mismatch (GL2‑PRE‑01, PAPER‑REPO‑01).** The title says $GL_2^+(\mathbb{R})$ acting on $\mathbb{H} \subset \mathbb{C}$. The companion repository has integer matrices acting on integer lattice points, with no Möbius map defined anywhere, no `Complex`, no `Real`, and no Mathlib dependency. The sentence "the fully compilable Lean 4 source is available in the companion repository" is false as written.

2. **A headline claim that is verifiably vacuous (GL2‑MOD‑01).** I constructed the counterexample and compiled it: every function `UpperHalfPlanePoint → Int` inhabits `ModularForm k` at every weight. A tier‑A claim in `formal_manifest.json` currently rests on a structure that formalizes nothing.

3. **A false axiom claim and a broken listing.** "Axiom-free" is false in both artifacts (V3, V6), and Listing 2 does not typecheck (V7).

**What is genuinely good and should be preserved:** `denom_norm_sq_pos` is real work — a proper case split with a non-obvious step (`M.c = 0 ⟹ M.d ≠ 0` from `det_pos`), quantified over defined structures, clean axioms. And, correcting the incoming audits, **Listing 1 compiles exactly as printed** — the proof script is sound, `positivity` does close the goal, and Eq. (2) is mechanized. This paper is much closer to honest than the audit trail suggested. It is separated from a defensible submission by one token at tex:195, one Mathlib dependency, and a rewritten introduction.

**Path to READY AFTER LISTED EDITS:** complete H1, H2, H4, H5, H8, and adopt the §3 and §6 verbatim replacements. That is roughly one Mathlib build plus a day of writing. It converts the paper from a false formalization claim into a true and modestly useful teaching note.

**Path to a research contribution:** there isn't one on this topic. Mathlib got here in 2023, more generally, including the odd-weight collapse. If new formal content is wanted from this direction, it has to be something Mathlib lacks — the weakly holomorphic forms the introduction gestures at (`Bringmann2012`), or the Fricke/Atkin–Lehner slash operator on $\Gamma_0(N)$ with the $(\det M)^{k/2}$ factor. Both are real gaps. Neither is in this paper.