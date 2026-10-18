import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertSource, assertTrigger, planHash, publishable, stableStringify,
  validateDependencies, validatePackageSet, validatePlan, validateTarball, verifyArtifacts, writeJson,
} from './core.mjs';
import { artifactFixture, githubEnvironment, makePlan, pushEvent, sourceSha, version } from './fixtures.mjs';

test('canonical JSON sorts every object, preserves arrays and hashes UTF-8', () => {
  assert.equal(stableStringify({ z: [2, { b: 0, a: 'x' }], a: 1 }), '{"a":1,"z":[2,{"a":"x","b":0}]}');
  assert.equal(planHash({ b: 2, a: 1 }), '43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777');
  for (const value of [undefined, NaN, Infinity, { a: undefined }, new Date(), [ , 1]]) assert.throws(() => stableStringify(value));
});

test('valid plan uses one exact cross-repository version', () => {
  assert.equal(validatePlan(makePlan()).version, version);
});

test('any nonzero major, minor or patch baseline is rejected even when every package agrees', () => {
  for (const baseline of ['0.0.1', '0.1.0', '1.0.0', '3.6.0', '3.10.0', '999.999.999']) {
    const plan = makePlan();
    plan.version = version.replace('0.0.0', baseline);
    for (const pkg of plan.packages) pkg.version = plan.version;
    assert.throws(() => validatePlan(plan), /shared cross-repository canary version/);
  }
});

const invalidPlans = {
  'stable tag': plan => { plan.tag = 'latest'; },
  'direct publish': plan => { plan.mode = 'publish'; },
  'internal target': plan => { plan.requiredTargets.push('internal'); },
  'internal metadata': plan => { plan.internalRepository = 'secret'; },
  'foreign scope': plan => { plan.packages[0].name = '@other/a'; },
  'path traversal': plan => { plan.packages[0].path = 'packages/../scripts/a'; },
  'absolute path': plan => { plan.packages[0].path = '/packages/a'; },
  'duplicate package': plan => { plan.packages.push(plan.packages[0]); },
  'missing shared version': plan => { delete plan.version; },
  'stable package version': plan => { plan.packages[0].version = '3.10.0'; },
  'shared suffix but different base': plan => { plan.packages[0].version = version.replace('0.0.0', '3.10.0'); },
  'nonzero shared base': plan => { plan.version = version.replace('0.0.0', '3.6.0'); plan.packages.forEach(pkg => { pkg.version = plan.version; }); },
  'version range': plan => { plan.packages[0].version = `^${version}`; },
  'foreign release ID': plan => { plan.packages[0].version = version.replace('20261018', '20261019'); },
  'invalid SHA': plan => { plan.baseSha = 'abc123'; },
};
for (const [name, mutate] of Object.entries(invalidPlans)) {
  test(`reject plan: ${name}`, () => {
    const plan = makePlan();
    mutate(plan);
    assert.throws(() => validatePlan(plan));
  });
}

test('package set is taken from pnpm workspaces, excludes private/non-packages/foreign scope', () => {
  const plan = makePlan();
  const workspaces = [
    ...plan.packages, { name: '@modern-js/private', path: 'packages/private', private: true },
    { name: '@modern-js/example', path: 'examples/example' }, { name: '@other/x', path: 'packages/x' },
  ];
  assert.equal(publishable(workspaces).length, 2);
  validatePackageSet(plan, workspaces);
  assert.throws(() => validatePackageSet(plan, workspaces.slice(1)));
  assert.throws(() => validatePackageSet({ ...plan, packages: plan.packages.slice(1) }, workspaces));
  assert.throws(() => validatePackageSet(plan, [...workspaces, { name: '@modern-js/c', version, path: 'packages/c' }]));
});

test('consumer internal dependencies must be exact canary, never workspace ranges or stale baselines', () => {
  const plan = makePlan();
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    validateDependencies({ name: '@modern-js/a', [field]: { '@modern-js/b': `workspace:${version}` } }, plan);
    validateDependencies({ name: '@modern-js/a', [field]: { '@modern-js/b': version } }, plan, { packed: true });
    for (const spec of [`^${version}`, `workspace:^${version}`, 'workspace:*', '3.10.0', '3.6.0']) {
      assert.throws(() => validateDependencies({ name: '@modern-js/a', [field]: { '@modern-js/b': spec } }, plan, { packed: true }));
    }
  }
});

