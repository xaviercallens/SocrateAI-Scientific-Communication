# Drafts — not for citation

Everything in this directory is **unreviewed and unarchived**. No DOI is minted for anything here,
deliberately: a DOI is a permanent citable identifier and a draft has not earned one.

| Draft | Status |
|---|---|
| `Lean4_EtaQuotients_DRAFT` | Awaiting review. The Lean development compiles (3462 jobs, 0 errors, 0 `sorry`, 391 axiom guards); the *exposition* has not been refereed. |

When a draft passes review it moves to `papers/`, gets a French version, and is deposited on Zenodo
under the programme's concept DOI. Until then, cite the code, not the paper.

## Standing caveat on the eta-quotient draft

Its central result is **deliberately bounded**: Ligozat's transformation law is proved for
`N ∈ {1,2,3,4,5,7,13}`, not for general `N`. The general case is blocked by a precisely named
obstruction (Dedekind sums, via Rademacher's `Φ`), and the DAG node `ETA-01` remains `open` with
`lean_name: null`. Do not read the draft as claiming the general criterion.
