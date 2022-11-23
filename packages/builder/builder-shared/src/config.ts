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
  DEFAULT_DATA_URL_SIZE,
} from './constants';
import type {
  NormalizedSharedDevConfig,
  NormalizedSharedOutputConfig,
  SharedHtmlConfig,
  NormalizedSharedSourceConfig,
  InspectConfigOptions,
  CreateBuilderOptions,
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
  define: {},
  alias: {},
  preEntry: [],
  globalVars: {},
  compileJsDataURI: true,
};

export const defaultHtmlConfig: SharedHtmlConfig = {
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
  disableMinimize: false,
  disableSourceMap: false,
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
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: chalk } = await import('@modern-js/utils/chalk');
  const { outputPath } = inspectOptions;

  const { target } = builderOptions;
  const files = [
    {
      path: join(outputPath, 'builder.config.js'),
      label: 'Builder Config',
      content: builderConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const suffix = Array.isArray(target) ? target[index] : `target-${index}`;
      const outputFile = `${configType}.config.${suffix}.js`;
      return {
        path: join(outputPath, outputFile),
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
