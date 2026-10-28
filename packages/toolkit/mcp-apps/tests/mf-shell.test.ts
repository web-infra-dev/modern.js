import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { mcpAppsPlugin, type McpAppsPluginOptions } from '../src/cli';

const { shellConfigs } = rs.hoisted(() => ({
  shellConfigs: [] as Array<{
    rsbuildConfig: {
      source: { entry: Record<string, string> };
      resolve: { alias: Record<string, string> };
    };
  }>,
}));
rs.mock('@rsbuild/core', () => ({
  createRsbuild: async (config: (typeof shellConfigs)[number]) => {
    shellConfigs.push(config);
    return { build: async () => ({ close: async () => {} }) };
  },
}));

type ModifyEntrypoints = (input: {
  entrypoints: unknown[];
}) => Promise<unknown>;
const packageRoot = path.resolve(__dirname, '..');
const packageRequire = createRequire(path.join(packageRoot, 'package.json'));
let internalDirectory: string;
afterEach(async () => {
  shellConfigs.length = 0;
  await rm(internalDirectory, { recursive: true, force: true });
});

async function buildShellConfig(mf?: McpAppsPluginOptions['mf']) {
  internalDirectory = await mkdtemp(path.join(os.tmpdir(), 'mcp-shell-'));
  let modifyEntrypoints!: ModifyEntrypoints;
  const noop = () => {};
  mcpAppsPlugin({ views: 'tests/fixtures/mcp-views-mf.json', mf }).setup!({
    getAppContext: () => ({
      appDirectory: packageRoot,
      internalDirectory,
      command: 'build',
    }),
    getNormalizedConfig: () => ({
      source: { enableAsyncEntry: true, alias: {}, define: {} },
      dev: {},
      output: {},
    }),
    addWatchFiles: noop,
    modifyEntrypoints: (fn: ModifyEntrypoints) => {
      modifyEntrypoints = fn;
    },
    _internalServerPlugins: noop,
    modifyRsbuildConfig: noop,
    onAfterCreateCompiler: noop,
  } as never);
  await modifyEntrypoints({ entrypoints: [] });
  expect(shellConfigs).toHaveLength(1);
  return shellConfigs[0].rsbuildConfig;
}

describe('mcpAppsPlugin MF shell build', () => {
  it('builds the shell entry from this package', async () => {
    const config = await buildShellConfig();
    expect(config.source.entry).toEqual({
      'mcp-shell': path.join(packageRoot, 'dist/esm/mf-entry.mjs'),
    });
  });

  it('defaults the shell MF runtime to @module-federation/enhanced/runtime', async () => {
    const config = await buildShellConfig();
    expect(config.resolve.alias['@module-federation/enhanced/runtime$']).toBe(
      packageRequire.resolve('@module-federation/enhanced/runtime'),
    );
  });

  it('points the shell MF runtime at mf.runtime resolved from the application', async () => {
    const config = await buildShellConfig({ runtime: 'react-dom/client' });
    expect(config.resolve.alias['@module-federation/enhanced/runtime$']).toBe(
      packageRequire.resolve('react-dom/client'),
    );
  });
});
