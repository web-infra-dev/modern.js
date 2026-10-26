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
export function publishArguments(tarball, tag = TAG) {
  return ['publish', tarball, '--tag', tag, '--access', 'public', '--ignore-scripts', '--json', '--registry', REGISTRY];
}

// npm has now produced three different shapes for the same `publish --json`
// command: the pack manifest flat, an object keyed by package name holding that
// manifest, and an object keyed by package name holding only the version
// string. Two runs were spent on readers that understood one shape and rejected
// packages the registry had already accepted, so this one takes whichever field
// carries this package's version and, when none does, reports the structure it
// received. The response describes a tarball npm already holds and carries no
// credential, so its shape is safe to put in the job log.
function describeResponse(value, depth = 0) {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'string' ? `string ${JSON.stringify(value.slice(0, 48))}` : String(value === null ? 'null' : typeof value);
  }
  if (Array.isArray(value)) return `array[${value.length}]`;
  const keys = Object.keys(value).slice(0, 6);
  if (depth >= 1) return `object{${keys.join(',')}}`;
  return keys.map(key => `${key}: ${describeResponse(value[key], depth + 1)}`).join('; ').slice(0, 300) || 'empty object';
}

// npm redacts its own output before printing it, and a release id is the kind
// of thing its patterns catch: every package of runs 51 to 53 came back as
// 0.0.0-canary-verify.r<date>-[REDACTED_UUID] and matched nothing. The release
// id no longer has that shape, and a redacted field is accepted here as well,
// so the next pattern npm adds costs a weaker match rather than a whole run.
// The weaker match is bounded: npm exited zero, the response is keyed by this
// package, and the job after this one re-reads the registry and re-hashes the
// tarball it downloads against the same manifest.
const REDACTED = /\[REDACTED_[A-Z_]+\]/;
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function sameValue(actual, expected) {
  if (actual === expected) return true;
  if (typeof actual !== 'string' || !REDACTED.test(actual)) return false;
  const pattern = actual.split(REDACTED).map(escape).join('.+');
  return new RegExp(`^${pattern}$`).test(expected);
}

export function publishedFromOutput(stdout, pkg) {
  const result = JSON.parse(stdout);
  for (const candidate of [result, result?.[pkg.name]]) {
    const entry = typeof candidate === 'string' ? { name: pkg.name, version: candidate } : candidate;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    if (!sameValue(entry.name ?? pkg.name, pkg.name) || !sameValue(entry.version, pkg.version)) continue;
    // Checked when npm sends one, never required: the authoritative check is the
    // next job, which reads the registry metadata and re-hashes the tarball it
    // downloads against this same manifest.
    if (entry.integrity !== undefined) assert.ok(sameValue(entry.integrity, pkg.integrity), 'npm published integrity mismatch');
    return `${pkg.name}@${pkg.version}`;
  }
  assert.fail(`Unexpected npm publish response (${describeResponse(result)})`);
}

// npm reports its machine readable cause as `npm error code E403`, or as
// `error.code` under --json. Only that token is allowed into the receipt: it
// separates a missing trusted publisher from a rate limit or a permission
// problem, and being a fixed shape it cannot carry registry text.
const ERROR_CODE = /^\s*npm (?:error|ERR!) code ([A-Z][A-Z0-9_]{1,30})\s*$/m;
// Failures in the machinery around the upload rather than in the upload: npm
// could not read the workflow identity token from GitHub (run 52), or Sigstore
// refused the transparency log entry (run 57, a 409 for an entry it already
// held). Both are infrastructure having a bad minute, and both cost a package
// in an otherwise complete release.
//
// Sending one of these again is safe for a reason that does not depend on
// guessing how far the first attempt got: a version can never be published
// twice, so a repeat either lands or is refused, and either way the registry
// lookup below settles what is actually there by comparing the sha512 this job
// built. Everything else is left to that lookup rather than repeated.
const TRANSIENT_SUBMISSION = new Set([
  'IDENTITY_TOKEN_READ_ERROR', 'TLOG_CREATE_ENTRY_ERROR',
  'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED',
]);
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
// A transport error, a server error or a rate limit proves nothing either way,
// so the probe asks again rather than reading one as a refusal. What it must not
// do is read one as permission: publishing is the step that cannot be undone, and
// an unanswered package is exactly the package that fails in the middle of a run
// whose earlier packages are already public. Once the retries are spent the
// release stops, before the first package, and the job is rerun.
const CONCLUSIVE = new Set([400, 401, 403, 404]);
export const ATTEMPTS = 4;
const BACKOFF = 2_000;
const PROBE_TIMEOUT = 30_000;
// A longer wait than this is not worth holding a runner open for; failing and
// rerunning the job costs less, and nothing has been published yet.
const MAX_RETRY_AFTER = 60_000;
// A registry that is down for everything would otherwise cost every package its
// full retry schedule, holding a runner for an hour to reach a failure that the
// first few packages already decided. Once the budget is spent the rest are
// reported unchecked without being asked.
const BUDGET = 5 * 60_000;
const escapeName = name => name.replace('/', '%2f');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// `Retry-After` is either a count of seconds or an HTTP date. Anything absent,
// malformed, negative or beyond MAX_RETRY_AFTER falls back to the backoff.
export function retryAfterMs(response, now = Date.now()) {
  const header = response?.headers?.get?.('retry-after');
  if (!header) return null;
  const seconds = Number(header);
  const ms = String(header).trim() !== '' && Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now;
  return Number.isFinite(ms) && ms >= 0 && ms <= MAX_RETRY_AFTER ? ms : null;
}

