import { join, dirname, relative, resolve } from 'path';
import { chalk, fs, globby, json5, logger } from '@modern-js/utils';
import { mergeWith as deepMerge } from '@modern-js/utils/lodash';
import MagicString from 'magic-string';
import { createMatchPath, loadConfig } from '@modern-js/utils/tsconfig-paths';
import { js } from '@ast-grep/napi';
import type {
  ITsconfig,
  GeneratorDtsConfig,
  BuildType,
  TsTarget,
} from '../types';
import { normalizeSlashes } from './builder';

export const getProjectTsconfig = async (
  tsconfigPath: string,
  resolutionContext: Record<string, boolean> = {},
): Promise<ITsconfig> => {
  if (!fs.existsSync(tsconfigPath)) {
    return {};
  }

  // circular dependency
  const absolutePath = resolve(tsconfigPath);
  if (resolutionContext[absolutePath]) {
    return {};
  }
  resolutionContext[absolutePath] = true;

  const tsConfig: ITsconfig = await json5.parse(
    fs.readFileSync(tsconfigPath, 'utf-8'),
  );

  if (!tsConfig.extends) {
    return tsConfig;
  }

  // recursively resolve extended tsconfig
  // "extends" may be a string or string array (extending many tsconfigs)
  const extendsResolutionTarget = Array.isArray(tsConfig.extends)
    ? tsConfig.extends
    : [tsConfig.extends];

  const resolveParentTsConfigPromises = extendsResolutionTarget.map(
    async target => {
      let parentTsconfigPath: string;
      try {
        // Likely extending from a npm package, use require.resolve to resolve it.
        // If `require.resolve` resolved a path that is not a JSON file,
        // we infer that the requested "target" may be a npm package name,
        // thus we try to resolve target/tsconfig.json.
        //
        // for example:
        //   "extends": "@modern-js/module-tools" may resolved to src/index.ts
        // but actually we should resolve: "@modern-js/module-tools/tsconfig.json"
        //
        // Note: This only works with packages that has no "export" field
        // defined in package.json.
        parentTsconfigPath = require.resolve(target);
        if (!parentTsconfigPath.endsWith('.json')) {
          parentTsconfigPath = require.resolve(`${target}/tsconfig.json`);
        }
      } catch {
        // resolve file from current tsconfig's path
        parentTsconfigPath = resolve(dirname(tsconfigPath), target);
      }
      return await getProjectTsconfig(parentTsconfigPath, resolutionContext);
    },
  );

  const parentTsConfigs = await Promise.all(resolveParentTsConfigPromises);

  // current tsconfig has the highest priority
  return deepMerge({}, ...parentTsConfigs, tsConfig);
};

export async function detectTSVersion(appDirectory?: string) {
  // Detect typescript version from current cwd
  // return the major version of typescript
  const cwd = appDirectory ?? process.cwd();
  const typescriptPath = join(cwd, 'node_modules', 'typescript');
  if (await fs.pathExists(typescriptPath)) {
    const typescriptPkg = await fs.readJson(
      join(typescriptPath, 'package.json'),
    );
    const version = Number(typescriptPkg.version.split('.')[0]);
    return version;
  }
}

export const getTscBinPath = async (appDirectory: string) => {
  const { default: findUp, exists: pathExists } = await import(
    '../../compiled/find-up'
  );
  const tscBinFile = await findUp(
    async (directory: string) => {
      const targetFilePath = join(directory, './node_modules/.bin/tsc');
      const hasTscBinFile = await pathExists(targetFilePath);
      if (hasTscBinFile) {
        return targetFilePath;
      }
      return undefined;
    },
    { cwd: appDirectory },
  );

  if (!tscBinFile || !fs.existsSync(tscBinFile)) {
    throw new Error(
      'Failed to excute the `tsc` command, please check if `typescript` is installed correctly in the current directory.',
    );
  }

  return tscBinFile;
};

