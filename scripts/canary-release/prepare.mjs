import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  RELEASE_ID, TAG, dependencyFields, listWorkspaces, planHash, publishable,
  readJson, run, validateDependencies, validatePackageSet, validatePlan, writeJson,
} from './core.mjs';

export function withoutRootPrepare(root, operation) {
  const file = path.join(root, 'package.json');
  const original = fs.readFileSync(file);
  const json = JSON.parse(original);
  if (json.scripts) delete json.scripts.prepare;
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  try {
    return operation();
  } finally {
    fs.writeFileSync(file, original);
  }
}

export function install(root, execute = run) {
  return withoutRootPrepare(root, () => execute('pnpm', [
    'install', '--frozen-lockfile', '--config.dangerouslyAllowAllBuilds=true',
  ], { cwd: root, inherit: true }));
}

// Called only in a disposable preparation checkout, never in the publish job.
export function prepare(root, releaseId, baseSha, execute = run) {
  assert(RELEASE_ID.test(releaseId), 'Invalid releaseId');
  assert(/^[0-9a-f]{40}$/.test(baseSha), 'Invalid baseSha');
  assert.equal(execute('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root }), '', 'prepare requires clean tracked files');
  execute('git', ['merge-base', '--is-ancestor', baseSha, 'HEAD'], { cwd: root });
  assert(!fs.existsSync(path.join(root, '.changeset/pre.json')), 'Changesets prerelease mode is not supported');
  const planFile = path.join(root, '.release/canary-plan.json');
  const predictionFile = path.join(root, '.release/predicted-versions.json');
  assert(!fs.existsSync(planFile) && !fs.existsSync(predictionFile), 'Already prepared: use a fresh checkout for a deterministic retry');
  const workspaces = listWorkspaces(root, execute);
  const packages = publishable(workspaces);
  // Snapshots ignore the baseline, so an alpha window on main prepares to the same canary version.
  assert(packages.every(pkg => /^\d+\.\d+\.\d+(-[a-z]+\.\d+)?$/.test(pkg.version)), 'prepare requires exact released source versions');
  const changesetDir = path.join(root, '.changeset');
  const changesetNames = fs.readdirSync(changesetDir);
  assert(changesetNames.every(name => fs.lstatSync(path.join(changesetDir, name)).isFile()), 'Unexpected changeset subdirectory');
  const temporaryChangeset = path.join(changesetDir, 'canary-verify-coverage.md');
  assert(!fs.existsSync(temporaryChangeset), 'Temporary changeset already exists');
  const configFile = path.join(changesetDir, 'config.json');
  assert.equal(readJson(configFile).commit, false, 'Changesets commits must be disabled');
  const files = new Set([
    path.join(root, 'package.json'), path.join(root, 'pnpm-lock.yaml'),
    ...changesetNames.map(name => path.join(changesetDir, name)),
    ...workspaces.flatMap(pkg => ['package.json', 'CHANGELOG.md'].map(name => path.join(root, pkg.path, name))),
  ]);
  const original = new Map([...files].map(file => [file, fs.existsSync(file) ? fs.readFileSync(file) : null]));
  function restore() {
    for (const [file, bytes] of original) {
      if (bytes === null) fs.rmSync(file, { force: true });
      else fs.writeFileSync(file, bytes);
    }
    fs.rmSync(temporaryChangeset, { force: true });
  }
  try {
    execute('pnpm', ['run', 'bump'], { cwd: root, inherit: true });
    const predicted = {
      schemaVersion: 1, releaseId, baseSha,
      packages: packages.map(pkg => ({
        name: pkg.name, path: pkg.path, previousVersion: pkg.version,
        version: readJson(path.join(root, pkg.path, 'package.json')).version,
      })),
    };
    // Snapshot must see the original changesets and versions, not the consumed bump.
    restore();
    const config = readJson(configFile);
    config.snapshot = { useCalculatedVersion: false, prereleaseTemplate: `${TAG}.{tag}` };
    config.changelog = false;
    config.commit = false;
    writeJson(configFile, config);
    // All repositories use one snapshot version, independent of their stable baseline.
    fs.writeFileSync(temporaryChangeset, `---\n${packages.map(pkg => `${JSON.stringify(pkg.name)}: patch`).join('\n')}\n---\n\nTemporary full canary coverage.\n`);
    execute('pnpm', ['run', 'bump', '--snapshot', releaseId], { cwd: root, inherit: true });
    const snapshot = listWorkspaces(root, execute);
    const plan = validatePlan({
      schemaVersion: 1, releaseId, tag: TAG, version: `0.0.0-${TAG}.${releaseId}`, baseSha,
      packages: publishable(snapshot).map(({ name, version, path: dir }) => ({ name, version, path: dir })),
      mode: 'publish', requiredTargets: ['npm'],
    });
    const versions = new Map(plan.packages.map(pkg => [pkg.name, pkg.version]));
    for (const pkg of snapshot) {
      let changed = false;
      for (const field of [...dependencyFields, 'devDependencies']) {
        for (const name of Object.keys(pkg.json[field] ?? {})) {
          if (versions.has(name)) {
            pkg.json[field][name] = `workspace:${versions.get(name)}`;
            changed = true;
          }
        }
      }
      if (changed) writeJson(path.join(root, pkg.path, 'package.json'), pkg.json);
    }
    // Keep original changesets, config and changelogs out of the version-only commit.
    for (const [file, bytes] of original) {
      if (!file.startsWith(`${changesetDir}${path.sep}`) && path.basename(file) !== 'CHANGELOG.md') continue;
      if (bytes === null) fs.rmSync(file, { force: true });
      else fs.writeFileSync(file, bytes);
    }
    fs.rmSync(temporaryChangeset, { force: true });
    withoutRootPrepare(root, () => execute('pnpm', [
      'install', '--lockfile-only', '--ignore-scripts', '--no-frozen-lockfile',
    ], { cwd: root, inherit: true }));
    const prepared = listWorkspaces(root, execute);
    validatePackageSet(plan, prepared);
    for (const pkg of publishable(prepared)) validateDependencies(pkg.json, plan);
    writeJson(predictionFile, predicted);
    writeJson(planFile, plan);
    return { plan, predicted, planHash: planHash(plan) };
  } catch (error) {
    restore();
    fs.rmSync(planFile, { force: true });
    fs.rmSync(predictionFile, { force: true });
    throw error;
  }
}
