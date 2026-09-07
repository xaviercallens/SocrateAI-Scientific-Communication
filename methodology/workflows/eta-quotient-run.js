export const meta = {
  name: 'eta-quotient-run',
  description: 'F3.1 (eta-quotients: definition, weight, order at cusps) and F3.2 (Ligozat criterion) in Lean 4 on Mathlib. Serializes every lake build — concurrent builds on one build directory destroyed the Mathlib pool in run 1 (LL-12). F3.1 is designed to ship even if F3.2 is obstructed.',
  whenToUse: 'Run 3 of the SocrateAI programme, after gate zero cleared ETA-01 as a paper.',
  phases: [
    { title: 'Scout',    detail: 'T2/opus high: inventory the exact Mathlib eta API and design the F3.1 statement layer' },
    { title: 'Strategy', detail: 'T4/fable max: Ligozat WITHOUT Dedekind sums — find the route or name the obstruction' },
    { title: 'Statements', detail: 'T2/opus high: Lean statement layer with sorry, typechecking (one serialized build)' },
    { title: 'Prove',    detail: 'T2/opus high: one node at a time, STRICTLY SERIAL — never two lake builds at once' },
    { title: 'Guard',    detail: 'T0/haiku: build, guards, negative control, DAG validator, character counts' },
    { title: 'Review',   detail: 'T2/opus high x2: correctness and novelty/reproducibility, read-only' },
    { title: 'Verdict',  detail: 'T3/opus xhigh: what ships — F3.1 alone, both, or rework' },
  ],
}

const LEAN = '/home/xavkal/xdev/SocrateAI-Lean-Lib'
const REPO = '/home/xavkal/xdev/SocrateAIShared/foundationpaper2'
const ML   = '/home/xavkal/xdev/SocrateAI-Scientific-Measure/lean/.lake/packages/mathlib/Mathlib'

// Grounding established before launch — agents must NOT re-derive or contradict this without
// re-running the command and showing the output.
const GROUND = `
VERIFIED MATHLIB INVENTORY (checked 2026-09-06 at commit 905b9581, commands run, output read):

  Mathlib/NumberTheory/ModularForms/DedekindEta.lean — 20 declarations:
    eta z = 𝕢 24 z * ∏' n, (1 - eta_q n z)      -- the q-product definition
    eta_q_eq_pow, one_sub_eta_q_ne_zero, eta_ne_zero, eta_tprod_ne_zero
    differentiableAt_eta_of_mem_upperHalfPlaneSet
    logDeriv_eta_eq_E2 : logDeriv eta z = (π * I / 12) * E2 z

  Mathlib/NumberTheory/ModularForms/Discriminant.lean — HAS THE S-TRANSFORMATION:
    eta_comp_eq_csqrt_I_inv :
      upperHalfPlaneSet.EqOn (η ∘ (-1 / ·)) ((sqrt I)⁻¹ • (sqrt * η))
      i.e.  η(-1/z) = (√I)⁻¹ · √z · η(z)                     <-- USE THIS, do not reprove it
    eta_comp_eqOn_const_mul_csqrt_eta, csqrt_pow_24_eq, csqrt_I_pow_24
    discriminant_S_invariant, discriminant_T_invariant   (for Δ = η^24, weight 12)

  ABSENT FROM MATHLIB (greps returned zero files):
    EtaQuotient : 0      Ligozat : 0      Fricke : 0      AtkinLehner : 0
    DedekindSum : 0      dedekindSum : 0      etaMultiplier : 0
    There is NO eta T-transformation stated on its own (η(z+1) = ζ₂₄ η(z)); Δ's T-invariance
    exists but is the 24th power. The eta T-transform should follow from the q-product.

  THE CENTRAL DIFFICULTY, stated honestly: the classical proof of Ligozat's criterion runs through
  the eta multiplier system for arbitrary γ ∈ Γ₀(N), which is expressed with DEDEKIND SUMS.
  Mathlib has none. So F3.2 either finds a route that avoids the general multiplier, or it is
  obstructed. An obstruction, precisely named, is a RESULT and an acceptable outcome.

  OUR ARTIFACT (run 2, proved, reusable):
    SocrateAI.ModularForms.{FrickeInvolution,FrickeSlash,FrickeModular,FrickeComposite}
    frickeW, frickeConj, frickeW_normalizes_Gamma0, frickeSlashOperator, frickeModularOperator,
    frickeW_sq_slash : (f∣W)∣W = (-1)^k N^(k-2) f
`

