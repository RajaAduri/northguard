#!/bin/bash
# Dev Blueprint — PostToolUse Hook: Auto-Run Tests
# After any file edit/write, finds and runs the corresponding test file.
# Exit code 0 always (informational — test results feed back to Claude Code context).

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Skip if the edited file IS a test file (avoid infinite loops)
if [[ "$FILE_PATH" =~ \.test\. ]] || [[ "$FILE_PATH" =~ test_ ]] || [[ "$FILE_PATH" =~ _test\. ]]; then
  exit 0
fi

# Skip non-source files
if [[ "$FILE_PATH" =~ \.(json|md|yml|yaml|toml|lock|css|svg|png|jpg)$ ]]; then
  exit 0
fi

# Find corresponding test file
TEST_FILE=""

# TypeScript/JavaScript pattern: foo.ts → foo.test.ts
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  TEST_FILE=$(echo "$FILE_PATH" | sed -E 's/\.(ts|tsx|js|jsx)$/.test.\1/')
fi

# Python pattern: foo.py → test_foo.py (in same directory)
if [[ "$FILE_PATH" =~ \.py$ ]]; then
  DIR=$(dirname "$FILE_PATH")
  BASE=$(basename "$FILE_PATH" .py)
  TEST_FILE="$DIR/test_${BASE}.py"
  # Also try: foo.py → foo_test.py
  if [ ! -f "$TEST_FILE" ]; then
    TEST_FILE="$DIR/${BASE}_test.py"
  fi
fi

# If no test file found or doesn't exist yet, skip silently
if [[ -z "$TEST_FILE" ]] || [ ! -f "$TEST_FILE" ]; then
  exit 0
fi

# Detect test runner
if [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
  npx vitest run "$TEST_FILE" --reporter=verbose 2>&1 | tail -25
elif [ -f "jest.config.ts" ] || [ -f "jest.config.js" ] || [ -f "package.json" ]; then
  npx jest "$TEST_FILE" --verbose --no-coverage 2>&1 | tail -25
elif command -v pytest &>/dev/null && [[ "$TEST_FILE" =~ \.py$ ]]; then
  python -m pytest "$TEST_FILE" -v --tb=short 2>&1 | tail -25
else
  echo "No test runner detected. Skipping auto-test."
fi

exit 0
