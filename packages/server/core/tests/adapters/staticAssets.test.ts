import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { createStaticMiddleware } from '../../src/adapters/node/plugins/static';

it('limits the early asset bypass to real emitted directories, even with root output paths', async () => {
  const pwd = await mkdtemp(path.join(tmpdir(), 'modern-emitted-assets-'));
  try {
    for (const directory of ['static', 'custom/js', 'upload', 'bundles'])
      await mkdir(path.join(pwd, directory), { recursive: true });
    for (const [filename, content] of [
      ['static/client.js', 'client'],
      ['custom/js/chunk.js', 'chunk'],
      ['entry.cjs', 'server-root'],
      ['bundles/index.js', 'server-bundle'],
      ['static/entry.cjs', 'declared-server-entry'],
      ['upload/data.txt', 'upload'],
    ])
      await writeFile(path.join(pwd, filename), content);
    await symlink('../entry.cjs', path.join(pwd, 'static/escaped.js'));
    await symlink('../bundles/index.js', path.join(pwd, 'static/bundle.js'));
    await symlink('../..', path.join(pwd, 'static/outside'));
    const app = new Hono();
    app.use(
      '*',
      createStaticMiddleware({
        pwd,
        output: { distPath: { css: '.', js: 'custom/js', media: '..' } },
        html: {},
        server: {},
        routes: [
          {
            urlPath: '/',
            entryPath: 'index.html',
            entryName: 'main',
            bundle: 'static/entry.cjs',
            isSSR: true,
          },
        ],
        buildAssetsOnly: true,
      }),
    );
    app.get('*', c => c.text('gated', 503));
    expect(await (await app.request('/static/client.js')).text()).toBe(
      'client',
    );
    expect(await (await app.request('/custom/js/chunk.js')).text()).toBe(
      'chunk',
    );
    for (const pathname of [
      '/entry.cjs',
      '/bundles/index.js',
      '/static/entry.cjs',
      '/static/escaped.js',
      '/static/bundle.js',
      '/static/outside',
      '/static/%2e%2e%2fentry.cjs',
      '/static/missing.js',
      '/upload/data.txt',
    ]) {
      const response = await app.request(pathname);
      expect(response.status).toBe(503);
      expect(await response.text()).toBe('gated');
    }
  } finally {
    await rm(pwd, { recursive: true, force: true });
  }
});

it('protects canonical server/public files when aliases overlap emitted directories', async () => {
  const pwd = await mkdtemp(path.join(tmpdir(), 'modern-protected-assets-'));
  try {
    for (const directory of ['static/server', 'static/localized', 'upload'])
      await mkdir(path.join(pwd, directory), { recursive: true });
    for (const filename of [
      'static/server/index.js',
      'static/declared.js',
      'static/localized/private.txt',
      'upload/private.txt',
    ])
      await writeFile(path.join(pwd, filename), 'protected');
    await symlink('static/server', path.join(pwd, 'bundles'));
    await symlink('static/declared.js', path.join(pwd, 'entry-alias.cjs'));
    await symlink('static/localized', path.join(pwd, 'localized'));
    const app = new Hono();
    app.use(
      '*',
      createStaticMiddleware({
        pwd,
        output: { distPath: { js: 'upload' } },
        html: {},
        server: { publicDir: 'localized' },
        routes: [
          {
            urlPath: '/',
            entryPath: 'index.html',
            bundle: 'entry-alias.cjs',
          },
        ],
        buildAssetsOnly: true,
      }),
    );
    app.get('*', c => c.text('gated', 503));
    for (const pathname of [
      '/static/server/index.js',
      '/static/declared.js',
      '/static/localized/private.txt',
      '/upload/private.txt',
    ]) {
      const response = await app.request(pathname);
      expect(response.status).toBe(503);
      expect(await response.text()).toBe('gated');
    }
  } finally {
    await rm(pwd, { recursive: true, force: true });
  }
});
