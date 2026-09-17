#!/bin/bash
# Dev Blueprint — Stop Hook: Session Verification
# Runs when Claude Code finishes responding (Stop event).
# Executes manifest verification + full test suite.
# Exit code 0 always (results are informational).

echo "═══════════════════════════════════════════════"
echo "  DEV BLUEPRINT — SESSION VERIFICATION"
echo "═══════════════════════════════════════════════"

MANIFEST_FILE=".claude/active-manifest.json"
CHECKSUMS_FILE="manifests/checksums.json"

# --- Step 1: Manifest Verification ---
if [ -f "$MANIFEST_FILE" ] && [ -f "$CHECKSUMS_FILE" ]; then
  MANIFEST_ID=$(jq -r '.id // "unknown"' "$MANIFEST_FILE" 2>/dev/null)
  echo ""
  echo "▶ Running manifest verification for $MANIFEST_ID..."
  echo ""

  if [ -f "scripts/verify_session.py" ]; then
    python scripts/verify_session.py --manifest "$MANIFEST_ID" --baseline "$CHECKSUMS_FILE" 2>&1
  else
    echo "  ⚠ verify_session.py not found — skipping manifest check"
  fi
else
  echo ""
  echo "  ℹ No active manifest or checksums found — skipping manifest verification"
  echo "    To enable: cp manifests/US-XXX.manifest.json .claude/active-manifest.json"
fi

# --- Step 2: Full Test Suite ---
echo ""
echo "▶ Running full test suite..."
echo ""

if [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
  npx vitest run --reporter=verbose 2>&1 | tail -40
elif [ -f "jest.config.ts" ] || [ -f "jest.config.js" ]; then
  npx jest --verbose --no-coverage 2>&1 | tail -40
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  python -m pytest -v --tb=short 2>&1 | tail -40
elif [ -f "package.json" ]; then
  # Fallback: try npm test
  npm test 2>&1 | tail -40
else
  echo "  ⚠ No test runner detected"
fi

# --- Step 3: Git Status Summary ---
echo ""
echo "▶ Files changed in this session:"
echo ""
git diff --name-only HEAD 2>/dev/null || echo "  (not a git repo or no changes)"
git diff --cached --name-only 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════"
echo "  VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════"

exit 0
