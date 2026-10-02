import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import type { AnyRoute } from '@tanstack/react-router';
import ts from 'typescript';
import { generateTanstackRouterTypesSourceForEntry } from '../../src/cli/tanstackTypes';

describe('tanstack router type generation', () => {
  const tempRoot = process.env.OWNED_TEMP_DIR || tmpdir();
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  test('emits inline data actions into route static data', async () => {
    tempDir = await mkdtemp(path.join(tempRoot, 'modern-tanstack-types-'));
    const srcDirectory = path.join(tempDir, 'src');
    const routeDir = path.join(srcDirectory, 'routes', 'mf');
    await mkdir(routeDir, { recursive: true });
    await writeFile(
      path.join(routeDir, 'page.data.ts'),
      [
        'export const loader = () => ({ count: 0 });',
        'export const action = () => Response.json({ count: 1 });',
      ].join('\n'),
    );

    const { routerGenTs } = await generateTanstackRouterTypesSourceForEntry({
      appContext: {
        srcDirectory,
        internalSrcAlias: '@/_',
      } as any,
      entryName: 'index',
      routes: [
        {
          type: 'nested',
          id: 'layout',
          isRoot: true,
          children: [
            {
              type: 'nested',
              id: 'mf/page',
              path: 'mf',
              data: '@/_/routes/mf/page.data',
              action: '@/_/routes/mf/page.data',
            },
          ],
        },
      ] as any,
    });

    expect(routerGenTs).toContain(
      [
        'import {',
        '  action as action_0,',
        '  loader as loader_0,',
        "} from '../../routes/mf/page.data';",
      ].join('\n'),
    );
    expect(routerGenTs).toContain('modernRouteLoader: loader_0');
    expect(routerGenTs).toContain('modernRouteAction: action_0');
    expect(routerGenTs).toContain(
      "} from '@modern-js/plugin-tanstack/runtime';",
    );
  });

  test.each([
    {
      name: 'nested route paths',
      children: [
        {
          type: 'nested',
          id: 'parent',
          path: 'parent',
          children: [{ type: 'nested', id: 'child', path: ':id' }],
        },
      ],
      paths: ['/parent/$id'],
    },
    {
      name: 'colliding route identifiers',
      children: [
        { type: 'nested', id: 'a/b/page', path: 'a/b' },
        { type: 'nested', id: 'a_b/page', path: 'a_b' },
        { type: 'nested', path: 'plain' },
        { type: 'nested', id: 'r_0', path: 'named' },
      ],
      paths: ['/a/b', '/a_b', '/plain', '/named'],
    },
  ])('preserves $name in generated types', async ({ children, paths }) => {
    tempDir = await mkdtemp(path.join(tempRoot, 'modern-tanstack-types-'));
    const { routerGenTs } = await generateTanstackRouterTypesSourceForEntry({
      appContext: { srcDirectory: tempDir, internalSrcAlias: '@/_' } as any,
      entryName: 'index',
      routes: [
        {
          type: 'nested',
          id: 'root',
          isRoot: true,
          children,
        },
      ] as any,
    });
    const generatedFile = path.join(tempDir, 'router.gen.ts');
    await writeFile(
      generatedFile,
      `${routerGenTs}\n
import type { RoutePaths } from '@tanstack/router-core';
${paths
  .map(
    (routePath, index) =>
      `const routePath${index}: RoutePaths<typeof routeTree> = ${JSON.stringify(routePath)};`,
  )
  .join('\n')}
// @ts-expect-error unknown paths must remain rejected
const unknownPath: RoutePaths<typeof routeTree> = '/missing';
`,
    );
    const options: ts.CompilerOptions = {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      types: [],
    };
    const routerTypes = ts.resolveModuleName(
      '@tanstack/react-router',
      __filename,
      options,
      ts.sys,
    ).resolvedModule!;
    const coreTypes = ts.resolveModuleName(
      '@tanstack/router-core',
      routerTypes.resolvedFileName,
      options,
      ts.sys,
    ).resolvedModule!;
    const host = ts.createCompilerHost(options);
    host.resolveModuleNames = (names, containingFile) =>
      names.map(name => {
        if (name === '@modern-js/plugin-tanstack/runtime') return routerTypes;
        if (name === '@tanstack/router-core') return coreTypes;
        return ts.resolveModuleName(name, containingFile, options, host)
          .resolvedModule;
      });
    const program = ts.createProgram([generatedFile], options, host);
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')),
    ).toEqual([]);
  });

  test.each([
    {
      location: 'https://example.com/next',
      mode: 'returned',
      option: 'href',
      status: 302,
    },
    {
      location: 'https://example.com/next',
      mode: 'thrown',
      option: 'href',
      status: 301,
    },
    { location: '/next', mode: 'returned', option: 'to', status: 303 },
    { location: '/next', mode: 'thrown', option: 'to', status: 302 },
  ])(
    'preserves a $mode redirect to $location',
    async ({ location, mode, option, status }) => {
      tempDir = await mkdtemp(path.join(tempRoot, 'modern-tanstack-types-'));
      const srcDirectory = path.join(tempDir, 'src');
      const routeDir = path.join(srcDirectory, 'routes');
      await mkdir(routeDir, { recursive: true });
      await writeFile(
        path.join(routeDir, 'page.data.js'),
        `exports.loader = () => {
  const response = new Response(null, {
    status: ${status},
    headers: {
      Location: ${JSON.stringify(location)},
      'Set-Cookie': 'session=redirected; Path=/; HttpOnly',
      'X-Modern-Redirect': 'preserved',
    },
  });
  ${mode === 'thrown' ? 'throw' : 'return'} response;
};`,
      );
      const { routerGenTs } = await generateTanstackRouterTypesSourceForEntry({
        appContext: { srcDirectory, internalSrcAlias: '@/_' } as any,
        entryName: 'index',
        routes: [
          {
            type: 'nested',
            id: 'page',
            path: 'page',
            data: '@/_/routes/page.data',
          },
        ] as any,
      });
      const generatedRequire = createRequire(
        path.join(srcDirectory, 'modern-tanstack', 'index', 'router.gen.cjs'),
      );
      const testRequire = createRequire(__filename);
      const tanstack = testRequire('@tanstack/react-router');
      const generatedModule = { exports: {} as { routeTree: AnyRoute } };
      runInNewContext(
        ts.transpileModule(routerGenTs, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
          },
        }).outputText,
        {
          require: (name: string) =>
            name === '@modern-js/plugin-tanstack/runtime'
              ? tanstack
              : generatedRequire(name),
          module: generatedModule,
          exports: generatedModule.exports,
          AbortController,
          Request,
          Response,
          URL,
        },
      );
      const loader = generatedModule.exports.routeTree.children![0].options
        .loader as (ctx: any) => Promise<unknown>;
      const result = await loader({
        context: { request: new Request('https://app.example/page') },
        params: {},
      }).catch(error => error);
      expect(tanstack.isRedirect(result)).toBe(true);
      expect(result.status).toBe(status);
      expect(result.headers.get('Set-Cookie')).toBe(
        'session=redirected; Path=/; HttpOnly',
      );
      expect(result.headers.get('X-Modern-Redirect')).toBe('preserved');
      expect(result.options).toMatchObject({ [option]: location });
      expect(result.options[option === 'href' ? 'to' : 'href']).toBeUndefined();
    },
  );
});
