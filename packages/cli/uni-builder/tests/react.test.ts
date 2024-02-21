import { expect, describe, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchPlugins, unwrapConfig, matchRules } from './helper';

describe('plugins/react', () => {
  it('should work with babel-loader', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {},
    });
    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.js' })).toMatchSnapshot();
    expect(matchPlugins(config, 'ReactRefreshPlugin')).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        dev: {
          hmr: false,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchPlugins(config, 'ReactRefreshPlugin')).toEqual([]);
  });

  it('should not apply react refresh when target is node', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      target: ['node'],
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchPlugins(config, 'ReactRefreshPlugin')).toEqual([]);
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      target: ['web-worker'],
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchPlugins(config, 'ReactRefreshPlugin')).toEqual([]);
  });
});
