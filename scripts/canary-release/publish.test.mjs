import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { planHash, readJson } from './core.mjs';
import { artifactFixture, githubEnvironment } from './fixtures.mjs';
import { diagnostic, isolatedNpmEnvironment, npmErrorCode, publish, publishArguments, publishedFromOutput } from './publish.mjs';

function settings(fixture, npm, log = () => {}) {
  return {
    env: githubEnvironment(), validateSource: () => {}, validateTrigger: () => {},
    workspaces: () => fixture.plan.packages, execute: () => '11.21.0', npm, log,
  };
}
const options = plan => ({ artifacts: 'artifacts', receiptDir: 'receipts', expectedPlanHash: planHash(plan) });

test('publish command pins tag, access, registry and ignores scripts', () => {
  assert.deepEqual(publishArguments('/tmp/a.tgz'), ['publish', '/tmp/a.tgz', '--tag', 'canary-verify', '--access', 'public', '--ignore-scripts', '--json', '--registry', 'https://registry.npmjs.org/']);
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

test('a complete run records every package as published', t => {
  const fixture = artifactFixture(t);
  let count = 0;
  const receipt = publish(fixture.root, options(fixture.plan), settings(fixture, () => {
    const pkg = fixture.manifest.packages[count++];
    return { status: 0, stdout: JSON.stringify({ [pkg.name]: { ...pkg } }) };
  }));
  assert.equal(count, 2);
  assert.equal(receipt.status, 'published');
  assert.equal(receipt.mode, 'publish');
  assert.equal(receipt.publicAvailable, true);
  assert.deepEqual(receipt.packages.map(item => item.status), ['published', 'published']);
  assert(!fs.existsSync(path.join(fixture.root, 'receipts/stage-ids.json')), 'Stage IDs no longer exist');
});

test('partial failure keeps the earlier package published and marks the ambiguous one, never retries', t => {
  const fixture = artifactFixture(t);
  let count = 0;
  assert.throws(() => publish(fixture.root, options(fixture.plan), settings(fixture, () => {
    if (count++ > 0) return { status: 1, stderr: 'secret must not enter receipt' };
    const pkg = fixture.manifest.packages[0];
    return { status: 0, stdout: JSON.stringify({ [pkg.name]: { ...pkg } }) };
  })));
  const receipt = readJson(path.join(fixture.root, 'receipts/receipt.json'));
  assert.equal(count, 2);
  assert.equal(receipt.status, 'partial-or-unknown');
  assert.equal(receipt.packages[0].status, 'published');
  assert.equal(receipt.packages[1].status, 'unknown');
  assert(!JSON.stringify(receipt).includes('secret'));
});

test('all artifacts and OIDC validate before the first network write, failure receipt is saved', t => {
  const fixture = artifactFixture(t);
  let count = 0;
  const deps = settings(fixture, () => { count++; });
  deps.env.NPM_TOKEN = 'forbidden';
  assert.throws(() => publish(fixture.root, options(fixture.plan), deps));
  assert.equal(count, 0);
  assert.equal(readJson(path.join(fixture.root, 'receipts/receipt.json')).status, 'blocked');
});

test('reruns fail closed because a published version can never be replaced', t => {
  const fixture = artifactFixture(t);
  const deps = settings(fixture, () => assert.fail('must not publish'));
  deps.env.GITHUB_RUN_ATTEMPT = '2';
  assert.throws(() => publish(fixture.root, options(fixture.plan), deps), /retries/);
});

test('publish response must contain a matching identity and integrity', t => {
  const { manifest } = artifactFixture(t);
  const pkg = manifest.packages[0];
  for (const result of [{}, { [pkg.name]: { ...pkg, version: '1.2.3' } }, { [pkg.name]: { ...pkg, integrity: 'wrong' } }]) {
    assert.throws(() => publishedFromOutput(JSON.stringify(result), pkg));
  }
  assert.equal(publishedFromOutput(JSON.stringify({ [pkg.name]: pkg }), pkg), `${pkg.name}@${pkg.version}`);
});

test('one unresolved package does not stop the rest, and each is attempted once', t => {
  const fixture = artifactFixture(t);
  const logged = [];
  let count = 0;
  assert.throws(() => publish(fixture.root, options(fixture.plan), settings(fixture, () => {
    const index = count++;
    if (index === 0) return { status: 1, stderr: 'npm error code E404\nnpm error 404 Not Found' };
    const pkg = fixture.manifest.packages[index];
    return { status: 0, stdout: JSON.stringify({ [pkg.name]: { ...pkg } }) };
  }, message => logged.push(message))), /1 of 2 packages/);
  const receipt = readJson(path.join(fixture.root, 'receipts/receipt.json'));
  assert.equal(count, 2, 'Every package is attempted exactly once');
  assert.equal(receipt.packages[0].status, 'unknown');
  assert.equal(receipt.packages[0].errorCode, 'E404');
  assert.equal(receipt.packages[1].status, 'published');
  assert.equal(receipt.status, 'partial-or-unknown');
  assert.match(logged.join('\n'), /npm error 404 Not Found/);
});

test('npm diagnostics reach the log without a token or the receipt', t => {
  const fixture = artifactFixture(t);
  const token = `npm_${'a'.repeat(36)}`;
  const logged = [];
  assert.throws(() => publish(fixture.root, options(fixture.plan), settings(fixture,
    () => ({ status: 1, stderr: `npm error code E403\nnpm error 403 ${token} rejected\nunrelated line` }),
    message => logged.push(message))));
  const text = logged.join('\n');
  assert(!text.includes(token), 'A token shaped value must never be logged');
  assert.match(text, /npm error 403 \[redacted\] rejected/);
  assert(!text.includes('unrelated line'), 'Only npm diagnostics are logged');
  assert(!JSON.stringify(readJson(path.join(fixture.root, 'receipts/receipt.json'))).includes('403 '), 'Receipt carries the code alone');
});

test('only a fixed shape error code is read back from npm', () => {
  assert.equal(npmErrorCode({ stderr: 'npm error code ENEEDAUTH' }), 'ENEEDAUTH');
  assert.equal(npmErrorCode({ stdout: JSON.stringify({ error: { code: 'E429', summary: 'Too many requests' } }) }), 'E429');
  assert.equal(npmErrorCode({ error: { code: 'ENOENT' } }), 'ENOENT');
  assert.equal(npmErrorCode({ stderr: 'npm error code not a code' }), null);
  assert.equal(npmErrorCode({ stderr: 'nothing useful' }), null);
  assert.match(diagnostic({ status: 1 }), /no npm diagnostic/);
});
