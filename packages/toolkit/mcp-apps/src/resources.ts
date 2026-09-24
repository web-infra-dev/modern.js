import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McpAppsDefinition } from './config';
import { normalizeToolConfig } from './definition';

export const UI_MIME_TYPE = 'text/html;profile=mcp-app';
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const htmlPromises = new Map<string, Promise<string>>();
export function readRuntimeHtml(development = false): Promise<string> {
  const filename = development ? 'mcp-app.dev.html' : 'mcp-app.html';
  const existing = htmlPromises.get(filename);
  if (existing) return existing;
  const pending = fs
    .readFile(path.resolve(moduleDirectory, '../runtime', filename), 'utf8')
    .catch(async error => {
      // Source-condition tests use the same built artifact as the published server.
      if (error.code !== 'ENOENT') throw error;
      return fs.readFile(
        path.resolve(moduleDirectory, '../dist/runtime', filename),
        'utf8',
      );
    });
  htmlPromises.set(filename, pending);
  pending.catch(() => {
    if (htmlPromises.get(filename) === pending) htmlPromises.delete(filename);
  });
  return pending;
}

export function validateMcpAppsConfig(config: McpAppsDefinition): void {
  if (
    !Array.isArray(config.remotes) ||
    !Array.isArray(config.tools) ||
    !config.tools.length
  ) {
    throw new Error('mcp_apps requires remotes and at least one tool');
  }
  const names = new Set<string>();
  for (const remote of config.remotes) {
    if (!remote.name || names.has(remote.name))
      throw new Error('Remote names must be non-empty and unique');
    names.add(remote.name);
    for (const address of [
      remote.baseUrl,
      remote.browserEntry,
      remote.serverEntry,
      remote.snapshotUrl,
    ]) {
      if (address === undefined) continue;
      const url = new URL(
        address.startsWith('//') ? `https:${address}` : address,
      );
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error(`Invalid remote URL: ${address}`);
    }
    if (!remote.baseUrl)
      throw new Error(`Remote "${remote.name}" requires baseUrl`);
    if (remote.manifestType && !['mf', 'vmok'].includes(remote.manifestType))
      throw new Error('Unsupported manifestType');
  }
  for (const tool of config.tools.map(normalizeToolConfig)) {
    if (tool.remote !== undefined && !names.has(tool.remote))
      throw new Error(
        `Tool "${tool.name}" references missing remote "${tool.remote}"`,
      );
    if (!tool.view && !tool.handler)
      throw new Error(`Tool "${tool.name}" must define a view or handler`);
    if (tool.view && !tool.view.module)
      throw new Error(`Tool "${tool.name}" view requires module`);
    if (tool.view && !['component', 'mount'].includes(tool.view.renderMode))
      throw new Error('Unsupported renderMode');
    if (tool.view?.runtime && tool.view.runtime !== 'browser')
      throw new Error('Unsupported view runtime');
    if (
      tool.handler &&
      typeof tool.handler !== 'function' &&
      (!tool.handler.module ||
        !['local', 'vmok-server'].includes(tool.handler.runtime ?? 'local'))
    )
      throw new Error(`Invalid handler for "${tool.name}"`);
    if (
      typeof tool.handler !== 'function' &&
      tool.handler?.runtime === 'vmok-server' &&
      !config.remotes.find(remote => remote.name === tool.remote)?.serverEntry
    )
      throw new Error('vmok-server requires a remote with serverEntry');
  }
}

export function createUiResources(definition: McpAppsDefinition) {
  const normalized = definition.tools.map(normalizeToolConfig);
  const resources = new Map<
    string,
    {
      name: string;
      uri: string;
      mimeType: string;
      _meta: { ui: Record<string, unknown> };
    }
  >();
  const toolUris = new Map<string, string>();
  const uriOwners = new Map<string, string>();
  for (const remote of definition.remotes) {
    const uri = `ui://mf/${remote.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const csp = {
      connectDomains: remote.csp?.connectDomains ?? [],
      resourceDomains: remote.csp?.resourceDomains ?? [],
      ...(remote.csp?.frameDomains?.length
        ? { frameDomains: remote.csp.frameDomains }
        : {}),
      ...(remote.csp?.baseUriDomains?.length
        ? { baseUriDomains: remote.csp.baseUriDomains }
        : {}),
    };
    const ui = {
      csp,
      ...(remote.permissions ? { permissions: remote.permissions } : {}),
      ...(remote.domain ? { domain: remote.domain } : {}),
      prefersBorder: remote.prefersBorder ?? true,
    };
    const put = (resourceUri: string, owner: string) => {
      if (uriOwners.has(resourceUri))
        throw new Error(`UI resource URI collision: ${resourceUri}`);
      uriOwners.set(resourceUri, owner);
      resources.set(resourceUri, {
        name: owner,
        uri: resourceUri,
        mimeType: UI_MIME_TYPE,
        _meta: { ui },
      });
    };
    put(uri, remote.name);
    for (const tool of normalized.filter(
      tool => tool.remote === remote.name && tool.view,
    )) {
      const toolUri = `${uri}/${tool.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
      put(toolUri, `${remote.name}/${tool.name}`);
      toolUris.set(tool.name, toolUri);
    }
  }
  for (const tool of normalized.filter(tool => tool.view && !tool.remote)) {
    const uri = `ui://local/${encodeURIComponent(tool.name)}`;
    resources.set(uri, {
      name: tool.name,
      uri,
      mimeType: UI_MIME_TYPE,
      _meta: {
        ui: {
          csp: tool.view?.csp ?? { connectDomains: [], resourceDomains: [] },
          prefersBorder: true,
        },
      },
    });
    toolUris.set(tool.name, uri);
  }
  return { resources, toolUris };
}
