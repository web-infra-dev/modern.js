import {
  SERVICE_WORKER_ENVIRONMENT_NAME,
  isHtmlDisabled,
} from '@modern-js/builder';
import { removeTailSlash } from '@modern-js/utils';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import type {
  ChainIdentifier,
  RsbuildPlugin,
  RspackChain,
} from '@rsbuild/core';
import { BottomTemplatePlugin } from '../bundlerPlugins';
import type { BuilderOptions } from '../types';

const createVirtualModule = (content: string) =>
  `data:text/javascript;charset=utf-8,${encodeURIComponent(content)}`;

export const builderPluginAdapterHtml = (
  options: BuilderOptions,
): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-modern-html',
  setup(api) {
    api.modifyBundlerChain(
      async (
        chain,
        { CHAIN_ID, target, HtmlPlugin: HtmlBundlerPlugin, environment },
      ) => {
        const builderConfig = environment.config;

        const isServiceWorker =
          environment.name === SERVICE_WORKER_ENVIRONMENT_NAME;

        if (isServiceWorker) {
          return;
        }

        if (!isHtmlDisabled(builderConfig, target)) {
          applyBottomHtmlPlugin({
            options,
            chain,
            CHAIN_ID,
            HtmlBundlerPlugin,
            htmlPaths: environment.htmlPaths,
          });

          await injectAssetPrefix({
            chain,
          });
        }
      },
    );
  },
});

async function injectAssetPrefix({ chain }: { chain: RspackChain }) {
  const entries = chain.entryPoints.entries() || {};
  const entryNames = Object.keys(entries);
  const assetPrefix = removeTailSlash(chain.output.get('publicPath') || '');
  const code = `window.__assetPrefix__ = '${assetPrefix}';`;

  entryNames.forEach(entryName => {
    entries[entryName].prepend(createVirtualModule(code));
  });
}

/** inject bottom template */
function applyBottomHtmlPlugin({
  chain,
  options,
  CHAIN_ID,
  HtmlBundlerPlugin,
  htmlPaths,
}: {
  chain: RspackChain;
  options: BuilderOptions;
  CHAIN_ID: ChainIdentifier;
  HtmlBundlerPlugin: any;
  htmlPaths: Record<string, string>;
}) {
  const { normalizedConfig: modernConfig, appContext } = options;
  // inject bottomTemplate into html-webpack-plugin
  for (const entryName of Object.keys(htmlPaths)) {
    // FIXME: the only need necessary
    const baseTemplateParams = {
      entryName,
      title: modernConfig.html.title,
      mountId: modernConfig.html.templateParameters,
    };

    chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`).tap(args => [
      {
        ...(args[0] || {}),
        __internal__: true,
        bottomTemplate:
          appContext.htmlTemplates[`__${entryName}-bottom__`] &&
          lodashTemplate(appContext.htmlTemplates[`__${entryName}-bottom__`])(
            baseTemplateParams,
          ),
      },
    ]);
  }
  chain
    .plugin('bottom-template')
    .use(BottomTemplatePlugin, [HtmlBundlerPlugin]);
}
