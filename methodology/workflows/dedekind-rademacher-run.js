export const meta = {
  name: 'dedekind-rademacher-run',
  description: 'F4: Dedekind sums + reciprocity, Rademacher Phi as the period of E2, the eta multiplier, then general-N Ligozat — removing the named obstruction published in the eta-quotient preprint. Serial lake builds (LL-12); statement comparator before proving (LL-1); the prior paper\'s "What would remove it" section is the specification.',
  whenToUse: 'Run 4 of the SocrateAI programme, after the operator confirms launch. Do not start without a fresh gate-zero pass.',
  phases: [
    { title: 'GateZero',   detail: 'T2/opus high: prior art re-check (Mathlib, GitHub-wide, AFP as guide-not-rival). Can abort.' },
    { title: 'Blueprint',  detail: 'T4/fable max: choose the reciprocity proof route and the Phi construction; emit the DAG plan' },
    { title: 'Statements', detail: 'T2/opus high: Lean statement layer with sorry, typechecking (one serialized build)' },
    { title: 'Compare',    detail: 'T2/opus high: comparator vs Apostol\'s exact statements and the preprint\'s obstruction section' },
    { title: 'Prove',      detail: 'T2/opus high: STRICTLY SERIAL, leaf-first, decide-pin guards alongside' },
    { title: 'Guard',      detail: 'T0/haiku: build, whole-library axiom scan, guards, negative controls, DAG' },
    { title: 'Review',     detail: 'T2/opus high x2: correctness and novelty/reproducibility, read-only' },
    { title: 'Verdict',    detail: 'T3/opus xhigh: PAPER+PR / PR_ONLY / PARTIAL / REWORK, with honest framing' },
  ],
}

const LEAN = '/home/xavkal/xdev/SocrateAI-Lean-Lib'
const REPO = '/home/xavkal/xdev/SocrateAIShared/foundationpaper2'
const ML   = '/home/xavkal/xdev/SocrateAI-Scientific-Measure/lean/.lake/packages/mathlib/Mathlib'

const GROUND = `
VERIFIED GROUNDING (2026-09-07, commands run, outputs read — extend the same way, never from memory):

  THE SPECIFICATION is section "What would remove it" of the published eta-quotient preprint
  (concept DOI 10.5281/zenodo.22648098), in ascending strength:
    (1) the Dedekind sum s(d,c) and reciprocity;
    (2) Rademacher's Phi : SL(2,Z) -> Z with Phi(AB) = Phi(A)+Phi(B) - 3*sign(cA*cB*cAB)
        [Apostol's Phi, WITHOUT the -3*sign(c(a+d)) term — that term belongs to the Rademacher
         SYMBOL Psi, the conjugation-invariant homogenization; conflating them was LL-22 error 1];
    (3) the Petersson–Rademacher multiplier
        eta(gamma z) = exp(pi*i*((a+d)/(12c) - s(d,c) - 1/4)) * csqrt(cz+d) * eta(z),  c > 0.
  With (3), general-N Ligozat is "moderate bookkeeping" on top of run 3's Steps 1–7 (its own
  deep-think verdict). Closing node ETA-01 (status "open", lean_name null) is the success criterion.

  MATHLIB HAS (use, do not reprove):
    DedekindEta.lean: eta as q-product, eta_ne_zero, differentiability, logDeriv_eta_eq_E2
    Discriminant.lean: eta_comp_eq_csqrt_I_inv — eta(-1/z) = (sqrt I)^{-1} * sqrt z * eta z,
      THE csqrt IDIOM: the S-transform is stated with Complex.sqrt and NO weight-1/2 slash.
      Follow it. Do not introduce half-integer-weight slash machinery — out of scope (F5's problem).
    EisensteinSeries/E2/{Defs,Transform,Summable,MDifferentiable}.lean — the E2 transformation law:
      the analytic half of Phi ALREADY EXISTS. Phi should be CONSTRUCTED as the period of E2 so the
      cocycle law is inherited structurally; the closed formula is then a THEOREM linking to s(d,c).
    Int.fract and rational/finset machinery for the sawtooth ((x)).
  MATHLIB LACKS (verified zero, grep -ri): DedekindSum, dedekindSum, RademacherPhi, etaMultiplier.
  ISABELLE AFP HAS both Dedekind_Sums (reciprocity; Eberl–Bordg–Paulson–Li) and Rademacher_Series.
    They are a mechanizability proof and a structural guide — cite them, never translate blindly.

  OUR ARTIFACT (run 3, reusable): EtaQuotient*.lean — Ligozat congruences, the transformation
  architecture at N in {1,2,3,4,5,7,13}, multiplier-at-elliptic-fixed-point technique (F3.2-A9),
  the logDeriv-pins-a-constant pattern, 391 axiom guards, negative controls in verification/.

  WHY THIS RUN AND NOT LEVEL-12: N=12 has genus 0, six cusps, no elliptic elements, free rank 5
  (2g+s-1). The T,V route pins rank <= 2; no elliptic pins exist. Level 12 is PROVABLY outside the
  small-level method and its own draft invokes Dedekind sums. This run is its prerequisite.
`

