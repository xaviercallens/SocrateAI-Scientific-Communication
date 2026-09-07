---
name: formalization-dag
description: "Scale Lean 4 formalization across many agents using the architecture proven on Fermat's Last Theorem: a DAG of theorem statements that drives work selection, statements separated from proofs into different files, a natural-language description per statement for search and reuse, and an automated statement comparator against Mathlib. Use when a formalization is too large for one agent or one session, when agents keep losing project state, or when deciding what to prove next."
---

# Formalization at Scale — the DAG architecture

Source: Anthropic, *Formalizing Fermat's Last Theorem* (2026-09-04), and the platform paper it
describes — Chen, S., Marwaha, K., Lu, X., Yuen, H., & Peng, T. (2026), *Prove2Me: An open
collaborative platform for scaling math formalization*, arXiv:2608.28433. **Not yet in
`references/references.json`** — add it via `build_reference_db.py` before citing it in a paper.

## 1. Why this exists — the documented failure mode

The FLT effort's first attempts failed, and the reported reason is specific and relevant to us:
agents "quickly lost track of the project's state and stopped collaborating effectively." Those
failed attempts still contributed **~7% of the non-boilerplate lines** in the final proof — wasted
work that had to be carried. The effort succeeded only after switching to a platform that
maintained shared state.

This is the same failure this repository already exhibits in a different form.
`SocrateAI.Core.ReferenceTheorems` contains 174 "theorems" of which 101 are `rfl` and 57 are
`decide`, and **zero quantify over any structure** — the artefact of generating Lean from
bibliography metadata with no shared notion of what was actually being proved. The remedy is not
more agents; it is shared state that makes "what should I prove next, and does it depend on
anything unproved?" a lookup instead of a guess.

Scale calibration, so expectations are honest:

| Effort | Output | Time | Resources |
|---|---|---|---|
| FLT (Wiles, via Darmon–Diamond–Taylor) | 13M lines Lean, 30,300 theorems proved (29,500 used) | 11 days | ~6B output tokens, frontier model |
| Vinogradov's Three Primes Theorem | one major result | 3 days | **three personal Claude Max plans** |

The second row is the one that matters here. Collaborative formalization of a major result is
reachable on consumer subscriptions with the right scaffold. The first row is not our budget.

## 2. The four architectural rules

### 2.1 A DAG of theorem *statements*, separate from their proofs

Maintain a directed acyclic graph whose nodes are statements and whose edges are dependencies.
Agents choose work by querying the DAG, not by reading the whole project. This is what mitigates
memory degradation and what makes parallel work safe.

A node carries, at minimum:

```json
{
  "id": "K3-KUNNETH-B3",
  "statement": "theorem b3_K3xT2 (X : K3Surface) (T : Torus 2) : betti 3 (X.prod T) = 44",
  "nl_description": "The third Betti number of the product of a K3 surface with a 2-torus is 44, by Kunneth.",
  "depends_on": ["K3-BETTI-VECTOR", "TORUS-BETTI-VECTOR", "KUNNETH-PRODUCT"],
  "status": "open | claimed | proved | blocked",
  "proof_file": "Lean/SocrateAI/StringTheory/Proofs/KunnethProduct.lean",
  "axioms": ["propext", "Classical.choice", "Quot.sound"],
  "paper_claim": "PI-TOP-02"
}
```

**`status: claimed` is the concurrency primitive.** An agent claims a node before working it, so two
agents never prove the same lemma. This is the whole of the coordination protocol — it does not need
to be more sophisticated.

### 2.2 Statements and proofs live in different files

The FLT write-up gives two reasons: it speeds Lean compilation, and it minimises resource
consumption. The links between statement and proof are maintained independently by the platform.

Concretely, for this repository:

```
Lean/SocrateAI/StringTheory/KunnethProduct.lean          -- statements + defs only
Lean/SocrateAI/StringTheory/Proofs/KunnethProduct.lean   -- the proofs
```

A downstream module importing the statements file does not recompile proofs it does not use. On a
library where one deep proof can dominate build time, this is the difference between a 30-second
iteration loop and a 10-minute one.

### 2.3 Every statement carries a natural-language description

The FLT write-up credits this with "enabling search and reuse ... resulting in a simpler proof
path." An agent about to prove something searches the descriptions first; if the lemma exists it
reuses it instead of re-deriving it. Without the descriptions, agents cannot find each other's work
and the library grows redundant branches.

Write the description for a *searcher*, not for a reader who already has the statement:

- Bad: "Betti number theorem."
- Good: "The third Betti number of the product of a K3 surface with a 2-torus is 44, derived from
  the Künneth formula applied to the Betti vectors (1,0,22,0,1) and (1,2,1)."

### 2.4 A statement comparator

The FLT proof was checked two ways: Lean verified the proof, **and a comparator confirmed that the
theorem's statement matches Mathlib's own statement of FLT.** The second check is the one that
catches the failure mode Lean cannot: a green build of the wrong theorem.

