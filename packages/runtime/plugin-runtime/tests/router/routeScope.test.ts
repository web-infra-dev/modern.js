import { performance } from 'node:perf_hooks';
import { analyzeRootExport } from '../../src/cli/federation/analyze';
import {
  normalizeScopePath,
  selectRouteScope,
} from '../../src/cli/federation/select';
import type { NestedRouteForCli } from '@modern-js/types';
import {
  createShouldRevalidate,
  handleRouteModule,
} from '../../src/router/runtime/routerHelper';
import { optimizeRoute } from '../../src/router/cli/code/nestedRoutes';
import {
  scopeTopology,
  assertScopeTopology,
} from '../../src/router/runtime/scope';

const tree = (): NestedRouteForCli[] => [
  {
    id: 'root',
    type: 'nested',
    origin: 'file-system',
    path: '/',
    _component: 'root-layout',
    loader: 'root-loader',
    children: [
      {
        id: 'product',
        type: 'nested',
        origin: 'file-system',
        path: 'product',
        _component: 'product-layout',
        error: 'product-error',
        children: [
          {
            id: 'list',
            type: 'nested',
            origin: 'file-system',
            index: true,
            _component: 'list',
          },
          {
            id: 'shell',
            type: 'nested',
            origin: 'file-system',
            _component: 'shell',
            children: [
              {
                id: 'detail',
                type: 'nested',
                origin: 'file-system',
                path: 'detail/:id',
                _component: 'detail',
                loader: 'detail-loader',
              },
            ],
          },
        ],
      },
      {
        id: 'orders',
        type: 'nested',
        origin: 'file-system',
        path: 'orders',
        _component: 'orders',
        loader: 'orders-loader',
      },
    ],
  },
];

describe('Modern producer route selection', () => {
  it('isolates loaded module metadata for equal route IDs in different scopes', () => {
    const first = {};
    const second = {};
    handleRouteModule({ shouldRevalidate: () => true }, 'product', first);
    handleRouteModule({ shouldRevalidate: () => false }, 'product', second);
    const args = {} as Parameters<ReturnType<typeof createShouldRevalidate>>[0];
    expect(createShouldRevalidate('product', first)(args)).toBe(true);
    expect(createShouldRevalidate('product', second)(args)).toBe(false);
  });
  it('allows runtime decoration but rejects attempts to bring sibling routes back into a scope', () => {
    const routes = [
      { id: 'root', path: '/', children: [{ id: 'product', path: 'product' }] },
    ];
    const topology = scopeTopology(routes);
    expect(() =>
      assertScopeTopology(
        routes.map(route => ({ ...route, handle: { decorated: true } })),
        topology,
      ),
    ).not.toThrow();
    routes[0].children.push({ id: 'orders', path: 'orders' });
    expect(() => assertScopeTopology(routes, topology)).toThrow(
      'Runtime route hooks',
    );
  });
  it('keeps a real transparent definition after the ordinary route optimizer folds it away', () => {
    const input = tree();
    delete input[0].children![0]._component;
    delete input[0].children![0].error;
    const optimized = optimizeRoute(input[0], true);
    const selected = selectRouteScope(optimized, '/product');
    expect(JSON.stringify(selected)).toContain('detail/:id');
    expect(JSON.stringify(selected)).toContain('list');
    expect(JSON.stringify(selected)).not.toContain('orders-loader');
  });
  it('keeps parallel index/pathless descendants inside an unambiguous range', () => {
    const input = tree();
    input[0].children![0].children!.push({
      id: 'other-shell',
      type: 'nested',
      origin: 'config',
      children: [
        {
          id: 'other-index',
          type: 'nested',
          origin: 'config',
          index: true,
          _component: 'other-page',
        },
      ],
    });
    expect(JSON.stringify(selectRouteScope(input, '/product'))).toContain(
      'other-index',
    );
  });
  it('keeps ancestors, index, pathless shells, errors and dynamic descendants without mutating the entry', () => {
    const routes = tree();
    const before = JSON.stringify(routes);
    const selected = selectRouteScope(routes, '/product/');
    expect(selected).toEqual([
      { ...routes[0], children: [routes[0].children![0]] },
    ]);
    expect(selected[0]).not.toBe(routes[0]);
    expect(JSON.stringify(routes)).toBe(before);
    expect(selectRouteScope(routes, '/')).toEqual(routes);
    expect(selectRouteScope(routes, '/orders')[0].children).toHaveLength(1);
  });
  it.each([
    '/stores/:id',
    '/stores/:id/product',
    '/stores/*',
    '/stores/[id]',
    '',
    'product',
    '/product?tab=x',
    '/product#x',
    '//product',
  ])('rejects invalid selector %s', route => {
    expect(() => normalizeScopePath(route)).toThrow();
  });
  it('selects definitions rather than matching a concrete dynamic URL or a string prefix', () => {
    expect(() => selectRouteScope(tree(), '/pro')).toThrow('does not exist');
    expect(() => selectRouteScope(tree(), '/product/detail/42')).toThrow(
      'does not exist',
    );
    expect(() => selectRouteScope(tree(), '/missing')).toThrow(
      'does not exist',
    );
  });
  it('rejects independent same-path branches but accepts layout/index chains', () => {
    const routes = tree();
    routes[0].children!.push({
      id: 'other',
      type: 'nested',
      children: [{ id: 'duplicate', type: 'nested', path: 'product' }],
    });
    expect(() => selectRouteScope(routes, '/product')).toThrow('ambiguous');
  });
});

