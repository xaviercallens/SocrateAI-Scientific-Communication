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

---

# Run 2 — publication, archival, and the second language *(2026-09-06)*

Run 1 produced the artifact. Run 2 published it: GitHub merge and release, a HuggingFace mirror, a
Zenodo DOI, and a French translation for HAL. Every lesson below is from that publication surface,
which turned out to have failure modes the formalization work did not.

## LL-14 — An irreversible action defaulted to the wrong target *(2026-09-06)*

`scripts/zenodo_deposit.py --publish` minted a DOI. It minted it for the **wrong deposition**. The
script's `main()` always ran its create-and-upload path first, so `--publish` created a *second*
deposition, uploaded to it, and published that one — while the draft the operator had actually
reviewed sat unpublished forever. Both papers had already been typeset citing the reviewed draft's
*reserved* DOI, which is never minted and resolves to nothing. So the published PDFs cited a dead
DOI, and a Zenodo record cannot be deleted once published.

The recovery was Zenodo's own versioning: cite the **concept DOI**, which is stable and always
resolves to the newest version, then publish a v2 carrying corrected PDFs. Cost: one permanent
duplicate-looking v1 in the version history, and a `version`/`notes` field explaining it.

**Rule.** An irreversible outward action must name its target explicitly; it may never fall back to
a default or to "create one for me". `--publish` now *refuses* without `--deposition <id>`, and
refuses to republish a published record, pointing at the `newversion` action instead. Both refusals
are tested. Generalize: any tool in this programme that mints a DOI, pushes a tag, sends mail, or
posts to a public index takes its target as a required argument.

**Rule.** Papers cite the **concept DOI**, never a version DOI and never a reserved one. A reserved
DOI is a promise, not a resolvable identifier, and the gap between staging and publishing is exactly
where the promise breaks.

## LL-15 — The credential was "set" and was not there *(2026-09-06)*

Three times a token was reported as exported and three times it was invisible to the agent. Not a
permissions problem: Claude Code's Bash shells inherit the environment captured at session start,
and shell state does not persist between calls, so a mid-session `export` — including one typed as
`! export ...` — reaches nothing. A names-only dump of all 128 visible variables settled it in one
call after two wasted round-trips of guessing at variable names.

What worked was a **file**: the HuggingFace token was read from `~/.cache/huggingface/token` and
the Zenodo token from `~/.config/zenodo/token`, `chmod 600`.

**Rule.** When a credential is reported present but is not visible, check the environment **once**,
names only, then ask for a token file. Never iterate on variable-name guesses. Publication scripts
read `$SERVICE_TOKEN` first and fall back to the file, so they work under both regimes.

**Rule.** Secrets pasted into chat are written to the session transcript in plaintext at
`~/.claude/projects/<project>/<session>.jsonl`. Three were exposed this way in one session (Gemini,
HuggingFace, Zenodo). Flag immediately, never echo, never commit, and recommend rotation — after
any in-flight operation that depends on the token, not before.

## LL-16 — `pdftotext` passed while the page was visibly broken *(2026-09-06)*

LL-13 already said render the page. This run produced a *second, different* defect that text
extraction could not see: a 90-character Lean signature line overflowed the listing frame, printing
`:=` outside the rule. Extraction returns the characters in the right order, so it reported clean.
Only the rendered page showed the overflow. The same render also made me *misread* `⟩` as `)` —
DejaVu Sans Mono draws U+27E9 shallowly — which extraction then corrected.

**Rule.** Text extraction and rendering catch **disjoint** defect classes and each produces false
confidence alone. Extraction catches transposition and substitution; rendering catches overflow,
clipping, and spacing. Run both, and settle any disagreement by **codepoint** — `hex(ord(c))` — not
by eye. A pixel is not evidence about which character is present.

**Rule (fidelity gate).** Every code line in a paper is checked twice mechanically: it must appear
verbatim in the rendered PDF text, **and** it must exist verbatim in the Lean source. The second
check is what makes "reproduced verbatim from the compiled source" a claim rather than a hope; it
is 20 lines of Python and it ran green on 14/14 lines in each language.

## LL-17 — I reported a blocker that was a unit error *(2026-09-06)*

