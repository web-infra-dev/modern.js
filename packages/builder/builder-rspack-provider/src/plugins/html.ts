import path from 'path';
import { isFileExists } from '@modern-js/builder-shared';
import { getDistPath } from '../shared';
import type {
  BuilderConfig,
  BuilderPlugin,
  RspackConfig,
} from '../types';

// This is a minimist subset of modern.js server routes
type RoutesInfo = {
  isSPA: boolean;
  urlPath: string;
  entryName: string;
  entryPath: string;
};

async function getFilename(entryName: string, config: BuilderConfig) {
  const { removeLeadingSlash } = await import('@modern-js/utils');
  const htmlPath = getDistPath(config, 'html');
  const filename = config.html?.disableHtmlFolder
    ? `${entryName}.html`
    : `${entryName}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}

function getInject(entryName: string, config: BuilderConfig) {
  const { inject, injectByEntries } = config.html || {};
  // because rspack only support ['head', 'body'] to inject
  const normalInject = injectByEntries?.[entryName] || inject || true;
  return typeof normalInject === 'string' ? normalInject : 'body'
}

export function getTemplatePath(entryName: string, config: BuilderConfig) {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );
  const { template = DEFAULT_TEMPLATE, templateByEntries = {} } =
    config.html || {};
  return templateByEntries[entryName] || template;
}

async function getChunks(
  entryName: string,
  entryValue: RspackConfig['entry'],
) {
  const { isPlainObject } = await import('@modern-js/utils');
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    dependOn.push(...entryValue.dependOn);
  }

  return [...dependOn, entryName];
}

export const PluginHtml = (): BuilderPlugin => ({
  name: 'builder-plugin-html',

  setup(api) {
    const routesInfo: RoutesInfo[] = [];

    api.modifyRspackConfig(async (rspackConfig, { isProd, CHAIN_ID }) => {
      const config = api.getBuilderConfig();

      // if html is disabled, return following logics
      if (config.tools?.htmlPlugin === false) {
        return;
      }
      const { removeTailSlash, applyOptionsChain } = await import(
        '@modern-js/utils'
      );

      // const minify = getMinify(isProd, config);
      // const assetPrefix = removeTailSlash(
      //   rspackConfig.output?.publicPath || '',
      // );
      const entryNames = Object.keys(rspackConfig.entry!);

      await Promise.all(
        entryNames.map(async (entryName, index) => {
          const entryValue = rspackConfig.entry![entryName];
          // const chunks = [entryName];
          const inject = getInject(entryName, config);
          // const favicon = getFavicon(entryName, config);
          const filename = await getFilename(entryName, config);
          const template = getTemplatePath(entryName, config);
          // const templateParameters = await getTemplateParameters(
          //   entryName,
          //   config,
          //   assetPrefix,
          // );

          const pluginOptions = {
            inject,
            filename,
            template,
          };

          routesInfo.push({
            urlPath: index === 0 ? '/' : `/${entryName}`,
            entryName,
            entryPath: filename,
            isSPA: true,
          });

          const htmlBuilts = rspackConfig.builtins?.html || [];
          rspackConfig.builtins!.html = [
            ...htmlBuilts,
            pluginOptions
          ]
        }),
      );
    });

    api.onBeforeStartDevServer(async () => {
      const { fs, ROUTE_SPEC_FILE } = await import('@modern-js/utils');
      const routeFilePath = path.join(api.context.distPath, ROUTE_SPEC_FILE);

      // generate a basic route.json for modern.js dev server
      // if the framework has already generate a route.json, do nothing
      if (!(await isFileExists(routeFilePath))) {
        await fs.outputFile(
          routeFilePath,
          JSON.stringify({ routes: routesInfo }, null, 2),
        );
      }
    });
  },
});
