import fs from 'fs';
import path from 'path';
import { normalizeSlashes } from '../../../utils';

const cache: Record<string, any> = {};
/**
 * make sure load processor in user project root other than root
 * @param lang
 * @param root
 * @returns
 */
export function loadProcessor(
  lang: string,
  root: string,
  implementation?: object | string,
) {
  if (cache[lang]) {
    return cache[lang];
  }
  try {
    if (typeof implementation === 'string') {
      return (cache[lang] = require(implementation));
    }
    if (typeof implementation === 'object') {
      return (cache[lang] = implementation);
    }
    const loadPath = require.resolve(lang, {
      paths: [root],
    });
    return (cache[lang] = require(loadPath));
  } catch (err) {
    throw new Error(
      `${lang} require failed, please install it or use implemention`,
    );
  }
}

const dataUrlRE = /^\s*data:/i;
const cssUrlRE =
  /(?<=^|[^\w\-\u0080-\uffff])url\(\s*('[^']+'|"[^"]+"|[^'")]+)\s*\)/;
const externalRE = /^(https?:)?\/\//;
const isDataUrl = (url: string): boolean => dataUrlRE.test(url);
const isExternalUrl = (url: string): boolean => externalRE.test(url);
type CssUrlReplacer = (
  url: string,
  importer?: string,
) => string | Promise<string>;

/**
 * relative url() inside \@imported sass and less files must be rebased to use
 * root file as base.
 */
export async function rebaseUrls(
  filepath: string,
  rootDir: string,
  resolver: (id: string, dir: string) => string,
): Promise<{ file: string; contents?: string }> {
  const file = path.resolve(filepath); // ensure os-specific flashes
  // in the same dir, no need to rebase
  const fileDir = path.dirname(file);
  if (fileDir === rootDir) {
    return { file };
  }
  // no url()
  const content = fs.readFileSync(file, 'utf-8');
  if (!cssUrlRE.test(content)) {
    return { file };
  }
  try {
    // FIXME: use ast match instead of reg match
    const rebased = await rewriteCssUrls(
      content,
      path.extname(file).slice(1),
      url => {
        if (url.startsWith('/')) {
          return url;
        }
        return resolver(url, fileDir);
      },
    );
    return {
      file,
      contents: rebased,
    };
  } catch (e) {
    return { file };
  }
}

export async function rewriteCssUrls(
  css: string,
  type: false | string,
  replacer: CssUrlReplacer,
): Promise<string> {
  let match: RegExpExecArray | null;
  let remaining = css;
  let rewritten = '';
  // eslint-disable-next-line no-cond-assign
  while ((match = cssUrlRE.exec(remaining))) {
    rewritten += remaining.slice(0, match.index);
    const matched = match[0];
    let rawUrl = match[1];
    let wrap = '';
    const first = rawUrl[0];
    if (first === `"` || first === `'`) {
      wrap = first;
      rawUrl = rawUrl.slice(1, -1);
    }
    const result =
      (type === 'less' && rawUrl.startsWith('@')) ||
      ((type === 'sass' || type === 'scss') && rawUrl.startsWith('$')) ||
      isExternalUrl(rawUrl) ||
      isDataUrl(rawUrl) ||
      rawUrl.startsWith('#')
        ? matched
        : `url(${wrap}${normalizeSlashes(await replacer(rawUrl))}${wrap})`;
    rewritten += result;
    remaining = remaining.slice(match.index + match[0].length);
  }
  rewritten += remaining;
  return rewritten;
}
