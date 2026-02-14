import fs from 'node:fs';
import path from 'node:path';

describe('rsc-mf host modern.server contracts', () => {
  const hostServerDir = path.resolve(__dirname, '../host/server');

  it('does not define a host modern.server middleware override', () => {
    const hostModernServerPath = path.join(hostServerDir, 'modern.server.ts');
    expect(fs.existsSync(hostModernServerPath)).toBe(false);
  });

  it('does not define manifest fallback helpers in host server layer', () => {
    const hostManifestFallbackPath = path.join(
      hostServerDir,
      'manifestFallback.ts',
    );
    expect(fs.existsSync(hostManifestFallbackPath)).toBe(false);
  });
});
