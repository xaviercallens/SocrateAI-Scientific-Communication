# LL.md — Lessons Learned

*Format follows `SocrateAI-Mathesis/LL.md`: why each process rule exists, with the evidence.
A rule whose incident nobody remembers is a rule that gets deleted in the next cleanup.*

Scope: the first full audit-and-repair run of this programme — the Poincaré paper audit
(workflow `wf_99af3dc1-0d8`, 11 agents, 502,721 tokens, 21.8 min, $≈3) and the Fricke pivot
that followed (2026-09-06).

---

## LL-1 — A green build proved the wrong theorem, twice *(2026-09-06)*

**What happened.** The library's `ModularForm` structure compiled cleanly and backed a Tier A
manifest claim — and was **vacuous**: its `transform_certificate` field never mentioned `eval`,
so the audit *compiled a counterexample* showing every function `UpperHalfPlanePoint → Int`
inhabits `ModularForm k` at every weight. Separately, `Core/ReferenceTheorems.lean` carried 174
"kernel-verified" theorems — 101 `rfl`, 57 `decide`, zero quantifying over any structure
(`theorem total_reference_count_is_158 : 158 = 158`).

**Why it matters.** Lean checks that you proved the statement, not that the statement says
anything. Both defects sat under a docstring saying "TIER A — kernel-verified", and both were
technically true.

**Rule.** Statement faithfulness is a separate, mandatory audit: read every definition the
theorem depends on to the bottom; for structures, attempt to construct a trivial inhabitant —
if `⟨f, proof_of_closed_prop⟩` typechecks for arbitrary `f`, the structure certifies nothing.
The FLT repo's comparator (statement checked *identical* to Mathlib's) is the mechanised form.
*Check:* the Faithfulness phase of `math-foundation-hardening` (verdicts `TRIVIAL`/`VACUOUS`).

## LL-2 — A Tier A claim named a theorem that did not exist *(2026-09-06)*

**What happened.** `formal_manifest.json` claim `GL2-WN-01` (Tier A) named
`fricke_involution_det_pos` in `ModularForms.PoincareUpperHalfPlane`. Zero grep hits in any
module. The claim had passed every prior review, including a peer-review artifact that marked
the paper "ACCEPT AS SUBMISSION-READY" while checking exactly one (unrelated) theorem.

**Why it matters.** A claim ledger whose referents are unchecked drifts into fiction while
looking authoritative — the worst failure a verification programme can have.

**Rule.** Every claimed referent is resolved mechanically. *Check:* `hallucination-guard.py`
Gate 0 (added this run; blocked on exactly this claim, 53/54 resolving) and
`dag/check_dag.py` (`proved ⟹ lean_name exists in Lean/`).

## LL-3 — "Verified in Lean" while the library could not import Mathlib *(2026-09-06)*

**What happened.** `SocrateAI-Lean-Lib` had `"packages": []` — no `require`, no
`import Mathlib` anywhere. Every module was hand-rolled over `Int`. The Poincaré paper printed
listings that *did* compile against Mathlib, so they could not have been built in the companion
repo; the abstract's "fully compilable source in the companion repository" was false.

**Why it matters.** Infrastructure absence silently caps every claim: without Mathlib there is
no ℂ, no `UpperHalfPlane`, no modular forms — only integer shadows of them.

**Rule.** Before any "formalized X" claim, verify the dependency actually resolves
(`lake build +Mathlib.<module>` or a `#check` smoke file), not that a file mentioning X exists.
*Check:* `FinalCheck.lean` imports through the real dependency chain; the build fails if it breaks.

## LL-4 — Novelty was settled by the compiler, in both directions *(2026-09-06)*

