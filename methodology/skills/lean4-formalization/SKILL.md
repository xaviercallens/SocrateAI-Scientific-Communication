---
name: lean4-formalization
description: "Formalize and verify mathematics in Lean 4 / Mathlib for this project: build the SocrateAI library, eliminate sorry, audit axioms, and prove that each formal theorem faithfully states the manuscript claim it is paired with. Use for any .lean file, any lake build, any 'verified in Lean' assertion, and for the tier ledger in outputs/formal_manifest.json."
---

# Lean 4 Formalization

Toolchain: `leanprover/lean4:v4.33.1`. Library: `/home/xavkal/xdev/SocrateAI-Lean-Lib`
(`srcDir := "Lean"`, targets `SocrateAI` and `Tests`). Elan is at `~/.elan/bin` and is **not on
PATH by default** — export it in every shell.

```bash
export PATH="$HOME/.elan/bin:$PATH"
cd /home/xavkal/xdev/SocrateAI-Lean-Lib
lake build SocrateAI          # library
lake build Tests              # test modules under Lean/Tests/
lake env lean Lean/SocrateAI/Core/Topology.lean   # single-file check, faster loop
```

Module map (use the real names, do not invent modules):
`SocrateAI.Core.{Topology, Algebra, Analysis, Logic, TierCalculus, ReferenceTheorems, References}`,
`SocrateAI.StringTheory.{K3xT2, KunnethProduct, Swampland, FTheory, VacuumSelection, StringInequalities}`,
`SocrateAI.Moonshine.*`, `SocrateAI.K3.*`, `SocrateAI.Quantum.{GolayCode, GolayM24}`,
`SocrateAI.ModularForms.PoincareUpperHalfPlane`, `SocrateAI.Cosmology.*`, `SocrateAI.NavierStokes.*`,
`SocrateAI.ChameleonGravity.DACModel`, `SocrateAI.Ramanujan.*`, `SocrateAI.Duality.*`,
`SocrateAI.ParticlePhysics.*`, `SocrateAI.Pregeometry.HypergraphK4`, `SocrateAI.AlienMath.*`.

## 1. The verification gate — all four must pass

```bash
export PATH="$HOME/.elan/bin:$PATH"
cd /home/xavkal/xdev/SocrateAI-Lean-Lib
lake build SocrateAI Tests                                     # 1. compiles
grep -rn --include=*.lean -E '\bsorry\b|sorryAx' Lean/ | grep -v '\.lake'   # 2. empty
grep -rn --include=*.lean -E 'native_decide|@\[implemented_by\]|unsafe ' Lean/ | grep -v '\.lake'  # 3. justify each
```
4. Axioms: for every headline theorem, `#print axioms thm`. The **only** acceptable axioms are
   `propext`, `Classical.choice`, `Quot.sound`. Anything else — especially a project-local `axiom`
   — means the theorem is assumed, not proved. Downgrade it to Tier B/OPEN in the manifest and say
   so in the paper.

```lean
-- append to a scratch file, or use `lake env lean` on it
#print axioms euler_char_K3
#print axioms kuenneth_b3_derivation
```

`native_decide` is kernel-*external* (it trusts the compiler). Do not let a headline claim rest on
it; `decide` is fine when it terminates.

## 2. Statement faithfulness — the real failure mode

A green build proves the *stated* theorem, not the *intended* one. For each claim, check:

- **No vacuity**: hypotheses must be satisfiable. Produce an instance (`example : P := ...`) or an
  `#eval` witness. A theorem of the form `h : False -> anything` is worthless.
- **No trivialization**: `b_3(K3 x T^2) = 44` must be *derived* from Künneth applied to the K3 and
  `T^2` Betti numbers, not `def b3 := 44 ; theorem : b3 = 44 := rfl`. Read the definitions the
  theorem depends on, all the way down, before certifying it.
- **Quantifier and direction match**: the LaTeX inequality direction, the `<=` vs `<`, and the
  universally-vs-existentially quantified variables must match the manuscript verbatim.
- **Type honesty**: a claim about a real-analytic bound stated over `Rat`, or an "isomorphism"
  stated as an equality of cardinals, is a weaker theorem. Note the gap explicitly.

Report the audit as: `claim -> Lean theorem -> statement quoted -> definitions inspected ->
axioms -> verdict`.

## 3. Writing new Lean

- Search Mathlib before defining anything: `exact?`, `apply?`, `rw?`, `loogle`-style name guesses.
  Reusing `EulerChar`, `Matrix`, `ModularForm`, `ZMod` beats a bespoke definition that no lemma
  applies to.
