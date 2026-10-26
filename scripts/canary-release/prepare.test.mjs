import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { TAG, planHash, readJson, run, writeJson } from './core.mjs';
import { releaseId, temporary, version } from './fixtures.mjs';
import { install, prepare, withoutRootPrepare } from './prepare.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fixture(t, { changeset = true, baseline = '3.10.0' } = {}) {
  const root = temporary(t);
  writeJson(path.join(root, 'package.json'), {
    name: 'canary-contract-fixture', private: true,
    scripts: { bump: 'pnpm --filter @scripts/check-changeset bump', prepare: 'must-not-run' },
  });
  fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n  - 'scripts/*'\n");
  writeJson(path.join(root, '.changeset/config.json'), {
    changelog: false, commit: false, access: 'restricted', baseBranch: 'main',
    fixed: [['@modern-js/*']], linked: [], updateInternalDependencies: 'patch', ignore: [],
  });
  if (changeset) fs.writeFileSync(path.join(root, '.changeset/original.md'), '---\n"@modern-js/a": minor\n---\n\nOriginal real change.\n');
  writeJson(path.join(root, 'packages/a/package.json'), {
    name: '@modern-js/a', version: baseline, dependencies: { '@modern-js/b': 'workspace:*' },
  });
  writeJson(path.join(root, 'packages/b/package.json'), { name: '@modern-js/b', version: '3.6.0' });
  writeJson(path.join(root, 'packages/private/package.json'), { name: '@modern-js/private', version: '3.6.0', private: true });
  // This package.json is tracked-like data but is not a workspace.
  writeJson(path.join(root, 'packages/a/compiled/fixture/package.json'), { name: '@modern-js/not-a-workspace', version: '1.0.0' });
  return root;
}

function fakeRunner(root, { failSnapshot = false, snapshots = [], baseline = '3.10.0', tag = 'canary-verify' } = {}) {
  return (command, args) => {
    if (command === 'git') return '';
    if (args.includes('list')) return JSON.stringify(['a', 'b', 'private'].map(name => ({ path: path.join(root, 'packages', name) })));
    if (args.includes('bump')) {
      if (args.includes('--snapshot')) {
        assert.equal(readJson(path.join(root, '.changeset/config.json')).snapshot.useCalculatedVersion, false);
        assert.equal(readJson(path.join(root, '.changeset/config.json')).snapshot.prereleaseTemplate, `${tag}.{tag}`);
        assert.equal(args.at(-1), releaseId);
        assert(fs.readFileSync(path.join(root, '.changeset/original.md'), 'utf8').includes('Original real change'));
        assert.equal(readJson(path.join(root, 'packages/a/package.json')).version, baseline);
        const seed = fs.readFileSync(path.join(root, `.changeset/${tag}-coverage.md`), 'utf8');
        assert(seed.includes('"@modern-js/a": patch') && seed.includes('"@modern-js/b": patch'));
        assert(!seed.includes('@modern-js/private') && !seed.includes('not-a-workspace'));
        snapshots.push(seed);
        if (failSnapshot) throw new Error('snapshot failed');
      } else {
        fs.rmSync(path.join(root, '.changeset/original.md'));
      }
      for (const name of ['a', 'b']) {
        const file = path.join(root, `packages/${name}/package.json`);
        const json = readJson(file);
        json.version = args.includes('--snapshot') ? `0.0.0-${tag}.${releaseId}` : '3.11.0';
        writeJson(file, json);
      }
      return '';
    }
    assert.deepEqual(args, ['install', '--lockfile-only', '--ignore-scripts', '--no-frozen-lockfile']);
    assert.equal(readJson(path.join(root, 'package.json')).scripts.prepare, undefined);
    fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), 'generated lockfile\n');
    return '';
  };
}

test('prepare contract preserves original bump inputs, prediction and a complete uniform snapshot', t => {
  const root = fixture(t);
  const config = fs.readFileSync(path.join(root, '.changeset/config.json'), 'utf8');
  const result = prepare(root, releaseId, 'a'.repeat(40), fakeRunner(root));
  assert.equal(result.plan.version, version);
  assert(result.plan.packages.every(pkg => pkg.version === version));
  assert.equal(result.plan.packages.length, 2);
  assert.equal(result.predicted.packages[0].version, '3.11.0');
  assert.equal(result.predicted.packages[1].previousVersion, '3.6.0');
  assert.equal(result.planHash, planHash(readJson(path.join(root, '.release/canary-plan.json'))));
  assert.deepEqual(readJson(path.join(root, '.release/predicted-versions.json')), result.predicted);
  assert.equal(readJson(path.join(root, 'packages/a/package.json')).dependencies['@modern-js/b'], `workspace:${version}`);
  assert.equal(fs.readFileSync(path.join(root, '.changeset/config.json'), 'utf8'), config);
  assert(fs.existsSync(path.join(root, '.changeset/original.md')));
  assert(!fs.existsSync(path.join(root, '.changeset/canary-verify-coverage.md')));
  assert.equal(readJson(path.join(root, 'package.json')).scripts.prepare, 'must-not-run');
  assert.throws(() => prepare(root, releaseId, 'a'.repeat(40), fakeRunner(root)), /Already prepared/);
});