const RULES = `
HARD CONSTRAINTS — violating any of these is a failed run, not a stylistic issue.

BUILD SAFETY (LL-12 — this cost 4.7GB of Mathlib pool in run 1):
- NEVER start a lake build while another is running. Check with "pgrep -x lake".
  NEVER use "pgrep -f 'lake build'" — it matches the waiting shell's OWN command line and deadlocks.
- The Mathlib package pool at ${ML} is a BUILD INPUT, not a reclaimable cache. Never delete from
  .lake. Never run "lake clean". If a build fails, read the error; do not reach for a clean.
- Build from ${LEAN} only. Do not create worktrees — they would each need their own .lake.

EVIDENCE (the standing instruction: use the references, never LLM memory):
- Every claim about what Mathlib contains is a command you ran plus its output. If you did not run
  it, you do not know it. The inventory above was verified; extend it the same way.
- A green build can prove the WRONG theorem (LL-1). State what you proved in English and check it
  against what was asked before declaring done.
- Count CHARACTERS not bytes (LL-17): python len(str) with encoding='utf-8'. awk/wc -c count bytes
  and will over-report Lean line lengths by 10-20%.

HONESTY:
- Label claims A1 formal / A2 program-checked / L literature / C derived / D conjecture / E unsupported.
- "This is obstructed, and here is the obstruction" is a valuable result. A plausible-looking proof
  that a referee breaks is not. Prefer the honest negative.
- Never mark a DAG node proved without a lean_name that resolves AND an axiom guard (LL-2, LL-7).
- No 'sorry' may be described as proved. An -- OPEN: comment on a sorry is the unit of remaining work.

${GROUND}
Lean repo: ${LEAN}   Papers: ${REPO}
`

const SCOUT = {
  type: 'object', additionalProperties: false,
  required: ['f31_nodes', 'mathlib_lemmas', 'feasibility'],
  properties: {
    mathlib_lemmas: { type: 'array', items: { type: 'string' },
      description: 'exact Mathlib names F3.1 should be built from, each verified to exist' },
    f31_nodes: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'statement', 'statement_nl', 'depends_on', 'difficulty'],
      properties: {
        id: { type: 'string' }, statement: { type: 'string' },
        statement_nl: { type: 'string' },
        depends_on: { type: 'array', items: { type: 'string' } },
        difficulty: { type: 'string', enum: ['mechanical', 'moderate', 'hard'] },
        built_from: { type: 'array', items: { type: 'string' } },
      } } },
    feasibility: { type: 'string', description: 'what F3.1 can honestly claim given what exists' },
    surprises: { type: 'string', description: 'anything found that contradicts the inventory above' },
  },
}

const STRATEGY = {
  type: 'object', additionalProperties: false,
  required: ['outcome', 'route', 'obstruction', 'f32_nodes'],
  properties: {
    outcome: { type: 'string', enum: ['ROUTE_FOUND', 'PARTIAL', 'OBSTRUCTED'] },
    route: { type: 'string', description: 'the actual mathematics: what to prove, in what order' },
    obstruction: { type: 'string', description: 'if OBSTRUCTED/PARTIAL, precisely what blocks it' },
    avoids_dedekind_sums: { type: 'boolean' },
    f32_nodes: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'statement', 'statement_nl', 'difficulty'],
      properties: {
        id: { type: 'string' }, statement: { type: 'string' },
        statement_nl: { type: 'string' },
        difficulty: { type: 'string', enum: ['mechanical', 'moderate', 'hard', 'research'] },
        depends_on: { type: 'array', items: { type: 'string' } },
      } } },
    scope_if_obstructed: { type: 'string', description: 'the strongest TRUE statement still reachable' },
  },
}

