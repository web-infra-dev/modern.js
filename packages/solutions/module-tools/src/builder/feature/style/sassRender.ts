import { readFileSync } from 'fs';
import path from 'path';
import type { ICompiler, Style } from '../../../types';
import type { PreprocessRender } from './transformStyle';
import { loadProcessor, rebaseUrls } from './utils';

export const sassRender: PreprocessRender = async function (
  this: ICompiler,
  content: string,
  sourcePath: string,
  stdinDir: string,
  options: Style['sass'],
  resolvePathMap: Map<string, string>,
  implementation?: object | string,
) {
  const sass = await loadProcessor('sass', this.context.root, implementation);
  // https://sass-lang.com/documentation/js-api/interfaces/legacystringoptions/#indentedSyntax
  const useScssSyntax = sourcePath.endsWith('.scss');
  return new Promise((resolve, reject) => {
    sass.render(
      {
        data: content,
        indentedSyntax: !useScssSyntax,
        importer: [
          (url: string, dir: string, done: (value: unknown) => void) => {
            if (url.startsWith('data:')) {
              done({
                contents: url,
              });
            }
            let filePath = null;
            const baseUrl = path.basename(url);
            const dirUrl = path.dirname(url);
            const removeUnderScoreBaseUrl = baseUrl.replace(/^_/, '');
            const prependUnderScoreBaseUrl = `_${removeUnderScoreBaseUrl}`;
            try {
              const id = path.join(dirUrl, prependUnderScoreBaseUrl);
              filePath = this.css_resolve(
                id,
                dir === 'stdin' ? stdinDir : resolvePathMap.get(dir)!,
              );
            } catch (err) {
              const id = path.join(dirUrl, removeUnderScoreBaseUrl);
              filePath = this.css_resolve(
                id,
                dir === 'stdin' ? stdinDir : resolvePathMap.get(dir)!,
              );
            }
            resolvePathMap.set(url, path.dirname(filePath));
            if (url.startsWith('./')) {
              resolvePathMap.set(
                url.replace(/^\.\//, ''),
                path.dirname(filePath),
              );
            }
            rebaseUrls(filePath, stdinDir, this.css_resolve).then(value => {
              done({
                contents: value.contents || readFileSync(value.file, 'utf-8'),
              });
            });
          },
        ],
        ...options,
      },
      (err: string, res: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      },
    );
  });
};
