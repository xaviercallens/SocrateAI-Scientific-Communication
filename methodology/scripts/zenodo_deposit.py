#!/usr/bin/env python3
"""Deposit the Fricke involution artifact to Zenodo and obtain a DOI.

Reads the token from, in order: $ZENODO_TOKEN, $ZENODO_API_TOKEN, or ~/.config/zenodo/token.
Never prints the token. Creates the deposition and uploads files, then STOPS: publishing is
irreversible on Zenodo (a published DOI cannot be withdrawn), so the final publish is a separate,
explicit step.

    python3 scripts/zenodo_deposit.py            # create draft + upload, print the review URL
    python3 scripts/zenodo_deposit.py --publish  # mint the DOI (irreversible)
    python3 scripts/zenodo_deposit.py --sandbox  # dry run against sandbox.zenodo.org
"""

import argparse
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from zenodo_common import get_token, call, ZenodoAmbiguousFailure, newversion  # noqa: E402

DOCS = pathlib.Path("/home/xavkal/xdev/SocrateAIShared/foundationpaper2/docs")
LEAN = pathlib.Path("/home/xavkal/xdev/SocrateAI-Lean-Lib")

FILES = [
    DOCS / "Lean4_Fricke_Involution.pdf",
    DOCS / "Lean4_Fricke_Involution.tex",
    DOCS / "Lean4_Involution_Fricke_FR.pdf",
    DOCS / "Lean4_Involution_Fricke_FR.tex",
    DOCS / "Lean4_GL2_Poincare.pdf",
    LEAN / "Lean/SocrateAI/ModularForms/FrickeInvolution.lean",
    LEAN / "Lean/SocrateAI/ModularForms/FrickeSlash.lean",
    LEAN / "Lean/SocrateAI/ModularForms/FrickeModular.lean",
    LEAN / "Lean/SocrateAI/ModularForms/FrickeComposite.lean",
    LEAN / "Lean/SocrateAI/StringTheory/TDualityBridge.lean",
    LEAN / "Lean/SocrateAI/FinalCheck.lean",
    LEAN / "dag/theorems.jsonl",
    LEAN / "dag/PROOF-PATH.md",
]

