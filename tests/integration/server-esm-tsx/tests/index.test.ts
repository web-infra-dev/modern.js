import dns from 'node:dns';
import path from 'path';
import { fs as fse } from '@modern-js/utils';
import {
  getPort,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

dns.setDefaultResultOrder('ipv4first');

const appDir = path.resolve(__dirname, '../');
const serverDistDir = path.join(appDir, 'dist', 'server');

describe('custom server under native esm', () => {
  beforeAll(async () => {
    await fse.remove(path.join(appDir, 'dist'));
    await modernBuild(appDir);
  });

  afterAll(async () => {
    await fse.remove(path.join(appDir, 'dist'));
  });

  it('should rewrite specifiers to the files that are actually emitted', async () => {
    const serverEntry = (
      await fse.readFile(path.join(serverDistDir, 'modern.server.js'))
    ).toString();

    // `./foo` is backed by `foo/index.tsx`, so it must not collapse to `./foo.js`.
    expect(serverEntry).toContain('./foo/index.js');
    expect(serverEntry).not.toContain('"./foo.js"');
    expect(serverEntry).toContain('../shared/message.js');
  });

  it('should emit js for tsx entries and keep sources out of dist', async () => {
    // `jsx: preserve` would emit `foo/index.jsx`, which Node cannot load.
    expect(
      await fse.pathExists(path.join(serverDistDir, 'foo', 'index.js')),
    ).toBeTruthy();
    expect(
      await fse.pathExists(path.join(serverDistDir, 'foo', 'index.jsx')),
    ).toBeFalsy();
    expect(
      await fse.pathExists(path.join(serverDistDir, 'foo', 'index.tsx')),
    ).toBeFalsy();
  });

  it('should be loadable by node', async () => {
    // The strongest check: Node itself resolves the emitted specifiers.
    const mod = await import(
      path.join(serverDistDir, 'modern.server.js').replace(/\\/g, '/')
    );

    expect(mod.default).toBeDefined();
  });

  it('should serve requests with the custom server applied', async () => {
    const port = await getPort();
    const app = await modernServe(appDir, port);

    try {
      const res = await fetch(`http://localhost:${port}`);

      expect(res.headers.get('x-esm-tsx')).toBe('foo-tsx-shared-message');
    } finally {
      await killApp(app);
    }
  });
});
