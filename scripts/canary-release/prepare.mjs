import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_CHANNEL, RELEASE_ID, channelFor, dependencyFields, listWorkspaces, planHash, publishable,
  readJson, run, validateDependencies, validatePackageSet, validatePlan, versionFor, writeJson,
} from './core.mjs';

// Every @modern-js package sits in one fixed changesets group, so a release is
// a single version shared by the whole set. The rest of these scripts are built
// on that, so it is asserted here rather than assumed: if the group is ever
// split, preparation stops instead of producing a plan nothing downstream can
// validate.
function sharedVersion(packages) {
  const versions = [...new Set(packages.map(pkg => pkg.version))];
  assert.equal(versions.length, 1, `Expected one version across the release set, got ${versions.join(', ')}`);
  return versions[0];
}

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
export function prepare(root, releaseId, baseSha, execute = run, { channel: channelName = DEFAULT_CHANNEL, customTag } = {}) {
  const channel = channelFor(channelName, customTag);
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
  const temporaryChangeset = path.join(changesetDir, `${channel.tag}-coverage.md`);
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
  // A stable release is what `pnpm run bump` produces: consumed changesets,
  // bumped versions, written changelogs, all of it committed and later merged
  // back. A snapshot release runs the same bump only to learn which version it
  // would have been, throws that away, and re-versions from the untouched
  // changesets into 0.0.0-<tag>.<release id>, writing nothing back.
  const stable = channel.scheme === 'stable';
  try {
    execute('pnpm', ['run', 'bump'], { cwd: root, inherit: true });
    const bumped = listWorkspaces(root, execute);
    const predicted = {
      schemaVersion: 1, releaseId, baseSha,
      packages: packages.map(pkg => ({
        name: pkg.name, path: pkg.path, previousVersion: pkg.version,
        version: readJson(path.join(root, pkg.path, 'package.json')).version,
      })),
    };
    const bumpedVersion = sharedVersion(publishable(bumped));
    let versioned = bumped;
    if (!stable) {
      // The snapshot must see the original changesets and versions, not the consumed bump.
      restore();
      const config = readJson(configFile);
      config.snapshot = { useCalculatedVersion: false, prereleaseTemplate: `${channel.tag}.{tag}` };
      config.changelog = false;
      config.commit = false;
      writeJson(configFile, config);
      // All repositories use one snapshot version, independent of their stable baseline.
      fs.writeFileSync(temporaryChangeset, `---\n${packages.map(pkg => `${JSON.stringify(pkg.name)}: patch`).join('\n')}\n---\n\nTemporary full ${channel.tag} coverage.\n`);
      execute('pnpm', ['run', 'bump', '--snapshot', releaseId], { cwd: root, inherit: true });
      versioned = listWorkspaces(root, execute);
    }
    const plan = validatePlan({
      schemaVersion: 1, releaseId, channel: channel.name, tag: channel.tag,
      version: versionFor(channel, releaseId, bumpedVersion), baseSha,
      packages: publishable(versioned).map(({ name, version, path: dir }) => ({ name, version, path: dir })),
      mode: 'publish', requiredTargets: ['npm'],
    });
    const versions = new Map(plan.packages.map(pkg => [pkg.name, pkg.version]));
    for (const pkg of versioned) {
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
    // A snapshot keeps the original changesets, config and changelogs out of
    // its version-only commit: nothing about it is written back to the trunk.
    // A stable release is the opposite - the consumed changesets and the new
    // changelogs are the point, and they are what gets merged back.
    if (!stable) {
      for (const [file, bytes] of original) {
        if (!file.startsWith(`${changesetDir}${path.sep}`) && path.basename(file) !== 'CHANGELOG.md') continue;
        if (bytes === null) fs.rmSync(file, { force: true });
        else fs.writeFileSync(file, bytes);
      }
      fs.rmSync(temporaryChangeset, { force: true });
    }
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