test('an alpha baseline on main still prepares to the shared canary version', t => {
  const baseline = '3.0.0-alpha.2';
  const root = fixture(t, { baseline });
  const result = prepare(root, releaseId, 'a'.repeat(40), fakeRunner(root, { baseline }));
  assert.equal(result.plan.version, version);
  assert(result.plan.packages.every(pkg => pkg.version === version));
  assert.equal(result.predicted.packages[0].previousVersion, baseline);
});

test('source versions that are not exact releases are rejected', t => {
  for (const baseline of ['3.10', '3.10.0.1', 'workspace:*', '^3.10.0', '3.10.0-alpha', '3.10.0-alpha.2.1', `0.0.0-${TAG}.${releaseId}`]) {
    const root = fixture(t, { baseline });
    assert.throws(() => prepare(root, releaseId, 'a'.repeat(40), fakeRunner(root, { baseline })), /exact released source versions/);
  }
});

test('snapshot failure restores original versions, changesets, config and lockfile', t => {
  const root = fixture(t);
  const config = fs.readFileSync(path.join(root, '.changeset/config.json'), 'utf8');
  assert.throws(() => prepare(root, releaseId, 'a'.repeat(40), fakeRunner(root, { failSnapshot: true })), /snapshot failed/);
  assert.equal(readJson(path.join(root, 'packages/a/package.json')).version, '3.10.0');
  assert.equal(fs.readFileSync(path.join(root, '.changeset/config.json'), 'utf8'), config);
  assert(fs.existsSync(path.join(root, '.changeset/original.md')));
  assert(!fs.existsSync(path.join(root, 'pnpm-lock.yaml')));
  assert(!fs.existsSync(path.join(root, '.release/canary-plan.json')));
  assert(!fs.existsSync(path.join(root, '.release/predicted-versions.json')));
});

test('install suppresses only root prepare, preserves native dependency scripts and restores bytes on error', t => {
  const root = fixture(t);
  const original = fs.readFileSync(path.join(root, 'package.json'));
  assert.throws(() => install(root, (command, args) => {
    assert.equal(command, 'pnpm');
    assert(!args.includes('--ignore-scripts'));
    assert(args.includes('--config.dangerouslyAllowAllBuilds=true'));
    assert.equal(readJson(path.join(root, 'package.json')).scripts.prepare, undefined);
    throw new Error('failed install');
  }));
  assert.deepEqual(fs.readFileSync(path.join(root, 'package.json')), original);
  withoutRootPrepare(root, () => assert.equal(readJson(path.join(root, 'package.json')).scripts.prepare, undefined));
  assert.deepEqual(fs.readFileSync(path.join(root, 'package.json')), original);
});

