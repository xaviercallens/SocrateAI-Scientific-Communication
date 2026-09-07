---
name: scientific-publication
description: "Publish a verified research artifact to GitHub, Zenodo (DOI), HuggingFace and HAL without minting the wrong identifier, leaking a credential, or shipping a PDF whose code blocks silently corrupted. Use when a paper and its formal artifact are ready to go out, when a DOI is needed, when a second-language version is required, or when a publication step failed and must be recovered. Encodes the run-2 failures: a DOI minted for the wrong deposition, three credentials invisible to the agent, and a listing that overflowed its frame while text extraction reported clean."
---

# Publishing a verified artifact

Publication is where irreversible actions live. A `lake build` can be re-run; a minted DOI cannot be
withdrawn, a pushed tag is public, and a secret in a transcript is a secret that has left. This
skill is the checklist that run 2 paid for.

## 1. Gate zero — do not publish a claim the review rejected

Before any of the mechanics: check the review verdict. Run 1's paper carried **REJECT as a venue
submission** with "pursue the Mathlib PR" as the recommendation. That does not forbid archiving —
Zenodo, HuggingFace and HAL are archives, and archiving is honest — but the framing must match:

- an artifact whose verdict is REJECT is published **as an archival deposit**, and says so;
- withdrawn claims are stated in the README, the dataset card, the DOI description **and** the
  paper, not only in the paper where a downstream reader will not look;
- never present an archived deposit as peer-reviewed or as establishing priority.

If you cannot describe the artifact honestly in the deposit description, the artifact is not ready.

## 2. Credentials — the file, not the variable

**Claude Code's Bash shells inherit the environment captured at session start.** Shell state does
not persist between calls. A mid-session `export`, including one typed as `! export ...`, reaches
nothing. This cost three round-trips in run 2 across three different tokens.

```bash
# ONE check, names only, never values:
env | cut -d= -f1 | grep -iE "token|key|secret" | sort
```

If the credential is not there, ask for a **token file** and read it:

| Service | File | Notes |
|---|---|---|
| HuggingFace | `~/.cache/huggingface/token` | written by `hf auth login`; validate with `/api/whoami-v2` |
| Zenodo | `~/.config/zenodo/token` | `chmod 600`; scopes `deposit:write`, `deposit:actions` |
| GitHub | `$GITHUB_TOKEN` | present at session start via the harness |

Write publication scripts to try `$SERVICE_TOKEN` first, then the file. Never print a token, never
put one in a commit, never echo it into a log. Validate before use — a 401 after uploading 12 files
is a bad time to discover a bad token.

**A secret pasted into chat is already exposed**: it is written to
`~/.claude/projects/<project>/<session>.jsonl` in plaintext. Say so immediately, keep working, and
recommend rotation *after* any operation that depends on it — rotating mid-flight breaks the run.

## 3. Zenodo — concept DOI, and never a defaulted target

Two facts that between them caused run 2's worst failure:

1. **A reserved DOI is not a minted DOI.** Staging a deposition reserves an identifier that resolves
   to nothing until you publish. Typesetting a paper against a reserved DOI and then publishing a
   *different* deposition leaves the paper citing a dead link, permanently.
2. **Published records are immutable and undeletable.** Files can only be changed by creating a new
   version, which mints a new version DOI.

Therefore:

> **Papers cite the CONCEPT DOI.** It is stable across every version and always resolves to the
> newest. Get it from `conceptdoi` on the published record. A version DOI in a paper is a bug.

And the hard rule, enforced in `scripts/zenodo_deposit.py`:

> **`--publish` requires an explicit `--deposition <id>`.** It must never create a deposition and
> publish it in the same breath. Publishing targets the draft a human reviewed, by id, or it
> refuses.

The correct sequence:

```bash
python3 scripts/zenodo_deposit.py                      # stage a draft, print its id
#   -> human reviews https://zenodo.org/uploads/<id>
python3 scripts/zenodo_deposit.py --publish --deposition <id>
```

To correct a published record: `POST /deposit/depositions/<id>/actions/newversion`, replace files on
the new draft, publish. The concept DOI in the papers keeps resolving; nothing downstream breaks.

Probe unfamiliar endpoints against `sandbox.zenodo.org` first. Note that `{}` is a legitimate POST
body for creating a deposition — a Python `if payload:` truthiness test drops it to an empty body and
Zenodo answers **HTTP 500**, which reads like an outage and is not one.

## 4. GitHub — route around refusals, never through them

