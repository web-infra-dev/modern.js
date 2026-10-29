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
  validateUiManifest,
  type UiManifest,
  type UiMetadata,
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

export async function registerUiResources(
  server: Pick<McpServer, 'registerResource'>,
  options: RegisterUiOptions = {},
): Promise<Record<string, string>> {
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
  const base = publicBase(manifest, options);
  const devSocket =
    options.mode === 'development' && options.request
      ? new URL(requestOrigin(options.request))
      : undefined;
  if (devSocket)
    devSocket.protocol = devSocket.protocol === 'https:' ? 'wss:' : 'ws:';
  const uris: Record<string, string> = Object.create(null);
  for (const [name, view] of Object.entries(manifest.views)) {
    const uri = `ui://app/${encodeURIComponent(name)}`;
    uris[name] = uri;
    const remote = 'remote' in view ? manifest.remotes[view.remote] : undefined;
    const entry = remote ? new URL(remote.entry, base).href : undefined;
    const ui: UiMetadata = {
      ...view.ui,
      csp: {
        ...view.ui.csp,
        resourceDomains: [
          ...new Set([
            ...(view.ui.csp?.resourceDomains ?? []),
            base.origin,
            ...(entry ? [new URL(entry).origin] : []),
          ]),
        ],
        baseUriDomains: [
          ...new Set([...(view.ui.csp?.baseUriDomains ?? []), base.origin]),
        ],
        connectDomains: [
          ...new Set([
            ...(view.ui.csp?.connectDomains ?? []),
            base.origin,
            ...(entry ? [new URL(entry).origin] : []),
            ...(devSocket ? [devSocket.origin] : []),
          ]),
        ],
      },
    };
    registerAppResource(
      server,
      name,
      uri,
      { _meta: { ui } },
      async (_uri, extra) => {
        const source = 'html' in view ? view.html : remote!.shell;
        const sourceUrl = /^https?:\/\//.test(source)
          ? new URL(source)
          : new URL(source, location);
        let html = await readSource(
          sourceUrl,
          options.request
            ? AbortSignal.any([options.request.signal, extra.mcpReq.signal])
            : extra.mcpReq.signal,
        );
        if (!/<head\b[^>]*>/i.test(html))
          throw new Error('UI HTML requires a head element');
        if (/<base\b/i.test(html))
          throw new Error('UI HTML must not contain a base element');
        const config =
          remote && 'expose' in view
            ? `<script type="application/json" id="modern-mcp-config">${JSON.stringify({ name: view.remote, entry, expose: view.expose }).replace(/</g, '\\u003c')}</script>`
            : '';
        html = html.replace(
          /<head\b[^>]*>/i,
          head => `${head}<base href="${escapeAttribute(base.href)}">${config}`,
        );
        return {
          contents: [
            { uri, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: { ui } },
          ],
        };
      },
    );
  }
  return uris;
}
