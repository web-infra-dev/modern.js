import path from 'node:path';
import { defineConfig } from '@rstest/core';
import producer from '../../../packages/cli/plugin-module-federation/rstest.config.mts';
import runtime from '../../../packages/runtime/plugin-runtime/rstest.config.mts';
import { repoRoot, unitFiles } from './scripts/groups.mjs';
import MFReporter from './scripts/reporter.mjs';

const name = process.env.MF_REPORT_NAME;
if (name !== 'rootExposes' && name !== 'routeScope')
  throw new Error('MF_REPORT_NAME must be rootExposes or routeScope');

const root = path.join(
  repoRoot,
  name === 'rootExposes'
    ? 'packages/cli/plugin-module-federation'
    : 'packages/runtime/plugin-runtime',
);
const config = name === 'rootExposes' ? producer : runtime;
export default defineConfig({
  ...config,
  root,
  // Retain each package's transforms, setup, resolution and project selection.
  ...(config.projects
    ? { projects: config.projects.map(project => ({ ...project, root })) }
    : {}),
  include: [path.join(repoRoot, unitFiles[name])],
  pool: { maxWorkers: 1 },
  retry: 0,
  passWithNoTests: false,
  reporters: ['verbose', new MFReporter()],
});
