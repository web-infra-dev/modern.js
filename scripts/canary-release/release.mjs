import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  assertSource, assertTrigger, integrity, listWorkspaces, planHash, publishable,
  readJson, readTarball, releaseBranch, run, stagingBranch, validateDependencies,
  validatePackageSet, validatePlan, validateTarball, verifyArtifacts, writeJson,
} from './core.mjs';
import { install, prepare } from './prepare.mjs';
import { publish } from './publish.mjs';

export { stableStringify, planHash } from './core.mjs';

export function verify(root, expectedPlanHash, { trigger = true, staging = false } = {}) {
  const plan = validatePlan(readJson(path.join(root, '.release/canary-plan.json')));
  const hash = planHash(plan);
  if (expectedPlanHash) assert.equal(hash, expectedPlanHash, 'Expected plan hash mismatch');
  assertSource(root, plan, process.env.GITHUB_SHA);
  // The build half runs on the staging branch and publishes nothing; the
  // publishing half runs on the branch the channel prescribes. Both are
  // written exactly once, so both are held to the same create-only push.
  if (trigger) assertTrigger(plan, process.env, undefined, staging ? stagingBranch(plan) : releaseBranch(plan));
  const workspaces = listWorkspaces(root);
  validatePackageSet(plan, workspaces);
  for (const pkg of publishable(workspaces)) validateDependencies(pkg.json, plan);
  return { plan, planHash: hash };
}

export function pack(root, output, expectedPlanHash, { staging = false } = {}) {
  const { plan, planHash: hash } = verify(root, expectedPlanHash, { staging });
  const directory = path.resolve(root, output);
  fs.mkdirSync(directory, { recursive: true });
  assert.equal(fs.readdirSync(directory).length, 0, 'Artifact directory must be empty');
  const manifest = {
    schemaVersion: 1, releaseId: plan.releaseId, tag: plan.tag, version: plan.version,
    sourceSha: process.env.GITHUB_SHA, planHash: hash, packages: [],
  };
  for (const pkg of plan.packages) {
    const before = new Set(fs.readdirSync(directory));
    run('pnpm', ['pack', '--pack-destination', directory], { cwd: path.join(root, pkg.path), inherit: true });
    const added = fs.readdirSync(directory).filter(file => !before.has(file));
    assert.equal(added.length, 1, 'pnpm pack must produce one tarball');
    const filename = added[0];
    assert(/^[a-zA-Z0-9._-]+\.tgz$/.test(filename), 'Unexpected packed filename');
    const file = path.join(directory, filename);
    validateTarball(readTarball(file), pkg, plan);
    manifest.packages.push({ ...pkg, integrity: integrity(fs.readFileSync(file)), filename });
  }
  // Lifecycle scripts may write generated files, but never tracked source.
  assertSource(root, plan, process.env.GITHUB_SHA);
  writeJson(path.join(directory, 'manifest.json'), manifest);
  verifyArtifacts(directory, plan, hash, process.env.GITHUB_SHA);
  return manifest;
}

const BUILD_WORKFLOW = 'release-build.yml';
const SHA = /^[0-9a-f]{40}$/;
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/;

/**
 * The build run that packed this very commit.
 *
 * Publishing no longer builds: it takes the tarballs release-build.yml made
 * on the staging branch, which are the bytes every downstream repository was
 * tested against. Identifying that run by commit rather than by a value
 * passed in means there is nothing to get wrong between the two halves - the
 * artifacts either came from this source or they are not accepted.
 */
