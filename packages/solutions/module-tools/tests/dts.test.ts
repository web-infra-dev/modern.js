import path from 'path';
import { getProjectTsconfig } from '../src/utils';

describe('dts: getTsconfig', () => {
  const appDirectory = path.join(__dirname, './fixtures/multiple-tsconfig');

  it('should resolve correct tsconfig (including extended config)', async () => {
    const rootTsconfigPath = path.join(appDirectory, 'tsconfig.json');
    const tsconfig = await getProjectTsconfig(rootTsconfigPath);

    // from tsconfig.json
    expect(tsconfig.compilerOptions?.target).toEqual('ESNext');
    // from tsconfig.build.json
    expect(tsconfig.compilerOptions?.emitDecoratorMetadata).toEqual(true);
    // from tsconfig.base.json
    expect(tsconfig.compilerOptions?.emitDeclarationOnly).toEqual(true);
    // from @modern-js/tsconfig/base
    expect(tsconfig.compilerOptions?.declaration).toEqual(false);
  });

  it('should resolve correct tsconfig when extending many tsconfigs', async () => {
    const rootTsconfigPath = path.join(
      appDirectory,
      './tsconfig.multiple.json',
    );
    const tsconfig = await getProjectTsconfig(rootTsconfigPath);

    // from tsconfig.build.json
    expect(tsconfig.compilerOptions?.emitDecoratorMetadata).toEqual(true);
    // from tsconfig.base.json
    expect(tsconfig.compilerOptions?.emitDeclarationOnly).toEqual(true);
    // from @modern-js/tsconfig/base
    expect(tsconfig.compilerOptions?.declaration).toEqual(false);
  });

  it('should resolve correct tsconfig when config has circular dependency', async () => {
    const rootTsconfigPath = path.join(
      appDirectory,
      './circular/tsconfig.foo.json',
    );
    const tsconfig = await getProjectTsconfig(rootTsconfigPath);

    expect(tsconfig.compilerOptions?.declaration).toEqual(true);
    expect(tsconfig.compilerOptions?.emitDecoratorMetadata).toEqual(true);
  });
});
