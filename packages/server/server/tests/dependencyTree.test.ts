import { spawnSync } from 'node:child_process';
import { Module } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DependencyTree } from '../src/dev-tools/watcher/dependencyTree';

const createModule = (filename: string) => {
  const module = new Module(filename);
  module.filename = filename;
  return module;
};

describe('DependencyTree', () => {
  it('loads with native ESM without CommonJS interop', () => {
    const url = pathToFileURL(
      path.join(__dirname, '../src/dev-tools/watcher/dependencyTree.ts'),
    );
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        `await import(${JSON.stringify(url.href)})`,
      ],
      { encoding: 'utf8' },
    );

    expect(result.stderr).not.toContain('SyntaxError');
    expect(result.status).toBe(0);
  });

  it('ignores generated files, dependencies and hidden directories', () => {
    const filenames = [
      '/app/src/index.ts',
      '/app/src/page.test.ts',
      '/app/coverage/index.js',
      '/app/node_modules/package/index.js',
      '/app/.modern-js/index.js',
      '/app/src/.cache/index.js',
      '/app/src/index.d.ts',
      '/app/server.log',
    ];
    const tree = new DependencyTree();
    tree.update(
      Object.fromEntries(
        filenames.map(filename => [filename, createModule(filename)]),
      ),
    );

    for (const filename of filenames.slice(0, 2)) {
      expect(tree.getNode(filename)?.module.filename).toBe(filename);
    }
    for (const filename of filenames.slice(2)) {
      expect(tree.getNode(filename)).toBeUndefined();
    }
  });

  it('tracks parent relationships without retaining ignored children', () => {
    const parent = createModule('/app/server.js');
    const child = createModule('/app/service.js');
    const ignored = createModule('/app/node_modules/package/index.js');
    parent.children = [child, ignored];
    child.parent = parent;
    ignored.parent = parent;

    const tree = new DependencyTree();
    tree.update({
      [parent.filename]: parent,
      [child.filename]: child,
      [ignored.filename]: ignored,
    });

    const parentNode = tree.getNode(parent.filename)!;
    const childNode = tree.getNode(child.filename)!;
    expect(parentNode.children).toEqual(new Set([childNode]));
    expect(childNode.parent).toEqual(new Set([parentNode]));
    expect(tree.getNode(ignored.filename)).toBeUndefined();

    tree.update({});
    expect(tree.getNode(parent.filename)).toBeUndefined();
    expect(tree.getNode(child.filename)).toBeUndefined();
  });
});
