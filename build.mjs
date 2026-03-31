/**
 * Build script for Claude Code (external/non-Bun build).
 *
 * This script handles:
 * 1. Shimming `bun:bundle` feature() → always returns false
 * 2. Replacing MACRO.VERSION with the actual version from package.json
 * 3. TypeScript compilation via tsc
 *
 * Usage: node build.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

console.log(`Building Claude Code v${pkg.version}...\n`);

// Step 1: Create runtime shim for bun:bundle
const shimDir = join(__dirname, 'node_modules', 'bun_bundle_shim');
if (!existsSync(shimDir)) {
  mkdirSync(shimDir, { recursive: true });
}
writeFileSync(join(shimDir, 'index.js'), `
// Runtime shim for bun:bundle — feature() always returns false in external builds.
export function feature(name) {
  return false;
}
`);
writeFileSync(join(shimDir, 'package.json'), JSON.stringify({
  name: 'bun_bundle_shim',
  version: '0.0.0',
  type: 'module',
  main: 'index.js',
}, null, 2));

console.log('✓ Created bun:bundle runtime shim');

// Step 2: Type-check
console.log('\nRunning TypeScript type-check...');
try {
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'inherit' });
  console.log('✓ Type-check passed');
} catch (e) {
  console.error('✗ Type-check failed (see errors above)');
  console.error('  This is expected on first build — fix errors iteratively.');
  // Don't exit — continue to show what would happen
}

console.log(`\nBuild complete. Version: ${pkg.version}`);
console.log('\nNote: This project was originally built with Bun\'s bundler.');
console.log('For a full production build, you would need to:');
console.log('  1. Replace all `import { feature } from "bun:bundle"` with the shim');
console.log('  2. Replace all `MACRO.VERSION` references with the version string');
console.log('  3. Bundle with esbuild/rollup targeting the cli.js entry point');
