export const meta = {
  name: 'paper-review-improve',
  description: 'Full referee-grade review of one paper AND the concrete improvements: verify every artifact claim by running it, referee from three independent lenses, adversarially verify each finding, then emit ready-to-apply LaTeX patches and a submission verdict',
  whenToUse: 'Before submitting a paper, or after a substantive revision. Unlike math-foundation-hardening (which audits claim strength), this one reviews the paper AS A REFEREE WOULD and produces the edits, not just the findings.',
  phases: [
    { title: 'Reproduce', detail: 'T0/haiku: run the artifact — compile the paper, build the Lean, check axioms, resolve every bibkey. Facts only.' },
    { title: 'Referee', detail: 'T2/opus: three independent lenses — correctness, novelty/prior-art, exposition+venue-fit' },
    { title: 'Verify', detail: 'T2/opus: adversarially refute each finding by running code; unrefuted findings stand' },
    { title: 'Patch', detail: 'T2/opus: turn surviving findings into verbatim LaTeX edits (old -> new)' },
    { title: 'Verdict', detail: 'T3/opus xhigh: apply-order, residual risk, ACCEPT/MINOR/MAJOR/REJECT with the reasons a referee would give' },
  ],
}

const REPO = '/home/xavkal/xdev/SocrateAIShared/foundationpaper2'
const LEAN = '/home/xavkal/xdev/SocrateAI-Lean-Lib'

const paper = (args && args.paper) || 'docs/Lean4_Fricke_Involution.tex'
const venue = (args && args.venue) || 'CPP (Certified Programs and Proofs) short paper, and a Mathlib pull request'
const applyPatches = (args && args.apply) || false

const RULES = `
HARD CONSTRAINTS (.claude/RESEARCH_PROGRAM.md, LL.md):
- RUN, DO NOT RECALL. Every factual claim about the artifact must come from a command you executed
  in this session. "The build passes" is not an observation unless you ran the build.
  LL-4: the run-1 audit refuted three of its own upstream findings by compiling.
- Epistemic ladder: A1 formal (Lean, quantified over structures, clean axioms, faithful statement)
  / A2 computation / L literature / C derived / D conjecture / E unsupported. Literature is L,
  NEVER B (LL-6: that letter collides across streams — see SocrateAI-Mathesis/docs/TIER_CALCULUS.md).
- A green build does not mean the intended theorem was proved (LL-1: a vacuous ModularForm
  structure typechecked and backed a Tier A claim; 174 numeral identities were "kernel-verified").
  For any structure the paper introduces, try to construct a trivial inhabitant.
- Prior-art claims about Mathlib are settled by COMPILING against it (#check / exact?), never by
  grep or memory alone (LL-4). Mathlib pool: ${LEAN} builds against
  SocrateAI-Scientific-Measure/lean/.lake/packages (toolchain v4.32.2, Mathlib 905b9581).
- Every bibkey must exist in ${REPO}/references/references.json. Do not read that file whole
  (~106K tokens): grep the paper's \\cite keys, then query only those with a python3 one-liner.
- Do not invent numbers, page counts, timings, declaration counts, or Mathlib declaration names.
- Report uncertainty explicitly. "I could not check X" is a valid and useful finding.
Repo: ${REPO}   Lean: ${LEAN}   (export PATH="$HOME/.elan/bin:$PATH" before lake)
- ONE lake build at a time per build directory. Check with \`pgrep -x lake\` (match the BINARY).
  Never guard with \`pgrep -f "lake build"\` — that pattern matches the waiting shell's own
  command line and deadlocks with no real build running (LL-12).
`

const REPRO_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['latex_ok', 'lean_ok', 'findings'],
  properties: {
    latex_ok: { type: 'boolean' },
    latex_detail: { type: 'string', description: 'fatal error count, undefined citation count, page count' },
    lean_ok: { type: 'boolean' },
    lean_detail: { type: 'string', description: 'lake build job count and result; axiom-guard result; sorry census' },
    bibkeys_missing: { type: 'array', items: { type: 'string' } },
    artifact_claims_checked: { type: 'array', items: { type: 'string' },
      description: 'each claim the paper makes about its own artifact (job counts, tags, paths, declaration counts) and whether it matched reality' },
    findings: { type: 'array', items: { type: 'string' }, description: 'discrepancies found; empty if none' },
  },
}

const REFEREE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'findings', 'overall'],
  properties: {
    lens: { type: 'string' },
    overall: { type: 'string', enum: ['ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT'] },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'severity', 'location', 'issue', 'why_a_referee_cares'],
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['blocking', 'major', 'minor', 'nit'] },
          location: { type: 'string', description: 'file:line or section' },
          issue: { type: 'string' },
          why_a_referee_cares: { type: 'string' },
          evidence: { type: 'string', description: 'the command run and its output, or the quoted source' },
          suggested_fix: { type: 'string' },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'refuted', 'argument'],
        properties: {
          id: { type: 'string' },
          refuted: { type: 'boolean', description: 'true if the finding is WRONG' },
          argument: { type: 'string' },
          evidence_run: { type: 'string', description: 'the command you executed to decide this' },
          severity_correction: { type: 'string', enum: ['blocking', 'major', 'minor', 'nit', 'none'] },
        },
      },
    },
  },
}

