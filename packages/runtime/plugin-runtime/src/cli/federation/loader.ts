import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseSync, printSync } from '@swc/core';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types';
import type { Rspack } from '@rsbuild/core';
import { fs, formatImportPath } from '@modern-js/utils';
import { fileSystemRoutes } from '../../router/cli/code/templates';
import { analyzeRootExport } from './analyze';
import { selectRouteScope } from './select';

interface Options {
  internalDirectory: string;
  metaName: string;
  entrypoints: Pick<Entrypoint, 'entryName' | 'isMainEntry'>[];
}

interface ScopeGraph extends Omit<
  Parameters<typeof fileSystemRoutes>[0],
  'routes' | 'internalDirectory'
> {
  routes: (NestedRouteForCli | PageRoute)[];
  globalApp?: string | false;
  basename: string;
  enableRsc: boolean;
  app?: string;
}

async function output(filename: string, content: string) {
  if ((await fs.readFile(filename, 'utf8').catch(() => undefined)) !== content)
    await fs.outputFile(filename, content);
}

/** An expose-only resource variant keeps ordinary imports of the source intact. */
export default async function loader(
  this: Rspack.LoaderContext<Options>,
  source: string,
) {
  const { internalDirectory, metaName, entrypoints } = this.getOptions();
  try {
    const root = analyzeRootExport(source, this.resourcePath, metaName);
    if (!root) return source;
    const entryName =
      root.entry || entrypoints.find(entry => entry.isMainEntry)?.entryName;
    if (!entryName || !entrypoints.some(entry => entry.entryName === entryName))
      throw new Error(`Unknown registry entry "${root.entry || 'main'}".`);
    const graphFile = path.join(
      internalDirectory,
      entryName,
      'route-scope.json',
    );
    this.addDependency(graphFile);
    const graph = (await fs.readJSON(graphFile).catch(() => {
      throw new Error(`Registry "${entryName}" has no build-time route graph.`);
    })) as ScopeGraph;
    if (graph.enableRsc) {
      if (root.route === undefined) return source;
      throw new Error(
        'Modern application route exposes do not support RSC yet.',
      );
    }
    const routes =
      root.route === undefined
        ? graph.routes
        : selectRouteScope(graph.routes, root.route);
    const id = createHash('sha256')
      .update(`${entryName}\0${root.route || ''}`)
      .digest('hex')
      .slice(0, 16);
    const directory = path.join(internalDirectory, entryName, 'mf-scopes', id);
    const registry = formatImportPath(path.join(directory, 'registry.js'));
    const scopedCode = await fileSystemRoutes({
      ...graph,
      routes,
      internalDirectory: directory,
      isolated: true,
    });
    await output(path.join(directory, 'routes.js'), scopedCode);
    const runtimeFile = path.join(
      internalDirectory,
      entryName,
      'runtime-register.js',
    );
    this.addDependency(runtimeFile);
    const runtime = parseSync(await fs.readFile(runtimeFile, 'utf8'));
    const imports = runtime.body.filter(
      item => item.type === 'ImportDeclaration',
    );
    const statements = runtime.body.filter(
      item => item.type !== 'ImportDeclaration',
    );
    const runtimeImport = parseSync(
      "import { createRuntime as registerPlugin } from 'runtime'",
    ).body[0] as import('@swc/core').ImportDeclaration;
    const runtimeSpecifier = runtimeImport.specifiers[0];
    if (runtimeSpecifier.type !== 'ImportSpecifier')
      throw new Error('Invalid runtime factory import.');
    const parameter = (
      parseSync('routerPlugin({}, routesConfig, selected)')
        .body[0] as import('@swc/core').ExpressionStatement
    ).expression as import('@swc/core').CallExpression;
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      const node = value as {
        type?: string;
        callee?: { type: string; value?: string };
        arguments?: unknown[];
      };
      if (
        node.type === 'CallExpression' &&
        node.callee?.type === 'Identifier' &&
        node.callee.value === 'routerPlugin'
      )
        node.arguments!.push(...parameter.arguments.slice(1));
      for (const child of Object.values(value))
        if (Array.isArray(child)) child.forEach(visit);
        else if (child && typeof child === 'object') visit(child);
    };
    statements.forEach(visit);
    for (const item of imports) {
      for (const specifier of item.specifiers)
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.local.value === 'registerPlugin'
        ) {
          specifier.imported = runtimeSpecifier.imported;
        }
    }
    const body = printSync({ ...runtime, body: statements })
      .code.replace(/getCurrentEntryName\(\)/g, JSON.stringify(entryName))
      .replace(
        /registerPlugin\(plugins, runtimeConfig\);?/,
        'return registerPlugin(plugins, runtimeConfig);',
      );
    await output(
      path.join(directory, 'runtime.js'),
      `${printSync({ ...runtime, body: imports }).code}\nexport function createRegistryRuntime(routesConfig, selected) {\n${body}\n}`,
    );
    const layoutImport = graph.globalApp
      ? `import globalApp from ${JSON.stringify(graph.globalApp)};`
      : 'const globalApp = undefined;';
    await output(
      registry,
      `import { createScopedRoot, createScopedRender } from '@${metaName}/runtime/internal/route-scope';
import { routes } from './routes';
import { createRegistryRuntime } from './runtime';
${layoutImport}
${graph.app ? `import App from ${JSON.stringify(graph.app)};` : 'const App = undefined;'}
const definition = { routes, globalApp, App, createRuntime: createRegistryRuntime, route: ${JSON.stringify(root.route)}, basename: ${JSON.stringify(graph.basename)}, serverLoaders: ${Boolean(graph.ssrMode)}, getDataBase: () => new URL(__webpack_public_path__, window.location.href).origin };
export const createRoot = () => createScopedRoot(definition);
export const render = createScopedRender();
`,
    );
    root.module.body = root.module.body.flatMap<import('@swc/core').ModuleItem>(
      item => {
        if (item.type !== 'ImportDeclaration') return [item];
        const from = item.source.value;
        if (
          from === `@${metaName}/runtime/registry` ||
          from.startsWith(`@${metaName}/runtime/registry/`)
        ) {
          item.source.value = registry;
          item.source.raw = undefined;
          return [item];
        }
        const symbol =
          from === `@${metaName}/runtime/react`
            ? 'createRoot'
            : from === `@${metaName}/runtime/browser`
              ? 'render'
              : undefined;
        if (!symbol) return [item];
        const selected = item.specifiers.filter(
          specifier =>
            specifier.type === 'ImportSpecifier' &&
            (specifier.imported?.value || specifier.local.value) === symbol,
        );
        const remaining = item.specifiers.filter(
          specifier => !selected.includes(specifier),
        );
        if (!selected.length) return [item];
        return [
          ...(remaining.length ? [{ ...item, specifiers: remaining }] : []),
          {
            ...item,
            specifiers: selected,
            source: { ...item.source, value: registry, raw: undefined },
          },
        ];
      },
    );
    return printSync(root.module).code;
  } catch (error) {
    throw new Error(
      `[Modern.js Module Federation] ${this.resourcePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
