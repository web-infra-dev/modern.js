import {
  createBuilderInclude,
  createBuilderModuleScope,
} from '../../src/builder/createSourceConfig';

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
