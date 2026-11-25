import fs from 'node:fs/promises';
import path from 'node:path';
import { assertHttpUrl, isRecord } from '../manifest';

export interface McpHttpServerConfig {
  type: 'streamable-http';
  /** Public deployed endpoint, including the MCP route. */
  url: string;
}

export interface PluginPackageOptions {
  /** Source package directory relative to the app root. Defaults to 'plugin'. */
  directory?: string;
}

/** Package user-owned declarations separately from the deployed application. */
export async function buildPluginPackage(
  appDirectory: string,
  distDirectory: string,
  servers: Record<string, McpHttpServerConfig>,
  options: PluginPackageOptions = {},
) {
  if (!isRecord(servers) || !Object.keys(servers).length)
    throw new Error('mcpServers must contain at least one HTTP MCP server');
  for (const [name, server] of Object.entries(servers)) {
    if (
      !name.trim() ||
      !isRecord(server) ||
      server.type !== 'streamable-http' ||
      typeof server.url !== 'string' ||
      server.url.trim() !== server.url ||
      !/^https?:\/\//.test(server.url) ||
      /[\u0000-\u0020\u007f\\]/.test(server.url) ||
      Object.keys(server).some(key => !['type', 'url'].includes(key))
    )
      throw new Error(`Invalid HTTP MCP server configuration: ${name}`);
    const url = assertHttpUrl(server.url);
    if (url.hash)
      throw new Error(`MCP server URL must not contain a fragment: ${name}`);
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
  if (
    await fs.lstat(path.join(source, 'com.doubao')).then(
      () => true,
      error => {
        if (error.code === 'ENOENT') return false;
        throw error;
      },
    )
  )
    await collect('com.doubao');

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
          mcpServers: servers,
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
