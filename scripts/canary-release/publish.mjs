import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  REGISTRY, TAG, assertSource, assertTrigger, listWorkspaces, readJson, run,
  validatePackageSet, verifyArtifacts, writeJson,
} from './core.mjs';

// Staged publishing would hold every package until a maintainer approved it,
// but npm accepts no CI identity for that approval: `npm stage approve` requires
// interactive authentication and refuses OIDC tokens. Approving would mean a
// long lived npm token wherever the approval runs, which is worse than what the
// gate buys. The release is therefore public the moment npm accepts it, and its
// isolation rests on the 0.0.0 version, which no semver range matches, and on a
// dist-tag of its own, which leaves `latest` untouched.
export function publishArguments(tarball) {
  return ['publish', tarball, '--tag', TAG, '--access', 'public', '--ignore-scripts', '--json', '--registry', REGISTRY];
}

export function publishedFromOutput(stdout, pkg) {
  const result = JSON.parse(stdout);
  // npm 11.21.0 logTar emits a package-name-keyed object for publish --json.
  const entry = result[pkg.name];
  assert(entry && entry.name === pkg.name && entry.version === pkg.version, 'Unexpected npm publish response');
  assert.equal(entry.integrity, pkg.integrity, 'npm published integrity mismatch');
  return `${pkg.name}@${pkg.version}`;
}

// npm reports its machine readable cause as `npm error code E403`, or as
// `error.code` under --json. Only that token is allowed into the receipt: it
// separates a missing trusted publisher from a rate limit or a permission
// problem, and being a fixed shape it cannot carry registry text.
const ERROR_CODE = /^\s*npm (?:error|ERR!) code ([A-Z][A-Z0-9_]{1,30})\s*$/m;
const CODE = /^[A-Z][A-Z0-9_]{1,30}$/;

export function npmErrorCode(result) {
  for (const stream of [result.stderr, result.stdout]) {
    const match = ERROR_CODE.exec(String(stream ?? ''));
    if (match) return match[1];
  }
  try {
    const code = JSON.parse(String(result.stdout ?? ''))?.error?.code;
    if (typeof code === 'string' && CODE.test(code)) return code;
  } catch { /* npm did not answer with JSON */ }
  const spawned = result.error?.code;
  return typeof spawned === 'string' && CODE.test(spawned) ? spawned : null;
}

// Token shaped values, in case npm ever echoes the credential it exchanged.
const SECRET = /(npm_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{16,}|eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}|[A-Za-z0-9+/]{40,}={0,2})/g;
const DIAGNOSTIC_LINES = 40;
const DIAGNOSTIC_CHARS = 4000;

// The job log only. The receipt is published as an artifact, so it keeps the
// error code alone; this keeps npm's own wording, minus anything token shaped,
// where a maintainer reading the failed run can see it.
export function diagnostic(result) {
  const lines = [String(result.stdout ?? ''), String(result.stderr ?? '')]
    .join('\n').split('\n').filter(line => /^\s*npm (error|warn|ERR!|notice)\b/.test(line));
  try {
    const summary = JSON.parse(String(result.stdout ?? ''))?.error?.summary;
    if (typeof summary === 'string') lines.push(summary);
  } catch { /* npm did not answer with JSON */ }
  if (!lines.length) return `no npm diagnostic (exit ${result.status ?? result.error?.code ?? 'unknown'})`;
  return lines.slice(0, DIAGNOSTIC_LINES).join('\n').replace(SECRET, '[redacted]').slice(0, DIAGNOSTIC_CHARS);
}

// npm exchanges the GitHub identity token for a short lived registry token once
// per package, at `/-/npm/v1/oidc/token/exchange/package/<name>`. Its own failure
// is silent: npm logs at verbose level, returns no token and publishes with no
// credential at all, so a package without a trusted publisher for this workflow
// surfaces as ENEEDAUTH or E404 in the middle of a run whose earlier packages are
// already public and can never be replaced. Running that same exchange for every
// package first turns a half published release into a release that published
// nothing. A newly added package cannot be configured in advance: npm requires
// the package to exist before a trusted publisher can be created for it.
const EXCHANGE = '/-/npm/v1/oidc/token/exchange/package/';
// Only the registry refusing the exchange proves the configuration is missing.
// A transport error, a server error or a rate limit proves nothing and must not
// block a release that npm's own exchange may still complete.
const CONCLUSIVE = new Set([400, 401, 403, 404]);
const escapeName = name => name.replace('/', '%2f');

