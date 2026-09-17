#!/usr/bin/env node

/**
 * Dev Blueprint — PreToolUse Hook: Enforce Manifest
 * Blocks writes to files listed in the active manifest's "protected" list.
 * Exit code 0 = allow, Exit code 2 = deny with reason.
 * 
 * Debug: writes to .claude/hooks/hook-debug.log so we can see what Claude Code sends.
 */

import { readFileSync, appendFileSync, existsSync } from 'fs';

const MANIFEST_PATH = '.claude/active-manifest.json';
const DEBUG_LOG = '.claude/hooks/hook-debug.log';

function log(msg) {
  try {
    appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

function checkProtected(filePath) {
  if (!filePath) return false;
  if (!existsSync(MANIFEST_PATH)) return false;

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return false;
  }

  const protectedPatterns = (manifest.protected || []).map(p => p.file);

  for (const pattern of protectedPatterns) {
    if (!pattern) continue;
    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '§DOUBLESTAR§')
      .replace(/\*/g, '[^/]*')
      .replace(/§DOUBLESTAR§/g, '.*');
    const regex = new RegExp(`^${regexStr}$`);

    if (regex.test(filePath)) {
      return pattern;
    }
  }
  return false;
}

function deny(filePath, pattern) {
  const output = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `PROTECTED: '${filePath}' matches manifest protected pattern '${pattern}'. This file is not in scope for the current user story.`
    }
  });
  process.stdout.write(output);
  log(`DENIED: ${filePath} matched ${pattern}`);
  process.exit(2);
}

async function main() {
  log('--- Hook invoked ---');
  log(`argv: ${JSON.stringify(process.argv)}`);
  log(`env CLAUDE_TOOL_INPUT: ${process.env.CLAUDE_TOOL_INPUT || 'not set'}`);

  // Method 1: Read from stdin with timeout
  let input = '';
  const stdinPromise = new Promise((resolve) => {
    const chunks = [];
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    setTimeout(() => {
      process.stdin.removeAllListeners();
      resolve(chunks.join(''));
    }, 2000);
  });

  input = await stdinPromise;
  log(`stdin received (${input.length} bytes): ${input.substring(0, 500)}`);

  // Try to parse stdin
  let filePath = '';
  if (input) {
    try {
      const parsed = JSON.parse(input);
      filePath = parsed?.tool_input?.file_path || '';
      log(`Parsed file_path from stdin: ${filePath}`);
    } catch (e) {
      log(`Failed to parse stdin JSON: ${e.message}`);
    }
  }

  // Method 2: Check environment variable
  if (!filePath && process.env.CLAUDE_TOOL_INPUT) {
    try {
      const parsed = JSON.parse(process.env.CLAUDE_TOOL_INPUT);
      filePath = parsed?.file_path || '';
      log(`Parsed file_path from env: ${filePath}`);
    } catch {}
  }

  // Method 3: Check argv
  if (!filePath && process.argv[2]) {
    try {
      const parsed = JSON.parse(process.argv[2]);
      filePath = parsed?.file_path || parsed?.tool_input?.file_path || '';
      log(`Parsed file_path from argv: ${filePath}`);
    } catch {
      filePath = process.argv[2];
      log(`Using raw argv as file_path: ${filePath}`);
    }
  }

  if (!filePath) {
    log('No file_path found from any method - allowing');
    process.exit(0);
  }

  // Normalize Windows paths
  filePath = filePath.replace(/\\/g, '/');
  filePath = filePath.replace(/^.*?src\//, 'src/');
  log(`Normalized file_path: ${filePath}`);

  const matchedPattern = checkProtected(filePath);
  if (matchedPattern) {
    deny(filePath, matchedPattern);
  } else {
    log(`ALLOWED: ${filePath}`);
    process.exit(0);
  }
}

main().catch((e) => {
  log(`Hook error: ${e.message}`);
  process.exit(0);
});
