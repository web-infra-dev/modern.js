import { describe, it, expect } from '@rstest/core';
import {
  createUiManifest,
  findMfManifest,
  viewEntryName,
} from '../src/cli/build';
import {
  parseRemote,
  validateUiManifest,
  validateViewsConfig,
} from '../src/manifest';

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
      ui: {
        prefersBorder: false,
        csp: {
          resourceDomains: ['https://cdn.example'],
          connectDomains: ['https://cdn.example'],
        },
      },
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

describe('deployed MF remotes', () => {
  const remote = '@demo/ui@https://ui.example/vmok-manifest.json';
  it('emits remote views without this application MF output', () => {
    const manifest = createUiManifest(
      {
        remote,
        views: {
          todos: { expose: './Todos' },
          summary: { expose: './Summary' },
        },
      },
      '',
    );
    expect(manifest.remotes).toEqual({
      '@demo/ui': {
        entry: 'https://ui.example/vmok-manifest.json',
        shell: './ui/mcp-shell.html',
      },
    });
    expect(manifest.views.todos).toEqual({
      remote: '@demo/ui',
      expose: './Todos',
      ui: { prefersBorder: true },
    });
    expect(manifest.views.summary).toMatchObject({ remote: '@demo/ui' });
    expect(() => validateUiManifest(manifest)).not.toThrow();
  });
  it('allows view overrides and keeps local components with a default remote', () => {
    const manifest = createUiManifest(
      {
        remote,
        views: {
          local: './Local.tsx',
          todos: { expose: './Todos' },
          other: {
            remote: 'other@https://other.example/m.json',
            expose: './Other',
          },
        },
      },
      '',
    );
    expect(manifest.views.local).toHaveProperty('html');
    expect(manifest.views.todos).toMatchObject({ remote: '@demo/ui' });
    expect(manifest.views.other).toMatchObject({ remote: 'other' });
    for (const view of Object.values(manifest.views))
      expect(view.ui).toEqual({ prefersBorder: true });
    expect(() => validateUiManifest(manifest)).not.toThrow();
  });
  it.each([
    1,
    null,
    '',
    'ui@/m.json',
    'ui@https://user:pass@ui.example/m.json',
  ])('rejects invalid default remote %s', remote => {
    expect(() => validateViewsConfig({ remote, views: {} })).toThrow();
  });
  it('mixes deployed remotes with local cards and local exposes', () => {
    const manifest = createUiManifest(
      {
        views: {
          local: './Local.tsx',
          stats: { expose: './Stats' },
          todos: { remote, expose: './Todos' },
        },
      },
      '/',
      {
        filename: 'mf-manifest.json',
        manifest: { name: 'mcp_server', exposes: [{ name: './Stats' }] },
      },
    );
    expect(Object.keys(manifest.remotes).sort()).toEqual([
      '@demo/ui',
      'mcp_server',
    ]);
    expect(manifest.remotes.mcp_server.entry).toBe('mf-manifest.json');
    expect(() => validateUiManifest(manifest)).not.toThrow();
  });
  it('rejects one remote name with different entries', () => {
    expect(() =>
      createUiManifest(
        {
          views: {
            a: { remote, expose: './A' },
            b: {
              remote: '@demo/ui@https://other.example/m.json',
              expose: './B',
            },
          },
        },
        '',
      ),
    ).toThrow('MF remote @demo/ui has conflicting entries');
    expect(() =>
      createUiManifest(
        {
          views: {
            a: { expose: './A' },
            b: { remote: 'ui@https://ui.example/m.json', expose: './B' },
          },
        },
        '',
        {
          filename: 'mf-manifest.json',
          manifest: { name: 'ui', exposes: [{ name: './A' }] },
        },
      ),
    ).toThrow('MF remote ui has conflicting entries');
  });
  it('parses scoped and plain remote names', () => {
    expect(parseRemote(remote)).toEqual({
      name: '@demo/ui',
      entry: 'https://ui.example/vmok-manifest.json',
    });
    expect(parseRemote('ui@http://localhost:8080/mf-manifest.json')).toEqual({
      name: 'ui',
      entry: 'http://localhost:8080/mf-manifest.json',
    });
  });
  it.each([
    'https://ui.example/m.json',
    '@https://ui.example/m.json',
    'ui@/m.json',
    'ui@//ui.example/m.json',
    'ui@ftp://ui.example/m.json',
    'ui@https://user:pass@ui.example/m.json',
  ])('rejects the remote %s', value => {
    expect(() =>
      validateViewsConfig({ views: { a: { remote: value, expose: './A' } } }),
    ).toThrow();
  });
  it('rejects remote views with invalid fields', () => {
    for (const view of [
      { remote: 1, expose: './A' },
      { remote, expose: 'A' },
      { remote },
      { remote, expose: './A', entry: 'https://ui.example/m.json' },
    ])
      expect(() => validateViewsConfig({ views: { a: view } })).toThrow(
        'Invalid view',
      );
  });
});

