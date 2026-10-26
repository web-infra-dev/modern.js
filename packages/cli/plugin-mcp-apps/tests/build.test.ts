import { describe, it, expect } from '@rstest/core';
import { createUiManifest, viewEntryName } from '../src/build';
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
      html: `./ui/${viewEntryName('todos')}.html`,
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

describe('view entry names', () => {
  it('includes a readable label and stable name hash', () => {
    expect(viewEntryName('local')).toBe('mcp-ui-local-25bf8e1a2393');
    expect(viewEntryName('Order / Detail')).toMatch(
      /^mcp-ui-order-detail-[a-f0-9]{12}$/,
    );
    expect(viewEntryName('Order / Detail')).not.toBe(
      viewEntryName('order-detail'),
    );
  });
  it('keeps filenames safe and bounded for arbitrary view names', () => {
    expect(viewEntryName('../../订单 ?')).toMatch(/^mcp-ui-view-[a-f0-9]{12}$/);
    expect(viewEntryName('A'.repeat(200))).toMatch(
      /^mcp-ui-a{48}-[a-f0-9]{12}$/,
    );
    expect(viewEntryName('A'.repeat(200))).not.toBe(
      viewEntryName('A'.repeat(201)),
    );
  });
});
