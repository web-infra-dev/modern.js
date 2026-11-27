import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  assertSource,
  assertTrigger,
  integrity,
  listWorkspaces,
  planHash,
  publishable,
  readJson,
  readTarball,
  releaseBranch,
  run,
  stagingBranch,
  validateDependencies,
  validatePackageSet,
  validatePlan,
  validateTarball,
  verifyArtifacts,
  writeJson,
} from './core.mjs';
import { install, prepare } from './prepare.mjs';
import { publish } from './publish.mjs';

export { stableStringify, planHash } from './core.mjs';

export function verify(
  root,
  expectedPlanHash,
  { trigger = true, staging = false } = {},
) {
  const plan = validatePlan(
    readJson(path.join(root, '.release/canary-plan.json')),
  );
  const hash = planHash(plan);
  if (expectedPlanHash)
    assert.equal(hash, expectedPlanHash, 'Expected plan hash mismatch');
  assertSource(root, plan, process.env.GITHUB_SHA);
  // The build half runs on the staging branch and publishes nothing; the
  // publishing half runs on the branch the channel prescribes. Both are
  // written exactly once, so both are held to the same create-only push.
  if (trigger)
    assertTrigger(
      plan,
      process.env,
      undefined,
      staging ? stagingBranch(plan) : releaseBranch(plan),
    );
  const workspaces = listWorkspaces(root);
  validatePackageSet(plan, workspaces);
  for (const pkg of publishable(workspaces))
    validateDependencies(pkg.json, plan);
  return { plan, planHash: hash };
}

export function pack(root, output, expectedPlanHash, { staging = false } = {}) {
  const { plan, planHash: hash } = verify(root, expectedPlanHash, { staging });
  const directory = path.resolve(root, output);
  fs.mkdirSync(directory, { recursive: true });
  assert.equal(
    fs.readdirSync(directory).length,
    0,
    'Artifact directory must be empty',
  );
  const manifest = {
    schemaVersion: 1,
    releaseId: plan.releaseId,
    tag: plan.tag,
    version: plan.version,
    sourceSha: process.env.GITHUB_SHA,
    planHash: hash,
    packages: [],
  };
  for (const pkg of plan.packages) {
    const before = new Set(fs.readdirSync(directory));
    run('pnpm', ['pack', '--pack-destination', directory], {
      cwd: path.join(root, pkg.path),
      inherit: true,
    });
    const added = fs.readdirSync(directory).filter(file => !before.has(file));
    assert.equal(added.length, 1, 'pnpm pack must produce one tarball');
    const filename = added[0];
    assert(
      /^[a-zA-Z0-9._-]+\.tgz$/.test(filename),
      'Unexpected packed filename',
    );
    const file = path.join(directory, filename);
    validateTarball(readTarball(file), pkg, plan);
    manifest.packages.push({
      ...pkg,
      integrity: integrity(fs.readFileSync(file)),
      filename,
    });
  }
  // Lifecycle scripts may write generated files, but never tracked source.
  assertSource(root, plan, process.env.GITHUB_SHA);
  writeJson(path.join(directory, 'manifest.json'), manifest);
  verifyArtifacts(directory, plan, hash, process.env.GITHUB_SHA);
  return manifest;
}

const BUILD_WORKFLOW = 'release-build.yml';
const SHA = /^[0-9a-f]{40}$/;
const HASH = /^[0-9a-f]{64}$/;
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/;

/** The tag the release pipeline writes when a release passes its gate. */
export const approvalTag = plan => `release-approval/${plan.releaseId}`;

async function getJson(fetchImpl, token, url, what) {
  const response = await fetchImpl(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
  });
  assert(response.ok, `${what} returned HTTP ${response.status}`);
  return response.json();
}

function assertLookup({ sha, repository, token }) {
  assert(
    SHA.test(sha ?? ''),
    'A full commit SHA is required to find its build',
  );
  assert(
    REPOSITORY.test(repository ?? ''),
    'A repository is required to find a build',
  );
  assert(
    typeof token === 'string' && token.length > 0,
    'A token that may read Actions runs is required',
  );
}

/**
 * Which build the release was approved with.
 *
 * The same commit can be built more than once - anyone with write access can
 * re-run the build - and a second build is not guaranteed to produce the same
 * bytes. So "the newest successful build of this commit" is not necessarily
 * what downstream repositories were tested against. The release pipeline
 * records the build it tested in an annotated tag before it creates the
 * release branch, and this side publishes that build or nothing.
 *
 * The tag is an annotated tag pointing at the release commit; its message is
 * the approval as JSON. Only the release App may create release-approval/
 * tags (repository ruleset), which is what makes its contents trustworthy.
 */
