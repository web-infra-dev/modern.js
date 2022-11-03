import {
  createBuilderAlias,
  createBuilderInclude,
  createBuilderModuleScope,
} from '../../src/builder/createSourceConfig';

describe('test create Builder Alias Config', () => {
  const internalDirAlias = '@internalDirAlias';
  const internalSrcAlias = '@internalSrcAlias';
  const srcDirectory = 'test/default/src_alias';
  const sharedDirectory = 'test/shared/dir_alias';
  const internalDirectory = 'test/internal/dir_alias';

  const appContext = {
    internalDirectory,
    internalDirAlias,
    internalSrcAlias,
    srcDirectory,
    sharedDirectory,
  };

  const defaultAliasConfig = {
    [internalDirAlias]: internalDirectory,
    [internalSrcAlias]: srcDirectory,
    '@': srcDirectory,
    '@shared': sharedDirectory,
  };

  it('should create default alias config', () => {
    const alias = createBuilderAlias(undefined, appContext as any);
    expect(alias).toEqual(defaultAliasConfig);
  });

  it('should create user custom alias config', () => {
    const api = 'test/xxx/api_alias';
    const common = './src/common';
    const userAlias = (opts: { [x: string]: string }) => {
      opts['@api'] = api;
      opts['@common'] = common;
    };
    const alias = createBuilderAlias(userAlias as any, appContext as any);
    expect(alias).toEqual({
      ...defaultAliasConfig,
      '@api': api,
      '@common': common,
    });
  });
});

describe('test create Builder Include Config', () => {
  const internalDirectory = 'test/internal/dir_alias';
  const appDirectory = `${__dirname}/fixtures`;
  const appContext = {
    internalDirectory,
    appDirectory,
  };
  it('should create default appContext', () => {
    const include = createBuilderInclude(undefined, appContext as any);
    expect(include).toEqual([internalDirectory]);
  });

  it('should create user custom appContext', () => {
    const userInclude = ['hello', /node_modules/, '/User/Example'];
    const include = createBuilderInclude(userInclude, appContext as any);
    expect(include).toEqual([
      /hello/,
      /node_modules/,
      '/User/Example',
      internalDirectory,
    ]);
  });

  // TODO: add test about monorepo
});

describe('test create Builder Module Scope', () => {
  it('should return undefined', () => {
    const moduleScope = createBuilderModuleScope(undefined);
    expect(moduleScope).toBeUndefined();
  });

  it('should return custom module scope', () => {
    const DEFAULT_SCOPES: Array<string | RegExp> = [
      './src',
      './shared',
      /node_modules/,
    ];
    const moduleScopes = ['./server'];

    const moduleScope = createBuilderModuleScope(moduleScopes as any);
    expect(moduleScope).toEqual([...DEFAULT_SCOPES, './server']);
  });
});
