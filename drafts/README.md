# Drafts — not for citation

Everything in this directory is **unreviewed**. Items here have had no external referee; where a
DOI exists it identifies a *preprint*, not a refereed paper.

| Draft | Status |
|---|---|
| `Lean4_EtaQuotients_DRAFT` | **Published as a preprint** — [10.5281/zenodo.22648098](https://doi.org/10.5281/zenodo.22648098), [HuggingFace](https://huggingface.co/datasets/callensxavier/socrateai-eta-quotients). Not peer reviewed. Lean development compiles (3462 jobs, 0 errors, 0 `sorry`, 391 axiom guards); the *exposition* has had no referee. |

When a draft passes review it moves to `papers/` and gets a French version for HAL. A preprint DOI
records what was claimed and when; it is not evidence the claim was checked by anyone else.

## Standing caveat on the eta-quotient draft

Its central result is **deliberately bounded**: Ligozat's transformation law is proved for
`N ∈ {1,2,3,4,5,7,13}`, not for general `N`. The general case is blocked by a precisely named
obstruction (Dedekind sums, via Rademacher's `Φ`), and the DAG node `ETA-01` remains `open` with
`lean_name: null`. Do not read the draft as claiming the general criterion.
