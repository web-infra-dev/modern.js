import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from '@rstest/core';
import { fileURLToPath } from 'node:url';
import { listWorkspaces, readJson, run } from './core.mjs';
import { releaseId, temporary, version } from './fixtures.mjs';
import { prepare } from './prepare.mjs';

// Opt-in: exercise real tracked workspace manifests without changing this checkout.
test.skipIf(
  !process.env.CANARY_TEST_REPOSITORY || !process.env.CANARY_TEST_TOOLCHAIN,
)(
  'real Modern.js repository plans exactly its publishable packages, no more and no fewer',
  t => {
    const repository = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../..',
    );
    const root = temporary(t);
    const toolchain = path.resolve(process.env.CANARY_TEST_TOOLCHAIN);
    const files = run('git', ['ls-files', '-z'], { cwd: repository })
      .split('\0')
      .filter(Boolean)
      .filter(
        file =>
          file === 'package.json' ||
          file.endsWith('/package.json') ||
          file === 'pnpm-workspace.yaml' ||
          file === 'pnpm-lock.yaml' ||
          file.startsWith('.changeset/') ||
          file.startsWith('packages/tsconfig/') ||
          file.startsWith('scripts/check-changeset/'),
      );
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.copyFileSync(path.join(repository, file), path.join(root, file));
    }
    fs.mkdirSync(path.join(root, 'node_modules/@modern-js'), {
      recursive: true,
    });
    for (const name of fs.readdirSync(path.join(toolchain, 'node_modules'))) {
      if (name === '@modern-js') continue;
      fs.symlinkSync(
        path.join(toolchain, 'node_modules', name),
        path.join(root, 'node_modules', name),
      );
    }
    fs.symlinkSync(
      path.join(root, 'packages/tsconfig'),
      path.join(root, 'node_modules/@modern-js/tsconfig'),
      'dir',
    );
    fs.symlinkSync(
      path.join(toolchain, 'node_modules'),
      path.join(root, 'scripts/check-changeset/node_modules'),
      'dir',
    );
    const execute = (command, args, options) => {
      if (command === 'git') return '';
      // No dependency install/build in this manifest-only test.
      if (args.includes('--lockfile-only')) return '';
      return run(command, args, { ...options, inherit: false });
    };
    // The expected set is read straight from the tracked manifests, not from
    // the code under test, and not from a count: a count went stale the day
    // a package was added (29 written, 31 real), and it said nothing about
    // which packages those were.
    const expected = files
      .filter(
        file =>
          file.startsWith('packages/') &&
          file.endsWith('/package.json') &&
          !/(^|\/)(node_modules|compiled|fixtures?|tests?|__tests__)\//.test(
            file,
          ),
      )
      .map(file => readJson(path.join(repository, file)))
      .filter(json => json.name?.startsWith('@modern-js/') && !json.private)
      .map(json => json.name)
      .sort();
    assert(expected.length > 0);
    const result = prepare(root, releaseId, 'a'.repeat(40), execute);
    assert.deepEqual(
      result.plan.packages.map(pkg => pkg.name).sort(),
      expected,
    );
    assert(result.plan.packages.every(pkg => pkg.version === version));
    assert(
      result.plan.packages.some(pkg => pkg.name === '@modern-js/main-doc'),
    );
    assert(
      !result.plan.packages.some(
        pkg => pkg.path.includes('compiled') || pkg.path.includes('fixture'),
      ),
    );
    assert.equal(
      listWorkspaces(root, execute).filter(pkg =>
        result.plan.packages.some(planned => planned.name === pkg.name),
      ).length,
      expected.length,
    );
    assert.equal(result.predicted.packages.length, expected.length);
    assert(
      result.predicted.packages.every(pkg => !pkg.version.includes('canary')),
    );
    assert.deepEqual(
      readJson(path.join(root, '.changeset/config.json')),
      readJson(path.join(repository, '.changeset/config.json')),
    );
  },
);
