import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { planHash, readJson } from './core.mjs';
import { artifactFixture, githubEnvironment } from './fixtures.mjs';
import { isolatedNpmEnvironment, stage, stageArguments, stageIdFromOutput } from './stage.mjs';

function settings(fixture, publish) {
  return {
    env: githubEnvironment(), validateSource: () => {}, validateTrigger: () => {},
    workspaces: () => fixture.plan.packages, execute: () => '11.21.0', publish,
  };
}
const options = plan => ({ artifacts: 'artifacts', receiptDir: 'receipts', expectedPlanHash: planHash(plan) });

test('stage command pins tag, access, registry and ignores scripts', () => {
  assert.deepEqual(stageArguments('/tmp/a.tgz'), ['stage', 'publish', '/tmp/a.tgz', '--tag', 'canary-verify', '--access', 'public', '--ignore-scripts', '--json', '--registry', 'https://registry.npmjs.org/']);
});

test('OIDC-only environment strips injected npm config and refuses token fallback', () => {
  const env = { ...githubEnvironment(), npm_config_registry: 'https://bad.invalid/', NODE_OPTIONS: '--require=bad', NPM_CONFIG_USERCONFIG: '/tmp/token' };
  const clean = isolatedNpmEnvironment(env, '/tmp/isolated');
  assert.equal(clean.npm_config_registry, undefined);
  assert.equal(clean.NODE_OPTIONS, undefined);
  assert.equal(clean.NPM_CONFIG_USERCONFIG, '/tmp/isolated/user.npmrc');
  for (const key of ['NODE_AUTH_TOKEN', 'NPM_TOKEN', 'NPM_AUTH_TOKEN']) assert.throws(() => isolatedNpmEnvironment({ ...env, [key]: 'secret' }, '/tmp'));
  assert.throws(() => isolatedNpmEnvironment({}, '/tmp'));
});

test('successful stages persist IDs without claiming public availability', t => {
  const fixture = artifactFixture(t);
  let count = 0;
  const receipt = stage(fixture.root, options(fixture.plan), settings(fixture, () => {
    const pkg = fixture.manifest.packages[count++];
    return { status: 0, stdout: JSON.stringify({ [pkg.name]: { ...pkg, stageId: `stage-${count}` } }) };
  }));
  assert.equal(count, 2);
  assert.equal(receipt.status, 'staged');
  assert.equal(receipt.publicAvailable, false);
  assert.equal(readJson(path.join(fixture.root, 'receipts/stage-ids.json')).packages.length, 2);
});

test('partial failure retains earlier IDs and marks ambiguous request, never retries', t => {
  const fixture = artifactFixture(t);
  let count = 0;
  assert.throws(() => stage(fixture.root, options(fixture.plan), settings(fixture, () => {
    if (count++ > 0) return { status: 1, stderr: 'secret must not enter receipt' };
    const pkg = fixture.manifest.packages[0];
    return { status: 0, stdout: JSON.stringify({ [pkg.name]: { ...pkg, stageId: 'stage-one' } }) };
  })));
  const receipt = readJson(path.join(fixture.root, 'receipts/receipt.json'));
  assert.equal(count, 2);
  assert.equal(receipt.status, 'partial-or-unknown');
  assert.equal(receipt.packages[0].stageId, 'stage-one');
  assert.equal(receipt.packages[1].status, 'unknown');
  assert(!JSON.stringify(receipt).includes('secret'));
  assert.equal(readJson(path.join(fixture.root, 'receipts/stage-ids.json')).packages.length, 1);
});

test('all artifacts and OIDC validate before the first network write, failure receipt is saved', t => {
  const fixture = artifactFixture(t);
  let count = 0;
  const deps = settings(fixture, () => { count++; });
  deps.env.NPM_TOKEN = 'forbidden';
  assert.throws(() => stage(fixture.root, options(fixture.plan), deps));
  assert.equal(count, 0);
  assert.equal(readJson(path.join(fixture.root, 'receipts/receipt.json')).status, 'blocked');
});

test('reruns fail closed because an earlier request may have reached the registry', t => {
  const fixture = artifactFixture(t);
  const deps = settings(fixture, () => assert.fail('must not publish'));
  deps.env.GITHUB_RUN_ATTEMPT = '2';
  assert.throws(() => stage(fixture.root, options(fixture.plan), deps), /retries/);
});

test('stage response must contain a matching identity, integrity and nonempty stageId', t => {
  const { manifest } = artifactFixture(t);
  const pkg = manifest.packages[0];
  for (const result of [{}, { [pkg.name]: pkg }, { [pkg.name]: { ...pkg, stageId: 'id', integrity: 'wrong' } }]) {
    assert.throws(() => stageIdFromOutput(JSON.stringify(result), pkg));
  }
});
