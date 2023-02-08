import path from 'path';
import {
  getFavicon,
  getInject,
  getMinify,
  getMetaTags,
  getTitle,
} from '../config';
import { isFileExists, getDistPath } from '../fs';
import {
  BuilderTarget,
  CrossOrigin,
  SharedBuilderPluginAPI,
  SharedNormalizedConfig,
} from '../types';
import type { Options as HTMLPluginOptions } from 'html-webpack-plugin';

// This is a minimist subset of modern.js server routes
type RoutesInfo = {
  isSPA: boolean;
  urlPath: string;
  entryName: string;
  entryPath: string;
};

type BundlerPlugin<Options = any> = new (options: Options) => {
  apply: (compiler: any) => void;
};

type HtmlCrossOriginPlugin = BundlerPlugin<{ crossOrigin: CrossOrigin }>;
type HtmlAppIconPlugin = BundlerPlugin<{ distDir: string; iconPath: string }>;
type HtmlBundlerPlugin = BundlerPlugin;

type LazyImport<T> = () => Promise<T>;

type Plugins = {
  getHtmlCrossOriginPlugin: LazyImport<HtmlCrossOriginPlugin>;
  getHtmlAppIconPlugin: LazyImport<HtmlAppIconPlugin>;
  getHtmlBundlerPlugin: LazyImport<HtmlBundlerPlugin>;
};

export function applyBuilderHtmlPlugin(
  api: SharedBuilderPluginAPI,
  plugins: Plugins,
) {
  const routesInfo: RoutesInfo[] = [];
  api.modifyBundlerChain(async (chain, { CHAIN_ID, target, isProd }) => {
    const config = api.getNormalizedConfig();

    // if html is disabled or target is server, skip html plugin
    if (isHtmlDisabled(config, target)) {
      return;
    }

    const HtmlBundlerPlugin = await plugins.getHtmlBundlerPlugin();

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
          .use(HtmlBundlerPlugin, [finalOptions]);
      }),
    );

    if (config.html) {
      const { appIcon, crossorigin } = config.html;

      if (crossorigin) {
        const HtmlCrossOriginPlugin = await plugins.getHtmlCrossOriginPlugin();
        const formattedCrossorigin: CrossOrigin =
          crossorigin === true ? 'anonymous' : crossorigin;

        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_CROSS_ORIGIN)
          .use(HtmlCrossOriginPlugin, [{ crossOrigin: formattedCrossorigin }]);
      }

      if (appIcon) {
        const HtmlAppIconPlugin = await plugins.getHtmlAppIconPlugin();
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
}

export const isHtmlDisabled = (
  config: SharedNormalizedConfig,
  target: BuilderTarget,
) =>
  (config.tools as { htmlPlugin: boolean }).htmlPlugin === false ||
  target === 'node' ||
  target === 'web-worker';

async function getChunks(entryName: string, entryValue: string | string[]) {
  const { isPlainObject } = await import('@modern-js/utils');
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entryValue.dependOn);
  }

  return [...dependOn, entryName];
}

export function getTemplatePath(
  entryName: string,
  config: SharedNormalizedConfig,
) {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );
  const { template = DEFAULT_TEMPLATE, templateByEntries = {} } = config.html;
  return templateByEntries[entryName] || template;
}

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
