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
        children: [
          {
            id: 'b',
            path: 'b',
            type: 'nested',
            children: [
              {
                id: 'c',
                type: 'nested',
                path: 'c',
                _component: 'componentC',
              },
              {
                // pathless layout
                id: 'e',
                type: 'nested',
                _component: 'componentE',
                children: [
                  {
                    id: 'f',
                    path: 'f',
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
            _component: 'componentD',
          },
          {
            id: 'g',
            path: 'g',
            type: 'nested',
            children: [
              {
                id: 'i',
                path: 'h/i',
                type: 'nested',
                _component: 'componentH',
              },
              {
                id: 'j',
                path: '*',
                type: 'nested',
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
        },
        {
          id: 'e',
          path: 'a/b',
          type: 'nested',
          _component: 'componentE',
          children: [
            {
              id: 'f',
              path: 'f',
              type: 'nested',
              _component: 'componentF',
            },
          ],
        },
        {
          id: 'd',
          path: 'a/d',
          type: 'nested',
          _component: 'componentD',
        },
        {
          id: 'i',
          path: 'a/g/h/i',
          type: 'nested',
          _component: 'componentH',
        },
        {
          id: 'j',
          path: 'a/g/*',
          type: 'nested',
          _component: 'componentJ',
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
        path: 'a',
        children: [
          // pathless layout
          {
            id: 'b',
            type: 'nested',
            _component: 'layoutB',
            children: [
              {
                id: 'c',
                type: 'nested',
                path: 'c',
                children: [
                  {
                    id: 'd',
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
          children: [
            {
              id: 'd',
              path: 'c',
              _component: 'pageD',
              type: 'nested',
            },
          ],
        },
      ]);
    });
  });

  test('walk', async () => {
    const routesDir = path.join(fixtures, './nested-routes');
    const route = await walk(
      routesDir,
      routesDir,
      {
        name: '@_modern_js_src',
        basename: routesDir,
      },
      'main',
      true,
      false,
    );
    expect(route).toMatchSnapshot();
  });
});