// Resolves to 'allowed', 'refused', or 'unchecked' with the last thing the
// registry did, which is what a maintainer reading the failed run needs.
async function probePackage(name, token, request, { wait, now, deadline }) {
  let reason = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let response = null;
    try {
      response = await request(new URL(`${EXCHANGE}${escapeName(name)}`, REGISTRY).href, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
      });
    } catch (error) {
      reason = error?.name === 'TimeoutError' ? `no answer within ${PROBE_TIMEOUT / 1000}s` : 'connection failed';
    }
    if (response) {
      if (response.ok) {
        // The body carries a usable publish credential. Read it only to confirm
        // one was issued, never log it and never keep it.
        const issued = await response.json().then(body => Boolean(body?.token), () => false);
        return { state: issued ? 'allowed' : 'refused' };
      }
      if (CONCLUSIVE.has(response.status)) return { state: 'refused' };
      reason = `HTTP ${response.status}`;
    }
    if (attempt === ATTEMPTS || now() >= deadline) break;
    await wait(retryAfterMs(response) ?? BACKOFF * 2 ** (attempt - 1));
  }
  return { state: 'unchecked', reason };
}

async function identityToken(env, request) {
  const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  url.searchParams.set('audience', `npm:${new URL(REGISTRY).hostname}`);
  const response = await request(url.href, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
    signal: AbortSignal.timeout(PROBE_TIMEOUT),
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
  wait = delay,
  now = () => Date.now(),
} = {}) {
  const token = await identityToken(env, request);
  const deadline = now() + BUDGET;
  const refused = [];
  const unchecked = [];
  for (const name of names) {
    if (now() >= deadline) {
      unchecked.push(`${name}: not reached, the ${BUDGET / 60_000} minute probe budget ran out`);
      continue;
    }
    const result = await probePackage(name, token, request, { wait, now, deadline });
    if (result.state === 'refused') refused.push(name);
    else if (result.state === 'unchecked') unchecked.push(`${name}: ${result.reason}`);
  }
  if (refused.length) {
    log(`[preflight] ${refused.length} of ${names.length} packages cannot publish from this workflow. Nothing was published.`);
    // The registry answers 401 for every package when it rejects the identity
    // itself, which looks exactly like every package missing its configuration.
    if (refused.length === names.length) log('[preflight] Every package was refused: suspect the workflow identity before the per-package configuration.');
    for (const name of refused) {
      // Only decides the wording of the repair line, so a registry that will not
      // answer must not hold the failure open: assume the package exists.
      const known = await request(new URL(`/${escapeName(name)}`, REGISTRY).href, { method: 'HEAD', signal: AbortSignal.timeout(PROBE_TIMEOUT) })
        .then(response => response.status !== 404, () => true);
      log(`  ${repairInstructions(name, known, env)}`);
    }
  }
  if (unchecked.length) {
    log(`[preflight] ${unchecked.length} of ${names.length} packages could not be checked in ${ATTEMPTS} attempts. Nothing was published; rerun the job.`);
    for (const item of unchecked) log(`  ${item}`);
  }
  assert.equal(refused.length, 0, `${refused.length} of ${names.length} packages have no trusted publisher for this workflow`);
  assert.equal(unchecked.length, 0, `${unchecked.length} of ${names.length} packages could not be checked; nothing was published`);
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
// npm's exit code is not the last word on whether a package was published.
// Run 56 ended with 401 "Failed to generate Web Auth URLs" for a package that
// the registry was serving at that exact version minutes later: npm stored the
// publish and then failed at something after it. The registry is the authority,
// and the manifest already carries the sha512 of the tarball that was uploaded,
// so a package npm was unsure about is settled by asking for its metadata and
// comparing that hash. npm warns that a publish "may take a few minutes to
// become available", hence the budget rather than a single look.
const CONFIRM_BUDGET = 8 * 60_000;
const CONFIRM_INTERVAL = 20_000;

export async function confirmFromRegistry(items, {
  request = (...args) => fetch(...args),
  wait = delay,
  now = () => Date.now(),
  log = () => {},
  budgetMs = CONFIRM_BUDGET,
} = {}) {
  const deadline = now() + budgetMs;
  const pending = new Set(items);
  while (pending.size) {
    for (const item of [...pending]) {
      let metadata = null;
      try {
        const url = new URL(`/${escapeName(item.name)}/${encodeURIComponent(item.version)}`, REGISTRY).href;
        const response = await request(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(PROBE_TIMEOUT) });
        if (response.ok) metadata = await response.json().then(body => body, () => null);
      } catch { /* the budget decides, not one answer */ }
      if (!metadata) continue;
      // Only the exact bytes this job built count as this job's publication.
      if (metadata?.dist?.integrity !== item.integrity) {
        log(`[publish] ${item.name}@${item.version} is on the registry with different contents`);
        pending.delete(item);
        continue;
      }
      item.status = 'published';
      item.confirmedBy = 'registry';
      log(`[publish] ${item.name} was published after all; the registry serves this exact tarball`);
      pending.delete(item);
    }
    if (!pending.size || now() >= deadline) break;
    await wait(CONFIRM_INTERVAL);
  }
  return [...pending];
}

