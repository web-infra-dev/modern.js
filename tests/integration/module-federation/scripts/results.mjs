import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  groups,
  jobs,
  jobEnv,
  labRoot,
  selectFiles,
  testPrefix,
  unitFiles,
  validateGroups,
} from './groups.mjs';

const readJSON = file => JSON.parse(readFileSync(file, 'utf8'));
const key = identity => JSON.stringify(identity);
const sorted = values => [...values].sort();
const expectedNames = id =>
  id === 'common' || id === 'serial'
    ? ['mf', ...Object.keys(unitFiles)]
    : ['mf'];

function exact(actual, expected, label) {
  assert.equal(new Set(actual).size, actual.length, `Duplicate ${label}`);
  const missing = expected.filter(item => !actual.includes(item));
  const extra = actual.filter(item => !expected.includes(item));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, label);
}

function passed(result, label) {
  assert.equal(result.status, 'pass', `${label}: not passed`);
  assert.deepEqual(result.errors, [], `${label}: errors`);
  assert.equal(result.retryCount, 0, `${label}: retried`);
  assert.deepEqual(result.retryErrors, [], `${label}: retry errors`);
}

export function validateManifest(manifest) {
  validateGroups();
  assert.equal(manifest.version, 1);
  for (const name of ['mf', ...Object.keys(unitFiles)]) {
    const identities = manifest[name];
    assert.ok(Array.isArray(identities) && identities.length, `Empty ${name}`);
    exact(
      identities.map(key),
      identities.map(key),
      `${name} baseline identities`,
    );
    for (const identity of identities) {
      assert.ok(
        Array.isArray(identity) &&
          identity.length === 5 &&
          typeof identity[0] === 'string' &&
          ['dev', 'production', 'common'].includes(identity[1]) &&
          Array.isArray(identity[2]) &&
          identity[2].every(parent => typeof parent === 'string') &&
          typeof identity[3] === 'string' &&
          typeof identity[4] === 'string',
        `Invalid identity: ${key(identity)}`,
      );
      const [file, mode, parents] = identity;
      if (name === 'mf') {
        const common = groups.common.some(item => testPrefix + item === file);
        if (common) assert.equal(mode, 'common');
        else {
          assert.ok(['dev', 'production'].includes(mode));
          assert.equal(parents[0], `Weather Lab (${mode})`);
        }
      } else {
        assert.equal(file, unitFiles[name]);
        assert.equal(mode, 'common');
      }
    }
  }
  for (const [mode, count] of Object.entries(manifest.counts)) {
    const identities = manifest.mf.filter(identity => identity[1] === mode);
    assert.equal(identities.length, count, `${mode} count`);
    exact(
      [...new Set(identities.map(identity => identity[0]))],
      (mode === 'common' ? groups.common : [...groups.A, ...groups.B]).map(
        file => testPrefix + file,
      ),
      `${mode} files`,
    );
  }
  assert.deepEqual(sorted(Object.keys(manifest.counts)), [
    'common',
    'dev',
    'production',
  ]);
}

export function selectedIdentities(manifest, id) {
  if (id === 'serial') return manifest.mf;
  const files = selectFiles(jobEnv(id)).map(file => testPrefix + file);
  return manifest.mf.filter(
    identity =>
      files.includes(identity[0]) &&
      identity[1] === (jobs[id].mode ?? 'common'),
  );
}

export function validateReport(report, identities, context, name) {
  assert.ok(identities.length, `Empty expected report: ${name}`);
  assert.equal(report.version, 1);
  assert.equal(report.name, name);
  for (const field of ['revision', 'runId', 'attempt', 'job'])
    assert.equal(report[field], context[field], `${name}: ${field}`);
  assert.deepEqual(report.unhandledErrors, [], `${name}: unhandled errors`);
  exact(
    report.tests.map(test => key(test.identity)),
    identities.map(key),
    `${name} identities`,
  );
  exact(
    report.files.map(file => file.file),
    [...new Set(identities.map(identity => identity[0]))],
    `${name} files`,
  );
  for (const test of report.tests) passed(test, key(test.identity));
  for (const file of report.files) passed(file, file.file);
  assert.ok(Number.isFinite(report.duration.totalTime), `${name}: duration`);
}