**What happened.** The audit claimed the paper's Eq. (2) was already in Mathlib; `#check
im_smul_eq_div_normSq` confirmed it verbatim (and more generally). The audit also *refuted three
of its own upstream findings* by compiling — `positivity` did close the goal the open-points
report said it couldn't; Listing 1 compiled exactly as printed. And the pivot target was chosen
the same way: `Fricke`/`AtkinLehner` return zero hits in all of Mathlib while `Gamma0`, the
slash action, and `ModularForm` exist to host them.

**Why it matters.** Recall-based novelty judgments fail both ways: they miss prior art under a
different name, and they kill real gaps out of misplaced caution. ~$3 of adversarial compute
plus a compiler beat every prose-level review the paper had received.

**Rule.** Prior-art and impossibility claims about a formal library are settled by compiling
against it, never by memory or grep alone. The Refute phase (agents instructed to *break* the
upstream findings by running code) stays in every audit workflow, at T2+.

## LL-5 — My own guard rails contained phantom claims *(2026-09-06)*

**What happened.** Five skill/agent files written earlier in this programme treated a
4.038 GHz cavity search, Gertsenshtein detection, mineral paleodetectors, and chameleon
screening as Paper II content. A precise grep across all four manuscripts: **zero hits**. The
material existed only in the legacy `.agents/` config (a plan, not a paper) — and two of the
seven "standing corrections" I was enforcing attacked claims the papers never made (Paper III
already said 16 fixed points; already labelled the M₂₄ braiding link conjectural).

**Why it matters.** Guard rails built from memory of a *plan* police the wrong thing, cost
credibility, and can force "corrections" of text that was already right.

**Rule.** A skill may assert "the paper claims X" only with a grep/read receipt in hand; scope
corrections name `file:line`. When auditing, quote the source, then judge the quote.

## LL-6 — The tier-letter collision happened to us while Stream 0 was documenting it *(2026-09-06)*

**What happened.** This programme's epistemic ladder used **B = literature-supported**.
`SocrateAI-Mathesis/docs/TIER_CALCULUS.md` §1 documents precisely this collision between
Stream 1 (B = program-checked) and Stream 5 (B = peer-reviewed) — different *kinds of evidence*
under one letter, dangerous exactly when claims cross repositories, which they already do.

**Why it matters.** We reproduced a failure that the programme's own Stream 0 had already
analysed, because the ladder was invented instead of looked up.

**Rule.** Epistemic vocabulary is Stream 0's to define. This repo's ladder is now
A1 (≈ Mathesis A) / A2 (≈ Mathesis B) / **L** (literature) / C / D / E, and any new
bookkeeping construct is checked against Mathesis (`LL.md`, `HARDNESS.md`, `TIER_CALCULUS.md`,
`schemas/`) before being invented locally.

## LL-7 — The axiom footprint became a build target *(2026-09-06)*

**What happened.** Mathesis LL-2 records a declared axiom footprint going stale four minutes
after it was written. The FLT repository solves this structurally: `FinalCheck.lean` puts
`#guard_msgs in #print axioms <thm>` in the default build, so a drifted footprint is a compile
error. We adopted it: 8 guards for the Fricke theorems, all passing in `lake build`; the
negative control (a deliberately wrong footprint in `scratch/GuardNegativeControl.lean`) fails
as required by Mathesis H2 ("a checker that cannot fail is not a checker").

**Rule.** Every headline theorem gets a `FinalCheck` guard when it lands; widening a footprint
requires editing `FinalCheck.lean`, which is the review point. The negative control is kept,
runnable, and expected to fail.

## LL-8 — Shared Mathlib pools are load-bearing and mortal *(2026-09-06)*

**What happened.** With 1.7 GB free disk, a fresh Mathlib (~7 GB) was impossible; the library
was wired to the already-built pool in `socrates-project` (toolchain realigned v4.33.1 →
v4.32.2 to match). Hours later that directory **disappeared mid-session** (later clarified: renamed into `SocrateAI-Scientific-Measure`), breaking the
build mid-session. Three sibling pools existed; `SocrateAI-Scientific-Measure` had the same
toolchain *and same Mathlib commit* `905b9581` — a drop-in. Repointing required editing both
`lakefile.lean` and the path-package `"dir"` in `lake-manifest.json` (avoiding `lake update`'s
re-download).

**Why it matters.** Pool sharing is the right call under disk pressure, but it makes another
project's `.lake` a silent dependency of every proof here.

**Rule.** The pool path, toolchain, and Mathlib commit are recorded in three places that must
agree: `lakefile.lean`, `lake-manifest.json`, and the paper's artifact paragraph. Known
fallback pools and the repointing procedure live in `lean4-formalization` §7.3.

## LL-9 — Statement-first, and prove intertwining instead of conjugation *(2026-09-06)*

**What happened.** The three open obligations (F1–F3) were first written as *typechecked
`sorry` statements* in `scratch/` — outside the library target, so the sorry-free invariant
held. Each then fell in ≤2 compile iterations. The key proof-engineering choice: prove
`W·γ = δ·W` entrywise (`fin_cases` + `simp` + `linarith`) and derive `WγW⁻¹ = δ` by one
cancellation, instead of fighting `Units.inv` entrywise.