export async function publish(root, options, {
  env = process.env,
  validateSource = assertSource,
  validateTrigger = assertTrigger,
  workspaces = listWorkspaces,
  execute = run,
  npm = (args, settings) => spawnSync('npm', args, { ...settings, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }),
  log = message => console.error(message),
  verifyTrust = assertTrustedPublishers,
  confirm = confirmFromRegistry,
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
    receipt.tag = plan.tag;
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
    const unsure = [];
    for (const pkg of manifest.packages) {
      const item = { name: pkg.name, version: pkg.version, integrity: pkg.integrity, status: 'unknown' };
      receipt.packages.push(item);
      persist();
      const args = publishArguments(path.resolve(root, options.artifacts, pkg.filename), plan.tag);
      let result = npm(args, { cwd: temporary, env: npmEnv });
      if (result.status !== 0 && TRANSIENT_SUBMISSION.has(npmErrorCode(result))) {
        log(`[publish] ${pkg.name} retrying: ${npmErrorCode(result)} is the submission machinery, not a verdict`);
        result = npm(args, { cwd: temporary, env: npmEnv });
      }
      // Any other nonzero result can mean the registry accepted a request. Do not retry.
      try {
        assert(!result.error && result.status === 0, 'npm exited nonzero');
        publishedFromOutput(result.stdout, pkg);
        item.status = 'published';
      } catch (error) {
        unsure.push(item);
        item.exitCode = result.status ?? null;
        item.errorCode = npmErrorCode(result);
        log(`[publish] ${pkg.name} unresolved: ${String(error.message).replace(SECRET, '[redacted]')}`);
        log(diagnostic(result));
      }
      persist();
    }
    // Ask the registry about everything npm left in doubt, before deciding.
    const unresolved = unsure.length ? await confirm(unsure, { log }) : [];
    persist();
    if (unsure.length) log(`[publish] ${unsure.length - unresolved.length} of ${unsure.length} doubtful packages were confirmed by the registry`);
    assert.equal(unresolved.length, 0, `${unresolved.length} of ${manifest.packages.length} packages failed or returned an ambiguous outcome; inspect the registry before retrying`);
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
