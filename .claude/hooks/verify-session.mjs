#!/usr/bin/env node

/**
 * Dev Blueprint — Stop Hook: Session Verification
 * Runs when Claude Code finishes responding.
 * Executes manifest verification + full test suite.
 * Exit code 0 always (results are informational).
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

function run(cmd, label) {
  try {
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 55000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output;
  } catch (err) {
    return err.stdout || err.stderr || `${label} failed`;
  }
}

async function main() {
  // Consume stdin (required even if we don't use it)
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  DEV BLUEPRINT — SESSION VERIFICATION');
  console.log('═══════════════════════════════════════════════');

  const manifestFile = '.claude/active-manifest.json';
  const checksumsFile = 'manifests/checksums.json';

  // --- Step 1: Manifest Info ---
  if (existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8'));
      console.log(`\n▶ Active manifest: ${manifest.id} — "${manifest.title}"`);
      console.log(`  Files to create: ${(manifest.create || []).length}`);
      console.log(`  Files protected: ${(manifest.protected || []).length}`);
      console.log(`  Tests required: ${(manifest.tests_must_pass || []).length}`);
    } catch {
      console.log('\n  ⚠ Could not read active manifest');
    }
  } else {
    console.log('\n  ℹ No active manifest found — skipping manifest verification');
  }

  // --- Step 2: Manifest Verification ---
  if (existsSync('scripts/verify_session.py') && existsSync(manifestFile) && existsSync(checksumsFile)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8'));
      console.log(`\n▶ Running manifest verification for ${manifest.id}...`);
      const result = run(`python scripts/verify_session.py ${manifest.id} --baseline ${checksumsFile}`, 'verify_session.py');
      console.log(result.split('\n').slice(-15).join('\n'));
    } catch {
      console.log('  ⚠ Manifest verification encountered an error');
    }
  }

  // --- Step 3: Full Test Suite ---
  console.log('\n▶ Running full test suite...\n');

  if (existsSync('vitest.config.ts') || existsSync('vitest.config.js')) {
    const output = run('npx vitest run --reporter=verbose', 'vitest');
    // Show last 30 lines
    const lines = output.split('\n');
    console.log(lines.slice(-30).join('\n'));
  } else if (existsSync('package.json')) {
    const output = run('npm test', 'npm test');
    console.log(output.split('\n').slice(-30).join('\n'));
  } else {
    console.log('  ⚠ No test runner detected');
  }

  // --- Step 4: Git Status ---
  console.log('\n▶ Files changed in this session:\n');
  try {
    const status = run('git diff --name-only HEAD', 'git diff');
    const staged = run('git diff --cached --name-only', 'git staged');
    const untracked = run('git ls-files --others --exclude-standard', 'git untracked');

    if (status.trim()) console.log('  Modified:\n' + status.split('\n').filter(Boolean).map(f => `    ${f}`).join('\n'));
    if (staged.trim()) console.log('  Staged:\n' + staged.split('\n').filter(Boolean).map(f => `    ${f}`).join('\n'));
    if (untracked.trim()) console.log('  New (untracked):\n' + untracked.split('\n').filter(Boolean).map(f => `    ${f}`).join('\n'));
    if (!status.trim() && !staged.trim() && !untracked.trim()) console.log('  No changes detected');
  } catch {
    console.log('  (could not determine git status)');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  process.exit(0);
}

main().catch(() => process.exit(0));
