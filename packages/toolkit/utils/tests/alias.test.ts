import path from 'path';
import { getAliasConfig, getUserAlias } from '../src';

const fixtures = path.resolve(__dirname, './fixtures/tsconfig');

describe('getUserAlias', () => {
  it('should filter invalid ts paths that are not array', () => {
    expect(
      getUserAlias({
        foo: ['a', 'b'],
        bar: 'c',
      }),
    ).toEqual({
      foo: ['a', 'b'],
    });
  });
});

describe('getAliasConfig', () => {
  it('should fall back to appDirectory for non-ts projects', () => {
    const appDirectory = path.join(fixtures, 'missing');

    expect(
      getAliasConfig(
        { '@app': './src' },
        {
          appDirectory,
          tsconfigPath: path.join(appDirectory, 'tsconfig.json'),
        },
      ),
    ).toEqual({
      absoluteBaseUrl: appDirectory,
      paths: { '@app': './src' },
      isTsPath: false,
      isTsProject: false,
    });
  });

  it('should inherit paths from a parent tsconfig through extends', () => {
    const appDirectory = path.join(fixtures, 'alias-inherit');

    // tsconfig.server.json only extends tsconfig.json and declares no paths.
    const result = getAliasConfig(
      { '@app': './src' },
      {
        appDirectory,
        tsconfigPath: path.join(appDirectory, 'tsconfig.server.json'),
      },
    );

    expect(result).toEqual({
      absoluteBaseUrl: appDirectory,
      paths: {
        '@app': './src',
        '@/*': ['./src/*'],
      },
      isTsPath: true,
      isTsProject: true,
    });
  });

  it('should resolve an inherited baseUrl against its declaring file', () => {
    const appDirectory = path.join(fixtures, 'alias-inherit-baseurl');

    const result = getAliasConfig(undefined, {
      appDirectory: path.join(appDirectory, 'somewhere-else'),
      tsconfigPath: path.join(appDirectory, 'tsconfig.json'),
    });

    // config/tsconfig.base.json declares `baseUrl: "../"`, i.e. the app root.
    expect(result.absoluteBaseUrl).toBe(appDirectory);
    expect(result.paths).toEqual({ '@src/*': ['src/*'] });
    expect(result.isTsPath).toBe(true);
  });

  it('should let tsconfig paths win over source.alias for the same key', () => {
    const appDirectory = path.join(fixtures, 'alias-inherit');

    const result = getAliasConfig(
      { '@/*': ['./other/*'] },
      {
        appDirectory,
        tsconfigPath: path.join(appDirectory, 'tsconfig.json'),
      },
    );

    expect(result.paths).toEqual({ '@/*': ['./src/*'] });
  });
});