export async function readApproval({
  plan,
  sha = process.env.GITHUB_SHA,
  repository = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN,
  fetchImpl = fetch,
} = {}) {
  assertLookup({ sha, repository, token });
  const name = approvalTag(plan);
  const api = `https://api.github.com/repos/${repository}/git`;
  const ref = await getJson(
    fetchImpl,
    token,
    `${api}/ref/tags/${name}`,
    `Reading the approval tag ${name}`,
  );
  assert.equal(ref.ref, `refs/tags/${name}`, 'Unexpected approval ref');
  assert.equal(
    ref.object?.type,
    'tag',
    'The approval must be an annotated tag written by the release pipeline',
  );
  const tag = await getJson(
    fetchImpl,
    token,
    `${api}/tags/${ref.object.sha}`,
    `Reading the approval tag object ${ref.object.sha}`,
  );
  assert.equal(tag.tag, name, 'Unexpected approval tag name');
  assert.equal(tag.object?.type, 'commit', 'The approval must tag a commit');
  assert.equal(
    tag.object?.sha,
    sha,
    'The approval was given for another commit',
  );
  let approval;
  try {
    approval = JSON.parse(tag.message);
  } catch {
    throw new Error('The approval tag message is not JSON');
  }
  assert.deepEqual(
    Object.keys(approval ?? {}).sort(),
    [
      'buildRunAttempt',
      'buildRunId',
      'manifestSha256',
      'releaseId',
      'schemaVersion',
    ],
    'Unexpected approval fields',
  );
  assert.equal(approval.schemaVersion, 1, 'Unsupported approval schema');
  assert.equal(
    approval.releaseId,
    plan.releaseId,
    'The approval belongs to another release',
  );
  assert(
    Number.isSafeInteger(approval.buildRunId) && approval.buildRunId > 0,
    'Unexpected approved build run id',
  );
  assert(
    Number.isSafeInteger(approval.buildRunAttempt) &&
      approval.buildRunAttempt > 0,
    'Unexpected approved build run attempt',
  );
  assert(HASH.test(approval.manifestSha256), 'Unexpected approved manifest');
  return approval;
}

/**
 * The approved build, checked against this very commit.
 *
 * The run is fetched by the id and attempt the approval names - never "the
 * newest one" - so a later run or a re-run attempt of the same commit cannot
 * take its place. The approval's manifest digest is checked again after the
 * artifacts are downloaded, before anything is published.
 */
export async function locateBuild({
  approval,
  sha = process.env.GITHUB_SHA,
  repository = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN,
  branch,
  fetchImpl = fetch,
} = {}) {
  assertLookup({ sha, repository, token });
  assert(approval, 'An approval is required to find the build to publish');
  const run = await getJson(
    fetchImpl,
    token,
    `https://api.github.com/repos/${repository}/actions/runs/${approval.buildRunId}/attempts/${approval.buildRunAttempt}`,
    `Reading approved build run ${approval.buildRunId} attempt ${approval.buildRunAttempt}`,
  );
  assert.equal(run.id, approval.buildRunId, 'Unexpected build run');
  assert.equal(
    run.run_attempt,
    approval.buildRunAttempt,
    'Unexpected build run attempt',
  );
  assert.equal(run.head_sha, sha, 'The approved build packed another commit');
  assert.equal(
    run.path,
    `.github/workflows/${BUILD_WORKFLOW}`,
    `The approved run is not a ${BUILD_WORKFLOW} run`,
  );
  if (branch !== undefined)
    assert.equal(
      run.head_branch,
      branch,
      'The approved build ran on another branch',
    );
  assert.equal(run.status, 'completed', 'The approved build has not finished');
  assert.equal(run.conclusion, 'success', 'The approved build did not succeed');
  return {
    id: run.id,
    attempt: run.run_attempt,
    branch: run.head_branch,
    sha,
    manifestSha256: approval.manifestSha256,
  };
}

