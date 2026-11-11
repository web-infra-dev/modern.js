import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const labRoot = fileURLToPath(new URL('../', import.meta.url));
export const repoRoot = path.resolve(labRoot, '../../..');
export const testPrefix = 'tests/integration/module-federation/';
export const groups = {
  A: [
    'route-navigation',
    'comparison',
    'route-scope',
    'application-isolation',
    'input-forms',
    'advanced',
  ],
  B: [
    'bridge-ssr',
    'service-app',
    'bridge-stream',
    'error-recovery',
    'weather-application',
    'data-fetch',
    'rendering',
    'inspect',
    'unified',
    'bridge-failure',
  ],
  common: [
    'activation',
    'ordinary-react',
    'input-types',
    'route-scope-build',
    'runtime-exports',
  ],
};
for (const group of Object.keys(groups)) {
  groups[group] = groups[group].map(name => `tests/${name}.test.ts`);
}

export const jobs = {
  'lab-dev-A': { suite: 'lab', mode: 'dev', shard: 'A' },
  'lab-dev-B': { suite: 'lab', mode: 'dev', shard: 'B' },
  'lab-production-A': { suite: 'lab', mode: 'production', shard: 'A' },
  'lab-production-B': { suite: 'lab', mode: 'production', shard: 'B' },
  common: { suite: 'common' },
};

export const unitFiles = {
  rootExposes:
    'packages/cli/plugin-module-federation/src/cli/rootExposes.test.ts',
  routeScope: 'packages/runtime/plugin-runtime/tests/router/routeScope.test.ts',
};

export function discoverFiles(directory = path.join(labRoot, 'tests')) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return discoverFiles(filename);
    return entry.name.endsWith('.test.ts')
      ? [path.relative(labRoot, filename).split(path.sep).join('/')]
      : [];
  });
}

export function validateGroups(files = discoverFiles(), assignment = groups) {
  const known = new Set(files);
  const assigned = new Set();
  for (const group of ['A', 'B', 'common']) {
    if (!assignment[group]?.length) throw new Error(`Empty group: ${group}`);
    for (const file of assignment[group]) {
      if (!known.has(file)) throw new Error(`Unknown file: ${file}`);
      if (assigned.has(file)) throw new Error(`Duplicate assignment: ${file}`);
      assigned.add(file);
    }
  }
  for (const group of Object.keys(assignment)) {
    if (!['A', 'B', 'common'].includes(group))
      throw new Error(`Unknown group: ${group}`);
  }
  for (const file of known) {
    if (!assigned.has(file)) throw new Error(`Unassigned file: ${file}`);
  }
}

export function selectFiles(env = process.env, files, assignment = groups) {
  validateGroups(files, assignment);
  const suite = env.MF_LAB_SUITE;
  const mode = env.MF_LAB_MODE;
  const shard = env.MF_LAB_SHARD;
  for (const [key, value, allowed] of [
    ['MF_LAB_SUITE', suite, ['lab', 'common']],
    ['MF_LAB_MODE', mode, ['dev', 'production']],
    ['MF_LAB_SHARD', shard, ['A', 'B']],
  ]) {
    if (value !== undefined && !allowed.includes(value))
      throw new Error(`Invalid ${key}: ${JSON.stringify(value)}`);
  }
  if (shard !== undefined && suite !== 'lab')
    throw new Error('MF_LAB_SHARD requires MF_LAB_SUITE=lab');
  if (suite === 'common' && (mode !== undefined || shard !== undefined))
    throw new Error('The common suite does not accept a mode or shard');
  const selected =
    suite === 'common'
      ? assignment.common
      : suite === 'lab'
        ? shard
          ? assignment[shard]
          : [...assignment.A, ...assignment.B]
        : [...assignment.A, ...assignment.B, ...assignment.common];
  if (!selected.length) throw new Error('Empty selection');
  return selected;
}

export function jobEnv(id) {
  const job = jobs[id];
  if (!job) throw new Error(`Unknown job: ${id}`);
  return {
    MF_LAB_SUITE: job.suite,
    ...(job.mode ? { MF_LAB_MODE: job.mode } : {}),
    ...(job.shard ? { MF_LAB_SHARD: job.shard } : {}),
  };
}
