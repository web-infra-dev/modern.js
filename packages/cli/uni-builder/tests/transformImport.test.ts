import { describe, expect, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchRules, unwrapConfig } from './helper';

describe('uni-builder rspack', () => {
  it('should apply arco correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply arco when transformImport false', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        source: {
          transformImport: false,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply arco when transformImport return custom array', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        source: {
          transformImport: () => [
            {
              libraryName: 'foo',
            },
          ],
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow custom arco import config', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        source: {
          transformImport: [
            {
              libraryName: '@arco-design/web-react',
              libraryDirectory: 'es',
              camelToDashComponentName: false,
              style: false,
            },
          ],
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow filter arco import config', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        source: {
          transformImport: imports =>
            imports.filter(data => !data.libraryName.includes('arco')),
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('uni-builder webpack', () => {
  it('should apply arco correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {},
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply arco when transformImport false', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {
        source: {
          transformImport: false,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply arco when transformImport return custom array', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {
        source: {
          transformImport: () => [
            {
              libraryName: 'foo',
            },
          ],
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow custom arco import config', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {
        source: {
          transformImport: [
            {
              libraryName: '@arco-design/web-react',
              libraryDirectory: 'es',
              camelToDashComponentName: false,
              style: false,
            },
          ],
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