**Why it matters.** This is the FLT DAG discipline at n = 1: a well-formed statement with open
proof is a unit of plannable work; an unstated proof goal is not. The intertwining trick
generalises: for `g x g⁻¹ ∈ S`, exhibit `y ∈ S` with `g·x = y·g`.

**Rule.** New work enters as a DAG node (`dag/theorems.jsonl`), gets a typechecked statement
(sorry allowed outside the library target), and only then proof effort — leaf-first, from the
frontier that `dag/check_dag.py` prints.

## LL-10 — The honest pivot beat the honest polish *(2026-09-06)*

**What happened.** The audited paper had a repair path (H1–H8) to an honest teaching note — and
"no novelty claim is supported" as its ceiling, since every result was in Mathlib since 2023.
Instead of polishing, the run found the adjacent genuine gap (no Fricke/Atkin–Lehner anywhere
in Mathlib), proved 8 theorems into it, and rewrote the paper around them, with the old
material demoted to context. Total marginal cost of the formal core: one afternoon, because
Mathlib supplied `Gamma0`, the slash action, and `mkOfDetNeZero`.

**Why it matters.** "Reach review acceptance" is not achievable by prose repair when the
contribution is already in the standard library; it *was* achievable one theorem to the side.
The audit's job was to say so before a referee did.

**Rule.** When an audit returns "pre-empted by prior art", the next action is a gap search in
the same neighbourhood (compiler-verified, per LL-4), not a rewrite of the framing. Novelty
statements in papers name the exact declarations that pre-empt or are absent.

## LL-11 — The bundled-type transport was three Mathlib lemmas, not a research project *(2026-09-06)*

