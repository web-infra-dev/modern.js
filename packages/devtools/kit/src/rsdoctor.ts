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
) {
  const utils = await import('@rsdoctor/utils/common');
  let transformedData: Manifest.RsdoctorManifestData;

  // try to load cloud data first
  if (json.data) {
    try {
      transformedData = await utils.Manifest.fetchShardingFiles(
        json.data,
        fetchShardingFile,
      );
    } catch (error) {
      console.log('cloudData load error: ', error);
    }
  } else {
    throw new Error('fallback to load json.data');
  }

  return {
    ...json,
    data: transformedData!,
  };
}
