import path from 'path';
import type { CLIPluginAPI, Entrypoint } from '@modern-js/plugin';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  lodash as _,
  fs as fse,
  getMeta,
} from '@modern-js/utils';
import { resolve } from '@vercel/nft';
import { Job } from '@vercel/nft/out/node-file-trace';
import type { AppTools, AppToolsNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/plugin';
import { isMainEntry } from '../../utils/routes';
import type { Setup } from './platforms/platform';
import { type PluginItem, getPluginsCode } from './utils';

export const ESM_RESOLVE_CONDITIONS = ['node', 'import', 'module', 'default'];

export const NODE_BUILTIN_MODULES = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'fs/promises',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
  'constants',
];

export const isTextFile = (filePath: string) => {
  const textExtensions = ['.txt', '.html', '.css', '.svg', '.css'];

  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.includes(ext);
};

export const walkDirectory = async (
  sourceDir: string,
  cb: (filePath: string) => void | Promise<void>,
) => {
  // Read directory contents
  const items = await fse.readdir(sourceDir);

  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);

    const stat = await fse.stat(sourcePath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      await walkDirectory(sourcePath, cb);
    } else if (stat.isFile()) {
      // Process files based on extension
      await cb(sourcePath);
    }
  }
};

export const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/');

export const serverAppContenxtTemplate = (appContext: AppToolsContext) => {
  const {
    appDirectory,
    sharedDirectory,
    apiDirectory,
    lambdaDirectory,
    metaName,
    bffRuntimeFramework,
  } = appContext;
  return {
    sharedDirectory: `"${normalizePath(
      path.relative(appDirectory, sharedDirectory),
    )}"`,
    apiDirectory: `"${normalizePath(path.relative(appDirectory, apiDirectory))}"`,
    lambdaDirectory: `"${normalizePath(
      path.relative(appDirectory, lambdaDirectory),
    )}"`,
    metaName,
    bffRuntimeFramework: bffRuntimeFramework || 'hono',
  };
};

export const getServerConfigPath = (meta: string) =>
  `"${normalizePath(path.join(SERVER_DIR, `${meta}.server`))}"`;

const copyDepFile = async (sourcePath: string, targetPath: string) => {
  await fse.ensureDir(path.dirname(targetPath));
  const ext = path.extname(sourcePath);
  // console.log(`Copying ${ext} file: ${sourcePath} -> ${targetPath}`);

  // If it's a JS-like file, copy as is
  if (['.js', '.mjs', '.json'].includes(ext)) {
    await fse.copyFile(sourcePath, targetPath);
    return { path: targetPath };
  }

  if (!isTextFile(sourcePath)) {
    return;
  }

  // Handle text files
  const content = await fse.readFile(sourcePath, 'utf-8');
  // Escape quotes and backslashes in content
  const escapedContent = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const jsContent = `\
// Automatically generated JS wrapper for ${path.basename(sourcePath)}
export const _DEP_TEXT = \`${escapedContent}\`;
`;

  // Keep the same filename but with .js extension
  const jsTargetPath = `${targetPath}.js`;

  await fse.writeFile(jsTargetPath, jsContent);
  return { path: jsTargetPath, wrapper: '_DEP_TEXT' };
};

export const copyDeps = async (
  from: string,
  to: string,
  staticPrefix?: string,
) => {
  const codes = ['export const deps = {'];
  await walkDirectory(from, async filePath => {
    // skip static files
    if (staticPrefix && filePath.startsWith(staticPrefix)) {
      return;
    }

    // skip map and LICENSE files
    if (filePath.endsWith('.map') || filePath.endsWith('.LICENSE.txt')) {
      return;
    }

    const relative = normalizePath(path.relative(from, filePath));
    const targetPath = path.join(to, relative);
    const copyResult = await copyDepFile(filePath, targetPath);
    if (copyResult) {
      const requirePath = normalizePath(path.relative(to, copyResult.path));
      const suffix = copyResult.wrapper
        ? `.then(x => x.${copyResult.wrapper})`
        : '';
      codes.push(
        `${JSON.stringify(relative)}: () => import(${JSON.stringify(`./${requirePath}`)})${suffix},`,
      );
    }
  });
  codes.push('}');

  // generate deps file
  await fse.writeFile(path.join(to, 'deps.js'), codes.join('\n'));
};

const genPluginImportsCode = (plugins: PluginItem[]) => {
  return `import { ${plugins.map((_, index) => `plugin_${index}`).join(', ')} } from './bundles/modern-server'`;
};

