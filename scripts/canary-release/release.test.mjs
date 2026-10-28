import assert from 'node:assert/strict';
import test from 'node:test';
import { assertTrigger, releaseBranch, stagingBranch } from './core.mjs';
import { locateBuild } from './release.mjs';
import { githubEnvironment, makePlan, pushEvent, releaseId, sourceSha } from './fixtures.mjs';

const REPOSITORY = 'web-infra-dev/modern.js';

function listing(runs) {
  return async url => {
    // Not the per-workflow endpoint: it 404s for a workflow that is not on
    // the default branch, which is where this machinery lives today.
    assert.ok(url.includes('/actions/runs?'), url);
    assert.ok(!url.includes('/actions/workflows/'), url);
    assert.ok(url.includes(`head_sha=${sourceSha}`), url);
    return { ok: true, status: 200, json: async () => ({ workflow_runs: runs }) };
  };
}

const buildRun = (overrides = {}) => ({
  id: 40510322539, run_attempt: 1, run_number: 7, conclusion: 'success',
  path: '.github/workflows/release-build.yml',
  head_sha: sourceSha, head_branch: stagingBranch(makePlan()), ...overrides,
});

const options = (runs, extra = {}) => ({
  sha: sourceSha, repository: REPOSITORY, token: 'test-only',
  branch: stagingBranch(makePlan()), fetchImpl: listing(runs), ...extra,
});

test('the staging branch is where a release is built, and it is not a release branch', () => {
  const plan = makePlan();
  assert.equal(stagingBranch(plan), `canary-staging/${releaseId}`);
  assert.notEqual(stagingBranch(plan), releaseBranch(plan));
});

test('the build half accepts the staging branch and nothing else', () => {
  const plan = makePlan();
  const environment = { ...githubEnvironment(), GITHUB_REF: `refs/heads/${stagingBranch(plan)}` };
  assertTrigger(plan, environment, pushEvent(), stagingBranch(plan));
  // Same create-only push rules as the publishing branch.
  assert.throws(() => assertTrigger(plan, environment, { ...pushEvent(), created: false }, stagingBranch(plan)));
  // The publishing branch is not a staging branch and the other way round.
  assert.throws(() => assertTrigger(plan, environment, pushEvent()));
  assert.throws(() => assertTrigger(plan, githubEnvironment(), pushEvent(), stagingBranch(plan)));
});

test('publishing finds the one successful build of this exact commit', async () => {
  const build = await locateBuild(options([buildRun()]));
  assert.deepEqual(build, { id: 40510322539, attempt: 1, branch: `canary-staging/${releaseId}`, sha: sourceSha });
});

test('a rebuilt commit publishes the newest successful attempt', async () => {
  const build = await locateBuild(options([
    buildRun({ id: 1, run_number: 7, run_attempt: 1 }),
    buildRun({ id: 2, run_number: 9, run_attempt: 3 }),
  ]));
  assert.deepEqual(build, { id: 2, attempt: 3, branch: `canary-staging/${releaseId}`, sha: sourceSha });
});

test('a build of another commit, another branch or another outcome is not accepted', async () => {
  for (const run of [
    buildRun({ head_sha: 'c'.repeat(40) }),
    buildRun({ conclusion: 'failure' }),
    buildRun({ head_branch: 'main' }),
    buildRun({ path: '.github/workflows/release.yml' }),
  ]) {
    await assert.rejects(locateBuild(options([run])), /No successful release-build/);
  }
  await assert.rejects(locateBuild(options([])), /No successful release-build/);
});

test('publishing refuses to look for a build without a commit, repository or token', async () => {
  await assert.rejects(locateBuild(options([buildRun()], { sha: 'not-a-sha' })), /full commit SHA/);
  await assert.rejects(locateBuild(options([buildRun()], { repository: 'modern.js' })), /repository is required/);
  await assert.rejects(locateBuild(options([buildRun()], { token: '' })), /token that may read Actions runs/);
  await assert.rejects(locateBuild({
    ...options([]), fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({}) }),
  }), /HTTP 403/);
});
