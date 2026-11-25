import { requestUiOptions } from './context';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import type { McpServer } from '@modelcontextprotocol/server';
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import {
  assertHttpUrl,
  mergeUiMetadata,
  validateUiManifest,
  type UiManifest,
  type UiMetadata,
  type UiResourceConfig,
} from '../manifest';

interface ManifestCacheEntry {
  version: string;
  expiresAt: number;
  value: Promise<{ manifest: UiManifest; location: URL }>;
}
const manifestCache = new Map<string, ManifestCacheEntry>();
const remoteManifestTtl = 60_000;

/** Relative resource files are resolved against this manifest's location. */
async function loadUiManifest(
  source: string | URL,
  mode: 'development' | 'production',
) {
  const url =
    source instanceof URL
      ? new URL(source.href)
      : /^https?:\/\//.test(source)
        ? new URL(source)
        : pathToFileURL(path.resolve(source));
  const production = mode === 'production';
  const key = `${production ? 'production' : 'development'}:${url.href}`;
  let version = 'process';
  if (!production && url.protocol === 'file:') {
    // Include inode and ctime to detect atomic build-output replacement too.
    const info = await stat(fileURLToPath(url), { bigint: true });
    version = `${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}`;
  }
  const cached = manifestCache.get(key);
  if (cached?.version === version && cached.expiresAt > Date.now())
    return cached.value;

  const entry: ManifestCacheEntry = {
    version,
    expiresAt: Infinity,
    value: readSource(url)
      .then(text => {
        const manifest: unknown = JSON.parse(text);
        validateUiManifest(manifest);
        if (!production && url.protocol !== 'file:')
          entry.expiresAt = Date.now() + remoteManifestTtl;
        return { manifest, location: url };
      })
      .catch(error => {
        // An older failed load must not evict a newer file version's cache entry.
        if (manifestCache.get(key) === entry) manifestCache.delete(key);
        throw error;
      }),
  };
  manifestCache.set(key, entry);
  return entry.value;
}

async function readSource(url: URL, signal?: AbortSignal) {
  if (url.protocol === 'file:')
    return readFile(fileURLToPath(url), { encoding: 'utf8', signal });
  assertHttpUrl(url.href);
  const response = await fetch(url, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(30_000)])
      : AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(`Failed to read UI resource: HTTP ${response.status}`);
  return response.text();
}

export interface RegisterUiOptions {
  request?: Request;
  /** Runtime mode. Standalone services default to production. */
  mode?: 'development' | 'production';
  /** Manifest file path or HTTP(S) URL. Provided by the Modern.js server plugin or explicitly by the caller. */
  manifest?: string | URL;
  /** Public deployment root, including any path prefix. */
  assetBase?: string;
}

function publicBase(manifest: UiManifest, options: RegisterUiOptions): URL {
  const configured = options.assetBase ?? manifest.assetBase;
  if (configured !== 'request') {
    const base = assertHttpUrl(configured);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return base;
  }
  if (!options.request)
    throw new Error(
      'Request-relative UI assets require a request or an explicit assetBase',
    );
  return new URL('/', requestOrigin(options.request));
}

export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  // Reverse proxies must sanitize forwarded headers before requests reach this handler.
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  if (proto === 'https' || proto === 'http') url.protocol = `${proto}:`;
  return url.origin;
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * Shared rendering contract for MCP resources and HTTP pages.
 * Keep page assembly here so both sources use the same asset base and MF config.
 * Callers decide which views need resources.
 */
export interface ResolvedUiView {
  /** Existing application entry. URL-only, served by the application router. */
  entry?: string;
  ui: UiMetadata;
  resource?: UiResourceConfig;
  render: (signal?: AbortSignal) => Promise<string>;
}

