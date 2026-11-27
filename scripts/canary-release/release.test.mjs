import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from '@rstest/core';
import {
  assertTrigger,
  planHash,
  releaseBranch,
  stagingBranch,
} from './core.mjs';
import {
  approvalTag,
  assertApprovedManifest,
  locateBuild,
  readApproval,
} from './release.mjs';
import {
  githubEnvironment,
  makePlan,
  pushEvent,
  releaseId,
  sourceSha,
} from './fixtures.mjs';

const REPOSITORY = 'web-infra-dev/modern.js';
const API = `https://api.github.com/repos/${REPOSITORY}`;
const TAG_OBJECT = 'd'.repeat(40);
const MANIFEST_SHA = 'e'.repeat(64);

const approvalOf = (overrides = {}) => ({
  schemaVersion: 1,
  releaseId,
  buildRunId: 40510322539,
  buildRunAttempt: 1,
  manifestSha256: MANIFEST_SHA,
  ...overrides,
});

// Answers only the exact URLs the code is expected to ask for, so a lookup
// that drifts to another endpoint (say, "the newest run of this commit")
// fails instead of being handed a convenient answer.
function github(routes) {
  const asked = [];
  const fetchImpl = async (url, init) => {
    asked.push(url);
    assert.equal(init.headers.authorization, 'Bearer test-only');
    assert.ok(Object.hasOwn(routes, url), `unexpected request ${url}`);
    const body = routes[url];
    if (typeof body === 'number')
      return { ok: false, status: body, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => structuredClone(body) };
  };
  return { fetchImpl, asked };
}

const tagRoutes = ({ ref = {}, tag = {}, message } = {}) => ({
  [`${API}/git/ref/tags/release-approval/${releaseId}`]: {
    ref: `refs/tags/release-approval/${releaseId}`,
    object: { type: 'tag', sha: TAG_OBJECT },
    ...ref,
  },
  [`${API}/git/tags/${TAG_OBJECT}`]: {
    tag: `release-approval/${releaseId}`,
    object: { type: 'commit', sha: sourceSha },
    message: message ?? JSON.stringify(approvalOf()),
    ...tag,
  },
});

const buildRun = (overrides = {}) => ({
  id: 40510322539,
  run_attempt: 1,
  run_number: 7,
  status: 'completed',
  conclusion: 'success',
  path: '.github/workflows/release-build.yml',
  head_sha: sourceSha,
  head_branch: stagingBranch(makePlan()),
  ...overrides,
});

const runRoute = (run, attempt = run.run_attempt, id = run.id) => ({
  [`${API}/actions/runs/${id}/attempts/${attempt}`]: run,
});

const lookup = (routes, extra = {}) => ({
  sha: sourceSha,
  repository: REPOSITORY,
  token: 'test-only',
  ...github(routes),
  ...extra,
});

test('the staging branch is where a release is built, and it is not a release branch', () => {
  const plan = makePlan();
  assert.equal(stagingBranch(plan), `canary-staging/${releaseId}`);
  assert.notEqual(stagingBranch(plan), releaseBranch(plan));
});

test('the build half accepts the staging branch and nothing else', () => {
  const plan = makePlan();
  const environment = {
    ...githubEnvironment(),
    GITHUB_REF: `refs/heads/${stagingBranch(plan)}`,
  };
  assertTrigger(plan, environment, pushEvent(), stagingBranch(plan));
  // Same create-only push rules as the publishing branch.
  assert.throws(() =>
    assertTrigger(
      plan,
      environment,
      { ...pushEvent(), created: false },
      stagingBranch(plan),
    ),
  );
  // The publishing branch is not a staging branch and the other way round.
  assert.throws(() => assertTrigger(plan, environment, pushEvent()));
  assert.throws(() =>
    assertTrigger(plan, githubEnvironment(), pushEvent(), stagingBranch(plan)),
  );
});

test('publishing reads the approval the pipeline tagged for this commit', async () => {
  const plan = makePlan();
  assert.equal(approvalTag(plan), `release-approval/${releaseId}`);
  assert.deepEqual(
    await readApproval({ plan, ...lookup(tagRoutes()) }),
    approvalOf(),
  );
});

