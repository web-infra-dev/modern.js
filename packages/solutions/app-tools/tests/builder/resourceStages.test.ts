import { describe, expect, it } from '@rstest/core';
import {
  normalizeResourceStages,
  parseSize,
} from '../../src/builder/shared/resourceStages/config';
import { renderPreloadTag } from '../../src/builder/shared/bundlerPlugins/ResourceStagesPlugin';
import { parseStageDeclarations } from '../../src/builder/shared/resourceStages/parse';
import {
  type ChunkInfo,
  type Snapshot,
  checkBudgets,
  planResourceStages,
} from '../../src/builder/shared/resourceStages/plan';

const known = normalizeResourceStages({
  stages: { firstReply: { after: 'interactive', timeout: 1000 } },
}).known;

describe('parseStageDeclarations', () => {
  it('finds declarations, aliases and namespaces', () => {
    const { declarations, errors } = parseStageDeclarations(
      `import { stagedImport as si } from '@modern-js/runtime/resources';
import * as resources from '@edenx/runtime/resources';
const A = lazy(si.critical(() => import('./A')));
const B = stagedImport.idle(function () { return import(\`./B\`); });
const C = resources.stagedImport.firstReply(() => (import('./C')));
si.firstReply.mark();`,
      'page.tsx',
      known,
    );
    expect(errors).toEqual([]);
    expect(declarations).toEqual([
      { stage: 'critical', request: './A', line: 3 },
      { stage: 'idle', request: './B', line: 4 },
      { stage: 'firstReply', request: './C', line: 5 },
    ]);
  });

  it('reports unknown stages and dynamic imports', () => {
    const { declarations, errors } = parseStageDeclarations(
      `stagedImport.later(() => import('./A'));
stagedImport.idle(() => import(name));
stagedImport.idle(loader);`,
      'page.ts',
      known,
    );
    expect(declarations).toEqual([]);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toContain('unknown resource stage "later"');
    expect(errors[1]).toContain('page.ts:2');
  });

  it('skips files without the API', () => {
    expect(
      parseStageDeclarations('import("./A")', 'a.js', known).declarations,
    ).toEqual([]);
  });
});

describe('normalizeResourceStages', () => {
  it('orders custom stages after their stage', () => {
    const stages = normalizeResourceStages({
      stages: {
        firstReply: { after: 'interactive', timeout: 1000 },
        afterReply: { after: 'firstReply', timeout: 1000 },
        early: { after: 'critical', timeout: 100 },
        interactive: { manual: true },
      },
    });
    expect(stages.order).toEqual([
      'early',
      'visible',
      'interactive',
      'firstReply',
      'afterReply',
      'idle',
    ]);
    expect(stages.manual).toEqual([
      'firstReply',
      'afterReply',
      'early',
      'interactive',
    ]);
    expect(stages.timeouts).toEqual({
      firstReply: 1000,
      afterReply: 1000,
      early: 100,
    });
  });

  it('rejects invalid stages', () => {
    expect(() =>
      normalizeResourceStages({ stages: { later: { timeout: 1 } } }),
    ).toThrow('need "after" and "timeout"');
    expect(() =>
      normalizeResourceStages({ stages: { critical: { manual: true } } }),
    ).toThrow('cannot be configured');
    expect(() =>
      normalizeResourceStages({
        stages: { later: { after: 'missing', timeout: 1 } },
      }),
    ).toThrow('does not name a known stage');
  });

  it('parses sizes', () => {
    expect(parseSize('600kB')).toBe(614400);
    expect(parseSize('1.5MB')).toBe(1572864);
    expect(parseSize(100)).toBe(100);
    expect(() => parseSize('big')).toThrow();
  });
});

const chunk = (id: string, size: number, css = false): ChunkInfo => ({
  id,
  js: [`/static/js/${id}.js`],
  css: css ? [`/static/css/${id}.css`] : [],
  size,
});

