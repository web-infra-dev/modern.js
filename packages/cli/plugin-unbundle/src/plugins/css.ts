import fs from 'fs';
import path from 'path';
import { chalk } from '@modern-js/utils';
import { Alias } from '@rollup/plugin-alias';
import { Plugin as RollupPlugin, SourceMap } from 'rollup';
import postcss, { AcceptedPlugin, ProcessOptions } from 'postcss';
import { codeFrameColumns } from '@babel/code-frame';
import logger from 'signale';
import type { ImporterReturnType } from 'sass';
import less from 'less';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  getLessConfig,
  getPostcssConfig,
  getSassConfig,
} from '@modern-js/css-config';
import { isCSSRequest, replaceAsync, addQuery, hasDependency } from '../utils';
import {
  CSS_MODULE_REGEX,
  CSS_URL_FUNCTION_REGEX,
  DEV_CLIENT_URL,
} from '../constants';
import { HMRError } from '../websocket-server';
import { createAssetModule, fileToModules } from '../AssetModule';
import { normalizeAlias } from './alias';

export interface PreProcessOptions {
  lessOptions?: Record<string, any>;
  sassOptions?: Record<string, any>;
  additionalData: string | ((content: string, filename: string) => string);
}

export interface TransformRes {
  css?: string;
  errors?: HMRError[];
  deps?: string[];
  map?: SourceMap;
}

let processorOptions: {
  less: PreProcessOptions;
  sass: PreProcessOptions;
};

let nodeModulesPaths: Array<string> = [];

let postcssConfig: {
  postcssOptions: ProcessOptions & {
    plugins: AcceptedPlugin[];
  };
};

let tailwindConfig: any;

// record css modules locals json
const moduleLocalsMap = new Map();

const initProcessorOptions = (config: NormalizedConfig) => {
  if (processorOptions) {
    return;
  }

  const lessOptions = getLessConfig(config);
  const sassOptions = getSassConfig(config);

  processorOptions = {
    less: lessOptions,
    sass: sassOptions,
  };
};

const initTailwindConfig = (config: NormalizedConfig) => {
  try {
    if (!tailwindConfig) {
      // TODO: talwindcss config.
      tailwindConfig = (config.tools as any).tailwind;
    }
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
    // ignore err
  }
};

const initPostcssConfig = (
  config: NormalizedConfig,
  { appDirectory }: IAppContext,
) => {
  if (postcssConfig) {
    return;
  }

  // FIXME: type any
  postcssConfig = getPostcssConfig(appDirectory, config, false) as any;
};

let matchAlias: (request: string) => Alias | undefined;

const createIsAliasRequest = (
  config: NormalizedConfig,
  appContext: IAppContext,
) => {
  if (!matchAlias) {
    const aliasOptions = normalizeAlias(config, appContext);
    matchAlias = (request: string) =>
      aliasOptions.find((alias: Alias) => {
        const { find } = alias;
        if (find instanceof RegExp) {
          return find.test(request);
        } else if (typeof find === 'string') {
          if (request.length < find.length) {
            return false;
          }
          if (request.length === find.length) {
            return true;
          }

          const requestStartsWithKey = request.startsWith(find);
          const requestHasSlashAfterKey = request
            .substring(find.length)
            .startsWith('/');
          return requestStartsWithKey && requestHasSlashAfterKey;
        }
        return false;
      });
  }
};

function getSource(
  source: string,
  filename: string,
  additionalData?: string | ((content: string, filename: string) => string),
) {
  if (!additionalData) {
    return source;
  }
  if (typeof additionalData === 'function') {
    return additionalData(source, filename);
  }
  return `${additionalData}\n${source}`;
}

const isCSSModule = (config: NormalizedConfig, id: string): boolean => {
  if (id.includes(`node_modules`)) {
    return false;
  }

  const {
    output: { disableCssModuleExtension },
  } = config;

  if (disableCssModuleExtension) {
    return true;
  }

  return CSS_MODULE_REGEX.test(id);
};

