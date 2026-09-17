#!/bin/bash
# Dev Blueprint — PreToolUse Hook: Enforce Manifest
# Blocks writes to files listed in the active manifest's "protected" list.
# Exit code 0 = allow, Exit code 2 = deny with reason.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.content // empty' 2>/dev/null)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

# Only check file-write operations
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

MANIFEST=".claude/active-manifest.json"

# If no active manifest, allow everything (no enforcement)
if [ ! -f "$MANIFEST" ]; then
  exit 0
fi

# Check if file matches any protected pattern
PROTECTED_PATTERNS=$(jq -r '.protected[]?.file // empty' "$MANIFEST" 2>/dev/null)

if [[ -z "$PROTECTED_PATTERNS" ]]; then
  exit 0
fi

while IFS= read -r pattern; do
  [[ -z "$pattern" ]] && continue

  # Support glob patterns (e.g., src/features/agent/**)
  # Convert ** to regex-friendly pattern
  regex_pattern=$(echo "$pattern" | sed 's/\*\*/.*/' | sed 's/\*/[^\/]*/')

  if [[ "$FILE_PATH" =~ ^${regex_pattern}$ ]]; then
    # File is protected — BLOCK the write
    jq -n --arg reason "PROTECTED: '$FILE_PATH' matches manifest protected pattern '$pattern'. This file is not in scope for the current user story." '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
      }
    }'
    exit 2
  fi
done <<< "$PROTECTED_PATTERNS"

# Not protected — allow
exit 0
