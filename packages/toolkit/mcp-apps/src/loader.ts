import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  LoadRemoteHandler,
  LoadRemoteHandlerOptions,
  McpAppsConfig,
  McpAppsDefinition,
  RemoteConfig,
  RemoteToolHandler,
} from './config';

export async function loadMcpAppsConfig(
  configPath: string,
): Promise<McpAppsConfig> {
  const resolvedPath = await resolveLocalConfigModule(configPath);

  if (/\.[cm]?tsx?$/.test(resolvedPath) || /\.[cm]?js$/.test(resolvedPath)) {
    return loadMcpAppsModule(resolvedPath);
  }

  const raw = await fs.readFile(path.resolve(resolvedPath), 'utf8');
  return JSON.parse(raw) as McpAppsConfig;
}

// Resolve a config path that omits its extension, mirroring how local handler
// modules are resolved. Lets callers point at "dir/mcp_apps" and pick up the
// compiled mcp_apps.mjs (prod) or the mcp_apps.ts source (dev) automatically.
// If nothing matches, the path is returned unchanged so the original error
// (e.g. ENOENT from readFile) still surfaces.
async function resolveLocalConfigModule(configPath: string): Promise<string> {
  if (path.extname(configPath)) {
    return configPath;
  }
  const absolute = path.resolve(configPath);
  const candidates = [
    `${absolute}.mjs`,
    `${absolute}.js`,
    `${absolute}.cjs`,
    `${absolute}.ts`,
    `${absolute}.tsx`,
    `${absolute}.json`,
  ];
  for (const candidate of candidates) {
    try {
      if ((await fs.stat(candidate)).isFile()) {
        return candidate;
      }
    } catch {
      // Try the next extension.
    }
  }
  return configPath;
}

// Load application-compiled modules. TypeScript support belongs to the host runtime.
async function importLocalModule(
  modulePath: string,
): Promise<Record<string, unknown>> {
  const absolutePath = path.resolve(modulePath);
  const moduleUrl = pathToFileURL(absolutePath);
  moduleUrl.searchParams.set('t', String(Date.now()));
  return (await importOptional(moduleUrl.href)) as Record<string, unknown>;
}

async function loadMcpAppsModule(configPath: string): Promise<McpAppsConfig> {
  const mod = (await importLocalModule(configPath)) as {
    default?: McpAppsConfig;
    config?: McpAppsConfig;
    mcpApps?: McpAppsConfig;
  };
  const exported = mod.default ?? mod.config ?? mod.mcpApps;
  const config =
    exported && !('tools' in exported) && 'default' in exported
      ? (exported as { default: McpAppsConfig }).default
      : exported;
  if (!config) {
    throw new Error(
      `${configPath}: expected a default export from defineMcpApps(...)`,
    );
  }
  return config;
}

export function createMcpAppsHandlerLoader(
  definition: McpAppsDefinition,
): LoadRemoteHandler {
  const vmokLoader = createVmokRemoteHandlerLoader(definition);
  const localLoaderCache = new Map<string, Promise<RemoteToolHandler>>();

  return async options => {
    if ((options.handler.runtime ?? 'local') === 'local') {
      const cacheKey = `${options.configPath ?? process.cwd()}:${options.handler.module}:${options.handler.exportName}`;
      if (!localLoaderCache.has(cacheKey)) {
        const loading = loadLocalToolHandler(options);
        localLoaderCache.set(cacheKey, loading);
        loading.catch(() => {
          if (localLoaderCache.get(cacheKey) === loading)
            localLoaderCache.delete(cacheKey);
        });
      }
      const handler = localLoaderCache.get(cacheKey);
      if (!handler) {
        throw new Error(
          `Unable to load local handler "${options.handler.module}"`,
        );
      }
      return handler;
    }
    return vmokLoader(options);
  };
}

async function loadLocalToolHandler({
  handler,
  configPath,
}: LoadRemoteHandlerOptions): Promise<RemoteToolHandler> {
  const modulePath = await resolveLocalHandlerModule(
    handler.module,
    configPath,
  );
  // Loaded through the same import() pipeline as the config: TypeScript sources
  // are esbuild-transpiled, built .js/.mjs/.cjs are imported directly. No host
  // TS loader or CJS-only require() needed.
  const mod = await importLocalModule(modulePath);
  const resolved = mod[handler.exportName] ?? mod.default;
  if (typeof resolved !== 'function') {
    throw new Error(
      `Export "${handler.exportName}" from "${modulePath}" is not a function`,
    );
  }
  return resolved as RemoteToolHandler;
}

