import HtmlPlugin from '@rspack/plugin-html';
import { Compiler } from '../types';
import { CrossOrigin } from '@modern-js/builder-shared';

type CrossOriginOptions = {
  crossOrigin: CrossOrigin;
};

export class HtmlCrossOriginPlugin {
  readonly name: string;

  readonly crossOrigin: CrossOrigin;

  constructor(options: CrossOriginOptions) {
    const { crossOrigin } = options;
    this.name = 'HtmlCrossOriginPlugin';
    this.crossOrigin = crossOrigin;
  }

  apply(compiler: Compiler): void {
    if (!this.crossOrigin) {
      return;
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      HtmlPlugin.getHooks(compilation).alterAssetTags.tapPromise(
        this.name,
        async alterAssetTags => {
          const {
            assetTags: { scripts, styles },
          } = alterAssetTags;

          scripts.forEach(
            script => (script.attributes.crossorigin = this.crossOrigin),
          );
          styles.forEach(
            style => (style.attributes.crossorigin = this.crossOrigin),
          );

          return alterAssetTags;
        },
      );
    });
  }
}
