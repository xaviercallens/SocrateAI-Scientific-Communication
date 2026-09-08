#!/usr/bin/env python3
"""zenodo_common.py — shared Zenodo API client for scripts/zenodo_deposit*.py.

Extracted 2026-09-08 after the retry/backoff fix (LL-24, hit twice: two separate 504s on a
`newversion` POST, on two separate deposit scripts) had to be written once and then risked
being forgotten in the sibling script. One implementation, imported by both, closes that gap
structurally instead of relying on remembering to copy a fix twice.

Never prints a token. `call()` retries transient failures (502/503/504, timeouts) on GET
requests automatically; for non-GET requests it raises `ZenodoAmbiguousFailure` instead of
retrying, because a non-GET call that timed out may have already succeeded server-side (this
happened twice in practice — see LL-24, LL-27). Callers MUST catch that exception and check
state via a GET before deciding whether to retry or resume; see zenodo_deposit.py's
`newversion()` for the pattern.
"""
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request


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


class ZenodoAmbiguousFailure(Exception):
    """Raised for a non-GET call that timed out or hit a 5xx: the request may have landed
    server-side even though we never saw the response (this happened twice in practice, both
    times as a plain 504 on a `newversion` POST — LL-24). NEVER blind-retry a non-GET call:
    catch this, list depositions (a safe GET) to check whether the action actually happened,
    and only then decide whether to retry or resume. See LL-24 and LL-27 (the two prior
    incidents this class of bug caused this programme)."""


def call(base, token, method, path, payload=None, raw=None, content_type=None,
         max_retries=4, backoff=8):
    url = path if path.startswith("http") else f"{base}/api{path}"
    sep = "&" if "?" in url else "?"
    url = f"{url}{sep}access_token={token}"
    headers = {"Content-Type": content_type or "application/json"}
    # NB: `payload` may legitimately be `{}` (creating an empty deposition). Test against None,
    # not truthiness — an empty body with a JSON content-type makes Zenodo return HTTP 500.
    data = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)

    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                body = r.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            if e.code in (502, 503, 504) and attempt < max_retries:
                wait = backoff * attempt
                print(f"  Zenodo {method} {path}: HTTP {e.code}, transient — "
                      f"retry {attempt}/{max_retries-1} in {wait}s"
                      + ("" if method == "GET" else
                         " (non-GET: verify state before trusting this retry — LL-24)"))
                time.sleep(wait)
                continue
            detail = e.read().decode()[:800]
            if e.code in (502, 503, 504) and method != "GET":
                raise ZenodoAmbiguousFailure(
                    f"{method} {path} -> HTTP {e.code} after {attempt} attempts. This call may "
                    f"have succeeded server-side despite the error. Do NOT retry blindly: list "
                    f"depositions (GET, safe) and check for the expected effect before deciding "
                    f"what to do next. Detail: {detail}")
            sys.exit(f"Zenodo {method} {path} failed: HTTP {e.code}\n{detail}")  # never echo url: has token
        except (TimeoutError, urllib.error.URLError) as e:
            if attempt < max_retries:
                wait = backoff * attempt
                print(f"  Zenodo {method} {path}: {e}, transient — retry {attempt}/{max_retries-1} in {wait}s")
                time.sleep(wait)
                continue
            if method != "GET":
                raise ZenodoAmbiguousFailure(
                    f"{method} {path} -> {e} after {attempt} attempts, ambiguous. Do NOT retry "
                    f"blindly: list depositions (GET, safe) and check for the expected effect.")
            sys.exit(f"Zenodo {method} {path} failed after {attempt} attempts: {e}")


def find_orphan_drafts(base, token, title_substring):
    """List unsubmitted depositions whose title contains `title_substring` — the safe first
    step after a ZenodoAmbiguousFailure on a newversion/create call (LL-24)."""
    rows = call(base, token, "GET", "/deposit/depositions?size=20")
    return [d for d in rows
            if not d.get("submitted") and title_substring.lower() in d["metadata"].get("title", "").lower()]


def newversion(base, token, published_id, files, version_label, note, desc_fix=None):
    """Create (or resume) a new version of a published record, upload `files`, set `version`
    and append `note` to the metadata notes, then publish. Resumes cleanly from a
    ZenodoAmbiguousFailure by finding the orphan draft `actions/newversion` already created
    server-side, rather than creating a second one."""
    try:
        nv = call(base, token, "POST", f"/deposit/depositions/{published_id}/actions/newversion")
        d = call(base, token, "GET", nv["links"]["latest_draft"].replace(f"{base}/api", ""))
    except ZenodoAmbiguousFailure as e:
        print(f"  {e}\n  Checking for an orphan draft before retrying...")
        parent = call(base, token, "GET", f"/deposit/depositions/{published_id}")
        orphans = find_orphan_drafts(base, token, parent["metadata"]["title"])
        if len(orphans) == 1:
            d = orphans[0]
            print(f"  found exactly one orphan draft ({d['id']}), resuming it — not creating another")
        elif len(orphans) > 1:
            sys.exit(f"  {len(orphans)} orphan drafts found — resolve manually, do not auto-pick one: "
                      + ", ".join(str(o["id"]) for o in orphans))
        else:
            print("  no orphan draft found — the newversion call genuinely did not land; retrying")
            nv = call(base, token, "POST", f"/deposit/depositions/{published_id}/actions/newversion")
            d = call(base, token, "GET", nv["links"]["latest_draft"].replace(f"{base}/api", ""))

    dep_id = d["id"]
    print("  draft:", dep_id)
    bucket = d["links"]["bucket"]
    existing = {f["filename"]: f["id"] for f in d.get("files", [])}
    for f in files:
        if f.name in existing:
            call(base, token, "DELETE", f"/deposit/depositions/{dep_id}/files/{existing[f.name]}")
        f_path = pathlib.Path(f)
        call(base, token, "PUT", f"{bucket}/{f_path.name}",
             raw=f_path.read_bytes(), content_type="application/octet-stream")
        print(f"    uploaded {f_path.name} ({f_path.stat().st_size:,} B)")

    md = call(base, token, "GET", f"/deposit/depositions/{dep_id}")["metadata"]
    md["version"] = version_label
    md["notes"] = (md.get("notes", "") + " " + note).strip()
    if desc_fix:
        for a, b in desc_fix:
            md["description"] = md["description"].replace(a, b)
    call(base, token, "PUT", f"/deposit/depositions/{dep_id}", payload={"metadata": md})
    print("  metadata set")

    out = call(base, token, "POST", f"/deposit/depositions/{dep_id}/actions/publish")
    print(f"  PUBLISHED {version_label}: {out.get('doi')}  (concept {out.get('conceptdoi')})")
    return out
