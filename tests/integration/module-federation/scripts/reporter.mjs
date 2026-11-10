import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot, testPrefix, groups } from './groups.mjs';

export function identity(test) {
  const file = path.relative(repoRoot, test.testPath).split(path.sep).join('/');
  const parents = test.parentNames ?? [];
  const isLab = [...groups.A, ...groups.B].some(
    filename => file === testPrefix + filename,
  );
  const mode = isLab
    ? /^Weather Lab \((dev|production)\)$/.exec(parents[0])?.[1]
    : 'common';
  if (!mode)
    throw new Error(`Missing Lab mode: ${file} ${parents.join(' > ')}`);
  return [file, mode, parents, test.name, test.project];
}

// Use Rstest's collected results, including expanded it.each names and suite paths.
// A report is written only after file hooks and run-level error collection finish.
export default class MFReporter {
  startedAt = new Date().toISOString();

  onTestRunEnd({ results, testResults, unhandledErrors, duration }) {
    const directory = process.env.MF_LAB_ARTIFACT_DIR;
    const name = process.env.MF_REPORT_NAME ?? 'mf';
    if (!directory || !['mf', 'rootExposes', 'routeScope'].includes(name))
      throw new Error(
        'MF reporter requires an artifact directory and report name',
      );
    const result = test => ({
      status: test.status,
      errors: (test.errors ?? []).map(error => error.message),
      retryCount: test.retryCount ?? 0,
      retryErrors: (test.retryErrors ?? []).map(error => error.message),
    });
    const report = {
      version: 1,
      name,
      revision: execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).trim(),
      runId: process.env.GITHUB_RUN_ID ?? 'local',
      attempt: process.env.GITHUB_RUN_ATTEMPT ?? '1',
      job: process.env.MF_JOB_ID ?? 'serial',
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      duration,
      unhandledErrors: unhandledErrors.map(error => error.message),
      files: results.map(file => ({
        file: path.relative(repoRoot, file.testPath).split(path.sep).join('/'),
        ...result(file),
      })),
      tests: testResults.map(test => ({
        identity: identity(test),
        ...result(test),
      })),
    };
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, `${name}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
}
