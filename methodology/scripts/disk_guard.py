#!/usr/bin/env python3
"""disk_guard.py — pre-flight disk check for any Lean build or long-running workflow.

LL-26: `pgrep -x lake` catches a build already running, but not one that starts moments later and
runs unattended for the rest of a long session — that gap took a machine from comfortable headroom
to 100% full (209MB free) in ~8 minutes, undetected until a routine check found it by chance.

Usage:
    python3 scripts/disk_guard.py [--min-free-gb 2] [--path /home/xavkal/xdev/SocrateAI-Lean-Lib]
    python3 scripts/disk_guard.py --watch 60   # poll every 60s, print+exit 1 the moment it's breached

Exit 0 = enough headroom. Exit 1 = below threshold — do not start a build; find and stop whatever
is consuming it first (see LL-26: `ps aux | grep lake`, prefer SIGTERM, escalate to SIGKILL only if
needed, single minimally-scoped commands go through permission checks more reliably than chains).
"""
import argparse, shutil, subprocess, sys, time

def free_gb(path):
    return shutil.disk_usage(path).free / 1e9

def rogue_lake():
    r = subprocess.run(["pgrep", "-x", "lake"], capture_output=True, text=True)
    return r.stdout.split()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-free-gb", type=float, default=2.0)
    ap.add_argument("--path", default="/home/xavkal/xdev/SocrateAI-Lean-Lib")
    ap.add_argument("--watch", type=int, metavar="SECONDS", default=0,
                    help="poll forever at this interval instead of a single check")
    a = ap.parse_args()

    def check():
        g = free_gb(a.path)
        pids = rogue_lake()
        ok = g >= a.min_free_gb
        print(f"  disk free: {g:.2f} GB (threshold {a.min_free_gb} GB)  "
              f"lake running: {pids or 'none'}  -> {'OK' if ok else 'BREACH'}")
        return ok

    if a.watch:
        while True:
            if not check():
                sys.exit(1)
            time.sleep(a.watch)
    else:
        sys.exit(0 if check() else 1)

if __name__ == "__main__":
    main()
