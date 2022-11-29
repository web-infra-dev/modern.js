import path from 'path';
import {
  isFileExists,
  DEFAULT_MOUNT_ID,
  getDistPath,
  setConfig,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import type { BuilderPlugin, NormalizedConfig } from '../types';
import type { Options } from '@rspack/plugin-html';

// This is a minimist subset of modern.js server routes
type RoutesInfo = {
  isSPA: boolean;
  urlPath: string;
  entryName: string;
  entryPath: string;
};

function getMinify(isProd: boolean, config: NormalizedConfig) {
  if (config.output.disableMinimize || !isProd) {
    return false;
  }

  // these options are same as the default options of html-webpack-plugin
  return {
    removeComments: true,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  };
}

function getTitle(entryName: string, config: NormalizedConfig) {
  const { title, titleByEntries } = config.html;
  return titleByEntries?.[entryName] || title || '';
}

function getInject(entryName: string, config: NormalizedConfig) {
  const { inject, injectByEntries } = config.html;
  return injectByEntries?.[entryName] || inject || true;
}

function getFavicon(entryName: string, config: NormalizedConfig) {
  const { favicon, faviconByEntries } = config.html;
  return faviconByEntries?.[entryName] || favicon;
}

async function getMetaTags(entryName: string, config: NormalizedConfig) {
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

async function getTemplateParameters(
  entryName: string,
  config: NormalizedConfig,
  assetPrefix: string,
): Promise<Options['templateParameters']> {
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

// todo: is dependOn needed in builder?
// async function getChunks(
//   entryName: string,
//   entryValue: WebpackConfig['entry'],
// ) {
//   const { isPlainObject } = await import('@modern-js/utils');
//   const dependOn = [];

//   if (isPlainObject(entryValue)) {
//     dependOn.push(...entryValue.dependOn);
//   }

//   return [...dependOn, entryName];
// }

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

    api.modifyRspackConfig(
      async (rspackConfig, { isProd, CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        // if html is disabled or target is server, skip html plugin
        if (isHtmlDisabled(config, target)) {
          return;
        }

        const { default: HTMLRspackPlugin } = await import(
          '@rspack/plugin-html'
        );
        const { removeTailSlash, applyOptionsChain } = await import(
          '@modern-js/utils'
        );

        const minify = getMinify(isProd, config);
        const assetPrefix = removeTailSlash(
          rspackConfig.output?.publicPath || '',
        );
        const entries = rspackConfig.entry || {};
        const entryNames = Object.keys(entries);
        const htmlPaths = api.getHTMLPaths();

        await Promise.all(
          entryNames.map(async (entryName, index) => {
            const entryValue = entries[entryName];
            const chunks = [entryName];
            const inject = getInject(entryName, config);
            const favicon = getFavicon(entryName, config);
            const filename = htmlPaths[entryName];
            const template = getTemplatePath(entryName, config);
            const templateParameters = await getTemplateParameters(
              entryName,
              config,
              assetPrefix,
            );

            const pluginOptions: Options = {
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

            const plugin = new HTMLRspackPlugin(finalOptions);

            // @ts-expect-error
            plugin.name = `${CHAIN_ID.PLUGIN.HTML}-${entryName}`;

            setConfig(rspackConfig, 'plugins', [
              // @ts-expect-error
              ...(rspackConfig.plugins || []),
              // @ts-expect-error
              plugin,
            ]);
          }),
        );

        if (config.html) {
          const { appIcon, crossorigin } = config.html;

          if (crossorigin) {
            const { HtmlCrossOriginPlugin } = await import(
              '../rspackPlugins/HtmlCrossOriginPlugin'
            );

            const formattedCrossorigin =
              crossorigin === true ? 'anonymous' : crossorigin;

            setConfig(rspackConfig, 'plugins', [
              ...(rspackConfig.plugins || []),
              new HtmlCrossOriginPlugin({ crossOrigin: formattedCrossorigin }),
            ]);
          }

          if (appIcon) {
            const { HtmlAppIconPlugin } = await import(
              '../rspackPlugins/HtmlAppIconPlugin'
            );

            const distDir = getDistPath(config.output, 'image');
            const iconPath = path.isAbsolute(appIcon)
              ? appIcon
              : path.join(api.context.rootPath, appIcon);

            setConfig(rspackConfig, 'plugins', [
              ...(rspackConfig.plugins || []),
              new HtmlAppIconPlugin({ iconPath, distDir }),
            ]);
          }
        }
      },
    );

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