export async function resolveLocalHandlerModule(
  modulePath: string,
  configPath?: string,
): Promise<string> {
  const baseDir = configPath
    ? path.dirname(path.resolve(configPath))
    : process.cwd();
  const candidate = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(baseDir, modulePath);
  const candidates = path.extname(candidate)
    ? [candidate]
    : [
        candidate,
        `${candidate}.ts`,
        `${candidate}.tsx`,
        `${candidate}.js`,
        `${candidate}.mjs`,
        `${candidate}.cjs`,
        path.join(candidate, 'index.ts'),
        path.join(candidate, 'index.js'),
      ];
  for (const item of candidates) {
    try {
      const stat = await fs.stat(item);
      if (stat.isFile()) {
        return item;
      }
    } catch {
      // Try the next extension.
    }
  }
  throw new Error(
    `Local handler module "${modulePath}" was not found from ${baseDir}`,
  );
}

function createVmokRemoteHandlerLoader(
  definition: McpAppsDefinition,
): LoadRemoteHandler {
  const instances = new Map<
    string,
    Promise<{ loadRemote: (id: string) => Promise<unknown> }>
  >();

  return async ({ remote, handler }) => {
    if (!remote) throw new Error('vmok-server requires a remote');
    const vmok = await getVmokInstance(definition, remote, instances);
    const moduleId = toRemoteModuleId(remote.name, handler.module);
    const remoteModule = (await vmok.loadRemote(moduleId)) as Record<
      string,
      unknown
    >;
    const resolved = remoteModule[handler.exportName] ?? remoteModule.default;
    if (typeof resolved !== 'function') {
      throw new Error(
        `Export "${handler.exportName}" from "${moduleId}" is not a function`,
      );
    }
    return resolved as RemoteToolHandler;
  };
}

async function getVmokInstance(
  definition: McpAppsDefinition,
  remote: RemoteConfig,
  instances: Map<
    string,
    Promise<{ loadRemote: (id: string) => Promise<unknown> }>
  >,
) {
  const cacheKey = definition.remotes
    .map(item => `${item.name}:${item.baseUrl}`)
    .join('|');
  if (!instances.has(cacheKey)) {
    const loading = createVmokInstance(definition, remote);
    instances.set(cacheKey, loading);
    loading.catch(() => {
      if (instances.get(cacheKey) === loading) instances.delete(cacheKey);
    });
  }
  const instance = instances.get(cacheKey);
  if (!instance) {
    throw new Error(`Unable to create Vmok runtime for "${remote.name}"`);
  }
  return instance;
}

async function createVmokInstance(
  definition: McpAppsDefinition,
  activeRemote: RemoteConfig,
): Promise<{ loadRemote: (id: string) => Promise<unknown> }> {
  let runtime: {
    createInstance?: (options: unknown) => {
      loadRemote: (id: string) => Promise<unknown>;
    };
  };
  try {
    runtime = (await importOptional('@vmok/kit/runtime')) as typeof runtime;
  } catch (error) {
    throw new Error(
      `Unable to load @vmok/kit/runtime for remote handler "${activeRemote.name}". Install @vmok/kit or pass loadRemoteHandler explicitly. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (typeof runtime.createInstance !== 'function') {
    throw new Error('@vmok/kit/runtime does not export createInstance');
  }

  return runtime.createInstance({
    name: 'modern-mcp-host',
    remotes: definition.remotes.map(remote => ({
      name: remote.name,
      entry: remote.serverEntry ?? remote.baseUrl,
      ...(remote.version ? { version: remote.version } : {}),
    })),
  });
}

function importOptional(specifier: string): Promise<unknown> {
  return import(specifier);
}

function toRemoteModuleId(remoteName: string, modulePath: string): string {
  const normalizedPath = modulePath.replace(/^\.\//, '');
  return normalizedPath === '' || normalizedPath === '.'
    ? remoteName
    : `${remoteName}/${normalizedPath}`;
}
