import os from 'node:os';
import path from 'node:path';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { writeHtmlFile } from '../src/libs/output';
import { replaceRoute } from '../src/libs/replace';
import type { SsgRoute } from '../src/types';

let baseDir: string;
beforeEach(() => {
  baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-ssg-output-'));
});
afterEach(() => fs.removeSync(baseDir));

it('writes only successful pages and registers only those SSG routes', () => {
  const routes: SsgRoute[] = ['hello', 'scheduled', 'empty'].map(slug => ({
    entryName: 'main',
    urlPath: `/blog/${slug}`,
    entryPath: 'html/index.html',
    output: `html/blog/${slug}/index.html`,
  }));
  const rendered = writeHtmlFile(['Hello', undefined, ''], routes, baseDir);
  expect(fs.readFileSync(path.join(baseDir, routes[0].output), 'utf8')).toBe(
    'Hello',
  );
  expect(fs.existsSync(path.join(baseDir, routes[1].output))).toBe(false);
  expect(fs.readFileSync(path.join(baseDir, routes[2].output), 'utf8')).toBe(
    '',
  );
  expect(replaceRoute(rendered, []).map(route => route.urlPath)).toEqual([
    '/blog/hello',
    '/blog/empty',
  ]);
});

it('preserves shared entry templates before overwriting them with SSG output', () => {
  const pageRoutes: ServerRoute[] = ['/', '/app'].map(urlPath => ({
    urlPath,
    entryName: 'main',
    entryPath: 'html/index.html',
    isSPA: true,
  }));
  fs.outputFileSync(path.join(baseDir, 'html/index.html'), 'CSR shell');
  const routes = [{ ...pageRoutes[0], output: 'html/index.html' }];
  const rendered = writeHtmlFile(['SSG home'], routes, baseDir, pageRoutes);
  expect(fs.readFileSync(path.join(baseDir, 'html/index.html'), 'utf8')).toBe(
    'SSG home',
  );
  for (const route of pageRoutes) {
    expect(route.entryPath).not.toBe('html/index.html');
    expect(fs.readFileSync(path.join(baseDir, route.entryPath), 'utf8')).toBe(
      'CSR shell',
    );
  }
  const allRoutes = replaceRoute(rendered, pageRoutes);
  expect(allRoutes).toHaveLength(3);
  expect(allRoutes[2]).toMatchObject({
    urlPath: '/',
    entryPath: 'html/index.html',
    isSSG: true,
  });
});

it('leaves an unsuccessful entry prerender on its original fallback template', () => {
  const pageRoutes = [
    { urlPath: '/', entryName: 'main', entryPath: 'index.html' },
  ];
  fs.outputFileSync(path.join(baseDir, 'index.html'), 'CSR shell');
  const rendered = writeHtmlFile(
    [undefined],
    [{ ...pageRoutes[0], output: 'index.html' }],
    baseDir,
    pageRoutes,
  );
  expect(rendered).toEqual([]);
  expect(pageRoutes[0].entryPath).toBe('index.html');
  expect(fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8')).toBe(
    'CSR shell',
  );
});