/** Hold the downloaded manifest to the digest the release was approved with. */
export function assertApprovedManifest(directory, manifestSha256) {
  assert(
    HASH.test(manifestSha256 ?? ''),
    'An approved manifest digest is required',
  );
  const manifest = readJson(path.join(directory, 'manifest.json'));
  assert.equal(
    planHash(manifest),
    manifestSha256,
    'The downloaded artifacts are not the build this release was approved with',
  );
  return manifest;
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const definitions = {
    prepare: {
      'release-id': { type: 'string' },
      'base-sha': { type: 'string' },
      channel: { type: 'string' },
      'custom-tag': { type: 'string' },
    },
    install: {},
    verify: {
      'expected-plan-hash': { type: 'string' },
      staging: { type: 'boolean', default: false },
    },
    pack: {
      out: { type: 'string', default: '.release/artifacts' },
      'expected-plan-hash': { type: 'string' },
      staging: { type: 'boolean', default: false },
    },
    'locate-build': {},
    'verify-artifacts': {
      artifacts: { type: 'string', default: '.release/artifacts' },
      'expected-plan-hash': { type: 'string' },
    },
    publish: {
      artifacts: { type: 'string', default: '.release/artifacts' },
      'receipt-dir': { type: 'string', default: '.release/receipts' },
      'expected-plan-hash': { type: 'string' },
      // The digest of the approved build's manifest, from the approval tag.
      'manifest-sha256': { type: 'string' },
      // Finishes a release whose publish stopped part way: the registry is
      // asked which versions it already serves and only the rest are sent.
      reconcile: { type: 'boolean', default: false },
      // How many packages are sent at once. Lower it to one to put a release
      // back on the old one-at-a-time path without changing this script.
      concurrency: { type: 'string' },
    },
  };
  assert(
    Object.hasOwn(definitions, command),
    `Usage: release.mjs <${Object.keys(definitions).join('|')}> [options]`,
  );
  const { values } = parseArgs({
    args,
    options: definitions[command],
    strict: true,
    allowPositionals: false,
  });
  const root = fs.realpathSync(process.cwd());
  if (command === 'prepare') {
    const result = prepare(
      root,
      values['release-id'],
      values['base-sha'],
      undefined,
      { channel: values.channel, customTag: values['custom-tag'] },
    );
    console.log(
      JSON.stringify({
        releaseId: result.plan.releaseId,
        channel: result.plan.channel,
        tag: result.plan.tag,
        version: result.plan.version,
        planHash: result.planHash,
        predicted: result.predicted.packages,
      }),
    );
  } else if (command === 'install') {
    install(root);
  } else if (command === 'verify') {
    const result = verify(root, values['expected-plan-hash'], {
      staging: values.staging,
    });
    if (process.env.GITHUB_OUTPUT)
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `plan_hash=${result.planHash}\nrelease_id=${result.plan.releaseId}\nchannel=${result.plan.channel}\ntag=${result.plan.tag}\n`,
      );
    console.log(
      JSON.stringify({
        releaseId: result.plan.releaseId,
        channel: result.plan.channel,
        tag: result.plan.tag,
        planHash: result.planHash,
        packages: result.plan.packages.length,
      }),
    );
  } else if (command === 'pack') {
    assert(values['expected-plan-hash'], '--expected-plan-hash is required');
    pack(root, values.out, values['expected-plan-hash'], {
      staging: values.staging,
    });
  } else if (command === 'verify-artifacts') {
    const { plan } = verify(root, values['expected-plan-hash']);
    verifyArtifacts(
      path.resolve(root, values.artifacts),
      plan,
      values['expected-plan-hash'],
      process.env.GITHUB_SHA,
    );
  } else if (command === 'locate-build') {
    const plan = validatePlan(
      readJson(path.join(root, '.release/canary-plan.json')),
    );
    const approval = await readApproval({ plan });
    const build = await locateBuild({ approval, branch: stagingBranch(plan) });
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `build_run_id=${build.id}\nbuild_run_attempt=${build.attempt}\nmanifest_sha256=${build.manifestSha256}\n`,
      );
    }
    console.log(JSON.stringify(build));
  } else if (command === 'publish') {
    // Before anything else: these must be the bytes the release was approved
    // with, not merely bytes this commit produced.
    assertApprovedManifest(
      path.resolve(root, values.artifacts),
      values['manifest-sha256'],
    );
    await publish(root, {
      artifacts: values.artifacts,
      receiptDir: values['receipt-dir'],
      expectedPlanHash: values['expected-plan-hash'],
      reconcile: values.reconcile,
      ...(values.concurrency === undefined
        ? {}
        : { concurrency: Number(values.concurrency) }),
    });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