const PROVED = {
  type: 'object', additionalProperties: false, required: ['node_id', 'status'],
  properties: {
    node_id: { type: 'string' },
    status: { type: 'string', enum: ['proved', 'blocked', 'partial'] },
    lean_name: { type: 'string' },
    axioms: { type: 'array', items: { type: 'string' } },
    guard_added: { type: 'boolean' },
    build_result: { type: 'string', description: 'the actual final line of lake build' },
    blocker: { type: 'string' },
  },
}

const REVIEW = {
  type: 'object', additionalProperties: false, required: ['lens', 'findings'],
  properties: {
    lens: { type: 'string' },
    findings: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['severity', 'claim', 'evidence'],
      properties: {
        severity: { type: 'string', enum: ['fatal', 'major', 'minor'] },
        claim: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
      } } },
  },
}

// ──────────────────────────────────────────────────────────── Scout (T2)
phase('Scout')
log('F3.1 design — inventorying the exact Mathlib eta API')

const scout = await agent(
  `${RULES}\nF3.1 SCOUT. Design the statement layer for eta-quotients.\n\n` +
  `Read ${ML}/NumberTheory/ModularForms/DedekindEta.lean and Discriminant.lean IN FULL. Confirm or\n` +
  `correct the inventory above by running the greps yourself — if I got something wrong, say so.\n\n` +
  `Then design F3.1 as Lean statements:\n` +
  `  1. The eta T-transformation on its own: η(z+1) = exp(2πi/24)·η(z). Mathlib has this only as\n` +
  `     Δ's T-invariance (the 24th power). Derive it from the q-product 𝕢 24 definition.\n` +
  `  2. The eta-quotient f(τ) = ∏_{δ|N} η(δτ)^{r_δ} as a Lean definition over a finite index.\n` +
  `  3. Its weight k = (1/2)·Σ r_δ.\n` +
  `  4. The order at a cusp c: ord_c(f) = (N/24)·Σ_δ gcd(δ,c)²·r_δ / (gcd(c,N/c)·c·δ).\n` +
  `     State it as a definition plus its basic arithmetic properties. This is the computable part\n` +
  `     and it is where F3.1's value is.\n\n` +
  `For EVERY node give the exact Mathlib lemmas it is built FROM, verified to exist by grep. Mark\n` +
  `difficulty honestly. Do not write proofs yet — statements and the build plan only.`,
  { label: 'scout:F3.1', phase: 'Scout', model: 'opus', effort: 'high', schema: SCOUT }
)

if (!scout || !(scout.f31_nodes || []).length) {
  return { aborted_at: 'Scout', error: 'no F3.1 statement layer produced', scout }
}
log(`F3.1: ${scout.f31_nodes.length} nodes designed`)
if (scout.surprises) log(`Inventory correction: ${String(scout.surprises).slice(0, 200)}`)

// ──────────────────────────────────────────────────────── Strategy (T4 max)
phase('Strategy')
log('F3.2 — deep think: Ligozat without Dedekind sums')