- Naming follows Mathlib conventions (`snake_case` for theorems, descriptive
  `object_property_conclusion`).
- Prefer `Nat`/`Int`/`Rat` and `decide`/`norm_num` for the exact-arithmetic claims that dominate
  this project; use `Real` only when the statement genuinely needs it.
- Keep proofs structured (`have` chains) over long tactic soups — the audit in §2 requires a human
  or agent to read them.
- New theorem -> add a matching test in `Lean/Tests/Test<Area>.lean` -> register the claim in
  `formal_proof_bridge.py` with its `claim_id`, module, theorem name, and tier.

## 4. Bridge to manuscripts

```bash
python3 /home/xavkal/xdev/SocrateAIShared/foundationpaper2/formal_proof_bridge.py
python3 /home/xavkal/xdev/SocrateAIShared/foundationpaper2/scripts/audit_reference_theorems.py
bash    /home/xavkal/xdev/SocrateAIShared/foundationpaper2/scripts/run_all_verifications.sh
```

`outputs/formal_manifest.json` carries `lean_build_status`, per-claim `tier` (A = kernel-verified,
B = stub/partial, OPEN), and `hallucination_risks`. Rules:
- A paper may say "verified in Lean 4" **only** for Tier A claims whose axiom set is clean and whose
  statement passed §2.
- Tier B must read "formalized modulo <explicit gap>".
- `hallucination_risks > 0` or `tier_B_open > 0` blocks any "0 errors / fully verified" summary.
- The bridge's own exactness rule (int / `Fraction`, never float) applies to anything you add to it.

## 5. Common Lean 4 / Mathlib gotchas here

- `lake build` after a Mathlib bump can be long; if the cache is cold use `lake exe cache get` when
  the project depends on Mathlib, before assuming a hang.
- `Finset.sum` vs `∑` over `Fin n`: index-shift bugs silently change a Künneth sum. Test with
  `#eval` on the concrete Betti vectors.
- `Real` division and `norm_num`: prove positivity side conditions explicitly; `field_simp` first.
- Deprecations across Mathlib versions produce a rename cascade — fix by searching Mathlib source,
  not by adding an `axiom` shim.

## 6. Scaling beyond one agent — see `formalization-dag`

When the work no longer fits one agent or one session, switch to the architecture proven on
Fermat's Last Theorem (Anthropic, 2026-09-04; Prove2Me, arXiv:2608.28433): a DAG of theorem
statements driving work selection, statements and proofs in separate files, a natural-language
description per statement, and an automated statement comparator. Load `formalization-dag`.

Two items from that work belong in *this* skill's gate, and are additions to §1:

**5. Statement comparator.** Lean verifies the proof; it cannot verify that you proved the intended
theorem. The FLT run therefore ran a second check — a comparator confirming the formal statement
matched Mathlib's own statement of the theorem. Add the equivalent per claim:

| Verdict | Meaning | Allowed prose |
|---|---|---|
| `MATCH` | formal statement agrees with the Mathlib statement, or with the paper's proposition verbatim | "proved" |
| `WEAKER` | proved over a narrower type or with extra hypotheses (e.g. `Rat` where the paper says `Real`) | "proved, for <the narrower case>" |
| `MISMATCHED` | different quantifier, direction, or object | blocks the claim |
| `NO_REFERENCE` | genuinely new statement, nothing to compare against | rests on the §2 audit alone — say so |

**6. Statement/proof file split.** Keep statements and definitions in the module and proofs in a
parallel `Proofs/` module. It cuts rebuild time on deep proofs and is what makes parallel work
practical. Do this before adding proof bulk, not after.

Scale expectation, so the goal stays honest: the FLT run was 13M lines and ~6B output tokens over
11 days on a frontier model. The relevant comparison for this repository is the other datapoint in
the same write-up — **Vinogradov's Three Primes Theorem, formalized in 3 days on three personal
Claude Max plans.** That is the achievable target for a well-scoped result here. Line count is a
cost, not an achievement: the FLT authors note their proof is "likely much longer than it needs to
be" and over 5x the size of Mathlib.

## 7. Lessons hardened in from run 1 (Fricke, 2026-09-06)

