import type { McpUiResourceMeta } from '@modelcontextprotocol/ext-apps';

export type UiMetadata = McpUiResourceMeta & Record<string, unknown>;
/** Native resource declaration. Unknown resource and host metadata fields are retained. */
export interface UiResourceConfig extends Record<string, unknown> {
  uri?: string;
  mimeType?: string;
  _meta?: Record<string, unknown> & { ui?: UiMetadata };
}
export type McpViewSource =
  | string
  | (({ component: string } | { expose: string; remote?: string }) & {
      resource?: UiResourceConfig;
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
    ) & { ui: UiMetadata; resource?: UiResourceConfig }
  >;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function validateUiMetadata(
  value: unknown,
  allowExtensions = false,
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
        allowExtensions &&
        ![
          'resourceDomains',
          'connectDomains',
          'frameDomains',
          'baseUriDomains',
        ].includes(key)
      )
        continue;
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
/** Merge resource UI overrides while retaining the domains required by the page. */
export function mergeUiMetadata(
  defaults: UiMetadata,
  configured?: UiMetadata,
): UiMetadata {
  if (!configured) return structuredClone(defaults);
  const ui: UiMetadata = { ...defaults, ...configured };
  if (defaults.csp || configured.csp) {
    ui.csp = { ...defaults.csp, ...configured.csp };
    for (const key of [
      'resourceDomains',
      'connectDomains',
      'frameDomains',
      'baseUriDomains',
    ] as const) {
      if (defaults.csp?.[key] || configured.csp?.[key])
        ui.csp[key] = [
          ...new Set([
            ...(defaults.csp?.[key] ?? []),
            ...(configured.csp?.[key] ?? []),
          ]),
        ];
    }
  }
  return structuredClone(ui);
}

function validateResourceConfig(
  value: unknown,
): asserts value is UiResourceConfig | undefined {
  if (value === undefined) return;
  if (!isRecord(value)) throw new Error('View resource must be an object');
  if ('text' in value || 'blob' in value)
    throw new Error(
      'View resource content is generated from its component or expose',
    );
  if (value.uri !== undefined) {
    if (
      typeof value.uri !== 'string' ||
      value.uri.trim() !== value.uri ||
      !value.uri.startsWith('ui://') ||
      /[\u0000-\u0020\u007f]/.test(value.uri)
    )
      throw new Error('Resource uri must be an absolute ui:// URI');
    const uri = new URL(value.uri);
    if (uri.protocol !== 'ui:' || !uri.host)
      throw new Error('Resource uri must be an absolute ui:// URI');
  }
  if (
    value.mimeType !== undefined &&
    (typeof value.mimeType !== 'string' || !value.mimeType.trim())
  )
    throw new Error('Resource mimeType must be a non-empty string');
  if (value._meta !== undefined) {
    if (!isRecord(value._meta))
      throw new Error('Resource _meta must be an object');
    if (value._meta.ui !== undefined) validateUiMetadata(value._meta.ui, true);
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
      validateResourceConfig(view.resource);
      const keys = Object.keys(view).filter(key => key !== 'resource');
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
      `Invalid view: ${name}. Use a component path, { component: './View.tsx' }, { expose: './Name' } or { remote: 'https://host/mf-manifest.json', expose: './Name' }`,
    );
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
    if ('tool' in view)
      throw new Error('UI manifest views do not support tool configuration');
    validateUiMetadata(view.ui, true);
    validateResourceConfig(view.resource);
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
