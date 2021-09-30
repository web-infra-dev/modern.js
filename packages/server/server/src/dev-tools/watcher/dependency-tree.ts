import minimatch from 'minimatch';

export const defaultIgnores = [
  '**/bower_components/**',
  '**/coverage/**',
  '**/node_modules/**',
  '**/.*/**',
  '**/*.d.ts',
  '**/*.log',
];

export interface DependencyTreeOptions {
  root: string;
  ignore?: string[];
}

export interface TreeNode {
  module: NodeModule;
  parent: Set<TreeNode>;
  children: Set<TreeNode>;
}

/**
 * `require.cache` already is a dependency tree, however require cache's
 * `module.parent` is the module that first required. so we have to implement
 *  a new tree which revisit the cache tree to find all parent node
 */
export class DependencyTree {
  private readonly tree: Map<string, TreeNode>;

  private readonly ignore: string[];

  constructor() {
    this.tree = new Map<string, TreeNode>();
    this.ignore = [...defaultIgnores];
  }

  public getNode(path: string) {
    return this.tree.get(path);
  }

  /**
   * update dependency tree
   *
   * @param cache
   */
  public update(cache: any) {
    this.tree.clear();

    // insert all module that not ignored
    Object.keys(cache).forEach(path => {
      if (!this.shouldIgnore(path)) {
        const module = cache[path];
        this.tree.set(module.filename, {
          module,
          parent: new Set<TreeNode>(),
          children: new Set<TreeNode>(),
        });
      }
    });

    // update treeNode parent and children
    for (const treeNode of this.tree.values()) {
      const { parent } = treeNode.module;
      const { children } = treeNode.module;

      if (parent && !this.shouldIgnore(parent.filename)) {
        const parentTreeNode = this.tree.get(parent.filename)!;
        if (parentTreeNode) {
          treeNode.parent.add(parentTreeNode);
        }
      }

      children.forEach(child => {
        if (!this.shouldIgnore(child.filename)) {
          const childTreeNode = this.tree.get(child.filename)!;
          if (childTreeNode) {
            treeNode.children.add(childTreeNode);
            childTreeNode.parent.add(treeNode);
          }
        }
      });
    }
  }

  private shouldIgnore(path: string): boolean {
    return (
      !path ||
      Boolean(
        this.ignore.find(rule => minimatch.match([path], rule).length > 0),
      )
    );
  }
}
