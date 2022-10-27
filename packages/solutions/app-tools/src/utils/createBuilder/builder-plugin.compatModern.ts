import path from 'path';
import type { BuilderPlugin } from '@modern-js/builder-shared';
import type {
  BuilderPluginAPI,
  WebpackChain,
} from '@modern-js/builder-webpack-provider';
import type webpack from '@modern-js/builder-webpack-provider/webpack';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
// import { template as lodashTemplate } from '@modern-js/utils/lodash';
import HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';
import { fs, removeTailSlash } from '@modern-js/utils';

type Parameter<T extends (arg: any) => void> = Parameters<T>[0];
type FnParameter<
  T extends {
    [p: string]: (arg: any) => void;
  },
> = {
  [P in keyof T]: Parameter<T[P]>;
};

export type PluginCompatModernOptions = FnParameter<
  Partial<
    Pick<
      BuilderPluginAPI,
      | 'onAfterBuild'
      | 'onAfterCreateCompiler'
      | 'onAfterStartDevServer'
      | 'onBeforeBuild'
      | 'onBeforeCreateCompiler'
      | 'onBeforeStartDevServer'
      | 'onDevCompileDone'
      | 'onExit'
    >
  >
>;

/**
 * Provides default configuration consistent with `@modern-js/webpack`
 */
export const PluginCompatModern = (
  appContext: IAppContext,
  modernConfig: NormalizedConfig,
  options?: PluginCompatModernOptions,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-compat-modern',

  setup(api) {
    api.modifyWebpackChain((chain, { target, CHAIN_ID }) => {
      // set webpack config name
      if (target === 'node') {
        chain.name('server');
      } else if (target === 'modern-web') {
        chain.name('modern');
      } else {
        chain.name('client');
      }

      // apply node compat
      if (target === 'node') {
        // apply node resolve extensions
        for (const ext of ['.node.js', '.node.jsx', '.node.ts', '.node.tsx']) {
          chain.resolve.extensions.prepend(ext);
        }
      }

      // inject bottomTemplate into html-webpack-plugin
      for (const entryName of Object.keys(api.context.entry)) {
        chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`).tap(args => [
          {
            ...(args[0] || {}),
            bottomTemplate:
              // TODO: add lodashTemplate
              appContext.htmlTemplates[`__${entryName}-bottom__`],
          },
        ]);
      }
      chain
        .plugin(CHAIN_ID.PLUGIN.BOTTOM_TEMPLATE)
        .use(BottomTemplatePlugin, [HtmlWebpackPlugin]);

      // apply copy plugin
      const copyPatterns = createCopyPatterns(chain, appContext, modernConfig);
      chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
        {
          patterns: [...(args[0]?.patterns || []), ...copyPatterns],
        },
      ]);
    });

    // register hooks callback
    options?.onAfterBuild && api.onAfterBuild(options.onAfterBuild);
    options?.onAfterCreateCompiler &&
      api.onAfterCreateCompiler(options.onAfterCreateCompiler);
    options?.onAfterStartDevServer &&
      api.onAfterStartDevServer(options.onAfterStartDevServer);
    options?.onBeforeBuild && api.onBeforeBuild(options.onBeforeBuild);
    options?.onBeforeCreateCompiler &&
      api.onBeforeCreateCompiler(options.onBeforeCreateCompiler);
    options?.onBeforeStartDevServer &&
      api.onBeforeStartDevServer(options.onBeforeStartDevServer);
    options?.onDevCompileDone && api.onDevCompileDone(options.onDevCompileDone);
    options?.onExit && api.onExit(options.onExit);
  },
});

export class BottomTemplatePlugin {
  htmlWebpackPlugin: typeof HtmlWebpackPlugin;

  bottomTemplateReg: RegExp = /<!--<\?-\s*bottomTemplate\s*\?>-->/;

  bodyRegExp: RegExp = /(<\/\s*body\s*>)/i;

  name: string;

  constructor(htmlWebpackPlugin: typeof HtmlWebpackPlugin) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.name = 'bottom-template';
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(
      this.name,
      (compilation: webpack.Compilation) => {
        this.htmlWebpackPlugin
          .getHooks(compilation)
          .beforeEmit.tap(this.name, data => {
            if (!data.plugin.options?.__internal__) {
              return data;
            }
            // 含有 <!--<?- bottomTemplate ?>--> 占位符时才需要注入 bottom.html
            if (this.bottomTemplateReg.test(data.html)) {
              // 清空占位符
              data.html = data.html.replace(this.bottomTemplateReg, '');
              const { bottomTemplate } = data.plugin.options;
              if (bottomTemplate) {
                data.html = data.html.replace(
                  this.bodyRegExp,
                  match => `\n${bottomTemplate}\n${match}`,
                );
              }
            }
            return data;
          });
      },
    );
  }
}

function createCopyPatterns(
  chain: WebpackChain,
  appContext: IAppContext,
  config: NormalizedConfig,
) {
  const configDir = path.resolve(
    appContext.appDirectory,
    config.source.configDir!,
  );
  const patterns = [];
  const uploadDir = path.posix.join(configDir.replace(/\\/g, '/'), 'upload');
  const publicDir = path.posix.join(configDir.replace(/\\/g, '/'), 'public');

  const minifiedJsRexExp = /\.min\.js/;
  const info = (file: { sourceFilename: string }) => ({
    // If the file name ends with `.min.js`, we assume it's a compressed file.
    // So we don't want copy-webpack-plugin to minify it.
    // ref: https://github.com/webpack-contrib/copy-webpack-plugin#info
    minimized: minifiedJsRexExp.test(file.sourceFilename),
  });

  // add the pattern only if the corresponding directory exists,
  // otherwise it will cause the webpack recompile.
  if (fs.existsSync(uploadDir)) {
    patterns.push({
      info,
      from: '**/*',
      to: 'upload',
      context: uploadDir,
      noErrorOnMissing: true,
    });
  }

  if (fs.existsSync(publicDir)) {
    patterns.push({
      info,
      from: '**/*',
      to: 'public',
      context: publicDir,
      noErrorOnMissing: true,
      // eslint-disable-next-line node/prefer-global/buffer
      transform: (content: Buffer, absoluteFrom: string) => {
        if (!/\.html?$/.test(absoluteFrom)) {
          return content;
        }

        return lodashTemplate(content.toString('utf8'))({
          assetPrefix: removeTailSlash(chain.output.get('publicPath')),
        });
      },
    });
  }
  return patterns;
}
