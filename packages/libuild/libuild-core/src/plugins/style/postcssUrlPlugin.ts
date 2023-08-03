import { join, relative, dirname } from 'path';
import { Plugin } from 'postcss';
import { ILibuilder } from '../../types';
import { rewriteCssUrls } from './utils';
import { getAssetContents } from '../asset';

const Processed = Symbol('processed');
const HTTP_PATTERNS = /^(https?:)?\/\//;
const DATAURL_PATTERNS = /^data:/;
const HASH_PATTERNS = /#[^#]+$/;

export const postcssUrlPlugin = (options: { entryPath: string; compilation: ILibuilder }) => {
  options = options || ({} as any);

  return {
    postcssPlugin: 'libuild-postcss-url',
    async Declaration(decl) {
      const isProcessed = (decl as any)[Processed];

      decl.value = await rewriteCssUrls(decl.value, false, async (URL: string) => {
        if (
          URL &&
          !HTTP_PATTERNS.test(URL) &&
          !HASH_PATTERNS.test(URL) &&
          !DATAURL_PATTERNS.test(URL) &&
          !isProcessed
        ) {
          let filePath = URL;
          const { css_resolve, outdir, outbase, bundle } = options.compilation.config;
          filePath = css_resolve(URL, dirname(options.entryPath));
          const rebaseFrom = bundle ? outdir : join(outdir, relative(outbase, dirname(options.entryPath)));
          const { contents: fileUrl } = await getAssetContents.apply(options.compilation, [filePath, rebaseFrom]);
          (decl as any)[Processed] = true;
          return fileUrl.toString();
        }
        return URL;
      });
    },
  } as Plugin;
};
