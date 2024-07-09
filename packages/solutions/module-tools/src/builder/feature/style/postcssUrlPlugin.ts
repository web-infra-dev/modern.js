import { join, relative, dirname } from 'path';
import { Plugin } from 'postcss';
import { ICompiler } from '../../../types';
import { getAssetContents } from '../asset';
import { rewriteCssUrls } from './utils';

const Processed = Symbol('processed');
const HTTP_PATTERNS = /^(https?:)?\/\//;
const DATAURL_PATTERNS = /^data:/;
const HASH_PATTERNS = /.#[^#]+$/;

export const postcssUrlPlugin = (options: {
  entryPath: string;
  compilation: ICompiler;
}): Plugin => {
  return {
    postcssPlugin: 'postcss-url',
    async Declaration(decl) {
      const isProcessed = (decl as any)[Processed];
      if (isProcessed) {
        return;
      }
      decl.value = await rewriteCssUrls(
        decl.value,
        false,
        async (URL: string) => {
          if (
            URL &&
            !HTTP_PATTERNS.test(URL) &&
            !HASH_PATTERNS.test(URL) &&
            !DATAURL_PATTERNS.test(URL)
          ) {
            let filePath = URL;
            const { outDir, sourceDir, buildType } = options.compilation.config;
            const { css_resolve } = options.compilation;
            filePath = css_resolve(URL, dirname(options.entryPath));
            const rebaseFrom =
              buildType === 'bundle'
                ? outDir
                : join(outDir, relative(sourceDir, dirname(options.entryPath)));
            const { contents: fileUrl } = await getAssetContents.apply(
              options.compilation,
              [filePath, rebaseFrom],
            );
            (decl as any)[Processed] = true;
            return fileUrl.toString();
          }
          return URL;
        },
      );
    },
  };
};
