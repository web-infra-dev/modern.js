import fs from 'node:fs';
import path from 'node:path';

describe('rsc-mf remote modern.server contracts', () => {
  const remoteServerDir = path.resolve(__dirname, '../remote/server');

  it('does not define a remote modern.server middleware override', () => {
    const remoteModernServerPath = path.join(
      remoteServerDir,
      'modern.server.ts',
    );
    expect(fs.existsSync(remoteModernServerPath)).toBe(false);
  });

  it('does not define manifest fallback helpers in remote server layer', () => {
    const remoteManifestFallbackPath = path.join(
      remoteServerDir,
      'manifestFallback.ts',
    );
    expect(fs.existsSync(remoteManifestFallbackPath)).toBe(false);
  });

  it('does not define proxy response helpers in remote server layer', () => {
    const remoteProxyResponsePath = path.join(
      remoteServerDir,
      'proxyResponse.ts',
    );
    expect(fs.existsSync(remoteProxyResponsePath)).toBe(false);
  });
});
