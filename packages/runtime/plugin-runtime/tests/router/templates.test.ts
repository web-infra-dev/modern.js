import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type {
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
} from '@modern-js/types/cli';
import { init, parse } from 'es-module-lexer';

import { fileSystemRoutes } from '../../src/router/cli/code/templates';

let internalDirectory: string;

beforeAll(async () => {
  await init;
  internalDirectory = await mkdtemp(
    path.join(tmpdir(), 'modern-route-imports-'),
  );
});

afterAll(async () => {
  if (internalDirectory) {
    await rm(internalDirectory, { recursive: true, force: true });
  }
});

describe('fileSystemRoutes', () => {
  test.each([
    [
      String.raw`D:\app\tests\params-src\routes`,
      'D:/app/tests/params-src/routes',
    ],
    [
      String.raw`D:\中文目录\tests\params-src\routes`,
      'D:/中文目录/tests/params-src/routes',
    ],
  ])(
    'preserves Windows module paths from %s',
    async (directory, importDirectory) => {
      const routes: (NestedRouteForCli | PageRoute)[] = [
        {
          type: 'nested',
          origin: 'file-system',
          id: 'layout',
          path: '/',
          isRoot: true,
          _component: path.win32.join(directory, 'layout'),
          loading: path.win32.join(directory, 'loading'),
          error: path.win32.join(directory, 'error'),
          children: [
            {
              type: 'nested',
              origin: 'file-system',
              id: 'page',
              path: 'page',
              _component: path.win32.join(directory, 'page'),
            },
          ],
        },
        {
          type: 'page',
          id: 'page-route',
          path: 'page-route',
          component: path.win32.join(directory, 'page-route'),
          _component: path.win32.join(directory, 'page-route'),
        },
      ];
      const legacyRoutes: RouteLegacy[] = [
        {
          path: '/legacy',
          exact: true,
          component: path.win32.join(directory, 'legacy'),
          _component: path.win32.join(directory, 'legacy'),
        },
      ];

      for (const ssrMode of [undefined, 'string', 'stream'] as const) {
        for (const splitRouteChunks of [true, false]) {
          const options = {
            metaName: 'modern-js',
            entryName: 'main',
            internalDirectory,
            ssrMode,
            splitRouteChunks,
          };
          const code = await fileSystemRoutes({ ...options, routes });
          const legacyCode = await fileSystemRoutes({
            ...options,
            routes: legacyRoutes,
          });
          const imports = [...parse(code)[0], ...parse(legacyCode)[0]]
            .map(({ n }) => n)
            .filter(importPath => importPath?.startsWith('D:'));
          expect(
            [...new Set(imports)].sort(),
            `${ssrMode}/${splitRouteChunks}`,
          ).toEqual(
            ['layout', 'loading', 'error', 'page', 'page-route', 'legacy']
              .map(filename => `${importDirectory}/${filename}`)
              .sort(),
          );
        }
      }
    },
  );
});
