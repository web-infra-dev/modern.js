import type { Manifest } from '@rsdoctor/types';

export async function fetchShardingFile(url: string): Promise<string> {
  const { Url } = await import('@rsdoctor/utils/common');
  if (Url.isUrl(url)) {
    const resp = await fetch(url);
    return resp.text();
  }
  // json string
  return url;
}

export async function parseManifest(
  json: Manifest.RsdoctorManifestWithShardingFiles,
): Promise<Manifest.RsdoctorManifest> {
  const [utils, fs] = await Promise.all([
    import('@rsdoctor/utils/common'),
    import('@modern-js/utils/fs-extra'),
  ]);

  // try to load cloud data first
  if ('cloudManifestUrl' in json && 'cloudData' in json) {
    try {
      const data = await utils.Manifest.fetchShardingFiles(
        json.data,
        fetchShardingFile,
      );
      return { ...json, data };
    } catch (err) {
      console.error(err);
    }
  }
  // fallback to load local data.
  const data = await utils.Manifest.fetchShardingFiles(json.data, url =>
    fs.readFile(url, 'utf-8'),
  );

  return { ...json, data };
}

const MANIFEST_DIRS = ['.rsdoctor', '.web-doctor'];

const MANIFEST_NAME = 'manifest.json';

/**
 * @throws {Error} Cannot find manifest.json in ${rootPath}
 */
export async function findManifest(
  dirname: string,
  silent = false,
): Promise<string> {
  const [fs, path] = await Promise.all([import('fs'), import('path')]);

  for (const dir of MANIFEST_DIRS) {
    const manifestPath = path.resolve(dirname, dir, MANIFEST_NAME);
    if (fs.existsSync(manifestPath)) {
      return manifestPath;
    }
  }

  if (silent) {
    return '';
  } else {
    throw new Error(`Cannot find manifest.json in ${dirname}`);
  }
}