const RULES = `
HARD CONSTRAINTS — violating any is a failed run.
BUILD SAFETY (LL-12): never two lake builds; check "pgrep -x lake" (NEVER pgrep -f). Build from
${LEAN} only, with --packages=local-packages.json if present. The Mathlib pool is a build input.
Never "lake clean". No worktrees.
EVIDENCE: every claim about any corpus is a command plus output (grep -ri; LL-20). Absence claims
name what was searched. Counts in characters, python len(str) (LL-17). Whole-library scans take no
"| head" (LL-23: a truncated listing published a wrong axiom count).
HONESTY: A1/A2/L/C/D/E labels; a sorry with -- OPEN: is the unit of remaining work; a proved DAG
node names a resolving lean_name AND gets a FinalCheck guard (LL-2/LL-7). Statement weakened to
become provable => say so loudly (LL-1). Obstruction precisely named is a deliverable (LL-21).
SIGN DISCIPLINE (this run's specific risk): reciprocity and Phi are sign-and-floor case analyses.
Every sign-heavy identity gets decide-pins — explicit numeric instances proved by decide/norm_num
as guards, BEFORE the general proof, so a wrong general statement fails fast. State c > 0 first;
derive c < 0 via -I; treat c = 0 separately.
${GROUND}
Lean: ${LEAN}   Repo: ${REPO}   Mathlib: ${ML}
`

const GATE = { type:'object', additionalProperties:false,
  required:['verdict','evidence','not_checked'],
  properties:{ verdict:{type:'string',enum:['PROCEED','ABORT']},
    evidence:{type:'string'}, closest_prior:{type:'string'},
    not_checked:{type:'array',items:{type:'string'}} } }

const PLAN = { type:'object', additionalProperties:false,
  required:['reciprocity_route','phi_construction','nodes'],
  properties:{
    reciprocity_route:{type:'string',description:'the chosen proof of reciprocity, steps and why'},
    phi_construction:{type:'string',description:'period-of-E2 vs closed-form-first, and the exact Mathlib lemmas'},
    multiplier_route:{type:'string',description:'how eta(gamma z)=eps*csqrt(cz+d)*eta(z) gets pinned'},
    ligozat_completion:{type:'string',description:'how ETA-01 closes on top of run 3'},
    risks:{type:'array',items:{type:'string'}},
    nodes:{type:'array',items:{type:'object',additionalProperties:false,
      required:['id','statement','statement_nl','depends_on','difficulty'],
      properties:{ id:{type:'string'}, statement:{type:'string'}, statement_nl:{type:'string'},
        depends_on:{type:'array',items:{type:'string'}},
        difficulty:{type:'string',enum:['mechanical','moderate','hard','research']},
        built_from:{type:'array',items:{type:'string'}} } } } } }

