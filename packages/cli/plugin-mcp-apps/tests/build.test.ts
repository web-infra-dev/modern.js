import { describe, it, expect } from '@rstest/core';
import { createUiManifest } from '../src/build';
import {
  validateUiManifest,
  validateViewsConfig,
} from '@modern-js/mcp-apps/manifest';

describe('UI build contract', () => {
  it('emits local and MF cards without tools or server definitions', () => {
    const manifest = createUiManifest(
      {
        views: { todos: './Todos.tsx', stats: { expose: './Stats' } },
        prefersBorder: false,
      },
      'https://cdn.example/app',
      {
        filename: 'static/mf-manifest.json',
        manifest: { name: 'todo_ui', exposes: [{ name: 'Stats' }] },
      },
    );
    expect(manifest.assetBase).toBe('https://cdn.example/app/');
    expect(manifest.remotes.todo_ui).toEqual({
      entry: 'static/mf-manifest.json',
      shell: './ui/mcp-shell.html',
    });
    expect(manifest.views.stats).toEqual({
      remote: 'todo_ui',
      expose: './Stats',
      ui: { prefersBorder: false },
    });
    expect(manifest.views.todos).toMatchObject({
      html: expect.stringMatching(/^\.\/ui\/mcp-ui-.*\.html$/),
    });
    expect(() => validateUiManifest(manifest)).not.toThrow();
  });
  it('emits an MF-only manifest and keeps public path prefixes', () => {
    const manifest = createUiManifest(
      { views: { stats: { expose: './Stats' } } },
      '/app/',
      {
        filename: 'static/mf-manifest.json',
        manifest: { name: 'ui', exposes: [{ name: './Stats' }] },
      },
    );
    expect(manifest.assetBase).toBe('request');
    expect(manifest.remotes.ui.entry).toBe('app/static/mf-manifest.json');
  });
  it('fails on absent MF output and missing exposes', () => {
    const config = { views: { stats: { expose: './Stats' } } };
    expect(() => createUiManifest(config, '')).toThrow(
      'requires a Module Federation manifest',
    );
    expect(() =>
      createUiManifest(config, '', {
        filename: 'mf-manifest.json',
        manifest: { name: 'ui', exposes: [] },
      }),
    ).toThrow('missing MF expose');
  });
  it('rejects the old combined tool configuration and ambiguous views', () => {
    expect(() => validateViewsConfig({ views: {}, tools: [] })).toThrow(
      'Unknown MCP views option',
    );
    expect(() =>
      validateViewsConfig({ views: { a: { expose: './A', html: 'a.html' } } }),
    ).toThrow('Invalid view');
  });
});