export async function resolveUiViews(
  options: RegisterUiOptions = {},
): Promise<Record<string, ResolvedUiView>> {
  const injected = options.request && requestUiOptions.get(options.request);
  options = {
    ...options,
    manifest: options.manifest ?? injected?.manifest,
    mode: options.mode ?? injected?.mode,
  };
  if (!options.manifest)
    throw new Error(
      'MCP UI manifest is required. Use the Modern.js MCP Apps server plugin with a request or pass an explicit manifest path or URL',
    );
  const { manifest, location } = await loadUiManifest(
    options.manifest,
    options.mode ?? 'production',
  );
  if (
    manifest.inline &&
    Object.values(manifest.views).some(view => !('html' in view))
  )
    throw new Error('Inline UI manifests require local HTML views');
  const isInlineView = (view: UiManifest['views'][string]) =>
    manifest.inline === true || ('inline' in view && view.inline === true);
  const needsBase = Object.values(manifest.views).some(
    view => !('entry' in view) && !isInlineView(view),
  );
  const base = needsBase ? publicBase(manifest, options) : undefined;
  const devSocket =
    needsBase && options.mode === 'development' && options.request
      ? new URL(requestOrigin(options.request))
      : undefined;
  if (devSocket)
    devSocket.protocol = devSocket.protocol === 'https:' ? 'wss:' : 'ws:';
  const views: Record<string, ResolvedUiView> = Object.create(null);
  for (const [name, view] of Object.entries(manifest.views)) {
    const configuredUi = mergeUiMetadata(view.ui, view.resource?._meta?.ui);
    const resourceFields = view.resource
      ? { resource: structuredClone(view.resource) }
      : {};
    if ('entry' in view) {
      views[name] = {
        entry: view.entry,
        ui: configuredUi,
        ...resourceFields,
        render: async () => {
          throw new Error(`Entry view ${name} must use its application URL`);
        },
      };
      continue;
    }
    if (isInlineView(view) && 'html' in view) {
      const sourceUrl = /^https?:\/\//.test(view.html)
        ? new URL(view.html)
        : new URL(view.html, location);
      views[name] = {
        ui: configuredUi,
        ...resourceFields,
        render: signal =>
          readSource(
            sourceUrl,
            options.request && signal
              ? AbortSignal.any([options.request.signal, signal])
              : (options.request?.signal ?? signal),
          ),
      };
      continue;
    }

    const remote = 'remote' in view ? manifest.remotes[view.remote] : undefined;
    const entry = remote ? new URL(remote.entry, base!).href : undefined;
    const ui: UiMetadata = {
      ...configuredUi,
      csp: {
        ...configuredUi.csp,
        resourceDomains: [
          ...new Set([
            ...(configuredUi.csp?.resourceDomains ?? []),
            base!.origin,
            ...(entry ? [new URL(entry).origin] : []),
          ]),
        ],
        baseUriDomains: [
          ...new Set([
            ...(configuredUi.csp?.baseUriDomains ?? []),
            base!.origin,
          ]),
        ],
        connectDomains: [
          ...new Set([
            ...(configuredUi.csp?.connectDomains ?? []),
            base!.origin,
            ...(entry ? [new URL(entry).origin] : []),
            ...(devSocket ? [devSocket.origin] : []),
          ]),
        ],
      },
    };
    views[name] = {
      ui,
      ...resourceFields,
      async render(signal) {
        const source = 'html' in view ? view.html : remote!.shell;
        const sourceUrl = /^https?:\/\//.test(source)
          ? new URL(source)
          : new URL(source, location);
        let html = await readSource(
          sourceUrl,
          options.request && signal
            ? AbortSignal.any([options.request.signal, signal])
            : (options.request?.signal ?? signal),
        );
        if (!/<head\b[^>]*>/i.test(html))
          throw new Error('UI HTML requires a head element');
        if (/<base\b/i.test(html))
          throw new Error('UI HTML must not contain a base element');
        const config =
          remote && 'expose' in view
            ? `<script type="application/json" id="modern-mcp-config">${JSON.stringify({ name: view.remote, entry, expose: view.expose, view: name }).replace(/</g, '\\u003c')}</script>`
            : '';
        html = html.replace(
          /<head\b[^>]*>/i,
          head =>
            `${head}<base href="${escapeAttribute(base!.href)}">${config}`,
        );
        return html;
      },
    };
  }
  return views;
}

export async function registerUiResources(
  server: Pick<McpServer, 'registerResource'>,
  options: RegisterUiOptions & { viewNames?: string[] } = {},
): Promise<Record<string, string>> {
  const views = await resolveUiViews(options);
  const uris: Record<string, string> = Object.create(null);
  for (const [name, view] of Object.entries(views)) {
    if (options.viewNames && !options.viewNames.includes(name)) continue;
    if (view.entry) {
      if (options.viewNames)
        throw new Error(`Entry view ${name} requires URL delivery`);
      continue;
    }
    const uri = view.resource?.uri ?? `ui://app/${encodeURIComponent(name)}`;
    if (Object.values(uris).includes(uri))
      throw new Error(`Duplicate UI resource URI: ${uri}`);
    uris[name] = uri;
    const { uri: _uri, _meta, ...resourceMetadata } = view.resource ?? {};
    const meta = { ..._meta, ui: view.ui };
    const mimeType = view.resource?.mimeType ?? RESOURCE_MIME_TYPE;
    registerAppResource(
      server,
      name,
      uri,
      { ...resourceMetadata, mimeType, _meta: meta },
      async (_uri, extra) => ({
        contents: [
          {
            uri,
            mimeType,
            text: await view.render(extra.mcpReq.signal),
            _meta: structuredClone(meta),
          },
        ],
      }),
    );
  }
  return uris;
}

/**
 * HTTP route shared by the framework plugin and standalone Fetch services.
 * Serving a page does not register a tool or advertise a host entrypoint.
 * Host adapters provide the URL metadata and the host performs the SDK handshake.
 */
export const UI_VIEW_PATH = '/mcp-views/';

export function createUiViewHandler(options: RegisterUiOptions = {}) {
  return async (request: Request): Promise<Response | undefined> => {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith(UI_VIEW_PATH)) return undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    let name: string;
    try {
      name = decodeURIComponent(pathname.slice(UI_VIEW_PATH.length));
    } catch {
      return new Response('Invalid view name', { status: 400 });
    }
    const views = await resolveUiViews({ ...options, request });
    if (!Object.hasOwn(views, name) || views[name].entry)
      return new Response('View not found', { status: 404 });
    // URL apps can open directly from a host entrypoint without a tool result.
    // Reuse the resource HTML, but tell createMcpView to render after connection.
    // This marker selects the render timing; the page's SDK still performs the handshake.
    const html = (await views[name].render(request.signal)).replace(
      /<head\b[^>]*>/i,
      head => `${head}<meta name="modern-mcp-bootstrap" content="connected">`,
    );
    return new Response(request.method === 'HEAD' ? null : html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  };
}