const CMP = { type:'object', additionalProperties:false, required:['node_id','verdict','diff'],
  properties:{ node_id:{type:'string'},
    verdict:{type:'string',enum:['MATCH','WEAKER','MISMATCHED','NO_REFERENCE']},
    reference:{type:'string'}, diff:{type:'string'} } }

const PROVED = { type:'object', additionalProperties:false, required:['node_id','status'],
  properties:{ node_id:{type:'string'},
    status:{type:'string',enum:['proved','blocked','partial']},
    lean_name:{type:'string'}, guard_added:{type:'boolean'},
    decide_pins:{type:'integer'}, build_result:{type:'string'}, blocker:{type:'string'} } }

const REV = { type:'object', additionalProperties:false, required:['lens','findings'],
  properties:{ lens:{type:'string'}, findings:{type:'array',items:{
    type:'object',additionalProperties:false, required:['severity','claim','evidence'],
    properties:{ severity:{type:'string',enum:['fatal','major','minor']},
      claim:{type:'string'}, evidence:{type:'string'}, fix:{type:'string'} } } } } }

// ─────────────────────────────────────────────────────────────── GateZero
phase('GateZero')
const gz = await agent(
  `${RULES}\nGATE ZERO for Dedekind sums / Rademacher Phi in Lean. Re-run, do not inherit (LL-20):\n` +
  `  grep -ri each of DedekindSum, dedekindSum, RademacherPhi, rademacher, sawtooth over ${ML};\n` +
  `  gh api code search repo-wide and language:lean for the same, case-insensitively, fetching and\n` +
  `  READING any nonzero hit (a namespace label is not the theorem — run 3's Ligozat lesson);\n` +
  `  check open mathlib4 PRs via gh api "search/issues?q=repo:leanprover-community/mathlib4+is:pr+is:open+Dedekind+sum".\n` +
  `Name what you cannot check (Zulip). ABORT if a Lean formalization of reciprocity or Phi exists.`,
  { label:'gate0:dedekind', phase:'GateZero', model:'opus', effort:'high', schema:GATE })
if (!gz || gz.verdict !== 'PROCEED')
  return { aborted_at:'GateZero', evidence: gz && gz.evidence, note:'gate zero working, not a failure' }
log(`Gate zero: PROCEED. Unchecked: ${(gz.not_checked||[]).join(', ')}`)

// ─────────────────────────────────────────────────────────────── Blueprint (T4)
phase('Blueprint')
const plan = await agent(
  `${RULES}\nDEEP THINK — the route decisions for this run. Take the time this needs.\n\n` +
  `DECISION 1 — reciprocity. Candidate routes: (a) Eisenstein/lattice-point counting (finite sums\n` +
  `only, no analysis — likely best for Lean); (b) cotangent sums (needs trig identities);\n` +
  `(c) via the eta functional equation (CIRCULAR here — we build eta's equation FROM this).\n` +
  `Choose, and write the skeleton at the level of finite-sum identities over Finset.range.\n\n` +
  `DECISION 2 — Phi. Construct as the period of E2 (cocycle law inherited from the group action,\n` +
  `closed formula (a+d)/c - 12*sign(c)*s(d,|c|) proved AFTER, as the link to Dedekind sums), or\n` +
  `define by the closed formula and prove the cocycle law by case analysis (famously fiddly)?\n` +
  `Justify against the E2 machinery that actually exists in ${ML}/NumberTheory/ModularForms/EisensteinSeries/E2/.\n\n` +
  `DECISION 3 — the multiplier. The logDeriv route: both sides of\n` +
  `eta(gamma z) = eps(gamma)*csqrt(cz+d)*eta(z) have equal logDeriv (logDeriv_eta_eq_E2 + the E2\n` +
  `transform), so their ratio is constant; how is the constant pinned? (Generator induction? Value\n` +
  `at a fixed point, as run 3's F3.2-A9 did? Continuity along the S,T word?) Follow the csqrt idiom\n` +
  `of Discriminant.lean; NO weight-1/2 slash.\n\n` +
  `DECISION 4 — Ligozat completion: the exact statement that closes ETA-01, over run 3's Steps 1–7.\n\n` +
  `Then emit the full DAG node list, leaf-first, with honest difficulty and the exact Mathlib and\n` +
  `run-3 lemmas each node is built FROM (verified by grep, each). Do not produce a route you would\n` +
  `not defend to a hostile expert.`,
  { label:'blueprint', phase:'Blueprint', model:'fable', effort:'max', schema:PLAN })
