import {
  DEFAULT_PORT,
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  FONT_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
  SERVER_DIST_DIR,
  DEFAULT_MOUNT_ID,
  DEFAULT_DATA_URL_SIZE,
} from './constants';
import type {
  BuilderTarget,
  SharedHtmlConfig,
  InspectConfigOptions,
  CreateBuilderOptions,
  NormalizedSharedDevConfig,
  NormalizedSharedOutputConfig,
  NormalizedSharedSourceConfig,
  NormalizedSharedHtmlConfig,
} from './types';
import { logger } from './logger';
import { join } from 'path';

import _ from '@modern-js/utils/lodash';

export const defaultDevConfig: NormalizedSharedDevConfig = {
  hmr: true,
  https: false,
  port: DEFAULT_PORT,
  assetPrefix: '/',
  startUrl: false,
  progressBar: true,
};

export const defaultSourceConfig: NormalizedSharedSourceConfig = {
  preEntry: [],
  globalVars: {},
  compileJsDataURI: true,
};

export const defaultHtmlConfig: NormalizedSharedHtmlConfig = {
  inject: 'head',
  mountId: DEFAULT_MOUNT_ID,
  crossorigin: false,
  disableHtmlFolder: false,
};

export const defaultOutputConfig: NormalizedSharedOutputConfig = {
  distPath: {
    root: ROOT_DIST_DIR,
    js: JS_DIST_DIR,
    css: CSS_DIST_DIR,
    svg: SVG_DIST_DIR,
    font: FONT_DIST_DIR,
    html: HTML_DIST_DIR,
    image: IMAGE_DIST_DIR,
    media: MEDIA_DIST_DIR,
    server: SERVER_DIST_DIR,
  },
  filename: {},
  charset: 'ascii',
  polyfill: 'entry',
  dataUriLimit: {
    svg: DEFAULT_DATA_URL_SIZE,
    font: DEFAULT_DATA_URL_SIZE,
    image: DEFAULT_DATA_URL_SIZE,
    media: DEFAULT_DATA_URL_SIZE,
  },
  legalComments: 'linked',
  cleanDistPath: true,
  svgDefaultExport: 'url',
  disableCssExtract: false,
  disableMinimize: false,
  disableSourceMap: {
    js: false,
    css: undefined,
  },
  disableTsChecker: false,
  disableFilenameHash: false,
  disableCssModuleExtension: false,
  disableInlineRuntimeChunk: false,
  enableAssetFallback: false,
  enableAssetManifest: false,
  enableLatestDecorators: false,
  enableCssModuleTSDeclaration: false,
  enableInlineScripts: false,
  enableInlineStyles: false,
};

export async function outputInspectConfigFiles({
  builderConfig,
  bundlerConfigs,
  inspectOptions,
  builderOptions,
  configType,
}: {
  configType: string;
  builderConfig: string;
  bundlerConfigs: string[];
  inspectOptions: InspectConfigOptions & {
    outputPath: string;
  };
  builderOptions: Required<CreateBuilderOptions>;
}) {
  const { fs, chalk, nanoid } = await import('@modern-js/utils');
  const { outputPath } = inspectOptions;

  const { target } = builderOptions;
  const files = [
    {
      path: join(outputPath, 'builder.config.js'),
      label: 'Builder Config',
      content: builderConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const suffix = Array.isArray(target) ? target[index] : target;
      const outputFile = `${configType}.config.${suffix}.js`;
      let outputFilePath = join(outputPath, outputFile);

      // if filename is conflict, add a random id to the filename.
      if (fs.existsSync(outputFilePath)) {
        outputFilePath = outputFilePath.replace(/\.js$/, `.${nanoid(4)}.js`);
      }

      return {
        path: outputFilePath,
        label: `${_.upperFirst(configType)} Config (${suffix})`,
        content,
      };
    }),
  ];

  await Promise.all(
    files.map(item =>
      fs.outputFile(item.path, `module.exports = ${item.content}`),
    ),
  );

  const fileInfos = files
    .map(
      item =>
        `  - ${chalk.bold.yellow(item.label)}: ${chalk.underline(item.path)}`,
    )
    .join('\n');

  logger.success(
    `Inspect config succeed, open following files to view the content: \n\n${fileInfos}\n`,
  );
}

/**
 * lodash set type declare.
 * eg. a.b.c; a[0].b[1]
 */
export type GetTypeByPath<
  T extends string,
  C extends Record<string, any>,
> = T extends `${infer K}[${infer P}]${infer S}`
  ? GetTypeByPath<`${K}.${P}${S}`, C>
  : T extends `${infer K}.${infer P}`
  ? GetTypeByPath<P, K extends '' ? C : NonNullable<C[K]>>
  : C[T];

export const setConfig = <T extends Record<string, any>, P extends string>(
  config: T,
  path: P,
  value: GetTypeByPath<P, T>,
) => {
  _.set(config, path, value);
};

export function getExtensions({
  target = 'web',
  resolveExtensionPrefix,
  isTsProject,
}: {
  target?: BuilderTarget;
  resolveExtensionPrefix?: NormalizedSharedSourceConfig['resolveExtensionPrefix'];
  isTsProject?: boolean;
} = {}) {
  let extensions = [
    // only resolve .ts(x) files if it's a ts project
    // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
    ...(isTsProject ? ['.ts', '.tsx'] : []),
    '.js',
    '.jsx',
    '.mjs',
    '.json',
  ];

  // add an extra prefix to all extensions
  if (resolveExtensionPrefix) {
    const extensionPrefix =
      typeof resolveExtensionPrefix === 'string'
        ? resolveExtensionPrefix
        : resolveExtensionPrefix[target];

    if (extensionPrefix) {
      extensions = extensions.reduce<string[]>(
        (ret, ext) => [...ret, extensionPrefix + ext, ext],
        [],
      );
    }
  }

  return extensions;
}

export function getMinify(
  isProd: boolean,
  config: {
    output: NormalizedSharedOutputConfig;
  },
) {
  if (config.output.disableMinimize || !isProd) {
    return false;
  }

  return {
    removeComments: false,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  };
}

export function getTitle(
  entryName: string,
  config: { html: SharedHtmlConfig },
) {
  const { title, titleByEntries } = config.html;
  return titleByEntries?.[entryName] || title || '';
}

export function getInject(
  entryName: string,
  config: { html: SharedHtmlConfig },
) {
  const { inject, injectByEntries } = config.html;
  return injectByEntries?.[entryName] || inject || true;
}

export function getFavicon(
  entryName: string,
  config: {
    html: SharedHtmlConfig;
  },
) {
  const { favicon, faviconByEntries } = config.html;
  return faviconByEntries?.[entryName] || favicon;
}

export async function getMetaTags(
  entryName: string,
  config: { html: SharedHtmlConfig; output: NormalizedSharedOutputConfig },
) {
  const { generateMetaTags } = await import('@modern-js/utils');
  const { meta, metaByEntries } = config.html;

  const metaOptions = {
    ...(metaByEntries?.[entryName] || meta || {}),
  };

  if (config.output.charset === 'utf8') {
    metaOptions.charset = { charset: 'utf-8' };
  }

  return generateMetaTags(metaOptions);
}

export async function stringifyConfig(config: unknown, verbose?: boolean) {
  const { default: WebpackChain } = await import('../compiled/webpack-5-chain');

  // webpackChain.toString can be used as a common stringify method
  const stringify = WebpackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config as any, { verbose });
}