const PATCH_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['patches'],
  properties: {
    patches: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['finding_id', 'file', 'old_text', 'new_text', 'rationale'],
        properties: {
          finding_id: { type: 'string' },
          file: { type: 'string' },
          old_text: { type: 'string', description: 'VERBATIM current text, unique in the file' },
          new_text: { type: 'string', description: 'replacement text' },
          rationale: { type: 'string' },
          risk: { type: 'string', enum: ['safe', 'changes-a-claim', 'needs-author-decision'] },
        },
      },
    },
  },
}

// ------------------------------------------------------------ Reproduce (T0)
phase('Reproduce')
log(`Reviewing ${paper} for: ${venue}`)

const repro = await agent(
  `${RULES}\nReproduce the artifact for ${REPO}/${paper}. RUN these and report actual output:\n` +
  `  1. cd ${REPO}/$(dirname ${paper}) && xelatex -interaction=nonstopmode twice; count '^! ' lines\n` +
  `     in the .log, count undefined citations, and read the page count from pdfinfo.\n` +
  `  2. export PATH="$HOME/.elan/bin:$PATH"; cd ${LEAN} && lake build SocrateAI — report the job\n` +
  `     count and whether it succeeded. The axiom guards live in Lean/SocrateAI/FinalCheck.lean and\n` +
  `     run inside that build; note whether they passed.\n` +
  `  3. Census real sorries: grep -rnE ':= *by *sorry|:= sorry' ${LEAN}/Lean/ | wc -l  (the bare\n` +
  `     word "sorry" appears in ~25 docstrings and is NOT a defect — LL-1.)\n` +
  `  4. Extract the paper's \\cite keys and check each exists in references/references.json.\n` +
  `  5. Check EVERY factual claim the paper makes about its own artifact — job counts, tag names,\n` +
  `     file paths, declaration counts, toolchain and Mathlib commit — against reality.\n` +
  `Report only what you observed.`,
  { label: 'reproduce', phase: 'Reproduce', model: 'haiku', effort: 'low', schema: REPRO_SCHEMA }
)
log(`Artifact: latex_ok=${repro && repro.latex_ok} lean_ok=${repro && repro.lean_ok}`)

// -------------------------------------------- Referee (T2) -> Verify (T2)
const LENSES = [
  { key: 'correctness',
    brief: 'CORRECTNESS. Is every mathematical statement true and does the Lean say what the prose says? ' +
      'Open each cited Lean declaration and read its statement to the bottom of its definitions. For any ' +
      'structure the paper introduces, TRY TO CONSTRUCT A TRIVIAL INHABITANT and report if you succeed. ' +
      'Check the axiom footprints yourself. Check that stated limitations are honest and complete — an ' +
      'undisclosed limitation is worse than a disclosed one.' },
  { key: 'novelty',
    brief: 'NOVELTY AND PRIOR ART. Settle by compiling, not grepping. For each contribution, search Mathlib ' +
      'for an existing declaration (grep AND #check AND exact? on a restatement). Report anything already ' +
      'present, with its exact declaration name and file:line. Then check the converse: is the claimed GAP ' +
      'real? Also assess whether the novelty statement in the paper over- or under-claims relative to what ' +
      'you find. Under-claiming is a real defect at a formalization venue.' },
  { key: 'exposition',
    brief: `EXPOSITION AND VENUE FIT for: ${venue}. Would a referee at this venue accept? Check: does the ` +
      'abstract state the contribution in the first two sentences; is the artifact paragraph complete ' +
      '(repo, commit/tag, toolchain, dependency pin, build command, timing); are limitations stated ' +
      'plainly; is every Lean snippet in the paper actually compilable as printed; is the bibliography ' +
      'complete and correctly formatted; are MSC codes and keywords present. Flag anything a reviewer ' +
      'would ask for in round 1.' },
]

