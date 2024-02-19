/**
 * This plugin is used to redirectImport only in unbundle mode
 * Taking from https://github.com/ice-lab/icepkg/blob/main/packages/pkg/src/plugins/transform/alias.ts
 */
import {
  isAbsolute,
  resolve,
  relative,
  join,
  dirname,
  extname,
  basename,
} from 'path';
import { js } from '@ast-grep/napi';
import MagicString from 'magic-string';
import {
  createMatchPath,
  loadConfig,
  MatchPath,
} from '@modern-js/utils/tsconfig-paths';
import { fs, logger } from '@modern-js/utils';
import { ICompiler } from '../../types';
import { assetExt } from '../../constants/file';
import {
  normalizeSlashes,
  isJsExt,
  isJsLoader,
  resolvePathAndQuery,
  getDefaultOutExtension,
  isTsExt,
} from '../../utils';
import { getAssetContents } from './asset';
import { isCssModule } from './style/postcssTransformer';

type MatchModule = {
  name?: string;
  start: number;
  end: number;
}[];

async function redirectImport(
  compiler: ICompiler,
  code: string,
  modules: MatchModule,
  aliasRecord: Record<string, string>,
  filePath: string,
  outputDir: string,
  jsExtension: string,
  isModule?: boolean,
  matchPath?: MatchPath,
): Promise<MagicString> {
  const str: MagicString = new MagicString(code);
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  await Promise.all(
    modules.map(async module => {
      if (!module.name) {
        return;
      }
      const { start, end } = module;
      let { name } = module;
      const ext = extname(name);

      const { redirect } = compiler.config;
      const { alias, style } = redirect;

      if (alias) {
        // redirect alias
        let absoluteImportPath = matchPath
          ? matchPath(name, undefined, undefined, extensions)
          : undefined;
        for (const alias of Object.keys(aliasRecord)) {
          // prefix
          if (name.startsWith(`${alias}/`)) {
            absoluteImportPath = join(
              aliasRecord[alias],
              name.slice(alias.length + 1),
            );
            break;
          }
          // full path
          if (name === alias) {
            absoluteImportPath = aliasRecord[alias];
            break;
          }
        }

        if (absoluteImportPath) {
          const relativePath = relative(dirname(filePath), absoluteImportPath);
          const relativeImportPath = normalizeSlashes(
            relativePath.startsWith('..') ? relativePath : `./${relativePath}`,
          );
          str.overwrite(start, end, relativeImportPath);
          name = relativeImportPath;
        }
      }

      if (redirect.autoExtension) {
        if (
          ext === '' &&
          name.startsWith('.') &&
          (jsExtension !== '.js' || isModule)
        ) {
          // add extension for relative path, no check if it's a directory.
          str.overwrite(start, end, `${name}${jsExtension}`);
          return;
        }

        if (isTsExt(name)) {
          //  .c(m)ts -> jsExtension
          str.overwrite(start, end, name.replace(/\.(m|c)?tsx?$/, jsExtension));
          return;
        }
      }

      if (style) {
        // redirect style path
        const { originalFilePath, query } = resolvePathAndQuery(name);

        if (query.css_virtual) {
          // css module
          const replacedName = basename(
            originalFilePath,
            extname(originalFilePath),
          ).replace('.', '_');
          const base = `${replacedName}.css`;
          const key = query.hash as string;
          const contents = compiler.virtualModule.get(key)!;
          const fileName = join(outputDir, base);
          compiler.emitAsset(fileName, {
            type: 'asset',
            contents,
            fileName,
            originalFileName: name,
          });
          const relativeImportPath = normalizeSlashes(`./${base}`);
          str.overwrite(start, end, relativeImportPath);
        }

        if (!name.startsWith('.')) {
          return;
        }

        if (
          ext === '.less' ||
          ext === '.sass' ||
          ext === '.scss' ||
          ext === '.css'
        ) {
          // less sass
          if (isCssModule(name, compiler.config.style.autoModules ?? true)) {
            str.overwrite(start, end, `${name.slice(0, -ext.length)}`);
          } else {
            str.overwrite(start, end, `${name.slice(0, -ext.length)}.css`);
          }
          return;
        }
      }

      if (redirect.asset) {
        if (assetExt.filter(ext => name.endsWith(ext)).length) {
          // asset
          const absPath = resolve(dirname(filePath), name);
          const { contents: relativeImportPath, loader } =
            await getAssetContents.apply(compiler, [absPath, outputDir]);
          if (loader === 'jsx') {
            // svgr
            const ext = extname(name);
            const outputName = `${name.slice(0, -ext.length)}.js`;
            str.overwrite(start, end, outputName);
          } else {
            // other assets
            str.overwrite(start, end, `${relativeImportPath}`);
          }
        }
      }
    }),
  );
  return str;
}

