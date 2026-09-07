export const meta = {
  name: 'paper-run',
  description: 'End-to-end run for one paper: prior-art gate zero (which can KILL the topic), statement layer with sorry, leaf-first proofs, axiom guards, adversarial review, then a publication-readiness verdict',
  whenToUse: 'Starting a new paper in the SocrateAI programme. Replaces the run-1 habit of writing first and checking novelty last. Cheap phases run first and can abort the run before any expensive proving.',
  phases: [
    { title: 'GateZero',  detail: 'T2/opus: prior art across Mathlib, cited Lean developments, GitHub-wide. Can abort the run.' },
    { title: 'Statements', detail: 'T2/opus: DAG nodes + Lean statement layer with sorry, typechecking' },
    { title: 'Compare',   detail: 'T2/opus: statement comparator against the reference before any proof effort' },
    { title: 'Prove',     detail: 'T2/opus: leaf-first, one agent per frontier node, worktree-isolated' },
    { title: 'Guard',     detail: 'T0/haiku: axiom guards + negative control + DAG validator' },
    { title: 'Review',    detail: 'T2/opus x3 lenses: novelty, correctness, reproducibility' },
    { title: 'Verdict',   detail: 'T3/opus xhigh: publish / Mathlib-PR-only / drop, with the honest framing' },
  ],
}

const REPO = '/home/xavkal/xdev/SocrateAIShared/foundationpaper2'
const LEAN = '/home/xavkal/xdev/SocrateAI-Lean-Lib'
const MATHLIB = '/home/xavkal/xdev/SocrateAI-Scientific-Measure/lean/.lake/packages/mathlib/Mathlib'

const topic  = (args && args.topic)  || 'ETA-01'
const concepts = (args && args.concepts) || ['Ligozat', 'EtaQuotient', 'etaQuotient', 'eta_quotient']
const bibRepos = (args && args.bibRepos) || ['anthropics/fermats-last-theorem']

const RULES = `
HARD CONSTRAINTS (LL.md, .claude/RESEARCH_PROGRAM.md):
- USE THE REFERENCES. NEVER rely on recalled facts about what Mathlib or any repo contains.
  Every claim of absence is a command you ran, with its output. Grep, compile, or search — or say
  you do not know. This is the standing instruction and it is not negotiable.
- Label every claim: A1 formal / A2 program-checked / L literature / C derived / D conjecture /
  E unsupported. Literature support is L, never B (Stream 0 tier collision, LL-6).
- Absence from Mathlib is a GAP, not NOVELTY. Novelty requires absence from Lean generally.
- A green build can prove the wrong theorem (LL-1). The comparator runs on the statement layer
  BEFORE any proof effort; proving a mismatched statement is the most expensive possible mistake.
- Count CHARACTERS not bytes when measuring Lean source (LL-17). Use python len(str), never awk.
- Never mark a DAG node proved without a lean_name that resolves and an axiom guard (LL-2, LL-7).
- Concurrency: check "pgrep -x lake" — NOT "pgrep -f 'lake build'", which matches the waiting
  shell's own command line and deadlocks (LL-12). The Mathlib pool is a build input, not a cache.
Repo: ${REPO}   Lean: ${LEAN}   Mathlib: ${MATHLIB}
`

const PRIOR_ART = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'mathlib_hits', 'bib_hits', 'global_hits', 'corpus_checked', 'not_checked', 'reasoning'],
  properties: {
    verdict: { type: 'string', enum: ['PAPER', 'MATHLIB_PR_ONLY', 'DROP'] },
    mathlib_hits: { type: 'string', description: 'commands run against Mathlib and their output' },
    bib_hits: { type: 'string', description: 'repo-scoped search of every Lean dev in the bibliography' },
    global_hits: { type: 'string', description: 'GitHub-wide language:lean search results' },
    closest_prior: { type: 'string', description: 'the nearest existing thing, named exactly' },
    what_survives: { type: 'string', description: 'what is left after full disclosure — may be nothing' },
    corpus_checked: { type: 'array', items: { type: 'string' } },
    not_checked: { type: 'array', items: { type: 'string' }, description: 'named uncovered corpora — Zulip, open PRs, other assistants' },
    reasoning: { type: 'string' },
  },
}

