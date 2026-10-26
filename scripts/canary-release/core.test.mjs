import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  RELEASE_ID, assertSource, assertTrigger, channelFor, planHash, publishable, releaseBranch,
  stableStringify, validateDependencies, validatePackageSet, validatePlan, validateTarball,
  verifyArtifacts, versionFor, writeJson,
} from './core.mjs';
import { artifactFixture, githubEnvironment, makePlan, pushEvent, releaseId, sourceSha, version } from './fixtures.mjs';

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
    assert.throws(() => validatePlan(plan), /version this channel produces/);
  }
});

const invalidPlans = {
  'stable tag': plan => { plan.tag = 'latest'; },
  'foreign mode': plan => { plan.mode = 'stage'; },
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

test('the release id shape is the one the pipeline mints, and never a UUID', () => {
  // Three validators across two repositories encode this shape and each had its
  // own fixture, so runs 54 and 55 each died on a different one after the
  // generator changed. This states the contract in the repository that receives
  // the id: the pipeline builds `r<date>-<16 random bytes as hex>`.
  const minted = `r20261022-${'ab12cd34'.repeat(4)}`;
  assert.ok(RELEASE_ID.test(minted), minted);
  for (const rejected of [
    // What the pipeline used to mint. npm redacts this shape out of its own
    // publish output, which is why it may never come back.
    'r20261022-12345678-1234-4234-8234-123456789abc',
    'r20261022-ab12cd34', 'r20261022-' + 'ab'.repeat(17), 'r2026102-' + 'ab'.repeat(16),
    `R20261022-${'ab12cd34'.repeat(4)}`, `r20261022-${'AB12CD34'.repeat(4)}`,
    `r20261022-${'ab12cd34'.repeat(4)} `, `release-${'ab12cd34'.repeat(4)}`,
  ]) {
    assert.ok(!RELEASE_ID.test(rejected), rejected);
  }
});

test('a channel owns its dist-tag, its version shape and the branch that may trigger it', () => {
  const canary = channelFor('canary');
  const latest = channelFor('latest');
  const custom = channelFor('custom', 'pia-trial');
  assert.equal(versionFor(canary, releaseId), `0.0.0-canary-verify.${releaseId}`);
  assert.equal(versionFor(latest, releaseId, '3.11.0'), '3.11.0');
  assert.equal(versionFor(custom, releaseId), `0.0.0-pia-trial.${releaseId}`);
  assert.equal(releaseBranch({ channel: 'canary', releaseId }), `release-canary-verify/${releaseId}`);
  assert.equal(releaseBranch({ channel: 'latest', releaseId }), `release-latest/${releaseId}`);
  assert.equal(releaseBranch({ channel: 'custom', tag: 'pia-trial', releaseId }), `release-pia-trial/${releaseId}`);
});

test('a stable channel publishes only a plain major.minor.patch the caller supplies', () => {
  for (const bumped of [undefined, '', '3.11', 'v3.11.0', '3.11.0-alpha.1', '03.11.0', `0.0.0-latest.${releaseId}`]) {
    assert.throws(() => versionFor(channelFor('latest'), releaseId, bumped), /plain major\.minor\.patch/);
  }
});

test('an unknown channel, or a custom one borrowing a reserved tag, is refused', () => {
  for (const [name, tag] of [['stable'], ['next'], ['Canary'], ['custom'], ['custom', 'latest'], ['custom', 'canary-verify'], ['custom', 'A'], ['custom', 'x']]) {
    assert.throws(() => channelFor(name, tag));
  }
  assert.equal(channelFor('custom', 'pia-trial').tag, 'pia-trial');
  assert.equal(channelFor().name, 'canary');
});

test('a plan is validated against its own channel, not against canary', () => {
  const stable = { ...makePlan(), channel: 'latest', tag: 'latest', version: '3.11.0' };
  stable.packages = stable.packages.map(pkg => ({ ...pkg, version: '3.11.0' }));
  assert.deepEqual(validatePlan(stable), stable);
  // The tag has to be the one the channel grants, and the version has to be the
  // shape it produces: a plan cannot claim a wider channel than it was cut for.
  assert.throws(() => validatePlan({ ...stable, tag: 'canary-verify' }), /tag must be the one/);
  assert.throws(() => validatePlan({ ...stable, channel: 'canary' }), /tag must be the one/);
  assert.throws(() => validatePlan({ ...stable, version: `0.0.0-latest.${releaseId}`, packages: stable.packages.map(pkg => ({ ...pkg, version: `0.0.0-latest.${releaseId}` })) }), /plain major\.minor\.patch/);
  assert.throws(() => validatePlan({ ...makePlan(), channel: 'nope' }), /Unknown release channel/);
});

test('only the branch its own channel prescribes may trigger a publish', () => {
  const stable = { ...makePlan(), channel: 'latest', tag: 'latest', version: '3.11.0' };
  const event = { created: true, forced: false, deleted: false, before: '0'.repeat(40), after: 'b'.repeat(40) };
  const base = {
    GITHUB_REF_TYPE: 'branch', GITHUB_EVENT_NAME: 'push', GITHUB_SHA: 'b'.repeat(40),
  };
  assertTrigger(stable, { ...base, GITHUB_REF: `refs/heads/release-latest/${releaseId}` }, event);
  for (const ref of [
    `refs/heads/release-canary-verify/${releaseId}`,
    'refs/heads/release-latest/other',
    `refs/heads/release-latest/${releaseId}/x`,
    `refs/heads/main`,
  ]) {
    assert.throws(() => assertTrigger(stable, { ...base, GITHUB_REF: ref }, event), /prepared release branch/);
  }
});