const strategy = await agent(
  `${RULES}\nDEEP THINK — F3.2, Ligozat's criterion. Take the time this needs.\n\n` +
  `THE QUESTION: Ligozat's criterion says f(τ) = ∏_{δ|N} η(δτ)^{r_δ} is a modular form on Γ₀(N)\n` +
  `of weight k = (1/2)Σr_δ when (i) Σ δ·r_δ ≡ 0 mod 24, (ii) Σ (N/δ)·r_δ ≡ 0 mod 24, and (iii) the\n` +
  `order at every cusp is ≥ 0.\n\n` +
  `The classical proof uses the eta multiplier system for arbitrary γ ∈ Γ₀(N), written with DEDEKIND\n` +
  `SUMS. Mathlib has no Dedekind sums — I verified this (grep returned 0 files). So:\n\n` +
  `  1. State precisely what must be true for the criterion to hold, with quantifiers.\n` +
  `  2. Find a route that AVOIDS the general multiplier system. Candidates worth real thought:\n` +
  `     - Γ₀(N) generation: can the needed transformations be reduced to S, T and the Fricke\n` +
  `       involution W_N, all of which we or Mathlib already have? We proved W_N normalizes Γ₀(N)\n` +
  `       and have frickeW_sq_slash.\n` +
  `     - The 24th power trick: f^24 is a quotient of Δ's, whose modularity Mathlib HAS\n` +
  `       (discriminant_S_invariant, discriminant_T_invariant). Does the mod-24 congruence let one\n` +
  `       descend from f^24 to f, and what exactly does the descent cost (a character? a sign?)\n` +
  `     - Restricting to a subfamily where the multiplier is trivial or computable directly.\n` +
  `  3. If no route exists, NAME THE OBSTRUCTION precisely — which step genuinely requires Dedekind\n` +
  `     sums, and what the minimal Mathlib addition would be. That is a publishable result and it\n` +
  `     tells us what to contribute upstream.\n` +
  `  4. Either way: give the strongest TRUE statement reachable without Dedekind sums. Often the\n` +
  `     honest theorem is weaker, more specific, and still worth having.\n\n` +
  `Break F3.2 into Lean nodes with honest difficulty. Do not produce a route you would not defend\n` +
  `to a hostile expert. OBSTRUCTED is a respectable and possibly correct outcome here.`,
  { label: 'strategy:F3.2', phase: 'Strategy', model: 'fable', effort: 'max', schema: STRATEGY }
)

log(`F3.2 strategy: ${strategy ? strategy.outcome : 'none'}` +
    (strategy && strategy.avoids_dedekind_sums ? ' (avoids Dedekind sums)' : ''))

// ─────────────────────────────────────────────────────── Statements (T2)
phase('Statements')

const f32nodes = (strategy && strategy.outcome !== 'OBSTRUCTED')
  ? (strategy.f32_nodes || []) : []
const allNodes = [...scout.f31_nodes, ...f32nodes]

const statements = await agent(
  `${RULES}\nWrite the STATEMENT LAYER into ${LEAN}.\n\n` +
  `F3.1 nodes:\n${JSON.stringify(scout.f31_nodes, null, 1).slice(0, 6000)}\n\n` +
  (f32nodes.length
    ? `F3.2 nodes (strategy: ${strategy.outcome}):\n${JSON.stringify(f32nodes, null, 1).slice(0, 5000)}\n\n`
    : `F3.2 is OBSTRUCTED — do NOT write speculative F3.2 statements. Obstruction:\n` +
      `${strategy ? strategy.obstruction : 'unknown'}\n\n`) +
  `Create Lean/SocrateAI/ModularForms/EtaQuotient.lean with these statements and 'sorry' bodies,\n` +
  `each carrying an -- OPEN: comment. Import only what you need. Follow the run-2 module style.\n` +
  `Add every node to dag/theorems.jsonl with status "open" and its statement_nl.\n\n` +
  `Then run ONE build to confirm the statement layer TYPECHECKS with sorries. Check "pgrep -x lake"\n` +
  `first. Report the exact final line of the build. Do not proceed if it does not typecheck —\n` +
  `report the error instead.`,
  { label: 'statements', phase: 'Statements', model: 'opus', effort: 'high' }
)

// ───────────────────────────── Prove — STRICTLY SERIAL (one lake build at a time)
phase('Prove')
log(`Proving ${allNodes.length} nodes serially — concurrent lake builds are forbidden (LL-12)`)