export class CustomLessFileManager extends less.FileManager {
  async loadFile(
    filename: string,
    currentDirectory: string,
    options: Less.LoadFileOptions,
    environment: Less.Environment,
  ) {
    let result;

    if (filename.startsWith('~')) {
      filename = filename.slice(1);
    }

    try {
      result = await super.loadFile(
        filename,
        currentDirectory,
        options,
        environment,
      );
    } catch (err) {
      if (err.type !== 'File') {
        return Promise.reject(err);
      }

      const matched = matchAlias(filename);
      if (matched) {
        return super.loadFile(
          filename.replace(matched.find, matched.replacement),
          currentDirectory,
          options,
          environment,
        );
      } else {
        return Promise.reject(err);
      }
    }

    return result;
  }
}

const compileLess = async (
  code: string,
  filename: string,
  options: PreProcessOptions,
): Promise<TransformRes> => {
  const less = require('less');

  try {
    const res = await less.render(
      getSource(code, filename, options.additionalData),
      {
        filename,
        sourceMap: true,
        ...options.lessOptions,
        plugins: [
          {
            install(lessInstance: any, pluginManager: any) {
              pluginManager.addFileManager(new CustomLessFileManager());
            },
          },
        ],
      },
    );

    return { css: res.css, deps: res.imports || [], map: res.map };
  } catch (err) {
    if (err.filename) {
      err.frame = codeFrameColumns(fs.readFileSync(err.filename, 'utf8'), {
        start: {
          line: err.line,
          column: err.column,
        },
      });
    }

    err.loc = {
      file: err.filename,
      line: err.line,
      column: err.column,
    };

    return { errors: [err] };
  }
};

