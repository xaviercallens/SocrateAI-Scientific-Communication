#!/usr/bin/env python3
"""The pre-publication gate. One command that mechanically enforces the checkable lessons in LL.md.

    python3 scripts/paper_gate.py docs/Lean4_EtaQuotients_DRAFT.tex [--no-build]

Exit 0 = every gate green. Exit 1 = at least one gate failed; nothing should be published.
Each check names the lesson it enforces. Measurements are recomputed HERE, at gate time, from the
artifact — never copied forward from a previous run (LL-22).
"""
import argparse, glob, json, pathlib, re, subprocess, sys, unicodedata

LEAN = pathlib.Path("/home/xavkal/xdev/SocrateAI-Lean-Lib")
MATHLIB = pathlib.Path("/home/xavkal/xdev/SocrateAI-Scientific-Measure/lean/.lake/packages/mathlib/Mathlib")
MF = LEAN / "Lean/SocrateAI/ModularForms"
# EXPLICIT file lists, not globs (LL-35 root cause: a glob like "EtaQuotient*.lean" silently
# absorbs any future file with that prefix — e.g. EtaQuotientFrickeSelfDual.lean, whose content
# belongs to a DIFFERENT paper's own module count — inflating an unrelated paper's claim the
# moment such a file is added. A paper's own "N declarations in M lines" claim is about a FIXED
# set of files named in its own Artifact section; that set only grows when a human edits it here).
ETA_MODULES = [str(MF / f) for f in
    ["EtaQuotient.lean", "EtaQuotientCuspOrder.lean", "EtaQuotientCuspTheta.lean",
     "EtaQuotientModularity.lean", "EtaQuotientPrimeLevel.lean"]]
FRICKE_MODULES = [str(MF / f) for f in
    ["FrickeInvolution.lean", "FrickeSlash.lean", "FrickeModular.lean", "FrickeComposite.lean"]]
SELFDUAL_MODULES = [str(MF / "EtaQuotientFrickeSelfDual.lean")]
# Which artifact modules a paper's "N declarations in M lines" claim is about, keyed by tex stem
# prefix (LL-30-style drift already bit us once: this used to be ETA_MODULES unconditionally).
MODULES_BY_STEM = {
    "Lean4_EtaQuotients_DRAFT": ETA_MODULES,
    "Lean4_Fricke_Involution": FRICKE_MODULES,
    "Lean4_Involution_Fricke_FR": FRICKE_MODULES,
    "Lean4_FrickeSelfDual_EtaQuotients": SELFDUAL_MODULES,
    "Lean4_FrickeSelfDual_EtaQuotients_FR": SELFDUAL_MODULES,
}
# Whole-library axioms that are KNOWN, disclosed in the paper, and provably unused (LL-22 rule 3).
AXIOM_ALLOWLIST = {f"physics_postulate_{i}" for i in range(1, 7)}

FAIL = []
def gate(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))
    if not ok: FAIL.append(name)

def sh(cmd, timeout=1200, cwd=None):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, cwd=cwd)

