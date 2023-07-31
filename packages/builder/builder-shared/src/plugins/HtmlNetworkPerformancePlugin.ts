import type { Compiler, Compilation, WebpackPluginInstance } from 'webpack';
import { kebabCase, upperFirst } from '@modern-js/utils/lodash';
import {
  PreconnectOption,
  DnsPrefetchOption,
  DnsPrefetch,
  Preconnect,
} from '../types';
import type HtmlWebpackPlugin from 'html-webpack-plugin';

type NetworkPerformanceType = 'preconnect' | 'dnsPrefetch';

function generateLinks(
  options: PreconnectOption[] | DnsPrefetchOption[],
  type: NetworkPerformanceType,
): Array<HtmlWebpackPlugin.HtmlTagObject> {
  return options.map(option => ({
    tagName: 'link',
    attributes: {
      rel: kebabCase(type),
      ...option,
    },
    voidTag: false,
    meta: {},
  }));
}

export class HtmlNetworkPerformancePlugin implements WebpackPluginInstance {
  readonly options: DnsPrefetch | Preconnect;

  readonly type: NetworkPerformanceType;

  HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(
    options: DnsPrefetch | Preconnect,
    type: NetworkPerformanceType,
    HtmlPlugin: typeof HtmlWebpackPlugin,
  ) {
    this.options = options;
    this.type = type;
    this.HtmlPlugin = HtmlPlugin;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(
      `HTML${this.type}Plugin`,
      (compilation: Compilation) => {
        this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
          `HTML${upperFirst(this.type)}Plugin`,
          async htmlPluginData => {
            const { headTags } = htmlPluginData;

            const options: PreconnectOption[] | DnsPrefetchOption[] =
              this.options.map(option =>
                typeof option === 'string'
                  ? {
                      href: option,
                    }
                  : option,
              );

            if (options.length) {
              headTags.unshift(...generateLinks(options, this.type));
            }
            return htmlPluginData;
          },
        );
      },
    );
  }
}