test('legacy dependency is limited to the exact consumer, name and existing range', () => {
  const json = { name: '@modern-js/plugin-polyfill', dependencies: { '@modern-js/polyfill-lib': '^1.0.2' } };
  validateDependencies(json, makePlan(), { packed: true });
  assert.throws(() => validateDependencies({ ...json, name: '@modern-js/a' }, makePlan(), { packed: true }));
  json.dependencies['@modern-js/polyfill-lib'] = '^2.0.0';
  assert.throws(() => validateDependencies(json, makePlan(), { packed: true }));
});

test('tarball rejects identity, private packages, unresolved dependencies and publishConfig auth', () => {
  const plan = makePlan();
  const pkg = plan.packages[0];
  for (const extra of [
    { name: '@other/a' }, { version: '3.10.0' }, { private: true },
    { dependencies: { external: 'file:../other' } }, { devDependencies: { external: 'workspace:*' } },
    { publishConfig: { registry: 'https://other.invalid/' } }, { publishConfig: { tag: 'latest' } },
    { publishConfig: { _authToken: 'not-a-real-token' } }, { bundledDependencies: ['@modern-js/b'] },
  ]) assert.throws(() => validateTarball({ name: pkg.name, version, ...extra }, pkg, plan));
});

test('top-level tarball tag is absent or exactly canary-verify', () => {
  const plan = makePlan();
  const pkg = plan.packages[0];
  const json = { name: pkg.name, version };
  validateTarball(json, pkg, plan);
  validateTarball({ ...json, tag: 'canary-verify' }, pkg, plan);
  for (const tag of ['latest', 'next', 'canary', '', null, false]) {
    assert.throws(() => validateTarball({ ...json, tag }, pkg, plan), /top-level publish tag/);
  }
});

test('source SHA, clean tracked files and ancestor are mandatory', () => {
  const execute = (_command, args) => args[0] === 'rev-parse' ? sourceSha : '';
  assertSource('/tmp', makePlan(), sourceSha, execute);
  assert.throws(() => assertSource('/tmp', makePlan(), 'c'.repeat(40), execute));
  assert.throws(() => assertSource('/tmp', makePlan(), sourceSha, (_cmd, args) => {
    if (args[0] === 'merge-base') throw new Error('not ancestor');
    return execute(_cmd, args);
  }));
  assert.throws(() => assertSource('/tmp', makePlan(), sourceSha, (_cmd, args) => args[0] === 'status' ? ' M package.json' : execute(_cmd, args)));
});

test('only the first push of the release branch or an exact-hash dispatch is accepted', () => {
  const plan = makePlan();
  const env = githubEnvironment();
  assertTrigger(plan, env, pushEvent());
  for (const event of [{ ...pushEvent(), created: false }, { ...pushEvent(), forced: true }, { ...pushEvent(), before: sourceSha }, { ...pushEvent(), after: 'c'.repeat(40) }]) {
    assert.throws(() => assertTrigger(plan, env, event));
  }
  assert.throws(() => assertTrigger(plan, { ...env, GITHUB_REF: 'refs/heads/feature/code-only' }, pushEvent()));
  assert.throws(() => assertTrigger(plan, { ...env, GITHUB_EVENT_NAME: 'pull_request' }, pushEvent()));
  assertTrigger(plan, { ...env, GITHUB_EVENT_NAME: 'workflow_dispatch' }, { inputs: { expected_plan_hash: planHash(plan) } });
  assert.throws(() => assertTrigger(plan, { ...env, GITHUB_EVENT_NAME: 'workflow_dispatch' }, { inputs: {} }));
});

test('artifacts verify exact package set, plan hash, source and all sha512 values', t => {
  const { directory, plan, manifest } = artifactFixture(t);
  assert.deepEqual(verifyArtifacts(directory, plan, planHash(plan), sourceSha), manifest);
  assert.throws(() => verifyArtifacts(directory, plan, '0'.repeat(64), sourceSha));
  assert.throws(() => verifyArtifacts(directory, plan, planHash(plan), 'c'.repeat(40)));
  const file = path.join(directory, manifest.packages[1].filename);
  fs.appendFileSync(file, 'corrupt');
  assert.throws(() => verifyArtifacts(directory, plan, planHash(plan), sourceSha), /sha512/);
});

test('artifacts reject path escape, duplicates, missing packages and shared-version mismatch', t => {
  const { directory, plan, manifest } = artifactFixture(t);
  for (const mutate of [
    value => { value.packages[0].filename = '../outside.tgz'; },
    value => { value.packages[1] = value.packages[0]; },
    value => { value.packages.pop(); },
    value => { value.version = '3.10.0'; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    writeJson(path.join(directory, 'manifest.json'), changed);
    assert.throws(() => verifyArtifacts(directory, plan, planHash(plan), sourceSha));
  }
});