const NODES = {
  type: 'object', additionalProperties: false, required: ['nodes'],
  properties: { nodes: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['id', 'statement', 'statement_nl', 'depends_on'],
    properties: {
      id: { type: 'string' }, statement: { type: 'string' },
      statement_nl: { type: 'string', description: 'written for a SEARCHER who does not have the statement' },
      depends_on: { type: 'array', items: { type: 'string' } },
      mathlib_support: { type: 'string', description: 'the Mathlib lemmas this should be built from' },
    } } } },
}

const COMPARE = {
  type: 'object', additionalProperties: false, required: ['node_id', 'verdict', 'diff'],
  properties: {
    node_id: { type: 'string' },
    verdict: { type: 'string', enum: ['MATCH', 'WEAKER', 'MISMATCHED', 'NO_REFERENCE'] },
    reference: { type: 'string', description: 'the Mathlib theorem or the LaTeX proposition compared against' },
    diff: { type: 'string' },
  },
}

const PROVED = {
  type: 'object', additionalProperties: false, required: ['node_id', 'status', 'lean_name'],
  properties: {
    node_id: { type: 'string' },
    status: { type: 'string', enum: ['proved', 'blocked', 'open'] },
    lean_name: { type: 'string' },
    axioms: { type: 'array', items: { type: 'string' } },
    blocker: { type: 'string' },
    mathlib_lemmas_used: { type: 'array', items: { type: 'string' } },
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
        claim: { type: 'string' }, evidence: { type: 'string' },
        fix: { type: 'string' },
      } } },
  },
}

// ───────────────────────────────────────────────────── GateZero (can abort)
phase('GateZero')
log(`Prior-art gate for ${topic} — concepts: ${concepts.join(', ')}`)

const prior = await agent(
  `${RULES}\nPRIOR-ART GATE ZERO for topic ${topic}. This decides whether the paper exists at all.\n\n` +
  `Run these searches and REPORT THE ACTUAL OUTPUT. Do not answer from memory about what any of\n` +
  `these corpora contain — that error cost run 1 its central claim.\n\n` +
  `  1. Mathlib at the pinned commit:\n` +
  concepts.map(c => `       grep -ril "${c}" ${MATHLIB} | head`).join('\n') + `\n` +
  `     Also inventory what related machinery DOES exist and could be built on.\n` +
  `  2. Every Lean development in the intended bibliography:\n` +
  bibRepos.map(r => concepts.map(c =>
    `       gh api "search/code?q=${c}+repo:${r}" --jq '.total_count'`).join('\n')).join('\n') + `\n` +
  `     For any nonzero count, FETCH THE FILES and read them. A hit may be a namespace label rather\n` +
  `     than the theorem — that distinction is the whole decision.\n` +
  `  3. GitHub-wide:\n` +
  concepts.map(c => `       gh api "search/code?q=${c}+language:lean" --jq '.total_count'`).join('\n') + `\n` +
  `     Repo-scoped and global counts disagree (the global index is incomplete). A global 0 is\n` +
  `     evidence, not proof — say so.\n\n` +
  `Then route:\n` +
  `  PAPER            — absent from Mathlib AND from Lean generally.\n` +
  `  MATHLIB_PR_ONLY  — a cited Lean development already covers it. NOT a paper. This is the\n` +
  `                     honest outcome for Atkin-Lehner, whose family operator already exists.\n` +
  `  DROP             — covered, and not worth upstreaming either.\n\n` +
  `Name the corpora you checked AND the ones you did not (Lean Zulip, open mathlib4 PRs, other\n` +
  `proof assistants). Absence of evidence is reported as such.`,
  { label: `gate0:${topic}`, phase: 'GateZero', model: 'opus', effort: 'high', schema: PRIOR_ART }
)

if (!prior || prior.verdict !== 'PAPER') {
  log(`GATE ZERO STOPPED THE RUN: ${prior ? prior.verdict : 'no result'}`)
  return {
    topic, aborted_at: 'GateZero', verdict: prior && prior.verdict,
    closest_prior: prior && prior.closest_prior,
    reasoning: prior && prior.reasoning,
    note: 'No proof effort was spent. This is the gate working, not a failure.',
  }
}
log(`Gate zero passed — ${topic} is a paper. Closest prior: ${prior.closest_prior || 'none found'}`)

