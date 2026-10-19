import { createHash } from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { McpAppsDefinition } from './config';
import { normalizeToolConfig } from './definition';
import { createUiResources, UI_MIME_TYPE } from './resources';

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
    text = await readFile(path.resolve(options.directory, entry.html), 'utf8');
  }
  const base = options.assetBase ?? entry.assetBase;
  let ui = entry.ui;
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
  return {
    uri: entry.resourceUri,
    mimeType: entry.mimeType,
    text,
    _meta: { ui },
  };
}