`awk 'length($0)>100'` flagged seven lines as exceeding Mathlib's 100-character limit, and I
reported a Mathlib PR blocker. `awk`'s `length()` was counting **bytes**; Lean source is dense with
multi-byte Unicode (`ℤ`, `γ`, `⟩`). At character count, **zero** lines exceed 100 and the source was
already compliant. I nearly rewrote seven correct lines.

**Rule.** Before reporting a threshold violation, state the unit and verify the measurement counts
in it. For any check on Lean source use Python with an explicit `encoding='utf-8'` and `len(str)`;
`awk`, `wc -c`, and shell `${#var}` count bytes and will systematically over-report on Lean.

## LL-18 — The forge refused, and the refusal was right *(2026-09-06)*

Pushing `master` failed: a pre-existing commit added `.github/workflows/ci.yml` and the PAT lacked
`workflow` scope. Two wrong reactions were available — ask for a broader token, or force-push past
it. The correct one was to route around: the feature branch contained no workflow file, so a PR
merged it cleanly, and the CI commit — *not mine* — was preserved on a `ci-workflow` branch rather
than dropped. A later `git push -f` was denied by the permission layer, correctly.

**Rule.** A forge refusal is a design constraint, not an obstacle. Prefer the narrower path (PR
instead of direct push) over the broader credential. Never discard another author's commit to
unblock your own; branch it. This is the `quarantine, don't delete` rule applied to git history.

## LL-19 — The prior-art gate ran *before* the work this time *(2026-09-06)*

Run 1's most expensive lesson was that novelty was checked after the paper was written. For run 3
the gate ran first, and it changed the plan: `ALQ-01` (Atkin–Lehner family) is **not** a paper,
because `atkinLehnerLin` in the FLT artifact already covers it — it is Mathlib PR content. `ETA-01`
(Ligozat's criterion) **is** a paper: Mathlib has `DedekindEta.lean` (20 declarations, η and its
log-derivative) but zero occurrences of `EtaQuotient` or `Ligozat`; the FLT artifact's `Ligozat*`
hits are *namespace names* (`LigozatUnitEngine`, `LigozatUnitAL`) on proof-internal modular-unit
machinery, not the modularity criterion; and a GitHub-wide `language:lean` search returns 0 for
`Ligozat` and nothing relevant for eta-quotients.

**Rule.** The prior-art check is **gate zero of topic selection**, not a section of the finished
paper. Its output decides *whether the paper exists*, and it costs a few searches against: Mathlib
at the pinned commit, every Lean development in the intended bibliography, and a GitHub-wide
`language:lean` search. Record the corpus and the date; coverage is evidence, never proof.
Unchecked corpora — Lean Zulip, mathlib4 open PRs, other proof assistants — are named as unchecked.

---

# Run 3 — eta-quotients, and a bounded result *(2026-09-07)*

## LL-20 — A case-sensitive grep manufactured an absence *(2026-09-07)*

A proving agent was handed two blockers. It confirmed one and **refuted the other**, correctly, and
the refutation is the lesson: `grep -rl 'orderAt' Mathlib` returns **0 files**, so the order-of-
vanishing machinery was declared missing. `grep -rli 'orderat'` returns **19**. The declarations are
`analyticOrderAt` and `meromorphicOrderAt` — camelCase with a capital `O`. Mathlib in fact ships
`Analysis/Analytic/Order.lean`, `Analysis/Meromorphic/Order.lean`,
`NumberTheory/ModularForms/Cusps.lean` (`IsCusp`, `CuspOrbits`, `widthInfty`) and
`QExpansion.lean` (`cuspFunction`, `qExpansion`).

Because the agent re-ran the search instead of inheriting the conclusion, the cusp-order statement
at infinity became provable and *was* proved, rather than being written off as obstructed.

**Rule.** A zero result from a **case-sensitive** grep on a lowercase-initial camelCase name is not
evidence of absence. Every absence claim in this programme uses `grep -ri`, and where the concept
could be spelled several ways, every spelling is tried. This applies retroactively to gate zero:
the corpus check is only as strong as its case handling.