if (!plan || !(plan.nodes||[]).length) return { aborted_at:'Blueprint', plan }
log(`Blueprint: ${plan.nodes.length} nodes; reciprocity via ${String(plan.reciprocity_route).slice(0,80)}`)

// ─────────────────────────────────────────────────────────────── Statements
phase('Statements')
const stmts = await agent(
  `${RULES}\nWrite the STATEMENT LAYER into ${LEAN}/Lean/SocrateAI/NumberTheory/DedekindSum.lean\n` +
  `and RademacherPhi.lean (new files; create the directory), with 'sorry' bodies and -- OPEN:\n` +
  `comments, from:\n${JSON.stringify(plan.nodes,null,1).slice(0,9000)}\n\n` +
  `Add every node to dag/theorems.jsonl (status open, statement_nl for a SEARCHER). One build,\n` +
  `pgrep -x lake first; report the final line verbatim. Do not proceed past a red typecheck.`,
  { label:'statements', phase:'Statements', model:'opus', effort:'high' })

// ─────────────────────────────────────── Compare then Prove — strictly serial
const proofs = []
for (const n of plan.nodes) {
  const cmp = await agent(
    `${RULES}\nSTATEMENT COMPARATOR for ${n.id} — BEFORE any proof effort (LL-1).\n` +
    `Node: ${JSON.stringify(n,null,1)}\n` +
    `Reference: Apostol, Modular Functions and Dirichlet Series, ch. 3 (Thm 3.11 for Phi's closed\n` +
    `form; the reciprocity statement); AND the preprint's "What would remove it" items (1)-(3),\n` +
    `which are the promises this run exists to keep. MATCH / WEAKER / MISMATCHED / NO_REFERENCE.\n` +
    `Quantifiers, sign conventions, and the c=0 / c<0 cases are where this goes wrong.`,
    { label:`compare:${n.id}`, phase:'Compare', model:'opus', effort:'high', schema:CMP })
  if (!cmp || cmp.verdict === 'MISMATCHED') {
    log(`${n.id}: MISMATCHED — not proving`)
    proofs.push({ node_id:n.id, status:'blocked', blocker:`comparator: ${cmp && cmp.diff}` })
    continue
  }
  const r = await agent(
    `${RULES}\nPROVE ${n.id}. You are the only agent building.\n` +
    `Statement: ${n.statement}\nBuilt from: ${JSON.stringify(n.built_from||[])}\n` +
    `Comparator: ${cmp.verdict}${cmp.diff ? ' — '+cmp.diff : ''}\n\n` +
    `FIRST add decide-pins: 6+ explicit numeric instances of the statement proved by decide or\n` +
    `norm_num, as separate guarded lemmas. If a pin fails, the general statement is wrong — stop\n` +
    `and report, do not adjust the pin. Then the general proof. Prefer Mathlib + run-3 lemmas over\n` +
    `new machinery (LL-11). Blocked is honest: leave the sorry with -- OPEN: and report it.\n` +
    `On success: FinalCheck guard, DAG update, final build line verbatim.`,
    { label:`prove:${n.id}`, phase:'Prove', model:'opus', effort:'high', schema:PROVED })
  if (r) { proofs.push(r); log(`  ${n.id}: ${r.status}${r.lean_name ? ' — '+r.lean_name : ''}`) }
}
const done = proofs.filter(p => p.status === 'proved')

