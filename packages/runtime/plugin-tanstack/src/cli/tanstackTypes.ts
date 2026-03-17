import path from 'path';
import type { AppToolsContext } from '@modern-js/app-tools';
import type { Entrypoint, NestedRouteForCli, PageRoute } from '@modern-js/types';
import { findExists, formatImportPath, fs, slash } from '@modern-js/utils';

const JS_OR_TS_EXTS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.mts',
  '.cjs',
  '.cts',
] as const;

async function resolveFileNoExt(inputNoExtPath: string) {
  const file = findExists(JS_OR_TS_EXTS.map(ext => `${inputNoExtPath}${ext}`));
  return file ? getPathWithoutExt(file) : null;
}

function quote(str: string) {
  return JSON.stringify(str);
}

function normalizeRelativeImport(p: string) {
  const normalized = formatImportPath(slash(p));
  if (normalized.startsWith('.')) {
    return normalized;
  }
  return `./${normalized}`;
}

function getPathWithoutExt(filename: string) {
  const extname = path.extname(filename);
  return extname ? filename.slice(0, -extname.length) : filename;
}

const reservedWords =
  'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public';
const builtins =
  'arguments Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl';
const forbidList = new Set<string>(`${reservedWords} ${builtins}`.split(' '));

function makeLegalIdentifier(str: string) {
  const identifier = str
    .replace(/-(\w)/g, (_, letter) => letter.toUpperCase())
    .replace(/[^$_a-zA-Z0-9]/g, '_');

  if (/\d/.test(identifier[0]) || forbidList.has(identifier)) {
    return `_${identifier}`;
  }
  return identifier || '_';
}

function pickModernLoaderModule(route: NestedRouteForCli | PageRoute) {
  const loaderPath = (route as any).data || (route as any).loader;
  if (!loaderPath || typeof loaderPath !== 'string') {
    return null;
  }

  const inline = Boolean((route as any).data);
  return { loaderPath, inline };
}

function isPathlessLayout(route: NestedRouteForCli | PageRoute) {
  return (
    (route as any).type === 'nested' &&
    typeof (route as any).index !== 'boolean' &&
    typeof (route as any).path === 'undefined'
  );
}

function isIndexRoute(route: NestedRouteForCli | PageRoute) {
  return (route as any).type === 'nested' && Boolean((route as any).index);
}

function toTanstackPath(pathname: string): string {
  return pathname
    .split('/')
    .map(segment => {
      if (!segment) {
        return segment;
      }
      if (segment === '*') {
        return '$';
      }
      if (segment.startsWith(':')) {
        const name = segment.slice(1);
        if (name.endsWith('?')) {
          return `{-$${name.slice(0, -1)}}`;
        }
        return `$${name}`;
      }
      return segment;
    })
    .join('/');
}

async function writeFileIfChanged(filePath: string, content: string) {
  try {
    const prev = (await fs.pathExists(filePath))
      ? await fs.readFile(filePath, 'utf-8')
      : null;
    if (prev !== content) {
      await fs.outputFile(filePath, content, 'utf-8');
    }
  } catch {
    await fs.outputFile(filePath, content, 'utf-8');
  }
}

export async function writeTanstackRegisterFile(opts: {
  appContext: AppToolsContext;
  entrypoints: Entrypoint[];
  generatedDirName: string;
  runtimeModule: string;
}) {
  const { appContext, entrypoints, generatedDirName, runtimeModule } = opts;
  const allEntries = Array.from(
    new Set(entrypoints.map(entrypoint => entrypoint.entryName).filter(Boolean)),
  );
  const mainEntry = entrypoints.find(entrypoint => entrypoint.isMainEntry)?.entryName;

  const registerEntries = allEntries.sort((left, right) => {
    if (mainEntry && left === mainEntry) {
      return -1;
    }

    if (mainEntry && right === mainEntry) {
      return 1;
    }

    return left.localeCompare(right);
  });

  const registerDtsPath = path.join(
    appContext.srcDirectory,
    generatedDirName,
    'register.gen.d.ts',
  );

  if (registerEntries.length === 0) {
    if (await fs.pathExists(registerDtsPath)) {
      await fs.remove(registerDtsPath);
    }
    return;
  }

  const importStatements = registerEntries
    .map(
      (entryName, index) =>
        `import type { router as router${index} } from './${entryName}/router.gen';`,
    )
    .join('\n');
  const routerUnionType = registerEntries
    .map((_, index) => `typeof router${index}`)
    .join(' | ');
  const registerContent = `// This file is auto-generated by Modern.js. Do not edit manually.

${importStatements}

declare module '${runtimeModule}' {
  interface Register {
    router: ${routerUnionType};
  }
}
`;

  await writeFileIfChanged(registerDtsPath, registerContent);
}

