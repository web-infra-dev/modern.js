import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';

export function hashDevAssets(
  assets: Record<string, { source(): string | Buffer }>,
) {
  const hash = createHash('sha256');
  for (const name of Object.keys(assets).sort()) {
    if (!/\.(?:[cm]?js|css)$/.test(name) || name.includes('.hot-update.'))
      continue;
    hash.update(name).update('\0').update(assets[name].source()).update('\0');
  }
  return hash.digest('hex');
}

/** Private runtime plugins are independently built and are part of the ready release. */
async function hashDirectory(directory: string): Promise<string> {
  const hash = createHash('sha256');
  const visit = async (root: string, prefix: string) => {
    const entries = await readdir(root, { withFileTypes: true }).catch(
      error => {
        if (error.code === 'ENOENT') return [];
        throw error;
      },
    );
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory())
        await visit(path.join(root, entry.name), `${name}/`);
      else if (entry.isFile())
        hash
          .update(name)
          .update('\0')
          .update(await readFile(path.join(root, entry.name)));
    }
  };
  await visit(directory, '');
  return hash.digest('hex');
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

export async function stampDevManifest(options: {
  browser: StatsAssetResource;
  node: StatsAssetResource;
  hashes: { browser: string; node: string };
  distDirectory: string;
}) {
  const resources = [options.browser, options.node].map(resource => {
    if (!resource.manifest || !resource.stats) {
      throw new Error(
        'Both browser and server federation manifests must be ready before publication.',
      );
    }
    return { manifest: resource.manifest, stats: resource.stats };
  });
  const manifests = resources.map(resource => {
    const value = structuredClone(resource.manifest.data);
    // The identifier is computed before publication and never hashes itself.
    delete (value.metaData as any).buildInfo;
    return canonical(value);
  });
  const privateHash = await hashDirectory(
    path.join(options.distDirectory, 'server/mf-service-runtime'),
  );
  const version = createHash('sha256')
    .update(
      JSON.stringify([
        options.hashes.browser,
        options.hashes.node,
        manifests,
        privateHash,
      ]),
    )
    .digest('hex');
  for (const resource of resources) {
    resource.manifest.data.metaData.buildInfo.buildVersion = version;
    resource.stats.data.metaData.buildInfo.buildVersion = version;
  }
  return version;
}