1. **The axiom audit is now a build target.** `Lean/SocrateAI/FinalCheck.lean` holds a
   `#guard_msgs in #print axioms` guard per headline theorem (pattern taken from
   `anthropics/fermats-last-theorem`). `lake build SocrateAI` fails if a footprint drifts. The
   negative control `scratch/GuardNegativeControl.lean` must keep failing. Mathesis HARDNESS H1
   applies verbatim: *the check is `#print axioms`, never the source text* — and grep for the
   word "sorry" is worthless here anyway: 25 hits in this library are all docstrings saying
   "sorry-free". Grep for the *proof pattern* (`:= by sorry`, `:= sorry`) or trust the kernel.
2. **Novelty is checked by compiling, not recalling.** Run 1's decisive evidence was
   `#check` output: `im_smul_eq_div_normSq` *was* the paper's Eq. (2). A grep can miss a
   differently-named declaration; `exact?`/`#check` against the real Mathlib cannot. Before
   claiming "Mathlib lacks X", search declarations *and* try to state X and prove it with
   `exact?` — absence of both is the evidence.
3. **Mathlib pools are shared infrastructure — and they move.** The v4.32.2 pool this library
   builds against died once already (`socrates-project` was renamed into `SocrateAI-Scientific-Measure` — user-confirmed rename) and was
   repointed to `SocrateAI-Scientific-Measure/lean/.lake/packages` (same toolchain v4.32.2, same
   Mathlib `905b9581`). If the build says `package directory not found`: candidate pools are
   Scientific-Measure (v4.32.2/905b9581), `SocrateAIShared/speculativepapers/HoloAlgProof`
   (v4.33.1/0df444a3), `SocrateAI-Numeric-DualScale-Solver/.../lean4` (v4.34.0-rc2). Repoint BOTH
   `lakefile.lean` (`packagesDir`, `require ... from`) and the `"dir"` field of the path-type
   package in `lake-manifest.json` — editing the manifest directly avoids `lake update`'s cache
   download on a full disk. Match the toolchain to the pool, not vice versa.
4. **Prove intertwining, not conjugation.** `W·γ = δ·W` is entrywise arithmetic
   (`fin_cases` + `simp` + `linarith`); `W γ W⁻¹ = δ` then follows by one `mul_assoc` +
   `mul_inv_cancel`. Fighting `Units.inv` entrywise is the hard road. General form: to show
   `g x g⁻¹ ∈ S`, find the witness `y ∈ S` and prove `g·x = y·g`.
5. **Statement-first works.** Run 1's F1–F3 were written as typechecked `sorry` statements in
   `scratch/` before any proof effort (keeping the library target sorry-free), then each fell
   in one or two compile iterations. This is the DAG discipline at n=1; use `dag/theorems.jsonl`
   + `dag/check_dag.py` to do it at n>1 (see the `formalization-dag` skill §6).
6. **Work selection comes from the DAG frontier**, not from re-reading the project. Current
   frontier after run 1: FRK-08 (slash-invariance transport — the referee-critical item for the
   Fricke paper) and ALQ-01 (Atkin–Lehner family).
