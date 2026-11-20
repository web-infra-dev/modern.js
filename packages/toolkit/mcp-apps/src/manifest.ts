import type { Tool } from '@modelcontextprotocol/server';
import { McpUiToolMetaSchema } from '@modelcontextprotocol/ext-apps/app-bridge';
import type { McpUiResourceMeta } from '@modelcontextprotocol/ext-apps';

export type UiMetadata = McpUiResourceMeta;
/** Defaults used when registering tools that reference a compiled view. */
export interface UiToolConfig extends Partial<
  Pick<Tool, 'name' | 'title' | 'annotations' | 'icons'>
> {
  _meta?: Record<string, unknown>;
}
export type McpViewSource =
  | string
  | (({ component: string } | { expose: string; remote?: string }) & {
      tool?: UiToolConfig;
    });
export interface McpViewsConfig extends UiMetadata {
  /** Default deployed MF remote for expose views. Individual views may override it. */
  remote?: string;
  /** A component path, an expose of this application, or an expose of a deployed remote. */
  views: Record<string, McpViewSource>;
}
export interface UiManifest {
  version: 1;
  /** Self-contained local HTML, without an HTTP asset base. */
  inline?: boolean;
  assetBase: string;
  remotes: Record<string, { entry: string; shell: string }>;
  views: Record<
    string,
    (
      { html: string; inline?: boolean } | { remote: string; expose: string }
    ) & { ui: UiMetadata; tool?: UiToolConfig }
  >;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function validateUiMetadata(
  value: unknown,
): asserts value is UiMetadata {
  if (!isRecord(value)) throw new Error('UI metadata must be an object');
  if (
    value.prefersBorder !== undefined &&
    typeof value.prefersBorder !== 'boolean'
  )
    throw new Error('prefersBorder must be a boolean');
  if (value.domain !== undefined && typeof value.domain !== 'string')
    throw new Error('domain must be a string');
  if (value.permissions !== undefined && !isRecord(value.permissions))
    throw new Error('permissions must be an object');
  if (value.csp !== undefined) {
    if (!isRecord(value.csp)) throw new Error('csp must be an object');
    for (const [key, domains] of Object.entries(value.csp)) {
      if (
        ![
          'resourceDomains',
          'connectDomains',
          'frameDomains',
          'baseUriDomains',
        ].includes(key) ||
        !Array.isArray(domains) ||
        domains.some(domain => typeof domain !== 'string')
      )
        throw new Error(`Invalid CSP field: ${key}`);
    }
  }
}
export function validateViewsConfig(
  value: unknown,
): asserts value is McpViewsConfig {
  if (!isRecord(value) || !isRecord(value.views))
    throw new Error('mcp-views.json requires a views object');
  validateUiMetadata(value);
  if (value.remote !== undefined) {
    if (typeof value.remote !== 'string')
      throw new Error('remote must be a string');
    assertRemoteManifest(value.remote);
  }
  for (const key of Object.keys(value)) {
    if (
      ![
        'views',
        'remote',
        'csp',
        'prefersBorder',
        'permissions',
        'domain',
      ].includes(key)
    )
      throw new Error(`Unknown MCP views option: ${key}`);
  }
  for (const [name, view] of Object.entries(value.views)) {
    if (!name.trim()) throw new Error('View names must be non-empty');
    if (typeof view === 'string' && view.trim()) continue;
    if (isRecord(view)) {
      validateUiToolConfig(view.tool);
      const keys = Object.keys(view).filter(key => key !== 'tool');
      if (
        typeof view.component === 'string' &&
        view.component.trim() &&
        keys.length === 1
      )
        continue;
      if (
        typeof view.expose === 'string' &&
        view.expose.startsWith('./') &&
        keys.every(key => key === 'expose' || key === 'remote')
      ) {
        if (!('remote' in view)) continue;
        if (typeof view.remote === 'string') {
          assertRemoteManifest(view.remote);
          continue;
        }
      }
    }
    throw new Error(
      `Invalid view: ${name}. Use a component path, { component: './View.tsx', tool: {} }, { expose: './Name' } or { remote: 'https://host/mf-manifest.json', expose: './Name' }`,
    );
  }
}
/** Namespaced metadata is carried unchanged. Hosts validate their own extension fields. */
export function validateUiToolConfig(
  value: unknown,
): asserts value is UiToolConfig | undefined {
  if (value === undefined) return;
  if (
    !isRecord(value) ||
    Object.keys(value).some(
      key => !['_meta', 'name', 'title', 'annotations', 'icons'].includes(key),
    )
  )
    throw new Error('Invalid view tool configuration');
  for (const key of ['name', 'title'] as const) {
    if (
      value[key] !== undefined &&
      (typeof value[key] !== 'string' || !value[key].trim())
    )
      throw new Error(`Tool ${key} must be a non-empty string`);
  }
  if (value.annotations !== undefined) {
    if (!isRecord(value.annotations))
      throw new Error('Tool annotations must be an object');
    if (
      value.annotations.title !== undefined &&
      typeof value.annotations.title !== 'string'
    )
      throw new Error('Tool annotations.title must be a string');
    for (const key of [
      'readOnlyHint',
      'destructiveHint',
      'idempotentHint',
      'openWorldHint',
    ]) {
      if (
        value.annotations[key] !== undefined &&
        typeof value.annotations[key] !== 'boolean'
      )
        throw new Error(`Tool annotations.${key} must be a boolean`);
    }
  }
  if (
    value.icons !== undefined &&
    (!Array.isArray(value.icons) ||
      value.icons.some(
        icon =>
          !isRecord(icon) ||
          typeof icon.src !== 'string' ||
          !icon.src ||
          (icon.mimeType !== undefined && typeof icon.mimeType !== 'string') ||
          (icon.sizes !== undefined &&
            (!Array.isArray(icon.sizes) ||
              icon.sizes.some(size => typeof size !== 'string'))) ||
          (icon.theme !== undefined &&
            !['light', 'dark'].includes(String(icon.theme))),
      ))
  )
    throw new Error('Invalid tool icons');
  if (value._meta !== undefined) {
    if (!isRecord(value._meta)) throw new Error('Tool _meta must be an object');
    const ui = value._meta.ui;
    if (ui !== undefined && !isRecord(ui))
      throw new Error('Tool ui metadata must be an object');
    if (ui !== undefined) McpUiToolMetaSchema.parse(ui);
    if (isRecord(ui) && 'url' in ui)
      throw new Error('Use a namespaced UI url instead of ui.url');
    if (isRecord(ui) && ui.resourceUri !== undefined) {
      if (
        typeof ui.resourceUri !== 'string' ||
        !ui.resourceUri ||
        ui.resourceUri.trim() !== ui.resourceUri
      )
        throw new Error('Tool resourceUri must be an absolute URI');
      if (
        !ui.resourceUri.startsWith('ui://') ||
        new URL(ui.resourceUri).protocol !== 'ui:'
      )
        throw new Error('Tool resourceUri must use ui://');
    }
    for (const [namespace, metadata] of Object.entries(value._meta)) {
      if (!namespace.endsWith('/ui')) continue;
      if (!isRecord(metadata))
        throw new Error('Namespaced UI metadata must be an object');
      if (metadata.url === undefined) continue;
      if (isRecord(ui) && ui.resourceUri !== undefined)
        throw new Error('Tool url and resourceUri are mutually exclusive');
      if (
        typeof metadata.url !== 'string' ||
        !metadata.url ||
        metadata.url.trim() !== metadata.url ||
        /[\u0000-\u001f\u007f]/.test(metadata.url) ||
        metadata.url.includes('\\')
      )
        throw new Error('Invalid tool UI URL');
      if (metadata.url.startsWith('/') && !metadata.url.startsWith('//'))
        continue;
      assertHttpUrl(metadata.url);
    }
  }
}

/**
 * A deployed MF remote must be a manifest URL. The MF runtime finds the
 * container through the manifest only for `.json` entries. Any other entry
 * would need the remote's real MF name.
 */
export function assertRemoteManifest(remote: string) {
  if (
    !/^https?:\/\//.test(remote) ||
    !assertHttpUrl(remote).pathname.endsWith('.json')
  )
    throw new Error(
      `Invalid MF remote: ${remote}. Use https://host/mf-manifest.json`,
    );
}
export function assertHttpUrl(source: string): URL {
  const url = new URL(source);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error(`Invalid UI URL: ${source}`);
  return url;
}
export function validateUiManifest(
  value: unknown,
): asserts value is UiManifest {
  if (!isRecord(value) || value.version !== 1)
    throw new Error('Unsupported MCP UI manifest version');
  if (
    typeof value.assetBase !== 'string' ||
    !value.assetBase ||
    !isRecord(value.remotes) ||
    !isRecord(value.views)
  )
    throw new Error('Invalid MCP UI manifest');
  if (value.inline !== undefined && typeof value.inline !== 'boolean')
    throw new Error('inline must be a boolean');
  if (value.assetBase !== 'request') assertHttpUrl(value.assetBase);
  const checkSource = (source: unknown) => {
    if (typeof source !== 'string' || !source)
      throw new Error('Missing UI resource source');
    if (/^https?:\/\//.test(source)) assertHttpUrl(source);
    else if (
      source.startsWith('/') ||
      source.includes('\\') ||
      decodeURIComponent(source).split('/').includes('..') ||
      /^[a-z][\w+.-]*:/i.test(source) ||
      /[?#]/.test(source)
    )
      throw new Error(`Invalid relative UI resource: ${source}`);
  };
  for (const remote of Object.values(value.remotes)) {
    if (!isRecord(remote)) throw new Error('Invalid MF remote');
    checkSource(remote.entry);
    checkSource(remote.shell);
  }
  for (const [name, view] of Object.entries(value.views)) {
    if (!name.trim() || !isRecord(view)) throw new Error('Invalid UI view');
    validateUiMetadata(view.ui);
    validateUiToolConfig(view.tool);
    if ('html' in view && !('remote' in view) && !('expose' in view)) {
      if (view.inline !== undefined && typeof view.inline !== 'boolean')
        throw new Error(`Invalid inline option on UI manifest view: ${name}`);
      checkSource(view.html);
    } else if (
      !('html' in view) &&
      view.inline === undefined &&
      typeof view.remote === 'string' &&
      Object.hasOwn(value.remotes, view.remote) &&
      typeof view.expose === 'string' &&
      view.expose.startsWith('./')
    )
      continue;
    else throw new Error(`Invalid UI manifest view: ${name}`);
  }
}