export async function locateBuild({
  sha = process.env.GITHUB_SHA, repository = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN, branch, fetchImpl = fetch,
} = {}) {
  assert(SHA.test(sha ?? ''), 'A full commit SHA is required to find its build');
  assert(REPOSITORY.test(repository ?? ''), 'A repository is required to find a build');
  assert(typeof token === 'string' && token.length > 0, 'A token that may read Actions runs is required');
  // Listed by commit rather than through /actions/workflows/<file>/runs: that
  // endpoint answers 404 for a workflow that is not on the default branch,
  // which is exactly the situation while this machinery lives on a branch.
  // The general listing carries each run's workflow path, so the filtering is
  // the same and the lookup works either way.
  const url = `https://api.github.com/repos/${repository}/actions/runs`
    + `?head_sha=${sha}&status=success&per_page=100`;
  const response = await fetchImpl(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
  });
  assert(response.ok, `Listing build runs returned HTTP ${response.status}`);
  const body = await response.json();
  const runs = (body.workflow_runs ?? []).filter(run => run.head_sha === sha
    && run.conclusion === 'success'
    && run.path === `.github/workflows/${BUILD_WORKFLOW}`
    && (branch === undefined || run.head_branch === branch));
  assert(runs.length > 0, `No successful ${BUILD_WORKFLOW} run packed ${sha}`);
  const run = runs.reduce((latest, candidate) => (candidate.run_number > latest.run_number ? candidate : latest));
  assert(Number.isSafeInteger(run.id) && run.id > 0, 'Unexpected build run id');
  assert(Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0, 'Unexpected build run attempt');
  return { id: run.id, attempt: run.run_attempt, branch: run.head_branch, sha };
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const definitions = {
    prepare: { 'release-id': { type: 'string' }, 'base-sha': { type: 'string' }, channel: { type: 'string' }, 'custom-tag': { type: 'string' } },
    install: {},
    verify: { 'expected-plan-hash': { type: 'string' }, staging: { type: 'boolean', default: false } },
    pack: { out: { type: 'string', default: '.release/artifacts' }, 'expected-plan-hash': { type: 'string' }, staging: { type: 'boolean', default: false } },
    'locate-build': {},
    'verify-artifacts': { artifacts: { type: 'string', default: '.release/artifacts' }, 'expected-plan-hash': { type: 'string' } },
    publish: {
      artifacts: { type: 'string', default: '.release/artifacts' },
      'receipt-dir': { type: 'string', default: '.release/receipts' },
      'expected-plan-hash': { type: 'string' },
    },
  };
  assert(Object.hasOwn(definitions, command), `Usage: release.mjs <${Object.keys(definitions).join('|')}> [options]`);
  const { values } = parseArgs({ args, options: definitions[command], strict: true, allowPositionals: false });
  const root = fs.realpathSync(process.cwd());
  if (command === 'prepare') {
    const result = prepare(root, values['release-id'], values['base-sha'], undefined,
      { channel: values.channel, customTag: values['custom-tag'] });
    console.log(JSON.stringify({
      releaseId: result.plan.releaseId, channel: result.plan.channel, tag: result.plan.tag,
      version: result.plan.version, planHash: result.planHash, predicted: result.predicted.packages,
    }));
  } else if (command === 'install') {
    install(root);
  } else if (command === 'verify') {
    const result = verify(root, values['expected-plan-hash'], { staging: values.staging });
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `plan_hash=${result.planHash}\nrelease_id=${result.plan.releaseId}\nchannel=${result.plan.channel}\ntag=${result.plan.tag}\n`);
    console.log(JSON.stringify({ releaseId: result.plan.releaseId, channel: result.plan.channel, tag: result.plan.tag, planHash: result.planHash, packages: result.plan.packages.length }));
  } else if (command === 'pack') {
    assert(values['expected-plan-hash'], '--expected-plan-hash is required');
    pack(root, values.out, values['expected-plan-hash'], { staging: values.staging });
  } else if (command === 'verify-artifacts') {
    const { plan } = verify(root, values['expected-plan-hash']);
    verifyArtifacts(path.resolve(root, values.artifacts), plan, values['expected-plan-hash'], process.env.GITHUB_SHA);
  } else if (command === 'locate-build') {
    const plan = validatePlan(readJson(path.join(root, '.release/canary-plan.json')));
    const build = await locateBuild({ branch: stagingBranch(plan) });
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT,
        `build_run_id=${build.id}\nbuild_run_attempt=${build.attempt}\n`);
    }
    console.log(JSON.stringify(build));
  } else if (command === 'publish') {
    await publish(root, {
      artifacts: values.artifacts, receiptDir: values['receipt-dir'], expectedPlanHash: values['expected-plan-hash'],
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
