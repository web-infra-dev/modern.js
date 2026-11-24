import path from 'path';
import { describe, expect, it } from '@rstest/core';
import { renderPreloadTag } from '../../src/builder/shared/bundlerPlugins/ResourceStagesPlugin';
import loader from '../../src/builder/shared/loaders/resourceStagesElementKeyLoader';
import { getElementDeclarationKey } from '../../src/builder/shared/resourceStages/elementKey';
import { parseStageDeclarations } from '../../src/builder/shared/resourceStages/parse';
import {
  type Snapshot,
  planResourceStages,
} from '../../src/builder/shared/resourceStages/plan';
import { normalizeResourceStages } from '../../src/builder/shared/resourceStages/config';

const appDirectory = '/app';

const runLoader = (source: string, file = 'src/Panel.tsx') =>
  (loader as unknown as (this: unknown, source: string) => string).call(
    {
      resourcePath: path.join(appDirectory, file),
      getOptions: () => ({ appDirectory }),
    },
    source,
  );

describe('element stage declaration keys', () => {
  it('adds the key of the declaration line to element stages only', () => {
    const source = [
      "import { stagedImport } from '@modern-js/runtime/resources';",
      // Multi-byte text before the call, to check byte offsets.
      "const label = '提及';",
      "export const Mention = stagedImport.interaction(() => import('./Mention'));",
      "export const Editor = stagedImport.idle(() => import('./Editor'));",
      'export const Chart = stagedImport.viewport(',
      "  () => import('./Chart'),",
      ');',
    ].join('\n');
    const output = runLoader(source);
    const mention = getElementDeclarationKey('src/Panel.tsx', 3);
    const chart = getElementDeclarationKey('src/Panel.tsx', 5);
    expect(output).toContain(
      `stagedImport.interaction(() => import('./Mention'), "${mention}")`,
    );
    expect(output).toContain("stagedImport.idle(() => import('./Editor'))");
    expect(output).toContain(`() => import('./Chart'), "${chart}",`);
    // Lines are unchanged, so the build maps the same key.
    expect(output.split('\n').length).toBe(source.split('\n').length);
  });

  it('leaves files without declarations untouched', () => {
    const source = "export const a = () => import('./a');";
    expect(runLoader(source)).toBe(source);
  });

  it('finds the end of the first argument with a type assertion', () => {
    const source =
      "stagedImport.viewport((() => import('./A')) as () => Promise<unknown>);";
    const { declarations } = parseStageDeclarations(
      source,
      'a.ts',
      new Set(['viewport']),
    );
    expect(source.slice(0, declarations[0].argumentEnd)).toBe(
      "stagedImport.viewport((() => import('./A')) as () => Promise<unknown>",
    );
  });
});

describe('route JS without CSS', () => {
  it('does not carry CSS of route JS that overflows the critical budget', () => {
    const snapshot: Snapshot = {
      chunks: new Map([
        ['entry', { id: 'entry', js: ['/e.js'], css: [], size: 10 }],
        [
          'page',
          {
            id: 'page',
            js: ['/page.js'],
            css: ['/page.css'],
            cssFiles: ['page.css'],
            size: 900_000,
          },
        ],
      ]),
      entries: new Map([
        [
          'main',
          {
            initial: new Set(['entry']),
            reachable: new Set(['entry', 'page']),
            serverRendered: true,
            streaming: true,
          },
        ],
      ]),
      routes: new Map([
        [
          'page',
          {
            entry: 'main',
            chunks: ['page'],
            own: new Set(['page']),
            reachable: new Set(['page']),
          },
        ],
      ]),
      declarations: [],
    };
    const plan = planResourceStages(
      snapshot,
      normalizeResourceStages({ routes: true }),
      { routeRule: true, noPreload: false },
    );
    const route = plan.targets.find(target => target.name === 'page')!;
    expect(route.ownCritical[0]).toMatchObject({ id: 'page' });
    expect(route.ownCritical[0].css).toBeUndefined();
  });
});

describe('entry preload tags', () => {
  it('escape attributes and carry the nonce', () => {
    expect(
      renderPreloadTag(
        { h: '/a.js?x="1"&y', a: 'script', i: 'sha384-abc' },
        'anonymous',
        'n"1',
      ),
    ).toBe(
      '<link rel="preload" as="script" href="/a.js?x=&quot;1&quot;&amp;y" crossorigin="anonymous" integrity="sha384-abc" nonce="n&quot;1">',
    );
  });
});