const compileSass = async (
  code: string,
  filename: string,
  options: PreProcessOptions,
): Promise<TransformRes> => {
  const sass = require('sass');

  try {
    const result: any = await new Promise((resolve, reject) => {
      sass.render(
        {
          ...options.sassOptions,
          data: getSource(code, filename, options.additionalData),
          identSyntax: filename.endsWith('.sass'),
          includePaths: [path.dirname(filename), ...nodeModulesPaths],
          outFile: filename,
          file: filename,
          sourceMap: true,
          importer(
            url: string,
            prev: string,
            done: (data: ImporterReturnType) => void,
          ) {
            if (url.startsWith('~')) {
              url = url.slice(1);
            }
            const matched = matchAlias(url);
            done({
              file: matched
                ? url.replace(matched.find, matched.replacement)
                : url,
            });
          },
        },
        (err: Error | null, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
      );
    });

    return {
      css: result.css.toString(),
      deps: result.stats.includedFiles || [],
      map: result.map.toString(),
    };
  } catch (e) {
    e.loc = {
      file: e.file,
      line: e.line,
      column: e.column,
    };
    return { errors: [e] };
  }
};

const transformCSS = async (
  code: string,
  filename: string,
  config: NormalizedConfig,
  { appDirectory }: IAppContext,
): Promise<TransformRes> => {
  const extname = path.extname(filename);

  let css: string | undefined;
  let errors: HMRError[] | undefined;
  let deps: string[] | undefined = [];
  let map: SourceMap | undefined;
  // pre process
  switch (extname) {
    case '.less': {
      ({ css, errors, deps, map } = await compileLess(
        code,
        filename,
        processorOptions.less,
      ));
      break;
    }
    case '.sass':
    case '.scss': {
      ({ css, errors, deps, map } = await compileSass(
        code,
        filename,
        processorOptions.sass,
      ));
      break;
    }
    default: {
      // empty
    }
  }

  if (!deps) {
    deps = [];
  }

  if (errors?.length) {
    throw errors[0] as Error;
  }

  // less/sass 处理完之后空文件时，直接返回
  if (extname !== '.css' && !css) {
    return { css: '' };
  }

  // postcss
  const postcssPlugins = [...postcssConfig.postcssOptions.plugins];
  if (isCSSModule(config, filename)) {
    postcssPlugins.push(
      require('postcss-modules')({
        localsConvention: 'camelCase',
        generateScopedName: config.output.cssModuleLocalIdentName,
        globalModulePaths: [/\.global\.(css|scss|sass|less|stylus|styl)$/],
        getJSON(_: string, _modules: Record<string, string>) {
          moduleLocalsMap.set(filename, _modules);
        },
      }),
    );
  }

  if (hasDependency(appDirectory, `@modern-js/plugin-tailwindcss`)) {
    postcssPlugins.push(require('tailwindcss')(tailwindConfig));
  }

  try {
    const result = await postcss(postcssPlugins).process(css || code, {
      from: filename,
      to: filename,
      map: {
        inline: false,
        annotation: false,
        prev: map,
      },
      ...postcssConfig.postcssOptions,
    });

    if (result?.messages.length) {
      for (const message of result.messages) {
        if (message.type === 'dependency') {
          deps.push(message.file as string);
        } else if (message.type === 'warning') {
          let tips = `[${message.plugin as string}] ${message.text}\n`;
          if (message.line && message.column) {
            tips += `${codeFrameColumns(code, {
              start: {
                line: message.line,
                column: message.column,
              },
            })}`;
          }
          logger.warn(chalk.yellowBright(tips));
        }
      }
    }

    // deps tree for css  hmr
    const assetModule = fileToModules.get(filename);

    for (const dep of Array.from(new Set(deps))) {
      const depModule = createAssetModule(path.relative(filename, dep));
      depModule.filePath = dep;
      depModule.id = dep;
      assetModule!.dependencies.add(dep);
      depModule.dependents.add(assetModule!.id);
    }

    return {
      css: result.css,
      map: result.map as any,
    };
  } catch (err) {
    if (err.line !== undefined && err.column !== undefined) {
      err.loc = {
        file: err.file,
        line: err.line,
        column: err.column,
      };
      err.frame = codeFrameColumns(err.input.source, {
        start: {
          line: err.line,
          column: err.column,
        },
      });
    }
    throw err;
  }
};

// css url() assets rewrite
const rewriteCssUrl = async (
  code: string | undefined,
  replacer: (resource: string) => Promise<string>,
): Promise<string | undefined> => {
  if (!code) {
    return;
  }
  return replaceAsync(
    code,
    CSS_URL_FUNCTION_REGEX,
    async (match: string, $1: string) => {
      if (/^["']?(https?|data:|#)/.test($1.trim())) {
        return match;
      }
      const replaced = await replacer($1);
      return `url('${replaced}')`;
    },
  );
};

export const cssPlugin = (
  config: NormalizedConfig,
  appContext: IAppContext,
): RollupPlugin => ({
  name: 'esm-css',
  async transform(code: string, importer: string) {
    if (!isCSSRequest(importer)) {
      return null;
    }

    const { appDirectory } = appContext;

    // find parent node_modules paths for sass and stylus
    nodeModulesPaths = require('find-node-modules')({ cwd: appDirectory });

    initProcessorOptions(config);

    initPostcssConfig(config, appContext);

    initTailwindConfig(config);

    createIsAliasRequest(config, appContext);

    const { css, map } = await transformCSS(code, importer, config, appContext);

    // css url() rewrite
    const rewrited = await rewriteCssUrl(
      css,
      async (resource: string): Promise<string> => {
        resource = resource.replace(/(^['"])|(['"]$)/g, '').replace(/^~/, '');

        // try to resolve url request
        // if resolved then return relative url
        // if can't resolve just return original resource
        // should ignore error here, such as cursor: url(mycursor.cur)
        try {
          const resolved = await this.resolve(resource, path.dirname(importer));

          const filePath =
            typeof resolved === 'object' ? resolved?.id || resource : resolved;

          const relativeUrl = path.relative(appDirectory, filePath);

          let rewrite = relativeUrl.startsWith('.')
            ? filePath
            : `/${relativeUrl}`;

          // resource HMR
          if (path.extname(filePath) === '.css') {
            rewrite = addQuery(rewrite, 'direct');
            const assetModule = fileToModules.get(importer);

            assetModule!.dependencies.add(rewrite);

            const depModule = createAssetModule(rewrite);
            depModule.filePath = filePath;
            depModule.id = rewrite;

            depModule.dependents.add(assetModule!.id);
          }

          return rewrite;
        } catch (err) {
          logger.warn(`Can't resolve resource ${resource} in ${importer}`);
          return resource;
        }
      },
    );

    const wrappedCss = [
      `import { updateStyle, removeStyle } from "${DEV_CLIENT_URL}"`,
      `const code = ${JSON.stringify(rewrited)}`,
      `const filename = ${JSON.stringify(importer)}`,
      `updateStyle(filename, code);`,
      moduleLocalsMap.has(importer) &&
        `export default ${JSON.stringify(moduleLocalsMap.get(importer))};`,
    ]
      .filter(Boolean)
      .join('\n');

    return { code: wrappedCss, map };
  },
});