This is the automated form of the statement-faithfulness audit in `lean4-formalization` §2. Build it
as a per-claim gate:

| Claim's Lean statement | Reference statement | Verdict |
|---|---|---|
| your `theorem` | the Mathlib theorem it should match, or the paper's LaTeX proposition | `MATCH` / `WEAKER` / `MISMATCHED` / `NO_REFERENCE` |

Where Mathlib has the concept, compare against Mathlib and say so. Where it does not — most of this
project — compare against the LaTeX proposition verbatim and record the diff. `NO_REFERENCE` is an
honest verdict, and it is the correct one for a genuinely new statement; it just means the claim
rests on the audit, not on the comparator.

## 3. Human input: priorities, not proofs

Mathematical input from the human in the FLT run was limited to occasional high-level scheduling —
the two quoted examples are *"Jacobian as a scheme sounds high priority"* and *"push [the] Mazur
[theorem] to be done soon."* That is the interface to aim for: the operator sets priorities on the
DAG; the agents choose tactics.

Do not accept "the agent asked me how to prove it" as normal operation. If that happens, the node
is under-specified — its statement or its dependencies are wrong, and the fix belongs in the DAG.

## 4. Applying this to `SocrateAI-Lean-Lib`

The Q1 goal (G1.1) is replacing `ReferenceTheorems.lean`'s 174 numeral identities with real
statements. Do it DAG-first:

1. **Seed the DAG from the claim ledger**, not from the bibliography. Every node must trace to a
   `claim_id` in `outputs/formal_manifest.json` or to a proposition in a `.tex` source. A node with
   no paper claim behind it is out of scope — that is exactly how 174 useless theorems appeared.
2. **Write statements before proofs, for the whole layer.** Get the statement layer typechecking
   with `sorry` bodies first. A `sorry` with an `-- OPEN:` comment is honest and is the unit of
   remaining work; it is also what makes the DAG's `blocked` status meaningful.
3. **Run the comparator on the statement layer** before any proof effort. Proving a mismatched
   statement is the most expensive possible mistake.
4. **Then parallelise proofs** across leaf-first nodes, claiming as you go.

The existing repo already has the seed of this: `LeanScratchDB/BlueprintSkeleton.lean` and
`SocrateAI.Generated.BlueprintSkeleton`. Build the DAG there rather than starting a new mechanism.

## 5. What this does not buy you

- It does not make a false statement true. The comparator is the guard; do not skip it because the
  DAG looks tidy.
- It does not remove the axiom audit. `#print axioms` on every headline theorem still applies —
  the FLT proof's headline property was that it used *only* Lean's three standard axioms.
- It does not license "13 million lines" as a goal. The FLT write-up itself notes the proof is
  "likely much longer than it needs to be" and over 5x the size of Mathlib, which is concise and
  well-reviewed. Line count is a cost, not an achievement.
- It does not replace the human-readable exposition. The FLT write-up is explicit: a formalized
  proof should not replace a human-understandable write-up.

## 6. Run-1 instantiation (2026-09-06) — the DAG is now real

The architecture above is no longer aspirational. Concrete locations:

