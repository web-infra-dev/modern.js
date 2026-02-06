import path from 'path';
import type { AppToolsContext } from '@modern-js/app-tools';
import type { NestedRouteForCli, PageRoute } from '@modern-js/types';
import { findExists, formatImportPath, fs, slash } from '@modern-js/utils';
import { getPathWithoutExt } from './utils';
import { makeLegalIdentifier } from './makeLegalIdentifier';

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

async function resolveFileNoExt(inputNoExtPath: string) {
  const file = findExists(
    JS_OR_TS_EXTS.map(ext => `${inputNoExtPath}${ext}`),
  );
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

export async function isTanstackRouterFrameworkEnabled(
  appContext: AppToolsContext,
): Promise<boolean> {
  const runtimeConfigBase = path.join(
    appContext.srcDirectory,
    appContext.runtimeConfigFile,
  );
  const runtimeConfigFile = findExists(
    JS_OR_TS_EXTS.map(ext => `${runtimeConfigBase}${ext}`),
  );
  if (!runtimeConfigFile) {
    return false;
  }

  try {
    const content = await fs.readFile(runtimeConfigFile, 'utf-8');
    // Heuristic: allow both single and double quotes, tolerate whitespace/newlines.
    return /framework\s*:\s*['"]tanstack['"]/.test(content);
  } catch {
    return false;
  }
}

export async function generateTanstackRouterTypesSourceForEntry(opts: {
  appContext: AppToolsContext;
  entryName: string;
  routes: (NestedRouteForCli | PageRoute)[];
}): Promise<{
  routerGenTs: string;
}> {
  const { appContext, entryName, routes } = opts;
  const outDir = path.join(
    appContext.srcDirectory,
    'modern-tanstack',
    entryName,
  );

  const rootModern = routes.find(
    r => r && (r as any).type === 'nested' && (r as any).isRoot,
  ) as NestedRouteForCli | undefined;

  const topLevel = rootModern
    ? (((rootModern as any).children as Array<NestedRouteForCli | PageRoute>) ||
        [])
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
      // Unknown format; treat as already relative to src.
      absNoExt = path.join(appContext.srcDirectory, aliasedNoExtPath);
    }

    const resolvedNoExt = await resolveFileNoExt(absNoExt);
    if (!resolvedNoExt) {
      return null;
    }

    const relImport = normalizeRelativeImport(
      path.relative(outDir, resolvedNoExt),
    );

    const importName = `loader_${loaderIndex++}`;
    if (inline) {
      imports.push(
        `import { loader as ${importName} } from ${quote(relImport)};`,
      );
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

    const routeOpts: string[] = [
      `getParentRoute: () => ${parentVar},`,
    ];

    if (isPathlessLayout(route)) {
      const id = (route as any).id as string | undefined;
      routeOpts.push(`id: ${quote(id || 'pathless')},`);
    } else {
      const p = isIndexRoute(route) ? '/' : toTanstackPath(rawPath || '');
      routeOpts.push(`path: ${quote(p)},`);
    }

    if (loaderName) {
      routeOpts.push(
        `loader: modernLoaderToTanstack({ hasSplat: ${hasSplat} }, ${loaderName}),`,
      );
    }

    statements.push(
      `const ${varName} = createRoute({\n  ${routeOpts.join('\n  ')}\n});`,
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
  const rootLoaderName =
    rootLoaderInfo && rootLoaderInfo.loaderPath
      ? await getImportNameForLoader(rootLoaderInfo.loaderPath, rootLoaderInfo.inline)
      : null;

  const topLevelVars = await Promise.all(
    topLevel.map(route => buildRoute({ parentVar: 'rootRoute', route })),
  );

  const rootOpts: string[] = [];
  if (rootLoaderName) {
    rootOpts.push(`loader: modernLoaderToTanstack({ hasSplat: false }, ${rootLoaderName}),`);
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
} from '@modern-js/runtime/tanstack-router';

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
  ${rootOpts.join('\n  ')}
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
