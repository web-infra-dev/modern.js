import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  type JsonSchema,
  type ToolConfig,
  type McpAppsViewDefaults,
  type McpAppsDefinition,
  type NormalizedToolConfig,
  type RemoteConfig,
} from './config';

export const UI_MIME_TYPE = 'text/html;profile=mcp-app';
// The runtime build exports HTML as JavaScript so dependency tracing keeps it.
export async function readRuntimeHtml(development = false): Promise<string> {
  const runtime = development
    ? await import('../dist/runtime/mcp-app.dev.runtime.mjs')
    : await import('../dist/runtime/mcp-app.runtime.mjs');
  return runtime.default;
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
        `Tool "${tool.name}" references missing remote "${tool.remote}". Configure remotes[] with an explicit manifest baseUrl.`,
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
    tools: definition.tools.map(tool => {
      if (
        !tool.view ||
        tool.remote ||
        (tool.view.html &&
          (!options.manifest || tool.view.html.startsWith('https://')))
      )
        return tool;
      const entry = Object.hasOwn(manifest.tools, tool.name)
        ? manifest.tools[tool.name]
        : undefined;
      if (!entry)
        throw new Error(`Missing MCP UI manifest entry: ${tool.name}`);
      if (
        entry.resourceUri !== `ui://local/${encodeURIComponent(tool.name)}` ||
        entry.mimeType !== UI_MIME_TYPE ||
        typeof entry.html !== 'string' ||
        !entry.html
      ) {
        throw new Error(`MCP UI manifest mismatch for tool: ${tool.name}`);
      }
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

// Full JSON Schemas take precedence over property maps to avoid reinterpreting
// existing definitions (including schemas without an explicit object type).
const schemaKeywords = [
  '$schema',
  '$id',
  '$ref',
  '$defs',
  '$anchor',
  '$dynamicRef',
  '$dynamicAnchor',
  'type',
  'properties',
  'required',
  'additionalProperties',
  'patternProperties',
  'propertyNames',
  'dependentRequired',
  'dependentSchemas',
  'unevaluatedProperties',
  'minProperties',
  'maxProperties',
  'items',
  'prefixItems',
  'contains',
  'unevaluatedItems',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minContains',
  'maxContains',
  'enum',
  'const',
  'anyOf',
  'oneOf',
  'allOf',
  'not',
  'if',
  'then',
  'else',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
  'format',
  'pattern',
  'minLength',
  'maxLength',
  'contentEncoding',
  'contentMediaType',
  'contentSchema',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  '$comment',
  '$vocabulary',
  'definitions',
  'dependencies',
  'additionalItems',
] as const;

export type InputSchemaKeyword = (typeof schemaKeywords)[number];
const schemaKeywordSet = new Set<string>(schemaKeywords);

function isInputPropertyMap(schema: JsonSchema): boolean {
  const entries = Object.entries(schema);
  return (
    entries.length > 0 &&
    entries.every(
      ([key, value]) =>
        !schemaKeywordSet.has(key) &&
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value),
    )
  );
}

/** Expand shorthand once at normalization; nested fields use standard JSON Schema. */
export function normalizeInputSchema(
  schema: JsonSchema | undefined,
): JsonSchema | undefined {
  if (!schema || !isInputPropertyMap(schema)) return schema;
  const properties: JsonSchema = {};
  const required: string[] = [];
  for (const [name, value] of Object.entries(schema)) {
    const { optional, ...property } = value as JsonSchema;
    if (optional !== undefined && typeof optional !== 'boolean') {
      throw new Error(`Input property "${name}" optional must be a boolean`);
    }
    Object.defineProperty(properties, name, {
      value: property,
      enumerable: true,
    });
    if (optional !== true) required.push(name);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}

export function normalizeToolConfig(
  input: ToolConfig,
  defaults?: McpAppsViewDefaults,
): NormalizedToolConfig {
  let tool = input;
  if (tool.view && defaults) {
    const view = {
      ...tool.view,
      assetBase: tool.view.assetBase ?? defaults.assetBase,
      exportName: tool.view.exportName ?? defaults.exportName,
      renderMode: tool.view.renderMode ?? defaults.renderMode,
      runtime: tool.view.runtime ?? defaults.runtime,
      permissions: tool.view.permissions ?? defaults.permissions,
      domain: tool.view.domain ?? defaults.domain,
      prefersBorder: tool.view.prefersBorder ?? defaults.prefersBorder,
      capabilities: tool.view.capabilities ?? defaults.capabilities,
      csp:
        defaults.csp || tool.view.csp
          ? { ...defaults.csp, ...tool.view.csp }
          : undefined,
    };
    tool = { ...tool, view };
  }
  const legacyView =
    tool.module !== undefined
      ? {
          module: tool.module,
          exportName: tool.exportName ?? 'default',
          renderMode: tool.renderMode ?? 'component',
        }
      : undefined;
  const explicitView = tool.view
    ? {
        module: tool.view.module,
        exportName: tool.view.exportName ?? 'default',
        renderMode: tool.view.renderMode ?? 'component',
        runtime: tool.view.runtime,
        html: tool.view.html,
        assetBase: tool.view.assetBase,
        csp: tool.view.csp,
        permissions: tool.view.permissions,
        domain: tool.view.domain,
        prefersBorder: tool.view.prefersBorder,
        capabilities: tool.view.capabilities,
      }
    : undefined;
  const handler =
    typeof tool.handler === 'function'
      ? tool.handler
      : tool.handler
        ? {
            module: tool.handler.module,
            exportName: tool.handler.exportName ?? 'default',
            runtime: tool.handler.runtime ?? 'local',
            timeoutMs: tool.handler.timeoutMs,
          }
        : undefined;

  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: normalizeInputSchema(tool.inputSchema),
    outputSchema: tool.outputSchema,
    annotations: tool.annotations,
    _meta: tool._meta,
    remote: tool.remote,
    view: explicitView ?? legacyView,
    handler,
    visibility: tool.visibility,
  };
}
