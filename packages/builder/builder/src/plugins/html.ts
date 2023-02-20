import path from 'path';
import {
  isFileExists,
  isHtmlDisabled,
  getDistPath,
  getMinify,
  getTitle,
  getInject,
  getFavicon,
  getMetaTags,
  getTemplatePath,
} from '@modern-js/builder-shared';
import type {
  DefaultBuilderPlugin,
  SharedNormalizedConfig,
  SharedBuilderPluginAPI,
  HtmlTagsPluginOptions,
  HTMLPluginOptions,
} from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';

// This is a minimist subset of modern.js server routes
type RoutesInfo = {
  isSPA: boolean;
  urlPath: string;
  entryName: string;
  entryPath: string;
};

async function getTemplateParameters(
  entryName: string,
  config: SharedNormalizedConfig,
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
    mountId,
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

async function getChunks(entryName: string, entryValue: string | string[]) {
  const { isPlainObject } = await import('@modern-js/utils');
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entryValue.dependOn);
  }

  return [...dependOn, entryName];
}

export const applyInjectTags = (api: SharedBuilderPluginAPI) => {
  api.modifyBundlerChain(async (chain, { HtmlPlugin, CHAIN_ID }) => {
    const config = api.getNormalizedConfig();
    const tags = _.castArray(config.html.tags).filter(Boolean);
    const tagsByEntries = _.mapValues(config.html.tagsByEntries, tags =>
      _.castArray(tags).filter(Boolean),
    );
    const shouldByEntries = _.some(tagsByEntries, 'length');

    // skip if options is empty.
    if (!tags.length && !shouldByEntries) {
      return;
    }
    // dynamic import.
    const { HtmlTagsPlugin } = await import('@modern-js/builder-shared');
    // const { HtmlTagsPlugin } = await import('../webpackPlugins/HtmlTagsPlugin');
    // create shared options used for entry without specified options.
    const sharedOptions: HtmlTagsPluginOptions = {
      HtmlPlugin,
      append: true,
      hash: false,
      publicPath: true,
      tags,
    };
    // apply only one webpack plugin if `html.tagsByEntries` is empty.
    if (tags.length && !shouldByEntries) {
      chain
        .plugin(CHAIN_ID.PLUGIN.HTML_TAGS)
        .use(HtmlTagsPlugin, [sharedOptions]);
      return;
    }
    // apply webpack plugin for each entries.
    for (const [entry, filename] of Object.entries(api.getHTMLPaths())) {
      const opts = { ...sharedOptions, includes: [filename] };
      entry in tagsByEntries && (opts.tags = tagsByEntries[entry]);
      chain
        .plugin(`${CHAIN_ID.PLUGIN.HTML_TAGS}#${entry}`)
        .use(HtmlTagsPlugin, [opts]);
    }
  });
};

export const builderPluginHtml = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-html',

  setup(api) {
    const routesInfo: RoutesInfo[] = [];

    api.modifyBundlerChain(
      async (chain, { HtmlPlugin, isProd, CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        // if html is disabled or target is server, skip html plugin
        if (isHtmlDisabled(config, target)) {
          return;
        }

        const { removeTailSlash, applyOptionsChain } = await import(
          '@modern-js/utils'
        );

        const minify = getMinify(isProd, config);
        const assetPrefix = removeTailSlash(
          chain.output.get('publicPath') || '',
        );
        const entries = chain.entryPoints.entries() || {};
        const entryNames = Object.keys(entries);
        const htmlPaths = api.getHTMLPaths();

        await Promise.all(
          entryNames.map(async (entryName, index) => {
            const entryValue = entries[entryName].values() as string | string[];
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
              (config.tools as { htmlPlugin?: any }).htmlPlugin,
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
              .use(HtmlPlugin, [finalOptions]);
          }),
        );

        if (config.html) {
          const { appIcon, crossorigin } = config.html;

          if (crossorigin) {
            const { HtmlCrossOriginPlugin } = await import(
              '@modern-js/builder-shared'
            );

            const formattedCrossorigin =
              crossorigin === true ? 'anonymous' : crossorigin;

            chain
              .plugin(CHAIN_ID.PLUGIN.HTML_CROSS_ORIGIN)
              .use(HtmlCrossOriginPlugin, [
                { crossOrigin: formattedCrossorigin, HtmlPlugin },
              ]);

            // todo: not support in rspack
            // @ts-expect-error
            chain.output.crossOriginLoading(formattedCrossorigin);
          }

          if (appIcon) {
            const { HtmlAppIconPlugin } = await import(
              '@modern-js/builder-shared'
            );

            const distDir = getDistPath(config.output, 'image');
            const iconPath = path.isAbsolute(appIcon)
              ? appIcon
              : path.join(api.context.rootPath, appIcon);

            chain
              .plugin(CHAIN_ID.PLUGIN.APP_ICON)
              .use(HtmlAppIconPlugin, [{ iconPath, distDir, HtmlPlugin }]);
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

    applyInjectTags(api);
  },
});
