/**
 * @jest-environment node
 */
import path from 'path';
import type { NestedRouteForCli } from '@modern-js/types';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { optimizeRoute, walk } from '../../src/router/cli/code/nestedRoutes';

const fixtures = path.join(__dirname, 'fixtures');

initSnapshotSerializer({ root: path.resolve(__dirname, '../..') });

describe('nested routes', () => {
  describe('optimizeRoute', () => {
    test('should flatten nested routes and update path, when dont has _component', () => {
      const route: NestedRouteForCli = {
        id: 'a',
        path: 'a',
        type: 'nested',
        origin: 'file-system',
        children: [
          {
            id: 'b',
            path: 'b',
            type: 'nested',
            origin: 'file-system',
            children: [
              {
                id: 'c',
                origin: 'file-system',
                type: 'nested',
                path: 'c',
                _component: 'componentC',
              },
              {
                // pathless layout
                id: 'e',
                origin: 'file-system',
                type: 'nested',
                _component: 'componentE',
                children: [
                  {
                    id: 'f',
                    path: 'f',
                    origin: 'file-system',
                    type: 'nested',
                    _component: 'componentF',
                  },
                ],
              },
            ],
          },
          {
            id: 'd',
            path: 'd',
            type: 'nested',
            origin: 'file-system',
            _component: 'componentD',
          },
          {
            id: 'g',
            path: 'g',
            type: 'nested',
            origin: 'file-system',
            children: [
              {
                id: 'i',
                path: 'h/i',
                type: 'nested',
                origin: 'file-system',
                _component: 'componentH',
              },
              {
                id: 'j',
                path: '*',
                type: 'nested',
                origin: 'file-system',
                _component: 'componentJ',
              },
            ],
          },
        ],
      };

      const optimizedRoutes = optimizeRoute(route);
      expect(optimizedRoutes).toEqual([
        {
          id: 'c',
          path: 'a/b/c',
          type: 'nested',
          _component: 'componentC',
          component: undefined,
          origin: 'file-system',
        },
        {
          id: 'e',
          path: 'a/b',
          type: 'nested',
          _component: 'componentE',
          component: undefined,
          origin: 'file-system',
          children: [
            {
              id: 'f',
              path: 'f',
              type: 'nested',
              origin: 'file-system',
              _component: 'componentF',
            },
          ],
        },
        {
          id: 'd',
          path: 'a/d',
          type: 'nested',
          _component: 'componentD',
          component: undefined,
          origin: 'file-system',
        },
        {
          id: 'i',
          path: 'a/g/h/i',
          type: 'nested',
          _component: 'componentH',
          component: undefined,
          origin: 'file-system',
        },
        {
          id: 'j',
          path: 'a/g/*',
          type: 'nested',
          _component: 'componentJ',
          component: undefined,
          origin: 'file-system',
        },
      ]);
    });
    /**
     * - routes
     *  - a
     *    - __b
     *      - c
     *        - page.tsx
     *      - layout.tsx
     */
    test('pathless layout should be hoist', () => {
      const route: NestedRouteForCli = {
        id: 'a',
        type: 'nested',
        origin: 'file-system',
        path: 'a',
        children: [
          // pathless layout
          {
            id: 'b',
            type: 'nested',
            origin: 'file-system',
            _component: 'layoutB',
            children: [
              {
                id: 'c',
                type: 'nested',
                origin: 'file-system',
                path: 'c',
                children: [
                  {
                    id: 'd',
                    origin: 'file-system',
                    type: 'nested',
                    _component: 'pageD',
                    index: true,
                  },
                ],
              },
            ],
          },
        ],
      };

      const optimizedRoutes = optimizeRoute(route);

      expect(optimizedRoutes).toEqual([
        {
          id: 'b',
          path: 'a',
          type: 'nested',
          _component: 'layoutB',
          component: undefined,
          origin: 'file-system',
          children: [
            {
              id: 'd',
              path: 'c',
              _component: 'pageD',
              type: 'nested',
              component: undefined,
              origin: 'file-system',
            },
          ],
        },
      ]);
    });
  });

  test('walk', async () => {
    const routesDir = path.join(fixtures, './nested-routes');
    const route = await walk({
      dirname: routesDir,
      rootDir: routesDir,
      alias: {
        name: '@_modern_js_src',
        basename: routesDir,
      },
      entryName: 'main',
      isMainEntry: true,
      useClientLoader: false,
    });
    expect(route).toMatchSnapshot();
  });

  test('walk with useClientLoader', async () => {
    const routesDir = path.join(fixtures, './nested-routes');
    const route = await walk({
      dirname: routesDir,
      rootDir: routesDir,
      alias: {
        name: '@_modern_js_src',
        basename: routesDir,
      },
      entryName: 'main',
      isMainEntry: true,
      useClientLoader: true,
    });
    expect(route).toMatchSnapshot();
  });
});
