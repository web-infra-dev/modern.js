import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { build, Loader, Plugin, BuildOptions } from 'esbuild';

const JS_EXT_RE = /\.(mjs|cjs|ts|js|tsx|jsx)$/;

// Must not start with "/" or "./" or "../"
// "/test/node_modules/foo"
// "c:/node_modules/foo"
export const EXTERNAL_REGEXP = /^[^./]|^\.[^./]|^\.\.[^/]/;

const CACHE_DIR = path.relative(
  process.cwd(),
  './node_modules/.node-bundle-require',
);

function inferLoader(ext: string): Loader {
  if (ext === '.mjs' || ext === '.cjs') {
    return 'js';
  }
  return ext.slice(1) as Loader;
}

export interface Options {
  /**
   * The `require` function that is used to load the output file
   * Default to the global `require` function
   * This function can be asynchronous, i.e. returns a Promise
   */
  require?: (outfile: string) => any;
  /**
   * esbuild options
   */
  esbuildOptions?: BuildOptions;
  /**
   * esbuild plugin
   */
  esbuildPlugins?: Plugin[];
  /**
   * Get the path to the output file
   * By default we simply replace the extension with `.bundled.cjs`
   */
  getOutputFile?: (filepath: string) => string;
}

const defaultGetOutputFile = (filepath: string) =>
  path.resolve(
    CACHE_DIR,
    `${filepath}-${Date.now()}.${randomUUID({
      disableEntropyCache: true,
    })}.bundled.cjs`,
  );

export async function bundleRequire(filepath: string, options?: Options) {
  if (!JS_EXT_RE.test(filepath)) {
    throw new Error(`${filepath} is not a valid JS file`);
  }

  const getOutputFile = options?.getOutputFile || defaultGetOutputFile;
  const outfile = getOutputFile(filepath);

  await build({
    entryPoints: [filepath],
    outfile,
    format: 'cjs',
    platform: 'node',
    bundle: true,
    ...options?.esbuildOptions,
    plugins: [
      ...(options?.esbuildPlugins || []),
      // https://github.com/evanw/esbuild/issues/1051#issuecomment-806325487
      {
        name: 'native-node-modules',
        // eslint-disable-next-line @typescript-eslint/no-shadow
        setup(build) {
          // If a ".node" file is imported within a module in the "file" namespace, resolve
          // it to an absolute path and put it into the "node-file" virtual namespace.
          build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => ({
            path: require.resolve(args.path, { paths: [args.resolveDir] }),
            namespace: 'node-file',
          }));

          // Files in the "node-file" virtual namespace call "require()" on the
          // path from esbuild of the ".node" file in the output directory.
          build.onLoad({ filter: /.*/, namespace: 'node-file' }, args => ({
            contents: `
              import path from ${JSON.stringify(args.path)}
              try { module.exports = require(path) }
              catch {}
            `,
          }));

          // If a ".node" file is imported within a module in the "node-file" namespace, put
          // it in the "file" namespace where esbuild's default loading behavior will handle
          // it. It is already an absolute path since we resolved it to one above.
          build.onResolve(
            { filter: /\.node$/, namespace: 'node-file' },
            args => ({
              path: args.path,
              namespace: 'file',
            }),
          );

          // Tell esbuild's default loading behavior to use the "file" loader for
          // these ".node" files.
          const opts = build.initialOptions;
          opts.loader = opts.loader || {};
          opts.loader['.node'] = 'file';
        },
      },
      {
        name: 'replace-path',
        setup(ctx) {
          ctx.onLoad({ filter: JS_EXT_RE }, async args => {
            const contents = await fs.readFile(args.path, 'utf-8');
            return {
              contents: contents
                .replace(/\b__filename\b/g, JSON.stringify(args.path))
                .replace(
                  /\b__dirname\b/g,
                  JSON.stringify(path.dirname(args.path)),
                )
                .replace(
                  /\bimport\.meta\.url\b/g,
                  JSON.stringify(`file://${args.path}`),
                ),
              loader: inferLoader(path.extname(args.path)),
            };
          });
        },
      },
      // https://github.com/evanw/esbuild/issues/619#issuecomment-751995294
      {
        name: 'make-all-packages-external',
        setup(_build) {
          _build.onResolve({ filter: EXTERNAL_REGEXP }, args => {
            let external = true;
            // FIXME: windows external entrypoint
            if (args.kind === 'entry-point') {
              external = false;
            }
            return {
              path: args.path,
              external,
            };
          });
        },
      },
    ],
  });

  let mod: any;
  const req = options?.require || require;
  try {
    mod = await req(outfile);
  } finally {
    // Remove the outfile after executed
    await fs.unlink(outfile);
  }

  return mod;
}
