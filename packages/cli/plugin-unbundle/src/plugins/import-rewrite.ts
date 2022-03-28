import path from 'path';
import { fs, createDebugger } from '@modern-js/utils';
import { Plugin as RollupPlugin } from 'rollup';
import { parse, init } from 'es-module-lexer';
import MagicString from 'magic-string';
import stripComments from 'strip-comments';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  BARE_SPECIFIER_REGEX,
  WEB_MODULES_DIR,
  DEV_CLIENT_PATH,
  DEV_CLIENT_URL,
  META_DATA_FILE_NAME,
} from '../constants';
import { DepsMetadata } from '../install/local-optimize';
import { isJsRequest, isCSSRequest, addQuery, pathToUrl } from '../utils';
import { fileToModules, createAssetModule } from '../AssetModule';
import { onPruneModules, WebSocketServer } from '../websocket-server';

export interface ImportSpecifier {
  /**
   * Start of module specifier
   *
   * @example
   * const source = `import { a } from 'asdf'`;
   * const [imports, exports] = parse(source);
   * source.substring(imports[0].s, imports[0].e);
   * // Returns "asdf"
   */
  s: number;

  /**
   * End of module specifier
   */
  e: number;

  /**
   * Start of import statement
   *
   * @example
   * const source = `import { a } from 'asdf'`;
   * const [imports, exports] = parse(source);
   * source.substring(imports[0].s, imports[0].e);
   * // Returns "import { a } from 'asdf';"
   */
  ss: number;

  /**
   * End of import statement
   */
  se: number;

  /**
   * If this import statement is a dynamic import, this is the start value.
   * Otherwise this is `-1`.
   */
  d: number;

  /**
   * es-module-lexer 0.4
   */
  n?: string;
}

export type LexerParseResult = readonly [
  imports: readonly ImportSpecifier[],
  exports: readonly string[],
];

const debug = createDebugger('esm:import-rewrite');

export const importRewritePlugin = (
  config: NormalizedConfig,
  appContext: IAppContext,
  wsServer: WebSocketServer,
): RollupPlugin => {
  const { appDirectory } = appContext;

  const webModulesDir = path.resolve(appDirectory, WEB_MODULES_DIR);

  return {
    name: 'esm-import-rewrite',
    async transform(code: string, importer: string) {
      if (!(isJsRequest(importer) || /.svg$/.test(importer))) {
        return null;
      }

      // ignore dev client
      if (importer.startsWith(DEV_CLIENT_PATH)) {
        return null;
      }

      const metadata: DepsMetadata = fs.readJSONSync(
        path.join(webModulesDir, META_DATA_FILE_NAME),
      );

      const assetModule = fileToModules.get(importer);

      const prevDependencies = new Set(Array.from(assetModule!.dependencies));

      // initialize module dependencies
      assetModule!.dependencies = new Set<string>();

      await init;
      try {
        const codeStr = new MagicString(code);
        codeStr.prepend(`import {__addQuery__} from "${DEV_CLIENT_URL}";\n`);
        const [imports]: LexerParseResult = parse(code, importer);

        for (const {
          s: start,
          e: end,
          // ss: statStart,
          // se: statEnd,
          d: dynamic,
          // For dynamic import expressions, this field will be empty if not a valid JS string.
          n: specifier,
        } of imports) {
          // normal module import or static js string dynamici import
          if (specifier) {
            let fullPath = null;

            // npm packages
            if (
              BARE_SPECIFIER_REGEX.test(specifier) &&
              metadata.map[specifier]
            ) {
              // TODO:  deep import: import a/dist/example.js ?
              fullPath = path.resolve(webModulesDir, metadata.map[specifier]);
            } else {
              // try resolve specifier
              const resolved = await this.resolve(
                specifier,
                path.dirname(importer),
              );

              if (!resolved) {
                throw new Error(
                  `can't find file ${specifier}, Does this file exist?`,
                );
              }

              fullPath = typeof resolved === 'object' ? resolved?.id : resolved;
            }

            if (fullPath) {
              const relative = path.relative(appDirectory, fullPath);

              // TODO: bff api function
              // if (isAPIFile(fullPath)) {
              //   relative = addQuery(relative, LAMBDA_API_FUNCTION_QUERY);
              // }

              debug(`deps ${specifier} -> ${relative}`);

              // normalize url
              let rewrite = pathToUrl(
                relative.startsWith('.') ? fullPath : `/${relative}`,
              );

              // add assets query for non js/css request
              if (!isCSSRequest(relative) && !isJsRequest(relative)) {
                rewrite = addQuery(rewrite, 'assets');
              }

              assetModule!.dependencies.add(rewrite);

              const depModule = createAssetModule(rewrite);
              depModule.id = rewrite;
              depModule.filePath = fullPath;

              depModule.dependents.add(assetModule!.id);

              if (dynamic > -1) {
                rewrite = `'${rewrite}'`;
              }

              codeStr.overwrite(
                start,
                end,
                `${
                  // eslint-disable-next-line no-nested-ternary
                  depModule.hmrTimestamp > 0
                    ? dynamic > -1
                      ? `'${addQuery(
                          rewrite.slice(1, rewrite.length - 1),
                          `t=${depModule.hmrTimestamp}`,
                        )}'`
                      : addQuery(rewrite, `t=${depModule.hmrTimestamp}`)
                    : rewrite
                }`,
              );
            }
          } else if (dynamic > -1) {
            // dynamic import with invalid js string
            // import('./xx' + a) => import(__addQuery__('./xx' + a, 'assets'))
            const specifier = stripComments(code.substring(start, end));
            const rewrite = `__addQuery__(${specifier}, 'assets')`;
            codeStr.overwrite(start, end, rewrite);
          }
        }

        const prunedFiles = diffPrunedModules(
          prevDependencies,
          assetModule!.dependencies,
        );

        if (prunedFiles.length) {
          onPruneModules(prunedFiles, wsServer);
        }

        return codeStr.toString();
      } catch (err) {
        debug(`es-moudle-lexer error: `, err);
        throw err;
      }
    },
  };
};

const diffPrunedModules = (prev: Set<string>, next: Set<string>): string[] => {
  const prevIds = Array.from(prev);
  const nextIds = Array.from(next);
  return prevIds.filter(id => !nextIds.includes(id));
};
