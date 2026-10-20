import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
    for (const address of [remote.baseUrl, remote.browserEntry]) {
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
  }
  for (const tool of config.tools.map(tool =>
    normalizeToolConfig(tool, config.viewDefaults),
  )) {
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
      (!tool.handler.module || (tool.handler.runtime ?? 'local') !== 'local')
    )
      throw new Error(`Invalid handler for "${tool.name}"`);
  }
}

export function createUiResources(definition: McpAppsDefinition) {
  const normalized = definition.tools.map(tool =>
    normalizeToolConfig(tool, definition.viewDefaults),
  );
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

export function getUiEntryName(toolName: string) {
  return `mcp-ui-${createHash('sha256').update(toolName).digest('hex').slice(0, 12)}`;
}

/** Attach application-emitted HTML without changing tool handlers or imports. */
export function bindUiResources(
  definition: McpAppsDefinition,
  options: { directory: string; assetBase?: string; manifest?: McpUiManifest },
): McpAppsDefinition {
  const manifest =
    options.manifest ??
    createUiManifest(definition, { assetBase: options.assetBase });
  if (manifest.version !== 1)
    throw new Error('Unsupported MCP UI manifest version');
  return {
    ...definition,
    tools: definition.tools.map(tool => {
      if (!tool.view || tool.remote || tool.view.html) return tool;
      const entry = Object.hasOwn(manifest.tools, tool.name)
        ? manifest.tools[tool.name]
        : undefined;
      if (!entry)
        throw new Error(`Missing MCP UI manifest entry: ${tool.name}`);
      return {
        ...tool,
        view: {
          ...tool.view,
          html: entry.html.startsWith('https://')
            ? entry.html
            : options.manifest
              ? path.resolve(options.directory, '..', entry.html)
              : path.join(options.directory, path.basename(entry.html)),
          assetBase:
            tool.view.assetBase ??
            definition.viewDefaults?.assetBase ??
            entry.assetBase,
        },
      };
    }),
  };
}

/** Portable mapping for locally built views. Paths are relative to the manifest. */
export interface McpUiManifest {
  version: 1;
  tools: Record<
    string,
    {
      resourceUri: string;
      mimeType: typeof UI_MIME_TYPE;
      html: string;
      assetBase?: string;
      ui: Record<string, unknown>;
    }
  >;
}

export function createUiManifest(
  definition: McpAppsDefinition,
  options: { assetBase?: string } = {},
): McpUiManifest {
  const local = {
    ...definition,
    remotes: [],
    tools: definition.tools.filter(tool => tool.view && !tool.remote),
  };
  const { resources, toolUris } = createUiResources(local);
  const tools: McpUiManifest['tools'] = Object.create(null);
  for (const input of local.tools) {
    if (Object.hasOwn(tools, input.name))
      throw new Error(`Duplicate MCP UI tool: ${input.name}`);
    const tool = normalizeToolConfig(input, definition.viewDefaults);
    const uri = toolUris.get(tool.name)!;
    tools[tool.name] = {
      resourceUri: uri,
      mimeType: UI_MIME_TYPE,
      html: tool.view!.html ?? `./ui/${getUiEntryName(tool.name)}.html`,
      assetBase: tool.view!.assetBase ?? options.assetBase,
      ui: resources.get(uri)!._meta.ui,
    };
  }
  return { version: 1, tools };
}

/** Read a local view for resources/read. assetBase is the publicly served asset root. */
export async function readUiManifestResource(
  manifest: McpUiManifest,
  toolName: string,
  options: { directory: string; assetBase?: string },
) {
  if (manifest.version !== 1)
    throw new Error('Unsupported MCP UI manifest version');
  const entry = Object.hasOwn(manifest.tools, toolName)
    ? manifest.tools[toolName]
    : undefined;
  if (!entry) throw new Error(`Unknown MCP UI tool: ${toolName}`);
  let text: string;
  if (entry.html.startsWith('https://')) {
    const response = await fetch(entry.html, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`UI HTML request failed: ${response.status}`);
    text = await response.text();
  } else {
    text = await fs.readFile(
      path.resolve(options.directory, entry.html),
      'utf8',
    );
  }
  const resolved = resolveUiHtml(
    text,
    entry.ui,
    options.assetBase ?? entry.assetBase,
  );
  return {
    uri: entry.resourceUri,
    mimeType: entry.mimeType,
    text: resolved.text,
    _meta: { ui: resolved.ui },
  };
}

/** Apply the public asset root consistently for integrated and custom servers. */
export function resolveUiHtml(
  text: string,
  ui: Record<string, unknown>,
  base?: string,
) {
  if (base) {
    if (base === 'request')
      throw new Error(
        'Pass a public assetBase when reading request-relative UI resources',
      );
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('Invalid MCP UI asset base');
    const escaped = url.href
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
    text = text.replace(
      /<head\b[^>]*>/i,
      head => `${head}<base href="${escaped}">`,
    );
    const csp = (ui.csp ?? {}) as Record<string, string[]>;
    ui = {
      ...ui,
      csp: {
        ...csp,
        ...Object.fromEntries(
          ['resourceDomains', 'connectDomains', 'baseUriDomains'].map(key => [
            key,
            [...new Set([...(csp[key] ?? []), url.origin])],
          ]),
        ),
      },
    };
  }
  return { text, ui };
}