// ─────────────────────────────────────────── Statements → Compare (per node)
phase('Statements')
const decomposed = await agent(
  `${RULES}\nDecompose ${topic} into DAG nodes for ${LEAN}/dag/theorems.jsonl.\n\n` +
  `Prior-art context you must respect:\n${JSON.stringify(prior, null, 1).slice(0, 3000)}\n\n` +
  `Rules: leaf-first; every node traces to a proposition in the paper or to a claim id; every node\n` +
  `carries statement_nl written for a SEARCHER (see formalization-dag §2.3); name the Mathlib\n` +
  `lemmas each node should be built FROM rather than reproving. Write the statement layer into Lean\n` +
  `with 'sorry' bodies and confirm the whole layer TYPECHECKS before returning.`,
  { label: `statements:${topic}`, phase: 'Statements', model: 'opus', effort: 'high', schema: NODES }
)

const nodes = (decomposed && decomposed.nodes) || []
if (!nodes.length) return { topic, aborted_at: 'Statements', error: 'no nodes produced' }
log(`${nodes.length} statement nodes, typechecking with sorry`)

// Comparator BEFORE proving, then prove — pipelined per node, no barrier.
const worked = await pipeline(
  nodes,
  (n) => agent(
    `${RULES}\nSTATEMENT COMPARATOR — run before any proof effort.\n\n` +
    `Node: ${JSON.stringify(n, null, 1)}\n\n` +
    `Compare this Lean statement against its reference: the Mathlib theorem it should match where\n` +
    `Mathlib has the concept, otherwise the LaTeX proposition verbatim. Is it MATCH, WEAKER,\n` +
    `MISMATCHED, or NO_REFERENCE? Quantifiers and hypotheses are where this goes wrong — check that\n` +
    `the Lean statement does not quietly assume something the paper states unconditionally.\n` +
    `NO_REFERENCE is honest and correct for a genuinely new statement.`,
    { label: `compare:${n.id}`, phase: 'Compare', model: 'opus', effort: 'high', schema: COMPARE }
  ),
  (cmp, n) => {
    if (!cmp || cmp.verdict === 'MISMATCHED') {
      log(`${n.id}: comparator says MISMATCHED — not proving it`)
      return { node_id: n.id, status: 'blocked', lean_name: '', blocker: `comparator: ${cmp && cmp.diff}` }
    }
    return agent(
      `${RULES}\nPROVE node ${n.id}.\n\nStatement: ${n.statement}\n` +
      `Description: ${n.statement_nl}\nBuild from: ${n.mathlib_support || 'find the Mathlib lemmas'}\n` +
      `Comparator verdict: ${cmp.verdict}\n\n` +
      `Replace the sorry with a real proof. Prefer existing Mathlib lemmas over new machinery —\n` +
      `run 2's bundled-type transport turned out to be three Mathlib lemmas, not a research project\n` +
      `(LL-11). If it is genuinely blocked, say so and leave the sorry with an -- OPEN: comment;\n` +
      `a blocked node is honest and is the unit of remaining work.\n` +
      `Then add a '#guard_msgs in #print axioms' guard to FinalCheck.lean and report the footprint.\n` +
      `Verify with a real build. Check "pgrep -x lake" before building, never "pgrep -f".`,
      // NO worktree isolation for Lean: each worktree needs its own .lake, and two concurrent
      // `lake build`s on one build directory destroyed the Mathlib pool in run 1 (LL-12).
      // For Lean-heavy runs prefer `eta-quotient-run.js`, which serializes proving outright.
      { label: `prove:${n.id}`, phase: 'Prove', model: 'opus', effort: 'high', schema: PROVED }
    )
  },
)

const results = worked.filter(Boolean)
const provedNodes = results.filter(r => r.status === 'proved')
log(`${provedNodes.length}/${nodes.length} proved`)

// ─────────────────────────────────────────────────────────── Guard (T0)
phase('Guard')
const guard = await agent(
  `${RULES}\nIntegrity pass on ${LEAN}. Mechanical — report numbers, do not interpret.\n` +
  `  1. lake build SocrateAI — job count, error count, sorry count (real sorries, not the string\n` +
  `     appearing in comments).\n` +
  `  2. Count '#guard_msgs' in FinalCheck.lean; confirm the build includes it.\n` +
  `  3. Run the negative control in scratch/ and confirm it FAILS. A passing negative control means\n` +
  `     the guards are vacuous.\n` +
  `  4. python3 dag/check_dag.py — acyclicity, proved-implies-lean_name-exists, proved-implies-deps-proved.\n` +
  `  5. Character-count (python, encoding='utf-8', NOT awk) any line over 100 chars.\n` +
  `Report each as a number with the command that produced it.`,
  { label: 'guard', phase: 'Guard', model: 'haiku', effort: 'low' }
)

