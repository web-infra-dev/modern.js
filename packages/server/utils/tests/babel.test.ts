import path from 'path';
import { fs } from '@modern-js/utils';
import { resolveBabelConfig, compile } from '../src';
import { defaults, join } from './helpers';

describe('babel', () => {
  jest.setTimeout(30000);
  it('resolveBabelConfig', () => {
    const pwd = path.resolve(__dirname, './fixtures');
    const tsconfigPath = path.resolve(
      __dirname,
      './fixtures/api/tsconfig.json',
    );
    const config = resolveBabelConfig(pwd, defaults as any, {
      type: 'commonjs',
      syntax: 'es6+',
      tsconfigPath,
    });

    const root = path.resolve(__dirname, '../../../../');

    expect.addSnapshotSerializer({
      test: val =>
        typeof val === 'string' &&
        (val.includes('modern.js') ||
          val.includes('node_modules') ||
          val.includes(root)),
      print: val =>
        // eslint-disable-next-line no-nested-ternary
        typeof val === 'string'
          ? // eslint-disable-next-line no-nested-ternary
            val.includes('node_modules')
            ? `"${val.replace(/.+node_modules/, '').replace(/\\/g, '/')}"`
            : val.includes('modern.js')
            ? `"${val.replace(/.+modern\.js/, '').replace(/\\/g, '/')}"`
            : `"${val.replace(root, '').replace(/\\/g, '/')}"`
          : (val as string),
    });

    expect(config).toMatchSnapshot();
  });

  it('compile es', async () => {
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
          '@modern-js/runtime': '@modern-js/core',
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
