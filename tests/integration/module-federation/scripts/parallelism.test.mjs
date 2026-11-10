import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  discoverFiles,
  groups,
  jobs,
  jobEnv,
  labRoot,
  selectFiles,
  testPrefix,
  unitFiles,
  validateGroups,
} from './groups.mjs';
import { selectedIdentities, validateManifest, verifyAll } from './results.mjs';
import { runCommand } from './run.mjs';

const files = Object.values(groups).flat();
const context = { revision: 'test-commit', runId: '123', attempt: '2' };
const needs = { 'mf-tests': { result: 'success' } };
const success = { status: 'pass', errors: [], retryCount: 0, retryErrors: [] };
const identities = (files, mode) =>
  files.map(file => [
    testPrefix + file,
    mode,
    mode === 'common' ? [] : [`Weather Lab (${mode})`, 'suite > nested'],
    'expanded case (value)',
    'rstest',
  ]);

function fixture() {
  const labFiles = [...groups.A, ...groups.B];
  const manifest = {
    version: 1,
    counts: {
      dev: labFiles.length,
      production: labFiles.length,
      common: groups.common.length,
    },
    mf: [
      ...identities(labFiles, 'dev'),
      ...identities(labFiles, 'production'),
      ...identities(groups.common, 'common'),
    ],
    ...Object.fromEntries(
      Object.entries(unitFiles).map(([name, file]) => [
        name,
        [[file, 'common', ['unit'], 'case', 'rstest']],
      ]),
    ),
  };
  const bundles = {};
  for (const id of Object.keys(jobs)) {
    const selected = {
      mf: selectedIdentities(manifest, id),
      ...(id === 'common'
        ? Object.fromEntries(
            Object.keys(unitFiles).map(name => [name, manifest[name]]),
          )
        : {}),
    };
    bundles[id] = {
      status: {
        version: 1,
        ...context,
        job: id,
        result: 'success',
        startedAt: '2026-01-01T00:00:00Z',
        finishedAt: '2026-01-01T00:00:02Z',
        commands: Object.fromEntries(
          Object.keys(selected).map(name => [
            name,
            { code: 0, signal: null, cleanup: true },
          ]),
        ),
      },
      cleanup: Object.fromEntries(
        Object.keys(selected).map(name => [
          name,
          { ok: true, live: [], remaining: [] },
        ]),
      ),
      reports: Object.fromEntries(
        Object.entries(selected).map(([name, cases]) => [
          name,
          {
            version: 1,
            name,
            ...context,
            job: id,
            unhandledErrors: [],
            duration: { totalTime: 1000 },
            files: [...new Set(cases.map(item => item[0]))].map(file => ({
              file,
              ...success,
            })),
            tests: cases.map(identity => ({ identity, ...success })),
          },
        ]),
      ),
    };
  }
  return { manifest, bundles };
}

test('every real MF test file belongs to exactly one group', () => {
  validateGroups();
  assert.deepEqual([...discoverFiles()].sort(), [...files].sort());
});

test('the committed serial manifest has complete file and mode coverage', () => {
  validateManifest(
    JSON.parse(readFileSync(path.join(labRoot, 'case-manifest.json'), 'utf8')),
  );
});

test('default and mode-only entry points retain all files', () => {
  for (const env of [{}, { MF_LAB_MODE: 'dev' }, { MF_LAB_MODE: 'production' }])
    assert.deepEqual([...selectFiles(env)].sort(), [...files].sort());
});

test('five selections cover each intended file and mode once', () => {
  const { manifest, bundles } = fixture();
  assert.equal(verifyAll(bundles, manifest, context, needs).length, 5);
  for (const id of Object.keys(jobs)) {
    assert.equal(
      selectFiles(jobEnv(id)).length,
      id === 'common' ? 5 : id.endsWith('A') ? 6 : 9,
    );
  }
  assert.equal(selectFiles({ MF_LAB_SUITE: 'lab' }).length, 15);
});

