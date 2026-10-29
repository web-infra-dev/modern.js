import type { McpUiResourceMeta } from '@modelcontextprotocol/ext-apps';

export type UiMetadata = McpUiResourceMeta;
export interface McpViewsConfig extends UiMetadata {
  views: Record<string, string | { expose: string }>;
}
export interface UiManifest {
  version: 1;
  assetBase: string;
  remotes: Record<string, { entry: string; shell: string }>;
  views: Record<
    string,
    ({ html: string } | { remote: string; expose: string }) & { ui: UiMetadata }
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
  for (const key of Object.keys(value)) {
    if (
      !['views', 'csp', 'prefersBorder', 'permissions', 'domain'].includes(key)
    )
      throw new Error(`Unknown MCP views option: ${key}`);
  }
  for (const [name, view] of Object.entries(value.views)) {
    if (!name.trim()) throw new Error('View names must be non-empty');
    if (typeof view === 'string' && view.trim()) continue;
    if (
      isRecord(view) &&
      typeof view.expose === 'string' &&
      view.expose.startsWith('./') &&
      Object.keys(view).length === 1
    )
      continue;
    throw new Error(
      `Invalid view: ${name}. Use a component path or { expose: './Name' }`,
    );
  }
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
    if ('html' in view && !('remote' in view) && !('expose' in view))
      checkSource(view.html);
    else if (
      !('html' in view) &&
      typeof view.remote === 'string' &&
      Object.hasOwn(value.remotes, view.remote) &&
      typeof view.expose === 'string' &&
      view.expose.startsWith('./')
    )
      continue;
    else throw new Error(`Invalid UI manifest view: ${name}`);
  }
}