def strip_lean_comments(src: str) -> str:
    src = re.sub(r"/-.*?-/", "", src, flags=re.S)         # block comments & docstrings
    src = re.sub(r"--.*", "", src)                          # line comments
    return src

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tex")
    ap.add_argument("--no-build", action="store_true", help="skip the lake build (quick mode)")
    a = ap.parse_args()
    tex_path = pathlib.Path(a.tex)
    tex = tex_path.read_text(encoding="utf-8")
    pdf_path = tex_path.with_suffix(".pdf")
    log_path = tex_path.with_suffix(".log")
    pdf = sh(f"pdftotext {pdf_path} -").stdout

    print(f"== paper_gate: {tex_path.name} ==")

    # ---------- artifact gates ----------------------------------------------------------------
    jobs = None
    if not a.no_build:
        pg = sh("pgrep -x lake")                                              # LL-12
        gate("no concurrent lake build (LL-12)", pg.returncode != 0)
        dg = sh(f"python3 {pathlib.Path(__file__).parent / 'disk_guard.py'} --path {LEAN}")  # LL-26
        gate("disk headroom before build (LL-26)", dg.returncode == 0, dg.stdout.strip().splitlines()[-1] if dg.stdout else "")
        pkgs = "--packages=local-packages.json" if (LEAN / "local-packages.json").exists() else ""
        b = sh(f'env PATH="$HOME/.elan/bin:$PATH" lake build SocrateAI {pkgs}', cwd=LEAN)
        m = re.search(r"Build completed successfully \((\d+) jobs\)", b.stdout + b.stderr)
        jobs = int(m.group(1)) if m else None
        gate("lake build green (LL-1)", m is not None, f"{jobs} jobs" if jobs else (b.stdout + b.stderr).strip()[-120:])

    lean_srcs = {f: open(f, encoding="utf-8").read()
                 for f in glob.glob(str(LEAN / "Lean/SocrateAI/**/*.lean"), recursive=True)}
    all_lines = [l.rstrip() for s in lean_srcs.values() for l in s.split("\n")]
    srcset = {l.strip() for l in all_lines if l.strip()}
    joined = "\n".join(all_lines)

    # Real sorries, comments stripped. POLICY (set 2026-09-08, LL-23): a `sorry` is not
    # automatically a failure. This project's convention is "a sorry with -- OPEN: is the unit of
    # remaining work" (LL-1), disclosed via a DAG open/blocked node AND an INVERTED FinalCheck
    # axiom guard (one whose expected footprint contains `sorryAx`) naming that declaration.
    # A sorry with BOTH is disclosed and does not fail the gate; a sorry with NEITHER is hidden
    # and fails it — that is the actual integrity property worth enforcing, tighter than a blanket
    # "zero sorries" rule that this project's own honesty discipline (LL-1/LL-21) contradicts.
    decl_re = re.compile(
        r"^\s*(?:@\[[^\]]*\]\s*)?(?:private |protected |noncomputable )*"
        r"(?:theorem|lemma)\s+([A-Za-z0-9_.']+)")
    sorries = []          # (file, line, owning_decl_name_or_None)
    for f, s in lean_srcs.items():
        stripped = strip_lean_comments(s)
        cur_decl = None
        for i, l in enumerate(stripped.split("\n"), 1):
            m = decl_re.match(l)
            if m: cur_decl = m.group(1)
            if re.search(r"(^|[^\w'])sorry([^\w']|$)", l):
                sorries.append((f, i, cur_decl))

    inverted_tripwire_names = set()
    for f, s in lean_srcs.items():
        for m in re.finditer(r"/--\s*info:\s*(.*?)-/\s*#guard_msgs\s+in\s+#print\s+axioms\s+([A-Za-z0-9_.']+)",
                              s, re.S):
            info, name = m.group(1), m.group(2)
            if "sorryAx" in " ".join(info.split()):
                inverted_tripwire_names.add(name.split(".")[-1])

    undisclosed = [(f, i, d) for f, i, d in sorries
                   if not d or d.split(".")[-1] not in inverted_tripwire_names]
    gate("no UNDISCLOSED sorries (LL-23 policy)", not undisclosed,
         f"{len(sorries)} total sorries, {len(sorries)-len(undisclosed)} disclosed via inverted "
         f"tripwire, {len(undisclosed)} undisclosed: "
         + ", ".join(f"{pathlib.Path(f).name}:{i} ({d})" for f, i, d in undisclosed[:4]))

    # whole-library axiom scan against the allowlist (LL-22 rule 3)
    ax = re.findall(r"^\s*axiom\s+([A-Za-z0-9_.']+)", "\n".join(strip_lean_comments(s) for s in lean_srcs.values()), re.M)
    unexpected = [x for x in ax if x not in AXIOM_ALLOWLIST]
    gate("no undisclosed axioms (LL-22)", not unexpected,
         f"{len(ax)} total, allowlisted {len(ax)-len(unexpected)}" + (f", NEW: {unexpected}" if unexpected else ""))

    # guard footprints, multiline-aware (LL-22 rule 2 — the '370' failure)
    fc = lean_srcs[str(LEAN / "Lean/SocrateAI/FinalCheck.lean")]
    infos = re.findall(r"/--\s*info:\s*(.*?)-/\s*#guard_msgs", fc, re.S)
    guards = fc.count("#guard_msgs")
    names = set(re.findall(r"#print axioms ([A-Za-z0-9_.']+)", fc))
    STD = {"propext", "Classical.choice", "Quot.sound"}
    std = smaller = axfree = inverted = other = 0
    for s in infos:
        s = " ".join(s.split())
        if "does not depend on any axiom" in s: axfree += 1
        else:
            m = re.search(r"depends on axioms:\s*\[([^\]]*)\]", s)
            if not m: other += 1
            else:
                fp = {x.strip() for x in m.group(1).split(",")}
                if fp == STD: std += 1
                elif fp < STD: smaller += 1
                elif "sorryAx" in fp and fp - {"sorryAx"} <= STD: inverted += 1  # disclosed sorry
                else: other += 1
    gate("axiom guards parse fully", other == 0 and len(infos) >= 380,
         f"{guards} guards, {len(names)} distinct, split std={std}/smaller={smaller}/"
         f"axiom-free={axfree}/inverted-tripwire={inverted}")
    gate("no UNEXPECTED footprint (beyond std axioms, or a disclosed sorryAx tripwire)", other == 0)

    # negative controls must FAIL, FOR THE RIGHT REASON (guards are load-bearing).
    # NB, corrected twice now (LL-27, then LL-32): `--packages` is a GLOBAL lake flag and belongs
    # BEFORE the subcommand — `lake --packages=X env lean FILE` — not after `lean` (rejected by
    # `lean` itself, exit 1 on the unrecognised flag) and not omitted (rejected by `lake env`
    # itself, "object file ... does not exist", ALSO exit 1). Both wrong forms produce exit 1 for
    # an environment reason having nothing to do with the file's content, so a bare exit-code
    # check reports every negative control as "fails correctly" even when it is checking nothing.
    # A second-order LL-16: verify the failure MESSAGE, not just the exit code, or a check can
    # look green under three different invocations while never once examining what it claims to.
    pkgs_flag = "--packages=local-packages.json " if (LEAN / "local-packages.json").exists() else ""
    for nc in sorted(glob.glob(str(LEAN / "verification/*.lean"))):
        r = sh(f'env PATH="$HOME/.elan/bin:$PATH" lake {pkgs_flag}env lean {nc}', cwd=LEAN, timeout=600)
        out = r.stdout + r.stderr
        env_error = "does not exist" in out and "object file" in out
        real_guard_failure = r.returncode != 0 and not env_error
        gate(f"negative control fails: {pathlib.Path(nc).name}", real_guard_failure,
             "" if real_guard_failure else
             ("ENVIRONMENT ERROR, not a guard failure — the check ran but examined nothing: " + out[-200:]
              if env_error else f"SUSPICIOUS: exit {r.returncode}"))

    dag = sh(f"python3 {LEAN}/dag/check_dag.py")
    gate("DAG validator (LL-2)", "PASS" in dag.stdout, dag.stdout.strip().split("\n")[0][:80])

    # ---------- paper gates -------------------------------------------------------------------
    log = log_path.read_text(errors="ignore") if log_path.exists() else ""
    gate("0 fatal LaTeX errors", log.count("\n! ") == 0 and not log.startswith("! "))
    gate("0 undefined references", not re.search(r"(Reference|Citation) .* undefined", log))
    over = [float(x) for x in re.findall(r"Overfull \\hbox \(([0-9.]+)pt", log)]
    gate("no overfull hbox > 10pt (LL-16)", not [x for x in over if x > 10],
         f"worst {max(over):.1f}pt" if over else "none")

    # code fidelity, both directions (LL-16 gate)
    blocks = re.findall(r"\\begin\{Verbatim\}\[[^\]]*\]\n(.*?)\\end\{Verbatim\}", tex, re.S)
    tot = in_pdf = in_src = 0; bad = []
    for bl in blocks:
        for line in bl.split("\n"):
            s = line.strip()
            if not s: continue
            tot += 1
            if s in pdf: in_pdf += 1
            else: bad.append("PDF: " + s[:70])
            if s in srcset: in_src += 1
            else: bad.append("SRC: " + s[:70])
    gate("code verbatim in rendered PDF", in_pdf == tot, f"{in_pdf}/{tot}")
    gate("code verbatim in Lean source", in_src == tot, f"{in_src}/{tot}" + ("; " + bad[0] if bad else ""))

    # every \lean{} name resolves (LL-2 / LL-5); externals declared via '% lean-external:' comments
    declared_ext = set()
    for m in re.findall(r"^%\s*lean-external:\s*(.+)$", tex, re.M):
        declared_ext |= set(m.split())
    cited = set(re.findall(r"\\lean\{([A-Za-z][A-Za-z0-9_./*]*)\}", tex))
    unresolved = []
    for n in sorted(cited - declared_ext):
        base = n.split("/")[-1].split(".")[0] if "/" in n else n.split(".")[-1]
        base = base.rstrip("*")
        if not base or re.search(r"(^|[^\w'])" + re.escape(base) + r"([^\w']|$)", joined): continue
        if subprocess.run(["grep", "-rqi", base, str(MATHLIB)], capture_output=True).returncode == 0: continue
        unresolved.append(n)
    gate("every cited Lean name resolves (LL-5, grep -ri per LL-20)", not unresolved, str(unresolved[:4]))

    # numeric claims recomputed at gate time (LL-22 rule 2)
    modules = MODULES_BY_STEM.get(tex_path.stem, ETA_MODULES)
    mod_lines = sum(len(open(f, encoding="utf-8").read().split("\n")) - 1 for f in modules)
    decl_re = re.compile(r"^\s*(@\[[^\]]*\]\s*)?(private |protected |noncomputable )*(theorem|lemma|def|abbrev|instance) ", re.M)
    mod_decls = sum(len(decl_re.findall(open(f, encoding="utf-8").read())) for f in modules)
    dagj = [json.loads(l) for l in open(LEAN / "dag/theorems.jsonl") if l.strip() and not l.startswith("#")]
    computed = {
        "declarations": mod_decls, "module lines": mod_lines,
        "guards": guards, "distinct guarded": len(names),
        "std-axiom guards": std, "DAG nodes": len(dagj),
        "DAG proved": sum(1 for d in dagj if d["status"] == "proved"),
    }
    if jobs: computed["build jobs"] = jobs
    # Each computed key may be asserted in EN or FR phrasing; a paper need not make every claim
    # type (e.g. Fricke has no DAG-node or distinct-theorems claim) — absence is a skip, not a
    # fail, but a claim that IS present must match the recomputed artifact number exactly.
    claims = {  # regex in the paper -> computed key
        r"(\d+) declarations in (\d+) lines": ("declarations", "module lines"),
        r"(\d+) d[ée]clarations en (\d+) lignes": ("declarations", "module lines"),
        r"completes in (\d+) jobs": ("build jobs",),
        r"s'ach[èe]ve en (\d+) t[âa]ches": ("build jobs",),
        r"(\d+) \\texttt\{\\#guard\\_msgs": ("guards",),
        r"(\d+) distinct theorems": ("distinct guarded",),
        r"(\d+) report exactly": ("std-axiom guards",),
        r"(\d+) nodes, (\d+) proved": ("DAG nodes", "DAG proved"),
        r"(\d+) n(?:\\oe\{\}|œ)uds,\s+(\d+)\s+d[ée]montr[ée]s": ("DAG nodes", "DAG proved"),
    }
    for pat, keys in claims.items():
        m = re.search(pat, tex)
        if not m:
            continue  # this paper makes no such claim — nothing to check
        vals = [int(g) for g in m.groups()]
        want = [computed[k] for k in keys if k in computed]
        if len(want) < len(keys): continue  # e.g. --no-build: jobs unknown, skip silently
        gate(f"number check «{pat[:34]}»", vals == want, f"paper {vals} vs artifact {want}")

    # secret scan on the shipped pair (run-2 practice)
    leak = sh(f"grep -lIE 'ghp_[A-Za-z0-9]{{20}}|hf_[A-Za-z0-9]{{20}}|BEGIN.*PRIVATE KEY' {tex_path} {pdf_path} 2>/dev/null")
    gate("no secrets in shipped files", leak.returncode != 0)

    # status honesty: an unreviewed deposit must say so on page 1 (run-2/3 practice)
    p1 = sh(f"pdftotext -f 1 -l 1 {pdf_path} -").stdout
    gate("page 1 declares review status", "not been peer reviewed" in p1 or "peer review" in p1
         or "relecture par les pairs" in p1)

    print(f"\n{'ALL GATES GREEN — publishable.' if not FAIL else 'FAILED: ' + ', '.join(FAIL)}")
    sys.exit(1 if FAIL else 0)

main()