// ───────────────────────────────────────────────── Review (3 lenses, parallel)
phase('Review')
const LENSES = [
  { key: 'novelty', prompt:
    `Re-run the prior-art check INDEPENDENTLY of gate zero — do not trust its conclusion. Search\n` +
    `Mathlib, the bibliography's Lean developments, and GitHub-wide. Then check that the paper's\n` +
    `abstract claims no more than its limitations section concedes. Run 1 failed exactly here, and\n` +
    `its own correction over-claimed too (LL-13 postscript).` },
  { key: 'correctness', prompt:
    `Check every theorem statement against what the prose says it proves. Look for: a green build of\n` +
    `the wrong theorem; hypotheses in Lean that the prose drops; a claimed axiom footprint that has\n` +
    `drifted; numbers in the paper (job counts, declaration counts, guard counts) that disagree with\n` +
    `the artifact. Verify each number by running the command.` },
  { key: 'reproducibility', prompt:
    `Can a third party build this? Check the lakefile for absolute paths, the toolchain pin, the\n` +
    `Mathlib commit pin, and whether every artifact claim in the paper (repo, tag, module paths,\n` +
    `DOI) resolves. Run 2 shipped a paper whose lakefile hard-coded two local paths — state plainly\n` +
    `whether that is still true.` },
]

const reviews = await parallel(LENSES.map(l => () => agent(
  `${RULES}\nREVIEW LENS: ${l.key}\n\n${l.prompt}\n\n` +
  `Paper: ${REPO}/docs/ — artifact: ${LEAN}\n` +
  `Gate-zero found: ${JSON.stringify(prior).slice(0, 1500)}\n` +
  `Build integrity: ${String(guard).slice(0, 2000)}\n\n` +
  `Every finding cites evidence you produced — a command and its output, a file:line. A finding\n` +
  `without evidence is not a finding. Severity fatal means the paper cannot go out as written.`,
  { label: `review:${l.key}`, phase: 'Review', model: 'opus', effort: 'high', schema: REVIEW }
)))

// ───────────────────────────────────────────────────────── Verdict (T3)
phase('Verdict')
const verdict = await agent(
  `${RULES}\nFINAL VERDICT on ${topic}.\n\n` +
  `Gate zero: ${JSON.stringify(prior, null, 1).slice(0, 3000)}\n` +
  `Nodes: ${provedNodes.length}/${nodes.length} proved\n` +
  `Build: ${String(guard).slice(0, 2500)}\n` +
  `Reviews: ${JSON.stringify(reviews.filter(Boolean), null, 1).slice(0, 12000)}\n\n` +
  `Decide, and write the framing that goes into the README, the dataset card, and the DOI\n` +
  `description — not only into the paper, where a downstream reader will not look:\n` +
  `  PUBLISH          — as a paper, with the claim stated at exactly the strength the evidence bears\n` +
  `  ARCHIVE_ONLY     — deposit with a DOI, explicitly not a submission (run 2's outcome)\n` +
  `  MATHLIB_PR_ONLY  — the contribution is upstream code, not a paper\n` +
  `  REWORK           — named fatal findings must close first\n\n` +
  `Then: what is proved, what remains, what would falsify it, and the next DAG frontier. Be willing\n` +
  `to conclude the result is smaller than the draft claims — that conclusion, stated clearly with\n` +
  `the surviving core intact, is worth more than an overreaching one.`,
  { label: 'verdict', phase: 'Verdict', model: 'opus', effort: 'xhigh' }
)

return {
  topic,
  gate_zero: prior.verdict,
  closest_prior: prior.closest_prior,
  nodes_total: nodes.length,
  nodes_proved: provedNodes.length,
  blocked: results.filter(r => r.status === 'blocked').map(r => ({ id: r.node_id, why: r.blocker })),
  build: guard,
  reviews: reviews.filter(Boolean),
  verdict,
}