DESCRIPTION = """
<p>Machine-checked Lean 4 formalization of the Fricke involution
<em>W<sub>N</sub></em> = [[0, -1], [N, 0]] on the congruence subgroup
&Gamma;<sub>0</sub>(N), and of the operator it induces on modular forms.</p>

<p><strong>Verified:</strong> <code>lake build SocrateAI</code> &rarr; 3768 jobs, 0 errors,
0 <code>sorry</code>, against Lean 4.32.2 and Mathlib <code>905b9581</code>. Sixteen headline
theorems are pinned by build-failing <code>#guard_msgs in #print axioms</code> guards, each with
footprint exactly <code>[propext, Classical.choice, Quot.sound]</code>; a deliberately-wrong
negative control was verified to fail, establishing that the guards are load-bearing.</p>

<p><strong>v4 update:</strong> adds a negative-result section reporting an attempted bridge from
W<sub>N</sub> to a physical T-duality on the T&sup2; complex-structure modulus. One new lemma,
<code>frickeW_smul_coe</code> (W<sub>N</sub>&middot;&tau; = &minus;1/(N&tau;) in closed form), is
proved, sorry-free, and certified non-vacuous by a negative control against four
independently-computed wrong right-hand sides. The bridge theorem itself was found, on adversarial
review, to be a relabelling of three already-proved lemmas with no added content, and to cite a
physics reference (Giveon&ndash;Porrati&ndash;Rabinovici) that only supports level N=1; it remains
<code>sorry</code> under an inverted axiom-guard tripwire and is reported as an open, actively
contested question rather than closed as a theorem. The correct physical home for a level-N
Fricke-type map is argued to be Persson&ndash;Volpato's S-duality on the heterotic axio-dilaton in
CHL orbifold models &mdash; a different modulus and duality than the one this attempt targeted. A
note on method, grounded in Tao's <em>Mathematics in the age of AI</em> (arXiv:2608.16753) and the
Leiden Declaration on Artificial Intelligence and Mathematics, discloses the neuro-symbolic,
AI-assisted methodology and states the author's responsibility for every claim in the paper.</p>

<p><strong>Results formalized:</strong> W<sub>N</sub> &isin; GL(2,&#8477;)<sup>+</sup>;
W<sub>N</sub><sup>2</sup> = &minus;N&middot;I; the conjugation W&gamma;W<sup>&minus;1</sup> &isin;
&Gamma;<sub>0</sub>(N); the induced operators on <code>SlashInvariantForm</code> and on bundled
<code>ModularForm</code>; and the composite law (f|W)|W = (&minus;1)<sup>k</sup>
N<sup>k&minus;2</sup> f.</p>

<p><strong>No priority is claimed.</strong> An earlier draft claimed this was the first Lean 4
formalization of the Fricke involution. That claim was refuted during audit and withdrawn:
<code>anthropics/fermats-last-theorem</code>, cited by the paper itself, already contains Fricke and
Atkin&ndash;Lehner material in Lean 4, including <code>atkinLehnerLin</code>, a &#8450;-linear
operator on <code>ModularForm</code> for the whole Atkin&ndash;Lehner family. What is deposited here
is an independent, Mathlib-idiomatic treatment with an explicit axiom-audit discipline. The internal
review verdict was REJECT as a standalone venue submission; the recommended path for the material is
a Mathlib pull request. This deposit is an archival record, not a submission.</p>

<p><strong>Reproduction caveat (fixed in v4):</strong> the build configuration is now fully
portable: <code>lakefile.lean</code> requires Mathlib from git at the pinned revision above, and
<code>lean-toolchain</code> matches it. <code>git clone</code>, <code>lake exe cache get</code>,
<code>lake build SocrateAI</code> reproduces the artifact; see <code>BUILDING.md</code>. Earlier
versions of this deposit's paper stated that the configuration was not distributed; that was true,
and is now fixed.</p>

<p><strong>Langues / Languages:</strong> the deposit contains the note in English
(<code>Lean4_Fricke_Involution.pdf</code>) and in French
(<code>Lean4_Involution_Fricke_FR.pdf</code>, deposited on HAL). The two have the same
mathematical content; the English version governs the formal statements, whose Lean identifiers are
untranslated.</p>

<p>Sources: <a href="https://github.com/xaviercallens/SocrateAI-Lean-Lib">SocrateAI-Lean-Lib</a>
(release <code>fricke-v1</code>) and
<a href="https://github.com/xaviercallens/SocrateAI-Scientific-Communication">SocrateAI-Scientific-Communication</a>
(release <code>v1.0</code>). Mirrored at
<a href="https://huggingface.co/datasets/callensxavier/socrateai-fricke-involution">HuggingFace</a>.</p>
"""

