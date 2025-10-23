import path from 'path';
import fs from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('build artifacts audit (rsc-ssr-mf)', () => {
  it('emits remote, stats, and server references manifests', async () => {
    const res = await modernBuild(appDir, [], {
      env: { BUNDLER: 'webpack' },
    });
    expect(res.code).toBe(0);

    const staticDir = path.join(appDir, 'dist', 'static');
    const bundlesDir = path.join(appDir, 'dist', 'bundles');
    const remoteEntry = path.join(staticDir, 'remoteEntry.js');
    const mfManifest = path.join(staticDir, 'mf-manifest.json');
    const stats = path.join(staticDir, 'mf-stats.json');
    const serverRefs = path.join(bundlesDir, 'server-references-manifest.json');

    expect(fs.existsSync(remoteEntry)).toBe(true);
    expect(fs.existsSync(mfManifest)).toBe(true);
    expect(fs.existsSync(stats)).toBe(true);
    expect(fs.existsSync(serverRefs)).toBe(true);

    const refs = JSON.parse(fs.readFileSync(serverRefs, 'utf-8')) as {
      serverReferences: Array<{ path: string; exports: string[]; moduleId: number | string | null }>;
    };
    const actionEntry = refs.serverReferences.find(e => e.path.endsWith('/src/server-component-root/components/action.ts'));
    expect(actionEntry).toBeTruthy();
    expect(actionEntry!.exports.length).toBeGreaterThan(0);
    expect(actionEntry!.moduleId).not.toBeNull();
  }, 180000);
});

