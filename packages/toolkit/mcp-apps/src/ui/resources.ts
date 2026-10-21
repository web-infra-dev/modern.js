import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  type McpAppsDefinition,
  type NormalizedToolConfig,
  type RemoteConfig,
} from '../configuration/index';
import { normalizeToolConfig } from '../configuration/normalize';

function appResourceUri(toolName: string): string {
  return `ui://app/${encodeURIComponent(toolName)}`;
}

export const UI_MIME_TYPE = 'text/html;profile=mcp-app';
// The runtime build exports HTML as JavaScript so dependency tracing keeps it.
export async function readRuntimeHtml(development = false): Promise<string> {
  const runtime = development
    ? await import('../../dist/runtime/mcp-app.dev.runtime.mjs')
    : await import('../../dist/runtime/mcp-app.runtime.mjs');
  return runtime.default;
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
    const uri = `ui://mf/app/${encodeURIComponent(remote.name)}`;
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
      const toolUri = `${uri}/${encodeURIComponent(tool.name)}`;
      put(toolUri, `${remote.name}/${tool.name}`);
      toolUris.set(tool.name, toolUri);
    }
  }
  for (const tool of normalized.filter(tool => tool.view && !tool.remote)) {
    const uri = appResourceUri(tool.name);
    resources.set(uri, {
      name: tool.name,
      uri,
      mimeType: UI_MIME_TYPE,
      _meta: {
        ui: {
          csp: tool.view?.csp ?? { connectDomains: [], resourceDomains: [] },
          prefersBorder: tool.view?.prefersBorder ?? true,
          ...(tool.view?.permissions
            ? { permissions: tool.view.permissions }
            : {}),
          ...(tool.view?.domain ? { domain: tool.view.domain } : {}),
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
    tools: definition.tools.map(input => {
      const tool = normalizeToolConfig(input, definition.viewDefaults);
      if (!tool.view || tool.remote) return input;
      const entry = Object.hasOwn(manifest.tools, tool.name)
        ? manifest.tools[tool.name]
        : undefined;
      // Explicit source HTML keeps its location, but still needs the public
      // asset base when served inside a host's sandbox.
      if (
        tool.view.html &&
        (!options.manifest || tool.view.html.startsWith('https://'))
      ) {
        return {
          ...input,
          view: {
            ...tool.view,
            assetBase:
              tool.view.assetBase ??
              definition.viewDefaults?.assetBase ??
              entry?.assetBase ??
              options.assetBase,
          },
        };
      }
      if (!entry)
        throw new Error(`Missing MCP UI manifest entry: ${tool.name}`);
      if (
        entry.resourceUri !== appResourceUri(tool.name) ||
        entry.mimeType !== UI_MIME_TYPE ||
        typeof entry.html !== 'string' ||
        !entry.html
      ) {
        throw new Error(`MCP UI manifest mismatch for tool: ${tool.name}`);
      }
      return {
        ...input,
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
    tools: definition.tools
      .map(tool => normalizeToolConfig(tool, definition.viewDefaults))
      .filter(tool => tool.view && !tool.remote),
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
  options: { directory: string; assetBase?: string; signal?: AbortSignal },
) {
  if (manifest.version !== 1)
    throw new Error('Unsupported MCP UI manifest version');
  const entry = Object.hasOwn(manifest.tools, toolName)
    ? manifest.tools[toolName]
    : undefined;
  if (!entry) throw new Error(`Unknown MCP UI tool: ${toolName}`);
  const text = await readHtmlSource(entry.html, options);
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
    if (!/<head\b[^>]*>/i.test(text))
      throw new Error(
        'MCP UI HTML requires a <head> element when using assetBase',
      );
    // assetBase represents a directory, even when its trailing slash is omitted.
    if (!url.pathname.endsWith('/')) url.pathname += '/';
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
          ['resourceDomains', 'baseUriDomains'].map(key => [
            key,
            [...new Set([...(csp[key] ?? []), url.origin])],
          ]),
        ),
      },
    };
  }
  return { text, ui };
}

export function createMcpAppsViewResource({
  remote,
  toolConfig,
  resourceUri,
  serverUrl,
}: {
  remote?: RemoteConfig;
  toolConfig: NormalizedToolConfig;
  resourceUri: string;
  serverUrl?: string;
}) {
  if (!toolConfig.view) {
    return undefined;
  }
  if (!remote)
    return {
      mimeType: UI_MIME_TYPE,
      resourceUri,
      csp: toolConfig.view.csp,
    };
  return {
    mimeType: UI_MIME_TYPE,
    moduleFederation: {
      remoteName: toolConfig.remote,
      remoteEntry: remote.browserEntry ?? remote.baseUrl,
      module: toolConfig.view.module,
      exportName: toolConfig.view.exportName,
      renderMode: toolConfig.view.renderMode,
      mcpServerUrl: serverUrl,
      resourceUri,
    },
    csp: remote.csp,
  };
}

/** Read compiled UI HTML, honoring cancellation for both HTTP and file reads. */
export async function readHtmlSource(
  source: string,
  options: { directory?: string; signal?: AbortSignal } = {},
): Promise<string> {
  options.signal?.throwIfAborted();
  if (source.startsWith('https://')) {
    const timeout = AbortSignal.timeout(30_000);
    const response = await fetch(source, {
      signal: options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout,
    });
    if (!response.ok)
      throw new Error(`UI HTML request failed: ${response.status}`);
    return response.text();
  }
  if (!path.isAbsolute(source) && !options.directory)
    throw new Error('Compiled local view requires configPath');
  const file = path.isAbsolute(source)
    ? source
    : path.resolve(options.directory!, source);
  return fs.readFile(file, { encoding: 'utf8', signal: options.signal });
}