// ─────────────────────────────────────────────────────────────── Guard (T0)
phase('Guard')
const guard = await agent(
  `${RULES}\nMECHANICAL PASS on ${LEAN} — numbers with commands, no interpretation:\n` +
  `1. pgrep -x lake, then lake build SocrateAI: final line verbatim.\n` +
  `2. Comment-stripped sorry scan over Lean/SocrateAI/ (python, not grep alone).\n` +
  `3. WHOLE-LIBRARY axiom scan, no head: grep -rnE '^\\s*axiom ' — list every hit; six\n` +
  `   physics_postulate_N in Generated/BlueprintSkeleton.lean are known and allowlisted.\n` +
  `4. Multiline-aware guard-footprint split from FinalCheck.lean (python regex over /-- info: -/).\n` +
  `5. Every file in verification/ must FAIL to compile.\n` +
  `6. python3 dag/check_dag.py verbatim. 7. Char-count (utf-8 len) lines > 100 in new files.`,
  { label:'guard', phase:'Guard', model:'haiku', effort:'low' })

// ─────────────────────────────────────────────────────────────── Review ×2
phase('Review')
const reviews = await parallel([
  () => agent(`${RULES}\nREVIEW: correctness. READ-ONLY. Proofs: ${JSON.stringify(proofs).slice(0,7000)}\n` +
    `Guard: ${String(guard).slice(0,2500)}\nRead the new files. For each theorem state in English\n` +
    `what it PROVES vs what the node claimed. Check every sign convention against Apostol ch. 3 —\n` +
    `recompute at least four Phi values and four Dedekind sums by hand/python and compare against\n` +
    `the decide-pins. A green build of the wrong sign convention is this run's LL-1.`,
    { label:'review:correctness', phase:'Review', model:'opus', effort:'high', schema:REV }),
  () => agent(`${RULES}\nREVIEW: novelty + reproducibility. READ-ONLY. Independently re-run the\n` +
    `prior-art searches (do not trust GateZero). Then: does the artifact still build from the\n` +
    `committed portable config? Do the run-3 guards still pass? Did anything regress?`,
    { label:'review:novelty', phase:'Review', model:'opus', effort:'high', schema:REV }),
])

// ─────────────────────────────────────────────────────────────── Verdict (T3)
phase('Verdict')
const verdict = await agent(
  `${RULES}\nVERDICT. Proved ${done.length}/${plan.nodes.length}.\n` +
  `Plan: ${JSON.stringify({r:plan.reciprocity_route,p:plan.phi_construction}).slice(0,2000)}\n` +
  `Proofs: ${JSON.stringify(proofs).slice(0,5000)}\nGuard: ${String(guard).slice(0,2500)}\n` +
  `Reviews: ${JSON.stringify(reviews.filter(Boolean),null,1).slice(0,9000)}\n\n` +
  `Rule on: PAPER_AND_PR (reciprocity + Phi + multiplier landed; ETA-01 closes or nearly) /\n` +
  `PR_ONLY (code is upstream-worthy, paper adds nothing yet) / PARTIAL (e.g. reciprocity landed,\n` +
  `Phi did not — say exactly what ships alone) / REWORK (fatal findings named).\n` +
  `Then: what is A1, what remains, whether ETA-01 flips, the next obstruction if any (half-integral\n` +
  `weight for level 12 is the expected one — name it precisely if it survives), and the framing for\n` +
  `README/dataset card/DOI description. The paper, if any, ships EN and FR together, and NOTHING\n` +
  `publishes without a green scripts/paper_gate.py (LL-23).`,
  { label:'verdict', phase:'Verdict', model:'opus', effort:'xhigh' })

return { gate_zero: gz.evidence && gz.evidence.slice(0,300), nodes: plan.nodes.length,
  proved: done.length, blocked: proofs.filter(p=>p.status!=='proved').map(p=>({id:p.node_id,why:p.blocker})),
  guard, reviews: reviews.filter(Boolean), verdict }
