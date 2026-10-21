import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { integrity, planHash, run, writeJson } from './core.mjs';

export const releaseId = 'r20261018-123456781234423482341234567890ab';
export const sourceSha = 'b'.repeat(40);
export const version = `0.0.0-canary-verify.${releaseId}`;
export const makePlan = () => ({
  schemaVersion: 1, releaseId, tag: 'canary-verify', version, baseSha: 'a'.repeat(40),
  packages: ['a', 'b'].map(name => ({ name: `@modern-js/${name}`, version, path: `packages/${name}` })),
  mode: 'publish', requiredTargets: ['npm'],
});

export function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

export function artifactFixture(t) {
  const root = temporary(t);
  const directory = path.join(root, 'artifacts');
  fs.mkdirSync(directory);
  const plan = makePlan();
  const manifest = {
    schemaVersion: 1, releaseId, tag: plan.tag, version, sourceSha,
    planHash: planHash(plan), packages: [],
  };
  for (const pkg of plan.packages) {
    const source = path.join(root, pkg.name.slice(11));
    writeJson(path.join(source, 'package/package.json'), {
      name: pkg.name, version: pkg.version,
      dependencies: pkg.name.endsWith('/a') ? { '@modern-js/b': version } : {},
    });
    const filename = `${pkg.name.slice(1).replace('/', '-')}.tgz`;
    run('tar', ['-czf', path.join(directory, filename), '-C', source, 'package']);
    manifest.packages.push({ ...pkg, filename, integrity: integrity(fs.readFileSync(path.join(directory, filename))) });
  }
  writeJson(path.join(directory, 'manifest.json'), manifest);
  writeJson(path.join(root, '.release/canary-plan.json'), plan);
  return { root, directory, plan, manifest };
}

export const githubEnvironment = () => ({
  GITHUB_ACTIONS: 'true', GITHUB_RUN_ATTEMPT: '1', GITHUB_RUN_ID: '123',
  GITHUB_SHA: sourceSha, GITHUB_REF: `refs/heads/release-canary-verify/${releaseId}`,
  GITHUB_REF_TYPE: 'branch', GITHUB_EVENT_NAME: 'push',
  ACTIONS_ID_TOKEN_REQUEST_URL: 'https://example.invalid/oidc',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'test-only', PATH: process.env.PATH,
});

export const pushEvent = () => ({
  created: true, forced: false, deleted: false, before: '0'.repeat(40), after: sourceSha,
});
