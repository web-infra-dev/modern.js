import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { injectResourcePlugin } from '../../src/adapters/node/plugins/resource';
import { createServerBase } from '../../src/serverBase';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

it('serves rebuilt HTML after repack without another fileReader clearing its cache', async () => {
  rstest.stubEnv('NODE_ENV', 'development');
  const pwd = await mkdtemp(path.join(os.tmpdir(), 'modern-resource-reset-'));
  const htmlPath = path.join(pwd, 'index.html');
  await fileReader.reset();
  try {
    await writeFile(htmlPath, '<script src="vendor-before.js"></script>');
    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd,
      routes: [{ urlPath: '/', entryPath: 'index.html', entryName: 'main' }],
    });
    server.addPlugins([injectResourcePlugin()]);
    await server.init();
    server.get('/', c => c.json(c.get('templates')));

    const before = await server.request('/');
    expect(await before.json()).toEqual({
      'main-/': '<script src="vendor-before.js"></script>',
    });
    await writeFile(htmlPath, '<script src="vendor-after.js"></script>');
    await server.hooks.onReset.call({ event: { type: 'repack' } });
    const after = await server.request('/');
    expect(await after.json()).toEqual({
      'main-/': '<script src="vendor-after.js"></script>',
    });
  } finally {
    await fileReader.reset();
    await rm(pwd, { recursive: true, force: true });
    rstest.unstubAllEnvs();
  }
});
