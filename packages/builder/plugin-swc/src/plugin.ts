import * as path from 'path';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import { BuilderPlugin } from '@modern-js/builder-shared';
import { applyBuilderPluginSwc } from '@modern-js/builder-plugin-swc-base';
import { PluginSwcOptions } from './config';
import { minify, minifyCss } from './binding';

const PLUGIN_NAME = 'builder-plugin-swc';

/**
 * In this plugin, we do:
 * - Remove Babel loader if exists
 * - Add our own swc loader
 * - Remove JS minifier
 * - Add swc minifier plugin
 */
export const builderPluginSwc = (
  pluginConfig: PluginSwcOptions = {},
): BuilderPlugin => ({
  name: PLUGIN_NAME,

  setup(api: BuilderPluginAPI) {
    applyBuilderPluginSwc(api, {
      pluginConfig,
      transformLoader: path.resolve(__dirname, './loader'),
      minify: {
        js: minify,
        css: minifyCss,
      },
    });
  },
});

/**
 * @deprecated Using builderPluginSwc instead.
 */
export const PluginSwc = builderPluginSwc;