7. **Scope a limitation before you write it into a paper.** FRK-09 (transport the operator to
   Mathlib's bundled `ModularForm`) was shipped in the F1 paper as an explicit limitation and
   looked like the hard remaining step. One API-scoping pass showed Mathlib already had every
   piece — `MDifferentiable.slash` for holomorphy, `OnePoint.IsBoundedAt.smul_iff` for
   boundedness, `IsCusp.smul` for the cusp set — leaving only cusp-set preservation, which is
   the previous theorem plus monotonicity of `IsCusp` in its subgroup. Two proof iterations.
   Grep for lemma *shapes* (`MDiff.*slash`, `IsBoundedAt.*smul`), not names, before declaring
   something open. A limitation is a claim about the world; LL-4 applies in both directions.
8. **Useful tactics from these runs.** `group` closes the `g * (g⁻¹ * x * g) * g⁻¹ = x`
   cancellations that arise from `Subgroup.mem_pointwise_smul_iff_inv_smul_mem`.
   `linear_combination <hyp>` discharges determinant side conditions of explicit `SL(2,ℤ)`
   matrices against `det γ = 1`. When `rw` fails on a bundled coercion, `show` the goal in the
   syntactic form the lemma expects — and prefer the **class-level** lemma
   (`SlashInvariantFormClass.slash_action_eq`, stated with `⇑f`) over the structure field
   (`slash_action_eq'`, stated with `f.toFun`).

## Measuring Lean source: count characters, not bytes *(run-2 addition)*

`awk 'length($0)'`, `wc -c` and shell `${#var}` count **bytes**. Lean source is dense with
multi-byte Unicode (`ℤ`, `γ`, `⟩`, `∈`), so all three over-report by 10–20% and will manufacture a
phantom violation of Mathlib's 100-character limit. In run 2 this produced a reported "seven-line
Mathlib PR blocker" that did not exist — at character count, zero lines exceeded 100.

```python
for i, l in enumerate(open(path, encoding='utf-8'), 1):
    if len(l.rstrip('\n')) > 100:
        print(f'{path}:{i}  {len(l.rstrip())} chars')
```

State the unit before reporting any threshold violation, and re-measure in that unit before calling
something a blocker.

## Code reproduced in a paper is checked mechanically, twice *(run-2 addition)*

A paper that says "reproduced verbatim from the compiled source" is making a checkable claim. Check
it, in both directions, every build:

1. every code line in the paper appears **verbatim in the rendered PDF text** (catches the glyph
   transposition that `listings` causes under XeLaTeX);
2. every code line exists **verbatim in the Lean source** (catches drift, and catches code that was
   never in the artifact at all).

Text extraction and rendering catch disjoint defect classes — extraction misses frame overflow,
rendering cannot tell you which codepoint is present. Run both and settle disagreements with
`hex(ord(c))`. See the `scientific-publication` skill for the gate.

## Whole-library claims, and counts that survive versions *(run-4 additions)*

A claim quantified over the library ("no axioms", "no sorries") is checked over the **whole
library** — `grep -rnE '^\s*axiom '` with no `head`, comments stripped for sorries — or scoped in
the text to exactly what was checked. A truncated listing (`| head -5`) published a wrong axiom
count that survived three reviews (LL-22/23).

Numbers in a paper are never copied forward between versions. Each is recomputed from the artifact
by `scripts/paper_gate.py` at publication time; a count measured once is a claim about the past.
The footprint split specifically must be parsed multiline-aware — `#guard_msgs` info strings wrap,
and a single-line grep silently undercounts (370 vs the true 385).

## Sign-heavy classical identities: decide-pins first *(run-5 preparation)*

Dedekind reciprocity, Rademacher's Φ, and multiplier formulas are floor-and-sign case analyses —
the class of statement where a green build most easily proves the wrong convention (LL-1's failure
mode, in its analytic-number-theory form). Discipline:

1. **Pins before proofs.** Before attempting the general statement, prove 6+ explicit numeric
   instances by `decide`/`norm_num` as separate guarded lemmas, with values computed independently
   (a python one-liner in the docstring). A failing pin means the *general statement* is wrong —
   fix the statement, never the pin.
2. **`c > 0` first.** State the positive-`c` case, derive `c < 0` via `−I`, treat `c = 0`
   (parabolic) separately. Mixed-sign statements multiply the case analysis and hide convention
   errors.
3. **One Φ, named.** Apostol's Φ (`(a+d)/c − 12·sign(c)·s(d,|c|)`, cocycle law with
   `−3·sign(c_A c_B c_AB)`) and the Rademacher symbol Ψ (`Φ − 3·sign(c(a+d))`, conjugation-invariant)
   are different functions; conflating them under one name shipped a published error (LL-22).
   Every declaration says which it is.

## Half-integer weight: the csqrt idiom, not a new slash *(run-5 preparation)*

Mathlib states η's S-transformation as `η(−1/z) = (√i)⁻¹·√z·η(z)` with `Complex.sqrt`
(`Discriminant.lean`, `eta_comp_eq_csqrt_I_inv`) — a plain equation, **no weight-1/2 slash
action**. Follow that idiom for any η-multiplier work: state multipliers as explicit equations with
`csqrt` on the principal branch. Introducing metaplectic/half-integer-weight slash machinery is a
research project of its own (it is the expected named obstruction for the level-12 paper) and is
out of scope for any run that has not explicitly gate-zeroed it.

## A check that "passes" for the wrong reason is not a check *(run-6 addition, LL-27)*

`lake env lean FILE` does **not** accept `--packages` — that flag is `lake build`-only. Passing it
anyway makes `lean` itself error on the unrecognised flag and exit nonzero, which silently made a
negative-control check "pass" (report the guard as working) regardless of whether the file's own
content was actually rejected — the same bug shape as the Quarantine-file typecheck confusion
earlier in this session, now caught twice. `lake env lean` reads the `.lake/build` state a prior
`lake build ... --packages=...` step already populated; it needs no flag of its own.

**Rule.** When a check is expected to fail (a negative control, a should-error test), read its
actual stdout/stderr at least once rather than trusting the exit code alone — verify it fails for
the *right* reason before trusting that "fails correctly" means what it says.
