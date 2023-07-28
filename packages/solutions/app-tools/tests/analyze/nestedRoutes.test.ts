/**
 * @jest-environment node
 */
import path from 'path';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { NestedRouteForCli } from '@modern-js/types';
import { optimizeRoute, walk } from '../../src/analyze/nestedRoutes';

const fixtures = path.join(__dirname, 'fixtures');

initSnapshotSerializer({ cwd: path.resolve(__dirname, '../..') });

describe('nested routes', () => {
  test('optimizeRoute', () => {
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
