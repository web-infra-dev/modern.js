import path from 'path';
import { execa } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('shims', () => {
  const fixtureDir = __dirname;
  it('shims', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const cjs_bundle_path = path.join(fixtureDir, 'dist/cjs/bundle.js');
    const cjs_bundleless_path = path.join(fixtureDir, 'dist/cjs/index.js');
    const esm_bundle_path = path.join(fixtureDir, 'dist/esm/bundle.mjs');
    const esm_bundleless_path = path.join(fixtureDir, 'dist/esm/index.mjs');

    const { command } = execa;
    const output = await Promise.all([
      command(`node ${cjs_bundle_path}`),
      command(`node ${cjs_bundleless_path}`),
      command(`node ${esm_bundle_path}`),
      command(`node ${esm_bundleless_path}`),
    ]);
    expect(output.every(o => !o.failed)).toBeTruthy();
  });
});