const source = (
  argument = '',
  registry = "import '@modern-js/runtime/registry/index';",
) => `
${registry}
import { createRoot as makeRoot } from '@modern-js/runtime/react';
import { createBridgeComponent as bridge } from '@modern-js/runtime/mf';
const ProductRoot = makeRoot(${argument});
const provider = bridge({ rootComponent: ProductRoot });
export default provider;
`;

describe('Modern root expose analysis', () => {
  it('keeps SWC analysis of 100 large expose modules within its build budget', () => {
    // Each module has 600 unrelated top-level declarations, about 32 KiB.
    // Include binding resolution as well as parsing, without following imports.
    const inputs = Array.from({ length: 100 }, (_, moduleIndex) => ({
      filename: `expose-${moduleIndex}.tsx`,
      code:
        source("{ route: '/product' }") +
        Array.from(
          { length: 600 },
          (_, index) =>
            `const field${index} = {label: 'weather-${moduleIndex}', value: ${index}};`,
        ).join('\n'),
    }));
    const analyze = () =>
      inputs.map(input =>
        analyzeRootExport(input.code, input.filename, 'modern-js'),
      );
    expect(analyze().every(result => result?.route === '/product')).toBe(true);
    const times = Array.from({ length: 5 }, () => {
      const start = performance.now();
      analyze();
      return performance.now() - start;
    }).sort((a, b) => a - b);
    const median = times[2];
    // Leave headroom for shared CI runners and report the measured baseline.
    const budgetMs = 2_000;
    console.info(
      `[route-scope performance] analyzeRootExport: 100 modules, median ${median.toFixed(1)}ms, budget ${budgetMs}ms`,
    );
    expect(median).toBeLessThan(budgetMs);
  });
  it('accepts the existing Core Bridge entry and shorthand rootComponent syntax', () => {
    const input = source("{ route: '/product' }")
      .replace(
        "'@modern-js/runtime/mf'",
        "'@module-federation/bridge-react/v18'",
      )
      .replaceAll('ProductRoot', 'rootComponent')
      .replace('rootComponent: rootComponent', 'rootComponent');
    expect(analyzeRootExport(input, 'export.tsx', 'modern-js')?.route).toBe(
      '/product',
    );
  });
  it('rejects multiple independently created Roots in one module', () => {
    expect(() =>
      analyzeRootExport(
        source("{ route: '/product' }") + '\nconst other = makeRoot();',
        'export.tsx',
        'modern-js',
      ),
    ).toThrow('own expose module');
  });
  it('follows imported aliases and provider bindings', () => {
    expect(
      analyzeRootExport(
        source("{ route: '/product' }"),
        'export.tsx',
        'modern-js',
      ),
    ).toMatchObject({
      entry: 'index',
      route: '/product',
      rootImport: 'makeRoot',
    });
  });
  it('accepts whole applications and local static constants', () => {
    expect(
      analyzeRootExport(source(), 'export.tsx', 'modern-js')?.route,
    ).toBeUndefined();
    expect(
      analyzeRootExport(
        `const path = '/product'; const options = { route: path } as const; ${source('options')}`,
        'export.tsx',
        'modern-js',
      )?.route,
    ).toBe('/product');
  });
  it('does not mistake a business function or a legacy component overload for the runtime API', () => {
    expect(
      analyzeRootExport(
        source().replace("'@modern-js/runtime/react'", "'./business'"),
        'export.tsx',
        'modern-js',
      ),
    ).toBeUndefined();
    expect(
      analyzeRootExport(source('App'), 'export.tsx', 'modern-js'),
    ).toBeUndefined();
  });
  it.each([
    '{ route: getPath() }',
    "{ route: '/stores/:id' }",
    '{ includeChildren: false }',
    '{ ...options }',
  ])('rejects unsupported options %s', argument => {
    expect(() =>
      analyzeRootExport(source(argument), 'export.tsx', 'modern-js'),
    ).toThrow();
  });
  it('diagnoses missing or ambiguous registry imports', () => {
    expect(() =>
      analyzeRootExport(source('{}', ''), 'export.tsx', 'modern-js'),
    ).toThrow('exactly one');
    expect(() =>
      analyzeRootExport(
        source(
          '{}',
          "import '@modern-js/runtime/registry/index'; import '@modern-js/runtime/registry/admin';",
        ),
        'export.tsx',
        'modern-js',
      ),
    ).toThrow('exactly one');
  });
});
