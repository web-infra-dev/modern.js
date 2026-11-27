import { createHash } from 'node:crypto';
import path from 'node:path';
import { Script } from 'node:vm';
import {
  validateUiMetadata,
  mergeUiMetadata,
  validateViewsConfig,
  type UiManifest,
  type UiMetadata,
  type McpViewsConfig,
} from '../manifest';

export type UiCsp = NonNullable<UiMetadata['csp']>;
export const INLINE_HTML_MAX_BYTES = 5 * 1024 * 1024;

export function validateInlineHtml(name: string, html: string) {
  const markupOnly = html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, '<script$1></script>')
    .replace(/<style\b([^>]*)>[\s\S]*?<\/style\s*>/gi, '<style$1></style>');
  if (
    /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel\s*=\s*["']?(?:stylesheet|preload|modulepreload)|<base\b/i.test(
      markupOnly,
    )
  )
    throw new Error(`View ${name} still requires external assets`);
  if (Buffer.byteLength(html) > INLINE_HTML_MAX_BYTES)
    throw new Error(`View ${name} exceeds the 5 MiB inline HTML limit`);
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
  )) {
    const type = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
      match[1],
    );
    const mime = (type?.[1] ?? type?.[2] ?? type?.[3] ?? '').toLowerCase();
    if (
      mime &&
      ![
        'text/javascript',
        'application/javascript',
        'text/ecmascript',
        'application/ecmascript',
      ].includes(mime)
    )
      continue;
    new Script(match[2]);
  }
}

/** Origin of an absolute or protocol-relative asset prefix. */
function assetPrefixOrigin(prefix: unknown) {
  if (typeof prefix !== 'string') return undefined;
  if (prefix.startsWith('//')) return new URL(`https:${prefix}`).origin;
  if (/^https?:\/\//.test(prefix)) return new URL(prefix).origin;
  return undefined;
}

function mergeCsp(...sources: Array<UiCsp | undefined>): UiCsp | undefined {
  const merged: Record<string, string[]> = {};
  for (const source of sources)
    for (const [key, domains] of Object.entries(source ?? {}))
      merged[key] = [...new Set([...(merged[key] ?? []), ...(domains ?? [])])];
  return Object.keys(merged).length ? (merged as UiCsp) : undefined;
}

export function viewEntryName(name: string) {
  const label =
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 48)
      .replace(/^-+|-+$/g, '') || 'view';
  const hash = createHash('sha256').update(name).digest('hex').slice(0, 12);
  return `mcp-ui-${label}-${hash}`;
}
export interface MfManifest {
  name: string;
  exposes: Array<{ name: string }>;
}
/** Identify the MF manifest by filename. Stats files share its shape. */
export function findMfManifest(
  assets: ReadonlyArray<{
    name: string;
    source: { source(): string | Buffer };
  }>,
  manifestFile: string,
): { filename: string; manifest: MfManifest } {
  const matches = assets.filter(
    asset => path.posix.basename(asset.name) === manifestFile,
  );
  if (matches.length !== 1)
    throw new Error(
      `Expected one MF manifest named ${manifestFile} in the web compilation, found ${matches.length}${matches.length ? `: ${matches.map(asset => asset.name).join(', ')}` : ''}. Set mf.manifestFile to the manifest filename`,
    );
  const [asset] = matches;
  const manifest: unknown = JSON.parse(String(asset.source.source()));
  if (
    !manifest ||
    typeof (manifest as MfManifest).name !== 'string' ||
    !Array.isArray((manifest as MfManifest).exposes)
  )
    throw new Error(`Invalid MF manifest: ${asset.name}`);
  return { filename: asset.name, manifest: manifest as MfManifest };
}
export function createUiManifest(
  config: McpViewsConfig,
  prefix: unknown,
  mf?: { manifest: MfManifest; filename: string },
  csp?: UiCsp,
  options?: { inline?: boolean },
): UiManifest {
  validateViewsConfig(config);
  if (csp !== undefined) validateUiMetadata({ csp });
  const { views, remote: defaultRemote, ...metadata } = config;
  // Scripts and chunks load from the asset prefix even when assetBase stays
  // request-relative, such as with a protocol-relative CDN prefix.
  const assetOrigin = assetPrefixOrigin(prefix);
  const inlineCsp = mergeCsp(metadata.csp, csp);
  const inlineUi = {
    prefersBorder: true,
    ...metadata,
    ...(inlineCsp ? { csp: inlineCsp } : {}),
  };
  const mergedCsp = mergeCsp(
    metadata.csp,
    csp,
    assetOrigin
      ? { resourceDomains: [assetOrigin], connectDomains: [assetOrigin] }
      : undefined,
  );
  const ui = {
    prefersBorder: true,
    ...metadata,
    ...(mergedCsp ? { csp: mergedCsp } : {}),
  };
  const manifest: UiManifest = {
    version: 1,
    assetBase:
      typeof prefix === 'string' && /^https?:\/\//.test(prefix)
        ? `${prefix.replace(/\/+$/, '')}/`
        : 'request',
    remotes: Object.create(null),
    views: Object.create(null),
  };
  for (const [name, source] of Object.entries(views)) {
    const resource = typeof source === 'string' ? undefined : source.resource;
    const resourceFields = {
      ...(resource ? { resource: structuredClone(resource) } : {}),
      ...(typeof source !== 'string' && source.http !== undefined
        ? { http: source.http }
        : {}),
    };
    const viewUi = mergeUiMetadata(ui, resource?._meta?.ui);
    const inlineViewUi = mergeUiMetadata(inlineUi, resource?._meta?.ui);
    if (typeof source !== 'string' && 'entry' in source) {
      manifest.views[name] = {
        entry: source.entry,
        ...(source.url !== undefined ? { url: source.url } : {}),
        ui: viewUi,
        ...resourceFields,
      };
      continue;
    }
    if (typeof source === 'string' || 'component' in source) {
      manifest.views[name] = options?.inline
        ? {
            html: `./ui/${viewEntryName(name)}.html`,
            inline: true,
            ui: inlineViewUi,
            ...resourceFields,
          }
        : {
            html: `./ui/${viewEntryName(name)}.html`,
            ui: viewUi,
            ...resourceFields,
          };
      continue;
    }
    let remote: string;
    let entry: string;
    const deployedRemote = source.remote ?? defaultRemote;
    if (deployedRemote !== undefined) {
      // The shell reads a deployed remote's manifest when the card opens, so
      // its exposes are checked at runtime and updates need no rebuild here.
      entry = deployedRemote;
      remote = `mcp-remote-${createHash('sha256').update(entry).digest('hex').slice(0, 12)}`;
    } else {
      if (!mf)
        throw new Error(
          `View ${name} requires a Module Federation manifest. Enable the MF plugin and manifest output`,
        );
      if (
        !mf.manifest.exposes.some(
          item => item.name.replace(/^\.\//, '') === source.expose.slice(2),
        )
      )
        throw new Error(
          `View ${name} references missing MF expose: ${source.expose}`,
        );
      const assetPath =
        typeof prefix === 'string' &&
        prefix.startsWith('/') &&
        !prefix.startsWith('//')
          ? prefix.replace(/^\/+|\/+$/g, '')
          : '';
      entry = [assetPath, mf.filename].filter(Boolean).join('/');
      remote = mf.manifest.name;
    }
    manifest.remotes[remote] = { entry, shell: './ui/mcp-shell.html' };
    manifest.views[name] = {
      remote,
      expose: source.expose,
      ui: viewUi,
      ...resourceFields,
    };
  }
  return manifest;
}
