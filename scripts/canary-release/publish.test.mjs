import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { planHash, readJson } from './core.mjs';
import { artifactFixture, githubEnvironment } from './fixtures.mjs';
import {
  ATTEMPTS, assertTrustedPublishers, diagnostic, isolatedNpmEnvironment, npmErrorCode, retryAfterMs,
  publish, publishArguments, publishedFromOutput, repairInstructions,
} from './publish.mjs';

function settings(fixture, npm, log = () => {}) {
  return {
    env: githubEnvironment(), validateSource: () => {}, validateTrigger: () => {},
    workspaces: () => fixture.plan.packages, execute: () => '11.21.0', verifyTrust: () => {}, npm, log,
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

test('a complete run records every package as published', async t => {
  const fixture = artifactFixture(t);
  let count = 0;
  const receipt = await publish(fixture.root, options(fixture.plan), settings(fixture, () => {
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

test('partial failure keeps the earlier package published and marks the ambiguous one, never retries', async t => {
  const fixture = artifactFixture(t);
  let count = 0;
  await assert.rejects(() => publish(fixture.root, options(fixture.plan), settings(fixture, () => {
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

test('all artifacts and OIDC validate before the first network write, failure receipt is saved', async t => {
  const fixture = artifactFixture(t);
  let count = 0;
  const deps = settings(fixture, () => { count++; });
  deps.env.NPM_TOKEN = 'forbidden';
  await assert.rejects(() => publish(fixture.root, options(fixture.plan), deps));
  assert.equal(count, 0);
  assert.equal(readJson(path.join(fixture.root, 'receipts/receipt.json')).status, 'blocked');
});

test('reruns fail closed because a published version can never be replaced', async t => {
  const fixture = artifactFixture(t);
  const deps = settings(fixture, () => assert.fail('must not publish'));
  deps.env.GITHUB_RUN_ATTEMPT = '2';
  await assert.rejects(() => publish(fixture.root, options(fixture.plan), deps), /retries/);
});

test('publish response must contain a matching identity and integrity', t => {
  const { manifest } = artifactFixture(t);
  const pkg = manifest.packages[0];
  for (const result of [{}, { [pkg.name]: { ...pkg, version: '1.2.3' } }, { [pkg.name]: { ...pkg, integrity: 'wrong' } }]) {
    assert.throws(() => publishedFromOutput(JSON.stringify(result), pkg));
  }
  assert.equal(publishedFromOutput(JSON.stringify({ [pkg.name]: pkg }), pkg), `${pkg.name}@${pkg.version}`);
});

test('one unresolved package does not stop the rest, and each is attempted once', async t => {
  const fixture = artifactFixture(t);
  const logged = [];
  let count = 0;
  await assert.rejects(() => publish(fixture.root, options(fixture.plan), settings(fixture, () => {
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

test('npm diagnostics reach the log without a token or the receipt', async t => {
  const fixture = artifactFixture(t);
  const token = `npm_${'a'.repeat(36)}`;
  const logged = [];
  await assert.rejects(() => publish(fixture.root, options(fixture.plan), settings(fixture,
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

// Trusted publishers are configured per package and cannot be configured at all
// for a package npm does not serve yet, so a package added to the repository
// reaches the publish job unconfigured. The probe has to catch that before the
// first package is published, and has to stay out of the way when the registry
// answers something that proves nothing.
function registry({ refuse = new Set(), status = 403, absent = new Set(), fail = new Set(), flaky = new Map(), retryAfter = null } = {}) {
  const calls = [];
  const attempts = new Map();
  const headers = { get: name => (name === 'retry-after' ? retryAfter : null) };
  return {
    calls,
    attempts,
    request(url, settings = {}) {
      calls.push(`${settings.method ?? 'GET'} ${url}`);
      if (!url.startsWith('https://registry.npmjs.org/')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ value: 'id-token' }) });
      }
      const name = decodeURIComponent(new URL(url).pathname.split('/package/').pop() ?? '');
      if (settings.method === 'HEAD') {
        const packed = decodeURIComponent(new URL(url).pathname.slice(1));
        return Promise.resolve({ ok: !absent.has(packed), status: absent.has(packed) ? 404 : 200 });
      }
      const attempt = (attempts.get(name) ?? 0) + 1;
      attempts.set(name, attempt);
      // A package that answers transiently for its first few attempts and then
      // works, which is what a rate limit or a restarting backend looks like.
      if (attempt <= (flaky.get(name) ?? 0)) return Promise.resolve({ ok: false, status: 429, headers });
      if (fail.has(name)) return Promise.reject(new Error('socket hang up'));
      if (refuse.has(name)) return Promise.resolve({ ok: false, status, headers });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ token: 'npm_exchanged' }) });
    },
  };
}
// Collects the backoff the probe asks for instead of sleeping through it.
function probeSettings(stub, logged = [], waits = []) {
  return {
    logged, waits,
    options: {
      env: trustEnvironment(), request: stub.request,
      log: message => logged.push(message),
      wait: ms => { waits.push(ms); return Promise.resolve(); },
    },
  };
}
const names = ['@modern-js/a', '@modern-js/b'];
const trustEnvironment = () => ({
  ...githubEnvironment(),
  GITHUB_REPOSITORY: 'web-infra-dev/modern.js',
  GITHUB_WORKFLOW_REF: 'web-infra-dev/modern.js/.github/workflows/release.yml@refs/heads/release-canary-verify/x',
});

test('every package is probed through the same exchange npm uses, and a token is never logged', async () => {
  const logged = [];
  const stub = registry();
  await assertTrustedPublishers(names, { env: trustEnvironment(), request: stub.request, log: message => logged.push(message) });
  assert.deepEqual(stub.calls.slice(1), [
    'POST https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/@modern-js%2fa',
    'POST https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/@modern-js%2fb',
  ]);
  assert.match(stub.calls[0], /audience=npm%3Aregistry.npmjs.org/);
  assert(!logged.join('\n').includes('npm_exchanged'));
});

test('a refused exchange blocks the release and names the command that repairs it', async () => {
  const logged = [];
  const stub = registry({ refuse: new Set(['@modern-js/b']) });
  await assert.rejects(
    () => assertTrustedPublishers(names, { env: trustEnvironment(), request: stub.request, log: message => logged.push(message) }),
    /1 of 2 packages have no trusted publisher/);
  assert.match(logged.join('\n'), /npm trust github @modern-js\/b --repo web-infra-dev\/modern.js --file release.yml --allow-publish/);
});

test('a package npm does not serve yet is reported as needing a first publish, not a binding', async () => {
  const logged = [];
  const stub = registry({ refuse: new Set(['@modern-js/b']), status: 404, absent: new Set(['@modern-js/b']) });
  await assert.rejects(() => assertTrustedPublishers(names, { env: trustEnvironment(), request: stub.request, log: message => logged.push(message) }));
  assert.match(logged.join('\n'), /@modern-js\/b: not on npm yet/);
  assert(!logged.join('\n').includes('npm trust github @modern-js/b'));
});

test('an answer that proves nothing is retried, then stops the release before the first package', async () => {
  for (const [stub, reason] of [
    [registry({ refuse: new Set(['@modern-js/a']), status: 503 }), /@modern-js\/a: HTTP 503/],
    [registry({ fail: new Set(['@modern-js/a']) }), /@modern-js\/a: connection failed/],
  ]) {
    const probe = probeSettings(stub);
    await assert.rejects(() => assertTrustedPublishers(names, probe.options), /1 of 2 packages could not be checked/);
    assert.equal(stub.attempts.get('@modern-js/a'), 4, 'The probe gives the registry four chances');
    assert.deepEqual(probe.waits, [2000, 4000, 8000], 'Backoff doubles and is never slept through in tests');
    assert.match(probe.logged.join('\n'), /Nothing was published; rerun the job/);
    assert.match(probe.logged.join('\n'), reason);
  }
});

test('a transient answer that clears on a retry publishes normally and honours Retry-After', async () => {
  const stub = registry({ flaky: new Map([['@modern-js/a', 2]]), retryAfter: '5' });
  const probe = probeSettings(stub);
  await assertTrustedPublishers(names, probe.options);
  assert.equal(stub.attempts.get('@modern-js/a'), 3);
  assert.deepEqual(probe.waits, [5000, 5000], 'The registry decides the wait while it answers with one');
  assert.deepEqual(probe.logged, []);
});

test('a refusal is reported as a refusal even when other packages went unanswered', async () => {
  const stub = registry({ refuse: new Set(['@modern-js/a', '@modern-js/b']), status: 403 });
  const probe = probeSettings(stub);
  await assert.rejects(() => assertTrustedPublishers(['@modern-js/a'], probe.options), /no trusted publisher/);
  assert.equal(stub.attempts.get('@modern-js/a'), 1, 'A conclusive refusal is never retried');
  // One package refused outright, the other never answered: the refusal is the
  // one a maintainer can act on, so it decides the error.
  const mixed = probeSettings(registry({ refuse: new Set(['@modern-js/a']), flaky: new Map([['@modern-js/b', ATTEMPTS]]) }));
  await assert.rejects(() => assertTrustedPublishers(names, mixed.options), /1 of 2 packages have no trusted publisher/);
  assert.match(mixed.logged.join('\n'), /npm trust github @modern-js\/a/);
  assert.match(mixed.logged.join('\n'), /1 of 2 packages could not be checked/);
});

test('a registry that is down for every package stops inside the probe budget', async () => {
  const stub = registry({ flaky: new Map(names.map(name => [name, ATTEMPTS])) });
  // A clock the test advances itself: every attempt costs the wait plus the time
  // a request that answers nothing spends before it is abandoned.
  let clock = 0;
  const logged = [];
  await assert.rejects(() => assertTrustedPublishers(names, {
    env: trustEnvironment(), request: stub.request,
    log: message => logged.push(message),
    wait: ms => { clock += ms + 150_000; return Promise.resolve(); },
    now: () => clock,
  }), /2 of 2 packages could not be checked/);
  assert.equal(stub.attempts.get('@modern-js/a'), 3, 'Retrying stops once the budget is spent');
  assert.equal(stub.attempts.get('@modern-js/b'), undefined, 'A package past the budget is never asked');
  assert.match(logged.join('\n'), /@modern-js\/b: not reached, the 5 minute probe budget ran out/);
});

test('Retry-After is read when it is usable and ignored when it is not', () => {
  const response = value => ({ headers: { get: () => value } });
  assert.equal(retryAfterMs(response('5')), 5000);
  assert.equal(retryAfterMs(response(new Date(21_000).toUTCString()), 1000), 20_000);
  for (const value of [null, '', '   ', 'soon', '-1', '3600', new Date(0).toUTCString()]) {
    assert.equal(retryAfterMs(response(value), 1000), null, `Retry-After: ${value}`);
  }
  assert.equal(retryAfterMs({}), null);
  assert.equal(retryAfterMs(null), null);
});

test('the probe fails closed when GitHub will not mint an identity token', async () => {
  const request = () => Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
  await assert.rejects(() => assertTrustedPublishers(names, { env: trustEnvironment(), request, log: () => {} }), /identity token/);
});

test('repair instructions fall back to placeholders outside a known workflow', () => {
  assert.match(repairInstructions('@modern-js/a', true, {}), /--repo <owner>\/<repository> --file <workflow>.yml/);
});

test('the publish job runs the probe before the first package and refuses to continue', async t => {
  const fixture = artifactFixture(t);
  let attempted = 0;
  const deps = settings(fixture, () => { attempted++; });
  deps.verifyTrust = (probed) => {
    assert.deepEqual(probed, fixture.manifest.packages.map(pkg => pkg.name));
    return Promise.reject(new Error('1 of 2 packages have no trusted publisher for this workflow'));
  };
  await assert.rejects(() => publish(fixture.root, options(fixture.plan), deps), /no trusted publisher/);
  assert.equal(attempted, 0, 'Nothing may be published once the probe refuses');
  const receipt = readJson(path.join(fixture.root, 'receipts/receipt.json'));
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.failure, 'preflight-failed');
});
