import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const TAG = 'canary-verify';
export const REGISTRY = 'https://registry.npmjs.org/';
export const RELEASE_ID = /^r[a-z0-9-]{0,63}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA = /^[0-9a-f]{40}$/;
const HASH = /^[0-9a-f]{64}$/;
const NAME = /^@modern-js\/[a-z0-9][a-z0-9._-]*$/;
export const dependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies'];

// Only this existing runtime dependency is outside the current release set.
export const legacyDependencies = Object.freeze({
  '@modern-js/plugin-polyfill': Object.freeze({ '@modern-js/polyfill-lib': '^1.0.2' }),
});

// Canonical JSON: recursively sort object keys, preserve array order, no whitespace.
// Reject values that JSON.stringify would silently discard or coerce.
export function stableStringify(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    assert.equal(Object.keys(value).length, value.length, 'Sparse or extended array');
    return `[${value.map(stableStringify).join(',')}]`;
  }
  assert(value && Object.getPrototypeOf(value) === Object.prototype, 'Expected JSON data');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export const planHash = plan => createHash('sha256').update(stableStringify(plan), 'utf8').digest('hex');
export const integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export function run(command, args, { cwd = process.cwd(), env = process.env, inherit = false } = {}) {
  const result = spawnSync(command, args, {
    cwd, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) {
    // Do not copy command output into public receipts: it may contain credentials.
    throw new Error(`${command} ${args[0] ?? ''} failed (exit ${result.status ?? 'unknown'})`);
  }
  return result.stdout?.trim() ?? '';
}

function keys(value, expected, label) {
  assert(value && Object.getPrototypeOf(value) === Object.prototype, `${label}: expected object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label}: unexpected fields`);
}

export function validatePath(value) {
  assert(typeof value === 'string' && /^packages\/[a-zA-Z0-9_./-]+$/.test(value), 'Invalid package path');
  assert(value.split('/').every(part => part && part !== '.' && part !== '..'), 'Unsafe package path');
}

export function validatePlan(plan) {
  keys(plan, ['schemaVersion', 'releaseId', 'tag', 'version', 'baseSha', 'packages', 'mode', 'requiredTargets'], 'plan');
  assert.equal(plan.schemaVersion, 1, 'Unsupported plan schema');
  assert(RELEASE_ID.test(plan.releaseId), 'releaseId must start with r and end with a lowercase UUID');
  assert.equal(plan.tag, TAG, 'Only the canary-verify tag is allowed');
  assert.equal(plan.version, `0.0.0-${TAG}.${plan.releaseId}`, 'Expected the shared cross-repository canary version');
  assert(SHA.test(plan.baseSha), 'Invalid baseSha');
  assert.equal(plan.mode, 'publish', 'Only publish mode is allowed');
  assert.deepEqual(plan.requiredTargets, ['npm'], 'Only npm is allowed');
  assert(Array.isArray(plan.packages) && plan.packages.length > 0, 'Empty package set');
  const names = new Set();
  const paths = new Set();
  for (const pkg of plan.packages) {
    keys(pkg, ['name', 'version', 'path'], 'plan package');
    assert(NAME.test(pkg.name), 'Only @modern-js packages are allowed');
    validatePath(pkg.path);
    assert.equal(pkg.version, plan.version, 'Every package must have exactly the shared canary version');
    assert(!names.has(pkg.name) && !paths.has(pkg.path), 'Duplicate package');
    names.add(pkg.name);
    paths.add(pkg.path);
  }
  return plan;
}

export function listWorkspaces(root, execute = run) {
  const entries = JSON.parse(execute('pnpm', ['--reporter=silent', 'list', '-r', '--depth', '-1', '--json'], { cwd: root }));
  assert(Array.isArray(entries), 'Invalid pnpm workspace list');
  return entries.map(entry => {
    const dir = path.resolve(entry.path);
    const relative = path.relative(root, dir).split(path.sep).join('/');
    assert(!relative.startsWith('../') && !path.isAbsolute(relative), 'Workspace outside repository');
    assert.equal(fs.realpathSync(dir), dir, 'Symlink workspace is not allowed');
    const json = readJson(path.join(dir, 'package.json'));
    return { name: json.name, version: json.version, path: relative, private: json.private === true, json };
  });
}

export function publishable(workspaces) {
  const packages = workspaces.filter(pkg => pkg.path.startsWith('packages/') && !pkg.private && NAME.test(pkg.name));
  assert(packages.length > 0, 'No publishable workspaces');
  assert.equal(new Set(packages.map(pkg => pkg.name)).size, packages.length, 'Duplicate workspace names');
  return packages.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
}

export function validatePackageSet(plan, workspaces) {
  const expected = publishable(workspaces).map(({ name, version, path: dir }) => ({ name, version, path: dir }));
  const actual = [...plan.packages].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  assert.deepEqual(actual, expected, 'Plan must match every non-private @modern-js packages/ workspace exactly');
}

export function validateDependencies(json, plan, { packed = false } = {}) {
  const versions = new Map(plan.packages.map(pkg => [pkg.name, pkg.version]));
  for (const field of [...dependencyFields, 'devDependencies']) {
    for (const [name, spec] of Object.entries(json[field] ?? {})) {
      assert.equal(typeof spec, 'string', 'Invalid dependency spec');
      if (packed) assert(!/^(workspace|file|link|catalog):/.test(spec), `Unresolved dependency: ${name}`);
      if (!dependencyFields.includes(field)) continue;
      if (versions.has(name)) {
        assert.equal(spec, packed ? versions.get(name) : `workspace:${versions.get(name)}`, `Non-exact canary dependency: ${json.name} -> ${name}`);
      } else if (name.startsWith('@modern-js/')) {
        assert.equal(spec, legacyDependencies[json.name]?.[name], `Unapproved legacy dependency: ${json.name} -> ${name}`);
      }
      assert(!spec.includes('npm:@modern-js/'), 'Aliased Modern.js dependencies require explicit support');
    }
  }
  assert(!json.bundleDependencies?.length && !json.bundledDependencies?.length && json.bundleDependencies !== true && json.bundledDependencies !== true, 'Bundled dependencies are not allowed');
}

export function assertSource(root, plan, expectedSha, execute = run) {
  assert(SHA.test(expectedSha), 'Expected a full source SHA');
  assert.equal(execute('git', ['rev-parse', 'HEAD'], { cwd: root }), expectedSha, 'HEAD must equal GITHUB_SHA');
  execute('git', ['merge-base', '--is-ancestor', plan.baseSha, expectedSha], { cwd: root });
  assert.equal(execute('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root }), '', 'Tracked source has changed');
}

export function assertTrigger(plan, env = process.env, event = readJson(env.GITHUB_EVENT_PATH)) {
  assert.equal(env.GITHUB_REF, `refs/heads/release-canary-verify/${plan.releaseId}`, 'Only a prepared release branch may publish');
  assert.equal(env.GITHUB_REF_TYPE, 'branch', 'Expected branch ref');
  if (env.GITHUB_EVENT_NAME === 'push') {
    assert.equal(event.created, true, 'Prepared branches must be written once');
    assert.equal(event.forced, false, 'Forced push is not allowed');
    assert.equal(event.deleted, false, 'Deleted branch is not allowed');
    assert.equal(event.before, '0'.repeat(40), 'Expected branch creation');
    assert.equal(event.after, env.GITHUB_SHA, 'Push SHA mismatch');
  } else {
    assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Unsupported trigger');
    assert.equal(event.inputs?.expected_plan_hash, planHash(plan), 'Dispatch plan hash mismatch');
  }
}

export function readTarball(file) {
  const entries = run('tar', ['-tzf', file]).split('\n');
  assert.equal(entries.filter(entry => entry === 'package/package.json').length, 1, 'Expected exactly one tarball manifest');
  assert(entries.every(entry => entry.startsWith('package/') && !entry.split('/').includes('..')), 'Unsafe tarball entry');
  return JSON.parse(run('tar', ['-xOzf', file, 'package/package.json']));
}

export function validateTarball(json, pkg, plan) {
  assert.equal(json.name, pkg.name, 'Tarball name mismatch');
  assert.equal(json.version, pkg.version, 'Tarball version mismatch');
  assert(json.private !== true, 'Private tarball');
  if (json.tag !== undefined) assert.equal(json.tag, TAG, 'Unexpected top-level publish tag');
  validateDependencies(json, plan, { packed: true });
  const safeConfig = new Set(['registry', 'access', 'tag', 'types', 'typings', 'main', 'module', 'exports', 'bin', 'executableFiles']);
  for (const key of Object.keys(json.publishConfig ?? {})) assert(safeConfig.has(key), `Unsafe publishConfig: ${key}`);
  if (json.publishConfig?.registry) assert.equal(json.publishConfig.registry, REGISTRY, 'Non-public registry');
  if (json.publishConfig?.access) assert.equal(json.publishConfig.access, 'public', 'Non-public access');
  if (json.publishConfig?.tag) assert.equal(json.publishConfig.tag, TAG, 'Unexpected publish tag');
}

export function verifyArtifacts(directory, plan, expectedHash, sourceSha) {
  validatePlan(plan);
  assert(HASH.test(expectedHash) && expectedHash === planHash(plan), 'Expected plan hash mismatch');
  assert(SHA.test(sourceSha), 'Invalid source SHA');
  const manifest = readJson(path.join(directory, 'manifest.json'));
  keys(manifest, ['schemaVersion', 'releaseId', 'tag', 'version', 'sourceSha', 'planHash', 'packages'], 'manifest');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.releaseId, plan.releaseId);
  assert.equal(manifest.tag, TAG);
  assert.equal(manifest.version, plan.version, 'Artifact shared version mismatch');
  assert.equal(manifest.sourceSha, sourceSha, 'Artifact source mismatch');
  assert.equal(manifest.planHash, expectedHash, 'Artifact plan mismatch');
  assert(Array.isArray(manifest.packages) && manifest.packages.length === plan.packages.length, 'Artifact package count mismatch');
  const expected = new Map(plan.packages.map(pkg => [pkg.name, pkg]));
  const files = new Set(['manifest.json']);
  for (const pkg of manifest.packages) {
    keys(pkg, ['name', 'version', 'integrity', 'filename', 'path'], 'manifest package');
    const planned = expected.get(pkg.name);
    assert(planned && pkg.version === planned.version && pkg.path === planned.path, 'Unexpected artifact package');
    expected.delete(pkg.name);
    assert(typeof pkg.filename === 'string' && /^[a-zA-Z0-9._-]+\.tgz$/.test(pkg.filename), 'Unsafe artifact filename');
    assert(!files.has(pkg.filename), 'Duplicate artifact filename');
    files.add(pkg.filename);
    const file = path.resolve(directory, pkg.filename);
    assert.equal(fs.realpathSync(file), file, 'Symlink artifact');
    assert(fs.lstatSync(file).isFile(), 'Artifact is not a file');
    assert.equal(pkg.integrity, integrity(fs.readFileSync(file)), 'Tarball sha512 mismatch');
    validateTarball(readTarball(file), pkg, plan);
  }
  assert.equal(expected.size, 0, 'Missing artifact package');
  assert.deepEqual(fs.readdirSync(directory).sort(), [...files].sort(), 'Unexpected artifact files');
  return manifest;
}
