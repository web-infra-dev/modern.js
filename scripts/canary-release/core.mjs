import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const TAG = 'canary-verify';
export const REGISTRY = 'https://registry.npmjs.org/';

/**
 * A release channel decides three things: the dist-tag the packages carry, how
 * their version is arrived at, and which branch the workflow will accept as
 * the trigger. Nothing else in these scripts decides any of them separately.
 *
 * `snapshot` discards the changesets and builds 0.0.0-<tag>.<release id>: the
 * major is zero and the whole string is a prerelease, so no range in any
 * consumer resolves to it and nothing is written back to the repository.
 * `stable` keeps what `pnpm run bump` produced - consumed changesets, bumped
 * versions, written changelogs - and publishes that. Every @modern-js package
 * is in one fixed changesets group, so a stable release is still a single
 * version shared by the whole set, which is the invariant the rest of this
 * code is built on.
 */
export const CHANNELS = {
  canary: { tag: TAG, scheme: 'snapshot', branchPrefix: 'release-canary-verify' },
  latest: { tag: 'latest', scheme: 'stable', branchPrefix: 'release-latest' },
};
export const DEFAULT_CHANNEL = 'canary';
export const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
// A channel named by the caller, for a line that needs a dist-tag of its own.
// It publishes a snapshot version, so however it is named no range can resolve
// to it, and it may not borrow the name of a channel in the table.
const CUSTOM_TAG = /^[a-z][a-z0-9-]{1,30}$/;

export function channelFor(name = DEFAULT_CHANNEL, customTag) {
  assert(typeof name === 'string' && name.length > 0, 'A release channel is required');
  if (Object.hasOwn(CHANNELS, name)) {
    assert(customTag === undefined || customTag === CHANNELS[name].tag, `Channel ${name} publishes under ${CHANNELS[name].tag}`);
    return { name, ...CHANNELS[name] };
  }
  assert.equal(name, 'custom', `Unknown release channel: ${name}`);
  assert(typeof customTag === 'string' && CUSTOM_TAG.test(customTag), 'A custom channel needs a dist-tag of its own');
  assert(!Object.values(CHANNELS).some(channel => channel.tag === customTag), 'A custom channel may not borrow a reserved dist-tag');
  return { name, tag: customTag, scheme: 'snapshot', branchPrefix: `release-${customTag}` };
}

export function planChannel(plan) {
  return channelFor(plan.channel, plan.channel === 'custom' ? plan.tag : undefined);
}

export function releaseBranch(plan) {
  return `${planChannel(plan).branchPrefix}/${plan.releaseId}`;
}

/**
 * Where preparation lands, and where the build half of a release runs.
 *
 * It is deliberately outside the release branch namespace the publishing
 * workflow watches: the same commit is pushed here first so that it can be built,
 * packed and tested while nothing is published, and only later to the branch
 * that publishes it. The name has no channel in it because nothing is
 * published from here, whatever the channel.
 */
export function stagingBranch(plan) {
  return `canary-staging/${plan.releaseId}`;
}

export function versionFor(channel, releaseId, bumped) {
  if (channel.scheme === 'snapshot') return `0.0.0-${channel.tag}.${releaseId}`;
  assert(typeof bumped === 'string' && STABLE_VERSION.test(bumped),
    'A stable release publishes the version changesets computed, as plain major.minor.patch');
  return bumped;
}
// A date and sixteen random bytes, deliberately not grouped like a UUID: npm
// redacts UUID shaped values out of its own `publish --json` output, so a
// release id in that shape comes back as [REDACTED_UUID] and no published
// package can be matched to the manifest that produced it. Same entropy,
// different punctuation. The pipeline mints exactly this shape.
export const RELEASE_ID = /^r\d{8}-[0-9a-f]{32}$/;
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
  keys(plan, ['schemaVersion', 'releaseId', 'channel', 'tag', 'version', 'baseSha', 'packages', 'mode', 'requiredTargets'], 'plan');
  assert.equal(plan.schemaVersion, 1, 'Unsupported plan schema');
  assert(RELEASE_ID.test(plan.releaseId), 'releaseId must be r, a date and 16 lowercase hex bytes, with no UUID grouping');
  const channel = planChannel(plan);
  assert.equal(plan.tag, channel.tag, 'The tag must be the one this channel publishes under');
  assert.equal(plan.version, versionFor(channel, plan.releaseId, plan.version),
    'Expected the version this channel produces for this release');
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
    assert.equal(pkg.version, plan.version, 'Every package must have exactly the shared release version');
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

export function assertTrigger(plan, env = process.env, event = readJson(env.GITHUB_EVENT_PATH), branch = releaseBranch(plan)) {
  assert.equal(env.GITHUB_REF, `refs/heads/${branch}`, 'Only a prepared release branch may publish');
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
  if (json.tag !== undefined) assert.equal(json.tag, plan.tag, 'Unexpected top-level publish tag');
  validateDependencies(json, plan, { packed: true });
  const safeConfig = new Set(['registry', 'access', 'tag', 'types', 'typings', 'main', 'module', 'exports', 'bin', 'executableFiles']);
  for (const key of Object.keys(json.publishConfig ?? {})) assert(safeConfig.has(key), `Unsafe publishConfig: ${key}`);
  if (json.publishConfig?.registry) assert.equal(json.publishConfig.registry, REGISTRY, 'Non-public registry');
  if (json.publishConfig?.access) assert.equal(json.publishConfig.access, 'public', 'Non-public access');
  if (json.publishConfig?.tag) assert.equal(json.publishConfig.tag, plan.tag, 'Unexpected publish tag');
}

export function verifyArtifacts(directory, plan, expectedHash, sourceSha) {
  validatePlan(plan);
  assert(HASH.test(expectedHash) && expectedHash === planHash(plan), 'Expected plan hash mismatch');
  assert(SHA.test(sourceSha), 'Invalid source SHA');
  const manifest = readJson(path.join(directory, 'manifest.json'));
  keys(manifest, ['schemaVersion', 'releaseId', 'tag', 'version', 'sourceSha', 'planHash', 'packages'], 'manifest');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.releaseId, plan.releaseId);
  assert.equal(manifest.tag, plan.tag);
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