A PAT without `workflow` scope cannot push a commit touching `.github/workflows/`. The wrong moves
are asking for a broader token or force-pushing. The right move is the narrower path:

- merge via **PR** from a branch that does not contain the workflow file;
- preserve any commit that is not yours on its own branch (`git branch ci-workflow <sha>`) rather
  than dropping it — `quarantine, don't delete`, applied to history;
- `git reset --mixed origin/master` realigns the branch while leaving local build config untouched.
  `--hard` would discard the local `lakefile.lean`/`lean-toolchain` that make the build work.

Releases: create the tag through the API at the exact merge SHA, then `gh release create --verify-tag`.
`--target` with a short SHA is rejected; use the full 40-character SHA.

## 5. The PDF fidelity gate — two checks, disjoint failure classes

Text extraction and rendering catch **different** defects, and each alone gives false confidence:

| Check | Catches | Misses |
|---|---|---|
| `pdftotext` | transposed and substituted glyphs | overflow, clipping, spacing |
| `pdftoppm` + read the image | overflow, clipping, layout | which codepoint is actually there |

Run both. Settle any disagreement by **codepoint**, never by eye:

```python
print([(c, hex(ord(c))) for c in line[-3:]])   # is that ⟩ U+27E9, or a paren?
```

DejaVu Sans Mono draws `⟩` shallowly enough to read as `)` at 130 dpi. It is the right glyph.

Then the mechanical gate — every code line in the paper must (a) appear verbatim in the rendered
PDF text and (b) exist verbatim in the Lean source. The second half is what turns "reproduced
verbatim from the compiled source" into a checked claim. Twenty lines of Python; run it every build.

Typesetting rules earned the hard way: use `fancyvrb`, **not** `listings`, for Lean under XeLaTeX
(`listings`' `extendedchars` transposes glyphs it lacks literate entries for). A ~90-character line
overflows a `\small` frame at 2.5 cm margins — use `\footnotesize` for wide listings. `\detokenize`
doubles `#`, so write `\texttt{\#print axioms}` rather than detokenizing it.

## 6. Measuring anything about Lean source — count characters

`awk 'length($0)'`, `wc -c` and `${#var}` count **bytes**. Lean source is dense with multi-byte
Unicode, so all three systematically over-report and will manufacture a phantom Mathlib
100-character violation. Use Python:

```python
for i, l in enumerate(open(f, encoding='utf-8'), 1):
    if len(l.rstrip('\n')) > 100: print(i, len(l))
```

State the unit before reporting any threshold violation.

## 7. A second language (HAL)

HAL (`hal.science`) is the French national open archive and accepts French or English. A French
version is a genuine widening of audience, not a formality.

- Use `polyglossia` with `\setdefaultlanguage{french}` under XeLaTeX; set
  `\renewcommand{\proofname}{Démonstration}` (amsthm does not follow polyglossia here).
- **Do not translate Lean identifiers, theorem names, or code.** They are the artifact's API.
- Terminology: *demi-plan de Poincaré*, *pointes* (cusps), *sous-groupe de congruence*,
  *empreinte axiomatique*, *quotients êta*, *assistant de preuve*, *cible de compilation*.
- Add a **Note sur cette version** stating which language governs the formal statements, that the
  note is not peer reviewed, and that archival deposit is not validation. Say it in the deposited
  language — a French reader should not have to consult the English to learn the paper was rejected
  as a submission.
- Depositing on HAL requires the author's ORCID/IdHAL login through the web form. **Do not automate
  it on a stored credential** — it is a deposit under a person's identity on a national archive.
  Prepare the PDF and the classification (e.g. `math.NT`, secondary `cs.LO`) and hand it over.

## 8. Order of operations

1. Verify the artifact builds and the axiom guards pass — publication does not fix a red build.
2. Run the PDF fidelity gate in every language.
3. GitHub: merge, tag, release. Cheapest to correct, so it goes first.
4. Zenodo: stage a draft → **human review** → publish with `--deposition`. Capture the concept DOI.
5. Stamp the concept DOI into every paper; rebuild; re-verify the fidelity gate.
6. Propagate the stamped PDFs to GitHub, HuggingFace, and the Zenodo record (new version if the
   record is already published).
7. Hand the HAL deposit to the author.

Step 5 comes **after** step 4 and forces a rebuild. Plan for it: the DOI cannot be in the PDF that
the DOI is minted from, unless you reserve and publish the same deposition — which is exactly the
sequence `--deposition` exists to enforce.
