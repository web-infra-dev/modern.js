/**
 * This plugin is used to redirectImport only in unbundle mode
 * Taking from https://github.com/ice-lab/icepkg/blob/main/packages/pkg/src/plugins/transform/alias.ts
 */
import { isAbsolute, resolve, relative, join, dirname, win32, basename, extname } from 'path';
import { init, parse } from 'es-module-lexer';
import type { ImportSpecifier } from 'es-module-lexer';
import { js } from '@ast-grep/napi';
import MagicString from 'magic-string';
import { resolvePathAndQuery } from '@modern-js/libuild-utils';
import { createMatchPath, loadConfig, MatchPath } from 'tsconfig-paths';
import { ILibuilder, LibuildPlugin } from '../types';
import { getAssetContents, assetExt } from './asset';
import { isCssModule } from './style/postcssTransformer';

function normalizeSlashes(file: string) {
  return file.split(win32.sep).join('/');
}

type MatchModule = {
  name?: string;
  start: number;
  end: number;
}[];

async function redirectImport(
  compiler: ILibuilder,
  code: string,
  modules: MatchModule,
  aliasRecord: Record<string, string>,
  filePath: string,
  outputDir: string,
  matchPath?: MatchPath
): Promise<MagicString> {
  const str: MagicString = new MagicString(code);
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  await Promise.all(
    modules.map(async (module) => {
      if (!module.name) {
        return;
      }
      const { start, end } = module;
      let { name } = module;

      const { alias, style, asset } = compiler.config.redirect;

      if (alias) {
        // redirect alias
        let absoluteImportPath = matchPath ? matchPath(name, undefined, undefined, extensions) : undefined;
        for (const alias of Object.keys(aliasRecord)) {
          // prefix
          if (name.startsWith(`${alias}/`)) {
            absoluteImportPath = join(aliasRecord[alias], name.slice(alias.length + 1));
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
            relativePath.startsWith('..') ? relativePath : `./${relativePath}`
          );
          str.overwrite(start, end, relativeImportPath);
          name = relativeImportPath;
        }
      }

      if (style) {
        // redirect style path
        const { originalFilePath, query } = resolvePathAndQuery(name);
        const ext = extname(name);

        if (query.css_virtual) {
          // css module
          const replacedName = basename(originalFilePath, extname(originalFilePath)).replace('.', '_');
          const base = `${replacedName}.css`;
          const contents = compiler.virtualModule.get(originalFilePath)!;
          const fileName = join(outputDir, base);
          compiler.emitAsset(fileName, {
            type: 'asset',
            contents,
            fileName,
            originalFileName: originalFilePath,
            entryPoint: originalFilePath,
          });
          const relativeImportPath = normalizeSlashes(`./${base}`);
          str.overwrite(start, end, relativeImportPath);
        }

        if (!name.startsWith('.')) {
          return;
        }

        if (ext === '.less' || ext === '.sass' || ext === '.scss' || ext === '.css') {
          // less sass
          if (isCssModule(name!, compiler.config.style.autoModules ?? true)) {
            str.overwrite(start, end, `${name.slice(0, -ext.length)}`);
          } else {
            str.overwrite(start, end, `${name.slice(0, -ext.length)}.css`);
          }
          return;
        }
      }

      if (asset) {
        if (assetExt.filter((ext) => name.endsWith(ext)).length) {
          // asset
          const absPath = resolve(dirname(filePath), name);
          const svgrResult = await compiler.loadSvgr(absPath);
          if (svgrResult) {
            // svgr
            const ext = extname(name);
            const outputName = `${name.slice(0, -ext.length)}.js`;
            str.overwrite(start, end, outputName);
          } else {
            // other assets
            const { contents: relativeImportPath } = await getAssetContents.apply(compiler, [absPath, outputDir]);
            str.overwrite(start, end, `${relativeImportPath}`);
          }
        }
      }
    })
  );
  return str;
}

// base dir to redirect import path
export const redirectPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:redirect';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.processAsset.tapPromise(pluginName, async (args) => {
        if (args.type === 'asset') return args;
        const { contents: code, fileName, entryPoint: id } = args;
        const {
          format,
          resolve: { alias },
        } = compiler.config;

        if (!code || format === 'iife' || format === 'umd') {
          return args;
        }

        // transform alias to absolute path
        const absoluteAlias = Object.entries(alias).reduce<typeof alias>((result, [name, target]) => {
          if (!isAbsolute(target)) {
            result[name] = resolve(compiler.config.root, target);
          } else {
            result[name] = target;
          }
          return result;
        }, {});

        // get matchPath func to support tsconfig paths
        const result = loadConfig(compiler.config.root);
        let matchPath: MatchPath | undefined;
        if (result.resultType === 'success') {
          const { absoluteBaseUrl, paths, mainFields, addMatchAll } = result;
          matchPath = createMatchPath(absoluteBaseUrl, paths, mainFields, addMatchAll);
        }

        let matchModule: MatchModule = [];
        if (format === 'esm') {
          await init;
          let imports: readonly ImportSpecifier[] = [];
          try {
            [imports] = parse(code);
          } catch (e) {
            console.error('[parse error]', e);
          }
          matchModule = imports.map((targetImport) => {
            return {
              name: targetImport.n,
              start: targetImport.s,
              end: targetImport.e,
            };
          });
        }
        if (format === 'cjs') {
          try {
            const sgNode = js.parse(code).root();
            matchModule = sgNode.findAll('require($MATCH)').map((node) => {
              const matchNode = node.getMatch('MATCH')!;
              return {
                name: matchNode.text().slice(1, -1),
                start: matchNode.range().start.index + 1,
                end: matchNode.range().end.index - 1,
              };
            });
          } catch (e) {
            console.error('[parse error]', e);
          }
        }
        if (!matchModule.length) {
          return args;
        }
        const str = await redirectImport(compiler, code, matchModule, absoluteAlias, id!, dirname(fileName), matchPath);
        return {
          ...args,
          contents: str.toString(),
          map: str.generateMap({
            hires: true,
            includeContent: true,
          }),
        };
      });
    },
  };
};