// Optional real-tool test. CI runs it after installing the repository dependencies.
for (const changeset of [true, false]) {
  test(`real repository bump + Changesets snapshot, changeset=${changeset}`, { skip: !process.env.CANARY_TEST_TOOLCHAIN }, t => {
    const root = fixture(t, { changeset });
    const toolchain = path.resolve(process.env.CANARY_TEST_TOOLCHAIN);
    fs.symlinkSync(path.join(toolchain, 'node_modules'), path.join(root, 'node_modules'), 'dir');
    const script = path.join(root, 'scripts/check-changeset');
    fs.mkdirSync(path.join(script, 'src'), { recursive: true });
    for (const file of ['package.json', 'src/bump.ts', 'src/peerDependencies.ts']) {
      fs.copyFileSync(path.join(repository, 'scripts/check-changeset', file), path.join(script, file));
    }
    const scriptModules = path.join(toolchain, 'scripts/check-changeset/node_modules');
    if (fs.existsSync(scriptModules)) fs.symlinkSync(scriptModules, path.join(script, 'node_modules'), 'dir');
    const calls = [];
    const execute = (command, args, options) => {
      calls.push([command, ...args]);
      if (command === 'git') return '';
      // Lockfile resolution is checked by the unit contract, not network access in this fixture.
      if (args.includes('--lockfile-only')) return '';
      return run(command, args, { ...options, inherit: false });
    };
    const result = prepare(root, releaseId, 'a'.repeat(40), execute);
    assert.equal(result.plan.packages.length, 2);
    assert(result.plan.packages.every(pkg => pkg.version === version));
    assert.equal(result.plan.version, version);
    assert.deepEqual(calls.filter(call => call.includes('bump')), [
      ['pnpm', 'run', 'bump'], ['pnpm', 'run', 'bump', '--snapshot', releaseId],
    ]);
    assert.equal(result.predicted.packages[0].version, changeset ? '3.11.0' : '3.10.0');
    assert.equal(result.predicted.packages[1].version, changeset ? '3.11.0' : '3.6.0');
    assert.equal(readJson(path.join(root, 'packages/a/package.json')).dependencies['@modern-js/b'], `workspace:${version}`);
    // Exercise actual pnpm pack conversion, not a handcrafted tarball manifest.
    const output = path.join(root, 'packed');
    fs.mkdirSync(output);
    run('pnpm', ['pack', '--pack-destination', output], { cwd: path.join(root, 'packages/a') });
    const packed = JSON.parse(run('tar', ['-xOzf', path.join(output, fs.readdirSync(output)[0]), 'package/package.json']));
    assert.equal(packed.version, version);
    assert.equal(packed.dependencies['@modern-js/b'], version);
  });
}

test('a stable release keeps what the bump produced and publishes that version', t => {
  const root = fixture(t);
  const result = prepare(root, releaseId, 'a'.repeat(40), fakeRunner(root), { channel: 'latest' });
  assert.equal(result.plan.channel, 'latest');
  assert.equal(result.plan.tag, 'latest');
  assert.equal(result.plan.version, '3.11.0');
  assert(result.plan.packages.every(pkg => pkg.version === '3.11.0'));
  // The consumed changesets are the point of a stable release: they are what
  // the release commit carries back to the trunk.
  assert(!fs.existsSync(path.join(root, '.changeset/original.md')));
  assert(!fs.existsSync(path.join(root, '.changeset/latest-coverage.md')));
  assert.equal(readJson(path.join(root, 'packages/a/package.json')).dependencies['@modern-js/b'], 'workspace:3.11.0');
  assert.equal(result.planHash, planHash(readJson(path.join(root, '.release/canary-plan.json'))));
});

test('a snapshot release leaves the trunk untouched; a stable one does not', t => {
  const canaryRoot = fixture(t);
  prepare(canaryRoot, releaseId, 'a'.repeat(40), fakeRunner(canaryRoot));
  assert(fs.existsSync(path.join(canaryRoot, '.changeset/original.md')), 'a snapshot restores the changesets it consumed');
  const stableRoot = fixture(t);
  prepare(stableRoot, releaseId, 'a'.repeat(40), fakeRunner(stableRoot), { channel: 'latest' });
  assert(!fs.existsSync(path.join(stableRoot, '.changeset/original.md')), 'a stable release consumes them for good');
});

test('a custom channel publishes a snapshot under a dist-tag of its own', t => {
  const root = fixture(t);
  const snapshots = [];
  const runner = fakeRunner(root, { snapshots, tag: 'pia-trial' });
  const result = prepare(root, releaseId, 'a'.repeat(40), runner, { channel: 'custom', customTag: 'pia-trial' });
  assert.equal(result.plan.tag, 'pia-trial');
  assert.equal(result.plan.version, `0.0.0-pia-trial.${releaseId}`);
  assert(fs.existsSync(path.join(root, '.changeset/original.md')), 'a custom channel is still a snapshot');
});

test('an unknown channel, or a custom one borrowing a reserved tag, never reaches the bump', t => {
  for (const options of [
    { channel: 'stable' }, { channel: 'next' }, { channel: 'custom' },
    { channel: 'custom', customTag: 'latest' }, { channel: 'custom', customTag: 'canary-verify' },
    { channel: 'custom', customTag: 'Has Caps' }, { channel: 'latest', customTag: 'something-else' },
  ]) {
    const root = fixture(t);
    assert.throws(() => prepare(root, releaseId, 'a'.repeat(40), () => {
      throw new Error('the channel must be rejected before anything runs');
    }, options));
  }
});