const proofs = []
for (const n of allNodes) {
  const r = await agent(
    `${RULES}\nPROVE node ${n.id}. You are the ONLY agent building right now — do not spawn others.\n\n` +
    `Statement: ${n.statement}\nDescription: ${n.statement_nl}\n` +
    `Difficulty as scoped: ${n.difficulty}\n` +
    `Built from: ${JSON.stringify(n.built_from || n.depends_on || [])}\n` +
    (f32nodes.includes(n) && strategy
      ? `F3.2 route to follow:\n${String(strategy.route).slice(0, 3000)}\n` : '') +
    `\nReplace the sorry with a real proof in Lean/SocrateAI/ModularForms/EtaQuotient.lean.\n` +
    `Prefer existing Mathlib lemmas over new machinery — run 2's hardest-looking step turned out to\n` +
    `be three Mathlib lemmas (LL-11). Use eta_comp_eq_csqrt_I_inv for the S-transformation rather\n` +
    `than reproving it.\n\n` +
    `If genuinely blocked: leave the sorry, write a precise -- OPEN: comment saying what is missing,\n` +
    `and report status "blocked". Do NOT fabricate a proof, and do NOT weaken the statement to make\n` +
    `it provable without saying so loudly.\n\n` +
    `When it compiles: add a '#guard_msgs in #print axioms' guard to FinalCheck.lean, report the\n` +
    `exact footprint, update the node in dag/theorems.jsonl to proved with its lean_name, and\n` +
    `report the final line of lake build verbatim.`,
    { label: `prove:${n.id}`, phase: 'Prove', model: 'opus', effort: 'high', schema: PROVED }
  )
  if (r) {
    proofs.push(r)
    log(`  ${n.id}: ${r.status}${r.lean_name ? ' — ' + r.lean_name : ''}`)
  }
}

const proved = proofs.filter(p => p.status === 'proved')

// ──────────────────────────────────────────────────────────── Guard (T0)
phase('Guard')
const guard = await agent(
  `${RULES}\nMECHANICAL INTEGRITY PASS on ${LEAN}. Report numbers with the command that produced\n` +
  `each. Do not interpret, do not fix anything.\n` +
  `  1. "pgrep -x lake" — confirm nothing is building. Then: lake build SocrateAI.\n` +
  `     Report job count and error count from the final line verbatim.\n` +
  `  2. Real sorries: grep for 'sorry' as a TERM (not in comments/strings) in\n` +
  `     Lean/SocrateAI/ModularForms/. Report the count and the file:line of each.\n` +
  `  3. grep -c '#guard_msgs' Lean/SocrateAI/FinalCheck.lean\n` +
  `  4. Run the negative control in scratch/ — confirm it FAILS. A PASSING negative control means\n` +
  `     the guards are vacuous; report that loudly if so.\n` +
  `  5. python3 dag/check_dag.py — report PASS/FAIL and the frontier verbatim.\n` +
  `  6. Character count (python3, encoding='utf-8', len(str) — NOT awk) of any line over 100 chars\n` +
  `     in the new module.`,
  { label: 'guard', phase: 'Guard', model: 'haiku', effort: 'low' }
)

