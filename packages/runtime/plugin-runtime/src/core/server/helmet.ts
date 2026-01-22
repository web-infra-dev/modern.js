// 用于 react-helmet-async 正则替换
import { EOL } from 'os';
import type { HelmetServerState } from 'react-helmet-async';
import { safeReplace } from './utils';

const RE_HTML_ATTR = /<html[^>]*>/;
const RE_BODY_ATTR = /<body[^>]*>/;
const RE_LAST_IN_HEAD = /<\/head>/;
const RE_TITLE = /<title[^>]*>([\s\S\n\r]*?)<\/title>/;
const TEST_TITLE_CONTENT =
  /(?<=<title[^>]*>)([\s\S\n\r]*?)([.|\S])([\s\S\n\r]*?)(?=<\/title>)/;

export function createReplaceHelemt(helmetServerState?: HelmetServerState) {
  return helmetServerState
    ? (template: string) => helmetReplace(template, helmetServerState)
    : (tempalte: string) => tempalte;
}

// 通过 react-helmet-async 修改模板
export function helmetReplace(
  content: string,
  helmetServerState: HelmetServerState,
) {
  let result = content;
  const bodyAttributes = helmetServerState.bodyAttributes.toString();
  if (bodyAttributes) {
    result = safeReplace(result, RE_BODY_ATTR, `<body ${bodyAttributes}>`);
  }

  const htmlAttributes = helmetServerState.htmlAttributes.toString();
  if (htmlAttributes) {
    result = safeReplace(result, RE_HTML_ATTR, `<html ${htmlAttributes}>`);
  }

  const base = helmetServerState.base.toString();
  const link = helmetServerState.link.toString();
  const meta = helmetServerState.meta.toString();
  const noscript = helmetServerState.noscript.toString();
  const script = helmetServerState.script.toString();
  const style = helmetServerState.style.toString();
  const title = helmetServerState.title.toString();

  // 如果模板中存在 title，且 helmetServerState title 有内容则做替换
  const existTitleTag = RE_TITLE.test(content);
  const shouldReplaceTitle =
    existTitleTag && TEST_TITLE_CONTENT.test(title.trim());
  if (shouldReplaceTitle) {
    result = safeReplace(result, RE_TITLE, title);
  }

  const helmetStr = [
    base,
    link,
    meta,
    noscript,
    script,
    style,
    !existTitleTag ? title : '',
  ].reduce((pre, cur) => {
    return pre + (cur.length > 0 ? `  ${cur}${EOL}` : '');
  }, '');

  return safeReplace(result, RE_LAST_IN_HEAD, `${helmetStr}</head>`);
}