const reviewed = await pipeline(
  LENSES,

  // Stage 1 — T2/opus: referee under one lens
  (lens) => agent(
    `${RULES}\n\nYou are refereeing ${REPO}/${paper} under ONE lens.\n\n${lens.brief}\n\n` +
    `Reproduction facts already established (do not re-derive, but DO challenge them if you find ` +
    `contrary evidence):\n${JSON.stringify(repro, null, 1)}\n\n` +
    `Read the paper in full. Every finding needs a location and evidence you generated by running ` +
    `something or quoting the source. Rank by severity. Be the referee who would reject this if it ` +
    `deserves rejection, and who says so plainly if it does not.`,
    { label: `referee:${lens.key}`, phase: 'Referee', model: 'opus', effort: 'high', schema: REFEREE_SCHEMA }
  ),

  // Stage 2 — T2/opus: adversarial verification of that lens's findings
  (review, lens) => agent(
    `${RULES}\n\nYou are defending the AUTHORS against a referee report. For each finding below, try ` +
    `hard to REFUTE it — by running the compiler, opening the file, or checking the reference. ` +
    `The run-1 audit refuted three of its own findings this way (LL-4): predictions that a tactic ` +
    `"cannot close the goal" were wrong because nobody ran it.\n\n` +
    `Set refuted=true only with concrete evidence. Default to refuted=false when unsure — an ` +
    `unrefuted finding stands. You may also correct a severity that is inflated or understated.\n\n` +
    `REFEREE REPORT (${lens.key}):\n${JSON.stringify(review, null, 1)}`,
    { label: `verify:${lens.key}`, phase: 'Verify', model: 'opus', effort: 'high', schema: VERIFY_SCHEMA }
  ),
)

// -------------------------------------------------------------- Patch (T2)
phase('Patch')
const lensResults = LENSES.map((l, i) => ({ lens: l.key, verification: reviewed[i] }))

const patches = await agent(
  `${RULES}\n\nTurn the SURVIVING findings into ready-to-apply LaTeX edits for ${REPO}/${paper}.\n\n` +
  `Reproduction:\n${JSON.stringify(repro, null, 1)}\n\n` +
  `Verification results per lens:\n${JSON.stringify(lensResults, null, 1)}\n\n` +
  `Read the current ${paper} so every old_text is VERBATIM and UNIQUE in the file — a patch that ` +
  `does not apply cleanly is worthless. Skip findings that were refuted. For a finding that ` +
  `requires an author decision (a claim to weaken, a scope call), still write the patch but mark ` +
  `risk='needs-author-decision' and make new_text the honest weaker version. Prefer demotion to ` +
  `deletion. Do not touch the preamble unless a finding requires it.`,
  { label: 'patches', phase: 'Patch', model: 'opus', effort: 'high', schema: PATCH_SCHEMA }
)

// optional application, off by default
let applied = null
if (applyPatches && patches && patches.patches && patches.patches.length) {
  phase('Patch')
  applied = await agent(
    `${RULES}\nApply these patches to ${REPO}/${paper} with the Edit tool, exactly as given, ` +
    `SKIPPING any whose risk is 'needs-author-decision'. Then recompile with xelatex twice and ` +
    `report the fatal-error count, undefined-citation count and page count. If any patch fails to ` +
    `apply, report which and do not force it.\n\n${JSON.stringify(patches, null, 1)}`,
    { label: 'apply-patches', phase: 'Patch', model: 'opus', effort: 'medium' }
  )
}

// ------------------------------------------------------------ Verdict (T3)
phase('Verdict')

const verdict = await agent(
  `${RULES}\n\nYou are the program lead. Write the review outcome for ${paper}, target venue: ${venue}.\n\n` +
  `Reproduction:\n${JSON.stringify(repro, null, 1)}\n\n` +
  `Per-lens findings after adversarial verification:\n${JSON.stringify(lensResults, null, 1)}\n\n` +
  `Proposed patches:\n${JSON.stringify(patches, null, 1)}\n` +
  (applied ? `\nPatches were applied; result:\n${applied}\n` : '\nPatches were NOT applied (dry run).\n') +
  `\nBefore concluding, verify the two or three most consequential findings YOURSELF by running ` +
  `something — do not take an agent's word on anything that changes the verdict.\n\n` +
  `Produce markdown:\n` +
  `1. VERDICT — ACCEPT / MINOR_REVISION / MAJOR_REVISION / REJECT, in the voice of a referee at ` +
  `   the target venue, with the two or three reasons that actually drive it.\n` +
  `2. BLOCKING — findings that must be fixed before submission, each with its evidence.\n` +
  `3. APPLY ORDER — the patches in the order they should be applied, noting any that need an ` +
  `   author decision and what the decision is.\n` +
  `4. WHAT I VERIFIED MYSELF — commands run and what they showed.\n` +
  `5. CORRECTIONS TO THE REVIEWERS — findings that were refuted, and by what evidence.\n` +
  `6. RESIDUAL RISK — what a referee could still object to that this review could not settle, ` +
  `   including anything not checkable from here (other proof assistants, arXiv, Zulip).\n` +
  `7. SUBMISSION READINESS — a yes/no with the remaining manual steps.\n\n` +
  `Be the reviewer you would want. Do not inflate the verdict to be encouraging, and do not ` +
  `manufacture blocking findings to look rigorous.`,
  { label: 'verdict', phase: 'Verdict', model: 'opus', effort: 'xhigh' }
)

return {
  paper, venue,
  reproduction: repro,
  lens_results: lensResults,
  patches: patches && patches.patches,
  patches_applied: applied,
  verdict,
}