export async function writeTanstackRouterTypesForEntry(opts: {
  appContext: AppToolsContext;
  entryName: string;
  routes: (NestedRouteForCli | PageRoute)[];
  generatedDirName: string;
  runtimeModule: string;
}) {
  const { appContext, entryName, routes, generatedDirName, runtimeModule } = opts;
  const { routerGenTs } = await generateTanstackRouterTypesSourceForEntry({
    appContext,
    entryName,
    routes,
    runtimeModule,
    generatedDirName,
  });

  const outPath = path.join(
    appContext.srcDirectory,
    generatedDirName,
    entryName,
    'router.gen.ts',
  );
  await writeFileIfChanged(outPath, routerGenTs);
}

async function generateTanstackRouterTypesSourceForEntry(opts: {
  appContext: AppToolsContext;
  entryName: string;
  routes: (NestedRouteForCli | PageRoute)[];
  runtimeModule: string;
  generatedDirName: string;
}): Promise<{ routerGenTs: string }> {
  const { appContext, entryName, routes, runtimeModule, generatedDirName } = opts;
  const outDir = path.join(appContext.srcDirectory, generatedDirName, entryName);

  const rootModern = routes.find(
    route => route && (route as any).type === 'nested' && (route as any).isRoot,
  ) as NestedRouteForCli | undefined;

  const topLevel = rootModern
    ? ((rootModern as any).children as Array<NestedRouteForCli | PageRoute>) || []
    : routes;

  const imports: string[] = [];
  const statements: string[] = [];

  const loaderImportMap = new Map<string, string>();
  let loaderIndex = 0;
  let routeIndex = 0;

  const getImportNameForLoader = async (
    aliasedNoExtPath: string,
    inline: boolean,
  ) => {
    const key = `${inline ? 'inline' : 'default'}:${aliasedNoExtPath}`;
    const existing = loaderImportMap.get(key);
    if (existing) {
      return existing;
    }

    const prefix = `${appContext.internalSrcAlias}/`;
    let absNoExt: string | null = null;
    if (aliasedNoExtPath.startsWith(prefix)) {
      const rel = aliasedNoExtPath.slice(prefix.length);
      absNoExt = path.join(appContext.srcDirectory, rel);
    } else if (path.isAbsolute(aliasedNoExtPath)) {
      absNoExt = aliasedNoExtPath;
    } else {
      absNoExt = path.join(appContext.srcDirectory, aliasedNoExtPath);
    }

    const resolvedNoExt = await resolveFileNoExt(absNoExt);
    if (!resolvedNoExt) {
      return null;
    }

    const relImport = normalizeRelativeImport(path.relative(outDir, resolvedNoExt));
    const importName = `loader_${loaderIndex++}`;

    if (inline) {
      imports.push(`import { loader as ${importName} } from ${quote(relImport)};`);
    } else {
      imports.push(`import ${importName} from ${quote(relImport)};`);
    }

    loaderImportMap.set(key, importName);
    return importName;
  };

  const createRouteVarName = (route: NestedRouteForCli | PageRoute) => {
    const id = (route as any).id as string | undefined;
    const base = id ? makeLegalIdentifier(id) : `r_${routeIndex++}`;
    return `route_${base}`;
  };

  const buildRoute = async (opts: {
    parentVar: string;
    route: NestedRouteForCli | PageRoute;
  }): Promise<string> => {
    const { parentVar, route } = opts;
    const varName = createRouteVarName(route);
    const loaderInfo = pickModernLoaderModule(route);
    const loaderName = loaderInfo
      ? await getImportNameForLoader(loaderInfo.loaderPath, loaderInfo.inline)
      : null;
    const rawPath = (route as any).path as string | undefined;
    const hasSplat = typeof rawPath === 'string' && rawPath.includes('*');

    const routeOptions: string[] = [`getParentRoute: () => ${parentVar},`];

    if (isPathlessLayout(route)) {
      const id = (route as any).id as string | undefined;
      routeOptions.push(`id: ${quote(id || 'pathless')},`);
    } else {
      const pathname = isIndexRoute(route) ? '/' : toTanstackPath(rawPath || '');
      routeOptions.push(`path: ${quote(pathname)},`);
    }

    if (loaderName) {
      routeOptions.push(
        `loader: modernLoaderToTanstack({ hasSplat: ${hasSplat} }, ${loaderName}),`,
      );
    }

    statements.push(
      `const ${varName} = createRoute({\n  ${routeOptions.join('\n  ')}\n});`,
    );

    const children = (route as any).children as
      | Array<NestedRouteForCli | PageRoute>
      | undefined;
    if (children && children.length > 0) {
      const childVars = await Promise.all(
        children.map(child => buildRoute({ parentVar: varName, route: child })),
      );
      statements.push(`${varName}.addChildren([${childVars.join(', ')}]);`);
    }

    return varName;
  };

  const rootLoaderInfo = rootModern ? pickModernLoaderModule(rootModern) : null;
  const rootLoaderName = rootLoaderInfo?.loaderPath
    ? await getImportNameForLoader(
        rootLoaderInfo.loaderPath,
        rootLoaderInfo.inline,
      )
    : null;

  const topLevelVars = await Promise.all(
    topLevel.map(route => buildRoute({ parentVar: 'rootRoute', route })),
  );

  const rootOptions: string[] = [];
  if (rootLoaderName) {
    rootOptions.push(
      `loader: modernLoaderToTanstack({ hasSplat: false }, ${rootLoaderName}),`,
    );
  }

  const routerGenTs = `/* eslint-disable */
// This file is auto-generated by Modern.js. Do not edit manually.

import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  notFound,
  redirect,
} from '${runtimeModule}';

type ModernRouterContext = {
  request?: Request;
  requestContext?: unknown;
};

function isResponse(value: unknown): value is Response {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as any).status === 'number' &&
    typeof (value as any).headers === 'object'
  );
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
function isRedirectResponse(res: Response) {
  return redirectStatusCodes.has(res.status);
}

function throwTanstackRedirect(location: string) {
  const target = location || '/';
  try {
    void new URL(target);
    throw redirect({ href: target });
  } catch {
    throw redirect({ to: target });
  }
}

function mapParamsForModernLoader(params: Record<string, string>, hasSplat: boolean) {
  if (!hasSplat) {
    return params;
  }

  const { _splat, ...rest } = params as any;
  if (typeof _splat !== 'undefined') {
    return { ...rest, '*': _splat };
  }
  return rest;
}

function modernLoaderToTanstack<TLoader extends (args: any) => any>(
  opts: { hasSplat: boolean },
  modernLoader: TLoader,
) {
  type LoaderResult = Awaited<ReturnType<TLoader>>;

  return async (ctx: any): Promise<LoaderResult> => {
    try {
      const signal: AbortSignal =
        ctx?.abortController?.signal ||
        ctx?.signal ||
        new AbortController().signal;
      const baseRequest: Request | undefined =
        ctx?.context?.request instanceof Request ? ctx.context.request : undefined;

      const href =
        typeof ctx?.location === 'string'
          ? ctx.location
          : ctx?.location?.publicHref ||
            ctx?.location?.href ||
            ctx?.location?.url?.href ||
            '';

      const request = baseRequest
        ? new Request(baseRequest, { signal })
        : new Request(href, { signal });

      const params = mapParamsForModernLoader(ctx?.params || {}, opts.hasSplat);

      const result = await (modernLoader as any)({
        request,
        params,
        context: ctx?.context?.requestContext,
      });

      if (isResponse(result)) {
        if (isRedirectResponse(result)) {
          const location = result.headers.get('Location') || '/';
          throwTanstackRedirect(location);
        }
        if (result.status === 404) {
          throw notFound();
        }
      }

      return result as LoaderResult;
    } catch (err) {
      if (isResponse(err)) {
        if (isRedirectResponse(err)) {
          const location = err.headers.get('Location') || '/';
          throwTanstackRedirect(location);
        }
        if (err.status === 404) {
          throw notFound();
        }
      }
      throw err;
    }
  };
}

${imports.join('\n')}

export const rootRoute = createRootRouteWithContext<ModernRouterContext>()({
  ${rootOptions.join('\n  ')}
});

${statements.join('\n\n')}

export const routeTree = rootRoute.addChildren([${topLevelVars.join(', ')}]);

export const router = createRouter({
  routeTree,
  history: createMemoryHistory({
    initialEntries: ['/'],
  }),
  context: {} as ModernRouterContext,
});
`;

  return { routerGenTs };
}