| Piece | Where |
|---|---|
| The DAG | `SocrateAI-Lean-Lib/dag/theorems.jsonl` (JSONL, `#` comments allowed) |
| Validator | `SocrateAI-Lean-Lib/dag/check_dag.py` — acyclicity, `proved ⟹ lean_name` exists in `Lean/`, `proved ⟹ all deps proved` (Mathesis-ledger soundness), physics nodes require `baseline` + `falsifier`; prints the claimable **frontier** |
| NL layer | `statement_nl` per node + `dag/PROOF-PATH.md` (classical step ↔ Lean name table, per the FLT repo's convention) |
| Axiom gate | `Lean/SocrateAI/FinalCheck.lean` — see below |
| Negative control | `scratch/GuardNegativeControl.lean` — must fail; verified failing 2026-09-06 |

**Agent protocol**: run `python3 dag/check_dag.py`; pick a frontier node; set `status: claimed`;
prove; set `status: proved` + `lean_name` + add a FinalCheck guard; re-run the validator. Never
work a node whose deps are not all proved.

### The FLT repo's actual layout (fetched from `anthropics/fermats-last-theorem`)

Worth copying precisely: `Theorems/` (statements) vs `P2M/Sol/` (proofs, importing statements);
`Definitions/`; `PROOF-PATH.md` mapping the classical argument (Frey → Serre → Ribet → Wiles →
Taylor–Wiles) to Lean names; `ATTRIBUTION.md` for upstream material; **two independent verifiers**
(`verification/comparator/` with a `Challenge.lean` restating the theorem in pure Mathlib terms and
checking statement identity + axiom set + full kernel replay; `verification/nanoda/`, an independent
Rust kernel that checked 1,052,234 declarations); and `FinalCheck.lean` as the default build target.

### The `#guard_msgs` axiom gate — adopt everywhere

```lean
/-- info: 'Foo.bar' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in #print axioms Foo.bar
```

This makes the axiom footprint **part of compilation**: a drifted footprint fails the build.
It mechanically closes the failure Mathesis LL-2 records (a declared footprint that went stale one
edit after it was written). Every headline theorem gets a guard in `FinalCheck.lean`; widening a
footprint forces an explicit edit to that file, which is exactly the review point you want.

### Extending nodes to physics (`kind: "physics"`)

A physics node's `depends_on` points at the math theorems that support it, and it must carry
`baseline` and `falsifier` (validator-enforced). Its evidence artifact is not a Lean proof but a
**certificate** in the sense of `SocrateAI-Mathesis/schemas/certificate.schema.json`: a claim with
`replay_cmd` (one command that re-decides it, exit 0/nonzero), `inputs_sha256`, and
`negative_controls` demonstrated to fail. `SocrateAI-Scientific-Measure` is the working example of
that layer (exact-arithmetic harnesses + adversarial-repair FINDINGS). The seam is explicit: math
nodes end at the kernel; physics nodes end at a replayable certificate + a falsifier; a physics
node may never be `proved`, only `checked` — if you need that status, add it to the validator
first, with a check.

### Tier-letter discipline (Stream 0)

When labelling nodes or claims, literature support is **L**, never B —
`SocrateAI-Mathesis/docs/TIER_CALCULUS.md` documents two sibling streams using B for incompatible
things (program-checked vs peer-reviewed). This programme's ladder: A1 (≈ Mathesis A, kernel),
A2 (≈ Mathesis B, program-checked), L, C, D, E.

## 7. Gate zero — prior art decides whether the paper exists *(run-2 addition)*

Run 1 wrote a paper, then discovered the priority claim was refuted by a repository its own
bibliography cited. Run 3 ran the check **first**, and it changed the plan. Make this the first
action of topic selection, before a single Lean line:

1. **Mathlib at the pinned commit** — `grep -ril <Concept> $MATHLIB/Mathlib`. Absence here is the
   gap that justifies upstreaming; it is *not* evidence of novelty in Lean.
2. **Every Lean development in the intended bibliography** — repo-scoped code search. This is the
   step run 1 skipped, and it is where the refutation was.
3. **GitHub-wide** — `gh api "search/code?q=<Concept>+language:lean"`. Note that repo-scoped and
   global counts disagree (the global index is incomplete), so a global 0 is evidence, not proof.

Record corpus and date. Name what you did **not** check — Lean Zulip, open mathlib4 PRs, other proof
assistants — as unchecked rather than implying coverage.

The output is a routing decision, not a paragraph:

| Finding | Route |
|---|---|
| Covered by a cited Lean development | **Not a paper.** Mathlib PR content, or drop. |
| Absent from Mathlib, absent from Lean generally | Paper + Mathlib PR. |
| Absent from Mathlib, present as proof-internal machinery elsewhere | Paper *only* if the packaging difference is real and stated as methodology, never as priority. |

Worked example from run 3 selection: `ALQ-01` (Atkin–Lehner family) routed to **Mathlib PR only**,
because `atkinLehnerLin` in the FLT artifact already ships a ℂ-linear operator for the whole family.
`ETA-01` (Ligozat's criterion) routed to **paper**: Mathlib ships `DedekindEta.lean` but has zero
`EtaQuotient`/`Ligozat` occurrences, and the FLT artifact's `Ligozat*` hits are namespace labels on
modular-unit machinery, not the modularity criterion.

## 8. Inherited blockers decay *(run-4 addition)*

An agent handed a "known blocker" re-verifies it before building on it — with case-insensitive
search and every plausible spelling. One inherited blocker in run 3 was refuted within the same run
(`orderAt` vs `analyticOrderAt`, LL-20), turning an assumed obstruction into a proved theorem.
Retracting a blocker is a result; report it as loudly as confirming one. Conversely, an obstruction
that survives re-verification is a deliverable: keep the node `blocked` with `lean_name: null` —
the absence of a declaration *is* the content (LL-21).

## 9. Obstruction-removal runs *(run-5 preparation)*

When a run exists to remove an obstruction a previous paper named, **the prior paper's "what would
remove it" section is the specification**. The comparator's reference statements are the promises
made there, verbatim — item (1), item (2), item (3) — and the run's success criterion is
mechanical: the DAG node that was `open`/`blocked` behind the obstruction (here `ETA-01`) flips to
`proved` with a resolving `lean_name`. Scope discipline follows: anything not needed to keep those
exact promises (the Atkin–Lehner family, half-integer-weight machinery, sharper error terms) is a
new proposal for a later run, not this one. The paper that results states plainly that it closes
its predecessor's obstruction, cites the predecessor's concept DOI, and names the *next*
obstruction if one is exposed — that arc (name it → remove it → name the next) is the programme's
acceptance strategy in miniature.