const createSnapshot = (): Snapshot => ({
  chunks: new Map(
    [
      chunk('main', 100_000),
      chunk('route', 10_000),
      chunk('shared1', 300_000),
      chunk('shared2', 400_000),
      chunk('editor', 50_000, true),
      chunk('plugins', 900_000),
      chunk('panel', 5_000),
    ].map(item => [item.id, item]),
  ),
  entries: new Map([
    [
      'main',
      {
        initial: new Set(['main']),
        reachable: new Set([
          'main',
          'route',
          'shared1',
          'shared2',
          'editor',
          'plugins',
          'panel',
        ]),
        serverRendered: true,
      },
    ],
  ]),
  routes: new Map([
    [
      'page',
      {
        entry: 'main',
        chunks: ['shared1', 'route', 'shared2'],
        own: new Set(['route']),
        reachable: new Set(['route', 'shared1', 'shared2', 'panel']),
      },
    ],
  ]),
  declarations: [
    {
      stage: 'interactive',
      file: 'src/App.tsx',
      line: 1,
      request: './Editor',
      chunks: ['editor'],
      depth: 1,
      declaringChunks: ['main'],
    },
    {
      stage: 'visible',
      file: 'src/Chat.tsx',
      line: 2,
      request: './Editor',
      chunks: ['editor'],
      depth: 2,
      declaringChunks: ['main'],
    },
    {
      stage: 'idle',
      file: 'src/App.tsx',
      line: 3,
      request: './plugins',
      chunks: ['plugins', 'main'],
      depth: 1,
      declaringChunks: ['main'],
    },
    {
      stage: 'critical',
      file: 'src/routes/page.tsx',
      line: 1,
      request: './Panel',
      chunks: ['panel'],
      depth: 2,
      declaringChunks: ['route'],
    },
    {
      stage: 'interaction',
      file: 'src/routes/page.tsx',
      line: 2,
      request: './Mention',
      chunks: ['panel'],
      depth: 2,
      declaringChunks: ['route'],
    },
    {
      stage: 'idle',
      file: 'src/routes/page.tsx',
      line: 3,
      request: './Inline',
      chunks: [],
      depth: 0,
      declaringChunks: ['route'],
    },
  ],
});

describe('planResourceStages', () => {
  const stages = normalizeResourceStages({
    budget: { critical: { size: '400kB', requests: 8 } },
  });

  it('assigns declarations to the entry or the route', () => {
    const plan = planResourceStages(createSnapshot(), stages, {
      routeRule: false,
    });
    const entry = plan.targets.find(target => target.kind === 'entry')!;
    const route = plan.targets.find(target => target.kind === 'route')!;

    // The earliest stage wins, and entry files are left out.
    expect(entry.lists).toEqual({ visible: ['editor'], idle: ['plugins'] });
    expect(entry.css).toEqual({ editor: ['/static/css/editor.css'] });
    expect(route.critical).toEqual([{ h: '/static/js/panel.js', a: 'script' }]);
    expect(
      plan.declarations.find(item => item.request === './Mention')?.level,
    ).toEqual(['route:page']);
    expect(plan.warnings).toEqual([
      expect.stringContaining("import('./Inline') is not split"),
    ]);
  });

  it('stages route JS by the critical budget', () => {
    const plan = planResourceStages(createSnapshot(), stages, {
      routeRule: true,
    });
    const route = plan.targets.find(target => target.kind === 'route')!;
    // The route's own chunk first, then shared chunks while they fit 400 kB,
    // all at low priority.
    expect(route.routeCritical).toEqual([
      { h: '/static/js/route.js', a: 'script', l: 1 },
      { h: '/static/js/shared1.js', a: 'script', l: 1 },
    ]);
    expect(route.routeLists).toEqual({ visible: ['shared2'] });
  });

  it('does not preload route CSS by the route rule', () => {
    const snapshot = createSnapshot();
    snapshot.chunks.set('route', chunk('route', 10_000, true));
    snapshot.chunks.set('panel', chunk('panel', 5_000, true));
    const plan = planResourceStages(snapshot, stages, { routeRule: true });
    const route = plan.targets.find(target => target.kind === 'route')!;
    // Streaming SSR already outputs the route CSS as a stylesheet.
    expect(route.routeCritical).toEqual([
      { h: '/static/js/route.js', a: 'script', l: 1 },
      { h: '/static/js/shared1.js', a: 'script', l: 1 },
    ]);
    // A `critical` declaration is not route CSS and keeps its style preload.
    expect(route.critical).toEqual([
      { h: '/static/js/panel.js', a: 'script' },
      { h: '/static/css/panel.css', a: 'style' },
    ]);
  });

  it('counts only the preloaded JS toward the request budget of route JS', () => {
    const snapshot = createSnapshot();
    snapshot.chunks.set('route', chunk('route', 10_000, true));
    const plan = planResourceStages(
      snapshot,
      normalizeResourceStages({
        budget: { critical: { size: '400kB', requests: 2 } },
      }),
      { routeRule: true },
    );
    const route = plan.targets.find(target => target.kind === 'route')!;
    // The route CSS is not preloaded, so it does not take a request slot.
    expect(route.routeCritical).toEqual([
      { h: '/static/js/route.js', a: 'script', l: 1 },
      { h: '/static/js/shared1.js', a: 'script', l: 1 },
    ]);
  });

  it('carries the integrity of the files when the build has one', () => {
    const snapshot = createSnapshot();
    snapshot.chunks.set('route', {
      ...chunk('route', 10_000),
      integrity: { '/static/js/route.js': 'sha384-route' },
    });
    snapshot.chunks.set('panel', {
      ...chunk('panel', 5_000, true),
      integrity: {
        '/static/js/panel.js': 'sha384-panel',
        '/static/css/panel.css': 'sha384-panel-css',
      },
    });
    const plan = planResourceStages(snapshot, stages, { routeRule: true });
    const route = plan.targets.find(target => target.kind === 'route')!;
    expect(route.routeCritical).toEqual([
      { h: '/static/js/route.js', a: 'script', l: 1, i: 'sha384-route' },
      { h: '/static/js/shared1.js', a: 'script', l: 1 },
    ]);
    expect(route.critical).toEqual([
      { h: '/static/js/panel.js', a: 'script', i: 'sha384-panel' },
      { h: '/static/css/panel.css', a: 'style', i: 'sha384-panel-css' },
    ]);
  });

  it('moves critical declarations over the budget to visible', () => {
    const snapshot = createSnapshot();
    snapshot.declarations.push({
      stage: 'critical',
      file: 'src/routes/page.tsx',
      line: 9,
      request: './Huge',
      chunks: ['plugins'],
      depth: 2,
      declaringChunks: ['route'],
    });
    const plan = planResourceStages(snapshot, stages, { routeRule: false });
    const route = plan.targets.find(target => target.kind === 'route')!;
    // `panel` (5 kB) fits the 400 kB budget, `plugins` (900 kB) does not.
    expect(route.critical).toEqual([{ h: '/static/js/panel.js', a: 'script' }]);
    expect(route.lists.visible).toEqual(['plugins']);
    expect(plan.warnings.join('\n')).toContain('exceed the critical budget');
  });

  it('honors per-route stages', () => {
    const plan = planResourceStages(
      createSnapshot(),
      normalizeResourceStages({ routes: { page: 'idle' } }),
      { routeRule: true },
    );
    const route = plan.targets.find(target => target.kind === 'route')!;
    expect(route.routeCritical).toEqual([]);
    // The route's own chunk first, then the shared ones in group order.
    expect(route.routeLists).toEqual({
      idle: ['route', 'shared1', 'shared2'],
    });
  });

  it('warns about budgets', () => {
    const strict = normalizeResourceStages({
      budget: {
        critical: { size: '1kB', requests: 1 },
        idle: { size: '100kB' },
      },
    });
    const plan = planResourceStages(createSnapshot(), strict, {
      routeRule: true,
    });
    const entry = plan.targets.find(target => target.kind === 'entry')!;
    const route = plan.targets.find(target => target.kind === 'route')!;
    expect(checkBudgets(entry, strict, 100_000).join('\n')).toContain(
      'stage "idle" downloads',
    );
    expect(checkBudgets(route, strict, 0).join('\n')).toContain(
      'stage "critical" downloads',
    );
  });
});

