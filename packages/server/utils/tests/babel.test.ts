import path from 'path';
import { fs } from '@modern-js/utils';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { compile, resolveBabelConfig } from '../src';
import { defaults, join } from './helpers';

initSnapshotSerializer({ workspace: path.resolve(__dirname, '../../../..') });

describe('babel', () => {
  jest.setTimeout(30000);
  it('resolveBabelConfig', () => {
    const pwd = path.resolve(__dirname, './fixtures');
    const tsconfigPath = path.resolve(
      __dirname,
      './fixtures/api/tsconfig.json',
    );
    const config = resolveBabelConfig(pwd, defaults as any, {
      tsconfigPath,
    });

    expect(config).toMatchSnapshot();
  });

  xit('compile es', async () => {
    const example = join(__dirname, './fixtures', './es-example');
    const distDir = join(example, './dist');
    const sharedDir = join(example, './shared');
    const apiDir = join(example, './api');
    const serverDir = join(example, './server');
    await compile(
      example,
      {
        alias: {
          '@shared': join(example, './shared'),
          '@modern-js/runtime/server': join(sharedDir, './runtime/server'),
        },
        tools: {
          lodash: null,
        },
      } as any,
      {
        sourceDirs: [sharedDir, apiDir, serverDir],
        distDir,
      },
    );

    const distApiDir = join(distDir, './api');
    const api = require(distApiDir).default;
    expect(api()).toEqual('runtime-shared-api');

    const distServerDir = join(distDir, './server');
    const server = require(distServerDir).default;
    expect(server()).toEqual('shared-server');

    const files = await fs.readdir(distServerDir);
    expect(files.length).toBe(2);

    const distSrcDir = join(distDir, './src');
    expect(await fs.pathExists(distSrcDir)).toBeFalsy();

    const mapAliasFile = join(distApiDir, './map-alias.js');
    expect(await fs.pathExists(mapAliasFile)).toBeTruthy();
    const mapAliasContent = (await fs.readFile(mapAliasFile)).toString();
    expect(mapAliasContent).toMatchSnapshot();

    await fs.remove(distDir);
  });
});
