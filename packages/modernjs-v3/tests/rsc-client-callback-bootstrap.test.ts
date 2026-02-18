import fs from 'node:fs';
import path from 'node:path';

const getBootstrapSource = () => {
  const bootstrapFilePath = path.resolve(
    __dirname,
    '../src/runtime/rsc-client-callback-bootstrap.js',
  );
  return fs.readFileSync(bootstrapFilePath, 'utf-8');
};

describe('rsc-client-callback-bootstrap', () => {
  it('registers resolveActionId via runtime API', () => {
    const source = getBootstrapSource();

    expect(source).toContain(
      "import { setResolveActionId } from '@modern-js/runtime/rsc/client';",
    );
    expect(source).toContain('setResolveActionId(resolveActionId);');
    expect(source).not.toContain('__MODERN_RSC_ACTION_RESOLVER__');
  });

  it('falls back to root action endpoint when entry name is missing', () => {
    const source = getBootstrapSource();

    expect(source).toContain(
      "if (!entryName || entryName === 'main' || entryName === 'index')",
    );
  });

  it('avoids remapping action ids via host uniqueName heuristics', () => {
    const source = getBootstrapSource();

    expect(source).not.toContain('initializeSharingData.uniqueName');
  });

  it('keeps callback installation retries and chunk-loader hook for late runtimes', () => {
    const source = getBootstrapSource();

    expect(source).toContain('const CALLBACK_INSTALL_RETRY_DELAY_MS = 50;');
    expect(source).toContain('const MAX_CALLBACK_INSTALL_ATTEMPTS = 120;');
    expect(source).toContain('function hookChunkLoaderInstall()');
    expect(source).toContain('webpackRequire.e = wrappedChunkLoader;');
  });
});