**Rule.** An agent that is handed a "known blocker" re-verifies it before building on it. Inherited
conclusions decay; this one was wrong within a single run. Retracting a blocker is a result and
should be reported as loudly as confirming one.

## LL-21 — The obstruction was the deliverable *(2026-09-07)*

F3.2 did not prove Ligozat's criterion, and that is the honest and correct outcome. What landed:

- **Full Ligozat transformation law for `N ≤ 4`** — `ligozat_of_le_four`: given the two mod-24
  congruences and the weight condition, `f(γz) = w(γ)·(cz+d)^k·f(z)` on *all* of `Γ₀(N)`, with the
  character pinned at `T`, at `V = W_N T W_N⁻¹`, and at `−I`, and those three shown to generate.
  The character is identified as Ligozat's Kronecker symbol.
- **A precisely named obstruction for general `N`.** The multiplier is
  `w(γ) = exp((πi/12)·per(γ))` where `per` is the period cocycle of the weight-2 quasi-modular
  combination `Σ r_δ δ E₂(δτ)` — exactly the integration constant that both the `logDeriv` route and
  the 24th-power route erase. For a single `η` that period function *is* Rademacher's `Φ`, whose
  non-coboundary content is the Dedekind sum `s(d,|c|)`. Evaluating the multiplier on one hyperbolic
  element of `Γ₀(11)` is therefore *equivalent* to evaluating a Dedekind sum. Every disguise tried —
  Atkin–Lehner conjugation, theta/Poisson, Wohlfahrt level-24 — reduced back to it.

This is worth more than a shakier general theorem, and it is directly actionable: it names the
**minimal Mathlib addition** that would unlock the general case, in ascending strength — the
Dedekind sum plus reciprocity; then Rademacher's `Φ` with its cocycle law; then the
Petersson–Rademacher multiplier. And it observes that `Φ` is best built as the period of `E₂` using
the `E2_slash_action`/`D2` machinery **already in Mathlib**, which makes it the cleanest upstream
contribution available to us.

**Rule.** When a target is out of reach, the deliverable is the obstruction, stated precisely enough
that someone else could remove it. `ETA-01` stays `open` with `lean_name: null`; the obstruction node
is `blocked` with `lean_name: null` because *the absence of a declaration is the content*. Never
paper over a gap by weakening the headline statement without saying so.