test('an approval that is missing, lightweight, for another commit or release, or malformed is refused', async () => {
  const plan = makePlan();
  await assert.rejects(
    readApproval({
      plan,
      ...lookup({
        [`${API}/git/ref/tags/release-approval/${releaseId}`]: 404,
      }),
    }),
    /HTTP 404/,
  );
  for (const [routes, pattern] of [
    [
      tagRoutes({ ref: { object: { type: 'commit', sha: sourceSha } } }),
      /annotated tag/,
    ],
    [
      tagRoutes({ tag: { object: { type: 'commit', sha: 'c'.repeat(40) } } }),
      /another commit/,
    ],
    [tagRoutes({ tag: { tag: 'release-approval/other' } }), /tag name/],
    [tagRoutes({ message: 'approved' }), /not JSON/],
    [
      tagRoutes({
        message: JSON.stringify(
          approvalOf({ releaseId: 'r20260101000000-' + '0'.repeat(32) }),
        ),
      }),
      /another release/,
    ],
    [
      tagRoutes({ message: JSON.stringify({ ...approvalOf(), extra: true }) }),
      /Unexpected approval fields/,
    ],
    [
      tagRoutes({
        message: JSON.stringify(approvalOf({ buildRunAttempt: 0 })),
      }),
      /attempt/,
    ],
    [
      tagRoutes({
        message: JSON.stringify(approvalOf({ manifestSha256: 'x' })),
      }),
      /manifest/,
    ],
  ]) {
    await assert.rejects(readApproval({ plan, ...lookup(routes) }), pattern);
  }
});

test('publishing takes the approved build run and attempt', async () => {
  const build = await locateBuild({
    approval: approvalOf(),
    branch: stagingBranch(makePlan()),
    ...lookup(runRoute(buildRun())),
  });
  assert.deepEqual(build, {
    id: 40510322539,
    attempt: 1,
    branch: `canary-staging/${releaseId}`,
    sha: sourceSha,
    manifestSha256: MANIFEST_SHA,
  });
});

test('a later run or re-run attempt of the same commit cannot replace the approved build', async () => {
  // The approved run is attempt 1. A re-run (attempt 3) and a newer run of the
  // same commit both exist and both succeeded; neither is even asked for.
  const routes = {
    ...runRoute(buildRun()),
    ...runRoute(buildRun({ run_attempt: 3 }), 3),
    ...runRoute(buildRun({ id: 2, run_number: 9 }), 1, 2),
  };
  const client = lookup(routes);
  const build = await locateBuild({
    approval: approvalOf(),
    branch: stagingBranch(makePlan()),
    ...client,
  });
  assert.equal(build.id, 40510322539);
  assert.equal(build.attempt, 1);
  assert.deepEqual(client.asked, [
    `${API}/actions/runs/40510322539/attempts/1`,
  ]);
});

test('an approved run of another commit, branch, workflow or outcome is refused', async () => {
  for (const [run, pattern] of [
    [buildRun({ head_sha: 'c'.repeat(40) }), /another commit/],
    [buildRun({ conclusion: 'failure' }), /did not succeed/],
    [buildRun({ status: 'in_progress', conclusion: null }), /not finished/],
    [buildRun({ head_branch: 'main' }), /another branch/],
    [
      buildRun({ path: '.github/workflows/release.yml' }),
      /not a release-build/,
    ],
    [buildRun({ run_attempt: 2 }), /attempt/],
  ]) {
    await assert.rejects(
      locateBuild({
        approval: approvalOf(),
        branch: stagingBranch(makePlan()),
        ...lookup({ [`${API}/actions/runs/40510322539/attempts/1`]: run }),
      }),
      pattern,
    );
  }
  await assert.rejects(
    locateBuild({ branch: stagingBranch(makePlan()), ...lookup({}) }),
    /approval is required/,
  );
});

test('the downloaded artifacts must be the approved build, byte for byte in their manifest', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'approved-'));
  const manifest = {
    releaseId,
    packages: [{ name: '@modern-js/utils', integrity: 'sha512-a' }],
  };
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest),
  );
  assert.deepEqual(
    assertApprovedManifest(directory, planHash(manifest)),
    manifest,
  );
  // A rebuild of the same commit that packed different bytes.
  const rebuilt = {
    releaseId,
    packages: [{ name: '@modern-js/utils', integrity: 'sha512-b' }],
  };
  assert.throws(
    () => assertApprovedManifest(directory, planHash(rebuilt)),
    /not the build this release was approved with/,
  );
  assert.throws(
    () => assertApprovedManifest(directory, undefined),
    /digest is required/,
  );
});

test('publishing refuses to look for a build without a commit, repository or token', async () => {
  const approval = approvalOf();
  await assert.rejects(
    locateBuild({ approval, ...lookup({}, { sha: 'not-a-sha' }) }),
    /full commit SHA/,
  );
  await assert.rejects(
    locateBuild({ approval, ...lookup({}, { repository: 'modern.js' }) }),
    /repository is required/,
  );
  await assert.rejects(
    locateBuild({ approval, ...lookup({}, { token: '' }) }),
    /token that may read Actions runs/,
  );
  await assert.rejects(
    locateBuild({
      approval,
      ...lookup({ [`${API}/actions/runs/40510322539/attempts/1`]: 403 }),
    }),
    /HTTP 403/,
  );
});
