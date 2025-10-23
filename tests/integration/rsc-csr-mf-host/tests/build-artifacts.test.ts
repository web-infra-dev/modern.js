import path from 'path';
import fs from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('build artifacts audit (rsc-csr-mf-host)', () => {
  it('builds successfully and (optionally) emits a client manifest', async () => {
    const res = await modernBuild(appDir, [], {
      env: { BUNDLER: 'webpack' },
    });
    expect(res.code).toBe(0);

    const clientManifest = path.join(appDir, 'dist', 'react-client-manifest.json');
    if (fs.existsSync(clientManifest)) {
      const manifest = JSON.parse(fs.readFileSync(clientManifest, 'utf-8')) as Record<string, any>;
      // If present, it should be valid JSON object (may be empty for pure-remote usage)
      expect(typeof manifest).toBe('object');
    }
  }, 180000);
});