for (const [name, change] of [
  [
    'unassigned nested file',
    assignment => [assignment, [...files, 'tests/nested/new.test.ts']],
  ],
  [
    'unknown file',
    assignment => {
      assignment.A.push('tests/unknown.test.ts');
      return [assignment, files];
    },
  ],
  [
    'duplicate across groups',
    assignment => {
      assignment.B.push(assignment.A[0]);
      return [assignment, files];
    },
  ],
  [
    'duplicate within group',
    assignment => {
      assignment.A.push(assignment.A[0]);
      return [assignment, files];
    },
  ],
  [
    'empty shard',
    assignment => {
      assignment.A = [];
      return [assignment, files];
    },
  ],
  [
    'unknown group',
    assignment => {
      assignment.C = [assignment.A[0]];
      return [assignment, files];
    },
  ],
]) {
  test(`rejects ${name} before collection`, () => {
    const [assignment, discovered] = change(structuredClone(groups));
    assert.throws(() => selectFiles({}, discovered, assignment));
  });
}

for (const env of [
  { MF_LAB_SUITE: '' },
  { MF_LAB_SUITE: 'all' },
  { MF_LAB_MODE: '' },
  { MF_LAB_MODE: 'development' },
  { MF_LAB_SHARD: 'A' },
  { MF_LAB_SUITE: 'lab', MF_LAB_SHARD: '' },
  { MF_LAB_SUITE: 'lab', MF_LAB_SHARD: 'C' },
  { MF_LAB_SUITE: 'common', MF_LAB_MODE: 'dev' },
  { MF_LAB_SUITE: 'common', MF_LAB_SHARD: 'B' },
]) {
  test(`rejects invalid selection ${JSON.stringify(env)}`, () => {
    assert.throws(() => selectFiles(env));
  });
}

test('rejects unknown job IDs', () =>
  assert.throws(() => jobEnv('lab-prod-A')));

for (const result of ['failure', 'cancelled', 'skipped', undefined]) {
  test(`rejects matrix result ${result}`, () => {
    const { bundles, manifest } = fixture();
    assert.throws(() =>
      verifyAll(bundles, manifest, context, { 'mf-tests': { result } }),
    );
  });
}

