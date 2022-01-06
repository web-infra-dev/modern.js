import * as path from 'path';
import {
  fs,
  Import,
  formatWebpackMessages,
  printFileSizesAfterBuild,
  measureFileSizesBeforeBuild,
  printBuildError,
  chalk,
} from '@modern-js/utils';
import type { Configuration } from 'webpack';

type Argu<F extends (inputA: any, inputB: any) => any> = F extends (
  inputA: infer A,
  inputB: infer B,
) => any
  ? B
  : never;

const webpack: typeof import('webpack') = Import.lazy('webpack', require);

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const findEditorIndex = (entry: string) => {
  const exts = ['.js', '.ts', '.jsx', '.tsx'];

  for (const ext of exts) {
    const entryPoint = path.join(entry, `index${ext}`);
    if (fs.existsSync(entryPoint)) {
      return entryPoint;
    }
  }

  return '';
};

const build = (
  webpackConfig: Configuration,
  {
    appBuildPath,
    editorEntryFile,
    isDev,
    previousFileSizes,
  }: {
    isDev: boolean;
    editorEntryFile: string;
    appBuildPath: string;
    previousFileSizes: { root: string; sizes: Record<string, number[]> };
  },
) => {
  const editorIndex = findEditorIndex(editorEntryFile);
  let hasReloadEditor = false;
  const compiler = webpack(webpackConfig);
  return new Promise((resolve, reject) => {
    const runner = (handler: Argu<typeof compiler.watch>) =>
      compiler.watch({}, handler);
    // eslint-disable-next-line consistent-return
    runner((err, stats) => {
      setTimeout(() => {
        const done = () => {
          compiler.close(() => {
            resolve({
              warnings: messages.warnings,
            });
          });
        };
        if (!hasReloadEditor) {
          if (fs.existsSync(editorIndex)) {
            console.info(`Generating __editor__ ...`);
            fs.writeFileSync(
              editorIndex,
              fs.readFileSync(editorIndex, 'utf-8'),
            );
            hasReloadEditor = true;
            return null;
          } else {
            return compiler.close(() => {
              reject(new Error(`__editor__ not existed.`));
            });
          }
        } else {
          hasReloadEditor = false;
          if (!isDev) {
            return done();
          }

          return null;
        }
      }, 0);

      let messages: any;

      if (err) {
        if (!err.message) {
          return reject(err);
        }
        messages = formatWebpackMessages({
          errors: [err],
          warnings: [],
        });
      } else {
        messages = formatWebpackMessages(
          stats?.toJson({ all: false, warnings: true, errors: true }) as any,
        );
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.info(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n',
          ),
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }

      if (hasReloadEditor) {
        console.info(
          `File sizes after ${process.env.NODE_ENV || 'production'} build:\n`,
        );
        printFileSizesAfterBuild(
          stats,
          previousFileSizes,
          appBuildPath,
          WARN_AFTER_BUNDLE_GZIP_SIZE,
          WARN_AFTER_CHUNK_GZIP_SIZE,
        );
        console.info();
      }

      if (isDev) {
        return resolve({
          warnings: messages.warnings,
        });
      }
    });
  });
};

export const buildUmd = async (
  webpackConfig: Configuration,
  {
    editorEntryFile,
    isDev,
  }: {
    editorEntryFile: string;
    isDev: boolean;
  },
) => {
  const appBuildPath = webpackConfig.output?.path as string;

  await Promise.resolve()
    .then(() =>
      // First, read the current file sizes in build directory.
      // This lets us display how much they changed later.
      measureFileSizesBeforeBuild(appBuildPath),
    )
    .then(previousFileSizes => {
      // Remove all content but keep the directory so that
      // if you're in it, you don't end up in Trash
      fs.emptyDirSync(appBuildPath);

      // Start the webpack build
      return build(webpackConfig, {
        previousFileSizes,
        isDev,
        editorEntryFile,
        appBuildPath,
      });
    })
    .then(
      ({ warnings }) => {
        if (warnings.length) {
          console.info(chalk.yellow('Compiled with warnings.\n'));
          console.info(warnings.join('\n\n'));
          console.info(
            `\nSearch for the ${chalk.underline(
              chalk.yellow('keywords'),
            )} to learn more about each warning.`,
          );
          console.info(
            `To ignore, add ${chalk.cyan(
              '// eslint-disable-next-line',
            )} to the line before.\n`,
          );
        } else {
          console.info(chalk.green('Compiled successfully.\n'));
        }
      },
      err => {
        const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true';
        if (tscCompileOnError) {
          console.info(
            chalk.yellow(
              'Compiled with the following type errors (you may want to check these before deploying your app):\n',
            ),
          );
          printBuildError(err);
        } else {
          console.info(chalk.red('Failed to compile.\n'));
          printBuildError(err);
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }
      },
    )
    .catch(err => {
      if (err?.message) {
        console.info(err.message);
      }
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
};