describe('renderPreloadTag', () => {
  it('follows the crossorigin rule of the chunk loading runtime', () => {
    const local = { h: '/static/js/a.js', a: 'script' as const };
    const remote = {
      h: 'https://cdn.example.com/a.js',
      a: 'script' as const,
      l: 1 as const,
    };
    expect(renderPreloadTag(local)).toBe(
      '<link rel="preload" as="script" href="/static/js/a.js">',
    );
    expect(renderPreloadTag(local, 'anonymous')).toBe(
      '<link rel="preload" as="script" href="/static/js/a.js">',
    );
    expect(renderPreloadTag(local, 'use-credentials')).toBe(
      '<link rel="preload" as="script" href="/static/js/a.js" crossorigin="use-credentials">',
    );
    expect(renderPreloadTag(remote, 'anonymous')).toBe(
      '<link rel="preload" as="script" href="https://cdn.example.com/a.js" crossorigin="anonymous" fetchpriority="low">',
    );
  });

  it('outputs integrity with crossorigin when the build has one', () => {
    const item = {
      h: '/static/css/a.css',
      a: 'style' as const,
      i: 'sha384-abc',
    };
    // With integrity the runtime sets crossorigin on same origin files too.
    expect(renderPreloadTag(item)).toBe(
      '<link rel="preload" as="style" href="/static/css/a.css" crossorigin="anonymous" integrity="sha384-abc">',
    );
    expect(renderPreloadTag(item, 'use-credentials')).toBe(
      '<link rel="preload" as="style" href="/static/css/a.css" crossorigin="use-credentials" integrity="sha384-abc">',
    );
  });
});