export const getProdServerEntry = (internalDirectory: string) =>
  path.join(internalDirectory, 'prod-server.mjs');

export const generateProdServerEntry = async (
  ctx: ReturnType<CLIPluginAPI<AppTools>['getAppContext']>,
  serverType: string,
) => {
  const { internalDirectory, serverPlugins } = ctx;
  const pluginCode = serverPlugins.map(
    ({ name }, index) =>
      `import * as plugin_${index}_ns from '${name}';\nexport const plugin_${index} = plugin_${index}_ns.default || plugin_${index}_ns;`,
  );
  const entry = await resolveESMDependency(
    `@modern-js/prod-server/${serverType}`,
  );
  const serverCode = `export * from '${entry}';`;
  const prodEntryPath = getProdServerEntry(internalDirectory);
  await fse.writeFile(prodEntryPath, `${pluginCode}\n${serverCode}`);
  return prodEntryPath;
};

export const generateHandler = async (
  template: string,
  appContext: AppToolsContext,
  config: AppToolsNormalizedConfig,
) => {
  const { distDirectory, serverPlugins, metaName } = appContext;

  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  const { routes } = fse.readJSONSync(routeJSON);

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const serverConfig = {
    bff: {
      prefix: config?.bff?.prefix,
    },
    output: {
      distPath: {
        root: '.',
      },
    },
  };

  const meta = getMeta(metaName);

  const pluginImportCode = genPluginImportsCode(plugins || []);
  const dynamicProdOptions = {
    config: serverConfig,
  };

  const serverConfigPath = getServerConfigPath(meta);

  const pluginsCode = getPluginsCode(plugins);

  const serverAppContext = serverAppContenxtTemplate(appContext);

  return template
    .replace('p_genPluginImportsCode', pluginImportCode)
    .replace('p_ROUTES', JSON.stringify(routes))
    .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
    .replace('p_plugins', pluginsCode)
    .replace(
      'p_bffRuntimeFramework',
      `"${serverAppContext.bffRuntimeFramework}"`,
    )
    .replace('p_serverDirectory', serverConfigPath)
    .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
    .replace('p_apiDirectory', serverAppContext.apiDirectory)
    .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);
};

export const resolveESMDependency = async (entry: string) => {
  const j = new Job({
    conditions: ESM_RESOLVE_CONDITIONS,
  });
  const res = await resolve(entry, __filename, j);
  if (Array.isArray(res)) {
    return normalizePath(res[0]);
  }
  return normalizePath(res);
};

export const copyEntriesHtml = async (
  modernConfig: AppToolsNormalizedConfig,
  entrypoints: Entrypoint[],
  from: string,
  to: string,
) => {
  const {
    source: { mainEntryName },
  } = modernConfig;
  for (const entry of entrypoints) {
    const isMain = isMainEntry(entry.entryName, mainEntryName);
    const entryFilePath = path.join(
      from,
      'html',
      entry.entryName,
      'index.html',
    );
    const targetHtml = isMain ? 'index.html' : `${entry.entryName}.html`;
    await fse.copyFile(entryFilePath, path.join(to, targetHtml));
  }
};

export const modifyCommonConfig: Setup = api => {
  api.modifyRsbuildConfig(config => {
    if (_.get(config, 'environments.node')) {
      _.set(config, 'environments.node.source.entry.modern-server', [
        getProdServerEntry(api.getAppContext().internalDirectory),
      ]);
      _.set(
        config,
        'environments.node.resolve.conditionNames',
        ESM_RESOLVE_CONDITIONS,
      );
      // use node:stream API
      _.set(
        config,
        'environments.node.source.define["process.env.MODERN_SSR_NODE_STREAM"]',
        'true',
      );
    }
    return config;
  });
  api.modifyBundlerChain((_c, { environments }) => {
    // Use modifyBundlerChain API to ensure that the write priority of MODERN_SSR_ENV is higher than plugin-ssr
    if (environments.node) {
      _.set(
        environments.node,
        'config.source.define["process.env.MODERN_SSR_ENV"]',
        "'edge'",
      );
    }
  });
};

export const externalPkgs = ({ request }: any, callback: any) => {
  if (request) {
    if (request.includes('compiled/debug/index.js')) {
      return callback(undefined, 'var {debug:()=>{return () => {}}}');
    }
  }
  callback();
};

export const generateNodeExternals = (
  getExternal: (api: string) => string,
  list: string[] = [],
) => [
  ...list.map(api => [api, getExternal(api)]),
  ...list.map(api => [`node:${api}`, getExternal(api)]),
];