async function identityToken(env, request) {
  const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  url.searchParams.set('audience', `npm:${new URL(REGISTRY).hostname}`);
  const response = await request(url.href, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
  });
  assert(response.ok, 'GitHub refused to mint an OIDC identity token');
  const body = await response.json();
  assert(typeof body?.value === 'string' && body.value, 'GitHub returned no OIDC identity token');
  return body.value;
}

// The command a maintainer has to run for each package the exchange refused.
// Packages that npm does not serve at all need a first publish through the normal
// release pipeline before any trusted publisher can exist for them.
export function repairInstructions(name, known, env) {
  const repository = env.GITHUB_REPOSITORY ?? '<owner>/<repository>';
  const workflow = (env.GITHUB_WORKFLOW_REF ?? '').split('@')[0].split('/').pop() || '<workflow>.yml';
  if (!known) return `${name}: not on npm yet; publish it once through the normal release pipeline, then configure a trusted publisher`;
  return `${name}: npm trust github ${name} --repo ${repository} --file ${workflow} --allow-publish --allow-stage-publish --yes`;
}

export async function assertTrustedPublishers(names, {
  env = process.env,
  request = (...args) => fetch(...args),
  log = message => console.error(message),
} = {}) {
  const token = await identityToken(env, request);
  const refused = [];
  const unchecked = [];
  for (const name of names) {
    let response;
    try {
      response = await request(new URL(`${EXCHANGE}${escapeName(name)}`, REGISTRY).href, {
        method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
    } catch {
      unchecked.push(name);
      continue;
    }
    if (response.ok) {
      // The body carries a usable publish credential. Read it only to confirm one
      // was issued, never log it and never keep it.
      const issued = await response.json().then(body => Boolean(body?.token), () => false);
      if (issued) continue;
      refused.push(name);
    } else if (CONCLUSIVE.has(response.status)) {
      refused.push(name);
    } else {
      unchecked.push(name);
    }
  }
  if (unchecked.length) log(`[preflight] ${unchecked.length} package(s) could not be checked; npm decides at publish time: ${unchecked.join(', ')}`);
  if (refused.length) {
    log(`[preflight] ${refused.length} of ${names.length} packages cannot publish from this workflow. Nothing was published.`);
    // The registry answers 401 for every package when it rejects the identity
    // itself, which looks exactly like every package missing its configuration.
    if (refused.length === names.length) log('[preflight] Every package was refused: suspect the workflow identity before the per-package configuration.');
    for (const name of refused) {
      const known = await request(new URL(`/${escapeName(name)}`, REGISTRY).href, { method: 'HEAD' })
        .then(response => response.status !== 404, () => true);
      log(`  ${repairInstructions(name, known, env)}`);
    }
  }
  assert.equal(refused.length, 0, `${refused.length} of ${names.length} packages have no trusted publisher for this workflow`);
}

export function isolatedNpmEnvironment(env, temporary) {
  for (const key of ['NODE_AUTH_TOKEN', 'NPM_TOKEN', 'NPM_AUTH_TOKEN']) {
    assert(!env[key], 'Personal npm tokens are not allowed');
  }
  assert(env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'GitHub OIDC is required');
  const clean = {};
  for (const [key, value] of Object.entries(env)) {
    if (/^(GITHUB_|RUNNER_)/.test(key) || ['PATH', 'SystemRoot', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN'].includes(key)) clean[key] = value;
  }
  return {
    ...clean, HOME: temporary, CI: 'true',
    NPM_CONFIG_USERCONFIG: path.join(temporary, 'user.npmrc'),
    NPM_CONFIG_GLOBALCONFIG: path.join(temporary, 'global.npmrc'),
    NPM_CONFIG_CACHE: path.join(temporary, 'cache'),
    NPM_CONFIG_REGISTRY: REGISTRY,
  };
}

// Records that npm accepted each package, never that the registry already serves
// it: propagation is verified separately against the registry bytes. Every attempt
// is recorded before the network call so an interrupted request remains explicitly
// unknown. A package that fails does not stop the ones after it: each publish is a
// separate request, stopping cannot recall the requests already sent, and one run
// that reports all 29 outcomes beats 29 runs that each report one.
export async function publish(root, options, {
  env = process.env,
  validateSource = assertSource,
  validateTrigger = assertTrigger,
  workspaces = listWorkspaces,
  execute = run,
  npm = (args, settings) => spawnSync('npm', args, { ...settings, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }),
  log = message => console.error(message),
  verifyTrust = assertTrustedPublishers,
} = {}) {
  const receiptDir = path.resolve(root, options.receiptDir);
  fs.mkdirSync(receiptDir, { recursive: true });
  const receiptFile = path.join(receiptDir, 'receipt.json');
  assert(!fs.existsSync(receiptFile), 'Existing receipt: inspect it before retrying with a new releaseId');
  const receipt = {
    schemaVersion: 1, mode: 'publish', publicAvailable: true, status: 'validating',
    sourceSha: env.GITHUB_SHA ?? null, planHash: options.expectedPlanHash ?? null,
    releaseId: null, tag: TAG, version: null, runId: env.GITHUB_RUN_ID ?? null,
    runAttempt: env.GITHUB_RUN_ATTEMPT ?? null, packages: [],
  };
  function persist() {
    writeJson(receiptFile, receipt);
  }
  persist();
  let temporary;
  try {
    assert.equal(env.GITHUB_ACTIONS, 'true', 'Publishing runs only in GitHub Actions');
    // A previous attempt may have reached the registry without returning a receipt,
    // and a published version can never be replaced.
    assert.equal(env.GITHUB_RUN_ATTEMPT, '1', 'Automatic publish retries are disabled; reconcile the registry first');
    const plan = readJson(path.join(root, '.release/canary-plan.json'));
    const manifest = verifyArtifacts(path.resolve(root, options.artifacts), plan, options.expectedPlanHash, env.GITHUB_SHA);
    receipt.releaseId = plan.releaseId;
    receipt.version = plan.version;
    validateSource(root, plan, env.GITHUB_SHA);
    validateTrigger(plan, env);
    validatePackageSet(plan, workspaces(root));
    temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-npm-'));
    const npmEnv = isolatedNpmEnvironment(env, temporary);
    fs.writeFileSync(npmEnv.NPM_CONFIG_USERCONFIG, '');
    fs.writeFileSync(npmEnv.NPM_CONFIG_GLOBALCONFIG, '');
    assert.equal(execute('npm', ['--version'], { cwd: temporary, env: npmEnv }), '11.21.0', 'npm 11.21.0 is required');
    // Everything checkable offline has passed; ask the registry last, and only
    // about whether it would accept this workflow for each package.
    await verifyTrust(manifest.packages.map(pkg => pkg.name), { env, log });
    receipt.status = 'publishing';
    persist();
    let unresolved = 0;
    for (const pkg of manifest.packages) {
      const item = { name: pkg.name, version: pkg.version, integrity: pkg.integrity, status: 'unknown' };
      receipt.packages.push(item);
      persist();
      const result = npm(publishArguments(path.resolve(root, options.artifacts, pkg.filename)), { cwd: temporary, env: npmEnv });
      // Even a nonzero result can mean the registry accepted a request. Do not retry.
      try {
        assert(!result.error && result.status === 0, 'npm exited nonzero');
        publishedFromOutput(result.stdout, pkg);
        item.status = 'published';
      } catch (error) {
        unresolved += 1;
        item.exitCode = result.status ?? null;
        item.errorCode = npmErrorCode(result);
        log(`[publish] ${pkg.name} unresolved: ${String(error.message).replace(SECRET, '[redacted]')}`);
        log(diagnostic(result));
      }
      persist();
    }
    assert.equal(unresolved, 0, `${unresolved} of ${manifest.packages.length} packages failed or returned an ambiguous outcome; inspect the registry before retrying`);
    receipt.status = 'published';
    persist();
    return receipt;
  } catch (error) {
    receipt.status = receipt.packages.length ? 'partial-or-unknown' : 'blocked';
    receipt.failure = receipt.packages.length ? 'publish-request-failed-or-unconfirmed' : 'preflight-failed';
    persist();
    throw error;
  } finally {
    if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
  }
}
