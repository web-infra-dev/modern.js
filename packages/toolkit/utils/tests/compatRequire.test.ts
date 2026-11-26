import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'path';
import { cleanRequireCache, compatibleRequire } from '../src';
import { createPatchedBundlePath } from '../src/cli/require';

describe('compat require', () => {
  const fixturePath = path.resolve(__dirname, './fixtures/compat-require');

  afterEach(() => {
    rstest.unstubAllEnvs();
  });

  test(`should support default property`, async () => {
    expect(await compatibleRequire(path.join(fixturePath, 'esm.js'))).toEqual({
      name: 'esm',
    });
  });

  test(`should support commonjs module`, async () => {
    expect(await compatibleRequire(path.join(fixturePath, 'cjs.js'))).toEqual({
      name: 'cjs',
    });
  });

  test(`should return null`, async () => {
    expect(await compatibleRequire(path.join(fixturePath, 'empty.js'))).toEqual(
      null,
    );
  });

  test('should invalidate rspack chunk imports in development esm mode', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    rs.stubEnv('MODERN_LIB_FORMAT', 'esm');

    const tempDir = await mkdtemp(path.join(tmpdir(), 'compat-require-'));
    const entryPath = path.join(tempDir, 'index.mjs');
    const chunkPath = path.join(tempDir, 'page.mjs');

    await writeFile(
      entryPath,
      [
        "const chunkId = 'page';",
        'const __webpack_require__ = {',
        '  u(id) {',
        '    return `${id}.mjs`;',
        '  },',
        '};',
        'const module = await import("./" + __webpack_require__.u(chunkId));',
        'export default module.default;',
      ].join('\n'),
    );
    await writeFile(chunkPath, "export default { name: 'before' };\n");

    try {
      expect(await compatibleRequire(entryPath)).toEqual({ name: 'before' });

      await writeFile(chunkPath, "export default { name: 'after' };\n");

      expect(await compatibleRequire(entryPath)).toEqual({ name: 'after' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('should create unique temp bundle paths for dev esm patching', () => {
    const firstPath = createPatchedBundlePath('/tmp/index.mjs', '123');
    const secondPath = createPatchedBundlePath('/tmp/index.mjs', '123');

    expect(firstPath).not.toBe(secondPath);
    expect(firstPath).toContain('.__modern_dev__.123.');
    expect(path.extname(firstPath)).toBe('.mjs');
  });

  // The native Node.js require behavior does not support testing in the rstest
  test.skip('should clean cache after fn', () => {
    const foo = module.require('./fixtures/compat-require/foo');
    const requirePath = require.resolve('./fixtures/compat-require/foo.js');
    expect(foo.name).toBe('foo');
    expect(require.cache[requirePath]).toBeDefined();
    cleanRequireCache([requirePath]);
    rstest.resetModules();
    expect(require.cache[requirePath]).toBeUndefined();
  });
});
