import fs from 'node:fs/promises';
import path from 'node:path';
import type { McpAppsDefinition } from '@modern-js/mcp-apps/config';

export interface MfArtifact {
  name: string;
  manifest: string;
  publicPath: string;
  /** Emitted asset names relative to publicPath. Absent in older builds. */
  assets?: string[];
}

export const MF_ARTIFACTS = 'mf-remotes.json';

export function localRemoteNames(definition: McpAppsDefinition) {
  return [
    ...new Set(
      definition.tools.flatMap(tool =>
        tool.remote &&
        !definition.remotes.some(remote => remote.name === tool.remote)
          ? [tool.remote]
          : [],
      ),
    ),
  ];
}

/** Read the emitted MF manifest rather than duplicating MF config discovery. */
export function mfArtifact(
  filename: string,
  source: string,
): MfArtifact | undefined {
  if (!filename.endsWith('.json')) return;
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    return;
  }
  if (
    !value ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.exposes) ||
    typeof value.metaData?.remoteEntry?.name !== 'string'
  )
    return;
  // MF stats share the manifest envelope but retain source-file details.
  if (value.exposes.some((expose: Record<string, unknown>) => 'file' in expose))
    return;
  if (typeof value.metaData.publicPath !== 'string') {
    throw new Error(
      `MCP cannot infer the URL for ${value.name}; configure an explicit remotes[].baseUrl when using getPublicPath`,
    );
  }
  return {
    name: value.name,
    manifest: filename,
    publicPath: value.metaData.publicPath,
  };
}

export async function readMfArtifacts(directory: string) {
  return JSON.parse(
    await fs.readFile(path.join(directory, MF_ARTIFACTS), 'utf8'),
  ) as MfArtifact[];
}

export function bindMfRemotes(
  definition: McpAppsDefinition,
  artifacts: MfArtifact[],
  request: Request,
): McpAppsDefinition {
  const origin = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  if (proto === 'https' || proto === 'http') origin.protocol = `${proto}:`;
  const remotes = localRemoteNames(definition).map(name => {
    const artifact = artifacts.find(item => item.name === name);
    if (!artifact)
      throw new Error(
        `Missing MF manifest for MCP remote "${name}". Enable the MF manifest or configure remotes[].baseUrl explicitly.`,
      );
    const prefix = artifact.publicPath === 'auto' ? '/' : artifact.publicPath;
    const base = new URL(
      prefix.endsWith('/') ? prefix : `${prefix}/`,
      origin.origin,
    );
    const url = new URL(artifact.manifest, base);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error('Invalid MF publicPath');
    return {
      name,
      baseUrl: url.href,
      csp: { resourceDomains: [url.origin], connectDomains: [url.origin] },
    };
  });
  return { ...definition, remotes: [...definition.remotes, ...remotes] };
}

export function compiledConfigPath(config: string) {
  return config.replace(/\.(tsx?|mts|cts)$/, extension =>
    extension === '.mts' ? '.mjs' : extension === '.cts' ? '.cjs' : '.js',
  );
}

/** Match emitted local assets, including custom MF output directories. */
export function findMfAsset(artifacts: MfArtifact[], request: Request) {
  const origin = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  if (proto === 'https' || proto === 'http') origin.protocol = `${proto}:`;
  for (const artifact of artifacts) {
    const prefix = artifact.publicPath === 'auto' ? '/' : artifact.publicPath;
    const base = new URL(
      prefix.endsWith('/') ? prefix : `${prefix}/`,
      origin.origin,
    );
    for (const filename of artifact.assets ?? [artifact.manifest]) {
      const asset = new URL(filename, base);
      if (asset.origin === origin.origin && asset.pathname === origin.pathname)
        return filename;
    }
  }
}
