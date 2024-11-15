// 用于 react-helmet 正则替换
import { EOL } from 'os';
import type { HelmetServerState } from 'react-helmet-async';
import { helmetContext } from '../helmetContext';
import { safeReplace } from './utils';

const RE_HTML_ATTR = /<html[^>]*>/;
const RE_BODY_ATTR = /<body[^>]*>/;
const RE_LAST_IN_HEAD = /<\/head>/;
const RE_TITLE = /<title[^>]*>([\s\S\n\r]*?)<\/title>/;
const TEST_TITLE_CONTENT =
  /(?<=<title[^>]*>)([\s\S\n\r]*?)([.|\S])([\s\S\n\r]*?)(?=<\/title>)/;

export function createReplaceHelemt() {
  return helmetContext.helmet
    ? (template: string) => helmetReplace(template, helmetContext.helmet!)
    : (tempalte: string) => tempalte;
}

// 通过 react-helmet 修改模板
export function helmetReplace(content: string, helmetData: HelmetServerState) {
  console.info('call helmetReplace');
  let result = content;
  const bodyAttributes = helmetData.bodyAttributes.toString();
  if (bodyAttributes) {
    result = safeReplace(result, RE_BODY_ATTR, `<body ${bodyAttributes}>`);
  }

  const htmlAttributes = helmetData.htmlAttributes.toString();
  if (htmlAttributes) {
    result = safeReplace(result, RE_HTML_ATTR, `<html ${htmlAttributes}>`);
  }

  const base = helmetData.base.toString();
  const link = helmetData.link.toString();
  const meta = helmetData.meta.toString();
  console.info('helmetData:', meta);
  const noscript = helmetData.noscript.toString();
  const script = helmetData.script.toString();
  const style = helmetData.style.toString();
  const title = helmetData.title.toString();

  // 如果模板中存在 title，且 helmetData title 有内容则做替换
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
