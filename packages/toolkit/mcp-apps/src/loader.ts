import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  LoadRemoteHandler,
  LoadRemoteHandlerOptions,
  McpAppsConfig,
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

export function createMcpAppsHandlerLoader(): LoadRemoteHandler {
  const localLoaderCache = new Map<string, Promise<RemoteToolHandler>>();
  return async options => {
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
  // TypeScript support belongs to the host runtime, as with config loading.
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

function importOptional(specifier: string): Promise<unknown> {
  return import(specifier);
}
