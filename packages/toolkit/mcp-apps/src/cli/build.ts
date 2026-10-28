import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  validateViewsConfig,
  type UiManifest,
  type McpViewsConfig,
} from '../manifest';

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
): UiManifest {
  validateViewsConfig(config);
  const { views, ...metadata } = config;
  const ui = { prefersBorder: true, ...metadata };
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
    if (typeof source === 'string')
      manifest.views[name] = { html: `./ui/${viewEntryName(name)}.html`, ui };
    else {
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
      manifest.remotes[mf.manifest.name] = {
        entry: [assetPath, mf.filename].filter(Boolean).join('/'),
        shell: './ui/mcp-shell.html',
      };
      manifest.views[name] = {
        remote: mf.manifest.name,
        expose: source.expose,
        ui,
      };
    }
  }
  return manifest;
}