describe('createUiManifest CSP', () => {
  const views = { views: { local: './Local.tsx' } };
  it('adds the origin of a protocol-relative asset prefix and keeps assetBase request-relative', () => {
    const manifest = createUiManifest(views, '//cdn.example/app/');
    expect(manifest.assetBase).toBe('request');
    expect(manifest.views.local.ui.csp).toEqual({
      resourceDomains: ['https://cdn.example'],
      connectDomains: ['https://cdn.example'],
    });
  });
  it('adds the origin of an absolute asset prefix', () => {
    const manifest = createUiManifest(views, 'http://cdn.example/app/');
    expect(manifest.assetBase).toBe('http://cdn.example/app/');
    expect(manifest.views.local.ui.csp?.resourceDomains).toEqual([
      'http://cdn.example',
    ]);
  });
  it('adds no asset origin for a path prefix', () => {
    expect(createUiManifest(views, '/').views.local.ui.csp).toBeUndefined();
  });
  it('merges the csp option with the views file and asset origin without duplicates', () => {
    const manifest = createUiManifest(
      {
        ...views,
        csp: {
          resourceDomains: ['https://img.example'],
          frameDomains: ['https://frame.example'],
        },
      },
      '//cdn.example/',
      undefined,
      {
        resourceDomains: ['https://img.example', 'https://shell.example'],
        connectDomains: ['https://api.example'],
      },
    );
    expect(manifest.views.local.ui.csp).toEqual({
      resourceDomains: [
        'https://img.example',
        'https://shell.example',
        'https://cdn.example',
      ],
      frameDomains: ['https://frame.example'],
      connectDomains: ['https://api.example', 'https://cdn.example'],
    });
  });
  it('rejects an invalid csp option', () => {
    expect(() =>
      createUiManifest(views, '/', undefined, {
        scriptDomains: ['https://x.example'],
      } as never),
    ).toThrow('Invalid CSP field: scriptDomains');
  });
});

describe('findMfManifest', () => {
  const asset = (
    name: string,
    value: unknown = { name: 'ui', exposes: [] },
  ) => ({
    name,
    source: { source: () => JSON.stringify(value) },
  });
  const stats = { name: 'ui', exposes: [], metaData: { remoteEntry: {} } };
  it('selects the default manifest and ignores stats files of the same shape', () => {
    expect(
      findMfManifest(
        [
          asset('static/mf-stats.json', stats),
          asset('static/mf-manifest.json'),
          asset('static/other.json', stats),
        ],
        'mf-manifest.json',
      ),
    ).toEqual({
      filename: 'static/mf-manifest.json',
      manifest: { name: 'ui', exposes: [] },
    });
  });
  it('selects a custom manifest filename next to its stats file', () => {
    expect(
      findMfManifest(
        [
          asset('vmok-manifest-stats.json', stats),
          asset('vmok-manifest.json'),
          asset('mf-manifest.json'),
        ],
        'vmok-manifest.json',
      ).filename,
    ).toBe('vmok-manifest.json');
  });
  it('rejects a missing or ambiguous manifest and points to mf.manifestFile', () => {
    expect(() =>
      findMfManifest([asset('vmok-manifest.json')], 'mf-manifest.json'),
    ).toThrow(
      'Expected one MF manifest named mf-manifest.json in the web compilation, found 0. Set mf.manifestFile',
    );
    expect(() =>
      findMfManifest(
        [asset('a/mf-manifest.json'), asset('b/mf-manifest.json')],
        'mf-manifest.json',
      ),
    ).toThrow('found 2: a/mf-manifest.json, b/mf-manifest.json');
  });
  it('rejects a matched file that is not an MF manifest', () => {
    expect(() =>
      findMfManifest(
        [asset('mf-manifest.json', { name: 'ui' })],
        'mf-manifest.json',
      ),
    ).toThrow('Invalid MF manifest: mf-manifest.json');
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