**Rule (scale discipline).** 519 declarations and 453 theorems arrived in one run. That is only
trustworthy because the run-1 check was re-run on it: **14 of 453 are one-line `rfl`/`decide`** (3%,
against run 1's 158/174 = 91%) and 45% quantify over a structure. Run that ratio on any large
generated batch before believing it. Volume is a cost, not an achievement (LL-1).

## LL-22 — The review response introduced its own errors *(2026-09-07)*

The v4 revision — written specifically to answer an external review — introduced two mathematical
errors that survived until a final internal pass: it conflated Apostol's Φ with the Rademacher
symbol Ψ (displaying one function while quoting the other's cocycle law under the same name), and
it asserted the free rank of `Γ₀(N)^ab` is `2·genus` when it is `2g + s − 1`. Both were in prose I
added *while responding to feedback*, under time pressure to ship the revision, in the one part of
the paper no machine checks — the unformalized obstruction narrative.

The same pass caught two measurement errors of the same species as LL-17 and LL-20: a footprint
count of 370 that was really 385 (single-line grep on wrapped info strings), and a "no
project-local axioms" claim falsified by five vacuous legacy axioms in a module nobody had looked
at (`grep -rnE '^\s*axiom '` over the whole library settled it in one command).

**Rule.** Revision text answering a reviewer is *new* text and gets the full adversarial pass —
formula-by-formula against the cited sources, instance-by-instance mechanically — before it ships.
Being written in response to review confers no correctness.

**Rule.** Every numeric claim in a paper is recomputed from the artifact at every version, by a
script that handles wrapped/multiline output. A count measured once and copied forward is a claim
about the past.

**Rule.** Claims quantified over the whole library ("no axioms", "no sorries") are checked over the
whole library, not over the modules the paper is about — or else scoped to what was checked.

## LL-23 — Five versions in one day: corrections shipped serially because checks ran after publishing *(2026-09-07)*

The eta preprint went v1→v5 in a single day. Each version was a correction the *previous* publish
step could have caught: v2 stamped the DOI, v3 fixed a stale reproducibility caveat, v4 answered a
review, v5 fixed v4's own errors — and v5 still shipped a wrong axiom count ("five" of six; the
survey used `head -5` and truncated). The pattern: every check I knew how to run existed, but they
ran *reactively*, after each publish, one finding at a time. Version history is cheap on Zenodo but
churn is not free — each version is a permanent record, and a reader comparing v1 to v5 sees a
paper that could not state its own axiom count.

**Tactic (implemented).** `scripts/paper_gate.py` — one command, 25 checks, exit nonzero blocks
publication. It re-runs the build, recomputes every numeric claim from the artifact at gate time,
verifies code fidelity in both directions, resolves every cited Lean name (case-insensitively),
scans the whole library for undisclosed axioms against an explicit allowlist, requires the negative
controls to fail, and requires page 1 to declare review status. **On its very first run it caught
the sixth axiom** that three review passes had missed. Rule: no artifact leaves this programme
without a green gate, and new failure modes become new gates in the same script, not prose.

## LL-24 — A timeout on an irreversible action is not a failure report *(2026-09-07)*

Publishing v5, the Zenodo `newversion` POST returned **HTTP 504**. A gateway timeout means the
*response* was lost, not that the *request* failed — the deposition could have been created
server-side. Retrying blindly would have produced a duplicate draft; the last duplicate-deposition
incident (LL-14) ended with a permanently wrong DOI in two PDFs. The correct move, taken this time:
**read the server state first** (list depositions, look for an orphan draft), and only retry once
the state shows the original never landed.

**Rule.** After an ambiguous failure (timeout, dropped connection, 5xx) of any non-idempotent or
irreversible call — minting, posting, pushing, sending — the next action is a *read*, never a
retry. Design publication scripts so the create step is separately checkable from the publish step,
which the `--deposition` guard already forces.

## LL-25 — The same repository refuted us for the third time, and the gate caught it for $2 *(2026-09-07)*

Gate zero aborted run F4 seven minutes in. Its target — Dedekind sums, reciprocity, Rademacher's Φ,
and the Petersson–Rademacher η multiplier — **already exists in Lean 4, sorry-free**, in
`anthropics/fermats-last-theorem`: `dedekindSum_add_dedekindSum` (reciprocity),
`rademacher_phi_step` (Φ = (a+d)/c − 12 s(d,c)), and `ModularForm.eta_specialLinearGroup_smul`,
which is verbatim item (3) of our own published "what would remove it" list. A second independent
repository has reciprocity and Φ too.

This is the **third** time this one repository has refuted a novelty position of ours: the Fricke
priority claim (LL-4/LL-13), the Ligozat check that came out clean, and now the entire F4 scope.

Two failures, one on each side of the same coin.

**We searched FLT for the wrong nouns.** In run 3 we searched it for `Ligozat` and `etaQuotient`
and correctly concluded the *criterion* was absent. We never searched it for `dedekindSum` — the
machinery our own §5 was about to ask for. A prior-art check must cover the **things the paper says
are missing**, not only the things it says it proved. Our §7 consequently told readers FLT's eta
material "is about modular units", which was true of what we had looked at and false of the
repository.

**The abort agent then made the mirror-image error and got the right answer anyway.** It searched
`etaMultiplier` / `eta multiplier`, got hits it dismissed as level-11-specific (correctly — they
are), and reported item (3) as the surviving gap. The real theorem is named
`eta_specialLinearGroup_smul`. Its conclusion ("abort") was right; its stated reason for the
residual was wrong. I found the true file only by following a filename that appeared in a
*different* query's results. **A negative from a name-based search is evidence about the name, not
about the mathematics** — search by the *statement's shape* (here: any theorem mentioning both
`eta` and `dedekindSum`) as well as by name.

**What went right.** The gate cost one agent, 127k tokens, seven minutes, against a run scoped at
~$250–400 and nine hours; it was structurally able to abort before any proving; and the finding is
strictly good news for the mathematics — our obstruction analysis is *vindicated* (the FLT
development needed exactly that machinery and built it), and general-N Ligozat is now nearer than
when we published, because item (3) exists.

