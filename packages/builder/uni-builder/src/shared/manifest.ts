import type { Chunk } from 'webpack';

export const generateManifest = (
  seed: Record<string, any>,
  files: Array<{
    chunk?: Chunk;
    name: string;
    path: string;
  }>,
  entries: Record<string, string[]>,
) => {
  const manifestFiles = files.reduce((manifest, file) => {
    manifest[file.name] = file.path;
    return manifest;
  }, seed);

  const entrypointFiles = Object.keys(entries).reduce<string[]>(
    (previous, name) =>
      previous.concat(
        entries[name].filter(fileName => !fileName.endsWith('.map')),
      ),
    [],
  );

  return {
    files: manifestFiles,
    entrypoints: entrypointFiles,
  };
};
