import path from 'path';
import { CHAIN_ID, findExists } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type { WebpackChain } from '@modern-js/utils';
import { ICON_EXTENSIONS } from '../../utils/constants';

export function applyAppIconPlugin({
  chain,
  config,
  appContext,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
  appContext: IAppContext;
}) {
  const { AppIconPlugin } = require('../../plugins/app-icon-plugin');
  const HtmlWebpackPlugin: typeof import('html-webpack-plugin') = require('html-webpack-plugin');

  const appIcon = findExists(
    ICON_EXTENSIONS.map(ext =>
      path.resolve(
        appContext.appDirectory,
        config.source.configDir!,
        `icon.${ext}`,
      ),
    ),
  );

  if (appIcon) {
    chain
      .plugin(CHAIN_ID.PLUGIN.APP_ICON)
      .use(AppIconPlugin, [HtmlWebpackPlugin, appIcon]);
  }
}
