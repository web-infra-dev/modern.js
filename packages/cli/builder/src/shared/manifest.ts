import type { ManifestPluginOptions } from 'rspack-manifest-plugin';

export const generateManifest: ManifestPluginOptions['generate'] = (
  seed,
  files,
  entries,
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
