import { describe, expect, it } from '@rstest/core';
import { lintExportsField } from '../src/rules/lintExportsField';
import { lintWorkspaceProtocol } from '../src/rules/lintWorkspaceProtocol';
import { noCyclicWorkspaceDependencies } from '../src/rules/noCyclicWorkspaceDependencies';
import type { PackageJSON } from '../src';

function manifest(content: PackageJSON['content']): PackageJSON {
  return { path: `/repository/packages/${content.name}/package.json`, content };
}

describe('existing manifest policies', () => {
  it('accepts identical development and published export keys', () => {
    expect(
      lintExportsField([
        manifest({
          name: 'tool',
          exports: { '.': './src/index.ts' },
          publishConfig: { exports: { '.': './dist/index.js' } },
        }),
      ]),
    ).toBe(false);
  });
  it('rejects a missing published export key', () => {
    expect(
      lintExportsField([
        manifest({
          name: 'tool',
          exports: { '.': './src/index.ts', './subpath': './src/subpath.ts' },
          publishConfig: { exports: { '.': './dist/index.js' } },
        }),
      ]),
    ).toBe(true);
  });
  it('accepts the current development workspace wildcard policy', () => {
    expect(
      lintWorkspaceProtocol([
        manifest({ name: 'tool', devDependencies: { other: 'workspace:*' } }),
      ]),
    ).toBe(false);
  });
  it('rejects a versioned development workspace range', () => {
    expect(
      lintWorkspaceProtocol([
        manifest({
          name: 'tool',
          devDependencies: { other: 'workspace:^1.0.0' },
        }),
      ]),
    ).toBe(true);
  });
  it('detects cycles across the complete graph, including development edges', () => {
    expect(
      noCyclicWorkspaceDependencies([
        manifest({ name: 'a', dependencies: { b: 'workspace:*' } }),
        manifest({ name: 'b', devDependencies: { a: 'workspace:*' } }),
      ]),
    ).toBe(true);
  });
  it('accepts a directed dependency graph without cycles', () => {
    expect(
      noCyclicWorkspaceDependencies([
        manifest({ name: 'a', dependencies: { b: 'workspace:*' } }),
        manifest({ name: 'b' }),
      ]),
    ).toBe(false);
  });
});