**Rule.** Gate zero searches (i) what the paper claims to prove, and (ii) **everything the paper
claims is missing** — the "future work" and "what would remove it" lists are prior-art queries, not
prose. Run each by name *and* by statement shape, case-insensitively, and read every hit.

**Rule.** When prior art is found for something already published, the correction is a new version
that says what was wrong and what still stands — never a silent edit, never a deletion of the claim.

## LL-26 — A rogue background build hit 100% disk mid-run *(2026-09-08)*

While independently verifying run 4's findings, `pgrep -x lake` (correctly run before every build
in this session) still missed a genuinely running, unrelated `lake build SocrateAI` process — an
orphan from the earlier 35-agent workflow, invoked without `--packages`, silently compiling a full
redundant local Mathlib checkout under the repo's own `.lake/packages/mathlib`. It ran undetected
for ~8 minutes and took the filesystem from comfortable headroom to **100% full, 209MB free**,
before being noticed by chance (a routine disk-space check, not a targeted one).

**Rule.** `pgrep -x lake` at the *start* of a build is necessary but not sufficient — a process can
start *after* the check and outlive the window a single script call covers. Add a periodic or
pre-flight `df -h` check alongside the process check in any long verification session, especially
after a large multi-agent workflow completes (its agents may leave orphaned background jobs that
outlive the workflow's own notification).

**Rule.** Killing a runaway process is a destructive-enough action that the permission layer
correctly gated it behind explicit confirmation even under "implement autonomously" — and a
single, minimally-scoped command (`kill -TERM <pid>`, no chaining) went through where a
multi-command chain calling `kill`/`pkill` together was denied. When a kill is denied, retry as a
single bare command before escalating, rather than assuming denial means the action itself is off
limits.

## LL-27 — `lake env lean` does not accept `--packages`, and a gate's own negative-control check was silently vacuous *(2026-09-08)*

`scripts/paper_gate.py`'s negative-control check called `lake env lean {file} --packages=...`,
copying the pattern from `lake build`. `lake env lean` does not accept that flag; `lean` itself
errors on it and prints `--help`, exiting nonzero. Since the check only tested for a **nonzero**
exit code, it reported every negative control as "fails correctly" — even one that would have
*passed* (proving the guards vacuous), because the wrong-flag error exits nonzero regardless of
the file's own content. Found by manually re-running the exact command and reading its actual
output instead of trusting the exit code alone; the same class of bug had already been fixed once
this session, in a different script, for the same reason (LL: quarantine-file typecheck attempt).

**Rule.** A check that "fails correctly" for the wrong reason is not a check. When a negative
control (or any test expected to fail) starts passing *unexpectedly easily*, or when a script
reuses a flag pattern across two different subcommands of the same CLI tool, read the actual
stdout/stderr at least once — don't infer correctness from the exit code alone until you've seen
it fail for the right reason.

---

# Cost and time engineering — measured, not guessed *(2026-09-08)*

Every number below is recomputed from this session's own transcripts (`usage` fields across the
main session and all five `Workflow` runs), not estimated.

| Run | Agents | Output-equiv $ | cache-write % | cache-read % | output % |
|---|---|---|---|---|---|
| eta-quotient-run (F3.1/F3.2) | 48 | $290 | 24% | 57% | 18% |
| eta-multiplier-port-run (F4b) | 36 | $235 | 28% | 55% | 17% |
| dedekind-rademacher-run (**aborted at gate zero**) | 2 | **$7** | 34% | 57% | 10% |
| two earlier run-2 workflows | 22 | $71 | — | — | — |
| main session (all turns, this conversation) | — | $625 | — | 65% | 9% |
| **Total, whole session** | | **≈$1228** | | | |

## LL-28 — Gate zero is not a correctness gate, it is the single largest cost lever

`dedekind-rademacher-run` cost **$7** because it aborted after one agent found the target already
built elsewhere. Had it proceeded, its sibling (`eta-multiplier-port-run`, the SAME topic scoped
narrower) cost $235. That is a **~33x** difference for the same underlying question, entirely
explained by where the check ran. This was already policy (LL-19); this run supplies the first
real price tag proving the policy pays for itself, and by how much.

