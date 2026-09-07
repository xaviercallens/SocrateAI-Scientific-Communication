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
    DOCS / "Lean4_EtaQuotients_DRAFT.pdf",
    DOCS / "Lean4_EtaQuotients_DRAFT.tex",
    LEAN / "Lean/SocrateAI/ModularForms/EtaQuotient.lean",
    LEAN / "Lean/SocrateAI/ModularForms/EtaQuotientCuspOrder.lean",
    LEAN / "Lean/SocrateAI/ModularForms/EtaQuotientCuspTheta.lean",
    LEAN / "Lean/SocrateAI/ModularForms/EtaQuotientModularity.lean",
    LEAN / "Lean/SocrateAI/ModularForms/EtaQuotientPrimeLevel.lean",
    LEAN / "Lean/SocrateAI/FinalCheck.lean",
    LEAN / "dag/theorems.jsonl",
]

DESCRIPTION = """
<p><strong>PREPRINT &mdash; NOT PEER REVIEWED.</strong> The Lean development compiles and is
axiom-audited; those claims are machine-checked. The paper's exposition has had no external
referee.</p>

<p>Machine-checked Lean 4 formalization of the arithmetic and analytic layers of Ligozat's
criterion for eta-quotients f(z) = &prod;<sub>&delta;|N</sub> &eta;(&delta;z)<sup>r&delta;</sup>,
reporting three results at three different strengths.</p>

<p><strong>(i) General N.</strong> For every level N, every integer exponent vector r with
&Sigma; r<sub>&delta;</sub> = 2k, and <em>every</em> &gamma; &isin; SL(2,&#8484;) &mdash; with no
congruence condition and no &Gamma;<sub>0</sub>(N)-membership hypothesis &mdash; a two-sided
&Theta;-asymptotic for |(f|<sub>k</sub>&gamma;)(z)| along Im z &rarr; &infin;, with exponent
Ligozat's cusp-order expression. At the cusp &infin; the order is additionally identified in
Mathlib's own <code>meromorphicOrderAt</code> / <code>cuspFunction</code> language.</p>

<p><strong>(ii) Bounded.</strong> Ligozat's full transformation law
f(&gamma;z) = w(&gamma;)(cz+d)<sup>k</sup>f(z) on <em>all</em> of &Gamma;<sub>0</sub>(N), with the
character identified, for <strong>N &isin; {1,2,3,4,5,7,13}</strong> only &mdash; N &le; 4 by a
Euclidean descent, and the genus-zero primes 5, 7, 13 by a Schreier transversal criterion.</p>

<p><strong>(iii) Obstructed.</strong> Ligozat's criterion for general N is <strong>not
proved</strong>, and the obstruction is named exactly: the multiplier is
w(&gamma;) = exp((&pi;i/12)&middot;per(&gamma;)) where per is the period cocycle of the weight-two
quasi-modular combination &Sigma; r<sub>&delta;</sub>&delta;E<sub>2</sub>(&delta;z) &mdash; the
integration constant that both the logDeriv route and the 24th-power route erase. For a single
&eta; that period function <em>is</em> Rademacher's &Phi;, whose non-coboundary content is the
Dedekind sum s(d,|c|). Mathlib contains no Dedekind sums. The deposit names the minimal Mathlib
addition that would remove the obstruction, and argues &Phi; is best built as the period of
E<sub>2</sub> on the E2_slash_action machinery Mathlib already has.</p>

<p>The DAG node ETA-01 (the general criterion) remains <code>open</code> with
<code>lean_name: null</code>. This artifact does not claim it.</p>

<p><strong>Verification:</strong> <code>lake build SocrateAI</code> &rarr; 3462 jobs, 0 errors,
0 <code>sorry</code>. 519 declarations in 8117 lines. 391 build-failing
<code>#guard_msgs in #print axioms</code> guards over 389 distinct theorems; 370 report exactly
[propext, Classical.choice, Quot.sound]. A negative control asserting a deliberately wrong
footprint is verified to fail. Of 453 theorems, 14 (3%) have a one-line rfl/decide proof.</p>

<p><strong>Correction to our own specification:</strong> the cusp-order node was scoped with the
&Theta;-exponent written as Ligozat's ord(N,r,d). That statement is false &mdash; Ligozat's order
is taken in the local uniformiser at a cusp of width h = N/gcd(d&sup2;,N), so a decay statement in
Im z carries exponent ord/h. The corrected statement is what was proved.</p>

<p><strong>Reproduction caveat:</strong> the build configuration is not distributed
(<code>lakefile.lean</code> hard-codes absolute paths to a local Mathlib pool), so this artifact is
not yet buildable by a third party.</p>

<p>Mirror: <a href="https://huggingface.co/datasets/callensxavier/socrateai-eta-quotients">HuggingFace</a>.
Builds on the Fricke involution formalization, <a href="https://doi.org/10.5281/zenodo.22542571">10.5281/zenodo.22542571</a>.</p>
"""

METADATA = {
    "metadata": {
        "upload_type": "publication",
        "publication_type": "preprint",
        "title": ("Eta-Quotients in Lean 4: Cusp Orders at Every Cusp, Ligozat's Criterion "
                  "at Small Level, and a Named Obstruction at General Level"),
        "creators": [{"name": "Callens, Xavier"}],
        "description": DESCRIPTION.strip(),
        "access_right": "open",
        "license": "apache-2.0",
        "keywords": [
            "Lean 4", "Mathlib", "formal verification", "interactive theorem proving",
            "modular forms", "eta-quotients", "Dedekind eta", "Ligozat criterion",
            "Dedekind sums", "Rademacher Phi", "number theory",
        ],
        "related_identifiers": [
            {"identifier": "https://github.com/xaviercallens/SocrateAI-Lean-Lib",
             "relation": "isSupplementTo", "scheme": "url"},
            {"identifier": "https://huggingface.co/datasets/callensxavier/socrateai-eta-quotients",
             "relation": "isIdenticalTo", "scheme": "url"},
            {"identifier": "10.5281/zenodo.22542571",
             "relation": "isContinuedBy", "scheme": "doi"},
        ],
        "notes": ("PREPRINT, not peer reviewed. Ligozat's criterion is proved only for "
                  "N in {1,2,3,4,5,7,13}; the general case is OPEN behind a named obstruction "
                  "(Dedekind sums via Rademacher Phi). DAG node ETA-01 remains open."),
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
