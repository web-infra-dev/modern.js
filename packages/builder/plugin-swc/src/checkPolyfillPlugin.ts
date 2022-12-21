import type Buffer from 'buffer';
import * as path from 'path';
import { logger } from '@modern-js/builder-shared';
import { Options } from '@modern-js/swc-plugins';
import { chalk } from '@modern-js/utils';
import type { Logger } from '@modern-js/utils';
import type { Compiler, NormalModule } from 'webpack';

const JS_DATA_URI_PREFIX = `data:text/javascript`;
const JS_DATA_URI_PREFIX_RE = /data:text\/javascript.*,/;

export class CheckPolyfillPlugin {
  options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  apply(compiler: Compiler): void {
    const polyfillsMap = new Map<
      string,
      {
        extra: string[];
        missing: string[];
      }
    >();

    compiler.hooks.compilation.tap('CheckSwcPolyfill', compilation => {
      compilation.hooks.seal.tap('Check Polyfill Seal', async () => {
        const modules = [...compilation.modules].filter(module =>
          module.getSourceTypes().has('javascript'),
        );

        for (const module of modules) {
          const source = module.originalSource()?.source();
          if (!source) {
            continue;
          }

          const { resource } = module as NormalModule;
          try {
            const input = resource.startsWith(JS_DATA_URI_PREFIX)
              ? resource.replace(JS_DATA_URI_PREFIX_RE, '')
              : await readFile(resource, compilation.inputFileSystem);

            comparePolyfill(
              resource,
              this.options,
              input.toString(),
              source.toString(),
              polyfillsMap,
            );
          } catch (_) {}
        }
      });
    });

    compiler.hooks.done.tapPromise('CheckSwcPolyfill', async () => {
      for (const [filename, { extra, missing }] of polyfillsMap) {
        let msg = '';
        if (extra.length) {
          msg += `SWC injected ${chalk.yellowBright.bold(
            'unne',
          )} polyfills:\n${[...extra]
            .map(s => `- ${chalk.yellow(s)}`)
            .join('\n')}\n`;
        }

        if (missing.length) {
          msg += `There may have some ${chalk.red.bold(
            'necessary',
          )} polyfills should be injected:\n${[...missing]
            .map(s => `- ${chalk.red(s)}`)
            .join('\n')}\n`;
        }

        if (msg) {
          msg = `[SwcPolyfillChecker] in ${chalk.yellowBright.bold(
            filename,
          )}\n${msg}`;
          logger.warn(msg);
        }
      }

      const outPath = compiler.outputPath;
      compiler.outputFileSystem.writeFile(
        path.join(outPath, 'swc_polyfill_debug.json'),
        JSON.stringify(Object.fromEntries(polyfillsMap.entries()), null, 2),
        err => {
          if (err) {
            throw err;
          }
        },
      );
    });
  }
}

async function comparePolyfill(
  filename: string,
  opt: Options,
  input: string,
  swcOutput: string,
  polyfillsMap: Map<
    string,
    {
      extra: string[];
      missing: string[];
    }
  >,
) {
  const swcPolyfills = extractCorejsImport(swcOutput);
  // If there is no polyfills, it may be use `mode: 'entry'`, and file which is not entry
  // won't inject polyfills
  if (!swcPolyfills.size) {
    return;
  }

  tryWithError(async () => {
    const { transformAsync } = await import('@babel/core');

    const presetEnvOptions = {
      targets: opt.env!.targets,
      useBuiltIns: opt.env!.mode,
      corejs: opt.env!.coreJs,
    };
    const babelOptions: import('@babel/core').TransformOptions = {
      sourceType: 'unambiguous',
      filename,
      presets: [
        [require.resolve('@babel/preset-env'), presetEnvOptions],
        [
          require.resolve('@babel/preset-react'),
          opt.jsc?.transform?.react || {},
        ],
        [
          require.resolve('@babel/preset-typescript'),
          {
            optimizeConstEnums: true,
          },
        ],
      ],
    };

    const babelOutput = (await transformAsync(input, babelOptions))!.code!;

    const babelPolyfills = extractCorejsImport(babelOutput);

    const missingPolyfills: string[] = [];
    const extraPolyfills: string[] = [];

    polyfillsMap.set(filename, {
      extra: extraPolyfills,
      missing: missingPolyfills,
    });

    for (const feature of babelPolyfills) {
      if (!swcPolyfills.has(feature)) {
        missingPolyfills.push(feature);
      }
    }

    for (const feature of swcPolyfills) {
      if (!babelPolyfills.has(feature)) {
        extraPolyfills.push(feature);
      }
    }
  }, `[SWC polyfill checker]: Babel transform failed: ${filename}`);
}

const COREJS_RE = /(?:require|import)\(?.*core-js\/(.*)['|"]\)?/;
function extractCorejsImport(code: string): Set<string> {
  return new Set(
    code
      .split('\n')
      .filter(line => COREJS_RE.test(line))
      .map(line => {
        const [, module] = line.match(COREJS_RE)!;
        return module;
      }),
  );
}

async function tryWithError(
  op: () => void | Promise<void>,
  msg: string,
  logger?: Logger,
) {
  try {
    await op();
  } catch (e) {
    if (logger) {
      logger.warn(msg);
      logger.warn(e);
    } else {
      console.warn(msg);
      console.warn(e);
    }
  }
}

async function readFile(
  filePath: string,
  inputFileSystem: any,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(filePath, (err: Error, res: Buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