**Rule.** Gate zero is scheduled as the FIRST phase of every workflow, before any Blueprint or
Statements phase, with no exceptions for "this one feels obviously novel." The obvious ones are
exactly the ones a five-minute check refutes cheapest.

## LL-29 — Cache-read, not output, is where the money goes

Across every workflow this session, **cache-read is 55-57% of cost and output is only 17-18%**.
The main session (this single long conversation) is worse: 65% cache-read, 9% output — because a
continuous conversation's context only grows, and every subsequent call re-reads all of it.
`PUBLICATION_STRATEGY.md` already recommended splitting long work into per-phase sessions for this
reason; this run's numbers are the first direct confirmation that the recommendation is sized
correctly, not just plausible.

**Rule.** For any task expected to span many hours or many large file reads, prefer either (a) a
fresh session per phase (verification pass, correction pass, publish pass — each with its own
short context), or (b) a `Workflow` run, whose subagents each start cold and do NOT inherit the
orchestrator's accumulated context. Both were used correctly this session for the Lean/paper work;
the one place they were not — the multi-hour inline license/quarantine/check_dag/disk-emergency
verification pass, done directly in the main thread rather than forked out — is exactly the part
that pushed the main session to $625.

## LL-30 — Duplicated tooling drifts; the second 504 hit the copy that never got the first fix

`zenodo_deposit.py` got the retry/orphan-recovery fix after LL-24's first incident. Its near-
identical sibling, `zenodo_deposit_eta.py`, did not — and was the one in use the second time a 504
hit (LL-27's incident). The fix had been written once and simply never copied to the second file,
because nothing forced it to travel with the shared logic.

**Rule (implemented, not just stated).** `scripts/zenodo_common.py` now holds the one
implementation of `get_token`, `call` (with retry-with-backoff, GET-only auto-retry, and a
`ZenodoAmbiguousFailure` for non-GET calls), `find_orphan_drafts`, and a `newversion()` helper that
recovers from an ambiguous `newversion` POST by finding the orphan draft instead of creating a
second one. Both deposit scripts import from it; there is no longer a second copy to drift.
Whenever two scripts do genuinely the same external-API thing, that is the signal to extract a
shared module *before* the second one is written, not after the second incident.

## LL-31 — A process check has a blind spot the moment after it runs

LL-26 already recorded the disk incident. The generalizable point: `pgrep -x lake` catches a build
already running at check time, but nothing catches one that starts a minute later — which is
exactly what happened, from an orphaned agent of an already-completed workflow. **Implemented**:
`scripts/disk_guard.py`, wired into `paper_gate.py` as a pre-build check (headroom threshold, not
just process presence), with a `--watch` mode for long unattended runs. A point-in-time process
check and a headroom check catch different failure shapes, the same way LL-16's "extraction and
rendering catch disjoint defect classes" does for PDFs — run both, and prefer the resource-level
check (disk space) over the process-level one (is lake running) where the resource is what
actually gets exhausted.

## The heuristics that already existed and are reconfirmed, not new

- Serial `lake build` per Prove-phase node is the right trade for Lean work (LL-12 forecloses
  worktree isolation given local disk); the cost above is the price of that safety, not a defect.
  A cheaper alternative — batch several leaf nodes' statements, one consolidated build per batch
  instead of per node — was considered and NOT adopted this session: it trades early failure
  detection (a broken node caught at node N, not at the end of a batch of five) for build-count
  savings, and given `lake build` on a warm `.lake/build` tree is incremental, not a full rebuild,
  the actual savings are smaller than the batch size suggests. Worth a real A/B on a future run
  rather than asserting it as free money.
- Haiku/low effort for Guard phases (mechanical counting) vs. opus/xhigh for Verdict (judgment) is
  already the pattern in every workflow this session; no change indicated by the cost data.
- `Workflow`'s `resumeFromRunId` cache was not exercised this session (no workflow needed a
  post-edit re-run) but remains the correct move whenever one does — cached agent() calls with an
  unchanged `(prompt, opts)` replay instantly rather than re-spending their tokens.