**What happened.** FRK-09 (transport the Fricke operator to Mathlib's bundled `ModularForm`) was
scoped in the F1 paper as an explicit limitation and looked like the hard remaining step. Scoping
it against the API first showed Mathlib already had every piece: `MDifferentiable.slash` (holomorphy
under slashing by any fixed `GL(2,ℝ)` element — a one-liner), `OnePoint.IsBoundedAt.smul_iff`
(exactly the boundedness transport), and `IsCusp.smul`. The only genuine work was cusp-set
preservation, which is FRK-07 plus monotonicity of `IsCusp` in its subgroup argument. Total: one
iteration to a typechecked statement layer, two to a complete proof.

**Why it matters.** The estimate was wrong by an order of magnitude in the *easy* direction, and
the paper had already shipped a limitations paragraph asserting the work was not done. Had we
submitted first and scoped later, the paper would have under-claimed against its own artifact.

**Rule.** Before writing a limitation into a paper, spend one pass scoping it against the library
API — `grep` for the relevant lemma *shapes* (`MDiff.*slash`, `IsBoundedAt.*smul`), not just names.
A limitation is a claim about the world and is subject to the same evidence standard as any other:
LL-4 applies in both directions. *Check:* every limitation in a paper names either the missing
Mathlib declaration or the open DAG node id that tracks it.

## LL-12 — Three concurrent `lake build`s on one build directory, and a vanished Mathlib *(2026-09-06)*

**What happened.** While a review workflow was running (its Reproduce phase legitimately runs
`lake build` to verify the artifact), I started my own builds for the next proof. Three
`lake build SocrateAI` processes ended up contending on the same `.lake` directory. A probe then
failed with `object file ... FrickeModular.olean does not exist` for a module that had built
green minutes earlier, and a 15-minute monitor for that olean timed out.

Diagnosis found the real damage underneath the contention: the shared Mathlib pool had gone from
**8275 oleans / 7.4 GB to 1686 / 2.7 GB** — about 4.7 GB deleted, which is exactly the free-disk
jump from 986 MB to 5.7 GB. Lake was therefore rebuilding Mathlib *from source*, which is hours,
not minutes.

**Why it matters.** Two independent failure modes compounded, and the visible symptom (a missing
olean) pointed at neither. Concurrent builds made the state unreadable; the deleted pool made the
recovery long. Under disk pressure, "free some space" and "share a prebuilt pool" are in direct
conflict, and the pool is the thing that looks disposable.

**Rule.** One `lake build` per build directory at a time. **The guard must match the binary, not
the command line:** `pgrep -x lake`. *Check:* `pgrep -x lake` before the build.

**Correction, 2026-09-06 — the guard as first written was itself the bug.** The original rule said
`pgrep -af "lake build"`. Any shell whose own command line contains that string matches it,
including the very `until ! pgrep -f "lake build"; do sleep; done` loop written to wait for the
lock. That loop saw itself and waited forever; two "still queued" reports and one failed
background task came from a deadlock with **no real `lake` process running at all** — verified by
resolving `/proc/<pid>/exe` for every match and finding only `/usr/bin/bash`. A pattern guard that
can match its own waiter is not a guard. `pgrep -x lake` matches the process *name* and cannot
self-match from a shell.

**Rule.** The shared Mathlib pool is a build input, not a cache to reclaim. It is ~7 GB and
rebuilding it from source costs hours; `lake exe cache get` costs a multi-GB download. Before
freeing disk, exclude `*/.lake/packages/*/.lake/build`. *Check:* pool health is
`find <pool>/mathlib/.lake/build/lib -name '*.olean' | wc -l` ≈ 8275; a number far below that
means a rebuild is coming whether or not anyone asked for one.

## LL-13 — The review workflow caught what I would have shipped *(2026-09-06)*

**What happened.** The `paper-review-improve` workflow refereed the Fricke paper from three lenses
with adversarial verification. It returned MAJOR_REVISION on all three and found, among 36
findings (2 refuted by its own verify stage):

1. **The priority claim is refuted by a repository the paper itself cites.** Two independent lenses
   found that `anthropics/fermats-last-theorem` — cited as `[FLT2026]` at three places — is a
   Lean 4 + Mathlib development that already contains Fricke material. My gap check had been run
   against *Mathlib*, and the paper even admitted in its limitations that non-Mathlib Lean
   developments were unsearched — while the abstract still said "first formalization in Lean 4".
   A contradiction inside one paper.
2. **The artifact did not exist at the cited address.** Tag `fricke-v1` was never created (only
   `v1.0.0`), and all four Fricke modules, `FinalCheck.lean` and `dag/` were **untracked**.
3. **The typeset listings were corrupted** — `{γ` rendered as `γ{`, `hγ` as `γh`, `hdet⟩` as
   `)hdet`. Confirmed by rendering the page, not by reading extracted text.
4. `\detokenize` doubled `#`, so the PDF read `##print axioms`.
5. `Gamma0GL` is a plain `def`, so Mathlib's `HasDetOne` instance does not fire through it —
   verified by compiling. That undercuts the conclusion's "composes with the rest of the library".
6. "Normalizes" over-claimed: only the one-sided containment `W g W⁻¹ ∈ Γ` was formalized.
7. Prior art missed: `ModularForm.translate` / `SlashInvariantForm.translate` already transport
   slash-invariance; the `N = 1` case is `ModularGroup.S`.

**Why it matters.** Every one of these would have reached a referee. Finding 1 alone would have
been fatal to the paper's central claim, and it was *self-inflicted*: LL-4 says settle prior art by
compiling, and I did — against the wrong corpus, then wrote a stronger claim than my own
limitations section supported.

**Postscript — my own follow-up determination was itself too generous.** After the review flagged
the priority claim I ran the search and concluded that (C5)/(C6), the operator on bundled types,
might survive as a "packaging" contribution. The review's adversarial verifier had already gone
further and found `Def_CuspForm_AtkinLehnerOperator.lean`, which ships
`atkinLehnerLin : ModularForm (Gamma0 M) k →ₗ[ℂ] ModularForm (Gamma0 M) k` for the whole
Atkin–Lehner family — the same construction, more general, and ℂ-linear. It also compiled
`Module ℂ (ModularForm (Gamma0GL N) k)` against our artifact and found it **fails**, so our
operator could not even be *stated* in that form. (That last one was real and is now fixed:
`Gamma0GL` was a plain `def`; as an `abbrev` both `HasDetOne` and `Module ℂ` synthesize.)
The lesson is not just that I over-claimed once — it is that my *correction* over-claimed too,
in the same direction, and only an adversarial pass caught it.

**Rule.** A priority claim names the corpus it was checked against, and the abstract may not claim
more than the limitations section concedes. Before any "first formalization" claim, search every
*Lean development* cited in the paper's own bibliography, not just Mathlib. *Check:* the novelty
lens of `paper-review-improve`, which is instructed to settle prior art by compiling and by
repository search.

**Rule.** Artifact claims (repo, tag, module paths) are verified against `git` before the paper
compiles, not before submission. *Check:* the Reproduce phase, which checks every self-referential
artifact claim; it caught the tag and the job count independently.

**Rule (typesetting).** For Lean code under XeLaTeX use `fancyvrb`, not `listings`. `listings`'
`extendedchars` machinery transposes glyphs it does not have literate entries for — visibly, in the
PDF, while the prose renders fine. Verify by *rendering the page*, since `pdftotext` order and
visual order can each mislead alone.
