import { Plugin, transform, build, context } from 'esbuild';
import * as esbuild from 'esbuild';
import rimraf from 'rimraf';
import yargs from 'yargs';
import path from 'path';
import fse from 'fs-extra';
import { resolvePathAndQuery } from '@modern-js/libuild-utils';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import remapping from '@ampproject/remapping';
import esbuildPluginLicense from 'esbuild-plugin-license';

let rebuildCnt = 0;

const outdir = path.resolve(__dirname, '../dist');

async function run() {
  const args = await yargs
    .option('watch', {
      type: 'boolean',
    })
    .option('splitting', {
      type: 'boolean',
      default: true,
    })
    .parse(process.argv);

  function clean() {
    rimraf.sync('dist');
  }
  clean();
  function splitPlugin(): Plugin {
    return {
      name: 'esm2cjs',
      setup(build) {
        let startTime: number;

        build.onStart(() => {
          startTime = Date.now();
          console.log('[Libuild]> Begin build');
        });

        build.onEnd(async (result) => {
          if (!result.outputFiles) {
            return;
          }
          await fse.ensureDir(outdir);

          for (const item of result.outputFiles) {
            if (item.path.endsWith('.js')) {
              const originSourcemap = result.outputFiles.find((f) => f.path === `${item.path}.map`)!.text;
              const needSourcemap = JSON.parse(originSourcemap)?.sources.length > 0;
              const transformResult = await transform(item.text, {
                format: 'cjs',
                sourcemap: needSourcemap,
                sourcesContent: false,
              });

              if (needSourcemap) {
                const resultMap = remapping([transformResult.map, originSourcemap], () => null);
                await fse.promises.writeFile(`${item.path}.map`, JSON.stringify(resultMap));
              }

              const filename = path.basename(item.path);
              const sourcemapURL = needSourcemap ? `//# sourceMappingURL=${filename}.map` : '';
              await fse.promises.writeFile(item.path, `${transformResult.code}${sourcemapURL}`);
            } else if (item.path.endsWith('.js.map')) {
              //
            } else {
              await fse.promises.writeFile(item.path, item.contents);
            }
          }

          const endTime = Date.now();
          console.log(`[Libuild]> Build completed, build cost ${endTime - startTime}ms, build count:`, ++rebuildCnt);
        });
      },
    };
  }
  function enhancedResolvePlugin(): Plugin {
    return {
      name: 'enhanced-resolve-loader',
      setup(build) {
        build.onResolve({ filter: /^enhanced-resolve/ }, (args) => {
          const baseName = path.join(__dirname, '..');
          const subPath = args.path.replace('enhanced-resolve', '');

          let realPath = require.resolve('enhanced-resolve', { paths: [baseName] });
          if (subPath) {
            realPath = realPath.replace(/([\\\/]lib[\\\/].*)$/, `${subPath}.js`);
          }
          return {
            path: realPath,
            pluginData: {},
          };
        });
        build.onLoad({ filter: /enhanced-resolve\/lib\/createInnerCallback\.js$/ }, async (args) => {
          // Hack for `tsconfig-paths-webpack-plugin`
          // Because of `createInnerCallback` is deprecate from `enhanced-resolve`
          return {
            contents: `module.exports = function(callback) { return callback }`,
            loader: 'ts',
          };
        });
      },
    };
  }
  function rawPlugin(): Plugin {
    return {
      name: 'raw-loader',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          const { query, originalFilePath } = resolvePathAndQuery(args.path);

          if (query.raw || query.code) {
            const realPath = require.resolve(originalFilePath, { paths: [args.resolveDir] });
            return {
              path: realPath,
              pluginData: {
                code: query.code,
                raw: query.raw,
              },
            };
          }
        });
        build.onLoad({ filter: /.*/ }, async (args) => {
          if (!(args.pluginData?.code || args.pluginData?.raw)) {
            return;
          }
          let contents = fse.readFileSync(args.path, 'utf-8').replace(/# sourceMappingURL=(.+?\.map)/g, '# $1');
          if (args.pluginData?.code) {
            const result = await esbuild.build({
              entryPoints: [args.path],
              bundle: true,
              write: false,
              format: 'iife',
              outfile: 'code.js',
            });
            contents = result.outputFiles[0].text;
          }
          return {
            contents: `module.exports = ${JSON.stringify(contents)}`,
            loader: 'ts',
          };
        });
      },
    };
  }
  function workerPlugin(): Plugin {
    return {
      name: 'worker-url',
      setup(build) {
        build.onResolve({ filter: /\?worker/ }, (args) => {
          return {
            path: path.resolve(args.resolveDir, args.path.split('?')[0]),
            namespace: 'worker-url',
            pluginData: {},
          };
        });
        build.onLoad({ filter: /.*/, namespace: 'worker-url' }, (args) => {
          const baseName = path.join(__dirname, '..');
          const workerName = path.relative(baseName, args.path).split('.')[0].split('/').join('-');
          esbuild.build({
            entryPoints: [args.path],
            platform: 'node',
            target: 'node12',
            bundle: true,
            sourcemap: true,
            outfile: `./dist/${workerName}.js`,
          });
          return {
            contents: `module.exports = require.resolve(${JSON.stringify(
              `./${workerName}.js`
            )}, { paths: [__dirname] })`,
            loader: 'ts',
          };
        });
      },
    };
  }

  const config: esbuild.BuildOptions = {
    entryPoints: [path.resolve(__dirname, '../src/index.ts')],
    target: 'node12',
    sourcemap: args.splitting ? 'external' : true,
    bundle: true,
    platform: 'node',
    format: args.splitting ? 'esm' : 'cjs',
    write: !args.splitting,
    splitting: args.splitting,
    sourcesContent: args.splitting,
    mainFields: ['source', 'main', 'module'],
    outdir,
    external: [
      'esbuild',
      'terser',
      'postcss',
      'less',
      'pnpapi',
      'fsevents',
      'source-map',
      'source-map-support',
      'typescript',
      '@ast-grep/napi',
    ],
    plugins: [
      args.splitting && splitPlugin(),
      workerPlugin(),
      rawPlugin(),
      enhancedResolvePlugin(),
      !args.watch &&
        esbuildPluginLicense({
          thirdParty: {
            output: {
              file: '../LICENSE.md',
              template(dependencies, self) {
                return `
# Libuild license

Libuild is released under the MIT license:

The MIT License (MIT)

Copyright (c) 2022 [Libuild](https://github.com/modern-js/libuild)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Licenses of bundled dependencies

${dependencies.map((dependency) => `- ${dependency.packageJson.name} -- ${dependency.packageJson.license}`).join('\n')}
`.trimStart();
              },
            },
          },
        }),
    ].filter(Boolean) as Plugin[],
  };

  if (args.watch) {
    await (await context(config)).watch();
  } else {
    await build(config);
  }

  // extract types
  const apiExtractorJsonPath: string = path.join(__dirname, '../api-extractor.json');
  const extractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
  const extractorResult = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true,
  });

  if (extractorResult.succeeded) {
    console.log(`API Extractor completed successfully`);
    process.exitCode = 0;
  } else {
    console.error(
      `API Extractor completed with ${extractorResult.errorCount} errors` +
        ` and ${extractorResult.warningCount} warnings`
    );
    process.exitCode = 1;
  }
}

run();
