import path from 'path';
import {
  isFileExists,
  DEFAULT_MOUNT_ID,
  getDistPath,
  getMinify,
  getTitle,
  getInject,
  getFavicon,
  getMetaTags,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  WebpackConfig,
  HTMLPluginOptions,
  NormalizedConfig,
} from '../types';

// This is a minimist subset of modern.js server routes
type RoutesInfo = {
  isSPA: boolean;
  urlPath: string;
  entryName: string;
  entryPath: string;
};

async function getTemplateParameters(
  entryName: string,
  config: NormalizedConfig,
  assetPrefix: string,
): Promise<HTMLPluginOptions['templateParameters']> {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const { mountId, templateParameters, templateParametersByEntries } =
    config.html;

  const meta = await getMetaTags(entryName, config);
  const title = getTitle(entryName, config);
  const templateParams =
    templateParametersByEntries?.[entryName] || templateParameters;
  const baseParameters = {
    meta,
    title,
    mountId: mountId || DEFAULT_MOUNT_ID,
    entryName,
    assetPrefix,
  };

  return (compilation, assets, assetTags, pluginOptions) => {
    const defaultOptions = {
      compilation,
      webpackConfig: compilation.options,
      htmlWebpackPlugin: {
        tags: assetTags,
        files: assets,
        options: pluginOptions,
      },
      ...baseParameters,
    };
    return applyOptionsChain(defaultOptions, templateParams);
  };
}

export function getTemplatePath(entryName: string, config: NormalizedConfig) {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );
  const { template = DEFAULT_TEMPLATE, templateByEntries = {} } = config.html;
  return templateByEntries[entryName] || template;
}

async function getChunks(
  entryName: string,
  entryValue: WebpackConfig['entry'],
) {
  const { isPlainObject } = await import('@modern-js/utils');
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entryValue.dependOn);
  }

  return [...dependOn, entryName];
}

export const isHtmlDisabled = (
  config: NormalizedConfig,
  target: BuilderTarget,
) =>
  config.tools.htmlPlugin === false ||
  target === 'node' ||
  target === 'web-worker';

export const PluginHtml = (): BuilderPlugin => ({
  name: 'builder-plugin-html',

  setup(api) {
    const routesInfo: RoutesInfo[] = [];

    api.modifyWebpackChain(async (chain, { isProd, CHAIN_ID, target }) => {
      const config = api.getNormalizedConfig();

      // if html is disabled or target is server, skip html plugin
      if (isHtmlDisabled(config, target)) {
        return;
      }

      const { default: HtmlWebpackPlugin } = await import(
        'html-webpack-plugin'
      );
      const { removeTailSlash, applyOptionsChain } = await import(
        '@modern-js/utils'
      );

      const minify = getMinify(isProd, config);
      const assetPrefix = removeTailSlash(chain.output.get('publicPath') || '');
      const entries = chain.entryPoints.entries() || {};
      const entryNames = Object.keys(entries);
      const htmlPaths = api.getHTMLPaths();

      await Promise.all(
        entryNames.map(async (entryName, index) => {
          const entryValue = entries[
            entryName
          ].values() as WebpackConfig['entry'];
          const chunks = await getChunks(entryName, entryValue);
          const inject = getInject(entryName, config);
          const favicon = getFavicon(entryName, config);
          const filename = htmlPaths[entryName];
          const template = getTemplatePath(entryName, config);
          const templateParameters = await getTemplateParameters(
            entryName,
            config,
            assetPrefix,
          );

          const pluginOptions: HTMLPluginOptions = {
            chunks,
            inject,
            minify,
            favicon,
            filename,
            template,
            templateParameters,
          };

          const finalOptions = applyOptionsChain(
            pluginOptions,
            config.tools.htmlPlugin,
            {
              entryName,
              entryValue,
            },
          );

          routesInfo.push({
            urlPath: index === 0 ? '/' : `/${entryName}`,
            entryName,
            entryPath: filename,
            isSPA: true,
          });

          chain
            .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
            .use(HtmlWebpackPlugin, [finalOptions]);
        }),
      );

      if (config.html) {
        const { appIcon, crossorigin } = config.html;

        if (crossorigin) {
          const { HtmlCrossOriginPlugin } = await import(
            '../webpackPlugins/HtmlCrossOriginPlugin'
          );

          const formattedCrossorigin =
            crossorigin === true ? 'anonymous' : crossorigin;

          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_CROSS_ORIGIN)
            .use(HtmlCrossOriginPlugin, [
              { crossOrigin: formattedCrossorigin },
            ]);

          chain.output.crossOriginLoading(formattedCrossorigin);
        }

        if (appIcon) {
          const { HtmlAppIconPlugin } = await import(
            '../webpackPlugins/HtmlAppIconPlugin'
          );

          const distDir = getDistPath(config.output, 'image');
          const iconPath = path.isAbsolute(appIcon)
            ? appIcon
            : path.join(api.context.rootPath, appIcon);

          chain
            .plugin(CHAIN_ID.PLUGIN.APP_ICON)
            .use(HtmlAppIconPlugin, [{ iconPath, distDir }]);
        }
      }
    });

    api.onBeforeStartDevServer(async () => {
      const { fs, ROUTE_SPEC_FILE } = await import('@modern-js/utils');
      const routeFilePath = path.join(api.context.distPath, ROUTE_SPEC_FILE);

      // generate a basic route.json for modern.js dev server
      // if the framework has already generate a route.json, do nothing
      if (!(await isFileExists(routeFilePath)) && routesInfo.length) {
        await fs.outputFile(
          routeFilePath,
          JSON.stringify({ routes: routesInfo }, null, 2),
        );
      }
    });
  },
});
