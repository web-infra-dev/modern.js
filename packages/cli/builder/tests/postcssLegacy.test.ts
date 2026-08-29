import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createBuilder } from '../src';
import { loadPostcssPlugin } from '../src/plugins/postcss';
import { matchRules, unwrapConfig } from './helper';

const tempDirs: string[] = [];

describe('plugin-postcssLegacy', () => {
  afterEach(async () => {
    rs.unstubAllEnvs();
    await Promise.all(
      tempDirs.map(dir => rm(dir, { recursive: true, force: true })),
    );
    tempDirs.length = 0;
  });

  it('should resolve postcss plugin from app root', async () => {
    const pluginName = 'postcss-app-root-plugin';
    const appRoot = await mkdtemp(path.join(tmpdir(), 'builder-postcss-'));
    tempDirs.push(appRoot);

    const pluginDir = path.join(appRoot, 'node_modules', pluginName);
    await mkdir(pluginDir, { recursive: true });
    await writeFile(
      path.join(appRoot, 'package.json'),
      JSON.stringify({ name: 'app-root' }),
    );
    await writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify({ name: pluginName, main: 'index.js' }),
    );
    await writeFile(
      path.join(pluginDir, 'index.js'),
      "module.exports = { postcssPlugin: 'postcss-app-root-plugin' };",
    );

    expect(loadPostcssPlugin(pluginName, appRoot)).toEqual({
      postcssPlugin: pluginName,
    });
  });

  it('should register postcss plugin by browserslist', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        output: {
          overrideBrowserslist: ['chrome >= 87'],
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.sass' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.less' })).toMatchSnapshot();
  });

  it('should allow tools.postcss to override the plugins', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        tools: {
          postcss: {
            postcssOptions: {
              plugins: [
                {
                  postcssPlugin: 'postcss-plugin-test-override',
                  AtRule: {},
                },
              ],
            },
          },
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.sass' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.less' })).toMatchSnapshot();
  });

  it('should register postcss plugin correctly when injectStyles is enabled in dev environment', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        output: {
          injectStyles: true,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
  });

  it('should register postcss plugin correctly when injectStyles is enabled in production environment', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        output: {
          injectStyles: true,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
  });
});

describe('lightningcss-loader', () => {
  it('should register lightningcss-loader and disable postcss-loader when lightningcssLoader enabled', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        tools: {
          lightningcssLoader: true,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
  });

  it('should register lightningcss-loader and postcss-loader both', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        tools: {
          lightningcssLoader: true,
          postcss: {
            postcssOptions: {
              plugins: [
                {
                  postcssPlugin: 'postcss-plugin-test',
                  AtRule: {},
                },
              ],
            },
          },
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
  });
});