export function validateBundle(bundle, manifest, id, context) {
  const status = bundle.status;
  assert.equal(status.version, 1);
  assert.equal(status.result, 'success', `${id}: job did not succeed`);
  for (const field of ['revision', 'runId', 'attempt'])
    assert.equal(status[field], context[field], `${id}: ${field}`);
  assert.equal(status.job, id);
  const names = expectedNames(id);
  exact(Object.keys(status.commands), names, `${id}: commands`);
  exact(Object.keys(bundle.reports), names, `${id}: reports`);
  exact(Object.keys(bundle.cleanup), names, `${id}: cleanup reports`);
  for (const name of names) {
    const command = status.commands[name];
    assert.equal(command.code, 0, `${id}/${name}: process failed`);
    assert.equal(command.signal, null, `${id}/${name}: process signaled`);
    assert.equal(command.error, undefined, `${id}/${name}: process error`);
    assert.equal(command.cleanup, true, `${id}/${name}: cleanup failed`);
    const cleanup = bundle.cleanup[name];
    assert.equal(cleanup.ok, true, `${id}/${name}: cleanup report failed`);
    assert.equal(cleanup.auditError, undefined, `${id}/${name}: audit failed`);
    assert.deepEqual(cleanup.live, [], `${id}/${name}: live processes`);
    assert.deepEqual(
      cleanup.remaining,
      [],
      `${id}/${name}: remaining workspaces`,
    );
    validateReport(
      bundle.reports[name],
      name === 'mf' ? selectedIdentities(manifest, id) : manifest[name],
      { ...context, job: id },
      name,
    );
  }
}

export function verifyAll(bundles, manifest, context, needs) {
  validateManifest(manifest);
  exact(Object.keys(needs), ['mf-tests'], 'required jobs');
  assert.equal(
    needs['mf-tests'].result,
    'success',
    'A shard failed, cancelled or skipped',
  );
  exact(Object.keys(bundles), Object.keys(jobs), 'job artifacts');
  const identities = [];
  for (const id of Object.keys(jobs)) {
    validateBundle(bundles[id], manifest, id, context);
    identities.push(
      ...bundles[id].reports.mf.tests.map(test => key(test.identity)),
    );
  }
  exact(identities, manifest.mf.map(key), 'combined identities');
  return Object.entries(bundles).map(([job, bundle]) => ({
    job,
    cases: bundle.reports.mf.tests.length,
    mfSeconds: bundle.reports.mf.duration.totalTime / 1000,
    commandSeconds:
      (Date.parse(bundle.status.finishedAt) -
        Date.parse(bundle.status.startedAt)) /
      1000,
  }));
}

export function readBundle(directory, id) {
  const names = expectedNames(id);
  return {
    status: readJSON(path.join(directory, 'status.json')),
    reports: Object.fromEntries(
      names.map(name => [name, readJSON(path.join(directory, `${name}.json`))]),
    ),
    cleanup: Object.fromEntries(
      names.map(name => [
        name,
        readJSON(path.join(directory, `${name}-cleanup.json`)),
      ]),
    ),
  };
}

export function baseline(bundle) {
  const counts = { dev: 0, production: 0, common: 0 };
  for (const test of bundle.reports.mf.tests) counts[test.identity[1]]++;
  const manifest = {
    version: 1,
    counts,
    ...Object.fromEntries(
      expectedNames('serial').map(name => [
        name,
        bundle.reports[name].tests
          .map(test => test.identity)
          .sort((a, b) => key(a).localeCompare(key(b))),
      ]),
    ),
  };
  validateManifest(manifest);
  validateBundle(bundle, manifest, 'serial', bundle.status);
  return manifest;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [command, directory, output, ...extra] = process.argv.slice(2);
  if (!directory || extra.length || !['baseline', 'check'].includes(command))
    throw new Error(
      'Usage: results.mjs baseline <serial-directory> <manifest> | check <artifacts>',
    );
  if (command === 'baseline') {
    assert.ok(output, 'Provide an explicit baseline output path');
    writeFileSync(
      output,
      `${JSON.stringify(baseline(readBundle(directory, 'serial')), null, 2)}\n`,
    );
  } else {
    assert.equal(output, undefined);
    const context = {
      revision: process.env.GITHUB_SHA,
      runId: process.env.GITHUB_RUN_ID,
      attempt: process.env.GITHUB_RUN_ATTEMPT,
    };
    for (const [field, value] of Object.entries(context))
      assert.ok(value, `Missing ${field}`);
    const bundles = Object.fromEntries(
      Object.keys(jobs).map(id => [
        id,
        readBundle(
          path.join(directory, `mf-${id}-${context.runId}-${context.attempt}`),
          id,
        ),
      ]),
    );
    const manifest = readJSON(path.join(labRoot, 'case-manifest.json'));
    const rows = verifyAll(
      bundles,
      manifest,
      context,
      JSON.parse(process.env.MF_JOB_NEEDS ?? '{}'),
    );
    console.log(JSON.stringify({ counts: manifest.counts, rows }, null, 2));
    if (process.env.GITHUB_STEP_SUMMARY) {
      writeFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `All ${manifest.mf.length} MF identities and both unit suites passed exactly once.\n\n| Job | MF cases | MF seconds | Commands seconds |\n| --- | ---: | ---: | ---: |\n${rows.map(row => `| ${row.job} | ${row.cases} | ${row.mfSeconds.toFixed(1)} | ${row.commandSeconds.toFixed(1)} |`).join('\n')}\n\nCommand times exclude runner setup, installation, builds and artifact uploads. Use workflow job timestamps for total runner minutes.\n`,
      );
    }
  }
}