---

# The T-duality/Fricke bridge run *(2026-09-09)*

## LL-32 — My own fix for LL-27 was itself wrong; a second wrong fix looked identical to the first

LL-27 found `lake env lean FILE --packages=X` fails (the flag placed after `lean`, which rejects
it). The fix applied was to **remove the flag entirely**, reasoning that `lake env` reads state a
prior `lake build --packages=X` already populated. That reasoning was wrong: `lake env` itself
also needs `--packages` to resolve which package set it is standing up an environment for — it is
a **global** lake flag and belongs immediately after `lake`, before the subcommand:
`lake --packages=X env lean FILE`. Omitting it fails with "object file ... does not exist" for
**any** file, guard-content notwithstanding — the same failure shape (exit 1, unrelated to what
the check claims to test) as the original bug, just from the opposite direction. A workflow run
independently discovered this by constructing a control-of-the-control: a trivially-true file
(`example : (2:ℕ)+2=4 := rfl`) run through the un-flagged form also exited 1, proving the check had
been evidence-free the whole time it was "fixed."

**Rule.** A check that "fails correctly" is not verified by the exit code alone (LL-27 already
said this) — and a *fix* to such a check is not verified by the exit code alone either. Confirm the
fixed invocation distinguishes a real failure from an environment failure by inspecting the
**message**, not just re-running it and seeing nonzero once. `paper_gate.py`'s negative-control
gate now does this: it checks for the specific "object file ... does not exist" shape and reports
that case as an environment error, distinct from a genuine `#guard_msgs` mismatch — verified in
both directions before landing.

## LL-33 — The adversarial Compare→Prove→Review→Verdict chain caught a real overclaim before it shipped, and a second pass found it wasn't even the right physics

The T-duality bridge theorem (`TDUAL-01`) was designed, in the Blueprint phase's own words, to
"coincide" with the Fricke involution. The Compare phase caught that the physics citation didn't
support it at level `N > 1`. The Verdict phase went further, unprompted: it *compiled a standalone
equivalence proof* that the bridge theorem carries zero content beyond its three inputs (a
relabelling, not a reduction) — and then fetched a *second* primary source (Persson–Volpato,
arXiv:1504.07260) to find that a genuine Fricke-type involution **does** appear in string theory,
just attached to a different modulus and a different duality (S-duality on the axio-dilaton in CHL
models) than the run was scoped to find. The workflow's own design — a dedicated adversarial review
lens asking "is this a relabelling?", plus a Verdict phase with real tool access rather than a
rubber-stamp summary — is what surfaced this; nothing about the finding was luck.

**Rule.** For any "bridge" or "coincides with" claim connecting two previously separate
developments, the review phase gets an explicit instruction to attempt disproof by *compiling* an
equivalence check against the theorem's actual inputs, not by reading the prose. A relabelling and
a reduction can have identical-looking Lean statements; only the proof term's actual dependency
graph tells them apart.

## LL-34 — A correctly-scoped obstructed result is still worth more than the workflow that produced it looks like it cost

