#!/usr/bin/env node

/**
 * Dev Blueprint — PostToolUse Hook: Auto-Run Tests
 * After any file edit/write, finds and runs the corresponding test file.
 * Exit code 0 always (informational — test results feed back to Claude Code context).
 */

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, basename, join } from 'path';

async function main() {
  // Read stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const filePath = parsed?.tool_input?.file_path || '';
  if (!filePath) {
    process.exit(0);
  }

  // Skip if the edited file IS a test file
  if (filePath.includes('.test.') || filePath.includes('test_') || filePath.includes('_test.')) {
    process.exit(0);
  }

  // Skip non-source files
  const skipExtensions = ['.json', '.md', '.yml', '.yaml', '.toml', '.lock', '.css', '.svg', '.png', '.jpg', '.html'];
  if (skipExtensions.some(ext => filePath.endsWith(ext))) {
    process.exit(0);
  }

  // Find corresponding test file
  let testFile = '';

  // TypeScript/JavaScript: foo.ts → foo.test.ts
  const tsMatch = filePath.match(/^(.+)\.(ts|tsx|js|jsx)$/);
  if (tsMatch) {
    testFile = `${tsMatch[1]}.test.${tsMatch[2]}`;
  }

  // Python: foo.py → test_foo.py
  if (filePath.endsWith('.py')) {
    const dir = dirname(filePath);
    const base = basename(filePath, '.py');
    testFile = join(dir, `test_${base}.py`);
    if (!existsSync(testFile)) {
      testFile = join(dir, `${base}_test.py`);
    }
  }

  // If no test file found or doesn't exist, skip
  if (!testFile || !existsSync(testFile)) {
    process.exit(0);
  }

  // Run the test
  console.log(`\n📋 Dev Blueprint: Auto-running test for ${filePath}`);
  console.log(`   Test file: ${testFile}\n`);

  try {
    // Detect test runner
    if (existsSync('vitest.config.ts') || existsSync('vitest.config.js')) {
      const output = execSync(`npx vitest run "${testFile}" --reporter=verbose`, {
        encoding: 'utf-8',
        timeout: 25000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(output.split('\n').slice(-20).join('\n'));
    } else if (existsSync('jest.config.ts') || existsSync('jest.config.js')) {
      const output = execSync(`npx jest "${testFile}" --verbose --no-coverage`, {
        encoding: 'utf-8',
        timeout: 25000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(output.split('\n').slice(-20).join('\n'));
    } else if (filePath.endsWith('.py')) {
      const output = execSync(`python -m pytest "${testFile}" -v --tb=short`, {
        encoding: 'utf-8',
        timeout: 25000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(output.split('\n').slice(-20).join('\n'));
    } else {
      console.log('   No test runner detected. Skipping.');
    }
  } catch (err) {
    // Test failure — still show output (this is informational)
    if (err.stdout) console.log(err.stdout.split('\n').slice(-20).join('\n'));
    if (err.stderr) console.log(err.stderr.split('\n').slice(-15).join('\n'));
    console.log('\n   ❌ Tests failed — see output above');
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