// ──────────────────────────────────────────── Review — 2 lenses, read-only, parallel
phase('Review')
const reviews = await parallel([
  () => agent(
    `${RULES}\nREVIEW LENS: correctness. READ-ONLY — do not build, do not edit.\n\n` +
    `Proofs reported: ${JSON.stringify(proofs, null, 1).slice(0, 8000)}\n` +
    `Guard output: ${String(guard).slice(0, 3000)}\n\n` +
    `Read Lean/SocrateAI/ModularForms/EtaQuotient.lean. For each theorem, state in English what it\n` +
    `actually proves, and compare that to what the node claimed. Look specifically for:\n` +
    `  - a statement quietly weakened to make it provable (extra hypothesis, special case)\n` +
    `  - a 'proved' node whose lean_name does not resolve\n` +
    `  - the order-at-cusp formula transcribed wrong (check it against Ligozat/Martin as cited)\n` +
    `  - any claimed axiom footprint that the guard output does not corroborate\n` +
    `A green build proving the wrong theorem is the failure mode that cost run 1 (LL-1).`,
    { label: 'review:correctness', phase: 'Review', model: 'opus', effort: 'high', schema: REVIEW }),
  () => agent(
    `${RULES}\nREVIEW LENS: novelty and reproducibility. READ-ONLY — do not build, do not edit.\n\n` +
    `Independently re-run the prior-art check for eta-quotients and Ligozat. Do NOT trust the\n` +
    `earlier gate-zero conclusion; search Mathlib, anthropics/fermats-last-theorem, and GitHub-wide\n` +
    `language:lean yourself and report the commands and counts.\n` +
    `Recall run 1: the FLT repo's Ligozat hits were NAMESPACE LABELS (LigozatUnitEngine) on\n` +
    `modular-unit machinery, not the criterion. Verify that reading or overturn it.\n\n` +
    `Then reproducibility: does lakefile.lean still hard-code absolute paths? Can a third party\n` +
    `build this? State plainly whether the artifact is reproducible, because both run-2 papers had\n` +
    `to concede it was not.`,
    { label: 'review:novelty', phase: 'Review', model: 'opus', effort: 'high', schema: REVIEW }),
])

// ────────────────────────────────────────────────────────── Verdict (T3)
phase('Verdict')
const verdict = await agent(
  `${RULES}\nVERDICT for run 3.\n\n` +
  `F3.1 scouted: ${scout.f31_nodes.length} nodes. Feasibility: ${scout.feasibility}\n` +
  `F3.2 strategy: ${strategy ? strategy.outcome : 'none'}\n` +
  `  route: ${strategy ? String(strategy.route).slice(0, 2000) : ''}\n` +
  `  obstruction: ${strategy ? String(strategy.obstruction).slice(0, 1500) : ''}\n` +
  `Proved ${proved.length}/${allNodes.length}: ${JSON.stringify(proofs).slice(0, 5000)}\n` +
  `Guard: ${String(guard).slice(0, 3000)}\n` +
  `Reviews: ${JSON.stringify(reviews.filter(Boolean), null, 1).slice(0, 10000)}\n\n` +
  `Decide what actually ships:\n` +
  `  F3.1_ONLY   — eta-quotient definitions + cusp orders as a standalone note. This was the\n` +
  `                designed fallback and is NOT a failure.\n` +
  `  F3.1_F3.2   — both, if Ligozat genuinely landed.\n` +
  `  OBSTRUCTION_PAPER — F3.1 plus a precisely-named obstruction result: "Ligozat's criterion is\n` +
  `                not reachable in Mathlib without Dedekind sums, and here is exactly why."\n` +
  `                That is a real contribution and tells the community what to build.\n` +
  `  REWORK      — fatal findings must close first.\n\n` +
  `Then write: what is proved (A1), what remains, what the next Mathlib contribution should be, and\n` +
  `the honest framing for the README, dataset card and DOI description — not just the paper.\n` +
  `Be willing to conclude the result is smaller than hoped. Run 1's lesson is that an overclaim\n` +
  `costs more than a modest true statement.`,
  { label: 'verdict', phase: 'Verdict', model: 'opus', effort: 'xhigh' }
)

return {
  f31_nodes: scout.f31_nodes.length,
  f32_outcome: strategy && strategy.outcome,
  f32_avoids_dedekind: strategy && strategy.avoids_dedekind_sums,
  obstruction: strategy && strategy.obstruction,
  proved: proved.length,
  total_nodes: allNodes.length,
  blocked: proofs.filter(p => p.status !== 'proved').map(p => ({ id: p.node_id, why: p.blocker })),
  guard,
  reviews: reviews.filter(Boolean),
  verdict,
}
