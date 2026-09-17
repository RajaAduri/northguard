#!/usr/bin/env python3
"""Verify a coding session against a change manifest.

Compares current file state against pre-session checksums and the manifest
to detect expected changes, unexpected modifications, and missing changes.

Usage:
    python verify_session.py <project-root> --manifest US-042 [--baseline checksums-pre.json]
"""

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone

def sha256_file(filepath):
    h = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except (PermissionError, OSError, FileNotFoundError):
        return None

def load_json(path):
    with open(path) as f:
        return json.load(f)

def verify_session(project_root, manifest_id, baseline_path=None):
    manifest_path = os.path.join(project_root, "manifests", f"{manifest_id}.manifest.json")
    if not os.path.exists(manifest_path):
        print(f"❌ Manifest not found: {manifest_path}")
        return None

    manifest = load_json(manifest_path)

    if baseline_path is None:
        baseline_path = os.path.join(project_root, "manifests", "checksums.json")
    baseline = load_json(baseline_path)
    baseline_files = baseline.get("files", {})

    report = {
        "session_end": datetime.now(timezone.utc).isoformat(),
        "manifest": manifest_id,
        "baseline_generated": baseline.get("generated"),
        "expected_changes": [],
        "expected_creations": [],
        "unexpected_changes": [],
        "missing_changes": [],
        "protected_violations": [],
        "verdict": "PASS"
    }

    # Check files that SHOULD be modified
    for item in manifest.get("modify", []):
        fpath = item["file"]
        full_path = os.path.join(project_root, fpath)
        old_hash = baseline_files.get(fpath)
        new_hash = sha256_file(full_path)

        if new_hash is None:
            report["missing_changes"].append({
                "file": fpath, "status": "FILE_NOT_FOUND",
                "severity": "HIGH", "reason": f"Expected modification but file doesn't exist"
            })
        elif old_hash and new_hash == old_hash:
            report["missing_changes"].append({
                "file": fpath, "status": "NOT_MODIFIED",
                "severity": "MEDIUM", "reason": item.get("reason", "Expected modification but file unchanged")
            })
        else:
            report["expected_changes"].append({
                "file": fpath, "status": "MODIFIED_AS_EXPECTED",
                "checksum_before": old_hash, "checksum_after": new_hash
            })

    # Check files that SHOULD be created
    for item in manifest.get("create", []):
        fpath = item["file"]
        full_path = os.path.join(project_root, fpath)
        if os.path.exists(full_path):
            report["expected_creations"].append({
                "file": fpath, "status": "CREATED_AS_EXPECTED",
                "checksum": sha256_file(full_path)
            })
        else:
            report["missing_changes"].append({
                "file": fpath, "status": "NOT_CREATED",
                "severity": "HIGH", "reason": item.get("reason", "Expected creation but file missing")
            })

    # Check PROTECTED files
    for item in manifest.get("protected", []):
        fpath = item["file"]
        full_path = os.path.join(project_root, fpath)
        old_hash = baseline_files.get(fpath)
        new_hash = sha256_file(full_path)

        if old_hash and new_hash and new_hash != old_hash:
            report["protected_violations"].append({
                "file": fpath, "status": "MODIFIED_UNEXPECTEDLY",
                "severity": "HIGH",
                "reason": item.get("reason", "Protected file was modified — possible LLM collateral damage"),
                "checksum_before": old_hash, "checksum_after": new_hash
            })

    # Check ALL baseline files for unexpected changes (not in modify/create/protected lists)
    manifest_files = set()
    for lst in ["modify", "create", "protected"]:
        for item in manifest.get(lst, []):
            manifest_files.add(item["file"])

    for fpath, old_hash in baseline_files.items():
        if fpath in manifest_files:
            continue
        full_path = os.path.join(project_root, fpath)
        new_hash = sha256_file(full_path)
        if new_hash and new_hash != old_hash:
            report["unexpected_changes"].append({
                "file": fpath, "status": "MODIFIED_UNEXPECTEDLY",
                "severity": "MEDIUM",
                "reason": "File not in manifest but was modified during session",
                "checksum_before": old_hash, "checksum_after": new_hash
            })

    # Determine verdict
    if report["protected_violations"]:
        report["verdict"] = "FAIL"
    elif report["unexpected_changes"] or report["missing_changes"]:
        report["verdict"] = "WARNING"
    else:
        report["verdict"] = "PASS"

    # Summary
    report["summary"] = {
        "expected_modified": len(report["expected_changes"]),
        "expected_created": len(report["expected_creations"]),
        "unexpected_modified": len(report["unexpected_changes"]),
        "missing_modifications": len(report["missing_changes"]),
        "protected_violated": len(report["protected_violations"]),
        "total_baseline_files": len(baseline_files)
    }

    # Output
    output_path = os.path.join(project_root, "manifests",
        f"session-{manifest_id}-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json")
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)

    # Console output
    v = report["verdict"]
    icon = {"PASS": "✅", "WARNING": "⚠️", "FAIL": "❌"}.get(v, "❓")
    print(f"\n{icon} Session Verification: {v}")
    print(f"   Manifest: {manifest_id}")
    s = report["summary"]
    print(f"   Expected changes:     {s['expected_modified']} modified, {s['expected_created']} created")
    if s["unexpected_modified"]:
        print(f"   ⚠️  Unexpected changes: {s['unexpected_modified']} files")
        for item in report["unexpected_changes"]:
            print(f"       → {item['file']}")
    if s["protected_violated"]:
        print(f"   ❌ Protected violated:  {s['protected_violated']} files")
        for item in report["protected_violations"]:
            print(f"       → {item['file']}")
    if s["missing_modifications"]:
        print(f"   ⚠️  Missing changes:    {s['missing_modifications']} files")
        for item in report["missing_changes"]:
            print(f"       → {item['file']} ({item['status']})")
    print(f"\n   Report saved: {output_path}")
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify coding session against change manifest")
    parser.add_argument("project_root", help="Project root directory")
    parser.add_argument("--manifest", required=True, help="Manifest ID (e.g., US-042)")
    parser.add_argument("--baseline", default=None, help="Baseline checksums file")
    args = parser.parse_args()
    verify_session(args.project_root, args.manifest, args.baseline)
