import fs from 'node:fs';
import path from 'node:path';

describe('config plugin contracts', () => {
  it('passes target MF config to bundler patching', () => {
    const configPluginPath = path.resolve(
      __dirname,
      '../src/cli/configPlugin.ts',
    );
    const source = fs.readFileSync(configPluginPath, 'utf-8');

    expect(source).toMatch(
      /patchBundlerConfig\(\{\s*chain,\s*isServer:\s*!isWeb,\s*modernjsConfig,\s*mfConfig:\s*targetMFConfig,\s*enableSSR,\s*\}\);/s,
    );
  });
});
