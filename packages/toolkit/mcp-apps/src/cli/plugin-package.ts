import fs from 'node:fs/promises';
import path from 'node:path';
import { assertHttpUrl, isRecord } from '../manifest';

export type McpHttpServerConfig = {
  type: 'streamable-http';
} & (
  | {
      /** Complete public endpoint. Overrides origin and the conventional MCP path. */
      url: string;
      origin?: string;
    }
  | {
      /** Public application origin. The framework appends bff.prefix and /mcp. */
      origin: string;
      url?: string;
    }
);

/** Conventional BFF MCP route, shared by development discovery and packaging. */
export function resolveMcpPath(rawPrefix?: string | string[]): string {
  const prefix =
    typeof rawPrefix === 'string'
      ? rawPrefix
      : Array.isArray(rawPrefix) && typeof rawPrefix[0] === 'string'
        ? rawPrefix[0]
        : '/api';
  const normalized = `/${prefix.replace(/^\/+|\/+$/g, '')}`;
  return `${normalized === '/' ? '' : normalized}/mcp`;
}

export interface PluginPackageOptions {
  /** Source package directory relative to the app root. Defaults to 'plugin'. */
  directory?: string;
  /** Files or directories relative to the source package. Defaults to no extra resources. */
  resources?: string[];
}

/** Package user-owned declarations separately from the deployed application. */
export async function buildPluginPackage(
  appDirectory: string,
  distDirectory: string,
  servers: Record<string, McpHttpServerConfig>,
  options: PluginPackageOptions = {},
  bffPrefix?: string | string[],
) {
  if (!isRecord(servers) || !Object.keys(servers).length)
    throw new Error('mcpServers must contain at least one HTTP MCP server');
  const resolvedServers: Record<
    string,
    { type: 'streamable-http'; url: string }
  > = Object.create(null);
  for (const [name, server] of Object.entries(servers)) {
    if (
      !name.trim() ||
      !isRecord(server) ||
      server.type !== 'streamable-http' ||
      (server.url === undefined && server.origin === undefined) ||
      Object.keys(server).some(key => !['type', 'url', 'origin'].includes(key))
    )
      throw new Error(`Invalid HTTP MCP server configuration: ${name}`);
    for (const value of [server.url, server.origin]) {
      if (value === undefined) continue;
      if (
        typeof value !== 'string' ||
        value.trim() !== value ||
        !/^https?:\/\//.test(value) ||
        /[\u0000-\u0020\u007f\\]/.test(value)
      )
        throw new Error(`Invalid HTTP MCP server configuration: ${name}`);
      const parsed = assertHttpUrl(value);
      if (parsed.hash)
        throw new Error(`MCP server URL must not contain a fragment: ${name}`);
    }
    if (server.origin !== undefined) {
      const origin = assertHttpUrl(server.origin);
      if (origin.pathname !== '/' || origin.search || origin.hash)
        throw new Error(
          `MCP server origin must not contain a path, query or fragment: ${name}`,
        );
    }
    resolvedServers[name] = {
      type: 'streamable-http',
      url: server.url ?? new URL(resolveMcpPath(bffPrefix), server.origin).href,
    };
  }
  const source = path.resolve(appDirectory, options.directory ?? 'plugin');
  const output = path.resolve(distDirectory, 'plugin');
  const relative = path.relative(source, output);
  const sourceRelative = path.relative(output, source);
  if (
    !relative ||
    (!sourceRelative.startsWith(`..${path.sep}`) &&
      sourceRelative !== '..' &&
      !path.isAbsolute(sourceRelative)) ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  )
    throw new Error('Plugin source and output directories must not overlap');

  // Only copy package declarations and their namespaced resources, never app secrets.
  const files: string[] = [];
  async function collect(filename: string) {
    const stat = await fs.lstat(path.join(source, filename));
    if (stat.isSymbolicLink())
      throw new Error(
        `Plugin package does not support symbolic links: ${filename}`,
      );
    if (stat.isDirectory()) {
      for (const child of await fs.readdir(path.join(source, filename)))
        await collect(path.join(filename, child));
    } else if (stat.isFile()) files.push(filename);
    else throw new Error(`Unsupported plugin package file: ${filename}`);
  }
  await collect('plugin.json');
  const plugin: unknown = JSON.parse(
    await fs.readFile(path.join(source, 'plugin.json'), 'utf8'),
  );
  if (
    !isRecord(plugin) ||
    typeof plugin.name !== 'string' ||
    !plugin.name.trim() ||
    typeof plugin.version !== 'string' ||
    !plugin.version.trim()
  )
    throw new Error('plugin.json requires non-empty name and version fields');
  const resources = options.resources ?? [];
  if (!Array.isArray(resources))
    throw new Error('Plugin resources must be an array of relative paths');
  for (const resource of resources) {
    if (
      typeof resource !== 'string' ||
      !resource ||
      resource.includes('\\') ||
      resource
        .split('/')
        .some(part => !part || part === '.' || part === '..') ||
      path.isAbsolute(resource) ||
      ['plugin.json', 'mcp.json'].includes(resource.split('/')[0])
    )
      throw new Error(`Invalid plugin resource path: ${resource}`);
    // Check ancestors too: a nested resource must not traverse a symbolic link.
    const parts = resource.split('/');
    for (let index = 1; index < parts.length; index++) {
      const parent = parts.slice(0, index).join('/');
      if ((await fs.lstat(path.join(source, parent))).isSymbolicLink())
        throw new Error(
          `Plugin package does not support symbolic links: ${parent}`,
        );
    }
    await collect(resource);
  }

  await fs.mkdir(distDirectory, { recursive: true });
  const staging = await fs.mkdtemp(path.join(distDirectory, '.mcp-plugin-'));
  try {
    for (const filename of files) {
      const destination = path.join(staging, filename);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(path.join(source, filename), destination);
    }
    await fs.writeFile(
      path.join(staging, 'mcp.json'),
      `${JSON.stringify(
        {
          $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
          mcpServers: resolvedServers,
        },
        null,
        2,
      )}\n`,
    );
    await fs.rm(output, { recursive: true, force: true });
    await fs.rename(staging, output);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}