export const processDtsFilesAfterTsc = async (config: GeneratorDtsConfig) => {
  const { distPath, tsconfigPath, userTsconfig, dtsExtension, banner, footer } =
    config;
  const dtsFilesPath = await globby('**/*.d.ts', {
    absolute: true,
    cwd: distPath,
  });

  /**
   * get matchPath func to support tsconfig paths
   */
  const result = loadConfig(tsconfigPath);
  if (result.resultType === 'failed') {
    logger.error(result.message);
    return;
  }
  const { absoluteBaseUrl, paths, mainFields, addMatchAll } = result;
  const matchPath = createMatchPath(
    absoluteBaseUrl,
    paths,
    mainFields,
    addMatchAll,
  );

  await Promise.all(
    dtsFilesPath.flatMap(filePath => {
      const code = fs.readFileSync(filePath, 'utf8');
      const str: MagicString = new MagicString(code);
      const originalFilePath = resolve(
        absoluteBaseUrl,
        userTsconfig?.compilerOptions?.rootDir || 'src',
        relative(distPath, filePath),
      );
      try {
        // js can override more case than ts
        const sgNode = js.parse(code).root();
        const matcher = {
          rule: {
            kind: 'string_fragment',
            any: [
              {
                inside: {
                  stopBy: 'end',
                  kind: 'import_statement',
                  field: 'source',
                },
              },
              {
                inside: {
                  stopBy: 'end',
                  kind: 'export_statement',
                  field: 'source',
                },
              },
              {
                inside: {
                  kind: 'string',
                  inside: {
                    kind: 'arguments',
                    inside: {
                      kind: 'call_expression',
                      has: {
                        field: 'function',
                        regex: '^(import|require)$',
                      },
                    },
                  },
                },
              },
            ],
          },
        };
        const matchModule = sgNode.findAll(matcher).map(matchNode => {
          return {
            name: matchNode.text(),
            start: matchNode.range().start.index,
            end: matchNode.range().end.index,
          };
        });
        matchModule.forEach(module => {
          if (!module.name) {
            return;
          }
          const { start, end, name } = module;
          // same as https://github.com/web-infra-dev/modern.js/blob/main/packages/solutions/module-tools/src/builder/feature/redirect.ts#L52
          const absoluteImportPath = matchPath(name, undefined, undefined, [
            '.jsx',
            '.tsx',
            '.js',
            '.ts',
          ]);
          if (absoluteImportPath) {
            const relativePath = relative(
              dirname(originalFilePath),
              absoluteImportPath,
            );
            const relativeImportPath = normalizeSlashes(
              relativePath.startsWith('..')
                ? relativePath
                : `./${relativePath}`,
            );
            str.overwrite(start, end, relativeImportPath);
          }
        });
      } catch (e) {
        logger.error('[parse error]', e);
      }

      // add banner and footer
      banner && str.prepend(`${banner}\n`);
      footer && str.append(`\n${footer}\n`);

      // rewrite dts file
      const content = str.toString();
      const finalPath =
        // We confirm that users will not mix ts and c(m)ts files in their projects.
        // If a mix is required, please configure separate buildConfig to handle different inputs.
        // So we don't replace .d.(c|m)ts that generated by tsc directly, this can confirm that
        // users can use c(m)ts directly rather than enable autoExtension, in this condition,
        // users need to set esbuild out-extensions like { '.js': '.mjs' }
        filePath.replace(/\.d\.ts/, dtsExtension);
      const writeTask = () => {
        return fs.writeFile(
          // only replace .d.ts, if tsc generate .d.m(c)ts, keep.
          finalPath,
          content,
        );
      };
      const removeTask = () => {
        return fs.remove(filePath);
      };
      // if write the new file, remove the old file, and the two tasks do not conflict and can run parallel
      return dtsExtension === '.d.ts'
        ? [writeTask()]
        : [writeTask(), removeTask()];
    }),
  );
};

export const printOrThrowDtsErrors = async (
  error: unknown,
  options: { abortOnError?: boolean; buildType: BuildType },
) => {
  const { InternalDTSError } = await import('../error');
  const local = await import('../locale');
  const { abortOnError, buildType } = options ?? {};
  if (error instanceof Error) {
    if (abortOnError) {
      throw new InternalDTSError(error, {
        buildType,
      });
    } else {
      logger.warn(
        chalk.bgYellowBright(
          local.i18n.t(local.localeKeys.warns.dts.abortOnError),
        ),
      );
      logger.error(
        new InternalDTSError(error, {
          buildType,
        }),
      );
    }
  }
};

export const tsTargetAtOrAboveES2022 = (target: TsTarget) =>
  target === 'es2022' || target === 'esnext';
