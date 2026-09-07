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
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

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
    LEAN / "Lean/SocrateAI/FinalCheck.lean",
    LEAN / "dag/theorems.jsonl",
    LEAN / "dag/PROOF-PATH.md",
]

DESCRIPTION = """
<p>Machine-checked Lean 4 formalization of the Fricke involution
<em>W<sub>N</sub></em> = [[0, -1], [N, 0]] on the congruence subgroup
&Gamma;<sub>0</sub>(N), and of the operator it induces on modular forms.</p>

<p><strong>Verified:</strong> <code>lake build SocrateAI</code> &rarr; 3053 jobs, 0 errors,
0 <code>sorry</code>, against Lean 4.32.2 and Mathlib <code>905b9581</code>. Sixteen headline
theorems are pinned by build-failing <code>#guard_msgs in #print axioms</code> guards, each with
footprint exactly <code>[propext, Classical.choice, Quot.sound]</code>; a deliberately-wrong
negative control was verified to fail, establishing that the guards are load-bearing.</p>

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

<p><strong>Reproduction caveat:</strong> the build configuration (<code>lakefile.lean</code>,
<code>lake-manifest.json</code>, <code>lean-toolchain</code>) is excluded because it hard-codes
absolute paths to a local Mathlib package pool. The artifact is not yet build-reproducible by a
third party; a portable lakefile pinning Mathlib by git revision is outstanding work.</p>

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


def get_token() -> str:
    for var in ("ZENODO_TOKEN", "ZENODO_API_TOKEN", "ZENODO_ACCESS_TOKEN"):
        val = os.environ.get(var)
        if val:
            print(f"  token source: ${var}")
            return val.strip()
    path = pathlib.Path.home() / ".config" / "zenodo" / "token"
    if path.is_file():
        print(f"  token source: {path}")
        return path.read_text().strip()
    sys.exit(
        "No Zenodo token found. Provide it one of these ways:\n"
        "  export ZENODO_TOKEN=...           (must be set before the agent session starts)\n"
        "  mkdir -p ~/.config/zenodo && echo '<token>' > ~/.config/zenodo/token && chmod 600 ~/.config/zenodo/token\n"
        "Create one at https://zenodo.org/account/settings/applications/tokens/new/\n"
        "with scopes: deposit:write, deposit:actions"
    )


def call(base, token, method, path, payload=None, raw=None, content_type=None):
    url = path if path.startswith("http") else f"{base}/api{path}"
    sep = "&" if "?" in url else "?"
    url = f"{url}{sep}access_token={token}"
    headers = {"Content-Type": content_type or "application/json"}
    # NB: `payload` may legitimately be `{}` (creating an empty deposition). Test against None,
    # not truthiness — an empty body with a JSON content-type makes Zenodo return HTTP 500.
    data = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            body = r.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:800]
        # never echo the URL: it carries the token
        sys.exit(f"Zenodo {method} {path} failed: HTTP {e.code}\n{detail}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--publish", action="store_true",
                    help="mint the DOI — IRREVERSIBLE, a published Zenodo record cannot be withdrawn. "
                         "Requires --deposition: publishing must target the draft that was reviewed.")
    ap.add_argument("--deposition", type=int, metavar="ID",
                    help="act on this existing draft instead of creating a new one")
    ap.add_argument("--sandbox", action="store_true", help="use sandbox.zenodo.org")
    args = ap.parse_args()

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
