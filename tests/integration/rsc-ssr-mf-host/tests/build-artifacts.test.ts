import path from 'path';
import fs from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('build artifacts audit (rsc-ssr-mf-host)', () => {
  it('builds successfully and produces server component bundle', async () => {
    const res = await modernBuild(appDir, [], {
      env: { BUNDLER: 'webpack' },
    });
    expect(res.code).toBe(0);

    const bundlesDir = path.join(appDir, 'dist', 'bundles');
    expect(fs.existsSync(bundlesDir)).toBe(true);
    const files = fs.readdirSync(bundlesDir).filter(f => /main.*\.js$/.test(f));
    expect(files.length).toBeGreaterThan(0);
  }, 180000);
});

