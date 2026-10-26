import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  assertSource, assertTrigger, integrity, listWorkspaces, planHash, publishable,
  readJson, readTarball, run, validateDependencies, validatePackageSet, validatePlan,
  validateTarball, verifyArtifacts, writeJson,
} from './core.mjs';
import { install, prepare } from './prepare.mjs';
import { publish } from './publish.mjs';

export { stableStringify, planHash } from './core.mjs';

export function verify(root, expectedPlanHash, { trigger = true } = {}) {
  const plan = validatePlan(readJson(path.join(root, '.release/canary-plan.json')));
  const hash = planHash(plan);
  if (expectedPlanHash) assert.equal(hash, expectedPlanHash, 'Expected plan hash mismatch');
  assertSource(root, plan, process.env.GITHUB_SHA);
  if (trigger) assertTrigger(plan);
  const workspaces = listWorkspaces(root);
  validatePackageSet(plan, workspaces);
  for (const pkg of publishable(workspaces)) validateDependencies(pkg.json, plan);
  return { plan, planHash: hash };
}

export function pack(root, output, expectedPlanHash) {
  const { plan, planHash: hash } = verify(root, expectedPlanHash);
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

export async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const definitions = {
    prepare: { 'release-id': { type: 'string' }, 'base-sha': { type: 'string' }, channel: { type: 'string' }, 'custom-tag': { type: 'string' } },
    install: {},
    verify: { 'expected-plan-hash': { type: 'string' } },
    pack: { out: { type: 'string', default: '.release/artifacts' }, 'expected-plan-hash': { type: 'string' } },
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
    const result = verify(root, values['expected-plan-hash']);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `plan_hash=${result.planHash}\nrelease_id=${result.plan.releaseId}\nchannel=${result.plan.channel}\ntag=${result.plan.tag}\n`);
    console.log(JSON.stringify({ releaseId: result.plan.releaseId, channel: result.plan.channel, tag: result.plan.tag, planHash: result.planHash, packages: result.plan.packages.length }));
  } else if (command === 'pack') {
    assert(values['expected-plan-hash'], '--expected-plan-hash is required');
    pack(root, values.out, values['expected-plan-hash']);
  } else if (command === 'verify-artifacts') {
    const { plan } = verify(root, values['expected-plan-hash']);
    verifyArtifacts(path.resolve(root, values.artifacts), plan, values['expected-plan-hash'], process.env.GITHUB_SHA);
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
