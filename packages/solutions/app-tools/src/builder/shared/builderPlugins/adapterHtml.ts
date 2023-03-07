import type {
  BuilderPlugin,
  BuilderTarget,
  BundlerChain,
} from '@modern-js/builder-shared';
import { ChainIdentifier, getEntryOptions } from '@modern-js/utils';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import { Bundler } from '../../../types';
import { BottomTemplatePlugin } from '../bundlerPlugins';
import type {
  BuilderNormalizedConfig,
  BuilderOptions,
  BuilderPluginAPI,
} from '../types';

export function isHtmlEnabled(
  config: BuilderNormalizedConfig,
  target: BuilderTarget,
) {
  return (
    config.tools?.htmlPlugin !== false &&
    target !== 'node' &&
    target !== 'service-worker' &&
    target !== 'web-worker'
  );
}

export const builderPluginAdapterHtml = <B extends Bundler>(
  options: BuilderOptions<B>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-adpater-modern-html',
  setup(api) {
    api.modifyBundlerChain(
      (chain, { CHAIN_ID, target, HtmlPlugin: HtmlBundlerPlugin }) => {
        const builderConfig = api.getNormalizedConfig();
        if (isHtmlEnabled(builderConfig, target)) {
          applyBottomHtmlPlugin({
            api,
            options,
            chain,
            CHAIN_ID,
            HtmlBundlerPlugin,
          });
        }
      },
    );
  },
});

/** inject bottom template */
function applyBottomHtmlPlugin<B extends Bundler>({
  api,
  chain,
  options,
  CHAIN_ID,
  HtmlBundlerPlugin,
}: {
  api: BuilderPluginAPI;
  chain: BundlerChain;
  options: BuilderOptions<B>;
  CHAIN_ID: ChainIdentifier;
  HtmlBundlerPlugin: any;
}) {
  const { normalizedConfig: modernConfig, appContext } = options;
  // inject bottomTemplate into html-webpack-plugin
  for (const entryName of Object.keys(api.context.entry)) {
    // FIXME: the only need necessary
    const baseTemplateParams = {
      entryName,
      title: getEntryOptions<string | undefined>(
        entryName,
        modernConfig.html.title,
        modernConfig.html.titleByEntries,
        appContext.packageName,
      ),
      mountId: modernConfig.html.mountId,
      ...getEntryOptions<any>(
        entryName,
        modernConfig.html.templateParameters,
        modernConfig.html.templateParametersByEntries,
        appContext.packageName,
      ),
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
    .plugin(CHAIN_ID.PLUGIN.BOTTOM_TEMPLATE)
    .use(BottomTemplatePlugin, [HtmlBundlerPlugin]);
}
