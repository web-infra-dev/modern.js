import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../../..');
const fixtureResolvePaths = [
  path.resolve(__dirname, '../host'),
  path.resolve(__dirname, '../remote'),
  repoRoot,
  __dirname,
];

const workspacePackageRoots: Record<string, string> = {
  '@modern-js/server-core': path.resolve(repoRoot, 'packages/server/core'),
  '@modern-js/render': path.resolve(repoRoot, 'packages/runtime/render'),
};

const findPackageRootFromResolvedEntry = (
  resolvedEntryPath: string,
  packageName: string,
): string | undefined => {
  let currentDir = path.dirname(resolvedEntryPath);
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.resolve(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const { name } = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8'),
        ) as { name?: string };
        if (name === packageName) {
          return currentDir;
        }
      } catch {
        // Ignore invalid JSON and continue walking upwards.
      }
    }
    currentDir = path.dirname(currentDir);
  }
  return undefined;
};

const resolvePackageRoot = (packageName: string): string => {
  const workspaceRoot = workspacePackageRoots[packageName];
  if (workspaceRoot && fs.existsSync(workspaceRoot)) {
    return workspaceRoot;
  }

  for (const basePath of fixtureResolvePaths) {
    try {
      return path.dirname(
        require.resolve(`${packageName}/package.json`, { paths: [basePath] }),
      );
    } catch {
      // package.json may not be exported; try entrypoint resolution next.
    }
  }

  for (const basePath of fixtureResolvePaths) {
    try {
      const resolvedEntryPath = require.resolve(packageName, {
        paths: [basePath],
      });
      const packageRoot = findPackageRootFromResolvedEntry(
        resolvedEntryPath,
        packageName,
      );
      if (packageRoot) {
        return packageRoot;
      }
    } catch {
      // Continue trying all resolution bases.
    }
  }

  throw new Error(
    `Cannot resolve package root for ${packageName} from: ${fixtureResolvePaths.join(', ')}`,
  );
};

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

    const hasServerCoreImportOrRequire = source.includes(
      '@modern-js/server-core/node',
    );

    expect(hasServerCoreImportOrRequire).toBe(true);
    expect(source).toContain('registerBundleLoaderStrategy');
    expect(source).toContain('mfAsyncStartupLoaderStrategy');
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