const corruptions = [
  [
    'missing shard',
    bundles => {
      delete bundles['lab-dev-B'];
    },
  ],
  [
    'unknown shard',
    bundles => {
      bundles.other = bundles.common;
    },
  ],
  [
    'failed command',
    bundles => {
      bundles.common.status.commands.mf.code = 1;
    },
  ],
  [
    'cancelled command',
    bundles => {
      bundles.common.status.commands.mf.signal = 'SIGTERM';
    },
  ],
  [
    'skipped job',
    bundles => {
      bundles.common.status.result = 'skipped';
    },
  ],
  [
    'missing MF report',
    bundles => {
      delete bundles.common.reports.mf;
    },
  ],
  [
    'missing unit report',
    bundles => {
      delete bundles.common.reports.rootExposes;
    },
  ],
  [
    'unit run in another shard',
    bundles => {
      bundles['lab-dev-A'].reports.rootExposes =
        bundles.common.reports.rootExposes;
    },
  ],
  [
    'missing file result',
    bundles => {
      bundles.common.reports.mf.files.pop();
    },
  ],
  [
    'duplicate file result',
    bundles => {
      bundles.common.reports.mf.files.push(bundles.common.reports.mf.files[0]);
    },
  ],
  [
    'failed file hook with passed cases',
    bundles => {
      bundles.common.reports.mf.files[0].status = 'fail';
    },
  ],
  [
    'unhandled error',
    bundles => {
      bundles.common.reports.mf.unhandledErrors = ['late rejection'];
    },
  ],
  [
    'skipped case',
    bundles => {
      bundles.common.reports.mf.tests[0].status = 'skip';
    },
  ],
  [
    'todo case',
    bundles => {
      bundles.common.reports.mf.tests[0].status = 'todo';
    },
  ],
  [
    'failed case',
    bundles => {
      bundles.common.reports.mf.tests[0].status = 'fail';
    },
  ],
  [
    'pass after retry',
    bundles => {
      bundles.common.reports.mf.tests[0].retryCount = 1;
    },
  ],
  [
    'hidden retry error',
    bundles => {
      bundles.common.reports.mf.tests[0].retryErrors = ['first attempt'];
    },
  ],
  [
    'same count with one missing and one duplicated identity',
    bundles => {
      bundles.common.reports.mf.tests[1] = structuredClone(
        bundles.common.reports.mf.tests[0],
      );
    },
  ],
  [
    'renamed parameter expansion',
    bundles => {
      bundles.common.reports.mf.tests[0].identity[3] = 'different value';
    },
  ],
  [
    'wrong mode',
    bundles => {
      bundles['lab-dev-A'].reports.mf.tests[0].identity[1] = 'production';
    },
  ],
  [
    'different suite hierarchy with identical joined title',
    bundles => {
      bundles['lab-dev-A'].reports.mf.tests[0].identity[2] = [
        'Weather Lab (dev)',
        'suite',
        'nested',
      ];
    },
  ],
  [
    'missing cleanup report',
    bundles => {
      delete bundles.common.cleanup.mf;
    },
  ],
  [
    'leaked process',
    bundles => {
      bundles.common.cleanup.mf.live = [{ pid: 42 }];
    },
  ],
  [
    'leaked workspace',
    bundles => {
      bundles.common.cleanup.mf.remaining = ['modern-mf-x'];
    },
  ],
  [
    'cleanup audit error',
    bundles => {
      bundles.common.cleanup.mf.auditError = 'ps failed';
    },
  ],
];
for (const field of ['revision', 'runId', 'attempt', 'job']) {
  corruptions.push(
    [
      `stale report ${field}`,
      bundles => {
        bundles.common.reports.mf[field] = 'stale';
      },
    ],
    [
      `stale status ${field}`,
      bundles => {
        bundles.common.status[field] = 'stale';
      },
    ],
  );
}
for (const [name, corrupt] of corruptions) {
  test(`summary rejects ${name}`, () => {
    const { manifest, bundles } = fixture();
    // Reports must not alias the expected identities in this negative test.
    const actual = structuredClone(bundles);
    corrupt(actual);
    assert.throws(() => verifyAll(actual, manifest, context, needs));
  });
}

test('baseline cannot omit a mode, duplicate a case or misclassify a file', () => {
  for (const corrupt of [
    manifest => {
      delete manifest.counts.production;
    },
    manifest => {
      manifest.mf.push(manifest.mf[0]);
    },
    manifest => {
      manifest.mf[0][0] = 'unknown.test.ts';
    },
  ]) {
    const { manifest } = fixture();
    corrupt(manifest);
    assert.throws(() => validateManifest(manifest));
  }
});

for (const [name, script, verify] of [
  [
    'preserves a failing process exit code and its log after cleanup',
    "console.error('expected failure'); process.exitCode = 7",
    (result, cleanup, log) => {
      assert.equal(result.code, 7);
      assert.equal(result.cleanup, true);
      assert.deepEqual(cleanup.live, []);
      assert.match(log, /expected failure/);
    },
  ],
  [
    'detects an orphan even when its parent exits between process samples',
    "require('node:child_process').spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' }).unref()",
    (result, cleanup) => {
      assert.equal(result.code, 0);
      assert.equal(result.cleanup, false);
      assert.ok(cleanup.live.length > 0);
      assert.deepEqual(cleanup.afterCleanup, []);
    },
  ],
  [
    'forwards cancellation to the owned process group',
    "setTimeout(() => process.kill(process.ppid, 'SIGTERM'), 100); setInterval(() => {}, 1000)",
    (result, cleanup) => {
      assert.equal(result.signal, 'SIGTERM');
      assert.equal(result.cleanup, true);
      assert.deepEqual(cleanup.live, []);
    },
  ],
]) {
  test(`runner ${name}`, async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'mf-runner-test-'));
    try {
      const result = await runCommand(
        process.execPath,
        ['-e', script],
        process.env,
        directory,
        'probe',
      );
      verify(
        result,
        JSON.parse(
          readFileSync(path.join(directory, 'probe-cleanup.json'), 'utf8'),
        ),
        readFileSync(path.join(directory, 'probe.log'), 'utf8'),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
