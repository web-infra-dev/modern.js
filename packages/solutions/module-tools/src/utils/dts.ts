import { join, dirname, relative, resolve } from 'path';
import { chalk, fs, globby, json5, logger } from '@modern-js/utils';
import MagicString from 'magic-string';
import { createMatchPath, loadConfig } from '@modern-js/utils/tsconfig-paths';
import { ts } from '@ast-grep/napi';
import deepMerge from '../../compiled/deepmerge';
import type {
  ITsconfig,
  GeneratorDtsConfig,
  BuildType,
  TsTarget,
} from '../types';
import { normalizeSlashes } from './builder';

type MatchModule = {
  name?: string;
  start: number;
  end: number;
}[];

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
  const extendsResolutionTarget =
    tsConfig.extends instanceof Array ? tsConfig.extends : [tsConfig.extends];

  const resolveParentTsConfigPromises = extendsResolutionTarget.map(
    async target => {
      let parentTsconfigPath: string;
      try {
        // likely extending from a npm package, use require.resolve to resolve it.
        parentTsconfigPath = require.resolve(target);
      } catch {
        // resolve file from current tsconfig's path
        parentTsconfigPath = resolve(dirname(tsconfigPath), target);
      }
      return await getProjectTsconfig(parentTsconfigPath, resolutionContext);
    },
  );

  const parentTsConfigs = await Promise.all(resolveParentTsConfigPromises);

  return deepMerge(...parentTsConfigs, tsConfig);
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

  /**
   * `export $VAR from` is invalid, so we need `{$$$VAR}`, `*` and `* as $VAR`
   * But `import $VAR from` is valid.
   */
  const Pattern = [
    `import $VAR from '$MATCH'`,
    `import $VAR from "$MATCH"`,
    `export {$$$VAR} from '$MATCH'`,
    `export {$$$VAR} from "$MATCH"`,
    `export * from '$MATCH'`,
    `export * from "$MATCH"`,
    `export * as $VAR from '$MATCH'`,
    `export * as $VAR from "$MATCH"`,
    `import('$MATCH')`,
    `import("$MATCH")`,
  ];

  await Promise.all(
    dtsFilesPath
      .map(filePath => {
        const code = fs.readFileSync(filePath, 'utf8');
        let matchModule: MatchModule = [];
        try {
          const sgNode = ts.parse(code).root();
          matchModule = Pattern.map(p => sgNode.findAll(p))
            .flat()
            .map(node => {
              const matchNode = node.getMatch('MATCH')!;
              return {
                name: matchNode.text(),
                start: matchNode.range().start.index,
                end: matchNode.range().end.index,
              };
            });
        } catch (e) {
          logger.error('[parse error]', e);
        }
        const str: MagicString = new MagicString(code);

        const originalFilePath = resolve(
          absoluteBaseUrl,
          userTsconfig?.compilerOptions?.rootDir || 'src',
          relative(distPath, filePath),
        );

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
      })
      .flat(),
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
