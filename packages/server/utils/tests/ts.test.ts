import { fs } from '@modern-js/utils';
import { compile } from '../src';
import { join } from './helpers';

describe('typescript', () => {
  it('compile typescript', async () => {
    const example = join(__dirname, './fixtures', './ts-example');
    const tsconfigPath = join(example, './tsconfig.json');
    const distDir = join(example, './dist');
    const sharedDir = join(example, './shared');
    const apiDir = join(example, './api');
    const serverDir = join(example, './server');
    await compile(
      example,
      {
        source: {
          alias: {
            '@modern-js/runtime/server': join(sharedDir, './runtime/server'),
            '@modern-js/runtime': '@modern-js/core',
          },
        },
      } as any,
      {
        sourceDirs: [sharedDir, apiDir, serverDir],
        distDir,
        tsconfigPath,
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
