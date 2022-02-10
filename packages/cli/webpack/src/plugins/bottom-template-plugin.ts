import type HtmlWebpackPlugin from 'html-webpack-plugin';
import { Compiler, Compilation } from 'webpack';

const bottomTemplateReg = /<!--<\?-\s*bottomTemplate\s*\?>-->/;
const bodyRegExp = /(<\/\s*body\s*>)/i;

export class BottomTemplatePlugin {
  htmlWebpackPlugin: typeof HtmlWebpackPlugin;

  name: string;

  constructor(htmlWebpackPlugin: typeof HtmlWebpackPlugin) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.name = 'bottom-template';
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      this.htmlWebpackPlugin
        .getHooks(compilation)
        .beforeEmit.tap(this.name, data => {
          if (!data.plugin.options?.__internal__) {
            return data;
          }
          // 含有 <!--<?- bottomTemplate ?>--> 占位符时才需要注入 bottom.html
          if (bottomTemplateReg.test(data.html)) {
            // 清空占位符
            data.html = data.html.replace(bottomTemplateReg, '');
            const { bottomTemplate } = data.plugin.options;
            if (bottomTemplate) {
              data.html = data.html.replace(
                bodyRegExp,
                match => `\n${bottomTemplate}\n${match}`,
              );
            }
          }
          return data;
        });
    });
  }
}
