import zlib from 'node:zlib';
import type { RsbuildPlugin } from '@rsbuild/core';

export interface PrecompressOptions {
  /**
   * Files to compress, matched against the emitted asset name.
   * Source maps are not compressed by default: they are rarely downloaded by users.
   * @default /\.(js|mjs|css|html|json|svg|txt)$/
   */
  test?: RegExp;
  /** Skip files smaller than this many bytes. @default 1024 */
  threshold?: number;
  /** Brotli quality, 0-11. @default 11 */
  quality?: number;
  /** Also emit `.gz` files. @default false */
  gzip?: boolean;
}

const DEFAULT_TEST = /\.(js|mjs|css|html|json|svg|txt)$/;

const brotli = (input: Buffer, quality: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    zlib.brotliCompress(
      input,
      {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: quality,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: input.length,
        },
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });

const gzip = (input: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    zlib.gzip(input, { level: 9 }, (error, result) =>
      error ? reject(error) : resolve(result),
    );
  });

/**
 * Emit `<file>.br` (and optionally `<file>.gz`) next to each text asset of a production
 * build. On-the-fly compression at the edge usually runs at a low brotli quality to save
 * CPU; compressing once at build time with quality 11 makes the same files smaller for
 * every download. Servers and CDNs that support precompressed files pick them up as is.
 */
export const pluginPrecompress = (
  options: PrecompressOptions = {},
): RsbuildPlugin => ({
  name: 'builder:precompress',

  apply: 'build',

  setup(api) {
    const test = options.test ?? DEFAULT_TEST;
    const threshold = options.threshold ?? 1024;
    const quality = options.quality ?? 11;

    api.processAssets(
      { stage: 'report', targets: ['web'] },
      async ({ assets, compilation, sources }) => {
        const jobs: Promise<void>[] = [];
        for (const [name, source] of Object.entries(assets)) {
          if (
            !test.test(name) ||
            name.endsWith('.br') ||
            name.endsWith('.gz')
          ) {
            continue;
          }
          // Seen in large builds: an entry can lack a source by this stage.
          const buffer = source?.buffer();
          if (!buffer) {
            continue;
          }
          if (buffer.length < threshold) {
            continue;
          }
          const emit = (suffix: string, output: Buffer) => {
            if (output.length < buffer.length) {
              compilation.emitAsset(
                `${name}${suffix}`,
                new sources.RawSource(output),
                { precompressed: true },
              );
            }
          };
          jobs.push(
            brotli(buffer, quality).then(output => emit('.br', output)),
          );
          if (options.gzip) {
            jobs.push(gzip(buffer).then(output => emit('.gz', output)));
          }
        }
        await Promise.all(jobs);
      },
    );
  },
});
