import { it, expect } from '@rstest/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { collectComponentRoutes, writeRouteView } from '../src/cli/routes';
import { prepareStdio } from '../src/cli/stdio';

const root = path.resolve(__dirname, '..');
it('selects existing pages and their ancestor layouts, preserving dynamic segments and excluding private pages', async () => {
  const directory = await fs.mkdtemp(path.join(root, '.test-routes-'));
  try {
    for (const name of ['projects/[id]', 'private'])
      await fs.mkdir(path.join(directory, name), { recursive: true });
    for (const filename of [
      'layout.tsx',
      'projects/layout.tsx',
      'projects/[id]/page.tsx',
      'private/page.tsx',
    ])
      await fs.writeFile(
        path.join(directory, filename),
        'export default function Page() { return null; }',
      );
    const routes = await collectComponentRoutes(directory, ['/projects']);
    expect(routes.paths).toEqual(['/projects/:id']);
    expect(routes.modules.map(file => path.relative(directory, file))).toEqual(
      expect.arrayContaining([
        'layout.tsx',
        'projects/layout.tsx',
        'projects/[id]/page.tsx',
      ]),
    );
    expect(routes.modules.some(file => file.includes('private'))).toBe(false);
    await fs.writeFile(
      path.join(directory, 'projects/[id]/page.loader.ts'),
      'throw new Error("must not execute");',
    );
    await expect(
      collectComponentRoutes(directory, ['/projects']),
    ).rejects.toThrow('do not support');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
it('builds a route view through the stdio pipeline with its existing page and layout modules', async () => {
  const directory = await fs.mkdtemp(path.join(root, '.test-route-build-'));
  try {
    await fs.mkdir(path.join(directory, 'routes'));
    await fs.writeFile(
      path.join(directory, 'routes/page.tsx'),
      'export default function Page(){ return <p>Shared route fixture</p>; }',
    );
    await fs.writeFile(
      path.join(directory, 'views.json'),
      JSON.stringify({ views: { app: { routes: './routes', home: '/' } } }),
    );
    await prepareStdio({
      root: directory,
      views: { views: { app: { routes: './routes', home: '/' } } },
      stdio: {
        server: '../tests/fixtures/stdio-server.ts',
        output: 'prepared',
      },
    });
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(directory, 'prepared/ui-manifest.json'),
        'utf8',
      ),
    );
    const html = await fs.readFile(
      path.resolve(directory, 'prepared', manifest.views.app.html),
      'utf8',
    );
    expect(html).toContain('Shared route fixture');
    expect(html).not.toMatch(/\bReact\.createElement\b/);
    await expect(
      writeRouteView({
        root: directory,
        configDirectory: directory,
        view: { routes: './routes', home: '/missing' },
        filename: path.join(directory, 'entry.jsx'),
      }),
    ).rejects.toThrow('home does not match');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}, 60_000);
it('rejects unsupported route data exports without importing or executing the module', async () => {
  const directory = await fs.mkdtemp(path.join(root, '.test-route-loader-'));
  try {
    await fs.writeFile(
      path.join(directory, 'page.tsx'),
      'export const loader = () => {}; throw new Error("must not execute"); export default () => null;',
    );
    await expect(collectComponentRoutes(directory)).rejects.toThrow(
      'route data exports',
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