// base dir to redirect import path
const name = 'redirect';
export const redirect = {
  name,
  apply(compiler: ICompiler) {
    // get matchPath func to support tsconfig paths
    let matchPath: MatchPath | undefined;
    if (fs.existsSync(compiler.config.tsconfig)) {
      const result = loadConfig(compiler.config.tsconfig);
      if (result.resultType === 'success') {
        const { absoluteBaseUrl, paths, mainFields, addMatchAll } = result;
        matchPath = createMatchPath(
          absoluteBaseUrl,
          paths,
          mainFields,
          addMatchAll,
        );
      }
    }
    compiler.hooks.transform.tapPromise({ name }, async args => {
      if (!isJsExt(args.path) && !isJsLoader(args.loader)) {
        return args;
      }
      const { code, path: id } = args;
      const { format, alias, sourceDir, outDir, autoExtension } =
        compiler.config;
      const { root } = compiler.context;

      if (!code || format === 'iife' || format === 'umd') {
        return args;
      }

      // transform alias to absolute path
      const absoluteAlias = Object.entries(alias).reduce<typeof alias>(
        (result, [name, target]) => {
          if (!isAbsolute(target)) {
            result[name] = resolve(compiler.context.root, target);
          } else {
            result[name] = target;
          }
          return result;
        },
        {},
      );

      let matchModule: MatchModule = [];
      try {
        const sgNode = js.parse(code).root();
        const funcPattern = [`require($MATCH)`, `import($MATCH)`];
        // `export $VAR from` is invalid, so we need `{$$$VAR}`, `*` and `* as $VAR`
        // But `import $VAR from` is valid.
        const staticPattern = [
          `import $VAR from '$MATCH'`,
          `import $VAR from "$MATCH"`,
          `export {$$$VAR} from '$MATCH'`,
          `export {$$$VAR} from "$MATCH"`,
          `export * from '$MATCH'`,
          `export * from "$MATCH"`,
          `export * as $VAR from '$MATCH'`,
          `export * as $VAR from "$MATCH"`,
          `import '$MATCH'`,
          `import "$MATCH"`,
        ];
        const funcMatchModule = funcPattern
          .map(p => {
            return sgNode.findAll(p);
          })
          .flat()
          .map(node => {
            const matchNode = node.getMatch('MATCH')!;
            return {
              name: matchNode.text().slice(1, -1),
              start: matchNode.range().start.index + 1,
              end: matchNode.range().end.index - 1,
            };
          });
        const staticMatchModule = staticPattern
          .map(p => sgNode.findAll(p))
          .flat()
          .map(node => {
            const matchNode = node.getMatch('MATCH')!;
            return {
              name: matchNode.text(),
              start: matchNode.range().start.index,
              end: matchNode.range().end.index,
            };
          });
        matchModule = [...funcMatchModule, ...staticMatchModule];
      } catch (e) {
        logger.error('[parse error]', e);
      }
      if (!matchModule.length) {
        return args;
      }
      const { jsExtension, isModule } = getDefaultOutExtension({
        format,
        root,
        autoExtension,
      });
      const outputPath = resolve(outDir, relative(sourceDir, id));
      const str = await redirectImport(
        compiler,
        code,
        matchModule,
        absoluteAlias,
        id,
        dirname(outputPath),
        jsExtension,
        isModule,
        matchPath,
      );
      return {
        ...args,
        code: str.toString(),
        map: str.generateMap({
          hires: true,
          includeContent: true,
        }),
      };
    });
  },
};
