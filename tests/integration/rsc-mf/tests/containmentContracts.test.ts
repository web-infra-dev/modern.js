import fs from 'node:fs';
import path from 'node:path';

describe('rsc-mf containment contracts', () => {
  it('keeps MF async-startup patching out of core resource loader', () => {
    const coreResourcePath = path.resolve(
      __dirname,
      '../../../../packages/server/core/src/adapters/node/plugins/resource.ts',
    );
    const source = fs.readFileSync(coreResourcePath, 'utf-8');

    expect(source).not.toContain('__webpack_require__.mfAsyncStartup');
    expect(source).not.toContain('loadPatchedAsyncNodeBundle');
    expect(source).toContain('registerBundleLoaderStrategy');
  });

  it('registers MF async-startup strategy in modernjs-v3 server plugin', () => {
    const serverPluginPath = path.resolve(
      __dirname,
      '../../../../packages/modernjs-v3/src/server/index.ts',
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
    const strategyPath = path.resolve(
      __dirname,
      '../../../../packages/modernjs-v3/src/server/asyncStartupLoader.ts',
    );
    const source = fs.readFileSync(strategyPath, 'utf-8');

    expect(source).toContain('__webpack_require__.mfAsyncStartup');
    expect(source).toContain('__webpack_require__.x({}, [])');
  });

  it('keeps RSC action 500 details dev-only in core runtime', () => {
    const rscServerPath = path.resolve(
      __dirname,
      '../../../../packages/runtime/render/src/server/rsc/rsc.tsx',
    );
    const source = fs.readFileSync(rscServerPath, 'utf-8');

    expect(source).toContain("process.env.NODE_ENV === 'development'");
    expect(source).toContain('? `Internal server error\\n${errorMessage}');
    expect(source).toContain(": 'Internal server error';");
  });
});
