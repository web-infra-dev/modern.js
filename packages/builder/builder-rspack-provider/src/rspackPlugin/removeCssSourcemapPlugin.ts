import type { Compiler, Compilation } from '@rspack/core';
import type HtmlPlugin from '@rspack/plugin-html';
import { COMPILATION_PROCESS_STAGE } from '@modern-js/builder-shared';

export class RemoveCssSourcemapPlugin {
  name: string;

  htmlPlugin: typeof HtmlPlugin;

  constructor(htmlPlugin: typeof HtmlPlugin) {
    this.name = 'RemoveCssSourcemapPlugin';
    this.htmlPlugin = htmlPlugin;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.name,
          stage: COMPILATION_PROCESS_STAGE.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          compilation.getAssets().forEach(asset => {
            if (asset.name.endsWith('.css.map')) {
              compilation.deleteAsset(asset.name);
            }
          });
        },
      );
    });
  }
}
