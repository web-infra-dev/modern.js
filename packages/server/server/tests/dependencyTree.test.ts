import { DependencyTree } from '../src/dev-tools/watcher/dependencyTree';

const createModule = (filename: string): NodeModule =>
  ({ filename, parent: null, children: [] }) as unknown as NodeModule;

describe('DependencyTree', () => {
  it.each([
    '/app/coverage/index.js',
    '/app/node_modules/dependency/index.js',
    '/app/.cache/index.js',
    '/app/src/index.d.ts',
    '/app/src/debug.log',
    '/app/.cache/node_modules/dependency/index.js',
  ])('ignores %s', filename => {
    const tree = new DependencyTree();

    tree.update({ [filename]: createModule(filename) });

    expect(tree.getNode(filename)).toBeUndefined();
  });

  it('preserves relationships between watched modules and excludes ignored modules', () => {
    const tree = new DependencyTree();
    const parent = createModule('/app/src/index.js');
    const child = createModule('/app/src/child.js');
    const ignored = createModule('/app/node_modules/dependency/index.js');
    parent.children = [child, ignored];
    child.parent = parent;
    ignored.parent = parent;

    tree.update({
      [parent.filename]: parent,
      [child.filename]: child,
      [ignored.filename]: ignored,
    });

    const parentNode = tree.getNode(parent.filename);
    const childNode = tree.getNode(child.filename);
    expect(parentNode).toBeDefined();
    expect(childNode).toBeDefined();
    expect(parentNode?.children).toEqual(new Set([childNode]));
    expect(childNode?.parent).toEqual(new Set([parentNode]));
    expect(tree.getNode(ignored.filename)).toBeUndefined();
  });

  it('clears stale modules when updating the cache', () => {
    const tree = new DependencyTree();
    const module = createModule('/app/src/index.js');

    tree.update({ [module.filename]: module });
    expect(tree.getNode(module.filename)).toBeDefined();

    tree.update({});
    expect(tree.getNode(module.filename)).toBeUndefined();
  });
});
