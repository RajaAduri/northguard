#!/usr/bin/env python3
"""Generate SHA256 checksums for all tracked project files.

Usage:
    python generate_checksums.py <project-root> [--output checksums.json]

Reads project.json for excluded patterns. Outputs checksums to manifests/checksums.json.
"""

import argparse
import hashlib
import json
import os
import fnmatch
from datetime import datetime, timezone

def load_excluded_patterns(project_root):
    config_path = os.path.join(project_root, "manifests", "checksums.json")
    try:
        with open(config_path) as f:
            data = json.load(f)
            return data.get("excluded_patterns", [])
    except (FileNotFoundError, json.JSONDecodeError):
        return ["node_modules/**", "dist/**", ".git/**", "*.lock", "__pycache__/**"]

def is_excluded(filepath, patterns, root):
    rel = os.path.relpath(filepath, root)
    for pat in patterns:
        if fnmatch.fnmatch(rel, pat):
            return True
        parts = rel.split(os.sep)
        for i in range(len(parts)):
            partial = os.sep.join(parts[:i+1])
            if fnmatch.fnmatch(partial, pat.rstrip("/**")):
                return True
    return False

def sha256_file(filepath):
    h = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except (PermissionError, OSError):
        return None

def generate_checksums(project_root, output_path=None):
    excluded = load_excluded_patterns(project_root)
    src_dir = os.path.join(project_root, "src")

    if not os.path.isdir(src_dir):
        print(f"⚠ No src/ directory found at {src_dir}. Scanning project root instead.")
        src_dir = project_root

    checksums = {}
    skipped = 0

    for dirpath, dirnames, filenames in os.walk(src_dir):
        dirnames[:] = [d for d in dirnames if not is_excluded(os.path.join(dirpath, d), excluded, project_root)]
        for filename in sorted(filenames):
            filepath = os.path.join(dirpath, filename)
            if is_excluded(filepath, excluded, project_root):
                skipped += 1
                continue
            rel = os.path.relpath(filepath, project_root)
            digest = sha256_file(filepath)
            if digest:
                checksums[rel] = digest

    result = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "algorithm": "sha256",
        "files": checksums,
        "total_files": len(checksums),
        "skipped_files": skipped,
        "excluded_patterns": excluded
    }

    if output_path is None:
        output_path = os.path.join(project_root, "manifests", "checksums.json")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"✅ Checksums generated: {len(checksums)} files tracked, {skipped} excluded")
    print(f"   Output: {output_path}")
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate SHA256 checksums for project files")
    parser.add_argument("project_root", help="Project root directory")
    parser.add_argument("--output", default=None, help="Output path (default: manifests/checksums.json)")
    args = parser.parse_args()
    generate_checksums(args.project_root, args.output)
