import fs from 'node:fs';
import path from 'node:path';

const resolvePackageRoot = (packageName: string): string =>
  path.dirname(require.resolve(`${packageName}/package.json`));

const resolvePackageFilePath = (
  packageName: string,
  relativePaths: string[],
): string => {
  const packageRoot = resolvePackageRoot(packageName);
  const resolvedPath = relativePaths
    .map(relativePath => path.resolve(packageRoot, relativePath))
    .find(candidatePath => fs.existsSync(candidatePath));

  if (!resolvedPath) {
    throw new Error(
      `Cannot resolve any expected file for ${packageName}: ${relativePaths.join(', ')}`,
    );
  }

  return resolvedPath;
};

describe('rsc-mf containment contracts', () => {
  it('keeps MF async-startup patching out of core resource loader', () => {
    const coreResourcePath = resolvePackageFilePath('@modern-js/server-core', [
      'src/adapters/node/plugins/resource.ts',
      'dist/cjs/adapters/node/plugins/resource.js',
      'dist/esm-node/adapters/node/plugins/resource.mjs',
      'dist/esm/adapters/node/plugins/resource.mjs',
    ]);
    const source = fs.readFileSync(coreResourcePath, 'utf-8');

    expect(source).not.toContain('__webpack_require__.mfAsyncStartup');
    expect(source).not.toContain('loadPatchedAsyncNodeBundle');
    expect(source).toContain('registerBundleLoaderStrategy');
  });

  it('registers MF async-startup strategy in modernjs-v3 server plugin', () => {
    const serverPluginPath = resolvePackageFilePath(
      '@module-federation/modern-js-v3',
      [
        'src/server/index.ts',
        'dist/cjs/server/index.js',
        'dist/esm/server/index.mjs',
      ],
    );
    const source = fs.readFileSync(serverPluginPath, 'utf-8');

    expect(source).toContain(
      "import { registerBundleLoaderStrategy } from '@modern-js/server-core/node';",
    );
    expect(source).toContain(
      'registerBundleLoaderStrategy(mfAsyncStartupLoaderStrategy);',
    );
  });

  it('keeps MF async-startup logic inside modernjs-v3 loader strategy', () => {
    const strategyPath = resolvePackageFilePath(
      '@module-federation/modern-js-v3',
      [
        'src/server/asyncStartupLoader.ts',
        'dist/cjs/server/asyncStartupLoader.js',
        'dist/esm/server/asyncStartupLoader.mjs',
      ],
    );
    const source = fs.readFileSync(strategyPath, 'utf-8');

    expect(source).toContain('__webpack_require__.mfAsyncStartup');
    expect(source).toContain('__webpack_require__.x({}, [])');
  });

  it('keeps RSC action 500 details dev-only in core runtime', () => {
    const rscServerPath = resolvePackageFilePath('@modern-js/render', [
      'src/server/rsc/rsc.tsx',
      'dist/cjs/server/rsc/rsc.js',
      'dist/esm/server/rsc/rsc.js',
    ]);
    const source = fs.readFileSync(rscServerPath, 'utf-8');

    expect(source).toContain("process.env.NODE_ENV === 'development'");
    expect(source).toContain('? `Internal server error\\n${errorMessage}');
    expect(source).toContain(": 'Internal server error';");
  });
});
