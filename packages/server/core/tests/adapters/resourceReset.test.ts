import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { onRepack } from '../../../server/src/helpers/repack';
import { serverStaticPlugin } from '../../src/adapters/node/plugins/static';
import { injectResourcePlugin } from '../../src/adapters/node/plugins/resource';
import { createServerBase } from '../../src/serverBase';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

it('shares the existing reader across HTML, static resources and repack', async () => {
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
    server.addPlugins([injectResourcePlugin(), serverStaticPlugin()]);
    await server.init();
    server.get('/', c => c.json(c.get('templates')));

    await writeFile(path.join(pwd, 'icon.png'), 'before');
    expect(await (await server.request('/icon.png')).text()).toBe('before');
    const before = await server.request('/');
    expect(await before.json()).toEqual({
      'main-/': '<script src="vendor-before.js"></script>',
    });
    await writeFile(htmlPath, '<script src="vendor-after.js"></script>');
    await writeFile(path.join(pwd, 'icon.png'), 'after!');
    expect(server.fileReader).toBe(fileReader);
    await onRepack(pwd, server.hooks, server.fileReader);
    expect(await (await server.request('/icon.png')).text()).toBe('after!');
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
