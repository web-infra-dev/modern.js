import LoadablePlugin from '../../src/cli/ssr/loadable-bundler-plugin';

const buildManifest = (stats: Record<string, unknown>) => {
  const plugin = new LoadablePlugin({
    filename: 'loadable-stats.json',
    outputAsset: true,
  });
  const compilation = {
    getStats: () => ({
      toJson: () => stats,
    }),
  };
  const asset = plugin.handleEmit(compilation as any);
  return JSON.parse((asset as any).source());
};

const getIds = (manifest: any) => ({
  chunkIds: manifest.chunks.map((chunk: any) => chunk.id),
  groupIds: manifest.namedChunkGroups.app.chunks,
  entrypointIds: manifest.entrypoints.main.chunks,
});

describe('LoadableBundlerPlugin chunk ID normalization', () => {
  it('converts numeric string IDs into numbers for Rspack 2.0 compatibility', () => {
    const manifest = buildManifest({
      chunks: [{ id: '1', files: ['1.js'] }, { id: '512', files: ['512.js'] }],
      namedChunkGroups: { app: { chunks: ['1', '512'] } },
      entrypoints: { main: { chunks: ['1'] } },
    });

    expect(getIds(manifest)).toEqual({
      chunkIds: [1, 512],
      groupIds: [1, 512],
      entrypointIds: [1],
    });
  });

  it('keeps compact-hashed IDs with leading zeros as strings', () => {
    const manifest = buildManifest({
      chunks: [
        { id: '00', files: ['00.js'] },
        { id: '01', files: ['01.js'] },
        { id: '02', files: ['02.js'] },
      ],
      namedChunkGroups: { app: { chunks: ['00', '01', '02'] } },
      entrypoints: { main: { chunks: ['01'] } },
    });

    expect(getIds(manifest)).toEqual({
      chunkIds: ['00', '01', '02'],
      groupIds: ['00', '01', '02'],
      entrypointIds: ['01'],
    });
  });

  it('keeps non-numeric and value-losing IDs untouched', () => {
    const manifest = buildManifest({
      chunks: [
        { id: 'app', files: ['app.js'] },
        { id: 3, files: ['3.js'] },
        { id: '12345678901234567890', files: ['big.js'] },
      ],
      namedChunkGroups: { app: { chunks: ['app', '12345678901234567890'] } },
      entrypoints: { main: { chunks: [3] } },
    });

    expect(getIds(manifest)).toEqual({
      chunkIds: ['app', 3, '12345678901234567890'],
      groupIds: ['app', '12345678901234567890'],
      entrypointIds: [3],
    });
  });
});
