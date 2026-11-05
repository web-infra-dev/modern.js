import path from 'path';
import { createRsbuild } from '@rsbuild/core';
import { builderPluginAdapterBasic } from '../../src/builder/shared/builderPlugins/adapterBasic';

const cwd = path.join(__dirname, 'fixtures/ts-app');

describe('builderPluginAdapterBasic', () => {
  it('keeps .js -> .ts resolution after server extensions for node targets', async () => {
    const rsbuild = await createRsbuild({
      cwd,
      rsbuildConfig: {
        source: { entry: { index: './index.ts' } },
        environments: {
          web: { output: { target: 'web' } },
          node: { output: { target: 'node' } },
        },
        plugins: [
          builderPluginAdapterBasic({
            appContext: { metaName: 'modern-js' },
          } as any),
        ],
      },
    });
    const [web, node] = await rsbuild.initConfigs();

    expect(web.resolve?.extensionAlias).toEqual({
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    });
    expect(node.resolve?.extensionAlias).toEqual({
      '.js': ['.node.js', '.server.js', '.js', '.ts', '.tsx'],
      '.jsx': ['.node.jsx', '.server.jsx', '.jsx', '.tsx'],
      '.ts': ['.node.ts', '.server.ts', '.ts'],
      '.tsx': ['.node.tsx', '.server.tsx', '.tsx'],
      '.mjs': ['.node.mjs', '.server.mjs', '.mjs'],
      '.json': ['.node.json', '.server.json', '.json'],
    });
  });
});
