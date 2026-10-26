import { readFile } from 'node:fs/promises';
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

const sources = new WeakMap<UiManifest, URL>();

/** Relative resource files are resolved against this manifest's location. */
export async function loadUiManifest(
  source: string | URL = defaultManifestPath(),
): Promise<UiManifest> {
  const url =
    source instanceof URL
      ? source
      : /^https?:\/\//.test(source)
        ? new URL(source)
        : pathToFileURL(path.resolve(source));
  const text = await readSource(url);
  const manifest: unknown = JSON.parse(text);
  validateUiManifest(manifest);
  sources.set(manifest, url);
  return manifest;
}

function defaultManifestPath() {
  return path.resolve(
    process.cwd(),
    process.env.NODE_ENV === 'production'
      ? 'dist/mcp-apps/ui-manifest.json'
      : 'node_modules/.modern-js/mcp-apps/ui-manifest.json',
  );
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
  /** Required for in-memory manifests with relative HTML files. */
  manifestUrl?: string | URL;
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

export function registerUiResources(
  server: Pick<McpServer, 'registerResource'>,
  manifest: UiManifest,
  options: RegisterUiOptions = {},
): Record<string, string> {
  validateUiManifest(manifest);
  const location = options.manifestUrl
    ? options.manifestUrl instanceof URL
      ? options.manifestUrl
      : /^https?:\/\//.test(options.manifestUrl)
        ? new URL(options.manifestUrl)
        : pathToFileURL(path.resolve(options.manifestUrl))
    : sources.get(manifest);
  const base = publicBase(manifest, options);
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
        if (!/^https?:\/\//.test(source) && !location)
          throw new Error(
            'Relative UI files require loadUiManifest() or manifestUrl',
          );
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