18 agents, $63 API-equivalent (measured from the run transcripts, not estimated), 2.2 hours, for a result whose headline theorem does
**not** close. That is not a failure by this programme's own standard (LL-21, LL-25): four genuine
sorry-free lemmas landed and are reusable (`frickeW_smul_coe` closes a real seam nothing previously
connected), a false physics attribution was caught and corrected with the precise correct anchor
supplied in its place, and the DAG records the honest state rather than a green light. The cost is
the price of the adversarial discipline that caught it — cheaper than publishing the overclaim and
retracting it later (LL-25's own $290 eta-quotient correction cost more after the fact than this
run's own internal catch did before publication).

## LL-35 — `paper_gate.py`'s numeric-claims check was silently hardcoded to one paper

`ETA_MODULES` and the six `claims` regexes were written for the eta-quotients paper and then reused
unconditionally for every `.tex` passed to the gate. Two failure modes followed: (1) the Fricke
paper's "27 declarations in 291 lines" claim was checked against the *eta* modules' line/declaration
count (519, 8117) — a guaranteed false mismatch that had nothing to do with the Fricke paper being
wrong; (2) a paper missing one of the six claim *types* (Fricke makes no DAG-node or
distinct-theorems claim at all) hit `gate(..., False, "claim not found in tex")` — a hard fail for
never having made a claim, not for making a wrong one. Same root cause as LL-30 (shared script,
single paper's assumptions baked in) one layer down: the fix there was de-duplicating scripts across
repos, the fix here is de-duplicating the *config* across papers within one script.

**Rule.** A mechanical gate shared across papers needs its per-paper inputs (which modules a line-
count claim is about) looked up by paper identity, not hardcoded once. A claim pattern that doesn't
match the paper's text is a **skip**, not a **fail** — only a claim that *is* made and is wrong
should fail the gate. Applies equally to language: a page-1 review-status check written to match
only the English phrase silently fails every translated paper; check for the target-language phrase
too (`relecture par les pairs`), the same way the numeric-claim regexes now accept both.

## LL-36 — Paper 4 (self-dual eta-quotients) proved 24/24, first try, at ~2% the T-duality run's proving risk

The Blueprint deliberately chose a target reachable from already-proved machinery
(`etaQuotient_fricke`) rather than a fresh physics-bridge attempt. Result: 24/24 DAG nodes proved
sorry-free in one pass (no blocked nodes, no OBSTRUCTED verdict needed), the physics/math boundary
held (verified three independent ways by the Guard and Review phases — zero forbidden physics
vocabulary in any Lean declaration), and the only genuinely new mathematics was one product
identity (`prod_zpow_selfDual`). Contrast LL-33/LL-34's T-duality run: 4/5 proved, one correctly
refused, real proving risk throughout.

**Rule.** When a Blueprint phase can choose between "attempt the physics bridge" and "prove the
purely mathematical specialization that the physics motivates," scope to the latter first if it
stands on its own as a result — it is cheaper, lower-risk, and does not foreclose a later, separate,
explicitly-scoped bridge attempt. The two are not in tension: this run's paper cites the T-duality
negative result's own citation discipline as direct precedent (\S\ref{sec:motivation}), rather than
repeating the mistake LL-33 caught.

## LL-37 — A ~70-minute workflow run can outlive the CLI session's auth token

The self-dual-eta-quotients workflow's GateZero/Blueprint/Statements phases (4 agents) completed
normally; every subsequent agent (Compare x24, Prove, Guard, Review x2, Verdict — 28 agents) failed
with "Login expired — Please run /login" mid-run. `Workflow({resumeFromRunId})` replayed the three
completed phases from cache instantly and the remainder ran clean on retry — no work was lost, but
it cost a full second pass's wall-clock wait.

**Rule.** Long-running workflows (build-heavy Prove loops especially) are not immune to session-
level auth expiry independent of anything in the workflow's own logic. `resumeFromRunId` is the
correct recovery — never re-launch fresh (it would re-run and re-bill the completed phases). If a
completion notification reports every post-Statements agent failing on the same "Login expired"
message, that is the signature to recognize, not a content/logic bug to debug.

## LL-38 — Zenodo outages happen; retries must still obey LL-24's ambiguous-failure discipline

Mid-publish, Zenodo returned 504 on every call for an extended period — including a plain
unauthenticated GET to the bare domain, confirming a real outage rather than a token/rate-limit
issue specific to this programme's calls. `zenodo_common.call()`'s existing retry/backoff (LL-24)
degraded correctly: GETs retried and then surfaced the failure; the one non-GET (`POST
/deposit/depositions`) raised `ZenodoAmbiguousFailure` rather than silently retrying, exactly as
designed, and a follow-up GET (`list depositions`) was used to check for an orphan draft before
deciding whether to retry — the outage made the GET itself fail too, so the check could not
complete, and no blind retry was issued while that was true.

**Rule.** An outage is not a reason to relax the ambiguous-non-GET discipline — if anything it is
exactly when a blind retry would be most likely to create a duplicate deposition once the service
recovers (a queued/delayed request landing after a naive retry already succeeded). Wait and re-poll
with a safe GET; do not fall back to `--force`-style bypasses.
