import type { webpack } from '@modern-js/builder-webpack-provider';
import type HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';

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