METADATA = {
    "metadata": {
        "upload_type": "publication",
        "publication_type": "preprint",
        "title": ("A Mathlib-Idiomatic Formalization of the Fricke Involution "
                  "and its Operator on Modular Forms"),
        "creators": [{"name": "Callens, Xavier"}],
        "description": DESCRIPTION.strip(),
        "access_right": "open",
        "license": "apache-2.0",
        "keywords": [
            "Lean 4", "Mathlib", "formal verification", "interactive theorem proving",
            "modular forms", "Fricke involution", "Atkin-Lehner", "congruence subgroups",
            "number theory",
        ],
        "related_identifiers": [
            {"identifier": "https://github.com/xaviercallens/SocrateAI-Lean-Lib/releases/tag/fricke-v1",
             "relation": "isSupplementTo", "scheme": "url"},
            {"identifier": "https://huggingface.co/datasets/callensxavier/socrateai-fricke-involution",
             "relation": "isIdenticalTo", "scheme": "url"},
        ],
        "notes": ("No priority is claimed; see PRIOR_ART_FINDING.md. Archival deposit, "
                  "not a venue submission."),
    }
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--publish", action="store_true",
                    help="mint the DOI — IRREVERSIBLE, a published Zenodo record cannot be withdrawn. "
                         "Requires --deposition: publishing must target the draft that was reviewed.")
    ap.add_argument("--deposition", type=int, metavar="ID",
                    help="act on this existing draft instead of creating a new one")
    ap.add_argument("--newversion", type=int, metavar="PUBLISHED_ID",
                    help="publish a new version of an already-published record (identified by its "
                         "own record id, not the concept id) under the same concept DOI. Uploads "
                         "FILES, bumps the version label, and publishes in one step — IRREVERSIBLE.")
    ap.add_argument("--version-label", default=None, help="version label for --newversion, e.g. v4")
    ap.add_argument("--sandbox", action="store_true", help="use sandbox.zenodo.org")
    args = ap.parse_args()

    if args.newversion:
        if not args.version_label:
            sys.exit("--newversion requires --version-label (e.g. --version-label v4)")
        base = "https://sandbox.zenodo.org" if args.sandbox else "https://zenodo.org"
        token = get_token()
        missing = [f for f in FILES if not f.is_file()]
        if missing:
            sys.exit("Missing files:\n" + "\n".join(f"  {f}" for f in missing))
        newversion(
            base, token, args.newversion, FILES, args.version_label,
            note=f"{args.version_label}: adds the T-duality negative-result section and the "
                 "AI-disclosure note on method (Tao arXiv:2608.16753; Leiden Declaration).",
            desc_override=DESCRIPTION.strip(),
        )
        return

    # Guard against the failure this script actually caused on 2026-09-06: `--publish` with no
    # target created a SECOND deposition, uploaded to it, and minted a DOI for that one — leaving
    # the reviewed draft unpublished and the papers citing a reserved DOI that never resolved.
    # Publishing is irreversible, so it must name the deposition the human reviewed.
    if args.publish and not args.deposition:
        sys.exit(
            "Refusing to publish without --deposition.\n"
            "  Publishing creates a permanent DOI. Without an explicit id this script would create\n"
            "  a NEW deposition and publish that, not the draft you reviewed.\n"
            "  Run without --publish to stage a draft, review it, then:\n"
            f"      python3 {sys.argv[0]} --publish --deposition <id>"
        )

    base = "https://sandbox.zenodo.org" if args.sandbox else "https://zenodo.org"
    token = get_token()

    missing = [f for f in FILES if not f.is_file()]
    if missing:
        sys.exit("Missing files:\n" + "\n".join(f"  {f}" for f in missing))

    print(f"  target: {base}")

    if args.deposition:
        dep = call(base, token, "GET", f"/deposit/depositions/{args.deposition}")
        if dep.get("submitted"):
            sys.exit(f"Deposition {args.deposition} is already published. To change a published\n"
                     f"record's files you must create a new version:\n"
                     f"  POST /deposit/depositions/{args.deposition}/actions/newversion\n"
                     f"Cite the CONCEPT DOI in papers — it always resolves to the newest version.")
        dep_id = dep["id"]
        print(f"  using existing draft: {dep_id}")
    else:
        dep = call(base, token, "POST", "/deposit/depositions", payload={})
        dep_id = dep["id"]
        print(f"  created draft: {dep_id}")

    bucket = dep["links"]["bucket"]
    existing = {f["filename"]: f["id"] for f in dep.get("files", [])}

    for f in FILES:
        if f.name in existing:  # replace rather than silently skip
            call(base, token, "DELETE", f"/deposit/depositions/{dep_id}/files/{existing[f.name]}")
        call(base, token, "PUT", f"{bucket}/{f.name}",
             raw=f.read_bytes(), content_type="application/octet-stream")
        print(f"    uploaded {f.name} ({f.stat().st_size:,} bytes)")

    call(base, token, "PUT", f"/deposit/depositions/{dep_id}", payload=METADATA)
    print("  metadata set")

    if not args.publish:
        print(f"\nDRAFT READY (not published, no DOI minted yet).")
        print(f"Review it at: {base}/uploads/{dep_id}")
        print(f"To mint the DOI: python3 {sys.argv[0]} --publish --deposition {dep_id}")
        return

    out = call(base, token, "POST", f"/deposit/depositions/{dep_id}/actions/publish")
    print(f"\nPUBLISHED\n  version DOI: {out.get('doi')}\n"
          f"  concept DOI: {out.get('conceptdoi')}  <- cite this one\n"
          f"  URL: {out.get('links', {}).get('record_html')}")


if __name__ == "__main__":
    main()
